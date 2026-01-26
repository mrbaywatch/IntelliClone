/**
 * Intelli-Notes Meetings API
 * 
 * Handles meeting CRUD operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createMeetingService, CreateMeetingInput } from '~/lib/meetings';

// =============================================================================
// Validation Schemas
// =============================================================================

const createMeetingSchema = z.object({
  account_id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  platform: z.enum(['zoom', 'teams', 'google_meet', 'manual_upload']).optional(),
  scheduled_start: z.string().datetime().optional(),
  scheduled_end: z.string().datetime().optional(),
  primary_language: z.enum(['nb', 'nn', 'en', 'sv', 'da']).optional(),
  secondary_language: z.enum(['nb', 'nn', 'en', 'sv', 'da']).optional(),
  external_meeting_id: z.string().optional(),
  meeting_url: z.string().url().optional(),
});

const listMeetingsSchema = z.object({
  account_id: z.string().uuid(),
  status: z.enum(['scheduled', 'recording', 'processing', 'completed', 'failed']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

// =============================================================================
// GET - List Meetings
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
    const validation = listMeetingsSchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { account_id, status, limit, offset } = validation.data;

    const meetingService = createMeetingService(client);
    const result = await meetingService.listMeetings(account_id, {
      status,
      limit,
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error listing meetings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Meeting
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const client = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = createMeetingSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const meetingService = createMeetingService(client);
    const meeting = await meetingService.createMeeting(
      validation.data as CreateMeetingInput,
      user.id
    );

    return NextResponse.json(meeting, { status: 201 });
  } catch (error) {
    console.error('Error creating meeting:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
