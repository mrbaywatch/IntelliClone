'use server';

import { 
  FileText, 
  Download, 
  Eye,
  Briefcase,
  Home,
  Building2,
  Users,
  Shield
} from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
import { Button } from '@kit/ui/button';
import { PageBody, PageHeader } from '@kit/ui/page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { TemplateCard } from './_components/template-card';
import { TemplatePreviewDialog } from './_components/template-preview-dialog';

interface Template {
  id: string;
  name: string;
  name_norwegian: string;
  description: string | null;
  category: string;
  document_type: string;
  template_content: string;
  placeholders: Array<{
    key: string;
    label: string;
    labelNorwegian: string;
    type: string;
    required: boolean;
    defaultValue?: string;
    options?: string[];
  }>;
  instructions: string | null;
  legal_basis: string | null;
  version: string;
  is_public: boolean;
}

const categoryIcons: Record<string, React.ReactNode> = {
  employment_law: <Briefcase className="h-5 w-5" />,
  real_estate: <Home className="h-5 w-5" />,
  company_law: <Building2 className="h-5 w-5" />,
  contract_law: <FileText className="h-5 w-5" />,
  data_protection: <Shield className="h-5 w-5" />,
};

const categoryLabels: Record<string, string> = {
  employment_law: 'Arbeidsrett',
  contract_law: 'Kontraktsrett',
  company_law: 'Selskapsrett',
  real_estate: 'Eiendomsrett',
  family_law: 'Familierett',
  tax_law: 'Skatterett',
  intellectual_property: 'Immaterialrett',
  data_protection: 'Personvern',
  consumer_law: 'Forbrukerrett',
  other: 'Annet',
};

async function TemplatesPage() {
  const { id: accountId } = await requireUserInServerComponent();
  const client = getSupabaseServerClient();

  // Fetch templates (public + user's own) - using type assertion as table may not exist yet
  let templates: Template[] = [];
  try {
    const result = await client
      .from('legal_templates' as any)
      .select('*')
      .or(`is_public.eq.true,account_id.eq.${accountId}`)
      .order('category', { ascending: true });
    templates = (result.data as unknown as Template[]) || [];
  } catch {
    // Table might not exist yet
    templates = [];
  }

  // Group templates by category
  const templatesByCategory = templates.reduce<Record<string, Template[]>>((acc, template) => {
    const category = template.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {});

  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            <Trans i18nKey="templates:templatesTitle" defaults="Dokumentmaler" />
          </div>
        }
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className="space-y-8">
          {/* Introduction */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <h2 className="text-2xl font-bold mb-2">
                Norske dokumentmaler
              </h2>
              <p className="text-muted-foreground mb-4">
                Bruk våre ferdiglagde maler for vanlige juridiske dokumenter. Alle maler er 
                utformet i henhold til norsk lov og beste praksis. Fyll ut feltene og generer 
                et profesjonelt dokument på sekunder.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Arbeidsavtaler</Badge>
                <Badge variant="secondary">Leieavtaler</Badge>
                <Badge variant="secondary">NDA</Badge>
                <Badge variant="secondary">Fullmakter</Badge>
                <Badge variant="secondary">Og mer...</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Templates by Category */}
          {Object.entries(templatesByCategory).map(([category, categoryTemplates]) => (
            <div key={category}>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                {categoryIcons[category] || <FileText className="h-5 w-5" />}
                {categoryLabels[category] || category}
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categoryTemplates.map((template) => (
                  <TemplateCard 
                    key={template.id} 
                    template={template}
                    accountId={accountId}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {(!templates || templates.length === 0) && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="text-lg font-medium">Ingen maler tilgjengelig</h3>
                <p className="mt-1 text-sm text-muted-foreground text-center">
                  Dokumentmaler vil bli tilgjengelige snart.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Legal Disclaimer */}
          <Card className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Viktig om bruk av maler
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Disse malene er ment som utgangspunkt og må tilpasses din spesifikke situasjon. 
                  For komplekse avtaler eller viktige juridiske dokumenter anbefaler vi at du 
                  konsulterer en advokat for å sikre at dokumentet møter dine behov.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(TemplatesPage);
