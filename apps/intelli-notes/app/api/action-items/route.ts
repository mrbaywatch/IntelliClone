/**
 * Intelli-Notes Action Items API
 * 
 * Handles action item CRUD operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createMeetingService, CreateActionItemInput } from '~/lib/meetings';

// =============================================================================
// Validation Schemas
// =============================================================================

const createActionItemSchema = z.object({
  meeting_id: z.string().uuid(),
  account_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  assignee_name: z.string().optional(),
  assignee_email: z.string().email().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional(),
});

const listActionItemsSchema = z.object({
  account_id: z.string().uuid(),
  meeting_id: z.string().uuid().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
});

// =============================================================================
// GET - List Action Items
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
    const validation = listActionItemsSchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { account_id, meeting_id, status } = validation.data;

    const meetingService = createMeetingService(client);
    const actionItems = await meetingService.listActionItems(account_id, {
      meetingId: meeting_id,
      status,
    });

    return NextResponse.json({ action_items: actionItems });
  } catch (error) {
    console.error('Error listing action items:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST - Create Action Item
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
    const validation = createActionItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const meetingService = createMeetingService(client);
    const actionItem = await meetingService.createActionItem(
      validation.data as CreateActionItemInput
    );

    return NextResponse.json(actionItem, { status: 201 });
  } catch (error) {
    console.error('Error creating action item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
