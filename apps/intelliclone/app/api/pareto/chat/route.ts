import { NextRequest, NextResponse } from 'next/server';
import { buildPetterSystemPrompt } from '~/lib/pareto/knowledge-loader';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AnthropicContent {
  type: 'text' | 'document';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | AnthropicContent[];
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const message = formData.get('message') as string;
    const projectName = formData.get('projectName') as string;
    const historyStr = formData.get('history') as string;
    const files = formData.getAll('files') as File[];

    const history: Message[] = historyStr ? JSON.parse(historyStr) : [];

    // Load Petter's complete knowledge base
    const systemPrompt = buildPetterSystemPrompt(projectName);

    // Build conversation history
    const conversationHistory: AnthropicMessage[] = history.slice(-10).map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    // Build current user message with file attachments
    const userContent: AnthropicContent[] = [];

    // Add text message
    if (message) {
      userContent.push({
        type: 'text',
        text: message,
      });
    }

    // Add files as documents (Claude can read PDFs natively!)
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          const buffer = Buffer.from(await file.arrayBuffer());
          const base64 = buffer.toString('base64');
          
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            // Send PDF directly to Claude
            userContent.push({
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: base64,
              },
            });
            userContent.push({
              type: 'text',
              text: `[Vedlagt fil: ${file.name}]`,
            });
          } else {
            // For text files, include content directly
            const text = await file.text();
            userContent.push({
              type: 'text',
              text: `--- ${file.name} ---\n${text.slice(0, 15000)}`,
            });
          }
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          userContent.push({
            type: 'text',
            text: `[Kunne ikke lese ${file.name}]`,
          });
        }
      }
    }

    // Add default text if no content
    if (userContent.length === 0) {
      userContent.push({
        type: 'text',
        text: 'Se vedlagte dokumenter',
      });
    }

    // Add current message to history
    conversationHistory.push({
      role: 'user',
      content: userContent,
    });

    let response;

    // Priority: 1) OpenClaw (local), 2) Anthropic (production)
    if (process.env.CLAWDBOT_GATEWAY_URL && process.env.CLAWDBOT_GATEWAY_TOKEN) {
      // Local development - use simplified text format for OpenClaw
      const textOnlyHistory = history.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // For local, extract text from PDFs if possible
      let localContent = message || '';
      if (files && files.length > 0) {
        localContent += '\n\n[Filer lastet opp: ' + files.map(f => f.name).join(', ') + ']';
      }
      
      textOnlyHistory.push({
        role: 'user' as const,
        content: localContent,
      });

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
            ...textOnlyHistory,
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenClaw API error:', error);
        return NextResponse.json(
          { error: 'Kunne ikke få svar fra AI', message: 'Beklager, noe gikk galt. Prøv igjen.' },
          { status: 500 }
        );
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content || 'Beklager, jeg kunne ikke generere et svar.';
      return NextResponse.json({ message: aiMessage });

    } else if (process.env.ANTHROPIC_API_KEY) {
      // Production - use Anthropic API with native PDF support
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
          { error: 'Kunne ikke få svar fra AI', message: `Beklager, noe gikk galt: ${error.error?.message || 'ukjent feil'}` },
          { status: 500 }
        );
      }

      const data = await response.json();
      const aiMessage = data.content?.[0]?.text || 'Beklager, jeg kunne ikke generere et svar.';
      return NextResponse.json({ message: aiMessage });

    } else if (process.env.OPENAI_API_KEY) {
      // Fallback to OpenAI (no native PDF support)
      const textOnlyHistory = history.slice(-10).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      
      textOnlyHistory.push({
        role: 'user' as const,
        content: message || 'Se vedlagte dokumenter',
      });

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
            ...textOnlyHistory,
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('OpenAI API error:', error);
        return NextResponse.json(
          { error: 'Kunne ikke få svar fra AI', message: 'Beklager, noe gikk galt. Prøv igjen.' },
          { status: 500 }
        );
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content || 'Beklager, jeg kunne ikke generere et svar.';
      return NextResponse.json({ message: aiMessage });

    } else {
      return NextResponse.json(
        { error: 'No API key configured', message: 'Beklager, ingen API-nøkkel er konfigurert.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Pareto chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: `Beklager, noe gikk galt: ${error instanceof Error ? error.message : 'ukjent feil'}` },
      { status: 500 }
    );
  }
}
