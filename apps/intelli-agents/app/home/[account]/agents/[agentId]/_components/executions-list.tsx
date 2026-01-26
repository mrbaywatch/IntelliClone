'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Clock, Loader2, AlertCircle, ChevronRight } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@kit/ui/collapsible';
import { Skeleton } from '@kit/ui/skeleton';
import { Button } from '@kit/ui/button';
import { ScrollArea } from '@kit/ui/scroll-area';

import type { AgentExecution, ExecutionStatus } from '@/lib/agents/types';

interface ExecutionsListProps {
  executions: AgentExecution[];
  isLoading: boolean;
}

const statusConfig: Record<ExecutionStatus, { icon: typeof CheckCircle; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-gray-500', label: 'Venter' },
  running: { icon: Loader2, color: 'text-blue-500', label: 'Kjører' },
  completed: { icon: CheckCircle, color: 'text-green-500', label: 'Fullført' },
  failed: { icon: XCircle, color: 'text-red-500', label: 'Feilet' },
  cancelled: { icon: AlertCircle, color: 'text-yellow-500', label: 'Avbrutt' },
  timeout: { icon: Clock, color: 'text-orange-500', label: 'Timeout' },
};

export function ExecutionsList({ executions, isLoading }: ExecutionsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kjøringshistorikk</CardTitle>
          <CardDescription>Nylige kjøringer av denne agenten</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-5 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (executions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Kjøringshistorikk</CardTitle>
          <CardDescription>Nylige kjøringer av denne agenten</CardDescription>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            Ingen kjøringer ennå. Kjør agenten for å se historikk her.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kjøringshistorikk</CardTitle>
        <CardDescription>
          Viser de {executions.length} siste kjøringene
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="divide-y">
            {executions.map((execution) => {
              const status = statusConfig[execution.status];
              const StatusIcon = status.icon;
              const isExpanded = expandedId === execution.id;

              return (
                <Collapsible
                  key={execution.id}
                  open={isExpanded}
                  onOpenChange={() => setExpandedId(isExpanded ? null : execution.id)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-start px-6 py-4 h-auto rounded-none hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-4 w-full">
                        <StatusIcon
                          className={`h-5 w-5 ${status.color} ${execution.status === 'running' ? 'animate-spin' : ''}`}
                        />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Kjøring #{execution.id.slice(0, 8)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {status.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>
                              {new Date(execution.createdAt).toLocaleString('nb-NO')}
                            </span>
                            {execution.durationMs && (
                              <span>{(execution.durationMs / 1000).toFixed(2)}s</span>
                            )}
                            {execution.tokensUsed > 0 && (
                              <span>{execution.tokensUsed} tokens</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </div>
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="px-6 py-4 bg-muted/30 space-y-4">
                      {/* Timing */}
                      <div className="grid gap-4 md:grid-cols-3 text-sm">
                        <div>
                          <span className="text-muted-foreground">Startet</span>
                          <p className="font-medium">
                            {execution.startedAt
                              ? new Date(execution.startedAt).toLocaleString('nb-NO')
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fullført</span>
                          <p className="font-medium">
                            {execution.completedAt
                              ? new Date(execution.completedAt).toLocaleString('nb-NO')
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Estimert kostnad</span>
                          <p className="font-medium">
                            ${execution.estimatedCost?.toFixed(4) || '0.0000'}
                          </p>
                        </div>
                      </div>

                      {/* Trigger Data */}
                      {execution.triggerData && Object.keys(execution.triggerData).length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Trigger Data</span>
                          <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
                            {JSON.stringify(execution.triggerData, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Output Data */}
                      {execution.outputData && Object.keys(execution.outputData).length > 0 && (
                        <div>
                          <span className="text-sm text-muted-foreground">Output</span>
                          <pre className="mt-1 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-32">
                            {JSON.stringify(execution.outputData, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Error */}
                      {execution.errorMessage && (
                        <div>
                          <span className="text-sm text-destructive">Feil</span>
                          <div className="mt-1 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive">
                              {execution.errorMessage}
                            </p>
                            {execution.errorDetails && (
                              <pre className="mt-2 text-xs overflow-auto max-h-24">
                                {JSON.stringify(execution.errorDetails, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
