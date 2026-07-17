/**
 * Rate Limiter Abstraction
 * Currently uses an in-memory Map for single-instance deployments.
 * For multi-server/serverless (e.g. Vercel), replace this implementation with Upstash Redis.
 */
class RateLimiter {
  constructor() {
    this.store = new Map();
  }

  /**
   * @param {string} identifier - e.g. IP address or user ID
   * @param {number} limit - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {object} { success: boolean, limit: number, remaining: number, reset: number }
   */
  async check(identifier, limit = 5, windowMs = 60000) {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
    const record = this.store.get(identifier) || { count: 0, resetTime: now + windowMs };

    // Reset if window has passed
    if (now > record.resetTime) {
      record.count = 0;
      record.resetTime = now + windowMs;
    }

    record.count++;
    this.store.set(identifier, record);

    const isRateLimited = record.count > limit;
    
    return {
      success: !isRateLimited,
      limit,
      remaining: Math.max(0, limit - record.count),
      reset: record.resetTime,
    };
  }
}

// Export a singleton instance
export const rateLimiter = new RateLimiter();

// Helper to extract IP from Next.js request
export function getIp(req) {
  return req.ip || req.headers?.get('x-forwarded-for') || '127.0.0.1';
}
