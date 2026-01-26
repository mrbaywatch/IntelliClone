import type { Memory, PromptContext, UserProfile } from '../types/index.js';
/**
 * System prompt builder with fluent API
 */
export declare class SystemPromptBuilder {
    private sections;
    private _locale;
    private instructionList;
    constructor(basePrompt?: string);
    /**
     * Set the base system prompt
     */
    base(prompt: string): this;
    /**
     * Set the locale for language-specific handling
     */
    setLocale(locale: string): this;
    /**
     * Get the current locale
     */
    getLocale(): string;
    /**
     * Add a named section to the prompt
     */
    section(name: string, content: string): this;
    /**
     * Add an instruction
     */
    instruction(text: string): this;
    /**
     * Add multiple instructions
     */
    instructions(texts: string[]): this;
    /**
     * Add user context section
     */
    withUser(user: UserProfile): this;
    /**
     * Add memories context section
     */
    withMemories(memories: Memory[], maxMemories?: number): this;
    /**
     * Add Norwegian language handling
     */
    withNorwegianSupport(): this;
    /**
     * Add response format instructions
     */
    withResponseFormat(format: 'json' | 'markdown' | 'plain' | 'structured'): this;
    /**
     * Add tone/style instructions
     */
    withTone(tone: 'professional' | 'casual' | 'friendly' | 'technical'): this;
    /**
     * Build from a PromptContext object
     */
    fromContext(context: PromptContext): this;
    /**
     * Replace variables in the prompt
     */
    withVariables(variables: Record<string, string>): this;
    /**
     * Build the final system prompt
     */
    build(): string;
}
/**
 * Create a new system prompt builder
 */
export declare function createSystemPrompt(basePrompt?: string): SystemPromptBuilder;
//# sourceMappingURL=system-prompt.d.ts.map