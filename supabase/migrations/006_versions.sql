-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create presentation_versions table
CREATE TABLE IF NOT EXISTS presentation_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID NOT NULL,
  version_number INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_version UNIQUE(presentation_id, version_number)
);

-- Add index on presentation_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_presentation_versions_presentation_id
  ON presentation_versions(presentation_id);

-- Add index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_presentation_versions_created_at
  ON presentation_versions(created_at DESC);

-- Function to automatically increment version number
CREATE OR REPLACE FUNCTION get_next_version_number(p_presentation_id UUID)
RETURNS INTEGER AS $$
DECLARE
  next_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO next_version
  FROM presentation_versions
  WHERE presentation_id = p_presentation_id;

  RETURN next_version;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old versions (keep last 10)
CREATE OR REPLACE FUNCTION cleanup_old_versions(p_presentation_id UUID)
RETURNS void AS $$
BEGIN
  DELETE FROM presentation_versions
  WHERE presentation_id = p_presentation_id
  AND version_number NOT IN (
    SELECT version_number
    FROM presentation_versions
    WHERE presentation_id = p_presentation_id
    ORDER BY version_number DESC
    LIMIT 10
  );
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE presentation_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of their own presentations
CREATE POLICY "Users can view own presentation versions"
  ON presentation_versions
  FOR SELECT
  USING (
    presentation_id IN (
      SELECT id FROM presentations WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can insert versions for their own presentations
CREATE POLICY "Users can insert own presentation versions"
  ON presentation_versions
  FOR INSERT
  WITH CHECK (
    presentation_id IN (
      SELECT id FROM presentations WHERE user_id = auth.uid()
    )
  );

-- Policy: Users can delete versions of their own presentations
CREATE POLICY "Users can delete own presentation versions"
  ON presentation_versions
  FOR DELETE
  USING (
    presentation_id IN (
      SELECT id FROM presentations WHERE user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON TABLE presentation_versions IS 'Stores historical snapshots of presentations for version control';
COMMENT ON COLUMN presentation_versions.snapshot IS 'Complete JSONB snapshot of presentation state';
COMMENT ON COLUMN presentation_versions.description IS 'User-provided description for manual saves';
