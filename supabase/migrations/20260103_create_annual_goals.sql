-- =====================================================
-- ANNUAL GOALS TABLE
-- Metas anuais integradas com áreas da vida e projetos
-- =====================================================

CREATE TABLE IF NOT EXISTS public.mf_annual_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  area_id TEXT,                    -- Área da vida (health, career, finances, etc.)
  project_id UUID REFERENCES public.mf_projects(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.mf_annual_goals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own annual goals" 
  ON public.mf_annual_goals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own annual goals" 
  ON public.mf_annual_goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own annual goals" 
  ON public.mf_annual_goals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own annual goals" 
  ON public.mf_annual_goals FOR DELETE 
  USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_annual_goals_user_year 
  ON public.mf_annual_goals(user_id, year);

CREATE INDEX IF NOT EXISTS idx_annual_goals_area 
  ON public.mf_annual_goals(area_id);
