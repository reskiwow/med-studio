import "server-only";
import { getSessionUser } from "./session";

function ownerIds(): Set<string> {
  return new Set(
    (process.env.OWNER_DISCORD_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

export async function requireAuth() {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("UNAUTHENTICATED", "You must be logged in.");
  }
  return user;
}

/**
 * Owner check is deliberately re-derived on every call from env, using the
 * Discord ID attached to the current server-side session — never a client
 * supplied flag, header, or query param.
 */
export async function requireOwner() {
  const user = await requireAuth();
  const discordId = user.discordAccount?.discordId;
  if (!discordId || !ownerIds().has(discordId)) {
    throw new AuthError("FORBIDDEN", "Owner access only.");
  }
  return user;
}

export async function isOwner(discordId: string | undefined | null): Promise<boolean> {
  if (!discordId) return false;
  return ownerIds().has(discordId);
}

export class AuthError extends Error {
  code: "UNAUTHENTICATED" | "FORBIDDEN";
  constructor(code: "UNAUTHENTICATED" | "FORBIDDEN", message: string) {
    super(message);
    this.code = code;
  }
}
