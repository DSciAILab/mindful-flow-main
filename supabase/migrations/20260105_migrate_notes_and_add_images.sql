-- Add image_urls column for storing multiple image attachments
ALTER TABLE public.mf_notes 
ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Function to migrate existing "Note:" items from capture_items to notes
-- This should be run once to migrate existing data

-- First, let's create a function to extract and migrate notes
CREATE OR REPLACE FUNCTION migrate_notes_from_capture_items()
RETURNS void AS $$
DECLARE
  item RECORD;
  clean_content TEXT;
BEGIN
  -- Loop through all capture items that start with "Note:"
  FOR item IN 
    SELECT id, user_id, content, audio_url, created_at 
    FROM public.mf_capture_items 
    WHERE content LIKE 'Note:%' 
    AND deleted_at IS NULL
    AND processed = false
  LOOP
    -- Clean the content by removing "Note:" prefix
    clean_content := TRIM(REGEXP_REPLACE(item.content, '^Note:\s*', ''));
    
    -- Insert into mf_notes
    INSERT INTO public.mf_notes (
      user_id, 
      title, 
      content, 
      audio_url, 
      area_id, 
      created_at, 
      updated_at
    ) VALUES (
      item.user_id,
      CASE 
        WHEN LENGTH(clean_content) > 50 THEN SUBSTRING(clean_content, 1, 50) || '...'
        ELSE COALESCE(NULLIF(clean_content, ''), 'Nota importada')
      END,
      clean_content,
      item.audio_url,
      'personal',
      item.created_at,
      NOW()
    );
    
    -- Mark the original item as processed (soft delete)
    UPDATE public.mf_capture_items 
    SET processed = true, deleted_at = NOW()
    WHERE id = item.id;
    
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_notes_from_capture_items();

-- Drop the function after use (optional, can keep for debugging)
-- DROP FUNCTION migrate_notes_from_capture_items();
