import { handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { ensureStoreSchema, reconcileOrderPayment } from "../../_lib/store.js";

export async function onRequestPost(context) {
  try {
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    const body = await readJson(context.request, 64_000);
    if (body.type !== "notification" || !body.object?.id || !String(body.event || "").startsWith("payment.")) {
      throw new RequestError("invalid_notification", 400);
    }
    await ensureStoreSchema(context.env.DB);
    const order = await context.env.DB.prepare("SELECT * FROM store_orders WHERE yookassa_payment_id = ? LIMIT 1")
      .bind(body.object.id).first();
    if (!order) return json({ ok: true });
    await reconcileOrderPayment(context.env.DB, context.env, order);
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
