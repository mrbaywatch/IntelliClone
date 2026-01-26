import type { StreamCallbacks, StreamChunk, TokenUsage } from '../types/index.js';
/**
 * Stream handler for managing streaming responses
 */
export declare class StreamHandler {
    private chunks;
    private usage;
    private error;
    private isComplete;
    private callbacks;
    constructor(callbacks?: StreamCallbacks);
    /**
     * Process a stream chunk
     */
    processChunk(chunk: StreamChunk): void;
    /**
     * Get the accumulated content
     */
    getContent(): string;
    /**
     * Get the token usage
     */
    getUsage(): TokenUsage | null;
    /**
     * Check if streaming completed successfully
     */
    isSuccess(): boolean;
    /**
     * Get any error that occurred
     */
    getError(): Error | null;
    /**
     * Reset the handler for reuse
     */
    reset(): void;
}
/**
 * Transform an async generator into a ReadableStream (for API responses)
 */
export declare function streamToReadableStream(generator: AsyncGenerator<StreamChunk>): ReadableStream<Uint8Array>;
/**
 * Transform an async generator into Server-Sent Events format
 */
export declare function streamToSSE(generator: AsyncGenerator<StreamChunk>): ReadableStream<Uint8Array>;
/**
 * Collect all chunks from a stream into a single response
 */
export declare function collectStream(generator: AsyncGenerator<StreamChunk>, callbacks?: StreamCallbacks): Promise<{
    content: string;
    usage: TokenUsage | null;
    error: Error | null;
}>;
/**
 * Create a delayed stream that batches tokens for smoother display
 */
export declare function createDelayedStream(generator: AsyncGenerator<StreamChunk>, delayMs?: number): AsyncGenerator<StreamChunk>;
/**
 * Create a buffered stream that emits complete words/sentences
 */
export declare function createBufferedStream(generator: AsyncGenerator<StreamChunk>, bufferBy?: 'word' | 'sentence'): AsyncGenerator<StreamChunk>;
/**
 * Wrap callbacks to track timing
 */
export declare function createTimedCallbacks(callbacks: StreamCallbacks): StreamCallbacks & {
    getMetrics: () => StreamMetrics;
};
export interface StreamMetrics {
    totalTimeMs: number;
    timeToFirstTokenMs: number | null;
    tokenCount: number;
    tokensPerSecond: number;
}
//# sourceMappingURL=handler.d.ts.map