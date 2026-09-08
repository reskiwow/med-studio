import Link from "next/link";

export default function TutorialPage() {
  return (
    <div className="space-y-5">
      <h1 className="font-display text-xl font-semibold">Cara Buat API Key Roblox</h1>
      <p className="text-sm text-slate-400">
        Ikuti langkah ini buat dapetin Roblox User/Group ID dan API Key yang dibutuhin di halaman Upload.
        Prosesnya dilakuin langsung di situs resmi Roblox, bukan di MED STUDIO.
      </p>

      <section className="glass rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-medium text-neon-blue">1. Cari Roblox User ID / Group ID kamu</h2>
        <p className="text-xs text-slate-400">
          <span className="text-slate-200">Buat akun sendiri (Creator):</span> buka profil Roblox kamu di
          browser. Lihat URL-nya, contoh <code className="rounded bg-white/10 px-1">roblox.com/users/<span className="text-neon-purple">123456789</span>/profile</code>
          — angka itu User ID kamu.
        </p>
        <p className="text-xs text-slate-400">
          <span className="text-slate-200">Buat Group:</span> buka halaman group-nya, URL-nya
          <code className="rounded bg-white/10 px-1 ml-1">roblox.com/groups/<span className="text-neon-purple">987654321</span>/nama-group</code>
          — angka itu Group ID-nya.
        </p>
      </section>

      <section className="glass rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-medium text-neon-blue">2. Buka Creator Dashboard</h2>
        <p className="text-xs text-slate-400">
          Buka <code className="rounded bg-white/10 px-1">create.roblox.com/dashboard/credentials</code> di
          browser HP/PC kamu, login pake akun Roblox kamu (akun yang sama kayak User/Group ID di langkah 1).
        </p>
        <p className="text-xs text-slate-400">Pastiin tab yang aktif adalah <span className="text-slate-200">"API Keys"</span>.</p>
      </section>

      <section className="glass rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-medium text-neon-blue">3. Buat API Key baru</h2>
        <ol className="text-xs text-slate-400 space-y-2 list-decimal list-inside">
          <li>Tap tombol <span className="text-slate-200">"Create API Key"</span></li>
          <li>Kasih nama, misal <code className="rounded bg-white/10 px-1">MED_STUDIO_UPLOAD</code></li>
          <li>
            Di bagian <span className="text-slate-200">"Access Permissions"</span>, pilih API System:{" "}
            <span className="text-slate-200">"Assets"</span>, terus centang izin <span className="text-slate-200">write</span>
          </li>
          <li>
            Pilih siapa yang boleh diakses key ini — kalau upload buat akun sendiri, pilih User kamu; kalau
            buat Group, pilih Group-nya (harus sesuai sama User/Group ID di langkah 1)
          </li>
          <li>Bagian "Restrict IP Addresses" — biarin gak dicentang (kalau gak yakin IP server MED STUDIO)</li>
          <li>Tap <span className="text-slate-200">"Save & Generate key"</span></li>
        </ol>
      </section>

      <section className="glass rounded-2xl p-4 space-y-2">
        <h2 className="text-sm font-medium text-neon-blue">4. Copy API Key-nya</h2>
        <p className="text-xs text-slate-400">
          Key-nya cuma ditampilin <span className="text-slate-200">sekali</span> — langsung copy dan tempel ke
          form Upload di MED STUDIO (kolom "API Credential"). Kalau kelewat, tinggal bikin key baru lagi.
        </p>
      </section>

      <section className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-4 space-y-1">
        <p className="text-xs text-rose-300 font-medium">Penting</p>
        <p className="text-xs text-slate-400">
          Jangan share API key ke siapa pun. Di MED STUDIO, key kamu dienkripsi dan cuma ditampilin dalam
          bentuk tersamar (contoh <code className="rounded bg-white/10 px-1">••••••••1234</code>) — gak
          pernah ditampilin utuh lagi setelah disimpan.
        </p>
      </section>

      <Link
        href="/upload"
        className="block text-center rounded-2xl bg-gradient-to-r from-neon-blue to-neon-purple py-3 font-medium text-white shadow-glow"
      >
        Lanjut ke Upload
      </Link>
    </div>
  );
}
