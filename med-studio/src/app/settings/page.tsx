import { getSessionUser } from "@/lib/session";
import { isOwner } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";
import DisconnectButton from "@/components/DisconnectButton";
import LogoutButton from "@/components/LogoutButton";

export default async function SettingsPage() {
  const user = await getSessionUser();
  if (!user) return <p className="pt-20 text-center text-slate-400">Silakan login.</p>;

  const connection = await db.robloxConnection.findFirst({ where: { userId: user.id, isActive: true } });
  const ownerAccess = await isOwner(user.discordAccount?.discordId);

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold">Pengaturan</h1>

      <section className="glass rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-medium text-slate-200">Akun</h2>
        <p className="text-sm text-slate-300">{user.discordAccount?.username}</p>
        <p className="text-xs text-slate-500">Discord ID: {user.discordAccount?.discordId}</p>
      </section>

      <section className="glass rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-medium text-slate-200">Konfigurasi Roblox</h2>
        {connection ? (
          <div className="space-y-1 text-sm">
            <p className="text-slate-300">{connection.targetType === "CREATOR" ? "Creator / My Account" : "Group / Community"}</p>
            <p className="text-xs text-slate-500">
              ID: {connection.robloxUserId ?? connection.robloxGroupId} · Credential: ••••••••{connection.credentialLast4}
            </p>
            <div className="flex gap-2 pt-2">
              <Link href="/upload" className="rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white">
                Edit
              </Link>
              <DisconnectButton />
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Belum ada konfigurasi tersimpan.</p>
        )}
      </section>

      {ownerAccess && (
        <Link
          href="/owner"
          className="block text-center rounded-2xl border border-neon-purple/40 py-3 text-sm font-medium text-neon-purple"
        >
          Buka Owner Panel
        </Link>
      )}

      <LogoutButton />
    </div>
  );
}
