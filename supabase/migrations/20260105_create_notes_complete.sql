-- ============================================
-- CONSOLIDATED NOTES TABLE MIGRATION
-- Execute this in Supabase SQL Editor
-- ============================================

-- 1. Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 2. Create notes table
CREATE TABLE IF NOT EXISTS public.mf_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  audio_url TEXT,
  image_urls TEXT[] DEFAULT '{}',
  
  -- Associations (optional linking to other entities)
  goal_id UUID,
  project_id UUID,
  habit_id UUID,
  task_id UUID,
  area_id TEXT NOT NULL DEFAULT 'personal',
  
  -- Metadata
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. RLS Policies (drop if exist to avoid errors)
ALTER TABLE public.mf_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notes" ON public.mf_notes;
CREATE POLICY "Users can view their own notes"
  ON public.mf_notes FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own notes" ON public.mf_notes;
CREATE POLICY "Users can create their own notes"
  ON public.mf_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notes" ON public.mf_notes;
CREATE POLICY "Users can update their own notes"
  ON public.mf_notes FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notes" ON public.mf_notes;
CREATE POLICY "Users can delete their own notes"
  ON public.mf_notes FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mf_notes_user_id ON public.mf_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_mf_notes_project_id ON public.mf_notes(project_id);
CREATE INDEX IF NOT EXISTS idx_mf_notes_area_id ON public.mf_notes(area_id);
CREATE INDEX IF NOT EXISTS idx_mf_notes_task_id ON public.mf_notes(task_id);

-- 5. Trigger for updated_at
DROP TRIGGER IF EXISTS update_mf_notes_updated_at ON public.mf_notes;
CREATE TRIGGER update_mf_notes_updated_at
  BEFORE UPDATE ON public.mf_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. Add missing columns if table already exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mf_notes' AND column_name = 'audio_url') THEN
    ALTER TABLE public.mf_notes ADD COLUMN audio_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mf_notes' AND column_name = 'image_urls') THEN
    ALTER TABLE public.mf_notes ADD COLUMN image_urls TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mf_notes' AND column_name = 'task_id') THEN
    ALTER TABLE public.mf_notes ADD COLUMN task_id UUID;
  END IF;
END $$;

-- Done! Notes table is ready.
SELECT 'mf_notes table created/updated successfully!' as status;
