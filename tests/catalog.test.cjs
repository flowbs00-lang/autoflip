const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.join(__dirname,'..');
function game(saved){
 let wallTime=Date.now();const GameDate=class extends Date{static now(){return wallTime;}};
 const elements={},storage=new Map();if(saved)storage.set('autoflip-v7-save',JSON.stringify(saved));
 function element(){return {style:{setProperty(){}},dataset:{},classList:{add(){},remove(){},toggle(){}},appendChild(){},setAttribute(){},addEventListener(){},querySelector(){return null},querySelectorAll(){return []},remove(){},innerHTML:'',textContent:''};}
 const c={structuredClone,console,Date:GameDate,Math:Object.create(Math),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},document:{documentElement:element(),getElementById:id=>elements[id]??=element(),querySelector:()=>null,querySelectorAll:()=>[],createElement:element,addEventListener(){}},setTimeout(){},setInterval(){},clearInterval(){},alert(){},confirm:()=>true,addEventListener(){}};
 c.window=c;vm.createContext(c);
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const m of html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)){const source=m[1]&&m[1].split('?')[0];vm.runInContext(source?fs.readFileSync(path.join(root,source),'utf8'):m[2],c,{filename:source||'inline'});}
 return {c,advance:ms=>wallTime+=ms,run:s=>vm.runInContext(s,c),saved:()=>JSON.parse(storage.get('autoflip-v7-save'))};
}
test('plates launcher opens with the real lexical game state, buys, sells and reloads',()=>{
 const g=game();assert.equal(g.c.state,undefined);
 g.c.openPlatesApp();assert.equal(g.run('state.plates.items.length'),0);
 const balance=g.run('state.money');g.c.openPlateCase('standard');
 assert.equal(g.run('state.money'),balance-3000);assert.equal(g.run('state.plates.items.length'),1);
 const restored=game(g.saved());restored.c.openPlatesApp();
 assert.equal(restored.run('state.plates.items.length'),1);
 const price=restored.run('state.plates.items[0].value');
 restored.c.sellPlate(restored.run('state.plates.items[0].id'));
 assert.equal(restored.run('state.money'),balance-3000+price);
 assert.equal(restored.run('state.plates.items.length'),0);
});
test('expanded catalogue has 100+ new models with unique local photographs and attribution',()=>{
 const g=game(),cars=g.c.carCatalogExtra;assert.ok(cars.length>=100);
 assert.equal(new Set(cars.map(c=>c.name)).size,cars.length);
 const hashes=new Set();for(const c of cars){const bytes=fs.readFileSync(path.join(root,c.photoUrl));assert.equal(bytes.toString('ascii',0,4),'RIFF');hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));assert.ok(c.year>=c.yearMin&&c.year<=c.yearMax);assert.ok(c.price>0&&c.market>0&&c.repair>0);assert.ok(c.photoCredit&&c.photoSource);}
 assert.equal(hashes.size,cars.length);
 for(const [lo,hi] of [[0,500000],[500000,1500000],[1500000,4000000],[4000000,Infinity]])assert.ok(cars.some(c=>c.market>=lo&&c.market<hi));
});
test('fresh market has 50 active and 50 reserve listings in every supported city',()=>{
 const g=game();assert.equal(g.run('makes.length'),2000);assert.equal(g.run('new Set(makes.map(c=>c.listingId)).size'),2000);
 assert.equal(g.run('cities.length'),20);
 assert.equal(g.run('cities.every(city=>makes.filter(c=>c.city===city&&c.marketActive!==false).length===50)'),true);
 assert.equal(g.run('cities.every(city=>makes.filter(c=>c.city===city&&c.marketActive===false).length===50)'),true);
 assert.ok(JSON.stringify(g.saved()).length<4500000,'market save must fit normal browser storage limits');
 for(const t of g.c.carCatalogExtra){const car=g.c.createMarketListing(t);assert.equal(car.photoUrl,t.photoUrl);assert.equal(car.body,t.body);assert.ok(car.year>=t.yearMin&&car.year<=t.yearMax);assert.ok(Number.isFinite(car.price));}
});
test('cheap feed starts with different models and different photographs',()=>{
 const g=game();
 const first=g.run("diversifyMarketModels(makes.filter(c=>c.marketActive!==false).sort((a,b)=>a.price-b.price)).slice(0,8)");
 assert.equal(new Set(first.map(c=>c.name)).size,8);
 assert.equal(new Set(first.map(c=>c.photoUrl)).size,8);
 const budget=new Map(g.c.carCatalogExtra.map(c=>[c.name,c.market]));
 assert.equal(budget.get('Fiat Punto II'),160000);assert.equal(budget.get('Renault Clio II'),190000);
 assert.equal(budget.get('Opel Vectra B'),180000);assert.equal(budget.get('Opel Corsa C'),220000);assert.equal(budget.get('Opel Astra G'),260000);
});
test('every city always has ten distinct starter cars for 40,000 to 80,000 rubles',()=>{
 const g=game();
 for(const city of g.run('cities')){
   const starter=g.run(`makes.filter(c=>c.city===${JSON.stringify(city)}&&c.marketActive!==false&&c.starterOffer)`);
   assert.equal(starter.length,10,city);
   assert.equal(new Set(starter.map(c=>c.name)).size,10,city+' models');
   assert.equal(new Set(starter.map(c=>c.photoUrl)).size,10,city+' photos');
   assert.ok(starter.every(c=>c.price>=40000&&c.price<=80000),city+' prices');
   assert.ok(starter.every(c=>c.restorationProject&&c.damageSummary&&c.photoUrl.includes('commons.wikimedia.org')),city+' restoration projects');
   assert.ok(starter.every(c=>(c.market-c.price)/c.price>=.10&&(c.market-c.price)/c.price<=.20),city+' balanced market spread');
   assert.ok(starter.every(c=>c.market>c.price+c.repair),city+' repair must leave a small profit');
 }
});
test('restoration projects always keep their visible fault after purchase',()=>{
 const g=game();const car=g.run('makes.find(c=>c.restorationProject)');
 const condition=g.c.ensureMarketFlipCondition(car);
 assert.equal(condition.healthy,false);assert.equal(condition.name,car.risk);assert.equal(condition.cost,car.repair);
 const owned=g.c.applyMarketConditionToOwned(car);assert.equal(owned.healthy,false);assert.equal(owned.name,car.risk);
});
test('buying a starter car replenishes the affordable city stock',()=>{
 const g=game();const city='Москва';
 const id=g.run(`makes.find(c=>c.city==='Москва'&&c.starterOffer).listingId`);
 g.c.removePurchasedListing(id);
 assert.equal(g.run(`makes.filter(c=>c.city==='Москва'&&c.marketActive!==false&&c.starterOffer).length`),10);
 assert.equal(g.run(`makes.some(c=>c.listingId===${JSON.stringify(id)})`),false);
});
test('old artificial starter cars return to normal prices during migration',()=>{
 const first=game(),saved=first.saved(),legacy=saved.marketListings.find(c=>c.city==='Москва'&&c.starterOffer);
 Object.assign(legacy,{name:'Fiat Punto II',price:40000,basePrice:40000,market:70000,sale:70000,repair:12000,starterOffer:true,starterVersion:1,restorationProject:false,photoUrl:'assets/cars/fiat-punto-1999.webp'});
 delete legacy.damageSummary;delete legacy.photo;saved.marketListingsVersion=7;
 const restored=game(saved);
 const car=restored.run(`makes.find(c=>c.listingId===${JSON.stringify(legacy.listingId)})`);
 assert.equal(car.starterOffer,false);assert.equal(car.price,138000);assert.equal(car.market,160000);
 assert.equal(restored.run(`makes.filter(c=>c.city==='Москва'&&c.starterOffer&&c.restorationProject).length`),10);
});
test('migration keeps money, owned cars, favourite identity and diagnostics while growing the market',()=>{
 const first=game();const saved=first.saved();saved.marketListings=saved.marketListings.filter(c=>!c.restorationProject).slice(0,36);saved.marketListingsVersion=3;
 saved.marketFavorites=[saved.marketListings[0].listingId];saved.marketListings[0].marketFlipCondition={healthy:false,name:'Двигатель',loss:.35,cost:20000};saved.marketListings[0].marketConditionVersion=2;saved.money=123456;
 const second=game(saved);assert.equal(second.run('makes.length'),2000);assert.equal(second.run('state.money'),123456);assert.equal(second.run('makes[0].listingId'),saved.marketFavorites[0]);assert.equal(second.run('makes[0].marketFlipCondition.name'),'Двигатель');
 assert.equal(second.run('state.marketFavorites[0]'),saved.marketFavorites[0]);
});
test('empty preview profile returns to the intended 100,000 start without touching progressed profiles',()=>{
 const empty={money:1500000,rep:0,deals:0,city:'Москва',car:null,cars:[],loan:0,logs:['preview'],sound:true,day:1,locked:false,notifications:2,seen:{},notes:[]};
 const migrated=game(empty);assert.equal(migrated.run('state.money'),100000);assert.equal(migrated.run('state.economyVersion'),2);
 const progressed=game({...empty,deals:1});assert.equal(progressed.run('state.money'),1500000);
});
test('exchange generator works with the actual loaded catalogue and purchase removal is idempotent',()=>{
 const g=game();const trade=g.c.makeExchangeCar({name:'Example',market:1200000});assert.ok(trade&&trade.photoUrl);assert.ok(g.c.marketTemplates.some(c=>c.name===trade.name));
 const id=g.run('makes[0].listingId');g.c.removePurchasedListing(id);const before=g.run('makes.length');g.c.removePurchasedListing(id);assert.equal(g.run('makes.length'),before);assert.equal(g.run('makes.some(c=>c.listingId==='+JSON.stringify(id)+')'),false);
});
test('each added model keeps a forced fault through acquisition and paid repair',()=>{
 const g=game();g.run('state.money=1000000000');
 for(const t of g.c.carCatalogExtra){const car=g.c.createMarketListing(t);g.c.Math.random=()=>.9;g.c.ensureMarketFlipCondition(car);g.c.Math.random=()=>.2;const issue=g.c.applyMarketConditionToOwned(car);assert.equal(issue.healthy,false,t.name);g.run('state.cars=[]');g.c.testCar=car;g.run('state.car=testCar;state.cars=[testCar]');const balance=g.run('state.money');g.c.repairDetectedIssue();assert.equal(g.run('state.money'),balance-issue.cost);assert.equal(car.market,car.healthyMarket);g.c.garage();assert.equal(car.flipCondition.repaired,true);}
});


test('scheduled refresh swaps active city stock and excludes the purchased listing',()=>{
 const g=game();g.c.market();const bought=g.run('makes[0].listingId');g.c.removePurchasedListing(bought);
 const initial=g.run('new Set(makes.filter(c=>c.marketActive!==false).map(c=>c.listingId))');g.advance(361000);g.c.refreshLiveMarket();
 assert.equal(g.run('makes.length'),2000);assert.equal(g.run('new Set(makes.map(c=>c.listingId)).size'),2000);
 assert.equal(g.run('cities.every(city=>makes.filter(c=>c.city===city&&c.marketActive!==false).length===50)'),true);
 assert.equal(g.run('makes.some(c=>c.listingId==='+JSON.stringify(bought)+')'),false);
 assert.ok(g.run('makes.filter(c=>c.price>0&&Number.isFinite(c.price)).length')===2000);
 assert.ok(g.run('state.marketUpdateHistory[0].added.length')>=200);
 const after=g.run('makes.filter(c=>c.marketActive!==false).map(c=>c.listingId)');assert.ok(after.some(id=>!initial.has(id)));
});
