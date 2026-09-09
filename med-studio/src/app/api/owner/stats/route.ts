import { NextResponse } from "next/server";
import { requireOwner, AuthError } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await requireOwner();

    const [totalUsers, activeToday, totalJobs, success, rejected, failed, vipUsers] = await Promise.all([
      db.user.count(),
      db.dailyUsage.count({ where: { date: new Date(new Date().toISOString().slice(0, 10)) } }),
      db.audioJob.count(),
      db.uploadHistory.count({ where: { robloxResult: "SUCCESS" } }),
      db.uploadHistory.count({ where: { robloxResult: "REJECTED" } }),
      db.uploadHistory.count({ where: { status: "FAILED" } }),
      db.vipSubscription.count({ where: { isActive: true } }),
    ]);

    return NextResponse.json({
      totalUsers,
      activeToday,
      totalJobs,
      successfulUploads: success,
      rejectedUploads: rejected,
      failedUploads: failed,
      vipUsers,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("GET /api/owner/stats failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
