-- Simple User Memories for IntelliClone
-- Each user has their own isolated memory

CREATE TABLE IF NOT EXISTS public.user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  category TEXT NOT NULL DEFAULT 'other',
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  
  confidence FLOAT DEFAULT 1.0,
  source TEXT DEFAULT 'conversation',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_user_memories_user_id ON public.user_memories(user_id);

ALTER TABLE public.user_memories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_view_own_memories" ON public.user_memories;
DROP POLICY IF EXISTS "users_insert_own_memories" ON public.user_memories;
DROP POLICY IF EXISTS "users_update_own_memories" ON public.user_memories;
DROP POLICY IF EXISTS "users_delete_own_memories" ON public.user_memories;

CREATE POLICY "users_view_own_memories"
  ON public.user_memories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_memories"
  ON public.user_memories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_update_own_memories"
  ON public.user_memories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "users_delete_own_memories"
  ON public.user_memories FOR DELETE
  USING (auth.uid() = user_id);
