import { z } from 'zod';
export type ModelProvider = 'openai' | 'anthropic';
export type TaskType = 'chat' | 'completion' | 'code' | 'analysis' | 'creative' | 'translation' | 'summarization' | 'extraction';
export type ModelTier = 'fast' | 'balanced' | 'powerful';
export interface ModelConfig {
    provider: ModelProvider;
    modelId: string;
    displayName: string;
    tier: ModelTier;
    maxTokens: number;
    contextWindow: number;
    inputCostPer1k: number;
    outputCostPer1k: number;
    supportedTasks: TaskType[];
    supportsStreaming: boolean;
    supportsVision: boolean;
}
export interface RoutingPreferences {
    preferredProvider?: ModelProvider;
    tier?: ModelTier;
    maxCost?: number;
    requireStreaming?: boolean;
    requireVision?: boolean;
}
export type MessageRole = 'system' | 'user' | 'assistant' | 'tool';
export interface Message {
    role: MessageRole;
    content: string;
    name?: string;
    toolCallId?: string;
}
export interface ChatRequest {
    messages: Message[];
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
    stop?: string[];
    stream?: boolean;
}
export interface ChatResponse {
    content: string;
    finishReason: 'stop' | 'length' | 'tool_calls' | 'error';
    usage: TokenUsage;
    model: string;
    provider: ModelProvider;
}
export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}
export interface CostEstimate {
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: 'USD';
}
export interface UserProfile {
    id: string;
    name?: string;
    email?: string;
    preferredLanguage: string;
    timezone?: string;
    metadata?: Record<string, unknown>;
}
export interface Memory {
    id: string;
    content: string;
    type: 'fact' | 'preference' | 'context' | 'instruction';
    importance: number;
    createdAt: Date;
    expiresAt?: Date;
}
export interface PromptContext {
    user?: UserProfile;
    memories?: Memory[];
    variables?: Record<string, string>;
    locale?: string;
    additionalInstructions?: string[];
}
export interface StreamCallbacks {
    onStart?: () => void;
    onToken?: (token: string) => void;
    onComplete?: (response: ChatResponse) => void;
    onError?: (error: Error) => void;
}
export interface StreamChunk {
    type: 'text' | 'tool_call' | 'error' | 'done';
    content?: string;
    toolCall?: {
        id: string;
        name: string;
        arguments: string;
    };
    error?: Error;
    usage?: TokenUsage;
}
export interface RateLimitConfig {
    requestsPerMinute: number;
    tokensPerMinute: number;
    requestsPerDay?: number;
    tokensPerDay?: number;
}
export interface RateLimitState {
    requestCount: number;
    tokenCount: number;
    windowStart: number;
    dailyRequestCount?: number;
    dailyTokenCount?: number;
    dayStart?: number;
}
export interface RateLimitResult {
    allowed: boolean;
    retryAfterMs?: number;
    remaining: {
        requests: number;
        tokens: number;
    };
}
export declare const MessageSchema: z.ZodObject<{
    role: z.ZodEnum<["system", "user", "assistant", "tool"]>;
    content: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    toolCallId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    name?: string | undefined;
    toolCallId?: string | undefined;
}, {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    name?: string | undefined;
    toolCallId?: string | undefined;
}>;
export declare const ChatRequestSchema: z.ZodObject<{
    messages: z.ZodArray<z.ZodObject<{
        role: z.ZodEnum<["system", "user", "assistant", "tool"]>;
        content: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        toolCallId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        name?: string | undefined;
        toolCallId?: string | undefined;
    }, {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        name?: string | undefined;
        toolCallId?: string | undefined;
    }>, "many">;
    systemPrompt: z.ZodOptional<z.ZodString>;
    maxTokens: z.ZodOptional<z.ZodNumber>;
    temperature: z.ZodOptional<z.ZodNumber>;
    topP: z.ZodOptional<z.ZodNumber>;
    frequencyPenalty: z.ZodOptional<z.ZodNumber>;
    presencePenalty: z.ZodOptional<z.ZodNumber>;
    stop: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    stream: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    messages: {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        name?: string | undefined;
        toolCallId?: string | undefined;
    }[];
    stop?: string[] | undefined;
    systemPrompt?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    topP?: number | undefined;
    frequencyPenalty?: number | undefined;
    presencePenalty?: number | undefined;
    stream?: boolean | undefined;
}, {
    messages: {
        role: "system" | "user" | "assistant" | "tool";
        content: string;
        name?: string | undefined;
        toolCallId?: string | undefined;
    }[];
    stop?: string[] | undefined;
    systemPrompt?: string | undefined;
    maxTokens?: number | undefined;
    temperature?: number | undefined;
    topP?: number | undefined;
    frequencyPenalty?: number | undefined;
    presencePenalty?: number | undefined;
    stream?: boolean | undefined;
}>;
export declare const UserProfileSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    preferredLanguage: z.ZodDefault<z.ZodString>;
    timezone: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    preferredLanguage: string;
    name?: string | undefined;
    email?: string | undefined;
    timezone?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}, {
    id: string;
    name?: string | undefined;
    email?: string | undefined;
    preferredLanguage?: string | undefined;
    timezone?: string | undefined;
    metadata?: Record<string, unknown> | undefined;
}>;
export declare const MemorySchema: z.ZodObject<{
    id: z.ZodString;
    content: z.ZodString;
    type: z.ZodEnum<["fact", "preference", "context", "instruction"]>;
    importance: z.ZodNumber;
    createdAt: z.ZodDate;
    expiresAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    type: "fact" | "preference" | "context" | "instruction";
    content: string;
    id: string;
    importance: number;
    createdAt: Date;
    expiresAt?: Date | undefined;
}, {
    type: "fact" | "preference" | "context" | "instruction";
    content: string;
    id: string;
    importance: number;
    createdAt: Date;
    expiresAt?: Date | undefined;
}>;
//# sourceMappingURL=index.d.ts.map