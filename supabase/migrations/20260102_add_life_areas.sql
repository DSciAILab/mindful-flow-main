-- =====================================================
-- Add life_area_id to projects table
-- Migration: Link projects to Wheel of Life areas
-- =====================================================

-- 1. Add life_area_id column to mf_projects
ALTER TABLE public.mf_projects
ADD COLUMN IF NOT EXISTS life_area_id TEXT;

COMMENT ON COLUMN public.mf_projects.life_area_id IS 'Link to Wheel of Life area: health, career, finances, relationships, family, social, personal, fun';

-- 2. Create index for filtering by life area
CREATE INDEX IF NOT EXISTS idx_mf_projects_life_area
  ON public.mf_projects(life_area_id);
