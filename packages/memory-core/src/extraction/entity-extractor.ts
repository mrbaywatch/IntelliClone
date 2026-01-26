import type {
  EntityType,
  ExtractedEntity,
  EntityExtractionResult,
  NorwegianEntityPatterns,
} from '../types/index.js';
import { NORWEGIAN_PATTERNS } from '../types/index.js';

/**
 * Configuration for entity extraction
 */
export interface EntityExtractorConfig {
  /** Minimum confidence for inclusion */
  minConfidence: number;
  
  /** Entity types to extract */
  entityTypes: EntityType[];
  
  /** Whether to normalize values */
  normalize: boolean;
  
  /** Norwegian-specific patterns */
  norwegianPatterns: NorwegianEntityPatterns;
}

/**
 * Default configuration
 */
export const DEFAULT_ENTITY_EXTRACTOR_CONFIG: EntityExtractorConfig = {
  minConfidence: 0.5,
  entityTypes: [
    'person', 'organization', 'location', 'date', 'time',
    'money', 'email', 'phone', 'url',
  ],
  normalize: true,
  norwegianPatterns: NORWEGIAN_PATTERNS,
};

/**
 * Interface for entity extraction
 */
export interface EntityExtractor {
  /**
   * Extract entities from text
   */
  extract(text: string): Promise<EntityExtractionResult>;
  
  /**
   * Extract entities of a specific type
   */
  extractType(text: string, type: EntityType): Promise<ExtractedEntity[]>;
}

/**
 * Pattern-based entity extractor
 * 
 * Handles common patterns for Norwegian and English text.
 * Production implementations should use NER models (e.g., spaCy, HuggingFace).
 */
export class PatternEntityExtractor implements EntityExtractor {
  private readonly config: EntityExtractorConfig;
  
  constructor(config: Partial<EntityExtractorConfig> = {}) {
    this.config = { ...DEFAULT_ENTITY_EXTRACTOR_CONFIG, ...config };
  }
  
  async extract(text: string): Promise<EntityExtractionResult> {
    const startTime = Date.now();
    const entities: ExtractedEntity[] = [];
    
    // Extract each entity type
    if (this.config.entityTypes.includes('email')) {
      entities.push(...this.extractEmails(text));
    }
    if (this.config.entityTypes.includes('phone')) {
      entities.push(...this.extractPhoneNumbers(text));
    }
    if (this.config.entityTypes.includes('url')) {
      entities.push(...this.extractUrls(text));
    }
    if (this.config.entityTypes.includes('date')) {
      entities.push(...this.extractDates(text));
    }
    if (this.config.entityTypes.includes('time')) {
      entities.push(...this.extractTimes(text));
    }
    if (this.config.entityTypes.includes('money')) {
      entities.push(...this.extractMoney(text));
    }
    if (this.config.entityTypes.includes('person')) {
      entities.push(...this.extractPersons(text));
    }
    if (this.config.entityTypes.includes('organization')) {
      entities.push(...this.extractOrganizations(text));
    }
    
    // Filter by confidence
    const filtered = entities.filter(e => e.confidence >= this.config.minConfidence);
    
    // Remove overlapping entities (keep higher confidence)
    const deduplicated = this.removeOverlapping(filtered);
    
    // Group by type
    const byType: Partial<Record<EntityType, ExtractedEntity[]>> = {};
    for (const entity of deduplicated) {
      if (!byType[entity.type]) {
        byType[entity.type] = [];
      }
      byType[entity.type]!.push(entity);
    }
    
    return {
      entities: deduplicated,
      byType,
      sourceText: text,
      durationMs: Date.now() - startTime,
    };
  }
  
  async extractType(text: string, type: EntityType): Promise<ExtractedEntity[]> {
    const result = await this.extract(text);
    return result.byType[type] ?? [];
  }
  
  // ==================== Type-Specific Extractors ====================
  
  private extractEmails(text: string): ExtractedEntity[] {
    const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return this.extractByPattern(text, pattern, 'email', 0.95);
  }
  
  private extractPhoneNumbers(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Norwegian phone numbers
    const norwegianPattern = this.config.norwegianPatterns.phoneNumber;
    entities.push(...this.extractByPattern(text, norwegianPattern, 'phone', 0.85));
    
    // International format
    const internationalPattern = /\+\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g;
    entities.push(...this.extractByPattern(text, internationalPattern, 'phone', 0.8));
    
    return entities;
  }
  
  private extractUrls(text: string): ExtractedEntity[] {
    const pattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
    return this.extractByPattern(text, pattern, 'url', 0.95);
  }
  
  private extractDates(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Norwegian date formats
    for (const pattern of this.config.norwegianPatterns.dateFormats) {
      entities.push(...this.extractByPattern(text, pattern, 'date', 0.8, this.normalizeDate.bind(this)));
    }
    
    // Month names (Norwegian and English)
    const monthPattern = /\b(\d{1,2})\.?\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember|january|february|march|may|june|july|august|september|october|november|december)\s*(\d{4})?\b/gi;
    entities.push(...this.extractByPattern(text, monthPattern, 'date', 0.85));
    
    // Relative dates
    const relativePattern = /\b(i dag|i morgen|i går|neste uke|forrige uke|today|tomorrow|yesterday|next week|last week)\b/gi;
    entities.push(...this.extractByPattern(text, relativePattern, 'date', 0.7));
    
    return entities;
  }
  
  private extractTimes(text: string): ExtractedEntity[] {
    const patterns = [
      /\b(?:kl\.?|klokken|at)\s*(\d{1,2})(?::(\d{2}))?\b/gi,
      /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g,
      /\b(\d{1,2})\s*(?:am|pm)\b/gi,
    ];
    
    const entities: ExtractedEntity[] = [];
    for (const pattern of patterns) {
      entities.push(...this.extractByPattern(text, pattern, 'time', 0.75));
    }
    
    return entities;
  }
  
  private extractMoney(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Norwegian currency
    entities.push(
      ...this.extractByPattern(text, this.config.norwegianPatterns.currency, 'money', 0.85)
    );
    
    // Other currencies
    const currencyPatterns = [
      /\$[\d,]+(?:\.\d{2})?/g,
      /€[\d,]+(?:\.\d{2})?/g,
      /[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP|SEK|DKK)/gi,
    ];
    
    for (const pattern of currencyPatterns) {
      entities.push(...this.extractByPattern(text, pattern, 'money', 0.8));
    }
    
    return entities;
  }
  
  private extractPersons(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Capitalized name patterns
    // Two or more capitalized words in a row
    const namePattern = /\b([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)+)\b/g;
    entities.push(...this.extractByPattern(text, namePattern, 'person', 0.6));
    
    // Titles followed by names
    const titledPattern = /\b(?:Mr|Mrs|Ms|Dr|Prof|Herr|Fru|Frk|Doktor|Professor)\.?\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)*)\b/g;
    entities.push(...this.extractByPattern(text, titledPattern, 'person', 0.8));
    
    return entities;
  }
  
  private extractOrganizations(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    
    // Norwegian company suffixes
    const companySuffixes = this.config.norwegianPatterns.companySuffixes.join('|');
    const companyPattern = new RegExp(
      `\\b([A-ZÆØÅ][a-zæøåA-ZÆØÅ\\s]+)\\s+(${companySuffixes})\\b`,
      'g'
    );
    entities.push(...this.extractByPattern(text, companyPattern, 'organization', 0.85));
    
    // Norwegian org numbers
    const orgNumberPattern = /\b(org\.?\s*(?:nr\.?|nummer))?\s*(\d{9})\b/gi;
    const matches = text.matchAll(orgNumberPattern);
    for (const match of matches) {
      if (match[2]) {
        entities.push({
          type: 'organization',
          value: match[2],
          normalized: match[2].replace(/\s/g, ''),
          startIndex: match.index!,
          endIndex: match.index! + match[0].length,
          confidence: 0.75,
          metadata: { isOrgNumber: true },
        });
      }
    }
    
    return entities;
  }
  
  // ==================== Helpers ====================
  
  private extractByPattern(
    text: string,
    pattern: RegExp,
    type: EntityType,
    confidence: number,
    normalizer?: (value: string) => string
  ): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const matches = text.matchAll(pattern);
    
    for (const match of matches) {
      const value = match[0];
      entities.push({
        type,
        value,
        normalized: this.config.normalize && normalizer
          ? normalizer(value)
          : undefined,
        startIndex: match.index!,
        endIndex: match.index! + value.length,
        confidence,
      });
    }
    
    return entities;
  }
  
  private normalizeDate(dateStr: string): string {
    // Try to parse and normalize to ISO format
    const cleaned = dateStr.trim();
    
    // DD.MM.YYYY or DD/MM/YYYY
    const euroMatch = cleaned.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
    if (euroMatch) {
      const day = euroMatch[1]!.padStart(2, '0');
      const month = euroMatch[2]!.padStart(2, '0');
      let year = euroMatch[3]!;
      if (year.length === 2) {
        year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
      }
      return `${year}-${month}-${day}`;
    }
    
    return cleaned;
  }
  
  private removeOverlapping(entities: ExtractedEntity[]): ExtractedEntity[] {
    // Sort by start index, then by length (longer first)
    const sorted = [...entities].sort((a, b) => {
      if (a.startIndex !== b.startIndex) {
        return a.startIndex - b.startIndex;
      }
      return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
    });
    
    const result: ExtractedEntity[] = [];
    let lastEnd = -1;
    
    for (const entity of sorted) {
      // Skip if this entity overlaps with the previous one
      if (entity.startIndex < lastEnd) {
        // Check if this one has higher confidence
        const prev = result[result.length - 1];
        if (prev && entity.confidence > prev.confidence) {
          result.pop();
          result.push(entity);
          lastEnd = entity.endIndex;
        }
        continue;
      }
      
      result.push(entity);
      lastEnd = entity.endIndex;
    }
    
    return result;
  }
}
