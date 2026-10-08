import { handleError, json, methodNotAllowed } from "../_lib/http.js";
import { getSession } from "../_lib/session.js";
import { publicUser } from "../_lib/users.js";

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session) return json({ ok: true, authenticated: false });

    return json({
      ok: true,
      authenticated: true,
      needsNickname: !session.nickname,
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
