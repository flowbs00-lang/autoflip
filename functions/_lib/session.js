const SESSION_COOKIE = "af_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function parseCookies(request) {
  const result = new Map();
  const raw = request.headers.get("Cookie") || "";

  for (const item of raw.split(";")) {
    const separator = item.indexOf("=");
    if (separator < 1) continue;
    result.set(item.slice(0, separator).trim(), item.slice(separator + 1).trim());
  }

  return result;
}

async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSession(db, userId) {
  const token = base64Url(crypto.getRandomValues(new Uint8Array(32)));
  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + SESSION_TTL_SECONDS;

  await db.prepare(
    "INSERT INTO sessions (token_hash, user_id, created_at, last_seen_at, expires_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(tokenHash, userId, now, now, expiresAt).run();

  return {
    token,
    cookie: `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_TTL_SECONDS}`
  };
}

export async function getSession(db, request) {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (!token || token.length < 40 || token.length > 64) return null;

  const tokenHash = await sha256(token);
  const now = Math.floor(Date.now() / 1000);

  return db.prepare(`
    SELECT
      s.token_hash,
      s.expires_at,
      u.id,
      u.vk_user_id,
      u.nickname,
      u.first_name,
      u.last_name,
      u.avatar_url
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ?
    LIMIT 1
  `).bind(tokenHash, now).first();
}

export async function deleteSession(db, request) {
  const token = parseCookies(request).get(SESSION_COOKIE);
  if (token) {
    await db.prepare("DELETE FROM sessions WHERE token_hash = ?")
      .bind(await sha256(token))
      .run();
  }
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
