CREATE TABLE IF NOT EXISTS retention_maintenance_runs (
  id TEXT PRIMARY KEY,
  scheduled_at INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  status TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  error TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS retention_maintenance_runs_started_idx
  ON retention_maintenance_runs(started_at DESC);
