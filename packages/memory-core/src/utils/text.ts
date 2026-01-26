/**
 * Text processing utilities for the memory system
 */

/**
 * Options for text chunking
 */
export interface ChunkingOptions {
  /** Maximum chunk size in characters */
  maxChunkSize: number;
  
  /** Overlap between chunks in characters */
  overlap: number;
  
  /** Preferred separators in order of priority */
  separators?: string[];
}

/**
 * Default chunking options
 */
export const DEFAULT_CHUNKING_OPTIONS: ChunkingOptions = {
  maxChunkSize: 512,
  overlap: 50,
  separators: ['\n\n', '\n', '. ', '! ', '? ', ', ', ' '],
};

/**
 * Result of chunking operation
 */
export interface ChunkResult {
  /** The chunk text */
  text: string;
  
  /** Start index in original text */
  startIndex: number;
  
  /** End index in original text */
  endIndex: number;
  
  /** Chunk sequence number */
  sequence: number;
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(
  text: string,
  options: Partial<ChunkingOptions> = {}
): ChunkResult[] {
  const opts = { ...DEFAULT_CHUNKING_OPTIONS, ...options };
  const chunks: ChunkResult[] = [];
  
  if (text.length <= opts.maxChunkSize) {
    return [{
      text,
      startIndex: 0,
      endIndex: text.length,
      sequence: 0,
    }];
  }
  
  let position = 0;
  let sequence = 0;
  
  while (position < text.length) {
    const remaining = text.length - position;
    
    if (remaining <= opts.maxChunkSize) {
      // Last chunk
      chunks.push({
        text: text.slice(position),
        startIndex: position,
        endIndex: text.length,
        sequence,
      });
      break;
    }
    
    // Find best split point
    let splitPoint = position + opts.maxChunkSize;
    
    // Look for a natural break point
    for (const separator of opts.separators ?? []) {
      const lastSep = text.lastIndexOf(separator, splitPoint);
      if (lastSep > position + opts.maxChunkSize / 2) {
        splitPoint = lastSep + separator.length;
        break;
      }
    }
    
    chunks.push({
      text: text.slice(position, splitPoint),
      startIndex: position,
      endIndex: splitPoint,
      sequence,
    });
    
    // Move position back by overlap amount
    position = splitPoint - opts.overlap;
    sequence++;
  }
  
  return chunks;
}

/**
 * Normalize whitespace in text
 */
export function normalizeWhitespace(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Extract sentences from text
 */
export function extractSentences(text: string): string[] {
  // Handle common abbreviations
  const protectedText = text
    .replace(/\b(Mr|Mrs|Ms|Dr|Prof|Inc|Ltd|Corp|vs|etc|e\.g|i\.e)\./gi, '$1<DOT>')
    .replace(/\b([A-Z])\./g, '$1<DOT>');
  
  // Split on sentence boundaries
  const sentences = protectedText
    .split(/(?<=[.!?])\s+/)
    .map(s => s.replace(/<DOT>/g, '.').trim())
    .filter(s => s.length > 0);
  
  return sentences;
}

/**
 * Calculate rough token count (approximation)
 */
export function estimateTokenCount(text: string): number {
  // Rough approximation: ~4 characters per token for English
  // Norwegian might be slightly different due to compound words
  return Math.ceil(text.length / 4);
}

/**
 * Truncate text to approximate token limit
 */
export function truncateToTokens(text: string, maxTokens: number): string {
  const maxChars = maxTokens * 4;
  if (text.length <= maxChars) {
    return text;
  }
  
  // Try to cut at a word boundary
  const truncated = text.slice(0, maxChars);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > maxChars * 0.8) {
    return truncated.slice(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}

/**
 * Calculate Jaccard similarity between two texts (word-level)
 */
export function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  
  const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
  const union = new Set([...wordsA, ...wordsB]);
  
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

/**
 * Remove common stopwords (English and Norwegian)
 */
export function removeStopwords(text: string): string {
  const stopwords = new Set([
    // English
    'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need',
    'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she',
    'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his',
    'our', 'their', 'what', 'which', 'who', 'whom', 'when', 'where', 'why',
    'how', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
    'some', 'such', 'no', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
    'very', 'just', 'also', 'now', 'here', 'there', 'then', 'once',
    // Norwegian
    'og', 'i', 'på', 'til', 'med', 'som', 'for', 'av', 'er', 'var', 'har',
    'det', 'den', 'de', 'et', 'en', 'ei', 'å', 'jeg', 'du', 'han', 'hun',
    'vi', 'dere', 'dem', 'meg', 'deg', 'seg', 'min', 'din', 'sin', 'vår',
    'deres', 'mitt', 'ditt', 'sitt', 'vårt', 'hva', 'hvem', 'hvor', 'når',
    'hvorfor', 'hvordan', 'alle', 'noen', 'ingen', 'mange', 'få', 'mer',
    'mest', 'andre', 'samme', 'selv', 'bare', 'også', 'nå', 'her', 'der',
    'da', 'om', 'eller', 'men', 'fordi', 'så', 'enn', 'ved', 'fra',
  ]);
  
  return text
    .split(/\s+/)
    .filter(word => !stopwords.has(word.toLowerCase()))
    .join(' ');
}

/**
 * Sanitize text for safe storage (basic XSS prevention)
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Detect the language of text (basic heuristic)
 */
export function detectLanguage(text: string): 'en' | 'no' | 'unknown' {
  const norwegianMarkers = [
    'og', 'jeg', 'det', 'er', 'på', 'for', 'med', 'har', 'som', 'til',
    'av', 'var', 'fra', 'om', 'eller', 'men', 'når', 'hvor', 'hvordan',
    'æ', 'ø', 'å', // Norwegian-specific characters
  ];
  
  const englishMarkers = [
    'the', 'and', 'is', 'are', 'was', 'were', 'have', 'has', 'been',
    'with', 'that', 'this', 'from', 'they', 'which', 'would', 'could',
  ];
  
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  let norwegianScore = 0;
  let englishScore = 0;
  
  for (const word of words) {
    if (norwegianMarkers.includes(word)) norwegianScore++;
    if (englishMarkers.includes(word)) englishScore++;
  }
  
  // Check for Norwegian characters
  if (/[æøå]/i.test(text)) {
    norwegianScore += 5;
  }
  
  if (norwegianScore === 0 && englishScore === 0) {
    return 'unknown';
  }
  
  return norwegianScore > englishScore ? 'no' : 'en';
}
