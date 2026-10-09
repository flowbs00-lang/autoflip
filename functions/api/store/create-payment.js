import { assertSameOrigin, handleError, json, methodNotAllowed, readJson, RequestError } from "../../_lib/http.js";
import { getSession } from "../../_lib/session.js";
import { ensureStoreSchema, paymentsConfigured, productByCode, validateCustomPlate } from "../../_lib/store.js";

function validToken(value) {
  return /^[a-f0-9-]{20,64}$/iu.test(String(value || ""));
}

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(String(value || "")) && String(value).length <= 180;
}

export async function onRequestPost(context) {
  try {
    if (!assertSameOrigin(context.request)) throw new RequestError("origin_rejected", 403);
    if (!context.env.DB) throw new RequestError("database_not_configured", 503);
    if (!paymentsConfigured(context.env)) throw new RequestError("payments_not_configured", 503);
    const session = await getSession(context.env.DB, context.request);
    if (!session?.nickname) throw new RequestError("authentication_required", 401);
    const body = await readJson(context.request, 8_192);
    const product = productByCode(body.productCode);
    if (!product) throw new RequestError("unknown_product", 404);
    if (!validToken(body.clientToken)) throw new RequestError("invalid_client_token", 400);
    if (!validEmail(body.email)) throw new RequestError("invalid_email", 400);
    const custom = product.grant.type === "plate" && product.grant.mode === "custom" ? validateCustomPlate(body.customPlate) : {};
    await ensureStoreSchema(context.env.DB);

    const existing = await context.env.DB.prepare("SELECT * FROM store_orders WHERE client_token = ? AND user_id = ? LIMIT 1")
      .bind(body.clientToken, session.id).first();
    if (existing?.yookassa_payment_id) {
      const payment = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(existing.yookassa_payment_id)}`, {
        headers: { Authorization: `Basic ${btoa(`${context.env.YOOKASSA_SHOP_ID}:${context.env.YOOKASSA_SECRET_KEY}`)}` }
      });
      const data = payment.ok ? await payment.json() : null;
      return json({ ok: true, orderId: existing.id, confirmationUrl: data?.confirmation?.confirmation_url || null, status: existing.status });
    }

    const orderId = crypto.randomUUID();
    const now = Date.now();
    const recent = await context.env.DB.prepare(`SELECT COUNT(*) AS total FROM store_orders
      WHERE user_id = ? AND status IN ('creating','pending') AND created_at > ?`).bind(session.id, now - 600_000).first();
    if (Number(recent?.total || 0) >= 5) throw new RequestError("too_many_pending_orders", 429);
    if (product.grant.type === "garage") {
      const owned = await context.env.DB.prepare("SELECT id FROM store_orders WHERE user_id = ? AND product_code = ? AND status = 'paid' LIMIT 1")
        .bind(session.id, product.code).first();
      if (owned) throw new RequestError("already_owned", 409);
    }
    await context.env.DB.prepare(`INSERT INTO store_orders
      (id, client_token, user_id, product_code, amount_rub, custom_payload, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'creating', ?, ?)`)
      .bind(orderId, body.clientToken, session.id, product.code, product.price, JSON.stringify(custom), now, now).run();

    const origin = new URL(context.request.url).origin;
    const paymentBody = {
      amount: { value: product.price.toFixed(2), currency: "RUB" },
      capture: true,
      confirmation: { type: "redirect", return_url: `${origin}/app/?store=return&order=${encodeURIComponent(orderId)}` },
      description: `AutoFlip: ${product.title}`.slice(0, 128),
      metadata: { order_id: orderId, user_id: session.id, product_code: product.code }
    };
    if (context.env.YOOKASSA_RECEIPTS_ENABLED === "true") {
      paymentBody.receipt = {
        customer: { email: String(body.email).trim() },
        items: [{
          description: product.title.slice(0, 128),
          quantity: "1.00",
          amount: { value: product.price.toFixed(2), currency: "RUB" },
          vat_code: Number(context.env.YOOKASSA_VAT_CODE || 1),
          payment_mode: "full_payment",
          payment_subject: "service"
        }]
      };
    }
    const response = await fetch("https://api.yookassa.ru/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${context.env.YOOKASSA_SHOP_ID}:${context.env.YOOKASSA_SECRET_KEY}`)}`,
        "Content-Type": "application/json",
        "Idempotence-Key": orderId
      },
      body: JSON.stringify(paymentBody)
    });
    if (!response.ok) {
      await context.env.DB.prepare("UPDATE store_orders SET status = 'error', updated_at = ? WHERE id = ?").bind(Date.now(), orderId).run();
      throw new RequestError("payment_provider_error", 502);
    }
    const payment = await response.json();
    if (!payment.id || !payment.confirmation?.confirmation_url) throw new RequestError("payment_provider_error", 502);
    await context.env.DB.prepare(`UPDATE store_orders SET yookassa_payment_id = ?, status = 'pending', updated_at = ? WHERE id = ?`)
      .bind(payment.id, Date.now(), orderId).run();
    return json({ ok: true, orderId, confirmationUrl: payment.confirmation.confirmation_url, status: "pending" }, 201);
  } catch (error) {
    return handleError(error);
  }
}

export function onRequest(context) {
  if (context.request.method === "POST") return onRequestPost(context);
  return methodNotAllowed(["POST"]);
}
