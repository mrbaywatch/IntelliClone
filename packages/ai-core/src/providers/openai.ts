import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';
import type {
  ChatRequest,
  ChatResponse,
  ModelConfig,
  StreamCallbacks,
  StreamChunk,
  TokenUsage,
} from '../types/index.js';
import { BaseLLMProvider, ProviderError } from './base.js';

const OPENAI_MODELS: ModelConfig[] = [
  {
    provider: 'openai',
    modelId: 'gpt-4o',
    displayName: 'GPT-4o',
    tier: 'powerful',
    maxTokens: 16384,
    contextWindow: 128000,
    inputCostPer1k: 0.005,
    outputCostPer1k: 0.015,
    supportedTasks: ['chat', 'completion', 'code', 'analysis', 'creative', 'translation', 'summarization', 'extraction'],
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    provider: 'openai',
    modelId: 'gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    tier: 'fast',
    maxTokens: 16384,
    contextWindow: 128000,
    inputCostPer1k: 0.00015,
    outputCostPer1k: 0.0006,
    supportedTasks: ['chat', 'completion', 'code', 'analysis', 'creative', 'translation', 'summarization', 'extraction'],
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    provider: 'openai',
    modelId: 'gpt-4-turbo',
    displayName: 'GPT-4 Turbo',
    tier: 'balanced',
    maxTokens: 4096,
    contextWindow: 128000,
    inputCostPer1k: 0.01,
    outputCostPer1k: 0.03,
    supportedTasks: ['chat', 'completion', 'code', 'analysis', 'creative', 'translation', 'summarization', 'extraction'],
    supportsStreaming: true,
    supportsVision: true,
  },
  {
    provider: 'openai',
    modelId: 'o1-preview',
    displayName: 'O1 Preview',
    tier: 'powerful',
    maxTokens: 32768,
    contextWindow: 128000,
    inputCostPer1k: 0.015,
    outputCostPer1k: 0.06,
    supportedTasks: ['code', 'analysis', 'extraction'],
    supportsStreaming: false,
    supportsVision: false,
  },
  {
    provider: 'openai',
    modelId: 'o1-mini',
    displayName: 'O1 Mini',
    tier: 'balanced',
    maxTokens: 65536,
    contextWindow: 128000,
    inputCostPer1k: 0.003,
    outputCostPer1k: 0.012,
    supportedTasks: ['code', 'analysis'],
    supportsStreaming: false,
    supportsVision: false,
  },
];

export class OpenAIProvider extends BaseLLMProvider {
  readonly providerName = 'openai';
  readonly models = OPENAI_MODELS;

  private client: ReturnType<typeof createOpenAI> | null = null;

  private getClient() {
    if (!this.client) {
      const apiKey = this.getApiKey();
      if (!apiKey) {
        throw new ProviderError(
          'OPENAI_API_KEY is not set',
          'openai',
          'MISSING_API_KEY'
        );
      }
      this.client = createOpenAI({ apiKey });
    }
    return this.client;
  }

  isConfigured(): boolean {
    return !!this.getApiKey();
  }

  getApiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  getDefaultModel(): ModelConfig {
    return OPENAI_MODELS.find((m) => m.modelId === 'gpt-4o-mini')!;
  }

  async chat(request: ChatRequest, modelId?: string): Promise<ChatResponse> {
    this.validateRequest(request);

    const model = modelId
      ? this.getModel(modelId)
      : this.getDefaultModel();

    if (!model) {
      throw new ProviderError(
        `Model ${modelId} not found`,
        'openai',
        'MODEL_NOT_FOUND'
      );
    }

    try {
      const client = this.getClient();
      const messages = request.systemPrompt
        ? [{ role: 'system' as const, content: request.systemPrompt }, ...request.messages]
        : request.messages;

      const result = await generateText({
        model: client(model.modelId),
        messages: messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        maxOutputTokens: request.maxTokens,
        temperature: request.temperature,
        topP: request.topP,
        frequencyPenalty: request.frequencyPenalty,
        presencePenalty: request.presencePenalty,
        stopSequences: request.stop,
      });

      const usage: TokenUsage = extractUsage(result.usage);

      return {
        content: result.text,
        finishReason: result.finishReason === 'stop' ? 'stop' : 'length',
        usage,
        model: model.modelId,
        provider: 'openai',
      };
    } catch (error) {
      throw ProviderError.fromError(error, 'openai');
    }
  }

  async streamChat(
    request: ChatRequest,
    callbacks: StreamCallbacks,
    modelId?: string
  ): Promise<void> {
    this.validateRequest(request);

    const model = modelId
      ? this.getModel(modelId)
      : this.getDefaultModel();

    if (!model) {
      throw new ProviderError(
        `Model ${modelId} not found`,
        'openai',
        'MODEL_NOT_FOUND'
      );
    }

    if (!model.supportsStreaming) {
      throw new ProviderError(
        `Model ${model.modelId} does not support streaming`,
        'openai',
        'STREAMING_NOT_SUPPORTED'
      );
    }

    try {
      const client = this.getClient();
      const messages = request.systemPrompt
        ? [{ role: 'system' as const, content: request.systemPrompt }, ...request.messages]
        : request.messages;

      callbacks.onStart?.();

      const result = streamText({
        model: client(model.modelId),
        messages: messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        maxOutputTokens: request.maxTokens,
        temperature: request.temperature,
        topP: request.topP,
        frequencyPenalty: request.frequencyPenalty,
        presencePenalty: request.presencePenalty,
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
        provider: 'openai',
      });
    } catch (error) {
      const providerError = ProviderError.fromError(error, 'openai');
      callbacks.onError?.(providerError);
      throw providerError;
    }
  }

  async *streamChatGenerator(
    request: ChatRequest,
    modelId?: string
  ): AsyncGenerator<StreamChunk> {
    this.validateRequest(request);

    const model = modelId
      ? this.getModel(modelId)
      : this.getDefaultModel();

    if (!model) {
      throw new ProviderError(
        `Model ${modelId} not found`,
        'openai',
        'MODEL_NOT_FOUND'
      );
    }

    if (!model.supportsStreaming) {
      throw new ProviderError(
        `Model ${model.modelId} does not support streaming`,
        'openai',
        'STREAMING_NOT_SUPPORTED'
      );
    }

    try {
      const client = this.getClient();
      const messages = request.systemPrompt
        ? [{ role: 'system' as const, content: request.systemPrompt }, ...request.messages]
        : request.messages;

      const result = streamText({
        model: client(model.modelId),
        messages: messages.map((m) => ({
          role: m.role as 'system' | 'user' | 'assistant',
          content: m.content,
        })),
        maxOutputTokens: request.maxTokens,
        temperature: request.temperature,
        topP: request.topP,
        frequencyPenalty: request.frequencyPenalty,
        presencePenalty: request.presencePenalty,
        stopSequences: request.stop,
      });

      for await (const chunk of result.textStream) {
        yield { type: 'text', content: chunk };
      }

      const usage = extractUsage(await result.usage);
      yield { type: 'done', usage };
    } catch (error) {
      yield { type: 'error', error: ProviderError.fromError(error, 'openai') };
    }
  }
}

// Helper to extract usage from various SDK versions
function extractUsage(usage: unknown): TokenUsage {
  if (!usage || typeof usage !== 'object') {
    return { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  }
  
  const u = usage as Record<string, unknown>;
  
  // Handle both v3 (promptTokens) and v4 (inputTokens) naming
  const promptTokens = (u.promptTokens ?? u.inputTokens ?? 0) as number;
  const completionTokens = (u.completionTokens ?? u.outputTokens ?? 0) as number;
  
  return {
    promptTokens,
    completionTokens,
    totalTokens: promptTokens + completionTokens,
  };
}
