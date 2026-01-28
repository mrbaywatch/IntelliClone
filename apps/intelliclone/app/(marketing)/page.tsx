'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

type Lang = 'en' | 'no';

const translations = {
  en: {
    nav: {
      features: 'Features',
      howItWorks: 'How It Works',
      getStarted: 'Get Started',
    },
    hero: {
      badge: 'Now available in Norway',
      title1: 'AI That Actually',
      title2: 'Remembers You',
      subtitle: 'Your personal AI assistant that learns your preferences, remembers your conversations, and grows smarter with every interaction. Built for Norway.',
      cta: 'Schedule a Demo',
      learnMore: 'Learn More →',
    },
    features: {
      title1: 'Intelligence That',
      title2: 'Evolves',
      subtitle: 'Unlike typical AI, IntelliClone builds a deep understanding of you over time.',
      memory: {
        title: 'Persistent Memory',
        desc: 'Every conversation builds on the last. Your AI remembers your preferences, past discussions, and important details—forever.',
      },
      personalization: {
        title: 'Deep Personalization',
        desc: 'Adapts to your communication style, understands your context, and provides responses tailored specifically to you.',
      },
      norway: {
        title: 'Built for Norway',
        desc: 'Native Norwegian language support, GDPR-compliant data handling, and infrastructure designed for the Norwegian market.',
      },
    },
    howItWorks: {
      title: 'Simple to Start',
      subtitle: 'Get your personal AI assistant up and running in minutes.',
      step1: { label: 'Step 1', title: 'Connect', desc: 'Link your favorite apps and services. Calendar, email, notes—IntelliClone integrates seamlessly.' },
      step2: { label: 'Step 2', title: 'Learn', desc: 'Just start chatting. Your AI learns your preferences, style, and needs with every conversation.' },
      step3: { label: 'Step 3', title: 'Remember', desc: 'Your AI remembers everything important. Context from weeks ago becomes instant recall today.' },
    },
    chat: {
      title1: 'Conversations That',
      title2: 'Feel Natural',
      subtitle: 'No more repeating yourself. IntelliClone picks up right where you left off, understanding context and nuance like a trusted colleague.',
      checks: [
        'References past conversations naturally',
        'Understands your preferences and style',
        'Proactively helpful without being pushy',
      ],
      msg1: "Good morning! I noticed your meeting with the Oslo team is in an hour. Want me to pull up the notes from last week's call?",
      msg2: 'Yes please, and remind me what we decided about the Q2 budget',
      msg3: "Of course! On January 15th you agreed to allocate 15% more for the expansion project. I've attached the summary.",
    },
    security: {
      badge: 'GDPR Compliant',
      title: 'Your Data, Your Control',
      subtitle: 'Built in Norway, for Norway. We take data privacy seriously with end-to-end encryption, local data processing, and full GDPR compliance.',
      encrypted: 'End-to-end encrypted',
      euData: 'EU data residency',
      soc2: 'SOC 2 certified',
    },
    testimonials: {
      title: 'Loved by Early Adopters',
      t1: { quote: "Finally an AI that doesn't make me repeat myself every session. It's like having a colleague who actually pays attention.", name: 'Erik S.', role: 'Product Manager, Oslo' },
      t2: { quote: 'The Norwegian language support is exceptional. It understands dialects and cultural context perfectly. Veldig imponert!', name: 'Maria L.', role: 'Startup Founder, Bergen' },
      t3: { quote: 'I love that my data stays in Europe. As a privacy-conscious user, this was the deciding factor for me.', name: 'Thomas K.', role: 'Software Engineer, Trondheim' },
    },
    cta: {
      title1: 'Ready to Experience',
      title2: 'AI That Remembers?',
      subtitle: "Join thousands of Norwegians who've upgraded to a smarter, more personal AI assistant.",
      button: 'Get Started',
      demo: 'Schedule a Demo',
      footnote: 'Get a personalized walkthrough of IntelliClone',
    },
    footer: {
      tagline: 'AI that remembers you.\nBuilt for Norway.',
      product: 'Product',
      features: 'Features',
      integrations: 'Integrations',
      company: 'Company',
      about: 'About',
      careers: 'Careers',
      contact: 'Contact',
      legal: 'Legal',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      cookie: 'Cookie Policy',
      copyright: '© 2025 IntelliClone. Made with ❤️ in Norway.',
      availableIn: 'Available in:',
    },
  },
  no: {
    nav: {
      features: 'Funksjoner',
      howItWorks: 'Hvordan det fungerer',
      getStarted: 'Kom i gang',
    },
    hero: {
      badge: 'Nå tilgjengelig i Norge',
      title1: 'AI som faktisk',
      title2: 'husker deg',
      subtitle: 'Din personlige AI-assistent som lærer dine preferanser, husker samtalene dine og blir smartere for hver interaksjon. Bygget for Norge.',
      cta: 'Book en demo',
      learnMore: 'Les mer →',
    },
    features: {
      title1: 'Intelligens som',
      title2: 'utvikler seg',
      subtitle: 'I motsetning til vanlig AI, bygger IntelliClone en dyp forståelse av deg over tid.',
      memory: {
        title: 'Varig hukommelse',
        desc: 'Hver samtale bygger på den forrige. Din AI husker dine preferanser, tidligere diskusjoner og viktige detaljer—for alltid.',
      },
      personalization: {
        title: 'Dyp personalisering',
        desc: 'Tilpasser seg din kommunikasjonsstil, forstår din kontekst og gir svar skreddersydd spesifikt for deg.',
      },
      norway: {
        title: 'Bygget for Norge',
        desc: 'Innebygd norsk språkstøtte, GDPR-kompatibel datahåndtering og infrastruktur designet for det norske markedet.',
      },
    },
    howItWorks: {
      title: 'Enkelt å starte',
      subtitle: 'Få din personlige AI-assistent i gang på få minutter.',
      step1: { label: 'Steg 1', title: 'Koble til', desc: 'Koble til dine favorittapper og tjenester. Kalender, e-post, notater—IntelliClone integreres sømløst.' },
      step2: { label: 'Steg 2', title: 'Lær', desc: 'Bare start å chatte. Din AI lærer dine preferanser, stil og behov med hver samtale.' },
      step3: { label: 'Steg 3', title: 'Husk', desc: 'Din AI husker alt som er viktig. Kontekst fra uker siden blir umiddelbar gjenkalling i dag.' },
    },
    chat: {
      title1: 'Samtaler som',
      title2: 'føles naturlige',
      subtitle: 'Ikke mer gjentagelse. IntelliClone fortsetter akkurat der du slapp, og forstår kontekst og nyanser som en pålitelig kollega.',
      checks: [
        'Refererer naturlig til tidligere samtaler',
        'Forstår dine preferanser og stil',
        'Proaktivt hjelpsom uten å være påtrengende',
      ],
      msg1: 'God morgen! Jeg la merke til at møtet ditt med Oslo-teamet er om en time. Vil du at jeg henter notatene fra forrige ukes samtale?',
      msg2: 'Ja takk, og minn meg på hva vi bestemte om Q2-budsjettet',
      msg3: 'Selvfølgelig! Den 15. januar ble dere enige om å allokere 15% mer til utvidelsesprosjektet. Jeg har lagt ved sammendraget.',
    },
    security: {
      badge: 'GDPR-kompatibel',
      title: 'Dine data, din kontroll',
      subtitle: 'Bygget i Norge, for Norge. Vi tar personvern på alvor med ende-til-ende-kryptering, lokal databehandling og full GDPR-samsvar.',
      encrypted: 'Ende-til-ende-kryptert',
      euData: 'EU-datalagring',
      soc2: 'SOC 2-sertifisert',
    },
    testimonials: {
      title: 'Elsket av tidlige brukere',
      t1: { quote: 'Endelig en AI som ikke får meg til å gjenta meg selv hver gang. Det er som å ha en kollega som faktisk følger med.', name: 'Erik S.', role: 'Product Manager, Oslo' },
      t2: { quote: 'Norsk språkstøtte er eksepsjonell. Den forstår dialekter og kulturell kontekst perfekt. Veldig imponert!', name: 'Maria L.', role: 'Startup Founder, Bergen' },
      t3: { quote: 'Jeg elsker at dataene mine forblir i Europa. Som en personvernbevisst bruker var dette avgjørende for meg.', name: 'Thomas K.', role: 'Software Engineer, Trondheim' },
    },
    cta: {
      title1: 'Klar til å oppleve',
      title2: 'AI som husker?',
      subtitle: 'Bli med tusenvis av nordmenn som har oppgradert til en smartere, mer personlig AI-assistent.',
      button: 'Kom i gang',
      demo: 'Book en demo',
      footnote: 'Få en personlig gjennomgang av IntelliClone',
    },
    footer: {
      tagline: 'AI som husker deg.\nBygget for Norge.',
      product: 'Produkt',
      features: 'Funksjoner',
      integrations: 'Integrasjoner',
      company: 'Selskap',
      about: 'Om oss',
      careers: 'Karriere',
      contact: 'Kontakt',
      legal: 'Juridisk',
      privacy: 'Personvern',
      terms: 'Vilkår',
      cookie: 'Informasjonskapsler',
      copyright: '© 2025 IntelliClone. Laget med ❤️ i Norge.',
      availableIn: 'Tilgjengelig på:',
    },
  },
};

// Star Icon SVG for testimonials
const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang];

  useEffect(() => {
    // Load saved language preference
    const saved = localStorage.getItem('preferred-lang') as Lang | null;
    if (saved && (saved === 'en' || saved === 'no')) {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('preferred-lang', lang);
  }, [lang]);

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="bg-white text-gray-900 antialiased">
      <style jsx global>{`
        html { scroll-behavior: smooth; }
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.8s ease-out, transform 0.8s ease-out;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }
        .float { animation: float 6s ease-in-out infinite; }
        .float-delayed { animation: float 6s ease-in-out infinite; animation-delay: -3s; }
        @keyframes subtle-pulse {
          0%, 100% { box-shadow: 0 4px 20px rgba(212, 168, 75, 0.2); }
          50% { box-shadow: 0 4px 30px rgba(212, 168, 75, 0.35); }
        }
        .cta-pulse:hover { animation: subtle-pulse 2s ease-in-out infinite; }
        .text-gradient {
          background: linear-gradient(135deg, #D4A84B 0%, #B8923F 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .soft-shadow { box-shadow: 0 4px 40px rgba(0, 0, 0, 0.06); }
        .hover-lift { transition: transform 0.4s ease, box-shadow 0.4s ease; }
        .hover-lift:hover {
          transform: translateY(-6px);
          box-shadow: 0 12px 50px rgba(0, 0, 0, 0.1);
        }
        .text-gold { color: #D4A84B; }
        .bg-gold { background-color: #D4A84B; }
        .bg-gold-dark { background-color: #B8923F; }
        .hover\\:bg-gold-dark:hover { background-color: #B8923F; }
        .hover\\:bg-gold-light:hover { background-color: #E8C97A; }
        .hover\\:text-gold:hover { color: #D4A84B; }
        .ring-gold\\/30 { --tw-ring-color: rgba(212, 168, 75, 0.3); }
        .from-gold { --tw-gradient-from: #D4A84B; }
        .to-gold-dark { --tw-gradient-to: #B8923F; }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="#" className="text-2xl font-semibold tracking-tight">
            Intelli<span className="text-gold">Clone</span>
          </a>
          <div className="hidden md:flex items-center gap-8 text-sm text-gray-600">
            <a href="#features" className="hover:text-gold transition-colors">{t.nav.features}</a>
            <a href="#how-it-works" className="hover:text-gold transition-colors">{t.nav.howItWorks}</a>
            <div className="flex items-center gap-2 text-gray-400">
              <button
                onClick={() => setLang('en')}
                className={`transition-colors ${lang === 'en' ? 'text-gold font-semibold' : 'hover:text-gold'}`}
              >
                EN
              </button>
              <span>/</span>
              <button
                onClick={() => setLang('no')}
                className={`transition-colors ${lang === 'no' ? 'text-gold font-semibold' : 'hover:text-gold'}`}
              >
                NO
              </button>
            </div>
          </div>
          <Link
            href="/auth/sign-up"
            className="hidden md:inline-flex px-5 py-2.5 bg-gold text-white rounded-full text-sm font-medium hover:bg-gold-dark transition-colors cta-pulse"
          >
            {t.nav.getStarted}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center pt-20 pb-16 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/50 to-amber-50/30"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16 fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {t.hero.badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-tight mb-6">
              {t.hero.title1}<br />
              <span className="text-gradient">{t.hero.title2}</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/auth/sign-up"
                className="px-8 py-4 bg-gold text-white rounded-full text-lg font-medium hover:bg-gold-dark transition-all cta-pulse"
              >
                {t.hero.cta}
              </Link>
              <a href="#how-it-works" className="px-8 py-4 text-gray-600 rounded-full text-lg font-medium hover:text-gold transition-colors">
                {t.hero.learnMore}
              </a>
            </div>
          </div>

          {/* Hero Device Mockup */}
          <div className="relative flex justify-center items-center mt-8">
            <div className="float">
              <svg className="w-full max-w-3xl soft-shadow rounded-2xl" viewBox="0 0 800 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="50" y="30" width="700" height="420" rx="20" fill="#f5f5f7"/>
                <rect x="70" y="50" width="660" height="370" rx="4" fill="#1a1a1a"/>
                <rect x="80" y="60" width="640" height="350" fill="white"/>
                <rect x="100" y="80" width="200" height="310" fill="#f9fafb" rx="8"/>
                <rect x="110" y="100" width="180" height="40" fill="#e5e7eb" rx="20"/>
                <rect x="110" y="150" width="150" height="30" fill="#e5e7eb" rx="15"/>
                <rect x="110" y="190" width="170" height="30" fill="#e5e7eb" rx="15"/>
                <rect x="110" y="230" width="140" height="30" fill="#e5e7eb" rx="15"/>
                <rect x="320" y="80" width="380" height="310" fill="#ffffff"/>
                <rect x="480" y="100" width="200" height="50" rx="20" fill="#D4A84B"/>
                <text x="520" y="130" fill="white" fontSize="12" fontFamily="system-ui">What&apos;s on my calendar?</text>
                <rect x="340" y="170" width="280" height="80" rx="20" fill="#f3f4f6"/>
                <text x="360" y="200" fill="#374151" fontSize="12" fontFamily="system-ui">You have 3 meetings today:</text>
                <text x="360" y="220" fill="#6b7280" fontSize="11" fontFamily="system-ui">• 10:00 Team standup</text>
                <text x="360" y="238" fill="#6b7280" fontSize="11" fontFamily="system-ui">• 14:00 Client call with Oslo team</text>
                <rect x="340" y="340" width="340" height="40" rx="20" fill="#f9fafb" stroke="#e5e7eb"/>
                <rect x="50" y="450" width="700" height="20" fill="#e5e7eb"/>
                <ellipse cx="400" cy="460" rx="50" ry="8" fill="#d1d5db"/>
              </svg>
            </div>
            <div className="absolute -right-4 md:right-12 top-[55%] -translate-y-1/2 float-delayed hidden md:block">
              <svg className="w-48 soft-shadow rounded-3xl" viewBox="0 0 180 360" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="180" height="360" rx="30" fill="#1a1a1a"/>
                <rect x="8" y="8" width="164" height="344" rx="24" fill="white"/>
                <rect x="55" y="12" width="70" height="25" rx="12" fill="#1a1a1a"/>
                <rect x="20" y="60" width="100" height="35" rx="17" fill="#f3f4f6"/>
                <rect x="60" y="105" width="100" height="35" rx="17" fill="#D4A84B"/>
                <rect x="20" y="150" width="120" height="50" rx="20" fill="#f3f4f6"/>
                <rect x="40" y="210" width="120" height="35" rx="17" fill="#D4A84B"/>
                <rect x="20" y="255" width="100" height="35" rx="17" fill="#f3f4f6"/>
                <rect x="15" y="310" width="150" height="35" rx="17" fill="#f9fafb" stroke="#e5e7eb"/>
                <rect x="65" y="340" width="50" height="5" rx="2" fill="#d1d5db"/>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 fade-in">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
              {t.features.title1} <span className="text-gradient">{t.features.title2}</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1: Memory */}
            <div className="fade-in bg-white rounded-3xl p-10 soft-shadow hover-lift">
              <div className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3"/>
                  <circle cx="5" cy="8" r="2"/>
                  <circle cx="19" cy="8" r="2"/>
                  <circle cx="5" cy="16" r="2"/>
                  <circle cx="19" cy="16" r="2"/>
                  <path d="M7 8h2M15 8h2M7 16h2M15 16h2M12 9V6M12 18v-3"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t.features.memory.title}</h3>
              <p className="text-gray-500 leading-relaxed">{t.features.memory.desc}</p>
            </div>

            {/* Feature 2: Personalization */}
            <div className="fade-in bg-white rounded-3xl p-10 soft-shadow hover-lift" style={{ transitionDelay: '0.1s' }}>
              <div className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 3c-4 0-7 3-7 7 0 5 7 11 7 11s7-6 7-11c0-4-3-7-7-7z"/>
                  <circle cx="12" cy="10" r="2"/>
                  <path d="M8 21h8"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t.features.personalization.title}</h3>
              <p className="text-gray-500 leading-relaxed">{t.features.personalization.desc}</p>
            </div>

            {/* Feature 3: Norway */}
            <div className="fade-in bg-white rounded-3xl p-10 soft-shadow hover-lift" style={{ transitionDelay: '0.2s' }}>
              <div className="w-20 h-20 mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                <svg className="w-10 h-10 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="6" width="18" height="12" rx="2"/>
                  <path d="M8 6v12M3 12h18" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t.features.norway.title}</h3>
              <p className="text-gray-500 leading-relaxed">{t.features.norway.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 fade-in">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">{t.howItWorks.title}</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t.howItWorks.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-gray-200 via-[#D4A84B]/30 to-gray-200"></div>

            {/* Step 1 */}
            <div className="fade-in text-center">
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-white soft-shadow flex items-center justify-center relative z-10">
                <svg className="w-10 h-10 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 5v14M5 12h14"/>
                  <circle cx="12" cy="12" r="9"/>
                </svg>
              </div>
              <div className="text-sm text-gold font-medium mb-2">{t.howItWorks.step1.label}</div>
              <h3 className="text-2xl font-semibold mb-4">{t.howItWorks.step1.title}</h3>
              <p className="text-gray-500">{t.howItWorks.step1.desc}</p>
            </div>

            {/* Step 2 */}
            <div className="fade-in text-center" style={{ transitionDelay: '0.1s' }}>
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-white soft-shadow flex items-center justify-center relative z-10">
                <svg className="w-10 h-10 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 19l4-4m0 0l4 4m-4-4V5"/>
                  <path d="M20 5l-4 4m0 0l-4-4m4 4v10"/>
                </svg>
              </div>
              <div className="text-sm text-gold font-medium mb-2">{t.howItWorks.step2.label}</div>
              <h3 className="text-2xl font-semibold mb-4">{t.howItWorks.step2.title}</h3>
              <p className="text-gray-500">{t.howItWorks.step2.desc}</p>
            </div>

            {/* Step 3 */}
            <div className="fade-in text-center" style={{ transitionDelay: '0.2s' }}>
              <div className="w-20 h-20 mx-auto mb-8 rounded-full bg-white soft-shadow flex items-center justify-center relative z-10">
                <svg className="w-10 h-10 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M5 12l5 5L20 7"/>
                  <circle cx="12" cy="12" r="9" strokeDasharray="4 2"/>
                </svg>
              </div>
              <div className="text-sm text-gold font-medium mb-2">{t.howItWorks.step3.label}</div>
              <h3 className="text-2xl font-semibold mb-4">{t.howItWorks.step3.title}</h3>
              <p className="text-gray-500">{t.howItWorks.step3.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Chat Preview Section */}
      <section className="py-32 px-6 bg-gradient-to-b from-gray-50/50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="fade-in">
              <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
                {t.chat.title1}<br />
                <span className="text-gradient">{t.chat.title2}</span>
              </h2>
              <p className="text-xl text-gray-500 mb-8 leading-relaxed">{t.chat.subtitle}</p>
              <ul className="space-y-4">
                {t.chat.checks.map((check, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <svg className="w-6 h-6 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                    {check}
                  </li>
                ))}
              </ul>
            </div>

            {/* Chat Preview Mockup */}
            <div className="fade-in float">
              <div className="bg-white rounded-3xl soft-shadow p-8 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                  <img src="/images/erik-avatar.png" alt="Erik" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <div className="font-semibold text-gold">Erik</div>
                    <div className="text-xs text-green-500">{lang === 'en' ? 'Online' : 'Pålogget'}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <img src="/images/erik-avatar.png" alt="Erik" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-700">{t.chat.msg1}</p>
                    </div>
                  </div>
                  <div className="flex gap-3 justify-end">
                    <div className="bg-gold text-white rounded-2xl rounded-tr-md px-4 py-3 max-w-xs">
                      <p className="text-sm">{t.chat.msg2}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <img src="/images/erik-avatar.png" alt="Erik" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                    <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-700">{t.chat.msg3}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex items-center gap-3">
                  <input
                    type="text"
                    placeholder={lang === 'en' ? 'Type a message...' : 'Skriv en melding...'}
                    className="flex-1 bg-gray-50 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A84B]/30"
                  />
                  <button className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-white">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-full text-sm mb-8">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            {t.security.badge}
          </div>
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">{t.security.title}</h2>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed">{t.security.subtitle}</p>
          <div className="flex flex-wrap justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
              {t.security.encrypted}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {t.security.euData}
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              {t.security.soc2}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-32 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">{t.testimonials.title}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[t.testimonials.t1, t.testimonials.t2, t.testimonials.t3].map((testimonial, i) => (
              <div key={i} className="fade-in bg-white rounded-3xl p-8 soft-shadow" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="flex gap-1 mb-4 text-gold">
                  {[...Array(5)].map((_, j) => <StarIcon key={j} />)}
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">&quot;{testimonial.quote}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200"></div>
                  <div>
                    <div className="font-medium text-sm">{testimonial.name}</div>
                    <div className="text-gray-400 text-xs">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="cta" className="py-32 px-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center fade-in">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight mb-6">
            {t.cta.title1}<br />
            <span className="text-gold">{t.cta.title2}</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">{t.cta.subtitle}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/auth/sign-up"
              className="px-8 py-4 bg-gold text-white rounded-full text-lg font-medium hover:bg-gold-light transition-all cta-pulse"
            >
              {t.cta.button}
            </Link>
            <a href="#" className="px-8 py-4 text-gray-400 hover:text-white transition-colors">
              {t.cta.demo}
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-8">{t.cta.footnote}</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 bg-gray-50 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <a href="#" className="text-2xl font-semibold tracking-tight mb-4 inline-block">
                Intelli<span className="text-gold">Clone</span>
              </a>
              <p className="text-gray-500 text-sm whitespace-pre-line">{t.footer.tagline}</p>
            </div>
            <div>
              <h4 className="font-medium mb-4">{t.footer.product}</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#features" className="hover:text-gold transition-colors">{t.footer.features}</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">{t.footer.integrations}</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">API</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">{t.footer.company}</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gold transition-colors">{t.footer.about}</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">{t.footer.careers}</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">{t.footer.contact}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">{t.footer.legal}</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-gold transition-colors">{t.footer.privacy}</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">{t.footer.terms}</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">GDPR</a></li>
                <li><a href="#" className="hover:text-gold transition-colors">{t.footer.cookie}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">{t.footer.copyright}</p>
            <div className="flex items-center gap-4 text-gray-400">
              <span className="text-sm">{t.footer.availableIn}</span>
              <button
                onClick={() => setLang('en')}
                className={`hover:text-gold cursor-pointer transition-colors ${lang === 'en' ? 'text-gold font-medium' : ''}`}
              >
                English
              </button>
              <button
                onClick={() => setLang('no')}
                className={`hover:text-gold cursor-pointer transition-colors ${lang === 'no' ? 'text-gold font-medium' : ''}`}
              >
                Norsk
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
