'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bot,
  Mail,
  MessageCircle,
  UserPlus,
  FileText,
  AtSign,
  Briefcase,
  Star,
  Clock,
  Zap,
  Search,
  Filter,
  Loader2,
} from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Input } from '@kit/ui/input';
import { Badge } from '@kit/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@kit/ui/dialog';
import { Skeleton } from '@kit/ui/skeleton';
import { useTypedSupabase } from '~/lib/supabase/use-supabase';
import { toast } from '@kit/ui/sonner';

import type { AgentTemplate, TemplateCategory } from '~/lib/agents/types';

interface TemplatesContainerProps {
  accountSlug: string;
}

const categoryIcons: Record<TemplateCategory, typeof Bot> = {
  email: Mail,
  customer_support: MessageCircle,
  sales: UserPlus,
  data_entry: FileText,
  social_media: AtSign,
  finance: Briefcase,
  hr: Briefcase,
  custom: Bot,
};

const categoryLabels: Record<TemplateCategory, string> = {
  email: 'E-post',
  customer_support: 'Kundeservice',
  sales: 'Salg',
  data_entry: 'Dataregistrering',
  social_media: 'Sosiale Medier',
  finance: 'Økonomi',
  hr: 'HR',
  custom: 'Egendefinert',
};

const difficultyLabels: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Enkel', color: 'bg-green-100 text-green-800' },
  intermediate: { label: 'Middels', color: 'bg-yellow-100 text-yellow-800' },
  advanced: { label: 'Avansert', color: 'bg-red-100 text-red-800' },
};

export function TemplatesContainer({ accountSlug }: TemplatesContainerProps) {
  const supabase = useTypedSupabase();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory | 'all'>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch templates
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['agent-templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agent_templates')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as unknown as AgentTemplate[];
    },
  });

  // Create agent from template mutation
  const createFromTemplateMutation = useMutation({
    mutationFn: async (template: AgentTemplate) => {
      // Get account ID
      const { data: account } = await supabase
        .from('accounts')
        .select('id')
        .eq('slug', accountSlug)
        .single();

      if (!account) throw new Error('Account not found');

      // Create agent from template
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: agent, error } = await supabase
        .from('agents')
        .insert({
          account_id: account.id,
          name: template.name,
          description: template.description,
          icon: template.icon,
          color: template.color,
          status: 'draft' as const,
          template_id: template.id,
          workflow: template.workflow as any,
          config: template.config as any,
          system_prompt: template.systemPrompt,
        })
        .select()
        .single();

      if (error) throw error;

      // Increment template usage count
      await supabase
        .from('agent_templates')
        .update({ usage_count: template.usageCount + 1 })
        .eq('id', template.id);

      return agent;
    },
    onSuccess: (agent) => {
      toast.success('Agent opprettet fra mal!');
      router.push(`/home/${accountSlug}/agents/${agent.id}/builder`);
    },
    onError: () => {
      toast.error('Kunne ikke opprette agent');
    },
  });

  const handleUseTemplate = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewOpen(true);
  };

  const handleConfirmCreate = () => {
    if (selectedTemplate) {
      createFromTemplateMutation.mutate(selectedTemplate);
    }
  };

  // Filter templates
  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Group templates by featured and regular
  const featuredTemplates = filteredTemplates?.filter(t => t.isFeatured) || [];
  const regularTemplates = filteredTemplates?.filter(t => !t.isFeatured) || [];

  if (error) {
    return (
      <Card className="border-destructive">
        <CardContent className="py-8 text-center">
          <p className="text-destructive">Kunne ikke laste maler</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Søk etter maler..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                {categoryFilter === 'all' ? 'Alle kategorier' : categoryLabels[categoryFilter]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setCategoryFilter('all')}>
                Alle kategorier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {Object.entries(categoryLabels).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setCategoryFilter(key as TemplateCategory)}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton className="h-5 w-32 mt-3" />
                <Skeleton className="h-4 w-48 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Featured templates */}
          {featuredTemplates.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <h2 className="text-lg font-semibold">Anbefalte Maler</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {featuredTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All templates */}
          {regularTemplates.length > 0 && (
            <div className="space-y-4">
              {featuredTemplates.length > 0 && (
                <h2 className="text-lg font-semibold">Alle Maler</h2>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {regularTemplates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onUse={() => handleUseTemplate(template)}
                  />
                ))}
              </div>
            </div>
          )}

          {filteredTemplates?.length === 0 && (
            <Card>
              <CardContent className="py-16 text-center">
                <Bot className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Ingen maler funnet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Prøv å justere søket eller filteret
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Template preview dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-lg">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl"
                    style={{ backgroundColor: selectedTemplate.color + '20', color: selectedTemplate.color }}
                  >
                    {(() => {
                      const Icon = categoryIcons[selectedTemplate.category] || Bot;
                      return <Icon className="h-6 w-6" />;
                    })()}
                  </div>
                  <div>
                    <DialogTitle>{selectedTemplate.name}</DialogTitle>
                    <Badge className={difficultyLabels[selectedTemplate.difficulty]?.color || ''}>
                      {difficultyLabels[selectedTemplate.difficulty]?.label || selectedTemplate.difficulty}
                    </Badge>
                  </div>
                </div>
                <DialogDescription className="text-left pt-4">
                  {selectedTemplate.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* Tags */}
                {selectedTemplate.tags && selectedTemplate.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {selectedTemplate.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>~{selectedTemplate.estimatedSetupMinutes} min oppsett</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedTemplate.usageCount} bruker denne</span>
                  </div>
                </div>

                {/* Integrations */}
                {selectedTemplate.supportedIntegrations && selectedTemplate.supportedIntegrations.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Støttede integrasjoner</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTemplate.supportedIntegrations.map((integration) => (
                        <Badge key={integration} variant="secondary">
                          {integration}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Norwegian badge */}
                {selectedTemplate.isNorwegian && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-lg">🇳🇴</span>
                    <span>Tilpasset norsk marked</span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Avbryt
                </Button>
                <Button
                  onClick={handleConfirmCreate}
                  disabled={createFromTemplateMutation.isPending}
                >
                  {createFromTemplateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="mr-2 h-4 w-4" />
                  )}
                  Bruk denne malen
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface TemplateCardProps {
  template: AgentTemplate;
  onUse: () => void;
}

function TemplateCard({ template, onUse }: TemplateCardProps) {
  const CategoryIcon = categoryIcons[template.category] || Bot;
  const difficulty = difficultyLabels[template.difficulty];

  return (
    <Card className="group relative transition-shadow hover:shadow-md">
      {template.isFeatured && (
        <div className="absolute -top-2 -right-2 z-10">
          <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{ backgroundColor: template.color + '20', color: template.color }}
          >
            <CategoryIcon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{template.name}</CardTitle>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {categoryLabels[template.category]}
              </Badge>
              {difficulty && (
                <Badge className={`text-xs ${difficulty.color}`}>
                  {difficulty.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {template.description && (
          <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
            {template.description}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{template.estimatedSetupMinutes} min
            </span>
            {template.isNorwegian && <span>🇳🇴</span>}
          </div>
          <Button size="sm" onClick={onUse}>
            Bruk
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
