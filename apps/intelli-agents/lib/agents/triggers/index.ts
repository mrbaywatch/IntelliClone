/**
 * Intelli-Agents Trigger System
 * Handles all trigger types: email, webhook, schedule, manual, etc.
 */

import { nanoid } from 'nanoid';
import type {
  TriggerType,
  TriggerConfig,
  AgentTrigger,
  ExecutionContext,
  EmailTriggerConfig,
  WebhookTriggerConfig,
  ScheduleTriggerConfig,
  ManualTriggerConfig,
  CRMEventTriggerConfig,
  PaymentTriggerConfig,
} from '../types/index.js';

// =============================================================================
// TRIGGER HANDLER INTERFACE
// =============================================================================

/**
 * Base interface for trigger handlers
 */
export interface TriggerHandler<T extends TriggerConfig = TriggerConfig> {
  /** Trigger type this handler manages */
  type: TriggerType;

  /**
   * Validate trigger configuration
   */
  validateConfig(config: T): ValidationResult;

  /**
   * Parse incoming trigger data into execution context
   */
  parsePayload(rawData: unknown, config: T): Promise<TriggerPayload>;

  /**
   * Check if incoming data matches trigger filters
   */
  matchesFilters(data: TriggerPayload, config: T): boolean;

  /**
   * Setup trigger (e.g., register webhook, setup cron job)
   */
  setup?(trigger: AgentTrigger): Promise<SetupResult>;

  /**
   * Teardown trigger (e.g., unregister webhook)
   */
  teardown?(trigger: AgentTrigger): Promise<void>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

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

export interface SetupResult {
  success: boolean;
  webhookUrl?: string;
  webhookSecret?: string;
  cronJobId?: string;
  error?: string;
}

// =============================================================================
// EMAIL TRIGGER HANDLER
// =============================================================================

export class EmailTriggerHandler implements TriggerHandler<EmailTriggerConfig> {
  type: TriggerType = 'email_received';

  validateConfig(config: EmailTriggerConfig): ValidationResult {
    const errors: string[] = [];

    if (config.filters?.from) {
      for (const email of config.filters.from) {
        if (!this.isValidEmailPattern(email)) {
          errors.push(`Invalid email pattern: ${email}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async parsePayload(rawData: unknown, _config: EmailTriggerConfig): Promise<TriggerPayload> {
    const email = rawData as EmailPayload;

    return {
      data: {
        from: email.from,
        to: email.to,
        cc: email.cc,
        subject: email.subject,
        body: email.body,
        bodyHtml: email.bodyHtml,
        attachments: email.attachments?.map((a) => ({
          filename: a.filename,
          contentType: a.contentType,
          size: a.size,
        })),
        receivedAt: email.receivedAt,
        messageId: email.messageId,
        threadId: email.threadId,
        labels: email.labels,
      },
      metadata: {
        receivedAt: new Date(),
        source: 'email',
        rawData: email,
      },
    };
  }

  matchesFilters(payload: TriggerPayload, config: EmailTriggerConfig): boolean {
    const { data } = payload;
    const { filters } = config;

    if (!filters) return true;

    // Check from filter
    if (filters.from && filters.from.length > 0) {
      const fromEmail = (data.from as string).toLowerCase();
      const matchesFrom = filters.from.some((pattern) =>
        this.matchesEmailPattern(fromEmail, pattern.toLowerCase())
      );
      if (!matchesFrom) return false;
    }

    // Check subject filter
    if (filters.subject) {
      const subject = (data.subject as string).toLowerCase();
      if (!subject.includes(filters.subject.toLowerCase())) {
        return false;
      }
    }

    // Check attachment filter
    if (filters.hasAttachment !== undefined) {
      const hasAttachments = Array.isArray(data.attachments) && data.attachments.length > 0;
      if (filters.hasAttachment !== hasAttachments) {
        return false;
      }
    }

    // Check labels filter
    if (filters.labels && filters.labels.length > 0) {
      const emailLabels = (data.labels as string[]) || [];
      const matchesLabels = filters.labels.some((label) =>
        emailLabels.map((l) => l.toLowerCase()).includes(label.toLowerCase())
      );
      if (!matchesLabels) return false;
    }

    return true;
  }

  private isValidEmailPattern(pattern: string): boolean {
    // Allow wildcards like *@domain.com
    const emailRegex = /^[\w.*+-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(pattern);
  }

  private matchesEmailPattern(email: string, pattern: string): boolean {
    if (pattern.startsWith('*@')) {
      // Wildcard for any user at domain
      const domain = pattern.slice(2);
      return email.endsWith(`@${domain}`);
    }
    return email === pattern;
  }
}

interface EmailPayload {
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
    content?: string;
  }>;
  receivedAt: string;
  messageId: string;
  threadId?: string;
  labels?: string[];
}

// =============================================================================
// WEBHOOK TRIGGER HANDLER
// =============================================================================

export class WebhookTriggerHandler implements TriggerHandler<WebhookTriggerConfig> {
  type: TriggerType = 'webhook';

  validateConfig(config: WebhookTriggerConfig): ValidationResult {
    const errors: string[] = [];

    if (config.allowedIPs) {
      for (const ip of config.allowedIPs) {
        if (!this.isValidIP(ip)) {
          errors.push(`Invalid IP address: ${ip}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async parsePayload(rawData: unknown, _config: WebhookTriggerConfig): Promise<TriggerPayload> {
    const webhook = rawData as WebhookPayload;

    return {
      data: {
        method: webhook.method,
        headers: webhook.headers,
        body: webhook.body,
        query: webhook.query,
        ip: webhook.ip,
      },
      metadata: {
        receivedAt: new Date(),
        source: 'webhook',
        rawData: webhook,
      },
    };
  }

  matchesFilters(payload: TriggerPayload, config: WebhookTriggerConfig): boolean {
    const { data } = payload;

    // Check allowed IPs
    if (config.allowedIPs && config.allowedIPs.length > 0) {
      const clientIP = data.ip as string;
      if (!config.allowedIPs.includes(clientIP)) {
        return false;
      }
    }

    // Check required headers
    if (config.headers) {
      const requestHeaders = data.headers as Record<string, string>;
      for (const [key, value] of Object.entries(config.headers)) {
        if (requestHeaders[key.toLowerCase()] !== value) {
          return false;
        }
      }
    }

    return true;
  }

  async setup(trigger: AgentTrigger): Promise<SetupResult> {
    // Generate unique webhook URL and secret
    const webhookId = nanoid(12);
    const webhookSecret = nanoid(32);
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/agents/${webhookId}`;

    return {
      success: true,
      webhookUrl,
      webhookSecret,
    };
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: string, signature: string, secret: string): boolean {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  private isValidIP(ip: string): boolean {
    // Basic IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    return ipv4Regex.test(ip);
  }
}

interface WebhookPayload {
  method: string;
  headers: Record<string, string>;
  body: unknown;
  query: Record<string, string>;
  ip: string;
}

// =============================================================================
// SCHEDULE TRIGGER HANDLER
// =============================================================================

export class ScheduleTriggerHandler implements TriggerHandler<ScheduleTriggerConfig> {
  type: TriggerType = 'schedule';

  validateConfig(config: ScheduleTriggerConfig): ValidationResult {
    const errors: string[] = [];

    // Validate cron expression
    if (!this.isValidCron(config.cron)) {
      errors.push(`Invalid cron expression: ${config.cron}`);
    }

    // Validate timezone
    if (!this.isValidTimezone(config.timezone)) {
      errors.push(`Invalid timezone: ${config.timezone}`);
    }

    // Validate date range
    if (config.startDate && config.endDate) {
      const start = new Date(config.startDate);
      const end = new Date(config.endDate);
      if (start >= end) {
        errors.push('Start date must be before end date');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async parsePayload(rawData: unknown, config: ScheduleTriggerConfig): Promise<TriggerPayload> {
    const scheduleData = rawData as SchedulePayload;

    return {
      data: {
        scheduledTime: scheduleData.scheduledTime,
        actualTime: scheduleData.actualTime,
        cron: config.cron,
        timezone: config.timezone,
        runNumber: scheduleData.runNumber,
      },
      metadata: {
        receivedAt: new Date(),
        source: 'schedule',
      },
    };
  }

  matchesFilters(payload: TriggerPayload, config: ScheduleTriggerConfig): boolean {
    const now = new Date();

    // Check date range
    if (config.startDate && new Date(config.startDate) > now) {
      return false;
    }

    if (config.endDate && new Date(config.endDate) < now) {
      return false;
    }

    return true;
  }

  /**
   * Get next scheduled run time
   */
  getNextRun(cron: string, timezone: string): Date {
    // Use a cron parser library in production
    // This is a simplified implementation
    const now = new Date();
    // Add 1 minute as placeholder
    return new Date(now.getTime() + 60000);
  }

  /**
   * Human-readable cron description
   */
  describeCron(cron: string): string {
    const parts = cron.split(' ');
    if (parts.length !== 5) return cron;

    const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;

    // Common patterns
    if (cron === '0 * * * *') return 'Every hour';
    if (cron === '0 0 * * *') return 'Every day at midnight';
    if (cron === '0 9 * * 1-5') return 'Weekdays at 9:00 AM';
    if (cron === '0 9 * * 1') return 'Every Monday at 9:00 AM';

    return `At ${minute} ${hour} (${cron})`;
  }

  private isValidCron(cron: string): boolean {
    const parts = cron.split(' ');
    return parts.length === 5;
  }

  private isValidTimezone(tz: string): boolean {
    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }
}

interface SchedulePayload {
  scheduledTime: string;
  actualTime: string;
  runNumber: number;
}

// =============================================================================
// MANUAL TRIGGER HANDLER
// =============================================================================

export class ManualTriggerHandler implements TriggerHandler<ManualTriggerConfig> {
  type: TriggerType = 'manual';

  validateConfig(config: ManualTriggerConfig): ValidationResult {
    const errors: string[] = [];

    if (config.requiredInputs) {
      for (const input of config.requiredInputs) {
        if (!input.name || input.name.trim() === '') {
          errors.push('Input name cannot be empty');
        }
        if (!['string', 'number', 'boolean', 'json'].includes(input.type)) {
          errors.push(`Invalid input type: ${input.type}`);
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async parsePayload(rawData: unknown, config: ManualTriggerConfig): Promise<TriggerPayload> {
    const inputData = rawData as Record<string, unknown>;

    // Validate required inputs
    const validatedData: Record<string, unknown> = {};

    if (config.requiredInputs) {
      for (const input of config.requiredInputs) {
        const value = inputData[input.name];

        if (input.required && (value === undefined || value === null)) {
          throw new Error(`Required input missing: ${input.name}`);
        }

        if (value !== undefined) {
          validatedData[input.name] = this.coerceValue(value, input.type);
        }
      }
    }

    // Include any additional inputs
    for (const [key, value] of Object.entries(inputData)) {
      if (!(key in validatedData)) {
        validatedData[key] = value;
      }
    }

    return {
      data: validatedData,
      metadata: {
        receivedAt: new Date(),
        source: 'manual',
      },
    };
  }

  matchesFilters(_payload: TriggerPayload, _config: ManualTriggerConfig): boolean {
    // Manual triggers always match
    return true;
  }

  private coerceValue(value: unknown, type: string): unknown {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'json':
        return typeof value === 'string' ? JSON.parse(value) : value;
      default:
        return String(value);
    }
  }
}

// =============================================================================
// CRM EVENT TRIGGER HANDLER
// =============================================================================

export class CRMEventTriggerHandler implements TriggerHandler<CRMEventTriggerConfig> {
  type: TriggerType = 'crm_event';

  validateConfig(config: CRMEventTriggerConfig): ValidationResult {
    const errors: string[] = [];

    if (!['created', 'updated', 'deleted'].includes(config.eventType)) {
      errors.push(`Invalid event type: ${config.eventType}`);
    }

    if (!['contact', 'deal', 'task', 'invoice'].includes(config.entityType)) {
      errors.push(`Invalid entity type: ${config.entityType}`);
    }

    if (!['tripletex', 'fiken'].includes(config.integration)) {
      errors.push(`Invalid integration: ${config.integration}`);
    }

    return { valid: errors.length === 0, errors };
  }

  async parsePayload(rawData: unknown, config: CRMEventTriggerConfig): Promise<TriggerPayload> {
    const crmEvent = rawData as CRMEventPayload;

    return {
      data: {
        eventType: config.eventType,
        entityType: config.entityType,
        integration: config.integration,
        entityId: crmEvent.entityId,
        entity: crmEvent.entity,
        changes: crmEvent.changes,
        previousValues: crmEvent.previousValues,
        userId: crmEvent.userId,
      },
      metadata: {
        receivedAt: new Date(),
        source: `crm_${config.integration}`,
        rawData: crmEvent,
      },
    };
  }

  matchesFilters(payload: TriggerPayload, config: CRMEventTriggerConfig): boolean {
    const { data } = payload;

    // Check event type matches
    if (data.eventType !== config.eventType) {
      return false;
    }

    // Check entity type matches
    if (data.entityType !== config.entityType) {
      return false;
    }

    // Apply custom filters
    if (config.filters) {
      const entity = data.entity as Record<string, unknown>;
      for (const [field, expectedValue] of Object.entries(config.filters)) {
        if (entity[field] !== expectedValue) {
          return false;
        }
      }
    }

    return true;
  }
}

interface CRMEventPayload {
  entityId: string;
  entity: Record<string, unknown>;
  changes?: Record<string, unknown>;
  previousValues?: Record<string, unknown>;
  userId?: string;
}

// =============================================================================
// PAYMENT TRIGGER HANDLER
// =============================================================================

export class PaymentTriggerHandler implements TriggerHandler<PaymentTriggerConfig> {
  type: TriggerType = 'payment_received';

  validateConfig(config: PaymentTriggerConfig): ValidationResult {
    const errors: string[] = [];

    if (!['vipps', 'stripe'].includes(config.provider)) {
      errors.push(`Invalid provider: ${config.provider}`);
    }

    if (config.minAmount !== undefined && config.minAmount < 0) {
      errors.push('Minimum amount cannot be negative');
    }

    return { valid: errors.length === 0, errors };
  }

  async parsePayload(rawData: unknown, config: PaymentTriggerConfig): Promise<TriggerPayload> {
    const payment = rawData as PaymentPayload;

    return {
      data: {
        provider: config.provider,
        transactionId: payment.transactionId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        customerId: payment.customerId,
        customerEmail: payment.customerEmail,
        customerPhone: payment.customerPhone,
        description: payment.description,
        metadata: payment.metadata,
      },
      metadata: {
        receivedAt: new Date(),
        source: `payment_${config.provider}`,
        rawData: payment,
      },
    };
  }

  matchesFilters(payload: TriggerPayload, config: PaymentTriggerConfig): boolean {
    const { data } = payload;

    // Check minimum amount
    if (config.minAmount !== undefined) {
      const amount = data.amount as number;
      if (amount < config.minAmount) {
        return false;
      }
    }

    // Check currency
    if (config.currency) {
      if (data.currency !== config.currency.toUpperCase()) {
        return false;
      }
    }

    return true;
  }
}

interface PaymentPayload {
  transactionId: string;
  amount: number;
  currency: string;
  status: 'completed' | 'pending' | 'failed';
  customerId?: string;
  customerEmail?: string;
  customerPhone?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// TRIGGER REGISTRY
// =============================================================================

/**
 * Registry of all trigger handlers
 */
export class TriggerRegistry {
  private handlers: Map<TriggerType, TriggerHandler> = new Map();

  constructor() {
    // Register built-in handlers
    this.register(new EmailTriggerHandler());
    this.register(new WebhookTriggerHandler());
    this.register(new ScheduleTriggerHandler());
    this.register(new ManualTriggerHandler());
    this.register(new CRMEventTriggerHandler());
    this.register(new PaymentTriggerHandler());
  }

  register(handler: TriggerHandler): void {
    this.handlers.set(handler.type, handler);
  }

  get(type: TriggerType): TriggerHandler | undefined {
    return this.handlers.get(type);
  }

  getAll(): TriggerHandler[] {
    return Array.from(this.handlers.values());
  }

  /**
   * Process an incoming trigger event
   */
  async processTrigger(
    trigger: AgentTrigger,
    rawData: unknown
  ): Promise<TriggerPayload | null> {
    const handler = this.handlers.get(trigger.triggerType);

    if (!handler) {
      throw new Error(`No handler found for trigger type: ${trigger.triggerType}`);
    }

    // Parse the payload
    const payload = await handler.parsePayload(rawData, trigger.config);

    // Check if it matches filters
    if (!handler.matchesFilters(payload, trigger.config)) {
      return null;
    }

    return payload;
  }
}

// Singleton instance
export const triggerRegistry = new TriggerRegistry();
