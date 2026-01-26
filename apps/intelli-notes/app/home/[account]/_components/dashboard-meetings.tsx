'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  Calendar,
  Clock,
  FileText,
  CheckSquare,
  TrendingUp,
  Mic,
  Loader2,
  ArrowRight,
  Sparkles,
  Users,
  Video,
} from 'lucide-react';
import Link from 'next/link';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';
import { Progress } from '@kit/ui/progress';

import type { Meeting, ActionItem } from '~/lib/meetings/types';

// =============================================================================
// Types
// =============================================================================

interface DashboardMeetingsProps {
  accountSlug: string;
}

interface DashboardData {
  meetings: Meeting[];
  action_items: ActionItem[];
  stats: {
    total_meetings: number;
    completed_meetings: number;
    processing_meetings: number;
    total_duration_minutes: number;
    pending_action_items: number;
    completed_action_items: number;
  };
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchDashboardData(accountId: string): Promise<DashboardData> {
  const [meetingsRes, actionItemsRes] = await Promise.all([
    fetch(`/api/meetings?account_id=${accountId}&limit=50`),
    fetch(`/api/action-items?account_id=${accountId}`),
  ]);

  const meetings = meetingsRes.ok 
    ? (await meetingsRes.json()).meetings || []
    : [];
  const actionItems = actionItemsRes.ok 
    ? (await actionItemsRes.json()).action_items || []
    : [];

  // Calculate stats
  const completedMeetings = meetings.filter((m: Meeting) => m.status === 'completed');
  const processingMeetings = meetings.filter((m: Meeting) => m.status === 'processing');
  const totalDuration = completedMeetings.reduce(
    (sum: number, m: Meeting) => sum + (m.duration_seconds || 0),
    0
  );
  const pendingItems = actionItems.filter((a: ActionItem) => a.status === 'pending').length;
  const completedItems = actionItems.filter((a: ActionItem) => a.status === 'completed').length;

  return {
    meetings,
    action_items: actionItems,
    stats: {
      total_meetings: meetings.length,
      completed_meetings: completedMeetings.length,
      processing_meetings: processingMeetings.length,
      total_duration_minutes: Math.round(totalDuration / 60),
      pending_action_items: pendingItems,
      completed_action_items: completedItems,
    },
  };
}

// =============================================================================
// Stat Card Component
// =============================================================================

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <div
            className={`flex items-center text-xs mt-1 ${
              trend.isPositive ? 'text-green-500' : 'text-red-500'
            }`}
          >
            <TrendingUp className={`h-3 w-3 mr-1 ${!trend.isPositive && 'rotate-180'}`} />
            {trend.isPositive ? '+' : ''}{trend.value}% fra forrige måned
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Recent Meetings Component
// =============================================================================

function RecentMeetings({
  meetings,
  accountSlug,
}: {
  meetings: Meeting[];
  accountSlug: string;
}) {
  const recentMeetings = meetings.slice(0, 5);

  const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    scheduled: { label: 'Planlagt', variant: 'outline' },
    recording: { label: 'Opptak', variant: 'default' },
    processing: { label: 'Behandler', variant: 'secondary' },
    completed: { label: 'Fullført', variant: 'default' },
    failed: { label: 'Feilet', variant: 'destructive' },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Siste møter
        </CardTitle>
        <CardDescription>Dine nyeste møter med status</CardDescription>
      </CardHeader>
      <CardContent>
        {recentMeetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Video className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Ingen møter ennå. Start med å opprette ditt første møte!
            </p>
            <Button asChild className="mt-4">
              <Link href={`/home/${accountSlug}/meetings`}>
                Gå til møter
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentMeetings.map((meeting) => {
              const status = statusLabels[meeting.status] || statusLabels.scheduled;
              return (
                <div
                  key={meeting.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/home/${accountSlug}/meetings/${meeting.id}`}
                      className="font-medium hover:underline truncate block"
                    >
                      {meeting.title}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(meeting.created_at), 'PPP', { locale: nb })}
                      {meeting.duration_seconds && (
                        <span className="ml-2">
                          • {Math.round(meeting.duration_seconds / 60)} min
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
      {recentMeetings.length > 0 && (
        <CardFooter>
          <Button variant="ghost" asChild className="w-full">
            <Link href={`/home/${accountSlug}/meetings`}>
              Se alle møter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// =============================================================================
// Action Items Summary Component
// =============================================================================

function ActionItemsSummary({
  actionItems,
  accountSlug,
}: {
  actionItems: ActionItem[];
  accountSlug: string;
}) {
  const pendingItems = actionItems.filter((a) => a.status === 'pending');
  const urgentItems = pendingItems.filter((a) => a.priority === 'urgent');

  const completionRate = actionItems.length > 0
    ? Math.round((actionItems.filter((a) => a.status === 'completed').length / actionItems.length) * 100)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="h-5 w-5" />
          Handlingspunkter
        </CardTitle>
        <CardDescription>Status på oppgaver fra møtene dine</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {actionItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              Ingen handlingspunkter ennå
            </p>
          </div>
        ) : (
          <>
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Fullføringsgrad</span>
                <span className="font-medium">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>

            {/* Urgent Items */}
            {urgentItems.length > 0 && (
              <div className="rounded-lg bg-red-50 dark:bg-red-950/20 p-3 border border-red-200 dark:border-red-900">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
                  <Sparkles className="h-4 w-4" />
                  {urgentItems.length} hastepunkter krever oppmerksomhet
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{pendingItems.length}</div>
                <div className="text-xs text-muted-foreground">Ventende</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-2xl font-bold">
                  {actionItems.filter((a) => a.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Fullført</div>
              </div>
            </div>
          </>
        )}
      </CardContent>
      {actionItems.length > 0 && (
        <CardFooter>
          <Button variant="ghost" asChild className="w-full">
            <Link href={`/home/${accountSlug}/action-items`}>
              Se alle handlingspunkter
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// =============================================================================
// Meeting Activity Chart Component
// =============================================================================

function MeetingActivityChart({ meetings }: { meetings: Meeting[] }) {
  // Generate last 30 days data
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);
      
      const count = meetings.filter((m) => {
        const meetingDate = new Date(m.created_at);
        return meetingDate >= dayStart && meetingDate <= dayEnd;
      }).length;

      data.push({
        date: format(date, 'dd.MM'),
        meetings: count,
      });
    }
    return data;
  }, [meetings]);

  const chartConfig = {
    meetings: {
      label: 'Møter',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Møteaktivitet</CardTitle>
        <CardDescription>Antall møter de siste 30 dagene</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillMeetings" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-meetings)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-meetings)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              fontSize={10}
              interval="preserveStartEnd"
            />
            <ChartTooltip
              content={<ChartTooltipContent />}
            />
            <Area
              dataKey="meetings"
              type="monotone"
              fill="url(#fillMeetings)"
              stroke="var(--color-meetings)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Quick Actions Component
// =============================================================================

function QuickActions({ accountSlug }: { accountSlug: string }) {
  const actions = [
    {
      title: 'Nytt møte',
      description: 'Opprett et nytt møte for transkribering',
      icon: Video,
      href: `/home/${accountSlug}/meetings`,
      color: 'bg-blue-500',
    },
    {
      title: 'Søk',
      description: 'Søk i alle møtetranskripsjoner',
      icon: FileText,
      href: `/home/${accountSlug}/search`,
      color: 'bg-green-500',
    },
    {
      title: 'Handlingspunkter',
      description: 'Se og administrer oppgaver',
      icon: CheckSquare,
      href: `/home/${accountSlug}/action-items`,
      color: 'bg-orange-500',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hurtighandlinger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {actions.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted transition-colors"
            >
              <div
                className={`p-2 rounded-lg ${action.color} text-white`}
              >
                <action.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground">
                  {action.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function DashboardMeetings({ accountSlug }: DashboardMeetingsProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', accountSlug],
    queryFn: () => fetchDashboardData(accountSlug),
    staleTime: 30000, // 30 seconds
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-muted-foreground">Kunne ikke laste dashboard-data</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Prøv igjen
        </Button>
      </div>
    );
  }

  const { meetings, action_items, stats } = data || {
    meetings: [],
    action_items: [],
    stats: {
      total_meetings: 0,
      completed_meetings: 0,
      processing_meetings: 0,
      total_duration_minutes: 0,
      pending_action_items: 0,
      completed_action_items: 0,
    },
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}t ${mins}m` : `${hours} timer`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Totalt møter"
          value={stats.total_meetings}
          description={`${stats.completed_meetings} fullført`}
          icon={Calendar}
        />
        <StatCard
          title="Transkriberte timer"
          value={formatDuration(stats.total_duration_minutes)}
          description="Total møtetid behandlet"
          icon={Mic}
        />
        <StatCard
          title="Handlingspunkter"
          value={stats.pending_action_items}
          description={`${stats.completed_action_items} fullført totalt`}
          icon={CheckSquare}
        />
        <StatCard
          title="Under behandling"
          value={stats.processing_meetings}
          description="Møter som transkriberes nå"
          icon={Loader2}
        />
      </div>

      {/* Activity Chart */}
      <MeetingActivityChart meetings={meetings} />

      {/* Three Column Layout */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <RecentMeetings meetings={meetings} accountSlug={accountSlug} />
        <ActionItemsSummary actionItems={action_items} accountSlug={accountSlug} />
        <QuickActions accountSlug={accountSlug} />
      </div>
    </div>
  );
}

export default DashboardMeetings;
