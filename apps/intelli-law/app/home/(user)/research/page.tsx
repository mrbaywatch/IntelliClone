'use server';

import { 
  BookOpen, 
  Search, 
  Scale,
  ExternalLink,
  FileText,
  Gavel
} from 'lucide-react';

import { AppBreadcrumbs } from '@kit/ui/app-breadcrumbs';
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

import { LegalSearchForm } from './_components/legal-search-form';
import { QuickLawLinks } from './_components/quick-law-links';

async function ResearchPage() {
  await requireUserInServerComponent();

  return (
    <>
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            <Trans i18nKey="research:researchTitle" defaults="Juridisk Søk" />
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
                    Juridisk søk og forskning
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    Søk i norske lover, forskrifter og rettspraksis. Få AI-assistert 
                    juridisk forskning med referanser til Lovdata og andre kilder.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      <Scale className="mr-1 h-3 w-3" />
                      Lover
                    </Badge>
                    <Badge variant="secondary">
                      <FileText className="mr-1 h-3 w-3" />
                      Forskrifter
                    </Badge>
                    <Badge variant="secondary">
                      <Gavel className="mr-1 h-3 w-3" />
                      Dommer
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Søk i juridiske kilder
              </CardTitle>
              <CardDescription>
                Skriv inn et juridisk tema eller spørsmål for å finne relevante lover, 
                paragrafer og rettspraksis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <LegalSearchForm />
            </CardContent>
          </Card>

          {/* Quick Links to Laws */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Viktige lover
              </CardTitle>
              <CardDescription>
                Rask tilgang til de mest brukte norske lovene på Lovdata.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuickLawLinks />
            </CardContent>
          </Card>

          {/* External Resources */}
          <Card>
            <CardHeader>
              <CardTitle>Eksterne ressurser</CardTitle>
              <CardDescription>
                Nyttige juridiske ressurser og databaser.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <a
                  href="https://lovdata.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-red-500/10">
                    <Scale className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Lovdata</div>
                    <div className="text-sm text-muted-foreground">
                      Norges offisielle rettskildedatabase
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>

                <a
                  href="https://www.rettsinfo.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Gavel className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Rettsinfo</div>
                    <div className="text-sm text-muted-foreground">
                      Dommer og juridiske nyheter
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>

                <a
                  href="https://www.datatilsynet.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <FileText className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Datatilsynet</div>
                    <div className="text-sm text-muted-foreground">
                      Personvern og GDPR-veiledning
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>

                <a
                  href="https://www.forbrukerradet.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-orange-500/10">
                    <Scale className="h-5 w-5 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Forbrukerrådet</div>
                    <div className="text-sm text-muted-foreground">
                      Forbrukerrettigheter og klager
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>

                <a
                  href="https://www.arbeidstilsynet.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <FileText className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Arbeidstilsynet</div>
                    <div className="text-sm text-muted-foreground">
                      Arbeidsrett og HMS
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>

                <a
                  href="https://www.brreg.no"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="p-2 rounded-lg bg-cyan-500/10">
                    <Scale className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">Brønnøysundregistrene</div>
                    <div className="text-sm text-muted-foreground">
                      Selskapsregister og roller
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </PageBody>
    </>
  );
}

export default withI18n(ResearchPage);
