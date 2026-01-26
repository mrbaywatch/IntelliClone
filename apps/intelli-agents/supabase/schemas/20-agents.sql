-- =============================================================================
-- Intelli-Agents Database Schema
-- AI Automation Platform for Norwegian SMBs
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ENUMS
-- -----------------------------------------------------------------------------

-- Agent status enum
CREATE TYPE public.agent_status AS ENUM (
  'draft',           -- Being built, not active
  'active',          -- Running and processing triggers
  'paused',          -- Temporarily disabled
  'error',           -- Failed, needs attention
  'archived'         -- Soft deleted, not visible by default
);

-- Trigger types
CREATE TYPE public.trigger_type AS ENUM (
  'email_received',    -- Incoming email trigger
  'webhook',           -- HTTP webhook trigger
  'schedule',          -- Cron/scheduled trigger
  'manual',            -- Manually triggered
  'form_submission',   -- Web form submission
  'crm_event',         -- CRM event (Tripletex, Fiken)
  'payment_received',  -- Vipps/payment trigger
  'chat_message'       -- Chatbot message trigger
);

-- Action types
CREATE TYPE public.action_type AS ENUM (
  -- Communication
  'send_email',
  'send_sms',
  'slack_message',
  'teams_message',
  
  -- CRM/Business
  'create_contact',
  'update_contact',
  'create_task',
  'update_task',
  'create_invoice',
  'update_crm_field',
  
  -- AI Actions
  'ai_classify',
  'ai_summarize',
  'ai_extract',
  'ai_respond',
  'ai_translate',
  
  -- Integrations
  'tripletex_sync',
  'fiken_sync',
  'vipps_payment',
  
  -- Control Flow
  'condition',
  'delay',
  'webhook_call',
  'set_variable',
  
  -- Data
  'log_data',
  'store_memory'
);

-- Execution status
CREATE TYPE public.execution_status AS ENUM (
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
  'timeout'
);

-- Node type for workflow builder
CREATE TYPE public.workflow_node_type AS ENUM (
  'trigger',
  'action',
  'condition',
  'delay',
  'ai_task',
  'integration',
  'output'
);

-- -----------------------------------------------------------------------------
-- CORE TABLES
-- -----------------------------------------------------------------------------

-- Agents table - the main automation unit
CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT 'bot',
  color TEXT DEFAULT '#3B82F6',
  
  -- Status and configuration
  status public.agent_status NOT NULL DEFAULT 'draft',
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  template_id UUID REFERENCES public.agents(id),
  
  -- Workflow definition (React Flow compatible)
  workflow JSONB NOT NULL DEFAULT '{
    "nodes": [],
    "edges": [],
    "viewport": {"x": 0, "y": 0, "zoom": 1}
  }'::jsonb,
  
  -- Agent configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- AI Configuration
  system_prompt TEXT,
  model_preferences JSONB DEFAULT '{
    "tier": "balanced",
    "maxTokens": 2048
  }'::jsonb,
  
  -- Limits and quotas
  max_executions_per_hour INTEGER DEFAULT 100,
  max_executions_per_day INTEGER DEFAULT 1000,
  
  -- Statistics
  total_executions INTEGER NOT NULL DEFAULT 0,
  successful_executions INTEGER NOT NULL DEFAULT 0,
  failed_executions INTEGER NOT NULL DEFAULT 0,
  last_execution_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT agents_name_length CHECK (char_length(name) >= 1 AND char_length(name) <= 100)
);

-- Triggers table - what activates an agent
CREATE TABLE IF NOT EXISTS public.agent_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  
  -- Trigger configuration
  trigger_type public.trigger_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Type-specific configuration
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  /*
    Email: { filters: { from, subject, hasAttachment }, mailboxId }
    Webhook: { secret, allowedIPs, headers }
    Schedule: { cron, timezone }
    Manual: { requiredInputs: [] }
    Form: { formId, fields }
    CRM: { eventType, entityType, filters }
    Payment: { minAmount, currency }
  */
  
  -- Webhook-specific
  webhook_url TEXT UNIQUE,
  webhook_secret TEXT,
  
  -- Statistics
  total_fires INTEGER NOT NULL DEFAULT 0,
  last_fired_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Actions library - reusable action definitions
CREATE TABLE IF NOT EXISTS public.agent_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Action definition
  action_type public.action_type NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  
  -- Configuration template
  config_schema JSONB NOT NULL DEFAULT '{}'::jsonb,
  default_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Is this a custom action or built-in?
  is_builtin BOOLEAN NOT NULL DEFAULT FALSE,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Workflow nodes - individual steps in an agent workflow
CREATE TABLE IF NOT EXISTS public.workflow_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  
  -- React Flow compatible fields
  node_id TEXT NOT NULL, -- The ID used in React Flow
  node_type public.workflow_node_type NOT NULL,
  
  -- Position in canvas
  position_x REAL NOT NULL DEFAULT 0,
  position_y REAL NOT NULL DEFAULT 0,
  
  -- Node configuration
  action_type public.action_type,
  trigger_type public.trigger_type,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Display
  label TEXT NOT NULL,
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique node ID per agent
  UNIQUE(agent_id, node_id)
);

-- Workflow edges - connections between nodes
CREATE TABLE IF NOT EXISTS public.workflow_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  
  -- React Flow compatible fields
  edge_id TEXT NOT NULL,
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  
  -- Edge type and configuration
  edge_type TEXT DEFAULT 'default',
  condition JSONB, -- For conditional edges
  label TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique edge ID per agent
  UNIQUE(agent_id, edge_id)
);

-- Agent executions - history of agent runs
CREATE TABLE IF NOT EXISTS public.agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES public.agent_triggers(id),
  
  -- Execution info
  status public.execution_status NOT NULL DEFAULT 'pending',
  
  -- Input/Output
  trigger_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_data JSONB,
  error_message TEXT,
  error_details JSONB,
  
  -- Execution context
  context JSONB NOT NULL DEFAULT '{}'::jsonb,
  variables JSONB NOT NULL DEFAULT '{}'::jsonb,
  
  -- Timing
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Cost tracking
  tokens_used INTEGER DEFAULT 0,
  estimated_cost DECIMAL(10, 6) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Execution steps - individual node executions
CREATE TABLE IF NOT EXISTS public.execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.agent_executions(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  
  -- Step info
  step_order INTEGER NOT NULL,
  action_type public.action_type,
  
  -- Status
  status public.execution_status NOT NULL DEFAULT 'pending',
  
  -- Input/Output
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent templates - pre-built agent configurations
CREATE TABLE IF NOT EXISTS public.agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Template info
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  icon TEXT DEFAULT 'bot',
  color TEXT DEFAULT '#3B82F6',
  
  -- Template content
  workflow JSONB NOT NULL,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  system_prompt TEXT,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  difficulty TEXT DEFAULT 'beginner', -- beginner, intermediate, advanced
  estimated_setup_minutes INTEGER DEFAULT 15,
  
  -- Norwegian specific
  is_norwegian BOOLEAN DEFAULT TRUE,
  supported_integrations TEXT[] DEFAULT '{}',
  
  -- Stats
  usage_count INTEGER NOT NULL DEFAULT 0,
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Agent variables - persistent variables for agents
CREATE TABLE IF NOT EXISTS public.agent_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  
  -- Variable definition
  name TEXT NOT NULL,
  value JSONB,
  is_secret BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Unique variable name per agent
  UNIQUE(agent_id, name)
);

-- Integration connections - connected services
CREATE TABLE IF NOT EXISTS public.agent_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Integration info
  integration_type TEXT NOT NULL, -- 'tripletex', 'fiken', 'vipps', 'gmail', etc.
  name TEXT NOT NULL,
  
  -- Credentials (encrypted)
  credentials JSONB, -- Encrypted in application layer
  
  -- Status
  is_connected BOOLEAN NOT NULL DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- One integration type per account
  UNIQUE(account_id, integration_type)
);

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

CREATE INDEX idx_agents_account_id ON public.agents(account_id);
CREATE INDEX idx_agents_status ON public.agents(status);
CREATE INDEX idx_agents_template ON public.agents(is_template) WHERE is_template = TRUE;

CREATE INDEX idx_agent_triggers_agent_id ON public.agent_triggers(agent_id);
CREATE INDEX idx_agent_triggers_type ON public.agent_triggers(trigger_type);
CREATE INDEX idx_agent_triggers_webhook ON public.agent_triggers(webhook_url) WHERE webhook_url IS NOT NULL;

CREATE INDEX idx_workflow_nodes_agent ON public.workflow_nodes(agent_id);
CREATE INDEX idx_workflow_edges_agent ON public.workflow_edges(agent_id);

CREATE INDEX idx_agent_executions_agent ON public.agent_executions(agent_id);
CREATE INDEX idx_agent_executions_status ON public.agent_executions(status);
CREATE INDEX idx_agent_executions_created ON public.agent_executions(created_at DESC);

CREATE INDEX idx_execution_steps_execution ON public.execution_steps(execution_id);

CREATE INDEX idx_agent_templates_category ON public.agent_templates(category);
CREATE INDEX idx_agent_templates_featured ON public.agent_templates(is_featured) WHERE is_featured = TRUE;

CREATE INDEX idx_agent_integrations_account ON public.agent_integrations(account_id);
CREATE INDEX idx_agent_integrations_type ON public.agent_integrations(integration_type);

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_integrations ENABLE ROW LEVEL SECURITY;

-- Agents RLS policies
CREATE POLICY "Users can view agents in their account" ON public.agents
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create agents in their account" ON public.agents
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agents in their account" ON public.agents
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agents in their account" ON public.agents
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Agent triggers RLS (inherit from agent)
CREATE POLICY "Users can manage triggers for their agents" ON public.agent_triggers
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE account_id IN (
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- Workflow nodes RLS
CREATE POLICY "Users can manage workflow nodes for their agents" ON public.workflow_nodes
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE account_id IN (
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- Workflow edges RLS
CREATE POLICY "Users can manage workflow edges for their agents" ON public.workflow_edges
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE account_id IN (
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- Agent executions RLS
CREATE POLICY "Users can view executions for their agents" ON public.agent_executions
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE account_id IN (
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- Execution steps RLS
CREATE POLICY "Users can view execution steps for their agents" ON public.execution_steps
  FOR SELECT USING (
    execution_id IN (
      SELECT id FROM public.agent_executions WHERE agent_id IN (
        SELECT id FROM public.agents WHERE account_id IN (
          SELECT account_id FROM public.accounts_memberships
          WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Agent templates RLS (public read)
CREATE POLICY "Anyone can view active templates" ON public.agent_templates
  FOR SELECT USING (is_active = TRUE);

-- Agent variables RLS
CREATE POLICY "Users can manage variables for their agents" ON public.agent_variables
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE account_id IN (
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- Agent integrations RLS
CREATE POLICY "Users can manage integrations for their account" ON public.agent_integrations
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Agent actions RLS
CREATE POLICY "Users can view builtin actions" ON public.agent_actions
  FOR SELECT USING (is_builtin = TRUE OR is_public = TRUE);

CREATE POLICY "Users can manage their own actions" ON public.agent_actions
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

-- -----------------------------------------------------------------------------
-- FUNCTIONS
-- -----------------------------------------------------------------------------

-- Update agent statistics after execution
CREATE OR REPLACE FUNCTION public.update_agent_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'failed') AND OLD.status = 'running' THEN
    UPDATE public.agents
    SET 
      total_executions = total_executions + 1,
      successful_executions = CASE WHEN NEW.status = 'completed' 
        THEN successful_executions + 1 
        ELSE successful_executions END,
      failed_executions = CASE WHEN NEW.status = 'failed' 
        THEN failed_executions + 1 
        ELSE failed_executions END,
      last_execution_at = NEW.completed_at,
      updated_at = NOW()
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_agent_stats
  AFTER UPDATE ON public.agent_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_agent_stats();

-- Update trigger statistics when fired
CREATE OR REPLACE FUNCTION public.update_trigger_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trigger_id IS NOT NULL THEN
    UPDATE public.agent_triggers
    SET 
      total_fires = total_fires + 1,
      last_fired_at = NEW.created_at,
      updated_at = NOW()
    WHERE id = NEW.trigger_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_trigger_stats
  AFTER INSERT ON public.agent_executions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trigger_stats();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW
  EXECUTE FUNCTION public.agents_updated_at();

CREATE TRIGGER trigger_agent_triggers_updated_at
  BEFORE UPDATE ON public.agent_triggers
  FOR EACH ROW
  EXECUTE FUNCTION public.agents_updated_at();

CREATE TRIGGER trigger_agent_variables_updated_at
  BEFORE UPDATE ON public.agent_variables
  FOR EACH ROW
  EXECUTE FUNCTION public.agents_updated_at();

CREATE TRIGGER trigger_agent_integrations_updated_at
  BEFORE UPDATE ON public.agent_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.agents_updated_at();
