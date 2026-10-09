const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../plates.js'),'utf8');
const worldSource=fs.readFileSync(path.join(__dirname,'../world-data.js'),'utf8');
function game(saved,animate=false){
  let html='',savedState,scheduled,delays=[];
  const c={state:saved||{money:1000000,garageLevel:1},window:null,Math:Object.create(Math),Date,render:v=>html=v,head:t=>'<h1>'+t+'</h1>',money:n=>Number(n).toLocaleString('ru-RU')+' ₽',persist:()=>{savedState=JSON.parse(JSON.stringify(c.state));},alert:()=>{},pushPhoneNotification:()=>{}};
  if(animate){c.setTimeout=(fn,ms)=>{scheduled=fn;delays.push(ms);return 1;};c.clearTimeout=()=>{scheduled=null;};}
  c.Math.random=Math.random;c.window=c;vm.createContext(c);vm.runInContext(worldSource,c);vm.runInContext(source,c);
  return {c,html:()=>html,saved:()=>savedState,delays:()=>delays.slice(),runTimer:()=>scheduled&&scheduled()};
}
test('all case probability tables total 100%',()=>{
  const g=game();for(const box of g.c.plateSystem.cases){const total=box.weights.reduce((s,x)=>s+x[1],0);assert.equal(total,100,box.id);}
  assert.equal(g.c.plateSystem.cases.find(x=>x.id==='collector').level,8);
  assert.equal(g.c.plateSystem.cases.find(x=>x.id==='legend').level,10);
});
test('region pool contains only the codes of the twenty game cities',()=>{
  const g=game(),actual=new Set(g.c.plateSystem.regions.map(x=>x[0]));
  const expected=['77','97','799','78','98','178','52','152','66','96','196','43','23','93','123','59','81','159','39','91','86','186','75','80','16','116','716','25','125','76','61','161','761','05','02','102','702','36','136','56','69','63','163','763'];
  assert.deepEqual([...actual].sort(),expected.sort());assert.equal(actual.size,expected.length);
});
test('roll respects case probability boundaries',()=>{
  const g=game(),weights=g.c.plateSystem.cases[4].weights;
  assert.equal(g.c.plateSystem.rollPlateRarity(weights,0),'ordinary');
  assert.equal(g.c.plateSystem.rollPlateRarity(weights,.05),'unusual');
  assert.equal(g.c.plateSystem.rollPlateRarity(weights,.9995),'priceless');
});
test('every generated plate has uppercase letters, a CIS city and the correct sale value',()=>{
  const g=game();for(const [rarity,meta] of Object.entries(g.c.plateSystem.rarities)){const plate=g.c.plateSystem.makePlate(rarity);assert.equal(plate.number,plate.number.toUpperCase());assert.ok(plate.region.city);assert.ok(plate.region.country);assert.equal(plate.value,meta.value);}
});
test('priceless series is strictly one of the five 777 plates',()=>{
  const g=game(),allowed=new Set(g.c.plateSystem.regions.map(x=>x[0]));for(let i=0;i<30;i++){const p=g.c.plateSystem.makePlate('priceless');assert.match(p.number,/^(А777МР|Е777КХ|А777АА|В777ОР|О777ОО)$/);assert.ok(allowed.has(p.region.code));}
});
test('locked cases cannot take money and the starter case stores a plate',()=>{
  const g=game();g.c.plates();const before=g.c.state.money;g.c.openPlateCase('rare');assert.equal(g.c.state.money,before);assert.equal(g.c.state.plates.items.length,0);
  g.c.openPlateCase('standard');assert.equal(g.c.state.money,before-3000);assert.equal(g.c.state.plates.items.length,1);assert.match(g.html(),/НОВЫЙ НОМЕР/);
});
test('selling returns exactly the configured rarity value',()=>{
  const g=game({money:0,garageLevel:1,plates:{items:[{id:'one',number:'А111МР',region:{code:'77',city:'Москва',country:'Россия'},rarity:'secret',value:500000}],nextId:2}});g.c.sellPlate('one');assert.equal(g.c.state.money,500000);assert.equal(g.c.state.plates.items.length,0);
});
test('premium store plate is visible but cannot be sold',()=>{
  const g=game({money:0,garageLevel:1,plates:{items:[{id:'premium',number:'А111АА',region:{code:'77',city:'Москва',country:'Россия'},rarity:'secret',value:0,createdAt:1,attachedCarId:null,premium:true,tradable:false}],nextId:2}});
  g.c.plates();g.c.setPlateTab('collection');assert.match(g.html(),/Не продаётся/);
  g.c.confirmPlateSale('premium');assert.doesNotMatch(g.html(),/ПРОДАЖА НОМЕРА/);
  g.c.sellPlate('premium');assert.equal(g.c.state.money,0);assert.equal(g.c.state.plates.items.length,1);
});
test('case opening renders animation before revealing the won plate',()=>{
  const g=game(undefined,true);g.c.plates();g.c.openPlateCase('standard');assert.match(g.html(),/ОТКРЫВАЕМ/);assert.match(g.html(),/Пропустить анимацию/);
  const won=g.c.state.plates.items[0],full=won.number+' '+won.region.code;
  g.runTimer();assert.match(g.html(),/Лента замедляется/);assert.match(g.html(),/number-reel/);assert.ok(g.html().includes(full));assert.deepEqual(g.delays(),[1200,3600]);
  g.runTimer();assert.match(g.html(),/НОВЫЙ НОМЕР/);assert.match(g.html(),/plate-main/);assert.match(g.html(),/plate-region/);g.c.finishPlateOpening();assert.match(g.html(),/Коллекция/);
});
test('collection supports favorites, filters and a sale confirmation sheet',()=>{
  const g=game({money:0,garageLevel:1,plates:{items:[{id:'one',number:'А111МР',region:{code:'77',city:'Москва',country:'Россия'},rarity:'secret',value:500000,createdAt:1}],nextId:2}});
  g.c.plates();g.c.setPlateTab('collection');g.c.favoritePlate('one');assert.equal(g.c.state.plates.items[0].favorite,true);
  g.c.setPlateFilter('favorites');assert.match(g.html(),/plate-main/);assert.match(g.html(),/<strong>111<\/strong>/);g.c.confirmPlateSale('one');assert.match(g.html(),/ПРОДАЖА НОМЕРА/);
  g.c.cancelPlateSale();assert.doesNotMatch(g.html(),/ПРОДАЖА НОМЕРА/);
});
test('old lowercase plate numbers migrate to uppercase',()=>{
  const g=game({money:0,garageLevel:1,plates:{items:[{id:'old',number:'в435хв',region:{code:'43',city:'Киров',country:'Россия'},rarity:'ordinary',value:1000}],nextId:2}});
  g.c.plates();assert.equal(g.c.state.plates.items[0].number,'В435ХВ');g.c.setPlateTab('collection');assert.match(g.html(),/<em>В<\/em><strong>435<\/strong><em>ХВ<\/em>/);
});
test('old removed regions migrate without deleting the collected plate',()=>{
  const g=game({money:0,garageLevel:1,plates:{items:[{id:'old-region',number:'А123ВС',region:{code:'54',city:'Новосибирск',country:'Россия'},rarity:'ordinary',value:1000}],nextId:2}});
  g.c.plates();const plate=g.c.state.plates.items[0],allowed=new Set(g.c.plateSystem.regions.map(x=>x[0]));assert.equal(g.c.state.plates.items.length,1);assert.ok(allowed.has(plate.region.code));
});
