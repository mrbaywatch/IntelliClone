/**
 * Abstract base class for LLM providers.
 * Implementations should wrap the Vercel AI SDK for consistency.
 */
export class BaseLLMProvider {
    /**
     * Get a specific model config by ID
     */
    getModel(modelId) {
        return this.models.find((m) => m.modelId === modelId);
    }
    /**
     * List all available models
     */
    listModels() {
        return this.models;
    }
    /**
     * Validate that the provider can handle the request
     */
    validateRequest(request) {
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
    provider;
    code;
    statusCode;
    retryable;
    constructor(message, provider, code, statusCode, retryable = false) {
        super(message);
        this.provider = provider;
        this.code = code;
        this.statusCode = statusCode;
        this.retryable = retryable;
        this.name = 'ProviderError';
    }
    static fromError(error, provider) {
        if (error instanceof ProviderError) {
            return error;
        }
        const message = error instanceof Error ? error.message : String(error);
        // Check for common error patterns
        if (message.includes('rate limit') || message.includes('429')) {
            return new ProviderError(message, provider, 'RATE_LIMITED', 429, true);
        }
        if (message.includes('unauthorized') || message.includes('401')) {
            return new ProviderError(message, provider, 'UNAUTHORIZED', 401, false);
        }
        if (message.includes('timeout') || message.includes('ETIMEDOUT')) {
            return new ProviderError(message, provider, 'TIMEOUT', undefined, true);
        }
        return new ProviderError(message, provider);
    }
}
//# sourceMappingURL=base.js.map