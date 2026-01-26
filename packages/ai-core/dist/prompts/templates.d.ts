import { SystemPromptBuilder } from './system-prompt.js';
/**
 * Pre-built prompt templates for common use cases
 */
export declare const PromptTemplates: {
    /**
     * General assistant prompt
     */
    assistant: (options?: {
        name?: string;
        locale?: string;
    }) => SystemPromptBuilder;
    /**
     * Code assistant prompt
     */
    codeAssistant: (options?: {
        languages?: string[];
        framework?: string;
    }) => SystemPromptBuilder;
    /**
     * Data analyst prompt
     */
    dataAnalyst: () => SystemPromptBuilder;
    /**
     * Customer support prompt
     */
    customerSupport: (options?: {
        companyName?: string;
        productName?: string;
    }) => SystemPromptBuilder;
    /**
     * Translator prompt
     */
    translator: (options: {
        sourceLanguage?: string;
        targetLanguage: string;
    }) => SystemPromptBuilder;
    /**
     * Summarizer prompt
     */
    summarizer: (options?: {
        style?: "brief" | "detailed" | "bullet-points";
    }) => SystemPromptBuilder;
    /**
     * Norwegian assistant prompt
     */
    norwegianAssistant: (options?: {
        bokmaal?: boolean;
    }) => SystemPromptBuilder;
    /**
     * JSON extractor prompt
     */
    jsonExtractor: (schema?: Record<string, unknown>) => SystemPromptBuilder;
};
/**
 * Create a prompt for a specific Intelli product
 */
export declare function createProductPrompt(product: 'intelli-gym' | 'intelli-track' | 'intelli-diet', userContext?: {
    name?: string;
    locale?: string;
}): SystemPromptBuilder;
//# sourceMappingURL=templates.d.ts.map