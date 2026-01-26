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
 * The four tiers of the memory hierarchy
 */
export type MemoryTier = 'working' | 'short-term' | 'long-term' | 'episodic';
/**
 * Configuration for each memory tier
 */
export interface MemoryTierConfig {
    /** Tier identifier */
    tier: MemoryTier;
    /** Time-to-live in milliseconds (null = permanent) */
    ttlMs: number | null;
    /** Maximum number of memories in this tier per user */
    maxMemories: number;
    /** Storage backend for this tier */
    storage: 'cache' | 'database' | 'archive';
    /** Whether memories in this tier are vector-indexed */
    vectorIndexed: boolean;
    /** Consolidation threshold - memories with scores above this get promoted */
    consolidationThreshold: number;
}
/**
 * Default tier configurations matching the architecture doc
 */
export declare const DEFAULT_TIER_CONFIGS: Record<MemoryTier, MemoryTierConfig>;
/**
 * Transition rules between tiers
 */
export interface TierTransition {
    from: MemoryTier;
    to: MemoryTier;
    condition: 'promotion' | 'demotion' | 'archive';
}
export declare const TIER_TRANSITIONS: TierTransition[];
/**
 * Get the next tier for promotion
 */
export declare function getPromotionTarget(tier: MemoryTier): MemoryTier | null;
/**
 * Get the next tier for demotion
 */
export declare function getDemotionTarget(tier: MemoryTier): MemoryTier | null;
//# sourceMappingURL=memory-tier.d.ts.map