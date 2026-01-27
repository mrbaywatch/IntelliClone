'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Bot, Save, Play, Settings2, ChevronRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Textarea } from '@kit/ui/textarea';
import { Label } from '@kit/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@kit/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import { Skeleton } from '@kit/ui/skeleton';
import { useTypedSupabase } from '~/lib/supabase/use-supabase';
import { toast } from '@kit/ui/sonner';

import type { Agent, Workflow } from '~/lib/agents/types';
import { WorkflowBuilder } from '~/components/agents/workflow-builder/workflow-builder';

interface AgentBuilderContainerProps {
  accountSlug: string;
  agentId: string;
}

export function AgentBuilderContainer({ accountSlug, agentId }: AgentBuilderContainerProps) {
  const supabase = useTypedSupabase();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [localWorkflow, setLocalWorkflow] = useState<Workflow | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

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
    staleTime: 0,
  });

  // Form state for settings
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    systemPrompt: '',
    modelTier: 'balanced' as 'fast' | 'balanced' | 'powerful',
    maxTokens: 1000,
    maxExecutionsPerHour: 100,
    maxExecutionsPerDay: 1000,
  });

  // Initialize form data when agent loads
  const initializeForm = useCallback((agent: Agent) => {
    setFormData({
      name: agent.name || '',
      description: agent.description || '',
      systemPrompt: agent.systemPrompt || '',
      modelTier: agent.modelPreferences?.tier || 'balanced',
      maxTokens: agent.modelPreferences?.maxTokens || 1000,
      maxExecutionsPerHour: agent.maxExecutionsPerHour || 100,
      maxExecutionsPerDay: agent.maxExecutionsPerDay || 1000,
    });
    setLocalWorkflow(agent.workflow);
  }, []);

  // Initialize when data loads
  if (agent && !localWorkflow) {
    initializeForm(agent);
  }

  // Save agent mutation
  const saveAgentMutation = useMutation({
    mutationFn: async () => {
      if (!localWorkflow) throw new Error('No workflow to save');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await supabase
        .from('agents')
        .update({
          name: formData.name,
          description: formData.description,
          system_prompt: formData.systemPrompt,
          workflow: localWorkflow as any,
          model_preferences: {
            tier: formData.modelTier,
            maxTokens: formData.maxTokens,
          } as any,
          max_executions_per_hour: formData.maxExecutionsPerHour,
          max_executions_per_day: formData.maxExecutionsPerDay,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      setHasUnsavedChanges(false);
      toast.success('Agent lagret!');
    },
    onError: () => {
      toast.error('Kunne ikke lagre agent');
    },
  });

  // Test agent mutation
  const testAgentMutation = useMutation({
    mutationFn: async () => {
      // First save, then test
      if (hasUnsavedChanges) {
        await saveAgentMutation.mutateAsync();
      }

      const { data: execution, error } = await supabase
        .from('agent_executions')
        .insert({
          agent_id: agentId,
          status: 'pending',
          trigger_data: { test: true },
          context: {},
          variables: {},
        })
        .select()
        .single();

      if (error) throw error;

      // Simulate execution
      await new Promise(resolve => setTimeout(resolve, 1500));

      await supabase
        .from('agent_executions')
        .update({
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          duration_ms: 1500,
          output_data: { result: 'Test kjøring fullført!' },
        })
        .eq('id', execution.id);

      return execution;
    },
    onSuccess: () => {
      toast.success('Test fullført!');
    },
    onError: () => {
      toast.error('Test feilet');
    },
  });

  const handleWorkflowChange = useCallback((workflow: Workflow) => {
    setLocalWorkflow(workflow);
    setHasUnsavedChanges(true);
  }, []);

  const handleFormChange = useCallback((field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  }, []);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-8 text-center">
            <p className="text-destructive">Kunne ikke laste agent</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/home/${accountSlug}/agents`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Tilbake til agenter
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading || !agent || !localWorkflow) {
    return (
      <div className="flex h-full flex-col">
        {/* Header skeleton */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>
        </div>
        {/* Canvas skeleton */}
        <div className="flex-1 bg-muted/30">
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-background">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/home/${accountSlug}/agents/${agentId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ backgroundColor: agent.color + '20', color: agent.color }}
            >
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-semibold">{formData.name || agent.name}</h1>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Link href={`/home/${accountSlug}/agents`} className="hover:underline">
                  Agenter
                </Link>
                <ChevronRight className="h-3 w-3" />
                <span>Bygg</span>
              </div>
            </div>
          </div>

          {hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground">
              • Ulagrede endringer
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Settings sheet */}
          <Sheet open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings2 className="mr-2 h-4 w-4" />
                Innstillinger
              </Button>
            </SheetTrigger>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Agent Innstillinger</SheetTitle>
                <SheetDescription>
                  Konfigurer navn, beskrivelse og modellpreferanser
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Basic info */}
                <div className="space-y-4">
                  <h4 className="font-medium">Grunnleggende</h4>
                  <div className="space-y-2">
                    <Label htmlFor="name">Navn</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      placeholder="Min Agent"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Beskrivelse</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Hva gjør denne agenten?"
                      rows={3}
                    />
                  </div>
                </div>

                {/* System prompt */}
                <div className="space-y-4">
                  <h4 className="font-medium">System Prompt</h4>
                  <div className="space-y-2">
                    <Label htmlFor="systemPrompt">Instruksjoner til AI</Label>
                    <Textarea
                      id="systemPrompt"
                      value={formData.systemPrompt}
                      onChange={(e) => handleFormChange('systemPrompt', e.target.value)}
                      placeholder="Du er en hjelpsom assistent som..."
                      rows={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Denne teksten sendes til AI-modellen som kontekst for alle AI-steg i arbeidsflyten.
                    </p>
                  </div>
                </div>

                {/* Model preferences */}
                <div className="space-y-4">
                  <h4 className="font-medium">Modellpreferanser</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Modell Tier</Label>
                      <Select
                        value={formData.modelTier}
                        onValueChange={(value) => handleFormChange('modelTier', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fast">Fast (GPT-3.5)</SelectItem>
                          <SelectItem value="balanced">Balanced (GPT-4o-mini)</SelectItem>
                          <SelectItem value="powerful">Powerful (GPT-4o)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">Max Tokens</Label>
                      <Input
                        id="maxTokens"
                        type="number"
                        value={formData.maxTokens}
                        onChange={(e) => handleFormChange('maxTokens', parseInt(e.target.value))}
                        min={100}
                        max={8000}
                      />
                    </div>
                  </div>
                </div>

                {/* Rate limits */}
                <div className="space-y-4">
                  <h4 className="font-medium">Rate Limits</h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="maxPerHour">Maks per time</Label>
                      <Input
                        id="maxPerHour"
                        type="number"
                        value={formData.maxExecutionsPerHour}
                        onChange={(e) => handleFormChange('maxExecutionsPerHour', parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxPerDay">Maks per dag</Label>
                      <Input
                        id="maxPerDay"
                        type="number"
                        value={formData.maxExecutionsPerDay}
                        onChange={(e) => handleFormChange('maxExecutionsPerDay', parseInt(e.target.value))}
                        min={1}
                      />
                    </div>
                  </div>
                </div>

                {/* Save in sheet */}
                <Button
                  className="w-full"
                  onClick={() => {
                    saveAgentMutation.mutate();
                    setIsSettingsOpen(false);
                  }}
                  disabled={saveAgentMutation.isPending}
                >
                  {saveAgentMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Lagre endringer
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Test button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => testAgentMutation.mutate()}
            disabled={testAgentMutation.isPending}
          >
            {testAgentMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Test
          </Button>

          {/* Save button */}
          <Button
            size="sm"
            onClick={() => saveAgentMutation.mutate()}
            disabled={saveAgentMutation.isPending || !hasUnsavedChanges}
          >
            {saveAgentMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Lagre
          </Button>
        </div>
      </div>

      {/* Workflow builder */}
      <div className="flex-1">
        <WorkflowBuilder
          workflow={localWorkflow}
          onChange={handleWorkflowChange}
          onSave={() => saveAgentMutation.mutate()}
          onTest={() => testAgentMutation.mutate()}
        />
      </div>
    </div>
  );
}
