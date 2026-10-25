import assert from "node:assert/strict";
import test from "node:test";
import { auxiliaryResult, authoritativeCondition, meetingResult } from "../functions/_lib/economy-rules.js";

test("car condition is server-deterministic and purchase result ignores client condition fields", async () => {
  const listing = { id: 7, listingId: "listing-7", name: "Lada Vesta", city: "Киров", year: 2020, km: 70000, price: 700000, market: 800000, flipCondition: { healthy: true, cost: 0 } };
  const state = { money: 900000, garageLevel: 1, cars: [], marketListings: [listing] };
  const meeting = { kind: "seller_purchase", city: "Киров" };
  const transaction = { type: "purchase", amount: 650000, payload: { sourceId: "listing-7", car: "Lada Vesta" } };
  const first = await meetingResult(state, meeting, transaction);
  const second = await meetingResult(state, meeting, transaction);
  assert.deepEqual(first, second);
  assert.equal(first.moneyDelta, -650000);
  assert.equal(first.addCar.buy, 650000);
  assert.equal(first.addCar.flipCondition.name, first.condition.name);
  assert.equal(first.addCar.flipCondition.cost, first.condition.cost);
  assert.equal(first.addCar.flipCondition.repaired, first.condition.healthy);
});

test("transport, diagnostics and repairs use server-calculated costs", async () => {
  const trip = await auxiliaryResult({ city: "Киров", money: 100000 }, {
    type: "transport", amount: 1400, payload: { sourceId: "perm:train", city: "Пермь" }
  });
  assert.equal(trip.from, "Киров");
  assert.equal(trip.to, "Пермь");
  assert.equal(trip.moneyDelta, -1400);

  const listing = { listingId: "listing-diag", name: "Ford Focus", market: 300000, price: 260000 };
  const state = { money: 500000, marketListings: [listing], meetings: [{ id: "meet-diag", sourceId: listing.listingId, status: "scheduled" }] };
  const diagnostic = await auxiliaryResult(state, {
    type: "diagnostic", amount: 100000, payload: { sourceId: "diagnostic:meet-diag:full" }
  });
  assert.equal(diagnostic.moneyDelta, -100000);
  assert.equal(diagnostic.diagnostic.mode, "full");
  assert.equal(diagnostic.diagnostic.healthyConfirmed, diagnostic.condition.healthy);

  const condition = await authoritativeCondition({ market: 500000, restorationProject: true, repair: 80000, risk: "Кузов" }, "repair-car");
  const repair = await auxiliaryResult({ money: 100000, cars: [{ _garageId: "repair-car", name: "Project", market: 420000, healthyMarket: 500000, flipCondition: { ...condition, repaired: false } }] }, {
    type: "repair", amount: 80000, payload: { sourceId: "repair-car" }
  });
  assert.equal(repair.moneyDelta, -80000);
  assert.equal(repair.healthyMarket, 500000);
});

test("limited demand rejects a sale above the server cap", async () => {
  const car = { _garageId: "sale-car", name: "Toyota Camry", market: 1000000, sale: 1000000, buy: 800000 };
  const state = { day: 12, cars: [car], activeListings: [{ id: "sale-listing", carKey: "sale-car", ask: 1000000, status: "active" }], economy: { soldModels: [{ model: car.name, day: 12 }, { model: car.name, day: 11 }, { model: car.name, day: 10 }] } };
  const meeting = { kind: "buyer_sale", payload: { listingId: "sale-listing" } };
  await assert.rejects(meetingResult(state, meeting, { type: "sale", amount: 1100000, payload: { sourceId: "buyer", car: car.name } }), (error) => error.code === "invalid_transaction_amount");
});
