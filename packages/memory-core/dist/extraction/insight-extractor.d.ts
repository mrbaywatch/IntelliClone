/**
 * Insight Extractor for IntelliClone
 *
 * Automatically extracts insights from conversations to build user personas.
 * Uses pattern matching and keyword analysis (can be enhanced with LLM later).
 */
import type { ConversationInsight } from '../types/persona.js';
/**
 * Extract insights from a user message
 */
export declare function extractInsightsFromMessage(message: string): ConversationInsight[];
/**
 * Extract insights from both user message and assistant response
 */
export declare function extractConversationInsights(userMessage: string, assistantResponse: string): ConversationInsight[];
/**
 * Analyze writing style from a message
 */
export declare function analyzeWritingStyle(message: string): {
    formality: number;
    verbosity: number;
    emotionality: number;
    technicality: number;
    language: string;
};
/**
 * Extract signature patterns from messages (greetings, signoffs)
 */
export declare function extractSignaturePatterns(messages: string[]): {
    greetings: string[];
    signoffs: string[];
    phrases: string[];
};
//# sourceMappingURL=insight-extractor.d.ts.map