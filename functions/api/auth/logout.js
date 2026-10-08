import { assertSameOrigin, handleError, json, methodNotAllowed, RequestError } from "../../_lib/http.js";
import { clearSessionCookie, deleteSession } from "../../_lib/session.js";

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    await deleteSession(context.env.DB, context.request);
    return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
