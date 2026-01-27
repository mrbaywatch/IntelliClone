'use client';

import { X, Play, Mail, MessageSquare, GitBranch, Clock, Brain, Globe, Database, Variable, CheckCircle } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { ScrollArea } from '@kit/ui/scroll-area';

interface NodePanelProps {
  onClose: () => void;
}

interface NodeTemplate {
  type: string;
  label: string;
  description: string;
  icon: typeof Play;
  color: string;
  category: string;
}

const nodeTemplates: NodeTemplate[] = [
  // Triggers
  {
    type: 'trigger',
    label: 'Trigger',
    description: 'Start punkt for arbeidsflyten',
    icon: Play,
    color: '#3B82F6',
    category: 'Triggere',
  },
  // Actions
  {
    type: 'action',
    label: 'Send E-post',
    description: 'Send en e-post til en mottaker',
    icon: Mail,
    color: '#10B981',
    category: 'Handlinger',
  },
  {
    type: 'action',
    label: 'Send Melding',
    description: 'Send melding via Slack/Teams',
    icon: MessageSquare,
    color: '#8B5CF6',
    category: 'Handlinger',
  },
  {
    type: 'action',
    label: 'HTTP-forespørsel',
    description: 'Gjør en ekstern API-kall',
    icon: Globe,
    color: '#F59E0B',
    category: 'Handlinger',
  },
  // AI Tasks
  {
    type: 'ai_task',
    label: 'AI Klassifisering',
    description: 'Klassifiser tekst med AI',
    icon: Brain,
    color: '#8B5CF6',
    category: 'AI Oppgaver',
  },
  {
    type: 'ai_task',
    label: 'AI Svar',
    description: 'Generer svar med AI',
    icon: Brain,
    color: '#8B5CF6',
    category: 'AI Oppgaver',
  },
  {
    type: 'ai_task',
    label: 'AI Ekstraksjon',
    description: 'Trekk ut data fra tekst',
    icon: Brain,
    color: '#8B5CF6',
    category: 'AI Oppgaver',
  },
  // Control Flow
  {
    type: 'condition',
    label: 'Betingelse',
    description: 'Forgren basert på vilkår',
    icon: GitBranch,
    color: '#F59E0B',
    category: 'Kontrollflyt',
  },
  {
    type: 'delay',
    label: 'Forsinkelse',
    description: 'Vent en periode før fortsettelse',
    icon: Clock,
    color: '#6B7280',
    category: 'Kontrollflyt',
  },
  // Data
  {
    type: 'action',
    label: 'Sett Variabel',
    description: 'Lagre en verdi for senere bruk',
    icon: Variable,
    color: '#EC4899',
    category: 'Data',
  },
  // Output
  {
    type: 'output',
    label: 'Output',
    description: 'Definer resultatet av arbeidsflyten',
    icon: CheckCircle,
    color: '#10B981',
    category: 'Output',
  },
];

// Group templates by category
const groupedTemplates = nodeTemplates.reduce((acc, template) => {
  if (!acc[template.category]) {
    acc[template.category] = [];
  }
  acc[template.category]!.push(template);
  return acc;
}, {} as Record<string, NodeTemplate[]>);

export function NodePanel({ onClose }: NodePanelProps) {
  const handleDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', template.type);
    event.dataTransfer.setData(
      'node-data',
      JSON.stringify({
        label: template.label,
        description: template.description,
        icon: template.icon.name,
        color: template.color,
      })
    );
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 border-l bg-background flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Legg til Node</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {Object.entries(groupedTemplates).map(([category, templates]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {category}
              </h4>
              <div className="space-y-2">
                {templates.map((template, index) => {
                  const Icon = template.icon;
                  return (
                    <div
                      key={`${template.type}-${index}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, template)}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card cursor-grab hover:border-primary/50 hover:bg-accent transition-colors"
                    >
                      <div
                        className="flex h-8 w-8 items-center justify-center rounded-md flex-shrink-0"
                        style={{
                          backgroundColor: template.color + '20',
                          color: template.color,
                        }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{template.label}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t text-xs text-muted-foreground">
        Dra og slipp for å legge til noder
      </div>
    </div>
  );
}
