// Small, shared helpers for the next action and transparent deal accounting.
(function(){
  'use strict';
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function key(c){return c&&(c._garageId||c.listingId||['car',c.id,c.name,c.buy].join('-'));}
  function amount(v){return Math.max(0,Number(v)||0);}
  function line(label,value){return '<div class="af-cost-row"><span>'+esc(label)+'</span><b>'+money(value)+'</b></div>';}
  function signed(v){return (v>0?'+':'')+money(v);}
  function costs(car){return amount(car.buy)+amount(car.repairSpent)+amount(car.diagnosticSpent)+amount(car.documentSpent)+amount(car.otherSpent);}
  function due(car){return amount(car.unplannedCost)+(car.needsTow?Math.max(5000,Math.round(Number(car.market||car.buy||0)*.012/1000)*1000):0);}
  window.AUTOFLIP_CAR_FINANCES=function(car){
    var issue=car.flipCondition||{},repair=!issue.healthy&&!issue.repaired?amount(issue.cost):0,paid=costs(car),unpaid=due(car),estimate=repair?amount(car.healthyMarket):amount(car.market),invested=paid+repair+unpaid,profit=estimate-invested;
    return '<section class="af-finances"><small>РАСЧЁТ ПО АВТОМОБИЛЮ</small>'+line('Уже вложено',paid)+(repair?line('Предстоящий ремонт',repair):'')+(unpaid?line('Эвакуатор и доп. работы',unpaid):'')+line('Всего после подготовки',invested)+line('Оценка после подготовки',estimate)+'<div class="af-profit '+(profit<0?'negative':'positive')+'"><span>Результат по оценке</span><strong>'+signed(profit)+'</strong></div><p>Оценка не гарантирует цену продажи. Общие поездки и проценты по кредитам сюда не включены.</p></section>';
  };
  window.AUTOFLIP_DEAL_ESTIMATE=function(car,price,diagnostic){
    if(!car)return '';
    var known=diagnostic&&diagnostic.found?amount(diagnostic.faultCost):car.restorationProject?amount(car.repair):0,checked=diagnostic&&diagnostic.healthyConfirmed,spent=amount(diagnostic&&diagnostic.totalSpent)+amount(car.documentSpent),estimate=amount(car.marketHealthyValue||car.healthyMarket||car.market),margin=estimate-amount(price)-known-spent;
    return '<section class="af-finances compact"><small>ПЕРЕД ПОКУПКОЙ</small>'+line('Цена автомобиля',amount(price))+(spent?line('Проверки уже оплачены',spent):'')+(known?line('Известный ремонт',known):'')+'<div class="af-profit '+(margin<0?'negative':'positive')+'"><span>Разница с оценкой рынка</span><strong>'+signed(margin)+'</strong></div><p>'+(checked?'Полная диагностика: автомобиль исправен. ':'Без полной проверки возможны скрытые расходы. ')+'Дорога, эвакуатор и окончательный торг могут изменить результат.</p></section>';
  };
  window.AUTOFLIP_NEXT_ACTION=function(){
    var now=typeof getGameTotal==='function'?getGameTotal():Number(state.gameClock&&state.gameClock.total||0),meeting=(state.meetings||[]).filter(function(m){return m.status==='scheduled'&&m.at+60>=now;}).sort(function(a,b){return a.at-b.at;})[0];
    if(meeting){var clock=String(Math.floor(meeting.at%1440/60)).padStart(2,'0')+':'+String(meeting.at%60).padStart(2,'0');return {title:now>=meeting.at?'Встреча началась':'Встреча в '+clock,detail:meeting.carName+' · '+meeting.city,meetingId:meeting.id};}
    var cars=state.cars||[],broken=cars.findIndex(function(c){return c.flipCondition&&!c.flipCondition.healthy&&!c.flipCondition.repaired;});
    if(broken>=0)return {title:'Подготовить авто',detail:cars[broken].name,carIndex:broken};
    if((state.buyerInbox||[]).some(function(x){return !x.read&&!['declined','sold'].includes(x.status);}))return {title:'Ответить покупателю',detail:'Есть новые сообщения',route:'messages'};
    var ready=cars.findIndex(function(c){return !(state.activeListings||[]).some(function(l){return l.carKey===key(c)&&l.status==='active';});});
    if(ready>=0)return {title:'Выставить на продажу',detail:cars[ready].name,carIndex:ready};
    return {title:cars.length?'Найти новую сделку':'Купить первую машину',detail:'Автомаркет → торг → встреча',route:'market'};
  };
  window.autoFlipNextAction=function(){var action=window.AUTOFLIP_NEXT_ACTION();if(action.meetingId)return openMeeting(action.meetingId);if(action.carIndex!==undefined)return garageCarDetails(action.carIndex);return action.route==='messages'?messages():market();};
  window.AUTOFLIP_UPDATE_NEXT_ACTION=function(){
    var button=document.querySelector('.os-plan');if(!button)return;
    var action=window.AUTOFLIP_NEXT_ACTION(),title=button.querySelector('b'),detail=button.querySelector('span');
    if(title&&title.textContent!==action.title)title.textContent=action.title;
    if(detail&&detail.textContent!==action.detail)detail.textContent=action.detail;
    button.setAttribute('onclick','autoFlipNextAction()');button.setAttribute('aria-label',action.title+'. '+action.detail);
  };
  var noticeVersion=0;
  window.AUTOFLIP_OPERATION_STATUS=function(status,message){
    var version=++noticeVersion;
    function show(){
      if(version!==noticeVersion||!document.createElement)return;
      var app=document.querySelector('#screen .app');if(!app)return;
      var notice=document.getElementById('af-operation-status');
      if(!notice){notice=document.createElement('section');notice.id='af-operation-status';notice.setAttribute('role','status');notice.setAttribute('aria-live','polite');var header=app.querySelector('.head');if(header)header.insertAdjacentElement('afterend',notice);else app.prepend(notice);}
      notice.className='af-operation-status '+status;
      notice.innerHTML='<span>'+esc(message)+'</span>'+(['error','pending'].includes(status)?'<button type="button" onclick="autoFlipRetrySync()">Повторить синхронизацию</button>':'');
      app.querySelectorAll('[data-repair-action]').forEach(function(button){button.disabled=status==='saving';button.setAttribute('aria-busy',String(status==='saving'));});
    }
    show();setTimeout(show,120);
  };
  window.autoFlipRetrySync=async function(){
    window.AUTOFLIP_OPERATION_STATUS('saving','Повторяем синхронизацию…');
    try{
      var ok=typeof window.AUTOFLIP_CLOUD_FLUSH==='function'&&await window.AUTOFLIP_CLOUD_FLUSH();
      if(ok!==false&&typeof window.AUTOFLIP_RECONCILE_ECONOMY==='function')ok=await window.AUTOFLIP_RECONCILE_ECONOMY();
      if(ok!==false){if(document.querySelector('[data-repair-action]')&&state.car)garageDetails();window.AUTOFLIP_OPERATION_STATUS('saved','Прогресс сохранён. Можно продолжать.');}
      else window.AUTOFLIP_OPERATION_STATUS('error',(window.AUTOFLIP_CLOUD&&window.AUTOFLIP_CLOUD.detail)||'Сохранение не прошло. Проверь соединение и повтори.');
    }catch(error){window.AUTOFLIP_OPERATION_STATUS('error','Не удалось связаться с сервером. Прогресс остаётся на устройстве.');}
  };
  window.AUTOFLIP_SHOW_DEAL_RESULT=function(meeting,before,result){
    if(meeting.kind!=='buyer_sale')return;
    var sold=before.find(function(c){return key(c)===result.removeCarKey;});if(!sold)return;
    var invested=costs(sold),profit=amount(meeting.price)-invested;
    render('<div class="app meeting-app">'+head('Результат сделки')+'<section class="meeting-success"><span>✓</span><small>АВТОМОБИЛЬ ПРОДАН</small><h2>'+esc(sold.name)+'</h2></section><section class="af-finances">'+line('Покупка',amount(sold.buy))+line('Ремонт и проверки',amount(sold.repairSpent)+amount(sold.diagnosticSpent)+amount(sold.documentSpent))+line('Другие расходы по авто',amount(sold.otherSpent))+line('Продажа',amount(meeting.price))+'<div class="af-profit '+(profit<0?'negative':'positive')+'"><span>'+(profit<0?'Убыток по автомобилю':'Прибыль по автомобилю')+'</span><strong>'+signed(profit)+'</strong></div><p>Без общих поездок и процентов по кредитам.</p></section><button class="action green" onclick="market()">Найти следующую сделку</button><button class="action" onclick="garage()">Открыть гараж</button></div>');
  };
  if(typeof document!=='undefined'&&document.querySelector)setTimeout(window.AUTOFLIP_UPDATE_NEXT_ACTION,160);
})();
