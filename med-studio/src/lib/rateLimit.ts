import "server-only";

/**
 * Minimal in-memory sliding-window rate limiter, per key (e.g. userId or IP).
 * Fine for a single-instance deployment / getting started. For multi-instance
 * production deployments, replace with a shared store (e.g. Redis) — this
 * module is intentionally isolated behind the same function signature so
 * that swap is a one-file change.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}
