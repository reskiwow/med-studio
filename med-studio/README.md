# MED STUDIO

Mobile-first audio processing + Roblox publishing dashboard. Next.js 14 (App Router) + TypeScript + Tailwind + PostgreSQL/Prisma + Discord OAuth2.

## What's actually implemented (real logic, not just UI)

- **Discord OAuth2 login** (`src/lib/discord.ts`, `/api/auth/discord`, `/api/auth/callback`) against Discord's documented `/oauth2/token` and `/users/@me` endpoints. Sessions are opaque tokens; only a SHA-256 hash is stored server-side, set as an `httpOnly` cookie.
- **Owner authorization** (`src/lib/auth.ts`) is computed fresh on every request from `OWNER_DISCORD_IDS`, tied to the Discord ID on the current server-verified session — never a client-supplied flag.
- **Atomic daily usage limiting** (`src/lib/dailyUsage.ts`): the free-tier 3/day cap is enforced with a single conditional `UPDATE ... WHERE usageCount < limit` at the database level (not read-then-write in app code), so concurrent requests can't race past the limit. VIP policy (custom or unlimited quota) is read from `VipSubscription` and applied the same way.
- **Credential handling**: Roblox API keys are AES-256-GCM encrypted before being written to Postgres (`src/lib/crypto.ts`) and are only ever returned to the client in masked form (`••••••••1234`).
- **Real, per-user Roblox upload** (`src/app/api/jobs/route.ts`): `POST /api/jobs` now looks up the *calling user's own* active `RobloxConnection`, decrypts *their own* API key server-side, and calls the documented Open Cloud Assets API (`src/lib/roblox/client.ts`) to actually create the Audio asset under their own Creator or Group. Nothing is shared across users — each person's upload runs under their own credentials and their own Creator/Group ID. If Roblox hasn't finished moderating yet, the job is left `PENDING` and `GET /api/jobs/[id]` polls the real Operation for a terminal result — the Upload screen polls this automatically. No result is ever guessed.
- **Owner API routes** (`/api/owner/*`) for stats, user search, usage reset, and VIP activation — all gated by `requireOwner()`, all writes logged to `OwnerLog`.
- **Prisma schema** (`prisma/schema.prisma`) with every model from the spec, including the `(userId, date)` unique constraint on `DailyUsage` and `robloxOperationPath` on `AudioJob` for polling.

## What's UI-complete but backed by TODOs

- **Actual audio transcoding.** `speed` / `amplifyDb` / `maxDurationSecs` are recorded on the job and sent to Roblox as metadata context, but the audio file itself is **not yet transcoded** — the original file is uploaded as-is. Wiring real ffmpeg processing (as a queue/worker step between `PROCESSING` and `UPLOADING`) is still a TODO in `src/app/api/jobs/route.ts`.
- **Object storage.** `storageKey` is a placeholder path; the file is currently held in memory only for the duration of the upload request. Wire up S3/R2/GCS per your infra before relying on `AudioFile.storageKey` for anything.
- **Owner Panel UI.** The stats view is real and queries the database directly. The user-search / usage-reset / VIP-activation *forms* are not built — the backing API routes are, and are documented at the bottom of `/owner`.
- **Rate limiting** is in-memory (`src/lib/rateLimit.ts`) — fine for one instance, swap for Redis before scaling horizontally.

## Setup

```bash
cp .env.example .env   # fill in real values
npm install
npx prisma migrate dev --name init
npm run dev
```

You'll need:
1. A Discord application (Discord Developer Portal) with OAuth2 redirect set to `DISCORD_REDIRECT_URI`.
2. A Roblox Open Cloud API key with Asset-related scopes for whichever Creator/Group you're testing against — [Low confidence] on exact scope names without checking Roblox's current docs at implementation time.
3. Your own Discord user ID in `OWNER_DISCORD_IDS` (comma-separated for multiple owners).

## Explicit non-negotiables this build follows (per the spec)

- No moderation bypass, evasion, fake results, or undocumented Roblox endpoints anywhere in this code.
- Every Roblox result shown to the user comes from an actual API response.
- No fake payment confirmation for VIP — "Beli VIP" only opens WhatsApp with a prefilled message; activation is manual, done by the owner via the owner API.
