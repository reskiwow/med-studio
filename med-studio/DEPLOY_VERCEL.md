# MED STUDIO — Vercel deployment

## 1. Database
Use PostgreSQL (Neon, Supabase, Railway, etc.). Set both:

- `DATABASE_URL` — runtime/pooled URL
- `DIRECT_URL` — direct PostgreSQL URL for Prisma migrations

Before the first production run, apply the Prisma schema from the project root:

```bash
npx prisma db push
```

For a production workflow with migration files, generate and commit Prisma migrations locally, then use `npx prisma migrate deploy` during deployment.

## 2. Environment variables
Copy `.env.example` to your local `.env` for testing, then add the same values in Vercel Project → Settings → Environment Variables.

Required for login/session:

- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`
- `DISCORD_REDIRECT_URI`
- `SESSION_SECRET`
- `OWNER_DISCORD_IDS`

Required for Roblox upload:

- `ROBLOX_API_BASE_URL` (normally `https://apis.roblox.com`)

Optional:

- `VIP_WHATSAPP_NUMBER`

Never commit a real `.env` file or API keys.

## 3. Discord callback
For a deployed site, change `DISCORD_REDIRECT_URI` to:

`https://YOUR-DOMAIN/api/auth/discord/callback`

Add the exact same callback URL to the Discord application's OAuth2 redirect configuration.

## 4. Deploy
Push the project to GitHub and import the repository into Vercel. The included `vercel.json` selects Next.js and the normal `npm run build` command.

## Important implementation notes

- Authentication, sessions, owner checks, Roblox credential encryption, daily quota, history, and the existing UI routes are included.
- Audio processing controls are currently persisted as job settings; the API route does not run FFmpeg transcoding yet.
- The current Roblox integration calls the Open Cloud Assets endpoint and treats moderation as pending unless Roblox returns a terminal operation result.
- Durable object storage for original audio is not implemented; `storageKey` is currently a database record, not a downloadable object-storage URL.

These are application-level limitations, not Vercel deployment blockers. Verify the current Roblox Open Cloud Audio API requirements before enabling production uploads.
