/**
 * Intelli-Agents Type Definitions
 * Core types for the AI automation platform
 */

// =============================================================================
// ENUMS (matching database)
// =============================================================================

export type AgentStatus = 'draft' | 'active' | 'paused' | 'error' | 'archived';

export type TriggerType =
  | 'email_received'
  | 'webhook'
  | 'schedule'
  | 'manual'
  | 'form_submission'
  | 'crm_event'
  | 'payment_received'
  | 'chat_message';

export type ActionType =
  // Communication
  | 'send_email'
  | 'send_sms'
  | 'slack_message'
  | 'teams_message'
  // CRM/Business
  | 'create_contact'
  | 'update_contact'
  | 'create_task'
  | 'update_task'
  | 'create_invoice'
  | 'update_crm_field'
  // AI Actions
  | 'ai_classify'
  | 'ai_summarize'
  | 'ai_extract'
  | 'ai_respond'
  | 'ai_translate'
  // Integrations
  | 'tripletex_sync'
  | 'fiken_sync'
  | 'vipps_payment'
  // Control Flow
  | 'condition'
  | 'delay'
  | 'webhook_call'
  | 'set_variable';

export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export type WorkflowNodeType =
  | 'trigger'
  | 'action'
  | 'condition'
  | 'delay'
  | 'ai_task'
  | 'integration'
  | 'output';

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Agent - The main automation unit
 */
export interface Agent {
  id: string;
  accountId: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  status: AgentStatus;
  isTemplate: boolean;
  templateId?: string;
  workflow: Workflow;
  config: AgentConfig;
  systemPrompt?: string;
  modelPreferences: ModelPreferences;
  maxExecutionsPerHour: number;
  maxExecutionsPerDay: number;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  lastExecutionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

/**
 * Agent configuration
 */
export interface AgentConfig {
  /** Variables accessible during execution */
  variables?: Record<string, unknown>;
  /** Retry configuration */
  retry?: {
    maxAttempts: number;
    backoffMs: number;
  };
  /** Timeout in milliseconds */
  timeoutMs?: number;
  /** Rate limiting */
  rateLimit?: {
    maxPerHour: number;
    maxPerDay: number;
  };
  /** Logging level */
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Model preferences for AI actions
 */
export interface ModelPreferences {
  tier: 'fast' | 'balanced' | 'powerful';
  maxTokens: number;
  temperature?: number;
  preferredProvider?: 'openai' | 'anthropic';
}

// =============================================================================
// WORKFLOW TYPES (React Flow compatible)
// =============================================================================

/**
 * Complete workflow definition
 */
export interface Workflow {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport: {
    x: number;
    y: number;
    zoom: number;
  };
}

/**
 * Workflow node (React Flow compatible)
 */
export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: WorkflowNodeData;
  width?: number;
  height?: number;
  selected?: boolean;
  dragging?: boolean;
}

/**
 * Node data configuration
 */
export interface WorkflowNodeData {
  label: string;
  description?: string;
  icon?: string;
  color?: string;

  // For trigger nodes
  triggerType?: TriggerType;
  triggerConfig?: TriggerConfig;

  // For action nodes
  actionType?: ActionType;
  actionConfig?: ActionConfig;

  // For condition nodes
  conditionConfig?: ConditionConfig;

  // For delay nodes
  delayConfig?: DelayConfig;

  // For AI task nodes
  aiTaskConfig?: AITaskConfig;

  // Validation
  isValid?: boolean;
  validationErrors?: string[];
}

/**
 * Workflow edge (React Flow compatible)
 */
export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: string;
  label?: string;
  animated?: boolean;
  data?: {
    condition?: ConditionConfig;
  };
}

// =============================================================================
// TRIGGER TYPES
// =============================================================================

/**
 * Trigger definition
 */
export interface AgentTrigger {
  id: string;
  agentId: string;
  triggerType: TriggerType;
  name: string;
  description?: string;
  isEnabled: boolean;
  config: TriggerConfig;
  webhookUrl?: string;
  webhookSecret?: string;
  totalFires: number;
  lastFiredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Trigger payload - data passed when a trigger fires
 */
export interface TriggerPayload {
  /** Parsed trigger data */
  data: Record<string, unknown>;
  /** Metadata about the trigger event */
  metadata: {
    receivedAt: Date;
    source: string;
    rawData?: unknown;
  };
}

/**
 * Trigger configuration union type
 */
export type TriggerConfig =
  | EmailTriggerConfig
  | WebhookTriggerConfig
  | ScheduleTriggerConfig
  | ManualTriggerConfig
  | FormTriggerConfig
  | CRMEventTriggerConfig
  | PaymentTriggerConfig
  | ChatTriggerConfig;

export interface EmailTriggerConfig {
  type: 'email_received';
  mailboxId?: string;
  filters?: {
    from?: string[];
    subject?: string;
    hasAttachment?: boolean;
    labels?: string[];
  };
}

export interface WebhookTriggerConfig {
  type: 'webhook';
  secret?: string;
  allowedIPs?: string[];
  headers?: Record<string, string>;
  validatePayload?: boolean;
}

export interface ScheduleTriggerConfig {
  type: 'schedule';
  cron: string;
  timezone: string;
  startDate?: string;
  endDate?: string;
}

export interface ManualTriggerConfig {
  type: 'manual';
  requiredInputs?: Array<{
    name: string;
    type: 'string' | 'number' | 'boolean' | 'json';
    description?: string;
    required?: boolean;
  }>;
}

export interface FormTriggerConfig {
  type: 'form_submission';
  formId: string;
  fields?: string[];
}

export interface CRMEventTriggerConfig {
  type: 'crm_event';
  eventType: 'created' | 'updated' | 'deleted';
  entityType: 'contact' | 'deal' | 'task' | 'invoice';
  integration: 'tripletex' | 'fiken';
  filters?: Record<string, unknown>;
}

export interface PaymentTriggerConfig {
  type: 'payment_received';
  provider: 'vipps' | 'stripe';
  minAmount?: number;
  currency?: string;
}

export interface ChatTriggerConfig {
  type: 'chat_message';
  chatbotId: string;
  keywords?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
}

// =============================================================================
// ACTION TYPES
// =============================================================================

/**
 * Action configuration union type
 */
export type ActionConfig =
  | SendEmailConfig
  | SendSMSConfig
  | CreateContactConfig
  | UpdateContactConfig
  | CreateTaskConfig
  | AIClassifyConfig
  | AISummarizeConfig
  | AIExtractConfig
  | AIRespondConfig
  | ConditionConfig
  | DelayConfig
  | WebhookCallConfig
  | SetVariableConfig
  | TripletexSyncConfig
  | FikenSyncConfig;

export interface SendEmailConfig {
  type: 'send_email';
  to: string; // Can use {{variables}}
  cc?: string;
  bcc?: string;
  subject: string;
  body: string;
  bodyType: 'text' | 'html';
  attachments?: Array<{
    filename: string;
    content: string;
    contentType: string;
  }>;
  replyTo?: string;
}

export interface SendSMSConfig {
  type: 'send_sms';
  to: string;
  message: string;
  sender?: string;
}

export interface CreateContactConfig {
  type: 'create_contact';
  integration: 'tripletex' | 'fiken' | 'hubspot';
  data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    company?: string;
    tags?: string[];
    customFields?: Record<string, unknown>;
  };
}

export interface UpdateContactConfig {
  type: 'update_contact';
  integration: 'tripletex' | 'fiken' | 'hubspot';
  contactId: string;
  data: Record<string, unknown>;
}

export interface CreateTaskConfig {
  type: 'create_task';
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  labels?: string[];
}

// =============================================================================
// AI TASK TYPES
// =============================================================================

export interface AIClassifyConfig {
  type: 'ai_classify';
  categories: Array<{
    name: string;
    description: string;
    examples?: string[];
  }>;
  inputField: string; // Which field from context to classify
  outputField: string; // Where to store result
  confidence?: boolean;
}

export interface AISummarizeConfig {
  type: 'ai_summarize';
  inputField: string;
  outputField: string;
  maxLength?: number;
  style?: 'bullet' | 'paragraph' | 'tldr';
  language?: 'no' | 'en'; // Norwegian or English
}

export interface AIExtractConfig {
  type: 'ai_extract';
  inputField: string;
  fields: Array<{
    name: string;
    description: string;
    type: 'string' | 'number' | 'date' | 'email' | 'phone' | 'address';
    required?: boolean;
  }>;
  outputField: string;
}

export interface AIRespondConfig {
  type: 'ai_respond';
  inputField: string;
  outputField: string;
  systemPrompt?: string;
  tone?: 'professional' | 'friendly' | 'formal';
  language?: 'no' | 'en';
  maxTokens?: number;
  includeContext?: string[]; // Fields to include as context
}

export interface AITaskConfig {
  taskType: 'classify' | 'summarize' | 'extract' | 'respond' | 'translate';
  config: AIClassifyConfig | AISummarizeConfig | AIExtractConfig | AIRespondConfig;
  modelTier?: 'fast' | 'balanced' | 'powerful';
}

// =============================================================================
// CONTROL FLOW TYPES
// =============================================================================

export interface ConditionConfig {
  type: 'condition';
  conditions: Array<{
    field: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'startsWith' | 'endsWith' | 'regex' | 'exists';
    value: unknown;
    logicalOperator?: 'and' | 'or';
  }>;
  trueLabel?: string;
  falseLabel?: string;
}

export interface DelayConfig {
  type: 'delay';
  duration: number;
  unit: 'seconds' | 'minutes' | 'hours' | 'days';
}

export interface WebhookCallConfig {
  type: 'webhook_call';
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  bodyType?: 'json' | 'form' | 'text';
  outputField?: string;
}

export interface SetVariableConfig {
  type: 'set_variable';
  variables: Array<{
    name: string;
    value: string; // Can use {{variables}}
    type?: 'string' | 'number' | 'boolean' | 'json';
  }>;
}

// =============================================================================
// NORWEGIAN INTEGRATION TYPES
// =============================================================================

export interface TripletexSyncConfig {
  type: 'tripletex_sync';
  operation: 'create_customer' | 'create_invoice' | 'get_customer' | 'sync_contacts';
  data: Record<string, unknown>;
}

export interface FikenSyncConfig {
  type: 'fiken_sync';
  operation: 'create_contact' | 'create_invoice' | 'create_product' | 'get_account_balance';
  data: Record<string, unknown>;
}

// =============================================================================
// EXECUTION TYPES
// =============================================================================

/**
 * Agent execution record
 */
export interface AgentExecution {
  id: string;
  agentId: string;
  triggerId?: string;
  status: ExecutionStatus;
  triggerData: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorMessage?: string;
  errorDetails?: Record<string, unknown>;
  context: ExecutionContext;
  variables: Record<string, unknown>;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  tokensUsed: number;
  estimatedCost: number;
  createdAt: Date;
}

/**
 * Execution context - available during workflow execution
 */
export interface ExecutionContext {
  /** Unique execution ID */
  executionId: string;
  /** The agent being executed */
  agentId: string;
  /** Account ID */
  accountId: string;
  /** Trigger that started this execution */
  trigger: {
    id: string;
    type: TriggerType;
    data: Record<string, unknown>;
  };
  /** User-defined variables */
  variables: Record<string, unknown>;
  /** Current timestamp */
  timestamp: Date;
  /** Previous step outputs */
  steps: Record<string, StepOutput>;
  /** Memory references */
  memories?: Array<{
    id: string;
    content: string;
    relevance: number;
  }>;
}

/**
 * Step output - result of executing a single node
 */
export interface StepOutput {
  nodeId: string;
  actionType?: ActionType;
  status: ExecutionStatus;
  data?: Record<string, unknown>;
  error?: string;
  durationMs: number;
  tokensUsed?: number;
}

/**
 * Execution step record
 */
export interface ExecutionStep {
  id: string;
  executionId: string;
  nodeId: string;
  stepOrder: number;
  actionType?: ActionType;
  status: ExecutionStatus;
  inputData?: Record<string, unknown>;
  outputData?: Record<string, unknown>;
  errorMessage?: string;
  startedAt?: Date;
  completedAt?: Date;
  durationMs?: number;
  createdAt: Date;
}

// =============================================================================
// TEMPLATE TYPES
// =============================================================================

/**
 * Agent template
 */
export interface AgentTemplate {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  icon: string;
  color: string;
  workflow: Workflow;
  config: AgentConfig;
  systemPrompt?: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedSetupMinutes: number;
  isNorwegian: boolean;
  supportedIntegrations: string[];
  usageCount: number;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type TemplateCategory =
  | 'email'
  | 'customer_support'
  | 'sales'
  | 'data_entry'
  | 'social_media'
  | 'finance'
  | 'hr'
  | 'custom';

// =============================================================================
// INTEGRATION TYPES
// =============================================================================

export interface AgentIntegration {
  id: string;
  accountId: string;
  integrationType: IntegrationType;
  name: string;
  credentials?: Record<string, unknown>;
  isConnected: boolean;
  lastSyncAt?: Date;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type IntegrationType =
  | 'tripletex'
  | 'fiken'
  | 'vipps'
  | 'gmail'
  | 'outlook'
  | 'slack'
  | 'teams'
  | 'hubspot'
  | 'twilio';

// =============================================================================
// API TYPES
// =============================================================================

export interface CreateAgentInput {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  templateId?: string;
  workflow?: Workflow;
  config?: AgentConfig;
  systemPrompt?: string;
  modelPreferences?: ModelPreferences;
}

export interface UpdateAgentInput {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
  status?: AgentStatus;
  workflow?: Workflow;
  config?: AgentConfig;
  systemPrompt?: string;
  modelPreferences?: ModelPreferences;
}

export interface TriggerAgentInput {
  agentId: string;
  triggerId?: string;
  data: Record<string, unknown>;
}

export interface AgentExecutionResult {
  executionId: string;
  status: ExecutionStatus;
  output?: Record<string, unknown>;
  error?: string;
  durationMs: number;
  steps: ExecutionStep[];
}
