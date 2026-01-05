-- ============================================
-- FIX EXISTING mf_notes TABLE
-- Run this in Supabase SQL Editor
-- ============================================

-- Add missing columns to existing mf_notes table
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS area_id TEXT DEFAULT 'personal';
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS task_id UUID;
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS project_id UUID;
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS goal_id UUID;
ALTER TABLE public.mf_notes ADD COLUMN IF NOT EXISTS habit_id UUID;

-- Update any NULL area_id to default
UPDATE public.mf_notes SET area_id = 'personal' WHERE area_id IS NULL;

-- Make area_id NOT NULL
ALTER TABLE public.mf_notes ALTER COLUMN area_id SET NOT NULL;

-- Confirm changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'mf_notes' 
ORDER BY ordinal_position;
