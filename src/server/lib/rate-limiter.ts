/**
 * In-memory sliding window rate limiter for Day 1 Foundation.
 * Provides brute-force protection for login and sensitive operations.
 */

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

export class RateLimiter {
  /**
   * Check whether an action exceeds the rate limit.
   * @param key Unique key (e.g. `login:ip:email`)
   * @param limit Maximum allowed occurrences in the window
   * @param windowMs Time window in milliseconds (default: 15 minutes)
   */
  static check(key: string, limit = 5, windowMs = 15 * 60 * 1000): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowStart = now - windowMs;

    const record = memoryStore.get(key) || { timestamps: [] };
    // Filter timestamps within current window
    const validTimestamps = record.timestamps.filter((t) => t > windowStart);

    if (validTimestamps.length >= limit) {
      return { allowed: false, remaining: 0 };
    }

    validTimestamps.push(now);
    memoryStore.set(key, { timestamps: validTimestamps });

    return {
      allowed: true,
      remaining: limit - validTimestamps.length,
    };
  }

  /**
   * Clears attempts for a specific key (e.g. after successful login).
   */
  static reset(key: string): void {
    memoryStore.delete(key);
  }
}
