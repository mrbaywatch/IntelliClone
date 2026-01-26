import type { ChatRequest, ChatResponse, ModelConfig, StreamCallbacks, StreamChunk } from '../types/index.js';
/**
 * Abstract base class for LLM providers.
 * Implementations should wrap the Vercel AI SDK for consistency.
 */
export declare abstract class BaseLLMProvider {
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
    abstract chat(request: ChatRequest, modelId?: string): Promise<ChatResponse>;
    /**
     * Stream a chat completion
     */
    abstract streamChat(request: ChatRequest, callbacks: StreamCallbacks, modelId?: string): Promise<void>;
    /**
     * Create an async generator for streaming
     */
    abstract streamChatGenerator(request: ChatRequest, modelId?: string): AsyncGenerator<StreamChunk>;
    /**
     * Get the default model for this provider
     */
    abstract getDefaultModel(): ModelConfig;
    /**
     * Get a specific model config by ID
     */
    getModel(modelId: string): ModelConfig | undefined;
    /**
     * List all available models
     */
    listModels(): ModelConfig[];
    /**
     * Validate that the provider can handle the request
     */
    protected validateRequest(request: ChatRequest): void;
}
/**
 * Provider error with additional context
 */
export declare class ProviderError extends Error {
    readonly provider: string;
    readonly code?: string | undefined;
    readonly statusCode?: number | undefined;
    readonly retryable: boolean;
    constructor(message: string, provider: string, code?: string | undefined, statusCode?: number | undefined, retryable?: boolean);
    static fromError(error: unknown, provider: string): ProviderError;
}
//# sourceMappingURL=base.d.ts.map