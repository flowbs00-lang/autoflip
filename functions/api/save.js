import {
  assertSameOrigin,
  handleError,
  json,
  methodNotAllowed,
  readJson,
  RequestError
} from "../_lib/http.js";
import { getSession } from "../_lib/session.js";

const MAX_SAVE_BYTES = 6_000_000;
const MAX_STORED_BYTES = 1_900_000;

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

export async function onRequestGet(context) {
  try {
    const session = await requireUser(context);
    const row = await context.env.DB.prepare(
      "SELECT revision, data_json, updated_at FROM game_saves WHERE user_id = ? LIMIT 1"
    ).bind(session.id).first();

    return json({
      ok: true,
      save: await parseStoredSave(row),
      revision: Number(row?.revision || 0),
      updatedAt: Number(row?.updated_at || 0)
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPut(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    const session = await requireUser(context);
    const body = await readJson(context.request, MAX_SAVE_BYTES);
    const state = body?.state;
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      throw new RequestError("invalid_save");
    }

    const dataJson = JSON.stringify(state);
    if (new TextEncoder().encode(dataJson).byteLength > MAX_SAVE_BYTES - 1024) {
      throw new RequestError("save_too_large", 413);
    }
    const storedSave = await encodeStoredSave(dataJson);

    const updatedAt = Date.now();
    await context.env.DB.prepare(`
      INSERT INTO game_saves (user_id, revision, data_json, updated_at)
      VALUES (?, 1, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        revision = game_saves.revision + 1,
        data_json = excluded.data_json,
        updated_at = excluded.updated_at
    `).bind(session.id, storedSave, updatedAt).run();

    const saved = await context.env.DB.prepare(
      "SELECT revision FROM game_saves WHERE user_id = ? LIMIT 1"
    ).bind(session.id).first();

    return json({
      ok: true,
      revision: Number(saved?.revision || 1),
      updatedAt
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
