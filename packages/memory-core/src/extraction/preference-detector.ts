import type {
  DetectedPreference,
  PreferenceCategory,
  PreferenceDetectionResult,
} from '../types/index.js';

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
export const DEFAULT_PREFERENCE_DETECTOR_CONFIG: PreferenceDetectorConfig = {
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
  detectFromConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<PreferenceDetectionResult>;
}

/**
 * Pattern-based preference detector
 * 
 * Uses linguistic patterns to identify user preferences.
 * Production implementations should use LLM-based detection.
 */
export class PatternPreferenceDetector implements PreferenceDetector {
  private readonly config: PreferenceDetectorConfig;
  
  constructor(config: Partial<PreferenceDetectorConfig> = {}) {
    this.config = { ...DEFAULT_PREFERENCE_DETECTOR_CONFIG, ...config };
  }
  
  async detect(text: string): Promise<PreferenceDetectionResult> {
    const startTime = Date.now();
    const preferences: DetectedPreference[] = [];
    
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
    const byCategory: Partial<Record<PreferenceCategory, DetectedPreference[]>> = {};
    for (const pref of filtered) {
      const category = pref.category as PreferenceCategory;
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category]!.push(pref);
    }
    
    return {
      preferences: filtered,
      byCategory,
      sourceText: text,
      durationMs: Date.now() - startTime,
    };
  }
  
  async detectFromConversation(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<PreferenceDetectionResult> {
    const startTime = Date.now();
    const allPreferences: DetectedPreference[] = [];
    
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
    const byCategory: Partial<Record<PreferenceCategory, DetectedPreference[]>> = {};
    for (const pref of merged) {
      const category = pref.category as PreferenceCategory;
      if (!byCategory[category]) {
        byCategory[category] = [];
      }
      byCategory[category]!.push(pref);
    }
    
    return {
      preferences: merged,
      byCategory,
      sourceText: messages.map(m => m.content).join('\n'),
      durationMs: Date.now() - startTime,
    };
  }
  
  // ==================== Category Detectors ====================
  
  private detectCommunicationPreferences(text: string): DetectedPreference[] {
    const preferences: DetectedPreference[] = [];
    
    // Email preference patterns
    const emailPatterns = [
      { pattern: /(?:prefer|like|want)\s+(?:to use\s+)?email/gi, value: 'email', strength: 'moderate' as const },
      { pattern: /(?:best|reach me|contact me)\s+(?:via|by|through)\s+email/gi, value: 'email', strength: 'strong' as const },
      { pattern: /(?:send|email)\s+me/gi, value: 'email', strength: 'weak' as const },
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
      { pattern: /prefer\s+(?:chat|messaging|slack|teams)/gi, value: 'instant_messaging', strength: 'moderate' as const },
      { pattern: /(?:reach me|contact me|message me)\s+(?:on\s+)?(?:slack|teams|chat)/gi, value: 'instant_messaging', strength: 'strong' as const },
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
  
  private detectSchedulingPreferences(text: string): DetectedPreference[] {
    const preferences: DetectedPreference[] = [];
    
    // Time of day preferences
    const timePatterns = [
      { pattern: /(?:mornings?|AM)\s+(?:work|are)\s+(?:best|better)/gi, value: 'morning_meetings', strength: 'moderate' as const },
      { pattern: /(?:prefer|like)\s+(?:morning|early)\s+(?:meetings?|calls?)/gi, value: 'morning_meetings', strength: 'moderate' as const },
      { pattern: /(?:afternoon|PM)\s+(?:works?|are?)\s+(?:best|better)/gi, value: 'afternoon_meetings', strength: 'moderate' as const },
      { pattern: /(?:not\s+available|avoid)\s+(?:mornings?|before\s+\d{1,2})/gi, value: 'morning_meetings', strength: 'strong' as const, polarity: 'negative' as const },
    ];
    
    for (const { pattern, value, strength, polarity = 'positive' as const } of timePatterns) {
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
      { pattern: /(?:prefer|like)\s+(?:short|brief|quick)\s+(?:meetings?|calls?)/gi, value: 'short_meetings', strength: 'moderate' as const },
      { pattern: /(?:keep|make)\s+(?:it|meetings?)\s+(?:short|brief|under\s+\d+\s*min)/gi, value: 'short_meetings', strength: 'moderate' as const },
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
  
  private detectFormatPreferences(text: string): DetectedPreference[] {
    const preferences: DetectedPreference[] = [];
    
    // Document format preferences
    const formatPatterns = [
      { pattern: /(?:prefer|like|use)\s+(?:PDF|pdf)/gi, value: 'pdf', strength: 'moderate' as const },
      { pattern: /(?:prefer|like|use)\s+(?:Word|\.docx?)/gi, value: 'word', strength: 'moderate' as const },
      { pattern: /(?:prefer|like|use)\s+(?:Excel|\.xlsx?|spreadsheet)/gi, value: 'excel', strength: 'moderate' as const },
      { pattern: /(?:prefer|like)\s+(?:plain\s+)?text/gi, value: 'plain_text', strength: 'moderate' as const },
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
      { pattern: /(?:prefer|like)\s+(?:bullet|bulleted)\s+(?:points?|lists?)/gi, value: 'bullet_points', strength: 'moderate' as const },
      { pattern: /(?:prefer|like)\s+(?:detailed|long|thorough)\s+(?:explanations?|responses?)/gi, value: 'detailed', strength: 'moderate' as const },
      { pattern: /(?:prefer|like)\s+(?:brief|concise|short)\s+(?:explanations?|responses?|answers?)/gi, value: 'concise', strength: 'moderate' as const },
      { pattern: /(?:keep\s+it|be)\s+(?:brief|concise|short)/gi, value: 'concise', strength: 'moderate' as const },
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
  
  private detectLanguagePreferences(text: string): DetectedPreference[] {
    const preferences: DetectedPreference[] = [];
    
    // Language preferences
    const langPatterns = [
      { pattern: /(?:speak|write|respond)\s+(?:in\s+)?(?:Norwegian|norsk)/gi, value: 'norwegian', strength: 'strong' as const },
      { pattern: /(?:speak|write|respond)\s+(?:in\s+)?(?:English|engelsk)/gi, value: 'english', strength: 'strong' as const },
      { pattern: /(?:prefer|like)\s+(?:formal|professional)\s+(?:tone|language)/gi, value: 'formal_tone', strength: 'moderate' as const },
      { pattern: /(?:prefer|like)\s+(?:casual|informal|friendly)\s+(?:tone|language)/gi, value: 'casual_tone', strength: 'moderate' as const },
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
  
  private detectWorkflowPreferences(text: string): DetectedPreference[] {
    const preferences: DetectedPreference[] = [];
    
    // Work style preferences
    const workPatterns = [
      { pattern: /(?:prefer|like)\s+(?:to\s+)?(?:work|do things)\s+(?:alone|independently)/gi, value: 'independent_work', strength: 'moderate' as const },
      { pattern: /(?:prefer|like)\s+(?:team|collaborative)\s+(?:work|projects)/gi, value: 'collaborative_work', strength: 'moderate' as const },
      { pattern: /(?:prefer|like)\s+(?:async|asynchronous)\s+(?:communication|work)/gi, value: 'async_work', strength: 'moderate' as const },
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
  
  private detectInteractionPreferences(text: string): DetectedPreference[] {
    const preferences: DetectedPreference[] = [];
    
    // Interaction style preferences
    const interactionPatterns = [
      { pattern: /(?:don't|do not)\s+(?:need|want)\s+(?:small\s+)?talk/gi, value: 'skip_small_talk', strength: 'moderate' as const },
      { pattern: /(?:get|go)\s+(?:straight|right)\s+to\s+(?:the\s+)?(?:point|business)/gi, value: 'direct_communication', strength: 'moderate' as const },
      { pattern: /(?:like|appreciate)\s+(?:when\s+you\s+)?(?:explain|clarify)/gi, value: 'detailed_explanations', strength: 'weak' as const },
      { pattern: /(?:just|only)\s+(?:give|tell)\s+me\s+(?:the\s+)?(?:answer|result|bottom\s+line)/gi, value: 'direct_answers', strength: 'strong' as const },
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
  
  private strengthToConfidence(strength: 'weak' | 'moderate' | 'strong'): number {
    switch (strength) {
      case 'weak':
        return 0.5;
      case 'moderate':
        return 0.7;
      case 'strong':
        return 0.9;
    }
  }
  
  private mergePreferences(preferences: DetectedPreference[]): DetectedPreference[] {
    const grouped = new Map<string, DetectedPreference[]>();
    
    // Group by category + value
    for (const pref of preferences) {
      const key = `${pref.category}:${pref.value}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(pref);
    }
    
    // Merge each group
    const merged: DetectedPreference[] = [];
    for (const group of grouped.values()) {
      if (group.length === 1) {
        merged.push(group[0]!);
        continue;
      }
      
      // Take highest confidence, boost for repetition
      const sorted = group.sort((a, b) => b.confidence - a.confidence);
      const best = sorted[0]!;
      
      // Boost confidence for repeated preferences
      const boost = Math.min(0.15, (group.length - 1) * 0.05);
      
      // Upgrade strength if repeated
      let strength = best.strength;
      if (group.length >= 3 && strength === 'weak') {
        strength = 'moderate';
      } else if (group.length >= 2 && strength === 'moderate') {
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
