import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRightIcon,
  BookOpen,
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
              className={
                'dark:border-primary/10 rounded-2xl border border-gray-200 shadow-2xl'
              }
              width={3558}
              height={2222}
              src={`/images/dashboard.webp`}
              alt={`Intelli-Law Dashboard`}
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
              <Image
                className="relative rounded-xl border shadow-lg"
                src={'/images/dashboard.webp'}
                width={600}
                height={400}
                alt="Intelli-Law i bruk"
              />
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
