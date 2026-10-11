import { ensureCommunitySchema } from "./community.js";
import { ensureStoreSchema } from "./store.js";
import { ensureSupportSchema } from "./support.js";

const SAFETY_PRIVACY_MIGRATION = "0008_safety_and_privacy";

let runtimeMigrationPromise = null;

async function applyRuntimeMigrations(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS app_migrations (
    id TEXT PRIMARY KEY,
    applied_at INTEGER NOT NULL
  )`).run();

  const applied = await db.prepare("SELECT id FROM app_migrations WHERE id = ? LIMIT 1")
    .bind(SAFETY_PRIVACY_MIGRATION)
    .first();
  if (applied) return;

  // These helpers are idempotent and mirror migration 0008. Running them at
  // the edge lets Pages update D1 without storing a Cloudflare token anywhere.
  await ensureCommunitySchema(db);
  await ensureStoreSchema(db);
  await ensureSupportSchema(db);
  await db.prepare("UPDATE users SET first_name = '', last_name = '', avatar_url = ''").run();
  await db.prepare("INSERT OR IGNORE INTO app_migrations (id, applied_at) VALUES (?, ?)")
    .bind(SAFETY_PRIVACY_MIGRATION, Date.now())
    .run();
}

export function ensureRuntimeMigrations(db) {
  if (!runtimeMigrationPromise) {
    runtimeMigrationPromise = applyRuntimeMigrations(db).catch((error) => {
      runtimeMigrationPromise = null;
      throw error;
    });
  }
  return runtimeMigrationPromise;
}
