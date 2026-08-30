import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const hasUpstashConfig =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

const upstashLimiter = hasUpstashConfig
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      analytics: true,
      prefix: "jbs-referral",
    })
  : null;

// In-memory fallback for local dev only — resets on process restart and does
// not work across multiple server instances. Never relied on in production;
// UPSTASH_REDIS_REST_URL/TOKEN must be set before deploying.
const memoryHits = new Map<string, { count: number; resetAt: number }>();
const MEMORY_LIMIT = 5;
const MEMORY_WINDOW_MS = 10 * 60 * 1000;

function memoryRateLimit(key: string) {
  const now = Date.now();
  const entry = memoryHits.get(key);

  if (!entry || entry.resetAt < now) {
    memoryHits.set(key, { count: 1, resetAt: now + MEMORY_WINDOW_MS });
    return { success: true, remaining: MEMORY_LIMIT - 1 };
  }

  entry.count += 1;
  const success = entry.count <= MEMORY_LIMIT;
  return { success, remaining: Math.max(0, MEMORY_LIMIT - entry.count) };
}

export async function checkReferralRateLimit(identifier: string) {
  if (upstashLimiter) {
    const { success, remaining } = await upstashLimiter.limit(identifier);
    return { success, remaining };
  }

  if (process.env.NODE_ENV === "production") {
    console.error(
      "Rate limiting is not configured (missing Upstash env vars) while running in production.",
    );
  }
  return memoryRateLimit(identifier);
}
