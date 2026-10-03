// AutoFlip V7.9 compatibility layer
// Keeps the V7 core intact and adds a 3-car fleet plus live-market seller behavior.
document.write('<script src="script_base.js"></'+'script>');
document.write('<script src="v79_market.js"></'+'script>');
(function(){function install(){if(typeof state==='undefined'||typeof KEY==='undefined'||typeof render!=='function'||typeof head!=='function'||typeof money!=='function'){setTimeout(install,50);return;}if(!Array.isArray(state.cars))state.cars=[];if(state.car&&!state.cars.some(function(x){return x===state.car||(x._garageId&&x._garageId===state.car._garageId);}))state.cars.push(state.car);state.cars=state.cars.filter(Boolean).slice(0,3);var seq=Date.now();state.cars.forEach(function(c){if(!c._garageId)c._garageId='car-'+(++seq);});if(!state.car&&state.cars.length)state.car=state.cars[0];if(!state.businessHistory)state.businessHistory=[];if(!state.liveMarket)state.liveMarket={cycle:0,visits:0};if(!state.liveMarket.priceFactors)state.liveMarket.priceFactors={};if(!Array.isArray(state.liveMarket.hiddenIds))state.liveMarket.hiddenIds=[];if(!Array.isArray(state.liveMarket.newIds))state.liveMarket.newIds=[];if(!Array.isArray(state.liveMarket.hotIds))state.liveMarket.hotIds=[];var liveBasePrices=(typeof makes!=='undefined'?makes:[]).map(function(x){return Number(x.price||0);});function persist(){localStorage.setItem(KEY,JSON.stringify(state));try{if(typeof renderStats==='function')renderStats();}catch(e){}}function requiredRepForCar(car){var v=Number((car&&car.market)||0);if(v<500000)return 0;if(v<1000000)return 20;if(v<2000000)return 40;if(v<3500000)return 70;if(v<5500000)return 100;return 130;}function creditPlan(){var r=Number(state.rep||0);if(r<20)return{title:'Стартовый лимит',amount:25000,maxDebt:55000,rate:.10,next:'20 репутации → кредит 100 000 ₽'};if(r<50)return{title:'Базовый лимит',amount:100000,maxDebt:220000,rate:.10,next:'50 репутации → кредит 250 000 ₽'};if(r<100)return{title:'Бизнес-лимит',amount:250000,maxDebt:550000,rate:.10,next:'100 репутации → кредит 500 000 ₽'};return{title:'Дилерский лимит',amount:500000,maxDebt:1100000,rate:.10,next:'Максимальный кредитный уровень'};}var originalBuy=window.buy;if(typeof originalBuy==='function'&&!originalBuy.__v78){var wrappedBuy=function(id,price){var target=(typeof makes!=='undefined'&&makes[id])?makes[id]:null,need=requiredRepForCar(target);if(need>Number(state.rep||0)){alert('Недостаточно репутации. Для этой машины нужно '+need+' репутации. Сейчас: '+Number(state.rep||0)+'.');return;}if(state.cars.length>=3){alert('Гараж заполнен. Максимум 3 автомобиля. Сначала продай одну машину.');return;}var before=state.car;originalBuy(id,price);var added=state.car;if(added&&added!==before){if(!added._garageId)added._garageId='car-'+(++seq);if(!state.cars.some(function(x){return x._garageId===added._garageId;}))state.cars.push(added);state.car=added;persist();}};wrappedBuy.__v78=true;window.buy=wrappedBuy;}var originalRepair=window.repair;if(typeof originalRepair==='function'&&!originalRepair.__v78){var wrappedRepair=function(){var c=state.car,before=Number(state.money||0),result=originalRepair.apply(this,arguments);if(c&&state.money<before){c.repairSpent=Number(c.repairSpent||0)+(before-Number(state.money||0));persist();}return result;};wrappedRepair.__v78=true;window.repair=wrappedRepair;}var originalCloseSale=window.closeSale;if(typeof originalCloseSale==='function'&&!originalCloseSale.__v78){var wrappedCloseSale=function(mult){var sold=state.car;if(sold){var finalPrice=Math.round(Number(sold.sale||0)*Number(mult||1)),repairSpent=Number(sold.repairSpent||0),profit=finalPrice-Number(sold.buy||0)-repairSpent;state.businessHistory.unshift({car:sold.name,buy:Number(sold.buy||0),repair:repairSpent,sale:finalPrice,profit:profit,day:state.day,city:sold.city,year:sold.year});state.businessHistory=state.businessHistory.slice(0,30);}var result=originalCloseSale.apply(this,arguments);if(sold)state.cars=state.cars.filter(function(x){return x!==sold&&x._garageId!==sold._garageId;});state.car=state.cars[0]||null;persist();return result;};wrappedCloseSale.__v78=true;window.closeSale=wrappedCloseSale;}window.selectGarageCar=function(index){var c=state.cars[index];if(!c)return;state.car=c;persist();window.garageCarDetails(index);};window.garageCarDetails=function(index){var c=state.cars[index];if(!c)return garage();state.car=c;var repairSpent=Number(c.repairSpent||0);render('<div class="app">'+head(c.name)+'<div class="pic" style="background-image:linear-gradient(#0002,#0008),url(\''+photo(c)+'\')">🚘</div><h3>'+c.name+'</h3><p class="muted">'+c.city+' · '+c.year+' · '+c.km.toLocaleString('ru-RU')+' км</p><div class="bar"><i style="width:'+(c.repaired?100:45)+'%"></i></div><p class="muted">Состояние '+(c.repaired?'100':'45')+'%</p><div class="deal-score"><span>ПОКУПКА<b>'+money(c.buy)+'</b></span><span>РЕМОНТ<b>'+money(repairSpent)+'</b></span><span>ПРОДАЖА<b class="profit">'+money(c.sale)+'</b></span></div><button class="action green" onclick="repair()">🔧 '+(c.repaired?'Авто отремонтировано':('Ремонт · '+money(c.repair)))+'</button><button class="action" onclick="service()">🛠️ Открыть СТО</button><button class="action" onclick="sell()">💰 Найти покупателя</button><button class="action" onclick="garage()">‹ Назад в гараж</button></div>');};window.garage=function(){var cars=Array.isArray(state.cars)?state.cars:[];if(!cars.length){render('<div class="app">'+head('Гараж')+'<div class="note"><b>Гараж пуст</b><p class="muted">Первая машина ждёт тебя на рынке.</p></div><button class="action green" onclick="market()">🚗 Открыть рынок</button></div>');return;}var cards=cars.map(function(c,i){var repairSpent=Number(c.repairSpent||0),buy=Number(c.buy||0),marketValue=Number(c.market||c.sale||0),status=c.repaired?'🟢 Готова к продаже':'🟠 Требует подготовки';return '<div class="note" style="margin-bottom:10px;cursor:pointer" onclick="selectGarageCar('+i+')"><div class="row"><span><b>🚗 '+c.name+'</b><small>'+c.year+' · '+c.km.toLocaleString('ru-RU')+' км</small></span><b>'+money(buy)+'</b></div><div class="muted">'+status+' · ремонт '+money(repairSpent)+'</div><div class="row"><span>Рыночная стоимость</span><b>'+money(marketValue)+'</b></div></div>';}).join('');render('<div class="app">'+head('Гараж')+'<div class="statsbox"><div class="stat"><b>'+cars.length+'/3</b><small>места заняты</small></div><div class="stat"><b>'+money(state.money)+'</b><small>капитал</small></div><div class="stat"><b>'+money(cars.reduce(function(a,c){return a+Number(c.buy||0);},0))+'</b><small>вложено</small></div></div>'+cards+'<button class="action green" onclick="market()">🚗 Найти ещё автомобиль</button><p class="muted" style="text-align:center">Нажми на автомобиль, чтобы открыть его карточку.</p></div>');};
var basePayLoan=window.payLoan;window.bank=function(){var p=creditPlan(),available=Math.max(0,p.maxDebt-Number(state.loan||0)),canTake=available>=Math.round(p.amount*(1+p.rate));render('<div class="app">'+head('Банк')+'<div class="bank"><small>Свободные деньги</small><b>'+money(state.money)+'</b><span class="muted">Текущий долг: '+money(state.loan)+'</span></div><div class="note"><b>🏦 '+p.title+'</b><p class="muted">Репутация: '+Number(state.rep||0)+' · доступный транш: '+money(p.amount)+' · комиссия 10%</p><p class="muted">'+p.next+'</p></div><button class="action green" '+(canTake?'':'disabled')+' onclick="takeLoan()">Взять '+money(p.amount)+'</button>'+(state.loan?'<button class="action" onclick="payLoan()">Погасить '+money(state.loan)+'</button>':'')+'<div class="note" style="margin-top:10px">Кредитный лимит растёт вместе с репутацией. В начале нельзя перескочить сразу к дорогим автомобилям.</div></div>');};window.takeLoan=function(){var p=creditPlan(),debt=Math.round(p.amount*(1+p.rate));if(Number(state.loan||0)+debt>p.maxDebt)return alert('Текущий кредитный лимит исчерпан. Повышай репутацию или погаси долг.');state.money+=p.amount;state.loan=Number(state.loan||0)+debt;log('Банк выдал '+money(p.amount)+'. Долг вырос до '+money(state.loan)+'.');bank();};if(typeof basePayLoan==='function')window.payLoan=basePayLoan;
function rerollLiveMarket(){
  var list=typeof makes!=='undefined'?makes:[];
  if(!list.length)return;
  var factors={},hidden=[],fresh=[],hot=[];
  list.forEach(function(car,i){
    var roll=Math.random(),factor=1;
    if(roll<0.22)factor=.94+Math.random()*.04;
    else if(roll>.78)factor=1.02+Math.random()*.05;
    if(i<4)factor=Math.max(.96,Math.min(1.03,factor));
    factors[car.id]=Number(factor.toFixed(3));
  });
  var pool=list.filter(function(car){return car.id>=6;}).map(function(car){return car.id;});
  while(hidden.length<Math.min(3,pool.length)){
    var h=pool[Math.floor(Math.random()*pool.length)];
    if(hidden.indexOf(h)<0)hidden.push(h);
  }
  var visible=list.map(function(car){return car.id;}).filter(function(id){return hidden.indexOf(id)<0;});
  while(fresh.length<Math.min(3,visible.length)){
    var n=visible[Math.floor(Math.random()*visible.length)];
    if(fresh.indexOf(n)<0)fresh.push(n);
  }
  while(hot.length<Math.min(3,visible.length)){
    var x=visible[Math.floor(Math.random()*visible.length)];
    if(hot.indexOf(x)<0&&fresh.indexOf(x)<0)hot.push(x);
  }
  state.liveMarket.priceFactors=factors;
  state.liveMarket.hiddenIds=hidden;
  state.liveMarket.newIds=fresh;
  state.liveMarket.hotIds=hot;
  persist();
}
function applyLiveMarket(){
  if(typeof makes==='undefined')return;
  if(!state.liveMarket.priceFactors||!Object.keys(state.liveMarket.priceFactors).length)rerollLiveMarket();
  makes.forEach(function(car,i){
    var base=Number(liveBasePrices[i]||car.price||0),factor=Number(state.liveMarket.priceFactors[car.id]||1);
    car.price=Math.max(10000,Math.round(base*factor/1000)*1000);
  });
}
function cardId(card){
  var s=card.getAttribute('onclick')||'',m=s.match(/carView\((\d+)\)/);
  return m?Number(m[1]):-1;
}
function decorateMarket(){
  var cards=[].slice.call(document.querySelectorAll('.app .market'));
  if(!cards.length)return;
  var types=[['🔥','Срочно продаёт'],['👤','Обычный продавец'],['⚠️','Перекупщик'],['💎','Владелец']];
  cards.forEach(function(card){
    var id=cardId(card);
    if(state.liveMarket.hiddenIds.indexOf(id)>=0){card.remove();return;}if(card.querySelector('.v79-seller'))return;var needRep=(id>=0&&typeof makes!=='undefined'&&makes[id])?requiredRepForCar(makes[id]):0;if(needRep>Number(state.rep||0)){var lock=document.createElement('div');lock.className='muted';lock.style.marginTop='6px';lock.style.fontSize='12px';lock.textContent='🔒 Нужно '+needRep+' репутации · сейчас '+Number(state.rep||0);card.appendChild(lock);card.style.opacity='.68';}
    var t=types[(id>=0?id:0)%types.length],factor=Number(state.liveMarket.priceFactors[id]||1),status='',badge='';
    if(state.liveMarket.newIds.indexOf(id)>=0){status=' · 🆕 Новое объявление';badge='🆕 Новое';}
    else if(factor<.985){status=' · 🔻 Цена реально снижена';badge='🔻 Цена снижена';}
    else if(state.liveMarket.hotIds.indexOf(id)>=0||factor>1.025){status=' · ⏳ Высокий спрос';badge='⏳ Могут купить';}
    var delta=Math.round((factor-1)*100),priceText=delta===0?'цена без изменений':(delta>0?'цена +'+delta+'%':'цена '+delta+'%');
    var el=document.createElement('div');
    el.className='muted v79-seller';
    el.style.marginTop='6px';el.style.fontSize='12px';
    el.textContent=t[0]+' '+t[1]+' · '+priceText+status;
    card.appendChild(el);
    if(badge){var pic=card.querySelector('.pic');if(pic){var tag=document.createElement('span');tag.textContent=badge;tag.style.cssText='display:inline-block;background:#111c;color:#fff;padding:4px 7px;border-radius:8px;font-size:10px;margin:6px';pic.appendChild(tag);}}
  });
  var app=document.querySelector('.app'),filters=app&&app.querySelector('.filters');
  if(filters&&!document.getElementById('v79MarketRefresh')){
    var box=document.createElement('div');box.id='v79MarketRefresh';box.className='note';box.style.margin='8px 0';
    box.innerHTML='<div class="row"><span><b>📡 Живой рынок</b><small>Снято объявлений: '+state.liveMarket.hiddenIds.length+'</small></span><button class="action" style="width:auto;margin:0;padding:8px 10px" onclick="refreshLiveMarket()">🔄 Обновить</button></div>';
    filters.insertAdjacentElement('afterend',box);
  }
}
var originalMarket=window.market;
if(typeof originalMarket==='function'&&!originalMarket.__v79){
  window.market=function(){
    state.liveMarket.visits=Number(state.liveMarket.visits||0)+1;
    if(!state.liveMarket.priceFactors||!Object.keys(state.liveMarket.priceFactors).length)rerollLiveMarket();
    if(state.liveMarket.visits%6===0){state.liveMarket.cycle=Number(state.liveMarket.cycle||0)+1;rerollLiveMarket();}
    applyLiveMarket();
    originalMarket.apply(this,arguments);
    setTimeout(decorateMarket,120);
  };
  window.market.__v79=true;
}
window.refreshLiveMarket=function(){
  state.liveMarket.cycle=Number(state.liveMarket.cycle||0)+1;
  state.liveMarket.visits=0;
  rerollLiveMarket();
  applyLiveMarket();
  market('all',0);
  setTimeout(function(){
    var app=document.querySelector('.app');
    if(app){
      var n=document.createElement('div');n.className='note';n.style.margin='8px 0';
      n.innerHTML='<b>🔄 Рынок обновился</b><p class="muted">Цены действительно изменились, несколько объявлений снято, появились новые предложения.</p>';
      var live=document.getElementById('v79MarketRefresh');
      if(live)live.insertAdjacentElement('afterend',n);
    }
  },160);
};
var oldHome=window.home;if(typeof oldHome==='function'&&!oldHome.__v79live){window.home=function(){oldHome.apply(this,arguments);setTimeout(function(){var appBtn=[].slice.call(document.querySelectorAll('.apps button')).find(function(b){return b.textContent.indexOf('Авто')>=0;});if(appBtn&&!document.getElementById('v79RefreshHint')){var h=document.createElement('small');h.id='v79RefreshHint';h.textContent=' LIVE';h.style.opacity='.65';appBtn.appendChild(h);}},120);};window.home.__v79live=true;}
persist();}install();})();