/**
 * Persona Service for IntelliClone
 *
 * This service manages user personas - learning about users through conversations,
 * storing personality traits, and using this knowledge to provide personalized experiences.
 */
import type { UserPersona, CommunicationStyle, ProbingQuestion, QuestionCategory, EmailCompositionRequest, ComposedEmail, ConversationInsight } from '../types/persona.js';
/**
 * Storage interface for personas
 */
export interface PersonaStorage {
    get(userId: string, tenantId: string, chatbotId?: string): Promise<UserPersona | null>;
    save(persona: UserPersona): Promise<UserPersona>;
    update(personaId: string, updates: Partial<UserPersona>): Promise<UserPersona>;
    delete(personaId: string): Promise<void>;
    listByTenant(tenantId: string, limit?: number): Promise<UserPersona[]>;
}
/**
 * In-memory persona storage for development/testing
 */
export declare class InMemoryPersonaStorage implements PersonaStorage {
    private personas;
    private getKey;
    get(userId: string, tenantId: string, chatbotId?: string): Promise<UserPersona | null>;
    save(persona: UserPersona): Promise<UserPersona>;
    update(personaId: string, updates: Partial<UserPersona>): Promise<UserPersona>;
    delete(personaId: string): Promise<void>;
    listByTenant(tenantId: string, limit?: number): Promise<UserPersona[]>;
}
/**
 * Configuration for the Persona Service
 */
export interface PersonaServiceConfig {
    /** Minimum confidence to use a persona trait */
    minConfidenceToUse: number;
    /** How many conversations before persona is "reliable" */
    minConversationsForReliability: number;
    /** Enable automatic question asking */
    autoAskQuestions: boolean;
    /** Maximum questions to ask per conversation */
    maxQuestionsPerConversation: number;
    /** Language preference ('no' for Norwegian, 'en' for English) */
    preferredLanguage: 'no' | 'en';
}
/**
 * The Persona Service - learns about users and helps personalize interactions
 */
export declare class PersonaService {
    private readonly storage;
    private readonly config;
    constructor(storage: PersonaStorage, config?: Partial<PersonaServiceConfig>);
    /**
     * Get or create a persona for a user
     */
    getOrCreatePersona(userId: string, tenantId: string, chatbotId?: string): Promise<UserPersona>;
    /**
     * Update persona with new insights from a conversation
     */
    updateFromInsights(personaId: string, insights: ConversationInsight[]): Promise<UserPersona>;
    /**
     * Apply a single insight to the persona
     */
    private applyInsightToPersona;
    /**
     * Add a fact to the persona
     */
    private addFact;
    /**
     * Categorize a fact into a category
     */
    private categorizeFact;
    /**
     * Update a preference in the persona
     */
    private updatePreference;
    /**
     * Update communication style
     */
    private updateCommunicationStyle;
    /**
     * Add a relationship to the persona
     */
    private addRelationship;
    /**
     * Add a goal to the persona
     */
    private addGoal;
    /**
     * Add a challenge to the persona
     */
    private addChallenge;
    /**
     * Calculate overall confidence in the persona
     */
    private calculateOverallConfidence;
    /**
     * Get the next probing question to ask the user
     */
    getNextProbingQuestion(persona: UserPersona, askedQuestionIds?: string[]): ProbingQuestion | null;
    /**
     * Prioritize questions based on persona gaps
     */
    private prioritizeQuestions;
    /**
     * Get a nested value from an object using dot notation
     */
    private getNestedValue;
    /**
     * Check if a value is empty
     */
    private isEmpty;
    /**
     * Compose an email in the user's style
     */
    composeEmail(persona: UserPersona, request: EmailCompositionRequest): Promise<ComposedEmail>;
    /**
     * Select an appropriate greeting
     */
    private selectGreeting;
    /**
     * Build the email body
     */
    private buildEmailBody;
    /**
     * Get opening line based on purpose
     */
    private getOpeningLine;
    /**
     * Get closing line based on purpose
     */
    private getClosingLine;
    /**
     * Select signoff
     */
    private selectSignoff;
    /**
     * Generate email subject
     */
    private generateSubject;
    /**
     * Calculate how well the email matches the user's style
     */
    private calculateStyleMatchScore;
    /**
     * Get a persona by ID
     */
    private getPersonaById;
    /**
     * Analyze a message to extract communication style signals
     */
    analyzeMessageStyle(message: string): Partial<CommunicationStyle>;
    /**
     * Get all probing questions for a category
     */
    getQuestionsByCategory(category: QuestionCategory): ProbingQuestion[];
    /**
     * Get the question text in the appropriate language
     */
    getQuestionText(question: ProbingQuestion, language?: 'no' | 'en'): string;
}
//# sourceMappingURL=persona-service.d.ts.map