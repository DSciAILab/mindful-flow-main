-- Drop existing table if it exists
DROP TABLE IF EXISTS public.notes CASCADE;

-- Create the table
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  project TEXT,
  hashtags TEXT[],
  is_archived BOOLEAN DEFAULT false,
  embedding VECTOR(1536), -- Assuming 1536 dimensions for Gemini embeddings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  app_id UUID NOT NULL DEFAULT '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6'::uuid -- Ensure app_id is not null and has a default
);

-- Enable RLS
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "notes_select_policy" ON public.notes;
DROP POLICY IF EXISTS "notes_insert_policy" ON public.notes;
DROP POLICY IF EXISTS "notes_update_policy" ON public.notes;
DROP POLICY IF EXISTS "notes_delete_policy" ON public.notes;

-- Create policies for each operation
CREATE POLICY "notes_select_policy" ON public.notes 
FOR SELECT TO authenticated USING ((auth.uid() = user_id) AND (app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6'::uuid));

CREATE POLICY "notes_insert_policy" ON public.notes 
FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id) AND (app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6'::uuid));

CREATE POLICY "notes_update_policy" ON public.notes 
FOR UPDATE TO authenticated USING ((auth.uid() = user_id) AND (app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6'::uuid));

CREATE POLICY "notes_delete_policy" ON public.notes 
FOR DELETE TO authenticated USING ((auth.uid() = user_id) AND (app_id = '3051c619-0e6d-4dcb-8874-8a4ef30bbbf6'::uuid));

-- Create a trigger to update the 'updated_at' column automatically
CREATE TRIGGER handle_updated_at
BEFORE UPDATE ON public.notes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();