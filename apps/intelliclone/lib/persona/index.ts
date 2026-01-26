/**
 * Persona module for IntelliClone
 * 
 * Exports persona-related functionality for personalized AI interactions.
 */

export {
  getPersonaService,
  getOrCreatePersona,
  learnFromConversation,
  getNextQuestion,
  getQuestionText,
  composeEmail,
  buildPersonalizedPrompt,
  analyzeSignaturePatterns,
  getPersonaSummary,
  type UserPersona,
  type ProbingQuestion,
  type EmailCompositionRequest,
  type ComposedEmail,
  type ConversationInsight,
  type CommunicationStyle,
} from './persona-client';
