/**
 * Intelli-Agents
 * AI Automation Platform for Norwegian SMBs
 *
 * This module provides the complete agent automation system including:
 * - Type definitions
 * - Trigger system
 * - Action executors
 * - Agent runtime
 * - Pre-built templates
 */

// Types
export * from './types/index.js';

// Triggers
export {
  triggerRegistry,
  TriggerRegistry,
  EmailTriggerHandler,
  WebhookTriggerHandler,
  ScheduleTriggerHandler,
  ManualTriggerHandler,
  CRMEventTriggerHandler,
  PaymentTriggerHandler,
  type TriggerHandler,
  type TriggerPayload,
  type SetupResult,
} from './triggers/index.js';

// Actions
export {
  actionRegistry,
  ActionRegistry,
  SendEmailExecutor,
  AIClassifyExecutor,
  AIRespondExecutor,
  AIExtractExecutor,
  ConditionExecutor,
  DelayExecutor,
  WebhookCallExecutor,
  SetVariableExecutor,
  interpolateVariables,
  type ActionExecutor,
  type ActionResult,
  type ActionConfigSchema,
  type ActionCategory,
  type ActionField,
} from './actions/index.js';

// Runtime
export {
  agentRuntime,
  AgentRuntime,
  workflowValidator,
  WorkflowValidator,
  DEFAULT_RUNTIME_CONFIG,
  type RuntimeConfig,
  type ExecutionPlan,
  type PlannedStep,
} from './runtime/index.js';

// Templates
export {
  allTemplates,
  getTemplateById,
  getTemplatesByCategory,
  getFeaturedTemplates,
  emailResponderTemplate,
  leadQualificationTemplate,
  customerSupportTemplate,
  dataEntryTemplate,
  socialMediaMonitoringTemplate,
} from './templates/index.js';
