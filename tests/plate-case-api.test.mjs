import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { onRequestPost as openPlateCase } from "../functions/api/plates/open.js";
import { PLATE_CASES, PLATE_RARITIES, generatePlate, rollPlateRarity } from "../functions/_lib/plate-cases.js";
import { validateSaveIntegrity } from "../functions/_lib/save-integrity.js";
import { createSession } from "../functions/_lib/session.js";
import { openDatabase } from "../server/db.js";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function fixture(state = { money: 200_000, garageLevel: 10, plates: { items: [], appliedOpeningIds: [] } }) {
  const directory = await mkdtemp(path.join(os.tmpdir(), "autoflip-plate-api-"));
  const db = await openDatabase({ filename: path.join(directory, "autoflip.sqlite3"), migrationsDirectory: path.join(projectDirectory, "cloudflare", "migrations") });
  const now = Date.now();
  await db.prepare(`INSERT INTO users
    (id, vk_user_id, nickname, first_name, last_name, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, '', '', '', ?, ?)`).bind("plate-user", "vk-plate", "PlateTester", now, now).run();
  await db.prepare("INSERT INTO game_saves (user_id, revision, data_json, updated_at) VALUES (?, 1, ?, ?)")
    .bind("plate-user", JSON.stringify(state), now).run();
  const session = await createSession(db, "plate-user");
  return {
    db,
    state,
    directory,
    request(body) {
      return new Request("https://autoflip-game.ru/api/plates/open", {
        method: "POST",
        headers: { Cookie: `af_session=${session.token}`, "Content-Type": "application/json", Origin: "https://autoflip-game.ru" },
        body: JSON.stringify(body)
      });
    },
    async close() { db.close(); await rm(directory, { recursive: true, force: true }); }
  };
}

test("server plate generator preserves all configured probabilities and values", () => {
  for (const box of PLATE_CASES) assert.equal(box.weights.reduce((sum, item) => sum + item[1], 0), 100);
  const legend = PLATE_CASES.find((item) => item.id === "legend");
  assert.equal(rollPlateRarity(legend.weights, 0), "ordinary");
  assert.equal(rollPlateRarity(legend.weights, 0.05), "unusual");
  assert.equal(rollPlateRarity(legend.weights, 0.9995), "priceless");
  const sequence = [0.9995, 0, 0, 0, 0, 0, 0, 0]; let index = 0;
  const plate = generatePlate(legend, "case:legend:test-seed", 123, () => sequence[index++] ?? 0);
  assert.equal(plate.rarity, "priceless");
  assert.equal(plate.value, PLATE_RARITIES.priceless.value);
  assert.match(plate.number, /^(А777МР|Е777КХ|А777АА|В777ОР|О777ОО)$/u);
});

test("case prepare returns one server-generated result and commit is idempotent", async () => {
  const f = await fixture();
  try {
    const body = { openingId: "case:standard:server-test-1", caseId: "standard", phase: "prepare", clientId: "device-plate-server" };
    let response = await openPlateCase({ request: f.request(body), env: { DB: f.db } });
    let payload = await response.json();
    assert.equal(response.status, 200);
    assert.equal(payload.price, 3_000);
    assert.equal(payload.plate.openingId, body.openingId);
    assert.equal(payload.committed, false);
    assert.match(payload.plate.number, /^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}$/u);

    response = await openPlateCase({ request: f.request(body), env: { DB: f.db } });
    assert.deepEqual((await response.json()).plate, payload.plate);
    response = await openPlateCase({ request: f.request({ ...body, phase: "commit" }), env: { DB: f.db } });
    payload = await response.json();
    assert.equal(payload.committed, true);
    response = await openPlateCase({ request: f.request({ ...body, phase: "commit" }), env: { DB: f.db } });
    assert.equal((await response.json()).committed, true);
  } finally { await f.close(); }
});

test("server rejects locked or unaffordable cases", async () => {
  const f = await fixture({ money: 2_999, garageLevel: 1, plates: { items: [], appliedOpeningIds: [] } });
  try {
    let response = await openPlateCase({ request: f.request({ openingId: "case:legend:locked-test", caseId: "legend", phase: "prepare", clientId: "device-plate-server" }), env: { DB: f.db } });
    assert.equal((await response.json()).error, "case_level_locked");
    response = await openPlateCase({ request: f.request({ openingId: "case:standard:money-test", caseId: "standard", phase: "prepare", clientId: "device-plate-server" }), env: { DB: f.db } });
    assert.equal((await response.json()).error, "insufficient_game_money");
  } finally { await f.close(); }
});

test("cloud save accepts only the exact prepared plate and exact case charge", async () => {
  const f = await fixture();
  try {
    const current = {
      money: 200_000, rep: 0, deals: 0, day: 1, loan: 0, garageLevel: 10, cars: [],
      plates: { items: [], appliedOpeningIds: [] }, economy: { appliedIds: [] },
      _saveMeta: { version: 2, integrityVersion: 1, clientId: "device-plate-server" }
    };
    const openingId = "case:legend:integrity-test";
    const box = PLATE_CASES.find((item) => item.id === "legend");
    const plate = generatePlate(box, openingId, 123456, () => 0.1);
    await f.db.prepare(`INSERT INTO plate_case_openings
      (user_id, opening_id, case_id, price, plate_json, status, client_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'prepared', ?, ?, ?)`)
      .bind("plate-user", openingId, box.id, box.price, JSON.stringify(plate), "device-plate-server", Date.now(), Date.now()).run();
    const next = structuredClone(current);
    next.money -= box.price;
    next.plates.items.push(plate);
    next.plates.appliedOpeningIds.push(openingId);
    const accepted = await validateSaveIntegrity(f.db, "plate-user", current, next);
    assert.equal(accepted.plateOpenings, 1);

    const modified = structuredClone(next);
    modified.plates.items[0].value += 1;
    await assert.rejects(validateSaveIntegrity(f.db, "plate-user", current, modified), (error) => error.code === "plate_opening_result_modified");
    const free = structuredClone(next);
    free.money = current.money;
    await assert.rejects(validateSaveIntegrity(f.db, "plate-user", current, free), (error) => error.code === "unconfirmed_money_increase");
  } finally { await f.close(); }
});
