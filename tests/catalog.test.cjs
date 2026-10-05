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
 for(const m of html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g))vm.runInContext(m[1]?fs.readFileSync(path.join(root,m[1]),'utf8'):m[2],c,{filename:m[1]||'inline'});
 return {c,advance:ms=>wallTime+=ms,run:s=>vm.runInContext(s,c),saved:()=>JSON.parse(storage.get('autoflip-v7-save'))};
}
test('expanded catalogue has 100+ new models with unique local photographs and attribution',()=>{
 const g=game(),cars=g.c.carCatalogExtra;assert.ok(cars.length>=100);
 assert.equal(new Set(cars.map(c=>c.name)).size,cars.length);
 const hashes=new Set();for(const c of cars){const bytes=fs.readFileSync(path.join(root,c.photoUrl));assert.equal(bytes.toString('ascii',0,4),'RIFF');hashes.add(crypto.createHash('sha256').update(bytes).digest('hex'));assert.ok(c.year>=c.yearMin&&c.year<=c.yearMax);assert.ok(c.price>0&&c.market>0&&c.repair>0);assert.ok(c.photoCredit&&c.photoSource);}
 assert.equal(hashes.size,cars.length);
 for(const [lo,hi] of [[0,500000],[500000,1500000],[1500000,4000000],[4000000,Infinity]])assert.ok(cars.some(c=>c.market>=lo&&c.market<hi));
});
test('fresh market has 140 unique listings and all new models can generate valid cars',()=>{
 const g=game();assert.equal(g.run('makes.length'),140);assert.equal(g.run('new Set(makes.map(c=>c.name)).size'),140);assert.equal(g.run('new Set(makes.map(c=>c.listingId)).size'),140);
 for(const t of g.c.carCatalogExtra){const car=g.c.createMarketListing(t);assert.equal(car.photoUrl,t.photoUrl);assert.equal(car.body,t.body);assert.ok(car.year>=t.yearMin&&car.year<=t.yearMax);assert.ok(Number.isFinite(car.price));}
});
test('migration keeps money, owned cars, favourite identity and diagnostics while growing the market',()=>{
 const first=game();const saved=first.saved();saved.marketListings=saved.marketListings.slice(0,36);saved.marketListingsVersion=3;
 saved.marketFavorites=[saved.marketListings[0].listingId];saved.marketListings[0].marketFlipCondition={healthy:false,name:'Двигатель',loss:.35,cost:20000};saved.marketListings[0].marketConditionVersion=2;saved.money=123456;
 const second=game(saved);assert.equal(second.run('makes.length'),140);assert.equal(second.run('state.money'),123456);assert.equal(second.run('makes[0].listingId'),saved.marketFavorites[0]);assert.equal(second.run('makes[0].marketFlipCondition.name'),'Двигатель');
 assert.equal(second.run('state.marketFavorites[0]'),saved.marketFavorites[0]);
});
test('exchange generator works with the actual loaded catalogue and purchase removal is idempotent',()=>{
 const g=game();const trade=g.c.makeExchangeCar({name:'Example',market:1200000});assert.ok(trade&&trade.photoUrl);assert.ok(g.c.marketTemplates.some(c=>c.name===trade.name));
 const id=g.run('makes[0].listingId');g.c.removePurchasedListing(id);const before=g.run('makes.length');g.c.removePurchasedListing(id);assert.equal(g.run('makes.length'),before);assert.equal(g.run('makes.some(c=>c.listingId==='+JSON.stringify(id)+')'),false);
});
test('each added model keeps a forced fault through acquisition and paid repair',()=>{
 const g=game();g.run('state.money=1000000000');
 for(const t of g.c.carCatalogExtra){const car=g.c.createMarketListing(t);g.c.Math.random=()=>.9;g.c.ensureMarketFlipCondition(car);g.c.Math.random=()=>.2;const issue=g.c.applyMarketConditionToOwned(car);assert.equal(issue.healthy,false,t.name);g.run('state.cars=[]');g.c.testCar=car;g.run('state.car=testCar;state.cars=[testCar]');const balance=g.run('state.money');g.c.repairDetectedIssue();assert.equal(g.run('state.money'),balance-issue.cost);assert.equal(car.market,car.healthyMarket);g.c.garage();assert.equal(car.flipCondition.repaired,true);}
});


test('scheduled refresh keeps 140 entries, unique identities and excludes the purchased listing',()=>{
 const g=game();g.c.market();const bought=g.run('makes[0].listingId');g.c.removePurchasedListing(bought);
 const initial=g.run('new Set(makes.map(c=>c.listingId))');g.advance(361000);g.c.refreshLiveMarket();
 assert.equal(g.run('makes.length'),140);assert.equal(g.run('new Set(makes.map(c=>c.listingId)).size'),140);
 assert.equal(g.run('new Set(makes.map(c=>c.name)).size'),140);
 assert.equal(g.run('makes.some(c=>c.listingId==='+JSON.stringify(bought)+')'),false);
 assert.ok(g.run('makes.filter(c=>c.price>0&&Number.isFinite(c.price)).length')===140);
 assert.ok(g.run('state.marketUpdateHistory[0].added.length')>=14);
 const after=g.run('makes.map(c=>c.listingId)');assert.ok(after.some(id=>!initial.has(id)));
});
