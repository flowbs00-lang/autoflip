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

test('service unlocks at five and offers exactly three different timed repairs',()=>{
  const g=game({money:1000000,rep:90,day:2,cars:[],garageLevel:5,garageProgress:{level:5,stats:{},renovations:{},eventKeys:[]}});
  g.c.garageBuildService();assert.equal(g.c.state.money,750000);assert.equal(g.c.state.garageProgress.serviceBuilt,true);
  const jobs=g.c.state.garageProgress.serviceRequests;
  assert.equal(jobs.length,3);assert.equal(new Set(jobs.map(x=>x.issue)).size,3);
  assert.ok(jobs.every(x=>x.hours>=4&&x.hours<=12&&x.payout>x.parts));
  assert.match(g.html(),/Выбери один заказ/);assert.match(g.html(),/Взять в работу/);
});

test('service charges parts on acceptance and pays only after the real timer',()=>{
  const g=game({money:1000000,rep:90,day:2,cars:[],garageLevel:5,garageProgress:{level:5,serviceBuilt:true,stats:{},renovations:{},eventKeys:[]}});
  g.c.garageService();const job={...g.c.state.garageProgress.serviceRequests[0]},before=g.c.state.money;
  g.c.garageTakeServiceJob(job.id);
  assert.equal(g.c.state.money,before-job.parts);assert.equal(g.c.state.garageProgress.stats.serviceJobs,0);assert.equal(g.c.state.rep,90);
  assert.equal(g.c.state.garageProgress.serviceRequests.length,0);assert.equal(g.c.state.garageProgress.activeServiceJob.id,job.id);assert.match(g.html(),/МАШИНА В РАБОТЕ/);
  g.c.garageCompleteServiceJob();assert.equal(g.c.state.money,before-job.parts);assert.equal(g.c.state.garageProgress.stats.serviceJobs,0);
  g.c.state.garageProgress.activeServiceJob.finishAt=Date.now()-1;g.c.garageCompleteServiceJob();
  assert.equal(g.c.state.money,before-job.parts+job.payout);assert.equal(g.c.state.garageProgress.stats.serviceJobs,1);assert.equal(g.c.state.garageProgress.activeServiceJob,null);assert.equal(g.c.state.garageProgress.serviceRequests.length,3);
  const paid=g.c.state.money;g.c.garageCompleteServiceJob();assert.equal(g.c.state.money,paid);
});

test('active service repair survives reload with the same finish time',()=>{
  const first=game({money:1000000,rep:90,day:4,cars:[],garageLevel:5,garageProgress:{level:5,serviceBuilt:true,stats:{},renovations:{},eventKeys:[]}});
  first.c.garageService();const chosen=first.c.state.garageProgress.serviceRequests[1];first.c.garageTakeServiceJob(chosen.id);
  const saved=JSON.parse(JSON.stringify(first.c.state)),finish=saved.garageProgress.activeServiceJob.finishAt;
  const second=game(saved);second.c.garageService();assert.equal(second.c.state.garageProgress.activeServiceJob.finishAt,finish);assert.match(second.html(),/Можно закрыть игру/);
});

test('garage navigation and upper level requirements no longer contain tuning',()=>{
  const g=game({money:500000,rep:150,day:1,cars:[],garageLevel:8,garageProgress:{level:8,stats:{},renovations:{},eventKeys:[]}});
  g.c.garage();assert.doesNotMatch(g.html(),/Тюнинг/);assert.equal(typeof g.c.garageTuning,'undefined');assert.equal(typeof g.c.garageTuneCar,'undefined');
  g.c.garageProgress();assert.doesNotMatch(g.html(),/тюнинг/i);
});
