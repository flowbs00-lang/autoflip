import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { generatePlate, plateCaseById } from "../../_lib/plate-cases.js";
import { getSession } from "../../_lib/session.js";

const PHASES = new Set(["prepare", "commit"]);
let schemaReady = false;

async function ensureSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS plate_case_openings (
      user_id TEXT NOT NULL,
      opening_id TEXT NOT NULL,
      case_id TEXT NOT NULL,
      price INTEGER NOT NULL,
      plate_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'prepared',
      client_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, opening_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS plate_case_openings_user_status_idx ON plate_case_openings(user_id, status, updated_at DESC)"),
    db.prepare("CREATE UNIQUE INDEX IF NOT EXISTS plate_case_openings_one_prepared_idx ON plate_case_openings(user_id) WHERE status = 'prepared'")
  ]);
  schemaReady = true;
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function currentState(db, userId) {
  const row = await db.prepare("SELECT data_json FROM game_saves WHERE user_id = ? LIMIT 1").bind(userId).first();
  if (!row?.data_json) throw new RequestError("save_required_for_case", 409);
  try {
    if (!row.data_json.startsWith("gz:")) return JSON.parse(row.data_json);
    const stream = new Blob([base64ToBytes(row.data_json.slice(3))]).stream().pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(stream).text());
  } catch {
    throw new RequestError("save_corrupted", 500);
  }
}

function publicOpening(row) {
  return {
    ok: true,
    openingId: row.opening_id,
    caseId: row.case_id,
    price: Number(row.price),
    plate: JSON.parse(row.plate_json),
    committed: row.status === "committed"
  };
}

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session) throw new RequestError("authentication_required", 401);
    if (!session.nickname) throw new RequestError("profile_incomplete", 403);
    await ensureSchema(context.env.DB);
    await context.env.DB.prepare(`DELETE FROM plate_case_openings
      WHERE user_id = ? AND ((status = 'committed' AND updated_at < ?) OR (status = 'prepared' AND updated_at < ?))`)
      .bind(session.id, Date.now() - 30 * 24 * 60 * 60_000, Date.now() - 24 * 60 * 60_000).run();

    const body = await readJson(context.request, 8_000);
    const openingId = String(body?.openingId || "").trim().slice(0, 120);
    const caseId = String(body?.caseId || "").trim().slice(0, 24);
    const clientId = String(body?.clientId || "").trim().slice(0, 120);
    const phase = String(body?.phase || "prepare").trim();
    if (!/^[a-z0-9:_-]{12,120}$/i.test(openingId)) throw new RequestError("invalid_opening_id", 400);
    if (!/^[a-z0-9:_-]{8,120}$/i.test(clientId)) throw new RequestError("invalid_client_id", 400);
    if (!PHASES.has(phase)) throw new RequestError("invalid_opening_phase", 400);

    let row = await context.env.DB.prepare(`SELECT opening_id, case_id, price, plate_json, status, client_id, created_at, updated_at
      FROM plate_case_openings WHERE user_id = ? AND opening_id = ? LIMIT 1`).bind(session.id, openingId).first();

    if (!row && phase === "prepare") {
      const box = plateCaseById(caseId);
      if (!box) throw new RequestError("invalid_case", 400);
      const state = await currentState(context.env.DB, session.id);
      const level = Math.max(1, Number(state.garageLevel || state.garageProgress?.level || 1));
      if (level < box.level) throw new RequestError("case_level_locked", 409);
      if (Number(state.money || 0) < box.price) throw new RequestError("insufficient_game_money", 409);
      const pending = await context.env.DB.prepare(`SELECT opening_id, updated_at FROM plate_case_openings
        WHERE user_id = ? AND status = 'prepared' LIMIT 1`).bind(session.id).first();
      if (pending) {
        const applied = Array.isArray(state.plates?.appliedOpeningIds) && state.plates.appliedOpeningIds.includes(pending.opening_id);
        const expired = Number(pending.updated_at || 0) < Date.now() - 5 * 60_000;
        if (!applied && expired) {
          await context.env.DB.prepare(`DELETE FROM plate_case_openings
            WHERE user_id = ? AND opening_id = ? AND status = 'prepared' AND updated_at = ?`)
            .bind(session.id, pending.opening_id, Number(pending.updated_at || 0)).run();
        } else {
          throw new RequestError("case_opening_in_progress", 409);
        }
      }

      const now = Date.now();
      const plate = generatePlate(box, openingId, now);
      await context.env.DB.prepare(`INSERT OR IGNORE INTO plate_case_openings
        (user_id, opening_id, case_id, price, plate_json, status, client_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'prepared', ?, ?, ?)`)
        .bind(session.id, openingId, box.id, box.price, JSON.stringify(plate), clientId, now, now).run();
      row = await context.env.DB.prepare(`SELECT opening_id, case_id, price, plate_json, status, client_id, created_at, updated_at
        FROM plate_case_openings WHERE user_id = ? AND opening_id = ? LIMIT 1`).bind(session.id, openingId).first();
      if (!row) throw new RequestError("case_opening_in_progress", 409);
    }

    if (!row) throw new RequestError("opening_not_recorded", 409);
    if (row.client_id !== clientId) throw new RequestError("opening_owner_mismatch", 409);
    if (caseId && row.case_id !== caseId) throw new RequestError("opening_conflict", 409);
    if (phase === "prepare" || row.status === "committed") return json(publicOpening(row));

    const update = await context.env.DB.prepare(`UPDATE plate_case_openings SET status = 'committed', updated_at = ?
      WHERE user_id = ? AND opening_id = ? AND status = 'prepared' AND client_id = ?`)
      .bind(Date.now(), session.id, openingId, clientId).run();
    if (Number(update.meta?.changes || 0) !== 1) throw new RequestError("opening_commit_failed", 409);
    row = { ...row, status: "committed" };
    return json(publicOpening(row));
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
