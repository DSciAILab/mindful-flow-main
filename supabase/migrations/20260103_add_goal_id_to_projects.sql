-- =====================================================
-- ADD GOAL_ID TO PROJECTS
-- Permite vincular projetos a metas anuais
-- =====================================================

ALTER TABLE public.mf_projects
ADD COLUMN IF NOT EXISTS goal_id UUID REFERENCES public.mf_annual_goals(id) ON DELETE SET NULL;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_projects_goal 
  ON public.mf_projects(goal_id);
