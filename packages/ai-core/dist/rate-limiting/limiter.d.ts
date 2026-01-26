import type { RateLimitConfig, RateLimitResult, RateLimitState } from '../types/index.js';
/**
 * In-memory rate limiter using sliding window algorithm
 */
export declare class RateLimiter {
    private state;
    private config;
    constructor(config: RateLimitConfig);
    private createInitialState;
    private getStartOfDay;
    /**
     * Check if a request can proceed
     */
    check(estimatedTokens?: number): RateLimitResult;
    private checkMinuteWindow;
    private checkDayWindow;
    /**
     * Record a completed request
     */
    record(tokensUsed: number): void;
    /**
     * Clean up expired windows
     */
    private cleanupExpiredWindows;
    /**
     * Get current state for debugging/monitoring
     */
    getState(): Readonly<RateLimitState>;
    /**
     * Reset the limiter
     */
    reset(): void;
    /**
     * Update configuration
     */
    updateConfig(config: Partial<RateLimitConfig>): void;
}
/**
 * Rate limiter that stores state externally (for distributed systems)
 */
export declare class ExternalRateLimiter {
    private config;
    private getStateHandler;
    private setStateHandler;
    constructor(config: RateLimitConfig, stateHandler: {
        get: () => Promise<RateLimitState | null>;
        set: (state: RateLimitState) => Promise<void>;
    });
    check(estimatedTokens?: number): Promise<RateLimitResult>;
    record(tokensUsed: number): Promise<void>;
}
/**
 * Default rate limits for different providers
 */
export declare const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig>;
/**
 * Create a rate limiter with retry logic
 */
export declare function withRetry<T>(fn: () => Promise<T>, limiter: RateLimiter, options?: {
    maxRetries?: number;
    estimatedTokens?: number;
    onRetry?: (attempt: number, waitMs: number) => void;
}): Promise<T>;
//# sourceMappingURL=limiter.d.ts.map