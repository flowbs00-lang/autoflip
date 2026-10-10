// AutoFlip Garage Progression — 10 levels and service shop.
(function(){
  'use strict';

  var LEVELS=[
    null,
    {name:'Старый бокс',slots:2,reward:'Стартовый гараж · 2 места'},
    {name:'Чистый гараж',slots:3,reward:'+1 место для автомобиля'},
    {name:'Рабочий бокс',slots:3,reward:'Редкий кейс номеров'},
    {name:'Мастерская',slots:4,reward:'+1 место и подъёмник'},
    {name:'Автоцентр',slots:4,reward:'Можно построить автосервис'},
    {name:'Дилерский гараж',slots:5,reward:'+1 место и Тайный кейс'},
    {name:'Премиум-бокс',slots:5,reward:'Повышенная прибыль сервиса'},
    {name:'Шоурум',slots:5,reward:'Бонус к диагностике и Коллекционный кейс'},
    {name:'Дилерский центр',slots:6,reward:'+1 место и лучшие заказы'},
    {name:'Империя AutoFlip',slots:7,reward:'+1 место и Легендарный кейс'}
  ];
  var UPGRADES={
    1:{rep:20,cost:15000,work:'Выкинуть хлам из гаража',tasks:[['sales',5,'Продать 5 автомобилей'],['trades',2,'Обменять 2 автомобиля'],['loans',1,'Полностью погасить кредит'],['renovation',1,'Выкинуть хлам из гаража'],['coinflip5000',1,'Сделать ставку от 5 000 ₽ в Coinflip']]},
    2:{rep:35,cost:35000,work:'Покрасить стены и провести свет',tasks:[['sales',8,'Всего продать 8 автомобилей'],['trades',3,'Всего провести 3 обмена'],['loans',1,'Иметь погашенный кредит'],['renovation',2,'Обновить стены и освещение'],['coinflip5000',2,'Сделать 2 ставки от 5 000 ₽']]},
    3:{rep:50,cost:60000,work:'Установить новые ворота',tasks:[['sales',12,'Всего продать 12 автомобилей'],['trades',5,'Всего провести 5 обменов'],['loans',2,'Погасить 2 кредита'],['renovation',3,'Установить новые ворота'],['coinflip5000',4,'Сделать 4 крупные ставки']]},
    4:{rep:70,cost:100000,work:'Смонтировать подъёмник',tasks:[['sales',18,'Всего продать 18 автомобилей'],['trades',7,'Всего провести 7 обменов'],['loans',2,'Погасить 2 кредита'],['renovation',4,'Смонтировать подъёмник'],['coinflip5000',6,'Сделать 6 крупных ставок']]},
    5:{rep:85,cost:150000,work:'Оборудовать клиентскую зону',tasks:[['sales',25,'Всего продать 25 автомобилей'],['trades',9,'Всего провести 9 обменов'],['serviceBuilt',1,'Построить автосервис'],['serviceJobs',3,'Выполнить 3 заказа сервиса'],['renovation',5,'Оборудовать клиентскую зону']]},
    6:{rep:105,cost:220000,work:'Расширить ремонтную зону',tasks:[['sales',33,'Всего продать 33 автомобиля'],['trades',11,'Всего провести 11 обменов'],['serviceJobs',8,'Выполнить 8 заказов сервиса'],['coinflip5000',10,'Сделать 10 крупных ставок'],['renovation',6,'Расширить ремонтную зону']]},
    7:{rep:125,cost:300000,work:'Оборудовать пост диагностики',tasks:[['sales',43,'Всего продать 43 автомобиля'],['trades',14,'Всего провести 14 обменов'],['serviceJobs',15,'Выполнить 15 заказов сервиса'],['loans',3,'Погасить 3 кредита'],['renovation',7,'Оборудовать пост диагностики']]},
    8:{rep:150,cost:450000,work:'Открыть шоурум',tasks:[['sales',55,'Всего продать 55 автомобилей'],['trades',17,'Всего провести 17 обменов'],['serviceJobs',22,'Выполнить 22 заказа сервиса'],['loans',4,'Погасить 4 кредита'],['renovation',8,'Открыть шоурум']]},
    9:{rep:180,cost:700000,work:'Построить флагманский центр',tasks:[['sales',70,'Всего продать 70 автомобилей'],['trades',20,'Всего провести 20 обменов'],['serviceJobs',30,'Выполнить 30 заказов сервиса'],['loans',5,'Погасить 5 кредитов'],['renovation',9,'Построить флагманский центр']]}
  };
  var SERVICE_NAMES=['Артём','Виктор','Денис','Кирилл','Максим','Роман','Сергей','Тимур'];
  var SERVICE_CARS=['Lada Vesta','Kia Rio','Toyota Camry','BMW 320i','Volkswagen Polo','Hyundai Solaris','Ford Focus II','Skoda Octavia'];
  var SERVICE_ISSUES=[
    {name:'Замена тормозных колодок',parts:9000,payout:24000,hours:4,difficulty:'Простой'},
    {name:'Ремонт электрики',parts:12000,payout:31000,hours:5,difficulty:'Обычный'},
    {name:'Ремонт подвески',parts:18000,payout:44000,hours:7,difficulty:'Средний'},
    {name:'Замена радиатора',parts:22000,payout:52000,hours:8,difficulty:'Средний'},
    {name:'Замена сцепления',parts:25000,payout:59000,hours:10,difficulty:'Сложный'},
    {name:'Обслуживание двигателя',parts:28000,payout:65000,hours:11,difficulty:'Сложный'},
    {name:'Капитальный ремонт двигателя',parts:45000,payout:98000,hours:12,difficulty:'Экспертный'}
  ];
  var serviceTimer=null;

  function clamp(n,a,b){return Math.max(a,Math.min(b,Number(n)||0));}
  function saveGarage(){
    try{if(typeof persist==='function')persist();else if(typeof save==='function')save();else localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
  }
  function ensure(){
    if(!state.garageProgress||typeof state.garageProgress!=='object')state.garageProgress={};
    var g=state.garageProgress;
    g.version=2;
    g.level=clamp(g.level||state.garageLevel||1,1,10);
    if(!g.stats||typeof g.stats!=='object')g.stats={};
    ['sales','trades','loans','coinflip5000','serviceJobs'].forEach(function(k){g.stats[k]=Math.max(0,Number(g.stats[k]||0));});
    if(!g.renovations||typeof g.renovations!=='object')g.renovations={};
    if(!Array.isArray(g.eventKeys))g.eventKeys=[];
    if(!Array.isArray(g.serviceRequests))g.serviceRequests=[];
    if(!Array.isArray(g.completedServiceIds))g.completedServiceIds=[];
    g.completedServiceIds=g.completedServiceIds.slice(-100);
    if(g.activeServiceJob&&typeof g.activeServiceJob!=='object')g.activeServiceJob=null;
    g.serviceCycle=Math.max(0,Number(g.serviceCycle||0));
    g.serviceRequests=g.serviceRequests.filter(function(x){return x&&x.done!==true;}).slice(0,3).map(function(x,i){
      var meta=SERVICE_ISSUES.find(function(issue){return issue.name===x.issue;})||SERVICE_ISSUES[i%SERVICE_ISSUES.length];
      x.hours=Math.max(4,Math.min(12,Number(x.hours||meta.hours)));
      x.difficulty=x.difficulty||meta.difficulty;
      x.parts=Math.max(0,Number(x.parts||meta.parts));
      x.payout=Math.max(x.parts,Number(x.payout||meta.payout));
      return x;
    });
    if(g.activeServiceJob){
      var activeMeta=SERVICE_ISSUES.find(function(issue){return issue.name===g.activeServiceJob.issue;})||SERVICE_ISSUES[0];
      g.activeServiceJob.hours=Math.max(4,Math.min(12,Number(g.activeServiceJob.hours||activeMeta.hours)));
      g.activeServiceJob.startedAt=Math.max(1,Number(g.activeServiceJob.startedAt||Date.now()));
      g.activeServiceJob.finishAt=Math.max(g.activeServiceJob.startedAt+1,Number(g.activeServiceJob.finishAt||g.activeServiceJob.startedAt+g.activeServiceJob.hours*3600000));
      g.activeServiceJob.difficulty=g.activeServiceJob.difficulty||activeMeta.difficulty;
      g.activeServiceJob.parts=Math.max(0,Number(g.activeServiceJob.parts||activeMeta.parts));
      g.activeServiceJob.payout=Math.max(g.activeServiceJob.parts,Number(g.activeServiceJob.payout||activeMeta.payout));
      g.activeServiceJob.claimed=!!g.activeServiceJob.claimed;
      g.serviceRequests=[];
    }
    g.serviceBuilt=!!g.serviceBuilt;
    state.garageLevel=g.level;
    return g;
  }
  function carKey(c){return c&&(c._garageId||c.listingId||[c.id,c.name,c.buy].join('-'));}
  function fleetSignature(){return (Array.isArray(state.cars)?state.cars:[]).map(carKey).filter(Boolean).sort().join('|');}
  function remember(key,callback){
    var g=ensure();
    if(g.eventKeys.indexOf(key)>=0)return false;
    g.eventKeys.push(key);g.eventKeys=g.eventKeys.slice(-80);callback(g);saveGarage();return true;
  }
  function statValue(key,level){
    var g=ensure();
    if(key==='renovation')return g.renovations[level]?level:0;
    if(key==='serviceBuilt')return g.serviceBuilt?1:0;
    return Number(g.stats[key]||0);
  }
  function completed(level,task){return statValue(task[0],level)>=task[1];}
  function upgradeReady(){
    var g=ensure(),u=UPGRADES[g.level];
    return !!u&&Number(state.rep||0)>=u.rep&&u.tasks.every(function(t){return completed(g.level,t);});
  }

  window.garageCapacity=function(){return LEVELS[ensure().level].slots;};
  window.garageLevelInfo=function(){return LEVELS[ensure().level];};

  function wrapFleet(name,type){
    var original=window[name];if(typeof original!=='function'||original.__garageProgress)return;
    var wrapped=function(){
      var before=fleetSignature(),beforeDeals=Number(state.deals||0),result=original.apply(this,arguments),after=fleetSignature();
      if(before!==after&&Number(state.deals||0)>beforeDeals){
        var key=type+':'+Number(state.deals||0)+':'+before+':'+after;
        remember(key,function(g){g.stats[type==='trade'?'trades':'sales']++;});
      }
      return result;
    };
    wrapped.__garageProgress=true;window[name]=wrapped;
  }
  ['completeBuyerSale','completeSale','closeSale'].forEach(function(n){wrapFleet(n,'sale');});
  ['completeBuyerTrade','completeSellerTrade'].forEach(function(n){wrapFleet(n,'trade');});

  (function wrapLoan(){
    var original=window.bankPayLoan||window.payLoan;if(typeof original!=='function'||original.__garageProgress)return;
    var wrapped=function(){
      var before=Number(state.loan||0),result=original.apply(this,arguments),after=Number(state.loan||0);
      if(before>0&&after<=0)remember('loan:'+Date.now()+':'+before,function(g){g.stats.loans++;});
      return result;
    };
    wrapped.__garageProgress=true;
    if(window.bankPayLoan===original)window.bankPayLoan=wrapped;
    if(window.payLoan===original)window.payLoan=wrapped;
  })();

  (function wrapCoinflip(){
    var original=window.playCoinflip;if(typeof original!=='function'||original.__garageProgress)return;
    var wrapped=function(){
      var input=document.getElementById('coinBet'),bet=Math.floor(Number(input&&input.value||0)),valid=bet>=5000&&bet<=Number(state.money||0);
      var result=original.apply(this,arguments);
      if(valid)remember('coinflip:'+Date.now()+':'+bet,function(g){g.stats.coinflip5000++;});
      return result;
    };
    wrapped.__garageProgress=true;window.playCoinflip=wrapped;
  })();

  function scene(level){
    var cars=(Array.isArray(state.cars)?state.cars:[]).slice(0,3).map(function(c,i){return '<span class="garage-scene-car car-'+i+'">'+(i===0?'◆':'◇')+'</span>';}).join('');
    return '<section class="garage-scene garage-level-'+level+'"><div class="garage-ceiling"></div><div class="garage-door"><i></i><i></i><i></i></div><div class="garage-floor"></div><div class="garage-props">'+(level<2?'🗑️ 📦':'')+(level>=4?' 🛠️':'')+(level>=5?' 🔧':'')+(level>=8?' 🧪':'')+'</div>'+cars+'<div class="garage-scene-copy"><small>УРОВЕНЬ '+level+' / 10</small><b>'+LEVELS[level].name+'</b><span>'+LEVELS[level].reward+'</span></div></section>';
  }
  function tabs(active){
    var g=ensure();
    return '<nav class="garage-tabs"><button class="'+(active==='cars'?'active':'')+'" onclick="garage()">Авто</button><button class="'+(active==='progress'?'active':'')+'" onclick="garageProgress()">Развитие</button><button class="'+(active==='service'?'active':'')+' '+(g.level<5?'locked':'')+'" onclick="garageService()">Сервис</button><button onclick="economyGarage()">Бизнес</button></nav>';
  }
  function shell(title,active,body){var g=ensure();render('<div class="app garage-app">'+head(title)+scene(g.level)+tabs(active)+body+'</div>');}
  function statusText(c){
    var issue=c&&c.flipCondition;
    if(issue&&!issue.healthy&&!issue.repaired)return '<span class="bad">● Требует ремонта</span>';
    return '<span class="good">● Исправна</span>';
  }
  window.garage=function(){
    var g=ensure(),cars=Array.isArray(state.cars)?state.cars:[],cap=window.garageCapacity();
    var slots='';
    for(var i=0;i<Math.max(cap,cars.length);i++){
      var c=cars[i];
      slots+=c?'<button class="garage-car-card" onclick="garageCarDetails('+i+')"><span class="garage-car-photo" style="background-image:url(\''+photo(c)+'\')"></span><span class="garage-car-main"><small>'+statusText(c)+'</small><b>'+c.name+'</b><em>'+c.year+' · '+Number(c.km||0).toLocaleString('ru-RU')+' км</em><strong>'+money(c.market||c.sale||c.buy)+'</strong></span><i>›</i></button>':'<button class="garage-empty-slot" onclick="market()"><span>＋</span><b>Свободное место</b><small>Найти автомобиль</small></button>';
    }
    var over=cars.length>cap?'<div class="garage-warning">Машин больше текущего лимита. Они сохранены, но новая покупка откроется после расширения.</div>':'';
    shell('Гараж','cars','<div class="garage-overview"><div class="garage-kpis"><div><small>МЕСТА</small><b>'+cars.length+' / '+cap+'</b></div><div><small>РЕПУТАЦИЯ</small><b>'+Number(state.rep||0)+'</b></div><div><small>СТОИМОСТЬ АВТО</small><b>'+money(cars.reduce(function(s,c){return s+Number(c.market||0);},0))+'</b></div></div>'+over+'<div class="garage-section-title"><b>Мои автомобили</b><span>'+Math.max(0,cap-cars.length)+' свободно</span></div><div class="garage-cars">'+slots+'</div>'+(g.level<10?'<button class="garage-progress-cta" onclick="garageProgress()"><span><small>СЛЕДУЮЩИЙ УРОВЕНЬ</small><b>'+LEVELS[g.level+1].name+'</b><em>'+LEVELS[g.level+1].reward+'</em></span><i>›</i></button>':'<div class="garage-max">🏆 Гараж максимального уровня</div>')+'</div>');
    saveGarage();
  };
  window.garageProgress=function(){
    var g=ensure(),u=UPGRADES[g.level];
    if(!u){shell('Развитие гаража','progress','<div class="garage-complete"><span>🏆</span><h3>Империя построена</h3><p>Достигнут максимальный, 10-й уровень гаража.</p></div>');return;}
    var done=u.tasks.filter(function(t){return completed(g.level,t);}).length,repOk=Number(state.rep||0)>=u.rep;
    var rows=u.tasks.map(function(t){
      var ok=completed(g.level,t),value=statValue(t[0],g.level),action=t[0]==='renovation'&&!ok?'<button onclick="garageRenovate()">'+u.work+' · '+money(u.cost)+'</button>':'';
      return '<div class="garage-task '+(ok?'done':'')+'"><span>'+(ok?'✓':'')+'</span><div><b>'+t[2]+'</b><small>'+Math.min(value,t[1])+' / '+t[1]+'</small>'+action+'</div></div>';
    }).join('');
    var roadmap=LEVELS.slice(1).map(function(l,i){var n=i+1;return '<div class="garage-road-level '+(n<g.level?'passed':n===g.level?'current':'')+'"><b>'+n+'</b><span>'+l.name+'</span><small>'+l.reward+'</small></div>';}).join('');
    shell('Развитие гаража','progress','<section class="garage-upgrade-head"><div><small>ДО УРОВНЯ '+(g.level+1)+'</small><h3>'+done+' из 5 заданий</h3><p>Репутация не тратится — она подтверждает опыт.</p></div><div class="garage-ring" style="--p:'+(done*20)+'%"><b>'+done+'/5</b></div></section><div class="garage-rep '+(repOk?'done':'')+'"><span>'+(repOk?'✓':'★')+'</span><div><b>Репутация '+u.rep+'</b><small>Сейчас '+Number(state.rep||0)+'</small></div></div><div class="garage-task-list">'+rows+'</div><button class="action green garage-levelup" '+(upgradeReady()?'':'disabled')+' onclick="garageLevelUp()">Улучшить до '+(g.level+1)+' уровня</button><div class="garage-roadmap"><h3>Все уровни</h3>'+roadmap+'</div>');
  };
  window.garageRenovate=function(){
    var g=ensure(),u=UPGRADES[g.level];if(!u||g.renovations[g.level])return garageProgress();
    if(Number(state.money||0)<u.cost)return alert('Не хватает '+money(u.cost-Number(state.money||0))+'.');
    state.money-=u.cost;g.renovations[g.level]=true;if(typeof log==='function')log('Гараж: '+u.work+' за '+money(u.cost)+'.');saveGarage();garageProgress();
  };
  window.garageLevelUp=function(){
    var g=ensure();if(!UPGRADES[g.level]||!upgradeReady())return alert('Сначала выполни все задания и набери нужную репутацию.');
    g.level++;state.garageLevel=g.level;if(typeof log==='function')log('Гараж улучшен до '+g.level+' уровня: '+LEVELS[g.level].name+'.');saveGarage();
    render('<div class="app garage-app garage-levelup-screen">'+head('Новый уровень')+'<div class="levelup-burst"><span>УРОВЕНЬ</span><b>'+g.level+'</b></div><h2>'+LEVELS[g.level].name+'</h2><p>'+LEVELS[g.level].reward+'</p><button class="action green" onclick="garage()">Открыть обновлённый гараж</button></div>');
  };

  function generateServiceRequests(force){
    var g=ensure();if(g.activeServiceJob||(!force&&g.serviceRequests.length===3))return;
    var day=Number(state.day||1),createdAt=Date.now(),cycle=g.serviceCycle;
    g.serviceRequests=[];
    for(var i=0;i<3;i++){
      var seed=day*17+cycle*29+g.level*7,issue=SERVICE_ISSUES[(seed+i*2)%SERVICE_ISSUES.length],boost=1+(g.level-5)*.08;
      var urgent=i===0&&(cycle+day)%2===0;
      g.serviceRequests.push({id:'service-'+createdAt+'-'+cycle+'-'+i,name:SERVICE_NAMES[(seed+i*3)%SERVICE_NAMES.length],car:SERVICE_CARS[(seed*3+i*5)%SERVICE_CARS.length],issue:issue.name,difficulty:issue.difficulty,hours:urgent?Math.max(4,issue.hours-2):issue.hours,parts:Math.round(issue.parts*boost/1000)*1000,payout:Math.round(issue.payout*boost*(urgent?1.35:1)/1000)*1000,urgent:urgent,createdAt:createdAt,done:false});
    }
    saveGarage();
  }
  function serviceRemaining(finishAt){return Math.max(0,Number(finishAt||0)-Date.now());}
  function serviceClock(ms){
    if(ms<=0)return 'Ремонт завершён';
    var total=Math.ceil(ms/1000),hours=Math.floor(total/3600),minutes=Math.floor(total%3600/60),seconds=total%60;
    return String(hours).padStart(2,'0')+':'+String(minutes).padStart(2,'0')+':'+String(seconds).padStart(2,'0');
  }
  function serviceFinishText(value){try{return new Date(Number(value)).toLocaleString('ru-RU',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});}catch(e){return '';}}
  function scheduleServiceClock(){
    if(serviceTimer){if(typeof serviceTimer.stop==='function')serviceTimer.stop();else if(typeof clearTimeout==='function')clearTimeout(serviceTimer);}serviceTimer=null;
    function tick(){
      var g=ensure(),job=g.activeServiceJob,node=document.getElementById('serviceCountdown');
      if(!job||!node){if(serviceTimer&&typeof serviceTimer.stop==='function')serviceTimer.stop();serviceTimer=null;return false;}
      var left=serviceRemaining(job.finishAt);node.textContent=serviceClock(left);
      var bar=document.getElementById('serviceProgress'),duration=Math.max(1,job.finishAt-job.startedAt);
      if(bar)bar.style.width=Math.max(0,Math.min(100,(Date.now()-job.startedAt)/duration*100))+'%';
      if(left<=0){var current=serviceTimer;serviceTimer=null;if(current&&typeof current.stop==='function')current.stop();garageService();return false;}
      return true;
    }
    serviceTimer=setTimeout(function(){
      if(!tick())return;
      serviceTimer=(typeof startVisibleInterval==='function'?startVisibleInterval:function(fn,delay){var id=setInterval(fn,delay);return{stop:function(){clearInterval(id);}};})(tick,1000);
    },120);
  }
  function serviceActiveCard(job){
    var left=serviceRemaining(job.finishAt),ready=left<=0,duration=Math.max(1,job.finishAt-job.startedAt),progress=Math.max(0,Math.min(100,(Date.now()-job.startedAt)/duration*100));
    return '<section class="service-active '+(ready?'ready':'')+'"><div class="service-active-head"><span>🔧</span><div><small>'+(ready?'ЗАКАЗ ГОТОВ':'МАШИНА В РАБОТЕ')+'</small><h3>'+job.car+'</h3><p>'+job.issue+' · '+job.difficulty+'</p></div></div><div class="service-progress"><i id="serviceProgress" style="width:'+progress+'%"></i></div><div class="service-active-time"><span><small>'+(ready?'СТАТУС':'ОСТАЛОСЬ')+'</small><b id="serviceCountdown">'+serviceClock(left)+'</b></span><span><small>ГОТОВНОСТЬ</small><b>'+serviceFinishText(job.finishAt)+'</b></span></div><div class="service-active-money"><span>Вложено в детали <b>'+money(job.parts)+'</b></span><span>Оплата клиента <b>'+money(job.payout)+'</b></span><strong>Чистая прибыль +'+money(job.payout-job.parts)+'</strong></div>'+(ready?'<button class="action green" onclick="garageCompleteServiceJob()">Выдать автомобиль и получить оплату</button>':'<div class="service-wait-note">Можно закрыть игру — реальный таймер продолжит идти.</div>')+'</section>';
  }
  window.garageService=function(){
    var g=ensure();if(g.level<5){alert('Автосервис откроется на 5 уровне гаража.');return garageProgress();}
    if(!g.serviceBuilt){
      shell('Автосервис','service','<div class="garage-facility-build"><span>🔧</span><small>ДОСТУПНО С 5 УРОВНЯ</small><h2>Построить автосервис</h2><p>Клиенты будут писать с просьбой починить их автомобиль. Ты оплачиваешь детали и получаешь выплату с прибылью.</p><div><b>Стоимость строительства</b><strong>'+money(250000)+'</strong></div><button class="action green" onclick="garageBuildService()">Построить автосервис</button></div>');return;
    }
    generateServiceRequests();
    var cards=g.serviceRequests.map(function(x){return '<article class="service-order '+(x.urgent?'urgent':'')+'"><div class="service-avatar">'+x.name.charAt(0)+'</div><div class="service-message"><small>'+x.name+' · '+x.car+'</small><div class="service-order-tags">'+(x.urgent?'<i>🔥 Срочный +35%</i>':'')+'<i>'+x.difficulty+'</i><i>'+x.hours+' ч.</i></div><p>Здравствуйте! '+x.issue.toLowerCase()+'. '+(x.urgent?'Нужно как можно быстрее, доплачу за срочность.':'Сможете помочь?')+'</p><div><span>Детали <b>'+money(x.parts)+'</b></span><span>Оплата <b>'+money(x.payout)+'</b></span><strong>Прибыль +'+money(x.payout-x.parts)+'</strong></div><button '+(Number(state.money||0)<x.parts?'disabled':'')+' onclick="garageTakeServiceJob(\''+x.id+'\')">'+(Number(state.money||0)<x.parts?'Не хватает на детали':'Взять в работу · '+x.hours+' ч.')+'</button></div></article>';}).join('');
    var body='<div class="service-dashboard"><div><small>ЗАКАЗОВ ВЫПОЛНЕНО</small><b>'+g.stats.serviceJobs+'</b></div><div><small>'+(g.activeServiceJob?'СТАТУС':'ДОСТУПНО КЛИЕНТОВ')+'</small><b>'+(g.activeServiceJob?'1 в работе':g.serviceRequests.length)+'</b></div></div>'+(g.activeServiceJob?serviceActiveCard(g.activeServiceJob):'<div class="service-choice-intro"><b>Выбери один заказ</b><p>После принятия остальные клиенты уедут. Новый выбор появится после завершения ремонта.</p></div>'+cards);
    shell('Автосервис','service',body);if(g.activeServiceJob&&serviceRemaining(g.activeServiceJob.finishAt)>0)scheduleServiceClock();
  };
  window.garageBuildService=function(){
    var g=ensure();if(g.level<5||g.serviceBuilt)return garageService();
    if(Number(state.money||0)<250000)return alert('Не хватает '+money(250000-Number(state.money||0))+'.');
    state.money-=250000;g.serviceBuilt=true;if(typeof log==='function')log('В гараже построен автосервис.');saveGarage();garageService();
  };
  window.garageTakeServiceJob=function(id){
    var g=ensure();if(g.activeServiceJob)return garageService();
    var x=g.serviceRequests.find(function(j){return j.id===id;});if(!x||x.done)return garageService();
    if(Number(state.money||0)<x.parts)return alert('На детали не хватает '+money(x.parts-Number(state.money||0))+'.');
    var now=Date.now();state.money-=x.parts;g.activeServiceJob=Object.assign({},x,{startedAt:now,finishAt:now+x.hours*3600000,claimed:false});g.serviceRequests=[];
    if(typeof log==='function')log('Автосервис принял '+x.car+': '+x.issue+'. Готовность через '+x.hours+' ч.');saveGarage();garageService();
  };
  window.garageCompleteServiceJob=function(){
    var g=ensure(),x=g.activeServiceJob;if(!x||x.claimed||g.completedServiceIds.indexOf(x.id)>=0)return garageService();
    if(serviceRemaining(x.finishAt)>0)return alert('Ремонт ещё не завершён. Осталось '+serviceClock(serviceRemaining(x.finishAt))+'.');
    x.claimed=true;g.completedServiceIds.push(x.id);g.completedServiceIds=g.completedServiceIds.slice(-100);state.money=Number(state.money||0)+Number(x.payout||0);state.rep=Number(state.rep||0)+(x.hours>=10?3:x.hours>=7?2:1);g.stats.serviceJobs++;g.activeServiceJob=null;g.serviceCycle++;g.serviceRequests=[];
    if(typeof log==='function')log('Автосервис завершил '+x.car+': '+x.issue+'. Прибыль '+money(x.payout-x.parts)+'.');
    if(typeof pushPhoneNotification==='function')pushPhoneNotification('Автосервис','🔧','Ремонт '+x.car+' завершён. Оплата '+money(x.payout)+'.','garage','service-'+x.id);
    saveGarage();generateServiceRequests(true);garageService();
  };

  ensure();saveGarage();
})();
