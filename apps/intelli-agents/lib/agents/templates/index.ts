/**
 * Intelli-Agents Pre-Built Templates
 * Ready-to-use agent templates for Norwegian SMBs
 */

import type { AgentTemplate, Workflow, WorkflowNode, WorkflowEdge } from '../types/index.js';

// =============================================================================
// TEMPLATE: EMAIL RESPONDER AGENT
// =============================================================================

const emailResponderWorkflow: Workflow = {
  nodes: [
    // Trigger: Email received
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 0 },
      data: {
        label: 'E-post mottatt',
        description: 'Utløses når en ny e-post mottas',
        icon: 'mail',
        color: '#3B82F6',
        triggerType: 'email_received',
        triggerConfig: {
          type: 'email_received',
          filters: {},
        },
      },
    },
    // Step 1: Classify the email
    {
      id: 'classify-1',
      type: 'ai_task',
      position: { x: 250, y: 150 },
      data: {
        label: 'Klassifiser e-post',
        description: 'Kategoriser e-posten automatisk',
        icon: 'tags',
        color: '#8B5CF6',
        actionType: 'ai_classify',
        actionConfig: {
          type: 'ai_classify',
          inputField: 'trigger.data.body',
          outputField: 'classification',
          confidence: true,
          categories: [
            {
              name: 'support',
              description: 'Kundeservice henvendelser, spørsmål om produkter eller tjenester',
              examples: ['Hvordan fungerer...', 'Jeg har et problem med...', 'Kan dere hjelpe meg med...'],
            },
            {
              name: 'sales',
              description: 'Forespørsler om priser, tilbud eller kjøp',
              examples: ['Hva koster...', 'Kan jeg få et tilbud på...', 'Vi ønsker å bestille...'],
            },
            {
              name: 'billing',
              description: 'Spørsmål om fakturaer, betalinger eller refusjoner',
              examples: ['Faktura', 'Betaling', 'Refusjon', 'Kreditnota'],
            },
            {
              name: 'complaint',
              description: 'Klager eller negative tilbakemeldinger',
              examples: ['Misfornøyd', 'Klage', 'Dårlig', 'Skuffet'],
            },
            {
              name: 'other',
              description: 'Andre typer henvendelser som ikke passer inn i kategoriene over',
            },
          ],
        },
      },
    },
    // Step 2: Extract contact info
    {
      id: 'extract-1',
      type: 'ai_task',
      position: { x: 250, y: 300 },
      data: {
        label: 'Ekstraher kontaktinfo',
        description: 'Hent ut navn, e-post og telefon fra e-posten',
        icon: 'user',
        color: '#8B5CF6',
        actionType: 'ai_extract',
        actionConfig: {
          type: 'ai_extract',
          inputField: 'trigger.data.body',
          outputField: 'contact',
          fields: [
            { name: 'name', description: 'Avsenders navn', type: 'string' },
            { name: 'company', description: 'Firmanavn hvis nevnt', type: 'string' },
            { name: 'phone', description: 'Telefonnummer', type: 'phone' },
            { name: 'orderNumber', description: 'Ordrenummer eller referanse', type: 'string' },
          ],
        },
      },
    },
    // Step 3: Condition - Is it urgent?
    {
      id: 'condition-1',
      type: 'condition',
      position: { x: 250, y: 450 },
      data: {
        label: 'Er det en klage?',
        description: 'Sjekk om e-posten er en klage som trenger prioritering',
        icon: 'git-branch',
        color: '#F59E0B',
        conditionConfig: {
          type: 'condition',
          conditions: [
            {
              field: 'classification.category',
              operator: 'eq',
              value: 'complaint',
            },
          ],
          trueLabel: 'Ja',
          falseLabel: 'Nei',
        },
      },
    },
    // Step 4a: Generate urgent response
    {
      id: 'respond-urgent',
      type: 'ai_task',
      position: { x: 100, y: 600 },
      data: {
        label: 'Generer prioritert svar',
        description: 'Lag et empatisk svar for klager',
        icon: 'message-square',
        color: '#EF4444',
        actionType: 'ai_respond',
        actionConfig: {
          type: 'ai_respond',
          inputField: 'trigger.data.body',
          outputField: 'response',
          systemPrompt: `Du er en kundeservicemedarbeider som svarer på klager. 
Vær empatisk, ta kundens bekymringer på alvor, og forsikre dem om at du vil løse problemet.
Beklage eventuelle ulemper og gi konkrete neste steg.`,
          tone: 'professional',
          language: 'no',
          maxTokens: 500,
          includeContext: ['contact', 'classification'],
        },
      },
    },
    // Step 4b: Generate standard response
    {
      id: 'respond-standard',
      type: 'ai_task',
      position: { x: 400, y: 600 },
      data: {
        label: 'Generer standard svar',
        description: 'Lag et hjelpsomt svar for vanlige henvendelser',
        icon: 'message-square',
        color: '#10B981',
        actionType: 'ai_respond',
        actionConfig: {
          type: 'ai_respond',
          inputField: 'trigger.data.body',
          outputField: 'response',
          systemPrompt: `Du er en hjelpsom kundeservicemedarbeider.
Gi klare og nyttige svar på kundens spørsmål.
Hold svaret kort og konsist, men vennlig.`,
          tone: 'friendly',
          language: 'no',
          maxTokens: 400,
          includeContext: ['contact', 'classification'],
        },
      },
    },
    // Step 5: Send email
    {
      id: 'send-email',
      type: 'action',
      position: { x: 250, y: 750 },
      data: {
        label: 'Send svar',
        description: 'Send det genererte svaret til kunden',
        icon: 'send',
        color: '#3B82F6',
        actionType: 'send_email',
        actionConfig: {
          type: 'send_email',
          to: '{{trigger.data.from}}',
          subject: 'Re: {{trigger.data.subject}}',
          body: '{{response}}',
          bodyType: 'text',
        },
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'classify-1' },
    { id: 'e2', source: 'classify-1', target: 'extract-1' },
    { id: 'e3', source: 'extract-1', target: 'condition-1' },
    { id: 'e4', source: 'condition-1', target: 'respond-urgent', sourceHandle: 'true', label: 'Ja' },
    { id: 'e5', source: 'condition-1', target: 'respond-standard', sourceHandle: 'false', label: 'Nei' },
    { id: 'e6', source: 'respond-urgent', target: 'send-email' },
    { id: 'e7', source: 'respond-standard', target: 'send-email' },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export const emailResponderTemplate: AgentTemplate = {
  id: 'template-email-responder',
  name: 'E-post Responder',
  description: 'Automatisk klassifisering og besvarelse av kundehenvendelser på e-post. Tilpasser svar basert på type henvendelse.',
  category: 'email',
  icon: 'mail',
  color: '#3B82F6',
  workflow: emailResponderWorkflow,
  config: {
    retry: { maxAttempts: 2, backoffMs: 1000 },
    timeoutMs: 60000,
    logLevel: 'info',
  },
  systemPrompt: `Du er en AI-assistent for kundeservice hos en norsk bedrift.
Svar alltid på norsk (bokmål) med mindre kunden skriver på et annet språk.
Vær høflig, profesjonell og hjelpsom.`,
  tags: ['e-post', 'kundeservice', 'automatisering', 'AI'],
  difficulty: 'beginner',
  estimatedSetupMinutes: 10,
  isNorwegian: true,
  supportedIntegrations: ['gmail', 'outlook'],
  usageCount: 0,
  displayOrder: 1,
  isFeatured: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// TEMPLATE: LEAD QUALIFICATION AGENT
// =============================================================================

const leadQualificationWorkflow: Workflow = {
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 0 },
      data: {
        label: 'Ny lead mottatt',
        description: 'Utløses når et nytt kontaktskjema sendes inn',
        icon: 'user-plus',
        color: '#10B981',
        triggerType: 'form_submission',
        triggerConfig: {
          type: 'form_submission',
          formId: '',
        },
      },
    },
    {
      id: 'extract-1',
      type: 'ai_task',
      position: { x: 250, y: 150 },
      data: {
        label: 'Analyser lead',
        description: 'Ekstraher og analyser lead-informasjon',
        icon: 'search',
        color: '#8B5CF6',
        actionType: 'ai_extract',
        actionConfig: {
          type: 'ai_extract',
          inputField: 'trigger.data',
          outputField: 'leadInfo',
          fields: [
            { name: 'companySize', description: 'Estimert bedriftsstørrelse (liten/medium/stor)', type: 'string' },
            { name: 'industry', description: 'Bransje/industri', type: 'string' },
            { name: 'urgency', description: 'Hvor raskt trenger de løsning (lav/medium/høy)', type: 'string' },
            { name: 'budget', description: 'Indikert budsjett hvis nevnt', type: 'string' },
          ],
        },
      },
    },
    {
      id: 'classify-1',
      type: 'ai_task',
      position: { x: 250, y: 300 },
      data: {
        label: 'Kvalifiser lead',
        description: 'Bestem lead-kvalitet basert på analyse',
        icon: 'star',
        color: '#F59E0B',
        actionType: 'ai_classify',
        actionConfig: {
          type: 'ai_classify',
          inputField: 'trigger.data.message',
          outputField: 'qualification',
          confidence: true,
          categories: [
            {
              name: 'hot',
              description: 'Høy kvalitet lead - klar til kjøp, konkret behov, stort budsjett',
              examples: ['Vi trenger dette nå', 'Har budsjett klart', 'Ønsker demo denne uken'],
            },
            {
              name: 'warm',
              description: 'Medium kvalitet - interessert, men trenger mer informasjon',
              examples: ['Undersøker muligheter', 'Sammenligner løsninger', 'Planlegger for neste år'],
            },
            {
              name: 'cold',
              description: 'Lav kvalitet - bare informasjonsinnhenting, uklar timing',
              examples: ['Bare nysgjerrig', 'Privatkunde', 'Student'],
            },
          ],
        },
      },
    },
    {
      id: 'condition-1',
      type: 'condition',
      position: { x: 250, y: 450 },
      data: {
        label: 'Er lead hot?',
        icon: 'git-branch',
        color: '#F59E0B',
        conditionConfig: {
          type: 'condition',
          conditions: [
            { field: 'qualification.category', operator: 'eq', value: 'hot' },
          ],
        },
      },
    },
    {
      id: 'notify-sales',
      type: 'action',
      position: { x: 100, y: 600 },
      data: {
        label: 'Varsle salgsteam',
        description: 'Send Slack-melding til salgsteam om hot lead',
        icon: 'bell',
        color: '#EF4444',
        actionType: 'slack_message',
        actionConfig: {
          type: 'send_email', // Placeholder - would be slack_message
          to: 'salg@bedrift.no',
          subject: '🔥 HOT LEAD: {{trigger.data.company}}',
          body: `Ny hot lead!\n\nBedrift: {{trigger.data.company}}\nKontakt: {{trigger.data.name}}\nE-post: {{trigger.data.email}}\nTelefon: {{trigger.data.phone}}\n\nMelding: {{trigger.data.message}}\n\nLead score: {{qualification.category}} ({{qualification.confidence}}% sikker)`,
          bodyType: 'text',
        },
      },
    },
    {
      id: 'send-followup',
      type: 'action',
      position: { x: 400, y: 600 },
      data: {
        label: 'Send oppfølging',
        description: 'Send automatisk oppfølgings-e-post',
        icon: 'mail',
        color: '#3B82F6',
        actionType: 'send_email',
        actionConfig: {
          type: 'send_email',
          to: '{{trigger.data.email}}',
          subject: 'Takk for din henvendelse - {{trigger.data.company}}',
          body: `Hei {{trigger.data.name}},\n\nTakk for at du tok kontakt med oss!\n\nVi har mottatt din henvendelse og vil se nærmere på den. En av våre rådgivere vil ta kontakt med deg innen kort tid.\n\nMed vennlig hilsen,\nSalgsteamet`,
          bodyType: 'text',
        },
      },
    },
    {
      id: 'create-task',
      type: 'action',
      position: { x: 250, y: 750 },
      data: {
        label: 'Opprett oppfølgingsoppgave',
        description: 'Lag en oppgave i CRM for oppfølging',
        icon: 'check-square',
        color: '#10B981',
        actionType: 'create_task',
        actionConfig: {
          type: 'create_task',
          title: 'Følg opp lead: {{trigger.data.company}}',
          description: 'Lead kvalifisert som: {{qualification.category}}\n\nKontakt: {{trigger.data.name}}\nE-post: {{trigger.data.email}}',
          priority: 'high',
          dueDate: '+1 day',
        },
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'extract-1' },
    { id: 'e2', source: 'extract-1', target: 'classify-1' },
    { id: 'e3', source: 'classify-1', target: 'condition-1' },
    { id: 'e4', source: 'condition-1', target: 'notify-sales', sourceHandle: 'true' },
    { id: 'e5', source: 'condition-1', target: 'send-followup', sourceHandle: 'false' },
    { id: 'e6', source: 'notify-sales', target: 'create-task' },
    { id: 'e7', source: 'send-followup', target: 'create-task' },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export const leadQualificationTemplate: AgentTemplate = {
  id: 'template-lead-qualification',
  name: 'Lead Kvalifisering',
  description: 'Automatisk kvalifisering og routing av nye leads. Kategoriserer leads basert på AI-analyse og varsler salgsteamet om hot leads.',
  category: 'sales',
  icon: 'user-plus',
  color: '#10B981',
  workflow: leadQualificationWorkflow,
  config: {
    retry: { maxAttempts: 2, backoffMs: 1000 },
    timeoutMs: 30000,
  },
  tags: ['salg', 'leads', 'automatisering', 'CRM'],
  difficulty: 'beginner',
  estimatedSetupMinutes: 15,
  isNorwegian: true,
  supportedIntegrations: ['hubspot', 'tripletex'],
  usageCount: 0,
  displayOrder: 2,
  isFeatured: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// TEMPLATE: CUSTOMER SUPPORT AGENT
// =============================================================================

const customerSupportWorkflow: Workflow = {
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 0 },
      data: {
        label: 'Chatmelding mottatt',
        description: 'Utløses når en kunde sender melding i chatten',
        icon: 'message-circle',
        color: '#8B5CF6',
        triggerType: 'chat_message',
        triggerConfig: {
          type: 'chat_message',
          chatbotId: '',
        },
      },
    },
    {
      id: 'classify-1',
      type: 'ai_task',
      position: { x: 250, y: 150 },
      data: {
        label: 'Forstå intensjon',
        description: 'Analyser kundens intensjon og behov',
        icon: 'brain',
        color: '#8B5CF6',
        actionType: 'ai_classify',
        actionConfig: {
          type: 'ai_classify',
          inputField: 'trigger.data.message',
          outputField: 'intent',
          confidence: true,
          categories: [
            { name: 'product_question', description: 'Spørsmål om produkter eller tjenester' },
            { name: 'order_status', description: 'Spørsmål om ordrestatus eller levering' },
            { name: 'technical_support', description: 'Teknisk hjelp eller feilsøking' },
            { name: 'billing', description: 'Spørsmål om faktura, priser eller betaling' },
            { name: 'returns', description: 'Retur, bytte eller refusjon' },
            { name: 'general', description: 'Generelle spørsmål eller smalltalk' },
            { name: 'escalate', description: 'Behov for menneskelig hjelp' },
          ],
        },
      },
    },
    {
      id: 'condition-escalate',
      type: 'condition',
      position: { x: 250, y: 300 },
      data: {
        label: 'Trenger eskalering?',
        icon: 'alert-circle',
        conditionConfig: {
          type: 'condition',
          conditions: [
            { field: 'intent.category', operator: 'eq', value: 'escalate' },
          ],
        },
      },
    },
    {
      id: 'escalate-action',
      type: 'action',
      position: { x: 50, y: 450 },
      data: {
        label: 'Eskaler til menneske',
        description: 'Overfør samtalen til en kundeservicemedarbeider',
        icon: 'user',
        color: '#EF4444',
        actionType: 'webhook_call',
        actionConfig: {
          type: 'webhook_call',
          url: '{{env.SUPPORT_ESCALATION_URL}}',
          method: 'POST',
          body: '{"conversation_id": "{{trigger.data.conversationId}}", "customer": "{{trigger.data.customer}}", "reason": "customer_request"}',
          bodyType: 'json',
        },
      },
    },
    {
      id: 'respond-1',
      type: 'ai_task',
      position: { x: 400, y: 450 },
      data: {
        label: 'Generer svar',
        description: 'Generer et hjelpsomt svar basert på intensjon',
        icon: 'message-square',
        color: '#10B981',
        actionType: 'ai_respond',
        actionConfig: {
          type: 'ai_respond',
          inputField: 'trigger.data.message',
          outputField: 'response',
          systemPrompt: `Du er en hjelpsom kundeservicemedarbeider for en norsk nettbutikk.

Retningslinjer:
- Svar alltid på norsk
- Vær vennlig og profesjonell
- Hold svarene korte og konsise
- Hvis du ikke vet svaret, si det ærlig og tilby å finne ut mer
- Avslutt alltid med å spørre om det er noe annet du kan hjelpe med

Kundens intensjon er: {{intent.category}}`,
          tone: 'friendly',
          language: 'no',
          maxTokens: 300,
          includeContext: ['intent'],
        },
      },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 250, y: 600 },
      data: {
        label: 'Send svar',
        description: 'Send svaret tilbake til chatten',
        icon: 'send',
        color: '#3B82F6',
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'classify-1' },
    { id: 'e2', source: 'classify-1', target: 'condition-escalate' },
    { id: 'e3', source: 'condition-escalate', target: 'escalate-action', sourceHandle: 'true' },
    { id: 'e4', source: 'condition-escalate', target: 'respond-1', sourceHandle: 'false' },
    { id: 'e5', source: 'escalate-action', target: 'output-1' },
    { id: 'e6', source: 'respond-1', target: 'output-1' },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export const customerSupportTemplate: AgentTemplate = {
  id: 'template-customer-support',
  name: 'Kundeservice Chatbot',
  description: 'Intelligent chatbot som forstår kundens behov og gir relevante svar. Eskalerer automatisk til menneske når nødvendig.',
  category: 'customer_support',
  icon: 'message-circle',
  color: '#8B5CF6',
  workflow: customerSupportWorkflow,
  config: {
    retry: { maxAttempts: 1, backoffMs: 500 },
    timeoutMs: 15000,
  },
  tags: ['kundeservice', 'chat', 'AI', 'automatisering'],
  difficulty: 'intermediate',
  estimatedSetupMinutes: 20,
  isNorwegian: true,
  supportedIntegrations: [],
  usageCount: 0,
  displayOrder: 3,
  isFeatured: true,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// TEMPLATE: DATA ENTRY AGENT
// =============================================================================

const dataEntryWorkflow: Workflow = {
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 0 },
      data: {
        label: 'Dokument mottatt',
        description: 'Utløses når et nytt dokument lastes opp eller mottas',
        icon: 'file-text',
        color: '#F59E0B',
        triggerType: 'webhook',
        triggerConfig: {
          type: 'webhook',
          validatePayload: true,
        },
      },
    },
    {
      id: 'extract-1',
      type: 'ai_task',
      position: { x: 250, y: 150 },
      data: {
        label: 'Ekstraher data',
        description: 'Trekk ut strukturert data fra dokumentet',
        icon: 'file-search',
        color: '#8B5CF6',
        actionType: 'ai_extract',
        actionConfig: {
          type: 'ai_extract',
          inputField: 'trigger.data.content',
          outputField: 'extractedData',
          fields: [
            { name: 'invoiceNumber', description: 'Fakturanummer', type: 'string', required: true },
            { name: 'invoiceDate', description: 'Fakturadato', type: 'date', required: true },
            { name: 'dueDate', description: 'Forfallsdato', type: 'date' },
            { name: 'supplierName', description: 'Leverandørnavn', type: 'string', required: true },
            { name: 'supplierOrgNumber', description: 'Organisasjonsnummer', type: 'string' },
            { name: 'totalAmount', description: 'Totalbeløp inkl. mva', type: 'number', required: true },
            { name: 'vatAmount', description: 'MVA-beløp', type: 'number' },
            { name: 'currency', description: 'Valuta (NOK, EUR, etc)', type: 'string' },
          ],
        },
      },
    },
    {
      id: 'validate-1',
      type: 'condition',
      position: { x: 250, y: 300 },
      data: {
        label: 'Valider data',
        description: 'Sjekk at nødvendige felt er utfylt',
        icon: 'check-circle',
        conditionConfig: {
          type: 'condition',
          conditions: [
            { field: 'extractedData.invoiceNumber', operator: 'exists', value: true },
            { field: 'extractedData.totalAmount', operator: 'gt', value: 0, logicalOperator: 'and' },
          ],
        },
      },
    },
    {
      id: 'sync-tripletex',
      type: 'integration',
      position: { x: 100, y: 450 },
      data: {
        label: 'Lagre i Tripletex',
        description: 'Opprett leverandørfaktura i Tripletex',
        icon: 'database',
        color: '#10B981',
        actionType: 'tripletex_sync',
        actionConfig: {
          type: 'tripletex_sync',
          operation: 'create_invoice',
          data: {
            invoiceNumber: '{{extractedData.invoiceNumber}}',
            date: '{{extractedData.invoiceDate}}',
            dueDate: '{{extractedData.dueDate}}',
            supplier: '{{extractedData.supplierName}}',
            amount: '{{extractedData.totalAmount}}',
            vat: '{{extractedData.vatAmount}}',
          },
        },
      },
    },
    {
      id: 'notify-error',
      type: 'action',
      position: { x: 400, y: 450 },
      data: {
        label: 'Varsle om feil',
        description: 'Send varsel om manglende data',
        icon: 'alert-triangle',
        color: '#EF4444',
        actionType: 'send_email',
        actionConfig: {
          type: 'send_email',
          to: 'regnskap@bedrift.no',
          subject: '⚠️ Faktura trenger manuell behandling',
          body: 'En faktura kunne ikke behandles automatisk pga manglende data.\n\nVennligst sjekk dokumentet manuelt.',
          bodyType: 'text',
        },
      },
    },
    {
      id: 'output-1',
      type: 'output',
      position: { x: 250, y: 600 },
      data: {
        label: 'Ferdig',
        icon: 'check',
        color: '#10B981',
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'extract-1' },
    { id: 'e2', source: 'extract-1', target: 'validate-1' },
    { id: 'e3', source: 'validate-1', target: 'sync-tripletex', sourceHandle: 'true' },
    { id: 'e4', source: 'validate-1', target: 'notify-error', sourceHandle: 'false' },
    { id: 'e5', source: 'sync-tripletex', target: 'output-1' },
    { id: 'e6', source: 'notify-error', target: 'output-1' },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export const dataEntryTemplate: AgentTemplate = {
  id: 'template-data-entry',
  name: 'Faktura Dataregistrering',
  description: 'Automatisk ekstraksjon av data fra fakturaer og lagring i regnskapssystemet. Støtter Tripletex og Fiken.',
  category: 'data_entry',
  icon: 'file-text',
  color: '#F59E0B',
  workflow: dataEntryWorkflow,
  config: {
    retry: { maxAttempts: 2, backoffMs: 2000 },
    timeoutMs: 60000,
  },
  tags: ['faktura', 'regnskap', 'OCR', 'automatisering', 'Tripletex', 'Fiken'],
  difficulty: 'intermediate',
  estimatedSetupMinutes: 25,
  isNorwegian: true,
  supportedIntegrations: ['tripletex', 'fiken'],
  usageCount: 0,
  displayOrder: 4,
  isFeatured: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// TEMPLATE: SOCIAL MEDIA MONITORING AGENT
// =============================================================================

const socialMediaMonitoringWorkflow: Workflow = {
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 250, y: 0 },
      data: {
        label: 'Ny omtale',
        description: 'Utløses når bedriften nevnes på sosiale medier',
        icon: 'at-sign',
        color: '#1DA1F2',
        triggerType: 'webhook',
        triggerConfig: {
          type: 'webhook',
        },
      },
    },
    {
      id: 'analyze-sentiment',
      type: 'ai_task',
      position: { x: 250, y: 150 },
      data: {
        label: 'Analyser sentiment',
        description: 'Bestem om omtalen er positiv, negativ eller nøytral',
        icon: 'heart',
        color: '#8B5CF6',
        actionType: 'ai_classify',
        actionConfig: {
          type: 'ai_classify',
          inputField: 'trigger.data.content',
          outputField: 'sentiment',
          confidence: true,
          categories: [
            { name: 'positive', description: 'Positive omtaler, ros, tilfredshet' },
            { name: 'negative', description: 'Negative omtaler, kritikk, klager' },
            { name: 'neutral', description: 'Nøytrale omtaler, spørsmål, informasjon' },
          ],
        },
      },
    },
    {
      id: 'summarize-1',
      type: 'ai_task',
      position: { x: 250, y: 300 },
      data: {
        label: 'Oppsummer omtale',
        description: 'Lag en kort oppsummering av omtalen',
        icon: 'file-text',
        color: '#8B5CF6',
        actionType: 'ai_summarize',
        actionConfig: {
          type: 'ai_summarize',
          inputField: 'trigger.data.content',
          outputField: 'summary',
          maxLength: 100,
          style: 'tldr',
          language: 'no',
        },
      },
    },
    {
      id: 'condition-negative',
      type: 'condition',
      position: { x: 250, y: 450 },
      data: {
        label: 'Er negativ?',
        icon: 'git-branch',
        conditionConfig: {
          type: 'condition',
          conditions: [
            { field: 'sentiment.category', operator: 'eq', value: 'negative' },
          ],
        },
      },
    },
    {
      id: 'alert-team',
      type: 'action',
      position: { x: 100, y: 600 },
      data: {
        label: 'Varsle team',
        description: 'Send umiddelbart varsel om negativ omtale',
        icon: 'alert-triangle',
        color: '#EF4444',
        actionType: 'send_email',
        actionConfig: {
          type: 'send_email',
          to: 'marked@bedrift.no',
          subject: '🚨 Negativ omtale oppdaget på {{trigger.data.platform}}',
          body: `En negativ omtale er oppdaget:\n\nPlattform: {{trigger.data.platform}}\nBruker: {{trigger.data.author}}\nLink: {{trigger.data.url}}\n\nOppsummering: {{summary}}\n\nSentiment: {{sentiment.category}} ({{sentiment.confidence}}% sikker)`,
          bodyType: 'text',
        },
      },
    },
    {
      id: 'log-mention',
      type: 'action',
      position: { x: 400, y: 600 },
      data: {
        label: 'Logg omtale',
        description: 'Lagre omtalen for rapportering',
        icon: 'database',
        color: '#10B981',
        actionType: 'webhook_call',
        actionConfig: {
          type: 'webhook_call',
          url: '{{env.ANALYTICS_WEBHOOK}}',
          method: 'POST',
          body: '{"platform": "{{trigger.data.platform}}", "sentiment": "{{sentiment.category}}", "summary": "{{summary}}", "url": "{{trigger.data.url}}"}',
          bodyType: 'json',
        },
      },
    },
  ],
  edges: [
    { id: 'e1', source: 'trigger-1', target: 'analyze-sentiment' },
    { id: 'e2', source: 'analyze-sentiment', target: 'summarize-1' },
    { id: 'e3', source: 'summarize-1', target: 'condition-negative' },
    { id: 'e4', source: 'condition-negative', target: 'alert-team', sourceHandle: 'true' },
    { id: 'e5', source: 'condition-negative', target: 'log-mention', sourceHandle: 'false' },
    { id: 'e6', source: 'alert-team', target: 'log-mention' },
  ],
  viewport: { x: 0, y: 0, zoom: 1 },
};

export const socialMediaMonitoringTemplate: AgentTemplate = {
  id: 'template-social-media-monitoring',
  name: 'Sosiale Medier Overvåking',
  description: 'Overvåk omtaler av bedriften på sosiale medier. Analyser sentiment og varsle ved negative omtaler.',
  category: 'social_media',
  icon: 'at-sign',
  color: '#1DA1F2',
  workflow: socialMediaMonitoringWorkflow,
  config: {
    retry: { maxAttempts: 1, backoffMs: 1000 },
    timeoutMs: 30000,
  },
  tags: ['sosiale medier', 'overvåking', 'sentiment', 'markedsføring'],
  difficulty: 'intermediate',
  estimatedSetupMinutes: 20,
  isNorwegian: true,
  supportedIntegrations: [],
  usageCount: 0,
  displayOrder: 5,
  isFeatured: false,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// =============================================================================
// EXPORT ALL TEMPLATES
// =============================================================================

export const allTemplates: AgentTemplate[] = [
  emailResponderTemplate,
  leadQualificationTemplate,
  customerSupportTemplate,
  dataEntryTemplate,
  socialMediaMonitoringTemplate,
];

export function getTemplateById(id: string): AgentTemplate | undefined {
  return allTemplates.find((t) => t.id === id);
}

export function getTemplatesByCategory(category: string): AgentTemplate[] {
  return allTemplates.filter((t) => t.category === category);
}

export function getFeaturedTemplates(): AgentTemplate[] {
  return allTemplates
    .filter((t) => t.isFeatured && t.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
