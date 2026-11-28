import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { buildCredentialValues, ensurePasswordAuthSchema, normalizeUsername, replaceCredentials, validatePassword, verifyRecoveryCode } from "../../_lib/password-auth.js";
import { createSession } from "../../_lib/session.js";

const PLAYER_ID_PATTERN = /^AF-[A-Z2-9]{12}$/u;

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const body = await readJson(context.request, 4096);
    const playerId = String(body.playerId || "").toUpperCase().trim();
    if (!PLAYER_ID_PATTERN.test(playerId)) throw new RequestError("invalid_recovery", 401);
    const password = validatePassword(body.password);
    await ensurePasswordAuthSchema(context.env.DB);
    const current = await context.env.DB.prepare("SELECT * FROM auth_credentials WHERE user_id = ? LIMIT 1")
      .bind(playerId).first();
    if (!current || !await verifyRecoveryCode(current, body.recoveryCode)) {
      throw new RequestError("invalid_recovery", 401);
    }
    const username = current.username || normalizeUsername(body.username).normalized;
    const credentials = await buildCredentialValues({ username, password, accountType: "password" });
    await replaceCredentials(context.env.DB, playerId, credentials);
    await context.env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(playerId).run();
    const session = await createSession(context.env.DB, playerId);
    return json({ ok: true, recoveryCode: credentials.recoveryCode }, 200, { "Set-Cookie": session.cookie });
  } catch (error) {
    if (/unique|constraint/iu.test(String(error?.message || error))) return handleError(new RequestError("username_taken", 409));
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
