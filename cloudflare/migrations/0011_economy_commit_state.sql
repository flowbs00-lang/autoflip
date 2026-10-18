ALTER TABLE economy_transactions ADD COLUMN status TEXT NOT NULL DEFAULT 'prepared';
ALTER TABLE economy_transactions ADD COLUMN client_id TEXT NOT NULL DEFAULT '';
ALTER TABLE economy_transactions ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;

UPDATE economy_transactions
SET status = 'committed', updated_at = created_at
WHERE status = 'prepared' AND client_id = '';

CREATE INDEX IF NOT EXISTS economy_transactions_user_status_idx
  ON economy_transactions(user_id, status, updated_at DESC);
