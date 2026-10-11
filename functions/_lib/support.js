let schemaReady = false;

export async function ensureSupportSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY, user_id TEXT NOT NULL, category TEXT NOT NULL, subject TEXT NOT NULL,
      message TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL, reviewed_by TEXT, response TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS support_tickets_status_idx ON support_tickets(status, created_at ASC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS support_tickets_user_idx ON support_tickets(user_id, created_at DESC)")
  ]);
  schemaReady = true;
}
