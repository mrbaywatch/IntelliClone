-- User Library: Files and documents that give Erik context
-- Created: 2026-02-03

CREATE TABLE IF NOT EXISTS public.user_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('about_me', 'business', 'reference', 'general')),
  file_type TEXT, -- 'pdf', 'txt', 'docx', 'image', etc.
  file_url TEXT, -- Supabase storage URL
  file_size INTEGER, -- Size in bytes
  content_text TEXT, -- Extracted text content for context injection
  summary TEXT, -- AI-generated summary
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_user_library_user_id ON public.user_library(user_id);
CREATE INDEX IF NOT EXISTS idx_user_library_category ON public.user_library(user_id, category);

-- RLS Policies
ALTER TABLE public.user_library ENABLE ROW LEVEL SECURITY;

-- Users can only see their own library items
CREATE POLICY "Users can view own library" ON public.user_library
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own library" ON public.user_library
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own library" ON public.user_library
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own library" ON public.user_library
  FOR DELETE USING (auth.uid() = user_id);

-- Storage bucket for library files
INSERT INTO storage.buckets (id, name, public)
VALUES ('library', 'library', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'library' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view own files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'library' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'library' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_library_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_library_updated_at
  BEFORE UPDATE ON public.user_library
  FOR EACH ROW
  EXECUTE FUNCTION update_library_updated_at();
