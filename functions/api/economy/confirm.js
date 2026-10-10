import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";

const TYPES = new Set(["purchase", "sale", "exchange", "service"]);
let schemaReady = false;

async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS economy_transactions (
      user_id TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL DEFAULT 0,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, transaction_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS economy_transactions_user_created_idx ON economy_transactions(user_id, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS economy_transactions_user_type_idx ON economy_transactions(user_id, type, created_at DESC)")
  ]);
  schemaReady = true;
}

function cleanText(value, max = 100) {
  return String(value || "").trim().slice(0, max);
}

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session) throw new RequestError("authentication_required", 401);
    if (!session.nickname) throw new RequestError("profile_incomplete", 403);
    await ensureSchema(context.env.DB);

    const body = await readJson(context.request, 24_000);
    const transactionId = cleanText(body?.transactionId, 120);
    const type = cleanText(body?.type, 24);
    const amount = Math.round(Number(body?.amount || 0));
    if (!/^[a-z0-9:_-]{8,120}$/i.test(transactionId)) throw new RequestError("invalid_transaction_id", 400);
    if (!TYPES.has(type)) throw new RequestError("invalid_transaction_type", 400);
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 50_000_000) throw new RequestError("invalid_transaction_amount", 400);

    const payload = {
      car: cleanText(body?.car, 100),
      city: cleanText(body?.city, 80),
      sourceId: cleanText(body?.sourceId, 120),
      gameDay: Math.max(1, Math.min(100_000, Math.floor(Number(body?.gameDay || 1))))
    };
    const payloadJson = JSON.stringify(payload);
    const now = Date.now();
    const insert = await context.env.DB.prepare(`INSERT OR IGNORE INTO economy_transactions
      (user_id, transaction_id, type, amount, payload_json, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(session.id, transactionId, type, amount, payloadJson, now).run();

    const existing = await context.env.DB.prepare(`SELECT transaction_id, type, amount, payload_json, created_at
      FROM economy_transactions WHERE user_id = ? AND transaction_id = ? LIMIT 1`)
      .bind(session.id, transactionId).first();
    if (!existing) throw new RequestError("transaction_not_recorded", 503);
    if (existing.type !== type || Number(existing.amount) !== amount || existing.payload_json !== payloadJson) {
      throw new RequestError("transaction_conflict", 409);
    }

    return json({
      ok: true,
      confirmed: true,
      duplicate: Number(insert.meta?.changes || 0) === 0,
      transactionId,
      serverTime: Number(existing.created_at || now)
    });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
