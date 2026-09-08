import "server-only";
import { db } from "./db";
import { Prisma } from "@prisma/client";

const FREE_DAILY_LIMIT = 3;

function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function effectiveLimitFor(userId: string): Promise<number | null> {
  // null = unlimited
  const vip = await db.vipSubscription.findUnique({ where: { userId } });
  const isActiveVip = !!vip?.isActive && (!vip.expiresAt || vip.expiresAt > new Date());
  if (isActiveVip) {
    return vip!.dailyLimit ?? null; // owner-configured VIP policy
  }
  return FREE_DAILY_LIMIT;
}

export class DailyLimitExceededError extends Error {
  limit: number;
  constructor(limit: number) {
    super(`Daily limit of ${limit} reached.`);
    this.limit = limit;
  }
}

/**
 * Atomically checks and consumes one unit of daily usage for a user.
 *
 * Concurrency safety: this relies on the (userId, date) UNIQUE constraint
 * plus a single conditional UPDATE inside a serializable-enough
 * read-modify-write done as one round trip via `updateMany` with a `lt`
 * filter on usageCount. Two concurrent requests racing for the last slot
 * will both attempt the UPDATE, but only one row-affecting UPDATE can
 * succeed per available slot because usageCount is re-checked in the WHERE
 * clause at the database level, not read-then-written in application code.
 */
export async function tryConsumeDailyUsage(userId: string): Promise<{ remaining: number | null; limit: number | null }> {
  const date = todayUtcMidnight();
  const limit = await effectiveLimitFor(userId);

  // Ensure the row exists first (idempotent, count stays 0 if new).
  await db.dailyUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, usageCount: 0 },
    update: {},
  });

  if (limit === null) {
    // Unlimited VIP: still track usage for stats, but never block.
    const updated = await db.dailyUsage.update({
      where: { userId_date: { userId, date } },
      data: { usageCount: { increment: 1 } },
    });
    return { remaining: null, limit: null };
  }

  // The critical atomic step: only increments if usageCount < limit,
  // evaluated by Postgres itself, not by application logic reading a
  // stale count.
  const result = await db.dailyUsage.updateMany({
    where: {
      userId,
      date,
      usageCount: { lt: limit },
    },
    data: {
      usageCount: { increment: 1 },
    },
  });

  if (result.count === 0) {
    throw new DailyLimitExceededError(limit);
  }

  const current = await db.dailyUsage.findUniqueOrThrow({
    where: { userId_date: { userId, date } },
  });

  return { remaining: Math.max(limit - current.usageCount, 0), limit };
}

export async function getUsageStatus(userId: string) {
  const date = todayUtcMidnight();
  const limit = await effectiveLimitFor(userId);
  const row = await db.dailyUsage.findUnique({ where: { userId_date: { userId, date } } });
  const used = row?.usageCount ?? 0;
  return {
    used,
    limit, // null = unlimited
    remaining: limit === null ? null : Math.max(limit - used, 0),
  };
}

/** Owner action: reset a user's usage for today. */
export async function resetUsageForUser(userId: string) {
  const date = todayUtcMidnight();
  await db.dailyUsage.upsert({
    where: { userId_date: { userId, date } },
    create: { userId, date, usageCount: 0 },
    update: { usageCount: 0 },
  });
}
