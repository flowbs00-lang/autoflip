CREATE TABLE IF NOT EXISTS plate_case_openings (
  user_id TEXT NOT NULL,
  opening_id TEXT NOT NULL,
  case_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  plate_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'prepared',
  client_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, opening_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS plate_case_openings_user_status_idx
  ON plate_case_openings(user_id, status, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS plate_case_openings_one_prepared_idx
  ON plate_case_openings(user_id) WHERE status = 'prepared';
