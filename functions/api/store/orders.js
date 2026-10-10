import { handleError, json, methodNotAllowed, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";
import { ensurePersonalAccountGrant, ensureStoreSchema, productByCode, reconcileOrderPayment } from "../../_lib/store.js";

function publicOrder(order) {
  const product = productByCode(order.product_code);
  return {
    id: order.id,
    productCode: order.product_code,
    title: product?.title || order.product_code,
    status: order.status,
    price: Number(order.amount_rub),
    customPayload: JSON.parse(order.custom_payload || "{}"),
    paidAt: Number(order.paid_at || 0),
    createdAt: Number(order.created_at || 0)
  };
}

export async function onRequestGet(context) {
  try {
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session?.nickname) throw new RequestError("authentication_required", 401);
    await ensureStoreSchema(context.env.DB);
    await ensurePersonalAccountGrant(context.env.DB, session.id);
    const orderId = new URL(context.request.url).searchParams.get("order");
    if (orderId) {
      let order = await context.env.DB.prepare("SELECT * FROM store_orders WHERE id = ? AND user_id = ? LIMIT 1").bind(orderId, session.id).first();
      if (!order) throw new RequestError("order_not_found", 404);
      if (order.status === "pending" && order.yookassa_payment_id) order = await reconcileOrderPayment(context.env.DB, context.env, order);
      return json({ ok: true, order: publicOrder(order) });
    }
    const rows = await context.env.DB.prepare(`SELECT * FROM store_orders WHERE user_id = ? AND status IN ('paid','pending') ORDER BY created_at DESC LIMIT 50`)
      .bind(session.id).all();
    return json({ ok: true, orders: (rows.results || []).map(publicOrder) });
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "GET") return onRequestGet(context);
  return methodNotAllowed(["GET"]);
}
