'use server';

import Link from 'next/link';

import { PlusCircle, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

import { DocumentsTable } from './_components/documents-table';

interface DocumentsPageProps {
  searchParams: Promise<{
    page?: string;
    query?: string;
  }>;
}

async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const { id: accountId } = await requireUserInServerComponent();
  const params = await searchParams;
  
  const page = params.page ? parseInt(params.page) : 1;
  const pageSize = 10;

  const client = getSupabaseServerClient();

  // Fetch documents with analysis info
  const { data: documents, count } = await client
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('account_id', accountId)
    .order('created_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  const pageCount = count ? Math.ceil(count / pageSize) : 1;

  // Get stats
  const stats = {
    total: count || 0,
    analyzed: documents?.filter((d: { analysis_completed?: boolean }) => d.analysis_completed).length || 0,
    highRisk: documents?.filter((d: { risk_level?: string }) => d.risk_level === 'high' || d.risk_level === 'critical').length || 0,
  };

  const formattedDocuments = (documents || []).map((doc: {
    id: string;
    created_at: string;
    title: string;
    document_type?: string;
    risk_level?: string;
    analysis_completed?: boolean;
  }) => ({
    id: doc.id,
    createdAt: doc.created_at,
    title: doc.title,
    documentType: doc.document_type || 'unknown',
    riskLevel: doc.risk_level,
    analyzed: doc.analysis_completed || false,
  }));

  return (
    <>
      <PageHeader
        title={<Trans i18nKey="documents:documentsTitle" defaults="Dokumenter" />}
        description={<AppBreadcrumbs />}
      >
        <Button asChild>
          <Link href="/home/documents/new">
            <PlusCircle className="mr-2 h-4 w-4" />
            <Trans i18nKey="documents:uploadDocument" defaults="Last opp dokument" />
          </Link>
        </Button>
      </PageHeader>

      <PageBody>
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Totalt antall dokumenter
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.analyzed} analysert
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Høy risiko
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-500">
                  {stats.highRisk}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dokumenter som krever oppmerksomhet
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Analysert
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-500">
                  {stats.analyzed}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.total > 0 
                    ? `${Math.round((stats.analyzed / stats.total) * 100)}% av dokumentene`
                    : 'Ingen dokumenter ennå'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Documents Table */}
          <Card>
            <CardHeader>
              <CardTitle>Mine dokumenter</CardTitle>
              <CardDescription>
                Last opp og analyser juridiske dokumenter. Få innsikt i risikoer og kontraktsvilkår.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {formattedDocuments.length > 0 ? (
                <DocumentsTable
                  data={formattedDocuments}
                  page={page}
                  pageCount={pageCount}
                  pageSize={pageSize}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h3 className="text-lg font-medium">Ingen dokumenter ennå</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Last opp ditt første juridiske dokument for å komme i gang.
                  </p>
                  <Button asChild className="mt-4">
                    <Link href="/home/documents/new">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Last opp dokument
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(DocumentsPage);
