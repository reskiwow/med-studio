# MED STUDIO

Dashboard mobile-first buat proses audio dan publish ke Roblox lewat API resmi (Open Cloud). Dibangun pake Next.js 14, TypeScript, Tailwind, PostgreSQL (Prisma), dan login Discord OAuth2.

**Aturan utama project ini:** gak ada bypass moderasi, gak ada endpoint Roblox yang gak resmi/gak didokumentasikan, dan hasil moderasi yang ditampilkan ke user selalu hasil asli dari Roblox — gak pernah direkayasa.

---

## Daftar Isi

1. [Fitur](#fitur)
2. [Tech Stack](#tech-stack)
3. [Tutorial Setup dari Nol](#tutorial-setup-dari-nol)
4. [Struktur Project](#struktur-project)
5. [Deploy ke Production](#deploy-ke-production)
6. [Yang Masih Jadi TODO](#yang-masih-jadi-todo)
7. [Keamanan](#keamanan)

---

## Fitur

- **Login Discord OAuth2** — session server-side, gak nyimpen token Discord.
- **Dashboard** — statistik penggunaan harian, status koneksi Roblox, status VIP, riwayat upload terbaru.
- **Upload Audio** — pilih file, atur preset (speed/amplify/durasi) atau custom, pilih tujuan (Creator/Group), lalu publish.
- **Publish ke Roblox beneran** — tiap user pake API key Roblox miliknya sendiri (bukan API key global/shared). Status hasil (Success/Processing/Rejected/Failed) selalu berdasarkan response asli dari Roblox.
- **Limit harian** — 3x proses/hari buat user gratis, ditegakkan atomic di level database (gak bisa dibypass lewat request bersamaan atau localStorage).
- **VIP** — kuota custom/unlimited, diaktifin manual sama owner lewat WhatsApp (gak ada konfirmasi pembayaran otomatis/palsu).
- **Owner Panel** — statistik total user, job, upload sukses/gagal/ditolak, VIP aktif.
- **Riwayat & filter** — semua upload user, bisa difilter per status.

---

## Tech Stack

| Bagian | Teknologi |
|---|---|
| Framework | Next.js 14 (App Router) |
| Bahasa | TypeScript |
| Styling | Tailwind CSS |
| Database | PostgreSQL (rekomendasi: [Neon](https://neon.tech), gratis) |
| ORM | Prisma |
| Auth | Discord OAuth2 (session sendiri, bukan NextAuth) |
| Font | Space Grotesk + Inter (via `next/font`) |
| Integrasi | Roblox Open Cloud Assets API |

---

## Tutorial Setup dari Nol

### Langkah 1 — Clone repo ini

```bash
git clone https://github.com/<username-kamu>/<nama-repo>.git
cd <nama-repo>
npm install
```

### Langkah 2 — Bikin database PostgreSQL gratis (Neon)

1. Buka [neon.tech](https://neon.tech), daftar/login (bisa pake GitHub).
2. Klik **"New Project"** → pilih region terdekat → **Create**.
3. Di halaman project, klik **"Connect to your database"**.
4. Toggle **"Show password"** biar password-nya kelihatan (bukan tersensor `***`).
5. Copy 2 connection string:
   - Yang ada `-pooler` di hostname → ini buat `DATABASE_URL`
   - Yang **tanpa** `-pooler` (matiin toggle "Connection pooling" buat lihat) → ini buat `DIRECT_URL`

### Langkah 3 — Bikin Discord Application

1. Buka [discord.com/developers/applications](https://discord.com/developers/applications) → **"New Application"** → kasih nama → **Create**.
2. Di halaman **General Information**, copy **Application ID** → ini `DISCORD_CLIENT_ID`.
3. Buka menu **OAuth2** → klik **"Reset Secret"** → copy nilainya → ini `DISCORD_CLIENT_SECRET` (cuma muncul sekali, simpen baik-baik).
4. Masih di halaman OAuth2, bagian **Redirects** → **"Add Redirect"** → masukin:
   - Lokal: `http://localhost:3000/api/auth/discord/callback`
   - Production (isi belakangan setelah deploy): `https://domain-kamu.com/api/auth/discord/callback`
5. **Save Changes**.

### Langkah 4 — Isi file `.env`

```bash
cp .env.example .env
```

Buka `.env`, isi semua variabel:

```env
DATABASE_URL=<connection string pooled dari Neon>
DIRECT_URL=<connection string non-pooled dari Neon>

DISCORD_CLIENT_ID=<dari langkah 3>
DISCORD_CLIENT_SECRET=<dari langkah 3>
DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback

OWNER_DISCORD_IDS=<Discord User ID kamu sendiri>
SESSION_SECRET=<string acak panjang, generate dengan: openssl rand -base64 48>

ROBLOX_API_BASE_URL=https://apis.roblox.com
VIP_WHATSAPP_NUMBER=<nomor WA owner, format 62xxxxxxxxxx>
```

Cara cari **Discord User ID** kamu sendiri: buka Discord → Settings → Advanced → aktifin **Developer Mode** → klik kanan profil kamu → **"Copy User ID"**.

### Langkah 5 — Bikin tabel database

```bash
npx prisma db push
```

Kalau berhasil, muncul: `Your database is now in sync with your Prisma schema.`

### Langkah 6 — Jalanin lokal

```bash
npm run dev
```

Buka `http://localhost:3000`, coba login pake Discord.

---

## Struktur Project

```
src/
  app/
    api/              → semua endpoint backend (auth, jobs, roblox, owner)
    page.tsx          → Dashboard
    upload/           → Flow upload audio (multi-step)
    history/          → Riwayat upload + filter
    settings/         → Pengaturan akun & koneksi Roblox
    tools/            → VIP & tautan tutorial
    tutorial/         → Panduan bikin Roblox API key
    owner/            → Owner Panel (stats)
  components/         → Komponen UI reusable (BottomNav, kartu, tombol)
  lib/
    auth.ts           → Cek login & cek owner (server-side, dari OWNER_DISCORD_IDS)
    session.ts        → Session berbasis token, bukan JWT/library luar
    dailyUsage.ts      → Logic limit harian (atomic, anti-race-condition)
    crypto.ts          → Enkripsi API key Roblox
    discord.ts          → Panggilan ke Discord OAuth2 API
    roblox/client.ts    → Panggilan ke Roblox Open Cloud Assets API
prisma/
  schema.prisma        → Struktur database
```

---

## Deploy ke Production

Paling gampang pake **Vercel** (gratis, auto-deploy tiap `git push`):

1. Push repo ini ke GitHub.
2. Buka [vercel.com](https://vercel.com) → login → **"Add New" → "Project"** → import repo ini.
3. Di bagian **Environment Variables**, paste semua isi `.env` kamu.
4. Klik **Deploy**.
5. Setelah dapet URL production, **update 2 tempat**:
   - Discord Developer Portal → OAuth2 → Redirects → tambah `https://domain-kamu.vercel.app/api/auth/discord/callback`
   - Vercel → Settings → Environment Variables → update `DISCORD_REDIRECT_URI` ke URL yang sama → Redeploy

---

## Yang Masih Jadi TODO

- **Audio belum benar-benar diproses.** Setting speed/amplify/durasi kesimpen di database tapi file yang di-upload ke Roblox masih file asli, belum ditranscode. Butuh worker terpisah (ffmpeg) buat ini.
- **Object storage belum dipasang.** File audio cuma dipegang sementara pas request upload, belum disimpen permanen (S3/R2/GCS).
- **Form Owner Panel belum ada UI-nya.** Endpoint API-nya (`/api/owner/users`, `/api/owner/usage`, `/api/owner/vip`) udah jalan dan aman, tinggal butuh tampilan form buat manggilnya.
- **Rate limiting masih in-memory.** Cukup buat 1 instance server; kalau scale ke banyak instance, ganti ke Redis.

---

## Keamanan

- API key Roblox dienkripsi (AES-256-GCM) sebelum disimpen, dan cuma ditampilin dalam bentuk tersamar (`••••••••1234`) — gak pernah utuh lagi setelah disimpan.
- Session pake token acak yang di-hash (SHA-256), disimpen di cookie `httpOnly`.
- Status **owner** selalu dicek ulang dari `OWNER_DISCORD_IDS` di server tiap request — gak pernah dipercaya dari input/cookie client.
- Jangan commit file `.env` yang isinya kredensial asli ke repo publik. Kalau gak sengaja ke-expose, langsung reset di sumbernya (Discord: Reset Secret, Neon: Reset password).
