const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const economy=fs.readFileSync(path.join(root,'economy-system.js'),'utf8');
const confirmApi=fs.readFileSync(path.join(root,'functions/api/economy/confirm.js'),'utf8');
const migration=fs.readFileSync(path.join(root,'cloudflare/migrations/0006_economy_transactions.sql'),'utf8');
const commitMigration=fs.readFileSync(path.join(root,'cloudflare/migrations/0011_economy_commit_state.sql'),'utf8');
const statsApi=fs.readFileSync(path.join(root,'functions/api/economy/stats.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');

function game(){
  let output='',alertText='';
  const c={state:{money:500000,rep:10,city:'Киров',gameClock:{total:60},cars:[],meetings:[],activeListings:[],buyerInbox:[],garageLevel:1,garageProgress:{level:1,serviceBuilt:false,stats:{}}},window:null,document:{querySelector:()=>null},render:value=>output=value,head:title=>'<h1>'+title+'</h1>',money:value=>Number(value).toLocaleString('ru-RU')+' ₽',persist(){},save(){},alert:value=>alertText=value,localStorage:{setItem(){}},Date,Math,setInterval(){},startVisibleInterval(){return{stop(){}};}};
  c.window=c;vm.createContext(c);vm.runInContext(economy,c);return{c,html:()=>output,alert:()=>alertText};
}

test('financial settlements require an authenticated idempotent server confirmation',()=>{
  assert.match(confirmApi,/assertSameOrigin/);
  assert.match(confirmApi,/getSession/);
  assert.match(confirmApi,/INSERT OR IGNORE INTO economy_transactions/);
  assert.match(confirmApi,/transaction_conflict/);
  assert.match(confirmApi,/status = 'committed'/);
  assert.match(confirmApi,/transaction_in_progress/);
  assert.match(confirmApi,/transaction_owner_mismatch/);
  assert.match(migration,/PRIMARY KEY \(user_id, transaction_id\)/);
  assert.match(commitMigration,/ADD COLUMN status/);
  assert.match(economy,/await window\.AUTOFLIP_CONFIRM_ECONOMY\(tx,type,amount,payload,'prepare'\)/);
  assert.match(economy,/reconcileCommits/);
  assert.match(economy,/AUTOFLIP_CLOUD_FLUSH/);
  assert.match(statsApi,/status = 'committed'/);
  assert.match(economy,/busy\.has\(id\)/);
  for(const type of ['reward','loan_issue','loan_repay','plate_sale','transport','diagnostic','repair','car_cost'])assert.match(confirmApi,new RegExp('"'+type+'"'));
  assert.match(confirmApi,/validateReward/);assert.match(confirmApi,/validateLoanIssue/);assert.match(confirmApi,/validateLoanRepayment/);assert.match(confirmApi,/validatePlateSale/);
  assert.match(economy,/protectedAction\(id,'loan_issue'/);assert.match(economy,/protectedAction\(id,'loan_repay'/);assert.match(economy,/protectedAction\(id,'plate_sale'/);assert.match(economy,/protectedAction\(id,'reward'/);
  assert.match(economy,/protectedAction\(id,'transport'/);assert.match(economy,/protectedAction\(tx,'diagnostic'/);assert.match(economy,/protectedAction\(id,'repair'/);assert.match(economy,/protectedAction\(id,'car_cost'/);
  assert.match(confirmApi,/meetingResult/);assert.match(confirmApi,/auxiliaryResult/);assert.match(confirmApi,/result_json/);
  assert.match(economy,/reward:achievement:/);assert.match(confirmApi,/first_deal/);
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
  assert.match(economy,/ЗАДАНИЯ КЛАНА/);
  assert.match(economy,/Найти клан/);
  assert.match(economy,/автоматически оплачивает 10% стоимости деталей/);
  assert.match(economy,/общая экономия 25 000 ₽/);
  assert.match(economy,/serviceUnlocked/);
  assert.match(html,/economy-system\.js/);
  assert.match(html,/economy-system\.css/);
});

test('removed tuning cannot remain in garage navigation, requirements or public profiles',()=>{
  const garage=fs.readFileSync(path.join(root,'garage-system.js'),'utf8');
  const community=fs.readFileSync(path.join(root,'community.js'),'utf8');
  assert.doesNotMatch(garage,/garageTuning|garageTuneCar|Затюнинговать|Тюнинг-центр/);
  assert.doesNotMatch(community,/Тюнинг ·/);
});

test('business screens explain locked service, parts savings and clan entry point',()=>{
  const g=game();g.c.economyHub();assert.match(g.html(),/Найти клан/);assert.match(g.html(),/Требует внимания/);
  g.c.openClanTask();assert.match(g.html(),/Задание пока недоступно/);assert.match(g.html(),/Найти или создать клан/);
  g.c.state.communityMembership={tag:'TEST',name:'Тестовый клан',role:'member'};g.c.openClanTask();
  assert.match(g.html(),/Деловая неделя/);assert.match(g.html(),/50 000 ₽/);assert.match(g.html(),/сделок/);assert.match(g.html(),/заказов сервиса/);
  g.c.economyGarage();assert.match(g.html(),/ОТКРОЕТСЯ НА 5 УРОВНЕ/);
  g.c.state.garageLevel=5;g.c.state.garageProgress.level=5;g.c.state.garageProgress.serviceBuilt=true;g.c.economyGarage();
  assert.match(g.html(),/автоматически оплачивает 10%/);assert.match(g.html(),/экономия 25 000 ₽/);
  g.c.economyBuyParts();assert.equal(g.c.state.money,425000);assert.equal(g.c.state.economy.service.partsStock,100000);
});

test('clan task is a dedicated screen and records deal and service contributions',()=>{
  assert.match(economy,/window\.openClanTask/);
  assert.match(economy,/clan-task-mission/);
  assert.match(economy,/breakdown\[id==='service'\?'service':'deals'\]/);
  assert.match(economy,/onclick="openClanTask\(\)"/);
});

test('protected rewards, loans and plate sales mutate only between prepare and commit',async()=>{
  const calls=[];
  const c={state:{money:100000,loan:0,rep:10,city:'Киров',day:1,gameClock:{total:60},cars:[],meetings:[],activeListings:[],buyerInbox:[],garageLevel:1,garageProgress:{level:1,serviceBuilt:false,stats:{}},bankCustomer:{totalIssued:0},plates:{items:[{id:'plate-one',number:'А111МР',value:500000,region:{city:'Киров'}}]}},window:null,document:{querySelector:()=>null},render(){},head:()=>'',money:String,persist(){},save(){},alert(value){throw new Error(value);},localStorage:{setItem(){}},Date,Math,setInterval(){},startVisibleInterval(){return{stop(){}};},location:{reload(){throw new Error('unexpected reload');}},async fetch(url,options){const body=JSON.parse(options.body);calls.push(body);return{ok:true,async json(){return{ok:true,committed:body.phase==='commit'};}};},async AUTOFLIP_CLOUD_FLUSH(){return true;}};
  c.bankIssueLoan=function(amount){c.state.money+=amount;c.state.loan=Math.round(amount*1.1);c.state.bankCustomer.totalIssued++;};
  c.bankPayLoan=function(){c.state.money-=c.state.loan;c.state.loan=0;c.state.bankCredit=null;};c.payLoan=c.bankPayLoan;
  c.sellPlate=function(id){const i=c.state.plates.items.findIndex(x=>x.id===id);c.state.money+=c.state.plates.items[i].value;c.state.plates.items.splice(i,1);};
  c.window=c;vm.createContext(c);vm.runInContext(economy,c);
  await c.bankIssueLoan(25000);assert.equal(c.state.loan,27500);assert.deepEqual(calls.slice(-2).map(x=>x.phase),['prepare','commit']);
  c.state.bankCredit={active:true,startedAt:60};await c.bankPayLoan();assert.equal(c.state.loan,0);assert.deepEqual(calls.slice(-2).map(x=>x.type),['loan_repay','loan_repay']);
  await c.sellPlate('plate-one');assert.equal(c.state.plates.items.length,0);assert.deepEqual(calls.slice(-2).map(x=>x.type),['plate_sale','plate_sale']);
  const daily=c.state.economy.goals.daily;daily.targets.forEach(x=>x.value=x.need);const before=c.state.money;await c.economyClaimGoal('daily');assert.equal(c.state.money,before+25000);assert.deepEqual(calls.slice(-2).map(x=>x.type),['reward','reward']);
});
