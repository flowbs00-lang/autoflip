const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../autopass-system.js'),'utf8');

function game(overrides={}){
  let html='';
  const context={
    state:{money:100000,rep:0,day:1,store:{},plates:{items:[],nextId:1},...overrides},
    render(value){html=value;},head:title=>`<header>${title}</header>`,persist(){},save(){},
    openStoreProduct(){context.storeOpened=true;},gameTasks(){},pushPhoneNotification(){},
    document:{querySelector(){return null;}},setTimeout(){},Date,console
  };
  context.window=context;
  vm.createContext(context);
  vm.runInContext(source,context);
  return {context,html:()=>html};
}

test('AutoPass contains 60 safe rewards on each track',()=>{
  const {context:c}=game();
  assert.equal(c.AUTOFLIP_AUTOPASS.maxLevel,60);
  const free=[],ultimate=[];
  for(let level=1;level<=60;level++){
    free.push(c.AUTOFLIP_AUTOPASS.reward(level,false));
    ultimate.push(c.AUTOFLIP_AUTOPASS.reward(level,true));
  }
  assert.equal(free.length,60);assert.equal(ultimate.length,60);
  const cash=items=>items.filter(x=>x.type==='money').reduce((sum,x)=>sum+x.value,0);
  assert.ok(cash(free)<=800000,'free capital remains bounded');
  assert.ok(cash(ultimate)<=1500000,'Ultimate capital remains bounded');
  assert.deepEqual(free.filter(x=>x.type==='case').map(x=>[x.value.id,x.value.key]),[
    ['rare','autopass:night-dealer-1:free:10'],
    ['secret','autopass:night-dealer-1:free:30'],
    ['collector','autopass:night-dealer-1:free:59']
  ]);
  assert.deepEqual(ultimate.filter(x=>x.type==='case').map(x=>[x.value.id,x.value.key]),[
    ['secret','autopass:night-dealer-1:ultimate:15'],
    ['secret','autopass:night-dealer-1:ultimate:30'],
    ['collector','autopass:night-dealer-1:ultimate:45'],
    ['legend','autopass:night-dealer-1:ultimate:60']
  ]);
  assert.equal(ultimate.filter(x=>x.type==='plate').length,0);
});

test('rewards are idempotent and AutoPass cases are issued only once',()=>{
  const {context:c}=game({autopass:{season:'night-dealer-1',points:6000,ultimate:true,freeClaimed:[],ultimateClaimed:[],cosmetics:[],daily:{day:1,earned:0},history:[]}});
  c.claimAllAutoPassRewards();
  const after=c.state.money;
  c.claimAllAutoPassRewards();
  assert.equal(c.state.money,after);
  assert.equal(c.state.autopass.freeClaimed.length,60);
  assert.equal(c.state.autopass.ultimateClaimed.length,60);
  assert.equal(c.state.plates.items.length,0);
  assert.equal(c.state.plates.caseRewards.length,7);
  assert.equal(new Set(c.state.plates.caseRewards.map(x=>x.key)).size,7);
});

test('regular gameplay points have a 300 point daily cap',()=>{
  const {context:c}=game();
  assert.equal(c.AUTOFLIP_AUTOPASS.addPoints(250,'Сделки',false),250);
  assert.equal(c.AUTOFLIP_AUTOPASS.addPoints(250,'Ещё сделки',false),50);
  assert.equal(c.AUTOFLIP_AUTOPASS.addPoints(20,'Лимит',false),0);
  assert.equal(c.state.autopass.points,300);
  c.state.day=2;
  assert.equal(c.AUTOFLIP_AUTOPASS.addPoints(20,'Новый день',false),20);
});

test('pass renders 60 levels, both tracks and the linked 499 ruble offer',()=>{
  const {context:c,html}=game();
  c.gamePass();
  assert.equal((html().match(/data-pass-level=/g)||[]).length,60);
  assert.match(html(),/БЕСПЛАТНО/);assert.match(html(),/ULTIMATE/);
  assert.match(html(),/openStoreProduct\('autopass_ultimate'\)/);
  assert.match(html(),/499 ₽/);
});
