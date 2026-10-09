import { handleError, json, methodNotAllowed } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";
import { ensureStoreSchema, paymentsConfigured, publicCatalog } from "../../_lib/store.js";

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) return json({ ok: false, error: "database_not_configured" }, 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session?.nickname) return json({ ok: false, error: "authentication_required" }, 401);
    await ensureStoreSchema(context.env.DB);
    return json({ ok: true, products: publicCatalog(), paymentsEnabled: paymentsConfigured(context.env) });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return methodNotAllowed(["GET"]);
}
