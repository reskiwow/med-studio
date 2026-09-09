# MED STUDIO — UI Update

UI has been refreshed to closely follow the supplied MED STUDIO reference:
- deep navy mobile-first shell
- electric blue / purple gradients
- glowing borders and subtle wave/light effects
- compact rounded cards and controls
- refreshed dashboard profile area
- login screen without bottom navigation
- tutorial and owner pages use the same mobile shell

## Functionality
The existing routes, API endpoints, database logic, Roblox integration, Discord login, VIP flow, upload flow, history, tools, settings, and owner endpoints were not intentionally changed.

## Vercel
This remains a standard Next.js 14 App Router project. Keep the existing environment variables in Vercel Project Settings; do not commit `.env`.

Before production:
1. Set the PostgreSQL/Prisma variables.
2. Set Discord OAuth variables.
3. Set `DISCORD_REDIRECT_URI` to your production callback:
   `https://YOUR-DOMAIN/api/auth/discord/callback`
4. Add that same callback URL in the Discord Developer Portal.
5. Set Roblox and VIP variables as required by the existing project.

The provided `.env` file was intentionally excluded from the update archive to avoid shipping credentials.
