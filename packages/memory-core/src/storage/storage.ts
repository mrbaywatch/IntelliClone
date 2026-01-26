import type {
  Memory,
  MemoryType,
  MemoryTier,
} from '../types/index.js';

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
  // ==================== CRUD Operations ====================
  
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
  
  // ==================== Query Operations ====================
  
  /**
   * Vector similarity search
   */
  vectorSearch(
    queryVector: number[],
    userId: string,
    tenantId: string,
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult[]>;
  
  /**
   * Find memories matching criteria
   */
  findByCriteria(criteria: MemoryFindCriteria): Promise<Memory[]>;
  
  /**
   * Get memories needing consolidation
   */
  getForConsolidation(
    tenantId: string,
    userId?: string,
    options?: ConsolidationQueryOptions
  ): Promise<Memory[]>;
  
  /**
   * Count memories for a user
   */
  countByUser(userId: string, tenantId: string): Promise<number>;
  
  // ==================== Update Operations ====================
  
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
  
  // ==================== Batch Operations ====================
  
  /**
   * Save multiple memories
   */
  saveBatch(memories: Memory[]): Promise<void>;
  
  /**
   * Delete multiple memories
   */
  deleteBatch(ids: string[], hard?: boolean): Promise<void>;
  
  // ==================== Maintenance ====================
  
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
export class InMemoryStorage implements MemoryStorage {
  private memories: Map<string, Memory> = new Map();
  
  async save(memory: Memory): Promise<void> {
    this.memories.set(memory.id, { ...memory });
  }
  
  async get(id: string): Promise<Memory | null> {
    const memory = this.memories.get(id);
    return memory ? { ...memory } : null;
  }
  
  async update(id: string, updates: Partial<Memory>): Promise<Memory> {
    const existing = this.memories.get(id);
    if (!existing) {
      throw new Error(`Memory not found: ${id}`);
    }
    
    const updated: Memory = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date(),
      },
    };
    
    this.memories.set(id, updated);
    return { ...updated };
  }
  
  async softDelete(id: string): Promise<void> {
    const memory = this.memories.get(id);
    if (memory) {
      memory.isDeleted = true;
      this.memories.set(id, memory);
    }
  }
  
  async hardDelete(id: string): Promise<void> {
    this.memories.delete(id);
  }
  
  async vectorSearch(
    queryVector: number[],
    userId: string,
    tenantId: string,
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    const results: VectorSearchResult[] = [];
    
    for (const memory of this.memories.values()) {
      // Apply filters
      if (memory.userId !== userId) continue;
      if (memory.tenantId !== tenantId) continue;
      if (memory.isDeleted && !options.includeDeleted) continue;
      if (options.excludeIds?.includes(memory.id)) continue;
      if (options.types?.length && !options.types.includes(memory.type)) continue;
      if (options.tiers?.length && !options.tiers.includes(memory.tier)) continue;
      if (options.tags?.length && !options.tags.some(t => memory.tags.includes(t))) continue;
      
      // Chatbot filter
      if (options.chatbotId) {
        if (memory.chatbotId !== options.chatbotId) {
          if (!options.includeGlobal || memory.chatbotId) continue;
        }
      }
      
      // Calculate similarity
      if (!memory.embedding) continue;
      const similarity = this.cosineSimilarity(queryVector, memory.embedding.vector);
      
      if (options.minSimilarity && similarity < options.minSimilarity) continue;
      
      results.push({ memory: { ...memory }, similarity });
    }
    
    // Sort by similarity
    results.sort((a, b) => b.similarity - a.similarity);
    
    // Apply limit
    return options.limit ? results.slice(0, options.limit) : results;
  }
  
  async findByCriteria(criteria: MemoryFindCriteria): Promise<Memory[]> {
    const results: Memory[] = [];
    const now = Date.now();
    
    for (const memory of this.memories.values()) {
      if (memory.tenantId !== criteria.tenantId) continue;
      if (criteria.userId && memory.userId !== criteria.userId) continue;
      if (criteria.chatbotId && memory.chatbotId !== criteria.chatbotId) continue;
      if (criteria.types?.length && !criteria.types.includes(memory.type)) continue;
      if (criteria.tags?.length && !criteria.tags.some(t => memory.tags.includes(t))) continue;
      if (criteria.memoryIds?.length && !criteria.memoryIds.includes(memory.id)) continue;
      if (criteria.maxDecayScore !== undefined && memory.decay.score > criteria.maxDecayScore) continue;
      
      if (criteria.olderThanDays !== undefined) {
        const ageMs = now - memory.metadata.createdAt.getTime();
        const ageDays = ageMs / (1000 * 60 * 60 * 24);
        if (ageDays < criteria.olderThanDays) continue;
      }
      
      results.push({ ...memory });
    }
    
    return results;
  }
  
  async getForConsolidation(
    tenantId: string,
    userId?: string,
    options: ConsolidationQueryOptions = {}
  ): Promise<Memory[]> {
    const results: Memory[] = [];
    const now = Date.now();
    const minAgeMs = (options.minAgeHours ?? 24) * 60 * 60 * 1000;
    
    for (const memory of this.memories.values()) {
      if (memory.tenantId !== tenantId) continue;
      if (userId && memory.userId !== userId) continue;
      if (memory.isDeleted) continue;
      if (memory.tier === 'episodic') continue; // Don't consolidate archived
      
      const ageMs = now - memory.metadata.createdAt.getTime();
      if (ageMs < minAgeMs) continue;
      
      results.push({ ...memory });
    }
    
    // Sort by decay score (lowest first = needs attention)
    results.sort((a, b) => a.decay.score - b.decay.score);
    
    return options.limit ? results.slice(0, options.limit) : results;
  }
  
  async countByUser(userId: string, tenantId: string): Promise<number> {
    let count = 0;
    for (const memory of this.memories.values()) {
      if (memory.userId === userId && memory.tenantId === tenantId && !memory.isDeleted) {
        count++;
      }
    }
    return count;
  }
  
  async updateTier(id: string, tier: MemoryTier): Promise<void> {
    const memory = this.memories.get(id);
    if (memory) {
      memory.tier = tier;
      memory.metadata.updatedAt = new Date();
    }
  }
  
  async updateDecay(id: string, score: number): Promise<void> {
    const memory = this.memories.get(id);
    if (memory) {
      memory.decay.score = score;
      memory.decay.lastCalculated = new Date();
    }
  }
  
  async updateAccess(id: string, accessedAt: Date): Promise<void> {
    const memory = this.memories.get(id);
    if (memory) {
      memory.metadata.lastAccessedAt = accessedAt;
      memory.metadata.accessCount++;
    }
  }
  
  async saveBatch(memories: Memory[]): Promise<void> {
    for (const memory of memories) {
      await this.save(memory);
    }
  }
  
  async deleteBatch(ids: string[], hard = false): Promise<void> {
    for (const id of ids) {
      if (hard) {
        await this.hardDelete(id);
      } else {
        await this.softDelete(id);
      }
    }
  }
  
  async cleanupExpired(): Promise<number> {
    const now = Date.now();
    let count = 0;
    
    for (const [id, memory] of this.memories) {
      if (memory.expiresAt && memory.expiresAt.getTime() < now) {
        this.memories.delete(id);
        count++;
      }
    }
    
    return count;
  }
  
  async healthCheck(): Promise<boolean> {
    return true;
  }
  
  // Helper for testing
  clear(): void {
    this.memories.clear();
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
}
