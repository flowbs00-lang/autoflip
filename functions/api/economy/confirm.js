import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";

const TYPES = new Set([
  "purchase", "sale", "exchange", "service", "reward", "loan_issue", "loan_repay", "plate_sale"
]);
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

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function parseStoredSave(row) {
  if (!row?.data_json) return null;
  try {
    if (!row.data_json.startsWith("gz:")) return JSON.parse(row.data_json);
    const decompressed = new Blob([base64ToBytes(row.data_json.slice(3))])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(decompressed).text());
  } catch {
    throw new RequestError("save_corrupted", 500);
  }
}

function meetingType(kind) {
  if (kind === "seller_purchase") return "purchase";
  if (kind === "seller_trade" || kind === "buyer_trade") return "exchange";
  if (kind === "buyer_sale") return "sale";
  return "";
}

const BANK_OFFERS = [
  { amount: 25_000, rating: 0, paid: 0 },
  { amount: 50_000, rating: 58, paid: 1 },
  { amount: 100_000, rating: 67, paid: 2 },
  { amount: 250_000, rating: 80, paid: 4 },
  { amount: 500_000, rating: 92, paid: 6 }
];

function validateReward(state, transaction) {
  const source = transaction.payload.sourceId.split(":");
  const goals = state.economy?.goals;
  const kind = source[1];
  const period = Number(source[2]);
  const group = kind === "daily" ? goals?.daily : kind === "weekly" ? goals?.weekly : kind === "clan" ? goals?.clan : null;
  const expectedPeriod = kind === "daily" ? Number(group?.day) : Number(group?.week);
  const expectedAmount = kind === "daily" ? 25_000 : kind === "weekly" ? 125_000 : kind === "clan" ? 50_000 : 0;
  const ready = kind === "clan"
    ? Number(group?.value || 0) >= Number(group?.need || 0) && Number(group?.need || 0) > 0
    : Array.isArray(group?.targets) && group.targets.length > 0
      && group.targets.every((target) => Number(target?.value || 0) >= Number(target?.need || 0));
  if (!group || group.claimed || period !== expectedPeriod || !ready) throw new RequestError("reward_not_available", 409);
  if (transaction.amount !== expectedAmount) throw new RequestError("invalid_transaction_amount", 409);
}

function validateLoanIssue(state, transaction) {
  const customer = state.bankCustomer || {};
  const offer = BANK_OFFERS.find((item) => item.amount === transaction.amount);
  const gameTime = Number(state.gameClock?.total || 0);
  if (!offer || Number(state.loan || 0) > 0 || state.bankCredit?.active) throw new RequestError("loan_not_available", 409);
  if (Number(customer.nextLoanAt || 0) > gameTime) throw new RequestError("loan_cooldown_active", 409);
  if (Number(customer.rating || 50) < offer.rating || Number(customer.onTimePayments || 0) < offer.paid) {
    throw new RequestError("loan_not_available", 409);
  }
  if (transaction.payload.sourceId !== `offer:${offer.amount}:${Number(customer.totalIssued || 0) + 1}`) {
    throw new RequestError("invalid_transaction_source", 409);
  }
}

function validateLoanRepayment(state, transaction) {
  const debt = Math.round(Number(state.loan || 0));
  const startedAt = Math.floor(Number(state.bankCredit?.startedAt || 0));
  if (!state.bankCredit?.active || debt <= 0 || Number(state.money || 0) < debt) throw new RequestError("loan_repayment_not_available", 409);
  if (transaction.amount !== debt) throw new RequestError("invalid_transaction_amount", 409);
  if (transaction.payload.sourceId !== `credit:${startedAt}`) throw new RequestError("invalid_transaction_source", 409);
}

function validatePlateSale(state, transaction) {
  const plate = Array.isArray(state.plates?.items)
    ? state.plates.items.find((item) => item?.id === transaction.payload.sourceId)
    : null;
  if (!plate || plate.tradable === false || plate.premium === true) throw new RequestError("plate_not_tradable", 409);
  if (Math.round(Number(plate.value || 0)) !== transaction.amount) throw new RequestError("invalid_transaction_amount", 409);
  if (cleanText(plate.number, 100) !== transaction.payload.car) throw new RequestError("invalid_transaction_source", 409);
}

async function validatePreparedTransaction(db, userId, transaction) {
  const row = await db.prepare("SELECT data_json FROM game_saves WHERE user_id = ? LIMIT 1")
    .bind(userId).first();
  const state = await parseStoredSave(row);
  if (!state) throw new RequestError("save_required_for_transaction", 409);

  if (transaction.type === "reward") return validateReward(state, transaction);
  if (transaction.type === "loan_issue") return validateLoanIssue(state, transaction);
  if (transaction.type === "loan_repay") return validateLoanRepayment(state, transaction);
  if (transaction.type === "plate_sale") return validatePlateSale(state, transaction);

  if (transaction.transactionId.startsWith("meeting:")) {
    const meetingId = transaction.transactionId.slice("meeting:".length);
    const meeting = Array.isArray(state.meetings)
      ? state.meetings.find((item) => item?.id === meetingId)
      : null;
    if (!meeting || meeting.status !== "scheduled") throw new RequestError("invalid_transaction_source", 409);
    if (meetingType(meeting.kind) !== transaction.type) throw new RequestError("invalid_transaction_type", 409);
    if (Math.round(Number(meeting.price || 0)) !== transaction.amount) throw new RequestError("invalid_transaction_amount", 409);
    if (cleanText(meeting.sourceId, 120) !== transaction.payload.sourceId) throw new RequestError("invalid_transaction_source", 409);
    if (cleanText(meeting.carName, 100) !== transaction.payload.car) throw new RequestError("invalid_transaction_car", 409);
    if (cleanText(meeting.city, 80) !== transaction.payload.city) throw new RequestError("invalid_transaction_city", 409);
    return;
  }

  if (transaction.transactionId.startsWith("service:")) {
    const jobId = transaction.transactionId.slice("service:".length);
    const job = state.garageProgress?.activeServiceJob;
    if (!job || job.id !== jobId || job.claimed) throw new RequestError("invalid_transaction_source", 409);
    const maximumPayout = Math.round(Number(job.payout || 0));
    const minimumPayout = Math.max(0, Math.round(Number(job.parts || 0)));
    if (transaction.amount < minimumPayout || transaction.amount > maximumPayout) {
      throw new RequestError("invalid_transaction_amount", 409);
    }
    if (cleanText(job.car, 100) !== transaction.payload.car || transaction.payload.sourceId !== jobId) {
      throw new RequestError("invalid_transaction_source", 409);
    }
    return;
  }

  throw new RequestError("invalid_transaction_source", 409);
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
    let existing = await context.env.DB.prepare(`SELECT transaction_id, type, amount, payload_json, created_at,
        status, client_id, updated_at
      FROM economy_transactions WHERE user_id = ? AND transaction_id = ? LIMIT 1`)
      .bind(session.id, transactionId).first();

    if (!existing && phase === "prepare") {
      await validatePreparedTransaction(context.env.DB, session.id, { transactionId, type, amount, payload });
      await context.env.DB.prepare(`INSERT OR IGNORE INTO economy_transactions
        (user_id, transaction_id, type, amount, payload_json, created_at, status, client_id, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'prepared', ?, ?)`)
        .bind(session.id, transactionId, type, amount, payloadJson, now, clientId, now).run();
      existing = await context.env.DB.prepare(`SELECT transaction_id, type, amount, payload_json, created_at,
          status, client_id, updated_at
        FROM economy_transactions WHERE user_id = ? AND transaction_id = ? LIMIT 1`)
        .bind(session.id, transactionId).first();
    }
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
