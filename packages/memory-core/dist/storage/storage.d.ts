import type { Memory, MemoryType, MemoryTier } from '../types/index.js';
/**
 * Options for vector search
 */
export interface VectorSearchOptions {
    /** Chatbot ID filter */
    chatbotId?: string;
    /** Include memories without chatbot (global) */
    includeGlobal?: boolean;
    /** Maximum results */
    limit?: number;
    /** Filter by tiers */
    tiers?: MemoryTier[];
    /** Filter by types */
    types?: MemoryType[];
    /** Filter by tags */
    tags?: string[];
    /** Minimum similarity score */
    minSimilarity?: number;
    /** Exclude specific memory IDs */
    excludeIds?: string[];
    /** Include soft-deleted memories */
    includeDeleted?: boolean;
}
/**
 * Result of a vector search
 */
export interface VectorSearchResult {
    memory: Memory;
    similarity: number;
}
/**
 * Options for consolidation query
 */
export interface ConsolidationQueryOptions {
    /** Minimum age in hours */
    minAgeHours?: number;
    /** Maximum results */
    limit?: number;
}
/**
 * Criteria for finding memories
 */
export interface MemoryFindCriteria {
    tenantId: string;
    userId?: string;
    chatbotId?: string;
    types?: MemoryType[];
    tags?: string[];
    maxDecayScore?: number;
    olderThanDays?: number;
    memoryIds?: string[];
}
/**
 * Abstract storage interface for the memory system
 *
 * Implementations can be:
 * - PostgreSQL + pgvector (primary production backend)
 * - Redis (for short-term/working memory caching)
 * - SQLite + vector extension (for local/testing)
 * - In-memory (for unit tests)
 *
 * The memory service operates through this interface,
 * making the storage backend swappable.
 */
export interface MemoryStorage {
    /**
     * Save a new memory
     */
    save(memory: Memory): Promise<void>;
    /**
     * Get a memory by ID
     */
    get(id: string): Promise<Memory | null>;
    /**
     * Update a memory
     */
    update(id: string, updates: Partial<Memory>): Promise<Memory>;
    /**
     * Soft delete a memory
     */
    softDelete(id: string): Promise<void>;
    /**
     * Hard delete a memory permanently
     */
    hardDelete(id: string): Promise<void>;
    /**
     * Vector similarity search
     */
    vectorSearch(queryVector: number[], userId: string, tenantId: string, options?: VectorSearchOptions): Promise<VectorSearchResult[]>;
    /**
     * Find memories matching criteria
     */
    findByCriteria(criteria: MemoryFindCriteria): Promise<Memory[]>;
    /**
     * Get memories needing consolidation
     */
    getForConsolidation(tenantId: string, userId?: string, options?: ConsolidationQueryOptions): Promise<Memory[]>;
    /**
     * Count memories for a user
     */
    countByUser(userId: string, tenantId: string): Promise<number>;
    /**
     * Update memory tier
     */
    updateTier(id: string, tier: MemoryTier): Promise<void>;
    /**
     * Update decay score
     */
    updateDecay(id: string, score: number): Promise<void>;
    /**
     * Update access timestamp and count
     */
    updateAccess(id: string, accessedAt: Date): Promise<void>;
    /**
     * Save multiple memories
     */
    saveBatch(memories: Memory[]): Promise<void>;
    /**
     * Delete multiple memories
     */
    deleteBatch(ids: string[], hard?: boolean): Promise<void>;
    /**
     * Cleanup expired memories
     */
    cleanupExpired(): Promise<number>;
    /**
     * Check storage health
     */
    healthCheck(): Promise<boolean>;
}
/**
 * In-memory storage implementation for testing
 */
export declare class InMemoryStorage implements MemoryStorage {
    private memories;
    save(memory: Memory): Promise<void>;
    get(id: string): Promise<Memory | null>;
    update(id: string, updates: Partial<Memory>): Promise<Memory>;
    softDelete(id: string): Promise<void>;
    hardDelete(id: string): Promise<void>;
    vectorSearch(queryVector: number[], userId: string, tenantId: string, options?: VectorSearchOptions): Promise<VectorSearchResult[]>;
    findByCriteria(criteria: MemoryFindCriteria): Promise<Memory[]>;
    getForConsolidation(tenantId: string, userId?: string, options?: ConsolidationQueryOptions): Promise<Memory[]>;
    countByUser(userId: string, tenantId: string): Promise<number>;
    updateTier(id: string, tier: MemoryTier): Promise<void>;
    updateDecay(id: string, score: number): Promise<void>;
    updateAccess(id: string, accessedAt: Date): Promise<void>;
    saveBatch(memories: Memory[]): Promise<void>;
    deleteBatch(ids: string[], hard?: boolean): Promise<void>;
    cleanupExpired(): Promise<number>;
    healthCheck(): Promise<boolean>;
    clear(): void;
    private cosineSimilarity;
}
//# sourceMappingURL=storage.d.ts.map