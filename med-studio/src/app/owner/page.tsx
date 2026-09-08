import { requireOwner, AuthError } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function OwnerPage() {
  let owner;
  try {
    owner = await requireOwner();
  } catch (err) {
    if (err instanceof AuthError) redirect(err.code === "UNAUTHENTICATED" ? "/login" : "/");
    throw err;
  }

  const [totalUsers, totalJobs, success, rejected, failed, vipUsers, recentErrors] = await Promise.all([
    db.user.count(),
    db.audioJob.count(),
    db.uploadHistory.count({ where: { robloxResult: "SUCCESS" } }),
    db.uploadHistory.count({ where: { robloxResult: "REJECTED" } }),
    db.uploadHistory.count({ where: { status: "FAILED" } }),
    db.vipSubscription.count({ where: { isActive: true } }),
    db.audioJob.findMany({ where: { status: "FAILED" }, orderBy: { updatedAt: "desc" }, take: 5 }),
  ]);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold">Owner Panel</h1>
      <p className="text-xs text-slate-500">Masuk sebagai {owner.discordAccount?.username}</p>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total Users" value={totalUsers} />
        <Stat label="Total Jobs" value={totalJobs} />
        <Stat label="Upload Sukses" value={success} accent="emerald" />
        <Stat label="Upload Ditolak" value={rejected} accent="rose" />
        <Stat label="Upload Gagal" value={failed} accent="rose" />
        <Stat label="VIP Aktif" value={vipUsers} accent="purple" />
      </div>

      <section className="glass rounded-2xl p-4">
        <h2 className="text-sm font-medium mb-2">Error Log Terbaru</h2>
        {recentErrors.length === 0 ? (
          <p className="text-xs text-slate-500">Tidak ada error terbaru.</p>
        ) : (
          <ul className="space-y-2 text-xs text-slate-400">
            {recentErrors.map((j) => (
              <li key={j.id} className="border-b border-white/5 pb-2 last:border-0">
                Job {j.id.slice(0, 8)} — {j.errorMessage ?? "Tidak ada pesan error."}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-[11px] text-slate-500">
        Pencarian user, reset kuota, dan aktivasi/deaktivasi VIP tersedia melalui endpoint
        <code className="mx-1 rounded bg-white/5 px-1">/api/owner/users</code>,
        <code className="mx-1 rounded bg-white/5 px-1">/api/owner/usage</code>, dan
        <code className="mx-1 rounded bg-white/5 px-1">/api/owner/vip</code>. Hubungkan form
        pencarian/tabel di halaman ini ke endpoint tersebut sesuai kebutuhan UI owner Anda.
      </p>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: "emerald" | "rose" | "purple" }) {
  const color =
    accent === "emerald" ? "text-emerald-400" : accent === "rose" ? "text-rose-400" : accent === "purple" ? "text-neon-purple" : "text-white";
  return (
    <div className="glass rounded-2xl p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-display font-semibold ${color}`}>{value}</p>
    </div>
  );
}
