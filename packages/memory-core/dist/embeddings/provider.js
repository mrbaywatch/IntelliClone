/**
 * Base class with common functionality for embedding providers
 */
export class BaseEmbeddingProvider {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Cosine similarity between two vectors
     */
    similarity(a, b) {
        if (a.length !== b.length) {
            throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        const denominator = Math.sqrt(normA) * Math.sqrt(normB);
        if (denominator === 0)
            return 0;
        return dotProduct / denominator;
    }
    /**
     * Normalize a vector to unit length
     */
    normalize(vector) {
        const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
        if (magnitude === 0)
            return vector;
        return vector.map(v => v / magnitude);
    }
    /**
     * Truncate text to max tokens (simple approximation)
     */
    truncateToTokenLimit(text, maxTokens) {
        // Rough approximation: 4 chars per token for English
        const maxChars = maxTokens * 4;
        if (text.length <= maxChars)
            return text;
        return text.slice(0, maxChars);
    }
    /**
     * Chunk texts for batch processing
     */
    chunkForBatch(texts) {
        const chunks = [];
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
    name = 'mock';
    dimension;
    constructor(dimension = 1536) {
        super({
            model: 'mock',
            dimension,
            maxTokens: 8192,
            maxBatchSize: 100,
        });
        this.dimension = dimension;
    }
    async embed(text) {
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
    async embedBatch(texts) {
        const start = Date.now();
        const embeddings = texts.map(text => ({
            embedding: this.generateMockEmbedding(text),
            model: 'mock',
            tokenCount: Math.ceil(text.length / 4),
            durationMs: 1,
        }));
        return {
            embeddings,
            totalTokens: embeddings.reduce((sum, e) => sum + e.tokenCount, 0),
            durationMs: Date.now() - start,
        };
    }
    async healthCheck() {
        return true;
    }
    /**
     * Generate a deterministic mock embedding from text
     * Similar texts will have similar embeddings
     */
    generateMockEmbedding(text) {
        const embedding = new Array(this.dimension).fill(0);
        // Use text hash to generate deterministic values
        const words = text.toLowerCase().split(/\s+/);
        for (let i = 0; i < words.length; i++) {
            const word = words[i] ?? '';
            for (let j = 0; j < word.length; j++) {
                const charCode = word.charCodeAt(j);
                const idx = (charCode * (i + 1) * (j + 1)) % this.dimension;
                embedding[idx] = (embedding[idx] + charCode / 255) / 2;
            }
        }
        // Normalize
        return this.normalize(embedding);
    }
}
//# sourceMappingURL=provider.js.map