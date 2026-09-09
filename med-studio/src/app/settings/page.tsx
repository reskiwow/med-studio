import { getSessionUser } from "@/lib/session";
import { isOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import RobloxConnectionScreen from "@/components/RobloxConnectionScreen";
import DisconnectButton from "@/components/DisconnectButton";
import LogoutButton from "@/components/LogoutButton";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return <p className="pt-20 text-center text-slate-400">Silakan login.</p>;

  const connection = await db.robloxConnection.findFirst({
    where: { userId: user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });
  const ownerAccess = await isOwner(user.discordAccount?.discordId);

  return (
    <div className="mobile-page">
      <header className="app-topbar page-titlebar">
        <Link href="/" className="back-button" aria-label="Kembali">‹</Link>
        <h1>Settings</h1>
        <span className="w-7" />
      </header>
      <main className="mobile-content space-y-3">
        <section className="tool-card">
          <p className="section-kicker">Akun</p>
          <p className="mt-2 text-[11px] text-white">{user.discordAccount?.username}</p>
          <p className="text-[8px] text-slate-500">Discord ID: {user.discordAccount?.discordId}</p>
        </section>

        <p className="section-kicker mt-1">Koneksi Roblox</p>
        <RobloxConnectionScreen
          initialTargetType={connection?.targetType ?? "CREATOR"}
          initialTargetId={connection?.robloxUserId ?? connection?.robloxGroupId ?? ""}
        />

        {connection && (
          <div className="mt-2">
            <p className="text-[8px] text-slate-500 mb-2">
              Tersimpan: {connection.targetType === "CREATOR" ? "Creator" : "Group"} · Key ••••••••{connection.credentialLast4}
            </p>
            <DisconnectButton />
          </div>
        )}

        {ownerAccess && (
          <Link href="/owner" className="secondary-button mt-2 block w-full text-center">
            Buka Owner Panel
          </Link>
        )}

        <div className="mt-3">
          <LogoutButton />
        </div>
      </main>
    </div>
  );
}