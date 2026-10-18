import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";

async function requireUser(context) {
  if (!context.env.DB) throw new RequestError("database_not_configured", 503);
  const session = await getSession(context.env.DB, context.request);
  if (!session) throw new RequestError("authentication_required", 401);
  if (!session.nickname) throw new RequestError("profile_incomplete", 403);
  return session;
}

async function ensureSchema(db) {
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS game_save_backups (
      user_id TEXT NOT NULL,
      revision INTEGER NOT NULL,
      data_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, revision),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS game_save_backups_user_idx ON game_save_backups(user_id, revision DESC)")
  ]);
}

export async function onRequestGet(context) {
  try {
    const session = await requireUser(context);
    await ensureSchema(context.env.DB);
    const current = await context.env.DB.prepare(
      "SELECT revision, updated_at FROM game_saves WHERE user_id = ? LIMIT 1"
    ).bind(session.id).first();
    const backups = await context.env.DB.prepare(`SELECT revision, created_at AS createdAt
      FROM game_save_backups WHERE user_id = ? ORDER BY revision DESC LIMIT 5`)
      .bind(session.id).all();
    return json({
      ok: true,
      currentRevision: Number(current?.revision || 0),
      updatedAt: Number(current?.updated_at || 0),
      backups: backups.results || []
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    const session = await requireUser(context);
    await ensureSchema(context.env.DB);
    const body = await readJson(context.request, 4096);
    const backupRevision = Number(body?.revision);
    const expectedRevision = Number(body?.currentRevision);
    if (!Number.isInteger(backupRevision) || backupRevision < 1) throw new RequestError("invalid_backup_revision", 400);
    if (!Number.isInteger(expectedRevision) || expectedRevision < 1) throw new RequestError("invalid_current_revision", 400);

    const current = await context.env.DB.prepare(
      "SELECT revision, data_json, updated_at FROM game_saves WHERE user_id = ? LIMIT 1"
    ).bind(session.id).first();
    if (!current) throw new RequestError("save_not_found", 404);
    if (Number(current.revision) !== expectedRevision) {
      return json({ ok: false, error: "revision_conflict", revision: Number(current.revision) }, 409);
    }
    const backup = await context.env.DB.prepare(`SELECT revision, data_json, created_at
      FROM game_save_backups WHERE user_id = ? AND revision = ? LIMIT 1`)
      .bind(session.id, backupRevision).first();
    if (!backup) throw new RequestError("backup_not_found", 404);

    const updatedAt = Date.now();
    const results = await context.env.DB.batch([
      context.env.DB.prepare(`INSERT OR IGNORE INTO game_save_backups
        (user_id, revision, data_json, created_at) VALUES (?, ?, ?, ?)`)
        .bind(session.id, Number(current.revision), current.data_json, Number(current.updated_at || updatedAt)),
      context.env.DB.prepare(`UPDATE game_saves SET revision = revision + 1, data_json = ?, updated_at = ?
        WHERE user_id = ? AND revision = ?`)
        .bind(backup.data_json, updatedAt, session.id, expectedRevision)
    ]);
    if (Number(results[1]?.meta?.changes || 0) !== 1) {
      const latest = await context.env.DB.prepare("SELECT revision FROM game_saves WHERE user_id = ? LIMIT 1")
        .bind(session.id).first();
      return json({ ok: false, error: "revision_conflict", revision: Number(latest?.revision || 0) }, 409);
    }

    return json({ ok: true, revision: expectedRevision + 1, restoredFromRevision: backupRevision, updatedAt });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["GET", "POST"]);
}
