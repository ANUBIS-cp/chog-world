// Simple in-memory rate limiter for serverless (per-instance)
// For production, use Redis or Upstash Ratelimit

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

export function rateLimit(key: string, max: number, windowMs: number): { success: boolean; resetAt: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, resetAt: now + windowMs };
  }

  if (entry.count >= max) {
    return { success: false, resetAt: entry.resetAt };
  }

  entry.count++;
  return { success: true, resetAt: entry.resetAt };
}
