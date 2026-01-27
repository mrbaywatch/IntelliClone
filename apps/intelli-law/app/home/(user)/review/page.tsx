'use server';

import Link from 'next/link';

import { 
  FileSearch, 
  Upload, 
  Shield, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText
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

import { ContractUploadZone } from './_components/contract-upload-zone';
import { RecentReviews } from './_components/recent-reviews';

interface AnalyzedDocument {
  id: string;
  title: string;
  document_type?: string;
  risk_level?: string;
  risk_score?: number;
  analysis_completed?: boolean;
  created_at: string;
}

async function ContractReviewPage() {
  const { id: accountId } = await requireUserInServerComponent();
  const client = getSupabaseServerClient();

  // Fetch recent analyzed documents - using type assertion as DB types may not include legal fields
  const result = await client
    .from('documents' as any)
    .select('id, title, document_type, risk_level, risk_score, analysis_completed, created_at')
    .eq('account_id', accountId)
    .eq('analysis_completed', true)
    .order('created_at', { ascending: false })
    .limit(5);
  
  const recentDocuments = result.data as AnalyzedDocument[] | null;

  // Get stats
  const { count: totalAnalyzed } = await client
    .from('documents' as any)
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .eq('analysis_completed', true);

  const { count: highRiskCount } = await client
    .from('documents' as any)
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .in('risk_level', ['high', 'critical']);

  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <FileSearch className="h-6 w-6" />
            <Trans i18nKey="review:contractReview" defaults="Kontraktsgjennomgang" />
          </div>
        }
        description={<AppBreadcrumbs />}
      />

      <PageBody>
        <div className="space-y-6">
          {/* Introduction */}
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2">
                    AI-drevet kontraktsanalyse
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Last opp en kontrakt og få en grundig gjennomgang på sekunder. 
                    Vår AI identifiserer risikoer, manglende klausuler og gir 
                    anbefalinger basert på norsk lov og beste praksis.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-500" />
                      <span className="text-sm">Risikoanalyse</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <span className="text-sm">Mangelsjekk</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-blue-500" />
                      <span className="text-sm">GDPR-samsvar</span>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 md:min-w-[200px]">
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold">{totalAnalyzed || 0}</div>
                    <div className="text-xs text-muted-foreground">Analysert</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg border">
                    <div className="text-2xl font-bold text-orange-500">{highRiskCount || 0}</div>
                    <div className="text-xs text-muted-foreground">Høy risiko</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Last opp kontrakt for gjennomgang
              </CardTitle>
              <CardDescription>
                Dra og slipp en PDF-fil, eller klikk for å velge. Støtter norske og engelske kontrakter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContractUploadZone accountId={accountId} />
            </CardContent>
          </Card>

          {/* What Gets Analyzed */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  Risikoidentifisering
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>• Ansvarsbegrensninger</li>
                  <li>• Oppsigelsesvilkår</li>
                  <li>• Dagmulkter og bøter</li>
                  <li>• Skadesløsholdelse</li>
                  <li>• Konkurranseklausuler</li>
                  <li>• Verneting og lovvalg</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-500" />
                  Dokumentanalyse
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>• Automatisk dokumenttype</li>
                  <li>• Parter og roller</li>
                  <li>• Viktige datoer</li>
                  <li>• Økonomiske vilkår</li>
                  <li>• Nøkkelklausuler</li>
                  <li>• Manglende elementer</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  Lovlighetssjekk
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <ul className="space-y-1">
                  <li>• GDPR/Personvern</li>
                  <li>• Arbeidsmiljøloven</li>
                  <li>• Forbrukerrettigheter</li>
                  <li>• Husleieloven</li>
                  <li>• Avtaleloven § 36</li>
                  <li>• Relevante lover</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Recent Reviews */}
          {recentDocuments && recentDocuments.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Nylige gjennomganger
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/home/documents">Se alle</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <RecentReviews documents={recentDocuments || []} />
              </CardContent>
            </Card>
          )}
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(ContractReviewPage);
