import { NORWEGIAN_PATTERNS } from '../types/index.js';
/**
 * Default configuration
 */
export const DEFAULT_ENTITY_EXTRACTOR_CONFIG = {
    minConfidence: 0.5,
    entityTypes: [
        'person', 'organization', 'location', 'date', 'time',
        'money', 'email', 'phone', 'url',
    ],
    normalize: true,
    norwegianPatterns: NORWEGIAN_PATTERNS,
};
/**
 * Pattern-based entity extractor
 *
 * Handles common patterns for Norwegian and English text.
 * Production implementations should use NER models (e.g., spaCy, HuggingFace).
 */
export class PatternEntityExtractor {
    config;
    constructor(config = {}) {
        this.config = { ...DEFAULT_ENTITY_EXTRACTOR_CONFIG, ...config };
    }
    async extract(text) {
        const startTime = Date.now();
        const entities = [];
        // Extract each entity type
        if (this.config.entityTypes.includes('email')) {
            entities.push(...this.extractEmails(text));
        }
        if (this.config.entityTypes.includes('phone')) {
            entities.push(...this.extractPhoneNumbers(text));
        }
        if (this.config.entityTypes.includes('url')) {
            entities.push(...this.extractUrls(text));
        }
        if (this.config.entityTypes.includes('date')) {
            entities.push(...this.extractDates(text));
        }
        if (this.config.entityTypes.includes('time')) {
            entities.push(...this.extractTimes(text));
        }
        if (this.config.entityTypes.includes('money')) {
            entities.push(...this.extractMoney(text));
        }
        if (this.config.entityTypes.includes('person')) {
            entities.push(...this.extractPersons(text));
        }
        if (this.config.entityTypes.includes('organization')) {
            entities.push(...this.extractOrganizations(text));
        }
        // Filter by confidence
        const filtered = entities.filter(e => e.confidence >= this.config.minConfidence);
        // Remove overlapping entities (keep higher confidence)
        const deduplicated = this.removeOverlapping(filtered);
        // Group by type
        const byType = {};
        for (const entity of deduplicated) {
            if (!byType[entity.type]) {
                byType[entity.type] = [];
            }
            byType[entity.type].push(entity);
        }
        return {
            entities: deduplicated,
            byType,
            sourceText: text,
            durationMs: Date.now() - startTime,
        };
    }
    async extractType(text, type) {
        const result = await this.extract(text);
        return result.byType[type] ?? [];
    }
    // ==================== Type-Specific Extractors ====================
    extractEmails(text) {
        const pattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        return this.extractByPattern(text, pattern, 'email', 0.95);
    }
    extractPhoneNumbers(text) {
        const entities = [];
        // Norwegian phone numbers
        const norwegianPattern = this.config.norwegianPatterns.phoneNumber;
        entities.push(...this.extractByPattern(text, norwegianPattern, 'phone', 0.85));
        // International format
        const internationalPattern = /\+\d{1,3}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g;
        entities.push(...this.extractByPattern(text, internationalPattern, 'phone', 0.8));
        return entities;
    }
    extractUrls(text) {
        const pattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
        return this.extractByPattern(text, pattern, 'url', 0.95);
    }
    extractDates(text) {
        const entities = [];
        // Norwegian date formats
        for (const pattern of this.config.norwegianPatterns.dateFormats) {
            entities.push(...this.extractByPattern(text, pattern, 'date', 0.8, this.normalizeDate.bind(this)));
        }
        // Month names (Norwegian and English)
        const monthPattern = /\b(\d{1,2})\.?\s*(januar|februar|mars|april|mai|juni|juli|august|september|oktober|november|desember|january|february|march|may|june|july|august|september|october|november|december)\s*(\d{4})?\b/gi;
        entities.push(...this.extractByPattern(text, monthPattern, 'date', 0.85));
        // Relative dates
        const relativePattern = /\b(i dag|i morgen|i går|neste uke|forrige uke|today|tomorrow|yesterday|next week|last week)\b/gi;
        entities.push(...this.extractByPattern(text, relativePattern, 'date', 0.7));
        return entities;
    }
    extractTimes(text) {
        const patterns = [
            /\b(?:kl\.?|klokken|at)\s*(\d{1,2})(?::(\d{2}))?\b/gi,
            /\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/g,
            /\b(\d{1,2})\s*(?:am|pm)\b/gi,
        ];
        const entities = [];
        for (const pattern of patterns) {
            entities.push(...this.extractByPattern(text, pattern, 'time', 0.75));
        }
        return entities;
    }
    extractMoney(text) {
        const entities = [];
        // Norwegian currency
        entities.push(...this.extractByPattern(text, this.config.norwegianPatterns.currency, 'money', 0.85));
        // Other currencies
        const currencyPatterns = [
            /\$[\d,]+(?:\.\d{2})?/g,
            /€[\d,]+(?:\.\d{2})?/g,
            /[\d,]+(?:\.\d{2})?\s*(?:USD|EUR|GBP|SEK|DKK)/gi,
        ];
        for (const pattern of currencyPatterns) {
            entities.push(...this.extractByPattern(text, pattern, 'money', 0.8));
        }
        return entities;
    }
    extractPersons(text) {
        const entities = [];
        // Capitalized name patterns
        // Two or more capitalized words in a row
        const namePattern = /\b([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)+)\b/g;
        entities.push(...this.extractByPattern(text, namePattern, 'person', 0.6));
        // Titles followed by names
        const titledPattern = /\b(?:Mr|Mrs|Ms|Dr|Prof|Herr|Fru|Frk|Doktor|Professor)\.?\s+([A-ZÆØÅ][a-zæøå]+(?:\s+[A-ZÆØÅ][a-zæøå]+)*)\b/g;
        entities.push(...this.extractByPattern(text, titledPattern, 'person', 0.8));
        return entities;
    }
    extractOrganizations(text) {
        const entities = [];
        // Norwegian company suffixes
        const companySuffixes = this.config.norwegianPatterns.companySuffixes.join('|');
        const companyPattern = new RegExp(`\\b([A-ZÆØÅ][a-zæøåA-ZÆØÅ\\s]+)\\s+(${companySuffixes})\\b`, 'g');
        entities.push(...this.extractByPattern(text, companyPattern, 'organization', 0.85));
        // Norwegian org numbers
        const orgNumberPattern = /\b(org\.?\s*(?:nr\.?|nummer))?\s*(\d{9})\b/gi;
        const matches = text.matchAll(orgNumberPattern);
        for (const match of matches) {
            if (match[2]) {
                entities.push({
                    type: 'organization',
                    value: match[2],
                    normalized: match[2].replace(/\s/g, ''),
                    startIndex: match.index,
                    endIndex: match.index + match[0].length,
                    confidence: 0.75,
                    metadata: { isOrgNumber: true },
                });
            }
        }
        return entities;
    }
    // ==================== Helpers ====================
    extractByPattern(text, pattern, type, confidence, normalizer) {
        const entities = [];
        const matches = text.matchAll(pattern);
        for (const match of matches) {
            const value = match[0];
            entities.push({
                type,
                value,
                normalized: this.config.normalize && normalizer
                    ? normalizer(value)
                    : undefined,
                startIndex: match.index,
                endIndex: match.index + value.length,
                confidence,
            });
        }
        return entities;
    }
    normalizeDate(dateStr) {
        // Try to parse and normalize to ISO format
        const cleaned = dateStr.trim();
        // DD.MM.YYYY or DD/MM/YYYY
        const euroMatch = cleaned.match(/(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})/);
        if (euroMatch) {
            const day = euroMatch[1].padStart(2, '0');
            const month = euroMatch[2].padStart(2, '0');
            let year = euroMatch[3];
            if (year.length === 2) {
                year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
            }
            return `${year}-${month}-${day}`;
        }
        return cleaned;
    }
    removeOverlapping(entities) {
        // Sort by start index, then by length (longer first)
        const sorted = [...entities].sort((a, b) => {
            if (a.startIndex !== b.startIndex) {
                return a.startIndex - b.startIndex;
            }
            return (b.endIndex - b.startIndex) - (a.endIndex - a.startIndex);
        });
        const result = [];
        let lastEnd = -1;
        for (const entity of sorted) {
            // Skip if this entity overlaps with the previous one
            if (entity.startIndex < lastEnd) {
                // Check if this one has higher confidence
                const prev = result[result.length - 1];
                if (prev && entity.confidence > prev.confidence) {
                    result.pop();
                    result.push(entity);
                    lastEnd = entity.endIndex;
                }
                continue;
            }
            result.push(entity);
            lastEnd = entity.endIndex;
        }
        return result;
    }
}
//# sourceMappingURL=entity-extractor.js.map