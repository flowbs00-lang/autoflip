PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS game_save_backups (
  user_id TEXT NOT NULL,
  revision INTEGER NOT NULL,
  data_json TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, revision),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS game_save_backups_user_idx
  ON game_save_backups(user_id, revision DESC);
