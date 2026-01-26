/**
 * Supabase/PostgreSQL Storage Adapter for Memory System
 * 
 * Production-ready storage using Supabase with pgvector for semantic search.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Memory,
  MemoryTier,
  MemoryType,
  MemorySource,
} from '../types/index.js';
import type {
  MemoryStorage,
  MemoryFindCriteria,
  VectorSearchOptions,
  VectorSearchResult,
  ConsolidationQueryOptions,
} from './storage.js';

// Database row type (simplified)
interface MemoryRow {
  id: string;
  tenant_id: string;
  user_id: string;
  chatbot_id: string | null;
  tier: string;
  type: string;
  content: string;
  structured_data: unknown;
  importance_score: number;
  confidence_score: number;
  confidence_basis: string;
  reinforcement_count: number;
  decay_score: number;
  decay_rate_per_day: number;
  is_protected: boolean;
  embedding: number[] | null;
  source: string;
  source_conversation_id: string | null;
  source_message_ids: string[] | null;
  tags: string[];
  custom_metadata: Record<string, unknown>;
  is_deleted: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
  access_count: number;
  contradicts: string[] | null;
  superseded_by: string | null;
}

/**
 * Supabase storage implementation for the memory system
 */
export class SupabaseMemoryStorage implements MemoryStorage {
  constructor(private readonly client: SupabaseClient) {}

  async save(memory: Memory): Promise<void> {
    const { error } = await this.client
      .from('memories')
      .insert({
        id: memory.id,
        tenant_id: memory.tenantId,
        user_id: memory.userId,
        chatbot_id: memory.chatbotId,
        tier: memory.tier,
        type: memory.type,
        content: memory.content,
        structured_data: memory.structuredData,
        importance_score: memory.importanceScore,
        confidence_score: memory.confidence.score,
        confidence_basis: memory.confidence.basis,
        reinforcement_count: memory.confidence.reinforcements,
        decay_score: memory.decay.score,
        decay_rate_per_day: memory.decay.ratePerDay,
        is_protected: memory.decay.protected,
        embedding: memory.embedding?.vector,
        source: memory.metadata.source,
        source_conversation_id: memory.metadata.sourceConversationId,
        source_message_ids: memory.metadata.sourceMessageIds,
        tags: memory.tags,
        custom_metadata: memory.metadata.custom,
        is_deleted: memory.isDeleted,
        expires_at: memory.expiresAt?.toISOString(),
        created_at: memory.metadata.createdAt.toISOString(),
        updated_at: memory.metadata.updatedAt.toISOString(),
        last_accessed_at: memory.metadata.lastAccessedAt?.toISOString(),
        access_count: memory.metadata.accessCount,
        contradicts: memory.contradicts,
        superseded_by: memory.supersededBy,
      });

    if (error) {
      throw new Error(`Failed to save memory: ${error.message}`);
    }
  }

  async get(id: string): Promise<Memory | null> {
    const { data, error } = await this.client
      .from('memories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to get memory: ${error.message}`);
    }

    return this.mapRowToMemory(data as MemoryRow);
  }

  async update(id: string, updates: Partial<Memory>): Promise<Memory> {
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.content !== undefined) updateData.content = updates.content;
    if (updates.structuredData !== undefined) updateData.structured_data = updates.structuredData;
    if (updates.importanceScore !== undefined) updateData.importance_score = updates.importanceScore;
    if (updates.tier !== undefined) updateData.tier = updates.tier;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.isDeleted !== undefined) updateData.is_deleted = updates.isDeleted;
    if (updates.confidence !== undefined) {
      updateData.confidence_score = updates.confidence.score;
      updateData.confidence_basis = updates.confidence.basis;
      updateData.reinforcement_count = updates.confidence.reinforcements;
    }
    if (updates.decay !== undefined) {
      updateData.decay_score = updates.decay.score;
      updateData.decay_rate_per_day = updates.decay.ratePerDay;
      updateData.is_protected = updates.decay.protected;
    }
    if (updates.embedding !== undefined) {
      updateData.embedding = updates.embedding?.vector;
    }
    if (updates.metadata?.custom !== undefined) {
      updateData.custom_metadata = updates.metadata.custom;
    }

    const { data, error } = await this.client
      .from('memories')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update memory: ${error.message}`);
    }

    return this.mapRowToMemory(data as MemoryRow);
  }

  async softDelete(id: string): Promise<void> {
    const { error } = await this.client
      .from('memories')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to soft delete memory: ${error.message}`);
    }
  }

  async hardDelete(id: string): Promise<void> {
    const { error } = await this.client
      .from('memories')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to hard delete memory: ${error.message}`);
    }
  }

  async vectorSearch(
    queryVector: number[],
    userId: string,
    tenantId: string,
    options?: VectorSearchOptions
  ): Promise<VectorSearchResult[]> {
    const { data, error } = await this.client.rpc('search_memories', {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_query_embedding: queryVector,
      p_chatbot_id: options?.chatbotId,
      p_limit: options?.limit || 10,
      p_min_similarity: options?.minSimilarity || 0.5,
      p_include_global: options?.includeGlobal ?? true,
    });

    if (error) {
      throw new Error(`Failed to search memories: ${error.message}`);
    }

    return (data as Array<{
      id: string;
      content: string;
      type: string;
      tier: string;
      importance_score: number;
      confidence_score: number;
      similarity: number;
    }>).map((row) => ({
      memory: {
        id: row.id,
        content: row.content,
        type: row.type as MemoryType,
        tier: row.tier as MemoryTier,
        importanceScore: row.importance_score,
        tenantId,
        userId,
        confidence: { 
          score: row.confidence_score, 
          basis: 'explicit' as const, 
          reinforcements: 0, 
          lastUpdated: new Date() 
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          lastAccessedAt: null,
          accessCount: 0,
          source: 'explicit_statement' as MemorySource,
        },
        decay: {
          score: 1,
          ratePerDay: 0.01,
          lastCalculated: new Date(),
          protected: false,
        },
        tags: [],
        isDeleted: false,
      } as Memory,
      similarity: row.similarity,
    }));
  }

  async findByCriteria(criteria: MemoryFindCriteria): Promise<Memory[]> {
    let query = this.client
      .from('memories')
      .select('*')
      .eq('tenant_id', criteria.tenantId);

    if (criteria.userId) query = query.eq('user_id', criteria.userId);
    if (criteria.chatbotId) query = query.eq('chatbot_id', criteria.chatbotId);
    if (criteria.types && criteria.types.length > 0) {
      query = query.in('type', criteria.types);
    }
    // Always exclude deleted unless explicitly requested
    query = query.eq('is_deleted', false);

    if (criteria.maxDecayScore !== undefined) {
      query = query.lte('decay_score', criteria.maxDecayScore);
    }
    if (criteria.olderThanDays !== undefined) {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - criteria.olderThanDays);
      query = query.lt('created_at', cutoff.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find memories: ${error.message}`);
    }

    return (data as MemoryRow[]).map(row => this.mapRowToMemory(row));
  }

  async getForConsolidation(
    tenantId: string,
    userId?: string,
    options?: ConsolidationQueryOptions
  ): Promise<Memory[]> {
    let query = this.client
      .from('memories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('tier', 'short_term')
      .eq('is_deleted', false);

    if (userId) query = query.eq('user_id', userId);
    
    if (options?.minAgeHours) {
      const cutoff = new Date();
      cutoff.setHours(cutoff.getHours() - options.minAgeHours);
      query = query.lt('created_at', cutoff.toISOString());
    }
    
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to get memories for consolidation: ${error.message}`);
    }

    return (data as MemoryRow[]).map(row => this.mapRowToMemory(row));
  }

  async countByUser(userId: string, tenantId: string): Promise<number> {
    const { count, error } = await this.client
      .from('memories')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .eq('is_deleted', false);

    if (error) {
      throw new Error(`Failed to count memories: ${error.message}`);
    }

    return count || 0;
  }

  async updateTier(id: string, tier: MemoryTier): Promise<void> {
    const { error } = await this.client
      .from('memories')
      .update({ tier, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update memory tier: ${error.message}`);
    }
  }

  async updateDecay(id: string, score: number): Promise<void> {
    const { error } = await this.client
      .from('memories')
      .update({ decay_score: score, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to update memory decay: ${error.message}`);
    }
  }

  async updateAccess(id: string, accessedAt: Date): Promise<void> {
    const { error } = await this.client.rpc('update_memory_access', {
      p_memory_id: id,
    });

    if (error) {
      throw new Error(`Failed to update memory access: ${error.message}`);
    }
  }

  async saveBatch(memories: Memory[]): Promise<void> {
    const rows = memories.map(memory => ({
      id: memory.id,
      tenant_id: memory.tenantId,
      user_id: memory.userId,
      chatbot_id: memory.chatbotId,
      tier: memory.tier,
      type: memory.type,
      content: memory.content,
      structured_data: memory.structuredData,
      importance_score: memory.importanceScore,
      confidence_score: memory.confidence.score,
      confidence_basis: memory.confidence.basis,
      reinforcement_count: memory.confidence.reinforcements,
      decay_score: memory.decay.score,
      decay_rate_per_day: memory.decay.ratePerDay,
      is_protected: memory.decay.protected,
      embedding: memory.embedding?.vector,
      source: memory.metadata.source,
      tags: memory.tags,
      custom_metadata: memory.metadata.custom,
      is_deleted: memory.isDeleted,
    }));

    const { error } = await this.client
      .from('memories')
      .insert(rows);

    if (error) {
      throw new Error(`Failed to save batch: ${error.message}`);
    }
  }

  async deleteBatch(ids: string[]): Promise<void> {
    const { error } = await this.client
      .from('memories')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (error) {
      throw new Error(`Failed to delete batch: ${error.message}`);
    }
  }

  async cleanupExpired(): Promise<number> {
    const { data, error } = await this.client
      .from('memories')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) {
      throw new Error(`Failed to cleanup expired memories: ${error.message}`);
    }

    return data?.length || 0;
  }

  async healthCheck(): Promise<boolean> {
    try {
      const { error } = await this.client
        .from('memories')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  }

  /**
   * Map a database row to a Memory object
   */
  private mapRowToMemory(row: MemoryRow): Memory {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      userId: row.user_id,
      chatbotId: row.chatbot_id ?? undefined,
      tier: row.tier as MemoryTier,
      type: row.type as MemoryType,
      content: row.content,
      structuredData: row.structured_data as Memory['structuredData'],
      importanceScore: row.importance_score,
      confidence: {
        score: row.confidence_score,
        basis: row.confidence_basis as 'explicit' | 'inferred' | 'repeated' | 'corrected',
        reinforcements: row.reinforcement_count,
        lastUpdated: new Date(row.updated_at),
      },
      metadata: {
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        lastAccessedAt: row.last_accessed_at ? new Date(row.last_accessed_at) : null,
        accessCount: row.access_count,
        source: row.source as MemorySource,
        sourceConversationId: row.source_conversation_id ?? undefined,
        sourceMessageIds: row.source_message_ids ?? undefined,
        custom: row.custom_metadata,
      },
      embedding: row.embedding ? {
        vector: row.embedding,
        model: 'text-embedding-3-small',
        dimension: 1536,
        generatedAt: new Date(row.updated_at),
      } : undefined,
      decay: {
        score: row.decay_score,
        ratePerDay: row.decay_rate_per_day,
        lastCalculated: new Date(row.updated_at),
        protected: row.is_protected,
      },
      tags: row.tags || [],
      contradicts: row.contradicts ?? undefined,
      supersededBy: row.superseded_by ? [row.superseded_by] : undefined,
      isDeleted: row.is_deleted,
      expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    };
  }
}
