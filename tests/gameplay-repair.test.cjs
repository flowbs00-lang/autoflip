const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const condition=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]).find(s=>s.trim().startsWith('// V7.9 — новая механика'));
function game(car){
  let saved,alerts=[];
  const c={state:{money:100000,rep:10,city:'Москва',day:1,cars:[car],car,gameClock:{total:60},meetings:[]},window:null,Math,Date,console,
    document:{querySelector:()=>null},objective:{},objectiveSub:{},money:String,photo:()=>'',head:()=>'',render(){},garage(){},persist(){saved=JSON.parse(JSON.stringify(c.state));},save(){},log(){},alert:s=>alerts.push(s),localStorage:{setItem(){}},setInterval(){},startVisibleInterval(){},
    AUTOFLIP_CLOUD_FLUSH:async()=>true,fetch:async(url,options)=>({ok:true,json:async()=>({ok:true,result:{healthyMarket:72000},committed:JSON.parse(options.body).phase==='commit'})})};
  c.window=c;vm.createContext(c);vm.runInContext(condition,c);vm.runInContext(fs.readFileSync(path.join(root,'economy-system.js'),'utf8'),c);
  return {c,alerts,saved:()=>saved};
}
function car(){return {_garageId:'owned-1',id:1,name:'ВАЗ 2106',city:'Москва',year:2000,km:252000,buy:71000,market:72000,sale:72000,healthyMarket:72000,flipConditionVersion:2,acquisitionConditionFinalized:true,repaired:true,repairSpent:0,
  flipCondition:{healthy:true,name:'Исправный автомобиль',loss:0,cost:0,discovered:true,repaired:true},
  marketFlipCondition:{healthy:false,name:'Тормозные диски и колодки',loss:.05,cost:3600,healthyMarket:72000}};}
test('opening a server-finalized car never reinstates a stale market fault',()=>{
  const g=game(car()),before=JSON.stringify(g.c.state.car.flipCondition);
  g.c.garageCarDetails(0);
  assert.equal(JSON.stringify(g.c.state.car.flipCondition),before);
  assert.equal(g.c.state.car.market,72000);
});
test('repair is applied once, including double taps, and survives reopening the garage',async()=>{
  const vehicle=car();vehicle.flipCondition={...vehicle.marketFlipCondition,discovered:true,repaired:false};vehicle.flipCondition.healthy=false;vehicle.repaired=false;vehicle.market=68400;vehicle.sale=68400;
  const g=game(vehicle);
  await Promise.all([g.c.repairDetectedIssue(),g.c.repairDetectedIssue()]);
  g.c.garageCarDetails(0);
  assert.equal(g.c.state.money,96400);assert.equal(vehicle.repairSpent,3600);assert.equal(vehicle.market,72000);assert.equal(vehicle.flipCondition.repaired,true);
  assert.equal(g.c.state.economy.appliedIds.filter(id=>id==='repair:owned-1').length,1);
});
test('a failed save blocks repair without charging or changing the car',async()=>{
  const vehicle=car();vehicle.flipCondition={...vehicle.marketFlipCondition,discovered:true,repaired:false};vehicle.repaired=false;
  const g=game(vehicle);g.c.AUTOFLIP_CLOUD_FLUSH=async()=>false;
  await g.c.repairDetectedIssue();assert.equal(g.c.state.money,100000);assert.equal(vehicle.repairSpent,0);assert.equal(vehicle.flipCondition.repaired,false);
});
test('recovery restores server car fields but preserves local money, tasks and pending repairs',async()=>{
  const vehicle=car(),g=game(vehicle),canonical=JSON.parse(JSON.stringify(vehicle));
  vehicle.market=68400;vehicle.flipCondition={...vehicle.marketFlipCondition,repaired:false};
  g.c.fetch=async()=>({ok:true,json:async()=>({save:{cars:[canonical]}})});
  const balance=g.c.state.money;g.c.state.customTaskProgress=7;
  assert.equal(await g.c.AUTOFLIP_RECOVER_CAR_SAVE(),true);
  assert.equal(vehicle.market,72000);assert.equal(vehicle.flipCondition.healthy,true);
  assert.equal(g.c.state.money,balance);assert.equal(g.c.state.customTaskProgress,7);
  g.c.state.economy.appliedIds.push('repair:owned-1');
  g.c.state.economy.pendingCommits.push({id:'repair:owned-1',type:'repair',payload:{sourceId:'owned-1'}});
  vehicle.repairSpent=3600;
  assert.equal(await g.c.AUTOFLIP_RECOVER_CAR_SAVE(),false);assert.equal(vehicle.repairSpent,3600);
});
test('repair still targets the captured car if navigation changes during confirmation',async()=>{
  const vehicle=car();vehicle.flipCondition={...vehicle.marketFlipCondition,discovered:true,repaired:false};vehicle.repaired=false;
  const g=game(vehicle),other={...car(),_garageId:'owned-2'};g.c.state.cars.push(other);
  g.c.fetch=async(url,options)=>{if(JSON.parse(options.body).phase==='prepare')g.c.state.car=other;return {ok:true,json:async()=>({ok:true,result:{healthyMarket:72000}})};};
  await g.c.repairDetectedIssue();assert.equal(vehicle.repairSpent,3600);assert.equal(other.repairSpent,0);assert.equal(g.c.state.money,96400);
});
