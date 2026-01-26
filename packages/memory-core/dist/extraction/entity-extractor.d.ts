import type { EntityType, ExtractedEntity, EntityExtractionResult, NorwegianEntityPatterns } from '../types/index.js';
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
export declare const DEFAULT_ENTITY_EXTRACTOR_CONFIG: EntityExtractorConfig;
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
export declare class PatternEntityExtractor implements EntityExtractor {
    private readonly config;
    constructor(config?: Partial<EntityExtractorConfig>);
    extract(text: string): Promise<EntityExtractionResult>;
    extractType(text: string, type: EntityType): Promise<ExtractedEntity[]>;
    private extractEmails;
    private extractPhoneNumbers;
    private extractUrls;
    private extractDates;
    private extractTimes;
    private extractMoney;
    private extractPersons;
    private extractOrganizations;
    private extractByPattern;
    private normalizeDate;
    private removeOverlapping;
}
//# sourceMappingURL=entity-extractor.d.ts.map