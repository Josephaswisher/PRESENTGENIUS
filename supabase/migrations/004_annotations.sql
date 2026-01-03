-- Slide Annotations Table Migration
-- Stores drawing annotations for each slide in presentations

-- Create slide_annotations table
CREATE TABLE IF NOT EXISTS slide_annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  presentation_id UUID NOT NULL,
  slide_index INTEGER NOT NULL,
  strokes JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one annotation record per slide per user per presentation
  CONSTRAINT unique_slide_annotation UNIQUE(presentation_id, slide_index, created_by)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_annotations_presentation ON slide_annotations(presentation_id);
CREATE INDEX IF NOT EXISTS idx_annotations_user ON slide_annotations(created_by);
CREATE INDEX IF NOT EXISTS idx_annotations_slide ON slide_annotations(presentation_id, slide_index);

-- Row Level Security (RLS)
ALTER TABLE slide_annotations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own annotations"
  ON slide_annotations FOR SELECT
  USING (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can insert their own annotations"
  ON slide_annotations FOR INSERT
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

CREATE POLICY "Users can update their own annotations"
  ON slide_annotations FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own annotations"
  ON slide_annotations FOR DELETE
  USING (auth.uid() = created_by);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_slide_annotations_updated_at
  BEFORE UPDATE ON slide_annotations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE slide_annotations IS 'Stores drawing annotations for presentation slides';
COMMENT ON COLUMN slide_annotations.presentation_id IS 'ID of the presentation (not FK to allow annotations for any presentation)';
COMMENT ON COLUMN slide_annotations.slide_index IS 'Zero-based index of the slide';
COMMENT ON COLUMN slide_annotations.strokes IS 'JSON array of drawing strokes with tool, color, width, and points';
COMMENT ON COLUMN slide_annotations.created_by IS 'User who created the annotations';
