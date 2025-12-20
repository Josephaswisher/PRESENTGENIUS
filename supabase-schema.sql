-- ============================================================
-- PRESENTGENIUS Enhanced Supabase Schema v2.0
-- By Dr. Joey Swisher
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ============================================================
-- CORE TABLES
-- ============================================================

-- Presentations table - stores generated presentations
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  prompt TEXT,
  provider TEXT,
  activity_type TEXT,
  learner_level TEXT,
  duration_minutes INT,
  slide_count INT,
  original_image TEXT,
  research_context TEXT,
  tags TEXT[],
  is_public BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_created_at ON presentations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentations_updated_at ON presentations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_presentations_public ON presentations(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS idx_presentations_view_count ON presentations(view_count DESC);

-- Canvas Documents - for interactive canvas mode
CREATE TABLE IF NOT EXISTS canvas_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  target_audience TEXT DEFAULT 'Medical Residents',
  duration INT DEFAULT 30,
  outline_json JSONB NOT NULL DEFAULT '[]',
  research_json JSONB,
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'researching', 'outlining', 'generating', 'complete')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_canvas_user_id ON canvas_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_canvas_updated_at ON canvas_documents(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_canvas_status ON canvas_documents(status);

-- ============================================================
-- CACHING TABLES (reduce API costs)
-- ============================================================

-- Prompt cache - caches AI responses
CREATE TABLE IF NOT EXISTS prompt_cache (
  hash TEXT PRIMARY KEY,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  provider TEXT NOT NULL,
  hits INT DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_cache_provider ON prompt_cache(provider);
CREATE INDEX IF NOT EXISTS idx_prompt_cache_hits ON prompt_cache(hits DESC);

-- Research cache - caches Perplexity/UpToDate/MKSAP results
CREATE TABLE IF NOT EXISTS research_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash TEXT UNIQUE NOT NULL,
  query TEXT NOT NULL,
  provider TEXT NOT NULL,
  result_json JSONB NOT NULL,
  citations_json JSONB,
  hits INT DEFAULT 1,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_cache_hash ON research_cache(query_hash);
CREATE INDEX IF NOT EXISTS idx_research_cache_expires ON research_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_research_cache_provider ON research_cache(provider);

-- ============================================================
-- ANALYTICS & HISTORY
-- ============================================================

-- Prompt history - tracks all prompts for analytics
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  presentation_id UUID REFERENCES presentations(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  response_preview TEXT,
  provider TEXT,
  tokens_used INT,
  duration_ms INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON prompt_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_history_provider ON prompt_history(provider);

-- Analytics events - tracks user behavior
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_created_at ON analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_session ON analytics(session_id);

-- ============================================================
-- USER PREFERENCES
-- ============================================================

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_provider TEXT DEFAULT 'auto',
  default_learner_level TEXT DEFAULT 'PGY1',
  default_duration INT DEFAULT 30,
  theme TEXT DEFAULT 'dark',
  auto_save BOOLEAN DEFAULT TRUE,
  research_sources TEXT[] DEFAULT ARRAY['perplexity'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_presentations_updated_at ON presentations;
CREATE TRIGGER update_presentations_updated_at
    BEFORE UPDATE ON presentations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_canvas_updated_at ON canvas_documents;
CREATE TRIGGER update_canvas_updated_at
    BEFORE UPDATE ON canvas_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_prefs_updated_at ON user_preferences;
CREATE TRIGGER update_user_prefs_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS void AS $$
BEGIN
    DELETE FROM research_cache WHERE expires_at < NOW();
END;
$$ language 'plpgsql';

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE canvas_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Presentations: Users can CRUD their own, read public
CREATE POLICY "Users can view own presentations" ON presentations
    FOR SELECT USING (auth.uid() = user_id OR is_public = TRUE);
CREATE POLICY "Users can insert own presentations" ON presentations
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can update own presentations" ON presentations
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own presentations" ON presentations
    FOR DELETE USING (auth.uid() = user_id);

-- Canvas: Users can CRUD their own
CREATE POLICY "Users can manage own canvas" ON canvas_documents
    FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);

-- Prompt History: Users can view own
CREATE POLICY "Users can view own history" ON prompt_history
    FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can insert history" ON prompt_history
    FOR INSERT WITH CHECK (TRUE);

-- Analytics: Users can insert, admins can read
CREATE POLICY "Anyone can insert analytics" ON analytics
    FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can view own analytics" ON analytics
    FOR SELECT USING (auth.uid() = user_id);

-- User Preferences: Users can manage own
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Caches: Public access (anon can read/write)
ALTER TABLE prompt_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public cache access" ON prompt_cache FOR ALL USING (TRUE);
CREATE POLICY "Public research cache access" ON research_cache FOR ALL USING (TRUE);

-- ============================================================
-- STORAGE BUCKETS (create via Supabase Dashboard)
-- ============================================================
-- 1. backups - Private, 50MB limit, for HTML backups
-- 2. exports - Private, 100MB limit, for PDF/PPTX exports  
-- 3. images - Public, 10MB limit, for presentation images

-- ============================================================
-- REALTIME (enable via Supabase Dashboard)
-- ============================================================
-- Enable realtime for: presentations, canvas_documents

-- ============================================================
-- SCHEDULED JOBS (pg_cron extension required)
-- ============================================================
-- Clean expired cache daily at 3 AM UTC
-- SELECT cron.schedule('clean-cache', '0 3 * * *', 'SELECT clean_expired_cache()');

-- ============================================================
-- GRANTS
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
