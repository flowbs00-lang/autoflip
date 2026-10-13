const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { pathToFileURL } = require('node:url');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function d1(database) {
  return {
    prepare(sql) {
      let bindings = [];
      return {
        bind(...values) { bindings = values; return this; },
        async run() {
          const result = database.prepare(sql).run(...bindings);
          return { meta: { changes: result.changes } };
        }
      };
    },
    async batch(statements) {
      database.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        database.exec('COMMIT');
        return results;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    }
  };
}

function applyMigrations(database) {
  for (const file of fs.readdirSync(path.join(root, 'cloudflare/migrations')).sort()) {
    database.exec(read(`cloudflare/migrations/${file}`));
  }
}

function count(database, table, where = '1 = 1') {
  return database.prepare(`SELECT COUNT(*) AS count FROM ${table} WHERE ${where}`).get().count;
}

test('daily cleanup removes expired rows globally and keeps current rows', async () => {
  const database = new DatabaseSync(':memory:');
  applyMigrations(database);
  const db = d1(database);
  const now = Date.UTC(2026, 9, 13, 2, 17);
  const day = 24 * 60 * 60_000;
  const user = ['u1', '1', 'nick', '', '', '', now, now];
  database.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(...user);

  database.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?, ?)').run('expired', 'u1', 1, 1, Math.floor(now / 1000) - 1);
  database.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?, ?)').run('current', 'u1', 1, 1, Math.floor(now / 1000) + 60);
  for (let revision = 1; revision <= 7; revision += 1) {
    database.prepare('INSERT INTO game_save_backups VALUES (?, ?, ?, ?)').run('u1', revision, '{}', revision === 1 ? now - 31 * day : now);
  }
  database.prepare('INSERT INTO community_messages (user_id, channel, body, created_at) VALUES (?, ?, ?, ?)').run('u1', 'global', 'old', now - 91 * day);
  database.prepare('INSERT INTO community_messages (user_id, channel, body, created_at) VALUES (?, ?, ?, ?)').run('u1', 'global', 'new', now);
  database.prepare('INSERT INTO community_moderation_log VALUES (?, ?, ?, ?, ?, ?, ?)').run('old-mod', 'u1', 'u1', null, 'test', '', now - 366 * day);
  database.prepare("INSERT INTO support_tickets VALUES (?, ?, ?, ?, ?, 'closed', ?, ?, NULL, '')").run('old-ticket', 'u1', 'other', 's', 'm', now - 366 * day, now - 366 * day);
  database.prepare('INSERT INTO security_rate_windows VALUES (?, ?, ?, ?, ?)').run('account:u1', 'api', 1, 1, now - 8 * day);
  database.prepare("INSERT INTO security_blocks VALUES (?, 'account', 'test', ?, ?, ?)").run('account:u1', now - 1, now - day, now - day);
  database.prepare("INSERT INTO security_events VALUES (?, ?, 'account', ?, 'test', '/', 'GET', '{}', ?)").run('event', 'account:u1', 'u1', now - 31 * day);

  const cleanup = await import(pathToFileURL(path.join(root, 'maintenance/src/cleanup.js')));
  const result = await cleanup.runRetentionCleanup(db, { now, scheduledAt: now, runId: 'test-run' });

  assert.equal(count(database, 'sessions'), 1);
  assert.equal(count(database, 'game_save_backups'), 5);
  assert.equal(count(database, 'community_messages'), 1);
  assert.equal(count(database, 'community_moderation_log'), 0);
  assert.equal(count(database, 'support_tickets'), 0);
  assert.equal(count(database, 'security_rate_windows'), 0);
  assert.equal(count(database, 'security_blocks'), 0);
  assert.equal(count(database, 'security_events'), 0);
  assert.equal(database.prepare("SELECT status FROM retention_maintenance_runs WHERE id = 'test-run'").get().status, 'succeeded');
  assert.equal(result.deleted.expiredSessions, 1);
  database.close();
});

test('account deletion cascades owned data and anonymizes retained audit references', async () => {
  const database = new DatabaseSync(':memory:');
  applyMigrations(database);
  const db = d1(database);
  const now = Date.now();
  for (const [id, vk, nickname] of [['victim', '1', 'victim'], ['other', '2', 'other']]) {
    database.prepare('INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(id, vk, nickname, '', '', '', now, now);
  }
  database.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?, ?)').run('token', 'victim', 1, 1, 2);
  database.prepare("INSERT INTO game_saves VALUES ('victim', 1, '{}', ?)").run(now);
  database.prepare("INSERT INTO community_messages (user_id, channel, body, created_at, deleted_by) VALUES ('other', 'global', 'x', ?, 'victim')").run(now);
  database.prepare("INSERT INTO community_moderation_log VALUES ('log', 'victim', 'victim', NULL, 'ban', '', ?)").run(now);
  database.prepare("INSERT INTO support_tickets VALUES ('ticket', 'other', 'other', 's', 'm', 'open', ?, ?, 'victim', '')").run(now, now);
  database.prepare("INSERT INTO security_events VALUES ('event', 'account:victim', 'account', 'victim', 'test', '/', 'GET', '{}', ?)").run(now);

  const accountData = await import(pathToFileURL(path.join(root, 'functions/_lib/account-data.js')));
  await accountData.deleteAccountData(db, 'victim');

  assert.equal(count(database, 'users', "id = 'victim'"), 0);
  assert.equal(count(database, 'sessions', "user_id = 'victim'"), 0);
  assert.equal(count(database, 'game_saves', "user_id = 'victim'"), 0);
  assert.equal(count(database, 'security_events', "user_id = 'victim'"), 0);
  assert.equal(database.prepare("SELECT deleted_by FROM community_messages WHERE user_id = 'other'").get().deleted_by, null);
  const audit = database.prepare("SELECT admin_user_id, target_user_id FROM community_moderation_log WHERE id = 'log'").get();
  assert.equal(audit.admin_user_id, 'deleted-account');
  assert.equal(audit.target_user_id, null);
  assert.equal(database.prepare("SELECT reviewed_by FROM support_tickets WHERE id = 'ticket'").get().reviewed_by, null);
  database.close();
});

test('maintenance Worker has a daily cron, D1 binding and a Wrangler dry-run build', { timeout: 120_000 }, () => {
  const config = read('maintenance/wrangler.jsonc');
  assert.match(config, /"crons": \["17 2 \* \* \*"\]/);
  assert.match(config, /"binding": "DB"/);
  const { spawnSync } = require('node:child_process');
  const wrangler = path.join(root, 'cloudflare/node_modules/.bin/wrangler');
  const result = spawnSync(wrangler, ['deploy', '--dry-run', '--config', path.join(root, 'maintenance/wrangler.jsonc')], {
    cwd: root,
    encoding: 'utf8',
    timeout: 110_000
  });
  const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
  assert.ifError(result.error);
  assert.equal(result.status, 0, output);
});
