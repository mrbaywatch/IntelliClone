export type {
  VectorSearchOptions,
  VectorSearchResult,
  ConsolidationQueryOptions,
  MemoryFindCriteria,
  MemoryStorage,
} from './storage.js';

export { InMemoryStorage } from './storage.js';

// Production storage adapters
export { SupabaseMemoryStorage } from './supabase-storage.js';
