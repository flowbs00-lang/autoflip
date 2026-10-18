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
