ALTER TABLE community_messages ADD COLUMN deleted_at INTEGER;
ALTER TABLE community_messages ADD COLUMN deleted_by TEXT;
ALTER TABLE community_messages ADD COLUMN delete_reason TEXT;

CREATE TABLE IF NOT EXISTS community_reports (
  id TEXT PRIMARY KEY, message_id INTEGER NOT NULL, reporter_user_id TEXT NOT NULL,
  reported_user_id TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
  created_at INTEGER NOT NULL, reviewed_at INTEGER, reviewed_by TEXT, resolution TEXT,
  FOREIGN KEY (message_id) REFERENCES community_messages(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS community_report_unique_idx ON community_reports(message_id, reporter_user_id);
CREATE INDEX IF NOT EXISTS community_reports_status_idx ON community_reports(status, created_at DESC);
CREATE TABLE IF NOT EXISTS community_blocks (
  blocker_user_id TEXT NOT NULL, blocked_user_id TEXT NOT NULL, created_at INTEGER NOT NULL,
  PRIMARY KEY (blocker_user_id, blocked_user_id),
  FOREIGN KEY (blocker_user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS community_bans (
  user_id TEXT PRIMARY KEY, reason TEXT NOT NULL, expires_at INTEGER, created_at INTEGER NOT NULL,
  created_by TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS community_moderation_log (
  id TEXT PRIMARY KEY, admin_user_id TEXT NOT NULL, target_user_id TEXT, message_id INTEGER,
  action TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS community_maintenance (task TEXT PRIMARY KEY, completed_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS store_refund_requests (
  id TEXT PRIMARY KEY, order_id TEXT NOT NULL UNIQUE, user_id TEXT NOT NULL, reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
  reviewed_by TEXT, review_note TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (order_id) REFERENCES store_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS store_refunds_status_idx ON store_refund_requests(status, created_at DESC);
CREATE TABLE IF NOT EXISTS support_tickets (
  id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT NOT NULL, subject TEXT NOT NULL,
  message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL, reviewed_by TEXT, response TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status, created_at ASC);
CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON support_tickets(user_id, created_at DESC);

UPDATE users SET first_name = '', last_name = '', avatar_url = '';
