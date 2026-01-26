import type { ChatRequest, ChatResponse, ModelConfig, StreamCallbacks, StreamChunk } from '../types/index.js';
import { BaseLLMProvider } from './base.js';
export declare class OpenAIProvider extends BaseLLMProvider {
    readonly providerName = "openai";
    readonly models: ModelConfig[];
    private client;
    private getClient;
    isConfigured(): boolean;
    getApiKey(): string | undefined;
    getDefaultModel(): ModelConfig;
    chat(request: ChatRequest, modelId?: string): Promise<ChatResponse>;
    streamChat(request: ChatRequest, callbacks: StreamCallbacks, modelId?: string): Promise<void>;
    streamChatGenerator(request: ChatRequest, modelId?: string): AsyncGenerator<StreamChunk>;
}
//# sourceMappingURL=openai.d.ts.map