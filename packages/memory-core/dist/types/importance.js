/**
 * Default importance weights
 */
export const DEFAULT_IMPORTANCE_WEIGHTS = {
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
 * Default importance thresholds
 */
export const DEFAULT_IMPORTANCE_THRESHOLDS = {
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
//# sourceMappingURL=importance.js.map