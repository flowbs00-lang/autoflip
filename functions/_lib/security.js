import { isAdminUser } from "./admin.js";
import { json } from "./http.js";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const EVENT_RETENTION = 30 * DAY;
const WINDOW_RETENTION = 7 * DAY;
const SECURITY_PEPPER_FALLBACK = "autoflip-security-v1";

let schemaReady = false;

export async function ensureSecuritySchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS security_rate_windows (
      subject TEXT NOT NULL,
      bucket TEXT NOT NULL,
      window_start INTEGER NOT NULL,
      count INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (subject, bucket)
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS security_blocks (
      subject TEXT PRIMARY KEY,
      subject_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      last_event_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS security_events (
      id TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      subject_type TEXT NOT NULL,
      user_id TEXT,
      category TEXT NOT NULL,
      route TEXT NOT NULL,
      method TEXT NOT NULL,
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL
    )`),
    db.prepare(`CREATE TABLE IF NOT EXISTS security_maintenance (
      task TEXT PRIMARY KEY,
      completed_at INTEGER NOT NULL
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS security_events_created_idx ON security_events(created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS security_events_user_idx ON security_events(user_id, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS security_blocks_expiry_idx ON security_blocks(expires_at)")
  ]);
  schemaReady = true;
}

function hex(bytes) {
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function ipSubject(request, env, now) {
  const ip = String(request.headers.get("CF-Connecting-IP") || "").trim();
  if (!ip) return null;
  const day = Math.floor(now / DAY);
  const secret = String(env.SECURITY_HASH_SECRET || SECURITY_PEPPER_FALLBACK);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${secret}\n${day}\n${ip}`));
  return `ip:${hex(digest)}`;
}

function accountSubject(session) {
  return session?.id ? `account:${session.id}` : null;
}

async function requestAction(request, path) {
  if (request.method !== "POST" || !["/api/community", "/api/support", "/api/store/refunds"].includes(path)) return "";
  const contentType = String(request.headers.get("Content-Type") || "").toLowerCase();
  const length = Number(request.headers.get("Content-Length") || 0);
  if (!contentType.startsWith("application/json") || length > 16_384) return "";
  try {
    const raw = await request.clone().text();
    if (new TextEncoder().encode(raw).byteLength > 16_384) return "";
    const body = JSON.parse(raw);
    return String(body?.action || (path === "/api/support" ? "create" : ""));
  } catch {
    return "";
  }
}

function policy(bucket, scope, limit, windowMs, blockMs = 0) {
  return { bucket, scope, limit, windowMs, blockMs };
}

export function policiesForRequest(path, method, action = "", session = null) {
  const policies = [
    policy("api:ip", "ip", method === "GET" ? 240 : 120, MINUTE, 10 * MINUTE),
    policy("api:account", "account", method === "GET" ? 300 : 160, MINUTE, 10 * MINUTE)
  ];
  if (path === "/api/auth/vk" && method === "POST") return [policy("auth:vk", "ip", 8, 10 * MINUTE, 20 * MINUTE)];
  if (path === "/api/profile/nickname" && method === "POST") {
    if (session?.nickname) {
      policies.push(policy("profile:nickname_change", "account", 3, DAY, HOUR), policy("profile:nickname_change:ip", "ip", 20, DAY, HOUR));
    } else {
      policies.push(policy("profile:nickname_setup", "account", 12, HOUR, 15 * MINUTE), policy("profile:nickname_setup:ip", "ip", 30, HOUR, 15 * MINUTE));
    }
  }
  if (path === "/api/support" && method === "POST" && action !== "review") {
    policies.push(policy("support:create", "account", 6, HOUR, HOUR), policy("support:create:ip", "ip", 20, HOUR, HOUR));
  }
  if (path === "/api/community" && method === "POST") {
    if (action === "send") policies.push(policy("community:message", "account", 15, MINUTE, 5 * MINUTE), policy("community:message:ip", "ip", 60, MINUTE, 5 * MINUTE));
    if (action === "report_message") policies.push(policy("community:report", "account", 8, HOUR, 30 * MINUTE), policy("community:report:ip", "ip", 30, HOUR, 30 * MINUTE));
    if (action === "create_clan") policies.push(policy("community:create_clan", "account", 2, DAY, 6 * HOUR), policy("community:create_clan:ip", "ip", 10, DAY, 6 * HOUR));
  }
  if (path === "/api/store/create-payment" && method === "POST") {
    policies.push(policy("store:create_payment", "account", 6, 10 * MINUTE, HOUR), policy("store:create_payment:ip", "ip", 20, 10 * MINUTE, HOUR));
  }
  if (path === "/api/account/delete" && method === "POST") policies.push(policy("account:delete", "account", 3, HOUR, HOUR));
  if (path === "/api/save" && method === "PUT") policies.push(policy("save:write", "account", 40, MINUTE, 10 * MINUTE));
  return policies;
}

function isAdminIntent(path, method, action, url) {
  if (path === "/api/security/events") return true;
  if (path === "/api/community" && method === "POST" && action.startsWith("admin_")) return true;
  if (path === "/api/support" && method === "POST" && action === "review") return true;
  if (path === "/api/store/refunds" && method === "POST" && action === "review") return true;
  return path === "/api/store/refunds" && method === "GET" && url.searchParams.get("admin") === "1";
}

async function activeBlock(db, subject, now) {
  if (!subject) return null;
  return db.prepare("SELECT reason, expires_at AS expiresAt FROM security_blocks WHERE subject = ? AND expires_at > ? LIMIT 1")
    .bind(subject, now).first();
}

async function incrementWindow(db, subject, rule, now) {
  const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
  return db.prepare(`INSERT INTO security_rate_windows (subject, bucket, window_start, count, updated_at)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(subject, bucket) DO UPDATE SET
      count = CASE WHEN security_rate_windows.window_start = excluded.window_start
        THEN security_rate_windows.count + 1 ELSE 1 END,
      window_start = excluded.window_start,
      updated_at = excluded.updated_at
    RETURNING count`)
    .bind(subject, rule.bucket, windowStart, now).first();
}

async function writeEvent(db, { subject, subjectType, userId, category, path, method, details, now, dedupeMs = 5 * MINUTE }) {
  if (!subject) return;
  const slot = Math.floor(now / dedupeMs);
  const eventId = `${category}:${subject}:${slot}`;
  await db.prepare(`INSERT OR IGNORE INTO security_events
    (id, subject, subject_type, user_id, category, route, method, details_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(eventId, subject, subjectType, userId || null, category, path, method, JSON.stringify(details || {}), now).run();
}

async function blockSubject(db, subject, subjectType, reason, expiresAt, now) {
  await db.prepare(`INSERT INTO security_blocks (subject, subject_type, reason, expires_at, created_at, last_event_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(subject) DO UPDATE SET
      reason = excluded.reason,
      expires_at = MAX(security_blocks.expires_at, excluded.expires_at),
      last_event_at = excluded.last_event_at`)
    .bind(subject, subjectType, reason, expiresAt, now, now).run();
}

function limited(retryAfter, code = "rate_limited") {
  return json({ ok: false, error: code, retryAfter }, 429, {
    "Retry-After": String(Math.max(1, retryAfter)),
    "X-RateLimit-Policy": "server-enforced"
  });
}

async function runSecurityMaintenance(db, now) {
  const row = await db.prepare("SELECT completed_at FROM security_maintenance WHERE task = 'cleanup' LIMIT 1").first();
  if (row && now - Number(row.completed_at || 0) < 6 * HOUR) return;
  await db.batch([
    db.prepare("INSERT INTO security_maintenance (task, completed_at) VALUES ('cleanup', ?) ON CONFLICT(task) DO UPDATE SET completed_at = excluded.completed_at").bind(now),
    db.prepare("DELETE FROM security_rate_windows WHERE updated_at < ?").bind(now - WINDOW_RETENTION),
    db.prepare("DELETE FROM security_events WHERE created_at < ?").bind(now - EVENT_RETENTION),
    db.prepare("DELETE FROM security_blocks WHERE expires_at <= ?").bind(now)
  ]);
}

export async function enforceApiSecurity(context, session = null) {
  const { request, env } = context;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/") || !env.DB) return { response: null, audit: null };
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/u, "") : url.pathname;
  await ensureSecuritySchema(env.DB);
  const now = Date.now();
  const action = await requestAction(request, path);
  const ip = await ipSubject(request, env, now);
  const account = accountSubject(session);
  const subjects = { ip, account };
  await runSecurityMaintenance(env.DB, now);

  for (const [subjectType, subject] of Object.entries(subjects)) {
    const block = await activeBlock(env.DB, subject, now);
    if (!block) continue;
    await writeEvent(env.DB, { subject, subjectType, userId: session?.id, category: "blocked_request", path, method: request.method, details: { reason: block.reason }, now });
    return { response: limited(Math.ceil((Number(block.expiresAt) - now) / 1000), "temporarily_blocked"), audit: { ip, account, action } };
  }

  const adminIntent = isAdminIntent(path, request.method, action, url);
  if (adminIntent && (!session?.id || !isAdminUser(env, session.id))) {
    const subject = account || ip;
    const subjectType = account ? "account" : "ip";
    await writeEvent(env.DB, { subject, subjectType, userId: session?.id, category: "admin_access_denied", path, method: request.method, details: { action }, now, dedupeMs: MINUTE });
    const attempt = subject ? await incrementWindow(env.DB, subject, policy("admin:denied", subjectType, 5, 10 * MINUTE, HOUR), now) : null;
    if (subject && Number(attempt?.count || 0) > 5) await blockSubject(env.DB, subject, subjectType, "admin_access_denied", now + HOUR, now);
    return { response: json({ ok: false, error: session ? "admin_required" : "authentication_required" }, session ? 403 : 401), audit: { ip, account, action } };
  }

  if (adminIntent) {
    const adminRules = [policy("admin:account", "account", 60, 5 * MINUTE, 30 * MINUTE), policy("admin:ip", "ip", 120, 5 * MINUTE, 30 * MINUTE)];
    for (const rule of adminRules) {
      const subject = subjects[rule.scope];
      if (!subject) continue;
      const result = await incrementWindow(env.DB, subject, rule, now);
      if (Number(result?.count || 0) <= rule.limit) continue;
      await blockSubject(env.DB, subject, rule.scope, rule.bucket, now + rule.blockMs, now);
      await writeEvent(env.DB, { subject, subjectType: rule.scope, userId: session.id, category: "admin_rate_limited", path, method: request.method, details: { action, policy: rule.bucket }, now, dedupeMs: rule.windowMs });
      return { response: limited(Math.ceil(rule.blockMs / 1000)), audit: { ip, account, action } };
    }
  }

  for (const rule of policiesForRequest(path, request.method, action, session)) {
    const subject = subjects[rule.scope];
    if (!subject) continue;
    const result = await incrementWindow(env.DB, subject, rule, now);
    if (Number(result?.count || 0) <= rule.limit) continue;
    if (rule.blockMs) await blockSubject(env.DB, subject, rule.scope, rule.bucket, now + rule.blockMs, now);
    await writeEvent(env.DB, { subject, subjectType: rule.scope, userId: session?.id, category: "rate_limited", path, method: request.method, details: { action, policy: rule.bucket, limit: rule.limit, windowMs: rule.windowMs }, now, dedupeMs: rule.windowMs });
    return { response: limited(Math.max(1, Math.ceil((Math.floor(now / rule.windowMs) * rule.windowMs + rule.windowMs - now) / 1000))), audit: { ip, account, action } };
  }

  return { response: null, audit: { ip, account, action } };
}

export async function recordSuspiciousResponse(context, session, audit, status) {
  if (!context.env.DB || !audit || ![401, 403, 429].includes(Number(status))) return;
  const url = new URL(context.request.url);
  const subject = audit.account || audit.ip;
  const subjectType = audit.account ? "account" : "ip";
  const category = url.pathname === "/api/auth/vk" && status === 401 ? "login_failed" : `api_${status}`;
  await writeEvent(context.env.DB, {
    subject, subjectType, userId: session?.id, category, path: url.pathname,
    method: context.request.method, details: { action: audit.action || "" }, now: Date.now()
  });
}

export const SECURITY_RETENTION = Object.freeze({ eventsMs: EVENT_RETENTION, windowsMs: WINDOW_RETENTION });
