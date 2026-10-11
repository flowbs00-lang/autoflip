import { handleError, json, methodNotAllowed } from "../_lib/http.js";
import { getSession } from "../_lib/session.js";
import { publicUser } from "../_lib/users.js";
import { legalStatus } from "../_lib/legal.js";

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session) return json({ ok: true, authenticated: false });
    const legal = await legalStatus(context.env.DB, session.id);

    return json({
      ok: true,
      authenticated: true,
      needsNickname: !session.nickname,
      needsLegalConsent: !legal.requiredAccepted,
      legal,
      user: publicUser(session)
    });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return methodNotAllowed(["GET"]);
}
