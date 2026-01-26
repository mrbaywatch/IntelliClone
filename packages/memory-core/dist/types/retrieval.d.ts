import type { Memory, MemoryType } from './memory.js';
import type { MemoryTier } from './memory-tier.js';
/**
 * Query options for memory retrieval
 */
export interface MemoryRetrievalQuery {
    /** Semantic query string */
    query: string;
    /** User ID to filter by */
    userId: string;
    /** Tenant ID for multi-tenancy */
    tenantId: string;
    /** Optional chatbot ID to scope memories */
    chatbotId?: string;
    /** Include global (chatbot-agnostic) memories */
    includeGlobal?: boolean;
}
/**
 * Options for memory retrieval
 */
export interface MemoryRetrievalOptions {
    /** Maximum number of memories to return */
    limit?: number;
    /** Minimum similarity score threshold (0-1) */
    similarityThreshold?: number;
    /** Filter by memory types */
    types?: MemoryType[];
    /** Filter by tiers */
    tiers?: MemoryTier[];
    /** Filter by tags */
    tags?: string[];
    /** Only return memories accessed within N days */
    maxAgeDays?: number;
    /** Boost factor for recent memories (0 = no boost, 1 = strong boost) */
    recencyBoost?: number;
    /** Boost factor for high-importance memories */
    importanceBoost?: number;
    /** Enable diversity sampling (reduces similar memories) */
    diversitySampling?: boolean;
    /** Diversity threshold (higher = more diverse) */
    diversityThreshold?: number;
    /** Include memories marked for decay below threshold */
    includeDecaying?: boolean;
    /** Exclude specific memory IDs */
    excludeIds?: string[];
}
/**
 * Default retrieval options
 */
export declare const DEFAULT_RETRIEVAL_OPTIONS: Required<MemoryRetrievalOptions>;
/**
 * A retrieved memory with scoring metadata
 */
export interface RetrievedMemory {
    /** The memory data */
    memory: Memory;
    /** Cosine similarity score from vector search */
    similarityScore: number;
    /** Combined relevance score after all boosts */
    relevanceScore: number;
    /** Breakdown of score components */
    scoreBreakdown: {
        similarity: number;
        recency: number;
        importance: number;
        decay: number;
    };
}
/**
 * Result of a memory retrieval operation
 */
export interface MemoryRetrievalResult {
    /** Retrieved memories sorted by relevance */
    memories: RetrievedMemory[];
    /** Total number of memories that matched before limit */
    totalMatched: number;
    /** Query that was used */
    query: string;
    /** Embedding used for the query */
    queryEmbedding?: number[];
    /** Time taken for retrieval in ms */
    durationMs: number;
    /** Tiers that were searched */
    tiersSearched: MemoryTier[];
}
/**
 * Options for consolidation operations
 */
export interface ConsolidationOptions {
    /** User ID to consolidate (null = all users) */
    userId?: string;
    /** Tenant ID for multi-tenancy */
    tenantId: string;
    /** Only consolidate memories older than N hours */
    minAgeHours?: number;
    /** Maximum memories to process in one batch */
    batchSize?: number;
    /** Whether to merge similar memories */
    mergeSimilar?: boolean;
    /** Similarity threshold for merging */
    mergeThreshold?: number;
    /** Dry run - report what would happen without making changes */
    dryRun?: boolean;
}
/**
 * Result of a consolidation operation
 */
export interface ConsolidationResult {
    /** Memories promoted to a higher tier */
    promoted: Array<{
        memoryId: string;
        from: MemoryTier;
        to: MemoryTier;
    }>;
    /** Memories demoted to a lower tier */
    demoted: Array<{
        memoryId: string;
        from: MemoryTier;
        to: MemoryTier;
    }>;
    /** Memories merged together */
    merged: Array<{
        sourceIds: string[];
        targetId: string;
    }>;
    /** Memories archived to episodic */
    archived: string[];
    /** Memories deleted due to low scores */
    deleted: string[];
    /** Total memories processed */
    processed: number;
    /** Duration in ms */
    durationMs: number;
}
/**
 * Criteria for forgetting (removing) memories
 */
export interface ForgetCriteria {
    /** Tenant ID for multi-tenancy */
    tenantId: string;
    /** User ID (null = tenant-wide) */
    userId?: string;
    /** Chatbot ID (null = all chatbots) */
    chatbotId?: string;
    /** Forget all memories matching these types */
    types?: MemoryType[];
    /** Forget memories with decay score below threshold */
    decayThreshold?: number;
    /** Forget memories older than N days */
    olderThanDays?: number;
    /** Forget memories matching these tags */
    tags?: string[];
    /** Forget memories containing these keywords */
    containsKeywords?: string[];
    /** Forget specific memory IDs */
    memoryIds?: string[];
    /** Whether to hard delete or soft delete */
    hardDelete?: boolean;
    /** Skip high-importance memories */
    skipHighImportance?: boolean;
    /** Importance threshold to skip */
    importanceThreshold?: number;
}
/**
 * Result of a forget operation
 */
export interface ForgetResult {
    /** Memory IDs that were forgotten */
    forgotten: string[];
    /** Memory IDs that were skipped (e.g., high importance) */
    skipped: string[];
    /** Total evaluated */
    evaluated: number;
    /** Whether this was a hard or soft delete */
    hardDelete: boolean;
    /** Duration in ms */
    durationMs: number;
}
//# sourceMappingURL=retrieval.d.ts.map