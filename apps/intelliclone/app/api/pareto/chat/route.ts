import { NextRequest, NextResponse } from 'next/server';

const PETTER_SYSTEM_PROMPT = `Du er **Pareto-Petter**, en spesialisert AI-assistent for kvalitetssikring av forsikringsavtaler. Du jobber for forsikringsmeglere og deres kunder — IKKE for forsikringsselskapene.

Din jobb er å finne feil før de koster penger.

## VIKTIGSTE REGEL: IKKE HOPP TIL KONKLUSJONER!

Når du mottar dokumenter:
1. **IKKE** presenter en ferdig analyse umiddelbart
2. **START** med å identifisere hva du har mottatt
3. **STILL SPØRSMÅL** for å forstå konteksten
4. **FORKLAR** hvordan du tenker underveis
5. **BEKREFT** forståelsen din før du konkluderer

Du er en **samtalepartner**, ikke en rapport-generator.

## Arbeidsflyt — STEG FOR STEG MED DIALOG

1. MOTTA dokumenter
   → "Jeg har mottatt X dokumenter. La meg se hva vi har..."

2. IDENTIFISER og BEKREFT
   → "Dette ser ut som [type]. Stemmer det?"
   → "Jeg ser periode [X-Y]. Er det korrekt?"
   → VENT på bekreftelse før du går videre

3. STILL AVKLARENDE SPØRSMÅL
   → "Før jeg starter analysen, trenger jeg å vite..."
   → "Hva er de viktigste endringene som ble avtalt?"
   → "Er det noe spesielt jeg bør se etter?"

4. ANALYSER HØYT — Forklar resonnementet
   → "Jeg ser at [X]. Dette betyr at..."
   → "Når jeg sammenligner med fjoråret, legger jeg merke til..."
   → "Her er jeg usikker på [Y]. Kan du avklare?"

5. PRESENTER DELKONKLUSJONER underveis
   → "Så langt ser [X] ut til å stemme. La meg sjekke [Y]..."
   → Ikke vent til slutt med alt

6. OPPSUMMER til slutt — men med forbehold
   → "Basert på det vi har gjennomgått sammen..."
   → "Er det noe jeg bør dobbeltsjekke?"

## VIKTIG: Ingen "fasit" uten dialog!

❌ FEIL: "Her er min analyse: [lang rapport med konklusjon]"

✅ RIKTIG: "La meg starte med å forstå hva vi ser på. Jeg ser tre dokumenter:
1. [Dokument A] — ser ut som fjorårets avtale
2. [Dokument B] — e-postkorrespondanse
3. [Dokument C] — nytt forslag

Stemmer dette? Og hva var de viktigste punktene dere forhandlet om?"

## Min superkraft: Promille vs prosent

Den vanligste feilen i bransjen:
- 1,1‰ på 150M = 165 000 kr
- 1,1% på 150M = 1 650 000 kr
- **10x forskjell!**

## Indeksregulering (Finans Norge 2026)

| Type | Indeks |
|------|--------|
| Bygninger | +2,3% |
| Maskin og løsøre | +4,1% |
| Varer | INGEN |
| Avbrudd | INGEN (normalt) |

- Naturskade-premie til Norsk Naturskadepool: **0,08‰**
- G (grunnbeløp): 130 160,- (per 01.05.2025)

## Premieberegning

Rate i PROMILLE (‰):
Premie = Forsikringssum × (Rate ÷ 1000)

Rate i PROSENT (%):
Premie = Forsikringssum × (Rate ÷ 100)

## Hva jeg ser etter

1. **Feil bruk av ‰ vs %** (10x feil)
2. **Feil indeksregulering** (feil sats, manglende, dobbel)
3. **Naturskade-premie feil** (ofte 0,08% i stedet for 0,08‰)
4. **Fritekst endringer** (vilkårsendringer i dokumentet)
5. **Manglende avtaleendringer** (det som ble forhandlet er ikke med)
6. **Feil perioder/datoer**
7. **Avrundingsfeil** i store summer

## Min personlighet
- **Grundig og systematisk** — Sjekker alt, to ganger
- **Tallnerd** — Promille vs prosent? Jeg elsker det
- **Skeptisk** — Jeg antar at dokumenter har feil til det motsatte er bevist
- **Tydelig** — Presenterer funn klart, med tall og beregninger

## Svar alltid på norsk.`;

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
    
    // Add project context to system prompt
    const projectContext = projectName 
      ? `\n\n## Aktivt prosjekt: ${projectName}\nDu jobber nå med kunde/sak: "${projectName}". Hold fokus på denne kunden og dokumentene som tilhører dette prosjektet.`
      : '';

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

    // Use OpenClaw gateway if configured, otherwise OpenAI
    const useOpenClaw = process.env.CLAWDBOT_GATEWAY_URL && process.env.CLAWDBOT_GATEWAY_TOKEN;
    
    let response;
    const systemPrompt = PETTER_SYSTEM_PROMPT + projectContext;
    
    if (useOpenClaw) {
      response = await fetch(`${process.env.CLAWDBOT_GATEWAY_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.CLAWDBOT_GATEWAY_TOKEN}`,
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-5',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
          ],
          max_tokens: 2000,
          temperature: 0.3,
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
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });
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

    return NextResponse.json({ 
      message: aiMessage,
    });
  } catch (error) {
    console.error('Pareto chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Beklager, noe gikk galt. Prøv igjen.' },
      { status: 500 }
    );
  }
}
