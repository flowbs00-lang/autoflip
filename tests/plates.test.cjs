const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../plates.js'),'utf8');
function game(saved,animate=false){
  let html='',savedState,scheduled;
  const c={state:saved||{money:1000000,garageLevel:1},window:null,Math:Object.create(Math),Date,render:v=>html=v,head:t=>'<h1>'+t+'</h1>',money:n=>Number(n).toLocaleString('ru-RU')+' ₽',persist:()=>{savedState=JSON.parse(JSON.stringify(c.state));},alert:()=>{},pushPhoneNotification:()=>{}};
  if(animate){c.setTimeout=fn=>{scheduled=fn;return 1;};c.clearTimeout=()=>{scheduled=null;};}
  c.Math.random=Math.random;c.window=c;vm.createContext(c);vm.runInContext(source,c);
  return {c,html:()=>html,saved:()=>savedState,runTimer:()=>scheduled&&scheduled()};
}
test('all case probability tables total 100%',()=>{
  const g=game();for(const box of g.c.plateSystem.cases){const total=box.weights.reduce((s,x)=>s+x[1],0);assert.equal(total,100,box.id);}
});
test('roll respects case probability boundaries',()=>{
  const g=game(),weights=g.c.plateSystem.cases[4].weights;
  assert.equal(g.c.plateSystem.rollPlateRarity(weights,0),'ordinary');
  assert.equal(g.c.plateSystem.rollPlateRarity(weights,.05),'unusual');
  assert.equal(g.c.plateSystem.rollPlateRarity(weights,.9995),'priceless');
});
test('every generated plate has a CIS city and the correct sale value',()=>{
  const g=game();for(const [rarity,meta] of Object.entries(g.c.plateSystem.rarities)){const plate=g.c.plateSystem.makePlate(rarity);assert.ok(plate.number);assert.ok(plate.region.city);assert.ok(plate.region.country);assert.equal(plate.value,meta.value);}
});
test('priceless series is strictly one of the five 777 plates',()=>{
  const g=game();for(let i=0;i<30;i++){const p=g.c.plateSystem.makePlate('priceless');assert.match(p.number,/^(А777МР|Е777КХ|А777АА|В777ОР|О777ОО)$/);assert.equal(p.region.code,'777');}
});
test('locked cases cannot take money and the starter case stores a plate',()=>{
  const g=game();g.c.plates();const before=g.c.state.money;g.c.openPlateCase('rare');assert.equal(g.c.state.money,before);assert.equal(g.c.state.plates.items.length,0);
  g.c.openPlateCase('standard');assert.equal(g.c.state.money,before-3000);assert.equal(g.c.state.plates.items.length,1);assert.match(g.html(),/НОВЫЙ НОМЕР/);
});
test('selling returns exactly the configured rarity value',()=>{
  const g=game({money:0,garageLevel:1,plates:{items:[{id:'one',number:'А111МР',region:{code:'77',city:'Москва',country:'Россия'},rarity:'secret',value:500000}],nextId:2}});g.c.sellPlate('one');assert.equal(g.c.state.money,500000);assert.equal(g.c.state.plates.items.length,0);
});
test('case opening renders animation before revealing the won plate',()=>{
  const g=game(undefined,true);g.c.plates();g.c.openPlateCase('standard');assert.match(g.html(),/ОТКРЫВАЕМ/);assert.match(g.html(),/Пропустить анимацию/);
  g.runTimer();assert.match(g.html(),/НОВЫЙ НОМЕР/);g.c.finishPlateOpening();assert.match(g.html(),/Коллекция/);
});
test('collection supports favorites, filters and a sale confirmation sheet',()=>{
  const g=game({money:0,garageLevel:1,plates:{items:[{id:'one',number:'А111МР',region:{code:'77',city:'Москва',country:'Россия'},rarity:'secret',value:500000,createdAt:1}],nextId:2}});
  g.c.plates();g.c.setPlateTab('collection');g.c.favoritePlate('one');assert.equal(g.c.state.plates.items[0].favorite,true);
  g.c.setPlateFilter('favorites');assert.match(g.html(),/А111МР/);g.c.confirmPlateSale('one');assert.match(g.html(),/ПРОДАЖА НОМЕРА/);
  g.c.cancelPlateSale();assert.doesNotMatch(g.html(),/ПРОДАЖА НОМЕРА/);
});
