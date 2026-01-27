import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRightIcon,
  Brain,
  MessageSquare,
  Sparkles,
  Shield,
  Globe,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  HeartHandshake,
  Building2,
  ChevronDown,
  Database,
  Cpu,
  Languages,
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
              <span>AI som faktisk husker kundene dine 🧠</span>
            </Pill>
          }
          title={
            <>
              <span className="block">Din egen AI-assistent</span>
              <span className="block text-primary">som lærer virksomheten din</span>
            </>
          }
          subtitle={
            <span className="text-lg">
              IntelliClone er ikke bare en chatbot — det er en AI som husker, lærer og 
              blir smartere for hver samtale. Bygget for norske bedrifter som vil gi 
              kundene personlig service som skalerer.
            </span>
          }
          cta={<MainCallToActionButton />}
          image={
            <div className="relative">
              <Image
                priority
                className="dark:border-primary/10 rounded-2xl border border-gray-200 shadow-2xl"
                width={3558}
                height={2222}
                src={`/images/dashboard.webp`}
                alt={`IntelliClone Dashboard - AI chatbot for norske bedrifter`}
              />
              {/* Floating stats */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                <div className="bg-background/95 backdrop-blur border rounded-lg px-4 py-2 shadow-lg">
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <div className="text-xs text-muted-foreground">Løsningsrate</div>
                </div>
                <div className="bg-background/95 backdrop-blur border rounded-lg px-4 py-2 shadow-lg">
                  <div className="text-2xl font-bold text-primary">&lt;3s</div>
                  <div className="text-xs text-muted-foreground">Responstid</div>
                </div>
                <div className="bg-background/95 backdrop-blur border rounded-lg px-4 py-2 shadow-lg">
                  <div className="text-2xl font-bold text-primary">24/7</div>
                  <div className="text-xs text-muted-foreground">Tilgjengelig</div>
                </div>
              </div>
            </div>
          }
        />
      </div>

      {/* Trust badges */}
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-8 text-muted-foreground text-sm">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            <span>GDPR-kompatibel</span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <span>Data lagret i EU</span>
          </div>
          <div className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            <span>Full norsk støtte</span>
          </div>
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-purple-600" />
            <span>Norske integrasjoner</span>
          </div>
        </div>
      </div>

      {/* Problem/Solution section */}
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6">
              Trøtt av chatboter som <span className="text-red-500 line-through">glemmer alt?</span>
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Kunder må gjenta seg selv hver gang</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>AI-en forstår ikke norsk kontekst og kultur</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Data sendes til servere i USA</span>
              </p>
              <p className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Generiske svar som ikke matcher merkevaren din</span>
              </p>
            </div>
          </div>
          <div className="bg-primary/5 rounded-2xl p-8">
            <h3 className="text-2xl font-bold mb-6 text-primary">
              IntelliClone er annerledes
            </h3>
            <div className="space-y-4">
              <p className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span><strong>Husker alt viktig</strong> — preferanser, historikk, kontekst</span>
              </p>
              <p className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span><strong>Norsk i bunnen</strong> — forstår nyanser, dialekter, forretningskultur</span>
              </p>
              <p className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span><strong>EU-lagring</strong> — GDPR-kompatibel fra dag én</span>
              </p>
              <p className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                <span><strong>Din stemme</strong> — lærer tonen og stilen til bedriften din</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How Memory Works */}
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <Pill label="Teknologien" className="mb-4">Slik fungerer hukommelsen</Pill>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            AI med <span className="text-primary">ekte hukommelse</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Andre chatboter starter på nytt hver gang. IntelliClone bygger opp 
            kunnskap over tid — akkurat som en kollega som lærer jobben.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Samtale</h3>
            <p className="text-muted-foreground">
              Kunden snakker med IntelliClone. AI-en fanger opp viktige detaljer 
              automatisk — navn, preferanser, problemstillinger.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Lagring</h3>
            <p className="text-muted-foreground">
              Viktig informasjon lagres i kundens profil. Uviktig støy filtreres 
              bort. Alt sikkert og GDPR-kompatibelt.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Gjenkjenning</h3>
            <p className="text-muted-foreground">
              Neste gang vet IntelliClone allerede hvem kunden er. Personlig 
              service fra første sekund.
            </p>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div className={'container mx-auto'}>
        <FeatureShowcase
          heading={
            <>
              <b className="font-semibold dark:text-white">
                Alt du trenger
              </b>
              .{' '}
              <span className="text-muted-foreground font-normal">
                En komplett plattform for AI-drevet kundeservice.
              </span>
            </>
          }
          icon={
            <FeatureShowcaseIconContainer>
              <Sparkles className="h-5" />
              <span>Funksjoner</span>
            </FeatureShowcaseIconContainer>
          }
        >
          <FeatureGrid>
            <FeatureCard
              className="relative col-span-2 overflow-hidden lg:h-80"
              label="Langtidshukommelse"
              description="Husker fakta, preferanser og kontekst fra tidligere samtaler. Kunder slipper å gjenta seg selv."
            >
              <div className="absolute bottom-4 right-4 opacity-10">
                <Brain className="h-32 w-32 text-primary" />
              </div>
            </FeatureCard>

            <FeatureCard
              className="relative col-span-2 lg:col-span-1 overflow-hidden"
              label="Norsk språkstøtte"
              description="Forstår norsk naturlig — inkludert dialekter, slang og bransjespesifikke uttrykk."
            >
              <div className="absolute bottom-4 right-4 opacity-10">
                <Globe className="h-24 w-24 text-primary" />
              </div>
            </FeatureCard>

            <FeatureCard
              className="relative col-span-2 lg:col-span-1 overflow-hidden"
              label="Lær av dokumenter"
              description="Last opp FAQ, produktinfo, prislister. IntelliClone lærer bedriften din på minutter."
            >
              <div className="absolute bottom-4 right-4 opacity-10">
                <Database className="h-24 w-24 text-primary" />
              </div>
            </FeatureCard>

            <FeatureCard
              className="relative col-span-2 overflow-hidden lg:h-80"
              label="Sømløs overlevering"
              description="Vet når den trenger hjelp. Overfører til mennesker med full kontekst — kunden trenger ikke gjenta noe."
            >
              <div className="absolute bottom-4 right-4 opacity-10">
                <HeartHandshake className="h-32 w-32 text-primary" />
              </div>
            </FeatureCard>

            <FeatureCard
              className="relative col-span-2 lg:col-span-1 overflow-hidden"
              label="Analyser & innsikt"
              description="Se hva kundene spør om, hva som fungerer, og hvor det er forbedringspotensial."
            >
              <div className="absolute bottom-4 right-4 opacity-10">
                <Zap className="h-24 w-24 text-primary" />
              </div>
            </FeatureCard>

            <FeatureCard
              className="relative col-span-2 lg:col-span-1 overflow-hidden"
              label="Integrasjoner"
              description="Kobles til CRM, helpdesk, e-handel og andre systemer du allerede bruker."
            >
              <div className="absolute bottom-4 right-4 opacity-10">
                <Cpu className="h-24 w-24 text-primary" />
              </div>
            </FeatureCard>
          </FeatureGrid>
        </FeatureShowcase>
      </div>

      {/* Use Cases by Team */}
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bygget for alle team
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            IntelliClone tilpasser seg — fra kundeservice til salg til intern support.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="group p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all">
            <MessageSquare className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2">Kundeservice</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Løs opptil 85% av henvendelser automatisk. Personlig hjelp 24/7.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Automatiske svar på FAQ</li>
              <li>• Ordresporing</li>
              <li>• Returhåndtering</li>
            </ul>
          </div>

          <div className="group p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all">
            <Zap className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2">Salg</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Kvalifiser leads automatisk og gi personlig produktveiledning.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Lead-kvalifisering</li>
              <li>• Produktanbefalinger</li>
              <li>• Møtebooking</li>
            </ul>
          </div>

          <div className="group p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all">
            <Building2 className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2">HR & Intern</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Intern assistent som kjenner rutiner, systemer og prosesser.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Onboarding-hjelp</li>
              <li>• Policy-spørsmål</li>
              <li>• IT-support</li>
            </ul>
          </div>

          <div className="group p-6 rounded-xl border bg-card hover:border-primary/50 hover:shadow-lg transition-all">
            <Users className="h-10 w-10 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-lg font-semibold mb-2">Marketing</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Engasjer besøkende og konverter til leads og kunder.
            </p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Proaktive meldinger</li>
              <li>• Kampanjesupport</li>
              <li>• Feedback-innsamling</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Social Proof / Stats */}
      <div className="container mx-auto">
        <div className="bg-primary/5 rounded-3xl p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">85%</div>
              <div className="text-muted-foreground">av henvendelser løst automatisk</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">&lt;3 sek</div>
              <div className="text-muted-foreground">gjennomsnittlig responstid</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">50%</div>
              <div className="text-muted-foreground">reduksjon i supportkostnader</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">4.8/5</div>
              <div className="text-muted-foreground">kundetilfredshet</div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Det norske bedrifter sier
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card border rounded-xl p-6">
            <p className="text-muted-foreground mb-4 italic">
              "Endelig en AI som forstår norsk ordentlig. Kundene våre merker 
              forskjellen — de får hjelp med én gang, uten å gjenta seg selv."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary">MH</span>
              </div>
              <div>
                <div className="font-semibold text-sm">Maria Hansen</div>
                <div className="text-xs text-muted-foreground">Kundesjef, Nettbutikk AS</div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <p className="text-muted-foreground mb-4 italic">
              "Vi sparte 40% på kundeservice første måneden. IntelliClone 
              håndterer de enkle sakene, så teamet kan fokusere på det viktige."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary">OB</span>
              </div>
              <div>
                <div className="font-semibold text-sm">Ole Berg</div>
                <div className="text-xs text-muted-foreground">Daglig leder, TechStart</div>
              </div>
            </div>
          </div>

          <div className="bg-card border rounded-xl p-6">
            <p className="text-muted-foreground mb-4 italic">
              "GDPR var vår største bekymring. Med IntelliClone ligger alt i 
              EU, og vi har full kontroll over dataene. Endelig en løsning vi stoler på."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="font-semibold text-primary">KL</span>
              </div>
              <div>
                <div className="font-semibold text-sm">Kristine Larsen</div>
                <div className="text-xs text-muted-foreground">IT-sjef, Finans Norge</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="container mx-auto">
        <div className="flex flex-col items-center justify-center space-y-16 py-8">
          <SecondaryHero
            pill={<Pill label="Prøv gratis">14 dager uten binding</Pill>}
            heading="Enkel, transparent prising"
            subheading="Start gratis. Betal kun for det du bruker. Ingen skjulte kostnader eller bindingstid."
          />

          <div className="w-full">
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

      {/* FAQ */}
      <div className="container mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Ofte stilte spørsmål</h2>
        </div>
        <div className="space-y-4">
          <FaqItem 
            question="Hvor lagres dataene mine?"
            answer="All data lagres sikkert hos en EU-basert skyleverandør. Vi følger GDPR fullt ut, og du har alltid full kontroll over dine data med mulighet for eksport og sletting."
          />
          <FaqItem 
            question="Hvor lang tid tar det å komme i gang?"
            answer="De fleste er i gang på under en time. Last opp dokumenter, tilpass stilen, og du er klar. Trenger du hjelp, setter vårt team deg i gang gratis."
          />
          <FaqItem 
            question="Støtter IntelliClone norsk?"
            answer="Ja! IntelliClone er bygget med norsk som førsteprioritet. Den forstår nyanser, dialektuttrykk, og norsk forretningsspråk bedre enn generiske internasjonale løsninger."
          />
          <FaqItem 
            question="Hva skjer når AI-en ikke kan svare?"
            answer="IntelliClone vet når den trenger hjelp. Den kan sømløst overføre samtalen til et menneske, med full kontekst — så kunden aldri trenger å gjenta seg."
          />
          <FaqItem 
            question="Kan jeg integrere med eksisterende systemer?"
            answer="Ja. Vi har ferdige integrasjoner mot vanlige CRM, helpdesk og e-handelsplattformer. Trenger du noe spesielt, har vi et fleksibelt API."
          />
          <FaqItem 
            question="Hva koster det egentlig?"
            answer="Vi har en gratis plan for å komme i gang. Betalte planer starter fra noen hundrelapper i måneden, basert på volum. Ingen oppstartskostnader eller bindingstid."
          />
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto">
        <div className="text-center py-16 px-8 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Klar for en AI som faktisk husker?
          </h2>
          <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
            Start gratis i dag. Ingen kredittkort. Ingen binding. 
            Se selv hvordan IntelliClone kan transformere kundeservicen din.
          </p>
          <MainCallToActionButton />
          <p className="text-sm text-muted-foreground mt-6">
            Bruker du allerede en annen løsning? Vi hjelper deg med migrering.
          </p>
        </div>
      </div>

      {/* Footer trust strip */}
      <div className="container mx-auto">
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground border-t pt-8">
          <span className="flex items-center gap-2">
            <span>🇳🇴</span> Laget i Norge
          </span>
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" /> GDPR-kompatibel
          </span>
          <span className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Data i EU
          </span>
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4" /> 24/7 tilgjengelig
          </span>
          <span className="flex items-center gap-2">
            <HeartHandshake className="h-4 w-4" /> Norsk support
          </span>
        </div>
      </div>
    </div>
  );
}

export default withI18n(Home);

function MainCallToActionButton() {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <CtaButton size="lg" className="px-8">
        <Link href="/auth/sign-up">
          <span className="flex items-center gap-2">
            <span>Prøv gratis i 14 dager</span>
            <ArrowRightIcon className="h-4 w-4 animate-in fade-in slide-in-from-left-2 duration-500" />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant="outline" size="lg">
        <Link href="/contact">
          <span className="flex items-center gap-2">
            <span>Snakk med oss</span>
          </span>
        </Link>
      </CtaButton>
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
      <div className="px-4 pb-4 text-muted-foreground">
        {answer}
      </div>
    </details>
  );
}
