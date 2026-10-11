PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user_consents (
  user_id TEXT NOT NULL,
  consent_type TEXT NOT NULL,
  document_version TEXT NOT NULL,
  granted_at INTEGER NOT NULL,
  revoked_at INTEGER,
  PRIMARY KEY (user_id, consent_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS user_consents_type_idx
  ON user_consents(consent_type, document_version, revoked_at);
