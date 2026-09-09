import { NextRequest, NextResponse } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { db } from "@/lib/db";

// Owner: activate/update or deactivate a user's VIP subscription.
export async function POST(req: NextRequest) {
  try {
    const owner = await requireOwner();
    const { userId, isActive, dailyLimit, expiresAt } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId wajib diisi." }, { status: 400 });

    const vip = await db.vipSubscription.upsert({
      where: { userId },
      create: {
        userId,
        isActive: !!isActive,
        dailyLimit: dailyLimit ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        activatedByOwnerId: owner.discordAccount!.discordId,
      },
      update: {
        isActive: !!isActive,
        dailyLimit: dailyLimit ?? null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        activatedByOwnerId: owner.discordAccount!.discordId,
      },
    });

    await db.ownerLog.create({
      data: {
        ownerDiscordId: owner.discordAccount!.discordId,
        action: isActive ? "VIP_ACTIVATE" : "VIP_DEACTIVATE",
        targetUserId: userId,
        metadata: { dailyLimit, expiresAt },
      },
    });

    return NextResponse.json({ vip });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("POST /api/owner/vip failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
