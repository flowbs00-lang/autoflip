const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('community API requires an account and protects writes', () => {
  const source = read('functions/api/community.js');
  assert.match(source, /getSession/);
  assert.match(source, /assertSameOrigin/);
  assert.match(source, /message_rate_limited/);
  assert.match(source, /MESSAGE_LIMIT = 400/);
});

test('community supports global, regional and clan chat plus both rankings', () => {
  const api = read('functions/api/community.js');
  const client = read('community.js');
  assert.match(api, /channel === "global"/);
  assert.match(api, /channel\.startsWith\("region:"\)/);
  assert.match(api, /channel === "clan"/);
  assert.match(api, /ORDER BY p\.reputation DESC/);
  assert.match(api, /SUM\(p\.reputation\)/);
  assert.match(client, /Лучшие перекупы/);
  assert.match(client, /РЕЙТИНГ КЛАНОВ/);
  assert.match(client, /displayName/);
  assert.match(client, /decorateAccountName/);
});

test('community schema and cloud save reputation sync are present', () => {
  const schema = read('functions/_lib/community.js');
  const save = read('functions/api/save.js');
  assert.match(schema, /CREATE TABLE IF NOT EXISTS community_profiles/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS clans/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS clan_members/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS community_messages/);
  assert.match(save, /syncCommunityProfile/);
  assert.match(save, /community_profile_sync_failed/);
});

test('game exposes unrestricted multi-listing and exact meeting time flows', () => {
  const html = read('index.html');
  const meetings = read('negotiations-system.js');
  assert.match(html, /state\.activeListings/);
  assert.match(html, /listings\(\)\.push\(listing\)/);
  assert.match(meetings, /confirmCustomBuyerMeeting/);
  assert.match(meetings, /closeOtherCarMeetings/);
  assert.match(meetings, /Автомобиль уже продан или обменян/);
});

test('market cards use only the resolved car photo layer', () => {
  const base = read('script_base.js');
  assert.doesNotMatch(base, /url\([^\n]*fallbackPhoto\(c\)/);
});

test('community is a permanent visible home-screen application', () => {
  const home = read('script_base.js');
  const modernHome = read('ui.js');
  assert.match(home, /id="communityApp" onclick="openCommunity\('global'\)"/);
  assert.match(home, /<small>Сообщество<\/small>/);
  assert.match(modernHome, /\['openCommunity','Сообщество','spark','violet'\]/);
  assert.match(modernHome, /<span>14<\/span>/);
});
