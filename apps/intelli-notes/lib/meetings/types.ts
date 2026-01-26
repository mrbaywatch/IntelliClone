/**
 * Intelli-Notes Meeting Types
 * 
 * Core type definitions for the meeting transcription system.
 */

// =============================================================================
// Enums (matching database)
// =============================================================================

export type MeetingPlatform = 'zoom' | 'teams' | 'google_meet' | 'manual_upload';

export type MeetingStatus = 
  | 'scheduled'
  | 'recording'
  | 'processing'
  | 'completed'
  | 'failed';

export type SpeakerConfidence = 'high' | 'medium' | 'low';

export type ActionItemStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type ActionItemPriority = 'low' | 'medium' | 'high' | 'urgent';

export type CalendarProvider = 'google' | 'outlook';

export type TranscriptionLanguage = 'nb' | 'nn' | 'en' | 'sv' | 'da';

// =============================================================================
// Core Types
// =============================================================================

export interface Meeting {
  id: string;
  account_id: string;
  created_by: string;
  
  title: string;
  description?: string;
  platform: MeetingPlatform;
  status: MeetingStatus;
  
  external_meeting_id?: string;
  meeting_url?: string;
  join_url?: string;
  
  calendar_event_id?: string;
  calendar_connection_id?: string;
  
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  duration_seconds?: number;
  
  recording_url?: string;
  recording_size_bytes?: number;
  
  primary_language: TranscriptionLanguage;
  secondary_language?: TranscriptionLanguage;
  
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  
  created_at: string;
  updated_at: string;
}

export interface MeetingParticipant {
  id: string;
  meeting_id: string;
  
  name: string;
  email?: string;
  user_id?: string;
  
  speaker_id?: string;
  voice_signature?: Record<string, unknown>;
  
  joined_at?: string;
  left_at?: string;
  duration_seconds?: number;
  
  is_host: boolean;
  is_organizer: boolean;
  
  created_at: string;
  updated_at: string;
}

export interface Transcript {
  id: string;
  meeting_id: string;
  
  full_text: string;
  
  detected_language?: string;
  
  transcription_service: string;
  transcription_id?: string;
  confidence_score?: number;
  
  word_count?: number;
  
  created_at: string;
  updated_at: string;
}

export interface TranscriptSegment {
  id: string;
  transcript_id: string;
  meeting_id: string;
  participant_id?: string;
  
  text: string;
  
  start_time_ms: number;
  end_time_ms: number;
  
  speaker_label?: string;
  speaker_confidence?: SpeakerConfidence;
  
  confidence_score?: number;
  
  segment_index: number;
  
  created_at: string;
}

export interface MeetingSummary {
  id: string;
  meeting_id: string;
  
  summary_text: string;
  summary_html?: string;
  
  key_points: KeyPoint[];
  decisions: Decision[];
  topics: Topic[];
  
  language: TranscriptionLanguage;
  
  model_used?: string;
  prompt_tokens?: number;
  completion_tokens?: number;
  
  created_at: string;
  updated_at: string;
}

export interface KeyPoint {
  text: string;
  timestamp_ms?: number;
  speaker?: string;
}

export interface Decision {
  text: string;
  timestamp_ms?: number;
  participants?: string[];
}

export interface Topic {
  name: string;
  start_time_ms?: number;
  end_time_ms?: number;
  summary?: string;
}

export interface ActionItem {
  id: string;
  meeting_id: string;
  account_id: string;
  
  title: string;
  description?: string;
  
  assignee_id?: string;
  assignee_name?: string;
  assignee_email?: string;
  assigned_user_id?: string;
  
  status: ActionItemStatus;
  priority: ActionItemPriority;
  
  due_date?: string;
  
  source_segment_id?: string;
  source_timestamp_ms?: number;
  
  ai_extracted: boolean;
  confidence_score?: number;
  
  completed_at?: string;
  completed_by?: string;
  
  created_at: string;
  updated_at: string;
}

export interface MeetingTag {
  id: string;
  account_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface CalendarConnection {
  id: string;
  account_id: string;
  user_id: string;
  
  provider: CalendarProvider;
  provider_account_id: string;
  provider_email?: string;
  
  sync_enabled: boolean;
  last_synced_at?: string;
  
  created_at: string;
  updated_at: string;
}

// =============================================================================
// Input Types
// =============================================================================

export interface CreateMeetingInput {
  account_id: string;
  title: string;
  description?: string;
  platform?: MeetingPlatform;
  scheduled_start?: string;
  scheduled_end?: string;
  primary_language?: TranscriptionLanguage;
  secondary_language?: TranscriptionLanguage;
  external_meeting_id?: string;
  meeting_url?: string;
}

export interface UpdateMeetingInput {
  title?: string;
  description?: string;
  status?: MeetingStatus;
  scheduled_start?: string;
  scheduled_end?: string;
}

export interface CreateActionItemInput {
  meeting_id: string;
  account_id: string;
  title: string;
  description?: string;
  assignee_name?: string;
  assignee_email?: string;
  priority?: ActionItemPriority;
  due_date?: string;
}

// =============================================================================
// Query Types
// =============================================================================

export interface MeetingWithDetails extends Meeting {
  participants?: MeetingParticipant[];
  transcript?: Transcript;
  summary?: MeetingSummary;
  action_items?: ActionItem[];
  tags?: MeetingTag[];
}

export interface MeetingSearchResult {
  meeting_id: string;
  meeting_title: string;
  transcript_id: string;
  snippet: string;
  rank: number;
}

export interface SemanticSearchResult {
  segment_id: string;
  meeting_id: string;
  meeting_title: string;
  segment_text: string;
  speaker_label?: string;
  start_time_ms: number;
  similarity: number;
}

// =============================================================================
// Transcription Service Types
// =============================================================================

export interface TranscriptionConfig {
  language: TranscriptionLanguage;
  speaker_diarization: boolean;
  speaker_count?: number;
  punctuate: boolean;
  format_text: boolean;
  dual_channel?: boolean;
}

export interface TranscriptionResult {
  id: string;
  text: string;
  utterances: TranscriptionUtterance[];
  words?: TranscriptionWord[];
  confidence: number;
  audio_duration_ms: number;
  detected_language?: string;
}

export interface TranscriptionUtterance {
  speaker: string;
  text: string;
  start: number;
  end: number;
  confidence: number;
  words?: TranscriptionWord[];
}

export interface TranscriptionWord {
  text: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: string;
}

// =============================================================================
// AI Processing Types
// =============================================================================

export interface SummaryGenerationInput {
  transcript_text: string;
  language: TranscriptionLanguage;
  meeting_title: string;
  participants?: string[];
}

export interface SummaryGenerationResult {
  summary_text: string;
  key_points: KeyPoint[];
  decisions: Decision[];
  topics: Topic[];
  action_items: ExtractedActionItem[];
}

export interface ExtractedActionItem {
  title: string;
  description?: string;
  assignee_name?: string;
  due_date?: string;
  priority: ActionItemPriority;
  source_text?: string;
  confidence: number;
}
