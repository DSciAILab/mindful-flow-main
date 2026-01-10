-- =====================================================
-- MINDFUL FLOW - Distractions (Parking Lot) Schema
-- Module 4: Quick capture of thoughts during focus sessions
-- =====================================================

-- Distractions table for capturing thoughts during focus
CREATE TABLE IF NOT EXISTS public.mf_distractions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  captured_during_task_id UUID REFERENCES public.mf_tasks(id) ON DELETE SET NULL,
  focus_session_id UUID REFERENCES public.mf_focus_sessions(id) ON DELETE SET NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP WITH TIME ZONE,
  converted_to_task_id UUID REFERENCES public.mf_tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.mf_distractions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own distractions" 
  ON public.mf_distractions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own distractions" 
  ON public.mf_distractions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own distractions" 
  ON public.mf_distractions FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own distractions" 
  ON public.mf_distractions FOR DELETE 
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_mf_distractions_user_id ON public.mf_distractions(user_id);
CREATE INDEX idx_mf_distractions_focus_session ON public.mf_distractions(focus_session_id);
CREATE INDEX idx_mf_distractions_processed ON public.mf_distractions(processed);
CREATE INDEX idx_mf_distractions_created_at ON public.mf_distractions(created_at DESC);

COMMENT ON TABLE public.mf_distractions IS 'Parking Lot: Quick capture of thoughts/distractions during focus sessions';
COMMENT ON COLUMN public.mf_distractions.content IS 'The captured thought or distraction text';
COMMENT ON COLUMN public.mf_distractions.captured_during_task_id IS 'The task user was working on when distraction was captured';
COMMENT ON COLUMN public.mf_distractions.focus_session_id IS 'The focus session during which distraction was captured';
COMMENT ON COLUMN public.mf_distractions.processed IS 'Whether the distraction has been reviewed/processed';
COMMENT ON COLUMN public.mf_distractions.converted_to_task_id IS 'If converted to a task, reference to the new task';
