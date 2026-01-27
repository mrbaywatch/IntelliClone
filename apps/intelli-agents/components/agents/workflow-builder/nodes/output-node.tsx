'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { cn } from '@kit/ui/utils';
import { CheckCircle2, Flag } from 'lucide-react';
import type { WorkflowNodeData } from '~/lib/agents/types';

export const OutputNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div
      className={cn(
        'relative min-w-[150px] rounded-lg border-2 bg-background shadow-md transition-all',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-emerald-500/50',
        'hover:shadow-lg'
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-emerald-500 !bg-background"
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-md px-3 py-2"
        style={{ backgroundColor: data.color || '#10B981' }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white/20">
          <Flag className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white">Slutt</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2 flex items-center gap-2">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <p className="text-sm font-medium">{data.label || 'Ferdig'}</p>
      </div>
    </div>
  );
});

OutputNode.displayName = 'OutputNode';
