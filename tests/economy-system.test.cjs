const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const economy=fs.readFileSync(path.join(root,'economy-system.js'),'utf8');
const confirmApi=fs.readFileSync(path.join(root,'functions/api/economy/confirm.js'),'utf8');
const migration=fs.readFileSync(path.join(root,'cloudflare/migrations/0006_economy_transactions.sql'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('financial settlements require an authenticated idempotent server confirmation',()=>{
  assert.match(confirmApi,/assertSameOrigin/);
  assert.match(confirmApi,/getSession/);
  assert.match(confirmApi,/INSERT OR IGNORE INTO economy_transactions/);
  assert.match(confirmApi,/transaction_conflict/);
  assert.match(migration,/PRIMARY KEY \(user_id, transaction_id\)/);
  assert.match(economy,/await window\.AUTOFLIP_CONFIRM_ECONOMY\(tx,type/);
  assert.match(economy,/busy\.has\(id\)/);
});

test('economy uses one car condition and includes demand, markdown, history and tow costs',()=>{
  assert.match(economy,/car\.flipCondition/);
  assert.doesNotMatch(economy,/marketFlipCondition\s*=/);
  assert.match(economy,/AUTOFLIP_MODEL_DEMAND_FACTOR/);
  assert.match(economy,/economyMarkdownStep/);
  assert.match(economy,/odometerRollback/);
  assert.match(economy,/needsTow/);
  assert.match(html,/AUTOFLIP_UPDATE_LISTING/);
  assert.match(html,/AUTOFLIP_PICK_BUYER_PROFILE/);
});

test('business hub covers next actions, goals, service staff and economic statistics',()=>{
  for(const token of ['economyHub','Ближайшая встреча','НЕДЕЛЬНЫЙ КОНТРАКТ','workers','rating','economyStats','Сезонные очки'])assert.match(economy,new RegExp(token));
  assert.match(html,/economy-system\.js/);
  assert.match(html,/economy-system\.css/);
});
