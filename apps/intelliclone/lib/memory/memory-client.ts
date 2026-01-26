/**
 * Memory Client for IntelliClone
 * 
 * Integrates the @kit/memory-core package with IntelliClone's chatbot system.
 * Handles storing, retrieving, and managing memories for personalized AI conversations.
 */

import {
  MemoryService,
  InMemoryStorage,
  MockEmbeddingProvider,
  ImportanceScorerService,
  type Memory,
  type CreateMemoryInput,
  type MemoryRetrievalResult,
  type MemoryType,
} from '@kit/memory-core';

// Singleton memory service instance
let memoryServiceInstance: MemoryService | null = null;

/**
 * Get or create the memory service instance
 */
export function getMemoryService(): MemoryService {
  if (!memoryServiceInstance) {
    // For MVP, use in-memory storage
    // TODO: Replace with PostgreSQL + pgvector storage for production
    const storage = new InMemoryStorage();
    
    // TODO: Replace with OpenAI embedding provider for production
    const embedding = new MockEmbeddingProvider();
    
    const scorer = new ImportanceScorerService();
    
    memoryServiceInstance = new MemoryService(storage, embedding, scorer);
  }
  
  return memoryServiceInstance;
}

/**
 * Store a memory from a conversation
 */
export async function storeMemory(input: {
  userId: string;
  tenantId: string;
  chatbotId?: string;
  content: string;
  type: MemoryType;
  conversationId?: string;
  messageIds?: string[];
}): Promise<Memory> {
  const service = getMemoryService();
  
  return service.store({
    userId: input.userId,
    tenantId: input.tenantId,
    chatbotId: input.chatbotId,
    content: input.content,
    type: input.type,
    source: 'explicit_statement',
    sourceConversationId: input.conversationId,
    sourceMessageIds: input.messageIds,
  });
}

/**
 * Retrieve relevant memories for a conversation context
 */
export async function retrieveMemories(input: {
  query: string;
  userId: string;
  tenantId: string;
  chatbotId?: string;
  limit?: number;
}): Promise<MemoryRetrievalResult> {
  const service = getMemoryService();
  
  return service.retrieve({
    query: input.query,
    userId: input.userId,
    tenantId: input.tenantId,
  }, {
    chatbotId: input.chatbotId,
    limit: input.limit || 10,
    includeGlobal: true,
  });
}

/**
 * Extract and store memories from a conversation turn
 */
export async function processConversationTurn(input: {
  userId: string;
  tenantId: string;
  chatbotId?: string;
  userMessage: string;
  assistantResponse: string;
  conversationId: string;
  messageIds?: string[];
}): Promise<Memory[]> {
  const service = getMemoryService();
  
  // Extract memories from the conversation
  const extracted = await service.extractFromConversation(
    input.userMessage,
    input.assistantResponse,
    {
      userId: input.userId,
      tenantId: input.tenantId,
      chatbotId: input.chatbotId,
    }
  );
  
  // Store each extracted memory
  const storedMemories: Memory[] = [];
  
  for (const memory of extracted.memories) {
    const stored = await service.store({
      ...memory,
      sourceConversationId: input.conversationId,
      sourceMessageIds: input.messageIds,
    });
    storedMemories.push(stored);
  }
  
  return storedMemories;
}

/**
 * Build context string from memories for LLM prompt
 */
export function buildMemoryContext(memories: Memory[]): string {
  if (memories.length === 0) {
    return '';
  }
  
  const memoryLines = memories.map((m, i) => {
    const typeLabel = getMemoryTypeLabel(m.type);
    return `${i + 1}. [${typeLabel}] ${m.content}`;
  });
  
  return `## What I Remember About You

${memoryLines.join('\n')}

Use this information to personalize your response. Don't explicitly mention that you "remember" things unless relevant.`;
}

/**
 * Get human-readable label for memory type
 */
function getMemoryTypeLabel(type: MemoryType): string {
  const labels: Record<MemoryType, string> = {
    fact: 'Fact',
    preference: 'Preference',
    event: 'Event',
    relationship: 'Relationship',
    skill: 'Skill',
    goal: 'Goal',
    context: 'Context',
    feedback: 'Feedback',
  };
  return labels[type] || type;
}

/**
 * Norwegian-specific memory extraction
 */
export async function extractNorwegianEntities(text: string): Promise<{
  organizations: string[];
  people: string[];
  places: string[];
  dates: string[];
}> {
  const service = getMemoryService();
  
  const result = await service.extractEntities(text);
  
  return {
    organizations: result.entities
      .filter(e => e.type === 'organization')
      .map(e => e.value),
    people: result.entities
      .filter(e => e.type === 'person')
      .map(e => e.value),
    places: result.entities
      .filter(e => e.type === 'location')
      .map(e => e.value),
    dates: result.entities
      .filter(e => e.type === 'date')
      .map(e => e.value),
  };
}
