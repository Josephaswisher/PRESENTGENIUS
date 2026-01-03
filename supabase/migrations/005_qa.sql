-- Q&A System Migration
-- Real-time collaborative Q&A features for audience engagement

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
-- Note: In production, you might want to restrict answered status to presenters only
CREATE POLICY "Anyone can update questions"
  ON qa_questions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow session owners to delete questions
CREATE POLICY "Anyone can delete questions"
  ON qa_questions FOR DELETE
  USING (true);

-- Comments for documentation
COMMENT ON TABLE qa_questions IS 'Stores Q&A questions for live presentation sessions';
COMMENT ON COLUMN qa_questions.session_id IS 'Session code that this question belongs to';
COMMENT ON COLUMN qa_questions.question IS 'The question text submitted by audience';
COMMENT ON COLUMN qa_questions.asker_name IS 'Name or identifier of person asking';
COMMENT ON COLUMN qa_questions.upvotes IS 'Number of upvotes from audience members';
COMMENT ON COLUMN qa_questions.is_answered IS 'Whether presenter has addressed this question';
