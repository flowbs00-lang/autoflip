import { handleError, json, methodNotAllowed, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";
import { isAdminUser } from "../../_lib/admin.js";
import { ensureSecuritySchema } from "../../_lib/security.js";

function publicEvent(row) {
  let details = {};
  try { details = JSON.parse(row.details_json || "{}"); } catch { /* Ignore malformed historical rows. */ }
  return {
    id: row.id,
    subject: row.subject,
    subjectType: row.subject_type,
    userId: row.user_id || null,
    category: row.category,
    route: row.route,
    method: row.method,
    details,
    createdAt: Number(row.created_at)
  };
}

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session?.id) throw new RequestError("authentication_required", 401);
    if (!isAdminUser(context.env, session.id)) throw new RequestError("admin_required", 403);
    await ensureSecuritySchema(context.env.DB);
    const requested = Number(new URL(context.request.url).searchParams.get("limit") || 100);
    const limit = Math.max(1, Math.min(200, Math.floor(requested) || 100));
    const now = Date.now();
    const [events, blocks] = await Promise.all([
      context.env.DB.prepare(`SELECT id, subject, subject_type, user_id, category, route, method, details_json, created_at
        FROM security_events ORDER BY created_at DESC LIMIT ?`).bind(limit).all(),
      context.env.DB.prepare(`SELECT subject, subject_type, reason, expires_at, created_at, last_event_at
        FROM security_blocks WHERE expires_at > ? ORDER BY expires_at DESC LIMIT 100`).bind(now).all()
    ]);
    return json({
      ok: true,
      events: (events.results || []).map(publicEvent),
      activeBlocks: (blocks.results || []).map((row) => ({
        subject: row.subject,
        subjectType: row.subject_type,
        reason: row.reason,
        expiresAt: Number(row.expires_at),
        createdAt: Number(row.created_at),
        lastEventAt: Number(row.last_event_at)
      }))
    });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return methodNotAllowed(["GET"]);
}
