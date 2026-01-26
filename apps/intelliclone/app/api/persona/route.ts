/**
 * Persona API Routes
 * 
 * API endpoints for managing user personas in IntelliClone.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getLogger } from '@kit/shared/logger';

import {
  getOrCreatePersona,
  composeEmail,
  learnFromConversation,
  getNextQuestion,
  type EmailCompositionRequest,
} from '~/lib/persona';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * GET /api/persona
 * 
 * Get persona for a user.
 * Query params: userId, tenantId, chatbotId (optional)
 */
export async function GET(req: NextRequest) {
  const logger = await getLogger();
  
  try {
    const { searchParams } = new URL(req.url);
    
    const userId = searchParams.get('userId');
    const tenantId = searchParams.get('tenantId');
    const chatbotId = searchParams.get('chatbotId') ?? undefined;
    
    if (!userId || !tenantId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId and tenantId' },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    const persona = await getOrCreatePersona({
      userId,
      tenantId,
      chatbotId,
    });
    
    // Get next probing question
    const nextQuestion = getNextQuestion(persona, []);
    
    return NextResponse.json({
      persona,
      nextQuestion,
    }, { headers: CORS_HEADERS });
    
  } catch (error) {
    logger.error({ error }, 'Error fetching persona');
    
    return NextResponse.json(
      { error: 'Failed to fetch persona' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * POST /api/persona
 * 
 * Update persona or perform persona operations.
 */
export async function POST(req: NextRequest) {
  const logger = await getLogger();
  
  try {
    const body = await req.json();
    
    const actionSchema = z.object({
      action: z.enum(['learn', 'compose-email', 'get-questions']),
    });
    
    const { action } = actionSchema.parse(body);
    
    switch (action) {
      case 'learn': {
        const learnSchema = z.object({
          userId: z.string(),
          tenantId: z.string(),
          chatbotId: z.string().optional(),
          userMessage: z.string(),
          assistantResponse: z.string(),
        });
        
        const params = learnSchema.parse(body);
        
        const result = await learnFromConversation({
          userId: params.userId,
          tenantId: params.tenantId,
          chatbotId: params.chatbotId,
          userMessage: params.userMessage,
          assistantResponse: params.assistantResponse,
        });
        
        logger.info(
          { userId: params.userId, insightsCount: result.insights.length },
          'Learned from conversation'
        );
        
        return NextResponse.json({
          success: true,
          insights: result.insights,
          styleAnalysis: result.styleAnalysis,
        }, { headers: CORS_HEADERS });
      }
      
      case 'compose-email': {
        const composeSchema = z.object({
          userId: z.string(),
          tenantId: z.string(),
          chatbotId: z.string().optional(),
          request: z.object({
            purpose: z.string(),
            recipient: z.string(),
            recipientRelationship: z.string().optional(),
            keyPoints: z.array(z.string()),
            toneOverride: z.enum(['formal', 'casual', 'friendly', 'urgent']).optional(),
            length: z.enum(['short', 'medium', 'long']).optional(),
            previousContext: z.string().optional(),
          }),
        });
        
        const params = composeSchema.parse(body);
        
        const email = await composeEmail({
          userId: params.userId,
          tenantId: params.tenantId,
          chatbotId: params.chatbotId,
          request: params.request as EmailCompositionRequest,
        });
        
        logger.info(
          { userId: params.userId, purpose: params.request.purpose },
          'Composed email'
        );
        
        return NextResponse.json({
          success: true,
          email,
        }, { headers: CORS_HEADERS });
      }
      
      case 'get-questions': {
        const questionsSchema = z.object({
          userId: z.string(),
          tenantId: z.string(),
          chatbotId: z.string().optional(),
          askedQuestionIds: z.array(z.string()).optional(),
        });
        
        const params = questionsSchema.parse(body);
        
        const persona = await getOrCreatePersona({
          userId: params.userId,
          tenantId: params.tenantId,
          chatbotId: params.chatbotId,
        });
        
        const nextQuestion = getNextQuestion(
          persona,
          params.askedQuestionIds ?? []
        );
        
        return NextResponse.json({
          success: true,
          nextQuestion,
          persona,
        }, { headers: CORS_HEADERS });
      }
      
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400, headers: CORS_HEADERS }
        );
    }
    
  } catch (error) {
    logger.error({ error }, 'Error in persona API');
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400, headers: CORS_HEADERS }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}
