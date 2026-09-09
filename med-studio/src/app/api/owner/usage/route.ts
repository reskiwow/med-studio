import { NextRequest, NextResponse } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { resetUsageForUser } from "@/lib/dailyUsage";
import { db } from "@/lib/db";

// Owner: reset a specific user's daily usage.
export async function POST(req: NextRequest) {
  try {
    const owner = await requireOwner();
    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ error: "userId wajib diisi." }, { status: 400 });

    await resetUsageForUser(userId);
    await db.ownerLog.create({
      data: { ownerDiscordId: owner.discordAccount!.discordId, action: "USAGE_RESET", targetUserId: userId },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("POST /api/owner/usage failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
