import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { decryptCredential } from "@/lib/crypto";
import { pollAssetOperation } from "@/lib/roblox/client";

/**
 * Polls Roblox for the real moderation/operation result on a job that's
 * still PENDING (Roblox doesn't moderate Audio assets instantly). Only
 * ever writes back what Roblox's Operation object actually reports.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth();

    let job = await db.audioJob.findFirst({
      where: { id: params.id, userId: user.id },
      include: { robloxConnection: true },
    });

    if (!job) {
      return NextResponse.json({ error: "Job tidak ditemukan." }, { status: 404 });
    }

    if (job.robloxResult === "PENDING" && job.robloxOperationPath && job.robloxConnection) {
      const apiKey = decryptCredential(job.robloxConnection.encryptedCredential);
      const result = await pollAssetOperation({ apiKey, operationPath: job.robloxOperationPath });

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
          robloxResult: result.status,
          robloxRawResponse: result.raw as any,
        },
        include: { robloxConnection: true },
      });

      await db.uploadHistory.updateMany({
        where: { jobId: job.id },
        data: { status: job.status as any, robloxResult: result.status as any },
      });
    }

    return NextResponse.json({ job });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("GET /api/jobs/[id] failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
