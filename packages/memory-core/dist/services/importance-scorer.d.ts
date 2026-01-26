import type { ImportanceFactors, ImportanceWeights, ImportanceScore, ImportanceScorer, MemoryType, MemorySource } from '../types/index.js';
/**
 * Implementation of the ImportanceScorer interface
 *
 * Calculates importance scores for memories based on multiple signals:
 * - Content features (entities, specificity, etc.)
 * - Source reliability
 * - Context relevance
 * - Usage patterns
 */
export declare class ImportanceScorerService implements ImportanceScorer {
    private readonly weights;
    constructor(weights?: Partial<ImportanceWeights>);
    /**
     * Calculate importance score from factors
     */
    calculate(factors: ImportanceFactors, weights?: ImportanceWeights): ImportanceScore;
    /**
     * Recalculate with updated usage data
     */
    recalculateWithUsage(currentScore: number, usage: ImportanceFactors['usage'], weights?: ImportanceWeights): ImportanceScore;
    /**
     * Extract importance factors from content
     *
     * This is a basic implementation - in production you'd use NLP/LLM
     */
    extractFactors(content: string, type: MemoryType, source: MemorySource, metadata?: Record<string, unknown>): Promise<ImportanceFactors>;
    /**
     * Score content directly (convenience method)
     */
    scoreContent(content: string, type: MemoryType, source: MemorySource, metadata?: Record<string, unknown>): Promise<ImportanceScore>;
    private calculateContentScore;
    private calculateSourceScore;
    private calculateContextScore;
    private calculateUsageScore;
    private detectEntities;
    private detectTemporalInfo;
    private detectEmotionalContent;
    private detectNumericalContent;
    private calculateSpecificity;
    private detectUserEmphasis;
}
//# sourceMappingURL=importance-scorer.d.ts.map