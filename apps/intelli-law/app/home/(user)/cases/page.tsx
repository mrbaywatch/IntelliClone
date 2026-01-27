'use server';

import Link from 'next/link';

import { 
  Briefcase, 
  PlusCircle, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen
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

import { CasesTable } from './_components/cases-table';
import { NewCaseDialog } from './_components/new-case-dialog';

interface LegalCase {
  id: string;
  name: string;
  description?: string;
  case_number?: string;
  category: string;
  status: string;
  client_name?: string;
  created_at: string;
  updated_at: string;
  case_documents: Array<{ count: number }>;
}

async function CasesPage() {
  const { id: accountId } = await requireUserInServerComponent();
  const client = getSupabaseServerClient();

  // Fetch cases - using type assertion as table may not exist yet
  let cases: LegalCase[] = [];
  let count: number | null = 0;
  try {
    const result = await client
      .from('legal_cases' as any)
      .select('*, case_documents(count)', { count: 'exact' })
      .eq('account_id', accountId)
      .order('updated_at', { ascending: false });
    cases = (result.data as unknown as LegalCase[]) || [];
    count = result.count;
  } catch {
    // Table might not exist yet
    cases = [];
  }

  // Get stats
  const stats = {
    total: count || 0,
    active: cases.filter((c) => c.status === 'active').length,
    pending: cases.filter((c) => c.status === 'pending').length,
    closed: cases.filter((c) => c.status === 'closed').length,
  };

  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <Briefcase className="h-6 w-6" />
            <Trans i18nKey="cases:casesTitle" defaults="Saker" />
          </div>
        }
        description={<AppBreadcrumbs />}
      >
        <NewCaseDialog accountId={accountId} />
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Totalt
                </CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Alle saker
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Aktive
                </CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-500">{stats.active}</div>
                <p className="text-xs text-muted-foreground">
                  Under behandling
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ventende
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">
                  Avventer handling
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avsluttet
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">{stats.closed}</div>
                <p className="text-xs text-muted-foreground">
                  Ferdigbehandlet
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Cases Table */}
          <Card>
            <CardHeader>
              <CardTitle>Mine saker</CardTitle>
              <CardDescription>
                Organiser dine juridiske saker og dokumenter. Hold oversikt over pågående og avsluttede saker.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {cases && cases.length > 0 ? (
                <CasesTable data={cases} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Briefcase className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Ingen saker ennå</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Opprett din første sak for å begynne å organisere dokumenter og kommunikasjon.
                  </p>
                  <NewCaseDialog accountId={accountId} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(CasesPage);
