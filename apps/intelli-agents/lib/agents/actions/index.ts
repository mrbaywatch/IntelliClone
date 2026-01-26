/**
 * Intelli-Agents Action System
 * Executes individual workflow actions
 */

import type {
  ActionType,
  ActionConfig,
  ExecutionContext,
  StepOutput,
  SendEmailConfig,
  SendSMSConfig,
  CreateContactConfig,
  UpdateContactConfig,
  CreateTaskConfig,
  AIClassifyConfig,
  AISummarizeConfig,
  AIExtractConfig,
  AIRespondConfig,
  ConditionConfig,
  DelayConfig,
  WebhookCallConfig,
  SetVariableConfig,
  TripletexSyncConfig,
  FikenSyncConfig,
} from '../types/index.js';

// =============================================================================
// ACTION EXECUTOR INTERFACE
// =============================================================================

/**
 * Base interface for action executors
 */
export interface ActionExecutor<T extends ActionConfig = ActionConfig> {
  /** Action type this executor handles */
  type: ActionType;

  /**
   * Execute the action
   */
  execute(
    config: T,
    context: ExecutionContext
  ): Promise<ActionResult>;

  /**
   * Validate action configuration
   */
  validate(config: T): ValidationResult;

  /**
   * Get the schema for this action's configuration
   */
  getConfigSchema(): ActionConfigSchema;
}

export interface ActionResult {
  success: boolean;
  data?: Record<string, unknown>;
  error?: string;
  tokensUsed?: number;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ActionConfigSchema {
  type: ActionType;
  name: string;
  description: string;
  icon: string;
  category: ActionCategory;
  fields: ActionField[];
}

export type ActionCategory =
  | 'communication'
  | 'crm'
  | 'ai'
  | 'control_flow'
  | 'integration'
  | 'data';

export interface ActionField {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'textarea' | 'json';
  label: string;
  description?: string;
  required?: boolean;
  default?: unknown;
  options?: Array<{ value: string; label: string }>;
  placeholder?: string;
  supportsVariables?: boolean;
}

// =============================================================================
// UTILITY: VARIABLE INTERPOLATION
// =============================================================================

/**
 * Interpolate variables in a string
 * Supports {{variable}} syntax and nested paths like {{trigger.data.email}}
 */
export function interpolateVariables(
  template: string,
  context: ExecutionContext
): string {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getNestedValue(buildVariableContext(context), path.trim());
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Build the full variable context from execution context
 */
function buildVariableContext(context: ExecutionContext): Record<string, unknown> {
  return {
    trigger: context.trigger,
    variables: context.variables,
    steps: context.steps,
    timestamp: context.timestamp.toISOString(),
    executionId: context.executionId,
    agentId: context.agentId,
    // Convenience shortcuts
    data: context.trigger.data,
    ...context.variables,
  };
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

// =============================================================================
// EMAIL ACTION EXECUTOR
// =============================================================================

export class SendEmailExecutor implements ActionExecutor<SendEmailConfig> {
  type: ActionType = 'send_email';

  async execute(
    config: SendEmailConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      // Interpolate variables
      const to = interpolateVariables(config.to, context);
      const subject = interpolateVariables(config.subject, context);
      const body = interpolateVariables(config.body, context);
      const cc = config.cc ? interpolateVariables(config.cc, context) : undefined;
      const bcc = config.bcc ? interpolateVariables(config.bcc, context) : undefined;

      // In production, this would use the mailer service
      // For now, we'll simulate the email sending
      console.log('[SendEmail] Sending email:', { to, subject, cc, bcc });

      // TODO: Integrate with @kit/mailers
      // await sendEmail({ to, subject, body, cc, bcc, html: config.bodyType === 'html' });

      return {
        success: true,
        data: {
          to,
          subject,
          sentAt: new Date().toISOString(),
          messageId: `msg_${Date.now()}`,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
      };
    }
  }

  validate(config: SendEmailConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.to || config.to.trim() === '') {
      errors.push('Recipient (to) is required');
    }

    if (!config.subject || config.subject.trim() === '') {
      errors.push('Subject is required');
    }

    if (!config.body || config.body.trim() === '') {
      errors.push('Body is required');
    }

    return { valid: errors.length === 0, errors };
  }

  getConfigSchema(): ActionConfigSchema {
    return {
      type: 'send_email',
      name: 'Send Email',
      description: 'Send an email to one or more recipients',
      icon: 'mail',
      category: 'communication',
      fields: [
        {
          name: 'to',
          type: 'string',
          label: 'To',
          description: 'Recipient email address',
          required: true,
          supportsVariables: true,
          placeholder: '{{trigger.data.email}}',
        },
        {
          name: 'cc',
          type: 'string',
          label: 'CC',
          supportsVariables: true,
        },
        {
          name: 'subject',
          type: 'string',
          label: 'Subject',
          required: true,
          supportsVariables: true,
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Body',
          required: true,
          supportsVariables: true,
        },
        {
          name: 'bodyType',
          type: 'select',
          label: 'Body Type',
          default: 'text',
          options: [
            { value: 'text', label: 'Plain Text' },
            { value: 'html', label: 'HTML' },
          ],
        },
      ],
    };
  }
}

// =============================================================================
// AI CLASSIFICATION EXECUTOR
// =============================================================================

export class AIClassifyExecutor implements ActionExecutor<AIClassifyConfig> {
  type: ActionType = 'ai_classify';

  async execute(
    config: AIClassifyConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      // Get input text
      const inputText = getNestedValue(
        buildVariableContext(context),
        config.inputField
      ) as string;

      if (!inputText) {
        throw new Error(`Input field "${config.inputField}" not found or empty`);
      }

      // Build classification prompt
      const categoriesDescription = config.categories
        .map((c) => {
          let desc = `- ${c.name}: ${c.description}`;
          if (c.examples && c.examples.length > 0) {
            desc += ` (examples: ${c.examples.join(', ')})`;
          }
          return desc;
        })
        .join('\n');

      const systemPrompt = `You are a classification assistant. Classify the given text into one of the following categories:

${categoriesDescription}

Respond with ONLY the category name, nothing else.${
        config.confidence ? ' Also provide a confidence score from 0-100 on a new line.' : ''
      }`;

      // TODO: Use @kit/ai-core ModelRouter
      // const response = await modelRouter.chat({
      //   messages: [
      //     { role: 'system', content: systemPrompt },
      //     { role: 'user', content: inputText },
      //   ],
      // }, 'analysis');

      // Simulated response for now
      const simulatedCategory = config.categories[0]?.name || 'unknown';
      const simulatedConfidence = 85;

      const result: Record<string, unknown> = {
        category: simulatedCategory,
      };

      if (config.confidence) {
        result.confidence = simulatedConfidence;
      }

      return {
        success: true,
        data: {
          [config.outputField]: result,
        },
        tokensUsed: 150,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Classification failed',
      };
    }
  }

  validate(config: AIClassifyConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.categories || config.categories.length < 2) {
      errors.push('At least 2 categories are required');
    }

    if (!config.inputField) {
      errors.push('Input field is required');
    }

    if (!config.outputField) {
      errors.push('Output field is required');
    }

    for (const cat of config.categories || []) {
      if (!cat.name || cat.name.trim() === '') {
        errors.push('All categories must have a name');
      }
      if (!cat.description || cat.description.trim() === '') {
        errors.push(`Category "${cat.name}" must have a description`);
      }
    }

    return { valid: errors.length === 0, errors };
  }

  getConfigSchema(): ActionConfigSchema {
    return {
      type: 'ai_classify',
      name: 'AI Classification',
      description: 'Classify text into predefined categories using AI',
      icon: 'tags',
      category: 'ai',
      fields: [
        {
          name: 'inputField',
          type: 'string',
          label: 'Input Field',
          description: 'Field containing text to classify',
          required: true,
          placeholder: 'trigger.data.body',
        },
        {
          name: 'categories',
          type: 'json',
          label: 'Categories',
          description: 'List of classification categories',
          required: true,
        },
        {
          name: 'outputField',
          type: 'string',
          label: 'Output Field',
          description: 'Where to store the classification result',
          required: true,
          default: 'classification',
        },
        {
          name: 'confidence',
          type: 'boolean',
          label: 'Include Confidence',
          default: true,
        },
      ],
    };
  }
}

// =============================================================================
// AI RESPOND EXECUTOR
// =============================================================================

export class AIRespondExecutor implements ActionExecutor<AIRespondConfig> {
  type: ActionType = 'ai_respond';

  async execute(
    config: AIRespondConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      // Get input text
      const inputText = getNestedValue(
        buildVariableContext(context),
        config.inputField
      ) as string;

      if (!inputText) {
        throw new Error(`Input field "${config.inputField}" not found or empty`);
      }

      // Build system prompt
      let systemPrompt = config.systemPrompt || 'You are a helpful assistant.';

      // Add tone guidance
      if (config.tone) {
        const toneGuides = {
          professional: 'Maintain a professional and business-like tone.',
          friendly: 'Be warm, approachable, and conversational.',
          formal: 'Use formal language suitable for official communication.',
        };
        systemPrompt += `\n\n${toneGuides[config.tone]}`;
      }

      // Add language guidance
      if (config.language === 'no') {
        systemPrompt += '\n\nRespond in Norwegian (Bokmål).';
      }

      // Build context from additional fields
      let contextInfo = '';
      if (config.includeContext && config.includeContext.length > 0) {
        const varContext = buildVariableContext(context);
        for (const field of config.includeContext) {
          const value = getNestedValue(varContext, field);
          if (value) {
            contextInfo += `\n${field}: ${JSON.stringify(value)}`;
          }
        }
      }

      if (contextInfo) {
        systemPrompt += `\n\nContext information:${contextInfo}`;
      }

      // TODO: Use @kit/ai-core ModelRouter
      // const response = await modelRouter.chat({
      //   messages: [
      //     { role: 'system', content: systemPrompt },
      //     { role: 'user', content: inputText },
      //   ],
      //   maxTokens: config.maxTokens,
      // }, 'chat');

      // Simulated response
      const simulatedResponse = `Thank you for your message. I have received your inquiry and will respond shortly.`;

      return {
        success: true,
        data: {
          [config.outputField]: simulatedResponse,
        },
        tokensUsed: 200,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI response generation failed',
      };
    }
  }

  validate(config: AIRespondConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.inputField) {
      errors.push('Input field is required');
    }

    if (!config.outputField) {
      errors.push('Output field is required');
    }

    return { valid: errors.length === 0, errors };
  }

  getConfigSchema(): ActionConfigSchema {
    return {
      type: 'ai_respond',
      name: 'AI Response',
      description: 'Generate an AI response to text input',
      icon: 'message-square',
      category: 'ai',
      fields: [
        {
          name: 'inputField',
          type: 'string',
          label: 'Input Field',
          required: true,
          placeholder: 'trigger.data.message',
        },
        {
          name: 'outputField',
          type: 'string',
          label: 'Output Field',
          required: true,
          default: 'response',
        },
        {
          name: 'systemPrompt',
          type: 'textarea',
          label: 'System Prompt',
          placeholder: 'You are a helpful customer service agent...',
        },
        {
          name: 'tone',
          type: 'select',
          label: 'Tone',
          options: [
            { value: 'professional', label: 'Professional' },
            { value: 'friendly', label: 'Friendly' },
            { value: 'formal', label: 'Formal' },
          ],
        },
        {
          name: 'language',
          type: 'select',
          label: 'Language',
          default: 'no',
          options: [
            { value: 'no', label: 'Norwegian' },
            { value: 'en', label: 'English' },
          ],
        },
        {
          name: 'maxTokens',
          type: 'number',
          label: 'Max Tokens',
          default: 1000,
        },
      ],
    };
  }
}

// =============================================================================
// AI EXTRACT EXECUTOR
// =============================================================================

export class AIExtractExecutor implements ActionExecutor<AIExtractConfig> {
  type: ActionType = 'ai_extract';

  async execute(
    config: AIExtractConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const inputText = getNestedValue(
        buildVariableContext(context),
        config.inputField
      ) as string;

      if (!inputText) {
        throw new Error(`Input field "${config.inputField}" not found or empty`);
      }

      // Build extraction prompt
      const fieldsDescription = config.fields
        .map((f) => `- ${f.name} (${f.type}): ${f.description}${f.required ? ' [required]' : ''}`)
        .join('\n');

      const systemPrompt = `Extract the following information from the text. Return as JSON:

${fieldsDescription}

If a field cannot be found, use null. Respond with ONLY valid JSON.`;

      // TODO: Use @kit/ai-core ModelRouter
      // const response = await modelRouter.chat({...});

      // Simulated extraction
      const extractedData: Record<string, unknown> = {};
      for (const field of config.fields) {
        // Simulate extraction
        switch (field.type) {
          case 'email':
            extractedData[field.name] = 'kunde@example.no';
            break;
          case 'phone':
            extractedData[field.name] = '+47 12 34 56 78';
            break;
          case 'date':
            extractedData[field.name] = new Date().toISOString();
            break;
          default:
            extractedData[field.name] = null;
        }
      }

      return {
        success: true,
        data: {
          [config.outputField]: extractedData,
        },
        tokensUsed: 250,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Extraction failed',
      };
    }
  }

  validate(config: AIExtractConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.inputField) {
      errors.push('Input field is required');
    }

    if (!config.fields || config.fields.length === 0) {
      errors.push('At least one extraction field is required');
    }

    if (!config.outputField) {
      errors.push('Output field is required');
    }

    return { valid: errors.length === 0, errors };
  }

  getConfigSchema(): ActionConfigSchema {
    return {
      type: 'ai_extract',
      name: 'AI Data Extraction',
      description: 'Extract structured data from text using AI',
      icon: 'file-search',
      category: 'ai',
      fields: [
        {
          name: 'inputField',
          type: 'string',
          label: 'Input Field',
          required: true,
        },
        {
          name: 'fields',
          type: 'json',
          label: 'Fields to Extract',
          required: true,
        },
        {
          name: 'outputField',
          type: 'string',
          label: 'Output Field',
          required: true,
          default: 'extracted',
        },
      ],
    };
  }
}

// =============================================================================
// CONDITION EXECUTOR
// =============================================================================

export class ConditionExecutor implements ActionExecutor<ConditionConfig> {
  type: ActionType = 'condition';

  async execute(
    config: ConditionConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const varContext = buildVariableContext(context);
      let result = true;
      let currentOperator: 'and' | 'or' = 'and';

      for (const condition of config.conditions) {
        const fieldValue = getNestedValue(varContext, condition.field);
        const conditionResult = this.evaluateCondition(
          fieldValue,
          condition.operator,
          condition.value
        );

        if (currentOperator === 'and') {
          result = result && conditionResult;
        } else {
          result = result || conditionResult;
        }

        if (condition.logicalOperator) {
          currentOperator = condition.logicalOperator;
        }
      }

      return {
        success: true,
        data: {
          result,
          branch: result ? 'true' : 'false',
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Condition evaluation failed',
      };
    }
  }

  private evaluateCondition(
    fieldValue: unknown,
    operator: ConditionConfig['conditions'][0]['operator'],
    compareValue: unknown
  ): boolean {
    switch (operator) {
      case 'eq':
        return fieldValue === compareValue;
      case 'neq':
        return fieldValue !== compareValue;
      case 'gt':
        return Number(fieldValue) > Number(compareValue);
      case 'lt':
        return Number(fieldValue) < Number(compareValue);
      case 'gte':
        return Number(fieldValue) >= Number(compareValue);
      case 'lte':
        return Number(fieldValue) <= Number(compareValue);
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      case 'startsWith':
        return String(fieldValue).startsWith(String(compareValue));
      case 'endsWith':
        return String(fieldValue).endsWith(String(compareValue));
      case 'regex':
        return new RegExp(String(compareValue)).test(String(fieldValue));
      case 'exists':
        return fieldValue !== undefined && fieldValue !== null;
      default:
        return false;
    }
  }

  validate(config: ConditionConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.conditions || config.conditions.length === 0) {
      errors.push('At least one condition is required');
    }

    for (const condition of config.conditions || []) {
      if (!condition.field) {
        errors.push('Condition field is required');
      }
      if (!condition.operator) {
        errors.push('Condition operator is required');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  getConfigSchema(): ActionConfigSchema {
    return {
      type: 'condition',
      name: 'Condition',
      description: 'Branch workflow based on conditions',
      icon: 'git-branch',
      category: 'control_flow',
      fields: [
        {
          name: 'conditions',
          type: 'json',
          label: 'Conditions',
          required: true,
        },
        {
          name: 'trueLabel',
          type: 'string',
          label: 'True Branch Label',
          default: 'Yes',
        },
        {
          name: 'falseLabel',
          type: 'string',
          label: 'False Branch Label',
          default: 'No',
        },
      ],
    };
  }
}

// =============================================================================
// DELAY EXECUTOR
// =============================================================================

export class DelayExecutor implements ActionExecutor<DelayConfig> {
  type: ActionType = 'delay';

  async execute(
    config: DelayConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const msMultipliers: Record<DelayConfig['unit'], number> = {
      seconds: 1000,
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
    };

    const delayMs = config.duration * msMultipliers[config.unit];

    // In production, long delays would be handled differently (queued, scheduled)
    // For now, we'll just simulate completion
    if (delayMs <= 30000) {
      // Only actually wait for short delays (< 30s)
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    return {
      success: true,
      data: {
        delayedMs: delayMs,
        resumedAt: new Date().toISOString(),
      },
    };
  }

  validate(config: DelayConfig): ValidationResult {
    const errors: string[] = [];

    if (config.duration <= 0) {
      errors.push('Duration must be greater than 0');
    }

    if (!['seconds', 'minutes', 'hours', 'days'].includes(config.unit)) {
      errors.push('Invalid duration unit');
    }

    return { valid: errors.length === 0, errors };
  }

  getConfigSchema(): ActionConfigSchema {
    return {
      type: 'delay',
      name: 'Delay',
      description: 'Wait for a specified duration before continuing',
      icon: 'clock',
      category: 'control_flow',
      fields: [
        {
          name: 'duration',
          type: 'number',
          label: 'Duration',
          required: true,
          default: 5,
        },
        {
          name: 'unit',
          type: 'select',
          label: 'Unit',
          required: true,
          default: 'minutes',
          options: [
            { value: 'seconds', label: 'Seconds' },
            { value: 'minutes', label: 'Minutes' },
            { value: 'hours', label: 'Hours' },
            { value: 'days', label: 'Days' },
          ],
        },
      ],
    };
  }
}

// =============================================================================
// WEBHOOK CALL EXECUTOR
// =============================================================================

export class WebhookCallExecutor implements ActionExecutor<WebhookCallConfig> {
  type: ActionType = 'webhook_call';

  async execute(
    config: WebhookCallConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const url = interpolateVariables(config.url, context);
      const body = config.body
        ? interpolateVariables(config.body, context)
        : undefined;

      const headers: Record<string, string> = {
        'Content-Type':
          config.bodyType === 'json'
            ? 'application/json'
            : config.bodyType === 'form'
            ? 'application/x-www-form-urlencoded'
            : 'text/plain',
        ...config.headers,
      };

      // Interpolate header values
      for (const [key, value] of Object.entries(headers)) {
        headers[key] = interpolateVariables(value, context);
      }

      const response = await fetch(url, {
        method: config.method,
        headers,
        body: body,
      });

      const responseData = await response.json().catch(() => response.text());

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result: Record<string, unknown> = {
        statusCode: response.status,
        headers: Object.fromEntries(response.headers.entries()),
      };

      if (config.outputField) {
        result[config.outputField] = responseData;
      } else {
        result.response = responseData;
      }

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Webhook call failed',
      };
    }
  }

  validate(config: WebhookCallConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.url) {
      errors.push('URL is required');
    }

    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(config.method)) {
      errors.push('Invalid HTTP method');
    }

    return { valid: errors.length === 0, errors };
  }

  getConfigSchema(): ActionConfigSchema {
    return {
      type: 'webhook_call',
      name: 'HTTP Request',
      description: 'Make an HTTP request to an external service',
      icon: 'globe',
      category: 'integration',
      fields: [
        {
          name: 'url',
          type: 'string',
          label: 'URL',
          required: true,
          supportsVariables: true,
        },
        {
          name: 'method',
          type: 'select',
          label: 'Method',
          required: true,
          default: 'POST',
          options: [
            { value: 'GET', label: 'GET' },
            { value: 'POST', label: 'POST' },
            { value: 'PUT', label: 'PUT' },
            { value: 'PATCH', label: 'PATCH' },
            { value: 'DELETE', label: 'DELETE' },
          ],
        },
        {
          name: 'headers',
          type: 'json',
          label: 'Headers',
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'Body',
          supportsVariables: true,
        },
        {
          name: 'outputField',
          type: 'string',
          label: 'Output Field',
          default: 'response',
        },
      ],
    };
  }
}

// =============================================================================
// SET VARIABLE EXECUTOR
// =============================================================================

export class SetVariableExecutor implements ActionExecutor<SetVariableConfig> {
  type: ActionType = 'set_variable';

  async execute(
    config: SetVariableConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    try {
      const setVariables: Record<string, unknown> = {};

      for (const variable of config.variables) {
        let value: unknown = interpolateVariables(variable.value, context);

        // Type coercion
        switch (variable.type) {
          case 'number':
            value = Number(value);
            break;
          case 'boolean':
            value = value === 'true' || value === '1';
            break;
          case 'json':
            value = typeof value === 'string' ? JSON.parse(value) : value;
            break;
        }

        setVariables[variable.name] = value;
      }

      return {
        success: true,
        data: setVariables,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set variables',
      };
    }
  }

  validate(config: SetVariableConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.variables || config.variables.length === 0) {
      errors.push('At least one variable is required');
    }

    for (const variable of config.variables || []) {
      if (!variable.name || variable.name.trim() === '') {
        errors.push('Variable name is required');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  getConfigSchema(): ActionConfigSchema {
    return {
      type: 'set_variable',
      name: 'Set Variable',
      description: 'Set or modify workflow variables',
      icon: 'variable',
      category: 'data',
      fields: [
        {
          name: 'variables',
          type: 'json',
          label: 'Variables',
          required: true,
        },
      ],
    };
  }
}

// =============================================================================
// ACTION REGISTRY
// =============================================================================

/**
 * Registry of all action executors
 */
export class ActionRegistry {
  private executors: Map<ActionType, ActionExecutor> = new Map();

  constructor() {
    // Register built-in executors
    this.register(new SendEmailExecutor());
    this.register(new AIClassifyExecutor());
    this.register(new AIRespondExecutor());
    this.register(new AIExtractExecutor());
    this.register(new ConditionExecutor());
    this.register(new DelayExecutor());
    this.register(new WebhookCallExecutor());
    this.register(new SetVariableExecutor());
  }

  register(executor: ActionExecutor): void {
    this.executors.set(executor.type, executor);
  }

  get(type: ActionType): ActionExecutor | undefined {
    return this.executors.get(type);
  }

  getAll(): ActionExecutor[] {
    return Array.from(this.executors.values());
  }

  /**
   * Get all action schemas (for UI)
   */
  getAllSchemas(): ActionConfigSchema[] {
    return this.getAll().map((e) => e.getConfigSchema());
  }

  /**
   * Execute an action
   */
  async execute(
    actionType: ActionType,
    config: ActionConfig,
    context: ExecutionContext
  ): Promise<ActionResult> {
    const executor = this.executors.get(actionType);

    if (!executor) {
      return {
        success: false,
        error: `No executor found for action type: ${actionType}`,
      };
    }

    // Validate config
    const validation = executor.validate(config);
    if (!validation.valid) {
      return {
        success: false,
        error: `Configuration validation failed: ${validation.errors.join(', ')}`,
      };
    }

    // Execute action
    return executor.execute(config, context);
  }
}

// Singleton instance
export const actionRegistry = new ActionRegistry();
