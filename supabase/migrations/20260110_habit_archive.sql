-- Migration: Habit Archive Feature
-- Allows habits to be archived (completed/paused) while preserving logs
-- Date: 2026-01-10

-- Add archive columns to mf_habits table
ALTER TABLE mf_habits 
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS archive_reason TEXT,
  ADD COLUMN IF NOT EXISTS archive_status VARCHAR(20);

-- Add check constraint for archive_status values
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mf_habits_archive_status_check'
  ) THEN
    ALTER TABLE mf_habits
      ADD CONSTRAINT mf_habits_archive_status_check 
      CHECK (archive_status IS NULL OR archive_status IN ('completed', 'paused', 'cancelled'));
  END IF;
END $$;

-- Create index for filtering archived habits
CREATE INDEX IF NOT EXISTS idx_mf_habits_archived_at ON mf_habits(archived_at);
CREATE INDEX IF NOT EXISTS idx_mf_habits_archive_status ON mf_habits(archive_status);

-- Comments for documentation
COMMENT ON COLUMN mf_habits.archived_at IS 'Timestamp when the habit was archived';
COMMENT ON COLUMN mf_habits.archive_reason IS 'User-provided reason for archiving (e.g., "Goal achieved!", "No longer relevant")';
COMMENT ON COLUMN mf_habits.archive_status IS 'Archive status: completed (goal achieved), paused (might resume), cancelled (abandoned)';
