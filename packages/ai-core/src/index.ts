// =============================================================================
// @kit/ai-core - LLM Routing and AI Operations for Intelli Products
// =============================================================================

// Types
export * from './types/index.js';

// Providers
export {
  BaseLLMProvider,
  ProviderError,
  OpenAIProvider,
  AnthropicProvider,
  ModelRouter,
  modelRouter,
} from './providers/index.js';

// Prompts
export {
  SystemPromptBuilder,
  createSystemPrompt,
  PromptTemplates,
  createProductPrompt,
} from './prompts/index.js';

// Streaming
export {
  StreamHandler,
  streamToReadableStream,
  streamToSSE,
  collectStream,
  createDelayedStream,
  createBufferedStream,
  createTimedCallbacks,
  type StreamMetrics,
} from './streaming/index.js';

// Tokens
export {
  TokenCounter,
  formatCost,
  formatTokens,
  calculateBlendedRate,
  compareCosts,
} from './tokens/index.js';

// Rate Limiting
export {
  RateLimiter,
  ExternalRateLimiter,
  DEFAULT_RATE_LIMITS,
  withRetry,
} from './rate-limiting/index.js';

// =============================================================================
// Convenience re-exports from Vercel AI SDK
// =============================================================================
export { generateText, streamText } from 'ai';
