import type { CostEstimate, Message, ModelConfig, TokenUsage } from '../types/index.js';
/**
 * Simple token estimator using character/word ratios
 * For production, consider using tiktoken or similar
 */
export declare class TokenCounter {
    private static readonly TOKENS_PER_CHAR;
    /**
     * Estimate token count for a string
     */
    static estimate(text: string, language?: string): number;
    /**
     * Estimate token count for messages
     */
    static estimateMessages(messages: Message[], language?: string): number;
    /**
     * Estimate cost for a given token usage and model
     */
    static estimateCost(usage: TokenUsage, model: ModelConfig): CostEstimate;
    /**
     * Estimate cost for a request before sending
     */
    static estimateRequestCost(messages: Message[], systemPrompt: string | undefined, expectedOutputTokens: number, model: ModelConfig, language?: string): CostEstimate;
    /**
     * Check if content exceeds model's context window
     */
    static checkContextLimit(messages: Message[], systemPrompt: string | undefined, model: ModelConfig, language?: string): {
        fits: boolean;
        estimated: number;
        limit: number;
        remaining: number;
    };
}
/**
 * Format cost for display
 */
export declare function formatCost(cost: CostEstimate): string;
/**
 * Format token count for display
 */
export declare function formatTokens(count: number): string;
/**
 * Calculate cost per 1000 tokens for comparison
 */
export declare function calculateBlendedRate(model: ModelConfig, inputRatio?: number): number;
/**
 * Compare costs between models for the same request
 */
export declare function compareCosts(usage: TokenUsage, models: ModelConfig[]): Array<{
    model: ModelConfig;
    cost: CostEstimate;
}>;
//# sourceMappingURL=counter.d.ts.map