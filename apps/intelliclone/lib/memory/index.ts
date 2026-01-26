/**
 * Memory module for IntelliClone
 * 
 * Exports memory-related functionality for the chatbot system.
 */

export {
  getMemoryService,
  storeMemory,
  retrieveMemories,
  processConversationTurn,
  buildMemoryContext,
  extractNorwegianEntities,
} from './memory-client';
