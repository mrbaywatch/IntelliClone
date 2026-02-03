import { NextRequest, NextResponse } from 'next/server';
import { buildPetterSystemPrompt } from '~/lib/pareto/knowledge-loader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const projectName = formData.get('projectName') as string;
    const historyStr = formData.get('history') as string;
    const files = formData.getAll('files') as File[];

    const history: Message[] = historyStr ? JSON.parse(historyStr) : [];

    // Build file context if files uploaded
    let fileContext = '';
    if (files && files.length > 0) {
      const fileDescriptions = await Promise.all(
        files.map(async (file) => {
          let text = '';
          
          try {
            if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
              // Parse PDF using dynamic import
              const pdfParse = (await import('pdf-parse')).default;
              const buffer = Buffer.from(await file.arrayBuffer());
              const pdfData = await pdfParse(buffer);
              text = pdfData.text;
            } else {
              // Plain text files
              text = await file.text();
            }
          } catch (error) {
            console.error(`Error parsing file ${file.name}:`, error);
            text = `[Kunne ikke lese innholdet i ${file.name}]`;
          }
          
          const truncated = text.slice(0, 15000);
          return `--- ${file.name} ---\n${truncated}${text.length > 15000 ? '\n[...trunkert, totalt ' + text.length + ' tegn]' : ''}`;
        })
      );
      fileContext = `\n\nOpplastede dokumenter:\n${fileDescriptions.join('\n\n')}`;
    }

    // Build user message
    const userContent = message + fileContext;

    // Build conversation
    const conversationHistory = history.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Add current message
    conversationHistory.push({
      role: 'user' as const,
      content: userContent,
    });

    // Load Petter's complete knowledge base
    const systemPrompt = buildPetterSystemPrompt(projectName);

    let response;

    // Priority: 1) OpenClaw, 2) Anthropic, 3) OpenAI
    if (process.env.CLAWDBOT_GATEWAY_URL && process.env.CLAWDBOT_GATEWAY_TOKEN) {
      // Local development with OpenClaw
      response = await fetch(`${process.env.CLAWDBOT_GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLAWDBOT_GATEWAY_TOKEN}`,
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });
    } else if (process.env.ANTHROPIC_API_KEY) {
      // Production with Anthropic API directly
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-20250514',
          max_tokens: 4000,
          system: systemPrompt,
          messages: conversationHistory,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Anthropic API error:', error);
        return NextResponse.json(
          { error: 'Kunne ikke få svar fra AI', message: 'Beklager, noe gikk galt. Prøv igjen.' },
          { status: 500 }
        );
      }

      const data = await response.json();
      const aiMessage = data.content?.[0]?.text || 'Beklager, jeg kunne ikke generere et svar.';

      return NextResponse.json({ message: aiMessage });
    } else if (process.env.OPENAI_API_KEY) {
      // Fallback to OpenAI
      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });
    } else {
      return NextResponse.json(
        { error: 'No API key configured', message: 'Beklager, ingen API-nøkkel er konfigurert.' },
        { status: 500 }
      );
    }

    if (!response.ok) {
      const error = await response.json();
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Kunne ikke få svar fra AI', message: 'Beklager, noe gikk galt. Prøv igjen.' },
        { status: 500 }
      );
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Beklager, jeg kunne ikke generere et svar.';

    return NextResponse.json({ message: aiMessage });
  } catch (error) {
    console.error('Pareto chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Beklager, noe gikk galt. Prøv igjen.' },
      { status: 500 }
    );
  }
}
