import { z } from 'zod';
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
//# sourceMappingURL=index.js.map