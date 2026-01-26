// Memory Tier System
export type {
  MemoryTier,
  MemoryTierConfig,
  TierTransition,
} from './memory-tier.js';

export {
  DEFAULT_TIER_CONFIGS,
  TIER_TRANSITIONS,
  getPromotionTarget,
  getDemotionTarget,
} from './memory-tier.js';

// Core Memory Types
export type {
  MemoryType,
  MemorySource,
  MemoryConfidence,
  MemoryMetadata,
  MemoryStructuredData,
  MemoryEmbedding,
  MemoryDecay,
  Memory,
  CreateMemoryInput,
  UpdateMemoryInput,
  MemoryChunk,
} from './memory.js';

// Importance Scoring
export type {
  ImportanceFactors,
  ImportanceWeights,
  ImportanceScore,
  ImportanceThresholds,
  ImportanceScorer,
} from './importance.js';

export {
  DEFAULT_IMPORTANCE_WEIGHTS,
  DEFAULT_IMPORTANCE_THRESHOLDS,
} from './importance.js';

// Retrieval Types
export type {
  MemoryRetrievalQuery,
  MemoryRetrievalOptions,
  RetrievedMemory,
  MemoryRetrievalResult,
  ConsolidationOptions,
  ConsolidationResult,
  ForgetCriteria,
  ForgetResult,
} from './retrieval.js';

export { DEFAULT_RETRIEVAL_OPTIONS } from './retrieval.js';

// Entity Extraction
export type {
  EntityType,
  ExtractedEntity,
  EntityExtractionResult,
  NorwegianEntityPatterns,
  DetectedPreference,
  PreferenceCategory,
  PreferenceDetectionResult,
  ExtractedFact,
  FactExtractionResult,
} from './entities.js';

export { NORWEGIAN_PATTERNS } from './entities.js';

// Persona Types
export type {
  CommunicationStyle,
  ProfessionalProfile,
  PersonalPreferences,
  RelationshipContext,
  UserPersona,
  QuestionCategory,
  ProbingQuestion,
  EmailCompositionRequest,
  ComposedEmail,
  ConversationInsight,
} from './persona.js';

export { createEmptyPersona } from './persona.js';
