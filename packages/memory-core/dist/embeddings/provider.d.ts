/**
 * Result of an embedding operation
 */
export interface EmbeddingResult {
    /** The embedding vector */
    embedding: number[];
    /** Model used to generate the embedding */
    model: string;
    /** Token count consumed */
    tokenCount: number;
    /** Time taken in ms */
    durationMs: number;
}
/**
 * Result of batch embedding operation
 */
export interface BatchEmbeddingResult {
    /** Embeddings for each input text */
    embeddings: EmbeddingResult[];
    /** Total token count */
    totalTokens: number;
    /** Total time taken */
    durationMs: number;
}
/**
 * Configuration for embedding providers
 */
export interface EmbeddingProviderConfig {
    /** Model identifier (e.g., 'text-embedding-3-small') */
    model: string;
    /** Dimension of the output vectors */
    dimension: number;
    /** Maximum tokens per request */
    maxTokens: number;
    /** Maximum texts per batch request */
    maxBatchSize: number;
    /** API endpoint (if applicable) */
    endpoint?: string;
    /** API key (if applicable) */
    apiKey?: string;
    /** Request timeout in ms */
    timeoutMs?: number;
}
/**
 * Abstract interface for embedding providers
 *
 * Implementations can plug in:
 * - OpenAI text-embedding-3-small/large
 * - Cohere embed-multilingual-v3
 * - Local models via Ollama
 * - Azure OpenAI
 * - Custom embedding services
 */
export interface EmbeddingProvider {
    /**
     * Provider name for identification
     */
    readonly name: string;
    /**
     * Get the dimension of embeddings produced by this provider
     */
    readonly dimension: number;
    /**
     * Embed a single text
     */
    embed(text: string): Promise<EmbeddingResult>;
    /**
     * Embed multiple texts in a batch
     */
    embedBatch(texts: string[]): Promise<BatchEmbeddingResult>;
    /**
     * Calculate similarity between two embeddings
     */
    similarity(a: number[], b: number[]): number;
    /**
     * Check if the provider is available/healthy
     */
    healthCheck(): Promise<boolean>;
}
/**
 * Base class with common functionality for embedding providers
 */
export declare abstract class BaseEmbeddingProvider implements EmbeddingProvider {
    abstract readonly name: string;
    abstract readonly dimension: number;
    protected readonly config: EmbeddingProviderConfig;
    constructor(config: EmbeddingProviderConfig);
    abstract embed(text: string): Promise<EmbeddingResult>;
    abstract embedBatch(texts: string[]): Promise<BatchEmbeddingResult>;
    abstract healthCheck(): Promise<boolean>;
    /**
     * Cosine similarity between two vectors
     */
    similarity(a: number[], b: number[]): number;
    /**
     * Normalize a vector to unit length
     */
    protected normalize(vector: number[]): number[];
    /**
     * Truncate text to max tokens (simple approximation)
     */
    protected truncateToTokenLimit(text: string, maxTokens: number): string;
    /**
     * Chunk texts for batch processing
     */
    protected chunkForBatch(texts: string[]): string[][];
}
/**
 * Mock embedding provider for testing
 */
export declare class MockEmbeddingProvider extends BaseEmbeddingProvider {
    readonly name = "mock";
    readonly dimension: number;
    constructor(dimension?: number);
    embed(text: string): Promise<EmbeddingResult>;
    embedBatch(texts: string[]): Promise<BatchEmbeddingResult>;
    healthCheck(): Promise<boolean>;
    /**
     * Generate a deterministic mock embedding from text
     * Similar texts will have similar embeddings
     */
    private generateMockEmbedding;
}
//# sourceMappingURL=provider.d.ts.map