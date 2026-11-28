import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { onRequestPost as register } from "../functions/api/auth/register.js";
import { onRequestPost as login } from "../functions/api/auth/login.js";
import { onRequestPost as guest } from "../functions/api/auth/guest.js";
import { onRequestPost as credentials } from "../functions/api/auth/credentials.js";
import { onRequestPost as recover } from "../functions/api/auth/recover.js";
import { onRequestGet as session } from "../functions/api/session.js";
import { openDatabase } from "../server/db.js";

const projectDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const origin = "https://autoflip-game.ru";
const legal = {
  terms: { accepted: true, version: "2026-11-28" },
  personalData: { accepted: true, version: "2026-11-28.1" },
  communityRules: { accepted: true, version: "2026-10-12" },
  publicProfile: { accepted: false, version: "2026-10-12" }
};

function context(db, route, body, cookie = "") {
  const headers = { "Content-Type": "application/json", Origin: origin };
  if (cookie) headers.Cookie = cookie;
  return {
    env: { DB: db, PUBLIC_REGISTRATION_ENABLED: "true" },
    request: new Request(`${origin}${route}`, {
      method: body === undefined ? "GET" : "POST",
      headers,
      body: body === undefined ? undefined : JSON.stringify(body)
    })
  };
}

function cookieFrom(response) {
  return response.headers.get("set-cookie").split(";")[0];
}

async function payload(response) {
  return { response, body: await response.json() };
}

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "autoflip-auth-"));
  const db = await openDatabase({
    filename: path.join(directory, "autoflip.sqlite3"),
    migrationsDirectory: path.join(projectDirectory, "cloudflare", "migrations")
  });
  return { db, directory };
}

test("password registration, login and recovery keep the same player id", async () => {
  const { db, directory } = await fixture();
  try {
    const created = await payload(await register(context(db, "/api/auth/register", {
      username: "Тестер_01",
      password: "надёжный-пароль-123",
      legal
    })));
    assert.equal(created.response.status, 201);
    assert.match(created.body.user.id, /^AF-[A-Z2-9]{12}$/u);
    assert.match(created.body.recoveryCode, /^AFR-(?:[A-Z2-9]{5}-){3}[A-Z2-9]{5}$/u);

    const stored = await db.prepare("SELECT * FROM auth_credentials WHERE user_id = ?").bind(created.body.user.id).first();
    assert.equal(stored.username, "тестер_01");
    assert.notEqual(stored.password_hash, "надёжный-пароль-123");
    assert.equal(stored.account_type, "password");

    const wrong = await login(context(db, "/api/auth/login", { username: "Тестер_01", password: "неверный-пароль" }));
    assert.equal(wrong.status, 401);
    const signedIn = await payload(await login(context(db, "/api/auth/login", {
      username: "Тестер_01",
      password: "надёжный-пароль-123"
    })));
    assert.equal(signedIn.response.status, 200);
    const signedCookie = cookieFrom(signedIn.response);
    const current = await payload(await session(context(db, "/api/session", undefined, signedCookie)));
    assert.equal(current.body.user.id, created.body.user.id);
    assert.equal(current.body.accountType, "password");
    assert.equal(current.body.needsCredentials, false);

    const recovered = await payload(await recover(context(db, "/api/auth/recover", {
      playerId: created.body.user.id,
      recoveryCode: created.body.recoveryCode,
      password: "совсем-новый-пароль-456"
    })));
    assert.equal(recovered.response.status, 200);
    assert.notEqual(recovered.body.recoveryCode, created.body.recoveryCode);

    assert.equal((await login(context(db, "/api/auth/login", {
      username: "Тестер_01",
      password: "надёжный-пароль-123"
    }))).status, 401);
    assert.equal((await login(context(db, "/api/auth/login", {
      username: "Тестер_01",
      password: "совсем-новый-пароль-456"
    }))).status, 200);
  } finally {
    db.close();
    await rm(directory, { recursive: true, force: true });
  }
});

test("guest account can be upgraded without changing its player id", async () => {
  const { db, directory } = await fixture();
  try {
    const created = await payload(await guest(context(db, "/api/auth/guest", { legal })));
    assert.equal(created.response.status, 201);
    const playerId = created.body.user.id;
    const guestCookie = cookieFrom(created.response);
    const before = await payload(await session(context(db, "/api/session", undefined, guestCookie)));
    assert.equal(before.body.accountType, "guest");
    assert.equal(before.body.user.id, playerId);

    const upgraded = await payload(await credentials(context(db, "/api/auth/credentials", {
      username: "Гараж_77",
      password: "пароль-для-гаража-789"
    }, guestCookie)));
    assert.equal(upgraded.response.status, 200);
    assert.match(upgraded.body.recoveryCode, /^AFR-/u);

    const after = await payload(await session(context(db, "/api/session", undefined, guestCookie)));
    assert.equal(after.body.accountType, "password");
    assert.equal(after.body.user.id, playerId);
    assert.equal(after.body.username, "гараж_77");
  } finally {
    db.close();
    await rm(directory, { recursive: true, force: true });
  }
});
