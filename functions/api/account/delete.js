import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { clearSessionCookie, getSession } from "../../_lib/session.js";
import { ensureSecuritySchema } from "../../_lib/security.js";
import { deleteAccountData } from "../../_lib/account-data.js";

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session) throw new RequestError("authentication_required", 401);
    const body = await readJson(context.request, 2048);
    if (String(body.confirmation || "") !== session.id) throw new RequestError("account_delete_confirmation_failed", 400);
    await ensureSecuritySchema(context.env.DB);
    await deleteAccountData(context.env.DB, session.id);
    return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie(), "Cache-Control": "no-store" });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
