/**
 * Memory Tier System
 *
 * Inspired by human cognition - memories flow through tiers based on
 * importance, recency, and access patterns.
 *
 * Working → Short-Term → Long-Term
 *                    ↘ Episodic (full history archive)
 */
/**
 * Default tier configurations matching the architecture doc
 */
export const DEFAULT_TIER_CONFIGS = {
    working: {
        tier: 'working',
        ttlMs: null, // Session duration only
        maxMemories: 50,
        storage: 'cache',
        vectorIndexed: false,
        consolidationThreshold: 0.3,
    },
    'short-term': {
        tier: 'short-term',
        ttlMs: 72 * 60 * 60 * 1000, // 72 hours
        maxMemories: 200,
        storage: 'cache',
        vectorIndexed: true,
        consolidationThreshold: 0.5,
    },
    'long-term': {
        tier: 'long-term',
        ttlMs: null, // Permanent with decay
        maxMemories: 1000,
        storage: 'database',
        vectorIndexed: true,
        consolidationThreshold: 0.8,
    },
    episodic: {
        tier: 'episodic',
        ttlMs: null, // Per retention policy
        maxMemories: 10000,
        storage: 'archive',
        vectorIndexed: true,
        consolidationThreshold: 1.0, // Never promotes further
    },
};
export const TIER_TRANSITIONS = [
    { from: 'working', to: 'short-term', condition: 'promotion' },
    { from: 'short-term', to: 'long-term', condition: 'promotion' },
    { from: 'short-term', to: 'episodic', condition: 'archive' },
    { from: 'long-term', to: 'episodic', condition: 'archive' },
    { from: 'long-term', to: 'short-term', condition: 'demotion' },
];
/**
 * Get the next tier for promotion
 */
export function getPromotionTarget(tier) {
    switch (tier) {
        case 'working':
            return 'short-term';
        case 'short-term':
            return 'long-term';
        case 'long-term':
        case 'episodic':
            return null;
    }
}
/**
 * Get the next tier for demotion
 */
export function getDemotionTarget(tier) {
    switch (tier) {
        case 'long-term':
            return 'short-term';
        case 'short-term':
            return null; // Demote to deletion
        case 'working':
        case 'episodic':
            return null;
    }
}
//# sourceMappingURL=memory-tier.js.map