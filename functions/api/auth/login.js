import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { ensurePasswordAuthSchema, findCredentialsByUsername, verifyPassword } from "../../_lib/password-auth.js";
import { createSession } from "../../_lib/session.js";
import { publicUser } from "../../_lib/users.js";

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const body = await readJson(context.request, 2048);
    await ensurePasswordAuthSchema(context.env.DB);
    const credentials = await findCredentialsByUsername(context.env.DB, body.username);
    if (!await verifyPassword(credentials, body.password)) throw new RequestError("invalid_credentials", 401);
    const session = await createSession(context.env.DB, credentials.user_id);
    return json({
      ok: true,
      user: publicUser({ id: credentials.user_id, nickname: credentials.nickname })
    }, 200, { "Set-Cookie": session.cookie });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
