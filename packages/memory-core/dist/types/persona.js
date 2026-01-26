/**
 * Persona Types for IntelliClone
 *
 * Defines the structure of user personas that the chatbot learns over time.
 * This is what makes IntelliClone "smart" - it builds a rich understanding of each user.
 */
/**
 * Create an empty/default persona
 */
export function createEmptyPersona(userId, tenantId, chatbotId) {
    const now = new Date();
    return {
        id: '', // Will be set by storage
        userId,
        tenantId,
        chatbotId,
        communicationStyle: {
            formality: 0.5,
            verbosity: 0.5,
            directness: 0.5,
            emotionality: 0.5,
            technicality: 0.5,
            preferredLanguage: 'no', // Default to Norwegian
            signatures: [],
            preferredGreetings: [],
            preferredSignoffs: [],
        },
        professionalProfile: {
            responsibilities: [],
            goals: [],
            challenges: [],
        },
        personalPreferences: {
            interests: [],
            avoidTopics: [],
            infoFormat: 'mixed',
            urgencyLevel: 'flexible',
        },
        relationships: {
            keyPeople: [],
            organizations: [],
            importantDates: [],
        },
        facts: {},
        overallConfidence: 0,
        conversationsAnalyzed: 0,
        lastUpdated: now,
        createdAt: now,
        version: 1,
    };
}
//# sourceMappingURL=persona.js.map