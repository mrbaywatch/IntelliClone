import { NextRequest, NextResponse } from 'next/server';
import {
  getUserMemories,
  formatMemoriesForPrompt,
  extractMemoriesFromConversation,
  saveMemory,
  addMessage,
  createConversation,
  Memory,
} from '~/lib/memory-service';

export async function POST(request: NextRequest) {
  try {
    const { 
      messages, 
      language = 'en', 
      userId,
      conversationId 
    } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Load user's memories
    const memories = await getUserMemories(userId);
    const memoryContext = formatMemoriesForPrompt(memories);

    // Get the latest user message
    const latestUserMessage = messages[messages.length - 1]?.content || '';

    // Build the system prompt with memory
    const languageInstruction = language === 'no' 
      ? 'IMPORTANT: You MUST respond in Norwegian (Norsk). All your responses should be in Norwegian.'
      : 'Respond in English.';

    const systemPrompt = `You are Erik, a friendly and personable AI assistant. You remember everything about your users and build genuine relationships with them.

${languageInstruction}

## What You Know About This User:
${memoryContext}

## Your Personality:
- Warm, conversational, and genuinely curious
- Reference things you know about them naturally
- Use their name when appropriate (if you know it)
- Be helpful, concise, and personable

## During First Conversations:
If you don't know much about them yet, naturally learn:
- Their name
- What they do (job/business/role)  
- What they want to use you for
- Their preferences

Don't interrogate - have a natural conversation. Pick up on details they share.

## Important:
- You're building a long-term relationship
- Every detail matters - remember it all
- Be genuinely helpful, not just polite
- Admit when you don't know something`;

    // Build conversation history for context
    const conversationHistory = messages.slice(-10).map((msg: { role: string; content: string }) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory,
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    // Save messages to conversation if conversationId provided
    if (conversationId) {
      await addMessage(conversationId, 'user', latestUserMessage);
      await addMessage(conversationId, 'assistant', aiMessage);
    }

    // Extract and save new memories (async, don't wait)
    extractAndSaveMemories(userId, latestUserMessage, aiMessage, memories);

    return NextResponse.json({ 
      message: aiMessage,
      memoryCount: memories.length,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Extract memories in background (non-blocking)
 */
async function extractAndSaveMemories(
  userId: string,
  userMessage: string,
  assistantResponse: string,
  existingMemories: Memory[]
) {
  try {
    const newMemories = await extractMemoriesFromConversation(
      userMessage,
      assistantResponse,
      existingMemories
    );

    // Save each new memory
    for (const memory of newMemories) {
      await saveMemory(
        userId,
        memory.key,
        memory.value,
        memory.category,
        1.0,
        'conversation'
      );
      console.log(`Saved memory for user ${userId}: ${memory.key} = ${memory.value}`);
    }
  } catch (error) {
    console.error('Error in memory extraction:', error);
  }
}
