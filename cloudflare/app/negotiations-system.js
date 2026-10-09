// AutoFlip Meetings — negotiations, appointments and city-bound deals.
(function(){
  'use strict';
  var rawBuy=window.buy;
  var rawSellerTrade=window.completeSellerTrade;
  var rawBuyerSale=window.completeBuyerSale;
  var rawBuyerTrade=window.completeBuyerTrade;
  var selectedDraft=null;
  var graceMinutes=60;

  function total(){return typeof window.getGameTotal==='function'?Number(window.getGameTotal()||0):Number(state.gameClock&&state.gameClock.total||0);}
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function saveMeetings(){if(typeof persist==='function')persist();else if(typeof save==='function')save();else localStorage.setItem(KEY,JSON.stringify(state));}
  function meetings(){if(!Array.isArray(state.meetings))state.meetings=[];return state.meetings;}
  function meetingById(id){return meetings().find(function(x){return x.id===id;});}
  function cityData(name){var w=window.AUTOFLIP_WORLD;return w&&w.cities?w.cities.find(function(c){return c.name===name||c.id===name;}):null;}
  function fmt(t){t=Math.max(0,Math.floor(Number(t)||0));var day=Math.floor(t/1440)+1,m=t%1440;return 'День '+day+' · '+String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
  function timeOnly(t){var m=((Math.floor(Number(t)||0)%1440)+1440)%1440;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
  function roundHour(t){return Math.ceil(Number(t)/60)*60;}
  function rep(delta,reason){
    state.rep=Math.max(0,Number(state.rep||0)+delta);
    if(!Array.isArray(state.repHistory))state.repHistory=[];
    state.repHistory.unshift({delta:delta,reason:reason,day:Math.floor(total()/1440)+1});
    state.repHistory=state.repHistory.slice(0,20);
  }
  function carKey(c){return c&&(c._garageId||c.listingId||('car-'+c.id+'-'+c.buy));}
  function ownedCar(key){return (state.cars||[]).find(function(c){return carKey(c)===key;});}
  function activeListings(){
    if(!Array.isArray(state.activeListings))state.activeListings=state.activeListing&&state.activeListing.status==='active'?[state.activeListing]:[];
    return state.activeListings.filter(function(l){return l&&l.status==='active';});
  }
  function listingById(id){return activeListings().find(function(l){return l.id===id;})||null;}
  function listingCar(id){var l=id?listingById(id):state.activeListing;if(!l)return null;return ownedCar(l.carKey);}
  function findBuyer(id){return (state.buyerInbox||[]).find(function(x){return x.id===id;});}
  function scheduledFor(kind,sourceId){return meetings().find(function(m){return m.status==='scheduled'&&m.kind===kind&&m.sourceId===sourceId;});}
  function addMeeting(data){
    var m=Object.assign({id:'meet-'+Date.now()+'-'+Math.floor(Math.random()*9000+1000),status:'scheduled',createdAt:total()},data);
    meetings().unshift(m);state.meetings=meetings().slice(0,60);saveMeetings();return m;
  }
  function notify(text){state.notifications=Number(state.notifications||0)+1;if(typeof log==='function')log(text);else saveMeetings();}
  function meetingLabel(m){return m.kind==='seller_purchase'?'Покупка':m.kind==='seller_trade'?'Обмен с продавцом':m.kind==='buyer_trade'?'Обмен с покупателем':'Продажа';}
  function personLabel(m){return m.side==='buyer'?'Покупатель':'Продавец';}
  function statusLabel(m){return m.status==='completed'?'Завершена':m.status==='missed'?'Пропущена':m.status==='cancelled'?'Отменена':'Запланирована';}
  function isReady(m){var now=total();return m.status==='scheduled'&&now>=m.at&&now<=m.at+graceMinutes&&state.city===m.city;}
  function nextSlots(earliest){
    var now=total(),base=roundHour(Math.max(now+1,earliest||0)),day=Math.floor(base/1440),candidates=[base,base+120,day*1440+18*60,(day+1)*1440+10*60,(day+1)*1440+14*60,(day+1)*1440+19*60];
    return candidates.filter(function(v,i,a){return v>=base&&a.indexOf(v)===i;}).slice(0,5);
  }
  function fastestTravel(fromName,toName){
    var api=window.autoFlipWorld,from=cityData(fromName),to=cityData(toName);if(!api||!from||!to||from.name===to.name)return 0;
    return Math.min.apply(null,api.transports.map(function(t){return api.trip(from,to,t).minutes;}));
  }
  function appointmentEarliest(city,side){
    var now=total();if(city===state.city)return now+1;
    var travel=fastestTravel(state.city,city);return now+Math.max(1,travel+30);
  }
  function draftHtml(d,message){
    var same=d.sellerCity===state.city;
    return '<div class="app meeting-app">'+head('Место встречи')+
      '<section class="meeting-hero"><small>ЦЕНА СОГЛАСОВАНА</small><h2>'+esc(d.carName)+'</h2><p>'+esc(d.person)+': «По цене решили. Теперь давайте без суеты выберем, где и когда смотреть машину.»</p></section>'+
      (message||'')+
      '<div class="meeting-route-card"><span class="meeting-pin">📍</span><div><small>ТЫ СЕЙЧАС</small><b>'+esc(state.city)+'</b></div><i>↔</i><div><small>АВТОМОБИЛЬ</small><b>'+esc(d.sellerCity)+'</b></div></div>'+
      (same?'<button class="meeting-place selected" onclick="chooseMeetingPlace(\''+esc(d.sellerCity)+'\')"><span>✓</span><div><b>Встретиться в '+esc(d.sellerCity)+'</b><small>Вы в одном городе · можно выбрать любое будущее время</small></div></button>':
      '<button class="meeting-place" onclick="chooseMeetingPlace(\''+esc(d.sellerCity)+'\')"><span>🚗</span><div><b>Я приеду к продавцу</b><small>'+esc(d.sellerCity)+' · нужно успеть добраться к назначенному времени</small></div></button>'+
      '<button class="meeting-place" onclick="offerSellerMyCity()"><span>🤝</span><div><b>Предложить продавцу приехать ко мне</b><small>'+esc(state.city)+' · вероятность согласия продавца 50%</small></div></button>')+
      '<button class="action" onclick="returnToPurchaseNegotiation()">‹ Вернуться к разговору</button></div>';
  }
  window.startSellerMeeting=function(id,price){
    var c=makes[id];if(!c)return market('all',0);
    var existing=scheduledFor('seller_purchase',c.listingId||String(id));if(existing)return openMeeting(existing.id);
    selectedDraft={kind:'seller_purchase',side:'seller',sourceId:c.listingId||String(id),carId:id,carName:c.name,sellerCity:c.city,person:(typeof negotiation!=='undefined'&&negotiation.seller)||c.sellerName||'Продавец',price:Number(price),payload:{car:Object.assign({},c)}};
    render(draftHtml(selectedDraft,''));
  };
  window.chooseMeetingPlace=function(city){if(!selectedDraft)return market();selectedDraft.city=city;selectedDraft.earliest=appointmentEarliest(city,selectedDraft.side);renderMeetingTimes();};
  window.offerSellerMyCity=function(){
    if(!selectedDraft)return market();
    if(Math.random()<.5){selectedDraft.city=state.city;selectedDraft.sellerTravels=true;selectedDraft.earliest=total()+Math.max(1,fastestTravel(selectedDraft.sellerCity,state.city)+30);return renderMeetingTimes('<div class="meeting-answer yes"><b>Продавец согласился</b><span>«Ладно, подъеду в '+esc(state.city)+'. Только время заранее зафиксируем.»</span></div>');}
    render(draftHtml(selectedDraft,'<div class="meeting-answer no"><b>Продавец отказался ехать</b><span>«Не, дружище, в другой город не поеду. Машина здесь — приезжай, покажу как есть.»</span></div>'));
  };
  window.renderMeetingTimes=function(message){
    var d=selectedDraft;if(!d)return market();var earliest=d.earliest||appointmentEarliest(d.city,d.side),slots=nextSlots(earliest),currentDay=Math.floor(total()/1440)+1;
    var rows=slots.map(function(t,i){return '<button class="meeting-time" onclick="confirmMeetingTime('+t+')"><span>'+(['Ближайшее','Позже','Вечером','Утром','Днём'][i]||'Время')+'</span><b>'+fmt(t)+'</b><i>›</i></button>';}).join('');
    render('<div class="app meeting-app">'+head('Время встречи')+(message||'')+
      '<section class="meeting-hero compact"><small>'+esc(d.city).toUpperCase()+'</small><h2>Когда встречаемся?</h2><p>'+esc(d.person)+': «Выбирай время. Если договорились — я это окно держу за тобой.»</p></section>'+
      (d.city!==state.city?'<div class="meeting-travel-warning"><span>🧭</span><div><b>Учтено время на дорогу</b><small>Самое раннее безопасное время: '+fmt(earliest)+'</small></div></div>':'<div class="meeting-travel-ok">✓ Ограничения в один час больше нет — выбери любое будущее время</div>')+
      '<div class="meeting-time-list">'+rows+'</div><div class="meeting-custom"><b>Другое время</b><div><label>День<input id="meetingDay" type="number" min="'+currentDay+'" value="'+Math.max(currentDay,Math.floor(earliest/1440)+1)+'"></label><label>Время<input id="meetingClock" type="time" value="'+timeOnly(earliest)+'"></label></div><button class="action" onclick="confirmCustomMeeting()">Назначить своё время</button></div><button class="action" onclick="returnMeetingPlace()">‹ Изменить место</button></div>');
  };
  window.returnMeetingPlace=function(){if(!selectedDraft)return market();selectedDraft.city='';selectedDraft.earliest=0;render(draftHtml(selectedDraft,''));};
  window.confirmCustomMeeting=function(){var day=Number(document.getElementById('meetingDay').value),clock=String(document.getElementById('meetingClock').value||'').split(':'),at=(day-1)*1440+Number(clock[0])*60+Number(clock[1]);confirmMeetingTime(at);};
  window.confirmMeetingTime=function(at){
    var d=selectedDraft;if(!d)return market();at=Math.floor(Number(at)||0);if(at<Number(d.earliest||total()+1))return alert('К этому времени встречу не успеть. Выбери время позже.');
    var m=addMeeting({kind:d.kind,side:d.side,sourceId:d.sourceId,carId:d.carId,carName:d.carName,person:d.person,city:d.city,at:at,price:d.price,payload:d.payload,sellerTravels:!!d.sellerTravels});selectedDraft=null;notify('Встреча назначена: '+m.carName+' · '+m.city+' · '+fmt(m.at)+'.');meetingBooked(m.id);
  };
  function meetingBooked(id){
    var m=meetingById(id),remote=m&&m.city!==state.city;if(!m)return messages('meetings');
    render('<div class="app meeting-app">'+head('Встреча назначена')+'<section class="meeting-success"><span>✓</span><small>ДОГОВОРИЛИСЬ</small><h2>'+esc(m.carName)+'</h2><p>'+esc(m.person)+': «Всё, записал. '+esc(m.city)+', '+fmt(m.at)+'. Буду ждать.»</p></section><div class="meeting-ticket"><div><small>ГОРОД</small><b>'+esc(m.city)+'</b></div><div><small>ВРЕМЯ</small><b>'+fmt(m.at)+'</b></div><div><small>СДЕЛКА</small><b>'+esc(meetingLabel(m))+'</b></div></div>'+
      (remote?'<div class="meeting-travel-warning"><span>🗺️</span><div><b>Встреча в другом городе</b><small>Открой карты сейчас и выбери транспорт, который привезёт тебя вовремя.</small></div></div><button class="action green" onclick="openMeetingRoute(\''+m.id+'\')">🧭 Подобрать транспорт в Картах</button>':'<div class="meeting-travel-ok">✓ Ты уже в нужном городе</div>')+
      '<button class="action" onclick="messages(\'meetings\')">Открыть запланированные встречи</button></div>');
  }
  window.openMeetingRoute=function(id){var m=meetingById(id),c=m&&cityData(m.city);if(!m||!c)return messages('meetings');state.routeMeetingId=id;if(typeof openCityRoute==='function')openCityRoute(c.id);else mapApp();};
  function meetingCar(m){
    if(m&&m.payload&&m.payload.car)return m.payload.car;
    if(m&&m.payload&&m.payload.tradeDeal&&m.payload.tradeDeal.target)return m.payload.tradeDeal.target;
    return listingCar();
  }
  function diagnosticCost(car,mode){if(typeof marketDiagnosticCost==='function')return marketDiagnosticCost(car,mode);var value=Math.max(10000,Number(car&&car.market||0));return mode==='full'?Math.floor(value/3):Math.floor(value*.10);}
  function diagnosticResultHtml(m){
    var d=m.diagnostic;if(!d)return '<div class="meeting-unknown"><span>?</span><div><b>Состояние неизвестно</b><small>Можешь рискнуть и купить сразу либо проверить машину на месте.</small></div></div>';
    if(d.found)return '<div class="condition-card broken"><small>'+(d.mode==='full'?'ПОЛНАЯ':'СТАНДАРТНАЯ')+' ДИАГНОСТИКА</small><h3>⚠️ '+esc(d.faultName)+'</h3><p>Найдена неисправность. Ремонт оценивается в '+money(d.faultCost)+'. Теперь можно потребовать скидку или отказаться от сделки.</p></div>';
    if(d.healthyConfirmed)return '<div class="condition-card healthy"><small>ПОЛНАЯ ДИАГНОСТИКА</small><h3>✅ Автомобиль исправен</h3><p>Технических неисправностей не обнаружено.</p></div>';
    return '<div class="condition-card unknown"><small>СТАНДАРТНАЯ ДИАГНОСТИКА</small><h3>Явных поломок не найдено</h3><p>Стандартная проверка не даёт полной гарантии. Можно провести полную диагностику.</p></div>';
  }
  function sellerMeetingRoom(m){
    var c=meetingCar(m);if(!c)return '<div class="meeting-answer no"><b>Автомобиль недоступен</b><span>Объявление изменилось. Откажись от встречи без штрафа.</span></div>';
    var standard=diagnosticCost(c,'standard'),full=diagnosticCost(c,'full'),d=m.diagnostic||null;
    var diagButtons=!d?'<div class="meeting-diagnostic-grid"><button onclick="runMeetingDiagnostic(\''+m.id+'\',\'standard\')"><small>СТАНДАРТНАЯ</small><b>'+money(standard)+'</b><span>30% шанс найти скрытую поломку</span></button><button class="full" onclick="runMeetingDiagnostic(\''+m.id+'\',\'full\')"><small>ПОЛНАЯ</small><b>'+money(full)+'</b><span>Показывает точное состояние</span></button></div>':(d.mode==='standard'&&!d.found?'<button class="action" onclick="runMeetingDiagnostic(\''+m.id+'\',\'full\')">🧰 Провести полную диагностику · '+money(full)+'</button>':'');
    return '<section class="meeting-car"><div class="meeting-car-photo" style="background-image:linear-gradient(180deg,#0000,#000a),url(\''+photo(c)+'\')"><span>📍 '+esc(m.city)+'</span><b>'+esc(c.name)+'</b></div><div class="meeting-car-specs"><span><small>ГОД</small><b>'+Number(c.year||0)+'</b></span><span><small>ПРОБЕГ</small><b>'+Number(c.km||0).toLocaleString('ru-RU')+' км</b></span><span><small>ЦЕНА</small><b>'+money(m.price)+'</b></span></div></section><div class="bubble seller">'+esc(m.person)+': «Машина перед тобой. Смотри спокойно. Если всё устраивает — оформляем.»</div>'+diagnosticResultHtml(m)+diagButtons+(d&&d.found&&!m.counterTried?'<button class="action" onclick="meetingCounterOffer(\''+m.id+'\')">💬 Попросить скидку после диагностики</button>':'')+(m.counterText?'<div class="bubble seller">'+esc(m.person)+': «'+esc(m.counterText)+'»</div>':'')+'<button class="action green meeting-buy-confirm" onclick="completeMeeting(\''+m.id+'\')">✅ Подтвердить покупку · '+money(m.price)+'</button><button class="action meeting-decline" onclick="declineMeetingDeal(\''+m.id+'\')">Отказаться от автомобиля</button>';
  }
  window.openMeeting=function(id){
    processMeetings(false);var m=meetingById(id);if(!m)return messages('meetings');var now=total(),left=m.at-now,ready=isReady(m),place=state.city===m.city;
    var action='';
    if(m.status==='scheduled'&&now<m.at)action='<div class="meeting-countdown"><small>ДО ВСТРЕЧИ</small><b>'+durationShort(left)+'</b></div>'+(place?'<div class="meeting-travel-ok">✓ Ты уже в городе встречи</div>':'<button class="action green" onclick="openMeetingRoute(\''+m.id+'\')">🧭 Проложить маршрут в '+esc(m.city)+'</button>')+'<button class="action" onclick="cancelMeeting(\''+m.id+'\')">Отменить встречу</button>';
    else if(ready&&(m.kind==='seller_purchase'||m.kind==='seller_trade'))action='<div class="meeting-arrived"><b>Встреча началась</b><small>Осмотри автомобиль, проведи диагностику или сразу подтверди сделку.</small></div>'+sellerMeetingRoom(m);
    else if(ready)action='<div class="meeting-arrived"><b>Обе стороны на месте</b><small>Можно осмотреть автомобили и завершить сделку.</small></div><button class="action green" onclick="completeMeeting(\''+m.id+'\')">🤝 Подтвердить сделку</button>';
    else if(m.status==='scheduled'&&!place)action='<div class="meeting-answer no"><b>Ты не в том городе</b><span>Встреча проходит в '+esc(m.city)+'. Без твоего присутствия сделка не состоится.</span></div><button class="action green" onclick="openMeetingRoute(\''+m.id+'\')">🧭 Открыть Карты</button>';
    else action='<div class="meeting-result '+m.status+'"><b>'+statusLabel(m)+'</b><span>'+esc(m.result||'Событие завершено.')+'</span></div>';
    render('<div class="app meeting-app">'+head('Встреча')+'<section class="meeting-hero compact"><small>'+esc(meetingLabel(m).toUpperCase())+'</small><h2>'+esc(m.carName)+'</h2><p>'+esc(personLabel(m))+': '+esc(m.person)+'</p></section><div class="meeting-ticket"><div><small>ГОРОД</small><b>'+esc(m.city)+'</b></div><div><small>ДАТА И ВРЕМЯ</small><b>'+fmt(m.at)+'</b></div><div><small>СТАТУС</small><b>'+statusLabel(m)+'</b></div></div>'+action+'<button class="action" onclick="messages(\'meetings\')">‹ Ко всем встречам</button></div>');
  };
  function durationShort(mins){mins=Math.max(0,Math.ceil(mins));var d=Math.floor(mins/1440),h=Math.floor(mins%1440/60),m=mins%60;return (d?d+' д ':'')+(h?h+' ч ':'')+(m?m+' мин':'');}
  window.runMeetingDiagnostic=function(id,mode){
    var m=meetingById(id),c=meetingCar(m);if(!m||!c||!isReady(m))return openMeeting(id);var full=mode==='full',cost=diagnosticCost(c,full?'full':'standard');
    if(Number(state.money||0)<cost)return alert('Не хватает '+money(cost-Number(state.money||0))+' на диагностику.');
    if(typeof ensureMarketFlipCondition!=='function')return alert('Диагностика временно недоступна.');
    var condition=ensureMarketFlipCondition(c),previous=m.diagnostic,found=!condition.healthy&&(full||Math.random()<.30);
    state.money=Number(state.money||0)-cost;m.diagnostic={kind:'diagnostic-v2',mode:full?'full':'standard',cost:cost,totalSpent:Number(previous&&previous.totalSpent||0)+cost,found:found,healthyConfirmed:full&&condition.healthy,faultName:found?condition.name:'',faultCost:found?Number(condition.cost||0):0,loss:found?Number(condition.loss||0):0,risk:found?condition.name:(full&&condition.healthy?'автомобиль исправен':'поломок не обнаружено'),negotiationBonus:found?(full?.05:.03):0};
    c.prePurchaseDiagnostic=Object.assign({},m.diagnostic);if(!state.marketInspections||typeof state.marketInspections!=='object')state.marketInspections={};state.marketInspections[marketInspectionKey(c)]=Object.assign({},m.diagnostic);saveMeetings();openMeeting(id);
  };
  window.meetingCounterOffer=function(id){
    var m=meetingById(id);if(!m||!isReady(m)||!m.diagnostic||!m.diagnostic.found||m.counterTried)return openMeeting(id);m.counterTried=true;
    var discount=Math.min(Math.round(Number(m.price||0)*.08/1000)*1000,Math.round(Number(m.diagnostic.faultCost||0)*.55/1000)*1000),next=Math.max(10000,Number(m.price||0)-Math.max(1000,discount));
    if(Math.random()<.72){m.price=next;m.counterText='Ладно, косяк увидели честно. Скину до '+money(next)+', ниже уже не двигаюсь.';}else m.counterText='По цене уже договорились. Поломка учтена не была, но больше не уступлю.';saveMeetings();openMeeting(id);
  };
  window.declineMeetingDeal=function(id){var m=meetingById(id);if(!m||!isReady(m))return openMeeting(id);m.status='cancelled';m.result='Ты осмотрел автомобиль и отказался от сделки. Деньги за машину не списаны.';saveMeetings();openMeeting(id);};
  window.cancelMeeting=function(id){var m=meetingById(id);if(!m||m.status!=='scheduled')return;m.status='cancelled';m.result='Ты заранее отменил встречу. Репутация не изменилась.';var buyer=findBuyer(m.sourceId);if(buyer&&buyer.status==='meeting')buyer.status='accepted';saveMeetings();openMeeting(id);};
  function successMeeting(m){m.status='completed';m.completedAt=total();m.result='Ты приехал вовремя и выполнил договорённость.';rep(m.side==='buyer'?3:1,'Встреча без опоздания · '+m.carName);}
  function closeOtherCarMeetings(completed){
    if(!completed||completed.side!=='buyer')return;
    var listingId=completed.payload&&completed.payload.listingId;
    if(!listingId){var source=findBuyer(completed.sourceId);listingId=source&&source.listingId;}
    if(!listingId)return;
    meetings().forEach(function(other){
      if(other.id===completed.id||other.status!=='scheduled'||other.side!=='buyer')return;
      var buyer=findBuyer(other.sourceId),otherListing=other.payload&&other.payload.listingId||buyer&&buyer.listingId;
      if(otherListing!==listingId)return;
      other.status='cancelled';
      other.result='Автомобиль уже продан или обменян на другой встрече. Эта встреча закрыта автоматически.';
      if(buyer&&buyer.status!=='sold')buyer.status='declined';
    });
  }
  window.completeMeeting=function(id){
    var m=meetingById(id);if(!m||!isReady(m))return openMeeting(id);var beforeCars=(state.cars||[]).slice();
    if(m.kind==='seller_purchase'){
      var snapshot=Object.assign({},m.payload&&m.payload.car||{}),idx=makes.findIndex(function(c){return c.listingId===m.sourceId;});if(idx<0)idx=Number(m.carId);snapshot.id=idx;makes[idx]=snapshot;rawBuy(idx,m.price);var purchasedCar=(state.cars||[]).find(function(c){return beforeCars.indexOf(c)<0;});if(!purchasedCar)return openMeeting(id);if(typeof finalizeAcquiredCondition==='function')finalizeAcquiredCondition(purchasedCar);
    }else if(m.kind==='seller_trade'){
      if(typeof window.restoreSellerTradeDeal==='function')window.restoreSellerTradeDeal(m.payload&&m.payload.tradeDeal);rawSellerTrade();
    }else if(m.kind==='buyer_trade'){var tradeBuyer=findBuyer(m.sourceId);if(tradeBuyer)tradeBuyer.status='accepted';rawBuyerTrade(m.sourceId,m.price);}
    else{var saleBuyer=findBuyer(m.sourceId);if(saleBuyer)saleBuyer.status='accepted';rawBuyerSale(m.sourceId,m.price);}
    var after=state.cars||[],added=after.find(function(c){return beforeCars.indexOf(c)<0;});if(added)added.city=m.city;
    successMeeting(m);var buyer=findBuyer(m.sourceId);if(buyer)buyer.status='sold';closeOtherCarMeetings(m);saveMeetings();
    render('<div class="app meeting-app">'+head('Встреча завершена')+'<section class="meeting-success"><span>✓</span><small>РЕПУТАЦИЯ +'+(m.side==='buyer'?3:1)+'</small><h2>Договорённость выполнена</h2><p>'+esc(m.carName)+' · '+esc(m.city)+' · '+fmt(m.at)+'</p></section><button class="action green" onclick="garage()">Открыть гараж</button><button class="action" onclick="messages(\'meetings\')">История встреч</button></div>');
  };
  window.processMeetings=function(showNotice){
    var now=total(),changed=false,missed=[];meetings().forEach(function(m){if(m.status!=='scheduled'||now<=m.at+graceMinutes)return;m.status='missed';m.result='Ты не появился в '+m.city+' в назначенное время. Вторая сторона уехала.';rep(m.side==='buyer'?-7:-4,'Пропущена встреча · '+m.carName);var buyer=findBuyer(m.sourceId);if(buyer)buyer.status='declined';missed.push(m);changed=true;});
    if(changed){saveMeetings();if(showNotice&&missed.length)alert('Пропущена встреча: '+missed[0].carName+'. Репутация снизилась.');}return missed;
  };

  function scheduleBuyerMeeting(id){
    var x=findBuyer(id),c=x&&listingCar(x.listingId);if(!x||!c)return messages();state.activeListing=listingById(x.listingId);var existing=scheduledFor(x.trade?'buyer_trade':'buyer_sale',id);if(existing)return openMeeting(existing.id);
    selectedDraft={kind:x.trade?'buyer_trade':'buyer_sale',side:'buyer',sourceId:id,carName:c.name,sellerCity:c.city,person:x.name,price:Number(x.offer),city:c.city,earliest:appointmentEarliest(c.city,'buyer'),payload:{listingId:x.listingId}};
    renderBuyerTimes();
  }
  function renderBuyerTimes(){
    var d=selectedDraft,earliest=d.earliest,slots=nextSlots(earliest),currentDay=Math.floor(total()/1440)+1,rows=slots.map(function(t){return '<button class="meeting-time" onclick="confirmBuyerMeeting('+t+')"><span>'+timeOnly(t)+'</span><b>'+fmt(t)+'</b><i>›</i></button>';}).join('');
    render('<div class="app meeting-app">'+head('Встреча с покупателем')+'<section class="meeting-hero"><small>'+esc((d.kind==='buyer_trade'?'ОБМЕН':'ПРОДАЖА'))+'</small><h2>'+esc(d.carName)+'</h2><p>'+esc(d.person)+': «По деньгам поняли друг друга. Когда можно подъехать посмотреть машину?»</p></section><div class="meeting-route-card"><span class="meeting-pin">🚘</span><div><small>МАШИНА НАХОДИТСЯ</small><b>'+esc(d.city)+'</b></div></div>'+(d.city!==state.city?'<div class="meeting-travel-warning"><span>⚠</span><div><b>Ты сейчас в '+esc(state.city)+'</b><small>Чтобы продать или обменять машину, к встрече нужно вернуться в '+esc(d.city)+'.</small></div></div>':'<div class="meeting-travel-ok">✓ Можно назначить встречу на любое будущее время</div>')+'<div class="meeting-time-list">'+rows+'</div><div class="meeting-custom"><b>Точное время без ограничения в один час</b><div><label>День<input id="buyerMeetingDay" type="number" min="'+currentDay+'" value="'+Math.max(currentDay,Math.floor(earliest/1440)+1)+'"></label><label>Время<input id="buyerMeetingClock" type="time" value="'+timeOnly(earliest)+'"></label></div><button class="action" onclick="confirmCustomBuyerMeeting()">Назначить своё время</button></div><button class="action" onclick="openBuyerChat(\''+d.sourceId+'\')">‹ Назад к диалогу</button></div>');
  }
  window.confirmCustomBuyerMeeting=function(){var day=Number(document.getElementById('buyerMeetingDay').value),clock=String(document.getElementById('buyerMeetingClock').value||'').split(':'),at=(day-1)*1440+Number(clock[0])*60+Number(clock[1]);confirmBuyerMeeting(at);};
  window.confirmBuyerMeeting=function(at){var d=selectedDraft;if(!d)return messages();at=Number(at);if(at<d.earliest)return alert('Ты не успеешь к этому времени.');var m=addMeeting({kind:d.kind,side:'buyer',sourceId:d.sourceId,carName:d.carName,person:d.person,city:d.city,at:at,price:d.price,payload:d.payload});var x=findBuyer(d.sourceId);if(x)x.status='meeting';selectedDraft=null;notify('Встреча с покупателем назначена: '+m.carName+' · '+fmt(m.at)+'.');meetingBooked(m.id);};

  var baseOpenBuyerChat=window.openBuyerChat;
  window.openBuyerChat=function(id){
    var x=findBuyer(id);if(!x)return messages();if(x.status!=='accepted'&&x.status!=='meeting')return baseOpenBuyerChat(id);if(!x.read){x.read=true;state.notifications=Math.max(0,Number(state.notifications||0)-1);saveMeetings();}
    var c=listingCar(x.listingId),m=scheduledFor(x.trade?'buyer_trade':'buyer_sale',id),trade='';
    if(c)state.activeListing=listingById(x.listingId);
    if(x.trade&&x.tradeCar&&typeof tradeCarCardHtml==='function')trade='<div class="trade-context-title"><b>Какой автомобиль хотят получить</b><span>Покупатель отвечает именно на объявление ниже</span></div>'+tradeCarCardHtml(c,x.offer,'ТВОЙ АВТОМОБИЛЬ')+'<div class="trade-swap-arrow">⇅</div>'+tradeCarCardHtml(x.tradeCar,x.tradeValue,'АВТОМОБИЛЬ ПОКУПАТЕЛЯ');
    render('<div class="app meeting-app">'+head(x.name)+'<section class="meeting-hero compact"><small>'+esc(x.kind)+'</small><h2>'+esc((c&&c.name)||'Автомобиль')+'</h2><p>'+esc(x.name)+': «'+esc(x.text)+'»</p></section>'+trade+'<div class="meeting-price"><span>Согласованная цена</span><b>'+money(x.offer)+'</b></div>'+(m?'<div class="meeting-travel-ok">✓ Встреча назначена: '+fmt(m.at)+' · '+esc(m.city)+'</div><button class="action green" onclick="openMeeting(\''+m.id+'\')">Открыть встречу</button>':'<button class="action green" onclick="scheduleBuyerMeeting(\''+id+'\')">📅 Назначить встречу</button>')+'<button class="action" onclick="messages()">‹ К сообщениям</button></div>');
  };
  window.scheduleBuyerMeeting=scheduleBuyerMeeting;

  window.messages=function(tab){
    processMeetings(false);tab=tab||'chats';var active=meetings().filter(function(m){return m.status==='scheduled';}).sort(function(a,b){return a.at-b.at;}),items=state.buyerInbox||[],html='<div class="app meeting-app">'+head('Сообщения')+'<nav class="meeting-tabs"><button class="'+(tab==='chats'?'active':'')+'" onclick="messages(\'chats\')">Диалоги'+(items.filter(function(x){return !x.read&&x.status!=='declined';}).length?' <i>•</i>':'')+'</button><button class="'+(tab==='meetings'?'active':'')+'" onclick="messages(\'meetings\')">Встречи <span>'+active.length+'</span></button></nav>';
    if(tab==='meetings'){
      var ordered=meetings().slice().sort(function(a,b){return (a.status==='scheduled'?0:1)-(b.status==='scheduled'?0:1)||b.at-a.at;});
      html+=ordered.length?'<div class="meeting-list">'+ordered.map(function(m){return '<button class="meeting-list-card '+m.status+'" onclick="openMeeting(\''+m.id+'\')"><span class="meeting-list-date"><b>'+timeOnly(m.at)+'</b><small>День '+(Math.floor(m.at/1440)+1)+'</small></span><span class="meeting-list-copy"><small>'+esc(meetingLabel(m).toUpperCase())+'</small><b>'+esc(m.carName)+'</b><em>📍 '+esc(m.city)+' · '+esc(m.person)+'</em></span><strong>'+statusLabel(m)+'</strong></button>';}).join('')+'</div>':'<div class="meeting-empty"><span>📅</span><b>Встреч пока нет</b><p>После согласования цены назначенные покупки, продажи и обмены появятся здесь.</p></div>';
    }else{
      html+=items.length?items.map(function(x){var m=scheduledFor(x.trade?'buyer_trade':'buyer_sale',x.id),muted=x.status==='declined'?' · разговор завершён':m?' · встреча '+timeOnly(m.at):x.status==='accepted'?' · пора назначить встречу':x.status==='sold'?' · сделка завершена':'';return '<div class="contact '+(x.trade?'trade-thread':'')+'" onclick="openBuyerChat(\''+x.id+'\')"><div class="mini">'+esc(x.icon)+'</div><div><b>'+esc(x.name)+' · '+esc(x.kind)+'</b><small>'+esc(x.text)+esc(muted)+'</small></div>'+(!x.read?'<span class="unread">1</span>':'')+'</div>';}).join(''):'<div class="meeting-empty"><span>💬</span><b>Пока тишина</b><p>Покупатели напишут после публикации автомобиля.</p></div>';
    }
    html+='</div>';render(html);setTimeout(function(){if(typeof mountAutoBottomNav==='function')mountAutoBottomNav('messages');},130);
  };

  // Direct settlement is blocked: every accepted deal must pass through an appointment.
  window.buy=function(id,price){return startSellerMeeting(id,price);};
  window.completeBuyerSale=function(id){return scheduleBuyerMeeting(id);};
  window.completeBuyerTrade=function(id){return scheduleBuyerMeeting(id);};
  window.completeSellerTrade=function(){
    var d=typeof window.getSellerTradeDeal==='function'?window.getSellerTradeDeal():null;if(!d)return rawSellerTrade();var existing=scheduledFor('seller_trade',d.targetListingId||String(d.targetId));if(existing)return openMeeting(existing.id);
    selectedDraft={kind:'seller_trade',side:'seller',sourceId:d.targetListingId||String(d.targetId),carId:d.targetId,carName:d.target.name,sellerCity:d.target.city,person:d.seller||'Продавец',price:d.purchasePrice,payload:{tradeDeal:d}};render(draftHtml(selectedDraft,''));
  };

  var baseAdvance=window.advanceGameMinutes;
  if(typeof baseAdvance==='function')window.advanceGameMinutes=function(mins){var r=baseAdvance.apply(this,arguments);processMeetings(true);return r;};
  var baseTrip=window.confirmWorldTrip;
  if(typeof baseTrip==='function')window.confirmWorldTrip=function(){var r=baseTrip.apply(this,arguments);processMeetings(true);return r;};
  meetings();processMeetings(false);saveMeetings();setInterval(function(){processMeetings(false);},1000);
  window.autoFlipMeetings={format:fmt,process:processMeetings,isReady:isReady,graceMinutes:graceMinutes};
})();
