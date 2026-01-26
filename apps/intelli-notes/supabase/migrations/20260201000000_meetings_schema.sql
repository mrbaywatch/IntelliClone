-- =============================================================================
-- Intelli-Notes: Meeting Transcription & AI Summary Tables
-- =============================================================================

-- Enable vector extension for embeddings (if not already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- =============================================================================
-- ENUM Types
-- =============================================================================

-- Meeting platform types
CREATE TYPE public.meeting_platform AS ENUM (
  'zoom',
  'teams',
  'google_meet',
  'manual_upload'
);

-- Meeting status
CREATE TYPE public.meeting_status AS ENUM (
  'scheduled',
  'recording',
  'processing',
  'completed',
  'failed'
);

-- Transcript segment speaker confidence
CREATE TYPE public.speaker_confidence AS ENUM (
  'high',
  'medium',
  'low'
);

-- Action item status
CREATE TYPE public.action_item_status AS ENUM (
  'pending',
  'in_progress',
  'completed',
  'cancelled'
);

-- Action item priority
CREATE TYPE public.action_item_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- =============================================================================
-- Calendar Connections Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Calendar provider info
  provider text NOT NULL CHECK (provider IN ('google', 'outlook')),
  provider_account_id text NOT NULL,
  provider_email text,
  
  -- OAuth tokens (encrypted at rest)
  access_token text NOT NULL,
  refresh_token text,
  token_expires_at timestamptz,
  
  -- Sync settings
  sync_enabled boolean DEFAULT true,
  last_synced_at timestamptz,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (account_id, provider, provider_account_id)
);

-- =============================================================================
-- Meetings Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Meeting metadata
  title text NOT NULL,
  description text,
  platform public.meeting_platform NOT NULL DEFAULT 'manual_upload',
  status public.meeting_status NOT NULL DEFAULT 'scheduled',
  
  -- External meeting info
  external_meeting_id text,
  meeting_url text,
  join_url text,
  
  -- Calendar event reference
  calendar_event_id text,
  calendar_connection_id uuid REFERENCES public.calendar_connections(id) ON DELETE SET NULL,
  
  -- Timing
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  duration_seconds integer,
  
  -- Recording
  recording_url text,
  recording_size_bytes bigint,
  
  -- Language settings
  primary_language text NOT NULL DEFAULT 'nb', -- Norwegian bokmål
  secondary_language text DEFAULT 'en',
  
  -- Processing metadata
  processing_started_at timestamptz,
  processing_completed_at timestamptz,
  processing_error text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- Meeting Participants Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.meeting_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  
  -- Participant info
  name text NOT NULL,
  email text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Speaker identification
  speaker_id text, -- From transcription service
  voice_signature jsonb, -- For speaker identification
  
  -- Attendance
  joined_at timestamptz,
  left_at timestamptz,
  duration_seconds integer,
  
  -- Role
  is_host boolean DEFAULT false,
  is_organizer boolean DEFAULT false,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (meeting_id, email)
);

-- =============================================================================
-- Transcripts Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.transcripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  
  -- Full transcript text
  full_text text NOT NULL,
  
  -- Language
  detected_language text,
  
  -- Transcription service metadata
  transcription_service text NOT NULL DEFAULT 'assemblyai',
  transcription_id text,
  confidence_score real,
  
  -- Word count
  word_count integer,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (meeting_id)
);

-- =============================================================================
-- Transcript Segments Table (for speaker-identified chunks)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.transcript_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transcript_id uuid NOT NULL REFERENCES public.transcripts(id) ON DELETE CASCADE,
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  participant_id uuid REFERENCES public.meeting_participants(id) ON DELETE SET NULL,
  
  -- Segment content
  text text NOT NULL,
  
  -- Timing
  start_time_ms integer NOT NULL,
  end_time_ms integer NOT NULL,
  
  -- Speaker identification
  speaker_label text, -- e.g., "Speaker A", "Speaker B"
  speaker_confidence public.speaker_confidence DEFAULT 'medium',
  
  -- Confidence
  confidence_score real,
  
  -- Embedding for semantic search
  embedding vector(1536), -- OpenAI ada-002 dimension
  
  -- Position in transcript
  segment_index integer NOT NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- =============================================================================
-- Meeting Summaries Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.meeting_summaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  
  -- Summary content (in Norwegian by default)
  summary_text text NOT NULL,
  summary_html text,
  
  -- Structured summary data
  key_points jsonb DEFAULT '[]'::jsonb, -- Array of key discussion points
  decisions jsonb DEFAULT '[]'::jsonb, -- Array of decisions made
  topics jsonb DEFAULT '[]'::jsonb, -- Topics discussed with time ranges
  
  -- Summary language
  language text NOT NULL DEFAULT 'nb',
  
  -- AI generation metadata
  model_used text,
  prompt_tokens integer,
  completion_tokens integer,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  UNIQUE (meeting_id, language)
);

-- =============================================================================
-- Action Items Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Action item content
  title text NOT NULL,
  description text,
  
  -- Assignment
  assignee_id uuid REFERENCES public.meeting_participants(id) ON DELETE SET NULL,
  assignee_name text,
  assignee_email text,
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Status and priority
  status public.action_item_status NOT NULL DEFAULT 'pending',
  priority public.action_item_priority NOT NULL DEFAULT 'medium',
  
  -- Due date
  due_date date,
  
  -- Source context
  source_segment_id uuid REFERENCES public.transcript_segments(id) ON DELETE SET NULL,
  source_timestamp_ms integer, -- When in the meeting this was mentioned
  
  -- AI extraction metadata
  ai_extracted boolean DEFAULT false,
  confidence_score real,
  
  -- Completion
  completed_at timestamptz,
  completed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================================================
-- Meeting Tags Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.meeting_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6366f1', -- Default indigo
  
  created_at timestamptz DEFAULT now(),
  
  UNIQUE (account_id, name)
);

CREATE TABLE IF NOT EXISTS public.meeting_tag_associations (
  meeting_id uuid NOT NULL REFERENCES public.meetings(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.meeting_tags(id) ON DELETE CASCADE,
  
  created_at timestamptz DEFAULT now(),
  
  PRIMARY KEY (meeting_id, tag_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================

-- Meetings indexes
CREATE INDEX idx_meetings_account_id ON public.meetings(account_id);
CREATE INDEX idx_meetings_status ON public.meetings(status);
CREATE INDEX idx_meetings_scheduled_start ON public.meetings(scheduled_start);
CREATE INDEX idx_meetings_created_by ON public.meetings(created_by);
CREATE INDEX idx_meetings_platform ON public.meetings(platform);

-- Transcript segments indexes
CREATE INDEX idx_transcript_segments_meeting_id ON public.transcript_segments(meeting_id);
CREATE INDEX idx_transcript_segments_transcript_id ON public.transcript_segments(transcript_id);
CREATE INDEX idx_transcript_segments_participant_id ON public.transcript_segments(participant_id);

-- Vector similarity search index
CREATE INDEX idx_transcript_segments_embedding ON public.transcript_segments 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Action items indexes
CREATE INDEX idx_action_items_meeting_id ON public.action_items(meeting_id);
CREATE INDEX idx_action_items_account_id ON public.action_items(account_id);
CREATE INDEX idx_action_items_status ON public.action_items(status);
CREATE INDEX idx_action_items_assignee ON public.action_items(assigned_user_id);
CREATE INDEX idx_action_items_due_date ON public.action_items(due_date);

-- Calendar connections indexes
CREATE INDEX idx_calendar_connections_account_id ON public.calendar_connections(account_id);
CREATE INDEX idx_calendar_connections_user_id ON public.calendar_connections(user_id);

-- =============================================================================
-- Full Text Search
-- =============================================================================

-- Add tsvector column for full-text search on transcripts
ALTER TABLE public.transcripts ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_transcript_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('norwegian', coalesce(NEW.full_text, '')), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search vector
DROP TRIGGER IF EXISTS transcript_search_vector_update ON public.transcripts;
CREATE TRIGGER transcript_search_vector_update
  BEFORE INSERT OR UPDATE OF full_text ON public.transcripts
  FOR EACH ROW EXECUTE FUNCTION update_transcript_search_vector();

-- Create GIN index for full-text search
CREATE INDEX idx_transcripts_search ON public.transcripts USING gin(search_vector);

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transcript_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_tag_associations ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can access data for accounts they are members of

-- Calendar connections policies
CREATE POLICY calendar_connections_select ON public.calendar_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = calendar_connections.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY calendar_connections_insert ON public.calendar_connections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = calendar_connections.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY calendar_connections_update ON public.calendar_connections
  FOR UPDATE USING (
    user_id = auth.uid()
  );

CREATE POLICY calendar_connections_delete ON public.calendar_connections
  FOR DELETE USING (
    user_id = auth.uid()
  );

-- Meetings policies
CREATE POLICY meetings_select ON public.meetings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = meetings.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY meetings_insert ON public.meetings
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = meetings.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY meetings_update ON public.meetings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = meetings.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY meetings_delete ON public.meetings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = meetings.account_id
        AND accounts_memberships.user_id = auth.uid()
        AND accounts_memberships.account_role IN ('owner', 'admin')
    )
  );

-- Meeting participants policies
CREATE POLICY meeting_participants_all ON public.meeting_participants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.accounts_memberships am ON am.account_id = m.account_id
      WHERE m.id = meeting_participants.meeting_id
        AND am.user_id = auth.uid()
    )
  );

-- Transcripts policies
CREATE POLICY transcripts_all ON public.transcripts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.accounts_memberships am ON am.account_id = m.account_id
      WHERE m.id = transcripts.meeting_id
        AND am.user_id = auth.uid()
    )
  );

-- Transcript segments policies
CREATE POLICY transcript_segments_all ON public.transcript_segments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.accounts_memberships am ON am.account_id = m.account_id
      WHERE m.id = transcript_segments.meeting_id
        AND am.user_id = auth.uid()
    )
  );

-- Meeting summaries policies
CREATE POLICY meeting_summaries_all ON public.meeting_summaries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.accounts_memberships am ON am.account_id = m.account_id
      WHERE m.id = meeting_summaries.meeting_id
        AND am.user_id = auth.uid()
    )
  );

-- Action items policies
CREATE POLICY action_items_select ON public.action_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = action_items.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY action_items_insert ON public.action_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = action_items.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY action_items_update ON public.action_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = action_items.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY action_items_delete ON public.action_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = action_items.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

-- Meeting tags policies
CREATE POLICY meeting_tags_all ON public.meeting_tags
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.accounts_memberships
      WHERE accounts_memberships.account_id = meeting_tags.account_id
        AND accounts_memberships.user_id = auth.uid()
    )
  );

CREATE POLICY meeting_tag_associations_all ON public.meeting_tag_associations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.meetings m
      JOIN public.accounts_memberships am ON am.account_id = m.account_id
      WHERE m.id = meeting_tag_associations.meeting_id
        AND am.user_id = auth.uid()
    )
  );

-- =============================================================================
-- Functions for searching transcripts
-- =============================================================================

-- Full-text search function
CREATE OR REPLACE FUNCTION search_transcripts(
  p_account_id uuid,
  p_query text,
  p_limit integer DEFAULT 20
)
RETURNS TABLE (
  meeting_id uuid,
  meeting_title text,
  transcript_id uuid,
  snippet text,
  rank real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as meeting_id,
    m.title as meeting_title,
    t.id as transcript_id,
    ts_headline('norwegian', t.full_text, websearch_to_tsquery('norwegian', p_query),
      'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20') as snippet,
    ts_rank(t.search_vector, websearch_to_tsquery('norwegian', p_query)) as rank
  FROM public.transcripts t
  JOIN public.meetings m ON m.id = t.meeting_id
  WHERE m.account_id = p_account_id
    AND t.search_vector @@ websearch_to_tsquery('norwegian', p_query)
  ORDER BY rank DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Semantic search function (using embeddings)
CREATE OR REPLACE FUNCTION semantic_search_segments(
  p_account_id uuid,
  p_embedding vector(1536),
  p_limit integer DEFAULT 20,
  p_threshold real DEFAULT 0.7
)
RETURNS TABLE (
  segment_id uuid,
  meeting_id uuid,
  meeting_title text,
  segment_text text,
  speaker_label text,
  start_time_ms integer,
  similarity real
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id as segment_id,
    m.id as meeting_id,
    m.title as meeting_title,
    ts.text as segment_text,
    ts.speaker_label,
    ts.start_time_ms,
    1 - (ts.embedding <=> p_embedding) as similarity
  FROM public.transcript_segments ts
  JOIN public.meetings m ON m.id = ts.meeting_id
  WHERE m.account_id = p_account_id
    AND ts.embedding IS NOT NULL
    AND 1 - (ts.embedding <=> p_embedding) > p_threshold
  ORDER BY ts.embedding <=> p_embedding
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
