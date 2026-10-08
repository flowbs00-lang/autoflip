PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS community_profiles (
  user_id TEXT PRIMARY KEY,
  reputation INTEGER NOT NULL DEFAULT 0,
  city TEXT NOT NULL DEFAULT 'Москва',
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clans (
  id TEXT PRIMARY KEY,
  name TEXT COLLATE NOCASE NOT NULL UNIQUE,
  tag TEXT COLLATE NOCASE NOT NULL UNIQUE,
  owner_user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS clan_members (
  user_id TEXT PRIMARY KEY,
  clan_id TEXT NOT NULL,
  joined_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS community_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  channel TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS community_messages_channel_idx ON community_messages(channel, created_at DESC);
CREATE INDEX IF NOT EXISTS clan_members_clan_idx ON clan_members(clan_id);
