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
  assert.match(read('functions/api/account/delete.js'),/DELETE FROM users/);
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
