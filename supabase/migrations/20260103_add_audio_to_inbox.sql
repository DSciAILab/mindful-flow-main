-- Add audio_url column to capture items table
ALTER TABLE public.mf_capture_items 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- No new policies needed if we reuse the audio-notes bucket (which has RLS for auth users)
-- But we might want to ensure the bucket usage is clear. 
-- The existing policies on 'audio-notes' allow authenticated users to upload/view their own files.
-- This applies to files uploaded from QuickCapture as well.
