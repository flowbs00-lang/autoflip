import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";
import { ensureStoreSchema } from "../../_lib/store.js";
import { isAdminUser } from "../../_lib/admin.js";

function publicRefund(row) {
  return { id: row.id, orderId: row.order_id, userId: row.user_id, reason: row.reason,
    status: row.status, createdAt: Number(row.created_at), updatedAt: Number(row.updated_at), reviewNote: row.review_note || "" };
}

async function requireUser(context) {
  if (!context.env.DB) throw new RequestError("database_not_configured", 503);
  const session = await getSession(context.env.DB, context.request);
  if (!session?.nickname) throw new RequestError("authentication_required", 401);
  await ensureStoreSchema(context.env.DB);
  return session;
}

export async function onRequestGet(context) {
  try {
    const session = await requireUser(context);
    const admin = isAdminUser(context.env, session.id) && new URL(context.request.url).searchParams.get("admin") === "1";
    const rows = admin
      ? await context.env.DB.prepare("SELECT * FROM store_refund_requests ORDER BY created_at ASC LIMIT 100").all()
      : await context.env.DB.prepare("SELECT * FROM store_refund_requests WHERE user_id = ? ORDER BY created_at DESC LIMIT 50").bind(session.id).all();
    return json({ ok: true, requests: (rows.results || []).map(publicRefund), admin });
  } catch (error) { return handleError(error); }
}

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    const session = await requireUser(context);
    const body = await readJson(context.request, 4_096);
    const action = String(body.action || "request");
    if (action === "request") {
      const orderId = String(body.orderId || "");
      const reason = String(body.reason || "").normalize("NFKC").trim().slice(0, 500);
      if (reason.length < 10) throw new RequestError("refund_reason_too_short");
      const order = await context.env.DB.prepare("SELECT id, status, amount_rub FROM store_orders WHERE id = ? AND user_id = ? LIMIT 1")
        .bind(orderId, session.id).first();
      if (!order || order.status !== "paid" || Number(order.amount_rub) <= 0) throw new RequestError("order_not_refundable", 409);
      const now = Date.now();
      try {
        await context.env.DB.prepare(`INSERT INTO store_refund_requests
          (id, order_id, user_id, reason, status, created_at, updated_at) VALUES (?, ?, ?, ?, 'requested', ?, ?)`)
          .bind(crypto.randomUUID(), orderId, session.id, reason, now, now).run();
      } catch (error) {
        if (/unique|constraint/iu.test(String(error?.message || error))) throw new RequestError("refund_already_requested", 409);
        throw error;
      }
      return json({ ok: true }, 201);
    }
    if (action === "review") {
      if (!isAdminUser(context.env, session.id)) throw new RequestError("admin_required", 403);
      const status = String(body.status || "");
      if (!["reviewing", "rejected", "resolved"].includes(status)) throw new RequestError("invalid_refund_status");
      await context.env.DB.prepare("UPDATE store_refund_requests SET status = ?, updated_at = ?, reviewed_by = ?, review_note = ? WHERE id = ?")
        .bind(status, Date.now(), session.id, String(body.note || "").slice(0, 500), String(body.requestId || "")).run();
      return json({ ok: true });
    }
    throw new RequestError("unknown_action");
  } catch (error) { return handleError(error); }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["GET", "POST"]);
}
