import type { MemoryType, MemorySource } from './memory.js';
/**
 * Factors that contribute to importance scoring
 */
export interface ImportanceFactors {
    /** Content-based signals */
    content: {
        /** Contains named entities (people, companies, dates) */
        hasEntities: boolean;
        /** Contains temporal information */
        hasTemporal: boolean;
        /** Contains emotional/sentiment markers */
        hasEmotional: boolean;
        /** Contains numerical data */
        hasNumerical: boolean;
        /** Content length (longer = potentially more important) */
        length: number;
        /** Specificity score (specific > vague) */
        specificity: number;
    };
    /** Source-based signals */
    source: {
        /** How the memory was acquired */
        acquisitionMethod: MemorySource;
        /** Was it explicitly stated by user? */
        explicit: boolean;
        /** User emphasis (e.g., "importantly", "remember this") */
        userEmphasis: boolean;
        /** Repeated across conversations */
        repeated: boolean;
    };
    /** Context-based signals */
    context: {
        /** Memory type baseline importance */
        typeWeight: number;
        /** Recency (how recent is the source) */
        recencyDays: number;
        /** Related to user's stated goals */
        goalRelated: boolean;
        /** Part of a larger topic cluster */
        clustered: boolean;
    };
    /** Usage-based signals (populated over time) */
    usage: {
        /** How often this memory is retrieved */
        retrievalFrequency: number;
        /** How often it's actually used in responses */
        usageRate: number;
        /** User feedback (positive/negative) */
        feedbackScore: number;
    };
}
/**
 * Weights for importance calculation
 */
export interface ImportanceWeights {
    entityBonus: number;
    temporalBonus: number;
    emotionalBonus: number;
    numericalBonus: number;
    specificityMultiplier: number;
    explicitSourceMultiplier: number;
    userEmphasisMultiplier: number;
    repetitionMultiplier: number;
    typeWeights: Record<MemoryType, number>;
    recencyDecay: number;
    goalRelatedBonus: number;
    usageMultiplier: number;
    feedbackMultiplier: number;
}
/**
 * Default importance weights
 */
export declare const DEFAULT_IMPORTANCE_WEIGHTS: ImportanceWeights;
/**
 * Result of importance calculation
 */
export interface ImportanceScore {
    /** Final normalized score (0-1) */
    score: number;
    /** Raw score before normalization */
    rawScore: number;
    /** Breakdown of contributing factors */
    breakdown: {
        contentScore: number;
        sourceScore: number;
        contextScore: number;
        usageScore: number;
    };
    /** When the score was calculated */
    calculatedAt: Date;
    /** Weights used for calculation */
    weights: ImportanceWeights;
}
/**
 * Thresholds for importance-based actions
 */
export interface ImportanceThresholds {
    /** Minimum score to be stored at all */
    minimumStore: number;
    /** Score needed for promotion to long-term */
    longTermPromotion: number;
    /** Score below which decay accelerates */
    acceleratedDecay: number;
    /** Score above which memory is protected from decay */
    decayProtection: number;
    /** Priority tiers for retrieval */
    retrievalPriority: {
        high: number;
        medium: number;
        low: number;
    };
}
/**
 * Default importance thresholds
 */
export declare const DEFAULT_IMPORTANCE_THRESHOLDS: ImportanceThresholds;
/**
 * Service interface for importance scoring
 */
export interface ImportanceScorer {
    /**
     * Calculate importance score for a memory
     */
    calculate(factors: ImportanceFactors, weights?: ImportanceWeights): ImportanceScore;
    /**
     * Recalculate score with updated usage data
     */
    recalculateWithUsage(currentScore: number, usage: ImportanceFactors['usage'], weights?: ImportanceWeights): ImportanceScore;
    /**
     * Extract importance factors from raw content
     */
    extractFactors(content: string, type: MemoryType, source: MemorySource, metadata?: Record<string, unknown>): Promise<ImportanceFactors>;
}
//# sourceMappingURL=importance.d.ts.map