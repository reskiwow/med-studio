import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { robloxConnectionSchema } from "@/lib/validation";
import { encryptCredential, maskCredential, last4 } from "@/lib/crypto";

// Returns the user's saved Roblox connection with the credential masked.
export async function GET() {
  try {
    const user = await requireAuth();
    const connection = await db.robloxConnection.findFirst({
      where: { userId: user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!connection) return NextResponse.json({ connection: null });

    return NextResponse.json({
      connection: {
        id: connection.id,
        targetType: connection.targetType,
        robloxUserId: connection.robloxUserId,
        robloxGroupId: connection.robloxGroupId,
        maskedCredential: `••••••••${connection.credentialLast4}`,
        createdAt: connection.createdAt,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("GET /api/roblox/connection failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Saves (or replaces) the user's Roblox connection configuration.
// The credential is encrypted before it ever touches the database, and it
// is never echoed back in this or any other response — only a masked form.
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body = robloxConnectionSchema.parse(await req.json());

    // Deactivate previous connections rather than deleting, for audit history.
    await db.robloxConnection.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });

    const connection = await db.robloxConnection.create({
      data: {
        userId: user.id,
        targetType: body.targetType,
        robloxUserId: body.targetType === "CREATOR" ? body.robloxUserId : null,
        robloxGroupId: body.targetType === "GROUP" ? body.robloxGroupId : null,
        encryptedCredential: encryptCredential(body.apiKey),
        credentialLast4: last4(body.apiKey),
      },
    });

    return NextResponse.json({
      connection: {
        id: connection.id,
        targetType: connection.targetType,
        maskedCredential: maskCredential(body.apiKey),
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("POST /api/roblox/connection failed:", (err as Error).message);
    return NextResponse.json({ error: "Konfigurasi tidak valid." }, { status: 400 });
  }
}

// Disconnects (deactivates) the current Roblox connection.
export async function DELETE() {
  try {
    const user = await requireAuth();
    await db.robloxConnection.updateMany({
      where: { userId: user.id, isActive: true },
      data: { isActive: false },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("DELETE /api/roblox/connection failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
