/*
 * -------------------------------------------------------
 * Intelli-Agents Schema
 * AI Agent Platform for Norwegian SMBs
 * -------------------------------------------------------
 */

-- =============================================================================
-- ENUMS
-- =============================================================================

-- Agent status
CREATE TYPE public.agent_status AS ENUM (
  'draft',
  'active', 
  'paused',
  'error',
  'archived'
);

-- Trigger types
CREATE TYPE public.trigger_type AS ENUM (
  'email_received',
  'webhook',
  'schedule',
  'manual',
  'form_submission',
  'crm_event',
  'payment_received',
  'chat_message'
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

-- Template categories
CREATE TYPE public.template_category AS ENUM (
  'email',
  'customer_support',
  'sales',
  'data_entry',
  'social_media',
  'finance',
  'hr',
  'custom'
);

-- Integration types
CREATE TYPE public.integration_type AS ENUM (
  'tripletex',
  'fiken',
  'vipps',
  'gmail',
  'outlook',
  'slack',
  'teams',
  'hubspot',
  'twilio'
);

-- =============================================================================
-- AGENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'bot',
  color VARCHAR(20) DEFAULT '#3B82F6',
  
  -- Status
  status public.agent_status DEFAULT 'draft' NOT NULL,
  is_template BOOLEAN DEFAULT FALSE,
  template_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  
  -- Workflow definition (React Flow compatible)
  workflow JSONB NOT NULL DEFAULT '{"nodes": [], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}',
  
  -- Configuration
  config JSONB DEFAULT '{}',
  system_prompt TEXT,
  model_preferences JSONB DEFAULT '{"tier": "balanced", "maxTokens": 1000}',
  
  -- Rate limiting
  max_executions_per_hour INT DEFAULT 100,
  max_executions_per_day INT DEFAULT 1000,
  
  -- Statistics
  total_executions INT DEFAULT 0,
  successful_executions INT DEFAULT 0,
  failed_executions INT DEFAULT 0,
  last_execution_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  published_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT agents_name_length CHECK (char_length(name) >= 1)
);

-- Indexes
CREATE INDEX idx_agents_account_id ON public.agents(account_id);
CREATE INDEX idx_agents_status ON public.agents(status);
CREATE INDEX idx_agents_is_template ON public.agents(is_template);
CREATE INDEX idx_agents_created_at ON public.agents(created_at DESC);

-- =============================================================================
-- AGENT TRIGGERS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_triggers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  
  -- Trigger configuration
  trigger_type public.trigger_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  
  -- Webhook specific
  webhook_url TEXT,
  webhook_secret VARCHAR(255),
  
  -- Statistics
  total_fires INT DEFAULT 0,
  last_fired_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_agent_triggers_agent_id ON public.agent_triggers(agent_id);
CREATE INDEX idx_agent_triggers_type ON public.agent_triggers(trigger_type);
CREATE INDEX idx_agent_triggers_webhook_url ON public.agent_triggers(webhook_url);

-- =============================================================================
-- AGENT EXECUTIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  trigger_id UUID REFERENCES public.agent_triggers(id) ON DELETE SET NULL,
  
  -- Status
  status public.execution_status DEFAULT 'pending' NOT NULL,
  
  -- Data
  trigger_data JSONB DEFAULT '{}',
  output_data JSONB,
  error_message TEXT,
  error_details JSONB,
  
  -- Context (execution state)
  context JSONB DEFAULT '{}',
  variables JSONB DEFAULT '{}',
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  
  -- Usage tracking
  tokens_used INT DEFAULT 0,
  estimated_cost DECIMAL(10, 6) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_agent_executions_agent_id ON public.agent_executions(agent_id);
CREATE INDEX idx_agent_executions_status ON public.agent_executions(status);
CREATE INDEX idx_agent_executions_created_at ON public.agent_executions(created_at DESC);
CREATE INDEX idx_agent_executions_started_at ON public.agent_executions(started_at DESC);

-- =============================================================================
-- EXECUTION STEPS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.execution_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.agent_executions(id) ON DELETE CASCADE,
  
  -- Step info
  node_id VARCHAR(255) NOT NULL,
  step_order INT NOT NULL,
  action_type VARCHAR(50),
  
  -- Status
  status public.execution_status DEFAULT 'pending' NOT NULL,
  
  -- Data
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_execution_steps_execution_id ON public.execution_steps(execution_id);
CREATE INDEX idx_execution_steps_status ON public.execution_steps(status);

-- =============================================================================
-- AGENT TEMPLATES TABLE (Public templates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category public.template_category NOT NULL,
  icon VARCHAR(50) DEFAULT 'bot',
  color VARCHAR(20) DEFAULT '#3B82F6',
  
  -- Workflow template
  workflow JSONB NOT NULL DEFAULT '{"nodes": [], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}',
  config JSONB DEFAULT '{}',
  system_prompt TEXT,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  difficulty VARCHAR(20) DEFAULT 'beginner',
  estimated_setup_minutes INT DEFAULT 15,
  is_norwegian BOOLEAN DEFAULT TRUE,
  supported_integrations TEXT[] DEFAULT '{}',
  
  -- Tracking
  usage_count INT DEFAULT 0,
  display_order INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes
CREATE INDEX idx_agent_templates_category ON public.agent_templates(category);
CREATE INDEX idx_agent_templates_is_featured ON public.agent_templates(is_featured);
CREATE INDEX idx_agent_templates_is_active ON public.agent_templates(is_active);

-- =============================================================================
-- AGENT INTEGRATIONS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.agent_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  
  -- Integration info
  integration_type public.integration_type NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Credentials (encrypted)
  credentials JSONB,
  
  -- Status
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Unique constraint per account
  CONSTRAINT unique_integration_per_account UNIQUE (account_id, integration_type)
);

-- Indexes
CREATE INDEX idx_agent_integrations_account_id ON public.agent_integrations(account_id);
CREATE INDEX idx_agent_integrations_type ON public.agent_integrations(integration_type);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

-- Enable RLS
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_integrations ENABLE ROW LEVEL SECURITY;

-- Agents policies
CREATE POLICY "Users can view agents in their accounts" ON public.agents
  FOR SELECT USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create agents in their accounts" ON public.agents
  FOR INSERT WITH CHECK (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update agents in their accounts" ON public.agents
  FOR UPDATE USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete agents in their accounts" ON public.agents
  FOR DELETE USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

-- Agent triggers policies
CREATE POLICY "Users can manage triggers for their agents" ON public.agent_triggers
  FOR ALL USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE account_id IN (
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- Agent executions policies  
CREATE POLICY "Users can view executions for their agents" ON public.agent_executions
  FOR SELECT USING (
    agent_id IN (
      SELECT id FROM public.agents WHERE account_id IN (
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create executions for their agents" ON public.agent_executions
  FOR INSERT WITH CHECK (
    agent_id IN (
      SELECT id FROM public.agents WHERE account_id IN (
        SELECT account_id FROM public.accounts_memberships
        WHERE user_id = auth.uid()
      )
    )
  );

-- Execution steps policies
CREATE POLICY "Users can view steps for their executions" ON public.execution_steps
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

-- Templates are public read
CREATE POLICY "Anyone can view active templates" ON public.agent_templates
  FOR SELECT USING (is_active = TRUE);

-- Integrations policies
CREATE POLICY "Users can manage integrations in their accounts" ON public.agent_integrations
  FOR ALL USING (
    account_id IN (
      SELECT account_id FROM public.accounts_memberships
      WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- FUNCTIONS
-- =============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_triggers_updated_at
  BEFORE UPDATE ON public.agent_triggers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_templates_updated_at
  BEFORE UPDATE ON public.agent_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agent_integrations_updated_at
  BEFORE UPDATE ON public.agent_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update agent statistics after execution
CREATE OR REPLACE FUNCTION public.update_agent_execution_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.agents
    SET 
      total_executions = total_executions + 1,
      successful_executions = successful_executions + 1,
      last_execution_at = NOW()
    WHERE id = NEW.agent_id;
  ELSIF NEW.status = 'failed' AND (OLD.status IS NULL OR OLD.status != 'failed') THEN
    UPDATE public.agents
    SET 
      total_executions = total_executions + 1,
      failed_executions = failed_executions + 1,
      last_execution_at = NOW()
    WHERE id = NEW.agent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_stats_on_execution
  AFTER INSERT OR UPDATE ON public.agent_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_agent_execution_stats();

-- Update trigger fire stats
CREATE OR REPLACE FUNCTION public.update_trigger_fire_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.trigger_id IS NOT NULL THEN
    UPDATE public.agent_triggers
    SET 
      total_fires = total_fires + 1,
      last_fired_at = NOW()
    WHERE id = NEW.trigger_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trigger_stats_on_execution
  AFTER INSERT ON public.agent_executions
  FOR EACH ROW EXECUTE FUNCTION public.update_trigger_fire_stats();

-- =============================================================================
-- SEED DEFAULT TEMPLATES
-- =============================================================================

INSERT INTO public.agent_templates (
  id, name, description, category, icon, color, workflow, config, system_prompt,
  tags, difficulty, estimated_setup_minutes, is_norwegian, supported_integrations,
  display_order, is_featured, is_active
) VALUES
-- Email Responder
(
  'a1b2c3d4-e5f6-4321-a1b2-c3d4e5f60001',
  'E-post Responder',
  'Automatisk klassifisering og besvarelse av kundehenvendelser på e-post. Tilpasser svar basert på type henvendelse.',
  'email',
  'mail',
  '#3B82F6',
  '{"nodes": [{"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 0}, "data": {"label": "E-post mottatt", "description": "Utløses når en ny e-post mottas", "icon": "mail", "color": "#3B82F6", "triggerType": "email_received"}}], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}',
  '{"retry": {"maxAttempts": 2, "backoffMs": 1000}, "timeoutMs": 60000}',
  'Du er en AI-assistent for kundeservice hos en norsk bedrift. Svar alltid på norsk (bokmål) med mindre kunden skriver på et annet språk. Vær høflig, profesjonell og hjelpsom.',
  ARRAY['e-post', 'kundeservice', 'automatisering', 'AI'],
  'beginner',
  10,
  TRUE,
  ARRAY['gmail', 'outlook'],
  1,
  TRUE,
  TRUE
),
-- Lead Qualification
(
  'a1b2c3d4-e5f6-4321-a1b2-c3d4e5f60002',
  'Lead Kvalifisering',
  'Automatisk kvalifisering og routing av nye leads. Kategoriserer leads basert på AI-analyse og varsler salgsteamet om hot leads.',
  'sales',
  'user-plus',
  '#10B981',
  '{"nodes": [{"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 0}, "data": {"label": "Ny lead mottatt", "icon": "user-plus", "color": "#10B981", "triggerType": "form_submission"}}], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}',
  '{"retry": {"maxAttempts": 2, "backoffMs": 1000}, "timeoutMs": 30000}',
  NULL,
  ARRAY['salg', 'leads', 'automatisering', 'CRM'],
  'beginner',
  15,
  TRUE,
  ARRAY['hubspot', 'tripletex'],
  2,
  TRUE,
  TRUE
),
-- Customer Support
(
  'a1b2c3d4-e5f6-4321-a1b2-c3d4e5f60003',
  'Kundeservice Chatbot',
  'Intelligent chatbot som forstår kundens behov og gir relevante svar. Eskalerer automatisk til menneske når nødvendig.',
  'customer_support',
  'message-circle',
  '#8B5CF6',
  '{"nodes": [{"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 0}, "data": {"label": "Chatmelding mottatt", "icon": "message-circle", "color": "#8B5CF6", "triggerType": "chat_message"}}], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}',
  '{"retry": {"maxAttempts": 1, "backoffMs": 500}, "timeoutMs": 15000}',
  NULL,
  ARRAY['kundeservice', 'chat', 'AI', 'automatisering'],
  'intermediate',
  20,
  TRUE,
  ARRAY[]::TEXT[],
  3,
  TRUE,
  TRUE
),
-- Invoice Data Entry
(
  'a1b2c3d4-e5f6-4321-a1b2-c3d4e5f60004',
  'Faktura Dataregistrering',
  'Automatisk ekstraksjon av data fra fakturaer og lagring i regnskapssystemet. Støtter Tripletex og Fiken.',
  'data_entry',
  'file-text',
  '#F59E0B',
  '{"nodes": [{"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 0}, "data": {"label": "Dokument mottatt", "icon": "file-text", "color": "#F59E0B", "triggerType": "webhook"}}], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}',
  '{"retry": {"maxAttempts": 2, "backoffMs": 2000}, "timeoutMs": 60000}',
  NULL,
  ARRAY['faktura', 'regnskap', 'OCR', 'automatisering', 'Tripletex', 'Fiken'],
  'intermediate',
  25,
  TRUE,
  ARRAY['tripletex', 'fiken'],
  4,
  FALSE,
  TRUE
),
-- Social Media Monitoring
(
  'a1b2c3d4-e5f6-4321-a1b2-c3d4e5f60005',
  'Sosiale Medier Overvåking',
  'Overvåk omtaler av bedriften på sosiale medier. Analyser sentiment og varsle ved negative omtaler.',
  'social_media',
  'at-sign',
  '#1DA1F2',
  '{"nodes": [{"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 0}, "data": {"label": "Ny omtale", "icon": "at-sign", "color": "#1DA1F2", "triggerType": "webhook"}}], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}',
  '{"retry": {"maxAttempts": 1, "backoffMs": 1000}, "timeoutMs": 30000}',
  NULL,
  ARRAY['sosiale medier', 'overvåking', 'sentiment', 'markedsføring'],
  'intermediate',
  20,
  TRUE,
  ARRAY[]::TEXT[],
  5,
  FALSE,
  TRUE
),
-- SDR Agent
(
  'a1b2c3d4-e5f6-4321-a1b2-c3d4e5f60006',
  'SDR Agent',
  'Automatisk salgsutvikling-agent som forskerer leads, skriver personlige e-poster og følger opp prospekter.',
  'sales',
  'briefcase',
  '#EF4444',
  '{"nodes": [{"id": "trigger-1", "type": "trigger", "position": {"x": 250, "y": 0}, "data": {"label": "Manuell kjøring", "icon": "play", "color": "#EF4444", "triggerType": "manual"}}], "edges": [], "viewport": {"x": 0, "y": 0, "zoom": 1}}',
  '{"retry": {"maxAttempts": 3, "backoffMs": 5000}, "timeoutMs": 120000}',
  'Du er en erfaren SDR (Sales Development Representative) for en norsk B2B-bedrift. Din oppgave er å forske på prospekter, finne relevante innfallsvinkler, og skrive personlige, engasjerende e-poster som åpner for dialog.',
  ARRAY['salg', 'SDR', 'outreach', 'personalisering'],
  'advanced',
  30,
  TRUE,
  ARRAY['gmail', 'hubspot'],
  6,
  TRUE,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agents TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_triggers TO authenticated;
GRANT SELECT, INSERT ON public.agent_executions TO authenticated;
GRANT SELECT ON public.execution_steps TO authenticated;
GRANT SELECT ON public.agent_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.agent_integrations TO authenticated;
