-- Add audio_url column to notes table
ALTER TABLE public.mf_notes 
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Create storage bucket for audio notes if it doesn't exist
DO $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('audio-notes', 'audio-notes', true)
    ON CONFLICT (id) DO NOTHING;
END $$;

-- Policy for uploading audio
CREATE POLICY "Users can upload their own audio notes"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'audio-notes' AND 
    auth.uid() = owner
);

-- Policy for viewing audio
CREATE POLICY "Users can view their own audio notes"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'audio-notes' AND 
    auth.uid() = owner
);

-- Policy for updating audio
CREATE POLICY "Users can update their own audio notes"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'audio-notes' AND 
    auth.uid() = owner
);

-- Policy for deleting audio
CREATE POLICY "Users can delete their own audio notes"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'audio-notes' AND 
    auth.uid() = owner
);
