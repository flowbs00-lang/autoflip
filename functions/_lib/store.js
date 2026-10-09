import { RequestError } from "./http.js";

export const STORE_PRODUCTS = Object.freeze({
  cash_200k: { code: "cash_200k", title: "200 000 ₽", description: "Игровые деньги", category: "money", price: 99, grant: { type: "money", amount: 200_000 } },
  cash_1m: { code: "cash_1m", title: "1 000 000 ₽", description: "Игровые деньги", category: "money", price: 349, grant: { type: "money", amount: 1_000_000 }, badge: "Выгодно" },
  cash_2m: { code: "cash_2m", title: "2 000 000 ₽", description: "Игровые деньги", category: "money", price: 599, grant: { type: "money", amount: 2_000_000 }, badge: "Максимум" },
  plate_cool: { code: "plate_cool", title: "Крутой номер", description: "Случайный номер тайной редкости", category: "plates", price: 249, grant: { type: "plate", mode: "cool" } },
  plate_custom: { code: "plate_custom", title: "Свой номер", description: "Выбери буквы, цифры и регион", category: "plates", price: 699, grant: { type: "plate", mode: "custom" }, badge: "Конструктор" },
  buyers_1d: { code: "buyers_1d", title: "Быстрые покупатели · сутки", description: "Покупатели пишут в 2 раза быстрее", category: "boosts", price: 99, grant: { type: "fast_buyers", durationMs: 86_400_000 } },
  buyers_7d: { code: "buyers_7d", title: "Быстрые покупатели · 7 дней", description: "Покупатели пишут в 2 раза быстрее", category: "boosts", price: 349, grant: { type: "fast_buyers", durationMs: 604_800_000 }, badge: "Популярное" },
  buyers_30d: { code: "buyers_30d", title: "Быстрые покупатели · 30 дней", description: "Покупатели пишут в 2 раза быстрее", category: "boosts", price: 899, grant: { type: "fast_buyers", durationMs: 2_592_000_000 }, badge: "Лучший выбор" },
  garage_5: { code: "garage_5", title: "Гараж 5 уровня", description: "Мгновенно открыть уровень и автосервис", category: "garage", price: 790, grant: { type: "garage", level: 5 } },
  garage_10: { code: "garage_10", title: "Гараж 10 уровня", description: "Максимальный уровень гаража", category: "garage", price: 1490, grant: { type: "garage", level: 10 }, badge: "Максимум" }
});

const LETTERS = "АВЕКМНОРСТУХ";
const REGIONS = Object.freeze({
  "77":"Москва","97":"Москва","799":"Москва","78":"Санкт-Петербург","98":"Санкт-Петербург","178":"Санкт-Петербург",
  "52":"Нижний Новгород","152":"Нижний Новгород","66":"Екатеринбург","96":"Екатеринбург","196":"Екатеринбург","43":"Киров",
  "23":"Краснодар","93":"Краснодар","123":"Краснодар","59":"Пермь","81":"Пермь","159":"Пермь","39":"Калининград","91":"Калининград",
  "86":"Сургут","186":"Сургут","75":"Чита","80":"Чита","16":"Казань","116":"Казань","716":"Казань","25":"Владивосток",
  "125":"Владивосток","76":"Ярославль","61":"Ростов","161":"Ростов","761":"Ростов","05":"Махачкала","02":"Уфа","102":"Уфа",
  "702":"Уфа","36":"Воронеж","136":"Воронеж","56":"Оренбург","69":"Тверь","63":"Самара","163":"Самара","763":"Самара"
});

let schemaReady = false;

export async function ensureStoreSchema(db) {
  if (schemaReady) return;
  await db.batch([
    db.prepare(`CREATE TABLE IF NOT EXISTS store_orders (
      id TEXT PRIMARY KEY,
      client_token TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      product_code TEXT NOT NULL,
      amount_rub INTEGER NOT NULL,
      custom_payload TEXT NOT NULL DEFAULT '{}',
      yookassa_payment_id TEXT UNIQUE,
      status TEXT NOT NULL DEFAULT 'creating',
      created_at INTEGER NOT NULL,
      paid_at INTEGER,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )`),
    db.prepare("CREATE INDEX IF NOT EXISTS store_orders_user_idx ON store_orders(user_id, created_at DESC)"),
    db.prepare("CREATE INDEX IF NOT EXISTS store_orders_payment_idx ON store_orders(yookassa_payment_id)")
  ]);
  schemaReady = true;
}

export function publicCatalog() {
  return Object.values(STORE_PRODUCTS).map(({ grant, ...product }) => product);
}

export function productByCode(code) {
  return STORE_PRODUCTS[String(code || "")] || null;
}

export function validateCustomPlate(value) {
  const number = String(value?.number || "").trim().toUpperCase().replaceAll(" ", "");
  const region = String(value?.region || "").trim();
  if (!new RegExp(`^[${LETTERS}]\\d{3}[${LETTERS}]{2}$`, "u").test(number)) throw new RequestError("invalid_plate", 400);
  if (!REGIONS[region]) throw new RequestError("invalid_plate_region", 400);
  return { number, region, city: REGIONS[region] };
}

function purchasedPlate(order, mode, payload) {
  const regionCodes = Object.keys(REGIONS);
  let number;
  let region;
  if (mode === "custom") {
    const custom = validateCustomPlate(payload);
    number = custom.number;
    region = custom.region;
  } else {
    const digits = ["111","222","333","444","555","666","888","999"];
    const seed = order.id.replaceAll("-", "");
    const first = LETTERS[Number.parseInt(seed.slice(0, 2), 16) % LETTERS.length];
    number = first + digits[Number.parseInt(seed.slice(2, 4), 16) % digits.length] + first + first;
    region = regionCodes[Number.parseInt(seed.slice(-2), 16) % regionCodes.length];
  }
  return {
    id: `store-${order.id}`,
    number,
    region: { code: region, city: REGIONS[region], country: "Россия" },
    rarity: "secret",
    value: 500_000,
    createdAt: Number(order.paid_at || Date.now()),
    attachedCarId: null,
    premium: true
  };
}

export function applyStoreOrder(state, order) {
  const product = productByCode(order.product_code);
  if (!product || !state || typeof state !== "object") return false;
  if (!state.store || typeof state.store !== "object") state.store = {};
  if (!Array.isArray(state.store.appliedOrderIds)) state.store.appliedOrderIds = [];
  if (state.store.appliedOrderIds.includes(order.id)) return false;
  const grant = product.grant;
  if (grant.type === "money") state.money = Number(state.money || 0) + grant.amount;
  if (grant.type === "fast_buyers") {
    const base = Math.max(Date.now(), Number(state.store.fastBuyersUntil || 0));
    state.store.fastBuyersUntil = base + grant.durationMs;
  }
  if (grant.type === "garage") {
    if (!state.garageProgress || typeof state.garageProgress !== "object") state.garageProgress = {};
    state.garageProgress.level = Math.max(Number(state.garageProgress.level || state.garageLevel || 1), grant.level);
    state.garageLevel = state.garageProgress.level;
  }
  if (grant.type === "plate") {
    if (!state.plates || typeof state.plates !== "object") state.plates = { items: [], nextId: 1 };
    if (!Array.isArray(state.plates.items)) state.plates.items = [];
    const payload = JSON.parse(order.custom_payload || "{}");
    const plate = purchasedPlate(order, grant.mode, payload);
    if (!state.plates.items.some((item) => item.id === plate.id)) state.plates.items.unshift(plate);
  }
  state.store.appliedOrderIds.push(order.id);
  state.store.appliedOrderIds = state.store.appliedOrderIds.slice(-200);
  if (!Array.isArray(state.store.history)) state.store.history = [];
  state.store.history.unshift({ id: order.id, productCode: order.product_code, title: product.title, paidAt: Number(order.paid_at || Date.now()) });
  state.store.history = state.store.history.slice(0, 30);
  return true;
}

export async function applyPaidOrdersToState(db, userId, state) {
  await ensureStoreSchema(db);
  const rows = await db.prepare(`SELECT id, product_code, custom_payload, paid_at
    FROM store_orders WHERE user_id = ? AND status = 'paid' ORDER BY paid_at ASC LIMIT 200`).bind(userId).all();
  let changed = false;
  for (const order of rows.results || []) changed = applyStoreOrder(state, order) || changed;
  return changed;
}

export function paymentsConfigured(env) {
  return Boolean(env.YOOKASSA_SHOP_ID && env.YOOKASSA_SECRET_KEY);
}

export async function fetchYooPayment(env, paymentId) {
  if (!paymentsConfigured(env)) throw new RequestError("payments_not_configured", 503);
  const response = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Basic ${btoa(`${env.YOOKASSA_SHOP_ID}:${env.YOOKASSA_SECRET_KEY}`)}` }
  });
  if (!response.ok) throw new RequestError("payment_provider_error", 502);
  return response.json();
}

export async function reconcileOrderPayment(db, env, order) {
  if (!order?.yookassa_payment_id) return order;
  const payment = await fetchYooPayment(env, order.yookassa_payment_id);
  const expected = `${Number(order.amount_rub).toFixed(2)}`;
  const valid = payment.id === order.yookassa_payment_id
    && payment.amount?.currency === "RUB"
    && payment.amount?.value === expected
    && payment.metadata?.order_id === order.id
    && payment.metadata?.user_id === order.user_id
    && payment.metadata?.product_code === order.product_code;
  if (!valid) throw new RequestError("payment_mismatch", 409);
  const nextStatus = payment.status === "succeeded" && payment.paid ? "paid" : payment.status === "canceled" ? "canceled" : "pending";
  const now = Date.now();
  await db.prepare(`UPDATE store_orders SET status = ?, paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, ?) ELSE paid_at END,
    updated_at = ? WHERE id = ?`).bind(nextStatus, nextStatus, now, now, order.id).run();
  return { ...order, status: nextStatus, paid_at: nextStatus === "paid" ? Number(order.paid_at || now) : order.paid_at };
}
