/**
 * Intelli-Notes Summary Service
 * 
 * Uses AI to generate meeting summaries and extract action items.
 * Optimized for Norwegian language support.
 */

import { generateText } from '@kit/ai-core';
import { createSystemPrompt, PromptTemplates } from '@kit/ai-core';
import type {
  SummaryGenerationInput,
  SummaryGenerationResult,
  KeyPoint,
  Decision,
  Topic,
  ExtractedActionItem,
  TranscriptionLanguage,
  ActionItemPriority,
} from './types';

// =============================================================================
// Prompts
// =============================================================================

const NORWEGIAN_SUMMARY_SYSTEM_PROMPT = `Du er en profesjonell møteassistent for norske bedrifter.

Din oppgave er å analysere møtetranskripsjoner og produsere:
1. Et konsist sammendrag av møtet
2. Nøkkelpunkter som ble diskutert
3. Beslutninger som ble tatt
4. Handlingspunkter med ansvarlige personer

Retningslinjer:
- Skriv alltid på norsk (bokmål)
- Vær konsis men grundig
- Behold profesjonell tone
- Identifiser konkrete handlingspunkter med navn hvis nevnt
- Merk frister hvis de nevnes
- Grupper relaterte diskusjoner under temaer`;

const ENGLISH_SUMMARY_SYSTEM_PROMPT = `You are a professional meeting assistant.

Your task is to analyze meeting transcriptions and produce:
1. A concise summary of the meeting
2. Key points that were discussed
3. Decisions that were made
4. Action items with responsible persons

Guidelines:
- Be concise but thorough
- Maintain professional tone
- Identify concrete action items with names if mentioned
- Note deadlines if mentioned
- Group related discussions under topics`;

// =============================================================================
// Summary Service
// =============================================================================

export class SummaryService {
  private modelId: string;

  constructor(modelId: string = 'gpt-4o') {
    this.modelId = modelId;
  }

  /**
   * Generate a complete meeting summary with action items
   */
  async generateSummary(input: SummaryGenerationInput): Promise<SummaryGenerationResult> {
    const isNorwegian = input.language === 'nb' || input.language === 'nn';
    
    const systemPrompt = isNorwegian 
      ? NORWEGIAN_SUMMARY_SYSTEM_PROMPT 
      : ENGLISH_SUMMARY_SYSTEM_PROMPT;

    const userPrompt = this.buildUserPrompt(input, isNorwegian);

    const response = await generateText({
      model: this.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
    });

    // Parse the structured response
    return this.parseResponse(response.text, isNorwegian);
  }

  /**
   * Extract only action items from a transcript
   */
  async extractActionItems(
    transcriptText: string,
    language: TranscriptionLanguage = 'nb'
  ): Promise<ExtractedActionItem[]> {
    const isNorwegian = language === 'nb' || language === 'nn';

    const systemPrompt = isNorwegian
      ? `Du er en ekspert på å identifisere handlingspunkter fra møter.
         Analyser transkripsjonen og finn alle oppgaver, ansvarlige og frister.
         Returner som JSON array.`
      : `You are an expert at identifying action items from meetings.
         Analyze the transcript and find all tasks, assignees, and deadlines.
         Return as JSON array.`;

    const userPrompt = isNorwegian
      ? `Finn alle handlingspunkter fra dette møtet:

${transcriptText}

Returner som JSON array med format:
[{
  "title": "Oppgavebeskrivelse",
  "assignee_name": "Navn (eller null)",
  "due_date": "YYYY-MM-DD (eller null)",
  "priority": "low|medium|high|urgent",
  "confidence": 0.0-1.0
}]`
      : `Find all action items from this meeting:

${transcriptText}

Return as JSON array with format:
[{
  "title": "Task description",
  "assignee_name": "Name (or null)",
  "due_date": "YYYY-MM-DD (or null)",
  "priority": "low|medium|high|urgent",
  "confidence": 0.0-1.0
}]`;

    const response = await generateText({
      model: this.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return this.parseActionItems(response.text);
  }

  /**
   * Generate a quick summary (for real-time updates)
   */
  async generateQuickSummary(
    partialTranscript: string,
    language: TranscriptionLanguage = 'nb'
  ): Promise<string> {
    const isNorwegian = language === 'nb' || language === 'nn';

    const prompt = isNorwegian
      ? `Gi et veldig kort sammendrag (maks 2-3 setninger) av hva som diskuteres:

${partialTranscript}`
      : `Give a very brief summary (max 2-3 sentences) of what's being discussed:

${partialTranscript}`;

    const response = await generateText({
      model: this.getModel(),
      system: isNorwegian
        ? 'Du gir korte, konsise møtesammendrag på norsk.'
        : 'You provide brief, concise meeting summaries.',
      prompt,
    });

    return response.text;
  }

  /**
   * Identify meeting topics with time ranges
   */
  async identifyTopics(
    segments: Array<{ text: string; start_time_ms: number; end_time_ms: number }>,
    language: TranscriptionLanguage = 'nb'
  ): Promise<Topic[]> {
    const isNorwegian = language === 'nb' || language === 'nn';

    // Create transcript with timestamps
    const transcriptWithTimes = segments
      .map((s) => `[${this.formatTime(s.start_time_ms)}] ${s.text}`)
      .join('\n');

    const systemPrompt = isNorwegian
      ? `Du identifiserer hovedtemaer i møter med tidsangivelser.`
      : `You identify main topics in meetings with timestamps.`;

    const userPrompt = isNorwegian
      ? `Identifiser hovedtemaene i dette møtet med start- og sluttid:

${transcriptWithTimes}

Returner som JSON array:
[{
  "name": "Temanavn",
  "start_time_ms": 0,
  "end_time_ms": 60000,
  "summary": "Kort beskrivelse"
}]`
      : `Identify the main topics in this meeting with start and end times:

${transcriptWithTimes}

Return as JSON array:
[{
  "name": "Topic name",
  "start_time_ms": 0,
  "end_time_ms": 60000,
  "summary": "Brief description"
}]`;

    const response = await generateText({
      model: this.getModel(),
      system: systemPrompt,
      prompt: userPrompt,
    });

    return this.parseTopics(response.text);
  }

  // =============================================================================
  // Private Methods
  // =============================================================================

  private getModel() {
    // Using dynamic import to get the model from ai-core
    // This should be configured based on the available models
    return {
      modelId: this.modelId,
    } as any;
  }

  private buildUserPrompt(input: SummaryGenerationInput, isNorwegian: boolean): string {
    const participantInfo = input.participants?.length
      ? `\n${isNorwegian ? 'Deltakere' : 'Participants'}: ${input.participants.join(', ')}`
      : '';

    if (isNorwegian) {
      return `Analyser dette møtet og generer et strukturert sammendrag:

Møtetittel: ${input.meeting_title}${participantInfo}

Transkripsjon:
${input.transcript_text}

Generer følgende (i JSON-format):
{
  "summary_text": "Helhetlig sammendrag av møtet (2-4 avsnitt)",
  "key_points": [{"text": "Nøkkelpunkt", "speaker": "Taler hvis kjent"}],
  "decisions": [{"text": "Beslutning som ble tatt", "participants": ["Navn"]}],
  "topics": [{"name": "Tema", "summary": "Kort beskrivelse"}],
  "action_items": [{
    "title": "Handlingspunkt",
    "assignee_name": "Ansvarlig (eller null)",
    "due_date": "YYYY-MM-DD (eller null)",
    "priority": "medium",
    "confidence": 0.9
  }]
}`;
    }

    return `Analyze this meeting and generate a structured summary:

Meeting title: ${input.meeting_title}${participantInfo}

Transcript:
${input.transcript_text}

Generate the following (in JSON format):
{
  "summary_text": "Complete summary of the meeting (2-4 paragraphs)",
  "key_points": [{"text": "Key point", "speaker": "Speaker if known"}],
  "decisions": [{"text": "Decision made", "participants": ["Name"]}],
  "topics": [{"name": "Topic", "summary": "Brief description"}],
  "action_items": [{
    "title": "Action item",
    "assignee_name": "Assignee (or null)",
    "due_date": "YYYY-MM-DD (or null)",
    "priority": "medium",
    "confidence": 0.9
  }]
}`;
  }

  private parseResponse(responseText: string, isNorwegian: boolean): SummaryGenerationResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary_text: parsed.summary_text || '',
          key_points: parsed.key_points || [],
          decisions: parsed.decisions || [],
          topics: parsed.topics || [],
          action_items: parsed.action_items || [],
        };
      }
    } catch (error) {
      console.error('Failed to parse summary response:', error);
    }

    // Fallback: return the text as summary
    return {
      summary_text: responseText,
      key_points: [],
      decisions: [],
      topics: [],
      action_items: [],
    };
  }

  private parseActionItems(responseText: string): ExtractedActionItem[] {
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any) => ({
          title: item.title || '',
          description: item.description,
          assignee_name: item.assignee_name,
          due_date: item.due_date,
          priority: (item.priority as ActionItemPriority) || 'medium',
          source_text: item.source_text,
          confidence: item.confidence || 0.8,
        }));
      }
    } catch (error) {
      console.error('Failed to parse action items:', error);
    }
    return [];
  }

  private parseTopics(responseText: string): Topic[] {
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((topic: any) => ({
          name: topic.name || '',
          start_time_ms: topic.start_time_ms,
          end_time_ms: topic.end_time_ms,
          summary: topic.summary,
        }));
      }
    } catch (error) {
      console.error('Failed to parse topics:', error);
    }
    return [];
  }

  private formatTime(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}

// =============================================================================
// Factory
// =============================================================================

let summaryServiceInstance: SummaryService | null = null;

export function getSummaryService(): SummaryService {
  if (!summaryServiceInstance) {
    summaryServiceInstance = new SummaryService();
  }
  return summaryServiceInstance;
}

export function createSummaryService(modelId: string): SummaryService {
  return new SummaryService(modelId);
}
