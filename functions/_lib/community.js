const COMMUNITY_CITIES = Object.freeze([
  "Москва", "Санкт-Петербург", "Нижний Новгород", "Екатеринбург", "Киров",
  "Краснодар", "Пермь", "Калининград", "Сургут", "Чита", "Казань",
  "Владивосток", "Ярославль", "Ростов", "Махачкала", "Уфа", "Воронеж",
  "Оренбург", "Тверь", "Самара"
]);

let schemaReady = false;

export function communityCities() {
  return [...COMMUNITY_CITIES];
}

export function validCommunityCity(value) {
  return COMMUNITY_CITIES.includes(String(value || ""));
}

export async function ensureCommunitySchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS community_profiles (
      user_id TEXT PRIMARY KEY,
      reputation INTEGER NOT NULL DEFAULT 0,
      city TEXT NOT NULL DEFAULT 'Москва',
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS clans (
      id TEXT PRIMARY KEY,
      name TEXT COLLATE NOCASE NOT NULL UNIQUE,
      tag TEXT COLLATE NOCASE NOT NULL UNIQUE,
      owner_user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS clan_members (
      user_id TEXT PRIMARY KEY,
      clan_id TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (clan_id) REFERENCES clans(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      channel TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS community_messages_channel_idx ON community_messages(channel, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS clan_members_clan_idx ON clan_members(clan_id)")
  ]);
  const columns = await db.prepare("PRAGMA table_info(clan_members)").all();
  if (!(columns.results || []).some((column) => column.name === "role")) {
    await db.prepare("ALTER TABLE clan_members ADD COLUMN role TEXT NOT NULL DEFAULT 'member'").run();
  }
  await db.prepare(`CREATE TRIGGER IF NOT EXISTS clan_members_limit
    BEFORE INSERT ON clan_members
    WHEN (SELECT COUNT(*) FROM clan_members WHERE clan_id = NEW.clan_id) >= 50
    BEGIN SELECT RAISE(ABORT, 'clan_full'); END`).run();
  schemaReady = true;
}

export async function syncCommunityProfile(db, userId, reputation, city) {
  await ensureCommunitySchema(db);
  const safeReputation = Math.max(0, Math.min(1_000_000, Math.floor(Number(reputation) || 0)));
  const safeCity = validCommunityCity(city) ? String(city) : "Москва";
  await db.prepare(`
    INSERT INTO community_profiles (user_id, reputation, city, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      reputation = excluded.reputation,
      city = excluded.city,
      updated_at = excluded.updated_at
  `).bind(userId, safeReputation, safeCity, Date.now()).run();
}
