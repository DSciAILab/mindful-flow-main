-- Migration: Add Big 3 fields to mf_tasks table
-- Date: 2026-01-05
-- Description: Adds support for marking up to 3 tasks as the most important of the day

ALTER TABLE mf_tasks 
ADD COLUMN IF NOT EXISTS is_big3 BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS big3_date DATE;

-- Create index for efficient querying of Big 3 tasks
CREATE INDEX IF NOT EXISTS idx_mf_tasks_big3 ON mf_tasks(user_id, is_big3, big3_date) WHERE is_big3 = TRUE;

COMMENT ON COLUMN mf_tasks.is_big3 IS 'Indicates if this task is one of the Big 3 for the day';
COMMENT ON COLUMN mf_tasks.big3_date IS 'The date when the task was marked as Big 3';
