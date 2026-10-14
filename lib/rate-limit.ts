type Bucket = {
  lastRequestAt: number;
  windowStart: number;
  count: number;
};

const buckets = new Map<string, Bucket>();
const COOLDOWN_MS = 12_000;
const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 8;

function prune(now: number) {
  if (buckets.size < 2_000) return;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRequestAt > WINDOW_MS) buckets.delete(key);
  }
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  return ip || request.headers.get("x-real-ip") || "anonymous";
}

export function checkRateLimit(key: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  prune(now);
  const existing = buckets.get(key);
  if (!existing) {
    buckets.set(key, { lastRequestAt: now, windowStart: now, count: 1 });
    return { ok: true };
  }

  if (now - existing.windowStart > WINDOW_MS) {
    existing.windowStart = now;
    existing.count = 0;
  }

  const waitMs = COOLDOWN_MS - (now - existing.lastRequestAt);
  if (waitMs > 0) {
    return { ok: false, retryAfterSec: Math.ceil(waitMs / 1000) };
  }

  if (existing.count >= MAX_PER_WINDOW) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - existing.windowStart)) / 1000);
    return { ok: false, retryAfterSec };
  }

  existing.lastRequestAt = now;
  existing.count += 1;
  return { ok: true };
}
