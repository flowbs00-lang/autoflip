import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { onRequestPost as confirmEconomy } from "../functions/api/economy/confirm.js";
import { onRequestGet as listBackups, onRequestPost as restoreBackup } from "../functions/api/save/backups.js";
import { createSession } from "../functions/_lib/session.js";
import { openDatabase } from "../server/db.js";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "autoflip-economy-api-"));
  const db = await openDatabase({
    filename: path.join(directory, "autoflip.sqlite3"),
    migrationsDirectory: path.join(projectDirectory, "cloudflare", "migrations")
  });
  const now = Date.now();
  await db.prepare(`INSERT INTO users
    (id, vk_user_id, nickname, first_name, last_name, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, '', '', '', ?, ?)`)
    .bind("user-api", "vk-api", "ApiTester", now, now).run();
  const session = await createSession(db, "user-api");
  return {
    db,
    directory,
    request(url, body) {
      return new Request(url, {
        method: body === undefined ? "GET" : "POST",
        headers: {
          Cookie: `af_session=${session.token}`,
          ...(body === undefined ? {} : { "Content-Type": "application/json", Origin: "https://autoflip-game.ru" })
        },
        body: body === undefined ? undefined : JSON.stringify(body)
      });
    },
    async close() {
      db.close();
      await rm(directory, { recursive: true, force: true });
    }
  };
}

test("economy confirmation is prepared, committed and never committed twice", async () => {
  const f = await fixture();
  try {
    const save = {
      money: 100000,
      day: 2,
      cars: [{ _garageId: "car-sale-1", name: "ВАЗ 2106", market: 125000, sale: 125000, buy: 90000 }],
      activeListings: [{ id: "listing-sale-1", carKey: "car-sale-1", ask: 125000, status: "active" }],
      meetings: [{
        id: "test-123", status: "scheduled", kind: "buyer_sale", price: 125000,
        sourceId: "buyer-1", carName: "ВАЗ 2106", city: "Киров", payload: { listingId: "listing-sale-1" }
      }]
    };
    await f.db.prepare("INSERT INTO game_saves (user_id, revision, data_json, updated_at) VALUES (?, 1, ?, ?)")
      .bind("user-api", JSON.stringify(save), Date.now()).run();
    const transaction = {
      transactionId: "meeting:test-123",
      type: "sale",
      amount: 125000,
      clientId: "device-test-123",
      car: "ВАЗ 2106",
      city: "Киров",
      sourceId: "buyer-1",
      gameDay: 2
    };
    let response = await confirmEconomy({ request: f.request("https://autoflip-game.ru/api/economy/confirm", { ...transaction, phase: "prepare" }), env: { DB: f.db } });
    let payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.committed, false);

    response = await confirmEconomy({ request: f.request("https://autoflip-game.ru/api/economy/confirm", { ...transaction, phase: "commit" }), env: { DB: f.db } });
    payload = await response.json();
    assert.equal(payload.committed, true);
    assert.equal(payload.duplicate, false);

    response = await confirmEconomy({ request: f.request("https://autoflip-game.ru/api/economy/confirm", { ...transaction, phase: "commit" }), env: { DB: f.db } });
    payload = await response.json();
    assert.equal(payload.committed, true);
    assert.equal(payload.duplicate, true);
    const rows = await f.db.prepare("SELECT COUNT(*) AS count FROM economy_transactions WHERE user_id = ?").bind("user-api").first();
    assert.equal(rows.count, 1);
  } finally {
    await f.close();
  }
});

test("economy confirmation rejects a client-modified amount and source", async () => {
  const f = await fixture();
  try {
    const save = {
      meetings: [{
        id: "secure-456", status: "scheduled", kind: "seller_purchase", price: 240000,
        sourceId: "listing-9", carName: "Toyota Corolla", city: "Пермь"
      }]
    };
    await f.db.prepare("INSERT INTO game_saves (user_id, revision, data_json, updated_at) VALUES (?, 1, ?, ?)")
      .bind("user-api", JSON.stringify(save), Date.now()).run();
    const base = {
      transactionId: "meeting:secure-456", type: "purchase", amount: 9_999_999,
      clientId: "device-test-456", car: "Toyota Corolla", city: "Пермь",
      sourceId: "listing-9", gameDay: 1, phase: "prepare"
    };
    let response = await confirmEconomy({ request: f.request("https://autoflip-game.ru/api/economy/confirm", base), env: { DB: f.db } });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "invalid_transaction_amount");

    response = await confirmEconomy({ request: f.request("https://autoflip-game.ru/api/economy/confirm", { ...base, amount: 240000, sourceId: "listing-fake" }), env: { DB: f.db } });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "invalid_transaction_source");
    const rows = await f.db.prepare("SELECT COUNT(*) AS count FROM economy_transactions WHERE user_id = ?").bind("user-api").first();
    assert.equal(rows.count, 0);
  } finally {
    await f.close();
  }
});

test("server fixes the purchased car, condition, extra costs and result across retries", async () => {
  const f = await fixture();
  try {
    const listing = { id: 9, listingId: "listing-authority-9", name: "Toyota Corolla", city: "Пермь", year: 2017, km: 99000, body: "Седан", price: 240000, market: 300000, sale: 300000 };
    const save = {
      money: 500000, garageLevel: 1, cars: [], marketListings: [listing],
      meetings: [{ id: "authority-9", status: "scheduled", kind: "seller_purchase", price: 220000, sourceId: listing.listingId, carName: listing.name, city: listing.city, payload: { car: listing } }]
    };
    await f.db.prepare("INSERT INTO game_saves (user_id, revision, data_json, updated_at) VALUES (?, 1, ?, ?)")
      .bind("user-api", JSON.stringify(save), Date.now()).run();
    const request = { transactionId: "meeting:authority-9", type: "purchase", amount: 220000, clientId: "device-authority-9", car: listing.name, city: listing.city, sourceId: listing.listingId, gameDay: 1, phase: "prepare" };
    let response = await confirmEconomy({ request: f.request("https://autoflip-game.ru/api/economy/confirm", request), env: { DB: f.db } });
    const first = await response.json();
    assert.equal(response.status, 200);
    assert.equal(first.result.moneyDelta, -220000);
    assert.equal(first.result.addCar.name, listing.name);
    assert.equal(first.result.addCar.buy, 220000);
    assert.equal(first.result.addCar.sourceListingId, listing.listingId);
    assert.equal(first.result.addCar.acquisitionConditionFinalized, true);

    response = await confirmEconomy({ request: f.request("https://autoflip-game.ru/api/economy/confirm", request), env: { DB: f.db } });
    const repeated = await response.json();
    assert.deepEqual(repeated.result, first.result);

    response = await confirmEconomy({ request: f.request("https://autoflip-game.ru/api/economy/confirm", { ...request, amount: 245000 }), env: { DB: f.db } });
    assert.equal(response.status, 409);
  } finally {
    await f.close();
  }
});

test("rewards, loans and plate sales are checked against the cloud save", async () => {
  const f = await fixture();
  try {
    async function storeSave(state, revision) {
      await f.db.prepare(`INSERT INTO game_saves (user_id, revision, data_json, updated_at) VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET revision = excluded.revision, data_json = excluded.data_json, updated_at = excluded.updated_at`)
        .bind("user-api", revision, JSON.stringify(state), Date.now()).run();
    }
    async function prepare(body) {
      return confirmEconomy({ request: f.request("https://autoflip-game.ru/api/economy/confirm", {
        clientId: "device-protected-1", gameDay: 2, phase: "prepare", city: "Киров", car: "", ...body
      }), env: { DB: f.db } });
    }

    await storeSave({ economy: { goals: { daily: { day: 2, claimed: false, targets: [{ need: 1, value: 1 }] } } } }, 1);
    let response = await prepare({ transactionId: "reward:daily:2", type: "reward", amount: 125000, sourceId: "goal:daily:2" });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "invalid_transaction_amount");
    response = await prepare({ transactionId: "reward:daily:2", type: "reward", amount: 25000, sourceId: "goal:daily:2" });
    assert.equal(response.status, 200);

    await storeSave({ deals: 1, economy: { achievements: [] } }, 2);
    response = await prepare({ transactionId: "reward:achievement:first_deal", type: "reward", amount: 15000, sourceId: "goal:achievement:first_deal" });
    assert.equal(response.status, 200);

    await storeSave({ money: 100000, loan: 0, gameClock: { total: 500 }, bankCustomer: { rating: 50, onTimePayments: 0, totalIssued: 0, nextLoanAt: 0 } }, 3);
    response = await prepare({ transactionId: "loan:issue:25000:1", type: "loan_issue", amount: 500000, sourceId: "offer:500000:1" });
    assert.equal(response.status, 409);
    response = await prepare({ transactionId: "loan:issue:25000:1", type: "loan_issue", amount: 25000, sourceId: "offer:25000:1" });
    assert.equal(response.status, 200);

    await storeSave({ money: 60000, loan: 55000, bankCredit: { active: true, startedAt: 450 } }, 4);
    response = await prepare({ transactionId: "loan:repay:450", type: "loan_repay", amount: 55000, sourceId: "credit:450" });
    assert.equal(response.status, 200);

    await storeSave({ plates: { items: [{ id: "plate-one", number: "А111МР", value: 500000, region: { city: "Киров" } }] } }, 5);
    response = await prepare({ transactionId: "plate:sale:plate-one", type: "plate_sale", amount: 500000, sourceId: "plate-one", car: "А111МР" });
    assert.equal(response.status, 200);

    await storeSave({ plates: { items: [{ id: "premium-one", number: "А777АА", value: 500000, premium: true, tradable: false }] } }, 6);
    response = await prepare({ transactionId: "plate:sale:premium-one", type: "plate_sale", amount: 500000, sourceId: "premium-one", car: "А777АА" });
    assert.equal(response.status, 409);
    assert.equal((await response.json()).error, "plate_not_tradable");
  } finally {
    await f.close();
  }
});

test("server backup restore advances revision and preserves the replaced save", async () => {
  const f = await fixture();
  try {
    const now = Date.now();
    await f.db.prepare("INSERT INTO game_saves (user_id, revision, data_json, updated_at) VALUES (?, ?, ?, ?)")
      .bind("user-api", 3, JSON.stringify({ money: 300 }), now).run();
    await f.db.prepare("INSERT INTO game_save_backups (user_id, revision, data_json, created_at) VALUES (?, ?, ?, ?)")
      .bind("user-api", 2, JSON.stringify({ money: 200 }), now - 1000).run();

    let response = await listBackups({ request: f.request("https://autoflip-game.ru/api/save/backups"), env: { DB: f.db } });
    let payload = await response.json();
    assert.equal(payload.currentRevision, 3);
    assert.deepEqual(payload.backups.map((item) => item.revision), [2]);

    response = await restoreBackup({ request: f.request("https://autoflip-game.ru/api/save/backups", { revision: 2, currentRevision: 3 }), env: { DB: f.db } });
    payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.revision, 4);
    const current = await f.db.prepare("SELECT revision, data_json FROM game_saves WHERE user_id = ?").bind("user-api").first();
    assert.equal(current.revision, 4);
    assert.equal(JSON.parse(current.data_json).money, 200);
    const preserved = await f.db.prepare("SELECT data_json FROM game_save_backups WHERE user_id = ? AND revision = 3").bind("user-api").first();
    assert.equal(JSON.parse(preserved.data_json).money, 300);
  } finally {
    await f.close();
  }
});
