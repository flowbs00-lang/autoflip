import { RequestError } from "./http.js";
import { plateIntegritySignature } from "./plate-cases.js";

export const SAVE_INTEGRITY_VERSION = 1;

const MAX_MONEY = 20_000_000_000;
const MAX_REPUTATION = 1_000_000;
const MAX_COUNTER = 1_000_000;
const MAX_CARS = 20;
const MAX_PLATES = 500;
const POSITIVE_TYPES = new Set(["sale", "exchange", "service", "reward", "loan_issue", "plate_sale"]);
const CAR_ADD_TYPES = new Set(["purchase", "exchange"]);
const CAR_REMOVE_TYPES = new Set(["sale", "exchange"]);
const PLATE_VALUES = Object.freeze({ ordinary: 1_000, unusual: 5_000, rare: 20_000, ultra: 100_000, secret: 500_000, priceless: 10_000_000 });
const PLATE_PATTERN = /^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}$/u;

function integer(value, min, max, code) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new RequestError(code, 409);
  return value;
}

function list(value) {
  return Array.isArray(value) ? value : [];
}

function carKey(car) {
  if (!car || typeof car !== "object") return "";
  return String(car._garageId || car.listingId || car.sourceListingId || [car.id, car.name, car.year, car.buy].join("|"));
}

function plateKey(plate) {
  return plate && typeof plate === "object" ? String(plate.id || "") : "";
}

function uniqueMap(items, keyFor, code) {
  const result = new Map();
  for (const item of items) {
    const key = keyFor(item);
    if (!key || result.has(key)) throw new RequestError(code, 409);
    result.set(key, item);
  }
  return result;
}

function appliedIds(state) {
  return new Set(list(state?.economy?.appliedIds).filter((id) => typeof id === "string" && id.length > 0 && id.length <= 160));
}

function plateOpeningIds(state) {
  return new Set(list(state?.plates?.appliedOpeningIds).filter((id) => typeof id === "string" && id.length > 0 && id.length <= 120));
}

function immutablePlateSignature(plate) {
  return JSON.stringify({
    number: plate?.number,
    region: plate?.region,
    rarity: plate?.rarity,
    value: plate?.value,
    premium: plate?.premium === true,
    tradable: plate?.tradable !== false
  });
}

function immutableCarSignature(car) {
  return JSON.stringify({
    id: car?.id,
    name: car?.name,
    year: car?.year,
    km: car?.km,
    buy: car?.buy,
    price: car?.price,
    basePrice: car?.basePrice,
    market: car?.market,
    sale: car?.sale,
    listingId: car?.listingId,
    sourceListingId: car?.sourceListingId
  });
}

function reputationAllowance(transactions) {
  return transactions.reduce((sum, item) => {
    if (item.type === "sale" || item.type === "exchange") return sum + 25;
    if (item.type === "purchase") return sum + 3;
    if (item.type === "service") return sum + 3;
    if (item.type === "reward") {
      if (item.amount === 125_000) return sum + 5;
      if (item.amount === 50_000) return sum + 2;
      if (item.amount === 25_000) return sum + 1;
    }
    return sum;
  }, 0);
}

function validateShape(state, strict) {
  integer(state.money, 0, MAX_MONEY, "invalid_money_balance");
  integer(Number(state.rep || 0), 0, MAX_REPUTATION, "invalid_reputation");
  integer(Number(state.deals || 0), 0, MAX_COUNTER, "invalid_deal_count");
  integer(Number(state.day || 1), 1, MAX_COUNTER, "invalid_game_day");
  integer(Number(state.loan || 0), 0, MAX_MONEY, "invalid_loan_balance");
  integer(Number(state.garageLevel || state.garageProgress?.level || 1), 1, 10, "invalid_garage_level");

  const cars = list(state.cars);
  const plates = list(state.plates?.items);
  if (cars.length > MAX_CARS) throw new RequestError("invalid_car_count", 409);
  if (plates.length > MAX_PLATES) throw new RequestError("invalid_plate_count", 409);
  if (strict) {
    uniqueMap(cars, carKey, "duplicate_car_id");
    uniqueMap(plates, plateKey, "duplicate_plate_id");
  }
}

async function preparedTransactions(db, userId, ids, clientId) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await db.prepare(`SELECT transaction_id, type, amount, payload_json, client_id, status
    FROM economy_transactions
    WHERE user_id = ? AND transaction_id IN (${placeholders})`).bind(userId, ...ids).all();
  const byId = new Map((rows.results || []).map((row) => [row.transaction_id, row]));
  return ids.map((id) => {
    const row = byId.get(id);
    if (!row || row.status !== "prepared" || row.client_id !== clientId) {
      throw new RequestError("unconfirmed_save_operation", 409);
    }
    return { ...row, amount: Math.round(Number(row.amount || 0)), payload: JSON.parse(row.payload_json || "{}") };
  });
}

async function preparedPlateOpenings(db, userId, ids, clientId) {
  if (!ids.length) return [];
  const placeholders = ids.map(() => "?").join(", ");
  const rows = await db.prepare(`SELECT opening_id, case_id, price, plate_json, client_id, status
    FROM plate_case_openings
    WHERE user_id = ? AND opening_id IN (${placeholders})`).bind(userId, ...ids).all();
  const byId = new Map((rows.results || []).map((row) => [row.opening_id, row]));
  return ids.map((id) => {
    const row = byId.get(id);
    if (!row || row.status !== "prepared" || row.client_id !== clientId) {
      throw new RequestError("unconfirmed_plate_opening", 409);
    }
    return { ...row, price: Number(row.price), plate: JSON.parse(row.plate_json) };
  });
}

function validateTransactionEffects(current, next, transactions, addedCars, removedCars, removedPlates) {
  const addedNames = new Set(addedCars.map((car) => String(car?.name || "")));
  const removedNames = new Set(removedCars.map((car) => String(car?.name || "")));
  const currentMeetings = new Map(list(current.meetings).map((meeting) => [String(meeting?.id || ""), meeting]));
  const nextMeetings = new Map(list(next.meetings).map((meeting) => [String(meeting?.id || ""), meeting]));

  for (const transaction of transactions) {
    const sourceId = String(transaction.payload?.sourceId || "");
    const carName = String(transaction.payload?.car || "");
    if (transaction.transaction_id.startsWith("meeting:")) {
      const meetingId = transaction.transaction_id.slice(8);
      if (currentMeetings.get(meetingId)?.status !== "scheduled" || nextMeetings.get(meetingId)?.status !== "completed") {
        throw new RequestError("invalid_save_operation_state", 409);
      }
    }
    if (transaction.type === "purchase" && (!addedCars.length || (carName && !addedNames.has(carName)))) {
      throw new RequestError("car_purchase_not_applied", 409);
    }
    if (transaction.type === "sale" && (!removedCars.length || (carName && !removedNames.has(carName)))) {
      throw new RequestError("car_sale_not_applied", 409);
    }
    if (transaction.type === "exchange" && (!addedCars.length || !removedCars.length)) {
      throw new RequestError("car_exchange_not_applied", 409);
    }
    if (transaction.type === "service") {
      const beforeJob = current.garageProgress?.activeServiceJob;
      if (!beforeJob || beforeJob.id !== sourceId || next.garageProgress?.activeServiceJob) {
        throw new RequestError("service_reward_not_applied", 409);
      }
    }
    if (transaction.type === "loan_issue" && !(Number(next.loan || 0) > Number(current.loan || 0))) {
      throw new RequestError("loan_issue_not_applied", 409);
    }
    if (transaction.type === "loan_repay" && !(Number(next.loan || 0) < Number(current.loan || 0))) {
      throw new RequestError("loan_repayment_not_applied", 409);
    }
    if (transaction.type === "plate_sale" && !removedPlates.some((plate) => plate.id === sourceId)) {
      throw new RequestError("plate_sale_not_applied", 409);
    }
  }
}

export async function validateSaveIntegrity(db, userId, current, next) {
  const sealed = Number(current?._saveMeta?.integrityVersion || 0) >= SAVE_INTEGRITY_VERSION;
  validateShape(next, sealed);
  next._saveMeta = { ...(next._saveMeta || {}), integrityVersion: SAVE_INTEGRITY_VERSION };
  if (!current || !sealed) return { sealed: false, transactions: 0 };

  const clientId = String(next._saveMeta?.clientId || "");
  if (!clientId || clientId.length > 160) throw new RequestError("invalid_save_client", 409);

  const currentApplied = appliedIds(current);
  const newTransactionIds = [...appliedIds(next)].filter((id) => !currentApplied.has(id));
  const transactions = await preparedTransactions(db, userId, newTransactionIds, clientId);
  const currentPlateOpenings = plateOpeningIds(current);
  const newPlateOpeningIds = [...plateOpeningIds(next)].filter((id) => !currentPlateOpenings.has(id));
  const plateOpenings = await preparedPlateOpenings(db, userId, newPlateOpeningIds, clientId);

  const currentCars = uniqueMap(list(current.cars), carKey, "duplicate_car_id");
  const nextCars = uniqueMap(list(next.cars), carKey, "duplicate_car_id");
  const addedCars = [...nextCars].filter(([key]) => !currentCars.has(key)).map(([, car]) => car);
  const removedCars = [...currentCars].filter(([key]) => !nextCars.has(key)).map(([, car]) => car);
  const allowedAdds = transactions.filter((item) => CAR_ADD_TYPES.has(item.type)).length;
  const allowedRemovals = transactions.filter((item) => CAR_REMOVE_TYPES.has(item.type)).length;
  if (addedCars.length > allowedAdds) throw new RequestError("unconfirmed_car_addition", 409);
  if (removedCars.length > allowedRemovals) throw new RequestError("unconfirmed_car_removal", 409);
  for (const [key, car] of nextCars) {
    const existing = currentCars.get(key);
    if (existing && immutableCarSignature(existing) !== immutableCarSignature(car)) {
      throw new RequestError("car_value_modified", 409);
    }
  }

  const dealIncrease = Number(next.deals || 0) - Number(current.deals || 0);
  const dealAllowance = transactions.filter((item) => CAR_ADD_TYPES.has(item.type) || CAR_REMOVE_TYPES.has(item.type)).length;
  if (dealIncrease > dealAllowance) throw new RequestError("unconfirmed_deal_count", 409);
  const repIncrease = Number(next.rep || 0) - Number(current.rep || 0);
  if (repIncrease > reputationAllowance(transactions)) throw new RequestError("unconfirmed_reputation_increase", 409);

  const currentPlates = uniqueMap(list(current.plates?.items), plateKey, "duplicate_plate_id");
  const nextPlates = uniqueMap(list(next.plates?.items), plateKey, "duplicate_plate_id");
  const addedPlates = [...nextPlates].filter(([key]) => !currentPlates.has(key)).map(([, plate]) => plate);
  const removedPlates = [...currentPlates].filter(([key]) => !nextPlates.has(key)).map(([, plate]) => plate);
  if (addedPlates.length !== plateOpenings.length) throw new RequestError("unconfirmed_plate_addition", 409);
  for (const opening of plateOpenings) {
    const added = addedPlates.find((plate) => plate?.openingId === opening.opening_id);
    if (!added || plateIntegritySignature(added) !== plateIntegritySignature(opening.plate)) {
      throw new RequestError("plate_opening_result_modified", 409);
    }
  }
  for (const [id, plate] of nextPlates) {
    const existing = currentPlates.get(id);
    if (existing) {
      if (immutablePlateSignature(existing) !== immutablePlateSignature(plate)) throw new RequestError("plate_value_modified", 409);
      continue;
    }
    if (plate.premium === true) throw new RequestError("unconfirmed_premium_plate", 409);
    if (!PLATE_PATTERN.test(String(plate.number || "")) || PLATE_VALUES[plate.rarity] !== Number(plate.value)) {
      throw new RequestError("invalid_plate_item", 409);
    }
  }

  const positiveAllowance = transactions
    .filter((item) => POSITIVE_TYPES.has(item.type))
    .reduce((sum, item) => sum + Math.max(0, item.amount), 0);
  const caseCost = plateOpenings.reduce((sum, item) => sum + Math.max(0, item.price), 0);
  const moneyIncrease = Number(next.money) - Number(current.money);
  if (moneyIncrease > positiveAllowance - caseCost) throw new RequestError("unconfirmed_money_increase", 409);

  validateTransactionEffects(current, next, transactions, addedCars, removedCars, removedPlates);
  return { sealed: true, transactions: transactions.length, plateOpenings: plateOpenings.length };
}
