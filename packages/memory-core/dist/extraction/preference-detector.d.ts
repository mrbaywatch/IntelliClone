import type { PreferenceCategory, PreferenceDetectionResult } from '../types/index.js';
/**
 * Configuration for preference detection
 */
export interface PreferenceDetectorConfig {
    /** Minimum confidence threshold */
    minConfidence: number;
    /** Categories to detect */
    categories: PreferenceCategory[];
}
/**
 * Default configuration
 */
export declare const DEFAULT_PREFERENCE_DETECTOR_CONFIG: PreferenceDetectorConfig;
/**
 * Interface for preference detection
 */
export interface PreferenceDetector {
    /**
     * Detect preferences from text
     */
    detect(text: string): Promise<PreferenceDetectionResult>;
    /**
     * Detect preferences from conversation
     */
    detectFromConversation(messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>): Promise<PreferenceDetectionResult>;
}
/**
 * Pattern-based preference detector
 *
 * Uses linguistic patterns to identify user preferences.
 * Production implementations should use LLM-based detection.
 */
export declare class PatternPreferenceDetector implements PreferenceDetector {
    private readonly config;
    constructor(config?: Partial<PreferenceDetectorConfig>);
    detect(text: string): Promise<PreferenceDetectionResult>;
    detectFromConversation(messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>): Promise<PreferenceDetectionResult>;
    private detectCommunicationPreferences;
    private detectSchedulingPreferences;
    private detectFormatPreferences;
    private detectLanguagePreferences;
    private detectWorkflowPreferences;
    private detectInteractionPreferences;
    private strengthToConfidence;
    private mergePreferences;
}
//# sourceMappingURL=preference-detector.d.ts.map