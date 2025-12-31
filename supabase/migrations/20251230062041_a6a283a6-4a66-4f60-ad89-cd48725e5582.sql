-- Add LLM configuration columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS llm_provider text DEFAULT 'lovable',
ADD COLUMN IF NOT EXISTS llm_api_key text,
ADD COLUMN IF NOT EXISTS llm_model text;

-- Add comment explaining the columns
COMMENT ON COLUMN public.profiles.llm_provider IS 'LLM provider: lovable, openrouter, openai, anthropic, google';
COMMENT ON COLUMN public.profiles.llm_api_key IS 'Encrypted API key for external LLM provider';
COMMENT ON COLUMN public.profiles.llm_model IS 'Selected model for the LLM provider';