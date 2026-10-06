const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../garage-system.js'),'utf8');

function game(saved={money:1000000,rep:0,day:1,cars:[],deals:0,loan:0}){
  let html='',alerts=[];
  const c={state:saved,window:null,document:{getElementById:()=>null},render:v=>html=v,head:t=>'<h1>'+t+'</h1>',money:n=>Number(n).toLocaleString('ru-RU')+' ₽',photo:()=> 'car.webp',persist:()=>{},save:()=>{},log:()=>{},market:()=>{},garageCarDetails:()=>{},alert:v=>alerts.push(v),setTimeout,clearTimeout,Date,Math};
  c.window=c;vm.createContext(c);vm.runInContext(source,c);
  return {c,html:()=>html,alerts};
}

test('new and upgraded garages expose the correct capacity',()=>{
  const g=game();assert.equal(g.c.garageCapacity(),2);assert.equal(g.c.state.garageLevel,1);
  g.c.state.garageProgress.level=2;g.c.state.garageLevel=2;assert.equal(g.c.garageCapacity(),3);
  g.c.state.garageProgress.level=10;g.c.state.garageLevel=10;assert.equal(g.c.garageCapacity(),7);
});

test('level one requires all five tasks and reputation before upgrade',()=>{
  const g=game({money:1000000,rep:20,day:1,cars:[],deals:0,loan:0});
  Object.assign(g.c.state.garageProgress.stats,{sales:5,trades:2,loans:1,coinflip5000:1});
  g.c.garageLevelUp();assert.equal(g.c.state.garageProgress.level,1);
  g.c.garageRenovate();assert.equal(g.c.state.money,985000);
  g.c.garageLevelUp();assert.equal(g.c.state.garageProgress.level,2);assert.equal(g.c.garageCapacity(),3);assert.match(g.html(),/Новый уровень/);
});

test('service unlocks at five, pays profit and records the job',()=>{
  const g=game({money:1000000,rep:90,day:2,cars:[],garageLevel:5,garageProgress:{level:5,stats:{},renovations:{},eventKeys:[]}});
  g.c.garageBuildService();assert.equal(g.c.state.money,750000);assert.equal(g.c.state.garageProgress.serviceBuilt,true);
  const job=g.c.state.garageProgress.serviceRequests[0],before=g.c.state.money;
  g.c.garageTakeServiceJob(job.id);assert.equal(g.c.state.money,before+job.payout-job.parts);assert.equal(g.c.state.garageProgress.stats.serviceJobs,1);assert.equal(g.c.state.rep,92);
});

test('tuning unlocks at eight and raises actual market value',()=>{
  const car={name:'Test Car',market:1000000,buy:800000,year:2020,km:10000};
  const g=game({money:500000,rep:150,day:1,cars:[car],garageLevel:8,garageProgress:{level:8,stats:{},renovations:{},eventKeys:[]}});
  g.c.garageTuneCar(0);assert.equal(g.c.state.money,450000);assert.equal(car.market,1080000);assert.equal(car.tuningLevel,1);assert.equal(g.c.state.garageProgress.stats.tunings,1);
});
