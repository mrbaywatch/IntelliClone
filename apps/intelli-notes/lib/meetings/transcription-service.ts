/**
 * Intelli-Notes Transcription Service
 * 
 * Handles audio transcription using AssemblyAI with Norwegian language support.
 */

import { AssemblyAI, Transcript as AssemblyTranscript } from 'assemblyai';
import type {
  TranscriptionConfig,
  TranscriptionResult,
  TranscriptionUtterance,
  TranscriptionWord,
  TranscriptionLanguage,
} from './types';

// =============================================================================
// Configuration
// =============================================================================

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

if (!ASSEMBLYAI_API_KEY) {
  console.warn('⚠️ ASSEMBLYAI_API_KEY not set. Transcription will not work.');
}

// Language code mapping for AssemblyAI
const LANGUAGE_CODES: Record<TranscriptionLanguage, string> = {
  nb: 'no', // Norwegian Bokmål -> Norwegian
  nn: 'no', // Norwegian Nynorsk -> Norwegian
  en: 'en', // English
  sv: 'sv', // Swedish
  da: 'da', // Danish
};

// =============================================================================
// Transcription Service
// =============================================================================

export class TranscriptionService {
  private client: AssemblyAI;

  constructor(apiKey?: string) {
    const key = apiKey || ASSEMBLYAI_API_KEY;
    if (!key) {
      throw new Error('AssemblyAI API key is required');
    }
    this.client = new AssemblyAI({ apiKey: key });
  }

  /**
   * Transcribe an audio file from URL
   */
  async transcribeFromUrl(
    audioUrl: string,
    config: TranscriptionConfig
  ): Promise<TranscriptionResult> {
    const transcript = await this.client.transcripts.transcribe({
      audio: audioUrl,
      language_code: LANGUAGE_CODES[config.language] || 'no',
      speaker_labels: config.speaker_diarization,
      speakers_expected: config.speaker_count,
      punctuate: config.punctuate,
      format_text: config.format_text,
      dual_channel: config.dual_channel,
    });

    return this.transformResult(transcript);
  }

  /**
   * Transcribe an uploaded audio file
   */
  async transcribeFromFile(
    filePath: string,
    config: TranscriptionConfig
  ): Promise<TranscriptionResult> {
    // First upload the file
    const uploadUrl = await this.client.files.upload(filePath);
    
    // Then transcribe
    return this.transcribeFromUrl(uploadUrl, config);
  }

  /**
   * Transcribe from a readable stream (for uploads)
   */
  async transcribeFromBuffer(
    buffer: Buffer,
    config: TranscriptionConfig
  ): Promise<TranscriptionResult> {
    // Upload the buffer as a file
    const uploadUrl = await this.client.files.upload(buffer);
    
    // Then transcribe
    return this.transcribeFromUrl(uploadUrl, config);
  }

  /**
   * Get transcription status by ID
   */
  async getTranscriptionStatus(transcriptId: string): Promise<{
    status: 'queued' | 'processing' | 'completed' | 'error';
    error?: string;
    result?: TranscriptionResult;
  }> {
    const transcript = await this.client.transcripts.get(transcriptId);

    switch (transcript.status) {
      case 'queued':
        return { status: 'queued' };
      case 'processing':
        return { status: 'processing' };
      case 'completed':
        return {
          status: 'completed',
          result: this.transformResult(transcript),
        };
      case 'error':
        return {
          status: 'error',
          error: transcript.error || 'Unknown error',
        };
      default:
        return { status: 'processing' };
    }
  }

  /**
   * Transform AssemblyAI result to our format
   */
  private transformResult(transcript: AssemblyTranscript): TranscriptionResult {
    const utterances: TranscriptionUtterance[] = (transcript.utterances || []).map(
      (u) => ({
        speaker: u.speaker,
        text: u.text,
        start: u.start,
        end: u.end,
        confidence: u.confidence,
        words: u.words?.map((w) => ({
          text: w.text,
          start: w.start,
          end: w.end,
          confidence: w.confidence,
          speaker: u.speaker,
        })),
      })
    );

    const words: TranscriptionWord[] = (transcript.words || []).map((w) => ({
      text: w.text,
      start: w.start,
      end: w.end,
      confidence: w.confidence,
    }));

    return {
      id: transcript.id,
      text: transcript.text || '',
      utterances,
      words,
      confidence: transcript.confidence || 0,
      audio_duration_ms: transcript.audio_duration ? transcript.audio_duration * 1000 : 0,
      detected_language: transcript.language_code,
    };
  }
}

// =============================================================================
// Real-time Transcription (WebSocket)
// =============================================================================

export interface RealtimeTranscriptionConfig {
  sampleRate: number;
  language: TranscriptionLanguage;
  onTranscript: (text: string, isFinal: boolean) => void;
  onError?: (error: Error) => void;
}

/**
 * Real-time transcription session for live meeting recording
 */
export class RealtimeTranscriptionSession {
  private client: AssemblyAI;
  private transcriber: Awaited<ReturnType<AssemblyAI['realtime']['transcriber']>> | null = null;

  constructor(apiKey?: string) {
    const key = apiKey || ASSEMBLYAI_API_KEY;
    if (!key) {
      throw new Error('AssemblyAI API key is required');
    }
    this.client = new AssemblyAI({ apiKey: key });
  }

  /**
   * Start a real-time transcription session
   */
  async start(config: RealtimeTranscriptionConfig): Promise<void> {
    this.transcriber = this.client.realtime.transcriber({
      sampleRate: config.sampleRate,
    });

    this.transcriber.on('transcript', (transcript) => {
      const text = transcript.text;
      const isFinal = transcript.message_type === 'FinalTranscript';
      config.onTranscript(text, isFinal);
    });

    this.transcriber.on('error', (error) => {
      if (config.onError) {
        config.onError(error);
      }
    });

    await this.transcriber.connect();
  }

  /**
   * Send audio data to the transcriber
   */
  sendAudio(audioData: Buffer): void {
    if (!this.transcriber) {
      throw new Error('Transcription session not started');
    }
    this.transcriber.sendAudio(audioData);
  }

  /**
   * Close the transcription session
   */
  async close(): Promise<void> {
    if (this.transcriber) {
      await this.transcriber.close();
      this.transcriber = null;
    }
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

let transcriptionServiceInstance: TranscriptionService | null = null;

export function getTranscriptionService(): TranscriptionService {
  if (!transcriptionServiceInstance) {
    transcriptionServiceInstance = new TranscriptionService();
  }
  return transcriptionServiceInstance;
}

export function createTranscriptionService(apiKey: string): TranscriptionService {
  return new TranscriptionService(apiKey);
}
