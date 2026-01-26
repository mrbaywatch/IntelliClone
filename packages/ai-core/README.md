# @kit/ai-core

LLM routing and AI operations shared across all Intelli products.

## Features

- **Multi-Provider Support**: OpenAI and Anthropic with unified interface
- **Intelligent Routing**: Automatically select the best model for each task
- **Prompt Management**: System prompt builder with context injection
- **Norwegian Language Support**: Built-in handling for Norwegian (Bokmål/Nynorsk)
- **Streaming**: Full streaming support with utilities for SSE and ReadableStream
- **Token Counting**: Estimate tokens and costs before requests
- **Rate Limiting**: Protect against API limits with sliding window algorithm

## Installation

```bash
pnpm add @kit/ai-core
```

## Quick Start

### Basic Usage

```typescript
import { modelRouter, createSystemPrompt } from '@kit/ai-core';

// Simple chat
const response = await modelRouter.chat({
  messages: [{ role: 'user', content: 'Hello!' }],
});

console.log(response.content);
```

### With System Prompt Builder

```typescript
import { modelRouter, createSystemPrompt } from '@kit/ai-core';

const systemPrompt = createSystemPrompt('You are a helpful fitness coach.')
  .withUser({ id: '123', name: 'Johannes', preferredLanguage: 'no' })
  .withNorwegianSupport()
  .withTone('friendly')
  .build();

const response = await modelRouter.chat({
  systemPrompt,
  messages: [{ role: 'user', content: 'Kan du lage en treningsplan?' }],
});
```

### Task-Based Routing

```typescript
import { modelRouter } from '@kit/ai-core';

// Automatically selects the best model for coding tasks
const response = await modelRouter.chat(
  { messages: [{ role: 'user', content: 'Write a React component' }] },
  'code', // Task type
  { tier: 'balanced' } // Preferences
);
```

### Streaming

```typescript
import { modelRouter, streamToSSE } from '@kit/ai-core';

// In an API route
export async function POST(req: Request) {
  const { messages } = await req.json();

  const stream = modelRouter.streamChatGenerator({ messages }, 'chat');
  
  return new Response(streamToSSE(stream), {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### With Callbacks

```typescript
import { modelRouter, createTimedCallbacks } from '@kit/ai-core';

const callbacks = createTimedCallbacks({
  onStart: () => console.log('Started...'),
  onToken: (token) => process.stdout.write(token),
  onComplete: (response) => console.log('\nDone!', response.usage),
});

await modelRouter.streamChat(
  { messages: [{ role: 'user', content: 'Tell me a story' }] },
  callbacks,
  'creative'
);

console.log('Metrics:', callbacks.getMetrics());
```

### Token Counting & Cost Estimation

```typescript
import { TokenCounter, formatCost, modelRouter } from '@kit/ai-core';

const model = modelRouter.selectModel('chat');
const messages = [{ role: 'user', content: 'Hello!' }];

// Check if content fits
const check = TokenCounter.checkContextLimit(messages, undefined, model);
console.log(`Fits: ${check.fits}, Remaining: ${check.remaining} tokens`);

// Estimate cost
const estimate = TokenCounter.estimateRequestCost(
  messages,
  'You are helpful.',
  500, // expected output tokens
  model
);
console.log(`Estimated cost: ${formatCost(estimate)}`);
```

### Rate Limiting

```typescript
import { RateLimiter, DEFAULT_RATE_LIMITS, withRetry } from '@kit/ai-core';

const limiter = new RateLimiter(DEFAULT_RATE_LIMITS.user_free);

// Check before request
const result = limiter.check(1000);
if (!result.allowed) {
  console.log(`Rate limited. Retry in ${result.retryAfterMs}ms`);
}

// Or use withRetry for automatic handling
const response = await withRetry(
  () => modelRouter.chat({ messages }),
  limiter,
  {
    maxRetries: 3,
    estimatedTokens: 1000,
    onRetry: (attempt, waitMs) => console.log(`Retry ${attempt} in ${waitMs}ms`),
  }
);
```

## Prompt Templates

```typescript
import { PromptTemplates, createProductPrompt } from '@kit/ai-core';

// Use built-in templates
const codePrompt = PromptTemplates.codeAssistant({
  languages: ['TypeScript', 'React'],
  framework: 'Next.js',
}).build();

// Product-specific prompts
const gymPrompt = createProductPrompt('intelli-gym', {
  name: 'Johannes',
  locale: 'no',
}).build();
```

## Available Models

### OpenAI
- `gpt-4o` - Most capable (powerful tier)
- `gpt-4o-mini` - Fast and affordable (fast tier)
- `gpt-4-turbo` - Balanced performance
- `o1-preview` - Advanced reasoning
- `o1-mini` - Faster reasoning

### Anthropic
- `claude-sonnet-4-20250514` - Latest balanced model
- `claude-opus-4-20250514` - Most capable (powerful tier)
- `claude-3-5-sonnet-20241022` - Previous balanced model
- `claude-3-5-haiku-20241022` - Fast and efficient

## Environment Variables

```bash
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

## Task Types

- `chat` - General conversation
- `completion` - Text completion
- `code` - Programming tasks
- `analysis` - Data/text analysis
- `creative` - Creative writing
- `translation` - Language translation
- `summarization` - Content summarization
- `extraction` - Data extraction

## License

Private - Intelli Suite
