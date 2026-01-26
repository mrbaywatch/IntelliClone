import type { Memory, CreateMemoryInput, UpdateMemoryInput, MemoryRetrievalQuery, MemoryRetrievalOptions, MemoryRetrievalResult, ConsolidationOptions, ConsolidationResult, ForgetCriteria, ForgetResult, MemoryTier } from '../types/index.js';
import type { EmbeddingProvider } from '../embeddings/provider.js';
import type { MemoryStorage } from '../storage/storage.js';
import type { ImportanceScorerService } from './importance-scorer.js';
/**
 * Configuration for the MemoryService
 */
export interface MemoryServiceConfig {
    /** Default tier for new memories */
    defaultTier: MemoryTier;
    /** Maximum memories per user before consolidation triggers */
    maxMemoriesPerUser: number;
    /** Auto-consolidate when threshold is exceeded */
    autoConsolidate: boolean;
    /** Decay rate per day for unused memories */
    decayRatePerDay: number;
    /** Minimum importance score to store a memory */
    minImportanceToStore: number;
    /** Similarity threshold for deduplication */
    deduplicationThreshold: number;
}
/**
 * Default configuration
 */
export declare const DEFAULT_MEMORY_SERVICE_CONFIG: MemoryServiceConfig;
/**
 * The core Memory Service - orchestrates all memory operations
 *
 * This is the main API for the memory system. It coordinates:
 * - Storage (via MemoryStorage abstraction)
 * - Embeddings (via EmbeddingProvider abstraction)
 * - Importance scoring
 * - Retrieval with boosting/ranking
 * - Consolidation and forgetting
 */
export declare class MemoryService {
    private readonly storage;
    private readonly embedding;
    private readonly importanceScorer;
    private readonly config;
    constructor(storage: MemoryStorage, embedding: EmbeddingProvider, importanceScorer: ImportanceScorerService, config?: Partial<MemoryServiceConfig>);
    /**
     * Store a new memory
     *
     * This:
     * 1. Generates an embedding for semantic search
     * 2. Calculates importance score
     * 3. Checks for duplicates
     * 4. Stores in the appropriate tier
     */
    store(input: CreateMemoryInput): Promise<Memory>;
    /**
     * Retrieve relevant memories using semantic search
     */
    retrieve(query: MemoryRetrievalQuery, options?: MemoryRetrievalOptions): Promise<MemoryRetrievalResult>;
    /**
     * Consolidate memories - promote/demote based on scores
     */
    consolidate(options: ConsolidationOptions): Promise<ConsolidationResult>;
    /**
     * Forget (delete) memories matching criteria
     */
    forget(criteria: ForgetCriteria): Promise<ForgetResult>;
    /**
     * Get a single memory by ID
     */
    get(memoryId: string): Promise<Memory | null>;
    /**
     * Update a memory
     */
    update(memoryId: string, update: UpdateMemoryInput): Promise<Memory>;
    private findDuplicates;
    private reinforceMemory;
    private calculateInitialConfidence;
    private scoreAndRank;
    private applyDiversitySampling;
    private cosineSimilarity;
    private updateAccessCounts;
    private calculateDecay;
    private determineConsolidationAction;
    private recordAction;
    private mergeSimilarMemories;
    private mergeContent;
    private triggerConsolidation;
}
/**
 * Error thrown when a memory is not found
 */
export declare class MemoryNotFoundError extends Error {
    constructor(memoryId: string);
}
/**
 * Error thrown when a memory is rejected (e.g., too low importance)
 */
export declare class MemoryRejectedError extends Error {
    constructor(reason: string);
}
//# sourceMappingURL=memory-service.d.ts.map