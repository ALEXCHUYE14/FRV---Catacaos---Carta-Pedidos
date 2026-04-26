// ═══════════════════════════════════════════════════════════════════════════════
// FRV CATACAOS — RATE LIMITER
// Prevents order spam and API abuse
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generic rate limiter for client-side operations
 */
export class RateLimiter {
  /**
   * @param {number} maxCalls - Maximum allowed calls
   * @param {number} windowMs - Time window in milliseconds
   */
  constructor(maxCalls, windowMs) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
    this.calls = [];
  }

  /**
   * Check if an action is allowed (returns false if rate limited)
   * @returns {boolean} True if allowed
   */
  check() {
    const now = Date.now();
    // Remove expired calls
    this.calls = this.calls.filter(timestamp => now - timestamp < this.windowMs);
    
    if (this.calls.length >= this.maxCalls) {
      return false;
    }
    
    this.calls.push(now);
    return true;
  }

  /**
   * Get remaining calls in current window
   * @returns {number} Remaining calls
   */
  getRemaining() {
    const now = Date.now();
    this.calls = this.calls.filter(timestamp => now - timestamp < this.windowMs);
    return Math.max(0, this.maxCalls - this.calls.length);
  }

  /**
   * Get time until next available call
   * @returns {number} Milliseconds until reset
   */
  getTimeUntilReset() {
    if (this.calls.length < this.maxCalls) return 0;
    const now = Date.now();
    const oldestCall = this.calls[0];
    return Math.max(0, this.windowMs - (now - oldestCall));
  }

  /**
   * Reset all calls (force clear)
   */
  reset() {
    this.calls = [];
  }
}

/**
 * Order rate limiter — 3 orders per minute per session
 */
export const orderRateLimiter = new RateLimiter(3, 60 * 1000);

/**
 * Table selection rate limiter — prevent rapid switching
 */
export const tableRateLimiter = new RateLimiter(2, 1000);

/**
 * WhatsApp send rate limiter — prevent spam
 */
export const waRateLimiter = new RateLimiter(5, 60 * 1000);
