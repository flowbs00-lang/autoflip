PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS economy_transactions (
  user_id TEXT NOT NULL,
  transaction_id TEXT NOT NULL,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  payload_json TEXT NOT NULL DEFAULT '{}',
  created_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, transaction_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS economy_transactions_user_created_idx
  ON economy_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS economy_transactions_user_type_idx
  ON economy_transactions(user_id, type, created_at DESC);
