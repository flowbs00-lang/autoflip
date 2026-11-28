PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS auth_credentials (
  user_id TEXT PRIMARY KEY,
  username TEXT COLLATE NOCASE UNIQUE,
  password_hash TEXT,
  password_salt TEXT,
  password_iterations INTEGER,
  recovery_hash TEXT NOT NULL,
  recovery_salt TEXT NOT NULL,
  recovery_iterations INTEGER NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'password',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS auth_credentials_username_idx ON auth_credentials(username);
