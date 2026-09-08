import { NextRequest, NextResponse } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    await requireOwner();
    const q = new URL(req.url).searchParams.get("q")?.trim();

    const users = await db.user.findMany({
      where: q
        ? { discordAccount: { OR: [{ discordId: { contains: q } }, { username: { contains: q, mode: "insensitive" } }] } }
        : undefined,
      include: {
        discordAccount: true,
        vipSubscription: true,
        robloxConnections: { where: { isActive: true }, take: 1 },
        dailyUsage: { orderBy: { date: "desc" }, take: 1 },
      },
      take: 50,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        discordId: u.discordAccount?.discordId,
        username: u.discordAccount?.username,
        robloxConnected: u.robloxConnections.length > 0,
        dailyUsage: u.dailyUsage[0]?.usageCount ?? 0,
        vip: u.vipSubscription
          ? { isActive: u.vipSubscription.isActive, expiresAt: u.vipSubscription.expiresAt }
          : null,
      })),
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("GET /api/owner/users failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
