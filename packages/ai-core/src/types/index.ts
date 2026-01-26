import { z } from 'zod';

// =============================================================================
// Core Types
// =============================================================================

export type ModelProvider = 'openai' | 'anthropic';

export type TaskType =
  | 'chat'
  | 'completion'
  | 'code'
  | 'analysis'
  | 'creative'
  | 'translation'
  | 'summarization'
  | 'extraction';

export type ModelTier = 'fast' | 'balanced' | 'powerful';

// =============================================================================
// Model Configuration
// =============================================================================

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

// =============================================================================
// Message Types (Vercel AI SDK compatible)
// =============================================================================

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

// =============================================================================
// Token & Cost Types
// =============================================================================

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

// =============================================================================
// User Context Types
// =============================================================================

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
  importance: number; // 0-1
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

// =============================================================================
// Streaming Types
// =============================================================================

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

// =============================================================================
// Rate Limiting Types
// =============================================================================

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

// =============================================================================
// Zod Schemas for Validation
// =============================================================================

export const MessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant', 'tool']),
  content: z.string(),
  name: z.string().optional(),
  toolCallId: z.string().optional(),
});

export const ChatRequestSchema = z.object({
  messages: z.array(MessageSchema),
  systemPrompt: z.string().optional(),
  maxTokens: z.number().positive().optional(),
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  stop: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
});

export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  email: z.string().email().optional(),
  preferredLanguage: z.string().default('en'),
  timezone: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const MemorySchema = z.object({
  id: z.string(),
  content: z.string(),
  type: z.enum(['fact', 'preference', 'context', 'instruction']),
  importance: z.number().min(0).max(1),
  createdAt: z.date(),
  expiresAt: z.date().optional(),
});
