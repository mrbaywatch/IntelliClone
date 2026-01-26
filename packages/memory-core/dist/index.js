/**
 * @kit/memory-core
 *
 * The shared memory system for all Intelli products.
 * This is the cognitive backbone of IntelliClone, Intelli-Notes,
 * Intelli-Law, and Intelli-Agents.
 *
 * @example
 * ```typescript
 * import {
 *   MemoryService,
 *   InMemoryStorage,
 *   MockEmbeddingProvider,
 *   ImportanceScorerService
 * } from '@kit/memory-core';
 *
 * // Initialize the memory system
 * const storage = new InMemoryStorage();
 * const embedding = new MockEmbeddingProvider();
 * const scorer = new ImportanceScorerService();
 * const memoryService = new MemoryService(storage, embedding, scorer);
 *
 * // Store a memory
 * const memory = await memoryService.store({
 *   userId: 'user-123',
 *   tenantId: 'tenant-abc',
 *   type: 'fact',
 *   content: 'User works at DNB as a senior developer',
 *   source: 'explicit_statement',
 * });
 *
 * // Retrieve relevant memories
 * const results = await memoryService.retrieve({
 *   query: 'Where does the user work?',
 *   userId: 'user-123',
 *   tenantId: 'tenant-abc',
 * });
 * ```
 */
// ==================== Types ====================
export * from './types/index.js';
// ==================== Services ====================
export * from './services/index.js';
// ==================== Embeddings ====================
export * from './embeddings/index.js';
// ==================== Storage ====================
export * from './storage/index.js';
// ==================== Extraction ====================
export * from './extraction/index.js';
// ==================== Utilities ====================
export * from './utils/index.js';
//# sourceMappingURL=index.js.map