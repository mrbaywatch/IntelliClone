'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Lang = 'en' | 'no';

const translations = {
  en: {
    nav: {
      features: 'Solutions',
      howItWorks: 'How It Works',
      getStarted: 'Get Started',
    },
    hero: {
      badge: 'AI Employees for Norwegian Businesses',
      title1: 'Your Next Hire',
      title2: 'Is AI',
      subtitle: 'Personal AI assistants that actually work. They remember everything, never take sick days, and cost a fraction of a traditional hire.',
      cta: 'Get Your AI Employee',
      learnMore: 'See How It Works →',
    },
    features: {
      title1: 'AI That Works',
      title2: 'Like an Employee',
      subtitle: 'Not just a chatbot. A dedicated assistant that learns your business inside and out.',
      memory: {
        title: 'Remembers Everything',
        desc: 'Every conversation, every preference, every decision. Your AI builds institutional knowledge that never leaves.',
      },
      personalization: {
        title: 'Learns Your Business',
        desc: 'Understands your processes, your customers, your way of working. Gets better every single day.',
      },
      norway: {
        title: 'Speaks Norwegian',
        desc: 'Native Norwegian language. Understands dialects, culture, and local business context. GDPR compliant.',
      },
    },
    howItWorks: {
      title: 'Tailored to Your Business',
      subtitle: 'Every business is unique. We build AI solutions that fit your specific needs.',
      step1: { label: '01', title: 'We Understand Your Needs', desc: 'What challenges do you face? We map your processes and identify where AI creates the most value.' },
      step2: { label: '02', title: 'Custom Solution', desc: 'We build and train your AI on your data, your processes, your way of working.' },
      step3: { label: '03', title: 'Continuous Improvement', desc: 'Your AI gets smarter over time. We monitor, optimize, and ensure it delivers results.' },
    },
    useCases: {
      title: 'One Platform, Many Roles',
      subtitle: 'Deploy AI employees across your entire organization.',
      roles: [
        { title: 'Customer Support', desc: 'Answer questions 24/7, handle complaints, escalate when needed' },
        { title: 'Sales Assistant', desc: 'Qualify leads, book meetings, follow up on proposals' },
        { title: 'Research Analyst', desc: 'Monitor competitors, summarize reports, find opportunities' },
        { title: 'Admin Assistant', desc: 'Schedule meetings, manage documents, handle routine tasks' },
      ],
    },
    chat: {
      title1: 'Conversations That',
      title2: 'Get Results',
      subtitle: 'Your AI remembers context from every interaction. No more repeating yourself. No more lost information.',
      checks: [
        'Remembers every past conversation',
        'Understands your business context',
        'Takes action, not just answers',
      ],
      msg1: 'Good morning! The Q2 report you asked about is ready. Also, your meeting with Equinor is in 2 hours—want me to prep the talking points?',
      msg2: 'Yes, and pull the latest numbers from the CRM',
      msg3: 'Done. I\'ve attached the talking points and the CRM data shows 23% growth this quarter. Anything else before the meeting?',
    },
    security: {
      badge: 'Enterprise Ready',
      title: 'Your Data Stays Yours',
      subtitle: 'Norwegian infrastructure, GDPR compliant, enterprise-grade security. Your data never leaves Europe.',
      encrypted: 'End-to-end encrypted',
      euData: 'Norwegian data centers',
      soc2: 'Enterprise security',
    },
    cta: {
      title1: 'Ready to Hire',
      title2: 'Your First AI Employee?',
      subtitle: 'Let\'s discuss how AI can transform your business. Book a free consultation.',
      button: 'Book Consultation',
      demo: 'Contact Us',
      footnote: 'Free consultation. No obligations.',
    },
    footer: {
      tagline: 'AI employees for\nNorwegian businesses.',
      product: 'Product',
      features: 'Solutions',
      integrations: 'Integrations',
      company: 'Company',
      about: 'About',
      careers: 'Careers',
      contact: 'Contact',
      legal: 'Legal',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      cookie: 'Cookie Policy',
      copyright: '© 2025 IntelliClone. Made in Norway.',
      availableIn: 'Language:',
    },
  },
  no: {
    nav: {
      features: 'Løsninger',
      howItWorks: 'Slik fungerer det',
      getStarted: 'Kom i gang',
    },
    hero: {
      badge: 'AI-ansatte for norske bedrifter',
      title1: 'Din neste ansettelse',
      title2: 'er AI',
      subtitle: 'Personlige AI-assistenter som faktisk jobber. De husker alt, er aldri syke, og koster en brøkdel av en vanlig ansatt.',
      cta: 'Få din AI-ansatt',
      learnMore: 'Se hvordan det fungerer →',
    },
    features: {
      title1: 'AI som jobber',
      title2: 'som en ansatt',
      subtitle: 'Ikke bare en chatbot. En dedikert assistent som lærer bedriften din ut og inn.',
      memory: {
        title: 'Husker alt',
        desc: 'Hver samtale, hver preferanse, hver beslutning. Din AI bygger institusjonell kunnskap som aldri forsvinner.',
      },
      personalization: {
        title: 'Lærer din bedrift',
        desc: 'Forstår prosessene dine, kundene dine, måten du jobber på. Blir bedre hver eneste dag.',
      },
      norway: {
        title: 'Snakker norsk',
        desc: 'Innfødt norsk språk. Forstår dialekter, kultur og lokal forretningskontekst. GDPR-kompatibel.',
      },
    },
    howItWorks: {
      title: 'Skreddersydd for din bedrift',
      subtitle: 'Hver bedrift er unik. Vi bygger AI-løsninger som passer dine spesifikke behov.',
      step1: { label: '01', title: 'Vi forstår dine behov', desc: 'Hvilke utfordringer har du? Vi kartlegger prosessene dine og finner hvor AI skaper mest verdi.' },
      step2: { label: '02', title: 'Tilpasset løsning', desc: 'Vi bygger og trener din AI på dine data, dine prosesser, din måte å jobbe på.' },
      step3: { label: '03', title: 'Kontinuerlig forbedring', desc: 'Din AI blir smartere over tid. Vi overvåker, optimaliserer og sikrer at den leverer resultater.' },
    },
    useCases: {
      title: 'Én plattform, mange roller',
      subtitle: 'Deploy AI-ansatte på tvers av hele organisasjonen.',
      roles: [
        { title: 'Kundeservice', desc: 'Svar på spørsmål 24/7, håndter klager, eskaler ved behov' },
        { title: 'Salgsassistent', desc: 'Kvalifiser leads, book møter, følg opp tilbud' },
        { title: 'Research-analytiker', desc: 'Overvåk konkurrenter, oppsummer rapporter, finn muligheter' },
        { title: 'Admin-assistent', desc: 'Planlegg møter, håndter dokumenter, utfør rutineoppgaver' },
      ],
    },
    chat: {
      title1: 'Samtaler som',
      title2: 'gir resultater',
      subtitle: 'Din AI husker kontekst fra hver interaksjon. Aldri mer gjentakelser. Aldri mer tapt informasjon.',
      checks: [
        'Husker alle tidligere samtaler',
        'Forstår forretningskonteksten din',
        'Tar action, ikke bare svarer',
      ],
      msg1: 'God morgen! Q2-rapporten du spurte om er klar. Møtet med Equinor er om 2 timer—skal jeg forberede samtalepunktene?',
      msg2: 'Ja, og hent de siste tallene fra CRM-et',
      msg3: 'Gjort. Jeg har lagt ved samtalepunktene og CRM-dataen viser 23% vekst dette kvartalet. Noe annet før møtet?',
    },
    security: {
      badge: 'Enterprise Ready',
      title: 'Dine data forblir dine',
      subtitle: 'Norsk infrastruktur, GDPR-kompatibel, enterprise-sikkerhet. Dataene dine forlater aldri Europa.',
      encrypted: 'Ende-til-ende-kryptert',
      euData: 'Norske datasentre',
      soc2: 'Enterprise-sikkerhet',
    },
    cta: {
      title1: 'Klar til å ansette',
      title2: 'din første AI-medarbeider?',
      subtitle: 'La oss diskutere hvordan AI kan transformere din bedrift. Book en gratis samtale.',
      button: 'Book samtale',
      demo: 'Kontakt oss',
      footnote: 'Gratis samtale. Ingen forpliktelser.',
    },
    footer: {
      tagline: 'AI-ansatte for\nnorske bedrifter.',
      product: 'Produkt',
      features: 'Løsninger',
      integrations: 'Integrasjoner',
      company: 'Selskap',
      about: 'Om oss',
      careers: 'Karriere',
      contact: 'Kontakt',
      legal: 'Juridisk',
      privacy: 'Personvern',
      terms: 'Vilkår',
      cookie: 'Informasjonskapsler',
      copyright: '© 2025 IntelliClone. Laget i Norge.',
      availableIn: 'Språk:',
    },
  },
};

const StarIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

export default function LandingPage() {
  const [lang, setLang] = useState<Lang>('no');
  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem('preferred-lang') as Lang | null;
    if (saved && (saved === 'en' || saved === 'no')) {
      setLang(saved);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('preferred-lang', lang);
  }, [lang]);

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
        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-full text-sm text-gray-600 mb-8">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              {t.hero.badge}
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
              {t.hero.title1}<br />
              <span className="text-gradient">{t.hero.title2}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-500 max-w-3xl mx-auto mb-10 leading-relaxed">
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
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
              {t.features.title1} <span className="text-gradient">{t.features.title2}</span>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              {t.features.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="fade-in bg-white rounded-3xl p-10 soft-shadow hover-lift">
              <div className="w-16 h-16 mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3"/>
                  <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t.features.memory.title}</h3>
              <p className="text-gray-500 leading-relaxed">{t.features.memory.desc}</p>
            </div>

            <div className="fade-in bg-white rounded-3xl p-10 soft-shadow hover-lift" style={{ transitionDelay: '0.1s' }}>
              <div className="w-16 h-16 mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t.features.personalization.title}</h3>
              <p className="text-gray-500 leading-relaxed">{t.features.personalization.desc}</p>
            </div>

            <div className="fade-in bg-white rounded-3xl p-10 soft-shadow hover-lift" style={{ transitionDelay: '0.2s' }}>
              <div className="w-16 h-16 mb-8 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z"/>
                </svg>
              </div>
              <h3 className="text-2xl font-semibold mb-4">{t.features.norway.title}</h3>
              <p className="text-gray-500 leading-relaxed">{t.features.norway.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{t.useCases.title}</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t.useCases.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {t.useCases.roles.map((role, i) => (
              <div key={i} className="fade-in p-6 rounded-2xl border border-gray-100 hover:border-gold/30 hover:shadow-lg transition-all" style={{ transitionDelay: `${i * 0.1}s` }}>
                <h3 className="font-semibold text-lg mb-2">{role.title}</h3>
                <p className="text-gray-500 text-sm">{role.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-32 px-6 bg-gray-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 fade-in">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{t.howItWorks.title}</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">{t.howItWorks.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[t.howItWorks.step1, t.howItWorks.step2, t.howItWorks.step3].map((step, i) => (
              <div key={i} className="fade-in text-center" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="text-6xl font-bold text-gold/20 mb-4">{step.label}</div>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-gray-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chat Preview Section */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="fade-in">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
                {t.chat.title1}<br />
                <span className="text-gradient">{t.chat.title2}</span>
              </h2>
              <p className="text-xl text-gray-500 mb-8 leading-relaxed">{t.chat.subtitle}</p>
              <ul className="space-y-4">
                {t.chat.checks.map((check, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-600">
                    <svg className="w-6 h-6 text-gold flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path d="M5 13l4 4L19 7"/>
                    </svg>
                    {check}
                  </li>
                ))}
              </ul>
            </div>

            <div className="fade-in float">
              <div className="bg-white rounded-3xl soft-shadow p-8 max-w-md mx-auto">
                <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-white font-semibold">AI</div>
                  <div>
                    <div className="font-semibold">AI Assistant</div>
                    <div className="text-xs text-green-500">{lang === 'en' ? 'Online' : 'Tilgjengelig'}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">AI</div>
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
                    <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">AI</div>
                    <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3 max-w-xs">
                      <p className="text-sm text-gray-700">{t.chat.msg3}</p>
                    </div>
                  </div>
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
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">{t.security.title}</h2>
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

      {/* CTA Section */}
      <section className="py-32 px-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center fade-in">
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
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
