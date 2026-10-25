import { RequestError } from "./http.js";

const GARAGE_SLOTS = [0, 2, 3, 3, 4, 4, 5, 5, 5, 6, 7];
const FAULTS = [
  ["Двигатель", .35, 5], ["Коробка передач", .25, 7], ["Рулевая рейка", .20, 10],
  ["Подвеска", .15, 15], ["Тормозные диски и колодки", .05, 30], ["Мелкая неисправность", .02, 40]
];
const CITIES = [
  ["moscow", "Москва", 55.7558, 37.6173], ["spb", "Санкт-Петербург", 59.9343, 30.3351],
  ["nizhny", "Нижний Новгород", 56.2965, 43.9361], ["ekb", "Екатеринбург", 56.8389, 60.6057],
  ["kirov", "Киров", 58.6036, 49.6680], ["krasnodar", "Краснодар", 45.0355, 38.9753],
  ["perm", "Пермь", 58.0105, 56.2502], ["kaliningrad", "Калининград", 54.7104, 20.4522],
  ["surgut", "Сургут", 61.2540, 73.3962], ["chita", "Чита", 52.0340, 113.4994],
  ["kazan", "Казань", 55.7961, 49.1064], ["vladivostok", "Владивосток", 43.1155, 131.8855],
  ["yaroslavl", "Ярославль", 57.6261, 39.8845], ["rostov", "Ростов", 47.2357, 39.7015],
  ["makhachkala", "Махачкала", 42.9849, 47.5047], ["ufa", "Уфа", 54.7388, 55.9721],
  ["voronezh", "Воронеж", 51.6608, 39.2003], ["orenburg", "Оренбург", 51.7682, 55.0969],
  ["tver", "Тверь", 56.8587, 35.9176], ["samara", "Самара", 53.1959, 50.1002]
].map(([id, name, lat, lon]) => ({ id, name, lat, lon }));
const TRANSPORTS = {
  taxi: { rate: 18, min: 1500, speed: 78, extra: 0 }, train: { rate: 3.2, min: 900, speed: 72, extra: 120 },
  plane: { rate: 6.5, min: 4500, speed: 720, extra: 180 }, minibus: { rate: 5, min: 800, speed: 62, extra: 60 }
};

const list = (value) => Array.isArray(value) ? value : [];
const round = (value) => Math.round(Number(value || 0));
const round1000 = (value) => Math.max(10_000, Math.round(Number(value || 0) / 1000) * 1000);
export const economyCarKey = (car) => String(car?._garageId || car?.listingId || car?.sourceListingId || [car?.id, car?.name, car?.year, car?.buy].join("|"));

function city(value) { return CITIES.find((item) => item.id === value || item.name === value); }
function radians(value) { return value * Math.PI / 180; }
function distance(a, b) {
  const earth = 6371, dLat = radians(b.lat - a.lat), dLon = radians(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(radians(a.lat)) * Math.cos(radians(b.lat)) * Math.sin(dLon / 2) ** 2;
  return Math.max(40, Math.round(earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 1.12 / 10) * 10);
}

async function unit(seed, offset = 0) {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${seed}:${offset}`)));
  return ((bytes[0] << 24) >>> 0 | bytes[1] << 16 | bytes[2] << 8 | bytes[3]) / 0xffffffff;
}

export async function authoritativeCondition(car, sourceId, forceFault = false) {
  const healthyMarket = Math.max(10_000, round(car?.marketHealthyValue || car?.healthyMarket || car?.market || car?.sale || car?.price || 50_000));
  if (car?.restorationProject) {
    const cost = Math.max(1, round(car.repair || healthyMarket * .25));
    const loss = Math.min(.48, Math.max(.12, cost / healthyMarket));
    return { healthy: false, name: String(car.risk || car.damageSummary || "Кузов под восстановление").slice(0, 100), loss, cost, healthyMarket };
  }
  if (!forceFault && await unit(sourceId, 0) < .60) return { healthy: true, name: "Исправный автомобиль", loss: 0, cost: 0, healthyMarket };
  let pick = await unit(sourceId, 1) * FAULTS.reduce((sum, item) => sum + item[2], 0), selected = FAULTS.at(-1);
  for (const fault of FAULTS) { pick -= fault[2]; if (pick <= 0) { selected = fault; break; } }
  return { healthy: false, name: selected[0], loss: selected[1], cost: Math.max(1, round(healthyMarket * selected[1])), healthyMarket };
}

function marketListing(state, sourceId) {
  return list(state.marketListings).find((car) => String(car?.listingId || car?.id) === String(sourceId) && car?.marketActive !== false) || null;
}
function ownedCar(state, key) { return list(state.cars).find((car) => economyCarKey(car) === String(key)) || null; }
function activeListingCar(state, listingId) {
  const listing = list(state.activeListings).find((item) => item?.id === listingId && item.status === "active");
  return listing ? ownedCar(state, listing.carKey) : null;
}
function criticalCar(car, buy, sourceId, condition, cityName) {
  const healthyMarket = condition.healthyMarket;
  const market = condition.healthy ? healthyMarket : Math.max(10_000, round(healthyMarket * (1 - condition.loss)));
  return {
    name: String(car?.name || "").slice(0, 100), year: round(car?.year), km: round(car?.km), body: String(car?.body || "").slice(0, 50),
    city: String(cityName || car?.city || "").slice(0, 80), buy: round(buy), price: round(car?.price || buy), basePrice: round(car?.basePrice || car?.price || buy),
    market, sale: market, listingId: String(car?.listingId || sourceId || "").slice(0, 120), sourceListingId: String(sourceId || car?.listingId || "").slice(0, 120),
    healthyMarket, flipCondition: { healthy: condition.healthy, name: condition.name, loss: condition.loss, cost: condition.cost, discovered: true, repaired: condition.healthy },
    flipConditionVersion: 2, repaired: condition.healthy, repairSpent: 0, acquisitionConditionFinalized: true, unplannedCost: 0, needsTow: false
  };
}

async function applyPostPurchaseRisk(result, meeting, sourceId) {
  if (!result?.addCar || result.condition?.healthy || meeting?.diagnostic?.mode === "full") return result;
  const factor = .08 + await unit(`${sourceId}:unplanned`, 3) * .12;
  result.addCar.unplannedCost = Math.max(3000, Math.round(result.condition.cost * factor / 1000) * 1000);
  result.addCar.needsTow = true;
  return result;
}

function saleLimit(state, car, meeting) {
  const market = Math.max(10_000, round(car?.market || car?.sale || car?.buy));
  const recent = list(state.economy?.soldModels).filter((item) => item?.model === car?.name && Number(item?.day || 0) >= Number(state.day || 1) - 7).length;
  const demand = [1.08, 1.04, .98, .92][Math.min(3, recent)] || .88;
  const listing = list(state.activeListings).find((item) => item?.id === meeting?.payload?.listingId);
  return round1000(Math.min(market * 1.12, Math.max(market * .70, Number(listing?.ask || market) * 1.02)) * demand);
}

export async function meetingResult(state, meeting, transaction) {
  const type = transaction.type, amount = transaction.amount, sourceId = transaction.payload.sourceId;
  if (type === "purchase") {
    const target = marketListing(state, sourceId);
    if (!target || String(target.name) !== transaction.payload.car) throw new RequestError("invalid_transaction_source", 409);
    const ask = Math.max(10_000, round(target.price));
    if (amount < round(ask * .70) || amount > ask) throw new RequestError("invalid_transaction_amount", 409);
    const slots = GARAGE_SLOTS[Math.max(1, Math.min(10, round(state.garageLevel || state.garageProgress?.level || 1)))];
    if (list(state.cars).length >= slots || Number(state.money || 0) < amount) throw new RequestError("purchase_not_available", 409);
    const unchecked = !meeting.diagnostic, condition = await authoritativeCondition(target, sourceId, unchecked && Number(state.conditionLuck?.healthyStreak || 0) >= 2);
    return applyPostPurchaseRisk({ version: 1, moneyDelta: -amount, addCar: criticalCar(target, amount, sourceId, condition, meeting.city), removeCarKey: "", condition, conditionLuck: { healthyStreak: unchecked && condition.healthy ? Number(state.conditionLuck?.healthyStreak || 0) + 1 : 0, total: Number(state.conditionLuck?.total || 0) + 1 } }, meeting, sourceId);
  }
  if (type === "sale") {
    const car = activeListingCar(state, meeting?.payload?.listingId);
    if (!car || String(car.name) !== transaction.payload.car) throw new RequestError("invalid_transaction_source", 409);
    if (amount < 10_000 || amount > saleLimit(state, car, meeting)) throw new RequestError("invalid_transaction_amount", 409);
    return { version: 1, moneyDelta: amount, addCar: null, removeCarKey: economyCarKey(car), demandLimit: saleLimit(state, car, meeting) };
  }
  if (type === "exchange") {
    if (meeting.kind === "seller_trade") {
      const deal = meeting.payload?.tradeDeal, own = ownedCar(state, deal?.ownKey), target = marketListing(state, sourceId);
      if (!deal || !own || !target || String(target.name) !== transaction.payload.car) throw new RequestError("invalid_transaction_source", 409);
      const purchasePrice = round(deal.purchasePrice), valuation = round(deal.valuation), ownMarket = Math.max(10_000, round(own.market || own.sale || own.buy));
      if (amount !== purchasePrice || purchasePrice < round(target.price * .70) || purchasePrice > round(target.price) || valuation > round1000(ownMarket * 1.02)) throw new RequestError("invalid_transaction_amount", 409);
      const delta = -(purchasePrice - valuation); if (delta < 0 && Number(state.money || 0) < -delta) throw new RequestError("exchange_not_available", 409);
      const unchecked = !meeting.diagnostic, condition = await authoritativeCondition(target, sourceId, unchecked && Number(state.conditionLuck?.healthyStreak || 0) >= 2);
      return applyPostPurchaseRisk({ version: 1, moneyDelta: delta, addCar: criticalCar(target, purchasePrice, sourceId, condition, meeting.city), removeCarKey: economyCarKey(own), condition, conditionLuck: { healthyStreak: unchecked && condition.healthy ? Number(state.conditionLuck?.healthyStreak || 0) + 1 : 0, total: Number(state.conditionLuck?.total || 0) + 1 } }, meeting, sourceId);
    }
    const buyer = list(state.buyerInbox).find((item) => item?.id === sourceId), own = activeListingCar(state, meeting?.payload?.listingId);
    if (!buyer?.trade || !buyer.tradeCar || !own || String(own.name) !== transaction.payload.car) throw new RequestError("invalid_transaction_source", 409);
    const ownValue = round(buyer.offer), targetValue = round(buyer.tradeValue), maximum = saleLimit(state, own, meeting);
    if (amount !== ownValue || ownValue > maximum || targetValue < 10_000 || targetValue > round1000(Number(buyer.tradeCar.market || targetValue) * 1.05)) throw new RequestError("invalid_transaction_amount", 409);
    const delta = ownValue - targetValue; if (delta < 0 && Number(state.money || 0) < -delta) throw new RequestError("exchange_not_available", 409);
    const condition = await authoritativeCondition(buyer.tradeCar, `buyer:${sourceId}`, Number(state.conditionLuck?.healthyStreak || 0) >= 2);
    return applyPostPurchaseRisk({ version: 1, moneyDelta: delta, addCar: criticalCar(buyer.tradeCar, targetValue, `buyer:${sourceId}`, condition, meeting.city), removeCarKey: economyCarKey(own), condition, conditionLuck: { healthyStreak: condition.healthy ? Number(state.conditionLuck?.healthyStreak || 0) + 1 : 0, total: Number(state.conditionLuck?.total || 0) + 1 } }, meeting, `buyer:${sourceId}`);
  }
  throw new RequestError("invalid_transaction_type", 409);
}

export async function auxiliaryResult(state, transaction) {
  const source = String(transaction.payload.sourceId || "");
  if (transaction.type === "transport") {
    const [toValue, transportId] = source.split(":"); const from = city(state.city), to = city(toValue), transport = TRANSPORTS[transportId];
    if (!from || !to || !transport || from.name === to.name || transaction.payload.city !== to.name) throw new RequestError("invalid_transaction_source", 409);
    const km = distance(from, to), cost = Math.max(transport.min, Math.round(km * transport.rate / 100) * 100), minutes = Math.max(45, Math.round((km / transport.speed * 60 + transport.extra) / 10) * 10);
    if (transaction.amount !== cost || Number(state.money || 0) < cost) throw new RequestError("invalid_transaction_amount", 409);
    return { version: 1, moneyDelta: -cost, from: from.name, to: to.name, transportId, km, minutes };
  }
  if (transaction.type === "diagnostic") {
    const [, meetingId, mode] = source.split(":"), meeting = list(state.meetings).find((item) => item?.id === meetingId && item.status === "scheduled");
    const car = meeting && marketListing(state, meeting.sourceId); if (!meeting || !car || !["standard", "full"].includes(mode)) throw new RequestError("invalid_transaction_source", 409);
    const market = Math.max(10_000, Number(car.market || car.price || 0)), cost = mode === "full" ? Math.floor(market / 3) : Math.floor(market * .10);
    if (transaction.amount !== cost || Number(state.money || 0) < cost) throw new RequestError("invalid_transaction_amount", 409);
    const condition = await authoritativeCondition(car, meeting.sourceId), found = !condition.healthy && (mode === "full" || await unit(`${meeting.sourceId}:diagnostic`, 2) < .30);
    return { version: 1, moneyDelta: -cost, meetingId, mode, condition, diagnostic: { kind: "diagnostic-v2", mode, cost, found, healthyConfirmed: mode === "full" && condition.healthy, faultName: found ? condition.name : "", faultCost: found ? condition.cost : 0, loss: found ? condition.loss : 0 } };
  }
  if (transaction.type === "repair") {
    const car = ownedCar(state, source), condition = car?.flipCondition;
    const cost = Math.max(0, round(condition?.cost));
    if (!car || !condition || condition.healthy || condition.repaired || transaction.amount !== cost || Number(state.money || 0) < cost) throw new RequestError("repair_not_available", 409);
    return { version: 1, moneyDelta: -cost, carKey: source, cost, healthyMarket: Math.max(10_000, round(car.healthyMarket || car.market)) };
  }
  if (transaction.type === "car_cost") {
    const car = ownedCar(state, source), due = car ? round(Number(car.unplannedCost || 0) + (car.needsTow ? Math.max(5000, Math.round(Number(car.market || car.buy || 0) * .012 / 1000) * 1000) : 0)) : 0;
    if (!car || due <= 0 || transaction.amount !== due || Number(state.money || 0) < due) throw new RequestError("car_cost_not_available", 409);
    return { version: 1, moneyDelta: -due, carKey: source, cost: due };
  }
  throw new RequestError("invalid_transaction_source", 409);
}

export function resultSignature(result) {
  return JSON.stringify(result || null);
}
