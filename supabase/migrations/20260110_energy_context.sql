-- Migration: Energy and Context System for Tasks
-- Module 5: Sistema de Energia e Contexto
-- Date: 2026-01-10

-- Add energy and context columns to mf_tasks table
ALTER TABLE mf_tasks 
  ADD COLUMN IF NOT EXISTS energy_required VARCHAR(10) DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS contexts TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_required_minutes INTEGER;

-- Add check constraint for energy_required values
ALTER TABLE mf_tasks
  ADD CONSTRAINT mf_tasks_energy_required_check 
  CHECK (energy_required IN ('low', 'medium', 'high'));

-- Create index for filtering by energy
CREATE INDEX IF NOT EXISTS idx_mf_tasks_energy_required 
  ON mf_tasks(energy_required);

-- Create GIN index for contexts array search
CREATE INDEX IF NOT EXISTS idx_mf_tasks_contexts 
  ON mf_tasks USING GIN(contexts);

-- Comments for documentation
COMMENT ON COLUMN mf_tasks.energy_required IS 'Energy level required: low, medium, high';
COMMENT ON COLUMN mf_tasks.contexts IS 'Contexts where task can be done: @home, @work, @phone, @computer, @errands, @anywhere';
COMMENT ON COLUMN mf_tasks.time_required_minutes IS 'Minimum time required to complete the task';
