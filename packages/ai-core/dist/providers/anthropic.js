import { createAnthropic } from '@ai-sdk/anthropic';
import { generateText, streamText } from 'ai';
import { BaseLLMProvider, ProviderError } from './base.js';
const ANTHROPIC_MODELS = [
    {
        provider: 'anthropic',
        modelId: 'claude-sonnet-4-20250514',
        displayName: 'Claude Sonnet 4',
        tier: 'balanced',
        maxTokens: 8192,
        contextWindow: 200000,
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015,
        supportedTasks: ['chat', 'completion', 'code', 'analysis', 'creative', 'translation', 'summarization', 'extraction'],
        supportsStreaming: true,
        supportsVision: true,
    },
    {
        provider: 'anthropic',
        modelId: 'claude-opus-4-20250514',
        displayName: 'Claude Opus 4',
        tier: 'powerful',
        maxTokens: 8192,
        contextWindow: 200000,
        inputCostPer1k: 0.015,
        outputCostPer1k: 0.075,
        supportedTasks: ['chat', 'completion', 'code', 'analysis', 'creative', 'translation', 'summarization', 'extraction'],
        supportsStreaming: true,
        supportsVision: true,
    },
    {
        provider: 'anthropic',
        modelId: 'claude-3-5-sonnet-20241022',
        displayName: 'Claude 3.5 Sonnet',
        tier: 'balanced',
        maxTokens: 8192,
        contextWindow: 200000,
        inputCostPer1k: 0.003,
        outputCostPer1k: 0.015,
        supportedTasks: ['chat', 'completion', 'code', 'analysis', 'creative', 'translation', 'summarization', 'extraction'],
        supportsStreaming: true,
        supportsVision: true,
    },
    {
        provider: 'anthropic',
        modelId: 'claude-3-5-haiku-20241022',
        displayName: 'Claude 3.5 Haiku',
        tier: 'fast',
        maxTokens: 8192,
        contextWindow: 200000,
        inputCostPer1k: 0.001,
        outputCostPer1k: 0.005,
        supportedTasks: ['chat', 'completion', 'code', 'analysis', 'creative', 'translation', 'summarization', 'extraction'],
        supportsStreaming: true,
        supportsVision: true,
    },
    {
        provider: 'anthropic',
        modelId: 'claude-3-opus-20240229',
        displayName: 'Claude 3 Opus',
        tier: 'powerful',
        maxTokens: 4096,
        contextWindow: 200000,
        inputCostPer1k: 0.015,
        outputCostPer1k: 0.075,
        supportedTasks: ['chat', 'completion', 'code', 'analysis', 'creative', 'translation', 'summarization', 'extraction'],
        supportsStreaming: true,
        supportsVision: true,
    },
];
export class AnthropicProvider extends BaseLLMProvider {
    providerName = 'anthropic';
    models = ANTHROPIC_MODELS;
    client = null;
    getClient() {
        if (!this.client) {
            const apiKey = this.getApiKey();
            if (!apiKey) {
                throw new ProviderError('ANTHROPIC_API_KEY is not set', 'anthropic', 'MISSING_API_KEY');
            }
            this.client = createAnthropic({ apiKey });
        }
        return this.client;
    }
    isConfigured() {
        return !!this.getApiKey();
    }
    getApiKey() {
        return process.env.ANTHROPIC_API_KEY;
    }
    getDefaultModel() {
        return ANTHROPIC_MODELS.find((m) => m.modelId === 'claude-3-5-haiku-20241022');
    }
    async chat(request, modelId) {
        this.validateRequest(request);
        const model = modelId
            ? this.getModel(modelId)
            : this.getDefaultModel();
        if (!model) {
            throw new ProviderError(`Model ${modelId} not found`, 'anthropic', 'MODEL_NOT_FOUND');
        }
        try {
            const client = this.getClient();
            // Anthropic requires system prompt to be separate
            const systemPrompt = request.systemPrompt ||
                request.messages.find(m => m.role === 'system')?.content;
            const messages = request.messages.filter(m => m.role !== 'system');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await generateText({
                model: client(model.modelId),
                system: systemPrompt,
                messages: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                maxOutputTokens: request.maxTokens ?? model.maxTokens,
                temperature: request.temperature,
                topP: request.topP,
                stopSequences: request.stop,
            });
            const usage = extractUsage(result.usage);
            return {
                content: result.text,
                finishReason: result.finishReason === 'stop' ? 'stop' : 'length',
                usage,
                model: model.modelId,
                provider: 'anthropic',
            };
        }
        catch (error) {
            throw ProviderError.fromError(error, 'anthropic');
        }
    }
    async streamChat(request, callbacks, modelId) {
        this.validateRequest(request);
        const model = modelId
            ? this.getModel(modelId)
            : this.getDefaultModel();
        if (!model) {
            throw new ProviderError(`Model ${modelId} not found`, 'anthropic', 'MODEL_NOT_FOUND');
        }
        try {
            const client = this.getClient();
            const systemPrompt = request.systemPrompt ||
                request.messages.find(m => m.role === 'system')?.content;
            const messages = request.messages.filter(m => m.role !== 'system');
            callbacks.onStart?.();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = streamText({
                model: client(model.modelId),
                system: systemPrompt,
                messages: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                maxOutputTokens: request.maxTokens ?? model.maxTokens,
                temperature: request.temperature,
                topP: request.topP,
                stopSequences: request.stop,
            });
            let fullContent = '';
            for await (const chunk of result.textStream) {
                fullContent += chunk;
                callbacks.onToken?.(chunk);
            }
            const usage = extractUsage(await result.usage);
            callbacks.onComplete?.({
                content: fullContent,
                finishReason: 'stop',
                usage,
                model: model.modelId,
                provider: 'anthropic',
            });
        }
        catch (error) {
            const providerError = ProviderError.fromError(error, 'anthropic');
            callbacks.onError?.(providerError);
            throw providerError;
        }
    }
    async *streamChatGenerator(request, modelId) {
        this.validateRequest(request);
        const model = modelId
            ? this.getModel(modelId)
            : this.getDefaultModel();
        if (!model) {
            throw new ProviderError(`Model ${modelId} not found`, 'anthropic', 'MODEL_NOT_FOUND');
        }
        try {
            const client = this.getClient();
            const systemPrompt = request.systemPrompt ||
                request.messages.find(m => m.role === 'system')?.content;
            const messages = request.messages.filter(m => m.role !== 'system');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = streamText({
                model: client(model.modelId),
                system: systemPrompt,
                messages: messages.map((m) => ({
                    role: m.role,
                    content: m.content,
                })),
                maxOutputTokens: request.maxTokens ?? model.maxTokens,
                temperature: request.temperature,
                topP: request.topP,
                stopSequences: request.stop,
            });
            for await (const chunk of result.textStream) {
                yield { type: 'text', content: chunk };
            }
            const usage = extractUsage(await result.usage);
            yield { type: 'done', usage };
        }
        catch (error) {
            yield { type: 'error', error: ProviderError.fromError(error, 'anthropic') };
        }
    }
}
// Helper to extract usage from various SDK versions
function extractUsage(usage) {
    if (!usage || typeof usage !== 'object') {
        return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    }
    const u = usage;
    // Handle both v3 (promptTokens) and v4 (inputTokens) naming
    const promptTokens = (u.promptTokens ?? u.inputTokens ?? 0);
    const completionTokens = (u.completionTokens ?? u.outputTokens ?? 0);
    return {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
    };
}
//# sourceMappingURL=anthropic.js.map