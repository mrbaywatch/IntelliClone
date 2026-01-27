import { use } from 'react';

import Link from 'next/link';

import { 
  FileText, 
  MessageSquare, 
  FileSearch, 
  Scale,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Shield,
  Sparkles
} from 'lucide-react';

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { Button } from '@kit/ui/button';
import { PageBody } from '@kit/ui/page';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Trans } from '@kit/ui/trans';

import { HomeLayoutPageHeader } from '~/home/(user)/_components/home-page-header';
import { loadUserWorkspace } from '~/home/(user)/_lib/server/load-user-workspace';
import { Database } from '~/lib/database.types';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export const generateMetadata = async () => {
  const i18n = await createI18nServerInstance();
  const title = i18n.t('account:homePage');

  return {
    title,
  };
};

interface DocumentWithAnalysis {
  id: string;
  risk_level?: string;
  analysis_completed?: boolean;
}

function UserHomePage() {
  const workspace = use(loadUserWorkspace());
  const client = getSupabaseServerClient<Database>();
  const accountId = workspace.user.id;

  // Fetch dashboard stats - using type assertion as DB types may not include legal fields
  const { data: documents } = use(
    client
      .from('documents')
      .select('id, risk_level, analysis_completed')
      .eq('account_id', accountId)
  ) as { data: DocumentWithAnalysis[] | null };

  const stats = {
    totalDocuments: documents?.length || 0,
    analyzedDocuments: documents?.filter((d) => d.analysis_completed).length || 0,
    highRiskDocuments: documents?.filter((d) => 
      d.risk_level === 'high' || d.risk_level === 'critical'
    ).length || 0,
  };

  return (
    <>
      <HomeLayoutPageHeader
        description={
          <span className="flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Din juridiske AI-assistent for norsk rett
          </span>
        }
      />

      <PageBody>
        <div className="space-y-8">
          {/* Welcome Section */}
          <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-start gap-6">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-primary" />
                    Velkommen til Intelli-Law
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Din AI-drevne juridiske assistent for norsk rett. Analyser kontrakter, 
                    still juridiske spørsmål, og få innsikt i risikoer - alt tilpasset norsk lovgivning.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild>
                      <Link href="/home/review">
                        <FileSearch className="mr-2 h-4 w-4" />
                        Analyser kontrakt
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/home/chat">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Still et spørsmål
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-background rounded-lg border min-w-[100px]">
                    <FileText className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                    <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                    <div className="text-xs text-muted-foreground">Dokumenter</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg border min-w-[100px]">
                    <CheckCircle2 className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <div className="text-2xl font-bold text-green-600">{stats.analyzedDocuments}</div>
                    <div className="text-xs text-muted-foreground">Analysert</div>
                  </div>
                  <div className="text-center p-3 bg-background rounded-lg border min-w-[100px]">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <div className="text-2xl font-bold text-orange-600">{stats.highRiskDocuments}</div>
                    <div className="text-xs text-muted-foreground">Høy risiko</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Contract Review */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileSearch className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Kontraktsgjennomgang</CardTitle>
                    <CardDescription>AI-analyse av juridiske dokumenter</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Last opp en kontrakt og få en grundig risikoanalyse, identifisering 
                  av problematiske klausuler, og anbefalinger basert på norsk lov.
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Automatisk risikovurdering
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    GDPR-samsvarsjekk
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Lovhenvisninger
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/home/review">
                    Start gjennomgang
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Legal Chat */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <MessageSquare className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Juridisk Assistent</CardTitle>
                    <CardDescription>Spør om norsk lov og rettigheter</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Still spørsmål om arbeidsrett, kontraktsrett, husleie, forbrukerrett 
                  og mer. Få svar med henvisning til relevante norske lover.
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Norsk juridisk ekspertise
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Lovdata-referanser
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Kontekstuell forståelse
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/home/chat">
                    Start samtale
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FileText className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Mine dokumenter</CardTitle>
                    <CardDescription>Administrer dine juridiske dokumenter</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Se alle dine opplastede dokumenter, analyseresultater og 
                  chat-historikk samlet på ett sted.
                </p>
                <ul className="text-sm space-y-1 mb-4">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Dokumentoversikt
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Risikofiltrering
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Chat med dokumenter
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/home/documents">
                    Se dokumenter
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Knowledge Areas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Juridiske områder vi dekker
              </CardTitle>
              <CardDescription>
                Vår AI har kunnskap om de fleste områder innen norsk rett
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Arbeidsrett', desc: 'Ansettelse, oppsigelse, lønn' },
                  { name: 'Kontraktsrett', desc: 'Avtaler, mislighold, heving' },
                  { name: 'Husleierett', desc: 'Leie, depositum, oppsigelse' },
                  { name: 'Forbrukerrett', desc: 'Kjøp, reklamasjon, angrerett' },
                  { name: 'Selskapsrett', desc: 'AS, styre, generalforsamling' },
                  { name: 'Personvern', desc: 'GDPR, databehandling, samtykke' },
                  { name: 'Familierett', desc: 'Arv, skilsmisse, barn' },
                  { name: 'Skatterett', desc: 'Fradrag, MVA, selvangivelse' },
                ].map((area) => (
                  <div 
                    key={area.name}
                    className="p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="font-medium text-sm">{area.name}</div>
                    <div className="text-xs text-muted-foreground">{area.desc}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-4 flex items-start gap-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                  Viktig informasjon
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                  Intelli-Law gir generell juridisk informasjon basert på AI-teknologi. 
                  Svarene erstatter ikke profesjonell juridisk rådgivning. For konkrete 
                  saker anbefaler vi å kontakte en advokat.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(UserHomePage);
