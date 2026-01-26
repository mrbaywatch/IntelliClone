/**
 * Supabase/PostgreSQL Storage Adapter for Memory System
 *
 * Production-ready storage using Supabase with pgvector for semantic search.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Memory, MemoryTier } from '../types/index.js';
import type { MemoryStorage, MemoryFindCriteria, VectorSearchOptions, VectorSearchResult, ConsolidationQueryOptions } from './storage.js';
/**
 * Supabase storage implementation for the memory system
 */
export declare class SupabaseMemoryStorage implements MemoryStorage {
    private readonly client;
    constructor(client: SupabaseClient);
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
    deleteBatch(ids: string[]): Promise<void>;
    cleanupExpired(): Promise<number>;
    healthCheck(): Promise<boolean>;
    /**
     * Map a database row to a Memory object
     */
    private mapRowToMemory;
}
//# sourceMappingURL=supabase-storage.d.ts.map