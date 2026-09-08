import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { tryConsumeDailyUsage, DailyLimitExceededError } from "@/lib/dailyUsage";
import { rateLimit } from "@/lib/rateLimit";
import { audioProcessingSettingsSchema, DEFAULT_PRESET, validateAudioFile } from "@/lib/validation";
import { db } from "@/lib/db";
import { decryptCredential } from "@/lib/crypto";
import { uploadAudioAsset, RobloxTarget } from "@/lib/roblox/client";

/**
 * Creates a new audio processing job AND attempts the real Roblox upload in
 * the same request, using the calling user's own saved RobloxConnection
 * (their own Creator/Group ID + their own encrypted API key -- never a
 * shared or global credential; see /api/roblox/connection).
 *
 * Order of operations matters here:
 *   1. Validate the file and confirm the user has a saved Roblox connection
 *      BEFORE touching their daily quota -- a request that can't possibly
 *      succeed shouldn't burn one of their 3 free jobs.
 *   2. Only then atomically consume one unit of daily usage.
 *   3. Call Roblox. Whatever Roblox actually returns is what gets stored
 *      and shown -- PENDING stays PENDING, nothing is upgraded to
 *      SUCCESS/REJECTED unless Roblox's own response says so.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const { ok } = rateLimit(`jobs:${user.id}`, 10, 60_000);
    if (!ok) {
      return NextResponse.json({ error: "Terlalu banyak permintaan. Coba lagi sebentar." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File audio wajib diunggah." }, { status: 400 });
    }

    const fileErrors = validateAudioFile({ type: file.type, size: file.size });
    if (fileErrors.length > 0) {
      return NextResponse.json({ error: fileErrors.join(" ") }, { status: 400 });
    }

    const settingsRaw = formData.get("settings");
    const settings = settingsRaw
      ? audioProcessingSettingsSchema.parse(JSON.parse(settingsRaw.toString()))
      : DEFAULT_PRESET;

    // Must have a saved Roblox connection (their own Creator or Group +
    // their own API key) before we let this consume a daily-usage slot.
    const connection = await db.robloxConnection.findFirst({
      where: { userId: user.id, isActive: true },
    });
    if (!connection) {
      return NextResponse.json(
        { error: "Belum ada konfigurasi Roblox tersimpan. Atur Creator/Group dan API key dulu di Upload > Konfigurasi." },
        { status: 400 }
      );
    }

    // Atomic, server-side, DB-enforced limit check. Throws if none left.
    const usage = await tryConsumeDailyUsage(user.id);

    // TODO: this reads the whole file into memory and uploads it as-is.
    // speed/amplifyDb/maxDurationSecs are recorded on the job but NOT yet
    // applied to the audio -- actual transcoding (ffmpeg) is still a TODO,
    // see README. Persisting to durable object storage is also a TODO;
    // storageKey below is a placeholder path, not a real location yet.
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const audioFile = await db.audioFile.create({
      data: {
        originalFilename: file.name,
        storageKey: `pending/${user.id}/${Date.now()}-${file.name}`,
        mimeType: file.type,
        sizeBytes: file.size,
      },
    });

    let job = await db.audioJob.create({
      data: {
        userId: user.id,
        robloxConnectionId: connection.id,
        originalFileId: audioFile.id,
        speed: settings.speed,
        amplifyDb: settings.amplifyDb,
        maxDurationSecs: settings.maxDurationSecs,
        status: "UPLOADING",
      },
    });

    const target: RobloxTarget =
      connection.targetType === "CREATOR"
        ? { type: "CREATOR", robloxUserId: connection.robloxUserId! }
        : { type: "GROUP", robloxGroupId: connection.robloxGroupId! };

    let apiKey: string;
    try {
      apiKey = decryptCredential(connection.encryptedCredential);
    } catch (err) {
      console.error("Failed to decrypt stored Roblox credential:", (err as Error).message);
      job = await db.audioJob.update({
        where: { id: job.id },
        data: { status: "FAILED", errorMessage: "Kredensial Roblox tersimpan tidak valid. Sambungkan ulang di Settings." },
      });
      await writeHistory(job, connection.targetType, file.name, "FAILED");
      return NextResponse.json({ job, usage, robloxResult: "FAILED" }, { status: 502 });
    }

    const result = await uploadAudioAsset({
      apiKey,
      target,
      displayName: file.name.replace(/\.[^/.]+$/, ""),
      description: "Uploaded via MED STUDIO",
      fileBuffer,
      fileName: file.name,
    });

    // Map Roblox's actual response -- never guessed -- onto the job.
    const finalStatus =
      result.status === "SUCCESS" || result.status === "REJECTED"
        ? "COMPLETED"
        : result.status === "FAILED"
        ? "FAILED"
        : "ROBLOX_RESPONSE";

    job = await db.audioJob.update({
      where: { id: job.id },
      data: {
        status: finalStatus,
        robloxAssetId: result.assetId,
        robloxOperationPath: result.operationPath,
        robloxResult: result.status,
        robloxRawResponse: result.raw as any,
        errorMessage: result.status === "FAILED" ? "Roblox menolak permintaan upload. Periksa API key dan izinnya." : null,
      },
    });

    await writeHistory(job, connection.targetType, file.name, result.status);

    return NextResponse.json({ job, usage, robloxResult: result.status }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    if (err instanceof DailyLimitExceededError) {
      return NextResponse.json(
        { error: `Batas harian (${err.limit}) sudah tercapai. Coba lagi besok atau upgrade ke VIP.` },
        { status: 429 }
      );
    }
    console.error("POST /api/jobs failed:", err);
    return NextResponse.json({ error: "Gagal membuat job." }, { status: 500 });
  }
}

async function writeHistory(
  job: { id: string; userId: string; status: string },
  destination: "CREATOR" | "GROUP",
  filename: string,
  robloxResult: "PENDING" | "SUCCESS" | "REJECTED" | "FAILED"
) {
  await db.uploadHistory.upsert({
    where: { jobId: job.id },
    create: {
      jobId: job.id,
      userId: job.userId,
      destination,
      filename,
      status: job.status as any,
      robloxResult: robloxResult as any,
    },
    update: {
      status: job.status as any,
      robloxResult: robloxResult as any,
    },
  });
}

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();
    const jobs = await db.audioJob.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: { originalFile: true, processedFile: true },
    });
    return NextResponse.json({ jobs });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("GET /api/jobs failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
