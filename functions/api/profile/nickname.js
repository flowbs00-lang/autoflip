import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";

const NICKNAME_PATTERN = /^(?=.{3,20}$)[\p{L}\p{N}]+(?:_[\p{L}\p{N}]+)*$/u;
const RESERVED = new Set(["admin", "administrator", "autoflip", "moderator", "support", "system"]);

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);

    const session = await getSession(context.env.DB, context.request);
    if (!session) throw new RequestError("authentication_required", 401);

    const body = await readJson(context.request, 2048);
    const nickname = typeof body.nickname === "string" ? body.nickname.normalize("NFKC").trim() : "";
    if (!NICKNAME_PATTERN.test(nickname)) throw new RequestError("invalid_nickname");
    if (RESERVED.has(nickname.toLocaleLowerCase("ru-RU"))) throw new RequestError("nickname_reserved", 409);

    try {
      await context.env.DB.prepare("UPDATE users SET nickname = ?, updated_at = ? WHERE id = ?")
        .bind(nickname, Math.floor(Date.now() / 1000), session.id)
        .run();
    } catch (error) {
      if (/unique|constraint/iu.test(String(error?.message || error))) {
        throw new RequestError("nickname_taken", 409);
      }
      throw error;
    }

    return json({ ok: true, nickname });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
