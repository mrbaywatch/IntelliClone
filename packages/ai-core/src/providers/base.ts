import type {
  ChatRequest,
  ChatResponse,
  ModelConfig,
  StreamCallbacks,
  StreamChunk,
} from '../types/index.js';

/**
 * Abstract base class for LLM providers.
 * Implementations should wrap the Vercel AI SDK for consistency.
 */
export abstract class BaseLLMProvider {
  abstract readonly providerName: string;
  abstract readonly models: ModelConfig[];

  /**
   * Check if the provider is properly configured (has API keys, etc.)
   */
  abstract isConfigured(): boolean;

  /**
   * Get the API key for this provider from environment
   */
  abstract getApiKey(): string | undefined;

  /**
   * Send a chat completion request
   */
  abstract chat(
    request: ChatRequest,
    modelId?: string
  ): Promise<ChatResponse>;

  /**
   * Stream a chat completion
   */
  abstract streamChat(
    request: ChatRequest,
    callbacks: StreamCallbacks,
    modelId?: string
  ): Promise<void>;

  /**
   * Create an async generator for streaming
   */
  abstract streamChatGenerator(
    request: ChatRequest,
    modelId?: string
  ): AsyncGenerator<StreamChunk>;

  /**
   * Get the default model for this provider
   */
  abstract getDefaultModel(): ModelConfig;

  /**
   * Get a specific model config by ID
   */
  getModel(modelId: string): ModelConfig | undefined {
    return this.models.find((m) => m.modelId === modelId);
  }

  /**
   * List all available models
   */
  listModels(): ModelConfig[] {
    return this.models;
  }

  /**
   * Validate that the provider can handle the request
   */
  protected validateRequest(request: ChatRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new Error('Messages array is required and cannot be empty');
    }

    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new Error('Temperature must be between 0 and 2');
      }
    }

    if (request.maxTokens !== undefined && request.maxTokens <= 0) {
      throw new Error('maxTokens must be a positive number');
    }
  }
}

/**
 * Provider error with additional context
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly code?: string,
    public readonly statusCode?: number,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'ProviderError';
  }

  static fromError(error: unknown, provider: string): ProviderError {
    if (error instanceof ProviderError) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    
    // Check for common error patterns
    if (message.includes('rate limit') || message.includes('429')) {
      return new ProviderError(
        message,
        provider,
        'RATE_LIMITED',
        429,
        true
      );
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return new ProviderError(
        message,
        provider,
        'UNAUTHORIZED',
        401,
        false
      );
    }

    if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
      return new ProviderError(
        message,
        provider,
        'TIMEOUT',
        undefined,
        true
      );
    }

    return new ProviderError(message, provider);
  }
}
