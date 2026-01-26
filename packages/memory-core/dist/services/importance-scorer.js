import { DEFAULT_IMPORTANCE_WEIGHTS } from '../types/index.js';
/**
 * Implementation of the ImportanceScorer interface
 *
 * Calculates importance scores for memories based on multiple signals:
 * - Content features (entities, specificity, etc.)
 * - Source reliability
 * - Context relevance
 * - Usage patterns
 */
export class ImportanceScorerService {
    weights;
    constructor(weights = {}) {
        this.weights = { ...DEFAULT_IMPORTANCE_WEIGHTS, ...weights };
    }
    /**
     * Calculate importance score from factors
     */
    calculate(factors, weights) {
        const w = weights ?? this.weights;
        // Calculate content score
        const contentScore = this.calculateContentScore(factors.content, w);
        // Calculate source score
        const sourceScore = this.calculateSourceScore(factors.source, w);
        // Calculate context score
        const contextScore = this.calculateContextScore(factors.context, w);
        // Calculate usage score
        const usageScore = this.calculateUsageScore(factors.usage, w);
        // Combine scores with weights
        const rawScore = contentScore * 0.25 +
            sourceScore * 0.3 +
            contextScore * 0.25 +
            usageScore * 0.2;
        // Normalize to 0-1
        const score = Math.max(0, Math.min(1, rawScore));
        return {
            score,
            rawScore,
            breakdown: {
                contentScore,
                sourceScore,
                contextScore,
                usageScore,
            },
            calculatedAt: new Date(),
            weights: w,
        };
    }
    /**
     * Recalculate with updated usage data
     */
    recalculateWithUsage(currentScore, usage, weights) {
        const w = weights ?? this.weights;
        const usageScore = this.calculateUsageScore(usage, w);
        // Blend current score with usage contribution
        const newScore = currentScore * 0.7 + usageScore * w.usageMultiplier;
        return {
            score: Math.max(0, Math.min(1, newScore)),
            rawScore: newScore,
            breakdown: {
                contentScore: currentScore,
                sourceScore: 0,
                contextScore: 0,
                usageScore,
            },
            calculatedAt: new Date(),
            weights: w,
        };
    }
    /**
     * Extract importance factors from content
     *
     * This is a basic implementation - in production you'd use NLP/LLM
     */
    async extractFactors(content, type, source, metadata) {
        const hasEntities = this.detectEntities(content);
        const hasTemporal = this.detectTemporalInfo(content);
        const hasEmotional = this.detectEmotionalContent(content);
        const hasNumerical = this.detectNumericalContent(content);
        const specificity = this.calculateSpecificity(content);
        return {
            content: {
                hasEntities,
                hasTemporal,
                hasEmotional,
                hasNumerical,
                length: content.length,
                specificity,
            },
            source: {
                acquisitionMethod: source,
                explicit: source === 'explicit_statement',
                userEmphasis: this.detectUserEmphasis(content),
                repeated: false, // Would need external data
            },
            context: {
                typeWeight: this.weights.typeWeights[type] ?? 0.5,
                recencyDays: 0, // Fresh
                goalRelated: metadata?.['goalRelated'] === true,
                clustered: false, // Would need external data
            },
            usage: {
                retrievalFrequency: 0,
                usageRate: 0,
                feedbackScore: 0,
            },
        };
    }
    /**
     * Score content directly (convenience method)
     */
    async scoreContent(content, type, source, metadata) {
        const factors = await this.extractFactors(content, type, source, metadata);
        return this.calculate(factors);
    }
    // ==================== Private Helpers ====================
    calculateContentScore(content, weights) {
        let score = 0.3; // Base score
        if (content.hasEntities)
            score += weights.entityBonus;
        if (content.hasTemporal)
            score += weights.temporalBonus;
        if (content.hasEmotional)
            score += weights.emotionalBonus;
        if (content.hasNumerical)
            score += weights.numericalBonus;
        // Length bonus (diminishing returns)
        score += Math.min(0.1, content.length / 1000 * 0.1);
        // Specificity bonus
        score += content.specificity * weights.specificityMultiplier;
        return Math.min(1, score);
    }
    calculateSourceScore(source, weights) {
        let score = 0.4; // Base score
        // Explicit sources are more reliable
        if (source.explicit) {
            score *= weights.explicitSourceMultiplier;
        }
        // User emphasis is a strong signal
        if (source.userEmphasis) {
            score *= weights.userEmphasisMultiplier;
        }
        // Repeated information is more important
        if (source.repeated) {
            score *= weights.repetitionMultiplier;
        }
        // Acquisition method bonus
        switch (source.acquisitionMethod) {
            case 'explicit_statement':
                score += 0.2;
                break;
            case 'correction':
                score += 0.15;
                break;
            case 'observation':
                score += 0.1;
                break;
            case 'external_import':
                score += 0.05;
                break;
            case 'inference':
                // No bonus for inferred
                break;
        }
        return Math.min(1, score);
    }
    calculateContextScore(context, weights) {
        let score = context.typeWeight;
        // Recency decay
        const recencyPenalty = context.recencyDays * weights.recencyDecay;
        score = score * (1 - Math.min(0.5, recencyPenalty));
        // Goal-related bonus
        if (context.goalRelated) {
            score += weights.goalRelatedBonus;
        }
        // Clustering bonus (part of a topic)
        if (context.clustered) {
            score += 0.05;
        }
        return Math.min(1, score);
    }
    calculateUsageScore(usage, weights) {
        if (usage.retrievalFrequency === 0 && usage.usageRate === 0) {
            return 0.5; // Neutral for new memories
        }
        // Normalize retrieval frequency (assume max ~100)
        const retrievalNorm = Math.min(1, usage.retrievalFrequency / 100);
        // Usage rate is already 0-1
        const usageNorm = usage.usageRate;
        // Feedback score is -1 to 1, normalize to 0-1
        const feedbackNorm = (usage.feedbackScore + 1) / 2;
        const score = retrievalNorm * 0.3 +
            usageNorm * 0.4 +
            feedbackNorm * weights.feedbackMultiplier;
        return Math.min(1, score);
    }
    detectEntities(content) {
        // Simple heuristics - production would use NER
        const patterns = [
            /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b/, // Capitalized names
            /\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+\b/, // Titles
            /\b[A-Z]{2,}\b/, // Acronyms
            /\b\d{4}-\d{2}-\d{2}\b/, // Dates
            /\b\d+(?:\.\d+)?%\b/, // Percentages
            /\b(?:kr|NOK|USD|EUR)\s*[\d,.]+\b/i, // Currency
        ];
        return patterns.some(p => p.test(content));
    }
    detectTemporalInfo(content) {
        const temporalPatterns = [
            /\b(?:yesterday|today|tomorrow|last|next|this)\s+(?:week|month|year|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
            /\b(?:januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember)\b/i,
            /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/,
            /\b(?:i går|i dag|i morgen|neste|forrige)\b/i, // Norwegian
            /\b(?:kl\.|klokken)\s*\d{1,2}(?::\d{2})?\b/i,
        ];
        return temporalPatterns.some(p => p.test(content));
    }
    detectEmotionalContent(content) {
        const emotionalPatterns = [
            /\b(?:love|hate|happy|sad|angry|excited|worried|afraid|glad|upset)\b/i,
            /\b(?:elsker|hater|glad|lei|sint|spent|bekymret|redd)\b/i, // Norwegian
            /[!]{2,}/, // Multiple exclamation marks
            /\b(?:amazing|terrible|fantastic|horrible|wonderful|awful)\b/i,
        ];
        return emotionalPatterns.some(p => p.test(content));
    }
    detectNumericalContent(content) {
        // Look for meaningful numbers (not just random digits)
        const numericalPatterns = [
            /\b\d+(?:[,.\s]\d+)*\s*(?:kr|NOK|USD|EUR|%)\b/i,
            /\b(?:antall|number|quantity|amount|pris|cost):\s*\d+\b/i,
            /\b\d{1,3}(?:[,.\s]\d{3})+\b/, // Large numbers with separators
        ];
        return numericalPatterns.some(p => p.test(content));
    }
    calculateSpecificity(content) {
        const words = content.split(/\s+/).length;
        const sentences = content.split(/[.!?]+/).length;
        // More words per sentence = more detail
        const avgWordsPerSentence = words / Math.max(1, sentences);
        // Count specific indicators
        let specificityScore = 0;
        // Proper nouns
        const properNouns = (content.match(/\b[A-Z][a-z]+\b/g) ?? []).length;
        specificityScore += Math.min(0.2, properNouns * 0.02);
        // Numbers
        const numbers = (content.match(/\b\d+\b/g) ?? []).length;
        specificityScore += Math.min(0.15, numbers * 0.03);
        // Detail words
        const detailWords = [
            'specifically', 'exactly', 'precisely', 'in particular',
            'spesielt', 'nøyaktig', 'presist', // Norwegian
        ];
        if (detailWords.some(w => content.toLowerCase().includes(w))) {
            specificityScore += 0.1;
        }
        // Length bonus
        if (avgWordsPerSentence > 10)
            specificityScore += 0.1;
        if (avgWordsPerSentence > 15)
            specificityScore += 0.1;
        return Math.min(1, specificityScore);
    }
    detectUserEmphasis(content) {
        const emphasisPatterns = [
            /\b(?:remember|important|crucial|vital|critical|key|essential)\b/i,
            /\b(?:husk|viktig|avgjørende|kritisk|essensielt)\b/i, // Norwegian
            /\b(?:always|never|must|definitely)\b/i,
            /\b(?:alltid|aldri|må|definitivt)\b/i, // Norwegian
            /!!+/, // Multiple exclamation marks
        ];
        return emphasisPatterns.some(p => p.test(content));
    }
}
//# sourceMappingURL=importance-scorer.js.map