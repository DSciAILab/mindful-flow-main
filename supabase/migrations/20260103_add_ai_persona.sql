-- =====================================================
-- Add AI Persona Configuration to Profiles
-- =====================================================

-- Add column for storing the AI persona configuration (JSON format)
ALTER TABLE public.mf_profiles 
ADD COLUMN IF NOT EXISTS ai_persona_config JSONB;

-- Add comment explaining the column
COMMENT ON COLUMN public.mf_profiles.ai_persona_config IS 'JSON configuration for the AI agent persona, including identity, principles, and behavior settings';
