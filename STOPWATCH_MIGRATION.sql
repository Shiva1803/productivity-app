-- Stopwatch Feature Migration
-- Add tables for stopwatch timer state, presets, and active tag

-- 1. Stopwatch States Table
CREATE TABLE IF NOT EXISTS stopwatch_states (
  user_id TEXT PRIMARY KEY,
  total_seconds INTEGER NOT NULL DEFAULT 0,
  paused BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Stopwatch Custom Presets Table
CREATE TABLE IF NOT EXISTS stopwatch_custom_presets (
  user_id TEXT NOT NULL,
  presets JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id)
);

-- 3. Active Stopwatch Tag Table
CREATE TABLE IF NOT EXISTS active_stopwatch_tag (
  user_id TEXT PRIMARY KEY,
  tag_id TEXT NOT NULL DEFAULT 'tag-untagged',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_stopwatch_states_updated ON stopwatch_states(updated_at);
CREATE INDEX IF NOT EXISTS idx_stopwatch_presets_updated ON stopwatch_custom_presets(updated_at);
CREATE INDEX IF NOT EXISTS idx_active_stopwatch_tag_updated ON active_stopwatch_tag(updated_at);

-- Row Level Security (RLS) - Allow all operations for now
ALTER TABLE stopwatch_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE stopwatch_custom_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_stopwatch_tag ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on stopwatch_states" ON stopwatch_states FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on stopwatch_custom_presets" ON stopwatch_custom_presets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on active_stopwatch_tag" ON active_stopwatch_tag FOR ALL USING (true) WITH CHECK (true);
