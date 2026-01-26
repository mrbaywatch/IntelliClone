/**
 * Intelli-Notes Summary API
 * 
 * Handles AI-powered meeting summary generation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createMeetingService } from '~/lib/meetings';

// =============================================================================
// POST - Generate Meeting Summary
// =============================================================================

export async function POST(
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

    const meetingService = createMeetingService(client);
    const summary = await meetingService.generateSummary(meetingId);

    return NextResponse.json({
      message: 'Summary generated successfully',
      summary,
    });
  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// GET - Get Meeting Summary
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

    const { data: summary, error } = await client
      .from('meeting_summaries')
      .select('*')
      .eq('meeting_id', meetingId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Summary not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error getting summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
