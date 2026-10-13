const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('chat moderation is enforced on the server and exposed in the UI',()=>{
  const api=read('functions/api/community.js'),lib=read('functions/_lib/community.js'),ui=read('community.js');
  for(const marker of ['report_message','block_user','admin_delete_message','admin_ban_user','admin_unban_user'])assert.match(api,new RegExp(marker));
  assert.match(lib,/message_links_forbidden/);assert.match(lib,/message_forbidden_content/);
  assert.match(lib,/90 \* 24 \* 60 \* 60_000/);assert.match(ui,/ПАНЕЛЬ АДМИНИСТРАТОРА/);
});

test('account privacy, export and deletion controls are installed',()=>{
  const users=read('functions/_lib/users.js'),account=read('game-account.js');
  assert.match(users,/SET first_name = '', last_name = '', avatar_url = ''/);
  assert.match(read('functions/api/account/export.js'),/Content-Disposition/);
  assert.match(read('functions/_lib/account-data.js'),/DELETE FROM users/);
  assert.match(account,/downloadAccountData/);assert.match(account,/deleteMyAccount/);
  assert.match(read('cloudflare/support/index.html'),/Поддержка AutoFlip/);assert.match(read('functions/api/support.js'),/support_tickets/);
});

test('orders, refund requests, age mark and premium transfer lock are present',()=>{
  const store=read('functions/_lib/store.js'),client=read('store.js');
  assert.match(read('functions/api/store/refunds.js'),/refund_reason_too_short/);
  assert.match(store,/tradable: false/);assert.match(client,/x\.tradable=false;x\.value=0/);
  assert.match(read('index.html'),/>18\+<\/div>/);assert.match(read('cloudflare/login/index.html'),/>18\+<\/div>/);
});

test('source and deployed safety clients stay identical',()=>{
  for(const file of ['community.js','community.css','game-account.js','store.js','theme-polish.css','index.html']){
    assert.equal(read(file),read('cloudflare/app/'+file),file);
  }
});

test('privacy migration self-applies once without a persistent Cloudflare token',()=>{
  const middleware=read('functions/_middleware.js'),migrations=read('functions/_lib/migrations.js');
  assert.match(middleware,/ensureRuntimeMigrations\(context\.env\.DB\)/);
  assert.match(migrations,/CREATE TABLE IF NOT EXISTS app_migrations/);
  assert.match(migrations,/0008_safety_and_privacy/);
  assert.match(migrations,/ensureCommunitySchema/);
  assert.match(migrations,/ensureStoreSchema/);
  assert.match(migrations,/ensureSupportSchema/);
  assert.match(migrations,/UPDATE users SET first_name = '', last_name = '', avatar_url = ''/);
  assert.match(migrations,/INSERT OR IGNORE INTO app_migrations/);
});

test('published retention periods are enforced by server cleanup',()=>{
  const community=read('functions/_lib/community.js'),save=read('functions/api/save.js'),support=read('functions/_lib/support.js');
  assert.match(community,/90 \* 24 \* 60 \* 60_000/);
  assert.match(community,/community_moderation_log WHERE created_at < \?/);
  assert.match(save,/removeExpiredBackups/);
  assert.match(save,/30 \* 24 \* 60 \* 60_000/);
  assert.match(save,/ORDER BY revision DESC LIMIT 5/);
  assert.match(support,/status IN \('resolved', 'closed'\)/);
  assert.match(support,/365 \* 24 \* 60 \* 60_000/);
});

test('CI runs every test and both Wrangler build checks on push and pull requests',()=>{
  const workflow=read('.github/workflows/test.yml'),maintenance=read('tests/retention-maintenance.test.cjs');
  assert.match(workflow,/push:/);assert.match(workflow,/pull_request:/);
  assert.match(workflow,/node --test tests\/\*\.test\.cjs/);
  assert.match(maintenance,/deploy', '--dry-run'/);
});
