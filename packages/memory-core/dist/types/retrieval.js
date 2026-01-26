/**
 * Default retrieval options
 */
export const DEFAULT_RETRIEVAL_OPTIONS = {
    limit: 20,
    similarityThreshold: 0.5,
    types: [],
    tiers: ['short-term', 'long-term'],
    tags: [],
    maxAgeDays: 365,
    recencyBoost: 0.3,
    importanceBoost: 0.4,
    diversitySampling: true,
    diversityThreshold: 0.8,
    includeDecaying: false,
    excludeIds: [],
};
//# sourceMappingURL=retrieval.js.map