import { getSessionUser } from "@/lib/session";
import { db } from "@/lib/db";
import Link from "next/link";

const WHATSAPP_NUMBER = process.env.VIP_WHATSAPP_NUMBER ?? "6282197014242";
const WHATSAPP_MESSAGE = encodeURIComponent("Halo MED STUDIO, saya ingin membeli VIP.");

export default async function VipPage() {
  const user = await getSessionUser();
  const vip = user ? await db.vipSubscription.findUnique({ where: { userId: user.id } }) : null;

  return (
    <div className="mobile-page">
      <header className="app-topbar page-titlebar">
        <Link href="/" className="back-button" aria-label="Kembali">‹</Link>
        <h1>VIP Member</h1>
        <span className="w-7" />
      </header>
      <main className="mobile-content vip-screen">
        <section className="vip-banner">
          <span className="vip-crown">♛</span>
          <div>
            <p className="text-[9px] text-purple-100">Upgrade ke VIP</p>
            <p className="mt-1 text-[8px] leading-4 text-purple-200">Nikmati fitur tanpa batas dan akses penuh ke semua tools MED STUDIO.</p>
          </div>
        </section>
        <section className="tool-card mt-3">
          <p className="section-kicker">Keuntungan VIP</p>
          <ul className="vip-list">
            <li>Kuota tanpa limit (tidak ada 3x/hari)</li>
            <li>Filter premium lainnya</li>
            <li>Prioritas processing</li>
            <li>Akses dashboard owner</li>
          </ul>
          <div className="price-row"><span>♛</span><strong>Rp 50.000</strong><small>/ 30 Hari</small></div>
        </section>
        {!vip?.isActive && (
          <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${WHATSAPP_MESSAGE}`} target="_blank" rel="noreferrer" className="primary-button mt-3 block w-full text-center">
            ◉ &nbsp; Beli VIP Sekarang
          </a>
        )}
        <p className="mt-3 text-center text-[9px] text-slate-500">Atau hubungi kami via WhatsApp<br /><span className="text-slate-300">082197014242</span></p>
      </main>
    </div>
  );
}