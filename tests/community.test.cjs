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
  assert.match(modernHome, /apps\.map\(appButton\)/);
  assert.match(modernHome, /grid-template-rows|os-app-grid/);
});

test('open chats poll for new messages without replacing the draft', () => {
  const client = read('community.js');
  assert.match(client, /setInterval\(pollMessages, 4000\)/);
  assert.match(client, /document\.getElementById\('communityChat'\)/);
  assert.match(client, /chat\.innerHTML = messageRows\(data\)/);
  assert.doesNotMatch(client.match(/async function pollMessages[\s\S]*?\n  }/)[0], /renderCommunity/);
});

test('clans are limited to 50 and expose managed member roles', () => {
  const schema = read('functions/_lib/community.js');
  const api = read('functions/api/community.js');
  const client = read('community.js');
  assert.match(schema, /CREATE TRIGGER IF NOT EXISTS clan_members_limit/);
  assert.match(schema, />= 50/);
  assert.match(api, /Number\(clan\.members \|\| 0\) >= 50/);
  assert.match(api, /action === "set_role"/);
  assert.match(api, /action === "kick_member"/);
  assert.match(api, /"coleader", "member"/);
  assert.match(client, /Глава/);
  assert.match(client, /Соруководитель/);
  assert.match(client, /СОСТАВ КЛАНА/);
  assert.match(client, /\/50 участников/);
});

test('chat authors and clan members open a safe public player inventory', () => {
  const api = read('functions/api/community.js');
  const client = read('community.js');
  const css = read('community-profile.css');
  assert.match(api, /url\.searchParams\.has\("profile"\)/);
  assert.match(api, /publicPlayerProfile/);
  assert.match(api, /readGameSave/);
  assert.match(api, /garageLevel/);
  assert.match(api, /garageValue/);
  assert.match(api, /PUBLIC_CAR_LIMIT/);
  assert.match(api, /PUBLIC_PLATE_LIMIT/);
  assert.doesNotMatch(api.match(/return \{\n    ok: true,\n    player:[\s\S]*?\n  \};/)[0], /businessHistory|repHistory|loan|money:/);
  assert.match(client, /communityOpenProfile/);
  assert.match(client, /community-member-profile/);
  assert.match(client, /community-author/);
  assert.match(client, /КОЛЛЕКЦИЯ НОМЕРОВ/);
  assert.match(client, /Уникальный ID/);
  assert.match(css, /community-profile-car/);
  assert.match(css, /community-plate-face/);
});
