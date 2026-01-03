-- Create notes table
CREATE TABLE IF NOT EXISTS public.mf_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT, -- Rich text content
  
  -- Associations (optional linking to other entities)
  goal_id UUID REFERENCES public.mf_annual_goals(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.mf_projects(id) ON DELETE SET NULL,
  habit_id UUID REFERENCES public.mf_habits(id) ON DELETE SET NULL,
  area_id TEXT NOT NULL, -- Life Area ID
  
  -- Metadata
  is_pinned BOOLEAN DEFAULT false,
  is_favorite BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.mf_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notes"
  ON public.mf_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own notes"
  ON public.mf_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.mf_notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.mf_notes FOR DELETE
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_mf_notes_user_id ON public.mf_notes(user_id);
CREATE INDEX idx_mf_notes_project_id ON public.mf_notes(project_id);
CREATE INDEX idx_mf_notes_area_id ON public.mf_notes(area_id);

-- Trigger for updated_at
CREATE TRIGGER update_mf_notes_updated_at
  BEFORE UPDATE ON public.mf_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
