/**
 * Intelli-Notes Search API
 * 
 * Full-text search across meeting transcripts.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createMeetingService } from '~/lib/meetings';

// =============================================================================
// Validation
// =============================================================================

const searchSchema = z.object({
  account_id: z.string().uuid(),
  query: z.string().min(1).max(500),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

// =============================================================================
// GET - Search Transcripts
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const validation = searchSchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { account_id, query, limit } = validation.data;

    const meetingService = createMeetingService(client);
    const results = await meetingService.searchTranscripts(account_id, query, limit);

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error searching transcripts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
