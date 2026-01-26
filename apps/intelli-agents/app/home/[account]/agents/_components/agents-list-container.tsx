'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bot, Plus, Play, Pause, Settings, Trash2, MoreVertical, Search, Filter, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Badge } from '@kit/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Skeleton } from '@kit/ui/skeleton';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { Trans } from '@kit/ui/trans';

import type { Agent, AgentStatus } from '@/lib/agents/types';

interface AgentsListContainerProps {
  accountSlug: string;
}

const statusColors: Record<AgentStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  archived: 'bg-gray-100 text-gray-500',
};

const statusLabels: Record<AgentStatus, string> = {
  draft: 'Utkast',
  active: 'Aktiv',
  paused: 'Pauset',
  error: 'Feil',
  archived: 'Arkivert',
};

export function AgentsListContainer({ accountSlug }: AgentsListContainerProps) {
  const supabase = useSupabase();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<AgentStatus | 'all'>('all');

  // Fetch agents
  const { data: agents, isLoading, error } = useQuery({
    queryKey: ['agents', accountSlug],
    queryFn: async () => {
      // First get the account ID from the slug
      const { data: account, error: accountError } = await supabase
        .from('accounts')
        .select('id')
        .eq('slug', accountSlug)
        .single();

      if (accountError) throw accountError;

      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('account_id', account.id)
        .neq('status', 'archived')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Agent[];
    },
  });

  // Create agent mutation
  const createAgentMutation = useMutation({
    mutationFn: async () => {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('slug', accountSlug)
        .single();

      if (!account) throw new Error('Account not found');

      const { data, error } = await supabase
        .from('agents')
        .insert({
          account_id: account.id,
          name: 'Ny Agent',
          description: '',
          status: 'draft',
          workflow: {
            nodes: [
              {
                id: 'trigger-1',
                type: 'trigger',
                position: { x: 250, y: 50 },
                data: {
                  label: 'Start',
                  description: 'Velg en trigger',
                  icon: 'play',
                  color: '#3B82F6',
                  triggerType: 'manual',
                },
              },
            ],
            edges: [],
            viewport: { x: 0, y: 0, zoom: 1 },
          },
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['agents', accountSlug] });
      router.push(`/home/${accountSlug}/agents/${data.id}/builder`);
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async (agentId: string) => {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'archived' })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', accountSlug] });
    },
  });

  // Toggle agent status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async ({ agentId, newStatus }: { agentId: string; newStatus: AgentStatus }) => {
      const { error } = await supabase
        .from('agents')
        .update({ status: newStatus })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', accountSlug] });
    },
  });

  // Filter agents
  const filteredAgents = agents?.filter((agent) => {
    const matchesSearch =
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Kunne ikke laste agenter</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søk etter agenter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {statusFilter === 'all' ? 'Alle' : statusLabels[statusFilter]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                Alle
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                Aktive
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('paused')}>
                Pausede
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('draft')}>
                Utkast
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <Button onClick={() => createAgentMutation.mutate()} disabled={createAgentMutation.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          Ny Agent
        </Button>
      </div>

      {/* Agents grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredAgents && filteredAgents.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              accountSlug={accountSlug}
              onToggleStatus={(newStatus) =>
                toggleStatusMutation.mutate({ agentId: agent.id, newStatus })
              }
              onDelete={() => deleteAgentMutation.mutate(agent.id)}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-16 text-center">
            <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">Ingen agenter ennå</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Kom i gang ved å opprette din første agent eller velg en mal.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <Button onClick={() => createAgentMutation.mutate()}>
                <Plus className="mr-2 h-4 w-4" />
                Ny Agent
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/home/${accountSlug}/templates`}>
                  Se maler
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AgentCardProps {
  agent: Agent;
  accountSlug: string;
  onToggleStatus: (status: AgentStatus) => void;
  onDelete: () => void;
}

function AgentCard({ agent, accountSlug, onToggleStatus, onDelete }: AgentCardProps) {
  const successRate = agent.totalExecutions > 0
    ? Math.round((agent.successfulExecutions / agent.totalExecutions) * 100)
    : null;

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: agent.color + '20', color: agent.color }}
            >
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">
                <Link
                  href={`/home/${accountSlug}/agents/${agent.id}`}
                  className="hover:underline"
                >
                  {agent.name}
                </Link>
              </CardTitle>
              <Badge className={statusColors[agent.status]} variant="secondary">
                {statusLabels[agent.status]}
              </Badge>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/home/${accountSlug}/agents/${agent.id}/builder`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Rediger
                </Link>
              </DropdownMenuItem>
              {agent.status === 'active' ? (
                <DropdownMenuItem onClick={() => onToggleStatus('paused')}>
                  <Pause className="mr-2 h-4 w-4" />
                  Pause
                </DropdownMenuItem>
              ) : agent.status !== 'archived' ? (
                <DropdownMenuItem onClick={() => onToggleStatus('active')}>
                  <Play className="mr-2 h-4 w-4" />
                  Aktiver
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Slett
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {agent.description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {agent.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Play className="h-3.5 w-3.5" />
            <span>{agent.totalExecutions} kjøringer</span>
          </div>
          {successRate !== null && (
            <div className="flex items-center gap-1">
              {successRate >= 90 ? (
                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
              ) : successRate >= 70 ? (
                <Clock className="h-3.5 w-3.5 text-yellow-500" />
              ) : (
                <XCircle className="h-3.5 w-3.5 text-red-500" />
              )}
              <span>{successRate}% suksess</span>
            </div>
          )}
        </div>

        {agent.lastExecutionAt && (
          <p className="mt-2 text-xs text-muted-foreground">
            Sist kjørt: {new Date(agent.lastExecutionAt).toLocaleDateString('nb-NO')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
