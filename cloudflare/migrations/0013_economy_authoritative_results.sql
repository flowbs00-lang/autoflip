ALTER TABLE economy_transactions ADD COLUMN result_json TEXT NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS economy_transactions_user_status_idx
  ON economy_transactions(user_id, status, updated_at DESC);
