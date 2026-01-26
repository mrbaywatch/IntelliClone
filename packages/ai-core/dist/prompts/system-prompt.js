/**
 * System prompt builder with fluent API
 */
export class SystemPromptBuilder {
    sections = new Map();
    _locale = 'en';
    instructionList = [];
    constructor(basePrompt) {
        if (basePrompt) {
            this.sections.set('base', basePrompt);
        }
    }
    /**
     * Set the base system prompt
     */
    base(prompt) {
        this.sections.set('base', prompt);
        return this;
    }
    /**
     * Set the locale for language-specific handling
     */
    setLocale(locale) {
        this._locale = locale;
        return this;
    }
    /**
     * Get the current locale
     */
    getLocale() {
        return this._locale;
    }
    /**
     * Add a named section to the prompt
     */
    section(name, content) {
        this.sections.set(name, content);
        return this;
    }
    /**
     * Add an instruction
     */
    instruction(text) {
        this.instructionList.push(text);
        return this;
    }
    /**
     * Add multiple instructions
     */
    instructions(texts) {
        this.instructionList.push(...texts);
        return this;
    }
    /**
     * Add user context section
     */
    withUser(user) {
        const userLines = ['## User Profile'];
        if (user.name) {
            userLines.push(`- Name: ${user.name}`);
        }
        userLines.push(`- Preferred Language: ${user.preferredLanguage}`);
        if (user.timezone) {
            userLines.push(`- Timezone: ${user.timezone}`);
        }
        if (user.metadata && Object.keys(user.metadata).length > 0) {
            userLines.push('- Additional Info:');
            for (const [key, value] of Object.entries(user.metadata)) {
                userLines.push(`  - ${key}: ${JSON.stringify(value)}`);
            }
        }
        this.sections.set('user', userLines.join('\n'));
        return this;
    }
    /**
     * Add memories context section
     */
    withMemories(memories, maxMemories = 10) {
        if (memories.length === 0) {
            return this;
        }
        // Sort by importance and recency
        const sortedMemories = [...memories]
            .filter((m) => !m.expiresAt || m.expiresAt > new Date())
            .sort((a, b) => {
            // Primary sort by importance
            if (b.importance !== a.importance) {
                return b.importance - a.importance;
            }
            // Secondary sort by recency
            return b.createdAt.getTime() - a.createdAt.getTime();
        })
            .slice(0, maxMemories);
        if (sortedMemories.length === 0) {
            return this;
        }
        const memoryLines = ['## Remembered Context'];
        // Group by type
        const byType = new Map();
        for (const memory of sortedMemories) {
            const existing = byType.get(memory.type) || [];
            existing.push(memory);
            byType.set(memory.type, existing);
        }
        const typeLabels = {
            fact: 'Facts',
            preference: 'Preferences',
            context: 'Context',
            instruction: 'Instructions',
        };
        for (const [type, mems] of byType) {
            memoryLines.push(`\n### ${typeLabels[type] || type}`);
            for (const m of mems) {
                memoryLines.push(`- ${m.content}`);
            }
        }
        this.sections.set('memories', memoryLines.join('\n'));
        return this;
    }
    /**
     * Add Norwegian language handling
     */
    withNorwegianSupport() {
        const norwegianInstructions = `
## Norwegian Language Guidelines

When responding in Norwegian:
- Use Bokmål as the default Norwegian variant unless specified otherwise
- Be aware of common Norwegian expressions and idioms
- Use appropriate formality level (du-form is standard, De-form for very formal)
- Handle Norwegian special characters (æ, ø, å) correctly
- Be mindful of Norwegian cultural context and references
- If unsure about a term, prefer Norwegian words over anglicisms where natural alternatives exist
- For technical terms, it's acceptable to use English terms that are commonly used in Norwegian tech contexts
`;
        this.sections.set('norwegian', norwegianInstructions.trim());
        return this;
    }
    /**
     * Add response format instructions
     */
    withResponseFormat(format) {
        const formatInstructions = {
            json: 'Respond with valid JSON only. Do not include any text outside the JSON object.',
            markdown: 'Format your response using Markdown for better readability.',
            plain: 'Respond with plain text without any formatting.',
            structured: 'Structure your response with clear sections and bullet points.',
        };
        this.instructionList.push(formatInstructions[format]);
        return this;
    }
    /**
     * Add tone/style instructions
     */
    withTone(tone) {
        const toneInstructions = {
            professional: 'Maintain a professional and formal tone.',
            casual: 'Use a casual, conversational tone.',
            friendly: 'Be warm, friendly, and approachable.',
            technical: 'Be precise and technical, assuming expertise.',
        };
        this.instructionList.push(toneInstructions[tone]);
        return this;
    }
    /**
     * Build from a PromptContext object
     */
    fromContext(context) {
        if (context.locale) {
            this.setLocale(context.locale);
            if (context.locale === 'no' || context.locale === 'nb' || context.locale === 'nn') {
                this.withNorwegianSupport();
            }
        }
        if (context.user) {
            this.withUser(context.user);
        }
        if (context.memories && context.memories.length > 0) {
            this.withMemories(context.memories);
        }
        if (context.additionalInstructions) {
            this.instructionList.push(...context.additionalInstructions);
        }
        return this;
    }
    /**
     * Replace variables in the prompt
     */
    withVariables(variables) {
        // Store for later application during build
        this.sections.set('_variables', JSON.stringify(variables));
        return this;
    }
    /**
     * Build the final system prompt
     */
    build() {
        const parts = [];
        // Base prompt first
        const base = this.sections.get('base');
        if (base) {
            parts.push(base);
        }
        // Add other sections in order
        const sectionOrder = ['user', 'memories', 'norwegian'];
        for (const sectionName of sectionOrder) {
            const section = this.sections.get(sectionName);
            if (section) {
                parts.push(section);
            }
        }
        // Add any other custom sections
        for (const [name, content] of this.sections) {
            if (!['base', 'user', 'memories', 'norwegian', '_variables'].includes(name)) {
                parts.push(`## ${name}\n${content}`);
            }
        }
        // Add instructions
        if (this.instructionList.length > 0) {
            parts.push('## Instructions\n' + this.instructionList.map((i) => `- ${i}`).join('\n'));
        }
        let result = parts.join('\n\n');
        // Apply variables
        const variablesJson = this.sections.get('_variables');
        if (variablesJson) {
            const variables = JSON.parse(variablesJson);
            for (const [key, value] of Object.entries(variables)) {
                result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
            }
        }
        return result;
    }
}
/**
 * Create a new system prompt builder
 */
export function createSystemPrompt(basePrompt) {
    return new SystemPromptBuilder(basePrompt);
}
//# sourceMappingURL=system-prompt.js.map