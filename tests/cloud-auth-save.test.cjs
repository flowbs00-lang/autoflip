const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('cloud save API is authenticated, same-origin and size bounded', () => {
  const source = read('functions/api/save.js');
  assert.match(source, /getSession/);
  assert.match(source, /assertSameOrigin/);
  assert.match(source, /MAX_SAVE_BYTES/);
  assert.match(source, /CompressionStream\("gzip"\)/);
  assert.match(source, /DecompressionStream\("gzip"\)/);
  assert.match(source, /CURRENT_SAVE_VERSION = 2/);
  assert.match(source, /baseRevision/);
  assert.match(source, /revision_conflict/);
  assert.match(source, /WHERE user_id = \? AND revision = \?/);
  assert.match(source, /game_save_backups/);
});

test('large saves are compressed in the browser before upload', () => {
  const client = read('cloud-save.js');
  const server = read('functions/api/save.js');
  assert.match(client, /encoding: 'gzip-base64'/);
  assert.match(client, /compressed: bytesToBase64/);
  assert.doesNotMatch(client, /keepalive:\s*true/);
  assert.match(client, /lastUploadedRaw/);
  assert.match(client, /uploadInFlight/);
  assert.match(client, /DIRTY_KEY = 'autoflip-cloud-dirty'/);
  assert.match(client, /dirtyAtBoot = localStorage\.getItem\(DIRTY_KEY\) === '1'/);
  assert.match(client, /MIN_UPLOAD_GAP = 15000/);
  assert.match(client, /localStorage\.getItem\(SAVE_KEY\) === raw/);
  assert.match(client, /uploadQueue = Promise\.resolve\(\)/);
  assert.match(client, /REVISION_KEY = 'autoflip-cloud-revision'/);
  assert.match(client, /indexedDB\.open\('autoflip-safety'/);
  assert.match(client, /AUTOFLIP_CHECKPOINT/);
  assert.match(client, /AUTOFLIP_RECORD_OPERATION/);
  assert.match(client, /SAVE_VERSION = 2/);
  assert.match(client, /addEventListener\('online'/);
  assert.match(client, /visibilitychange/);
  assert.match(client, /pagehide/);
  assert.match(server, /decodeUploadedSave/);
  assert.match(server, /body\?\.encoding !== "gzip-base64"/);
});

test('save backups migration and important operation journal are installed', () => {
  const migration = read('cloudflare/migrations/0005_save_backups.sql');
  const game = read('index.html');
  const store = read('functions/_lib/store.js');
  const account = read('game-account.js');
  assert.match(migration, /CREATE TABLE IF NOT EXISTS game_save_backups/);
  for (const type of ['purchase', 'sale', 'repair', 'exchange']) {
    assert.match(game, new RegExp("AUTOFLIP_RECORD_OPERATION\\('" + type));
  }
  assert.match(store, /type: "donation"/);
  assert.match(account, /Сохранено в облаке/);
  assert.match(account, /savedAt/);
});

test('app routes are protected at the edge', () => {
  const source = read('functions/_middleware.js');
  assert.match(source, /isGameEntry/);
  assert.match(source, /getSession\(context\.env\.DB/);
  assert.match(source, /\/login\//);
});

test('deployed app contains the full game and cloud account controls', () => {
  const source = read('index.html');
  const deployed = read('cloudflare/app/index.html');
  assert.equal(deployed, source);
  assert.match(deployed, /cloud-save\.js/);
  assert.match(deployed, /game-account\.js/);
  assert.match(deployed, /id="accountLogout"/);
});
