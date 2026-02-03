-- Pareto Projects table
-- Each user has their own isolated projects
CREATE TABLE IF NOT EXISTS pareto_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pareto Documents (metadata only, files stored separately)
CREATE TABLE IF NOT EXISTS pareto_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pareto_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pareto Chat Messages
CREATE TABLE IF NOT EXISTS pareto_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES pareto_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  files JSONB, -- [{name, type}]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pareto_projects_user ON pareto_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_pareto_documents_project ON pareto_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_pareto_messages_project ON pareto_messages(project_id);

-- Row Level Security (RLS) - CRITICAL for data isolation
ALTER TABLE pareto_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE pareto_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pareto_messages ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view own projects" ON pareto_projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" ON pareto_projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON pareto_projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON pareto_projects
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own documents
CREATE POLICY "Users can view own documents" ON pareto_documents
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own documents" ON pareto_documents
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON pareto_documents
  FOR DELETE USING (auth.uid() = user_id);

-- Users can only see their own messages
CREATE POLICY "Users can view own messages" ON pareto_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own messages" ON pareto_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER pareto_projects_updated_at
  BEFORE UPDATE ON pareto_projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
