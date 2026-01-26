/**
 * Intelli-Notes Transcription API
 * 
 * Handles audio upload and transcription processing.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createMeetingService } from '~/lib/meetings';

// =============================================================================
// Validation
// =============================================================================

const transcribeUrlSchema = z.object({
  audio_url: z.string().url(),
  speaker_count: z.number().int().min(1).max(20).optional(),
});

// =============================================================================
// POST - Start Transcription from URL
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

    const body = await request.json();
    const validation = transcribeUrlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { audio_url, speaker_count } = validation.data;

    const meetingService = createMeetingService(client);
    
    // Start processing in background
    // In production, this would be handled by a background job queue
    const transcript = await meetingService.processRecording(
      meetingId,
      audio_url,
      { speaker_count }
    );

    return NextResponse.json({
      message: 'Transcription completed',
      transcript,
    });
  } catch (error) {
    console.error('Error starting transcription:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
