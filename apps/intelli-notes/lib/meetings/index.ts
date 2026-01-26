/**
 * Intelli-Notes Meeting Module
 * 
 * Central export for all meeting-related functionality.
 */

// Types
export * from './types';

// Services
export { MeetingService, createMeetingService } from './meeting-service';
export {
  TranscriptionService,
  RealtimeTranscriptionSession,
  getTranscriptionService,
  createTranscriptionService,
} from './transcription-service';
export {
  SummaryService,
  getSummaryService,
  createSummaryService,
} from './summary-service';
