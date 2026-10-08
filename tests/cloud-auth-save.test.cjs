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
  assert.match(source, /ON CONFLICT\(user_id\)/);
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
