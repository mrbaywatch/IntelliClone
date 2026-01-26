import type { ChatRequest, ChatResponse, ModelConfig, ModelProvider, RoutingPreferences, StreamCallbacks, StreamChunk, TaskType } from '../types/index.js';
import { BaseLLMProvider } from './base.js';
/**
 * Model Router - Intelligently selects the best model for a given task
 */
export declare class ModelRouter {
    private providers;
    constructor();
    /**
     * Get all available providers
     */
    getProviders(): BaseLLMProvider[];
    /**
     * Get a specific provider
     */
    getProvider(name: ModelProvider): BaseLLMProvider | undefined;
    /**
     * Get all configured providers (those with API keys)
     */
    getConfiguredProviders(): BaseLLMProvider[];
    /**
     * Get all available models across all providers
     */
    getAllModels(): ModelConfig[];
    /**
     * Get all models that are currently usable (provider is configured)
     */
    getAvailableModels(): ModelConfig[];
    /**
     * Select the best model based on task and preferences
     */
    selectModel(task: TaskType, preferences?: RoutingPreferences): ModelConfig;
    /**
     * Score a model for a given task
     */
    private scoreModel;
    /**
     * Route and execute a chat request
     */
    chat(request: ChatRequest, task?: TaskType, preferences?: RoutingPreferences): Promise<ChatResponse>;
    /**
     * Route and stream a chat request
     */
    streamChat(request: ChatRequest, callbacks: StreamCallbacks, task?: TaskType, preferences?: RoutingPreferences): Promise<void>;
    /**
     * Route and create a streaming generator
     */
    streamChatGenerator(request: ChatRequest, task?: TaskType, preferences?: RoutingPreferences): AsyncGenerator<StreamChunk>;
    /**
     * Execute with a specific model directly
     */
    chatWithModel(request: ChatRequest, modelId: string): Promise<ChatResponse>;
}
export declare const modelRouter: ModelRouter;
//# sourceMappingURL=router.d.ts.map