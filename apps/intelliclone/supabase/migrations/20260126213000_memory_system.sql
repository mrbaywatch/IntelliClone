-- ============================================================================
-- IntelliClone Memory System
-- ============================================================================
-- This migration creates the tables needed for the AI memory system.
-- The memory system is what makes IntelliClone special - it remembers users!
-- ============================================================================

-- Enable pgvector extension for vector similarity search
create extension if not exists vector;

-- ============================================================================
-- Memory Types Enum
-- ============================================================================
create type memory_type as enum (
  'fact',        -- "User works at DNB"
  'preference',  -- "User prefers email"
  'event',       -- "Meeting on March 15th"
  'relationship',-- "Reports to Kari"
  'skill',       -- "Proficient in Excel"
  'goal',        -- "Wants to improve writing"
  'context',     -- "Working on Q1 report"
  'feedback'     -- "Found summary helpful"
);

-- Memory source enum
create type memory_source as enum (
  'explicit_statement',  -- User directly stated it
  'inference',           -- Derived from context
  'correction',          -- User corrected previous memory
  'observation',         -- Observed from behavior
  'external_import'      -- Imported from external system
);

-- Memory tier enum
create type memory_tier as enum (
  'working',     -- Current conversation context
  'short_term',  -- Recent (24-72 hours)
  'long_term',   -- Permanent consolidated facts
  'episodic'     -- Historical archive
);

-- ============================================================================
-- Memories Table
-- ============================================================================
create table if not exists public.memories (
  id uuid default gen_random_uuid() primary key,
  
  -- Ownership
  tenant_id uuid not null references public.accounts(id) on delete cascade,
  user_id text not null,  -- External user identifier
  chatbot_id uuid references public.chatbots(id) on delete cascade,
  
  -- Memory content
  tier memory_tier not null default 'short_term',
  type memory_type not null,
  content text not null,
  structured_data jsonb,  -- Extracted subject/predicate/object
  
  -- Scoring
  importance_score float not null default 0.5,
  confidence_score float not null default 0.7,
  confidence_basis text default 'explicit',
  reinforcement_count int not null default 0,
  
  -- Decay
  decay_score float not null default 1.0,
  decay_rate_per_day float not null default 0.01,
  is_protected boolean not null default false,
  
  -- Vector embedding for semantic search
  embedding vector(1536),  -- OpenAI ada-002 dimension
  
  -- Source tracking
  source memory_source not null default 'explicit_statement',
  source_conversation_id uuid references public.conversations(id) on delete set null,
  source_message_ids uuid[],
  
  -- Metadata
  tags text[] default '{}',
  custom_metadata jsonb default '{}',
  
  -- Lifecycle
  is_deleted boolean not null default false,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  access_count int not null default 0,
  
  -- Relationships
  contradicts uuid[],  -- IDs of contradicted memories
  superseded_by uuid references public.memories(id) on delete set null
);

-- Index for fast lookups by user and chatbot
create index idx_memories_tenant_user on public.memories(tenant_id, user_id);
create index idx_memories_chatbot on public.memories(chatbot_id);
create index idx_memories_tier on public.memories(tier);
create index idx_memories_type on public.memories(type);
create index idx_memories_not_deleted on public.memories(is_deleted) where is_deleted = false;

-- Index for vector similarity search
create index idx_memories_embedding on public.memories 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================================
-- Memory Chunks Table (for long content)
-- ============================================================================
create table if not exists public.memory_chunks (
  id uuid default gen_random_uuid() primary key,
  memory_id uuid not null references public.memories(id) on delete cascade,
  sequence int not null,
  total_chunks int not null,
  content text not null,
  embedding vector(1536),
  start_offset int not null,
  length int not null,
  created_at timestamptz not null default now(),
  
  unique(memory_id, sequence)
);

create index idx_memory_chunks_memory on public.memory_chunks(memory_id);
create index idx_memory_chunks_embedding on public.memory_chunks 
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ============================================================================
-- Memory Consolidations Table (track tier transitions)
-- ============================================================================
create table if not exists public.memory_consolidations (
  id uuid default gen_random_uuid() primary key,
  tenant_id uuid not null references public.accounts(id) on delete cascade,
  
  -- What was consolidated
  source_memory_ids uuid[] not null,
  target_memory_id uuid references public.memories(id) on delete set null,
  
  -- Stats
  from_tier memory_tier not null,
  to_tier memory_tier not null,
  memories_processed int not null,
  memories_promoted int not null default 0,
  memories_merged int not null default 0,
  memories_forgotten int not null default 0,
  
  -- Timing
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  duration_ms int,
  
  -- Errors
  error_message text
);

create index idx_consolidations_tenant on public.memory_consolidations(tenant_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Function to search memories by vector similarity
create or replace function search_memories(
  p_tenant_id uuid,
  p_user_id text,
  p_query_embedding vector(1536),
  p_chatbot_id uuid default null,
  p_limit int default 10,
  p_min_similarity float default 0.5,
  p_include_global boolean default true
)
returns table (
  id uuid,
  content text,
  type memory_type,
  tier memory_tier,
  importance_score float,
  confidence_score float,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select 
    m.id,
    m.content,
    m.type,
    m.tier,
    m.importance_score,
    m.confidence_score,
    1 - (m.embedding <=> p_query_embedding) as similarity
  from public.memories m
  where m.tenant_id = p_tenant_id
    and m.user_id = p_user_id
    and m.is_deleted = false
    and (m.expires_at is null or m.expires_at > now())
    and (
      p_include_global 
      or m.chatbot_id = p_chatbot_id 
      or m.chatbot_id is null
    )
    and m.embedding is not null
    and 1 - (m.embedding <=> p_query_embedding) >= p_min_similarity
  order by similarity desc
  limit p_limit;
end;
$$;

-- Function to update memory access stats
create or replace function update_memory_access(p_memory_id uuid)
returns void
language plpgsql
as $$
begin
  update public.memories
  set 
    last_accessed_at = now(),
    access_count = access_count + 1
  where id = p_memory_id;
end;
$$;

-- Function to apply decay to memories
create or replace function apply_memory_decay(
  p_tenant_id uuid,
  p_days_since_last_run float default 1.0
)
returns int
language plpgsql
as $$
declare
  v_updated int;
begin
  update public.memories
  set 
    decay_score = greatest(0, decay_score - (decay_rate_per_day * p_days_since_last_run)),
    updated_at = now()
  where tenant_id = p_tenant_id
    and is_deleted = false
    and is_protected = false
    and decay_score > 0;
    
  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.memories enable row level security;
alter table public.memory_chunks enable row level security;
alter table public.memory_consolidations enable row level security;

-- Memories policies
create policy "Users can view memories for their accounts"
  on public.memories for select
  using (
    tenant_id in (
      select account_id from public.accounts_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can insert memories for their accounts"
  on public.memories for insert
  with check (
    tenant_id in (
      select account_id from public.accounts_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can update memories for their accounts"
  on public.memories for update
  using (
    tenant_id in (
      select account_id from public.accounts_memberships 
      where user_id = auth.uid()
    )
  );

create policy "Users can delete memories for their accounts"
  on public.memories for delete
  using (
    tenant_id in (
      select account_id from public.accounts_memberships 
      where user_id = auth.uid()
    )
  );

-- Memory chunks policies
create policy "Users can view memory chunks for their accounts"
  on public.memory_chunks for select
  using (
    memory_id in (
      select id from public.memories 
      where tenant_id in (
        select account_id from public.accounts_memberships 
        where user_id = auth.uid()
      )
    )
  );

create policy "Users can insert memory chunks for their accounts"
  on public.memory_chunks for insert
  with check (
    memory_id in (
      select id from public.memories 
      where tenant_id in (
        select account_id from public.accounts_memberships 
        where user_id = auth.uid()
      )
    )
  );

-- Consolidations policies
create policy "Users can view consolidations for their accounts"
  on public.memory_consolidations for select
  using (
    tenant_id in (
      select account_id from public.accounts_memberships 
      where user_id = auth.uid()
    )
  );

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger
create or replace function update_memory_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger memories_updated_at
  before update on public.memories
  for each row execute function update_memory_timestamp();

-- ============================================================================
-- Comments
-- ============================================================================

comment on table public.memories is 'Stores user memories for personalized AI interactions';
comment on column public.memories.tier is 'Memory tier: working (active), short_term (recent), long_term (permanent), episodic (archive)';
comment on column public.memories.decay_score is 'Current decay score (1.0 = fresh, 0 = forgotten)';
comment on column public.memories.embedding is 'Vector embedding for semantic similarity search';
comment on function search_memories is 'Search memories by vector similarity with filters';
