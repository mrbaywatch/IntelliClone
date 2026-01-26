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
export const DEFAULT_IMPORTANCE_WEIGHTS: ImportanceWeights = {
  entityBonus: 0.1,
  temporalBonus: 0.08,
  emotionalBonus: 0.05,
  numericalBonus: 0.06,
  specificityMultiplier: 0.15,
  explicitSourceMultiplier: 1.3,
  userEmphasisMultiplier: 1.5,
  repetitionMultiplier: 1.2,
  typeWeights: {
    fact: 0.6,
    preference: 0.7,
    event: 0.5,
    relationship: 0.65,
    skill: 0.55,
    goal: 0.8,
    context: 0.4,
    feedback: 0.45,
  },
  recencyDecay: 0.02,
  goalRelatedBonus: 0.15,
  usageMultiplier: 0.3,
  feedbackMultiplier: 0.2,
};

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
export const DEFAULT_IMPORTANCE_THRESHOLDS: ImportanceThresholds = {
  minimumStore: 0.1,
  longTermPromotion: 0.6,
  acceleratedDecay: 0.3,
  decayProtection: 0.9,
  retrievalPriority: {
    high: 0.7,
    medium: 0.4,
    low: 0.2,
  },
};

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
  recalculateWithUsage(
    currentScore: number,
    usage: ImportanceFactors['usage'],
    weights?: ImportanceWeights
  ): ImportanceScore;
  
  /**
   * Extract importance factors from raw content
   */
  extractFactors(
    content: string,
    type: MemoryType,
    source: MemorySource,
    metadata?: Record<string, unknown>
  ): Promise<ImportanceFactors>;
}
