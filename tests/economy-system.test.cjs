const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const economy=fs.readFileSync(path.join(root,'economy-system.js'),'utf8');
const confirmApi=fs.readFileSync(path.join(root,'functions/api/economy/confirm.js'),'utf8');
const migration=fs.readFileSync(path.join(root,'cloudflare/migrations/0006_economy_transactions.sql'),'utf8');
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
