-- ============================================
-- Supabase Migration: Complete Data Sync
-- ============================================
-- Description: Adds 10 NEW tables for syncing all user data
-- Run this in: Supabase Dashboard → SQL Editor
-- Note: Existing tables (timer_states, analytics, theme_preferences) are NOT touched
-- This script is safe to run - uses IF NOT EXISTS to avoid conflicts

-- ============================================
-- 1. Todo Items Table
-- ============================================
CREATE TABLE IF NOT EXISTS todo_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  text TEXT NOT NULL CHECK (char_length(text) <= 160),
  completed BOOLEAN NOT NULL DEFAULT false,
  tag_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, item_id)
);

CREATE INDEX IF NOT EXISTS idx_todo_items_user_id ON todo_items(user_id);
CREATE INDEX IF NOT EXISTS idx_todo_items_updated_at ON todo_items(user_id, updated_at DESC);

-- ============================================
-- 2. Notes Table
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  note_id TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 12000),
  tag_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, note_id)
);

CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(user_id, updated_at DESC);

-- ============================================
-- 3. Timer Tags Table
-- ============================================
CREATE TABLE IF NOT EXISTS timer_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) <= 20),
  color_id TEXT NOT NULL,
  system_flag BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag_id)
);

CREATE INDEX IF NOT EXISTS idx_timer_tags_user_id ON timer_tags(user_id);

-- ============================================
-- 4. Active Timer Tag Table
-- ============================================
CREATE TABLE IF NOT EXISTS active_timer_tag (
  user_id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 5. Session Logs Table
-- ============================================
CREATE TABLE IF NOT EXISTS session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  tag_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_session_logs_user_id ON session_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_session_logs_start_time ON session_logs(user_id, start_time DESC);

-- ============================================
-- 6. Custom Presets Table
-- ============================================
CREATE TABLE IF NOT EXISTS custom_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  preset_id TEXT NOT NULL,
  label TEXT NOT NULL CHECK (char_length(label) <= 18),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, preset_id)
);

CREATE INDEX IF NOT EXISTS idx_custom_presets_user_id ON custom_presets(user_id);

-- ============================================
-- 7. Keyboard Shortcuts Table
-- ============================================
CREATE TABLE IF NOT EXISTS keyboard_shortcuts (
  user_id TEXT PRIMARY KEY,
  config_json JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 8. Weekly Goals Table
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_goals (
  user_id TEXT PRIMARY KEY,
  goal_hours INTEGER NOT NULL CHECK (goal_hours > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 9. Disposable Mode Table
-- ============================================
CREATE TABLE IF NOT EXISTS disposable_mode (
  user_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 10. Focus Lock Preferences Table
-- ============================================
CREATE TABLE IF NOT EXISTS focus_lock_preferences (
  user_id TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  auto_activate BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE todo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE timer_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_timer_tag ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyboard_shortcuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE disposable_mode ENABLE ROW LEVEL SECURITY;
ALTER TABLE focus_lock_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Create RLS Policies (Allow all for now)
-- ============================================
CREATE POLICY "Allow all operations" ON todo_items FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON notes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON timer_tags FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON active_timer_tag FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON session_logs FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON custom_presets FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON keyboard_shortcuts FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON weekly_goals FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON disposable_mode FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON focus_lock_preferences FOR ALL USING (true);

-- ============================================
-- Migration Complete!
-- ============================================
-- Next steps:
-- 1. Verify all 10 tables created successfully
-- 2. Check indexes are in place
-- 3. Deploy updated app.js with sync logic
-- 4. Test data sync in browser console
