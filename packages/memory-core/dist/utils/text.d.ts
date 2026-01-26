/**
 * Text processing utilities for the memory system
 */
/**
 * Options for text chunking
 */
export interface ChunkingOptions {
    /** Maximum chunk size in characters */
    maxChunkSize: number;
    /** Overlap between chunks in characters */
    overlap: number;
    /** Preferred separators in order of priority */
    separators?: string[];
}
/**
 * Default chunking options
 */
export declare const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions;
/**
 * Result of chunking operation
 */
export interface ChunkResult {
    /** The chunk text */
    text: string;
    /** Start index in original text */
    startIndex: number;
    /** End index in original text */
    endIndex: number;
    /** Chunk sequence number */
    sequence: number;
}
/**
 * Split text into chunks with overlap
 */
export declare function chunkText(text: string, options?: Partial<ChunkingOptions>): ChunkResult[];
/**
 * Normalize whitespace in text
 */
export declare function normalizeWhitespace(text: string): string;
/**
 * Extract sentences from text
 */
export declare function extractSentences(text: string): string[];
/**
 * Calculate rough token count (approximation)
 */
export declare function estimateTokenCount(text: string): number;
/**
 * Truncate text to approximate token limit
 */
export declare function truncateToTokens(text: string, maxTokens: number): string;
/**
 * Calculate Jaccard similarity between two texts (word-level)
 */
export declare function jaccardSimilarity(a: string, b: string): number;
/**
 * Remove common stopwords (English and Norwegian)
 */
export declare function removeStopwords(text: string): string;
/**
 * Sanitize text for safe storage (basic XSS prevention)
 */
export declare function sanitizeText(text: string): string;
/**
 * Detect the language of text (basic heuristic)
 */
export declare function detectLanguage(text: string): 'en' | 'no' | 'unknown';
//# sourceMappingURL=text.d.ts.map