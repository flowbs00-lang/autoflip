import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { legalStatus, recordLegalAcceptance } from "../../_lib/legal.js";
import { getSession } from "../../_lib/session.js";

async function requireSession(context) {
  if (!context.env.DB) throw new RequestError("database_not_configured", 503);
  const session = await getSession(context.env.DB, context.request);
  if (!session) throw new RequestError("authentication_required", 401);
  return session;
}

export async function onRequestGet(context) {
  try {
    const session = await requireSession(context);
    return json({ ok: true, legal: await legalStatus(context.env.DB, session.id) });
  } catch (error) {
    return handleError(error);
  }
}

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    const session = await requireSession(context);
    const body = await readJson(context.request, 8_192);
    await recordLegalAcceptance(context.env.DB, session.id, body.legal);
    return json({ ok: true, legal: await legalStatus(context.env.DB, session.id) });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["GET", "POST"]);
}
