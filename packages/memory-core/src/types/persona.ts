/**
 * Persona Types for IntelliClone
 * 
 * Defines the structure of user personas that the chatbot learns over time.
 * This is what makes IntelliClone "smart" - it builds a rich understanding of each user.
 */

/**
 * Communication style preferences
 */
export interface CommunicationStyle {
  /** Formal vs casual (0-1, 0=very casual, 1=very formal) */
  formality: number;
  
  /** Brief vs detailed (0-1, 0=very brief, 1=very detailed) */
  verbosity: number;
  
  /** Direct vs indirect (0-1, 0=very direct, 1=very indirect) */
  directness: number;
  
  /** Emotional vs neutral (0-1, 0=neutral, 1=very emotional) */
  emotionality: number;
  
  /** Technical vs simple language (0-1, 0=simple, 1=highly technical) */
  technicality: number;
  
  /** Preferred language (e.g., 'no', 'en', 'no-nb') */
  preferredLanguage: string;
  
  /** Common phrases they use */
  signatures: string[];
  
  /** Greetings they prefer */
  preferredGreetings: string[];
  
  /** How they sign off */
  preferredSignoffs: string[];
}

/**
 * Professional profile
 */
export interface ProfessionalProfile {
  /** Job title */
  title?: string;
  
  /** Company name */
  company?: string;
  
  /** Industry */
  industry?: string;
  
  /** Role type (e.g., 'executive', 'manager', 'individual-contributor') */
  roleType?: string;
  
  /** Years of experience */
  yearsExperience?: number;
  
  /** Key responsibilities */
  responsibilities: string[];
  
  /** Professional goals */
  goals: string[];
  
  /** Challenges they face */
  challenges: string[];
  
  /** Team size they manage */
  teamSize?: number;
  
  /** Decision-making authority level */
  decisionAuthority?: 'final' | 'recommender' | 'influencer' | 'none';
}

/**
 * Personal preferences
 */
export interface PersonalPreferences {
  /** Preferred communication time */
  preferredContactTime?: string;
  
  /** Time zone */
  timezone?: string;
  
  /** Topics of interest */
  interests: string[];
  
  /** Topics to avoid */
  avoidTopics: string[];
  
  /** How they like to receive information (bullet points, paragraphs, etc.) */
  infoFormat: 'bullets' | 'paragraphs' | 'numbered-list' | 'mixed';
  
  /** Urgency preference (how quickly they expect responses) */
  urgencyLevel: 'asap' | 'same-day' | 'next-day' | 'flexible';
  
  /** Preferred meeting length */
  meetingDuration?: number;
}

/**
 * Relationship context
 */
export interface RelationshipContext {
  /** Key people they mention */
  keyPeople: Array<{
    name: string;
    relationship: string;
    notes?: string;
  }>;
  
  /** Organizations they're connected to */
  organizations: Array<{
    name: string;
    relationship: string;
    notes?: string;
  }>;
  
  /** Important dates */
  importantDates: Array<{
    date: string;
    description: string;
    recurring?: boolean;
  }>;
}

/**
 * The complete user persona
 */
export interface UserPersona {
  /** Unique identifier */
  id: string;
  
  /** User this persona belongs to */
  userId: string;
  
  /** Tenant context */
  tenantId: string;
  
  /** Optional chatbot-specific persona */
  chatbotId?: string;
  
  /** Basic info */
  name?: string;
  email?: string;
  
  /** Communication style analysis */
  communicationStyle: CommunicationStyle;
  
  /** Professional profile */
  professionalProfile: ProfessionalProfile;
  
  /** Personal preferences */
  personalPreferences: PersonalPreferences;
  
  /** Relationship context */
  relationships: RelationshipContext;
  
  /** Key facts learned (indexed by category) */
  facts: Record<string, string[]>;
  
  /** Overall confidence in persona accuracy (0-1) */
  overallConfidence: number;
  
  /** Number of conversations analyzed */
  conversationsAnalyzed: number;
  
  /** Last time persona was updated */
  lastUpdated: Date;
  
  /** When the persona was created */
  createdAt: Date;
  
  /** Version for tracking changes */
  version: number;
}

/**
 * Create an empty/default persona
 */
export function createEmptyPersona(
  userId: string,
  tenantId: string,
  chatbotId?: string
): UserPersona {
  const now = new Date();
  return {
    id: '',  // Will be set by storage
    userId,
    tenantId,
    chatbotId,
    communicationStyle: {
      formality: 0.5,
      verbosity: 0.5,
      directness: 0.5,
      emotionality: 0.5,
      technicality: 0.5,
      preferredLanguage: 'no',  // Default to Norwegian
      signatures: [],
      preferredGreetings: [],
      preferredSignoffs: [],
    },
    professionalProfile: {
      responsibilities: [],
      goals: [],
      challenges: [],
    },
    personalPreferences: {
      interests: [],
      avoidTopics: [],
      infoFormat: 'mixed',
      urgencyLevel: 'flexible',
    },
    relationships: {
      keyPeople: [],
      organizations: [],
      importantDates: [],
    },
    facts: {},
    overallConfidence: 0,
    conversationsAnalyzed: 0,
    lastUpdated: now,
    createdAt: now,
    version: 1,
  };
}

/**
 * Probing question categories
 */
export type QuestionCategory =
  | 'professional'
  | 'communication'
  | 'preferences'
  | 'relationships'
  | 'goals'
  | 'challenges';

/**
 * A probing question to learn about the user
 */
export interface ProbingQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  questionNo: string;  // Norwegian version
  followUpQuestions: string[];
  personaFields: string[];  // Which persona fields this helps fill
  priority: number;  // Higher = ask sooner
  askedCount: number;  // How many times asked across all users
  successRate: number;  // How often it yields useful info
}

/**
 * Email composition request
 */
export interface EmailCompositionRequest {
  /** What the email should accomplish */
  purpose: string;
  
  /** Who is receiving the email */
  recipient: string;
  
  /** Relationship to recipient */
  recipientRelationship?: string;
  
  /** Key points to include */
  keyPoints: string[];
  
  /** Tone override (if different from default style) */
  toneOverride?: 'formal' | 'casual' | 'friendly' | 'urgent';
  
  /** Length preference */
  length?: 'short' | 'medium' | 'long';
  
  /** Any context about previous communication */
  previousContext?: string;
}

/**
 * Email composition result
 */
export interface ComposedEmail {
  subject: string;
  body: string;
  suggestedFollowUp?: string;
  confidenceScore: number;
  styleMatchScore: number;
  notes?: string;
}

/**
 * Insight extracted from conversation
 */
export interface ConversationInsight {
  type: 'fact' | 'preference' | 'style' | 'relationship' | 'goal' | 'challenge';
  content: string;
  confidence: number;
  source: string;  // The message that revealed this
  personaField?: string;  // Which persona field to update
}
