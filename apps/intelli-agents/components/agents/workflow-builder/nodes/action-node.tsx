'use client';

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { cn } from '@kit/ui/utils';
import {
  Mail,
  MessageSquare,
  Phone,
  UserPlus,
  UserCog,
  CheckSquare,
  FileText,
  Database,
  Globe,
  Variable,
  Clock,
  Banknote,
} from 'lucide-react';
import type { WorkflowNodeData, ActionType } from '~/lib/agents/types';

// Icon mapping for action types
const actionIcons: Record<ActionType, React.ComponentType<{ className?: string }>> = {
  send_email: Mail,
  send_sms: Phone,
  slack_message: MessageSquare,
  teams_message: MessageSquare,
  create_contact: UserPlus,
  update_contact: UserCog,
  create_task: CheckSquare,
  update_task: CheckSquare,
  create_invoice: FileText,
  update_crm_field: Database,
  ai_classify: Database,
  ai_summarize: FileText,
  ai_extract: FileText,
  ai_respond: MessageSquare,
  ai_translate: Globe,
  tripletex_sync: Database,
  fiken_sync: Database,
  vipps_payment: Banknote,
  condition: Database,
  delay: Clock,
  webhook_call: Globe,
  set_variable: Variable,
};

// Norwegian labels for action types
const actionLabels: Record<ActionType, string> = {
  send_email: 'Send e-post',
  send_sms: 'Send SMS',
  slack_message: 'Slack-melding',
  teams_message: 'Teams-melding',
  create_contact: 'Opprett kontakt',
  update_contact: 'Oppdater kontakt',
  create_task: 'Opprett oppgave',
  update_task: 'Oppdater oppgave',
  create_invoice: 'Opprett faktura',
  update_crm_field: 'Oppdater CRM-felt',
  ai_classify: 'AI Klassifisering',
  ai_summarize: 'AI Oppsummering',
  ai_extract: 'AI Ekstraksjon',
  ai_respond: 'AI Svar',
  ai_translate: 'AI Oversettelse',
  tripletex_sync: 'Tripletex-synk',
  fiken_sync: 'Fiken-synk',
  vipps_payment: 'Vipps-betaling',
  condition: 'Betingelse',
  delay: 'Forsinkelse',
  webhook_call: 'HTTP-forespørsel',
  set_variable: 'Sett variabel',
};

// Colors for different action categories
const actionColors: Record<string, string> = {
  send_email: '#3B82F6',
  send_sms: '#3B82F6',
  slack_message: '#3B82F6',
  teams_message: '#3B82F6',
  create_contact: '#10B981',
  update_contact: '#10B981',
  create_task: '#10B981',
  update_task: '#10B981',
  create_invoice: '#10B981',
  update_crm_field: '#10B981',
  tripletex_sync: '#059669',
  fiken_sync: '#059669',
  vipps_payment: '#FF5B24',
  webhook_call: '#8B5CF6',
  set_variable: '#6366F1',
  delay: '#F59E0B',
};

export const ActionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const actionType = data.actionType;
  const Icon = actionType
    ? actionIcons[actionType] || Database
    : Database;

  const actionLabel = actionType
    ? actionLabels[actionType]
    : 'Action';

  const color = data.color || (actionType ? actionColors[actionType] : '#3B82F6');

  return (
    <div
      className={cn(
        'relative min-w-[200px] rounded-lg border-2 bg-background shadow-md transition-all',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-border',
        'hover:shadow-lg'
      )}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !border-2 !border-blue-500 !bg-background"
      />

      {/* Header */}
      <div
        className="flex items-center gap-2 rounded-t-md px-3 py-2"
        style={{ backgroundColor: color }}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded bg-white/20">
          <Icon className="h-4 w-4 text-white" />
        </div>
        <span className="text-sm font-medium text-white">{actionLabel}</span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <p className="text-sm font-medium">{data.label}</p>
        {data.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {data.description}
          </p>
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
        className="!h-3 !w-3 !border-2 !border-blue-500 !bg-background"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
