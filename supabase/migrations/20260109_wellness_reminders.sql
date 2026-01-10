-- Wellness Reminders Module
-- Gentle self-care reminders for hydration, stretching, eye rest, and posture

-- Table for user wellness configuration
CREATE TABLE IF NOT EXISTS mf_wellness_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  water_enabled BOOLEAN DEFAULT true,
  water_interval_minutes INTEGER DEFAULT 60,
  stretch_enabled BOOLEAN DEFAULT true,
  stretch_interval_minutes INTEGER DEFAULT 90,
  eyes_enabled BOOLEAN DEFAULT true,
  eyes_interval_minutes INTEGER DEFAULT 30,
  posture_enabled BOOLEAN DEFAULT true,
  posture_interval_minutes INTEGER DEFAULT 45,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  show_during_focus BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for logging wellness actions
CREATE TABLE IF NOT EXISTS mf_wellness_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_type VARCHAR(20) NOT NULL, -- water, stretch, eyes, posture, breathe, walk
  action VARCHAR(20) NOT NULL, -- completed, snoozed, dismissed
  logged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for efficient log queries
CREATE INDEX IF NOT EXISTS idx_wellness_logs_user_date 
  ON mf_wellness_logs(user_id, logged_at DESC);

CREATE INDEX IF NOT EXISTS idx_wellness_logs_type 
  ON mf_wellness_logs(user_id, reminder_type, logged_at DESC);

-- Enable Row Level Security
ALTER TABLE mf_wellness_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mf_wellness_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wellness config
CREATE POLICY "Users can view own wellness config" 
  ON mf_wellness_config FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness config" 
  ON mf_wellness_config FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wellness config" 
  ON mf_wellness_config FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness config" 
  ON mf_wellness_config FOR DELETE 
  USING (auth.uid() = user_id);

-- RLS Policies for wellness logs
CREATE POLICY "Users can view own wellness logs" 
  ON mf_wellness_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wellness logs" 
  ON mf_wellness_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wellness logs" 
  ON mf_wellness_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- Trigger for updated_at on config
CREATE OR REPLACE FUNCTION update_mf_wellness_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_mf_wellness_config_updated_at
  BEFORE UPDATE ON mf_wellness_config
  FOR EACH ROW
  EXECUTE FUNCTION update_mf_wellness_config_updated_at();
