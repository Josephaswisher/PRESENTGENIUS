-- PresentGenius Supabase Database Schema
-- Run this in your Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Presentations table
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  html TEXT NOT NULL,
  prompt TEXT,
  provider TEXT,
  original_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt history table
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response_preview TEXT,
  provider TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_presentations_user_id ON presentations(user_id);
CREATE INDEX IF NOT EXISTS idx_presentations_created_at ON presentations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompt_history_presentation_id ON prompt_history(presentation_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_created_at ON prompt_history(created_at DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;

-- Presentations policies
CREATE POLICY "Users can view their own presentations"
  ON presentations FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own presentations"
  ON presentations FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own presentations"
  ON presentations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own presentations"
  ON presentations FOR DELETE
  USING (auth.uid() = user_id);

-- Prompt history policies
CREATE POLICY "Users can view prompt history for their presentations"
  ON prompt_history FOR SELECT
  USING (
    presentation_id IN (
      SELECT id FROM presentations WHERE user_id = auth.uid()
    )
    OR presentation_id IS NULL
  );

CREATE POLICY "Users can insert prompt history"
  ON prompt_history FOR INSERT
  WITH CHECK (true);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_presentations_updated_at
  BEFORE UPDATE ON presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE presentations IS 'Stores generated medical presentations';
COMMENT ON TABLE prompt_history IS 'Tracks all prompts and AI generation history';
COMMENT ON COLUMN presentations.provider IS 'AI provider used (openrouter, gemini, etc)';
COMMENT ON COLUMN presentations.original_image IS 'Base64 encoded preview image';

-- --------------------------------------------------------------------------
-- Q&A System for Real-time Collaboration
-- --------------------------------------------------------------------------

-- Create qa_questions table
CREATE TABLE IF NOT EXISTS qa_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  question TEXT NOT NULL,
  asker_name TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  is_answered BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_qa_questions_session_id ON qa_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_qa_questions_created_at ON qa_questions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qa_questions_upvotes ON qa_questions(upvotes DESC);
CREATE INDEX IF NOT EXISTS idx_qa_questions_answered ON qa_questions(is_answered);

-- Enable Row Level Security
ALTER TABLE qa_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Allow anyone to read questions for public sessions
CREATE POLICY "Anyone can view questions"
  ON qa_questions FOR SELECT
  USING (true);

-- Allow anyone to insert questions (for audience participation)
CREATE POLICY "Anyone can submit questions"
  ON qa_questions FOR INSERT
  WITH CHECK (true);

-- Allow anyone to update upvotes and answered status
CREATE POLICY "Anyone can update questions"
  ON qa_questions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow deletion of questions
CREATE POLICY "Anyone can delete questions"
  ON qa_questions FOR DELETE
  USING (true);

-- Comments for Q&A documentation
COMMENT ON TABLE qa_questions IS 'Stores Q&A questions for live presentation sessions';
COMMENT ON COLUMN qa_questions.session_id IS 'Session code that this question belongs to';
COMMENT ON COLUMN qa_questions.question IS 'The question text submitted by audience';
COMMENT ON COLUMN qa_questions.asker_name IS 'Name or identifier of person asking';
COMMENT ON COLUMN qa_questions.upvotes IS 'Number of upvotes from audience members';
COMMENT ON COLUMN qa_questions.is_answered IS 'Whether presenter has addressed this question';
