import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import { streamText } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

import { getLogger } from '@kit/shared/logger';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { Database } from '~/lib/database.types';
import { NORWEGIAN_LEGAL_SYSTEM_PROMPT } from '~/lib/legal/prompts/norwegian-legal-prompts';

/**
 * POST /api/legal-chat
 * 
 * Handles legal Q&A chat with Norwegian legal expertise.
 * Uses streaming for real-time responses.
 */
export async function POST(request: NextRequest) {
  const logger = await getLogger();

  try {
    const body = getBodySchema().parse(await request.json());
    const { messages, accountId, sessionId, documentContext } = body;

    const client = getSupabaseServerClient<Database>();
    const auth = await requireUser(client);

    if (!auth.data) {
      return redirect(auth.redirectTo);
    }

    // Verify the account belongs to the user
    if (accountId !== auth.data.id) {
      return new Response('Unauthorized', { status: 403 });
    }

    // Check token availability
    const { data: remainingTokens } = await client.rpc('get_remaining_tokens');
    const minimumTokensRequired = 50;

    if (!remainingTokens || remainingTokens < minimumTokensRequired) {
      logger.warn(
        { remainingTokens, accountId },
        'Insufficient tokens for legal chat',
      );
      return new Response('Insufficient credits. Please upgrade your plan.', {
        status: 402,
      });
    }

    // Build the system prompt with optional document context
    let systemPrompt = NORWEGIAN_LEGAL_SYSTEM_PROMPT;
    
    if (documentContext) {
      systemPrompt += `\n\n---\n\nDOKUMENTKONTEKST:\n${documentContext}\n\nBruk denne dokumentkonteksten til å besvare spørsmål når relevant.`;
    }

    // Process messages for the AI
    const processedMessages = messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content || msg.parts?.[0]?.text || '',
    }));

    // Stream the response using the AI SDK
    const result = streamText({
      model: openai(process.env.LLM_MODEL_NAME || 'gpt-4o'),
      system: systemPrompt,
      messages: processedMessages,
      temperature: 0.3,
      maxTokens: 2000,
      // Add tools for citation lookup (optional enhancement)
    });

    logger.info(
      { accountId, sessionId, messageCount: messages.length },
      'Legal chat stream started',
    );

    // Return streaming response
    return result.toDataStreamResponse();

  } catch (error) {
    const logger = await getLogger();
    logger.error({ error }, 'Error in legal chat API');

    if (error instanceof z.ZodError) {
      return new Response('Invalid request format', { status: 400 });
    }

    return new Response('Internal server error', { status: 500 });
  }
}

function getBodySchema() {
  return z.object({
    accountId: z.string(),
    sessionId: z.string().optional(),
    documentContext: z.string().optional(),
    messages: z.array(
      z.object({
        id: z.string().optional(),
        role: z.enum(['user', 'assistant', 'system']),
        parts: z
          .array(
            z.object({
              type: z.literal('text'),
              text: z.string(),
            }),
          )
          .optional(),
        content: z.string().optional(),
      }),
    ),
  });
}
