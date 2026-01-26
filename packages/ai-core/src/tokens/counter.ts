import type { CostEstimate, Message, ModelConfig, TokenUsage } from '../types/index.js';

/**
 * Simple token estimator using character/word ratios
 * For production, consider using tiktoken or similar
 */
export class TokenCounter {
  // Average tokens per character for different languages
  private static readonly TOKENS_PER_CHAR: Record<string, number> = {
    en: 0.25, // ~4 chars per token
    no: 0.28, // Norwegian is slightly more token-dense
    de: 0.28,
    fr: 0.28,
    es: 0.27,
    default: 0.25,
  };

  /**
   * Estimate token count for a string
   */
  static estimate(text: string, language: string = 'en'): number {
    if (!text) return 0;

    const ratio = this.TOKENS_PER_CHAR[language] || this.TOKENS_PER_CHAR.default;
    return Math.ceil(text.length * ratio);
  }

  /**
   * Estimate token count for messages
   */
  static estimateMessages(messages: Message[], language: string = 'en'): number {
    let total = 0;

    for (const message of messages) {
      // Add overhead for message structure (~4 tokens per message)
      total += 4;
      total += this.estimate(message.content, language);
      
      if (message.name) {
        total += this.estimate(message.name, language);
      }
    }

    // Add base overhead (~3 tokens)
    total += 3;

    return total;
  }

  /**
   * Estimate cost for a given token usage and model
   */
  static estimateCost(usage: TokenUsage, model: ModelConfig): CostEstimate {
    const inputCost = (usage.promptTokens / 1000) * model.inputCostPer1k;
    const outputCost = (usage.completionTokens / 1000) * model.outputCostPer1k;

    return {
      inputCost: Math.round(inputCost * 1000000) / 1000000, // Round to 6 decimal places
      outputCost: Math.round(outputCost * 1000000) / 1000000,
      totalCost: Math.round((inputCost + outputCost) * 1000000) / 1000000,
      currency: 'USD',
    };
  }

  /**
   * Estimate cost for a request before sending
   */
  static estimateRequestCost(
    messages: Message[],
    systemPrompt: string | undefined,
    expectedOutputTokens: number,
    model: ModelConfig,
    language: string = 'en'
  ): CostEstimate {
    let promptTokens = this.estimateMessages(messages, language);
    
    if (systemPrompt) {
      promptTokens += this.estimate(systemPrompt, language);
    }

    return this.estimateCost(
      {
        promptTokens,
        completionTokens: expectedOutputTokens,
        totalTokens: promptTokens + expectedOutputTokens,
      },
      model
    );
  }

  /**
   * Check if content exceeds model's context window
   */
  static checkContextLimit(
    messages: Message[],
    systemPrompt: string | undefined,
    model: ModelConfig,
    language: string = 'en'
  ): { fits: boolean; estimated: number; limit: number; remaining: number } {
    let estimated = this.estimateMessages(messages, language);
    
    if (systemPrompt) {
      estimated += this.estimate(systemPrompt, language);
    }

    // Reserve space for output
    const reservedForOutput = model.maxTokens;
    const effectiveLimit = model.contextWindow - reservedForOutput;

    return {
      fits: estimated <= effectiveLimit,
      estimated,
      limit: effectiveLimit,
      remaining: Math.max(0, effectiveLimit - estimated),
    };
  }
}

/**
 * Format cost for display
 */
export function formatCost(cost: CostEstimate): string {
  if (cost.totalCost < 0.01) {
    return `$${(cost.totalCost * 100).toFixed(4)}¢`;
  }
  return `$${cost.totalCost.toFixed(4)}`;
}

/**
 * Format token count for display
 */
export function formatTokens(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return String(count);
}

/**
 * Calculate cost per 1000 tokens for comparison
 */
export function calculateBlendedRate(model: ModelConfig, inputRatio: number = 0.7): number {
  // Typical ratio: 70% input, 30% output
  const outputRatio = 1 - inputRatio;
  return model.inputCostPer1k * inputRatio + model.outputCostPer1k * outputRatio;
}

/**
 * Compare costs between models for the same request
 */
export function compareCosts(
  usage: TokenUsage,
  models: ModelConfig[]
): Array<{ model: ModelConfig; cost: CostEstimate }> {
  return models
    .map((model) => ({
      model,
      cost: TokenCounter.estimateCost(usage, model),
    }))
    .sort((a, b) => a.cost.totalCost - b.cost.totalCost);
}
