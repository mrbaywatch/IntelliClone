/**
 * Contract Analyzer Service
 * Analyzes contracts for risks, compliance, and key information
 */

import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

import type {
  ContractRisk,
  DocumentAnalysis,
  LawReference,
  MissingClause,
  NorwegianDocumentType,
  Party,
  RiskLevel,
} from '../types';
import {
  CONTRACT_RISK_ANALYSIS_PROMPT,
  CONTRACT_SUMMARY_PROMPT,
  DOCUMENT_CLASSIFICATION_PROMPT,
  DOCUMENT_TYPE_PROMPTS,
  GDPR_COMPLIANCE_PROMPT,
} from '../prompts/norwegian-legal-prompts';

const LLM_MODEL_NAME = process.env.LLM_MODEL_NAME ?? 'gpt-4o';
const LLM_BASE_URL = process.env.LLM_BASE_URL;
const LLM_API_KEY = process.env.LLM_API_KEY;

interface AnalyzerOptions {
  userRole?: 'party_a' | 'party_b' | 'neutral';
  focusAreas?: string[];
  language?: 'no' | 'en';
}

export class ContractAnalyzer {
  private model: ChatOpenAI;

  constructor() {
    this.model = new ChatOpenAI({
      model: LLM_MODEL_NAME,
      temperature: 0,
      maxTokens: 4000,
      openAIApiKey: LLM_API_KEY,
      configuration: {
        baseURL: LLM_BASE_URL,
      },
    });
  }

  /**
   * Perform full document analysis
   */
  async analyzeDocument(
    documentContent: string,
    documentId: string,
    options: AnalyzerOptions = {}
  ): Promise<DocumentAnalysis> {
    // Step 1: Classify the document
    const classification = await this.classifyDocument(documentContent);

    // Step 2: Generate summary
    const summary = await this.generateSummary(documentContent, classification.documentType);

    // Step 3: Analyze risks
    const riskAnalysis = await this.analyzeRisks(
      documentContent,
      classification.documentType,
      options.userRole ?? 'neutral'
    );

    // Step 4: Check GDPR compliance if relevant
    const compliance = await this.checkCompliance(documentContent, classification.documentType);

    // Combine results
    const analysis: DocumentAnalysis = {
      id: crypto.randomUUID(),
      documentId,
      documentType: classification.documentType,
      language: classification.language,
      createdAt: new Date(),
      summary: {
        brief: summary.brief,
        detailed: summary.detailed,
        keyPoints: summary.keyPoints,
        parties: classification.parties,
        effectiveDate: classification.effectiveDate,
        terminationDate: classification.terminationDate,
        value: summary.value,
      },
      riskAnalysis: {
        overallRiskLevel: riskAnalysis.overallRiskLevel,
        riskScore: riskAnalysis.riskScore,
        risks: riskAnalysis.risks,
        missingClauses: riskAnalysis.missingClauses,
        recommendations: riskAnalysis.recommendations,
      },
      compliance: {
        gdprCompliant: compliance.gdprCompliant,
        gdprIssues: compliance.gdprIssues,
        norwegianLawCompliant: compliance.norwegianLawCompliant,
        norwegianLawIssues: compliance.norwegianLawIssues,
        relevantLaws: compliance.relevantLaws,
      },
      metadata: {
        wordCount: documentContent.split(/\s+/).length,
        sections: classification.sections,
        hasSignatureBlock: this.detectSignatureBlock(documentContent),
        hasDateBlock: this.detectDateBlock(documentContent),
      },
    };

    return analysis;
  }

  /**
   * Classify document type
   */
  async classifyDocument(documentContent: string): Promise<{
    documentType: NorwegianDocumentType;
    language: 'no' | 'en' | 'other';
    confidence: number;
    parties: Party[];
    effectiveDate?: string;
    terminationDate?: string;
    sections: string[];
  }> {
    const prompt = PromptTemplate.fromTemplate(DOCUMENT_CLASSIFICATION_PROMPT);
    
    const chain = RunnableSequence.from([
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({ document: documentContent });

    try {
      // Extract JSON from the response
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse classification result:', e);
    }

    // Default fallback
    return {
      documentType: 'unknown',
      language: this.detectLanguage(documentContent),
      confidence: 0.5,
      parties: [],
      sections: [],
    };
  }

  /**
   * Generate document summary
   */
  async generateSummary(
    documentContent: string,
    documentType: NorwegianDocumentType
  ): Promise<{
    brief: string;
    detailed: string;
    keyPoints: string[];
    value?: {
      amount: number;
      currency: string;
      description: string;
    };
  }> {
    const prompt = PromptTemplate.fromTemplate(CONTRACT_SUMMARY_PROMPT);
    
    const chain = RunnableSequence.from([
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({ document: documentContent });

    // Parse the structured response
    const sections = this.parseSummarySections(result);

    return {
      brief: sections.brief || 'Dokumentet kunne ikke oppsummeres.',
      detailed: sections.detailed || result,
      keyPoints: sections.keyPoints || [],
      value: sections.value,
    };
  }

  /**
   * Analyze contract risks
   */
  async analyzeRisks(
    documentContent: string,
    documentType: NorwegianDocumentType,
    userRole: 'party_a' | 'party_b' | 'neutral'
  ): Promise<{
    overallRiskLevel: RiskLevel;
    riskScore: number;
    risks: ContractRisk[];
    missingClauses: MissingClause[];
    recommendations: string[];
  }> {
    const prompt = PromptTemplate.fromTemplate(CONTRACT_RISK_ANALYSIS_PROMPT);
    
    const chain = RunnableSequence.from([
      prompt,
      this.model,
      new StringOutputParser(),
    ]);

    const result = await chain.invoke({
      document: documentContent,
      documentType,
      userRole,
    });

    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Add IDs to risks
        const risks: ContractRisk[] = (parsed.risks || []).map((risk: Omit<ContractRisk, 'id'>, index: number) => ({
          ...risk,
          id: `risk-${index + 1}`,
          location: this.findClauseLocation(documentContent, risk.clause),
        }));

        return {
          overallRiskLevel: parsed.overallRiskLevel || 'medium',
          riskScore: parsed.riskScore || 50,
          risks,
          missingClauses: parsed.missingClauses || [],
          recommendations: parsed.recommendations || [],
        };
      }
    } catch (e) {
      console.error('Failed to parse risk analysis:', e);
    }

    return {
      overallRiskLevel: 'medium',
      riskScore: 50,
      risks: [],
      missingClauses: [],
      recommendations: ['Kunne ikke analysere dokumentet fullstendig. Vurder profesjonell gjennomgang.'],
    };
  }

  /**
   * Check compliance with GDPR and Norwegian law
   */
  async checkCompliance(
    documentContent: string,
    documentType: NorwegianDocumentType
  ): Promise<{
    gdprCompliant: boolean;
    gdprIssues: string[];
    norwegianLawCompliant: boolean;
    norwegianLawIssues: string[];
    relevantLaws: LawReference[];
  }> {
    // Check if document handles personal data
    const handlesPersonalData = this.detectPersonalDataHandling(documentContent);

    let gdprResult = { isCompliant: true, issues: [] as string[] };

    if (handlesPersonalData) {
      const prompt = PromptTemplate.fromTemplate(GDPR_COMPLIANCE_PROMPT);
      
      const chain = RunnableSequence.from([
        prompt,
        this.model,
        new StringOutputParser(),
      ]);

      const result = await chain.invoke({ document: documentContent });

      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          gdprResult = {
            isCompliant: parsed.isCompliant ?? true,
            issues: parsed.issues?.map((i: { issue: string }) => i.issue) || [],
          };
        }
      } catch (e) {
        console.error('Failed to parse GDPR check:', e);
      }
    }

    // Get relevant laws for the document type
    const relevantLaws = this.getRelevantLaws(documentType);

    return {
      gdprCompliant: gdprResult.isCompliant,
      gdprIssues: gdprResult.issues,
      norwegianLawCompliant: true, // Would need deeper analysis
      norwegianLawIssues: [],
      relevantLaws,
    };
  }

  /**
   * Quick risk scan for highlighting
   */
  async quickRiskScan(documentContent: string): Promise<{
    highlights: Array<{
      text: string;
      start: number;
      end: number;
      riskLevel: RiskLevel;
      category: string;
      tooltip: string;
    }>;
  }> {
    // Patterns for common risky clauses
    const riskPatterns = [
      {
        pattern: /(?:uoppsigelig|ikke.*sies.*opp|bindingstid|binding)/gi,
        category: 'termination',
        level: 'high' as RiskLevel,
        tooltip: 'Bindingsklausul - vurder varighet og rimelighet',
      },
      {
        pattern: /(?:dagmulkt|bot|konvensjonalbot|dagbot|per dag)/gi,
        category: 'penalty',
        level: 'high' as RiskLevel,
        tooltip: 'Dagmulkt/bot - sjekk beløp og tak',
      },
      {
        pattern: /(?:skadesløs|holde.*skadesløs|indemnif)/gi,
        category: 'indemnification',
        level: 'high' as RiskLevel,
        tooltip: 'Skadesløsholdelse - potensielt ubegrenset ansvar',
      },
      {
        pattern: /(?:ubegrenset.*ansvar|uten.*begrensning|fullt.*ansvar)/gi,
        category: 'liability',
        level: 'critical' as RiskLevel,
        tooltip: 'Ubegrenset ansvar - høy risiko',
      },
      {
        pattern: /(?:konkurranseforbud|konkurrerende.*virksomhet|ikke.*konkurrere)/gi,
        category: 'non_compete',
        level: 'high' as RiskLevel,
        tooltip: 'Konkurranseforbud - sjekk varighet og kompensasjon (aml. § 14A)',
      },
      {
        pattern: /(?:overdras|tredjepart|cesjon|assignment)/gi,
        category: 'assignment',
        level: 'medium' as RiskLevel,
        tooltip: 'Overdragelsesklausul - hvem kan overta forpliktelser?',
      },
      {
        pattern: /(?:utenlandsk.*rett|fremmed.*lov|governing.*law|choice.*of.*law)/gi,
        category: 'governing_law',
        level: 'medium' as RiskLevel,
        tooltip: 'Lovvalg - annen jurisdiksjon enn Norge',
      },
      {
        pattern: /(?:voldgift|arbitration|konfliktløsning.*utenfor)/gi,
        category: 'dispute_resolution',
        level: 'medium' as RiskLevel,
        tooltip: 'Voldgiftsklausul - kan være kostbart',
      },
      {
        pattern: /(?:prøvetid|probation|oppsigelsestid.*prøve)/gi,
        category: 'termination',
        level: 'low' as RiskLevel,
        tooltip: 'Prøvetid - maks 6 måneder (aml. § 15-6)',
      },
      {
        pattern: /(?:personopplysninger|personal.*data|GDPR|behandlingsansvarlig)/gi,
        category: 'data_protection',
        level: 'medium' as RiskLevel,
        tooltip: 'Personvernklausul - sjekk GDPR-samsvar',
      },
    ];

    const highlights: Array<{
      text: string;
      start: number;
      end: number;
      riskLevel: RiskLevel;
      category: string;
      tooltip: string;
    }> = [];

    for (const { pattern, category, level, tooltip } of riskPatterns) {
      let match;
      while ((match = pattern.exec(documentContent)) !== null) {
        // Extend to capture surrounding context (sentence or clause)
        const contextStart = Math.max(0, match.index - 50);
        const contextEnd = Math.min(documentContent.length, match.index + match[0].length + 100);
        
        // Find sentence boundaries
        const beforeText = documentContent.substring(contextStart, match.index);
        const afterText = documentContent.substring(match.index + match[0].length, contextEnd);
        
        const sentenceStart = Math.max(
          contextStart + (beforeText.lastIndexOf('.') + 1),
          contextStart + (beforeText.lastIndexOf('\n') + 1)
        );
        
        const sentenceEnd = Math.min(
          match.index + match[0].length + afterText.indexOf('.') + 1,
          contextEnd
        );

        highlights.push({
          text: documentContent.substring(sentenceStart, sentenceEnd).trim(),
          start: sentenceStart,
          end: sentenceEnd,
          riskLevel: level,
          category,
          tooltip,
        });
      }
    }

    // Remove duplicates and overlapping highlights
    return { highlights: this.deduplicateHighlights(highlights) };
  }

  // Helper methods

  private detectLanguage(text: string): 'no' | 'en' | 'other' {
    const norwegianIndicators = ['avtale', 'mellom', 'heretter', 'partene', 'følgende', 'vilkår', 'skal', 'jf', 'iht'];
    const englishIndicators = ['agreement', 'between', 'hereinafter', 'parties', 'following', 'terms', 'shall', 'pursuant'];

    const lowercaseText = text.toLowerCase();
    
    const norwegianCount = norwegianIndicators.filter(word => lowercaseText.includes(word)).length;
    const englishCount = englishIndicators.filter(word => lowercaseText.includes(word)).length;

    if (norwegianCount > englishCount) return 'no';
    if (englishCount > norwegianCount) return 'en';
    return 'other';
  }

  private detectPersonalDataHandling(text: string): boolean {
    const personalDataIndicators = [
      'personopplysning',
      'personal data',
      'GDPR',
      'databehandler',
      'behandlingsansvarlig',
      'registrert',
      'samtykke',
      'personvern',
    ];

    const lowercaseText = text.toLowerCase();
    return personalDataIndicators.some(indicator => lowercaseText.includes(indicator.toLowerCase()));
  }

  private detectSignatureBlock(text: string): boolean {
    const signatureIndicators = ['underskrift', 'signatur', 'dato', 'sted', '___', 'signature'];
    const lowercaseText = text.toLowerCase();
    return signatureIndicators.filter(indicator => lowercaseText.includes(indicator)).length >= 2;
  }

  private detectDateBlock(text: string): boolean {
    const datePattern = /\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}/;
    return datePattern.test(text);
  }

  private findClauseLocation(
    documentContent: string,
    clauseText: string
  ): { start: number; end: number; section?: string; paragraph?: number } {
    const index = documentContent.indexOf(clauseText);
    if (index === -1) {
      return { start: 0, end: 0 };
    }

    // Try to find section header
    const beforeText = documentContent.substring(0, index);
    const sectionMatch = beforeText.match(/(?:§\s*\d+|(?:punkt|section|artikkel)\s*\d+[.\s]+[^\n]+)/gi);
    const section = sectionMatch ? sectionMatch[sectionMatch.length - 1] : undefined;

    // Count paragraphs
    const paragraphs = beforeText.split(/\n\n+/);
    const paragraph = paragraphs.length;

    return {
      start: index,
      end: index + clauseText.length,
      section,
      paragraph,
    };
  }

  private parseSummarySections(summaryText: string): {
    brief?: string;
    detailed?: string;
    keyPoints?: string[];
    value?: { amount: number; currency: string; description: string };
  } {
    const sections: Record<string, string> = {};
    
    // Split by numbered headers
    const parts = summaryText.split(/\d+\.\s*(?:KORT SAMMENDRAG|PARTER|HOVEDPUNKTER|VIKTIGE DATOER|ØKONOMISKE|FORPLIKTELSER)/i);
    
    return {
      brief: parts[1]?.trim().split('\n')[0],
      detailed: summaryText,
      keyPoints: this.extractBulletPoints(summaryText),
    };
  }

  private extractBulletPoints(text: string): string[] {
    const bulletPattern = /[-•*]\s+(.+)/g;
    const points: string[] = [];
    let match;
    
    while ((match = bulletPattern.exec(text)) !== null) {
      if (match[1]) {
        points.push(match[1].trim());
      }
    }
    
    return points;
  }

  private getRelevantLaws(documentType: NorwegianDocumentType): LawReference[] {
    const lawsByType: Record<NorwegianDocumentType, LawReference[]> = {
      contract: [
        { lawName: 'Avtaleloven', section: '§ 36', title: 'Urimelige avtaler', relevance: 'Grunnlag for tilsidesettelse av urimelige vilkår' },
      ],
      employment_contract: [
        { lawName: 'Arbeidsmiljøloven', section: '§ 14-6', title: 'Minimumskrav til arbeidsavtale', relevance: 'Obligatorisk innhold i arbeidsavtalen' },
        { lawName: 'Arbeidsmiljøloven', section: '§ 14-9', title: 'Midlertidig ansettelse', relevance: 'Vilkår for midlertidig ansettelse' },
        { lawName: 'Arbeidsmiljøloven', section: '§ 14A', title: 'Konkurranseklausuler', relevance: 'Begrensninger for konkurranseklausuler' },
        { lawName: 'Arbeidsmiljøloven', section: '§ 15-3', title: 'Oppsigelsesfrister', relevance: 'Lovbestemte minimumsfrister' },
      ],
      lease_agreement: [
        { lawName: 'Husleieloven', section: '§ 3-5', title: 'Depositum', relevance: 'Maks 6 måneder, egen konto' },
        { lawName: 'Husleieloven', section: 'Kap. 9', title: 'Oppsigelse', relevance: 'Regler for oppsigelse av leieforhold' },
      ],
      purchase_agreement: [
        { lawName: 'Kjøpsloven', section: '§ 32', title: 'Reklamasjon', relevance: 'Frister for å gjøre gjeldende mangler' },
        { lawName: 'Forbrukerkjøpsloven', section: '§ 27', title: 'Reklamasjonsfrist', relevance: '2 år, 5 år for varige ting' },
      ],
      shareholder_agreement: [
        { lawName: 'Aksjeloven', section: 'Kap. 4', title: 'Aksjer og aksjeeiere', relevance: 'Grunnleggende regler for aksjer' },
      ],
      nda: [
        { lawName: 'Markedsføringsloven', section: '§ 28-29', title: 'Bedriftshemmeligheter', relevance: 'Vern av forretningshemmeligheter' },
      ],
      terms_of_service: [
        { lawName: 'Markedsføringsloven', section: '§ 22', title: 'Urimelige avtalevilkår', relevance: 'Forbud mot urimelige standardvilkår' },
        { lawName: 'Angrerettloven', section: '§ 20', title: 'Angrerett', relevance: '14 dagers angrefrist' },
      ],
      privacy_policy: [
        { lawName: 'Personopplysningsloven', section: 'GDPR art. 13-14', title: 'Informasjonsplikt', relevance: 'Krav til informasjon til registrerte' },
      ],
      power_of_attorney: [],
      memorandum: [],
      legal_opinion: [],
      board_resolution: [
        { lawName: 'Aksjeloven', section: '§ 6-19', title: 'Styrebehandling', relevance: 'Krav til styrebehandling og vedtak' },
      ],
      general_assembly: [
        { lawName: 'Aksjeloven', section: '§ 5-10', title: 'Innkalling', relevance: '21 dagers innkallingsfrist' },
        { lawName: 'Aksjeloven', section: '§ 5-16', title: 'Protokoll', relevance: 'Krav til protokollføring' },
      ],
      unknown: [],
    };

    return lawsByType[documentType] || [];
  }

  private deduplicateHighlights(
    highlights: Array<{
      text: string;
      start: number;
      end: number;
      riskLevel: RiskLevel;
      category: string;
      tooltip: string;
    }>
  ): Array<{
    text: string;
    start: number;
    end: number;
    riskLevel: RiskLevel;
    category: string;
    tooltip: string;
  }> {
    // Sort by start position
    highlights.sort((a, b) => a.start - b.start);

    const result: typeof highlights = [];

    for (const highlight of highlights) {
      const lastHighlight = result[result.length - 1];

      // Check for overlap with previous highlight
      if (lastHighlight && highlight.start < lastHighlight.end) {
        // Keep the one with higher risk
        const riskOrder: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };
        if (riskOrder[highlight.riskLevel] > riskOrder[lastHighlight.riskLevel]) {
          result[result.length - 1] = highlight;
        }
        // Otherwise keep the existing one
      } else {
        result.push(highlight);
      }
    }

    return result;
  }
}

// Export singleton instance
export const contractAnalyzer = new ContractAnalyzer();
