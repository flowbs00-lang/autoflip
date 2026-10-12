CREATE TABLE IF NOT EXISTS security_rate_windows (
  subject TEXT NOT NULL,
  bucket TEXT NOT NULL,
  window_start INTEGER NOT NULL,
  count INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (subject, bucket)
);

CREATE TABLE IF NOT EXISTS security_blocks (
  subject TEXT PRIMARY KEY,
  subject_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  last_event_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS security_events (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  subject_type TEXT NOT NULL,
  user_id TEXT,
  category TEXT NOT NULL,
  route TEXT NOT NULL,
  method TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS security_maintenance (
  task TEXT PRIMARY KEY,
  completed_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS security_events_created_idx ON security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS security_events_user_idx ON security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS security_blocks_expiry_idx ON security_blocks(expires_at);
