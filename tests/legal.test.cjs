const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('login links every required legal document and keeps profile consent optional', () => {
  const html = read('cloudflare/login/index.html');
  const client = read('cloudflare/assets/login.js');
  for (const route of ['/legal/terms/', '/legal/personal-data-consent/', '/legal/privacy/', '/legal/community-rules/', '/legal/profile-consent/']) {
    assert.match(html, new RegExp(route.replaceAll('/', '\\/')));
  }
  assert.match(html, /id="consent-profile"/);
  assert.match(html, /Это необязательно/);
  assert.match(client, /requiredAccepted/);
  assert.doesNotMatch(client.match(/function requiredAccepted[\s\S]*?\n  }/)[0], /publicProfile/);
});

test('new account registration is closed at the server unless explicitly enabled or allowlisted', () => {
  const auth = read('functions/api/auth/vk.js');
  const legal = read('functions/_lib/legal.js');
  assert.match(auth, /closed_beta_only/);
  assert.match(auth, /publicRegistrationEnabled/);
  assert.match(auth, /betaTesterAllowed/);
  assert.match(auth, /SELECT id FROM users WHERE vk_user_id/);
  assert.match(legal, /PUBLIC_REGISTRATION_ENABLED/);
  assert.match(legal, /BETA_TESTER_VK_IDS/);
});

test('legal acceptance is versioned, persisted and required at protected entries', () => {
  const legal = read('functions/_lib/legal.js');
  const middleware = read('functions/_middleware.js');
  const migration = read('cloudflare/migrations/0007_legal_consents.sql');
  assert.match(legal, /LEGAL_VERSIONS/);
  assert.match(legal, /personal_data/);
  assert.match(legal, /community_rules/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS user_consents/);
  assert.match(middleware, /legalStatus/);
  assert.match(middleware, /legal=required/);
});

test('expanded player inventory is private without separate consent', () => {
  const api = read('functions/api/community.js');
  const account = read('game-account.js');
  assert.match(api, /publicProfileAllowed/);
  assert.match(api, /player_profile_private/);
  assert.match(api, /consent_type = 'public_profile'/);
  assert.match(account, /togglePublicProfile/);
  assert.match(account, /Публичный профиль: /);
});

test('all legal pages exist and drafts cannot be mistaken for a ready public launch', () => {
  const pages = ['privacy', 'personal-data-consent', 'terms', 'profile-consent', 'community-rules', 'offer', 'refunds', 'operator'];
  for (const page of pages) assert.ok(fs.existsSync(path.join(root, 'cloudflare/legal', page, 'index.html')), page);
  assert.match(read('cloudflare/legal/operator/index.html'), /публичная регистрация и магазин (?:должны оставаться|остаются) закрытыми/i);
  assert.match(read('cloudflare/legal/offer/index.html'), /Магазин и платежи отключены/);
});

test('legal documents match implemented data minimisation and retention', () => {
  const privacy = read('cloudflare/legal/privacy/index.html');
  const consent = read('cloudflare/legal/personal-data-consent/index.html');
  const community = read('cloudflare/legal/community-rules/index.html');
  const legal = read('functions/_lib/legal.js');
  const login = read('cloudflare/assets/login.js');
  assert.match(privacy, /не сохраняет имя, фамилию и изображение профиля VK/);
  assert.match(consent, /не сохраняет имя, фамилию и изображение профиля VK/);
  assert.match(privacy, /не дольше 30 дней/);
  assert.match(privacy, /До 90 дней/);
  assert.match(privacy, /До 365 дней/);
  assert.match(community, /Жалобы поступают в панель модератора/);
  assert.doesNotMatch(community, /После внедрения модерации/);
  assert.match(legal, /2026-10-12/);
  assert.match(login, /2026-10-12/);
});

test('operator and support pages contain verified public contact details without fake placeholders', () => {
  const operator = read('cloudflare/legal/operator/index.html');
  const support = read('cloudflare/support/index.html');
  assert.match(operator, /Агаев Вахид Вагиф Оглы/);
  assert.match(operator, /434571836044/);
  assert.match(operator, /плательщик налога на профессиональный доход/);
  assert.match(operator, /flowbs00@gmail\.com/);
  assert.match(support, /flowbs00@gmail\.com/);
  assert.doesNotMatch(operator, /\[Не заполнено\]|\[Рабочая электронная почта\]/);
  assert.match(operator, /до этого публичный запуск запрещён/);
});
