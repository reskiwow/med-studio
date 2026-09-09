import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { getDiscordAuthorizeUrl } from "@/lib/discord";
import { cookies } from "next/headers";

// Redirects the user into Discord's own OAuth2 consent screen.
export async function GET() {
  const state = nanoid(24);
  cookies().set("discord_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });
  return NextResponse.redirect(getDiscordAuthorizeUrl(state));
}
