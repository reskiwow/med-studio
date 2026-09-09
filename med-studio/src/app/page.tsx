import { getSessionUser } from "@/lib/session";
import { getUsageStatus } from "@/lib/dailyUsage";
import { db } from "@/lib/db";
import Link from "next/link";
import Image from "next/image";

export default async function DashboardPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <div className="login-screen">
        <div className="text-center">
          <p className="text-sm text-slate-400">Silakan login untuk melanjutkan.</p>
          <Link href="/login" className="primary-button mt-4 inline-flex">Login dengan Discord</Link>
        </div>
      </div>
    );
  }

  const [usage, uploadCount, connection, vip] = await Promise.all([
    getUsageStatus(user.id),
    db.audioJob.count({ where: { userId: user.id } }),
    db.robloxConnection.findFirst({ where: { userId: user.id, isActive: true } }),
    db.vipSubscription.findUnique({ where: { userId: user.id } }),
  ]);

  const limit = usage.limit ?? 3;
  const remaining = usage.remaining ?? 0;
  const usedPct = usage.limit === null ? 100 : Math.min(100, Math.round(((limit - remaining) / limit) * 100));
  const username = user.discordAccount?.username ?? "med17";

  // Real time-until-reset (UTC midnight), computed at request time. Not a
  // live client-side ticker, but at least accurate as of page load instead
  // of a hardcoded string that never changes.
  const now = new Date();
  const nextMidnightUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const msLeft = nextMidnightUtc.getTime() - now.getTime();
  const hh = String(Math.floor(msLeft / 3_600_000)).padStart(2, "0");
  const mm = String(Math.floor((msLeft % 3_600_000) / 60_000)).padStart(2, "0");
  const ss = String(Math.floor((msLeft % 60_000) / 1000)).padStart(2, "0");
  const resetIn = `${hh}:${mm}:${ss}`;

  return (
    <div className="mobile-page">
      <header className="app-topbar dashboard-topbar">
        <Link href="/" className="flex items-center gap-2">
          <div className="app-logo-small">
            <Image src="/logo.png" alt="MED STUDIO" width={30} height={30} className="h-full w-full object-cover" />
          </div>
          <span className="font-display text-sm font-bold">MED STUDIO</span>
        </Link>
        <div className="dashboard-user">
          <button type="button" className="app-icon-button" aria-label="Notifikasi">♟</button>
          <div className="profile-avatar" aria-hidden="true">{username.slice(0, 2).toUpperCase()}</div>
          <div className="profile-copy">
            <strong>{username}</strong>
            <span>{vip?.isActive ? "VIP Member" : "Free User"}</span>
          </div>
        </div>
      </header>

      <main className="mobile-content space-y-3">
        <section className="welcome-banner">
          <div>
            <p className="text-[9px] text-slate-200">Selamat Datang di</p>
            <h1 className="font-display text-lg font-bold text-white">MED STUDIO</h1>
            <p className="mt-1 text-[8px] text-slate-300">Audio Processing · Upload Roblox</p>
          </div>
          <div className="roblox-mark" aria-hidden="true">◇</div>
        </section>

        <section className="stat-card">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <span className="stat-icon">✦</span>
              <div>
                <p className="text-[10px] font-semibold text-white">Statistik Hari Ini</p>
                <p className="mt-1 text-xl font-bold leading-none text-white">
                  {remaining}<span className="text-slate-500">/{limit}</span>
                  <span className="ml-2 text-[8px] font-normal text-slate-400">Kuota Tersisa (Free)</span>
                </p>
              </div>
            </div>
            <span className="text-[7px] text-slate-500">Reset dalam<br />{resetIn}</span>
          </div>
          <div className="progress-track mt-3"><span style={{ width: `${Math.max(8, usedPct)}%` }} /></div>
        </section>

        <div className="dashboard-actions">
          <ActionCard href="/upload" icon="⇧" title="Upload Audio" sub="Proses & Upload" />
          <ActionCard href="/settings" icon="ↄ" title="Roblox Connection" sub="Akun / Group" />
          <ActionCard href="/tools" icon="☷" title="Audio Tools" sub="Preset & Custom" />
          <ActionCard href="/history" icon="◷" title="History" sub="Riwayat Upload" />
        </div>

        <div className="quick-action-grid">
          <Link href="/vip" className="quick-action primary-action">♛ <span>Beli VIP</span></Link>
          <Link href="/tutorial" className="quick-action">▷ <span>Tutorial</span></Link>
        </div>

        <div className="dashboard-meta">
          <span>{uploadCount} upload</span>
          <span>{connection ? "Roblox Terhubung" : "Roblox Belum diatur"}</span>
          <span>{vip?.isActive ? "VIP Aktif" : "Free"}</span>
        </div>
      </main>
    </div>
  );
}

function ActionCard({ href, icon, title, sub }: { href: string; icon: string; title: string; sub: string }) {
  return (
    <Link href={href} className="dashboard-action-card tap-scale">
      <span className="dashboard-card-icon">{icon}</span>
      <span className="text-[9px] font-semibold text-white">{title}</span>
      <span className="text-[7px] text-slate-500">{sub}</span>
    </Link>
  );
}