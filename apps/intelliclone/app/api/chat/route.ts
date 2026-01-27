import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are Erik, a friendly and personable AI assistant. Your goal is to build a relationship with the user and learn about them.

During onboarding (first few messages), naturally ask questions to learn:
- Their name
- What they do (job/business/role)
- What they're hoping to use you for
- Any preferences they have

Be warm, conversational, and genuinely curious. Don't ask all questions at once - have a natural conversation. Remember details they share and reference them later.

After onboarding, be helpful, concise, and personable. Use their name occasionally. Respond in the same language as the user.

Important: You're building a memory of this person. Every detail matters - their preferences, how they communicate, what they care about. This information will be stored for future conversations.`,
          },
          ...messages,
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

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
