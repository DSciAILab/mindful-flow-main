-- Daily Mission Module Tables
-- Created: 2026-01-09

-- Table for daily mission configuration per user
CREATE TABLE IF NOT EXISTS mf_daily_mission_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  max_tasks INTEGER DEFAULT 3 CHECK (max_tasks BETWEEN 1 AND 5),
  show_on_startup BOOLEAN DEFAULT true,
  include_habits BOOLEAN DEFAULT true,
  morning_checkin_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for morning check-ins
CREATE TABLE IF NOT EXISTS mf_morning_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE NOT NULL,
  energy_level INTEGER CHECK (energy_level BETWEEN 1 AND 5),
  mood_level INTEGER CHECK (mood_level BETWEEN 1 AND 5),
  sleep_quality INTEGER CHECK (sleep_quality BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- Enable RLS
ALTER TABLE mf_daily_mission_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE mf_morning_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for daily_mission_config
CREATE POLICY "Users can view own config" ON mf_daily_mission_config
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own config" ON mf_daily_mission_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own config" ON mf_daily_mission_config
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own config" ON mf_daily_mission_config
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for morning_checkins
CREATE POLICY "Users can view own checkins" ON mf_morning_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON mf_morning_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON mf_morning_checkins
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own checkins" ON mf_morning_checkins
  FOR DELETE USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mf_morning_checkins_user_date 
  ON mf_morning_checkins(user_id, checkin_date);

CREATE INDEX IF NOT EXISTS idx_mf_daily_mission_config_user 
  ON mf_daily_mission_config(user_id);

-- Trigger to update updated_at on config changes
CREATE OR REPLACE FUNCTION update_mf_daily_mission_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mf_daily_mission_config_updated_at
  BEFORE UPDATE ON mf_daily_mission_config
  FOR EACH ROW
  EXECUTE FUNCTION update_mf_daily_mission_config_updated_at();
