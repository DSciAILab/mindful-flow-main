-- Migration: Add Google Calendar sync mapping table
-- This table stores the relationship between local events and Google Calendar events

-- Create sync mapping table
CREATE TABLE IF NOT EXISTS mf_google_calendar_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  local_event_id UUID REFERENCES mf_calendar_events(id) ON DELETE CASCADE NOT NULL,
  google_event_id TEXT NOT NULL,
  google_calendar_id TEXT DEFAULT 'primary',
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'synced' CHECK (sync_status IN ('synced', 'pending', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique mapping per user and local event
  UNIQUE(user_id, local_event_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_sync_user_id ON mf_google_calendar_sync(user_id);
CREATE INDEX IF NOT EXISTS idx_google_sync_local_event ON mf_google_calendar_sync(local_event_id);
CREATE INDEX IF NOT EXISTS idx_google_sync_google_event ON mf_google_calendar_sync(google_event_id);

-- Enable RLS
ALTER TABLE mf_google_calendar_sync ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own sync mappings"
  ON mf_google_calendar_sync
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync mappings"
  ON mf_google_calendar_sync
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync mappings"
  ON mf_google_calendar_sync
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync mappings"
  ON mf_google_calendar_sync
  FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_google_calendar_sync_updated_at
  BEFORE UPDATE ON mf_google_calendar_sync
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
