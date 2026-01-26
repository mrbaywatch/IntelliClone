/**
 * Memory-Enhanced Chat Chain for IntelliClone
 * 
 * Extends the base Langchain chat with memory retrieval and storage.
 * This is what makes IntelliClone different - it remembers!
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { PromptTemplate } from '@langchain/core/prompts';
import { UIMessage } from 'ai';

import { Database } from '~/lib/database.types';
import {
  retrieveMemories,
  processConversationTurn,
  buildMemoryContext,
} from '~/lib/memory';

/**
 * Generate a memory-enhanced prompt template
 * 
 * This template includes:
 * 1. User's stored memories (facts, preferences, context)
 * 2. Conversation history
 * 3. Document context from vector store
 */
export function getMemoryEnhancedPromptTemplate(siteName: string, memoryContext: string) {
  const memorySection = memoryContext 
    ? `
      ----------------
      WHAT I KNOW ABOUT THIS USER:
      ${memoryContext}
      ----------------
      ` 
    : '';

  return PromptTemplate.fromTemplate(
    `You are a helpful, personalized AI assistant working for ${siteName}. 

You remember things about the user from previous conversations and use this to provide a more personalized experience.

You will reply on behalf of ${siteName} and users may refer to you as "${siteName}".

${memorySection}

Use the CONTEXT (documents), CHAT HISTORY, and your knowledge about this user to answer helpfully.

Important guidelines:
- Be personalized: Use what you know about the user naturally, don't announce "I remember..."
- Be helpful: Provide accurate, relevant information
- Be honest: If you don't know something, say so
- Be concise: Keep responses focused and readable

Do not make up information not in the CONTEXT or your knowledge about the user.

If the answer is not clear, ask for clarification politely.

Output in markdown when formatting helps readability.

      ----------------
      CONTEXT: {context}
      ----------------
      CHAT HISTORY: {chatHistory}
      ----------------
      QUESTION: {question}
      ----------------
      Response:`,
  );
}

/**
 * Retrieve user memories before generating a response
 */
export async function getMemoriesForChat(params: {
  query: string;
  userId: string;
  tenantId: string;
  chatbotId?: string;
}): Promise<string> {
  try {
    const result = await retrieveMemories({
      query: params.query,
      userId: params.userId,
      tenantId: params.tenantId,
      chatbotId: params.chatbotId,
      limit: 10,
    });

    if (result.memories.length === 0) {
      return '';
    }

    return buildMemoryContext(result.memories);
  } catch (error) {
    console.error('Error retrieving memories:', error);
    return '';
  }
}

/**
 * Process a conversation turn and extract memories
 */
export async function processAndStoreMemories(params: {
  userId: string;
  tenantId: string;
  chatbotId?: string;
  userMessage: string;
  assistantResponse: string;
  conversationId: string;
}): Promise<void> {
  try {
    await processConversationTurn({
      userId: params.userId,
      tenantId: params.tenantId,
      chatbotId: params.chatbotId,
      userMessage: params.userMessage,
      assistantResponse: params.assistantResponse,
      conversationId: params.conversationId,
    });
  } catch (error) {
    // Don't fail the response if memory storage fails
    console.error('Error storing memories:', error);
  }
}

/**
 * Extract user context from messages for memory lookup
 */
export function extractUserContext(messages: UIMessage[]): {
  recentTopics: string[];
  lastUserMessage: string;
} {
  const userMessages = messages
    .filter(m => m.role === 'user')
    .map(m => m.parts[0]?.type === 'text' ? m.parts[0].text : '')
    .filter(Boolean);

  // Get topics from recent messages (simple keyword extraction)
  const recentText = userMessages.slice(-5).join(' ');
  const topics = extractTopics(recentText);

  return {
    recentTopics: topics,
    lastUserMessage: userMessages[userMessages.length - 1] || '',
  };
}

/**
 * Simple topic extraction from text
 * TODO: Enhance with NLP for Norwegian language
 */
function extractTopics(text: string): string[] {
  // Remove common stop words and extract nouns/keywords
  const stopWords = new Set([
    'i', 'me', 'my', 'myself', 'we', 'our', 'you', 'your', 'he', 'she', 'it',
    'they', 'what', 'which', 'who', 'this', 'that', 'these', 'those', 'am',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'a', 'an', 'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until',
    'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
    'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to',
    'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again',
    // Norwegian stop words
    'jeg', 'meg', 'min', 'mitt', 'vi', 'vår', 'du', 'din', 'han', 'hun', 'den',
    'det', 'de', 'hva', 'hvem', 'som', 'er', 'var', 'har', 'kan', 'vil', 'skal',
    'må', 'en', 'et', 'ei', 'og', 'men', 'hvis', 'eller', 'fordi', 'når', 'av',
    'på', 'med', 'om', 'fra', 'til', 'i', 'ut', 'opp', 'ned',
  ]);

  const words = text.toLowerCase()
    .replace(/[^\w\sæøå]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word));

  // Count frequency
  const frequency = new Map<string, number>();
  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  // Return top topics
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);
}

/**
 * Format memories for display in a dashboard
 */
export function formatMemoriesForDisplay(memories: Array<{
  id: string;
  type: string;
  content: string;
  confidence: { score: number };
  metadata: { createdAt: Date };
}>): Array<{
  id: string;
  type: string;
  content: string;
  confidence: number;
  createdAt: string;
}> {
  return memories.map(m => ({
    id: m.id,
    type: m.type,
    content: m.content,
    confidence: Math.round(m.confidence.score * 100),
    createdAt: m.metadata.createdAt.toISOString(),
  }));
}
