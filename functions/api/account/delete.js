import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { clearSessionCookie, getSession } from "../../_lib/session.js";
import { ensureSecuritySchema } from "../../_lib/security.js";

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session) throw new RequestError("authentication_required", 401);
    const body = await readJson(context.request, 2048);
    if (String(body.confirmation || "") !== session.id) throw new RequestError("account_delete_confirmation_failed", 400);
    await ensureSecuritySchema(context.env.DB);
    const accountSubject = `account:${session.id}`;
    await context.env.DB.batch([
      context.env.DB.prepare("DELETE FROM security_rate_windows WHERE subject = ?").bind(accountSubject),
      context.env.DB.prepare("DELETE FROM security_blocks WHERE subject = ?").bind(accountSubject),
      context.env.DB.prepare("DELETE FROM security_events WHERE subject = ? OR user_id = ?").bind(accountSubject, session.id),
      context.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(session.id)
    ]);
    return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie(), "Cache-Control": "no-store" });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
