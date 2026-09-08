import "server-only";

const DISCORD_API = "https://discord.com/api/v10";

export function getDiscordAuthorizeUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    redirect_uri: process.env.DISCORD_REDIRECT_URI!,
    response_type: "code",
    scope: "identify",
    state,
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function exchangeDiscordCode(code: string) {
  const body = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID!,
    client_secret: process.env.DISCORD_CLIENT_SECRET!,
    grant_type: "authorization_code",
    code,
    redirect_uri: process.env.DISCORD_REDIRECT_URI!,
  });

  const res = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Discord token exchange failed: ${res.status}`);
  }

  return (await res.json()) as {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
  };
}

export async function fetchDiscordUser(accessToken: string) {
  const res = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Discord user fetch failed: ${res.status}`);
  }

  return (await res.json()) as {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
}

/** Never log access/refresh tokens or the raw OAuth code. */
