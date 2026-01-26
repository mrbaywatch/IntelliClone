'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { nb } from 'date-fns/locale';
import {
  CheckSquare,
  Circle,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  Loader2,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';

import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Checkbox } from '@kit/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';

import type { ActionItem, ActionItemStatus } from '~/lib/meetings/types';

// =============================================================================
// Types
// =============================================================================

interface ActionItemsPageClientProps {
  accountSlug: string;
}

interface ActionItemsResponse {
  action_items: ActionItem[];
}

// =============================================================================
// API Functions
// =============================================================================

async function fetchActionItems(
  accountId: string,
  status?: ActionItemStatus
): Promise<ActionItemsResponse> {
  const params = new URLSearchParams({ account_id: accountId });
  if (status) params.set('status', status);

  const response = await fetch(`/api/action-items?${params}`);
  if (!response.ok) throw new Error('Failed to fetch action items');
  return response.json();
}

async function updateActionItemStatus(
  actionItemId: string,
  status: ActionItemStatus
): Promise<void> {
  const response = await fetch(`/api/action-items/${actionItemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update action item');
}

// =============================================================================
// Priority Badge Component
// =============================================================================

function PriorityBadge({ priority }: { priority: ActionItem['priority'] }) {
  const variants: Record<
    ActionItem['priority'],
    { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
  > = {
    low: { label: 'Lav', variant: 'outline' },
    medium: { label: 'Medium', variant: 'secondary' },
    high: { label: 'Høy', variant: 'default' },
    urgent: { label: 'Haster', variant: 'destructive' },
  };

  const { label, variant } = variants[priority];
  return <Badge variant={variant}>{label}</Badge>;
}

// =============================================================================
// Action Item Card Component
// =============================================================================

function ActionItemCard({
  item,
  onStatusChange,
}: {
  item: ActionItem;
  onStatusChange: (status: ActionItemStatus) => void;
}) {
  const isCompleted = item.status === 'completed';

  return (
    <Card className={isCompleted ? 'opacity-60' : ''}>
      <CardContent className="flex items-start gap-4 pt-4">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={(checked) =>
            onStatusChange(checked ? 'completed' : 'pending')
          }
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p
              className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
            >
              {item.title}
            </p>
            <PriorityBadge priority={item.priority} />
          </div>
          
          {item.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-muted-foreground">
            {item.assignee_name && (
              <span className="flex items-center gap-1">
                <Circle className="h-3 w-3" />
                {item.assignee_name}
              </span>
            )}
            {item.due_date && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {format(new Date(item.due_date), 'PPP', { locale: nb })}
              </span>
            )}
            <Link
              href={`/home/${item.account_id}/meetings/${item.meeting_id}`}
              className="flex items-center gap-1 hover:underline"
            >
              <LinkIcon className="h-3 w-3" />
              Se møte
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// Stats Cards Component
// =============================================================================

function StatsCards({ items }: { items: ActionItem[] }) {
  const pending = items.filter((i) => i.status === 'pending').length;
  const inProgress = items.filter((i) => i.status === 'in_progress').length;
  const completed = items.filter((i) => i.status === 'completed').length;
  const urgent = items.filter(
    (i) => i.priority === 'urgent' && i.status !== 'completed'
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Ventende</CardTitle>
          <Circle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pending}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Pågår</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{inProgress}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium">Fullført</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completed}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-destructive">Haster</CardTitle>
          <AlertCircle className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">{urgent}</div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function ActionItemsPageClient({ accountSlug }: ActionItemsPageClientProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const accountId = accountSlug;

  const { data, isLoading, error } = useQuery({
    queryKey: ['actionItems', accountId],
    queryFn: () => fetchActionItems(accountId),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ActionItemStatus }) =>
      updateActionItemStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionItems'] });
    },
  });

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-destructive">
          Kunne ikke laste handlingspunkter. Prøv igjen senere.
        </p>
      </div>
    );
  }

  const allItems = data?.action_items || [];
  
  // Filter by tab
  let filteredItems = allItems;
  if (activeTab === 'pending') {
    filteredItems = allItems.filter((i) => i.status === 'pending' || i.status === 'in_progress');
  } else if (activeTab === 'completed') {
    filteredItems = allItems.filter((i) => i.status === 'completed');
  }

  // Filter by priority
  if (priorityFilter !== 'all') {
    filteredItems = filteredItems.filter((i) => i.priority === priorityFilter);
  }

  // Sort: urgent first, then by due date
  filteredItems = [...filteredItems].sort((a, b) => {
    if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
    if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsCards items={allItems} />

      {/* Filters */}
      <div className="flex items-center justify-between">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList>
            <TabsTrigger value="all">Alle ({allItems.length})</TabsTrigger>
            <TabsTrigger value="pending">
              Aktive ({allItems.filter((i) => i.status !== 'completed').length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Fullført ({allItems.filter((i) => i.status === 'completed').length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[150px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Prioritet" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle prioriteter</SelectItem>
            <SelectItem value="urgent">Haster</SelectItem>
            <SelectItem value="high">Høy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="low">Lav</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onStatusChange={(status) =>
                updateMutation.mutate({ id: item.id, status })
              }
            />
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center h-64">
          <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold">Ingen handlingspunkter</h3>
          <p className="text-muted-foreground text-center max-w-sm mt-2">
            {activeTab === 'completed'
              ? 'Du har ingen fullførte handlingspunkter ennå.'
              : 'Handlingspunkter fra møtene dine vil vises her.'}
          </p>
        </Card>
      )}
    </div>
  );
}
