'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Play,
  Pause,
  Settings,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Activity,
  Pencil,
  Trash2,
  Copy,
  ArrowLeft,
  Zap,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@kit/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';
import { Textarea } from '@kit/ui/textarea';
import { Label } from '@kit/ui/label';
import { Skeleton } from '@kit/ui/skeleton';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { toast } from 'sonner';

import type { Agent, AgentExecution, AgentStatus } from '@/lib/agents/types';
import { ExecutionsList } from './executions-list';

interface AgentDetailContainerProps {
  accountSlug: string;
  agentId: string;
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

export function AgentDetailContainer({ accountSlug, agentId }: AgentDetailContainerProps) {
  const supabase = useSupabase();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isRunDialogOpen, setIsRunDialogOpen] = useState(false);
  const [triggerData, setTriggerData] = useState('{}');

  // Fetch agent
  const { data: agent, isLoading, error } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (error) throw error;
      return data as unknown as Agent;
    },
  });

  // Fetch recent executions
  const { data: executions, isLoading: executionsLoading } = useQuery({
    queryKey: ['agent-executions', agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_executions')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as unknown as AgentExecution[];
    },
  });

  // Toggle status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: async (newStatus: AgentStatus) => {
      const { error } = await supabase
        .from('agents')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success('Agentstatus oppdatert');
    },
    onError: () => {
      toast.error('Kunne ikke oppdatere status');
    },
  });

  // Delete agent mutation
  const deleteAgentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('agents')
        .update({ status: 'archived' })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Agent slettet');
      router.push(`/home/${accountSlug}/agents`);
    },
    onError: () => {
      toast.error('Kunne ikke slette agent');
    },
  });

  // Run agent mutation
  const runAgentMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const { data: execution, error } = await supabase
        .from('agent_executions')
        .insert({
          agent_id: agentId,
          status: 'pending',
          trigger_data: data,
          context: {},
          variables: {},
        })
        .select()
        .single();

      if (error) throw error;

      // In production, this would trigger the actual execution via a serverless function
      // For now, we'll simulate a quick execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update to completed
      await supabase
        .from('agent_executions')
        .update({
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 1234,
          output_data: { result: 'Simulert kjøring fullført' },
        })
        .eq('id', execution.id);

      return execution;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent-executions', agentId] });
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      setIsRunDialogOpen(false);
      toast.success('Agent kjørt!');
    },
    onError: () => {
      toast.error('Kunne ikke kjøre agent');
    },
  });

  // Duplicate agent mutation
  const duplicateAgentMutation = useMutation({
    mutationFn: async () => {
      if (!agent) throw new Error('Agent not found');

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
          name: `${agent.name} (kopi)`,
          description: agent.description,
          icon: agent.icon,
          color: agent.color,
          status: 'draft',
          workflow: agent.workflow,
          config: agent.config,
          system_prompt: agent.systemPrompt,
          model_preferences: agent.modelPreferences,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Agent duplisert');
      router.push(`/home/${accountSlug}/agents/${data.id}`);
    },
    onError: () => {
      toast.error('Kunne ikke duplisere agent');
    },
  });

  const handleRunAgent = () => {
    try {
      const data = JSON.parse(triggerData);
      runAgentMutation.mutate(data);
    } catch (e) {
      toast.error('Ugyldig JSON i trigger data');
    }
  };

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 text-destructive">Kunne ikke laste agent</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link href={`/home/${accountSlug}/agents`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Tilbake til agenter
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !agent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  const successRate = agent.totalExecutions > 0
    ? Math.round((agent.successfulExecutions / agent.totalExecutions) * 100)
    : null;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/home/${accountSlug}/agents`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tilbake til agenter
        </Link>
      </Button>

      {/* Agent header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl"
            style={{ backgroundColor: agent.color + '20', color: agent.color }}
          >
            <Bot className="h-8 w-8" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{agent.name}</h1>
              <Badge className={statusColors[agent.status]} variant="secondary">
                {statusLabels[agent.status]}
              </Badge>
            </div>
            {agent.description && (
              <p className="mt-1 text-muted-foreground">{agent.description}</p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Opprettet {new Date(agent.createdAt).toLocaleDateString('nb-NO')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Dialog open={isRunDialogOpen} onOpenChange={setIsRunDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Play className="mr-2 h-4 w-4" />
                Kjør Agent
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kjør {agent.name}</DialogTitle>
                <DialogDescription>
                  Angi trigger data for å kjøre agenten manuelt.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Trigger Data (JSON)</Label>
                  <Textarea
                    value={triggerData}
                    onChange={(e) => setTriggerData(e.target.value)}
                    placeholder='{"message": "Test melding"}'
                    rows={6}
                    className="font-mono text-sm"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsRunDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button onClick={handleRunAgent} disabled={runAgentMutation.isPending}>
                  {runAgentMutation.isPending ? 'Kjører...' : 'Kjør'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Button variant="outline" asChild>
            <Link href={`/home/${accountSlug}/agents/${agentId}/builder`}>
              <Pencil className="mr-2 h-4 w-4" />
              Rediger
            </Link>
          </Button>

          {agent.status === 'active' ? (
            <Button
              variant="outline"
              onClick={() => toggleStatusMutation.mutate('paused')}
              disabled={toggleStatusMutation.isPending}
            >
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
          ) : agent.status !== 'archived' ? (
            <Button
              variant="outline"
              onClick={() => toggleStatusMutation.mutate('active')}
              disabled={toggleStatusMutation.isPending}
            >
              <Zap className="mr-2 h-4 w-4" />
              Aktiver
            </Button>
          ) : null}

          <Button
            variant="outline"
            onClick={() => duplicateAgentMutation.mutate()}
            disabled={duplicateAgentMutation.isPending}
          >
            <Copy className="mr-2 h-4 w-4" />
            Dupliser
          </Button>

          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => deleteAgentMutation.mutate()}
            disabled={deleteAgentMutation.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Slett
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Totalt Kjøringer</CardDescription>
            <CardTitle className="text-3xl">{agent.totalExecutions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Activity className="mr-1 h-4 w-4" />
              Alle tid
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Vellykkede</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {agent.successfulExecutions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
              {successRate !== null ? `${successRate}% suksessrate` : 'Ingen data'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Feilet</CardDescription>
            <CardTitle className="text-3xl text-red-600">
              {agent.failedExecutions}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <XCircle className="mr-1 h-4 w-4 text-red-500" />
              Krever oppmerksomhet
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sist Kjørt</CardDescription>
            <CardTitle className="text-lg">
              {agent.lastExecutionAt
                ? new Date(agent.lastExecutionAt).toLocaleString('nb-NO')
                : 'Aldri'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="mr-1 h-4 w-4" />
              {agent.lastExecutionAt
                ? `${Math.floor((Date.now() - new Date(agent.lastExecutionAt).getTime()) / 60000)} min siden`
                : 'Ikke kjørt enda'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="executions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="executions">Kjøringshistorikk</TabsTrigger>
          <TabsTrigger value="config">Konfigurasjon</TabsTrigger>
          <TabsTrigger value="triggers">Triggere</TabsTrigger>
        </TabsList>

        <TabsContent value="executions" className="space-y-4">
          <ExecutionsList
            executions={executions || []}
            isLoading={executionsLoading}
          />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Agent Konfigurasjon</CardTitle>
              <CardDescription>
                Innstillinger og preferanser for denne agenten
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium">System Prompt</h4>
                <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap bg-muted p-4 rounded-lg">
                  {agent.systemPrompt || 'Ingen system prompt definert'}
                </p>
              </div>

              <div>
                <h4 className="font-medium">Modell Preferanser</h4>
                <div className="mt-2 grid gap-2 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Tier</span>
                    <span className="font-medium capitalize">{agent.modelPreferences?.tier || 'balanced'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Max Tokens</span>
                    <span className="font-medium">{agent.modelPreferences?.maxTokens || 1000}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium">Rate Limits</h4>
                <div className="mt-2 grid gap-2 text-sm">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Per time</span>
                    <span className="font-medium">{agent.maxExecutionsPerHour}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Per dag</span>
                    <span className="font-medium">{agent.maxExecutionsPerDay}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="triggers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Triggere</CardTitle>
              <CardDescription>
                Hendelser som starter denne agenten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ingen triggere konfigurert ennå. Rediger agenten for å legge til triggere.
              </p>
              <Button variant="outline" className="mt-4" asChild>
                <Link href={`/home/${accountSlug}/agents/${agentId}/builder`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Konfigurer triggere
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
