/**
 * Typed Supabase hook for intelli-agents
 * This provides properly typed database access for agent-specific tables
 */

import { useSupabase as useSupabaseBase } from '@kit/supabase/hooks/use-supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

/**
 * Returns a typed Supabase client for the intelli-agents database schema
 */
export function useTypedSupabase() {
  const supabase = useSupabaseBase();
  return supabase as unknown as SupabaseClient<Database>;
}

// Re-export for convenience
export { useSupabaseBase as useSupabase };
