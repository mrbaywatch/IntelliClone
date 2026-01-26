import { nanoid } from 'nanoid';
import type {
  Memory,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryRetrievalQuery,
  MemoryRetrievalOptions,
  MemoryRetrievalResult,
  RetrievedMemory,
  ConsolidationOptions,
  ConsolidationResult,
  ForgetCriteria,
  ForgetResult,
  MemoryTier,
  ImportanceScore,
} from '../types/index.js';
import { DEFAULT_RETRIEVAL_OPTIONS, getPromotionTarget, getDemotionTarget } from '../types/index.js';
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
export const DEFAULT_MEMORY_SERVICE_CONFIG: MemoryServiceConfig = {
  defaultTier: 'short-term',
  maxMemoriesPerUser: 1000,
  autoConsolidate: true,
  decayRatePerDay: 0.1,
  minImportanceToStore: 0.1,
  deduplicationThreshold: 0.92,
};

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
export class MemoryService {
  private readonly config: MemoryServiceConfig;
  
  constructor(
    private readonly storage: MemoryStorage,
    private readonly embedding: EmbeddingProvider,
    private readonly importanceScorer: ImportanceScorerService,
    config: Partial<MemoryServiceConfig> = {}
  ) {
    this.config = { ...DEFAULT_MEMORY_SERVICE_CONFIG, ...config };
  }
  
  /**
   * Store a new memory
   * 
   * This:
   * 1. Generates an embedding for semantic search
   * 2. Calculates importance score
   * 3. Checks for duplicates
   * 4. Stores in the appropriate tier
   */
  async store(input: CreateMemoryInput): Promise<Memory> {
    const startTime = Date.now();
    
    // Generate embedding
    const embeddingResult = await this.embedding.embed(input.content);
    
    // Calculate importance score
    const importanceScore = await this.importanceScorer.scoreContent(
      input.content,
      input.type,
      input.source
    );
    
    // Check minimum importance threshold
    if (importanceScore.score < this.config.minImportanceToStore) {
      throw new MemoryRejectedError(
        `Memory importance score ${importanceScore.score} below threshold ${this.config.minImportanceToStore}`
      );
    }
    
    // Check for duplicates
    const duplicates = await this.findDuplicates(
      input.userId,
      input.tenantId,
      embeddingResult.embedding,
      this.config.deduplicationThreshold
    );
    
    if (duplicates.length > 0) {
      // Update existing memory instead of creating duplicate
      const existing = duplicates[0]!;
      return this.reinforceMemory(existing.id, input, importanceScore);
    }
    
    // Create the memory object
    const now = new Date();
    const memory: Memory = {
      id: nanoid(),
      userId: input.userId,
      tenantId: input.tenantId,
      chatbotId: input.chatbotId,
      tier: this.config.defaultTier,
      type: input.type,
      content: input.content,
      structuredData: input.structuredData,
      importanceScore: importanceScore.score,
      confidence: {
        score: this.calculateInitialConfidence(input.source),
        basis: input.source === 'explicit_statement' ? 'explicit' : 'inferred',
        reinforcements: 1,
        lastUpdated: now,
      },
      metadata: {
        createdAt: now,
        lastAccessedAt: null,
        updatedAt: now,
        accessCount: 0,
        source: input.source,
        sourceConversationId: input.sourceConversationId,
        sourceMessageIds: input.sourceMessageIds,
        custom: input.customMetadata,
      },
      embedding: {
        vector: embeddingResult.embedding,
        model: embeddingResult.model,
        dimension: embeddingResult.embedding.length,
        generatedAt: now,
      },
      decay: {
        score: 1.0,
        ratePerDay: this.config.decayRatePerDay,
        lastCalculated: now,
        protected: importanceScore.score >= 0.9,
      },
      tags: input.tags ?? [],
      isDeleted: false,
      expiresAt: input.expiresAt,
    };
    
    // Store the memory
    await this.storage.save(memory);
    
    // Check if we need to consolidate
    if (this.config.autoConsolidate) {
      const count = await this.storage.countByUser(input.userId, input.tenantId);
      if (count > this.config.maxMemoriesPerUser) {
        // Trigger async consolidation
        this.triggerConsolidation(input.tenantId, input.userId).catch(console.error);
      }
    }
    
    return memory;
  }
  
  /**
   * Retrieve relevant memories using semantic search
   */
  async retrieve(
    query: MemoryRetrievalQuery,
    options: MemoryRetrievalOptions = {}
  ): Promise<MemoryRetrievalResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_RETRIEVAL_OPTIONS, ...options };
    
    // Generate query embedding
    const queryEmbedding = await this.embedding.embed(query.query);
    
    // Perform vector search
    const candidates = await this.storage.vectorSearch(
      queryEmbedding.embedding,
      query.userId,
      query.tenantId,
      {
        chatbotId: query.chatbotId,
        includeGlobal: query.includeGlobal ?? true,
        limit: opts.limit * 3, // Get more candidates for filtering
        tiers: opts.tiers,
        types: opts.types,
        tags: opts.tags,
        minSimilarity: opts.similarityThreshold,
        excludeIds: opts.excludeIds,
        includeDeleted: false,
      }
    );
    
    // Apply scoring and ranking
    const scored = this.scoreAndRank(candidates, opts);
    
    // Apply diversity sampling if enabled
    const diversified = opts.diversitySampling
      ? this.applyDiversitySampling(scored, opts.diversityThreshold)
      : scored;
    
    // Trim to limit
    const final = diversified.slice(0, opts.limit);
    
    // Update access counts (async, don't wait)
    this.updateAccessCounts(final.map(r => r.memory.id)).catch(console.error);
    
    return {
      memories: final,
      totalMatched: candidates.length,
      query: query.query,
      queryEmbedding: queryEmbedding.embedding,
      durationMs: Date.now() - startTime,
      tiersSearched: opts.tiers as MemoryTier[],
    };
  }
  
  /**
   * Consolidate memories - promote/demote based on scores
   */
  async consolidate(options: ConsolidationOptions): Promise<ConsolidationResult> {
    const startTime = Date.now();
    const result: ConsolidationResult = {
      promoted: [],
      demoted: [],
      merged: [],
      archived: [],
      deleted: [],
      processed: 0,
      durationMs: 0,
    };
    
    // Get memories needing consolidation
    const memories = await this.storage.getForConsolidation(
      options.tenantId,
      options.userId,
      {
        minAgeHours: options.minAgeHours ?? 24,
        limit: options.batchSize ?? 100,
      }
    );
    
    for (const memory of memories) {
      result.processed++;
      
      // Recalculate decay
      const decayedScore = this.calculateDecay(memory);
      
      // Determine action based on scores
      const action = this.determineConsolidationAction(memory, decayedScore);
      
      if (options.dryRun) {
        // Just track what would happen
        this.recordAction(result, action, memory);
        continue;
      }
      
      // Execute action
      switch (action.type) {
        case 'promote': {
          const targetTier = getPromotionTarget(memory.tier);
          if (targetTier) {
            await this.storage.updateTier(memory.id, targetTier);
            result.promoted.push({
              memoryId: memory.id,
              from: memory.tier,
              to: targetTier,
            });
          }
          break;
        }
        case 'demote': {
          const targetTier = getDemotionTarget(memory.tier);
          if (targetTier) {
            await this.storage.updateTier(memory.id, targetTier);
            result.demoted.push({
              memoryId: memory.id,
              from: memory.tier,
              to: targetTier,
            });
          } else {
            // Demote to deletion
            await this.storage.softDelete(memory.id);
            result.deleted.push(memory.id);
          }
          break;
        }
        case 'archive': {
          await this.storage.updateTier(memory.id, 'episodic');
          result.archived.push(memory.id);
          break;
        }
        case 'delete': {
          await this.storage.softDelete(memory.id);
          result.deleted.push(memory.id);
          break;
        }
        case 'keep':
          // Update decay score but keep in place
          await this.storage.updateDecay(memory.id, decayedScore);
          break;
      }
    }
    
    // Handle memory merging if enabled
    if (options.mergeSimilar && !options.dryRun) {
      const mergeResults = await this.mergeSimilarMemories(
        memories,
        options.mergeThreshold ?? 0.95
      );
      result.merged = mergeResults;
    }
    
    result.durationMs = Date.now() - startTime;
    return result;
  }
  
  /**
   * Forget (delete) memories matching criteria
   */
  async forget(criteria: ForgetCriteria): Promise<ForgetResult> {
    const startTime = Date.now();
    const result: ForgetResult = {
      forgotten: [],
      skipped: [],
      evaluated: 0,
      hardDelete: criteria.hardDelete ?? false,
      durationMs: 0,
    };
    
    // Get candidate memories
    const candidates = await this.storage.findByCriteria({
      tenantId: criteria.tenantId,
      userId: criteria.userId,
      chatbotId: criteria.chatbotId,
      types: criteria.types,
      tags: criteria.tags,
      maxDecayScore: criteria.decayThreshold,
      olderThanDays: criteria.olderThanDays,
      memoryIds: criteria.memoryIds,
    });
    
    for (const memory of candidates) {
      result.evaluated++;
      
      // Skip high-importance if configured
      if (
        criteria.skipHighImportance &&
        memory.importanceScore >= (criteria.importanceThreshold ?? 0.8)
      ) {
        result.skipped.push(memory.id);
        continue;
      }
      
      // Check keyword filter
      if (
        criteria.containsKeywords &&
        !criteria.containsKeywords.some(kw =>
          memory.content.toLowerCase().includes(kw.toLowerCase())
        )
      ) {
        continue;
      }
      
      // Execute deletion
      if (criteria.hardDelete) {
        await this.storage.hardDelete(memory.id);
      } else {
        await this.storage.softDelete(memory.id);
      }
      
      result.forgotten.push(memory.id);
    }
    
    result.durationMs = Date.now() - startTime;
    return result;
  }
  
  /**
   * Get a single memory by ID
   */
  async get(memoryId: string): Promise<Memory | null> {
    return this.storage.get(memoryId);
  }
  
  /**
   * Update a memory
   */
  async update(memoryId: string, update: UpdateMemoryInput): Promise<Memory> {
    const memory = await this.storage.get(memoryId);
    if (!memory) {
      throw new MemoryNotFoundError(memoryId);
    }
    
    const updates: Partial<Memory> = {
      ...update,
      metadata: {
        ...memory.metadata,
        updatedAt: new Date(),
        custom: update.customMetadata ?? memory.metadata.custom,
      },
    };
    
    // Re-embed if content changed
    if (update.content && update.content !== memory.content) {
      const embeddingResult = await this.embedding.embed(update.content);
      updates.embedding = {
        vector: embeddingResult.embedding,
        model: embeddingResult.model,
        dimension: embeddingResult.embedding.length,
        generatedAt: new Date(),
      };
      
      // Recalculate importance
      const importance = await this.importanceScorer.scoreContent(
        update.content,
        memory.type,
        memory.metadata.source
      );
      updates.importanceScore = importance.score;
    }
    
    return this.storage.update(memoryId, updates);
  }
  
  // ==================== Private Helpers ====================
  
  private async findDuplicates(
    userId: string,
    tenantId: string,
    embedding: number[],
    threshold: number
  ): Promise<Memory[]> {
    const results = await this.storage.vectorSearch(
      embedding,
      userId,
      tenantId,
      {
        limit: 5,
        minSimilarity: threshold,
        includeDeleted: false,
      }
    );
    
    return results.filter(r => r.similarity >= threshold).map(r => r.memory);
  }
  
  private async reinforceMemory(
    memoryId: string,
    input: CreateMemoryInput,
    newScore: ImportanceScore
  ): Promise<Memory> {
    const memory = await this.storage.get(memoryId);
    if (!memory) {
      throw new MemoryNotFoundError(memoryId);
    }
    
    // Increase confidence and importance
    const now = new Date();
    const updates: Partial<Memory> = {
      importanceScore: Math.min(1, (memory.importanceScore + newScore.score) / 2 + 0.1),
      confidence: {
        ...memory.confidence,
        score: Math.min(1, memory.confidence.score + 0.05),
        reinforcements: memory.confidence.reinforcements + 1,
        basis: 'repeated',
        lastUpdated: now,
      },
      decay: {
        ...memory.decay,
        score: 1.0, // Reset decay on reinforcement
        lastCalculated: now,
      },
      metadata: {
        ...memory.metadata,
        updatedAt: now,
      },
    };
    
    return this.storage.update(memoryId, updates);
  }
  
  private calculateInitialConfidence(source: CreateMemoryInput['source']): number {
    switch (source) {
      case 'explicit_statement':
        return 0.95;
      case 'correction':
        return 0.9;
      case 'external_import':
        return 0.85;
      case 'observation':
        return 0.7;
      case 'inference':
        return 0.6;
      default:
        return 0.5;
    }
  }
  
  private scoreAndRank(
    candidates: Array<{ memory: Memory; similarity: number }>,
    opts: Required<MemoryRetrievalOptions>
  ): RetrievedMemory[] {
    const now = Date.now();
    
    return candidates
      .map(({ memory, similarity }) => {
        // Calculate recency score
        const lastAccess = memory.metadata.lastAccessedAt?.getTime() ?? memory.metadata.createdAt.getTime();
        const daysSinceAccess = (now - lastAccess) / (1000 * 60 * 60 * 24);
        const recencyScore = Math.exp(-daysSinceAccess / 30) * opts.recencyBoost;
        
        // Calculate importance contribution
        const importanceContrib = memory.importanceScore * opts.importanceBoost;
        
        // Factor in decay
        const decayFactor = memory.decay.score;
        
        // Calculate combined relevance
        const relevanceScore =
          similarity * 0.5 +
          recencyScore * 0.2 +
          importanceContrib * 0.2 +
          decayFactor * 0.1;
        
        return {
          memory,
          similarityScore: similarity,
          relevanceScore,
          scoreBreakdown: {
            similarity,
            recency: recencyScore,
            importance: importanceContrib,
            decay: decayFactor,
          },
        };
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }
  
  private applyDiversitySampling(
    memories: RetrievedMemory[],
    threshold: number
  ): RetrievedMemory[] {
    const selected: RetrievedMemory[] = [];
    
    for (const candidate of memories) {
      // Check if this memory is too similar to already selected ones
      const tooSimilar = selected.some(selected => {
        if (!candidate.memory.embedding || !selected.memory.embedding) {
          return false;
        }
        const similarity = this.cosineSimilarity(
          candidate.memory.embedding.vector,
          selected.memory.embedding.vector
        );
        return similarity > threshold;
      });
      
      if (!tooSimilar) {
        selected.push(candidate);
      }
    }
    
    return selected;
  }
  
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
  
  private async updateAccessCounts(memoryIds: string[]): Promise<void> {
    const now = new Date();
    for (const id of memoryIds) {
      await this.storage.updateAccess(id, now);
    }
  }
  
  private calculateDecay(memory: Memory): number {
    if (memory.decay.protected) {
      return memory.decay.score;
    }
    
    const now = Date.now();
    const lastCalc = memory.decay.lastCalculated.getTime();
    const daysSinceCalc = (now - lastCalc) / (1000 * 60 * 60 * 24);
    
    // Exponential decay with importance protection
    const importanceProtection = 0.5 + memory.importanceScore * 0.5;
    const newScore = memory.decay.score * 
      Math.exp(-memory.decay.ratePerDay * daysSinceCalc * importanceProtection);
    
    return Math.max(0, Math.min(1, newScore));
  }
  
  private determineConsolidationAction(
    memory: Memory,
    decayScore: number
  ): { type: 'promote' | 'demote' | 'archive' | 'delete' | 'keep' } {
    // Very low decay = delete
    if (decayScore < 0.1) {
      return { type: 'delete' };
    }
    
    // Low importance + low decay = demote
    if (memory.importanceScore < 0.3 && decayScore < 0.3) {
      return { type: 'demote' };
    }
    
    // High importance + high access = promote
    if (
      memory.importanceScore > 0.7 &&
      memory.metadata.accessCount > 3 &&
      memory.tier !== 'long-term'
    ) {
      return { type: 'promote' };
    }
    
    // Old but valuable = archive
    const ageInDays = (Date.now() - memory.metadata.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays > 90 && memory.importanceScore > 0.5 && memory.tier === 'long-term') {
      return { type: 'archive' };
    }
    
    return { type: 'keep' };
  }
  
  private recordAction(
    result: ConsolidationResult,
    action: { type: string },
    memory: Memory
  ): void {
    switch (action.type) {
      case 'promote':
        result.promoted.push({
          memoryId: memory.id,
          from: memory.tier,
          to: getPromotionTarget(memory.tier) ?? memory.tier,
        });
        break;
      case 'demote':
        result.demoted.push({
          memoryId: memory.id,
          from: memory.tier,
          to: getDemotionTarget(memory.tier) ?? memory.tier,
        });
        break;
      case 'archive':
        result.archived.push(memory.id);
        break;
      case 'delete':
        result.deleted.push(memory.id);
        break;
    }
  }
  
  private async mergeSimilarMemories(
    memories: Memory[],
    threshold: number
  ): Promise<Array<{ sourceIds: string[]; targetId: string }>> {
    // Group similar memories
    const groups: Memory[][] = [];
    const processed = new Set<string>();
    
    for (const memory of memories) {
      if (processed.has(memory.id) || !memory.embedding) continue;
      
      const similar = memories.filter(other => {
        if (other.id === memory.id || processed.has(other.id) || !other.embedding) {
          return false;
        }
        const similarity = this.cosineSimilarity(
          memory.embedding!.vector,
          other.embedding!.vector
        );
        return similarity >= threshold;
      });
      
      if (similar.length > 0) {
        const group = [memory, ...similar];
        groups.push(group);
        group.forEach(m => processed.add(m.id));
      }
    }
    
    // Merge each group
    const mergeResults: Array<{ sourceIds: string[]; targetId: string }> = [];
    
    for (const group of groups) {
      // Keep the one with highest importance
      const sorted = group.sort((a, b) => b.importanceScore - a.importanceScore);
      const target = sorted[0]!;
      const sources = sorted.slice(1);
      
      // Merge content and metadata
      const mergedContent = this.mergeContent(group);
      await this.storage.update(target.id, {
        content: mergedContent,
        importanceScore: Math.min(1, target.importanceScore + 0.1),
        confidence: {
          ...target.confidence,
          reinforcements: target.confidence.reinforcements + sources.length,
        },
      });
      
      // Delete merged sources
      for (const source of sources) {
        await this.storage.softDelete(source.id);
      }
      
      mergeResults.push({
        sourceIds: sources.map(s => s.id),
        targetId: target.id,
      });
    }
    
    return mergeResults;
  }
  
  private mergeContent(memories: Memory[]): string {
    // Simple merge - take the longest/most detailed
    return memories.reduce((longest, current) =>
      current.content.length > longest.length ? current.content : longest,
      ''
    );
  }
  
  private async triggerConsolidation(
    tenantId: string,
    userId: string
  ): Promise<void> {
    // In production, this would push to a job queue
    await this.consolidate({ tenantId, userId });
  }
}

/**
 * Error thrown when a memory is not found
 */
export class MemoryNotFoundError extends Error {
  constructor(memoryId: string) {
    super(`Memory not found: ${memoryId}`);
    this.name = 'MemoryNotFoundError';
  }
}

/**
 * Error thrown when a memory is rejected (e.g., too low importance)
 */
export class MemoryRejectedError extends Error {
  constructor(reason: string) {
    super(`Memory rejected: ${reason}`);
    this.name = 'MemoryRejectedError';
  }
}
