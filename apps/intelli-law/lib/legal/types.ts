/**
 * Intelli-Law Legal Types
 * Core type definitions for Norwegian legal document processing
 */

// Document types common in Norwegian legal practice
export type NorwegianDocumentType =
  | 'contract' // Avtale/Kontrakt
  | 'employment_contract' // Arbeidsavtale
  | 'lease_agreement' // Leieavtale
  | 'purchase_agreement' // Kjøpsavtale
  | 'shareholder_agreement' // Aksjonæravtale
  | 'nda' // Konfidensialitetsavtale
  | 'terms_of_service' // Vilkår
  | 'privacy_policy' // Personvernerklæring
  | 'power_of_attorney' // Fullmakt
  | 'memorandum' // Notat
  | 'legal_opinion' // Juridisk vurdering
  | 'board_resolution' // Styrevedtak
  | 'general_assembly' // Generalforsamlingsprotokoll
  | 'unknown';

// Risk levels for contract clauses
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

// Risk categories common in Norwegian contracts
export type RiskCategory =
  | 'liability' // Ansvar
  | 'termination' // Oppsigelse
  | 'penalty' // Dagmulkt/Bot
  | 'confidentiality' // Konfidensialitet
  | 'ip_rights' // Immaterielle rettigheter
  | 'indemnification' // Skadesløsholdelse
  | 'limitation_of_liability' // Ansvarsbegrensning
  | 'force_majeure' // Force majeure
  | 'jurisdiction' // Verneting
  | 'governing_law' // Lovvalg
  | 'dispute_resolution' // Tvisteløsning
  | 'data_protection' // Personvern
  | 'compliance' // Etterlevelse
  | 'insurance' // Forsikring
  | 'warranties' // Garantier
  | 'payment_terms' // Betalingsvilkår
  | 'delivery' // Levering
  | 'non_compete' // Konkurranseforbud
  | 'non_solicitation' // Rekrutteringsforbud
  | 'assignment' // Overdragelse
  | 'notice_period' // Varselsfrist
  | 'other';

// A flagged risk in a contract
export interface ContractRisk {
  id: string;
  category: RiskCategory;
  level: RiskLevel;
  clause: string; // The problematic clause text
  location: {
    start: number; // Character offset
    end: number;
    section?: string; // Section name if identifiable
    paragraph?: number;
  };
  issue: string; // What's the problem
  explanation: string; // Detailed explanation in Norwegian
  recommendation: string; // Suggested action
  legalBasis?: string; // Relevant Norwegian law reference
  commonIndustryPractice?: string; // What's normal in the industry
}

// Document analysis result
export interface DocumentAnalysis {
  id: string;
  documentId: string;
  documentType: NorwegianDocumentType;
  language: 'no' | 'en' | 'other';
  createdAt: Date;
  
  // Summary
  summary: {
    brief: string; // 1-2 sentence summary
    detailed: string; // Full summary
    keyPoints: string[]; // Bullet points
    parties: Party[];
    effectiveDate?: string;
    terminationDate?: string;
    value?: {
      amount: number;
      currency: string;
      description: string;
    };
  };

  // Risk analysis
  riskAnalysis: {
    overallRiskLevel: RiskLevel;
    riskScore: number; // 0-100
    risks: ContractRisk[];
    missingClauses: MissingClause[];
    recommendations: string[];
  };

  // Legal compliance
  compliance: {
    gdprCompliant: boolean;
    gdprIssues: string[];
    norwegianLawCompliant: boolean;
    norwegianLawIssues: string[];
    relevantLaws: LawReference[];
  };

  // Metadata
  metadata: {
    wordCount: number;
    pageCount?: number;
    sections: string[];
    hasSignatureBlock: boolean;
    hasDateBlock: boolean;
  };
}

// Party in a contract
export interface Party {
  name: string;
  role: 'party_a' | 'party_b' | 'guarantor' | 'witness' | 'other';
  type: 'individual' | 'company' | 'organization' | 'government';
  identifier?: string; // Org number or personal ID
  address?: string;
  representative?: string;
}

// Missing clause that should be present
export interface MissingClause {
  type: string;
  importance: RiskLevel;
  description: string;
  suggestedText?: string;
  legalBasis?: string;
}

// Reference to Norwegian law
export interface LawReference {
  lawName: string; // e.g., "Arbeidsmiljøloven"
  lawNameEnglish?: string;
  section: string; // e.g., "§ 14-9"
  title: string;
  relevance: string;
  url?: string; // Link to Lovdata
}

// Legal Q&A types
export interface LegalQuestion {
  id: string;
  question: string;
  context?: string;
  documentId?: string;
  category?: LegalCategory;
  createdAt: Date;
}

export interface LegalAnswer {
  id: string;
  questionId: string;
  answer: string;
  confidence: number; // 0-1
  sources: LegalSource[];
  caveats: string[];
  relatedQuestions: string[];
  disclaimer: string;
}

export interface LegalSource {
  type: 'law' | 'case' | 'regulation' | 'guideline' | 'article' | 'document';
  title: string;
  reference: string;
  url?: string;
  excerpt?: string;
  relevance: number; // 0-1
}

export type LegalCategory =
  | 'employment_law' // Arbeidsrett
  | 'contract_law' // Kontraktsrett
  | 'company_law' // Selskapsrett
  | 'real_estate' // Eiendomsrett
  | 'family_law' // Familierett
  | 'tax_law' // Skatterett
  | 'intellectual_property' // Immaterialrett
  | 'data_protection' // Personvern
  | 'consumer_law' // Forbrukerrett
  | 'public_law' // Offentlig rett
  | 'criminal_law' // Strafferett
  | 'immigration_law' // Utlendingsrett
  | 'bankruptcy_law' // Konkursrett
  | 'environmental_law' // Miljørett
  | 'other';

// Template types
export interface LegalTemplate {
  id: string;
  name: string;
  nameNorwegian: string;
  description: string;
  category: LegalCategory;
  documentType: NorwegianDocumentType;
  template: string;
  placeholders: TemplatePlaceholder[];
  instructions: string;
  legalBasis?: string;
  lastUpdated: Date;
  version: string;
}

export interface TemplatePlaceholder {
  key: string;
  label: string;
  labelNorwegian: string;
  type: 'text' | 'date' | 'number' | 'select' | 'multiline';
  required: boolean;
  defaultValue?: string;
  options?: string[];
  validation?: string; // Regex pattern
  helpText?: string;
}

// Case/Client context for memory integration
export interface LegalCase {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  category: LegalCategory;
  status: 'active' | 'pending' | 'closed' | 'archived';
  parties: Party[];
  documents: string[]; // Document IDs
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}
