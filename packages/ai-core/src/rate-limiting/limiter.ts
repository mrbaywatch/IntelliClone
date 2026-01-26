import type { RateLimitConfig, RateLimitResult, RateLimitState } from '../types/index.js';

/**
 * In-memory rate limiter using sliding window algorithm
 */
export class RateLimiter {
  private state: RateLimitState;
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.state = this.createInitialState();
  }

  private createInitialState(): RateLimitState {
    const now = Date.now();
    return {
      requestCount: 0,
      tokenCount: 0,
      windowStart: now,
      dailyRequestCount: 0,
      dailyTokenCount: 0,
      dayStart: this.getStartOfDay(now),
    };
  }

  private getStartOfDay(timestamp: number): number {
    const date = new Date(timestamp);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }

  /**
   * Check if a request can proceed
   */
  check(estimatedTokens: number = 0): RateLimitResult {
    this.cleanupExpiredWindows();

    const minuteAllowed = this.checkMinuteWindow(estimatedTokens);
    const dayAllowed = this.checkDayWindow(estimatedTokens);

    if (!minuteAllowed.allowed) {
      return minuteAllowed;
    }

    if (!dayAllowed.allowed) {
      return dayAllowed;
    }

    return {
      allowed: true,
      remaining: {
        requests: Math.min(
          this.config.requestsPerMinute - this.state.requestCount - 1,
          (this.config.requestsPerDay ?? Infinity) - (this.state.dailyRequestCount ?? 0) - 1
        ),
        tokens: Math.min(
          this.config.tokensPerMinute - this.state.tokenCount - estimatedTokens,
          (this.config.tokensPerDay ?? Infinity) - (this.state.dailyTokenCount ?? 0) - estimatedTokens
        ),
      },
    };
  }

  private checkMinuteWindow(estimatedTokens: number): RateLimitResult {
    if (this.state.requestCount >= this.config.requestsPerMinute) {
      const retryAfterMs = 60000 - (Date.now() - this.state.windowStart);
      return {
        allowed: false,
        retryAfterMs: Math.max(0, retryAfterMs),
        remaining: { requests: 0, tokens: 0 },
      };
    }

    if (this.state.tokenCount + estimatedTokens > this.config.tokensPerMinute) {
      const retryAfterMs = 60000 - (Date.now() - this.state.windowStart);
      return {
        allowed: false,
        retryAfterMs: Math.max(0, retryAfterMs),
        remaining: {
          requests: this.config.requestsPerMinute - this.state.requestCount,
          tokens: 0,
        },
      };
    }

    return {
      allowed: true,
      remaining: {
        requests: this.config.requestsPerMinute - this.state.requestCount,
        tokens: this.config.tokensPerMinute - this.state.tokenCount,
      },
    };
  }

  private checkDayWindow(estimatedTokens: number): RateLimitResult {
    if (this.config.requestsPerDay !== undefined) {
      if ((this.state.dailyRequestCount ?? 0) >= this.config.requestsPerDay) {
        const nextDay = this.getStartOfDay(Date.now()) + 86400000;
        return {
          allowed: false,
          retryAfterMs: nextDay - Date.now(),
          remaining: { requests: 0, tokens: 0 },
        };
      }
    }

    if (this.config.tokensPerDay !== undefined) {
      if ((this.state.dailyTokenCount ?? 0) + estimatedTokens > this.config.tokensPerDay) {
        const nextDay = this.getStartOfDay(Date.now()) + 86400000;
        return {
          allowed: false,
          retryAfterMs: nextDay - Date.now(),
          remaining: {
            requests: (this.config.requestsPerDay ?? Infinity) - (this.state.dailyRequestCount ?? 0),
            tokens: 0,
          },
        };
      }
    }

    return {
      allowed: true,
      remaining: {
        requests: (this.config.requestsPerDay ?? Infinity) - (this.state.dailyRequestCount ?? 0),
        tokens: (this.config.tokensPerDay ?? Infinity) - (this.state.dailyTokenCount ?? 0),
      },
    };
  }

  /**
   * Record a completed request
   */
  record(tokensUsed: number): void {
    this.cleanupExpiredWindows();

    this.state.requestCount++;
    this.state.tokenCount += tokensUsed;

    if (this.state.dailyRequestCount !== undefined) {
      this.state.dailyRequestCount++;
    }
    if (this.state.dailyTokenCount !== undefined) {
      this.state.dailyTokenCount += tokensUsed;
    }
  }

  /**
   * Clean up expired windows
   */
  private cleanupExpiredWindows(): void {
    const now = Date.now();

    // Reset minute window if expired
    if (now - this.state.windowStart >= 60000) {
      this.state.windowStart = now;
      this.state.requestCount = 0;
      this.state.tokenCount = 0;
    }

    // Reset daily window if new day
    const todayStart = this.getStartOfDay(now);
    if (this.state.dayStart && todayStart > this.state.dayStart) {
      this.state.dayStart = todayStart;
      this.state.dailyRequestCount = 0;
      this.state.dailyTokenCount = 0;
    }
  }

  /**
   * Get current state for debugging/monitoring
   */
  getState(): Readonly<RateLimitState> {
    this.cleanupExpiredWindows();
    return { ...this.state };
  }

  /**
   * Reset the limiter
   */
  reset(): void {
    this.state = this.createInitialState();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Rate limiter that stores state externally (for distributed systems)
 */
export class ExternalRateLimiter {
  private config: RateLimitConfig;
  private getStateHandler: () => Promise<RateLimitState | null>;
  private setStateHandler: (state: RateLimitState) => Promise<void>;

  constructor(
    config: RateLimitConfig,
    stateHandler: {
      get: () => Promise<RateLimitState | null>;
      set: (state: RateLimitState) => Promise<void>;
    }
  ) {
    this.config = config;
    this.getStateHandler = stateHandler.get;
    this.setStateHandler = stateHandler.set;
  }

  async check(estimatedTokens: number = 0): Promise<RateLimitResult> {
    const existingState = await this.getStateHandler();
    const limiter = new RateLimiter(this.config);
    
    if (existingState) {
      // Apply existing state to temp limiter
      Object.assign(limiter['state'], existingState);
    }
    
    return limiter.check(estimatedTokens);
  }

  async record(tokensUsed: number): Promise<void> {
    const existingState = await this.getStateHandler();
    const limiter = new RateLimiter(this.config);
    
    if (existingState) {
      Object.assign(limiter['state'], existingState);
    }
    
    limiter.record(tokensUsed);
    await this.setStateHandler(limiter.getState() as RateLimitState);
  }
}

/**
 * Default rate limits for different providers
 */
export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  openai: {
    requestsPerMinute: 500,
    tokensPerMinute: 150000,
    requestsPerDay: 10000,
  },
  anthropic: {
    requestsPerMinute: 50,
    tokensPerMinute: 100000,
    requestsPerDay: 1000,
  },
  // Conservative defaults for users
  user_free: {
    requestsPerMinute: 10,
    tokensPerMinute: 10000,
    requestsPerDay: 100,
    tokensPerDay: 100000,
  },
  user_pro: {
    requestsPerMinute: 30,
    tokensPerMinute: 50000,
    requestsPerDay: 500,
    tokensPerDay: 500000,
  },
};

/**
 * Create a rate limiter with retry logic
 */
export function withRetry<T>(
  fn: () => Promise<T>,
  limiter: RateLimiter,
  options: {
    maxRetries?: number;
    estimatedTokens?: number;
    onRetry?: (attempt: number, waitMs: number) => void;
  } = {}
): Promise<T> {
  const { maxRetries = 3, estimatedTokens = 0, onRetry } = options;

  async function attempt(retryCount: number): Promise<T> {
    const result = limiter.check(estimatedTokens);

    if (!result.allowed) {
      if (retryCount >= maxRetries) {
        throw new Error(`Rate limit exceeded. Retry after ${result.retryAfterMs}ms`);
      }

      onRetry?.(retryCount + 1, result.retryAfterMs || 1000);
      await new Promise((resolve) => setTimeout(resolve, result.retryAfterMs || 1000));
      return attempt(retryCount + 1);
    }

    try {
      const response = await fn();
      limiter.record(estimatedTokens);
      return response;
    } catch (error) {
      // Check if it's a rate limit error from the provider
      if (error instanceof Error && error.message.includes('rate limit')) {
        if (retryCount >= maxRetries) {
          throw error;
        }

        const waitMs = Math.min(1000 * Math.pow(2, retryCount), 60000);
        onRetry?.(retryCount + 1, waitMs);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
        return attempt(retryCount + 1);
      }

      throw error;
    }
  }

  return attempt(0);
}
