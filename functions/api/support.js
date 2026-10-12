import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../_lib/http.js";
import { getSession } from "../_lib/session.js";
import { isAdminUser } from "../_lib/admin.js";
import { ensureSupportSchema, runSupportMaintenance } from "../_lib/support.js";

async function requireUser(context) {
  if (!context.env.DB) throw new RequestError("database_not_configured", 503);
  const session = await getSession(context.env.DB, context.request);
  if (!session?.nickname) throw new RequestError("authentication_required", 401);
  await ensureSupportSchema(context.env.DB);
  await runSupportMaintenance(context.env.DB);
  return session;
}

function publicTicket(row, admin) {
  return { id: row.id, category: row.category, subject: row.subject, message: row.message,
    status: row.status, createdAt: Number(row.created_at), updatedAt: Number(row.updated_at),
    response: row.response || "", ...(admin ? { userId: row.user_id, nickname: row.nickname || "" } : {}) };
}

export async function onRequestGet(context) {
  try {
    const session = await requireUser(context);
    const admin = isAdminUser(context.env, session.id);
    const rows = admin
      ? await context.env.DB.prepare(`SELECT t.*, u.nickname FROM support_tickets t JOIN users u ON u.id=t.user_id
          ORDER BY CASE WHEN t.status='open' THEN 0 ELSE 1 END, t.created_at ASC LIMIT 100`).all()
      : await context.env.DB.prepare("SELECT * FROM support_tickets WHERE user_id = ? ORDER BY created_at DESC LIMIT 30").bind(session.id).all();
    return json({ ok: true, admin, tickets: (rows.results || []).map((row) => publicTicket(row, admin)) });
  } catch (error) { return handleError(error); }
}

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    const session = await requireUser(context);
    const body = await readJson(context.request, 8_192);
    if (body.action === "review") {
      if (!isAdminUser(context.env, session.id)) throw new RequestError("admin_required", 403);
      const status = String(body.status || "");
      if (!["in_progress", "resolved", "closed"].includes(status)) throw new RequestError("invalid_ticket_status");
      await context.env.DB.prepare("UPDATE support_tickets SET status=?, response=?, reviewed_by=?, updated_at=? WHERE id=?")
        .bind(status, String(body.response || "").trim().slice(0, 1000), session.id, Date.now(), String(body.ticketId || "")).run();
      return json({ ok: true });
    }
    const category = ["account", "save", "chat", "purchase", "other"].includes(body.category) ? body.category : "other";
    const subject = String(body.subject || "").normalize("NFKC").trim().slice(0, 100);
    const message = String(body.message || "").normalize("NFKC").trim().slice(0, 2000);
    if (subject.length < 4 || message.length < 15) throw new RequestError("invalid_support_ticket");
    const recent = await context.env.DB.prepare("SELECT COUNT(*) AS total FROM support_tickets WHERE user_id=? AND created_at>?")
      .bind(session.id, Date.now() - 24 * 60 * 60_000).first();
    if (Number(recent?.total || 0) >= 5) throw new RequestError("support_rate_limited", 429);
    const now = Date.now();
    await context.env.DB.prepare(`INSERT INTO support_tickets
      (id,user_id,category,subject,message,status,created_at,updated_at) VALUES (?,?,?,?,?,'open',?,?)`)
      .bind(crypto.randomUUID(), session.id, category, subject, message, now, now).run();
    return json({ ok: true }, 201);
  } catch (error) { return handleError(error); }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["GET", "POST"]);
}
