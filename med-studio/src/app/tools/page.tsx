import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";

const WHATSAPP_NUMBER = process.env.VIP_WHATSAPP_NUMBER ?? "6282197014242";
const WHATSAPP_MESSAGE = encodeURIComponent("Halo MED STUDIO, saya ingin membeli VIP.");

export default async function ToolsPage() {
  const user = await getSessionUser();
  const vip = user ? await db.vipSubscription.findUnique({ where: { userId: user.id } }) : null;
  const isVip = !!vip?.isActive;

  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold">Tools & VIP</h1>

      <div className="glass rounded-2xl p-4 space-y-2">
        <p className="text-sm text-slate-300">Status kamu saat ini:</p>
        <p className="font-display text-lg">{isVip ? "VIP Aktif" : "Free"}</p>
        {isVip && vip?.expiresAt && (
          <p className="text-xs text-slate-500">Berlaku sampai {new Date(vip.expiresAt).toLocaleDateString("id-ID")}</p>
        )}
      </div>

      <div className="glass rounded-2xl p-4 space-y-3">
        <h2 className="text-sm font-medium">Free vs VIP</h2>
        <ul className="text-xs text-slate-400 space-y-1">
          <li>Free: 3 job pemrosesan per hari.</li>
          <li>VIP: kuota lebih tinggi atau unlimited (diatur owner), fitur premium, pengaturan proses kustom.</li>
        </ul>
      </div>

      <Link
        href="/tutorial"
        className="block glass rounded-2xl p-4 text-sm text-slate-200"
      >
        📘 Cara buat API Key Roblox
        <span className="block text-xs text-slate-500 mt-0.5">Panduan lengkap sebelum upload pertama kamu</span>
      </Link>

      {!isVip && (
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`}
          target="_blank"
          rel="noreferrer"
          className="block text-center rounded-2xl bg-gradient-to-r from-neon-blue to-neon-purple py-3 font-medium text-white shadow-glow"
        >
          Beli VIP
        </a>
      )}
      <p className="text-[11px] text-slate-500 text-center">
        Aktivasi VIP dilakukan manual oleh owner setelah konfirmasi pembayaran. Tidak ada konfirmasi otomatis di aplikasi ini.
      </p>
    </div>
  );
}
