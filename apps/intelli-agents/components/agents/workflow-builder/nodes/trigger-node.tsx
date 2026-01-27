'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { cn } from '@kit/ui/utils';
import {
  Mail,
  Webhook,
  Clock,
  Play,
  FileText,
  Database,
  CreditCard,
  MessageCircle,
} from 'lucide-react';
import type { WorkflowNodeData, TriggerType } from '~/lib/agents/types';

// Icon mapping for trigger types
const triggerIcons: Record<TriggerType, React.ComponentType<{ className?: string }>> = {
  email_received: Mail,
  webhook: Webhook,
  schedule: Clock,
  manual: Play,
  form_submission: FileText,
  crm_event: Database,
  payment_received: CreditCard,
  chat_message: MessageCircle,
};

// Norwegian labels for trigger types
const triggerLabels: Record<TriggerType, string> = {
  email_received: 'E-post mottatt',
  webhook: 'Webhook',
  schedule: 'Planlagt',
  manual: 'Manuell',
  form_submission: 'Skjema sendt',
  crm_event: 'CRM-hendelse',
  payment_received: 'Betaling mottatt',
  chat_message: 'Chat-melding',
};

export const TriggerNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const Icon = data.triggerType
    ? triggerIcons[data.triggerType] || Play
    : Play;

  const triggerLabel = data.triggerType
    ? triggerLabels[data.triggerType]
    : 'Trigger';

  return (
    <div
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 bg-background shadow-md transition-all',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-green-500/50',
        'hover:shadow-lg'
      )}
    >
      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-md px-3 py-2"
        style={{ backgroundColor: data.color || '#10B981' }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white/20">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white">{triggerLabel}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-sm font-medium">{data.label}</p>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1">{data.description}</p>
        )}
      </div>

      {/* Validation indicator */}
      {data.isValid === false && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !border-2 !border-green-500 !bg-background"
      />
    </div>
  );
});

TriggerNode.displayName = 'TriggerNode';
