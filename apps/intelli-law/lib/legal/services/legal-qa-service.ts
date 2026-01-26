/**
 * Legal Q&A Service
 * Specialized service for answering Norwegian legal questions
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

import type { LegalAnswer, LegalCategory, LegalQuestion, LegalSource } from '../types';
import {
  CITATION_LOOKUP_PROMPT,
  LEGAL_CATEGORY_DESCRIPTIONS,
  LEGAL_QA_PROMPT,
  NORWEGIAN_LEGAL_SYSTEM_PROMPT,
} from '../prompts/norwegian-legal-prompts';

const LLM_MODEL_NAME = process.env.LLM_MODEL_NAME ?? 'gpt-4o';
const LLM_BASE_URL = process.env.LLM_BASE_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;

// Norwegian law quick reference database
const NORWEGIAN_LAW_REFERENCE: Record<string, { name: string; shortName: string; lovdataUrl: string }> = {
  aml: { name: 'Lov om arbeidsmiljø, arbeidstid og stillingsvern mv.', shortName: 'Arbeidsmiljøloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2005-06-17-62' },
  avt: { name: 'Lov om avslutning av avtaler', shortName: 'Avtaleloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1918-05-31-4' },
  asl: { name: 'Lov om aksjeselskaper', shortName: 'Aksjeloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1997-06-13-44' },
  husll: { name: 'Lov om husleieavtaler', shortName: 'Husleieloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1999-03-26-17' },
  kjl: { name: 'Lov om kjøp', shortName: 'Kjøpsloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1988-05-13-27' },
  fkjl: { name: 'Lov om forbrukerkjøp', shortName: 'Forbrukerkjøpsloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2002-06-21-34' },
  pop: { name: 'Lov om behandling av personopplysninger', shortName: 'Personopplysningsloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2018-06-15-38' },
  mfl: { name: 'Lov om kontroll med markedsføring og avtalevilkår mv.', shortName: 'Markedsføringsloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2009-01-09-2' },
  strl: { name: 'Lov om straff', shortName: 'Straffeloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2005-05-20-28' },
  tvl: { name: 'Lov om mekling og rettergang i sivile tvister', shortName: 'Tvisteloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2005-06-17-90' },
  fvl: { name: 'Lov om behandlingsmåten i forvaltningssaker', shortName: 'Forvaltningsloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1967-02-10' },
  skl: { name: 'Lov om skadeserstatning', shortName: 'Skadeserstatningsloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1969-06-13-26' },
  al: { name: 'Lov om arv og dødsboskifte', shortName: 'Arveloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2019-06-14-21' },
  el: { name: 'Lov om ekteskap', shortName: 'Ekteskapsloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1991-07-04-47' },
  bl: { name: 'Lov om barn og foreldre', shortName: 'Barnelova', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1981-04-08-7' },
  anvl: { name: 'Lov om angrerett', shortName: 'Angrerettloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/2014-06-20-27' },
  sktl: { name: 'Lov om skatt av formue og inntekt', shortName: 'Skatteloven', lovdataUrl: 'https://lovdata.no/dokument/NL/lov/1999-03-26-14' },
};

// Common legal questions with pre-built answers for faster response
const COMMON_QA_CACHE: Record<string, { category: LegalCategory; answer: string; sources: LegalSource[] }> = {
  'oppsigelse prøvetid': {
    category: 'employment_law',
    answer: `I prøvetiden gjelder kortere oppsigelsesfrist. Hovedregler:

1. **Lovens minstekrav:** 14 dagers gjensidig oppsigelsesfrist (aml. § 15-3 (7))
2. **Prøvetidens lengde:** Maks 6 måneder (aml. § 15-6)
3. **Utvidet prøvetid:** Kan avtales ved fravær (sykdom, permisjon) som arbeidstaker selv er årsak til
4. **Krav:** Oppsigelse må være saklig begrunnet, selv i prøvetiden

**Viktig:** Mange arbeidsavtaler har lengre oppsigelsesfrist i prøvetiden enn lovens minimum. Sjekk avtalen din.`,
    sources: [
      { type: 'law', title: 'Arbeidsmiljøloven § 15-3', reference: 'aml. § 15-3 (7)', url: 'https://lovdata.no/lov/2005-06-17-62/§15-3', relevance: 1 },
      { type: 'law', title: 'Arbeidsmiljøloven § 15-6', reference: 'aml. § 15-6', url: 'https://lovdata.no/lov/2005-06-17-62/§15-6', relevance: 0.9 },
    ],
  },
  'depositum husleie': {
    category: 'real_estate',
    answer: `Regler for depositum ved leie av bolig:

1. **Maksbeløp:** 6 måneders husleie (husll. § 3-5)
2. **Egen konto:** Må settes på depositumskonto i leietakers navn
3. **Renter:** Rentene tilfaller leietaker
4. **Utbetaling:** Utleier kan ikke ta ut penger uten leietakers samtykke eller dom
5. **Tilbakebetaling:** Skal skje innen én måned etter leieforholdets slutt

**Viktig:** Depositum kan ikke kreves for å dekke normal slitasje.`,
    sources: [
      { type: 'law', title: 'Husleieloven § 3-5', reference: 'husll. § 3-5', url: 'https://lovdata.no/lov/1999-03-26-17/§3-5', relevance: 1 },
    ],
  },
  'angrerett': {
    category: 'consumer_law',
    answer: `Angrerett gir forbrukere rett til å gå fra avtaler uten grunn:

1. **Frist:** 14 dager fra mottak av vare eller avtaleinngåelse for tjenester
2. **Gjelder for:** Fjernsalg (netthandel, telefonsalg) og salg utenom faste forretningslokaler
3. **Unntak:** 
   - Varer laget etter forbrukerens spesifikasjoner
   - Forseglede hygieneprodukter
   - Digitalt innhold (når levering har startet med samtykke)
4. **Kostnader:** Forbruker dekker returfrakt med mindre annet er avtalt
5. **Refusjon:** Selger må refundere innen 14 dager etter retur

**Merk:** Gjelder ikke kjøp i fysisk butikk eller mellom privatpersoner.`,
    sources: [
      { type: 'law', title: 'Angrerettloven § 20', reference: 'angrl. § 20', url: 'https://lovdata.no/lov/2014-06-20-27/§20', relevance: 1 },
      { type: 'law', title: 'Angrerettloven § 22', reference: 'angrl. § 22', url: 'https://lovdata.no/lov/2014-06-20-27/§22', relevance: 0.8 },
    ],
  },
};

export class LegalQAService {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      model: LLM_MODEL_NAME,
      temperature: 0.3, // Slightly higher for more natural responses
      maxTokens: 2000,
      openAIApiKey: LLM_API_KEY,
      configuration: {
        baseURL: LLM_BASE_URL,
      },
    });
  }

  /**
   * Answer a legal question
   */
  async answerQuestion(
    question: LegalQuestion,
    context?: string,
    chatHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<LegalAnswer> {
    // Check cache for common questions
    const cachedAnswer = this.checkCache(question.question);
    if (cachedAnswer) {
      return {
        id: crypto.randomUUID(),
        questionId: question.id,
        answer: cachedAnswer.answer,
        confidence: 0.95,
        sources: cachedAnswer.sources,
        caveats: ['Svaret er basert på generelle regler og kan variere basert på din spesifikke situasjon.'],
        relatedQuestions: this.getRelatedQuestions(cachedAnswer.category),
        disclaimer: '⚠️ Dette er generell juridisk informasjon og erstatter ikke profesjonell juridisk rådgivning. Kontakt en advokat for konkret veiledning i din sak.',
      };
    }

    // Detect category
    const category = question.category || this.detectCategory(question.question);

    // Build prompt
    const prompt = PromptTemplate.fromTemplate(LEGAL_QA_PROMPT);

    const chain = RunnableSequence.from([
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    const formattedHistory = this.formatChatHistory(chatHistory || []);

    const result = await chain.invoke({
      systemPrompt: NORWEGIAN_LEGAL_SYSTEM_PROMPT,
      context: context || 'Ingen spesifikk dokumentkontekst.',
      question: question.question,
      chatHistory: formattedHistory,
    });

    // Extract sources from the answer
    const sources = this.extractSources(result, category);

    return {
      id: crypto.randomUUID(),
      questionId: question.id,
      answer: result,
      confidence: this.calculateConfidence(result, sources),
      sources,
      caveats: this.extractCaveats(result),
      relatedQuestions: this.getRelatedQuestions(category),
      disclaimer: '⚠️ Dette er generell juridisk informasjon og erstatter ikke profesjonell juridisk rådgivning. Kontakt en advokat for konkret veiledning i din sak.',
    };
  }

  /**
   * Look up legal citations for a topic
   */
  async lookupCitations(
    query: string,
    category?: LegalCategory
  ): Promise<LegalSource[]> {
    const prompt = PromptTemplate.fromTemplate(CITATION_LOOKUP_PROMPT);

    const chain = RunnableSequence.from([
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      query,
      category: category ? LEGAL_CATEGORY_DESCRIPTIONS[category].name : 'Generelt',
    });

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        const sources: LegalSource[] = [];
        
        if (parsed.citations) {
          for (const citation of parsed.citations) {
            sources.push({
              type: 'law',
              title: citation.lawName,
              reference: citation.section,
              url: citation.url || this.generateLovdataUrl(citation.lawName, citation.section),
              excerpt: citation.title,
              relevance: 0.9,
            });
          }
        }

        if (parsed.caseReferences) {
          for (const caseRef of parsed.caseReferences) {
            sources.push({
              type: 'case',
              title: caseRef.reference,
              reference: caseRef.reference,
              excerpt: caseRef.summary,
              relevance: 0.7,
            });
          }
        }

        return sources;
      }
    } catch (e) {
      console.error('Failed to parse citations:', e);
    }

    return [];
  }

  /**
   * Get suggested questions based on category
   */
  getSuggestedQuestions(category?: LegalCategory): string[] {
    const suggestions: Record<LegalCategory, string[]> = {
      employment_law: [
        'Hva er oppsigelsesfristen min?',
        'Kan arbeidsgiver endre arbeidsoppgavene mine?',
        'Hva er reglene for overtidsbetaling?',
        'Kan jeg bli sagt opp under sykmelding?',
        'Hva er mine rettigheter ved permittering?',
      ],
      contract_law: [
        'Når kan jeg heve en avtale?',
        'Hva er reklamasjonsfristen?',
        'Kan jeg kreve erstatning ved kontraktsbrudd?',
        'Hva gjør en avtale ugyldig?',
        'Hva er forskjellen på mangel og forsinkelse?',
      ],
      company_law: [
        'Hva kreves for å stifte et AS?',
        'Hva er styrets ansvar?',
        'Når må det avholdes generalforsamling?',
        'Hvordan fordeles utbytte?',
        'Hva er forskjellen på AS og ENK?',
      ],
      real_estate: [
        'Hva er maksimalt depositum?',
        'Kan utleier kaste meg ut?',
        'Hvem har vedlikeholdsansvar?',
        'Hva er oppsigelsesfristen ved leie?',
        'Kan jeg holde tilbake husleie ved mangler?',
      ],
      family_law: [
        'Hvordan fordeles arv uten testament?',
        'Hva er pliktdelsarv?',
        'Hvordan søker jeg om skilsmisse?',
        'Hva er samværsrett?',
        'Hvordan fastsettes barnebidrag?',
      ],
      tax_law: [
        'Hva kan jeg trekke fra på skatten?',
        'Må jeg skatte av gaver?',
        'Hva er reglene for hjemmekontor-fradrag?',
        'Hvordan skattlegges krypto?',
        'Hva er dokumentavgiften?',
      ],
      intellectual_property: [
        'Hvordan registrerer jeg et varemerke?',
        'Hvor lenge varer opphavsrett?',
        'Hva er forskjellen på patent og varemerke?',
        'Kan jeg bruke andres bilder?',
        'Hvem eier det jeg lager på jobb?',
      ],
      data_protection: [
        'Hva er samtykke under GDPR?',
        'Hvor lenge kan data lagres?',
        'Hva er mine rettigheter som registrert?',
        'Trenger jeg databehandleravtale?',
        'Kan jeg overføre data til USA?',
      ],
      consumer_law: [
        'Hva er angrefristen?',
        'Kan jeg reklamere etter 2 år?',
        'Hva er mine rettigheter ved feil vare?',
        'Må butikken bytte varen?',
        'Hva gjør jeg hvis selger ikke svarer?',
      ],
      public_law: [
        'Hva er klagefristen i forvaltningssaker?',
        'Kan jeg kreve innsyn i dokumenter?',
        'Hva er habilitetsreglene?',
        'Hvordan klager jeg på vedtak?',
        'Hva er forskjellen på enkeltvedtak og forskrift?',
      ],
      criminal_law: [
        'Hva er foreldelsesfristen?',
        'Må jeg forklare meg for politiet?',
        'Hva er forskjellen på bot og fengsel?',
        'Hva er rettighetene mine ved pågripelse?',
        'Kan jeg nekte å vitne?',
      ],
      immigration_law: [
        'Hvordan søker jeg om oppholdstillatelse?',
        'Hva kreves for familieinnvandring?',
        'Hvor lenge må jeg bo i Norge for statsborgerskap?',
        'Hva er Schengen-visum?',
        'Kan jeg jobbe mens jeg venter på svar?',
      ],
      bankruptcy_law: [
        'Hva skjer ved konkurs?',
        'Hvem får betalt først?',
        'Kan jeg søke gjeldsordning?',
        'Hva mister jeg ved konkurs?',
        'Hvor lenge varer en gjeldsordning?',
      ],
      environmental_law: [
        'Trenger jeg tillatelse for å bygge?',
        'Hva er forurenser betaler-prinsippet?',
        'Kan naboen klage på byggeprosjektet mitt?',
        'Hva er konsekvensutredning?',
        'Hvordan klager jeg på miljøvedtak?',
      ],
      other: [
        'Hva slags advokat trenger jeg?',
        'Hva koster det å gå til advokat?',
        'Hva er fri rettshjelp?',
        'Hvordan finner jeg riktig advokat?',
        'Hva er forskjellen på advokat og jurist?',
      ],
    };

    if (category && suggestions[category]) {
      return suggestions[category];
    }

    // Return mix from different categories
    return [
      'Hva er oppsigelsesfristen min?',
      'Hva er angrefristen ved netthandel?',
      'Hva er maksimalt depositum ved leie?',
      'Hvordan fordeles arv uten testament?',
      'Trenger jeg databehandleravtale?',
    ];
  }

  // Helper methods

  private checkCache(question: string): { category: LegalCategory; answer: string; sources: LegalSource[] } | null {
    const normalizedQuestion = question.toLowerCase();
    
    for (const [key, value] of Object.entries(COMMON_QA_CACHE)) {
      if (normalizedQuestion.includes(key)) {
        return value;
      }
    }
    
    return null;
  }

  private detectCategory(question: string): LegalCategory {
    const keywords: Record<LegalCategory, string[]> = {
      employment_law: ['jobb', 'arbeids', 'oppsig', 'lønn', 'ferie', 'syk', 'permitter', 'arbeidsgiver', 'ansatt', 'prøvetid', 'overtid'],
      contract_law: ['avtale', 'kontrakt', 'mislighold', 'heve', 'reklamasjon', 'mangel', 'forsinkelse'],
      company_law: ['aksje', 'as', 'styre', 'utbytte', 'generalforsamling', 'selskap', 'daglig leder'],
      real_estate: ['leie', 'husleie', 'depositum', 'utleier', 'leietaker', 'bolig', 'eiendom', 'tinglys'],
      family_law: ['arv', 'skilsmisse', 'ektefelle', 'samboer', 'barn', 'samvær', 'bidrag', 'testament'],
      tax_law: ['skatt', 'mva', 'fradrag', 'merverdi', 'avgift', 'selvangivelse'],
      intellectual_property: ['patent', 'varemerke', 'opphavsrett', 'copyright', 'lisens', 'åndsverk'],
      data_protection: ['personvern', 'gdpr', 'personopplysning', 'samtykke', 'databehandler', 'innsyn'],
      consumer_law: ['forbruker', 'reklamasjon', 'angrerett', 'garanti', 'kjøp', 'netthandel', 'retur'],
      public_law: ['forvaltning', 'vedtak', 'kommune', 'innsyn', 'klage', 'offentlig'],
      criminal_law: ['straff', 'politiet', 'pågrepet', 'siktelse', 'forelegg', 'bot', 'fengsel'],
      immigration_law: ['opphold', 'visum', 'statsborgerskap', 'asyl', 'utlending', 'innvandring'],
      bankruptcy_law: ['konkurs', 'gjeld', 'gjeldsordning', 'betalingsudyktig', 'inkasso'],
      environmental_law: ['miljø', 'forurensning', 'bygge', 'regulering', 'naturvern'],
      other: [],
    };

    const normalizedQuestion = question.toLowerCase();
    
    for (const [category, categoryKeywords] of Object.entries(keywords)) {
      for (const keyword of categoryKeywords) {
        if (normalizedQuestion.includes(keyword)) {
          return category as LegalCategory;
        }
      }
    }

    return 'other';
  }

  private formatChatHistory(history: Array<{ role: 'user' | 'assistant'; content: string }>): string {
    if (!history.length) return 'Ingen tidligere samtale.';

    return history
      .slice(-6) // Last 6 messages for context
      .map(msg => `${msg.role === 'user' ? 'Bruker' : 'Assistent'}: ${msg.content}`)
      .join('\n\n');
  }

  private extractSources(answer: string, category: LegalCategory): LegalSource[] {
    const sources: LegalSource[] = [];
    
    // Pattern for Norwegian law references
    const lawPattern = /(?:aml\.|arbeidsmiljøloven|aksjeloven|asl\.|avtaleloven|kjøpsloven|husleieloven|personopplysningsloven|GDPR|markedsføringsloven)\s*§?\s*(\d+[-\d]*)?/gi;
    
    let match;
    while ((match = lawPattern.exec(answer)) !== null) {
      const lawText = match[0].toLowerCase();
      
      // Find which law this refers to
      for (const [abbrev, law] of Object.entries(NORWEGIAN_LAW_REFERENCE)) {
        if (lawText.includes(abbrev) || lawText.includes(law.shortName.toLowerCase())) {
          sources.push({
            type: 'law',
            title: law.shortName,
            reference: match[0],
            url: law.lovdataUrl,
            relevance: 0.9,
          });
          break;
        }
      }
    }

    // Remove duplicates
    const uniqueSources = sources.filter((source, index, self) =>
      index === self.findIndex(s => s.reference === source.reference)
    );

    return uniqueSources;
  }

  private extractCaveats(answer: string): string[] {
    const caveats: string[] = [];

    // Look for qualifying language
    if (answer.includes('kan variere') || answer.includes('avhenger av')) {
      caveats.push('Svaret kan variere basert på din spesifikke situasjon.');
    }
    if (answer.includes('advokat') || answer.includes('juridisk rådgivning')) {
      caveats.push('Det anbefales å konsultere en advokat for din konkrete sak.');
    }
    if (answer.includes('unntak') || answer.includes('særregler')) {
      caveats.push('Det finnes unntak og særregler som kan påvirke svaret.');
    }

    return caveats;
  }

  private calculateConfidence(answer: string, sources: LegalSource[]): number {
    let confidence = 0.6; // Base confidence

    // More sources = higher confidence
    confidence += Math.min(sources.length * 0.1, 0.2);

    // Longer, more detailed answer = slightly higher confidence
    if (answer.length > 500) confidence += 0.05;
    if (answer.length > 1000) confidence += 0.05;

    // Cap at 0.9 - never fully confident without human review
    return Math.min(confidence, 0.9);
  }

  private getRelatedQuestions(category: LegalCategory): string[] {
    return this.getSuggestedQuestions(category).slice(0, 3);
  }

  private generateLovdataUrl(lawName: string, section: string): string | undefined {
    const normalizedLaw = lawName.toLowerCase();
    
    for (const [_, law] of Object.entries(NORWEGIAN_LAW_REFERENCE)) {
      if (normalizedLaw.includes(law.shortName.toLowerCase()) || law.name.toLowerCase().includes(normalizedLaw)) {
        // Extract section number
        const sectionNum = section.match(/\d+[-\d]*/)?.[0];
        if (sectionNum) {
          return `${law.lovdataUrl}/§${sectionNum}`;
        }
        return law.lovdataUrl;
      }
    }

    return undefined;
  }
}

// Export singleton
export const legalQAService = new LegalQAService();
