import { RequestError } from "./http.js";

const COMMUNITY_CITIES = Object.freeze([
  "Москва", "Санкт-Петербург", "Нижний Новгород", "Екатеринбург", "Киров",
  "Краснодар", "Пермь", "Калининград", "Сургут", "Чита", "Казань",
  "Владивосток", "Ярославль", "Ростов", "Махачкала", "Уфа", "Воронеж",
  "Оренбург", "Тверь", "Самара"
]);

let schemaReady = false;

const FORBIDDEN_WORDS = Object.freeze([
  "пидор", "пидорас", "хохол", "чурка", "ниггер", "нацист", "докс", "доксим",
  "скам", "мошенник", "казино", "ставки", "наркотики", "наркота"
]);

const LINK_PATTERN = /(?:https?:\/\/|www\.|t\.me\/|vk\.com\/|discord\.gg\/|[a-z0-9-]+\.(?:ru|com|net|org|io|gg|me)(?:\b|\/))/iu;

const PROFANITY_PATTERNS = Object.freeze([
  /^(?:бля$|бляд|блят)/u,
  /^(?:(?:о|а|на|за|по|вы|про|до|при)?ху(?:й|я|е|ё|и)|хуйн|хули)/u,
  /^(?:пизд|пезд)/u,
  /^(?:еб|ёб|заеб|заёб|наеб|наёб|поеб|поёб|подъеб|подъёб|уеб|уёб|выеб|выёб|доеб|доёб|проеб|проёб|перееб|переёб|отъеб|отъёб|съеб|съёб)/u,
  /^(?:сука|суки|суку|суке|сукой|сучар|сучк)/u,
  /^(?:мудак|мудил|долбо|долба|гандон|гондон|залуп|дроч|жоп|шлюх|мраз|говн|пидор|пидар)/u
]);

const PROFANITY_LOOKALIKES = Object.freeze({
  a: "а", b: "б", c: "с", e: "е", k: "к", m: "м", o: "о", p: "р", t: "т", x: "х",
  "0": "о", "3": "з", "6": "б"
});

function profanityKey(value) {
  return String(value || "")
    .normalize("NFKC")
    .toLocaleLowerCase("ru-RU")
    .replace(/[abcekmoptx036]/gu, (char) => PROFANITY_LOOKALIKES[char] || char)
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function maskCommunityProfanity(value) {
  return String(value == null ? "" : value).replace(/[\p{L}\p{N}]+(?:[.*_~+-][\p{L}\p{N}]+)*/gu, (token) => {
    const key = profanityKey(token);
    return PROFANITY_PATTERNS.some((pattern) => pattern.test(key)) ? "*".repeat([...token].length) : token;
  });
}

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
  const messageColumns = await db.prepare("PRAGMA table_info(community_messages)").all();
  if (!(messageColumns.results || []).some((column) => column.name === "deleted_at")) {
    await db.prepare("ALTER TABLE community_messages ADD COLUMN deleted_at INTEGER").run();
  }
  if (!(messageColumns.results || []).some((column) => column.name === "deleted_by")) {
    await db.prepare("ALTER TABLE community_messages ADD COLUMN deleted_by TEXT").run();
  }
  if (!(messageColumns.results || []).some((column) => column.name === "delete_reason")) {
    await db.prepare("ALTER TABLE community_messages ADD COLUMN delete_reason TEXT").run();
  }
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS community_reports (
      id TEXT PRIMARY KEY, message_id INTEGER NOT NULL, reporter_user_id TEXT NOT NULL,
      reported_user_id TEXT NOT NULL, reason TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open',
      created_at INTEGER NOT NULL, reviewed_at INTEGER, reviewed_by TEXT, resolution TEXT,
      FOREIGN KEY (message_id) REFERENCES community_messages(id) ON DELETE CASCADE,
      FOREIGN KEY (reporter_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (reported_user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS community_report_unique_idx ON community_reports(message_id, reporter_user_id)"),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_blocks (
      blocker_user_id TEXT NOT NULL, blocked_user_id TEXT NOT NULL, created_at INTEGER NOT NULL,
      PRIMARY KEY (blocker_user_id, blocked_user_id),
      FOREIGN KEY (blocker_user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_bans (
      user_id TEXT PRIMARY KEY, reason TEXT NOT NULL, expires_at INTEGER, created_at INTEGER NOT NULL,
      created_by TEXT NOT NULL, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_moderation_log (
      id TEXT PRIMARY KEY, admin_user_id TEXT NOT NULL, target_user_id TEXT, message_id INTEGER,
      action TEXT NOT NULL, reason TEXT NOT NULL DEFAULT '', created_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS community_maintenance (
      task TEXT PRIMARY KEY, completed_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS community_reports_status_idx ON community_reports(status, created_at DESC)")
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

export function validateCommunityMessage(value) {
  const message = String(value || "").normalize("NFKC").trim().replace(/\s+/gu, " ");
  if (!message || message.length > 400) throw new RequestError("invalid_message");
  if (LINK_PATTERN.test(message)) throw new RequestError("message_links_forbidden");
  const normalized = message.toLocaleLowerCase("ru-RU").replace(/[0@]/gu, "о").replace(/3/gu, "з");
  if (FORBIDDEN_WORDS.some((word) => normalized.includes(word))) throw new RequestError("message_forbidden_content");
  return message;
}

export async function activeCommunityBan(db, userId) {
  const now = Date.now();
  await db.prepare("DELETE FROM community_bans WHERE expires_at IS NOT NULL AND expires_at <= ?").bind(now).run();
  return db.prepare("SELECT reason, expires_at AS expiresAt FROM community_bans WHERE user_id = ? LIMIT 1").bind(userId).first();
}

export async function runCommunityMaintenance(db) {
  const row = await db.prepare("SELECT completed_at FROM community_maintenance WHERE task = 'message_cleanup' LIMIT 1").first();
  const now = Date.now();
  if (row && now - Number(row.completed_at || 0) < 6 * 60 * 60_000) return;
  await db.prepare("INSERT INTO community_maintenance (task, completed_at) VALUES ('message_cleanup', ?) ON CONFLICT(task) DO UPDATE SET completed_at = excluded.completed_at").bind(now).run();
  await db.prepare("DELETE FROM community_messages WHERE created_at < ?").bind(now - 90 * 24 * 60 * 60_000).run();
  await db.prepare("DELETE FROM community_moderation_log WHERE created_at < ?").bind(now - 365 * 24 * 60 * 60_000).run();
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
