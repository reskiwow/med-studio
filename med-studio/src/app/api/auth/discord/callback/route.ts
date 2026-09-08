import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { exchangeDiscordCode, fetchDiscordUser } from "@/lib/discord";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { sha256Hex } from "@/lib/crypto";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = cookies().get("discord_oauth_state")?.value;
  cookies().delete("discord_oauth_state");

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", req.url));
  }

  try {
    const tokenResponse = await exchangeDiscordCode(code);
    const discordUser = await fetchDiscordUser(tokenResponse.access_token);
    // Discord access/refresh tokens are used once here and discarded.
    // We only persist Discord's stable user ID + display fields.

    const existing = await db.discordAccount.findUnique({
      where: { discordId: discordUser.id },
      include: { user: true },
    });

    const user = existing
      ? await db.user.update({
          where: { id: existing.userId },
          data: {
            discordAccount: {
              update: {
                username: discordUser.username,
                discriminator: discordUser.discriminator,
                avatarHash: discordUser.avatar,
              },
            },
          },
        })
      : await db.user.create({
          data: {
            discordAccount: {
              create: {
                discordId: discordUser.id,
                username: discordUser.username,
                discriminator: discordUser.discriminator,
                avatarHash: discordUser.avatar,
              },
            },
          },
        });

    const ip = headers().get("x-forwarded-for") ?? "unknown";
    await createSession(user.id, {
      userAgent: headers().get("user-agent") ?? undefined,
      ipHash: sha256Hex(ip),
    });

    return NextResponse.redirect(new URL("/", req.url));
  } catch (err) {
    // Never log the raw code or tokens.
    console.error("Discord OAuth callback failed:", (err as Error).message);
    return NextResponse.redirect(new URL("/login?error=oauth_failed", req.url));
  }
}
