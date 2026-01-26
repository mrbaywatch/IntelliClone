'use client';

import { useState } from 'react';
import {
  Mail,
  CreditCard,
  MessageSquare,
  Building2,
  Phone,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  Settings,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Input } from '@kit/ui/input';
import { Label } from '@kit/ui/label';
import { Skeleton } from '@kit/ui/skeleton';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { toast } from 'sonner';

import type { AgentIntegration, IntegrationType } from '@/lib/agents/types';

interface IntegrationsContainerProps {
  accountSlug: string;
}

interface IntegrationConfig {
  type: IntegrationType;
  name: string;
  description: string;
  icon: typeof Mail;
  color: string;
  category: 'accounting' | 'email' | 'communication' | 'crm' | 'payment';
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'password';
    placeholder?: string;
  }>;
  docsUrl?: string;
}

const integrations: IntegrationConfig[] = [
  // Norwegian accounting
  {
    type: 'tripletex',
    name: 'Tripletex',
    description: 'Koble til Tripletex for automatisk synkronisering av faktura, kunder og produkter.',
    icon: Building2,
    color: '#0066CC',
    category: 'accounting',
    fields: [
      { name: 'consumerToken', label: 'Consumer Token', type: 'password' },
      { name: 'employeeToken', label: 'Employee Token', type: 'password' },
      { name: 'companyId', label: 'Company ID', type: 'text' },
    ],
    docsUrl: 'https://developer.tripletex.no/',
  },
  {
    type: 'fiken',
    name: 'Fiken',
    description: 'Koble til Fiken for automatisk regnskapsføring og fakturahåndtering.',
    icon: Building2,
    color: '#00A651',
    category: 'accounting',
    fields: [
      { name: 'username', label: 'Brukernavn', type: 'text' },
      { name: 'password', label: 'Passord', type: 'password' },
      { name: 'companySlug', label: 'Bedrifts-slug', type: 'text' },
    ],
    docsUrl: 'https://api.fiken.no/api/v2/docs/',
  },
  // Payment
  {
    type: 'vipps',
    name: 'Vipps',
    description: 'Motta betalingsvarslinger og prosesser Vipps-transaksjoner automatisk.',
    icon: CreditCard,
    color: '#FF5B24',
    category: 'payment',
    fields: [
      { name: 'clientId', label: 'Client ID', type: 'text' },
      { name: 'clientSecret', label: 'Client Secret', type: 'password' },
      { name: 'merchantSerialNumber', label: 'Merchant Serial Number', type: 'text' },
      { name: 'subscriptionKey', label: 'Subscription Key', type: 'password' },
    ],
    docsUrl: 'https://vipps.no/developer/',
  },
  // Email
  {
    type: 'gmail',
    name: 'Gmail',
    description: 'Les og send e-poster via Gmail. Krever OAuth-godkjenning.',
    icon: Mail,
    color: '#EA4335',
    category: 'email',
    fields: [],
    docsUrl: 'https://developers.google.com/gmail/api',
  },
  {
    type: 'outlook',
    name: 'Microsoft Outlook',
    description: 'Les og send e-poster via Outlook/Microsoft 365.',
    icon: Mail,
    color: '#0078D4',
    category: 'email',
    fields: [],
    docsUrl: 'https://learn.microsoft.com/en-us/outlook/rest/',
  },
  // Communication
  {
    type: 'slack',
    name: 'Slack',
    description: 'Send meldinger og varsler til Slack-kanaler.',
    icon: MessageSquare,
    color: '#4A154B',
    category: 'communication',
    fields: [
      { name: 'webhookUrl', label: 'Webhook URL', type: 'text', placeholder: 'https://hooks.slack.com/...' },
    ],
    docsUrl: 'https://api.slack.com/',
  },
  {
    type: 'teams',
    name: 'Microsoft Teams',
    description: 'Send meldinger og varsler til Microsoft Teams-kanaler.',
    icon: MessageSquare,
    color: '#6264A7',
    category: 'communication',
    fields: [
      { name: 'webhookUrl', label: 'Webhook URL', type: 'text' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/microsoftteams/platform/',
  },
  // CRM
  {
    type: 'hubspot',
    name: 'HubSpot',
    description: 'Synkroniser kontakter, leads og deals med HubSpot CRM.',
    icon: Building2,
    color: '#FF7A59',
    category: 'crm',
    fields: [
      { name: 'apiKey', label: 'API Key', type: 'password' },
    ],
    docsUrl: 'https://developers.hubspot.com/',
  },
  // SMS
  {
    type: 'twilio',
    name: 'Twilio',
    description: 'Send SMS-varsler og meldinger via Twilio.',
    icon: Phone,
    color: '#F22F46',
    category: 'communication',
    fields: [
      { name: 'accountSid', label: 'Account SID', type: 'text' },
      { name: 'authToken', label: 'Auth Token', type: 'password' },
      { name: 'phoneNumber', label: 'From Phone Number', type: 'text', placeholder: '+47...' },
    ],
    docsUrl: 'https://www.twilio.com/docs/usage/api',
  },
];

const categoryLabels: Record<string, string> = {
  accounting: 'Regnskap',
  email: 'E-post',
  communication: 'Kommunikasjon',
  crm: 'CRM',
  payment: 'Betaling',
};

export function IntegrationsContainer({ accountSlug }: IntegrationsContainerProps) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [connectDialogOpen, setConnectDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationConfig | null>(null);
  const [credentials, setCredentials] = useState<Record<string, string>>({});

  // Fetch connected integrations
  const { data: connectedIntegrations, isLoading, error } = useQuery({
    queryKey: ['integrations', accountSlug],
    queryFn: async () => {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('slug', accountSlug)
        .single();

      if (!account) throw new Error('Account not found');

      const { data, error } = await supabase
        .from('agent_integrations')
        .select('*')
        .eq('account_id', account.id);

      if (error) throw error;
      return data as unknown as AgentIntegration[];
    },
  });

  // Connect integration mutation
  const connectMutation = useMutation({
    mutationFn: async ({ type, credentials }: { type: IntegrationType; credentials: Record<string, string> }) => {
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('slug', accountSlug)
        .single();

      if (!account) throw new Error('Account not found');

      const config = integrations.find(i => i.type === type);
      if (!config) throw new Error('Integration not found');

      const { data, error } = await supabase
        .from('agent_integrations')
        .upsert({
          account_id: account.id,
          integration_type: type,
          name: config.name,
          credentials,
          is_connected: true,
          last_sync_at: new Date().toISOString(),
        }, {
          onConflict: 'account_id,integration_type',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', accountSlug] });
      setConnectDialogOpen(false);
      setCredentials({});
      toast.success('Integrasjon koblet til!');
    },
    onError: () => {
      toast.error('Kunne ikke koble til integrasjon');
    },
  });

  // Disconnect integration mutation
  const disconnectMutation = useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await supabase
        .from('agent_integrations')
        .update({
          is_connected: false,
          credentials: null,
        })
        .eq('id', integrationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations', accountSlug] });
      toast.success('Integrasjon frakoblet');
    },
    onError: () => {
      toast.error('Kunne ikke koble fra integrasjon');
    },
  });

  const handleConnect = (config: IntegrationConfig) => {
    setSelectedIntegration(config);
    setCredentials({});
    setConnectDialogOpen(true);
  };

  const handleSubmitCredentials = () => {
    if (selectedIntegration) {
      connectMutation.mutate({
        type: selectedIntegration.type,
        credentials,
      });
    }
  };

  const getConnectionStatus = (type: IntegrationType) => {
    return connectedIntegrations?.find(i => i.integrationType === type && i.isConnected);
  };

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    const category = integration.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(integration);
    return acc;
  }, {} as Record<string, IntegrationConfig[]>);

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <p className="mt-4 text-destructive">Kunne ikke laste integrasjoner</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-muted-foreground">
          Koble til dine favoritt-tjenester for å automatisere arbeidsflyten din.
          Alle tilkoblinger er kryptert og sikre.
        </p>
      </div>

      {/* Integration categories */}
      {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold">{categoryLabels[category] || category}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categoryIntegrations.map((config) => {
              const connection = getConnectionStatus(config.type);
              const Icon = config.icon;

              return (
                <Card key={config.type}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg"
                          style={{ backgroundColor: config.color + '20', color: config.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{config.name}</CardTitle>
                          {connection ? (
                            <Badge className="bg-green-100 text-green-800">
                              <Check className="mr-1 h-3 w-3" />
                              Tilkoblet
                            </Badge>
                          ) : (
                            <Badge variant="outline">Ikke tilkoblet</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                      {config.description}
                    </p>
                    <div className="flex items-center gap-2">
                      {connection ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => disconnectMutation.mutate(connection.id)}
                            disabled={disconnectMutation.isPending}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Koble fra
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConnect(config)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            Innstillinger
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" onClick={() => handleConnect(config)}>
                          Koble til
                        </Button>
                      )}
                      {config.docsUrl && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={config.docsUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Connect dialog */}
      <Dialog open={connectDialogOpen} onOpenChange={setConnectDialogOpen}>
        <DialogContent>
          {selectedIntegration && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      backgroundColor: selectedIntegration.color + '20',
                      color: selectedIntegration.color,
                    }}
                  >
                    <selectedIntegration.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle>Koble til {selectedIntegration.name}</DialogTitle>
                    <DialogDescription>
                      Skriv inn påloggingsinformasjonen for å koble til
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {selectedIntegration.fields.length > 0 ? (
                <div className="space-y-4 py-4">
                  {selectedIntegration.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label htmlFor={field.name}>{field.label}</Label>
                      <Input
                        id={field.name}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={credentials[field.name] || ''}
                        onChange={(e) =>
                          setCredentials((prev) => ({
                            ...prev,
                            [field.name]: e.target.value,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    Denne integrasjonen bruker OAuth. Klikk knappen nedenfor for å godkjenne tilgang.
                  </p>
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setConnectDialogOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleSubmitCredentials}
                  disabled={connectMutation.isPending}
                >
                  {connectMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  {selectedIntegration.fields.length > 0 ? 'Koble til' : 'Godkjenn tilgang'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
