const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
const modules=['// V7.9 — обмен автомобилей','// V7.9 — входящие покупатели','// V7.9 — новая механика'].map(prefix=>scripts.find(s=>s.trim().startsWith(prefix)));
const base=fs.readFileSync(path.join(__dirname,'../script_base.js'),'utf8');
const compatibility=fs.readFileSync(path.join(__dirname,'../script.js'),'utf8');
const car=(id,extra={})=>({id,name:'Car '+id,market:100000,sale:100000,buy:80000,year:2000,km:10000,city:'Киров',...extra});
function game(){
  let output='',input='90000',random=.2,saved;
  const c={state:{cars:[],money:200000,rep:100,day:1,deals:0,notifications:0,repHistory:[],buyerInbox:[]},makes:[],
    Math:Object.create(Math),money:String,photo:()=>'',fallbackPhoto:()=>'',head:()=>'',
    objective:{},objectiveSub:{},render:v=>{output=v;},alert:()=>{},log:()=>{},
    save:()=>{saved=JSON.parse(JSON.stringify(c.state));},persist:()=>c.save(),
    market:()=>{},setInterval:()=>{},gameTotal:()=>450,requiredRepForCar:()=>0,
    document:{getElementById:()=>({value:input}),querySelector:()=>null},
    removePurchasedListing:id=>{c.makes=c.makes.filter(v=>v.listingId!==id);}
  };
  c.Math.random=()=>random;c.window=c;vm.createContext(c);
  // Execute the actual purchase chain, including the fleet and legacy wrappers.
  vm.runInContext(base.slice(base.indexOf('function buy(id,price)'),base.indexOf('\n',base.indexOf('function buy(id,price)'))),c);
  vm.runInContext('var seq=0;'+compatibility.slice(compatibility.indexOf('var originalBuy=window.buy;'),compatibility.indexOf('var originalRepair=window.repair;')),c);
  vm.runInContext(scripts.find(s=>s.trim().startsWith('// V7.9 — скрытые дефекты')),c);
  vm.runInContext(base.slice(base.indexOf('function marketInspectionKey('),base.indexOf('function carView(')),c);
  modules.forEach(s=>vm.runInContext(s,c));
  return {c,html:()=>output,input:v=>{input=v;},random:v=>{random=v;},saved:()=>saved};
}
function buyer(g,extra={}){
  const c=g.c,own=car(1,{listed:true});
  c.state.cars=[own,car(2),car(3)];c.state.car=own;
  c.state.activeListing={id:'L1',status:'active',carKey:'car-1-80000',ask:100000};
  const x={id:'B1',listingId:'L1',status:'accepted',trade:true,tradeCar:car(4),tradeValue:120000,offer:100000,...extra};
  c.state.buyerInbox=[x,{id:'B2',listingId:'L1',status:'new'}];return x;
}
function seller(g){
  const c=g.c;c.state.cars=[car(1)];c.state.car=c.state.cars[0];
  c.makes=[car(4,{listingId:'M1',price:120000})];
  c.startSellerTradeIn(0,0);g.input('90000');c.makeSellerTradeOffer();
}

test('exchange cash labels match both directions and small differences',()=>{
  const {c}=game();
  assert.equal(c.tradeSaleCashText(100000,120000),'Ты доплачиваешь 20000');
  assert.equal(c.tradeSaleCashText(100000,103000),'Ты доплачиваешь 3000');
  assert.equal(c.tradeSaleCashText(103000,100000),'Покупатель доплачивает 3000');
  assert.equal(c.tradeSaleCashText(100000,100000),'Без доплаты');
});
test('buyer exchange preserves other garage cars, cash, accounting and closes listing once',()=>{
  const g=game(),c=g.c;buyer(g);c.completeBuyerTrade('B1',100000);
  assert.equal(c.state.money,180000);assert.equal(c.state.cars.length,3);
  assert.deepEqual(Array.from(c.state.cars,v=>v.id),[2,3,4]);
  assert.equal(c.state.car.buy,120000);assert.equal(c.state.car.flipCondition.healthy,true);
  assert.equal(c.state.activeListing,null);assert.equal(c.state.buyerInbox[1].status,'declined');
  assert.equal(c.state.businessHistory[0].profit,20000);
  const before=JSON.stringify(c.state);c.completeBuyerTrade('B1',100000);assert.equal(JSON.stringify(c.state),before);
});
test('both exchange paths can produce a fault or a healthy car',()=>{
  for(const mode of ['seller','buyer'])for(const roll of [.599,.60,.9]){
    const g=game(),c=g.c;g.random(roll);
    if(mode==='seller'){seller(g);c.completeSellerTrade();}else{buyer(g);c.completeBuyerTrade('B1',100000);}
    assert.equal(c.state.car.flipCondition.healthy,roll<.60,mode+' '+roll);
    assert.equal(c.state.car.diagnosed,true);
    assert.equal(g.saved().car.flipCondition.healthy,roll<.60);
    if(roll>=.60){assert.equal(c.state.car.flipCondition.discovered,true);assert.ok(c.state.car.market<c.state.car.healthyMarket);}
  }
});
test('seller exchange consumes correct listing and settles once',()=>{
  const g=game(),c=g.c;seller(g);c.completeSellerTrade();
  assert.equal(c.state.money,170000);assert.equal(c.state.cars.length,1);assert.equal(c.state.car.id,4);
  assert.equal(c.makes.length,0);assert.equal(c.state.businessHistory[0].profit,10000);
  const before=JSON.stringify(c.state);c.completeSellerTrade();assert.equal(JSON.stringify(c.state),before);
});
test('seller rejects stale listings, listed cars, insufficient reputation and insufficient cash',()=>{
  for(const change of [c=>{c.makes=[];},c=>{c.state.cars[0].listed=true;},c=>{c.requiredRepForCar=()=>130;},c=>{c.state.money=0;}]){
    const g=game(),c=g.c;seller(g);change(c);const before=JSON.stringify(c.state);
    c.completeSellerTrade();assert.equal(JSON.stringify(c.state),before);
  }
});
test('buyer rejects old listing, declined/unaccepted offers, changed amounts and insufficient funds',()=>{
  for(const change of [c=>{c.state.activeListing.id='L2';},c=>{c.state.buyerInbox[0].status='declined';},c=>{c.state.buyerInbox[0].status='new';},c=>{c.state.buyerInbox[0].offer=99000;},c=>{c.state.money=0;}]){
    const g=game(),c=g.c;buyer(g);change(c);const before=JSON.stringify(c.state);
    c.completeBuyerTrade('B1',100000);assert.equal(JSON.stringify(c.state),before);
  }
});
test('completed buyer offer cannot be revived for another car',()=>{
  const g=game(),c=g.c;const x=buyer(g);c.completeBuyerTrade('B1',100000);
  c.state.activeListing={id:'L2',status:'active',carKey:c.state.car._garageId};
  c.acceptBuyerOffer('B1');assert.equal(x.status,'sold');
  const before=JSON.stringify(c.state);c.completeBuyerTrade('B1',100000);assert.equal(JSON.stringify(c.state),before);
});
test('market diagnosis is preserved, repair stays fixed across garage views and reload',()=>{
  const g=game(),c=g.c;g.random(.9);seller(g);c.completeSellerTrade();
  const fault=c.state.car.flipCondition.name;
  c.repairDetectedIssue();assert.equal(c.state.car.flipCondition.repaired,true);
  const balance=c.state.money,spent=c.state.car.repairSpent;
  c.garage();c.garageCarDetails(0);
  assert.equal(c.state.car.flipCondition.name,fault);assert.equal(c.state.car.flipCondition.repaired,true);
  c.state=JSON.parse(JSON.stringify(c.state));vm.runInContext(modules[2],c);
  c.garage();c.repairDetectedIssue();assert.equal(c.state.money,balance);assert.equal(c.state.car.repairSpent,spent);
  assert.equal(c.state.car.market,c.state.car.healthyMarket);
});
test('condition application never rerolls a received car without a market preview',()=>{
  const g=game(),c=g.c;buyer(g);c.completeBuyerTrade('B1',100000);
  g.random(.9);c.applyMarketConditionToOwned(c.state.car);c.garage();
  assert.equal(c.state.car.flipCondition.healthy,true);
});
test('unchecked acquisitions cannot stay healthy forever and finalize only once',()=>{
  const g=game(),c=g.c;g.random(.2);
  const acquired=[1,2,3].map(id=>car(id));
  const outcomes=acquired.map(x=>c.finalizeAcquiredCondition(x));
  assert.deepEqual(Array.from(outcomes,x=>x.healthy),[true,true,false]);
  assert.equal(c.state.conditionLuck.total,3);
  const third=JSON.stringify(outcomes[2]);
  c.finalizeAcquiredCondition(acquired[2]);
  assert.equal(JSON.stringify(outcomes[2]),third);
  assert.equal(c.state.conditionLuck.total,3);
});
test('invalid seller input cannot corrupt the deal',()=>{
  const g=game(),c=g.c;seller(g);const before=JSON.stringify(c.state);
  g.input('Infinity');c.makeSellerTradeOffer();assert.equal(JSON.stringify(c.state),before);
  c.acceptSellerTradeCounter(Infinity);c.completeSellerTrade();assert.equal(c.state.money,170000);
});
test('buyer pays the exact positive difference, or exchanges without cash',()=>{
  for(const tradeValue of [97000,100000]){
    const g=game(),c=g.c;buyer(g,{tradeValue});c.completeBuyerTrade('B1',100000);
    assert.equal(c.state.money,200000+100000-tradeValue);
    assert.equal(c.state.car.buy,tradeValue);
  }
});
test('seller pays the difference when own valuation exceeds purchase price; diagnosis does not reroll',()=>{
  const g=game(),c=g.c;c.state.cars=[car(1)];c.state.car=c.state.cars[0];
  c.makes=[car(4,{listingId:'M1',price:70000})];
  g.random(.9);const diagnosed=c.ensureMarketFlipCondition(c.makes[0]);
  c.startSellerTradeIn(0,0);g.input('90000');c.makeSellerTradeOffer();g.random(.2);c.completeSellerTrade();
  assert.equal(c.state.money,220000);
  assert.equal(c.state.car.flipCondition.name,diagnosed.name);
  assert.equal(c.state.car.flipCondition.healthy,false);
});


test('purchase without diagnosis rolls healthy or broken, displays and saves the result',()=>{
  for(const roll of [.599,.60,.9]){
    const g=game(),c=g.c;g.random(roll);
    c.makes=[car(4,{listingId:'M1',price:100000})];
    c.buy(0,100000);
    assert.equal(c.state.car.flipCondition.healthy,roll<.60);
    assert.equal(c.state.car.repaired,roll<.60);
    assert.equal(c.state.money,100000);
    assert.equal(c.makes.length,0);
    assert.equal(c.state.cars.length,1);
    assert.equal(g.saved().car.flipCondition.healthy,roll<.60);
    assert.match(g.html(),roll<.60?/Автомобиль исправен/:/ОБНАРУЖЕНА ПОЛОМКА/);
    const outcome=JSON.stringify(c.state.car.flipCondition);
    g.random(roll<.60?.9:.2);
    c.state=JSON.parse(JSON.stringify(g.saved()));
    vm.runInContext(modules[2],c);c.garage();c.garageCarDetails(0);
    assert.equal(JSON.stringify(c.state.car.flipCondition),outcome);
  }
});

test('full diagnosis reveals the same condition subsequently received by purchase or exchange',()=>{
  for(const mode of ['purchase','exchange'])for(const roll of [.2,.9]){
    const g=game(),c=g.c;g.random(roll);
    c.makes=[car(4,{listingId:'M1',price:100000})];
    c.completeMarketInspection(0,'full');
    const preview=JSON.parse(JSON.stringify(c.makes[0].marketFlipCondition));
    assert.equal(c.makes[0].prePurchaseDiagnostic.found,!preview.healthy);
    assert.equal(c.makes[0].prePurchaseDiagnostic.healthyConfirmed,preview.healthy);
    g.random(roll<.60?.9:.2);
    if(mode==='purchase')c.buy(0,100000);
    else{
      c.state.cars=[car(1)];c.state.car=c.state.cars[0];
      c.startSellerTradeIn(0,0);g.input('90000');c.makeSellerTradeOffer();c.completeSellerTrade();
    }
    assert.equal(c.state.car.flipCondition.healthy,preview.healthy);
    assert.equal(c.state.car.flipCondition.name,preview.name);
    assert.equal(c.state.car.flipCondition.cost,preview.cost);
  }
});

test('missed fault in standard diagnosis remains broken after purchase or exchange',()=>{
  for(const mode of ['purchase','exchange']){
    const g=game(),c=g.c;g.random(.9);
    c.makes=[car(4,{listingId:'M1',price:100000})];
    c.completeMarketInspection(0,'standard');
    assert.equal(c.makes[0].prePurchaseDiagnostic.found,false);
    assert.equal(c.makes[0].marketFlipCondition.healthy,false);
    const fault=c.makes[0].marketFlipCondition.name;
    g.random(.2);
    if(mode==='purchase')c.buy(0,100000);
    else{
      c.state.cars=[car(1)];c.state.car=c.state.cars[0];
      c.startSellerTradeIn(0,0);g.input('90000');c.makeSellerTradeOffer();c.completeSellerTrade();
    }
    assert.equal(c.state.car.flipCondition.name,fault);
    assert.equal(c.state.car.repaired,false);
    assert.equal(c.state.car.flipCondition.discovered,true);
    assert.ok(c.state.car.market<c.state.car.healthyMarket);
  }
});

test('early condition lookup respects diagnosis instead of rolling a second healthy outcome',()=>{
  const g=game(),c=g.c;g.random(.9);
  const target=car(4);c.ensureMarketFlipCondition(target);g.random(.2);
  const issue=c.ensureFlipCondition(target);
  assert.equal(issue.healthy,false);
  assert.equal(issue.name,target.marketFlipCondition.name);
});

test('old healthy status cannot hide a diagnosed fault; repair charges once and survives reload',()=>{
  for(const lostPreview of [false,true]){
    const g=game(),c=g.c;g.random(.9);
    c.makes=[car(4,{listingId:'M1',price:100000})];c.completeMarketInspection(0,'full');
    const owned=JSON.parse(JSON.stringify(c.makes[0]));
    owned.flipConditionVersion=2;owned.flipCondition={healthy:true,repaired:true};owned.repaired=true;
    if(lostPreview)delete owned.marketFlipCondition;
    c.state.cars=[owned];c.state.car=owned;g.random(.2);c.garageCarDetails(0);
    assert.equal(owned.flipCondition.healthy,false);assert.equal(owned.repaired,false);
    assert.match(g.html(),/repairDetectedIssue/);
    const cost=owned.flipCondition.cost,balance=c.state.money;
    c.repairDetectedIssue();assert.equal(c.state.money,balance-cost);
    assert.equal(owned.market,owned.healthyMarket);
    c.state=JSON.parse(JSON.stringify(g.saved()));vm.runInContext(modules[2],c);
    c.garageCarDetails(0);c.repairDetectedIssue();
    assert.equal(c.state.money,balance-cost);assert.equal(c.state.car.flipCondition.repaired,true);
  }
});

test('startup loads dependencies explicitly before compatibility and condition overrides',()=>{
  const sources=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(sources,['cloud-save.js?v=20261010-2','world-data.js?v=20261006-1','script_base.js?v=20261010-2','car-catalog.js?v=20261006-4','v79_market.js','script.js?v=20261010-3','ui.js?v=20261010-4','plates.js?v=20261010-2','garage-system.js?v=20261010-4','world-system.js?v=20261007-6','negotiations-system.js?v=20261010-2','economy-system.js?v=20261010-3','game-account.js?v=20261010-2','community.js?v=20261010-4','store.js?v=20261010-3']);
  assert.doesNotMatch(compatibility,/document\.write\(/);
});
