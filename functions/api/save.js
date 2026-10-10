import {
  assertSameOrigin,
  handleError,
  json,
  methodNotAllowed,
  readJson,
  RequestError
} from "../_lib/http.js";
import { getSession } from "../_lib/session.js";
import { syncCommunityProfile } from "../_lib/community.js";
import { applyPaidOrdersToState } from "../_lib/store.js";

const MAX_SAVE_BYTES = 6_000_000;
const MAX_STORED_BYTES = 1_900_000;
const CURRENT_SAVE_VERSION = 2;
let saveSchemaReady = false;

async function ensureSaveSchema(db) {
  if (saveSchemaReady) return;
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
  saveSchemaReady = true;
}

function saveVersion(state, declared) {
  const embedded = Number(state?._saveMeta?.version || 1);
  const version = Number(declared || embedded);
  if (!Number.isInteger(embedded) || embedded < 1) throw new RequestError("invalid_save_version", 400);
  if (embedded > CURRENT_SAVE_VERSION) throw new RequestError("save_version_too_new", 409);
  if (!Number.isInteger(version) || version < 1) throw new RequestError("invalid_save_version", 400);
  if (version > CURRENT_SAVE_VERSION) throw new RequestError("save_version_too_new", 409);
  return version;
}

async function preserveServerBackup(db, userId, row) {
  if (!row) return;
  await db.prepare(`INSERT OR IGNORE INTO game_save_backups (user_id, revision, data_json, created_at)
    VALUES (?, ?, ?, ?)`).bind(userId, Number(row.revision), row.data_json, Date.now()).run();
  await db.prepare(`DELETE FROM game_save_backups WHERE user_id = ? AND revision NOT IN (
    SELECT revision FROM game_save_backups WHERE user_id = ? ORDER BY revision DESC LIMIT 5
  )`).bind(userId, userId).run();
}

async function requireUser(context) {
  if (!context.env.DB) throw new RequestError("database_not_configured", 503);
  const session = await getSession(context.env.DB, context.request);
  if (!session) throw new RequestError("authentication_required", 401);
  if (!session.nickname) throw new RequestError("profile_incomplete", 403);
  return session;
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

async function encodeStoredSave(dataJson) {
  const compressed = new Blob([dataJson])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  const bytes = new Uint8Array(await new Response(compressed).arrayBuffer());
  const stored = `gz:${bytesToBase64(bytes)}`;
  if (new TextEncoder().encode(stored).byteLength > MAX_STORED_BYTES) {
    throw new RequestError("save_too_large", 413);
  }
  return stored;
}

async function decodeUploadedSave(body) {
  if (body?.encoding !== "gzip-base64") return null;
  if (typeof body.compressed !== "string" || !body.compressed) {
    throw new RequestError("invalid_save");
  }

  const stored = `gz:${body.compressed}`;
  if (new TextEncoder().encode(stored).byteLength > MAX_STORED_BYTES) {
    throw new RequestError("save_too_large", 413);
  }

  try {
    const bytes = base64ToBytes(body.compressed);
    const decompressed = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    const dataJson = await new Response(decompressed).text();
    if (new TextEncoder().encode(dataJson).byteLength > MAX_SAVE_BYTES - 1024) {
      throw new RequestError("save_too_large", 413);
    }
    const state = JSON.parse(dataJson);
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      throw new RequestError("invalid_save");
    }
    return { state, stored };
  } catch (error) {
    if (error instanceof RequestError) throw error;
    throw new RequestError("invalid_save");
  }
}

async function parseStoredSave(row) {
  if (!row) return null;
  try {
    if (!row.data_json.startsWith("gz:")) return JSON.parse(row.data_json);
    const bytes = base64ToBytes(row.data_json.slice(3));
    const decompressed = new Blob([bytes])
      .stream()
      .pipeThrough(new DecompressionStream("gzip"));
    return JSON.parse(await new Response(decompressed).text());
  } catch {
    throw new RequestError("save_corrupted", 500);
  }
}

async function loadSaveAndApplyOrders(db, userId) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const row = await db.prepare(
      "SELECT revision, data_json, updated_at FROM game_saves WHERE user_id = ? LIMIT 1"
    ).bind(userId).first();
    const state = await parseStoredSave(row);
    const revision = Number(row?.revision || 0);
    const updatedAt = Number(row?.updated_at || 0);
    if (!state || !(await applyPaidOrdersToState(db, userId, state))) return { row, state, revision, updatedAt };

    const nextUpdatedAt = Date.now();
    const storedSave = await encodeStoredSave(JSON.stringify(state));
    await preserveServerBackup(db, userId, row);
    const update = await db.prepare(`UPDATE game_saves SET revision = revision + 1, data_json = ?, updated_at = ?
      WHERE user_id = ? AND revision = ?`).bind(storedSave, nextUpdatedAt, userId, revision).run();
    if (Number(update.meta?.changes || 0) === 1) {
      return { row, state, revision: revision + 1, updatedAt: nextUpdatedAt };
    }
  }
  throw new RequestError("save_busy", 409);
}

export async function onRequestGet(context) {
  try {
    const session = await requireUser(context);
    await ensureSaveSchema(context.env.DB);
    const { state, revision, updatedAt } = await loadSaveAndApplyOrders(context.env.DB, session.id);

    return json({
      ok: true,
      save: state,
      revision,
      updatedAt,
      saveVersion: state ? saveVersion(state) : CURRENT_SAVE_VERSION
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPut(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    const session = await requireUser(context);
    await ensureSaveSchema(context.env.DB);
    const body = await readJson(context.request, MAX_SAVE_BYTES);
    const uploaded = await decodeUploadedSave(body);
    const state = uploaded?.state || body?.state;
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      throw new RequestError("invalid_save");
    }
    const version = saveVersion(state, body?.saveVersion);
    state._saveMeta = { ...(state._saveMeta || {}), version };
    const baseRevision = Number(body?.baseRevision);
    if (!Number.isInteger(baseRevision) || baseRevision < 0) throw new RequestError("invalid_base_revision", 400);

    const current = await context.env.DB.prepare(
      "SELECT revision, data_json, updated_at FROM game_saves WHERE user_id = ? LIMIT 1"
    ).bind(session.id).first();
    const currentRevision = Number(current?.revision || 0);
    if (baseRevision !== currentRevision) {
      return json({ ok: false, error: "revision_conflict", revision: currentRevision, updatedAt: Number(current?.updated_at || 0), saveVersion: CURRENT_SAVE_VERSION }, 409);
    }

    const purchasesApplied = await applyPaidOrdersToState(context.env.DB, session.id, state);
    let storedSave = purchasesApplied ? null : uploaded?.stored;
    if (!storedSave) {
      const dataJson = JSON.stringify(state);
      if (new TextEncoder().encode(dataJson).byteLength > MAX_SAVE_BYTES - 1024) {
        throw new RequestError("save_too_large", 413);
      }
      storedSave = await encodeStoredSave(dataJson);
    }

    const updatedAt = Date.now();
    let nextRevision;
    if (current) {
      await preserveServerBackup(context.env.DB, session.id, current);
      const update = await context.env.DB.prepare(`UPDATE game_saves
        SET revision = revision + 1, data_json = ?, updated_at = ?
        WHERE user_id = ? AND revision = ?`).bind(storedSave, updatedAt, session.id, currentRevision).run();
      if (Number(update.meta?.changes || 0) !== 1) {
        const latest = await context.env.DB.prepare("SELECT revision, updated_at FROM game_saves WHERE user_id = ? LIMIT 1").bind(session.id).first();
        return json({ ok: false, error: "revision_conflict", revision: Number(latest?.revision || 0), updatedAt: Number(latest?.updated_at || 0), saveVersion: CURRENT_SAVE_VERSION }, 409);
      }
      nextRevision = currentRevision + 1;
    } else {
      try {
        await context.env.DB.prepare("INSERT INTO game_saves (user_id, revision, data_json, updated_at) VALUES (?, 1, ?, ?)")
          .bind(session.id, storedSave, updatedAt).run();
        nextRevision = 1;
      } catch (error) {
        const latest = await context.env.DB.prepare("SELECT revision, updated_at FROM game_saves WHERE user_id = ? LIMIT 1").bind(session.id).first();
        if (latest) return json({ ok: false, error: "revision_conflict", revision: Number(latest.revision), updatedAt: Number(latest.updated_at || 0), saveVersion: CURRENT_SAVE_VERSION }, 409);
        throw error;
      }
    }

    // Keep public ratings current with the same save that stores game progress.
    // A temporary community failure must never block the player's cloud save.
    try {
      await syncCommunityProfile(context.env.DB, session.id, state.rep, state.city);
    } catch (communityError) {
      console.error("community_profile_sync_failed", communityError);
    }

    return json({
      ok: true,
      revision: nextRevision,
      updatedAt,
      saveVersion: version
    });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  if (context.request.method === "PUT") return onRequestPut(context);
  return methodNotAllowed(["GET", "PUT"]);
}
