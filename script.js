// AutoFlip V7.9 compatibility layer
// Keeps the V7 core intact and adds a 3-car fleet plus live-market seller behavior.
document.write('<script src="script_base.js"></'+'script>');
document.write('<script src="v79_market.js"></'+'script>');
(function(){function install(){if(typeof state==='undefined'||typeof KEY==='undefined'||typeof render!=='function'||typeof head!=='function'||typeof money!=='function'){setTimeout(install,50);return;}if(!Array.isArray(state.cars))state.cars=[];if(state.car&&!state.cars.some(function(x){return x===state.car||(x._garageId&&x._garageId===state.car._garageId);}))state.cars.push(state.car);state.cars=state.cars.filter(Boolean).slice(0,3);var seq=Date.now();state.cars.forEach(function(c){if(!c._garageId)c._garageId='car-'+(++seq);});if(!state.car&&state.cars.length)state.car=state.cars[0];if(!state.businessHistory)state.businessHistory=[];if(!Array.isArray(state.repHistory))state.repHistory=[];if(state.profitStreak===undefined)state.profitStreak=0;if(!state.liveMarket)state.liveMarket={cycle:0,visits:0};if(!state.liveMarket.priceFactors)state.liveMarket.priceFactors={};if(!Array.isArray(state.liveMarket.hiddenIds))state.liveMarket.hiddenIds=[];if(!Array.isArray(state.liveMarket.newIds))state.liveMarket.newIds=[];if(!Array.isArray(state.liveMarket.hotIds))state.liveMarket.hotIds=[];var liveBasePrices=(typeof makes!=='undefined'?makes:[]).map(function(x){return Number(x.price||0);});
if(!state.gameClock||typeof state.gameClock!=='object')state.gameClock={total:450};
if(!Number.isFinite(Number(state.gameClock.total)))state.gameClock.total=450;
var clockAnchorReal=Date.now(),clockAnchorTotal=Number(state.gameClock.total||450);
function gameTotal(){return clockAnchorTotal+Math.floor((Date.now()-clockAnchorReal)/1000);}
function syncGameClock(){state.gameClock.total=gameTotal();}
function gameTimeText(){var t=gameTotal(),m=((t%1440)+1440)%1440,h=Math.floor(m/60),mm=m%60;return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
function gameDateText(){var t=gameTotal(),d=Math.floor(t/1440),days=['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];return 'День '+(d+1)+' · '+days[d%7];}
function persist(){syncGameClock();localStorage.setItem(KEY,JSON.stringify(state));try{if(typeof renderStats==='function')renderStats();}catch(e){}}function requiredRepForCar(car){var v=Number((car&&car.market)||0);if(v<500000)return 0;if(v<1000000)return 20;if(v<2000000)return 40;if(v<3500000)return 70;if(v<5500000)return 100;return 130;}function creditPlan(){var r=Number(state.rep||0);if(r<20)return{title:'Стартовый лимит',amount:25000,maxDebt:55000,rate:.10,next:'20 репутации → кредит 100 000 ₽'};if(r<50)return{title:'Базовый лимит',amount:100000,maxDebt:220000,rate:.10,next:'50 репутации → кредит 250 000 ₽'};if(r<100)return{title:'Бизнес-лимит',amount:250000,maxDebt:550000,rate:.10,next:'100 репутации → кредит 500 000 ₽'};return{title:'Дилерский лимит',amount:500000,maxDebt:1100000,rate:.10,next:'Максимальный кредитный уровень'};}var originalBuy=window.buy;if(typeof originalBuy==='function'&&!originalBuy.__v78){var wrappedBuy=function(id,price){var target=(typeof makes!=='undefined'&&makes[id])?makes[id]:null,need=requiredRepForCar(target);if(need>Number(state.rep||0)){alert('Недостаточно репутации. Для этой машины нужно '+need+' репутации. Сейчас: '+Number(state.rep||0)+'.');return;}if(state.cars.length>=3){alert('Гараж заполнен. Максимум 3 автомобиля. Сначала продай одну машину.');return;}var before=state.car,ask=target?Number(target.price||0):0;originalBuy(id,price);var added=state.car;if(added&&added!==before){if(!added._garageId)added._garageId='car-'+(++seq);if(!state.cars.some(function(x){return x._garageId===added._garageId;}))state.cars.push(added);state.car=added;var discount=ask>0?(ask-Number(price||0))/ask:0,bonus=discount>=.10?2:(discount>=.05?1:0);if(bonus>0){state.rep=Number(state.rep||0)+bonus;state.repHistory.unshift({delta:bonus,reason:'Сильный торг за '+added.name,day:state.day});state.repHistory=state.repHistory.slice(0,20);}persist();}};wrappedBuy.__v78=true;window.buy=wrappedBuy;}var originalRepair=window.repair;if(typeof originalRepair==='function'&&!originalRepair.__v78){var wrappedRepair=function(){var c=state.car,before=Number(state.money||0),result=originalRepair.apply(this,arguments);if(c&&state.money<before){c.repairSpent=Number(c.repairSpent||0)+(before-Number(state.money||0));persist();}return result;};wrappedRepair.__v78=true;window.repair=wrappedRepair;}var originalCloseSale=window.closeSale;if(typeof originalCloseSale==='function'&&!originalCloseSale.__v78){var wrappedCloseSale=function(mult){var sold=state.car,beforeRep=Number(state.rep||0),repDelta=0,streakBonus=0,profit=0,finalPrice=0,repairSpent=0;if(sold){finalPrice=Math.round(Number(sold.sale||0)*Number(mult||1));repairSpent=Number(sold.repairSpent||0);profit=finalPrice-Number(sold.buy||0)-repairSpent;var invested=Math.max(1,Number(sold.buy||0)+repairSpent),margin=profit/invested;if(profit<0){repDelta=-6;state.profitStreak=0;}else{state.profitStreak=Number(state.profitStreak||0)+1;if(margin<.05)repDelta=4;else if(margin<.12)repDelta=7;else if(margin<.20)repDelta=10;else repDelta=14;if(state.profitStreak>=3)streakBonus=Math.min(6,Math.floor(state.profitStreak/3)*2);repDelta+=streakBonus;}state.businessHistory.unshift({car:sold.name,buy:Number(sold.buy||0),repair:repairSpent,sale:finalPrice,profit:profit,rep:repDelta,day:state.day,city:sold.city,year:sold.year});state.businessHistory=state.businessHistory.slice(0,30);}var result=originalCloseSale.apply(this,arguments);if(sold){state.rep=Math.max(0,beforeRep+repDelta);var reason=profit<0?'Убыточная продажа '+sold.name:'Прибыль '+money(profit)+' на '+sold.name+(streakBonus?' · серия +'+streakBonus:'');state.repHistory.unshift({delta:repDelta,reason:reason,day:state.day-1});state.repHistory=state.repHistory.slice(0,20);state.cars=state.cars.filter(function(x){return x!==sold&&x._garageId!==sold._garageId;});}state.car=state.cars[0]||null;persist();return result;};wrappedCloseSale.__v78=true;window.closeSale=wrappedCloseSale;}window.selectGarageCar=function(index){var c=state.cars[index];if(!c)return;state.car=c;persist();window.garageCarDetails(index);};window.garageCarDetails=function(index){var c=state.cars[index];if(!c)return garage();state.car=c;var repairSpent=Number(c.repairSpent||0),key=c._garageId||('car-'+c.id+'-'+c.buy),listed=state.activeListing&&state.activeListing.status==='active'&&state.activeListing.carKey===key;render('<div class="app">'+head(c.name)+'<div class="pic" style="background-image:linear-gradient(#0002,#0008),url(\''+photo(c)+'\')">🚘</div><h3>'+c.name+'</h3><p class="muted">'+c.city+' · '+c.year+' · '+c.km.toLocaleString('ru-RU')+' км</p>'+(listed?'<div class="note"><b>🟢 Объявление активно</b><p class="muted">Цена: '+money(state.activeListing.ask)+'. Покупатели могут написать в «Сообщения» в любой момент.</p></div>':'')+'<div class="bar"><i style="width:'+(c.repaired?100:45)+'%"></i></div><p class="muted">Состояние '+(c.repaired?'100':'45')+'%</p><div class="deal-score"><span>ПОКУПКА<b>'+money(c.buy)+'</b></span><span>РЕМОНТ<b>'+money(repairSpent)+'</b></span><span>ПРОДАЖА<b class="profit">'+money(c.sale)+'</b></span></div><button class="action green" onclick="repair()">🔧 '+(c.repaired?'Авто отремонтировано':('Ремонт · '+money(c.repair)))+'</button><button class="action" onclick="service()">🛠️ Открыть СТО</button><button class="action" onclick="sellCar()">'+(listed?'💬 Моё объявление':'🏷️ Выставить на продажу')+'</button><button class="action" onclick="garage()">‹ Назад в гараж</button></div>');};window.garage=function(){var cars=Array.isArray(state.cars)?state.cars:[];if(!cars.length){render('<div class="app">'+head('Гараж')+'<div class="note"><b>Гараж пуст</b><p class="muted">Первая машина ждёт тебя на рынке.</p></div><button class="action green" onclick="market()">🚗 Открыть рынок</button></div>');return;}var cards=cars.map(function(c,i){var repairSpent=Number(c.repairSpent||0),buy=Number(c.buy||0),marketValue=Number(c.market||c.sale||0),status=c.repaired?'🟢 Готова к продаже':'🟠 Требует подготовки';return '<div class="note" style="margin-bottom:10px;cursor:pointer" onclick="selectGarageCar('+i+')"><div class="row"><span><b>🚗 '+c.name+'</b><small>'+c.year+' · '+c.km.toLocaleString('ru-RU')+' км</small></span><b>'+money(buy)+'</b></div><div class="muted">'+status+' · ремонт '+money(repairSpent)+'</div><div class="row"><span>Рыночная стоимость</span><b>'+money(marketValue)+'</b></div></div>';}).join('');render('<div class="app">'+head('Гараж')+'<div class="statsbox"><div class="stat"><b>'+cars.length+'/3</b><small>места заняты</small></div><div class="stat"><b>'+money(state.money)+'</b><small>капитал</small></div><div class="stat"><b>'+money(cars.reduce(function(a,c){return a+Number(c.buy||0);},0))+'</b><small>вложено</small></div></div>'+cards+'<button class="action green" onclick="market()">🚗 Найти ещё автомобиль</button><p class="muted" style="text-align:center">Нажми на автомобиль, чтобы открыть его карточку.</p></div>');};
window.profile=function(){var r=Number(state.rep||0),rank=r<20?'Начинающий перекуп':r<50?'Перекуп':r<100?'Опытный перекуп':r<130?'Дилер':'Автодилер',next=r<20?'20':r<50?'50':r<100?'100':r<130?'130':'MAX',hist=(state.repHistory||[]).slice(0,5).map(function(x){var d=Number(x.delta||0);return '<div class="row"><span><b>'+(d>=0?'+'+d:d)+' реп.</b><small>'+x.reason+' · день '+x.day+'</small></span></div>';}).join('');render('<div class="app">'+head('Профиль')+'<div class="profile-card"><div class="avatar">A</div><h3>'+rank+'</h3><p class="muted">'+state.city+' · день '+state.day+'</p><div class="statsbox"><div class="stat"><b>'+money(state.money)+'</b><small>капитал</small></div><div class="stat"><b>'+r+'</b><small>репутация</small></div><div class="stat"><b>'+Number(state.profitStreak||0)+'</b><small>серия прибыли</small></div></div></div><div class="note"><b>⭐ Прогресс репутации</b><p class="muted">Следующий уровень: '+next+(next==='MAX'?'':' репутации')+'. Репутация теперь зависит от качества сделок, а не просто от их количества.</p></div>'+(hist||'<div class="note">История репутации появится после первой сделки.</div>')+'<div class="row"><span>🚗 Машина</span><b>'+(state.car?state.car.name:'нет')+'</b></div><div class="row"><span>🏦 Долг</span><b>'+money(state.loan)+'</b></div></div>');};
var basePayLoan=window.payLoan;window.bank=function(){var p=creditPlan(),available=Math.max(0,p.maxDebt-Number(state.loan||0)),canTake=available>=Math.round(p.amount*(1+p.rate)),due='';if(state.loan&&state.bankDueAt&&typeof gameTotal==='function'){var left=Math.max(0,Number(state.bankDueAt)-gameTotal()),hours=Math.ceil(left/60);due='<span class="muted">До платежа: '+hours+' игровых ч.</span>';}render('<div class="app">'+head('Банк')+'<div class="bank"><small>Свободные деньги</small><b>'+money(state.money)+'</b><span class="muted">Текущий долг: '+money(state.loan)+'</span>'+due+'</div><div class="note"><b>🏦 '+p.title+'</b><p class="muted">Репутация: '+Number(state.rep||0)+' · доступный транш: '+money(p.amount)+' · комиссия 10%</p><p class="muted">'+p.next+'</p></div><button class="action green" '+(canTake?'':'disabled')+' onclick="takeLoan()">Взять '+money(p.amount)+'</button>'+(state.loan?'<button class="action" onclick="payLoan()">Погасить '+money(state.loan)+'</button>':'')+'<div class="note" style="margin-top:10px">Кредитный лимит растёт вместе с репутацией. Банк напомнит о сроке платежа через уведомления.</div></div>');};window.takeLoan=function(){var p=creditPlan(),debt=Math.round(p.amount*(1+p.rate)),hadDebt=Number(state.loan||0)>0;if(Number(state.loan||0)+debt>p.maxDebt)return alert('Текущий кредитный лимит исчерпан. Повышай репутацию или погаси долг.');state.money+=p.amount;state.loan=Number(state.loan||0)+debt;if(!hadDebt&&typeof gameTotal==='function')state.bankDueAt=gameTotal()+2880;log('Банк выдал '+money(p.amount)+'. Долг вырос до '+money(state.loan)+'.');bank();};if(typeof basePayLoan==='function'){window.payLoan=function(){var r=basePayLoan.apply(this,arguments);if(Number(state.loan||0)<=0){state.bankDueAt=0;if(typeof persist==='function')persist();}return r;};}
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
window.now=gameTimeText;
window.dateText=gameDateText;
window.getGameTotal=gameTotal;
if(!Array.isArray(state.phoneNotifications))state.phoneNotifications=[];
if(!state.phoneEventMeta||typeof state.phoneEventMeta!=='object')state.phoneEventMeta={};
function phoneUnread(){return state.phoneNotifications.filter(function(n){return !n.read;}).length;}
function pushPhoneNotification(app,icon,text,route,key){
  if(key&&state.phoneNotifications.some(function(n){return n.key===key;}))return;
  var n={id:'pn-'+Date.now()+'-'+Math.floor(Math.random()*9999),app:app,icon:icon,text:text,route:route||'',key:key||'',read:false,total:gameTotal(),time:gameTimeText(),day:gameDateText()};
  state.phoneNotifications.unshift(n);state.phoneNotifications=state.phoneNotifications.slice(0,40);
  localStorage.setItem(KEY,JSON.stringify(state));
  updateNotificationBadge();
}
function updateNotificationBadge(){
  var btn=document.getElementById('phoneNotificationsApp');if(!btn)return;
  var old=btn.querySelector('.phone-notification-badge');if(old)old.remove();
  var n=phoneUnread();if(!n)return;
  var b=document.createElement('span');b.className='phone-notification-badge';b.textContent=n>9?'9+':String(n);b.style.cssText='position:absolute;right:6px;top:2px;background:#e33;color:#fff;border-radius:10px;min-width:18px;height:18px;line-height:18px;font-size:10px;font-weight:800;text-align:center;padding:0 3px';btn.style.position='relative';btn.appendChild(b);
}
window.notificationCenter=function(){
  var list=state.phoneNotifications||[];
  var html='<div class="app">'+head('Уведомления')+'<div class="note"><b>🔔 Центр уведомлений</b><p class="muted">'+(phoneUnread()?'Непрочитанных: '+phoneUnread():'Новых уведомлений нет')+'</p></div>';
  if(!list.length)html+='<div class="note"><p class="muted">Здесь будут сообщения от AutoMarket, банка, покупателей и других приложений.</p></div>';
  else html+=list.map(function(n){return '<div class="notification" style="cursor:pointer;opacity:'+(n.read?'.72':'1')+'" onclick="openPhoneNotification(\''+n.id+'\')"><b>'+n.icon+' '+n.app+'</b><span>'+n.text+'</span><small class="muted">'+n.day+' · '+n.time+(n.read?'':' · новое')+'</small></div>';}).join('');
  html+='<button class="action" onclick="markPhoneNotificationsRead()">✓ Отметить всё прочитанным</button></div>';render(html);
};
window.markPhoneNotificationsRead=function(){(state.phoneNotifications||[]).forEach(function(n){n.read=true;});localStorage.setItem(KEY,JSON.stringify(state));notificationCenter();};
window.openPhoneNotification=function(id){
  var n=(state.phoneNotifications||[]).find(function(x){return x.id===id;});if(!n)return notificationCenter();
  n.read=true;localStorage.setItem(KEY,JSON.stringify(state));
  if(n.route==='messages'&&typeof messages==='function')return messages();
  if(n.route==='bank'&&typeof bank==='function')return bank();
  if(n.route==='listing'&&typeof sellCar==='function')return sellCar();
  if(n.route==='market'&&typeof market==='function')return market();
  if(n.route==='garage'&&typeof garage==='function')return garage();
  notificationCenter();
};
function syncBuyerNotifications(){
  if(!Array.isArray(state.buyerInbox))return;
  state.buyerInbox.forEach(function(x){
    if(x&&x.id)pushPhoneNotification('Сообщения','💬',x.name+': '+x.text,'messages','buyer-'+x.id);
  });
}
function processPhoneLifeEvents(){
  var meta=state.phoneEventMeta||(state.phoneEventMeta={}),now=gameTotal(),day=Math.floor(now/1440);
  syncBuyerNotifications();
  var l=state.activeListing;
  if(l&&l.status==='active'){
    if(!Number.isFinite(Number(l.views)))l.views=0;if(!Number.isFinite(Number(l.favorites)))l.favorites=0;
    if(!meta.listingId||meta.listingId!==l.id){meta.listingId=l.id;meta.listingStatsAt=Number(l.postedAt||now);}
    if(now-Number(meta.listingStatsAt||now)>=90){
      var blocks=Math.min(4,Math.max(1,Math.floor((now-Number(meta.listingStatsAt||now))/90))),views=0,favs=0;
      for(var k=0;k<blocks;k++){var v=3+Math.floor(Math.random()*8);views+=v;if(Math.random()<.38)favs++;}
      l.views+=views;l.favorites+=favs;meta.listingStatsAt=Number(meta.listingStatsAt||now)+blocks*90;
      pushPhoneNotification('AutoMarket','🚗','По объявлению: +'+views+' просмотров'+(favs?' · +'+favs+' в избранное':'')+'. Всего '+l.views+' просмотров.','listing','stats-'+l.id+'-'+Math.floor(meta.listingStatsAt/90));
    }
  }else{meta.listingId='';}
  if(Number(state.loan||0)>0){
    if(!state.bankDueAt)state.bankDueAt=now+2880;
    var left=Number(state.bankDueAt)-now;
    if(left<=720&&left>0&&!meta.bankWarnedForDue){
      meta.bankWarnedForDue=state.bankDueAt;
      pushPhoneNotification('Банк','🏦','До срока платежа осталось около '+Math.max(1,Math.ceil(left/60))+' игровых часов. Долг: '+money(state.loan)+'.','bank','bank-warning-'+state.bankDueAt);
    }
    if(left<=0&&meta.bankOverdueDay!==day){
      meta.bankOverdueDay=day;
      pushPhoneNotification('Банк','⚠️','Срок платежа наступил. Текущий долг: '+money(state.loan)+'.','bank','bank-overdue-'+day);
    }
  }else{meta.bankWarnedForDue=0;meta.bankOverdueDay=-1;}
  var cyc=Number(state.liveMarket&&state.liveMarket.cycle||0);
  if(meta.marketCycle===undefined)meta.marketCycle=cyc;
  else if(cyc!==meta.marketCycle){meta.marketCycle=cyc;pushPhoneNotification('AutoMarket','📈','Рынок обновился: часть цен и объявлений изменилась.','market','market-cycle-'+cyc);}
  localStorage.setItem(KEY,JSON.stringify(state));
}
setInterval(processPhoneLifeEvents,1000);
function updateGameClockUI(){
  var time=gameTimeText(),date=gameDateText();
  document.querySelectorAll('.status').forEach(function(s){var first=s.querySelector('span');if(first)first.textContent=time;});
  document.querySelectorAll('.clock').forEach(function(el){el.textContent=time;});
  document.querySelectorAll('.home-top small').forEach(function(el){el.textContent=date;});
}
setInterval(function(){updateGameClockUI();if(gameTotal()%10===0){syncGameClock();localStorage.setItem(KEY,JSON.stringify(state));}},1000);
window.addEventListener('beforeunload',function(){syncGameClock();localStorage.setItem(KEY,JSON.stringify(state));});
function advanceGameMinutes(mins){
  clockAnchorTotal=gameTotal()+Math.max(0,Math.round(Number(mins)||0));
  clockAnchorReal=Date.now();
  state.gameClock.total=clockAnchorTotal;
  updateGameClockUI();
}
window.sleepGame=function(){
  var total=gameTotal(),minute=((total%1440)+1440)%1440,canSleep=minute>=1260||minute<480;
  if(!canSleep){
    alert('Лечь спать можно только с 21:00 до 08:00. Сейчас '+gameTimeText()+'.');
    return realty();
  }
  var mins=minute<480?480-minute:(1440-minute)+480;
  if(mins<=0)return realty();
  var sleepStart=gameTotal();
  advanceGameMinutes(mins);
  var sleepEnd=gameTotal(),sleepBuyerCount=0;
  if(typeof window.processBuyerSleep==='function')sleepBuyerCount=window.processBuyerSleep(sleepStart,sleepEnd,2);
  state.notifications=Number(state.notifications||0)+1;
  if(!Array.isArray(state.lifeEvents))state.lifeEvents=[];
  state.lifeEvents.unshift({time:gameTimeText(),day:gameDateText(),text:'Пока ты спал, рынок обновился и появились новые объявления.'});
  state.lifeEvents=state.lifeEvents.slice(0,10);
  if(state.liveMarket){state.liveMarket.cycle=Number(state.liveMarket.cycle||0)+1;state.liveMarket.visits=0;state.liveMarket.priceFactors={};state.liveMarket.hiddenIds=[];state.liveMarket.newIds=[];state.liveMarket.hotIds=[];}
  pushPhoneNotification('AutoMarket','🌅','За ночь рынок обновился: появились новые объявления и изменились цены.','market','wake-market-'+Math.floor(gameTotal()/1440));
  persist();
  render('<div class="app">'+head('Утро')+'<div class="note"><small>СОН ДО 08:00</small><h3>☀️ '+gameDateText()+' · '+gameTimeText()+'</h3><p class="muted">Ночь закончилась. Пока ты спал, игровой мир продолжил жить.</p></div><div class="notification"><b>🚗 AutoMarket</b><span>Рынок обновился. Появились новые объявления и изменились цены.</span></div>'+(sleepBuyerCount?'<div class="notification"><b>💬 Покупатели</b><span>Пока ты спал, пришло сообщений по объявлению: '+sleepBuyerCount+'.</span></div>':'<div class="notification"><b>🔔 Телефон</b><span>За ночь новых сообщений от покупателей не было.</span></div>')+'<button class="action green" onclick="home()">📱 Взять телефон</button></div>');
};
window.realty=function(){
  var total=gameTotal(),minute=((total%1440)+1440)%1440,canSleep=minute>=1260||minute<480;
  var sleepBlock=canSleep
    ?'<button class="action green" onclick="sleepGame()">🛏️ Лечь спать до 08:00</button><div class="note" style="margin-top:10px"><b>🌙 Ночной сон</b><p class="muted">Сон всегда заканчивается в 08:00. Если лечь в 07:30, пройдёт только 30 игровых минут.</p></div>'
    :'<div class="note" style="margin-top:10px"><b>🔒 Спать пока рано</b><p class="muted">Лечь спать можно только с 21:00 до 08:00. Днём занимайся рынком, ремонтом, поездками и сделками.</p></div><button class="action" disabled>😴 Сон откроется в 21:00</button>';
  render('<div class="app">'+head('Дом')+'<div class="note"><small>СЕЙЧАС</small><h3>🏠 '+gameDateText()+' · '+gameTimeText()+'</h3><p class="muted">'+(canSleep?'Можно закончить день. Подъём всегда в 08:00.':'Сейчас дневное время — спать нельзя.')+'</p></div>'+sleepBlock+'<div class="note" style="margin-top:10px"><b>⏱ Игровое время</b><p class="muted">1 реальная минута = 1 игровой час.</p></div></div>');
};
var oldHome=window.home;if(typeof oldHome==='function'&&!oldHome.__v79live){window.home=function(){oldHome.apply(this,arguments);setTimeout(function(){var apps=document.querySelector('.apps'),appBtn=[].slice.call(document.querySelectorAll('.apps button')).find(function(b){return b.textContent.indexOf('Авто')>=0;});if(appBtn&&!document.getElementById('v79RefreshHint')){var h=document.createElement('small');h.id='v79RefreshHint';h.textContent=' LIVE';h.style.opacity='.65';appBtn.appendChild(h);}if(apps&&!document.getElementById('phoneNotificationsApp')){var btn=document.createElement('button');btn.id='phoneNotificationsApp';btn.setAttribute('onclick','notificationCenter()');btn.innerHTML='<div class="icon red">🔔</div><small>Уведомления</small>';apps.appendChild(btn);}updateNotificationBadge();},120);};window.home.__v79live=true;}
persist();}install();})();