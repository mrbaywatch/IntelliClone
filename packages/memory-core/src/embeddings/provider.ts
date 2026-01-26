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
export abstract class BaseEmbeddingProvider implements EmbeddingProvider {
  abstract readonly name: string;
  abstract readonly dimension: number;
  
  protected readonly config: EmbeddingProviderConfig;
  
  constructor(config: EmbeddingProviderConfig) {
    this.config = config;
  }
  
  abstract embed(text: string): Promise<EmbeddingResult>;
  abstract embedBatch(texts: string[]): Promise<BatchEmbeddingResult>;
  abstract healthCheck(): Promise<boolean>;
  
  /**
   * Cosine similarity between two vectors
   */
  similarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
    }
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i]! * b[i]!;
      normA += a[i]! * a[i]!;
      normB += b[i]! * b[i]!;
    }
    
    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) return 0;
    
    return dotProduct / denominator;
  }
  
  /**
   * Normalize a vector to unit length
   */
  protected normalize(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return vector;
    return vector.map(v => v / magnitude);
  }
  
  /**
   * Truncate text to max tokens (simple approximation)
   */
  protected truncateToTokenLimit(text: string, maxTokens: number): string {
    // Rough approximation: 4 chars per token for English
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars);
  }
  
  /**
   * Chunk texts for batch processing
   */
  protected chunkForBatch(texts: string[]): string[][] {
    const chunks: string[][] = [];
    for (let i = 0; i < texts.length; i += this.config.maxBatchSize) {
      chunks.push(texts.slice(i, i + this.config.maxBatchSize));
    }
    return chunks;
  }
}

/**
 * Mock embedding provider for testing
 */
export class MockEmbeddingProvider extends BaseEmbeddingProvider {
  readonly name = 'mock';
  readonly dimension: number;
  
  constructor(dimension: number = 1536) {
    super({
      model: 'mock',
      dimension,
      maxTokens: 8192,
      maxBatchSize: 100,
    });
    this.dimension = dimension;
  }
  
  async embed(text: string): Promise<EmbeddingResult> {
    const start = Date.now();
    
    // Generate deterministic mock embedding based on text
    const embedding = this.generateMockEmbedding(text);
    
    return {
      embedding,
      model: 'mock',
      tokenCount: Math.ceil(text.length / 4),
      durationMs: Date.now() - start,
    };
  }
  
  async embedBatch(texts: string[]): Promise<BatchEmbeddingResult> {
    const start = Date.now();
    
    const embeddings = texts.map(text => ({
      embedding: this.generateMockEmbedding(text),
      model: 'mock' as const,
      tokenCount: Math.ceil(text.length / 4),
      durationMs: 1,
    }));
    
    return {
      embeddings,
      totalTokens: embeddings.reduce((sum, e) => sum + e.tokenCount, 0),
      durationMs: Date.now() - start,
    };
  }
  
  async healthCheck(): Promise<boolean> {
    return true;
  }
  
  /**
   * Generate a deterministic mock embedding from text
   * Similar texts will have similar embeddings
   */
  private generateMockEmbedding(text: string): number[] {
    const embedding = new Array(this.dimension).fill(0);
    
    // Use text hash to generate deterministic values
    const words = text.toLowerCase().split(/\s+/);
    
    for (let i = 0; i < words.length; i++) {
      const word = words[i] ?? '';
      for (let j = 0; j < word.length; j++) {
        const charCode = word.charCodeAt(j);
        const idx = (charCode * (i + 1) * (j + 1)) % this.dimension;
        embedding[idx] = (embedding[idx]! + charCode / 255) / 2;
      }
    }
    
    // Normalize
    return this.normalize(embedding);
  }
}
