/**
 * Persona Service for IntelliClone
 *
 * This service manages user personas - learning about users through conversations,
 * storing personality traits, and using this knowledge to provide personalized experiences.
 */
import { nanoid } from 'nanoid';
import { createEmptyPersona } from '../types/persona.js';
/**
 * In-memory persona storage for development/testing
 */
export class InMemoryPersonaStorage {
    personas = new Map();
    getKey(userId, tenantId, chatbotId) {
        return `${tenantId}:${userId}:${chatbotId ?? 'global'}`;
    }
    async get(userId, tenantId, chatbotId) {
        const key = this.getKey(userId, tenantId, chatbotId);
        return this.personas.get(key) ?? null;
    }
    async save(persona) {
        const key = this.getKey(persona.userId, persona.tenantId, persona.chatbotId);
        if (!persona.id) {
            persona.id = nanoid();
        }
        this.personas.set(key, persona);
        return persona;
    }
    async update(personaId, updates) {
        for (const [key, persona] of this.personas) {
            if (persona.id === personaId) {
                const updated = { ...persona, ...updates, lastUpdated: new Date() };
                this.personas.set(key, updated);
                return updated;
            }
        }
        throw new Error(`Persona not found: ${personaId}`);
    }
    async delete(personaId) {
        for (const [key, persona] of this.personas) {
            if (persona.id === personaId) {
                this.personas.delete(key);
                return;
            }
        }
    }
    async listByTenant(tenantId, limit = 100) {
        const results = [];
        for (const persona of this.personas.values()) {
            if (persona.tenantId === tenantId) {
                results.push(persona);
                if (results.length >= limit)
                    break;
            }
        }
        return results;
    }
}
/**
 * Probing questions to learn about users
 */
const PROBING_QUESTIONS = [
    // Professional questions
    {
        id: 'prof-1',
        category: 'professional',
        question: "What's your role at your company?",
        questionNo: 'Hva er din rolle i bedriften?',
        followUpQuestions: [
            'What are your main responsibilities?',
            'How large is your team?',
        ],
        personaFields: ['professionalProfile.title', 'professionalProfile.company'],
        priority: 10,
        askedCount: 0,
        successRate: 0.85,
    },
    {
        id: 'prof-2',
        category: 'professional',
        question: 'What industry do you work in?',
        questionNo: 'Hvilken bransje jobber du i?',
        followUpQuestions: [
            'How long have you been in this industry?',
        ],
        personaFields: ['professionalProfile.industry'],
        priority: 9,
        askedCount: 0,
        successRate: 0.9,
    },
    {
        id: 'prof-3',
        category: 'professional',
        question: "What are the biggest challenges you're facing at work right now?",
        questionNo: 'Hva er de største utfordringene du står overfor på jobb akkurat nå?',
        followUpQuestions: [
            'How are you currently addressing these challenges?',
        ],
        personaFields: ['professionalProfile.challenges'],
        priority: 8,
        askedCount: 0,
        successRate: 0.75,
    },
    // Goals questions
    {
        id: 'goals-1',
        category: 'goals',
        question: 'What are your main goals for the next quarter?',
        questionNo: 'Hva er hovedmålene dine for neste kvartal?',
        followUpQuestions: [
            'What would success look like for you?',
        ],
        personaFields: ['professionalProfile.goals'],
        priority: 8,
        askedCount: 0,
        successRate: 0.7,
    },
    {
        id: 'goals-2',
        category: 'goals',
        question: 'What projects are you most excited about right now?',
        questionNo: 'Hvilke prosjekter er du mest begeistret for akkurat nå?',
        followUpQuestions: [
            'What makes this project important to you?',
        ],
        personaFields: ['professionalProfile.goals', 'personalPreferences.interests'],
        priority: 7,
        askedCount: 0,
        successRate: 0.8,
    },
    // Communication preferences
    {
        id: 'comm-1',
        category: 'communication',
        question: 'Do you prefer formal or casual communication?',
        questionNo: 'Foretrekker du formell eller uformell kommunikasjon?',
        followUpQuestions: [],
        personaFields: ['communicationStyle.formality'],
        priority: 6,
        askedCount: 0,
        successRate: 0.85,
    },
    {
        id: 'comm-2',
        category: 'communication',
        question: 'Do you prefer brief summaries or detailed explanations?',
        questionNo: 'Foretrekker du korte sammendrag eller detaljerte forklaringer?',
        followUpQuestions: [],
        personaFields: ['communicationStyle.verbosity'],
        priority: 6,
        askedCount: 0,
        successRate: 0.8,
    },
    // Preferences
    {
        id: 'pref-1',
        category: 'preferences',
        question: 'When do you usually prefer to work on important tasks?',
        questionNo: 'Når foretrekker du vanligvis å jobbe med viktige oppgaver?',
        followUpQuestions: [
            'Are there times when you prefer not to be disturbed?',
        ],
        personaFields: ['personalPreferences.preferredContactTime'],
        priority: 5,
        askedCount: 0,
        successRate: 0.7,
    },
    {
        id: 'pref-2',
        category: 'preferences',
        question: 'How do you like information presented - bullet points, detailed paragraphs, or something else?',
        questionNo: 'Hvordan liker du at informasjon presenteres - punktlister, detaljerte avsnitt, eller noe annet?',
        followUpQuestions: [],
        personaFields: ['personalPreferences.infoFormat'],
        priority: 5,
        askedCount: 0,
        successRate: 0.75,
    },
    // Relationships
    {
        id: 'rel-1',
        category: 'relationships',
        question: 'Who are the key stakeholders you work with?',
        questionNo: 'Hvem er de viktigste interessentene du jobber med?',
        followUpQuestions: [
            'How do you typically communicate with them?',
        ],
        personaFields: ['relationships.keyPeople'],
        priority: 4,
        askedCount: 0,
        successRate: 0.65,
    },
];
const DEFAULT_CONFIG = {
    minConfidenceToUse: 0.6,
    minConversationsForReliability: 5,
    autoAskQuestions: true,
    maxQuestionsPerConversation: 2,
    preferredLanguage: 'no',
};
/**
 * The Persona Service - learns about users and helps personalize interactions
 */
export class PersonaService {
    storage;
    config;
    constructor(storage, config = {}) {
        this.storage = storage;
        this.config = { ...DEFAULT_CONFIG, ...config };
    }
    /**
     * Get or create a persona for a user
     */
    async getOrCreatePersona(userId, tenantId, chatbotId) {
        const existing = await this.storage.get(userId, tenantId, chatbotId);
        if (existing) {
            return existing;
        }
        const newPersona = createEmptyPersona(userId, tenantId, chatbotId);
        return this.storage.save(newPersona);
    }
    /**
     * Update persona with new insights from a conversation
     */
    async updateFromInsights(personaId, insights) {
        const persona = await this.getPersonaById(personaId);
        if (!persona) {
            throw new Error(`Persona not found: ${personaId}`);
        }
        const updates = {
            conversationsAnalyzed: persona.conversationsAnalyzed + 1,
            version: persona.version + 1,
        };
        for (const insight of insights) {
            this.applyInsightToPersona(persona, insight);
        }
        // Recalculate overall confidence
        updates.overallConfidence = this.calculateOverallConfidence(persona);
        return this.storage.update(personaId, {
            ...updates,
            ...persona,
        });
    }
    /**
     * Apply a single insight to the persona
     */
    applyInsightToPersona(persona, insight) {
        switch (insight.type) {
            case 'fact':
                this.addFact(persona, insight.content, insight.confidence);
                break;
            case 'preference':
                this.updatePreference(persona, insight);
                break;
            case 'style':
                this.updateCommunicationStyle(persona, insight);
                break;
            case 'relationship':
                this.addRelationship(persona, insight.content);
                break;
            case 'goal':
                this.addGoal(persona, insight.content);
                break;
            case 'challenge':
                this.addChallenge(persona, insight.content);
                break;
        }
    }
    /**
     * Add a fact to the persona
     */
    addFact(persona, fact, confidence) {
        // Categorize the fact
        const category = this.categorizeFact(fact);
        if (!persona.facts[category]) {
            persona.facts[category] = [];
        }
        // Avoid duplicates
        if (!persona.facts[category].includes(fact)) {
            persona.facts[category].push(fact);
        }
    }
    /**
     * Categorize a fact into a category
     */
    categorizeFact(fact) {
        const lowered = fact.toLowerCase();
        if (lowered.includes('job') || lowered.includes('work') || lowered.includes('company') ||
            lowered.includes('jobb') || lowered.includes('bedrift') || lowered.includes('firma')) {
            return 'professional';
        }
        if (lowered.includes('like') || lowered.includes('prefer') || lowered.includes('enjoy') ||
            lowered.includes('liker') || lowered.includes('foretrekker')) {
            return 'preferences';
        }
        if (lowered.includes('family') || lowered.includes('friend') || lowered.includes('colleague') ||
            lowered.includes('familie') || lowered.includes('venn') || lowered.includes('kollega')) {
            return 'relationships';
        }
        return 'general';
    }
    /**
     * Update a preference in the persona
     */
    updatePreference(persona, insight) {
        // Parse the preference from the content
        const content = insight.content.toLowerCase();
        if (content.includes('formal') || content.includes('formell')) {
            persona.communicationStyle.formality = Math.min(1, persona.communicationStyle.formality + 0.1);
        }
        else if (content.includes('casual') || content.includes('uformell')) {
            persona.communicationStyle.formality = Math.max(0, persona.communicationStyle.formality - 0.1);
        }
        if (content.includes('brief') || content.includes('short') || content.includes('kort')) {
            persona.communicationStyle.verbosity = Math.max(0, persona.communicationStyle.verbosity - 0.1);
        }
        else if (content.includes('detail') || content.includes('thorough') || content.includes('detaljert')) {
            persona.communicationStyle.verbosity = Math.min(1, persona.communicationStyle.verbosity + 0.1);
        }
        // Add to interests if it's an interest-related preference
        if (content.includes('interest') || content.includes('enjoy') ||
            content.includes('interessert') || content.includes('liker')) {
            const interest = insight.content.replace(/^(I am interested in|I enjoy|Jeg er interessert i|Jeg liker)\s*/i, '').trim();
            if (interest && !persona.personalPreferences.interests.includes(interest)) {
                persona.personalPreferences.interests.push(interest);
            }
        }
    }
    /**
     * Update communication style
     */
    updateCommunicationStyle(persona, insight) {
        // This would analyze the actual message style
        // For now, use the insight content to guide updates
        const content = insight.content.toLowerCase();
        if (insight.personaField) {
            const field = insight.personaField.split('.');
            if (field[0] === 'communicationStyle' && field[1]) {
                const key = field[1];
                if (typeof persona.communicationStyle[key] === 'number') {
                    // Adjust based on insight confidence
                    const currentValue = persona.communicationStyle[key];
                    const adjustment = insight.confidence > 0.8 ? 0.15 : 0.05;
                    persona.communicationStyle[key] =
                        content.includes('high') || content.includes('more') || content.includes('høy') || content.includes('mer')
                            ? Math.min(1, currentValue + adjustment)
                            : Math.max(0, currentValue - adjustment);
                }
            }
        }
    }
    /**
     * Add a relationship to the persona
     */
    addRelationship(persona, content) {
        // Extract person or organization from content
        const personMatch = content.match(/(?:works with|knows|colleague|manager|report|jobber med|kjenner|kollega|leder)\s+(.+)/i);
        if (personMatch && personMatch[1]) {
            const name = personMatch[1].trim();
            const existing = persona.relationships.keyPeople.find(p => p.name.toLowerCase() === name.toLowerCase());
            if (!existing) {
                persona.relationships.keyPeople.push({
                    name,
                    relationship: 'contact',
                    notes: content,
                });
            }
        }
    }
    /**
     * Add a goal to the persona
     */
    addGoal(persona, content) {
        if (!persona.professionalProfile.goals.includes(content)) {
            persona.professionalProfile.goals.push(content);
        }
    }
    /**
     * Add a challenge to the persona
     */
    addChallenge(persona, content) {
        if (!persona.professionalProfile.challenges.includes(content)) {
            persona.professionalProfile.challenges.push(content);
        }
    }
    /**
     * Calculate overall confidence in the persona
     */
    calculateOverallConfidence(persona) {
        let factors = 0;
        let totalConfidence = 0;
        // More conversations = more confidence
        const conversationFactor = Math.min(1, persona.conversationsAnalyzed / this.config.minConversationsForReliability);
        factors++;
        totalConfidence += conversationFactor;
        // More facts = more confidence
        const factCount = Object.values(persona.facts).flat().length;
        const factFactor = Math.min(1, factCount / 10);
        factors++;
        totalConfidence += factFactor;
        // Professional info filled = more confidence
        const profProfile = persona.professionalProfile;
        const profFilledCount = [
            profProfile.title,
            profProfile.company,
            profProfile.industry,
            profProfile.goals.length > 0,
        ].filter(Boolean).length;
        const profFactor = profFilledCount / 4;
        factors++;
        totalConfidence += profFactor;
        return factors > 0 ? totalConfidence / factors : 0;
    }
    /**
     * Get the next probing question to ask the user
     */
    getNextProbingQuestion(persona, askedQuestionIds = []) {
        if (!this.config.autoAskQuestions) {
            return null;
        }
        // Filter out already asked questions
        const available = PROBING_QUESTIONS.filter(q => !askedQuestionIds.includes(q.id));
        if (available.length === 0) {
            return null;
        }
        // Prioritize based on what's missing from persona
        const prioritized = this.prioritizeQuestions(available, persona);
        return prioritized[0] ?? null;
    }
    /**
     * Prioritize questions based on persona gaps
     */
    prioritizeQuestions(questions, persona) {
        return questions
            .map(q => {
            let boost = 0;
            // Boost questions for empty persona fields
            for (const field of q.personaFields) {
                const value = this.getNestedValue(persona, field);
                if (this.isEmpty(value)) {
                    boost += 3;
                }
            }
            // Boost based on success rate
            boost += q.successRate * 2;
            // Boost based on priority
            boost += q.priority;
            return { question: q, score: boost };
        })
            .sort((a, b) => b.score - a.score)
            .map(item => item.question);
    }
    /**
     * Get a nested value from an object using dot notation
     */
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    /**
     * Check if a value is empty
     */
    isEmpty(value) {
        if (value === undefined || value === null)
            return true;
        if (typeof value === 'string' && value === '')
            return true;
        if (Array.isArray(value) && value.length === 0)
            return true;
        return false;
    }
    /**
     * Compose an email in the user's style
     */
    async composeEmail(persona, request) {
        const style = persona.communicationStyle;
        // Determine email style based on persona
        const isFormatl = request.toneOverride === 'formal' ||
            (request.toneOverride === undefined && style.formality > 0.6);
        const isDetailed = request.length === 'long' ||
            (request.length === undefined && style.verbosity > 0.6);
        // Select greeting
        const greeting = this.selectGreeting(style, isFormatl, request.recipient);
        // Build body based on key points
        const body = this.buildEmailBody(request.keyPoints, request.purpose, isFormatl, isDetailed, style);
        // Select signoff
        const signoff = this.selectSignoff(style, isFormatl);
        // Generate subject
        const subject = this.generateSubject(request.purpose, isFormatl);
        // Compose full email
        const fullBody = `${greeting}\n\n${body}\n\n${signoff}`;
        return {
            subject,
            body: fullBody,
            confidenceScore: persona.overallConfidence,
            styleMatchScore: this.calculateStyleMatchScore(persona, request),
            notes: persona.overallConfidence < 0.5
                ? 'Note: This is based on limited knowledge about your communication style. The email may need adjustments.'
                : undefined,
        };
    }
    /**
     * Select an appropriate greeting
     */
    selectGreeting(style, formal, recipient) {
        // Use stored preferred greetings if available
        if (style.preferredGreetings.length > 0) {
            return style.preferredGreetings[0].replace('{name}', recipient);
        }
        // Default Norwegian greetings
        if (style.preferredLanguage === 'no') {
            if (formal) {
                return `Hei ${recipient},`;
            }
            return `Hei ${recipient}!`;
        }
        // English greetings
        if (formal) {
            return `Dear ${recipient},`;
        }
        return `Hi ${recipient},`;
    }
    /**
     * Build the email body
     */
    buildEmailBody(keyPoints, purpose, formal, detailed, style) {
        const parts = [];
        // Opening based on purpose
        parts.push(this.getOpeningLine(purpose, formal, style.preferredLanguage));
        // Add key points
        if (detailed && keyPoints.length > 2) {
            // Use bullet points for many points
            parts.push('\n' + keyPoints.map(p => `• ${p}`).join('\n'));
        }
        else {
            // Integrate into paragraphs
            keyPoints.forEach(point => {
                parts.push(point);
            });
        }
        // Add closing based on purpose
        parts.push('\n' + this.getClosingLine(purpose, formal, style.preferredLanguage));
        return parts.join('\n\n');
    }
    /**
     * Get opening line based on purpose
     */
    getOpeningLine(purpose, formal, language) {
        const purposeLower = purpose.toLowerCase();
        if (language === 'no') {
            if (purposeLower.includes('follow up') || purposeLower.includes('oppfølging')) {
                return formal
                    ? 'Jeg skriver for å følge opp vår tidligere samtale.'
                    : 'Bare en rask oppfølging på det vi snakket om.';
            }
            if (purposeLower.includes('request') || purposeLower.includes('forespørsel')) {
                return formal
                    ? 'Jeg henvender meg til deg angående en forespørsel.'
                    : 'Jeg lurer på om du kunne hjelpe meg med noe.';
            }
            if (purposeLower.includes('meeting') || purposeLower.includes('møte')) {
                return formal
                    ? 'Jeg skriver for å avtale et møte.'
                    : 'Jeg ville høre om du har tid til et møte.';
            }
            return formal
                ? 'Jeg håper denne e-posten finner deg vel.'
                : 'Håper alt står bra til!';
        }
        // English
        if (purposeLower.includes('follow up')) {
            return formal
                ? 'I am writing to follow up on our previous conversation.'
                : "Just following up on what we discussed.";
        }
        if (purposeLower.includes('request')) {
            return formal
                ? 'I am reaching out regarding a request.'
                : 'I was wondering if you could help me with something.';
        }
        if (purposeLower.includes('meeting')) {
            return formal
                ? 'I am writing to schedule a meeting.'
                : 'I wanted to see if you have time for a meeting.';
        }
        return formal
            ? 'I hope this email finds you well.'
            : 'Hope you\'re doing well!';
    }
    /**
     * Get closing line based on purpose
     */
    getClosingLine(purpose, formal, language) {
        if (language === 'no') {
            if (formal) {
                return 'Vennligst ta kontakt dersom du har spørsmål.';
            }
            return 'Gi meg beskjed hvis du har spørsmål!';
        }
        if (formal) {
            return 'Please do not hesitate to reach out if you have any questions.';
        }
        return 'Let me know if you have any questions!';
    }
    /**
     * Select signoff
     */
    selectSignoff(style, formal) {
        // Use stored preferred signoffs if available
        if (style.preferredSignoffs.length > 0) {
            return style.preferredSignoffs[0];
        }
        if (style.preferredLanguage === 'no') {
            if (formal) {
                return 'Med vennlig hilsen,';
            }
            return 'Beste hilsen,';
        }
        if (formal) {
            return 'Best regards,';
        }
        return 'Thanks,';
    }
    /**
     * Generate email subject
     */
    generateSubject(purpose, formal) {
        // Clean up purpose for subject
        let subject = purpose.charAt(0).toUpperCase() + purpose.slice(1);
        // Remove common filler words
        subject = subject
            .replace(/^(I want to|I need to|Please|Can you)\s+/i, '')
            .replace(/\.$/, '');
        return subject;
    }
    /**
     * Calculate how well the email matches the user's style
     */
    calculateStyleMatchScore(persona, request) {
        let score = 0.5; // Base score
        // If we have preferred greetings/signoffs, we match better
        if (persona.communicationStyle.preferredGreetings.length > 0) {
            score += 0.15;
        }
        if (persona.communicationStyle.preferredSignoffs.length > 0) {
            score += 0.15;
        }
        // More conversations analyzed = better match
        score += Math.min(0.2, persona.conversationsAnalyzed * 0.02);
        return Math.min(1, score);
    }
    /**
     * Get a persona by ID
     */
    async getPersonaById(personaId) {
        // This is a simplified implementation - in production, you'd have a direct lookup
        // For now, we iterate through storage
        return null; // TODO: Implement proper lookup
    }
    /**
     * Analyze a message to extract communication style signals
     */
    analyzeMessageStyle(message) {
        const style = {};
        // Check formality
        const formalIndicators = ['please', 'kindly', 'regarding', 'hereby', 'vennligst', 'vedrørende'];
        const casualIndicators = ['hey', 'hi!', 'thanks!', 'cool', 'awesome', 'hei!', 'kult', 'fett'];
        const formalCount = formalIndicators.filter(i => message.toLowerCase().includes(i)).length;
        const casualCount = casualIndicators.filter(i => message.toLowerCase().includes(i)).length;
        if (formalCount > casualCount) {
            style.formality = 0.7 + (formalCount * 0.05);
        }
        else if (casualCount > formalCount) {
            style.formality = 0.3 - (casualCount * 0.05);
        }
        // Check verbosity (based on message length and punctuation)
        const wordCount = message.split(/\s+/).length;
        const sentenceCount = message.split(/[.!?]+/).length;
        const avgWordsPerSentence = wordCount / Math.max(1, sentenceCount);
        if (avgWordsPerSentence > 20) {
            style.verbosity = 0.8;
        }
        else if (avgWordsPerSentence < 10) {
            style.verbosity = 0.3;
        }
        else {
            style.verbosity = 0.5;
        }
        // Check directness
        const hedgeWords = ['maybe', 'perhaps', 'possibly', 'might', 'kanskje', 'muligens'];
        const directWords = ['must', 'need', 'should', 'will', 'må', 'trenger', 'skal'];
        const hedgeCount = hedgeWords.filter(h => message.toLowerCase().includes(h)).length;
        const directCount = directWords.filter(d => message.toLowerCase().includes(d)).length;
        if (directCount > hedgeCount) {
            style.directness = 0.7;
        }
        else if (hedgeCount > directCount) {
            style.directness = 0.3;
        }
        // Detect language
        const norwegianWords = ['jeg', 'er', 'det', 'og', 'på', 'med', 'til', 'som', 'en', 'av'];
        const norwegianCount = norwegianWords.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(message)).length;
        style.preferredLanguage = norwegianCount >= 3 ? 'no' : 'en';
        return style;
    }
    /**
     * Get all probing questions for a category
     */
    getQuestionsByCategory(category) {
        return PROBING_QUESTIONS.filter(q => q.category === category);
    }
    /**
     * Get the question text in the appropriate language
     */
    getQuestionText(question, language = 'no') {
        return language === 'no' ? question.questionNo : question.question;
    }
}
//# sourceMappingURL=persona-service.js.map