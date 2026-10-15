import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { openDatabase } from "../server/db.js";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("SQLite adapter applies migrations and exposes the D1 methods used by the API", async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "autoflip-sqlite-"));
  const database = await openDatabase({
    filename: path.join(temporaryDirectory, "autoflip.sqlite3"),
    migrationsDirectory: path.join(projectDirectory, "cloudflare", "migrations")
  });

  try {
    const tables = await database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all();
    assert.ok(tables.results.some((row) => row.name === "users"));
    assert.ok(tables.results.some((row) => row.name === "game_saves"));
    assert.ok(tables.results.some((row) => row.name === "security_events"));

    const now = Date.now();
    const insert = await database.prepare(`INSERT INTO users
      (id, vk_user_id, nickname, first_name, last_name, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, '', '', '', ?, ?)`).bind("user-1", "vk-1", "Tester", now, now).run();
    assert.equal(insert.meta.changes, 1);
    assert.equal((await database.prepare("SELECT nickname FROM users WHERE id = ?").bind("user-1").first()).nickname, "Tester");
  } finally {
    database.close();
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
