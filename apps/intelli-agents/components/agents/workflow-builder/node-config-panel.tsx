'use client';

import { useState, useEffect } from 'react';
import type { Node } from 'reactflow';
import { X, Trash2 } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Input } from '@kit/ui/input';
import { Textarea } from '@kit/ui/textarea';
import { Label } from '@kit/ui/label';
import { ScrollArea } from '@kit/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@kit/ui/accordion';

import type { WorkflowNodeData, TriggerType, ActionType } from '~/lib/agents/types';

interface NodeConfigPanelProps {
  node: Node;
  onUpdate: (data: Partial<WorkflowNodeData>) => void;
  onDelete: () => void;
  onClose: () => void;
}

const triggerTypes: Array<{ value: TriggerType; label: string; description: string }> = [
  { value: 'manual', label: 'Manuell', description: 'Start manuelt via knapp eller API' },
  { value: 'email_received', label: 'E-post mottatt', description: 'Når en e-post kommer inn' },
  { value: 'webhook', label: 'Webhook', description: 'Når en webhook-forespørsel mottas' },
  { value: 'schedule', label: 'Tidsplan', description: 'Kjør på angitte tidspunkter' },
  { value: 'form_submission', label: 'Skjema sendt', description: 'Når et skjema fylles ut' },
  { value: 'chat_message', label: 'Chatmelding', description: 'Når en chatmelding mottas' },
];

const actionTypes: Array<{ value: ActionType; label: string; category: string }> = [
  // Communication
  { value: 'send_email', label: 'Send E-post', category: 'Kommunikasjon' },
  { value: 'send_sms', label: 'Send SMS', category: 'Kommunikasjon' },
  { value: 'slack_message', label: 'Slack-melding', category: 'Kommunikasjon' },
  // CRM
  { value: 'create_contact', label: 'Opprett Kontakt', category: 'CRM' },
  { value: 'update_contact', label: 'Oppdater Kontakt', category: 'CRM' },
  { value: 'create_task', label: 'Opprett Oppgave', category: 'CRM' },
  // AI
  { value: 'ai_classify', label: 'AI Klassifisering', category: 'AI' },
  { value: 'ai_respond', label: 'AI Svar', category: 'AI' },
  { value: 'ai_extract', label: 'AI Ekstraksjon', category: 'AI' },
  { value: 'ai_summarize', label: 'AI Oppsummering', category: 'AI' },
  // Control
  { value: 'condition', label: 'Betingelse', category: 'Kontroll' },
  { value: 'delay', label: 'Forsinkelse', category: 'Kontroll' },
  { value: 'webhook_call', label: 'HTTP-forespørsel', category: 'Kontroll' },
  { value: 'set_variable', label: 'Sett Variabel', category: 'Kontroll' },
];

export function NodeConfigPanel({ node, onUpdate, onDelete, onClose }: NodeConfigPanelProps) {
  const [label, setLabel] = useState(node.data.label || '');
  const [description, setDescription] = useState(node.data.description || '');
  const [triggerType, setTriggerType] = useState<TriggerType | ''>(node.data.triggerType || '');
  const [actionType, setActionType] = useState<ActionType | ''>(node.data.actionType || '');

  // Update local state when node changes
  useEffect(() => {
    setLabel(node.data.label || '');
    setDescription(node.data.description || '');
    setTriggerType(node.data.triggerType || '');
    setActionType(node.data.actionType || '');
  }, [node.id, node.data]);

  const handleLabelChange = (value: string) => {
    setLabel(value);
    onUpdate({ label: value });
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    onUpdate({ description: value });
  };

  const handleTriggerTypeChange = (value: TriggerType) => {
    setTriggerType(value);
    onUpdate({
      triggerType: value,
      triggerConfig: { type: value } as WorkflowNodeData['triggerConfig'],
    });
  };

  const handleActionTypeChange = (value: ActionType) => {
    setActionType(value);
    onUpdate({
      actionType: value,
      actionConfig: { type: value } as WorkflowNodeData['actionConfig'],
    });
  };

  const renderNodeTypeConfig = () => {
    switch (node.type) {
      case 'trigger':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Trigger Type</Label>
              <Select value={triggerType} onValueChange={handleTriggerTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg trigger type" />
                </SelectTrigger>
                <SelectContent>
                  {triggerTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <p>{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trigger-specific config */}
            {triggerType === 'schedule' && (
              <div className="space-y-2">
                <Label>Cron-uttrykk</Label>
                <Input
                  placeholder="0 9 * * *"
                  value={(node.data.triggerConfig as { cron?: string })?.cron || ''}
                  onChange={(e) =>
                    onUpdate({
                      triggerConfig: {
                        ...node.data.triggerConfig,
                        type: 'schedule',
                        cron: e.target.value,
                        timezone: 'Europe/Oslo',
                      },
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Eksempel: "0 9 * * *" = hver dag kl 09:00
                </p>
              </div>
            )}

            {triggerType === 'webhook' && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Webhook URL</p>
                <p className="text-xs text-muted-foreground mt-1 break-all">
                  URL genereres når agenten aktiveres
                </p>
              </div>
            )}
          </div>
        );

      case 'action':
      case 'ai_task':
      case 'integration':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Handling</Label>
              <Select value={actionType} onValueChange={handleActionTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Velg handling" />
                </SelectTrigger>
                <SelectContent>
                  {actionTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Action-specific config */}
            {actionType === 'send_email' && (
              <Accordion type="single" collapsible defaultValue="email-config">
                <AccordionItem value="email-config">
                  <AccordionTrigger>E-post Innstillinger</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <Label>Til</Label>
                      <Input
                        placeholder="{{trigger.data.email}}"
                        value={(node.data.actionConfig as { to?: string })?.to || ''}
                        onChange={(e) =>
                          onUpdate({
                            actionConfig: {
                              ...node.data.actionConfig,
                              type: 'send_email',
                              to: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Emne</Label>
                      <Input
                        placeholder="Re: {{trigger.data.subject}}"
                        value={(node.data.actionConfig as { subject?: string })?.subject || ''}
                        onChange={(e) =>
                          onUpdate({
                            actionConfig: {
                              ...node.data.actionConfig,
                              type: 'send_email',
                              subject: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Innhold</Label>
                      <Textarea
                        placeholder="Skriv e-postinnhold... Bruk {{variabel}} for dynamiske verdier"
                        rows={5}
                        value={(node.data.actionConfig as { body?: string })?.body || ''}
                        onChange={(e) =>
                          onUpdate({
                            actionConfig: {
                              ...node.data.actionConfig,
                              type: 'send_email',
                              body: e.target.value,
                              bodyType: 'text',
                            },
                          })
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {actionType === 'ai_classify' && (
              <Accordion type="single" collapsible defaultValue="classify-config">
                <AccordionItem value="classify-config">
                  <AccordionTrigger>Klassifisering Innstillinger</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <Label>Input felt</Label>
                      <Input
                        placeholder="trigger.data.body"
                        value={(node.data.actionConfig as { inputField?: string })?.inputField || ''}
                        onChange={(e) =>
                          onUpdate({
                            actionConfig: {
                              ...node.data.actionConfig,
                              type: 'ai_classify',
                              inputField: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Output felt</Label>
                      <Input
                        placeholder="classification"
                        value={(node.data.actionConfig as { outputField?: string })?.outputField || ''}
                        onChange={(e) =>
                          onUpdate({
                            actionConfig: {
                              ...node.data.actionConfig,
                              type: 'ai_classify',
                              outputField: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Kategorier konfigureres i avanserte innstillinger
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}

            {actionType === 'ai_respond' && (
              <Accordion type="single" collapsible defaultValue="respond-config">
                <AccordionItem value="respond-config">
                  <AccordionTrigger>AI Svar Innstillinger</AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-2">
                    <div className="space-y-2">
                      <Label>Input felt</Label>
                      <Input
                        placeholder="trigger.data.message"
                        value={(node.data.actionConfig as { inputField?: string })?.inputField || ''}
                        onChange={(e) =>
                          onUpdate({
                            actionConfig: {
                              ...node.data.actionConfig,
                              type: 'ai_respond',
                              inputField: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>System Prompt (valgfritt)</Label>
                      <Textarea
                        placeholder="Du er en hjelpsom assistent..."
                        rows={3}
                        value={(node.data.actionConfig as { systemPrompt?: string })?.systemPrompt || ''}
                        onChange={(e) =>
                          onUpdate({
                            actionConfig: {
                              ...node.data.actionConfig,
                              type: 'ai_respond',
                              systemPrompt: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tone</Label>
                      <Select
                        value={(node.data.actionConfig as { tone?: string })?.tone || 'friendly'}
                        onValueChange={(value) =>
                          onUpdate({
                            actionConfig: {
                              ...node.data.actionConfig,
                              type: 'ai_respond',
                              tone: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Profesjonell</SelectItem>
                          <SelectItem value="friendly">Vennlig</SelectItem>
                          <SelectItem value="formal">Formell</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            )}
          </div>
        );

      case 'condition':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Betingelser lar deg forgrene arbeidsflyten basert på data.
            </p>
            <div className="space-y-2">
              <Label>Felt</Label>
              <Input
                placeholder="classification.category"
                value={(node.data.conditionConfig?.conditions?.[0] as { field?: string })?.field || ''}
                onChange={(e) =>
                  onUpdate({
                    conditionConfig: {
                      type: 'condition',
                      conditions: [
                        {
                          ...node.data.conditionConfig?.conditions?.[0],
                          field: e.target.value,
                        },
                      ],
                    },
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Operator</Label>
              <Select
                value={(node.data.conditionConfig?.conditions?.[0] as { operator?: string })?.operator || 'eq'}
                onValueChange={(value) =>
                  onUpdate({
                    conditionConfig: {
                      type: 'condition',
                      conditions: [
                        {
                          ...node.data.conditionConfig?.conditions?.[0],
                          operator: value,
                        },
                      ],
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="eq">Er lik</SelectItem>
                  <SelectItem value="neq">Er ikke lik</SelectItem>
                  <SelectItem value="contains">Inneholder</SelectItem>
                  <SelectItem value="gt">Større enn</SelectItem>
                  <SelectItem value="lt">Mindre enn</SelectItem>
                  <SelectItem value="exists">Eksisterer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Verdi</Label>
              <Input
                placeholder="support"
                value={String((node.data.conditionConfig?.conditions?.[0] as { value?: unknown })?.value || '')}
                onChange={(e) =>
                  onUpdate({
                    conditionConfig: {
                      type: 'condition',
                      conditions: [
                        {
                          ...node.data.conditionConfig?.conditions?.[0],
                          value: e.target.value,
                        },
                      ],
                    },
                  })
                }
              />
            </div>
          </div>
        );

      case 'delay':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Varighet</Label>
                <Input
                  type="number"
                  min={1}
                  value={node.data.delayConfig?.duration || 5}
                  onChange={(e) =>
                    onUpdate({
                      delayConfig: {
                        type: 'delay',
                        duration: parseInt(e.target.value),
                        unit: node.data.delayConfig?.unit || 'minutes',
                      },
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Enhet</Label>
                <Select
                  value={node.data.delayConfig?.unit || 'minutes'}
                  onValueChange={(value) =>
                    onUpdate({
                      delayConfig: {
                        type: 'delay',
                        duration: node.data.delayConfig?.duration || 5,
                        unit: value as 'seconds' | 'minutes' | 'hours' | 'days',
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seconds">Sekunder</SelectItem>
                    <SelectItem value="minutes">Minutter</SelectItem>
                    <SelectItem value="hours">Timer</SelectItem>
                    <SelectItem value="days">Dager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'output':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Output-noden markerer slutten på arbeidsflyten og definerer hva som returneres.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-80 border-l bg-background flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Konfigurer Node</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Basic settings */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Grunnleggende</h4>
            <div className="space-y-2">
              <Label htmlFor="label">Navn</Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Node navn"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Beskrivelse</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                placeholder="Kort beskrivelse av hva denne noden gjør"
                rows={2}
              />
            </div>
          </div>

          {/* Node type specific config */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Innstillinger</h4>
            {renderNodeTypeConfig()}
          </div>
        </div>
      </ScrollArea>

      {/* Delete button */}
      <div className="p-4 border-t">
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={onDelete}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Slett Node
        </Button>
      </div>
    </div>
  );
}
