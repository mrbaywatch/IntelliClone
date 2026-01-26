import type {
  ExtractedFact,
  FactExtractionResult,
} from '../types/index.js';

/**
 * Configuration for fact extraction
 */
export interface FactExtractorConfig {
  /** Minimum confidence threshold */
  minConfidence: number;
  
  /** Maximum facts to extract per input */
  maxFacts: number;
  
  /** Include facts about entities other than the user */
  includeOtherFacts: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_FACT_EXTRACTOR_CONFIG: FactExtractorConfig = {
  minConfidence: 0.6,
  maxFacts: 10,
  includeOtherFacts: true,
};

/**
 * Interface for fact extraction implementations
 * 
 * In production, this would use an LLM for sophisticated extraction.
 * The default implementation uses pattern matching for common patterns.
 */
export interface FactExtractor {
  /**
   * Extract facts from text
   */
  extract(text: string): Promise<FactExtractionResult>;
  
  /**
   * Extract facts from a conversation
   */
  extractFromConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<FactExtractionResult>;
}

/**
 * Pattern-based fact extractor
 * 
 * Uses regex patterns to identify common fact structures.
 * Production implementations should use LLM-based extraction.
 */
export class PatternFactExtractor implements FactExtractor {
  private readonly config: FactExtractorConfig;
  
  constructor(config: Partial<FactExtractorConfig> = {}) {
    this.config = { ...DEFAULT_FACT_EXTRACTOR_CONFIG, ...config };
  }
  
  async extract(text: string): Promise<FactExtractionResult> {
    const startTime = Date.now();
    const facts: ExtractedFact[] = [];
    
    // Extract facts using various patterns
    facts.push(...this.extractWorkFacts(text));
    facts.push(...this.extractRelationshipFacts(text));
    facts.push(...this.extractPreferenceFacts(text));
    facts.push(...this.extractLocationFacts(text));
    facts.push(...this.extractSkillFacts(text));
    
    // Filter by confidence
    const filtered = facts.filter(f => f.confidence >= this.config.minConfidence);
    
    // Limit results
    const limited = filtered.slice(0, this.config.maxFacts);
    
    // Separate user and other facts
    const userFacts = limited.filter(f => f.aboutUser);
    const otherFacts = this.config.includeOtherFacts
      ? limited.filter(f => !f.aboutUser)
      : [];
    
    return {
      facts: limited,
      userFacts,
      otherFacts,
      source: text,
      durationMs: Date.now() - startTime,
    };
  }
  
  async extractFromConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<FactExtractionResult> {
    const startTime = Date.now();
    const allFacts: ExtractedFact[] = [];
    
    // Extract from user messages only (more reliable)
    for (const message of messages) {
      if (message.role === 'user') {
        const result = await this.extract(message.content);
        allFacts.push(...result.facts);
      }
    }
    
    // Deduplicate similar facts
    const unique = this.deduplicateFacts(allFacts);
    
    // Boost confidence for repeated facts
    const boosted = this.boostRepeatedFacts(allFacts, unique);
    
    const userFacts = boosted.filter(f => f.aboutUser);
    const otherFacts = this.config.includeOtherFacts
      ? boosted.filter(f => !f.aboutUser)
      : [];
    
    return {
      facts: boosted,
      userFacts,
      otherFacts,
      source: messages.map(m => m.content).join('\n'),
      durationMs: Date.now() - startTime,
    };
  }
  
  // ==================== Pattern Extractors ====================
  
  private extractWorkFacts(text: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    const lowerText = text.toLowerCase();
    
    // "I work at/for X" patterns
    const workPatterns = [
      /(?:i|jeg)\s+(?:work|works|jobber|arbeider)\s+(?:at|for|hos|i)\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
      /(?:i'm|i am|jeg er)\s+(?:working|employed)\s+(?:at|for|by)\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
      /my\s+(?:employer|company|workplace)\s+is\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
    ];
    
    for (const pattern of workPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const company = this.cleanEntity(match[1] ?? '');
        if (company && company.length > 2) {
          facts.push({
            subject: 'user',
            predicate: 'works_at',
            object: company,
            statement: `User works at ${company}`,
            confidence: 0.85,
            aboutUser: true,
            evidence: match[0],
          });
        }
      }
    }
    
    // Job title patterns
    const titlePatterns = [
      /(?:i|jeg)\s+(?:am|er)\s+(?:a|an|en)\s+([A-Za-zÆØÅæøå\s]+?)(?:\s+at|$|\.|,)/gi,
      /my\s+(?:job|role|position|title)\s+is\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
    ];
    
    for (const pattern of titlePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const title = this.cleanEntity(match[1] ?? '');
        if (title && title.length > 3 && this.looksLikeJobTitle(title)) {
          facts.push({
            subject: 'user',
            predicate: 'has_job_title',
            object: title,
            statement: `User is a ${title}`,
            confidence: 0.75,
            aboutUser: true,
            evidence: match[0],
          });
        }
      }
    }
    
    return facts;
  }
  
  private extractRelationshipFacts(text: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    
    // Family/relationship patterns
    const relationshipPatterns = [
      /my\s+(wife|husband|partner|spouse|girlfriend|boyfriend|kone|mann|samboer|kjæreste)\s+(?:is\s+)?(?:named\s+)?([A-Za-zÆØÅæøå]+)/gi,
      /my\s+(mother|father|mom|dad|brother|sister|son|daughter|mor|far|bror|søster|sønn|datter)\s+(?:is\s+)?(?:named\s+)?([A-Za-zÆØÅæøå]+)/gi,
      /my\s+(boss|manager|colleague|coworker|sjef|leder|kollega)\s+(?:is\s+)?(?:named\s+)?([A-Za-zÆØÅæøå]+)/gi,
    ];
    
    for (const pattern of relationshipPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const relationship = (match[1] ?? '').toLowerCase();
        const name = this.cleanEntity(match[2] ?? '');
        
        if (name && name.length > 1) {
          facts.push({
            subject: 'user',
            predicate: `has_${this.normalizeRelationship(relationship)}`,
            object: name,
            statement: `User's ${relationship} is named ${name}`,
            confidence: 0.8,
            aboutUser: true,
            evidence: match[0],
          });
        }
      }
    }
    
    return facts;
  }
  
  private extractPreferenceFacts(text: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    
    // Preference patterns
    const preferencePatterns = [
      /(?:i|jeg)\s+(?:prefer|like|love|enjoy|foretrekker|liker|elsker)\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$|over)/gi,
      /(?:i|jeg)\s+(?:don't like|dislike|hate|liker ikke|hater)\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
      /(?:i|jeg)\s+(?:always|usually|often|alltid|vanligvis|ofte)\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
    ];
    
    for (const pattern of preferencePatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const preference = this.cleanEntity(match[1] ?? '');
        const isNegative = /don't|dislike|hate|ikke|hater/i.test(match[0]);
        
        if (preference && preference.length > 2) {
          facts.push({
            subject: 'user',
            predicate: isNegative ? 'dislikes' : 'prefers',
            object: preference,
            statement: `User ${isNegative ? 'dislikes' : 'prefers'} ${preference}`,
            confidence: 0.7,
            aboutUser: true,
            evidence: match[0],
          });
        }
      }
    }
    
    return facts;
  }
  
  private extractLocationFacts(text: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    
    // Location patterns
    const locationPatterns = [
      /(?:i|jeg)\s+(?:live|am from|come from|bor|er fra|kommer fra)\s+(?:in\s+)?([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
      /my\s+(?:home|house|apartment|office)\s+is\s+in\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
    ];
    
    for (const pattern of locationPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const location = this.cleanEntity(match[1] ?? '');
        if (location && location.length > 2) {
          const predicate = /from|fra/.test(match[0])
            ? 'is_from'
            : 'lives_in';
          
          facts.push({
            subject: 'user',
            predicate,
            object: location,
            statement: `User ${predicate.replace('_', ' ')} ${location}`,
            confidence: 0.75,
            aboutUser: true,
            evidence: match[0],
          });
        }
      }
    }
    
    return facts;
  }
  
  private extractSkillFacts(text: string): ExtractedFact[] {
    const facts: ExtractedFact[] = [];
    
    // Skill patterns
    const skillPatterns = [
      /(?:i|jeg)\s+(?:know|can|am good at|am skilled in|kan|er flink til)\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
      /(?:i|jeg)\s+(?:have experience with|am experienced in|har erfaring med)\s+([A-Za-zÆØÅæøå\s]+?)(?:\.|,|$)/gi,
      /(?:i|jeg)\s+(?:speak|snakker)\s+([A-Za-zÆØÅæøå]+)(?:\.|,|$)/gi,
    ];
    
    for (const pattern of skillPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const skill = this.cleanEntity(match[1] ?? '');
        if (skill && skill.length > 2) {
          const isLanguage = /speak|snakker/i.test(match[0]);
          
          facts.push({
            subject: 'user',
            predicate: isLanguage ? 'speaks' : 'has_skill',
            object: skill,
            statement: `User ${isLanguage ? 'speaks' : 'knows'} ${skill}`,
            confidence: 0.7,
            aboutUser: true,
            evidence: match[0],
          });
        }
      }
    }
    
    return facts;
  }
  
  // ==================== Helpers ====================
  
  private cleanEntity(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\sÆØÅæøå-]/g, '');
  }
  
  private looksLikeJobTitle(text: string): boolean {
    const jobIndicators = [
      'manager', 'director', 'engineer', 'developer', 'designer',
      'analyst', 'consultant', 'specialist', 'coordinator', 'assistant',
      'leder', 'rådgiver', 'konsulent', 'ingeniør', 'utvikler',
    ];
    
    const lowerText = text.toLowerCase();
    return jobIndicators.some(indicator => lowerText.includes(indicator));
  }
  
  private normalizeRelationship(rel: string): string {
    const mappings: Record<string, string> = {
      wife: 'spouse',
      husband: 'spouse',
      partner: 'spouse',
      kone: 'spouse',
      mann: 'spouse',
      samboer: 'spouse',
      girlfriend: 'partner',
      boyfriend: 'partner',
      kjæreste: 'partner',
      mother: 'parent',
      father: 'parent',
      mom: 'parent',
      dad: 'parent',
      mor: 'parent',
      far: 'parent',
      brother: 'sibling',
      sister: 'sibling',
      bror: 'sibling',
      søster: 'sibling',
      son: 'child',
      daughter: 'child',
      sønn: 'child',
      datter: 'child',
      boss: 'manager',
      manager: 'manager',
      sjef: 'manager',
      leder: 'manager',
      colleague: 'colleague',
      coworker: 'colleague',
      kollega: 'colleague',
    };
    
    return mappings[rel] ?? rel;
  }
  
  private deduplicateFacts(facts: ExtractedFact[]): ExtractedFact[] {
    const seen = new Map<string, ExtractedFact>();
    
    for (const fact of facts) {
      const key = `${fact.subject}:${fact.predicate}:${fact.object.toLowerCase()}`;
      if (!seen.has(key) || (seen.get(key)!.confidence < fact.confidence)) {
        seen.set(key, fact);
      }
    }
    
    return Array.from(seen.values());
  }
  
  private boostRepeatedFacts(
    allFacts: ExtractedFact[],
    uniqueFacts: ExtractedFact[]
  ): ExtractedFact[] {
    const counts = new Map<string, number>();
    
    for (const fact of allFacts) {
      const key = `${fact.subject}:${fact.predicate}:${fact.object.toLowerCase()}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    
    return uniqueFacts.map(fact => {
      const key = `${fact.subject}:${fact.predicate}:${fact.object.toLowerCase()}`;
      const count = counts.get(key) ?? 1;
      
      // Boost confidence for repeated facts (max +0.15)
      const boost = Math.min(0.15, (count - 1) * 0.05);
      
      return {
        ...fact,
        confidence: Math.min(1, fact.confidence + boost),
      };
    });
  }
}
