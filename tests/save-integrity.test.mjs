import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { validateSaveIntegrity } from "../functions/_lib/save-integrity.js";
import { openDatabase } from "../server/db.js";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function state(overrides = {}) {
  return {
    money: 100_000,
    rep: 10,
    deals: 1,
    day: 2,
    loan: 0,
    garageLevel: 2,
    cars: [{ _garageId: "car-one", id: 1, name: "Lada", year: 2012, km: 100_000, buy: 80_000, price: 80_000, market: 120_000, sale: 120_000 }],
    plates: { items: [{ id: "plate-one", number: "А111АА", rarity: "rare", value: 20_000, region: { code: "43", city: "Киров" } }] },
    economy: { appliedIds: [] },
    meetings: [],
    _saveMeta: { version: 2, integrityVersion: 1, clientId: "device-integrity" },
    ...overrides
  };
}

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "autoflip-integrity-"));
  const db = await openDatabase({
    filename: path.join(directory, "autoflip.sqlite3"),
    migrationsDirectory: path.join(projectDirectory, "cloudflare", "migrations")
  });
  const now = Date.now();
  await db.prepare(`INSERT INTO users
    (id, vk_user_id, nickname, first_name, last_name, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, '', '', '', ?, ?)`)
    .bind("user-one", "vk-integrity", "IntegrityTester", now, now).run();
  return { db, directory, async close() { db.close(); await rm(directory, { recursive: true, force: true }); } };
}

test("first integrity pass seals an existing save without changing progress", async () => {
  const f = await fixture();
  try {
    const current = state();
    delete current._saveMeta.integrityVersion;
    const next = structuredClone(current);
    const result = await validateSaveIntegrity(f.db, "user-one", current, next);
    assert.equal(result.sealed, false);
    assert.equal(next._saveMeta.integrityVersion, 1);
    assert.equal(next.money, 100_000);
  } finally { await f.close(); }
});

test("sealed saves reject invented money, reputation, cars and plate values", async () => {
  const f = await fixture();
  try {
    const current = state();
    for (const [change, code] of [
      [(next) => { next.money += 1; }, "unconfirmed_money_increase"],
      [(next) => { next.rep += 1; }, "unconfirmed_reputation_increase"],
      [(next) => { next.cars.push({ _garageId: "fake", name: "Fake", buy: 1, market: 9_000_000, sale: 9_000_000 }); }, "unconfirmed_car_addition"],
      [(next) => { next.plates.items[0].value = 10_000_000; }, "plate_value_modified"],
      [(next) => { next.cars[0].sale = 9_000_000; }, "car_value_modified"]
    ]) {
      const next = structuredClone(current);
      change(next);
      await assert.rejects(validateSaveIntegrity(f.db, "user-one", current, next), (error) => error.code === code);
    }
  } finally { await f.close(); }
});

test("a prepared server sale allows its exact balance, reputation and fleet transition", async () => {
  const f = await fixture();
  try {
    const current = state({ meetings: [{ id: "sale-one", status: "scheduled" }] });
    await f.db.prepare(`INSERT INTO economy_transactions
      (user_id, transaction_id, type, amount, payload_json, created_at, status, client_id, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'prepared', ?, ?)`)
      .bind("user-one", "meeting:sale-one", "sale", 120_000, JSON.stringify({ car: "Lada", sourceId: "buyer-one" }), Date.now(), "device-integrity", Date.now()).run();
    const next = structuredClone(current);
    next.money += 120_000;
    next.rep += 20;
    next.deals += 1;
    next.cars = [];
    next.meetings[0].status = "completed";
    next.economy.appliedIds.push("meeting:sale-one");
    const result = await validateSaveIntegrity(f.db, "user-one", current, next);
    assert.equal(result.sealed, true);
    assert.equal(result.transactions, 1);
  } finally { await f.close(); }
});
