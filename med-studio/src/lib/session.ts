import "server-only";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { db } from "./db";
import { sha256Hex } from "./crypto";

const SESSION_COOKIE = "med_studio_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

/**
 * Sessions are opaque random tokens. Only a hash of the token is persisted,
 * so a database leak alone can't be used to impersonate a session.
 */
export async function createSession(userId: string, meta: { userAgent?: string; ipHash?: string }) {
  const token = nanoid(48);
  const tokenHash = sha256Hex(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: meta.userAgent,
      ipHash: meta.ipHash,
    },
  });

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function getSessionUser() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = sha256Hex(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { user: { include: { discordAccount: true, vipSubscription: true } } },
  });

  if (!session || session.expiresAt < new Date()) {
    return null;
  }

  return session.user;
}

export async function destroySession() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = sha256Hex(token);
    await db.session.deleteMany({ where: { tokenHash } }).catch(() => {});
  }
  cookies().delete(SESSION_COOKIE);
}
