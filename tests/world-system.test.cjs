const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const data=fs.readFileSync(path.join(__dirname,'../world-data.js'),'utf8');
const system=fs.readFileSync(path.join(__dirname,'../world-system.js'),'utf8');

function worldGame(){
  let html='',advanced=0;
  const c={window:null,state:{money:1000000,city:'Москва',day:1,gameClock:{total:450},cars:[{name:'Old Car',city:'Новосибирск',_garageId:'old-1'}]},makes:[],render:v=>html=v,head:t=>'<h1>'+t+'</h1>',money:n=>Math.round(n)+' ₽',persist(){},save(){},log(){},market(){},alert(){},advanceGameMinutes:n=>{advanced+=n;c.state.gameClock.total+=n;},getGameTotal:()=>c.state.gameClock.total};
  c.window=c;vm.createContext(c);vm.runInContext(data,c);vm.runInContext(system,c);
  return {c,html:()=>html,advanced:()=>advanced};
}

test('world contains exactly the requested twenty cities and their plate codes',()=>{
  const g=worldGame(),names=g.c.autoFlipWorld.cities.map(x=>x.name);
  assert.equal(names.length,20);assert.deepEqual(Array.from(names),['Москва','Санкт-Петербург','Нижний Новгород','Екатеринбург','Киров','Краснодар','Пермь','Калининград','Сургут','Чита','Казань','Владивосток','Ярославль','Ростов','Махачкала','Уфа','Воронеж','Оренбург','Тверь','Самара']);
  assert.deepEqual(Array.from(g.c.autoFlipWorld.cities.find(x=>x.name==='Москва').regions),['77','97','799']);
  assert.deepEqual(Array.from(g.c.autoFlipWorld.cities.find(x=>x.name==='Самара').regions),['63','163','763']);
  assert.ok(names.includes(g.c.state.cars[0].city),'owned cars from old saves are migrated to a supported city');
});

test('every transport calculates a positive fare and travel time',()=>{
  const g=worldGame(),w=g.c.autoFlipWorld,from=w.cities[0],to=w.cities[4];
  assert.ok(w.distance(from,to)>700);
  for(const transport of w.transports){const trip=w.trip(from,to,transport);assert.ok(trip.cost>0);assert.ok(trip.minutes>0);assert.equal(trip.km,w.distance(from,to));}
});

test('trip charges money, advances time and switches city market',()=>{
  const g=worldGame(),before=g.c.state.money;
  g.c.confirmWorldTrip('kirov','train');
  assert.equal(g.c.state.city,'Киров');assert.equal(g.c.state.marketCityFilter,'Киров');assert.ok(g.c.state.money<before);assert.ok(g.advanced()>0);assert.equal(g.c.state.travelHistory.length,1);
});
