/**
 * Persona Client for IntelliClone
 * 
 * Integrates the @kit/memory-core persona system with IntelliClone.
 * Provides a simple API for learning about users and personalizing interactions.
 */

import {
  PersonaService,
  InMemoryPersonaStorage,
  extractConversationInsights,
  analyzeWritingStyle,
  extractSignaturePatterns,
  type UserPersona,
  type ProbingQuestion,
  type EmailCompositionRequest,
  type ComposedEmail,
  type ConversationInsight,
  type CommunicationStyle,
} from '@kit/memory-core';

// Singleton instances
let personaServiceInstance: PersonaService | null = null;
let personaStorageInstance: InMemoryPersonaStorage | null = null;

/**
 * Get or create the persona service instance
 */
export function getPersonaService(): PersonaService {
  if (!personaServiceInstance) {
    // For MVP, use in-memory storage
    // TODO: Replace with PostgreSQL storage for production
    personaStorageInstance = new InMemoryPersonaStorage();
    
    personaServiceInstance = new PersonaService(personaStorageInstance, {
      preferredLanguage: 'no', // Default to Norwegian
      autoAskQuestions: true,
      maxQuestionsPerConversation: 2,
    });
  }
  
  return personaServiceInstance;
}

/**
 * Get or create persona for a user
 */
export async function getOrCreatePersona(params: {
  userId: string;
  tenantId: string;
  chatbotId?: string;
}): Promise<UserPersona> {
  const service = getPersonaService();
  return service.getOrCreatePersona(params.userId, params.tenantId, params.chatbotId);
}

/**
 * Learn from a conversation turn
 * 
 * This is the main entry point for persona learning.
 * Call this after each conversation turn to extract insights.
 */
export async function learnFromConversation(params: {
  userId: string;
  tenantId: string;
  chatbotId?: string;
  userMessage: string;
  assistantResponse: string;
}): Promise<{
  insights: ConversationInsight[];
  persona: UserPersona;
  styleAnalysis: Partial<CommunicationStyle>;
}> {
  const service = getPersonaService();
  
  // Get or create persona
  const persona = await service.getOrCreatePersona(
    params.userId,
    params.tenantId,
    params.chatbotId
  );
  
  // Extract insights from the conversation
  const insights = extractConversationInsights(
    params.userMessage,
    params.assistantResponse
  );
  
  // Analyze writing style
  const styleAnalysis = service.analyzeMessageStyle(params.userMessage);
  
  // Add style insights
  if (Object.keys(styleAnalysis).length > 0) {
    insights.push({
      type: 'style',
      content: JSON.stringify(styleAnalysis),
      confidence: 0.6,
      source: params.userMessage,
      personaField: 'communicationStyle',
    });
  }
  
  // Update persona with insights
  if (insights.length > 0 && persona.id) {
    // Note: In production, this would update via storage
    // For now, we track insights but storage is in-memory
    console.log(`[Persona] Extracted ${insights.length} insights for user ${params.userId}`);
  }
  
  return {
    insights,
    persona,
    styleAnalysis,
  };
}

/**
 * Get the next probing question to ask the user
 */
export function getNextQuestion(
  persona: UserPersona,
  alreadyAsked: string[] = []
): ProbingQuestion | null {
  const service = getPersonaService();
  return service.getNextProbingQuestion(persona, alreadyAsked);
}

/**
 * Get question text in the appropriate language
 */
export function getQuestionText(
  question: ProbingQuestion,
  language: 'no' | 'en' = 'no'
): string {
  const service = getPersonaService();
  return service.getQuestionText(question, language);
}

/**
 * Compose an email in the user's style
 */
export async function composeEmail(params: {
  userId: string;
  tenantId: string;
  chatbotId?: string;
  request: EmailCompositionRequest;
}): Promise<ComposedEmail> {
  const service = getPersonaService();
  const persona = await service.getOrCreatePersona(
    params.userId,
    params.tenantId,
    params.chatbotId
  );
  
  return service.composeEmail(persona, params.request);
}

/**
 * Build a personalized system prompt based on persona
 */
export function buildPersonalizedPrompt(
  persona: UserPersona,
  basePrompt: string
): string {
  const personalizations: string[] = [];
  
  // Add professional context if known
  if (persona.professionalProfile.title || persona.professionalProfile.company) {
    const parts: string[] = [];
    if (persona.professionalProfile.title) {
      parts.push(persona.professionalProfile.title);
    }
    if (persona.professionalProfile.company) {
      parts.push(`at ${persona.professionalProfile.company}`);
    }
    personalizations.push(`The user works as ${parts.join(' ')}.`);
  }
  
  // Add communication style preferences
  const style = persona.communicationStyle;
  const styleNotes: string[] = [];
  
  if (style.formality > 0.7) {
    styleNotes.push('Use formal, professional language.');
  } else if (style.formality < 0.3) {
    styleNotes.push('Use casual, friendly language.');
  }
  
  if (style.verbosity > 0.7) {
    styleNotes.push('Provide detailed, thorough explanations.');
  } else if (style.verbosity < 0.3) {
    styleNotes.push('Keep responses brief and to the point.');
  }
  
  if (style.directness > 0.7) {
    styleNotes.push('Be direct and straightforward.');
  }
  
  if (styleNotes.length > 0) {
    personalizations.push(`Communication preferences: ${styleNotes.join(' ')}`);
  }
  
  // Add language preference
  if (style.preferredLanguage === 'no') {
    personalizations.push('The user prefers Norwegian. Respond in Norwegian unless they write in English.');
  }
  
  // Add goals if known
  if (persona.professionalProfile.goals.length > 0) {
    personalizations.push(`User's goals: ${persona.professionalProfile.goals.slice(0, 3).join(', ')}`);
  }
  
  // Add challenges if known
  if (persona.professionalProfile.challenges.length > 0) {
    personalizations.push(`User's challenges: ${persona.professionalProfile.challenges.slice(0, 2).join(', ')}`);
  }
  
  // Add key facts
  const allFacts = Object.values(persona.facts).flat();
  if (allFacts.length > 0) {
    personalizations.push(`Known facts: ${allFacts.slice(0, 5).join('; ')}`);
  }
  
  // Build the personalized prompt
  if (personalizations.length === 0) {
    return basePrompt;
  }
  
  const personalizationSection = `
## User Profile
${personalizations.join('\n')}

Use this information to provide personalized responses. Don't explicitly mention that you "know" these things.
`;
  
  return basePrompt + '\n' + personalizationSection;
}

/**
 * Analyze multiple messages to extract signature patterns
 */
export function analyzeSignaturePatterns(messages: string[]): {
  greetings: string[];
  signoffs: string[];
  phrases: string[];
} {
  return extractSignaturePatterns(messages);
}

/**
 * Get persona summary for display
 */
export function getPersonaSummary(persona: UserPersona): {
  displayName: string;
  role: string | null;
  company: string | null;
  communicationStyle: string;
  knownFacts: number;
  confidence: string;
  lastUpdated: string;
} {
  const prof = persona.professionalProfile;
  const style = persona.communicationStyle;
  
  // Determine communication style description
  let styleDescription: string;
  if (style.formality > 0.6 && style.verbosity > 0.6) {
    styleDescription = 'Formal and detailed';
  } else if (style.formality > 0.6 && style.verbosity < 0.4) {
    styleDescription = 'Formal and concise';
  } else if (style.formality < 0.4 && style.verbosity > 0.6) {
    styleDescription = 'Casual and detailed';
  } else if (style.formality < 0.4 && style.verbosity < 0.4) {
    styleDescription = 'Casual and brief';
  } else {
    styleDescription = 'Balanced';
  }
  
  // Count known facts
  const factCount = Object.values(persona.facts).flat().length;
  
  // Confidence level
  let confidence: string;
  if (persona.overallConfidence > 0.7) {
    confidence = 'High';
  } else if (persona.overallConfidence > 0.4) {
    confidence = 'Medium';
  } else {
    confidence = 'Low';
  }
  
  return {
    displayName: persona.name ?? 'Unknown',
    role: prof.title ?? null,
    company: prof.company ?? null,
    communicationStyle: styleDescription,
    knownFacts: factCount,
    confidence,
    lastUpdated: persona.lastUpdated.toISOString(),
  };
}

/**
 * Export types for use in components
 */
export type {
  UserPersona,
  ProbingQuestion,
  EmailCompositionRequest,
  ComposedEmail,
  ConversationInsight,
  CommunicationStyle,
};
