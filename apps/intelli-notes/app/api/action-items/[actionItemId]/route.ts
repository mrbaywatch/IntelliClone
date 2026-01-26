/**
 * Intelli-Notes Action Item Detail API
 * 
 * Handles individual action item operations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { createMeetingService } from '~/lib/meetings';

// =============================================================================
// Validation Schemas
// =============================================================================

const updateActionItemSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  due_date: z.string().optional(),
  assignee_name: z.string().optional(),
  assignee_email: z.string().email().optional(),
});

// =============================================================================
// PATCH - Update Action Item
// =============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ actionItemId: string }> }
) {
  try {
    const { actionItemId } = await params;
    const client = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateActionItemSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const updateData: any = {
      ...validation.data,
      updated_at: new Date().toISOString(),
    };

    // If marking as completed, set completed_at and completed_by
    if (validation.data.status === 'completed') {
      updateData.completed_at = new Date().toISOString();
      updateData.completed_by = user.id;
    } else if (validation.data.status && validation.data.status !== 'completed') {
      // If changing from completed to another status, clear completed fields
      updateData.completed_at = null;
      updateData.completed_by = null;
    }

    const { data, error } = await client
      .from('action_items')
      .update(updateData)
      .eq('id', actionItemId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Action item not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating action item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// =============================================================================
// DELETE - Delete Action Item
// =============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ actionItemId: string }> }
) {
  try {
    const { actionItemId } = await params;
    const client = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { error } = await client
      .from('action_items')
      .delete()
      .eq('id', actionItemId);

    if (error) throw error;

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error deleting action item:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
