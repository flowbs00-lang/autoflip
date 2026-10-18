import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";

const TYPES = new Set(["purchase", "sale", "exchange", "service"]);
const PHASES = new Set(["prepare", "commit"]);
const LEASE_MS = 5 * 60_000;
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
      status TEXT NOT NULL DEFAULT 'prepared',
      client_id TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL DEFAULT 0,
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
    const phase = cleanText(body?.phase || "prepare", 16);
    const clientId = cleanText(body?.clientId, 120);
    const amount = Math.round(Number(body?.amount || 0));
    if (!/^[a-z0-9:_-]{8,120}$/i.test(transactionId)) throw new RequestError("invalid_transaction_id", 400);
    if (!TYPES.has(type)) throw new RequestError("invalid_transaction_type", 400);
    if (!PHASES.has(phase)) throw new RequestError("invalid_transaction_phase", 400);
    if (!/^[a-z0-9:_-]{8,120}$/i.test(clientId)) throw new RequestError("invalid_client_id", 400);
    if (!Number.isSafeInteger(amount) || amount < 0 || amount > 50_000_000) throw new RequestError("invalid_transaction_amount", 400);

    const payload = {
      car: cleanText(body?.car, 100),
      city: cleanText(body?.city, 80),
      sourceId: cleanText(body?.sourceId, 120),
      gameDay: Math.max(1, Math.min(100_000, Math.floor(Number(body?.gameDay || 1))))
    };
    const payloadJson = JSON.stringify(payload);
    const now = Date.now();
    if (phase === "prepare") {
      await context.env.DB.prepare(`INSERT OR IGNORE INTO economy_transactions
        (user_id, transaction_id, type, amount, payload_json, created_at, status, client_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'prepared', ?, ?)`)
        .bind(session.id, transactionId, type, amount, payloadJson, now, clientId, now).run();
    }

    let existing = await context.env.DB.prepare(`SELECT transaction_id, type, amount, payload_json, created_at,
        status, client_id, updated_at
      FROM economy_transactions WHERE user_id = ? AND transaction_id = ? LIMIT 1`)
      .bind(session.id, transactionId).first();
    if (!existing) throw new RequestError("transaction_not_recorded", 503);
    if (existing.type !== type || Number(existing.amount) !== amount || existing.payload_json !== payloadJson) {
      throw new RequestError("transaction_conflict", 409);
    }

    if (existing.status === "committed") {
      return json({
        ok: true,
        confirmed: true,
        committed: true,
        duplicate: true,
        transactionId,
        serverTime: Number(existing.updated_at || existing.created_at || now)
      });
    }

    if (phase === "prepare") {
      if (existing.client_id !== clientId) {
        const leaseExpired = Number(existing.updated_at || existing.created_at || 0) <= now - LEASE_MS;
        if (!leaseExpired) throw new RequestError("transaction_in_progress", 409);
        const takeover = await context.env.DB.prepare(`UPDATE economy_transactions
          SET client_id = ?, updated_at = ?
          WHERE user_id = ? AND transaction_id = ? AND status = 'prepared' AND updated_at <= ?`)
          .bind(clientId, now, session.id, transactionId, now - LEASE_MS).run();
        if (Number(takeover.meta?.changes || 0) !== 1) throw new RequestError("transaction_in_progress", 409);
        existing = { ...existing, client_id: clientId, updated_at: now };
      }

      return json({
        ok: true,
        confirmed: true,
        committed: false,
        duplicate: Number(existing.created_at || 0) !== now,
        transactionId,
        serverTime: Number(existing.updated_at || existing.created_at || now)
      });
    }

    if (existing.client_id !== clientId) throw new RequestError("transaction_owner_mismatch", 409);
    const commit = await context.env.DB.prepare(`UPDATE economy_transactions
      SET status = 'committed', updated_at = ?
      WHERE user_id = ? AND transaction_id = ? AND status = 'prepared' AND client_id = ?`)
      .bind(now, session.id, transactionId, clientId).run();
    if (Number(commit.meta?.changes || 0) !== 1) throw new RequestError("transaction_commit_failed", 409);

    return json({
      ok: true,
      confirmed: true,
      committed: true,
      duplicate: false,
      transactionId,
      serverTime: now
    });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
