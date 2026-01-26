/**
 * Insight Extractor for IntelliClone
 *
 * Automatically extracts insights from conversations to build user personas.
 * Uses pattern matching and keyword analysis (can be enhanced with LLM later).
 */
/**
 * Patterns for extracting professional information
 */
const PROFESSIONAL_PATTERNS = [
    {
        type: 'fact',
        patterns: [
            /(?:I am|I'm|Jeg er)\s+(?:a |an |en )?(.+?)\s+(?:at|hos|i)\s+(.+?)(?:\.|,|$)/i,
            /(?:I work|Jeg jobber)\s+(?:as |som )?(?:a |an |en )?(.+?)\s+(?:at|hos|i)\s+(.+?)(?:\.|,|$)/i,
        ],
        extractValue: (match) => `Works as ${match[1]} at ${match[2]}`,
        confidence: 0.9,
        personaField: 'professionalProfile.title',
    },
    {
        type: 'fact',
        patterns: [
            /(?:My company|Our company|Firmaet mitt|Vi i)\s+(.+?)\s+(?:does|makes|provides|sells|driver med|lager|tilbyr|selger)/i,
            /(?:I work for|Jeg jobber for)\s+(.+?)(?:\.|,|$)/i,
        ],
        extractValue: (match) => `Works for ${match[1]}`,
        confidence: 0.85,
        personaField: 'professionalProfile.company',
    },
    {
        type: 'fact',
        patterns: [
            /(?:I manage|I lead|Jeg leder)\s+(?:a team of\s+)?(\d+)\s+(?:people|employees|developers|folk|ansatte)/i,
        ],
        extractValue: (match) => `Manages a team of ${match[1]} people`,
        confidence: 0.9,
        personaField: 'professionalProfile.teamSize',
    },
];
/**
 * Patterns for extracting preferences
 */
const PREFERENCE_PATTERNS = [
    {
        type: 'preference',
        patterns: [
            /(?:I prefer|I like|Jeg foretrekker|Jeg liker)\s+(?:to have |å ha |to receive |å motta )?(.+?)(?:\.|,|$)/i,
        ],
        extractValue: (match) => `Prefers: ${match[1]}`,
        confidence: 0.8,
        personaField: 'personalPreferences.interests',
    },
    {
        type: 'preference',
        patterns: [
            /(?:I don't like|I dislike|I hate|Jeg liker ikke|Jeg misliker)\s+(.+?)(?:\.|,|$)/i,
        ],
        extractValue: (match) => `Dislikes: ${match[1]}`,
        confidence: 0.8,
        personaField: 'personalPreferences.avoidTopics',
    },
    {
        type: 'preference',
        patterns: [
            /(?:keep it|make it|gjør det|hold det)\s+(short|brief|simple|kort|enkelt)/i,
        ],
        extractValue: (match) => `Prefers brief communication`,
        confidence: 0.85,
        personaField: 'communicationStyle.verbosity',
    },
    {
        type: 'preference',
        patterns: [
            /(?:give me|send me|I want|gi meg|send meg|jeg vil ha)\s+(?:more |mer )?details?|detailed/i,
        ],
        extractValue: (match) => `Prefers detailed information`,
        confidence: 0.8,
        personaField: 'communicationStyle.verbosity',
    },
];
/**
 * Patterns for extracting goals
 */
const GOAL_PATTERNS = [
    {
        type: 'goal',
        patterns: [
            /(?:I want to|I need to|I'm trying to|My goal is to|Jeg vil|Jeg må|Jeg prøver å|Målet mitt er å)\s+(.+?)(?:\.|,|$)/i,
        ],
        extractValue: (match) => match[1].trim(),
        confidence: 0.75,
        personaField: 'professionalProfile.goals',
    },
    {
        type: 'goal',
        patterns: [
            /(?:We're working on|We need to|Vi jobber med|Vi må)\s+(.+?)(?:\.|,|$)/i,
        ],
        extractValue: (match) => `Team goal: ${match[1]}`,
        confidence: 0.7,
        personaField: 'professionalProfile.goals',
    },
];
/**
 * Patterns for extracting challenges
 */
const CHALLENGE_PATTERNS = [
    {
        type: 'challenge',
        patterns: [
            /(?:I'm struggling with|I have trouble with|The problem is|My challenge is|Jeg sliter med|Problemet er|Utfordringen min er)\s+(.+?)(?:\.|,|$)/i,
        ],
        extractValue: (match) => match[1].trim(),
        confidence: 0.8,
        personaField: 'professionalProfile.challenges',
    },
    {
        type: 'challenge',
        patterns: [
            /(?:It's difficult to|It's hard to|Det er vanskelig å|Det er utfordrende å)\s+(.+?)(?:\.|,|$)/i,
        ],
        extractValue: (match) => `Difficulty: ${match[1]}`,
        confidence: 0.75,
        personaField: 'professionalProfile.challenges',
    },
];
/**
 * Patterns for extracting relationships
 */
const RELATIONSHIP_PATTERNS = [
    {
        type: 'relationship',
        patterns: [
            /(?:My |)(?:boss|manager|colleague|coworker|team lead|Sjefen min|lederen min|kollegaen min)\s+(?:is |er |,\s*)(\w+)/i,
        ],
        extractValue: (match) => `Works with ${match[1]}`,
        confidence: 0.7,
        personaField: 'relationships.keyPeople',
    },
    {
        type: 'relationship',
        patterns: [
            /(?:I report to|I work with|I work under|Jeg rapporterer til|Jeg jobber med)\s+(\w+(?:\s+\w+)?)/i,
        ],
        extractValue: (match) => `Works with ${match[1]}`,
        confidence: 0.75,
        personaField: 'relationships.keyPeople',
    },
];
/**
 * Patterns for communication style signals
 */
const STYLE_PATTERNS = [
    {
        type: 'style',
        patterns: [
            /(?:please be|can you be|could you be|vær så snill å være|kan du være)\s+(formal|professional|formell|profesjonell)/i,
        ],
        extractValue: () => 'Prefers formal communication',
        confidence: 0.9,
        personaField: 'communicationStyle.formality',
    },
    {
        type: 'style',
        patterns: [
            /(?:please be|can you be|could you be|vær så snill å være|kan du være)\s+(casual|relaxed|avslappet|uformell)/i,
        ],
        extractValue: () => 'Prefers casual communication',
        confidence: 0.9,
        personaField: 'communicationStyle.formality',
    },
    {
        type: 'style',
        patterns: [
            /(?:bullet points?|numbered list|punktliste|nummerert liste)/i,
        ],
        extractValue: () => 'Prefers bullet point format',
        confidence: 0.85,
        personaField: 'personalPreferences.infoFormat',
    },
];
/**
 * All extraction patterns combined
 */
const ALL_PATTERNS = [
    ...PROFESSIONAL_PATTERNS,
    ...PREFERENCE_PATTERNS,
    ...GOAL_PATTERNS,
    ...CHALLENGE_PATTERNS,
    ...RELATIONSHIP_PATTERNS,
    ...STYLE_PATTERNS,
];
/**
 * Extract insights from a user message
 */
export function extractInsightsFromMessage(message) {
    const insights = [];
    for (const pattern of ALL_PATTERNS) {
        for (const regex of pattern.patterns) {
            const match = message.match(regex);
            if (match) {
                const content = pattern.extractValue(match);
                // Avoid duplicate insights
                if (!insights.some(i => i.content === content)) {
                    insights.push({
                        type: pattern.type,
                        content,
                        confidence: pattern.confidence,
                        source: match[0],
                        personaField: pattern.personaField,
                    });
                }
            }
        }
    }
    // Also extract general facts from statements
    const generalFacts = extractGeneralFacts(message);
    for (const fact of generalFacts) {
        if (!insights.some(i => i.content === fact.content)) {
            insights.push(fact);
        }
    }
    return insights;
}
/**
 * Extract general facts from "I am/have/do" statements
 */
function extractGeneralFacts(message) {
    const insights = [];
    // Match "I am [something]" patterns
    const iAmPatterns = [
        /(?:^|\. )(?:I am|I'm|Jeg er)\s+(?:a |an |en )?([^,.!?]+)/gi,
        /(?:^|\. )(?:I have|I've got|Jeg har)\s+([^,.!?]+)/gi,
        /(?:^|\. )(?:I live in|I'm from|I'm based in|Jeg bor i|Jeg er fra)\s+([^,.!?]+)/gi,
    ];
    for (const pattern of iAmPatterns) {
        let match;
        while ((match = pattern.exec(message)) !== null) {
            const content = match[1].trim();
            // Filter out common non-informative statements
            if (content.length > 3 && content.length < 100 && !isUniformative(content)) {
                insights.push({
                    type: 'fact',
                    content: `User: ${content}`,
                    confidence: 0.7,
                    source: match[0],
                });
            }
        }
    }
    return insights;
}
/**
 * Check if a statement is uninformative
 */
function isUniformative(statement) {
    const uninformative = [
        'fine', 'good', 'ok', 'okay', 'interested', 'here', 'ready',
        'bra', 'fin', 'klar', 'her', 'ok',
        'looking for', 'wondering', 'trying to', 'asking',
        'looking', 'thinking', 'hoping', 'wanting',
    ];
    const lowered = statement.toLowerCase();
    return uninformative.some(u => lowered.startsWith(u) || lowered === u);
}
/**
 * Extract insights from both user message and assistant response
 */
export function extractConversationInsights(userMessage, assistantResponse) {
    // Focus on user messages for insights
    const insights = extractInsightsFromMessage(userMessage);
    // Boost confidence if assistant acknowledged the fact
    for (const insight of insights) {
        if (assistantResponse.toLowerCase().includes(insight.content.toLowerCase().slice(0, 20))) {
            insight.confidence = Math.min(1, insight.confidence + 0.1);
        }
    }
    return insights;
}
/**
 * Analyze writing style from a message
 */
export function analyzeWritingStyle(message) {
    // Formality indicators
    const formalWords = ['please', 'kindly', 'regarding', 'hereby', 'therefore', 'consequently',
        'vennligst', 'angående', 'dermed', 'følgelig'];
    const casualWords = ['hey', 'hi', 'yeah', 'cool', 'awesome', 'gonna', 'wanna',
        'hei', 'joa', 'kult', 'fett', 'digg'];
    const lowered = message.toLowerCase();
    const formalScore = formalWords.filter(w => lowered.includes(w)).length;
    const casualScore = casualWords.filter(w => lowered.includes(w)).length;
    const formality = 0.5 + (formalScore * 0.1) - (casualScore * 0.1);
    // Verbosity (words per sentence)
    const wordCount = message.split(/\s+/).length;
    const sentenceCount = Math.max(1, message.split(/[.!?]+/).filter(Boolean).length);
    const avgWordsPerSentence = wordCount / sentenceCount;
    const verbosity = Math.min(1, Math.max(0, (avgWordsPerSentence - 5) / 30));
    // Emotionality
    const exclamations = (message.match(/!/g) || []).length;
    const emojis = (message.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    const emotionalWords = ['love', 'hate', 'amazing', 'terrible', 'excited', 'frustrated',
        'elsker', 'hater', 'fantastisk', 'fryktelig', 'spent', 'frustrert'];
    const emotionalScore = emotionalWords.filter(w => lowered.includes(w)).length;
    const emotionality = Math.min(1, (exclamations * 0.1 + emojis * 0.15 + emotionalScore * 0.2));
    // Technicality
    const technicalPatterns = [
        /\b(API|SDK|CLI|UI|UX|SQL|JSON|REST|HTTP|TCP|DNS)\b/i,
        /\b(function|class|method|variable|array|object|interface)\b/i,
        /\b(database|server|client|backend|frontend|deployment)\b/i,
        /\b(algoritme|database|server|klient|deployment)\b/i,
    ];
    const technicalMatches = technicalPatterns.filter(p => p.test(message)).length;
    const technicality = Math.min(1, technicalMatches * 0.2);
    // Language detection
    const norwegianWords = ['jeg', 'er', 'det', 'og', 'på', 'med', 'til', 'som', 'en', 'av',
        'har', 'kan', 'vil', 'skal', 'må', 'fra', 'ved', 'om'];
    const norwegianCount = norwegianWords.filter(w => new RegExp(`\\b${w}\\b`, 'i').test(message)).length;
    const language = norwegianCount >= 3 ? 'no' : 'en';
    return {
        formality: Math.min(1, Math.max(0, formality)),
        verbosity,
        emotionality,
        technicality,
        language,
    };
}
/**
 * Extract signature patterns from messages (greetings, signoffs)
 */
export function extractSignaturePatterns(messages) {
    const greetings = [];
    const signoffs = [];
    const phrases = [];
    const greetingPatterns = [
        /^(Hei[!,]?|Hi[!,]?|Hello[!,]?|Hey[!,]?|Dear\s+\w+[,]?|Kjære\s+\w+[,]?)/i,
        /^(Good\s+(?:morning|afternoon|evening)[!,]?|God\s+(?:morgen|ettermiddag|kveld)[!,]?)/i,
    ];
    const signoffPatterns = [
        /((?:Best|Kind|Warm)\s+regards[,]?|(?:Beste|Vennlig)\s+hilsen[,]?)$/i,
        /(Thanks[!,]?|Takk[!,]?|Mvh[,.]?|Best[,]?|Cheers[!,]?)$/im,
    ];
    for (const message of messages) {
        // Check greetings
        for (const pattern of greetingPatterns) {
            const match = message.match(pattern);
            if (match && !greetings.includes(match[1])) {
                greetings.push(match[1]);
            }
        }
        // Check signoffs
        for (const pattern of signoffPatterns) {
            const match = message.match(pattern);
            if (match && !signoffs.includes(match[1])) {
                signoffs.push(match[1]);
            }
        }
    }
    return { greetings, signoffs, phrases };
}
//# sourceMappingURL=insight-extractor.js.map