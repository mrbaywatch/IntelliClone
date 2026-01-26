/**
 * Default configuration
 */
export const DEFAULT_PREFERENCE_DETECTOR_CONFIG = {
    minConfidence: 0.5,
    categories: [
        'communication',
        'scheduling',
        'format',
        'language',
        'frequency',
        'privacy',
        'notification',
        'workflow',
        'content',
        'interaction',
    ],
};
/**
 * Pattern-based preference detector
 *
 * Uses linguistic patterns to identify user preferences.
 * Production implementations should use LLM-based detection.
 */
export class PatternPreferenceDetector {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_PREFERENCE_DETECTOR_CONFIG, ...config };
    }
    async detect(text) {
        const startTime = Date.now();
        const preferences = [];
        // Detect each category
        preferences.push(...this.detectCommunicationPreferences(text));
        preferences.push(...this.detectSchedulingPreferences(text));
        preferences.push(...this.detectFormatPreferences(text));
        preferences.push(...this.detectLanguagePreferences(text));
        preferences.push(...this.detectWorkflowPreferences(text));
        preferences.push(...this.detectInteractionPreferences(text));
        // Filter by confidence
        const filtered = preferences.filter(p => p.confidence >= this.config.minConfidence);
        // Group by category
        const byCategory = {};
        for (const pref of filtered) {
            const category = pref.category;
            if (!byCategory[category]) {
                byCategory[category] = [];
            }
            byCategory[category].push(pref);
        }
        return {
            preferences: filtered,
            byCategory,
            sourceText: text,
            durationMs: Date.now() - startTime,
        };
    }
    async detectFromConversation(messages) {
        const startTime = Date.now();
        const allPreferences = [];
        // Extract from user messages
        for (const message of messages) {
            if (message.role === 'user') {
                const result = await this.detect(message.content);
                allPreferences.push(...result.preferences);
            }
        }
        // Deduplicate and merge
        const merged = this.mergePreferences(allPreferences);
        // Group by category
        const byCategory = {};
        for (const pref of merged) {
            const category = pref.category;
            if (!byCategory[category]) {
                byCategory[category] = [];
            }
            byCategory[category].push(pref);
        }
        return {
            preferences: merged,
            byCategory,
            sourceText: messages.map(m => m.content).join('\n'),
            durationMs: Date.now() - startTime,
        };
    }
    // ==================== Category Detectors ====================
    detectCommunicationPreferences(text) {
        const preferences = [];
        // Email preference patterns
        const emailPatterns = [
            { pattern: /(?:prefer|like|want)\s+(?:to use\s+)?email/gi, value: 'email', strength: 'moderate' },
            { pattern: /(?:best|reach me|contact me)\s+(?:via|by|through)\s+email/gi, value: 'email', strength: 'strong' },
            { pattern: /(?:send|email)\s+me/gi, value: 'email', strength: 'weak' },
        ];
        for (const { pattern, value, strength } of emailPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                preferences.push({
                    category: 'communication',
                    value,
                    strength,
                    polarity: 'positive',
                    evidence: matches[0],
                    confidence: this.strengthToConfidence(strength),
                });
            }
        }
        // Chat/instant message preference
        const chatPatterns = [
            { pattern: /prefer\s+(?:chat|messaging|slack|teams)/gi, value: 'instant_messaging', strength: 'moderate' },
            { pattern: /(?:reach me|contact me|message me)\s+(?:on\s+)?(?:slack|teams|chat)/gi, value: 'instant_messaging', strength: 'strong' },
        ];
        for (const { pattern, value, strength } of chatPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                preferences.push({
                    category: 'communication',
                    value,
                    strength,
                    polarity: 'positive',
                    evidence: matches[0],
                    confidence: this.strengthToConfidence(strength),
                });
            }
        }
        return preferences;
    }
    detectSchedulingPreferences(text) {
        const preferences = [];
        // Time of day preferences
        const timePatterns = [
            { pattern: /(?:mornings?|AM)\s+(?:work|are)\s+(?:best|better)/gi, value: 'morning_meetings', strength: 'moderate' },
            { pattern: /(?:prefer|like)\s+(?:morning|early)\s+(?:meetings?|calls?)/gi, value: 'morning_meetings', strength: 'moderate' },
            { pattern: /(?:afternoon|PM)\s+(?:works?|are?)\s+(?:best|better)/gi, value: 'afternoon_meetings', strength: 'moderate' },
            { pattern: /(?:not\s+available|avoid)\s+(?:mornings?|before\s+\d{1,2})/gi, value: 'morning_meetings', strength: 'strong', polarity: 'negative' },
        ];
        for (const { pattern, value, strength, polarity = 'positive' } of timePatterns) {
            const matches = text.match(pattern);
            if (matches) {
                preferences.push({
                    category: 'scheduling',
                    value,
                    strength,
                    polarity,
                    evidence: matches[0],
                    confidence: this.strengthToConfidence(strength),
                });
            }
        }
        // Meeting duration preferences
        const durationPatterns = [
            { pattern: /(?:prefer|like)\s+(?:short|brief|quick)\s+(?:meetings?|calls?)/gi, value: 'short_meetings', strength: 'moderate' },
            { pattern: /(?:keep|make)\s+(?:it|meetings?)\s+(?:short|brief|under\s+\d+\s*min)/gi, value: 'short_meetings', strength: 'moderate' },
        ];
        for (const { pattern, value, strength } of durationPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                preferences.push({
                    category: 'scheduling',
                    value,
                    strength,
                    polarity: 'positive',
                    evidence: matches[0],
                    confidence: this.strengthToConfidence(strength),
                });
            }
        }
        return preferences;
    }
    detectFormatPreferences(text) {
        const preferences = [];
        // Document format preferences
        const formatPatterns = [
            { pattern: /(?:prefer|like|use)\s+(?:PDF|pdf)/gi, value: 'pdf', strength: 'moderate' },
            { pattern: /(?:prefer|like|use)\s+(?:Word|\.docx?)/gi, value: 'word', strength: 'moderate' },
            { pattern: /(?:prefer|like|use)\s+(?:Excel|\.xlsx?|spreadsheet)/gi, value: 'excel', strength: 'moderate' },
            { pattern: /(?:prefer|like)\s+(?:plain\s+)?text/gi, value: 'plain_text', strength: 'moderate' },
        ];
        for (const { pattern, value, strength } of formatPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                preferences.push({
                    category: 'format',
                    value,
                    strength,
                    polarity: 'positive',
                    evidence: matches[0],
                    confidence: this.strengthToConfidence(strength),
                });
            }
        }
        // Summary preferences
        const summaryPatterns = [
            { pattern: /(?:prefer|like)\s+(?:bullet|bulleted)\s+(?:points?|lists?)/gi, value: 'bullet_points', strength: 'moderate' },
            { pattern: /(?:prefer|like)\s+(?:detailed|long|thorough)\s+(?:explanations?|responses?)/gi, value: 'detailed', strength: 'moderate' },
            { pattern: /(?:prefer|like)\s+(?:brief|concise|short)\s+(?:explanations?|responses?|answers?)/gi, value: 'concise', strength: 'moderate' },
            { pattern: /(?:keep\s+it|be)\s+(?:brief|concise|short)/gi, value: 'concise', strength: 'moderate' },
        ];
        for (const { pattern, value, strength } of summaryPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                preferences.push({
                    category: 'format',
                    value,
                    strength,
                    polarity: 'positive',
                    evidence: matches[0],
                    confidence: this.strengthToConfidence(strength),
                });
            }
        }
        return preferences;
    }
    detectLanguagePreferences(text) {
        const preferences = [];
        // Language preferences
        const langPatterns = [
            { pattern: /(?:speak|write|respond)\s+(?:in\s+)?(?:Norwegian|norsk)/gi, value: 'norwegian', strength: 'strong' },
            { pattern: /(?:speak|write|respond)\s+(?:in\s+)?(?:English|engelsk)/gi, value: 'english', strength: 'strong' },
            { pattern: /(?:prefer|like)\s+(?:formal|professional)\s+(?:tone|language)/gi, value: 'formal_tone', strength: 'moderate' },
            { pattern: /(?:prefer|like)\s+(?:casual|informal|friendly)\s+(?:tone|language)/gi, value: 'casual_tone', strength: 'moderate' },
        ];
        for (const { pattern, value, strength } of langPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                preferences.push({
                    category: 'language',
                    value,
                    strength,
                    polarity: 'positive',
                    evidence: matches[0],
                    confidence: this.strengthToConfidence(strength),
                });
            }
        }
        return preferences;
    }
    detectWorkflowPreferences(text) {
        const preferences = [];
        // Work style preferences
        const workPatterns = [
            { pattern: /(?:prefer|like)\s+(?:to\s+)?(?:work|do things)\s+(?:alone|independently)/gi, value: 'independent_work', strength: 'moderate' },
            { pattern: /(?:prefer|like)\s+(?:team|collaborative)\s+(?:work|projects)/gi, value: 'collaborative_work', strength: 'moderate' },
            { pattern: /(?:prefer|like)\s+(?:async|asynchronous)\s+(?:communication|work)/gi, value: 'async_work', strength: 'moderate' },
        ];
        for (const { pattern, value, strength } of workPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                preferences.push({
                    category: 'workflow',
                    value,
                    strength,
                    polarity: 'positive',
                    evidence: matches[0],
                    confidence: this.strengthToConfidence(strength),
                });
            }
        }
        return preferences;
    }
    detectInteractionPreferences(text) {
        const preferences = [];
        // Interaction style preferences
        const interactionPatterns = [
            { pattern: /(?:don't|do not)\s+(?:need|want)\s+(?:small\s+)?talk/gi, value: 'skip_small_talk', strength: 'moderate' },
            { pattern: /(?:get|go)\s+(?:straight|right)\s+to\s+(?:the\s+)?(?:point|business)/gi, value: 'direct_communication', strength: 'moderate' },
            { pattern: /(?:like|appreciate)\s+(?:when\s+you\s+)?(?:explain|clarify)/gi, value: 'detailed_explanations', strength: 'weak' },
            { pattern: /(?:just|only)\s+(?:give|tell)\s+me\s+(?:the\s+)?(?:answer|result|bottom\s+line)/gi, value: 'direct_answers', strength: 'strong' },
        ];
        for (const { pattern, value, strength } of interactionPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                preferences.push({
                    category: 'interaction',
                    value,
                    strength,
                    polarity: 'positive',
                    evidence: matches[0],
                    confidence: this.strengthToConfidence(strength),
                });
            }
        }
        return preferences;
    }
    // ==================== Helpers ====================
    strengthToConfidence(strength) {
        switch (strength) {
            case 'weak':
                return 0.5;
            case 'moderate':
                return 0.7;
            case 'strong':
                return 0.9;
        }
    }
    mergePreferences(preferences) {
        const grouped = new Map();
        // Group by category + value
        for (const pref of preferences) {
            const key = `${pref.category}:${pref.value}`;
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(pref);
        }
        // Merge each group
        const merged = [];
        for (const group of grouped.values()) {
            if (group.length === 1) {
                merged.push(group[0]);
                continue;
            }
            // Take highest confidence, boost for repetition
            const sorted = group.sort((a, b) => b.confidence - a.confidence);
            const best = sorted[0];
            // Boost confidence for repeated preferences
            const boost = Math.min(0.15, (group.length - 1) * 0.05);
            // Upgrade strength if repeated
            let strength = best.strength;
            if (group.length >= 3 && strength === 'weak') {
                strength = 'moderate';
            }
            else if (group.length >= 2 && strength === 'moderate') {
                strength = 'strong';
            }
            merged.push({
                ...best,
                confidence: Math.min(1, best.confidence + boost),
                strength,
                evidence: group.map(p => p.evidence).join('; '),
            });
        }
        return merged;
    }
}
//# sourceMappingURL=preference-detector.js.map