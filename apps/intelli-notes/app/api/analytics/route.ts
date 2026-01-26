/**
 * Intelli-Notes Analytics API
 * 
 * Provides meeting analytics and statistics for dashboards.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

// =============================================================================
// Validation
// =============================================================================

const analyticsSchema = z.object({
  account_id: z.string().uuid(),
  period: z.enum(['7d', '30d', '90d', '1y']).default('30d'),
});

// =============================================================================
// GET - Get Analytics Data
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
    const validation = analyticsSchema.safeParse(searchParams);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation error', details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { account_id, period } = validation.data;

    // Calculate date range
    const periodDays = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365,
    }[period];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Fetch meetings in period
    const { data: meetings, error: meetingsError } = await client
      .from('meetings')
      .select('id, status, duration_seconds, platform, created_at, scheduled_start')
      .eq('account_id', account_id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (meetingsError) throw meetingsError;

    // Fetch action items in period
    const { data: actionItems, error: actionItemsError } = await client
      .from('action_items')
      .select('id, status, priority, created_at')
      .eq('account_id', account_id)
      .gte('created_at', startDate.toISOString());

    if (actionItemsError) throw actionItemsError;

    // Calculate statistics
    const completedMeetings = meetings?.filter((m) => m.status === 'completed') || [];
    const totalDurationSeconds = completedMeetings.reduce(
      (sum, m) => sum + (m.duration_seconds || 0),
      0
    );

    // Group meetings by status
    const meetingsByStatus = {
      scheduled: meetings?.filter((m) => m.status === 'scheduled').length || 0,
      recording: meetings?.filter((m) => m.status === 'recording').length || 0,
      processing: meetings?.filter((m) => m.status === 'processing').length || 0,
      completed: completedMeetings.length,
      failed: meetings?.filter((m) => m.status === 'failed').length || 0,
    };

    // Group meetings by platform
    const meetingsByPlatform = {
      zoom: meetings?.filter((m) => m.platform === 'zoom').length || 0,
      teams: meetings?.filter((m) => m.platform === 'teams').length || 0,
      google_meet: meetings?.filter((m) => m.platform === 'google_meet').length || 0,
      manual_upload: meetings?.filter((m) => m.platform === 'manual_upload').length || 0,
    };

    // Group action items by status
    const actionItemsByStatus = {
      pending: actionItems?.filter((a) => a.status === 'pending').length || 0,
      in_progress: actionItems?.filter((a) => a.status === 'in_progress').length || 0,
      completed: actionItems?.filter((a) => a.status === 'completed').length || 0,
      cancelled: actionItems?.filter((a) => a.status === 'cancelled').length || 0,
    };

    // Group action items by priority
    const actionItemsByPriority = {
      urgent: actionItems?.filter((a) => a.priority === 'urgent').length || 0,
      high: actionItems?.filter((a) => a.priority === 'high').length || 0,
      medium: actionItems?.filter((a) => a.priority === 'medium').length || 0,
      low: actionItems?.filter((a) => a.priority === 'low').length || 0,
    };

    // Generate daily data for charts
    const dailyData: { date: string; meetings: number; duration_minutes: number }[] = [];
    const dateMap = new Map<string, { meetings: number; duration: number }>();

    meetings?.forEach((meeting) => {
      const date = new Date(meeting.created_at).toISOString().split('T')[0]!;
      const current = dateMap.get(date) || { meetings: 0, duration: 0 };
      dateMap.set(date, {
        meetings: current.meetings + 1,
        duration: current.duration + (meeting.duration_seconds || 0),
      });
    });

    // Fill in all days in the period
    for (let i = periodDays - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0]!;
      const data = dateMap.get(dateStr) || { meetings: 0, duration: 0 };
      dailyData.push({
        date: dateStr,
        meetings: data.meetings,
        duration_minutes: Math.round(data.duration / 60),
      });
    }

    // Calculate averages
    const avgMeetingDuration = completedMeetings.length > 0
      ? Math.round(totalDurationSeconds / completedMeetings.length / 60)
      : 0;

    const avgMeetingsPerWeek = meetings && meetings.length > 0
      ? Math.round((meetings.length / periodDays) * 7 * 10) / 10
      : 0;

    return NextResponse.json({
      period,
      period_days: periodDays,
      summary: {
        total_meetings: meetings?.length || 0,
        completed_meetings: completedMeetings.length,
        total_duration_minutes: Math.round(totalDurationSeconds / 60),
        total_action_items: actionItems?.length || 0,
        pending_action_items: actionItemsByStatus.pending,
        average_meeting_duration_minutes: avgMeetingDuration,
        average_meetings_per_week: avgMeetingsPerWeek,
        completion_rate: meetings && meetings.length > 0
          ? Math.round((completedMeetings.length / meetings.length) * 100)
          : 0,
        action_item_completion_rate: actionItems && actionItems.length > 0
          ? Math.round((actionItemsByStatus.completed / actionItems.length) * 100)
          : 0,
      },
      meetings_by_status: meetingsByStatus,
      meetings_by_platform: meetingsByPlatform,
      action_items_by_status: actionItemsByStatus,
      action_items_by_priority: actionItemsByPriority,
      daily_data: dailyData,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
