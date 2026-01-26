'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { cn } from '@kit/ui/utils';
import {
  Brain,
  Tags,
  FileText,
  Search,
  MessageSquare,
  Languages,
  Sparkles,
} from 'lucide-react';
import type { WorkflowNodeData, ActionType } from '@/lib/agents/types';

// Icon mapping for AI task types
const aiIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  ai_classify: Tags,
  ai_summarize: FileText,
  ai_extract: Search,
  ai_respond: MessageSquare,
  ai_translate: Languages,
};

// Norwegian labels for AI task types
const aiLabels: Record<string, string> = {
  ai_classify: 'AI Klassifisering',
  ai_summarize: 'AI Oppsummering',
  ai_extract: 'AI Ekstraksjon',
  ai_respond: 'AI Svar',
  ai_translate: 'AI Oversettelse',
};

export const AITaskNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const actionType = data.actionType || 'ai_respond';
  const Icon = aiIcons[actionType] || Brain;
  const label = aiLabels[actionType] || 'AI Oppgave';

  return (
    <div
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 bg-background shadow-md transition-all',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-purple-500/50',
        'hover:shadow-lg'
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-purple-500 !bg-background"
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-md px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600"
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white/20">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white">{label}</span>
        <Sparkles className="h-3 w-3 text-yellow-300 ml-auto" />
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-sm font-medium">{data.label}</p>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {data.description}
          </p>
        )}
        
        {/* AI indicator */}
        <div className="flex items-center gap-1 mt-2 text-xs text-purple-600">
          <Brain className="h-3 w-3" />
          <span>Bruker AI</span>
        </div>
      </div>

      {/* Validation indicator */}
      {data.isValid === false && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-purple-500 !bg-background"
      />
    </div>
  );
});

AITaskNode.displayName = 'AITaskNode';
