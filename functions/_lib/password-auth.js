import { RequestError } from "./http.js";

const PASSWORD_ITERATIONS = 210_000;
const RECOVERY_ITERATIONS = 80_000;
const USERNAME_PATTERN = /^(?=.{3,20}$)[\p{L}\p{N}]+(?:_[\p{L}\p{N}]+)*$/u;
const RESERVED = new Set(["admin", "administrator", "autoflip", "moderator", "support", "system"]);
const RECOVERY_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function fromBase64Url(value) {
  const normalized = String(value).replaceAll("-", "+").replaceAll("_", "/");
  const binary = atob(normalized + "=".repeat((4 - normalized.length % 4) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function randomBytes(length) {
  return crypto.getRandomValues(new Uint8Array(length));
}

async function derive(secret, salt, iterations) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations },
    key,
    256
  );
  return new Uint8Array(bits);
}

function equalBytes(left, right) {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left[index] ^ right[index];
  return difference === 0;
}

async function createSecret(secret, iterations) {
  const salt = randomBytes(16);
  return {
    hash: base64Url(await derive(secret, salt, iterations)),
    salt: base64Url(salt),
    iterations
  };
}

async function verifySecret(secret, hash, salt, iterations) {
  if (!secret || !hash || !salt || !iterations) return false;
  const actual = await derive(secret, fromBase64Url(salt), Number(iterations));
  return equalBytes(actual, fromBase64Url(hash));
}

export function normalizeUsername(value) {
  const display = typeof value === "string" ? value.normalize("NFKC").trim() : "";
  if (!USERNAME_PATTERN.test(display)) throw new RequestError("invalid_username");
  const normalized = display.toLocaleLowerCase("ru-RU");
  if (RESERVED.has(normalized)) throw new RequestError("username_reserved", 409);
  return { display, normalized };
}

export function validatePassword(value) {
  const password = typeof value === "string" ? value : "";
  if (password.length < 10 || password.length > 128) throw new RequestError("invalid_password");
  return password;
}

export function normalizeRecoveryCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z2-9]/gu, "");
}

export function generateRecoveryCode() {
  const bytes = randomBytes(20);
  let raw = "";
  for (const byte of bytes) raw += RECOVERY_ALPHABET[byte % RECOVERY_ALPHABET.length];
  return `AFR-${raw.match(/.{1,5}/gu).join("-")}`;
}

export async function ensurePasswordAuthSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS auth_credentials (
      user_id TEXT PRIMARY KEY,
      username TEXT COLLATE NOCASE UNIQUE,
      password_hash TEXT,
      password_salt TEXT,
      password_iterations INTEGER,
      recovery_hash TEXT NOT NULL,
      recovery_salt TEXT NOT NULL,
      recovery_iterations INTEGER NOT NULL,
      account_type TEXT NOT NULL DEFAULT 'password',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS auth_credentials_username_idx ON auth_credentials(username)")
  ]);
}

export async function buildCredentialValues({ username = null, password = null, accountType = "password" }) {
  const recoveryCode = generateRecoveryCode();
  const recovery = await createSecret(normalizeRecoveryCode(recoveryCode), RECOVERY_ITERATIONS);
  const passwordSecret = password ? await createSecret(validatePassword(password), PASSWORD_ITERATIONS) : null;
  const resolvedUsername = username == null ? null : normalizeUsername(username).normalized;
  return { recoveryCode, recovery, password: passwordSecret, username: resolvedUsername, accountType };
}

export async function insertCredentials(db, userId, values) {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(`INSERT INTO auth_credentials (
    user_id, username, password_hash, password_salt, password_iterations,
    recovery_hash, recovery_salt, recovery_iterations, account_type, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(
      userId,
      values.username,
      values.password?.hash || null,
      values.password?.salt || null,
      values.password?.iterations || null,
      values.recovery.hash,
      values.recovery.salt,
      values.recovery.iterations,
      values.accountType,
      now,
      now
    ).run();
}

export async function replaceCredentials(db, userId, values) {
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(`INSERT INTO auth_credentials (
    user_id, username, password_hash, password_salt, password_iterations,
    recovery_hash, recovery_salt, recovery_iterations, account_type, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'password', ?, ?)
  ON CONFLICT(user_id) DO UPDATE SET
    username = excluded.username,
    password_hash = excluded.password_hash,
    password_salt = excluded.password_salt,
    password_iterations = excluded.password_iterations,
    recovery_hash = excluded.recovery_hash,
    recovery_salt = excluded.recovery_salt,
    recovery_iterations = excluded.recovery_iterations,
    account_type = 'password',
    updated_at = excluded.updated_at`)
    .bind(
      userId,
      values.username,
      values.password.hash,
      values.password.salt,
      values.password.iterations,
      values.recovery.hash,
      values.recovery.salt,
      values.recovery.iterations,
      now,
      now
    ).run();
}

export async function findCredentialsByUsername(db, username) {
  let normalized;
  try { normalized = normalizeUsername(username).normalized; } catch { normalized = "invalid-user"; }
  return db.prepare(`SELECT c.*, u.nickname FROM auth_credentials c
    JOIN users u ON u.id = c.user_id WHERE c.username = ? LIMIT 1`)
    .bind(normalized).first();
}

export async function verifyPassword(row, password) {
  const candidate = typeof password === "string" ? password : "";
  if (!row) {
    await derive(candidate || "invalid-password", new Uint8Array(16), PASSWORD_ITERATIONS);
    return false;
  }
  return verifySecret(candidate, row.password_hash, row.password_salt, row.password_iterations);
}

export async function verifyRecoveryCode(row, code) {
  return verifySecret(
    normalizeRecoveryCode(code),
    row?.recovery_hash,
    row?.recovery_salt,
    row?.recovery_iterations
  );
}
