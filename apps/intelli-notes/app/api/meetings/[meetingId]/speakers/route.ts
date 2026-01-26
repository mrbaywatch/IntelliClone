/**
 * Intelli-Notes Speaker Analysis API
 * 
 * Provides speaker statistics and talk time analysis for meetings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// =============================================================================
// GET - Get Speaker Analysis
// =============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ meetingId: string }> }
) {
  try {
    const { meetingId } = await params;
    const client = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get meeting to verify access
    const { data: meeting, error: meetingError } = await client
      .from('meetings')
      .select('id, title, duration_seconds')
      .eq('id', meetingId)
      .single();

    if (meetingError || !meeting) {
      return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
    }

    // Get transcript segments with speaker labels
    const { data: segments, error: segmentsError } = await client
      .from('transcript_segments')
      .select('speaker_label, start_time_ms, end_time_ms, text')
      .eq('meeting_id', meetingId)
      .order('segment_index', { ascending: true });

    if (segmentsError) throw segmentsError;

    if (!segments || segments.length === 0) {
      return NextResponse.json({
        meeting_id: meetingId,
        meeting_title: meeting.title,
        total_duration_ms: (meeting.duration_seconds || 0) * 1000,
        speakers: [],
        segments_count: 0,
      });
    }

    // Analyze speaker statistics
    const speakerStats = new Map<string, {
      talk_time_ms: number;
      segment_count: number;
      word_count: number;
      first_spoke_at_ms: number;
      last_spoke_at_ms: number;
    }>();

    let totalTalkTime = 0;
    let totalWords = 0;

    segments.forEach((segment) => {
      const speaker = segment.speaker_label || 'Unknown';
      const duration = segment.end_time_ms - segment.start_time_ms;
      const words = segment.text.split(/\s+/).length;

      totalTalkTime += duration;
      totalWords += words;

      const current = speakerStats.get(speaker) || {
        talk_time_ms: 0,
        segment_count: 0,
        word_count: 0,
        first_spoke_at_ms: segment.start_time_ms,
        last_spoke_at_ms: segment.end_time_ms,
      };

      speakerStats.set(speaker, {
        talk_time_ms: current.talk_time_ms + duration,
        segment_count: current.segment_count + 1,
        word_count: current.word_count + words,
        first_spoke_at_ms: Math.min(current.first_spoke_at_ms, segment.start_time_ms),
        last_spoke_at_ms: Math.max(current.last_spoke_at_ms, segment.end_time_ms),
      });
    });

    // Convert to array and add percentages
    const speakers = Array.from(speakerStats.entries()).map(([label, stats]) => ({
      speaker_label: label,
      talk_time_ms: stats.talk_time_ms,
      talk_time_percentage: totalTalkTime > 0
        ? Math.round((stats.talk_time_ms / totalTalkTime) * 100)
        : 0,
      segment_count: stats.segment_count,
      word_count: stats.word_count,
      word_percentage: totalWords > 0
        ? Math.round((stats.word_count / totalWords) * 100)
        : 0,
      avg_segment_duration_ms: Math.round(stats.talk_time_ms / stats.segment_count),
      first_spoke_at_ms: stats.first_spoke_at_ms,
      last_spoke_at_ms: stats.last_spoke_at_ms,
      words_per_minute: stats.talk_time_ms > 0
        ? Math.round((stats.word_count / stats.talk_time_ms) * 60000)
        : 0,
    })).sort((a, b) => b.talk_time_ms - a.talk_time_ms);

    // Calculate conversation dynamics
    let speakerChanges = 0;
    let lastSpeaker: string | null = null;
    segments.forEach((segment) => {
      const speaker = segment.speaker_label || 'Unknown';
      if (lastSpeaker && lastSpeaker !== speaker) {
        speakerChanges++;
      }
      lastSpeaker = speaker;
    });

    return NextResponse.json({
      meeting_id: meetingId,
      meeting_title: meeting.title,
      total_duration_ms: (meeting.duration_seconds || 0) * 1000,
      total_talk_time_ms: totalTalkTime,
      total_word_count: totalWords,
      segments_count: segments.length,
      speaker_count: speakers.length,
      speaker_changes: speakerChanges,
      avg_words_per_minute: totalTalkTime > 0
        ? Math.round((totalWords / totalTalkTime) * 60000)
        : 0,
      speakers,
    });
  } catch (error) {
    console.error('Error fetching speaker analysis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
