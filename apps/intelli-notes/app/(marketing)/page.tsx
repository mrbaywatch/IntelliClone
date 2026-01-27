import Link from 'next/link';

import {
  ArrowRightIcon,
  BrainCircuit,
  CheckCircle2,
  Clock,
  FileText,
  Globe2,
  Languages,
  ListChecks,
  MessageSquareText,
  Mic,
  Search,
  Shield,
  Sparkles,
  Video,
  Zap,
} from 'lucide-react';

import { PricingTable } from '@kit/billing-gateway/marketing';
import {
  CtaButton,
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
              <span>Nå med full støtte for norsk tale og dialekter</span>
              <PillActionButton asChild>
                <Link href={'/auth/sign-up'}>
                  <ArrowRightIcon className={'h-4 w-4'} />
                </Link>
              </PillActionButton>
            </Pill>
          }
          title={
            <span className="text-secondary-foreground">
              <span>Din AI-assistent som </span>
              <GradientSecondaryText>tar møtenotater</GradientSecondaryText>
              <span> for deg</span>
            </span>
          }
          subtitle={
            <span>
              Aldri gå glipp av viktige detaljer igjen. Intelli-Notes
              transkriberer, oppsummerer og finner handlingspunkter fra alle
              møtene dine — på norsk, automatisk.
            </span>
          }
          cta={<MainCallToActionButton />}
          image={
            <div className="dark:border-primary/10 w-full rounded-2xl border border-gray-200 bg-gradient-to-br from-primary/5 via-background to-primary/10 p-8 shadow-2xl">
              <div className="flex flex-col items-center justify-center space-y-6 py-12">
                {/* Audio wave visualization */}
                <div className="flex items-end justify-center gap-1">
                  {[40, 70, 55, 85, 60, 90, 50, 75, 45, 80, 65, 95, 55, 70, 40].map((height, i) => (
                    <div
                      key={i}
                      className="bg-primary/60 w-2 rounded-full transition-all duration-300"
                      style={{
                        height: `${height}px`,
                        animationDelay: `${i * 100}ms`,
                      }}
                    />
                  ))}
                </div>
                {/* Transcription preview */}
                <div className="w-full max-w-md space-y-3 rounded-xl bg-background/80 p-6 shadow-lg backdrop-blur">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                    <span className="text-muted-foreground text-sm">Transkriberer...</span>
                  </div>
                  <div className="space-y-2">
                    <div className="bg-muted h-3 w-full rounded" />
                    <div className="bg-muted h-3 w-4/5 rounded" />
                    <div className="bg-muted h-3 w-3/4 rounded" />
                  </div>
                </div>
              </div>
            </div>
          }
        />
      </div>

      {/* Trust Badges */}
      <div className={'container mx-auto'}>
        <div className="flex flex-col items-center space-y-6">
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
            Brukes av norske bedrifter i alle størrelser
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span className="font-medium">GDPR-samsvar</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe2 className="h-5 w-5" />
              <span className="font-medium">Norsk hosting</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">SOC 2 Type II</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Features Section */}
      <div className={'container mx-auto'}>
        <div className={'py-4 xl:py-8'}>
          <FeatureShowcase
            heading={
              <>
                <b className="font-medium tracking-tight dark:text-white">
                  Endelig en møteassistent som forstår norsk
                </b>
                .{' '}
                <span className="text-secondary-foreground/70 block font-normal tracking-tight">
                  De fleste AI-verktøy sliter med norsk. Vi har bygget
                  Intelli-Notes fra bunnen av med norsk språkforståelse i fokus.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <BrainCircuit className="h-4 w-4" />
                <span>AI-drevet møteintelligens</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Norsk transkripsjon'}
                description={
                  'Bransjens beste gjenkjenning av norsk tale — inkludert dialekter, faguttrykk og bedriftsnavn. Opp til 95% nøyaktighet.'
                }
              >
                <div className="mt-4 flex items-center gap-2">
                  <Languages className="text-primary h-5 w-5" />
                  <span className="text-muted-foreground text-sm">
                    Bokmål + nynorsk + dialekter
                  </span>
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 w-full overflow-hidden'}
                label={'Automatiske sammendrag'}
                description={
                  'Få presise oppsummeringer sekunder etter møtet. Tilpasset dine behov — fra korte høydepunkter til detaljerte referater.'
                }
              >
                <div className="mt-4 flex items-center gap-2">
                  <FileText className="text-primary h-5 w-5" />
                  <span className="text-muted-foreground text-sm">
                    Rett i innboksen
                  </span>
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Handlingspunkter'}
                description={
                  'AI-en identifiserer automatisk oppgaver, ansvarlige og frister. Aldri mer «hvem skulle gjøre hva igjen?»'
                }
              >
                <div className="mt-4 flex items-center gap-2">
                  <ListChecks className="text-primary h-5 w-5" />
                  <span className="text-muted-foreground text-sm">
                    Automatisk tildeling
                  </span>
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Søkbar møtehistorikk'}
                description={
                  '«Hva sa vi om budsjettet i september?» Søk gjennom alle møter og finn akkurat det du leter etter på sekunder.'
                }
              >
                <div className="mt-4 flex items-center gap-2">
                  <Search className="text-primary h-5 w-5" />
                  <span className="text-muted-foreground text-sm">
                    Fulltekstsøk i transkripsjon
                  </span>
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Sømløse integrasjoner'}
                description={
                  'Kobles direkte til Teams, Zoom og Google Meet. Synkroniser notater til Slack, Notion, Asana og CRM-systemet ditt.'
                }
              >
                <div className="mt-4 flex items-center gap-2">
                  <Video className="text-primary h-5 w-5" />
                  <span className="text-muted-foreground text-sm">
                    Teams • Zoom • Meet
                  </span>
                </div>
              </FeatureCard>

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Møteanalyse'}
                description={
                  'Få innsikt i møtemønstre, taletid per deltaker og trender over tid. Optimaliser hvordan teamet ditt jobber.'
                }
              >
                <div className="mt-4 flex items-center gap-2">
                  <Sparkles className="text-primary h-5 w-5" />
                  <span className="text-muted-foreground text-sm">
                    Dashboard med statistikk
                  </span>
                </div>
              </FeatureCard>
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      {/* Why Norwegian Section */}
      <div className={'container mx-auto'}>
        <div className="bg-muted/50 rounded-3xl p-8 md:p-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Hvorfor norsk støtte er så viktig
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Internasjonale løsninger som Fireflies, Otter og Fathom er bygget
              for engelsk. Når du snakker norsk, får du:
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-background p-6 shadow-sm">
              <div className="bg-destructive/10 text-destructive flex h-12 w-12 items-center justify-center rounded-xl">
                <span className="text-2xl">😕</span>
              </div>
              <h3 className="mt-4 font-semibold">Med andre løsninger</h3>
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                <li>• Feilstavet norske navn og steder</li>
                <li>• «Hva?»-øyeblikk i transkripsjonen</li>
                <li>• Sammendrag som gir null mening</li>
                <li>• Faguttrykk blir til gibberish</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-background p-6 shadow-sm">
              <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                <span className="text-2xl">🎯</span>
              </div>
              <h3 className="mt-4 font-semibold">Med Intelli-Notes</h3>
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                <li>• Presis gjenkjenning av norske navn</li>
                <li>• Forstår kontekst og fagspråk</li>
                <li>• Naturlige, lesbare sammendrag</li>
                <li>• Håndterer dialekter og kodeveksling</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-background p-6 shadow-sm">
              <div className="bg-primary/10 text-primary flex h-12 w-12 items-center justify-center rounded-xl">
                <span className="text-2xl">⚡</span>
              </div>
              <h3 className="mt-4 font-semibold">Resultatet</h3>
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                <li>• Spar 4+ timer per uke</li>
                <li>• Færre misforståelser</li>
                <li>• Bedre oppfølging av oppgaver</li>
                <li>• Full oversikt over alle møter</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* How it Works Section */}
      <div className={'container mx-auto'}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Kom i gang på 2 minutter
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Ingen komplisert oppsett. Koble til kalenderen din og la AI-en gjøre
            resten.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3">
          <div className="text-center">
            <div className="bg-primary/10 text-primary mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
              <Video className="h-8 w-8" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">1. Koble til møtene</h3>
            <p className="text-muted-foreground mt-2">
              Synkroniser med Teams, Zoom eller Google Meet via kalenderen din.
              Én gang, ferdig.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 text-primary mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
              <Mic className="h-8 w-8" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">
              2. Ha møtet som vanlig
            </h3>
            <p className="text-muted-foreground mt-2">
              Intelli-Notes blir med automatisk og lytter diskré i bakgrunnen.
              Du fokuserer på samtalen.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary/10 text-primary mx-auto flex h-16 w-16 items-center justify-center rounded-2xl">
              <MessageSquareText className="h-8 w-8" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">3. Få alt levert</h3>
            <p className="text-muted-foreground mt-2">
              Sekunder etter møtet får du transkripsjon, sammendrag og
              handlingspunkter — rett i innboksen.
            </p>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className={'container mx-auto'}>
        <div className={'py-4 xl:py-8'}>
          <FeatureShowcase
            heading={
              <>
                <b className="font-medium tracking-tight dark:text-white">
                  For alle som har møter
                </b>
                .{' '}
                <span className="text-secondary-foreground/70 block font-normal tracking-tight">
                  Uansett om du er i salg, HR, produkt eller ledelse —
                  Intelli-Notes gjør møtene dine mer verdifulle.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <Zap className="h-4 w-4" />
                <span>Bruksområder</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Salgsteam'}
                description={
                  'Fang opp kundens behov, innvendinger og beslutninger. Synkroniser automatisk til CRM. Aldri glem en oppfølging.'
                }
              />

              <FeatureCard
                className={'relative col-span-1 w-full overflow-hidden'}
                label={'HR og rekruttering'}
                description={
                  'Dokumenter intervjuer objektivt. Sammenlign kandidater basert på fakta, ikke hukommelse.'
                }
              />

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Produktutvikling'}
                description={
                  'Samle brukerinnsikt fra kundemøter. Spor feature requests og prioriter basert på data.'
                }
              />

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Ledermøter'}
                description={
                  'Hold styr på beslutninger og ansvarsfordeling. Sikre at ingenting faller mellom stolene.'
                }
              />

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Kundesuksess'}
                description={
                  'Dokumenter kundesamtaler. Identifiser trender og forbedringsmuligheter på tvers av alle kunder.'
                }
              />

              <FeatureCard
                className={'relative col-span-1 overflow-hidden'}
                label={'Alle team-møter'}
                description={
                  'Fra stand-ups til strategimøter. Alle får samme informasjon, selv om de ikke kunne delta.'
                }
              />
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      {/* Stats Section */}
      <div className={'container mx-auto'}>
        <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12">
          <div className="grid gap-8 text-center md:grid-cols-4">
            <div>
              <div className="text-4xl font-bold md:text-5xl">95%</div>
              <p className="mt-2 opacity-80">Nøyaktighet på norsk tale</p>
            </div>
            <div>
              <div className="text-4xl font-bold md:text-5xl">4+ timer</div>
              <p className="mt-2 opacity-80">Spart per bruker per uke</p>
            </div>
            <div>
              <div className="text-4xl font-bold md:text-5xl">&lt;30 sek</div>
              <p className="mt-2 opacity-80">Til sammendrag er klart</p>
            </div>
            <div>
              <div className="text-4xl font-bold md:text-5xl">100%</div>
              <p className="mt-2 opacity-80">GDPR-samsvar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className={'container mx-auto'}>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Norske bedrifter elsker Intelli-Notes
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border bg-background p-6">
            <p className="text-muted-foreground">
              «Endelig en løsning som faktisk forstår når vi snakker norsk i
              møtene. Vi sparer masse tid på notater og oppfølging.»
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-full">
                <span className="text-primary font-semibold">MH</span>
              </div>
              <div>
                <p className="font-medium">Mari Haugen</p>
                <p className="text-muted-foreground text-sm">
                  Salgssjef, TechStart AS
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-background p-6">
            <p className="text-muted-foreground">
              «Vi prøvde Fireflies og Otter først, men transkripsjonen var helt
              ubrukelig på norsk. Intelli-Notes er en game-changer.»
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-full">
                <span className="text-primary font-semibold">EL</span>
              </div>
              <div>
                <p className="font-medium">Erik Larsen</p>
                <p className="text-muted-foreground text-sm">
                  HR-direktør, Industri Norge
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-background p-6">
            <p className="text-muted-foreground">
              «Jeg kan endelig fokusere på samtalen i stedet for å skrive
              notater. Og sammendragene er overraskende gode!»
            </p>
            <div className="mt-6 flex items-center gap-3">
              <div className="bg-primary/20 flex h-10 w-10 items-center justify-center rounded-full">
                <span className="text-primary font-semibold">KS</span>
              </div>
              <div>
                <p className="font-medium">Kari Strand</p>
                <p className="text-muted-foreground text-sm">
                  Product Lead, FinTech Solutions
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Section */}
      <div className={'container mx-auto'}>
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <div className="bg-primary/10 text-primary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium">
              <Shield className="h-4 w-4" />
              <span>Sikkerhet i fokus</span>
            </div>
            <h2 className="mt-6 text-3xl font-bold tracking-tight md:text-4xl">
              Dataene dine er trygge hos oss
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Vi vet at møteinnhold er sensitivt. Derfor har vi bygget
              Intelli-Notes med sikkerhet fra dag én.
            </p>

            <ul className="mt-8 space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">GDPR-samsvar</p>
                  <p className="text-muted-foreground text-sm">
                    Full etterlevelse av europeiske personvernregler
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Norsk/EU datalagring</p>
                  <p className="text-muted-foreground text-sm">
                    Dataene dine forlater aldri Europa
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Ende-til-ende-kryptering</p>
                  <p className="text-muted-foreground text-sm">
                    AES-256-kryptering for all data
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">SOC 2 Type II-sertifisert</p>
                  <p className="text-muted-foreground text-sm">
                    Uavhengig verifisert sikkerhetspraksis
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-primary mt-1 h-5 w-5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Ingen AI-trening på dine data</p>
                  <p className="text-muted-foreground text-sm">
                    Møtene dine brukes aldri til å trene modeller
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-muted/50 flex items-center justify-center rounded-3xl p-8">
            {/* Shield/Lock Security Composition */}
            <div className="relative flex h-64 w-64 items-center justify-center">
              {/* Outer glow ring */}
              <div className="absolute h-full w-full animate-pulse rounded-full bg-gradient-to-br from-primary/20 to-primary/5" />
              {/* Shield background */}
              <div className="bg-primary/10 relative flex h-48 w-40 flex-col items-center justify-center rounded-b-full rounded-t-3xl border-4 border-primary/30 shadow-xl">
                {/* Lock icon */}
                <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <Shield className="text-primary h-10 w-10" />
                </div>
                {/* Check marks */}
                <div className="mt-4 flex gap-2">
                  <CheckCircle2 className="text-primary h-5 w-5" />
                  <CheckCircle2 className="text-primary h-5 w-5" />
                  <CheckCircle2 className="text-primary h-5 w-5" />
                </div>
              </div>
              {/* Decorative dots */}
              <div className="bg-primary/40 absolute right-4 top-8 h-3 w-3 rounded-full" />
              <div className="bg-primary/30 absolute bottom-12 left-4 h-2 w-2 rounded-full" />
              <div className="bg-primary/20 absolute right-8 bottom-4 h-4 w-4 rounded-full" />
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
            pill={
              <Pill label="Start gratis">Ingen kredittkort nødvendig</Pill>
            }
            heading="Enkle og rettferdige priser"
            subheading="Start gratis med 300 minutter per måned. Oppgrader når du trenger mer."
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

      {/* FAQ Section */}
      <div className={'container mx-auto'}>
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
            Ofte stilte spørsmål
          </h2>

          <div className="mt-12 space-y-6">
            <div className="rounded-2xl border bg-background p-6">
              <h3 className="font-semibold">
                Fungerer det virkelig bra med norsk?
              </h3>
              <p className="text-muted-foreground mt-2">
                Ja! Vi har trent modellene våre spesifikt på norsk tale,
                inkludert vanlige dialekter og bransjespesifikke uttrykk. De
                fleste brukere rapporterer 90-95% nøyaktighet.
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-6">
              <h3 className="font-semibold">
                Hva om møtet er på både norsk og engelsk?
              </h3>
              <p className="text-muted-foreground mt-2">
                Intelli-Notes håndterer kodeveksling mellom norsk og engelsk
                sømløst. Perfekt for internasjonale team eller møter med
                engelske faguttrykk.
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-6">
              <h3 className="font-semibold">
                Hvordan fungerer det med Microsoft Teams?
              </h3>
              <p className="text-muted-foreground mt-2">
                Du kobler til kalenderen din, og Intelli-Notes blir automatisk
                med som deltaker i Teams-møtene dine. Det fungerer også med Zoom
                og Google Meet.
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-6">
              <h3 className="font-semibold">Er dataene mine trygge?</h3>
              <p className="text-muted-foreground mt-2">
                Absolutt. Vi er GDPR-samsvarende, lagrer data i EU, og bruker
                ende-til-ende-kryptering. Møtene dine brukes aldri til å trene
                AI-modeller.
              </p>
            </div>

            <div className="rounded-2xl border bg-background p-6">
              <h3 className="font-semibold">Kan jeg prøve gratis?</h3>
              <p className="text-muted-foreground mt-2">
                Ja! Gratisplanen inkluderer 300 minutter transkripsjon per måned
                — nok til å teste grundig før du bestemmer deg.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div className={'container mx-auto'}>
        <div className="bg-primary text-primary-foreground rounded-3xl p-8 text-center md:p-12">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Klar til å slutte med manuelle møtenotater?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg opacity-90">
            Bli med tusenvis av norske bedrifter som allerede sparer timer hver
            uke. Start gratis i dag.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <CtaButton
              variant={'secondary'}
              className="h-12 px-8 text-base font-semibold"
            >
              <Link href={'/auth/sign-up'}>
                <span className={'flex items-center gap-2'}>
                  <span>Kom i gang gratis</span>
                  <ArrowRightIcon className={'h-4 w-4'} />
                </span>
              </Link>
            </CtaButton>
            <CtaButton
              variant={'ghost'}
              className="h-12 px-8 text-base text-white hover:bg-white/10 hover:text-white"
            >
              <Link href={'/contact'}>Book en demo</Link>
            </CtaButton>
          </div>
          <p className="mt-6 text-sm opacity-70">
            <Clock className="mr-1 inline h-4 w-4" />
            Oppsett på under 2 minutter • Ingen kredittkort nødvendig
          </p>
        </div>
      </div>
    </div>
  );
}

export default withI18n(Home);

function MainCallToActionButton() {
  return (
    <div className={'flex flex-col gap-3 sm:flex-row sm:gap-2.5'}>
      <CtaButton className="h-12 px-6 text-base">
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center gap-2'}>
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

      <CtaButton variant={'outline'} className="h-12 px-6 text-base">
        <Link href={'/contact'}>Se en demo</Link>
      </CtaButton>
    </div>
  );
}
