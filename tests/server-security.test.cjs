const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('central API protection covers high-risk actions and temporary blocks', () => {
  const security = read('functions/_lib/security.js');
  const middleware = read('functions/_middleware.js');
  for (const marker of [
    'auth:vk', 'profile:nickname_change', 'profile:nickname_setup', 'support:create', 'community:message',
    'community:report', 'community:create_clan', 'store:create_payment',
    'save:write', 'admin:denied', 'temporarily_blocked', 'Retry-After'
  ]) assert.match(security, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(middleware, /enforceApiSecurity\(context, session\)/);
  assert.match(middleware, /recordSuspiciousResponse/);
  assert.ok(middleware.indexOf('enforceApiSecurity(context, session)') < middleware.indexOf('context.next()'));
});

test('security storage uses rotating hashes, retention cleanup and no raw network identifiers', () => {
  const security = read('functions/_lib/security.js');
  const migration = read('cloudflare/migrations/0009_security_rate_limits.sql');
  for (const table of ['security_rate_windows', 'security_blocks', 'security_events', 'security_maintenance']) {
    assert.match(security, new RegExp(table));
    assert.match(migration, new RegExp(table));
  }
  assert.match(security, /crypto\.subtle\.digest\("SHA-256"/);
  assert.match(security, /Math\.floor\(now \/ DAY\)/);
  assert.match(security, /SECURITY_HASH_SECRET/);
  assert.match(security, /DELETE FROM security_events WHERE created_at < \?/);
  assert.match(security, /DELETE FROM security_rate_windows WHERE updated_at < \?/);
  assert.doesNotMatch(migration, /ip_address|user_agent/i);
});

test('security log is admin-only and account privacy controls include it', () => {
  const endpoint = read('functions/api/security/events.js');
  const exported = read('functions/api/account/export.js');
  const deleted = read('functions/api/account/delete.js');
  assert.match(endpoint, /isAdminUser/);
  assert.match(endpoint, /admin_required/);
  assert.match(endpoint, /LIMIT \?/);
  assert.match(exported, /securityEvents/);
  assert.match(exported, /ensureSecuritySchema/);
  assert.match(deleted, /DELETE FROM security_rate_windows/);
  assert.match(deleted, /DELETE FROM security_blocks/);
  assert.match(deleted, /DELETE FROM security_events/);
});

test('runtime migration installs server protection idempotently', () => {
  const migrations = read('functions/_lib/migrations.js');
  assert.match(migrations, /0009_security_rate_limits/);
  assert.match(migrations, /ensureSecuritySchema/);
  assert.match(migrations, /INSERT OR IGNORE INTO app_migrations/);
});

test('CSP isolates unsafe-inline to the legacy game and VK inline styles', () => {
  const headers = read('cloudflare/_headers');
  const middleware = read('functions/_middleware.js');
  const globalSection = headers.split('\n/login/*')[0];
  const loginSection = headers.split('/login/*')[1].split('/auth/vk/*')[0];
  const authSection = headers.split('/auth/vk/*')[1].split('/app/*')[0];
  const appSection = headers.split('/app/*')[1];
  assert.doesNotMatch(globalSection, /unsafe-inline/);
  assert.doesNotMatch(loginSection.match(/script-src[^;]*/)[0], /unsafe-inline/);
  assert.match(loginSection.match(/style-src[^;]*/)[0], /unsafe-inline/);
  assert.doesNotMatch(authSection.match(/script-src[^;]*/)[0], /unsafe-inline/);
  assert.match(appSection, /script-src 'self' 'unsafe-inline'/);
  assert.match(appSection, /style-src 'self' 'unsafe-inline'/);
  assert.match(middleware, /Keep that exception isolated to \/app\/ only/);
  assert.doesNotMatch(read('cloudflare/index.html'), /<style|<script(?![^>]*src)/);
  assert.doesNotMatch(read('cloudflare/support/index.html'), /<style|<script(?![^>]*src)/);
});

test('privacy documents disclose security processing and exact retention', () => {
  const privacy = read('cloudflare/legal/privacy/index.html');
  const consent = read('cloudflare/legal/personal-data-consent/index.html');
  assert.match(privacy, /ежедневно меняющийся криптографический хэш IP-адреса/);
  assert.match(privacy, /Счётчики защиты[^<]*<\/th><td>До 7 дней/);
  assert.match(privacy, /Журнал подозрительных запросов<\/th><td>До 30 дней/);
  assert.match(consent, /Исходный IP-адрес и User-Agent[^.]+не сохраняются/);
});
