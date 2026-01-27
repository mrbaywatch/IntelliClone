import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { getLogger } from '@kit/shared/logger';
import { requireUser } from '@kit/supabase/require-user';
import { getSupabaseServerClient } from '@kit/supabase/server-client';

import { Database } from '~/lib/database.types';
import { legalQAService } from '~/lib/legal/services/legal-qa-service';
import type { LegalCategory } from '~/lib/legal/types';

const bodySchema = z.object({
  query: z.string().min(1).max(500),
  category: z.string().optional() as z.ZodType<LegalCategory | undefined>,
});

/**
 * POST /api/legal-research
 * 
 * Performs legal research and citation lookup.
 */
export async function POST(request: NextRequest) {
  const logger = await getLogger();

  try {
    const body = bodySchema.parse(await request.json());
    const { query, category } = body;

    const client = getSupabaseServerClient<Database>();
    const auth = await requireUser(client);

    if (!auth.data) {
      return redirect(auth.redirectTo);
    }

    // Check token availability
    const { data: remainingTokens } = await client.rpc('get_remaining_tokens');
    const minimumTokensRequired = 50;

    if (!remainingTokens || remainingTokens < minimumTokensRequired) {
      logger.warn(
        { remainingTokens, accountId: auth.data.id },
        'Insufficient tokens for legal research',
      );
      return new Response(JSON.stringify({ 
        error: 'Insufficient credits. Please upgrade your plan.' 
      }), {
        status: 402,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    logger.info({ query, category }, 'Legal research query');

    // Create a question object
    const question = {
      id: crypto.randomUUID(),
      question: query,
      category,
      createdAt: new Date(),
    };

    // Get answer from legal QA service
    const answer = await legalQAService.answerQuestion(question);

    // Also lookup specific citations
    const citations = await legalQAService.lookupCitations(query, category);

    // Combine sources, removing duplicates
    const allSources = [...answer.sources];
    for (const citation of citations) {
      if (!allSources.some(s => s.reference === citation.reference)) {
        allSources.push(citation);
      }
    }

    logger.info(
      { 
        query, 
        sourcesFound: allSources.length,
        confidence: answer.confidence,
      },
      'Legal research completed',
    );

    return new Response(JSON.stringify({
      answer: answer.answer,
      sources: allSources,
      relatedQuestions: answer.relatedQuestions,
      confidence: answer.confidence,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    const logger = await getLogger();
    logger.error({ error }, 'Error in legal research API');

    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid request format' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Internal server error' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
