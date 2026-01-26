/**
 * Stream handler for managing streaming responses
 */
export class StreamHandler {
    chunks = [];
    usage = null;
    error = null;
    isComplete = false;
    callbacks;
    constructor(callbacks = {}) {
        this.callbacks = callbacks;
    }
    /**
     * Process a stream chunk
     */
    processChunk(chunk) {
        switch (chunk.type) {
            case 'text':
                if (chunk.content) {
                    this.chunks.push(chunk.content);
                    this.callbacks.onToken?.(chunk.content);
                }
                break;
            case 'done':
                this.isComplete = true;
                if (chunk.usage) {
                    this.usage = chunk.usage;
                }
                break;
            case 'error':
                if (chunk.error) {
                    this.error = chunk.error;
                    this.callbacks.onError?.(chunk.error);
                }
                break;
            case 'tool_call':
                // Handle tool calls if needed
                break;
        }
    }
    /**
     * Get the accumulated content
     */
    getContent() {
        return this.chunks.join('');
    }
    /**
     * Get the token usage
     */
    getUsage() {
        return this.usage;
    }
    /**
     * Check if streaming completed successfully
     */
    isSuccess() {
        return this.isComplete && !this.error;
    }
    /**
     * Get any error that occurred
     */
    getError() {
        return this.error;
    }
    /**
     * Reset the handler for reuse
     */
    reset() {
        this.chunks = [];
        this.usage = null;
        this.error = null;
        this.isComplete = false;
    }
}
/**
 * Transform an async generator into a ReadableStream (for API responses)
 */
export function streamToReadableStream(generator) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of generator) {
                    if (chunk.type === 'text' && chunk.content) {
                        controller.enqueue(encoder.encode(chunk.content));
                    }
                    else if (chunk.type === 'error') {
                        controller.error(chunk.error);
                        return;
                    }
                }
                controller.close();
            }
            catch (error) {
                controller.error(error);
            }
        },
    });
}
/**
 * Transform an async generator into Server-Sent Events format
 */
export function streamToSSE(generator) {
    const encoder = new TextEncoder();
    return new ReadableStream({
        async start(controller) {
            try {
                for await (const chunk of generator) {
                    const data = JSON.stringify(chunk);
                    const event = `data: ${data}\n\n`;
                    controller.enqueue(encoder.encode(event));
                    if (chunk.type === 'done' || chunk.type === 'error') {
                        break;
                    }
                }
                controller.enqueue(encoder.encode('data: [DONE]\n\n'));
                controller.close();
            }
            catch (error) {
                const errorData = JSON.stringify({
                    type: 'error',
                    error: error instanceof Error ? error.message : String(error),
                });
                controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
                controller.close();
            }
        },
    });
}
/**
 * Collect all chunks from a stream into a single response
 */
export async function collectStream(generator, callbacks) {
    const handler = new StreamHandler(callbacks);
    callbacks?.onStart?.();
    for await (const chunk of generator) {
        handler.processChunk(chunk);
    }
    return {
        content: handler.getContent(),
        usage: handler.getUsage(),
        error: handler.getError(),
    };
}
/**
 * Create a delayed stream that batches tokens for smoother display
 */
export async function* createDelayedStream(generator, delayMs = 20) {
    for await (const chunk of generator) {
        yield chunk;
        if (chunk.type === 'text') {
            await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
    }
}
/**
 * Create a buffered stream that emits complete words/sentences
 */
export async function* createBufferedStream(generator, bufferBy = 'word') {
    let buffer = '';
    const separator = bufferBy === 'word' ? /(\s+)/ : /([.!?]+\s*)/;
    for await (const chunk of generator) {
        if (chunk.type === 'text' && chunk.content) {
            buffer += chunk.content;
            const parts = buffer.split(separator);
            // Keep the last part in buffer (might be incomplete)
            buffer = parts.pop() || '';
            // Emit complete parts
            for (const part of parts) {
                if (part) {
                    yield { type: 'text', content: part };
                }
            }
        }
        else {
            // Flush buffer for non-text chunks
            if (buffer) {
                yield { type: 'text', content: buffer };
                buffer = '';
            }
            yield chunk;
        }
    }
    // Flush remaining buffer
    if (buffer) {
        yield { type: 'text', content: buffer };
    }
}
/**
 * Wrap callbacks to track timing
 */
export function createTimedCallbacks(callbacks) {
    let startTime;
    let firstTokenTime = null;
    let tokenCount = 0;
    return {
        onStart: () => {
            startTime = Date.now();
            callbacks.onStart?.();
        },
        onToken: (token) => {
            if (!firstTokenTime) {
                firstTokenTime = Date.now();
            }
            tokenCount++;
            callbacks.onToken?.(token);
        },
        onComplete: (response) => {
            callbacks.onComplete?.(response);
        },
        onError: (error) => {
            callbacks.onError?.(error);
        },
        getMetrics: () => ({
            totalTimeMs: Date.now() - startTime,
            timeToFirstTokenMs: firstTokenTime ? firstTokenTime - startTime : null,
            tokenCount,
            tokensPerSecond: tokenCount / ((Date.now() - startTime) / 1000),
        }),
    };
}
//# sourceMappingURL=handler.js.map