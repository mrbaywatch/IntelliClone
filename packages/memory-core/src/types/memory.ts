import type { MemoryTier } from './memory-tier.js';

/**
 * Types of memories the system can store
 * Based on the architecture doc's memory taxonomy
 */
export type MemoryType =
  | 'fact'        // "User works at DNB"
  | 'preference'  // "User prefers email communication"
  | 'event'       // "User mentioned a meeting on March 15th"
  | 'relationship'// "User reports to Kari in Finance"
  | 'skill'       // "User is proficient in Excel"
  | 'goal'        // "User wants to improve Norwegian writing"
  | 'context'     // "User is working on Q1 report"
  | 'feedback';   // "User found the summary helpful"

/**
 * How the memory was acquired
 */
export type MemorySource =
  | 'explicit_statement'  // User directly stated it
  | 'inference'           // Derived from context
  | 'correction'          // User corrected previous memory
  | 'observation'         // Observed from behavior
  | 'external_import';    // Imported from external system

/**
 * Confidence level in the memory's accuracy
 */
export interface MemoryConfidence {
  /** Overall confidence score 0-1 */
  score: number;
  
  /** How the confidence was determined */
  basis: 'explicit' | 'inferred' | 'repeated' | 'corrected';
  
  /** Number of times this memory was reinforced */
  reinforcements: number;
  
  /** Last time confidence was updated */
  lastUpdated: Date;
}

/**
 * Metadata about a memory's lifecycle and usage
 */
export interface MemoryMetadata {
  /** When the memory was created */
  createdAt: Date;
  
  /** Last time the memory was accessed for retrieval */
  lastAccessedAt: Date | null;
  
  /** Last time the memory content was updated */
  updatedAt: Date;
  
  /** Number of times retrieved and used in context */
  accessCount: number;
  
  /** How the memory was acquired */
  source: MemorySource;
  
  /** Source conversation ID (if applicable) */
  sourceConversationId?: string;
  
  /** Source message IDs (if applicable) */
  sourceMessageIds?: string[];
  
  /** Custom metadata for domain-specific use */
  custom?: Record<string, unknown>;
}

/**
 * Structured data extracted from the memory content
 */
export interface MemoryStructuredData {
  /** Subject of the memory (usually 'user' or an entity) */
  subject: string;
  
  /** Relationship or predicate */
  predicate: string;
  
  /** Object or value */
  object: string;
  
  /** Additional qualifiers */
  qualifiers?: Record<string, string>;
  
  /** Temporal context (when applicable) */
  temporal?: {
    type: 'point' | 'range' | 'recurring';
    value: string;
    parsed?: Date | null;
  };
}

/**
 * Vector embedding for semantic search
 */
export interface MemoryEmbedding {
  /** The embedding vector */
  vector: number[];
  
  /** Model used to generate the embedding */
  model: string;
  
  /** Dimension of the embedding */
  dimension: number;
  
  /** When the embedding was generated */
  generatedAt: Date;
}

/**
 * Decay and forgetting mechanics
 */
export interface MemoryDecay {
  /** Current decay score (1.0 = fresh, 0 = forgotten) */
  score: number;
  
  /** Decay rate per day (higher = faster forgetting) */
  ratePerDay: number;
  
  /** Last time decay was calculated */
  lastCalculated: Date;
  
  /** Whether this memory is protected from decay */
  protected: boolean;
}

/**
 * Core Memory interface - the fundamental unit of the system
 */
export interface Memory {
  /** Unique identifier */
  id: string;
  
  /** User this memory belongs to */
  userId: string;
  
  /** Chatbot/context this memory is associated with (optional for global memories) */
  chatbotId?: string;
  
  /** Tenant/organization ID for multi-tenancy */
  tenantId: string;
  
  /** Current tier in the memory hierarchy */
  tier: MemoryTier;
  
  /** Type classification */
  type: MemoryType;
  
  /** Human-readable content of the memory */
  content: string;
  
  /** Structured representation (for programmatic use) */
  structuredData?: MemoryStructuredData;
  
  /** Importance score for retrieval prioritization (0-1) */
  importanceScore: number;
  
  /** Confidence in this memory's accuracy */
  confidence: MemoryConfidence;
  
  /** Lifecycle metadata */
  metadata: MemoryMetadata;
  
  /** Vector embedding for semantic search */
  embedding?: MemoryEmbedding;
  
  /** Decay/forgetting state */
  decay: MemoryDecay;
  
  /** Tags for categorization and filtering */
  tags: string[];
  
  /** IDs of memories this one contradicts */
  contradicts?: string[];
  
  /** IDs of memories that supersede this one */
  supersededBy?: string[];
  
  /** Whether this memory is soft-deleted */
  isDeleted: boolean;
  
  /** When the memory expires (null = no expiry) */
  expiresAt?: Date;
}

/**
 * Input for creating a new memory
 */
export interface CreateMemoryInput {
  userId: string;
  tenantId: string;
  chatbotId?: string;
  type: MemoryType;
  content: string;
  structuredData?: MemoryStructuredData;
  source: MemorySource;
  sourceConversationId?: string;
  sourceMessageIds?: string[];
  tags?: string[];
  customMetadata?: Record<string, unknown>;
  expiresAt?: Date;
}

/**
 * Options for updating a memory
 */
export interface UpdateMemoryInput {
  content?: string;
  structuredData?: MemoryStructuredData;
  tags?: string[];
  importanceScore?: number;
  customMetadata?: Record<string, unknown>;
}

/**
 * A memory chunk for when memories need to be split
 */
export interface MemoryChunk {
  /** Unique identifier for the chunk */
  id: string;
  
  /** Parent memory ID */
  memoryId: string;
  
  /** Chunk sequence number */
  sequence: number;
  
  /** Total number of chunks */
  totalChunks: number;
  
  /** Content of this chunk */
  content: string;
  
  /** Embedding for this specific chunk */
  embedding?: MemoryEmbedding;
  
  /** Byte offset in the original content */
  startOffset: number;
  
  /** Byte length of this chunk */
  length: number;
}
