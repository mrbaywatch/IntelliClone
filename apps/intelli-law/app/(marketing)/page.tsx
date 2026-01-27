import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRightIcon,
  BookOpen,
  ChevronDown,
  FileCheck,
  FileSearch,
  Lock,
  Scale,
  Shield,
  Users,
  Zap,
} from 'lucide-react';

import { PricingTable } from '@kit/billing-gateway/marketing';
import {
  CtaButton,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
  Pill,
  SecondaryHero,
} from '@kit/ui/marketing';

import billingConfig from '~/config/billing.config';
import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      {/* Hero Section */}
      <div className={'container mx-auto'}>
        <Hero
          pill={
            <Pill label={'Nyhet'}>
              <span>AI-drevet juridisk assistent for norsk rett</span>
            </Pill>
          }
          title={
            <span className="text-secondary-foreground">
              <span>Juridisk arbeid.</span>{' '}
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Raskere og smartere.
              </span>
            </span>
          }
          subtitle={
            <span className="text-lg">
              Intelli-Law er din AI-drevne juridiske assistent som forstår norsk
              rett. Analyser dokumenter, gjennomgå kontrakter og få presise svar
              på juridiske spørsmål – på sekunder, ikke timer.
            </span>
          }
          cta={<MainCallToActionButton />}
          image={
            <Image
              priority
              className="rounded-2xl border border-gray-200 shadow-2xl dark:border-primary/10"
              width={1920}
              height={1080}
              src="/images/dashboard-hero.png"
              alt="Intelli-Law Dashboard"
            />
          }
        />
      </div>

      {/* Trust Indicators */}
      <div className={'container mx-auto'}>
        <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">GDPR-compliant</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Ende-til-ende kryptering</span>
          </div>
          <div className="flex items-center gap-2">
            <Scale className="h-5 w-5 text-indigo-600" />
            <span className="text-sm font-medium">Trenet på norsk lovverk</span>
          </div>
        </div>
      </div>

      {/* Main Features */}
      <div className={'container mx-auto'}>
        <div
          className={'flex flex-col space-y-16 xl:space-y-32 2xl:space-y-36'}
        >
          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  Kraftig juridisk AI
                </b>
                .{' '}
                <span className="text-muted-foreground font-normal">
                  Bygget for norske advokater, bedrifter og offentlig sektor.
                  Spar tid og reduser risiko med intelligent dokumentanalyse.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <Scale className="h-5" />
                <span>Alt-i-ett løsning</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:h-96'}
                label={'Dokumentanalyse'}
                description={
                  'Last opp juridiske dokumenter og få umiddelbar analyse. Vår AI identifiserer nøkkelklausuler, potensielle risikoer og avvik fra standardpraksis.'
                }
              >
                <div className="absolute top-32 right-8 hidden lg:flex">
                  <FileSearch className="h-48 w-48 text-blue-100 dark:text-blue-900/30" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={
                  'relative col-span-2 w-full overflow-hidden lg:col-span-1'
                }
                label={'Kontraktgjennomgang'}
                description={
                  'Automatisk gjennomgang av kontrakter mot norsk lovgivning. Finn problematiske vilkår, manglende klausuler og forbedringsforslag.'
                }
              >
                <div className="absolute bottom-4 right-4 hidden lg:flex">
                  <FileCheck className="h-32 w-32 text-green-100 dark:text-green-900/30" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={
                  'relative col-span-2 overflow-hidden lg:col-span-1 lg:h-96'
                }
                label={'Norsk lovekspertise'}
                description={
                  'Trenet på tusenvis av norske lover, forskrifter, dommer og juridisk praksis. Får presise referanser til relevant lovverk.'
                }
              >
                <div className="absolute bottom-4 right-4 hidden lg:flex">
                  <BookOpen className="h-32 w-32 text-indigo-100 dark:text-indigo-900/30" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:h-96'}
                label={'Sikkerhet og konfidensialitet'}
                description={
                  'Dine dokumenter er trygge hos oss. Vi lagrer data i Norge, følger GDPR, og garanterer full konfidensialitet for all juridisk informasjon.'
                }
              >
                <div className="absolute top-32 right-8 hidden lg:flex">
                  <Shield className="h-48 w-48 text-emerald-100 dark:text-emerald-900/30" />
                </div>
              </FeatureCard>
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className={'container mx-auto'}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight mb-4">
            Hvem bruker Intelli-Law?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Fra enkeltpersonforetak til store advokatfirmaer – Intelli-Law
            tilpasser seg dine behov.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <UseCaseCard
            icon={<Scale className="h-8 w-8" />}
            title="Advokatfirmaer"
            description="Effektiviser due diligence, kontraktgjennomgang og juridisk research. Frigjør tid til det som virkelig krever menneskelig ekspertise."
          />
          <UseCaseCard
            icon={<Users className="h-8 w-8" />}
            title="Bedrifter"
            description="Interne juridiske avdelinger får en kraftig assistent for kontrakthåndtering, compliance og risikovurdering."
          />
          <UseCaseCard
            icon={<Shield className="h-8 w-8" />}
            title="Offentlig sektor"
            description="Kommuner og statlige etater kan effektivisere forvaltningsvedtak, innsynsbehandling og regelverksanalyse."
          />
        </div>
      </div>

      {/* Benefits Section */}
      <div className={'container mx-auto bg-muted/50 rounded-3xl p-8 lg:p-16'}>
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight mb-6">
              Hvorfor velge Intelli-Law?
            </h2>
            <div className="space-y-6">
              <BenefitItem
                icon={<Zap className="h-5 w-5 text-yellow-600" />}
                title="Spar 80% av tiden"
                description="Dokumentanalyse som tidligere tok timer, tar nå minutter."
              />
              <BenefitItem
                icon={<Scale className="h-5 w-5 text-blue-600" />}
                title="Norsk juridisk kontekst"
                description="Forstår norske lover, rettspraksis og juridiske tradisjoner."
              />
              <BenefitItem
                icon={<Lock className="h-5 w-5 text-green-600" />}
                title="Ingen datadeling med tredjeparter"
                description="Dine dokumenter brukes aldri til å trene våre modeller."
              />
              <BenefitItem
                icon={<FileCheck className="h-5 w-5 text-indigo-600" />}
                title="Alltid oppdatert"
                description="Kontinuerlig oppdatert med nye lover, forskrifter og dommer."
              />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl opacity-20 blur-xl" />
              <div className="relative w-[400px] h-[300px] lg:w-[500px] lg:h-[350px] rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 flex flex-col justify-center items-center shadow-2xl">
                {/* Abstract visual representing AI-powered legal analysis */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute top-4 left-4 w-24 h-24 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute bottom-8 right-8 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white/5 blur-xl" />
                </div>
                <Scale className="h-16 w-16 text-white/90 mb-4 relative z-10" />
                <div className="flex gap-2 relative z-10">
                  <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse" />
                  <div className="w-3 h-3 rounded-full bg-white/40 animate-pulse delay-100" />
                  <div className="w-3 h-3 rounded-full bg-white/20 animate-pulse delay-200" />
                </div>
                <p className="text-white/80 text-sm mt-4 text-center relative z-10">
                  AI-drevet analyse
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className={'container mx-auto'}>
        <div
          className={
            'flex flex-col items-center justify-center space-y-16 py-16'
          }
        >
          <SecondaryHero
            pill={
              <Pill label="Kom i gang gratis">Ingen kredittkort nødvendig</Pill>
            }
            heading="Priser tilpasset din virksomhet"
            subheading="Start gratis og oppgrader når du er klar. Ingen bindingstid."
          />

          <div className={'w-full'}>
            <PricingTable
              config={billingConfig}
              paths={{
                signUp: pathsConfig.auth.signUp,
                return: pathsConfig.app.home,
              }}
            />
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className={'container mx-auto'}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Det norske jurister sier
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Fra advokatfirmaer til bedriftsjurister og offentlig sektor — se hvordan Intelli-Law gjør en forskjell.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card border rounded-xl p-6">
            <p className="text-muted-foreground mb-4 italic">
              "Intelli-Law har revolusjonert hvordan vi gjør due diligence. Det som 
              tidligere tok flere dager, klarer vi nå på timer. AI-en fanger opp 
              detaljer vi ofte overså manuelt."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="font-semibold text-blue-600">EK</span>
              </div>
              <div>
                <div className="font-semibold text-sm">Erik Kristoffersen</div>
                <div className="text-xs text-muted-foreground">Partner, Kristoffersen & Co Advokatfirma</div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <p className="text-muted-foreground mb-4 italic">
              "Som eneste jurist i selskapet var jeg overarbeidet med kontraktgjennomgang. 
              Nå bruker jeg Intelli-Law til førstegjennomgang, og kan fokusere på 
              de komplekse vurderingene."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="font-semibold text-blue-600">SL</span>
              </div>
              <div>
                <div className="font-semibold text-sm">Silje Larsen</div>
                <div className="text-xs text-muted-foreground">Bedriftsjurist, NordicTech AS</div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <p className="text-muted-foreground mb-4 italic">
              "For kommunen var datasikkerhet avgjørende. Intelli-Law lagrer alt i 
              Norge, og AI-en forstår forvaltningsrett og offentlighetsloven 
              overraskende godt."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <span className="font-semibold text-blue-600">TH</span>
              </div>
              <div>
                <div className="font-semibold text-sm">Thomas Haugen</div>
                <div className="text-xs text-muted-foreground">Juridisk rådgiver, Bergen kommune</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className={'container mx-auto max-w-3xl'}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Ofte stilte spørsmål</h2>
        </div>
        <div className="space-y-4">
          <FaqItem
            question="Hvor nøyaktig er AI-analysen?"
            answer="Intelli-Law oppnår typisk 90-95% nøyaktighet på dokumentanalyse sammenlignet med erfarne jurister. AI-en er trent på norsk lovverk og rettspraksis, og gir alltid kildehenvisninger slik at du enkelt kan verifisere. Vi anbefaler alltid menneskelig kvalitetssikring på viktige dokumenter."
          />
          <FaqItem
            question="Kan jeg stole på at dataene mine er sikre?"
            answer="Absolutt. Vi lagrer all data i Norge hos godkjente leverandører, bruker ende-til-ende kryptering, og følger GDPR fullt ut. Dine dokumenter brukes aldri til å trene våre modeller, og du har full kontroll med mulighet for eksport og sletting når som helst."
          />
          <FaqItem
            question="Hvordan håndterer dere konfidensielle dokumenter?"
            answer="Konfidensialitet er kjernen i vår tjeneste. Dokumenter krypteres både under overføring og lagring. Tilgang er strengt kontrollert, og vi har full revisjonslogg. Vi signerer gjerne NDA og kan tilpasse sikkerhetsoppsett for større kunder."
          />
          <FaqItem
            question="Støtter dere spesifikke juridiske områder?"
            answer="Ja, Intelli-Law er spesialisert på kontraktsrett, selskapsrett, arbeidsrett, personvern (GDPR), og forvaltningsrett. Vi utvider kontinuerlig med nye områder basert på kundeetterspørsel. AI-en er trent på tusenvis av norske lover, forskrifter og dommer."
          />
          <FaqItem
            question="Hvor lang tid tar det å analysere et dokument?"
            answer="De fleste dokumenter analyseres på under 60 sekunder. Lengre dokumenter (100+ sider) kan ta noen minutter. Du får varsling når analysen er ferdig, og kan jobbe med andre oppgaver i mellomtiden."
          />
          <FaqItem
            question="Kan jeg integrere med eksisterende systemer?"
            answer="Ja, vi tilbyr API-tilgang og ferdige integrasjoner mot vanlige dokumenthåndteringssystemer og saksbehandlingsløsninger. Vi kan også utvikle skreddersydde integrasjoner for større kunder."
          />
        </div>
      </div>

      {/* Final CTA */}
      <div className={'container mx-auto'}>
        <div className="text-center bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 lg:p-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Klar til å effektivisere ditt juridiske arbeid?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Bli med over 500 norske advokater og bedrifter som allerede bruker
            Intelli-Law for smartere juridisk arbeid.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <CtaButton
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              <Link href={'/auth/sign-up'}>
                <span className="flex items-center gap-2">
                  Start gratis prøveperiode
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Link>
            </CtaButton>
            <CtaButton
              variant="outline"
              className="border-white text-white hover:bg-white/10"
            >
              <Link href={'/contact'}>Bestill demo</Link>
            </CtaButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withI18n(Home);

function MainCallToActionButton() {
  return (
    <div className={'flex flex-col sm:flex-row gap-4'}>
      <CtaButton className="bg-blue-600 hover:bg-blue-700">
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center gap-2'}>
            <span>Prøv gratis</span>
            <ArrowRightIcon
              className={
                'animate-in fade-in slide-in-from-left-8 h-4 w-4' +
                ' zoom-in fill-mode-both delay-1000 duration-1000'
              }
            />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant={'outline'}>
        <Link href={'/contact'}>Se demo</Link>
      </CtaButton>
    </div>
  );
}

function UseCaseCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-8 text-center hover:shadow-lg transition-shadow">
      <div className="inline-flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 p-4 mb-4 text-blue-600">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function BenefitItem({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex-shrink-0 mt-1">{icon}</div>
      <div>
        <h3 className="font-semibold mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group border rounded-lg">
      <summary className="flex items-center justify-between cursor-pointer p-4 font-medium hover:bg-muted/50 transition-colors">
        {question}
        <ChevronDown className="h-5 w-5 text-muted-foreground group-open:rotate-180 transition-transform" />
      </summary>
      <div className="px-4 pb-4 text-muted-foreground">{answer}</div>
    </details>
  );
}
