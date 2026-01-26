import type { FactExtractionResult } from '../types/index.js';
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
export declare const DEFAULT_FACT_EXTRACTOR_CONFIG: FactExtractorConfig;
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
    extractFromConversation(messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>): Promise<FactExtractionResult>;
}
/**
 * Pattern-based fact extractor
 *
 * Uses regex patterns to identify common fact structures.
 * Production implementations should use LLM-based extraction.
 */
export declare class PatternFactExtractor implements FactExtractor {
    private readonly config;
    constructor(config?: Partial<FactExtractorConfig>);
    extract(text: string): Promise<FactExtractionResult>;
    extractFromConversation(messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>): Promise<FactExtractionResult>;
    private extractWorkFacts;
    private extractRelationshipFacts;
    private extractPreferenceFacts;
    private extractLocationFacts;
    private extractSkillFacts;
    private cleanEntity;
    private looksLikeJobTitle;
    private normalizeRelationship;
    private deduplicateFacts;
    private boostRepeatedFacts;
}
//# sourceMappingURL=fact-extractor.d.ts.map