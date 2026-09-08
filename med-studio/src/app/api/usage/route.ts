import { NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { getUsageStatus } from "@/lib/dailyUsage";

export async function GET() {
  try {
    const user = await requireAuth();
    const status = await getUsageStatus(user.id);
    return NextResponse.json(status);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.code === "UNAUTHENTICATED" ? 401 : 403 });
    }
    console.error("GET /api/usage failed:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
