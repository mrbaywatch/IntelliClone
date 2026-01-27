import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRightIcon,
  BotIcon,
  BrainCircuitIcon,
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
              className={
                'dark:border-primary/10 w-full rounded-lg border border-gray-200 shadow-2xl'
              }
              width={3558}
              height={2222}
              src={`/images/dashboard.webp`}
              alt={`Intelli-Agents Dashboard`}
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
          <Image
            className="rounded-md shadow-xl"
            src={'/images/dashboard.webp'}
            alt="Agent Builder"
            width={1000}
            height={1000}
          />
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
