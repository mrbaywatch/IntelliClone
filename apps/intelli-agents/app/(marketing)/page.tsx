import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRightIcon,
  BotIcon,
  BrainCircuitIcon,
  ChevronDown,
  ClockIcon,
  PlugZapIcon,
  RocketIcon,
  ShieldCheckIcon,
  SparklesIcon,
  WorkflowIcon,
  ZapIcon,
} from 'lucide-react';

import { PricingTable } from '@kit/billing-gateway/marketing';
import {
  CtaButton,
  EcosystemShowcase,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  GradientSecondaryText,
  Hero,
  Pill,
  PillActionButton,
  SecondaryHero,
} from '@kit/ui/marketing';

import billingConfig from '~/config/billing.config';
import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      {/* Hero Section */}
      <div className={'mx-auto'}>
        <Hero
          pill={
            <Pill label={'Nyhet'}>
              <span>AI-agenter som jobber for deg – døgnet rundt</span>
              <PillActionButton asChild>
                <Link href={'/auth/sign-up'}>
                  <ArrowRightIcon className={'h-4 w-4'} />
                </Link>
              </PillActionButton>
            </Pill>
          }
          title={
            <span className="text-secondary-foreground">
              <span>Automatiser arbeidsflyten din</span>
              <br />
              <GradientSecondaryText>med AI-agenter</GradientSecondaryText>
            </span>
          }
          subtitle={
            <span>
              Intelli-Agents lar deg bygge intelligente AI-agenter som utfører
              oppgaver automatisk. Koble til systemene du allerede bruker, og la
              AI-en ta seg av det repetitive arbeidet – uten koding.
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
              alt="Intelli-Agents Dashboard"
            />
          }
        />
      </div>

      {/* Social Proof / Stats */}
      <div className={'container mx-auto'}>
        <div className="flex flex-col items-center justify-center space-y-8">
          <p className="text-muted-foreground text-sm uppercase tracking-wider">
            Brukt av fremtidsrettede norske bedrifter
          </p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            <StatCard number="10x" label="raskere arbeidsflyt" />
            <StatCard number="24/7" label="automatisert drift" />
            <StatCard number="100+" label="integrasjoner" />
            <StatCard number="0" label="koding nødvendig" />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className={'container mx-auto'}>
        <div className={'py-4 xl:py-8'}>
          <FeatureShowcase
            heading={
              <>
                <b className="font-medium tracking-tight dark:text-white">
                  Kraftige AI-agenter
                </b>
                .{' '}
                <span className="text-secondary-foreground/70 block font-normal tracking-tight">
                  Bygg automatiseringer som faktisk forstår hva du trenger.
                  Intelli-Agents kombinerer AI med dine eksisterende verktøy.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <BotIcon className="h-4 w-4" />
                <span>AI-drevet automatisering</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Intelligente agenter'}
                description={
                  'AI-agenter som forstår kontekst og tar smarte beslutninger basert på dine regler og data.'
                }
              >
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <BrainCircuitIcon className="h-24 w-24" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 w-full overflow-hidden'}
                label={'Sømløse integrasjoner'}
                description={
                  'Koble til norske systemer som Tripletex, Fiken, og internasjonale verktøy som Slack, HubSpot og mer.'
                }
              >
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <PlugZapIcon className="h-24 w-24" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Uten koding'}
                description={
                  'Bygg avanserte automatiseringer visuelt. Dra og slipp for å lage komplekse arbeidsflyter på minutter.'
                }
              >
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <SparklesIcon className="h-24 w-24" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Sanntids-overvåking'}
                description={
                  'Følg med på alle kjøringer, feilsøk enkelt, og optimaliser ytelsen til agentene dine.'
                }
              >
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <ZapIcon className="h-24 w-24" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Enterprise-sikkerhet'}
                description={
                  'GDPR-kompatibel med data lagret i Norge. Rollebasert tilgangskontroll og full revisjonssporing.'
                }
              >
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <ShieldCheckIcon className="h-24 w-24" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Ferdige maler'}
                description={
                  'Kom i gang på sekunder med maler for vanlige oppgaver som kundeservice, salg, og administrasjon.'
                }
              >
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <RocketIcon className="h-24 w-24" />
                </div>
              </FeatureCard>
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className={'container mx-auto'}>
        <div className="flex flex-col items-center space-y-12">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Hva kan AI-agentene gjøre for deg?
            </h2>
            <p className="text-muted-foreground mt-4 max-w-2xl text-lg">
              Fra kundeservice til intern administrasjon – agentene tar over de
              tidkrevende oppgavene så du kan fokusere på det som betyr mest.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <UseCaseCard
              icon={<ClockIcon className="h-6 w-6" />}
              title="Automatisk oppfølging"
              description="La agenten følge opp leads, sende påminnelser, og holde oversikt over kundekommunikasjon."
            />
            <UseCaseCard
              icon={<WorkflowIcon className="h-6 w-6" />}
              title="Prosessautomatisering"
              description="Automatiser godkjenningsflyter, dokumenthåndtering, og interne rutiner."
            />
            <UseCaseCard
              icon={<BotIcon className="h-6 w-6" />}
              title="AI-kundeservice"
              description="Svar på vanlige spørsmål 24/7 med en agent som forstår norsk og din bedrift."
            />
          </div>
        </div>
      </div>

      {/* Ecosystem / Visual Section */}
      <div className={'container mx-auto'}>
        <EcosystemShowcase
          heading="Bygg én gang. Kjør automatisk for alltid."
          description="Med Intelli-Agents definerer du arbeidsflyten visuelt, og AI-agenten tar seg av resten. Perfekt for norske bedrifter som vil effektivisere uten å miste kontrollen."
        >
          <WorkflowDiagram />
        </EcosystemShowcase>
      </div>

      {/* Benefits for Norwegian Market */}
      <div className={'container mx-auto'}>
        <div className="bg-muted/50 rounded-2xl p-8 md:p-12">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col justify-center space-y-4">
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
                Laget for norske bedrifter
              </h2>
              <ul className="space-y-3">
                <BenefitItem text="GDPR-kompatibel med data i Norge/EU" />
                <BenefitItem text="Integrasjoner med norske systemer" />
                <BenefitItem text="Support på norsk" />
                <BenefitItem text="Priser i NOK – ingen valutaoverranskelser" />
                <BenefitItem text="Norsk faktura med organisasjonsnummer" />
              </ul>
            </div>
            <div className="flex items-center justify-center">
              <div className="bg-background flex h-48 w-48 items-center justify-center rounded-full shadow-lg">
                <span className="text-6xl">🇳🇴</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className={'container mx-auto'}>
        <div
          className={
            'flex flex-col items-center justify-center space-y-12 py-4 xl:py-8'
          }
        >
          <SecondaryHero
            pill={<Pill label="Prøv gratis">Ingen kredittkort nødvendig</Pill>}
            heading="Rettferdig prising for alle bedrifter"
            subheading="Start gratis og oppgrader når du er klar. Betal kun for det du bruker."
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

      {/* Testimonials */}
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Det norske bedrifter sier
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Bedrifter over hele Norge bruker Intelli-Agents for å spare tid og jobbe smartere.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card border rounded-xl p-6">
            <p className="text-muted-foreground mb-4 italic">
              "Vi sparer over 20 timer i uken på oppgaver som før krevde manuelt arbeid.
              AI-agentene tar seg av oppfølging, rapporter og rutinejobber — helt automatisk."
            </p>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <span className="text-primary font-semibold">TN</span>
              </div>
              <div>
                <div className="text-sm font-semibold">Thomas Nilsen</div>
                <div className="text-muted-foreground text-xs">Daglig leder, Bygg & Prosjekt AS</div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <p className="text-muted-foreground mb-4 italic">
              "Lead-oppfølging var et mareritt før. Nå svarer agenten innen sekunder,
              kvalifiserer leads, og booker møter for salgsteamet. Konverteringsraten vår har doblet seg."
            </p>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <span className="text-primary font-semibold">SE</span>
              </div>
              <div>
                <div className="text-sm font-semibold">Silje Eriksen</div>
                <div className="text-muted-foreground text-xs">Markedssjef, Digital Vekst Norge</div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <p className="text-muted-foreground mb-4 italic">
              "Som IT-ansvarlig var jeg skeptisk til AI-automatisering. Men med full logg,
              rollestyring og GDPR-kontroll føler jeg meg trygg. Endelig en løsning som gir oss oversikt."
            </p>
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <span className="text-primary font-semibold">AJ</span>
              </div>
              <div>
                <div className="text-sm font-semibold">Anders Johansen</div>
                <div className="text-muted-foreground text-xs">IT-ansvarlig, Norsk Industri Gruppen</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="container mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold">Ofte stilte spørsmål</h2>
          <p className="text-muted-foreground text-lg">
            Alt du lurer på om Intelli-Agents og AI-automatisering.
          </p>
        </div>
        <div className="space-y-4">
          <FaqItem
            question="Trenger jeg teknisk bakgrunn for å bruke dette?"
            answer="Nei! Intelli-Agents er bygget for å være enkelt. Du bygger automatiseringer visuelt ved å dra og slippe — ingen koding nødvendig. Hvis du kan bruke et regneark, kan du bygge AI-agenter."
          />
          <FaqItem
            question="Hvilke systemer kan agentene koble til?"
            answer="Vi har integrasjoner med over 100 systemer, inkludert norske favoritter som Tripletex, Fiken, og 24SevenOffice. I tillegg fungerer vi med internasjonale verktøy som Slack, HubSpot, Salesforce, Google Workspace og mange flere."
          />
          <FaqItem
            question="Hvor sikre er automatiseringene?"
            answer="Veldig sikre. All data er kryptert, lagret i EU, og vi er fullt GDPR-kompatible. Du har full kontroll med rollebasert tilgang, og alle handlinger logges for revisjon. Enterprise-planen inkluderer også SSO og dedikert support."
          />
          <FaqItem
            question="Hva skjer hvis en agent feiler?"
            answer="Agentene har innebygd feilhåndtering. Hvis noe går galt, får du varsel umiddelbart, og du kan se nøyaktig hva som skjedde i kjøringsloggen. Du kan enkelt fikse og kjøre på nytt — ingen data går tapt."
          />
          <FaqItem
            question="Kan jeg se hva agentene gjør?"
            answer="Absolutt. Du har full oversikt over alle kjøringer i sanntid. Se hva som trigger agenten, hvilke steg den tar, og resultatet. Perfekt for feilsøking og optimalisering."
          />
          <FaqItem
            question="Hvordan kommer jeg i gang?"
            answer="Enkelt! Opprett en gratis konto, velg en mal eller bygg din egen arbeidsflyt, koble til systemene dine, og aktiver agenten. De fleste er i gang på under 30 minutter. Trenger du hjelp, er supporten vår klar."
          />
        </div>
      </div>

      {/* Final CTA */}
      <div className={'container mx-auto'}>
        <div className="bg-primary text-primary-foreground rounded-2xl p-8 text-center md:p-12">
          <h2 className="text-2xl font-bold md:text-3xl">
            Klar til å automatisere?
          </h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">
            Bli med tusenvis av bedrifter som allerede sparer timer hver uke med
            AI-agenter. Kom i gang på under 5 minutter.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CtaButton
              variant={'secondary'}
              className="h-12 px-8 text-base font-semibold"
            >
              <Link href={'/auth/sign-up'}>
                <span className="flex items-center gap-2">
                  Start gratis nå
                  <ArrowRightIcon className="h-4 w-4" />
                </span>
              </Link>
            </CtaButton>
            <CtaButton
              variant={'ghost'}
              className="text-primary-foreground hover:text-primary-foreground/80 h-12 px-8 text-base"
            >
              <Link href={'/contact'}>Snakk med oss</Link>
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
    <div className={'flex flex-col items-center gap-4 sm:flex-row'}>
      <CtaButton className="h-12 px-8 text-base font-semibold">
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center gap-2'}>
            <span>Kom i gang gratis</span>
            <ArrowRightIcon className={'h-4 w-4'} />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant={'outline'} className="h-12 px-8 text-base">
        <Link href={'/docs'}>Se dokumentasjon</Link>
      </CtaButton>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-primary text-3xl font-bold md:text-4xl">
        {number}
      </span>
      <span className="text-muted-foreground text-sm">{label}</span>
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
    <div className="bg-card rounded-xl border p-6 transition-shadow hover:shadow-lg">
      <div className="bg-primary/10 text-primary mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}

function BenefitItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3">
      <div className="bg-primary text-primary-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full">
        <svg
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <span>{text}</span>
    </li>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group rounded-lg border">
      <summary className="hover:bg-muted/50 flex cursor-pointer items-center justify-between p-4 font-medium transition-colors">
        {question}
        <ChevronDown className="text-muted-foreground h-5 w-5 transition-transform group-open:rotate-180" />
      </summary>
      <div className="text-muted-foreground px-4 pb-4">{answer}</div>
    </details>
  );
}

function HeroVisual() {
  return (
    <div className="relative w-full aspect-[16/10] rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 shadow-2xl overflow-hidden">
      {/* Floating icons */}
      <div className="absolute top-8 left-8 p-4 bg-background/80 backdrop-blur-sm rounded-xl border shadow-lg animate-pulse">
        <BotIcon className="h-8 w-8 text-primary" />
      </div>
      <div className="absolute top-12 right-12 p-4 bg-background/80 backdrop-blur-sm rounded-xl border shadow-lg animate-pulse delay-100">
        <BrainCircuitIcon className="h-8 w-8 text-primary" />
      </div>
      <div className="absolute bottom-16 left-16 p-4 bg-background/80 backdrop-blur-sm rounded-xl border shadow-lg animate-pulse delay-200">
        <WorkflowIcon className="h-8 w-8 text-primary" />
      </div>
      <div className="absolute bottom-12 right-20 p-4 bg-background/80 backdrop-blur-sm rounded-xl border shadow-lg animate-pulse delay-300">
        <ZapIcon className="h-8 w-8 text-primary" />
      </div>
      
      {/* Center visual */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Connection lines */}
          <svg className="absolute inset-0 w-64 h-64 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" className="text-primary/20" strokeWidth="1" strokeDasharray="4 4" />
            <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" className="text-primary/30" strokeWidth="1" strokeDasharray="4 4" />
          </svg>
          
          {/* Central hub */}
          <div className="relative z-10 p-6 bg-primary text-primary-foreground rounded-2xl shadow-xl">
            <SparklesIcon className="h-12 w-12" />
          </div>
        </div>
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none" />
    </div>
  );
}

function WorkflowDiagram() {
  return (
    <div className="w-full max-w-4xl mx-auto p-8 bg-gradient-to-br from-muted/50 to-background rounded-2xl border shadow-xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Trigger */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl">
            <ZapIcon className="h-8 w-8 text-blue-500" />
          </div>
          <span className="text-sm font-medium">Trigger</span>
          <span className="text-xs text-muted-foreground">E-post, webhook, tid</span>
        </div>
        
        {/* Arrow */}
        <div className="hidden md:flex items-center">
          <div className="w-12 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500" />
          <ArrowRightIcon className="h-5 w-5 text-purple-500 -ml-1" />
        </div>
        <div className="md:hidden">
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* AI Agent */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 bg-purple-500/10 border-2 border-purple-500/30 rounded-xl">
            <BrainCircuitIcon className="h-8 w-8 text-purple-500" />
          </div>
          <span className="text-sm font-medium">AI-agent</span>
          <span className="text-xs text-muted-foreground">Analyserer og beslutter</span>
        </div>
        
        {/* Arrow */}
        <div className="hidden md:flex items-center">
          <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500 to-green-500" />
          <ArrowRightIcon className="h-5 w-5 text-green-500 -ml-1" />
        </div>
        <div className="md:hidden">
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* Actions */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 bg-green-500/10 border-2 border-green-500/30 rounded-xl">
            <PlugZapIcon className="h-8 w-8 text-green-500" />
          </div>
          <span className="text-sm font-medium">Handlinger</span>
          <span className="text-xs text-muted-foreground">Slack, e-post, CRM</span>
        </div>
        
        {/* Arrow */}
        <div className="hidden md:flex items-center">
          <div className="w-12 h-0.5 bg-gradient-to-r from-green-500 to-orange-500" />
          <ArrowRightIcon className="h-5 w-5 text-orange-500 -ml-1" />
        </div>
        <div className="md:hidden">
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </div>
        
        {/* Result */}
        <div className="flex flex-col items-center gap-2">
          <div className="p-4 bg-orange-500/10 border-2 border-orange-500/30 rounded-xl">
            <RocketIcon className="h-8 w-8 text-orange-500" />
          </div>
          <span className="text-sm font-medium">Resultat</span>
          <span className="text-xs text-muted-foreground">Automatisk levert</span>
        </div>
      </div>
      
      {/* Bottom tagline */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Ingen koding • Kjører 24/7 • Full kontroll
        </p>
      </div>
    </div>
  );
}
