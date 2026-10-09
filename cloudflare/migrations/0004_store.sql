PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS store_orders (
  id TEXT PRIMARY KEY,
  client_token TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  amount_rub INTEGER NOT NULL,
  custom_payload TEXT NOT NULL DEFAULT '{}',
  yookassa_payment_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'creating',
  created_at INTEGER NOT NULL,
  paid_at INTEGER,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS store_orders_user_idx ON store_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS store_orders_payment_idx ON store_orders(yookassa_payment_id);
