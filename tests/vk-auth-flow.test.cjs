const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('VK login survives a mobile callback opened in a replacement tab', () => {
  const login = read('cloudflare/assets/login.js');
  const callback = read('cloudflare/assets/vk-callback.js');

  assert.match(login, /localStorage\.setItem\(PENDING_LOGIN_KEY, pending\)/);
  assert.match(callback, /PENDING_LOGIN_TTL_MS = 10 \* 60 \* 1000/);
  assert.match(callback, /localStorage\.getItem\(PENDING_LOGIN_KEY\)/);
  assert.match(callback, /returnedState !== expectedState/);
  assert.match(callback, /localStorage\.removeItem\(PENDING_LOGIN_KEY\)/);
});

test('VK callback verifies the server session before entering the game', () => {
  const callback = read('cloudflare/assets/vk-callback.js');
  const server = read('server/server.js');

  assert.match(callback, /fetch\("\/api\/session"/);
  assert.match(callback, /!session\?\.authenticated \|\| session\.needsLegalConsent/);
  assert.match(server, /response\.headers\.get\("set-cookie"\)/);
});

test('login and callback HTML bypass stale cached auth scripts', () => {
  assert.match(read('cloudflare/login/index.html'), /login\.js\?v=20261023-2/);
  assert.match(read('cloudflare/auth/vk/callback/index.html'), /vk-callback\.js\?v=20261023-2/);
});

test('VK login uses same-tab redirects supported by mobile in-app browsers', () => {
  const login = read('cloudflare/assets/login.js');
  const callback = read('cloudflare/assets/vk-callback.js');

  assert.match(login, /mode: VKID\.ConfigAuthMode\.Redirect/);
  assert.match(login, /responseMode: VKID\.ConfigResponseMode\.Redirect/);
  assert.match(login, /VK ID не открылся/);
  assert.match(callback, /mode: VKID\.ConfigAuthMode\.Redirect/);
});
