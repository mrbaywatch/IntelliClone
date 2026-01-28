import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, language = 'en' } = await request.json();

    // Use Clawdbot gateway if configured, otherwise fall back to OpenAI
    const useClawdbot = process.env.CLAWDBOT_GATEWAY_URL && process.env.CLAWDBOT_GATEWAY_TOKEN;

    const systemPrompt = language === 'no'
      ? 'Generer en kort, beskrivende tittel (maks 5 ord) for denne samtalen på norsk. Svar kun med tittelen, ingen anførselstegn eller ekstra tekst.'
      : 'Generate a short, descriptive title (max 5 words) for this conversation. Reply with only the title, no quotes or extra text.';

    const titleMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content.slice(0, 500), // Limit content for title generation
      })),
      { role: 'user', content: language === 'no' ? 'Generer tittel:' : 'Generate title:' },
    ];

    let response;
    
    if (useClawdbot) {
      response = await fetch(`${process.env.CLAWDBOT_GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLAWDBOT_GATEWAY_TOKEN}`,
          'x-clawdbot-agent-id': 'main',
        },
        body: JSON.stringify({
          model: 'clawdbot:main',
          stream: false,
          messages: titleMessages,
        }),
      });
    } else {
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: titleMessages,
          max_tokens: 20,
          temperature: 0.7,
        }),
      });
    }

    if (!response.ok) {
      console.error('Title generation API error');
      return NextResponse.json({ title: 'New Chat' });
    }

    const data = await response.json();
    let title = data.choices?.[0]?.message?.content || 'New Chat';
    
    // Clean up the title - remove quotes, limit length
    title = title.replace(/["']/g, '').trim();
    if (title.length > 40) {
      title = title.slice(0, 37) + '...';
    }

    return NextResponse.json({ title });
  } catch (error) {
    console.error('Title generation error:', error);
    return NextResponse.json({ title: 'New Chat' });
  }
}
