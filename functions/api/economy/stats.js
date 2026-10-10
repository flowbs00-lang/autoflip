import { handleError, json, methodNotAllowed, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session) throw new RequestError("authentication_required", 401);
    await context.env.DB.prepare(`CREATE TABLE IF NOT EXISTS economy_transactions (
      user_id TEXT NOT NULL, transaction_id TEXT NOT NULL, type TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0, payload_json TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, transaction_id), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`).run();
    const rows = await context.env.DB.prepare(`SELECT type, COUNT(*) AS count, COALESCE(SUM(amount), 0) AS amount
      FROM economy_transactions WHERE user_id = ? GROUP BY type`).bind(session.id).all();
    const recent = await context.env.DB.prepare(`SELECT transaction_id AS id, type, amount, payload_json AS payload, created_at AS createdAt
      FROM economy_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 25`).bind(session.id).all();
    return json({ ok: true, totals: rows.results || [], recent: recent.results || [] });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return methodNotAllowed(["GET"]);
}
