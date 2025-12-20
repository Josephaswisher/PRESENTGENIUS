-- VibePresenterPro V2 Database Schema
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROJECTS TABLE
-- Stores user's medical education artifacts
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  html_content TEXT NOT NULL,
  original_image TEXT,
  folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
  activity_type TEXT,
  learner_level TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_folder_id ON projects(folder_id);
CREATE INDEX IF NOT EXISTS idx_projects_share_token ON projects(share_token) WHERE share_token IS NOT NULL;

-- ============================================
-- FOLDERS TABLE
-- Organizes projects into collections
-- ============================================
CREATE TABLE IF NOT EXISTS folders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
  color TEXT,
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_folders_user_id ON folders(user_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parent_id);

-- ============================================
-- VERSIONS TABLE
-- Tracks version history for projects
-- ============================================
CREATE TABLE IF NOT EXISTS versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  html_snapshot TEXT NOT NULL,
  change_summary TEXT,
  version_number INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_versions_project_id ON versions(project_id);

-- ============================================
-- SESSIONS TABLE
-- Live polling sessions for presentations
-- ============================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  current_slide INTEGER DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_sessions_code ON sessions(session_code) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);

-- ============================================
-- RESPONSES TABLE
-- Audience responses to poll questions
-- ============================================
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON responses(session_id, question_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;

-- PROJECTS policies
CREATE POLICY "Users can view own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view public projects" ON projects
  FOR SELECT USING (is_public = TRUE);

-- FOLDERS policies
CREATE POLICY "Users can view own folders" ON folders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own folders" ON folders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders" ON folders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders" ON folders
  FOR DELETE USING (auth.uid() = user_id);

-- VERSIONS policies
CREATE POLICY "Users can view versions of own projects" ON versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = versions.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert versions for own projects" ON versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = versions.project_id AND projects.user_id = auth.uid()
    )
  );

-- SESSIONS policies
CREATE POLICY "Users can view own sessions" ON sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON sessions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active sessions by code" ON sessions
  FOR SELECT USING (is_active = TRUE);

-- RESPONSES policies (anyone can submit during active session)
CREATE POLICY "Anyone can insert responses to active sessions" ON responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = responses.session_id AND sessions.is_active = TRUE
    )
  );

CREATE POLICY "Session owners can view responses" ON responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = responses.session_id AND sessions.user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Update updated_at on projects
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER folders_updated_at
  BEFORE UPDATE ON folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- REALTIME
-- ============================================

-- Enable realtime for sessions and responses (for live polling)
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE responses;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE projects IS 'User-created medical education artifacts and presentations';
COMMENT ON TABLE folders IS 'Organization structure for projects';
COMMENT ON TABLE versions IS 'Version history for project rollback';
COMMENT ON TABLE sessions IS 'Live polling sessions for audience interaction';
COMMENT ON TABLE responses IS 'Audience responses to poll questions';
