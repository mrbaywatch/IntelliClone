/**
 * Entity types that can be extracted from text
 */
export type EntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'date'
  | 'time'
  | 'money'
  | 'percent'
  | 'email'
  | 'phone'
  | 'url'
  | 'product'
  | 'event'
  | 'skill'
  | 'role'
  | 'custom';

/**
 * A single extracted entity
 */
export interface ExtractedEntity {
  /** The entity type */
  type: EntityType;
  
  /** The entity value as found in text */
  value: string;
  
  /** Normalized/canonical form */
  normalized?: string;
  
  /** Start position in source text */
  startIndex: number;
  
  /** End position in source text */
  endIndex: number;
  
  /** Confidence score 0-1 */
  confidence: number;
  
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result of entity extraction
 */
export interface EntityExtractionResult {
  /** All extracted entities */
  entities: ExtractedEntity[];
  
  /** Grouped by type for convenience */
  byType: Partial<Record<EntityType, ExtractedEntity[]>>;
  
  /** Source text */
  sourceText: string;
  
  /** Processing time in ms */
  durationMs: number;
}

/**
 * Norwegian-specific entity patterns
 */
export interface NorwegianEntityPatterns {
  /** Organization number (organisasjonsnummer) */
  orgNumber: RegExp;
  
  /** Norwegian phone numbers */
  phoneNumber: RegExp;
  
  /** Norwegian postal codes */
  postalCode: RegExp;
  
  /** Norwegian bank account numbers */
  bankAccount: RegExp;
  
  /** Norwegian date formats */
  dateFormats: RegExp[];
  
  /** Common Norwegian company suffixes */
  companySuffixes: string[];
  
  /** Norwegian currency patterns */
  currency: RegExp;
}

/**
 * Default Norwegian patterns
 */
export const NORWEGIAN_PATTERNS: NorwegianEntityPatterns = {
  orgNumber: /\b\d{9}\b/,
  phoneNumber: /\b(?:\+47|0047)?[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}[\s-]?\d{2}\b/,
  postalCode: /\b\d{4}\b/,
  bankAccount: /\b\d{4}[\s.-]?\d{2}[\s.-]?\d{5}\b/,
  dateFormats: [
    /\b\d{1,2}\.\s?\d{1,2}\.\s?\d{2,4}\b/, // DD.MM.YYYY
    /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,       // DD/MM/YYYY
    /\b\d{4}-\d{2}-\d{2}\b/,               // ISO format
  ],
  companySuffixes: ['AS', 'ASA', 'ANS', 'DA', 'ENK', 'NUF', 'SA', 'SE', 'BA'],
  currency: /\b(?:kr|NOK|kroner)[\s]?\d+(?:[,.\s]\d+)*\b/i,
};

/**
 * Detected preference from conversation
 */
export interface DetectedPreference {
  /** Category of preference */
  category: string;
  
  /** The preference value */
  value: string;
  
  /** Strength of the preference */
  strength: 'weak' | 'moderate' | 'strong';
  
  /** Positive or negative preference */
  polarity: 'positive' | 'negative';
  
  /** Context when this preference applies */
  context?: string;
  
  /** Source text that indicated this preference */
  evidence: string;
  
  /** Confidence score */
  confidence: number;
}

/**
 * Preference categories
 */
export type PreferenceCategory =
  | 'communication'    // Email, phone, chat preference
  | 'scheduling'       // Meeting time preferences
  | 'format'           // Document/output format preferences
  | 'language'         // Language/tone preferences
  | 'frequency'        // How often they want updates
  | 'privacy'          // Data handling preferences
  | 'notification'     // Notification preferences
  | 'workflow'         // Work style preferences
  | 'content'          // Content type preferences
  | 'interaction';     // Interaction style preferences

/**
 * Preference detection result
 */
export interface PreferenceDetectionResult {
  /** Detected preferences */
  preferences: DetectedPreference[];
  
  /** Grouped by category */
  byCategory: Partial<Record<PreferenceCategory, DetectedPreference[]>>;
  
  /** Source text */
  sourceText: string;
  
  /** Processing time in ms */
  durationMs: number;
}

/**
 * A fact extracted from conversation
 */
export interface ExtractedFact {
  /** Subject of the fact */
  subject: string;
  
  /** Predicate/relationship */
  predicate: string;
  
  /** Object/value */
  object: string;
  
  /** The fact as a natural language statement */
  statement: string;
  
  /** Confidence in extraction accuracy */
  confidence: number;
  
  /** Whether this is about the user or someone else */
  aboutUser: boolean;
  
  /** Source evidence */
  evidence: string;
  
  /** Temporal scope if applicable */
  temporal?: {
    type: 'past' | 'present' | 'future' | 'general';
    value?: string;
  };
}

/**
 * Result of fact extraction
 */
export interface FactExtractionResult {
  /** Extracted facts */
  facts: ExtractedFact[];
  
  /** Facts about the user specifically */
  userFacts: ExtractedFact[];
  
  /** Facts about other entities */
  otherFacts: ExtractedFact[];
  
  /** Source conversation/text */
  source: string;
  
  /** Processing time in ms */
  durationMs: number;
}
