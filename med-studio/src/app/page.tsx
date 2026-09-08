import { getSessionUser } from "@/lib/session";
import { getUsageStatus } from "@/lib/dailyUsage";
import { db } from "@/lib/db";
import DashboardCard from "@/components/DashboardCard";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="pt-20 text-center text-slate-400">
        <p>Silakan login untuk melanjutkan.</p>
        <Link href="/api/auth/discord" className="mt-4 inline-block rounded-xl bg-neon-violet px-5 py-2.5 text-white">
          Login dengan Discord
        </Link>
      </div>
    );
  }

  const [usage, uploadCount, connection, recentUploads] = await Promise.all([
    getUsageStatus(user.id),
    db.audioJob.count({ where: { userId: user.id } }),
    db.robloxConnection.findFirst({ where: { userId: user.id, isActive: true } }),
    db.uploadHistory.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 3 }),
  ]);

  const isVip = !!(await db.vipSubscription.findUnique({ where: { userId: user.id } }))?.isActive;

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-400">Selamat datang</p>
          <h1 className="font-display text-xl font-semibold tracking-tight">
            {user.discordAccount?.username ?? "User"}
          </h1>
        </div>
        <div className="h-10 w-10 rounded-full glass glow-border overflow-hidden">
          <Image src="/logo.png" alt="MED STUDIO" width={40} height={40} className="h-full w-full object-cover" />
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <DashboardCard
          label="Penggunaan Harian"
          value={usage.limit === null ? "Unlimited" : `${usage.remaining} / ${usage.limit}`}
          sub={usage.limit === null ? "VIP tanpa batas" : `${usage.remaining} penggunaan tersisa hari ini`}
          accent="purple"
        />
        <DashboardCard label="Total Upload" value={String(uploadCount)} sub="Sepanjang waktu" accent="blue" />
        <DashboardCard
          label="Status Roblox"
          value={connection ? "Terhubung" : "Belum diatur"}
          sub={connection ? (connection.targetType === "CREATOR" ? "Mode Creator" : "Mode Group") : "Atur di Settings"}
        />
        <DashboardCard label="Status VIP" value={isVip ? "VIP Aktif" : "Free"} accent={isVip ? "purple" : "neutral"} />
      </div>

      <section className="glass rounded-2xl p-4">
        <h2 className="text-sm font-medium text-slate-200 mb-3">Upload Terbaru</h2>
        {recentUploads.length === 0 ? (
          <p className="text-xs text-slate-500">Belum ada riwayat upload.</p>
        ) : (
          <ul className="space-y-2">
            {recentUploads.map((u) => (
              <li key={u.id} className="flex items-center justify-between text-sm">
                <span className="truncate max-w-[60%] text-slate-300">{u.filename}</span>
                <StatusPill status={u.robloxResult} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <Link
        href="/upload"
        className="block text-center rounded-2xl bg-gradient-to-r from-neon-blue to-neon-purple py-3 font-medium text-white shadow-glow"
      >
        + Proses Audio Baru
      </Link>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    SUCCESS: "bg-emerald-500/15 text-emerald-400",
    PROCESSING: "bg-amber-500/15 text-amber-400",
    PENDING: "bg-amber-500/15 text-amber-400",
    REJECTED: "bg-rose-500/15 text-rose-400",
    FAILED: "bg-rose-500/15 text-rose-400",
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] ${map[status] ?? "bg-white/10 text-slate-300"}`}>{status}</span>;
}
