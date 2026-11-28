import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { buildCredentialValues, ensurePasswordAuthSchema, normalizeUsername, replaceCredentials, validatePassword } from "../../_lib/password-auth.js";
import { getSession } from "../../_lib/session.js";

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session) throw new RequestError("authentication_required", 401);
    const body = await readJson(context.request, 4096);
    const username = normalizeUsername(body.username);
    const password = validatePassword(body.password);
    await ensurePasswordAuthSchema(context.env.DB);
    const credentials = await buildCredentialValues({ username: username.normalized, password, accountType: "password" });
    await replaceCredentials(context.env.DB, session.id, credentials);
    return json({ ok: true, recoveryCode: credentials.recoveryCode, username: username.display });
  } catch (error) {
    if (/unique|constraint/iu.test(String(error?.message || error))) return handleError(new RequestError("username_taken", 409));
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
