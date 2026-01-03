-- =====================================================
-- Add AI Shared Context to Profiles
-- =====================================================

-- Add column for storing shared AI context (insights, patterns, etc.)
ALTER TABLE public.mf_profiles 
ADD COLUMN IF NOT EXISTS ai_shared_context JSONB DEFAULT '{"insights": [], "patterns": {}}';

-- Add column for wheel of life scores if it doesn't exist
ALTER TABLE public.mf_profiles 
ADD COLUMN IF NOT EXISTS wheel_of_life_scores JSONB;

-- Add comments
COMMENT ON COLUMN public.mf_profiles.ai_shared_context IS 'Shared context between AI modules: insights, patterns, and cross-module data';
COMMENT ON COLUMN public.mf_profiles.wheel_of_life_scores IS 'Latest wheel of life scores for all areas';
