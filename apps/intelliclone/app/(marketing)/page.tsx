import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, Brain, MessageSquare, Sparkles, Shield, Globe, Zap } from 'lucide-react';

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
import { Trans } from '@kit/ui/trans';

import billingConfig from '~/config/billing.config';
import pathsConfig from '~/config/paths.config';
import { withI18n } from '~/lib/i18n/with-i18n';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      {/* Hero Section */}
      <div className={'container mx-auto'}>
        <Hero
          pill={<Pill label={'Ny'}>AI som faktisk husker deg 🧠</Pill>}
          title={
            <>
              <span>Personlig AI-assistent</span>
              <span>for norske bedrifter</span>
            </>
          }
          subtitle={
            <span>
              IntelliClone er en AI-chatbot som husker og lærer. Jo mer dere snakker,
              jo bedre blir den. Bygget for det norske markedet.
            </span>
          }
          cta={<MainCallToActionButton />}
          image={
            <Image
              priority
              className={
                'dark:border-primary/10 rounded-2xl border border-gray-200'
              }
              width={3558}
              height={2222}
              src={`/images/dashboard.webp`}
              alt={`IntelliClone Dashboard`}
            />
          }
        />
      </div>

      {/* Key Differentiator - Memory */}
      <div className={'container mx-auto'}>
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Forskjellen? <span className="text-primary">Hukommelse.</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Andre chatboter glemmer alt etter hver samtale. IntelliClone husker 
            preferanser, fakta, og kontekst — akkurat som et menneske.
          </p>
        </div>
        
        <div className={'flex flex-col space-y-16 xl:space-y-32 2xl:space-y-36'}>
          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  AI med hukommelse
                </b>
                .{' '}
                <span className="text-muted-foreground font-normal">
                  Jo mer dere snakker, jo smartere blir assistenten din.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <Brain className="h-5" />
                <span>Personalisert AI</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:h-96'}
                label={'Husker alt viktig'}
                description={`IntelliClone lagrer fakta, preferanser og kontekst fra hver samtale. Neste gang vet den allerede hvem du er.`}
              >
                <div className="absolute top-32 left-0 right-0 flex justify-center">
                  <Brain className="h-32 w-32 text-primary/20" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={
                  'relative col-span-2 w-full overflow-hidden lg:col-span-1'
                }
                label={'Norsk først'}
                description={`Bygget for det norske markedet med støtte for norsk språk, lovverk og forretningskultur.`}
              >
                <div className="absolute top-24 left-0 right-0 flex justify-center">
                  <Globe className="h-24 w-24 text-primary/20" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={
                  'relative col-span-2 overflow-hidden lg:col-span-1 lg:h-96'
                }
                label={'Lærer over tid'}
                description={`Hukommelsen konsolideres og forbedres. Viktige fakta beholdes, uviktige glemmes naturlig.`}
              >
                <div className="absolute top-24 left-0 right-0 flex justify-center">
                  <Sparkles className="h-24 w-24 text-primary/20" />
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:h-96'}
                label={'Trygg datalagring'}
                description={`All data lagres sikkert i Norge med GDPR-kompatibel arkitektur. Du har full kontroll.`}
              >
                <div className="absolute top-32 left-0 right-0 flex justify-center">
                  <Shield className="h-32 w-32 text-primary/20" />
                </div>
              </FeatureCard>
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      {/* Use Cases */}
      <div className={'container mx-auto'}>
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">
            Bruksområder
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            IntelliClone tilpasser seg dine behov
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-xl border bg-card">
            <MessageSquare className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Kundestøtte</h3>
            <p className="text-muted-foreground">
              AI som kjenner kundene dine. Personlig service som skalerer.
            </p>
          </div>
          
          <div className="p-6 rounded-xl border bg-card">
            <Brain className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Intern assistent</h3>
            <p className="text-muted-foreground">
              En assistent som husker bedriftens rutiner, personer og prosjekter.
            </p>
          </div>
          
          <div className="p-6 rounded-xl border bg-card">
            <Zap className="h-10 w-10 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Salg & leads</h3>
            <p className="text-muted-foreground">
              Kvalifiser leads og gi personlig oppfølging automatisk.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className={'container mx-auto'}>
        <div
          className={
            'flex flex-col items-center justify-center space-y-16 py-16'
          }
        >
          <SecondaryHero
            pill={<Pill label="Start gratis">Ingen kredittkort nødvendig</Pill>}
            heading="Transparent prising i NOK"
            subheading="Start gratis og oppgrader når du er klar. Ingen skjulte kostnader."
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

      {/* Footer CTA */}
      <div className={'container mx-auto'}>
        <div className="text-center py-16 px-8 rounded-2xl bg-primary/5">
          <h2 className="text-3xl font-bold mb-4">
            Klar for en AI som faktisk husker?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Prøv IntelliClone gratis i 14 dager. Ingen kredittkort.
            Ingen binding.
          </p>
          <MainCallToActionButton />
        </div>
      </div>

      {/* Made in Norway badge */}
      <div className="text-center text-sm text-muted-foreground">
        🇳🇴 Laget i Norge • GDPR-kompatibel • Data lagret i Norden
      </div>
    </div>
  );
}

export default withI18n(Home);

function MainCallToActionButton() {
  return (
    <div className={'flex space-x-4 justify-center'}>
      <CtaButton>
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center space-x-0.5'}>
            <span>Prøv gratis</span>

            <ArrowRightIcon
              className={
                'animate-in fade-in slide-in-from-left-8 h-4' +
                ' zoom-in fill-mode-both delay-1000 duration-1000'
              }
            />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant={'link'}>
        <Link href={'/contact'}>
          Kontakt oss
        </Link>
      </CtaButton>
    </div>
  );
}
