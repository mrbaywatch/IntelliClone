import type {
  ChatRequest,
  ChatResponse,
  ModelConfig,
  ModelProvider,
  ModelTier,
  RoutingPreferences,
  StreamCallbacks,
  StreamChunk,
  TaskType,
} from '../types/index.js';
import { BaseLLMProvider, ProviderError } from './base.js';
import { OpenAIProvider } from './openai.js';
import { AnthropicProvider } from './anthropic.js';

/**
 * Model Router - Intelligently selects the best model for a given task
 */
export class ModelRouter {
  private providers: Map<ModelProvider, BaseLLMProvider> = new Map();

  constructor() {
    // Initialize providers
    this.providers.set('openai', new OpenAIProvider());
    this.providers.set('anthropic', new AnthropicProvider());
  }

  /**
   * Get all available providers
   */
  getProviders(): BaseLLMProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider
   */
  getProvider(name: ModelProvider): BaseLLMProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get all configured providers (those with API keys)
   */
  getConfiguredProviders(): BaseLLMProvider[] {
    return this.getProviders().filter((p) => p.isConfigured());
  }

  /**
   * Get all available models across all providers
   */
  getAllModels(): ModelConfig[] {
    return this.getProviders().flatMap((p) => p.listModels());
  }

  /**
   * Get all models that are currently usable (provider is configured)
   */
  getAvailableModels(): ModelConfig[] {
    return this.getConfiguredProviders().flatMap((p) => p.listModels());
  }

  /**
   * Select the best model based on task and preferences
   */
  selectModel(
    task: TaskType,
    preferences?: RoutingPreferences
  ): ModelConfig {
    const availableModels = this.getAvailableModels();

    if (availableModels.length === 0) {
      throw new ProviderError(
        'No providers are configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY.',
        'router',
        'NO_PROVIDERS'
      );
    }

    // Filter by task support
    let candidates = availableModels.filter((m) =>
      m.supportedTasks.includes(task)
    );

    if (candidates.length === 0) {
      // Fall back to all models if no task-specific ones
      candidates = availableModels;
    }

    // Filter by preferences
    if (preferences?.preferredProvider) {
      const filtered = candidates.filter(
        (m) => m.provider === preferences.preferredProvider
      );
      if (filtered.length > 0) {
        candidates = filtered;
      }
    }

    if (preferences?.tier) {
      const filtered = candidates.filter((m) => m.tier === preferences.tier);
      if (filtered.length > 0) {
        candidates = filtered;
      }
    }

    if (preferences?.requireStreaming) {
      candidates = candidates.filter((m) => m.supportsStreaming);
    }

    if (preferences?.requireVision) {
      candidates = candidates.filter((m) => m.supportsVision);
    }

    if (preferences?.maxCost !== undefined) {
      candidates = candidates.filter(
        (m) => m.outputCostPer1k <= preferences.maxCost!
      );
    }

    if (candidates.length === 0) {
      throw new ProviderError(
        'No models match the specified requirements',
        'router',
        'NO_MATCHING_MODELS'
      );
    }

    // Score and sort candidates
    const scored = candidates.map((model) => ({
      model,
      score: this.scoreModel(model, task, preferences?.tier),
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored[0].model;
  }

  /**
   * Score a model for a given task
   */
  private scoreModel(
    model: ModelConfig,
    task: TaskType,
    preferredTier?: ModelTier
  ): number {
    let score = 0;

    // Tier scoring
    if (preferredTier) {
      if (model.tier === preferredTier) {
        score += 100;
      }
    } else {
      // Default to balanced if no preference
      const tierScores: Record<ModelTier, number> = {
        fast: 60,
        balanced: 80,
        powerful: 70,
      };
      score += tierScores[model.tier];
    }

    // Task-specific scoring
    const taskModelAffinities: Partial<Record<TaskType, Partial<Record<string, number>>>> = {
      code: {
        'claude-sonnet-4-20250514': 20,
        'claude-3-5-sonnet-20241022': 18,
        'gpt-4o': 15,
        'o1-preview': 25,
        'o1-mini': 20,
      },
      analysis: {
        'claude-opus-4-20250514': 25,
        'claude-3-opus-20240229': 22,
        'o1-preview': 20,
        'gpt-4o': 15,
      },
      creative: {
        'claude-opus-4-20250514': 20,
        'claude-sonnet-4-20250514': 18,
        'gpt-4o': 15,
      },
      translation: {
        'gpt-4o': 15,
        'claude-3-5-sonnet-20241022': 18,
        'claude-sonnet-4-20250514': 20,
      },
      chat: {
        'gpt-4o-mini': 15,
        'claude-3-5-haiku-20241022': 18,
      },
    };

    const taskAffinity = taskModelAffinities[task]?.[model.modelId];
    if (taskAffinity) {
      score += taskAffinity;
    }

    // Cost efficiency (inverse - lower cost = higher score)
    const costScore = Math.max(0, 20 - model.outputCostPer1k * 100);
    score += costScore;

    // Context window bonus
    if (model.contextWindow >= 100000) {
      score += 5;
    }

    return score;
  }

  /**
   * Route and execute a chat request
   */
  async chat(
    request: ChatRequest,
    task: TaskType = 'chat',
    preferences?: RoutingPreferences
  ): Promise<ChatResponse> {
    const model = this.selectModel(task, preferences);
    const provider = this.providers.get(model.provider);

    if (!provider) {
      throw new ProviderError(
        `Provider ${model.provider} not found`,
        'router',
        'PROVIDER_NOT_FOUND'
      );
    }

    return provider.chat(request, model.modelId);
  }

  /**
   * Route and stream a chat request
   */
  async streamChat(
    request: ChatRequest,
    callbacks: StreamCallbacks,
    task: TaskType = 'chat',
    preferences?: RoutingPreferences
  ): Promise<void> {
    const model = this.selectModel(task, {
      ...preferences,
      requireStreaming: true,
    });
    const provider = this.providers.get(model.provider);

    if (!provider) {
      throw new ProviderError(
        `Provider ${model.provider} not found`,
        'router',
        'PROVIDER_NOT_FOUND'
      );
    }

    return provider.streamChat(request, callbacks, model.modelId);
  }

  /**
   * Route and create a streaming generator
   */
  async *streamChatGenerator(
    request: ChatRequest,
    task: TaskType = 'chat',
    preferences?: RoutingPreferences
  ): AsyncGenerator<StreamChunk> {
    const model = this.selectModel(task, {
      ...preferences,
      requireStreaming: true,
    });
    const provider = this.providers.get(model.provider);

    if (!provider) {
      throw new ProviderError(
        `Provider ${model.provider} not found`,
        'router',
        'PROVIDER_NOT_FOUND'
      );
    }

    yield* provider.streamChatGenerator(request, model.modelId);
  }

  /**
   * Execute with a specific model directly
   */
  async chatWithModel(
    request: ChatRequest,
    modelId: string
  ): Promise<ChatResponse> {
    const allModels = this.getAllModels();
    const model = allModels.find((m) => m.modelId === modelId);

    if (!model) {
      throw new ProviderError(
        `Model ${modelId} not found`,
        'router',
        'MODEL_NOT_FOUND'
      );
    }

    const provider = this.providers.get(model.provider);

    if (!provider) {
      throw new ProviderError(
        `Provider ${model.provider} not found`,
        'router',
        'PROVIDER_NOT_FOUND'
      );
    }

    if (!provider.isConfigured()) {
      throw new ProviderError(
        `Provider ${model.provider} is not configured`,
        'router',
        'PROVIDER_NOT_CONFIGURED'
      );
    }

    return provider.chat(request, modelId);
  }
}

// Singleton instance
export const modelRouter = new ModelRouter();
