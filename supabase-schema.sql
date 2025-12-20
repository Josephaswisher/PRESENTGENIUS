-- PRESENTGENIUS Supabase Schema
-- Run this in your Supabase SQL Editor

-- Presentations table - stores generated presentations
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  prompt TEXT,
  provider TEXT,
  original_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_presentations_created_at ON presentations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);

-- Prompt history - tracks all prompts for analytics and backup
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  response_preview TEXT,
  provider TEXT,
  tokens_used INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON prompt_history(created_at DESC);

-- Prompt cache - reduces API costs by caching identical prompts
CREATE TABLE IF NOT EXISTS prompt_cache (
  hash TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  provider TEXT NOT NULL,
  hits INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_cache_hits ON prompt_cache(hits DESC);

-- Enable Row Level Security (optional - for multi-user)
-- ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE prompt_cache ENABLE ROW LEVEL SECURITY;

-- Storage bucket for backups (create via Supabase Dashboard)
-- Bucket name: backups
-- Public: false
-- File size limit: 50MB

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for presentations updated_at
DROP TRIGGER IF EXISTS update_presentations_updated_at ON presentations;
CREATE TRIGGER update_presentations_updated_at
    BEFORE UPDATE ON presentations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (for anon key access)
GRANT SELECT, INSERT, UPDATE, DELETE ON presentations TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON prompt_history TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON prompt_cache TO anon;
