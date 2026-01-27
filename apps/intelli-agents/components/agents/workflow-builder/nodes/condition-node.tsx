'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { cn } from '@kit/ui/utils';
import { GitBranch } from 'lucide-react';
import type { WorkflowNodeData } from '~/lib/agents/types';

export const ConditionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const trueLabel = data.conditionConfig?.trueLabel || 'Ja';
  const falseLabel = data.conditionConfig?.falseLabel || 'Nei';

  return (
    <div
      className={cn(
        'relative min-w-[180px] rounded-lg border-2 bg-background shadow-md transition-all',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-amber-500/50',
        'hover:shadow-lg'
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-amber-500 !bg-background"
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-md px-3 py-2"
        style={{ backgroundColor: data.color || '#F59E0B' }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white/20">
          <GitBranch className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white">Betingelse</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-sm font-medium">{data.label}</p>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
        )}
      </div>

      {/* Output handles */}
      <div className="flex justify-between px-3 pb-2">
        <div className="relative">
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="!h-3 !w-3 !border-2 !border-green-500 !bg-background !left-0 !-translate-x-1/2"
            style={{ left: '0%' }}
          />
          <span className="text-xs text-green-600 font-medium">{trueLabel}</span>
        </div>
        <div className="relative">
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="!h-3 !w-3 !border-2 !border-red-500 !bg-background !right-0 !translate-x-1/2"
            style={{ left: '100%' }}
          />
          <span className="text-xs text-red-600 font-medium">{falseLabel}</span>
        </div>
      </div>

      {/* Validation indicator */}
      {data.isValid === false && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
      )}
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';
