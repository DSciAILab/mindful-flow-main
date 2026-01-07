-- Create sketches table for canvas drawings
CREATE TABLE IF NOT EXISTS mf_sketches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Sketch',
  canvas_data TEXT NOT NULL, -- Base64 encoded canvas image
  thumbnail TEXT, -- Small preview image
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE mf_sketches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own sketches"
  ON mf_sketches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sketches"
  ON mf_sketches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sketches"
  ON mf_sketches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sketches"
  ON mf_sketches FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_mf_sketches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mf_sketches_updated_at
  BEFORE UPDATE ON mf_sketches
  FOR EACH ROW
  EXECUTE FUNCTION update_mf_sketches_updated_at();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_mf_sketches_user_id ON mf_sketches(user_id);
CREATE INDEX IF NOT EXISTS idx_mf_sketches_created_at ON mf_sketches(created_at DESC);
