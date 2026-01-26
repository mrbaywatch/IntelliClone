import type { Memory, PromptContext, UserProfile } from '../types/index.js';

/**
 * System prompt builder with fluent API
 */
export class SystemPromptBuilder {
  private sections: Map<string, string> = new Map();
  private _locale: string = 'en';
  private instructionList: string[] = [];

  constructor(basePrompt?: string) {
    if (basePrompt) {
      this.sections.set('base', basePrompt);
    }
  }

  /**
   * Set the base system prompt
   */
  base(prompt: string): this {
    this.sections.set('base', prompt);
    return this;
  }

  /**
   * Set the locale for language-specific handling
   */
  setLocale(locale: string): this {
    this._locale = locale;
    return this;
  }

  /**
   * Get the current locale
   */
  getLocale(): string {
    return this._locale;
  }

  /**
   * Add a named section to the prompt
   */
  section(name: string, content: string): this {
    this.sections.set(name, content);
    return this;
  }

  /**
   * Add an instruction
   */
  instruction(text: string): this {
    this.instructionList.push(text);
    return this;
  }

  /**
   * Add multiple instructions
   */
  instructions(texts: string[]): this {
    this.instructionList.push(...texts);
    return this;
  }

  /**
   * Add user context section
   */
  withUser(user: UserProfile): this {
    const userLines: string[] = ['## User Profile'];
    
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
  withMemories(memories: Memory[], maxMemories: number = 10): this {
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

    const memoryLines: string[] = ['## Remembered Context'];

    // Group by type
    const byType = new Map<string, Memory[]>();
    for (const memory of sortedMemories) {
      const existing = byType.get(memory.type) || [];
      existing.push(memory);
      byType.set(memory.type, existing);
    }

    const typeLabels: Record<string, string> = {
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
  withNorwegianSupport(): this {
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
  withResponseFormat(format: 'json' | 'markdown' | 'plain' | 'structured'): this {
    const formatInstructions: Record<string, string> = {
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
  withTone(tone: 'professional' | 'casual' | 'friendly' | 'technical'): this {
    const toneInstructions: Record<string, string> = {
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
  fromContext(context: PromptContext): this {
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
  withVariables(variables: Record<string, string>): this {
    // Store for later application during build
    this.sections.set('_variables', JSON.stringify(variables));
    return this;
  }

  /**
   * Build the final system prompt
   */
  build(): string {
    const parts: string[] = [];

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
      const variables = JSON.parse(variablesJson) as Record<string, string>;
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
export function createSystemPrompt(basePrompt?: string): SystemPromptBuilder {
  return new SystemPromptBuilder(basePrompt);
}
