/**
 * Intelli-Notes Meeting Service
 * 
 * Core service for managing meetings, transcriptions, and summaries.
 * Integrates with Supabase for data storage.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';
import { getTranscriptionService, TranscriptionService } from './transcription-service';
import { getSummaryService, SummaryService } from './summary-service';
import type {
  Meeting,
  MeetingWithDetails,
  MeetingParticipant,
  Transcript,
  TranscriptSegment,
  MeetingSummary,
  ActionItem,
  CreateMeetingInput,
  UpdateMeetingInput,
  CreateActionItemInput,
  MeetingStatus,
  TranscriptionConfig,
  TranscriptionResult,
  MeetingSearchResult,
  SemanticSearchResult,
} from './types';

// =============================================================================
// Meeting Service
// =============================================================================

export class MeetingService {
  private supabase: SupabaseClient<Database>;
  private transcriptionService: TranscriptionService;
  private summaryService: SummaryService;

  constructor(
    supabase: SupabaseClient<Database>,
    transcriptionService?: TranscriptionService,
    summaryService?: SummaryService
  ) {
    this.supabase = supabase;
    this.transcriptionService = transcriptionService || getTranscriptionService();
    this.summaryService = summaryService || getSummaryService();
  }

  // =============================================================================
  // Meeting CRUD
  // =============================================================================

  /**
   * Create a new meeting
   */
  async createMeeting(input: CreateMeetingInput, userId: string): Promise<Meeting> {
    const { data, error } = await this.supabase
      .from('meetings')
      .insert({
        account_id: input.account_id,
        created_by: userId,
        title: input.title,
        description: input.description,
        platform: input.platform || 'manual_upload',
        status: 'scheduled',
        scheduled_start: input.scheduled_start,
        scheduled_end: input.scheduled_end,
        primary_language: input.primary_language || 'nb',
        secondary_language: input.secondary_language,
        external_meeting_id: input.external_meeting_id,
        meeting_url: input.meeting_url,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Meeting;
  }

  /**
   * Get a meeting by ID
   */
  async getMeeting(meetingId: string): Promise<Meeting | null> {
    const { data, error } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Meeting;
  }

  /**
   * Get a meeting with all related data
   */
  async getMeetingWithDetails(meetingId: string): Promise<MeetingWithDetails | null> {
    const { data: meeting, error: meetingError } = await this.supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (meetingError) {
      if (meetingError.code === 'PGRST116') return null;
      throw meetingError;
    }

    // Fetch related data in parallel
    const [
      { data: participants },
      { data: transcript },
      { data: summary },
      { data: actionItems },
    ] = await Promise.all([
      this.supabase
        .from('meeting_participants')
        .select('*')
        .eq('meeting_id', meetingId),
      this.supabase
        .from('transcripts')
        .select('*')
        .eq('meeting_id', meetingId)
        .single(),
      this.supabase
        .from('meeting_summaries')
        .select('*')
        .eq('meeting_id', meetingId)
        .single(),
      this.supabase
        .from('action_items')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: true }),
    ]);

    return {
      ...meeting,
      participants: participants || [],
      transcript: transcript || undefined,
      summary: summary || undefined,
      action_items: actionItems || [],
    } as MeetingWithDetails;
  }

  /**
   * List meetings for an account
   */
  async listMeetings(
    accountId: string,
    options?: {
      status?: MeetingStatus;
      limit?: number;
      offset?: number;
      orderBy?: 'created_at' | 'scheduled_start';
      orderDirection?: 'asc' | 'desc';
    }
  ): Promise<{ meetings: Meeting[]; total: number }> {
    let query = this.supabase
      .from('meetings')
      .select('*', { count: 'exact' })
      .eq('account_id', accountId);

    if (options?.status) {
      query = query.eq('status', options.status);
    }

    const orderBy = options?.orderBy || 'created_at';
    const orderDirection = options?.orderDirection || 'desc';
    query = query.order(orderBy, { ascending: orderDirection === 'asc' });

    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error, count } = await query;

    if (error) throw error;
    return {
      meetings: (data || []) as Meeting[],
      total: count || 0,
    };
  }

  /**
   * Update a meeting
   */
  async updateMeeting(meetingId: string, input: UpdateMeetingInput): Promise<Meeting> {
    const { data, error } = await this.supabase
      .from('meetings')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', meetingId)
      .select()
      .single();

    if (error) throw error;
    return data as Meeting;
  }

  /**
   * Delete a meeting
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    const { error } = await this.supabase
      .from('meetings')
      .delete()
      .eq('id', meetingId);

    if (error) throw error;
  }

  // =============================================================================
  // Transcription Processing
  // =============================================================================

  /**
   * Process an audio recording and create transcript
   */
  async processRecording(
    meetingId: string,
    audioUrl: string,
    config?: Partial<TranscriptionConfig>
  ): Promise<Transcript> {
    // Update meeting status to processing
    await this.updateMeeting(meetingId, { status: 'processing' });
    await this.supabase
      .from('meetings')
      .update({ processing_started_at: new Date().toISOString() })
      .eq('id', meetingId);

    try {
      // Get meeting for language settings
      const meeting = await this.getMeeting(meetingId);
      if (!meeting) throw new Error('Meeting not found');

      // Transcribe the recording
      const transcriptionConfig: TranscriptionConfig = {
        language: meeting.primary_language as any,
        speaker_diarization: true,
        punctuate: true,
        format_text: true,
        ...config,
      };

      const result = await this.transcriptionService.transcribeFromUrl(
        audioUrl,
        transcriptionConfig
      );

      // Save transcript
      const transcript = await this.saveTranscript(meetingId, result);

      // Save segments
      await this.saveTranscriptSegments(transcript.id, meetingId, result);

      // Update meeting as completed
      await this.supabase
        .from('meetings')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString(),
          duration_seconds: Math.floor(result.audio_duration_ms / 1000),
        })
        .eq('id', meetingId);

      return transcript;
    } catch (error) {
      // Update meeting as failed
      await this.supabase
        .from('meetings')
        .update({
          status: 'failed',
          processing_error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', meetingId);
      throw error;
    }
  }

  /**
   * Save transcript to database
   */
  private async saveTranscript(
    meetingId: string,
    result: TranscriptionResult
  ): Promise<Transcript> {
    const { data, error } = await this.supabase
      .from('transcripts')
      .insert({
        meeting_id: meetingId,
        full_text: result.text,
        detected_language: result.detected_language,
        transcription_service: 'assemblyai',
        transcription_id: result.id,
        confidence_score: result.confidence,
        word_count: result.text.split(/\s+/).length,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Transcript;
  }

  /**
   * Save transcript segments (speaker-identified chunks)
   */
  private async saveTranscriptSegments(
    transcriptId: string,
    meetingId: string,
    result: TranscriptionResult
  ): Promise<void> {
    const segments = result.utterances.map((u, index) => ({
      transcript_id: transcriptId,
      meeting_id: meetingId,
      text: u.text,
      start_time_ms: u.start,
      end_time_ms: u.end,
      speaker_label: u.speaker,
      confidence_score: u.confidence,
      segment_index: index,
    }));

    const { error } = await this.supabase
      .from('transcript_segments')
      .insert(segments);

    if (error) throw error;
  }

  // =============================================================================
  // Summary Generation
  // =============================================================================

  /**
   * Generate summary for a meeting
   */
  async generateSummary(meetingId: string): Promise<MeetingSummary> {
    const meetingWithDetails = await this.getMeetingWithDetails(meetingId);
    if (!meetingWithDetails) throw new Error('Meeting not found');
    if (!meetingWithDetails.transcript) throw new Error('No transcript available');

    const participantNames = meetingWithDetails.participants?.map((p) => p.name) || [];

    const result = await this.summaryService.generateSummary({
      transcript_text: meetingWithDetails.transcript.full_text,
      language: meetingWithDetails.primary_language as any,
      meeting_title: meetingWithDetails.title,
      participants: participantNames,
    });

    // Save summary
    const { data, error } = await this.supabase
      .from('meeting_summaries')
      .upsert({
        meeting_id: meetingId,
        summary_text: result.summary_text,
        key_points: result.key_points as any,
        decisions: result.decisions as any,
        topics: result.topics as any,
        language: meetingWithDetails.primary_language,
      })
      .select()
      .single();

    if (error) throw error;

    // Save extracted action items
    if (result.action_items.length > 0) {
      await this.saveExtractedActionItems(
        meetingId,
        meetingWithDetails.account_id,
        result.action_items
      );
    }

    return data as MeetingSummary;
  }

  /**
   * Save AI-extracted action items
   */
  private async saveExtractedActionItems(
    meetingId: string,
    accountId: string,
    items: Array<{
      title: string;
      assignee_name?: string;
      due_date?: string;
      priority: string;
      confidence: number;
    }>
  ): Promise<void> {
    const actionItems = items.map((item) => ({
      meeting_id: meetingId,
      account_id: accountId,
      title: item.title,
      assignee_name: item.assignee_name,
      due_date: item.due_date,
      priority: item.priority,
      ai_extracted: true,
      confidence_score: item.confidence,
    }));

    await this.supabase.from('action_items').insert(actionItems);
  }

  // =============================================================================
  // Search
  // =============================================================================

  /**
   * Full-text search across transcripts
   */
  async searchTranscripts(
    accountId: string,
    query: string,
    limit: number = 20
  ): Promise<MeetingSearchResult[]> {
    const { data, error } = await this.supabase.rpc('search_transcripts', {
      p_account_id: accountId,
      p_query: query,
      p_limit: limit,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Semantic search using embeddings
   */
  async semanticSearch(
    accountId: string,
    queryEmbedding: number[],
    limit: number = 20,
    threshold: number = 0.7
  ): Promise<SemanticSearchResult[]> {
    const { data, error } = await this.supabase.rpc('semantic_search_segments', {
      p_account_id: accountId,
      p_embedding: queryEmbedding,
      p_limit: limit,
      p_threshold: threshold,
    });

    if (error) throw error;
    return data || [];
  }

  // =============================================================================
  // Action Items
  // =============================================================================

  /**
   * Create an action item
   */
  async createActionItem(input: CreateActionItemInput): Promise<ActionItem> {
    const { data, error } = await this.supabase
      .from('action_items')
      .insert({
        meeting_id: input.meeting_id,
        account_id: input.account_id,
        title: input.title,
        description: input.description,
        assignee_name: input.assignee_name,
        assignee_email: input.assignee_email,
        priority: input.priority || 'medium',
        due_date: input.due_date,
        ai_extracted: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as ActionItem;
  }

  /**
   * Update action item status
   */
  async updateActionItemStatus(
    actionItemId: string,
    status: ActionItem['status'],
    userId?: string
  ): Promise<ActionItem> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = userId;
    }

    const { data, error } = await this.supabase
      .from('action_items')
      .update(updateData)
      .eq('id', actionItemId)
      .select()
      .single();

    if (error) throw error;
    return data as ActionItem;
  }

  /**
   * List action items for an account
   */
  async listActionItems(
    accountId: string,
    options?: {
      meetingId?: string;
      status?: ActionItem['status'];
      assignedUserId?: string;
    }
  ): Promise<ActionItem[]> {
    let query = this.supabase
      .from('action_items')
      .select('*')
      .eq('account_id', accountId)
      .order('created_at', { ascending: false });

    if (options?.meetingId) {
      query = query.eq('meeting_id', options.meetingId);
    }
    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.assignedUserId) {
      query = query.eq('assigned_user_id', options.assignedUserId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as ActionItem[];
  }

  // =============================================================================
  // Participants
  // =============================================================================

  /**
   * Add participant to meeting
   */
  async addParticipant(
    meetingId: string,
    participant: Partial<MeetingParticipant>
  ): Promise<MeetingParticipant> {
    const { data, error } = await this.supabase
      .from('meeting_participants')
      .insert({
        meeting_id: meetingId,
        name: participant.name || 'Unknown',
        email: participant.email,
        user_id: participant.user_id,
        is_host: participant.is_host || false,
        is_organizer: participant.is_organizer || false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as MeetingParticipant;
  }
}

// =============================================================================
// Factory
// =============================================================================

export function createMeetingService(
  supabase: SupabaseClient<Database>
): MeetingService {
  return new MeetingService(supabase);
}
