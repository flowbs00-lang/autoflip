// AutoFlip World — routes, transport selection and market city picker.
(function(){
  'use strict';
  var world=window.AUTOFLIP_WORLD;if(!world||!Array.isArray(world.cities))return;
  var routeTarget='';
  var schematicLayout={
    kaliningrad:[1,1],spb:[1,2],kirov:[1,3],surgut:[1,4],
    tver:[2,1],yaroslavl:[2,2],perm:[2,3],chita:[2,4],
    moscow:[3,1],nizhny:[3,2],ekb:[3,3],vladivostok:[3,4],
    voronezh:[4,1],kazan:[4,2],ufa:[4,3],samara:[4,4],
    rostov:[5,1],krasnodar:[5,2],orenburg:[5,3],makhachkala:[5,4]
  };
  function esc(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function city(value){return world.cities.find(function(c){return c.id===value||c.name===value;})||world.cities[0];}
  function radians(v){return v*Math.PI/180;}
  function distance(a,b){
    var earth=6371,dLat=radians(b.lat-a.lat),dLon=radians(b.lon-a.lon);
    var h=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(radians(a.lat))*Math.cos(radians(b.lat))*Math.sin(dLon/2)*Math.sin(dLon/2);
    return Math.max(40,Math.round(earth*2*Math.atan2(Math.sqrt(h),Math.sqrt(1-h))*1.12/10)*10);
  }
  function trip(from,to,transport){
    var km=distance(from,to),minutes=Math.max(45,Math.round((km/transport.speed*60+transport.extra)/10)*10);
    var cost=Math.max(transport.min,Math.round(km*transport.rate/100)*100);
    return {from:from,to:to,transport:transport,km:km,minutes:minutes,cost:cost};
  }
  function duration(minutes){var d=Math.floor(minutes/1440),h=Math.floor(minutes%1440/60),m=minutes%60;return (d?d+' д ':'')+(h?h+' ч ':'')+(m?m+' мин':'');}
  function saveWorld(){if(typeof persist==='function')persist();else if(typeof save==='function')save();}
  function mapNodes(){
    return world.cities.map(function(c){
      var current=c.name===state.city,selected=c.id===routeTarget,pos=schematicLayout[c.id]||[5,4],status=current?'Ты здесь':(selected?'Куда едем':'Выбрать');
      return '<button type="button" class="world-map-city '+(current?'current ':'')+(selected?'selected':'')+'" style="--map-row:'+pos[0]+';--map-col:'+pos[1]+'" onclick="openCityRoute(\''+c.id+'\')" aria-label="Построить маршрут: '+esc(c.name)+'"><span class="world-map-pin">'+String(world.cities.indexOf(c)+1).padStart(2,'0')+'</span><span class="world-map-city-copy"><b>'+esc(c.name)+'</b><small>'+status+' · '+c.regions.join('/')+'</small></span></button>';
    }).join('');
  }
  function routeSelector(){
    var current=city(state.city),target=city(routeTarget);
    return '<section class="world-route-selector"><div class="world-route-selector-head"><div><small>ПЛАНИРОВЩИК ПОЕЗДКИ</small><b>Куда отправимся?</b></div><span>20 направлений</span></div><div class="world-route-fields"><div><small>ОТКУДА</small><b>'+esc(current.name)+'</b></div><i>→</i><label><small>КУДА</small><select aria-label="Выбрать город назначения" onchange="openCityRoute(this.value)">'+world.cities.map(function(c){return '<option value="'+c.id+'" '+(c.id===target.id?'selected':'')+'>'+esc(c.name)+'</option>';}).join('')+'</select></label></div></section>';
  }
  function staticMiniMap(){
    var from=city(state.city),to=city(routeTarget),same=from.id===to.id;
    return '<section class="world-static-map"><div class="world-static-map-head"><div><small>СТАТИЧНАЯ СХЕМА</small><b>Города России</b></div><span>20 точек</span></div><div class="world-static-route"><span><small>СТАРТ</small><b>'+esc(from.name)+'</b></span><i>→</i><span><small>'+(same?'ТЕКУЩАЯ ТОЧКА':'НАЗНАЧЕНИЕ')+'</small><b>'+esc(to.name)+'</b></span></div><div class="world-static-grid">'+mapNodes()+'</div><div class="world-static-map-foot"><span><i class="current"></i>Ты здесь</span><span><i class="selected"></i>Выбранный город</span><small>Нажми на любую карточку</small></div></section>';
  }
  function cityDirectory(){
    return '<section class="world-city-directory"><div class="world-city-directory-title"><div><small>ВСЕ НАПРАВЛЕНИЯ</small><b>Выбери город</b></div><span>'+world.cities.length+' городов</span></div><div class="world-city-directory-grid">'+world.cities.map(function(c){var current=c.name===state.city,selected=c.id===routeTarget;return '<button type="button" class="world-city-choice '+(current?'current ':'')+(selected?'selected':'')+'" onclick="openCityRoute(\''+c.id+'\')"><i></i><span><b>'+esc(c.name)+'</b><small>'+(current?'Ты здесь':'Построить маршрут')+'</small></span><strong>›</strong></button>';}).join('')+'</div></section>';
  }
  function routePanel(target){
    var from=city(state.city),to=city(target),km=distance(from,to);
    if(from.id===to.id)return '<section class="world-current-panel"><span>◎</span><div><small>ТЫ НАХОДИШЬСЯ ЗДЕСЬ</small><b>'+esc(to.name)+'</b><p>Выбери другой город на карте, чтобы построить маршрут.</p></div></section>';
    var meeting=Array.isArray(state.meetings)&&state.routeMeetingId?state.meetings.find(function(m){return m.id===state.routeMeetingId&&m.status==='scheduled'&&m.city===to.name;}):null;
    var now=typeof window.getGameTotal==='function'?Number(window.getGameTotal()||0):Number(state.gameClock&&state.gameClock.total||0);
    var options=world.transports.map(function(t){var x=trip(from,to,t),arrival=now+x.minutes,late=meeting&&arrival>meeting.at;return '<button class="world-transport '+(late?'world-transport-late':'')+'" '+(late?'disabled':'onclick="confirmWorldTrip(\''+to.id+'\',\''+t.id+'\')"')+'><span>'+t.icon+'</span><div><small>'+esc(t.description)+' · '+String(t.rate).replace('.',',')+' ₽/км</small><b>'+esc(t.name)+'</b><em>'+duration(x.minutes)+(meeting?' · '+(late?'не успеешь':'успеешь к встрече'):'')+'</em></div><strong>'+money(x.cost)+'</strong></button>';}).join('');
    return '<section class="world-route-panel"><div class="world-route-title"><div><small>'+(meeting?'ПОЕЗДКА НА ВСТРЕЧУ':'МАРШРУТ')+'</small><b>'+esc(from.name)+' → '+esc(to.name)+'</b></div><strong>'+km.toLocaleString('ru-RU')+' км</strong></div>'+(meeting?'<div class="world-meeting-deadline"><span>📅</span><div><b>'+esc(meeting.carName)+'</b><small>Нужно быть в городе к '+(typeof window.autoFlipMeetings==='object'?window.autoFlipMeetings.format(meeting.at):meeting.at)+'</small></div></div>':'')+'<div class="world-transport-list">'+options+'</div></section>';
  }
  function renderMap(target){
    var current=city(state.city);routeTarget=target||routeTarget||current.id;
    render('<div class="app world-app">'+head('Карта России')+
      '<section class="world-summary"><div><small>ТЕКУЩИЙ ГОРОД</small><h2>'+esc(current.name)+'</h2><p>Выбери направление любым удобным способом.</p></div><span>20<small>городов</small></span></section>'+routeSelector()+staticMiniMap()+routePanel(routeTarget)+cityDirectory()+'</div>');
  }
  window.mapApp=function(){routeTarget=city(state.city).id;renderMap(routeTarget);};
  window.openCityRoute=function(id){routeTarget=city(id).id;renderMap(routeTarget);};
  window.confirmWorldTrip=function(cityId,transportId){
    var from=city(state.city),to=city(cityId),transport=world.transports.find(function(t){return t.id===transportId;});
    if(!transport||from.id===to.id)return mapApp();
    var x=trip(from,to,transport);
    if(Number(state.money||0)<x.cost)return alert('Для поездки не хватает '+money(x.cost-Number(state.money||0))+'.');
    state.money=Number(state.money||0)-x.cost;
    if(typeof window.advanceGameMinutes==='function')window.advanceGameMinutes(x.minutes);
    else if(state.gameClock)state.gameClock.total=Number(state.gameClock.total||0)+x.minutes;
    state.city=to.name;state.marketCityFilter=to.name;
    if(state.routeMeetingId&&Array.isArray(state.meetings)){var linked=state.meetings.find(function(m){return m.id===state.routeMeetingId;});if(!linked||linked.city===to.name)state.routeMeetingId='';}
    if(typeof window.getGameTotal==='function')state.day=Math.max(Number(state.day||1),Math.floor(window.getGameTotal()/1440)+1);
    if(!Array.isArray(state.travelHistory))state.travelHistory=[];
    state.travelHistory.unshift({from:from.name,to:to.name,transport:transport.name,km:x.km,cost:x.cost,minutes:x.minutes,day:state.day});
    state.travelHistory=state.travelHistory.slice(0,20);
    if(typeof log==='function')log('Переезд: '+from.name+' → '+to.name+' · '+transport.name+' · '+x.km+' км · '+money(x.cost)+'.');
    saveWorld();
    render('<div class="app world-app world-arrival">'+head('Поездка завершена')+'<div class="world-arrival-icon">'+transport.icon+'</div><small>ТЫ ПРИБЫЛ</small><h2>'+esc(to.name)+'</h2><p>'+x.km.toLocaleString('ru-RU')+' км · '+duration(x.minutes)+' · '+money(x.cost)+'</p><button class="action green" onclick="market(\'all\',0)">Смотреть авто в '+esc(to.name)+'</button><button class="action" onclick="mapApp()">Вернуться на карту</button></div>');
  };
  window.marketCityPicker=function(){
    var selected=world.cities.some(function(c){return c.name===state.marketCityFilter;})?state.marketCityFilter:'';
    var buttons=world.cities.map(function(c){var count=(typeof makes!=='undefined'?makes:[]).filter(function(x){return x.city===c.name&&x.marketActive!==false;}).length;return '<button class="market-city-option '+(selected===c.name?'selected':'')+'" onclick="selectMarketCity(\''+c.id+'\')"><span><i></i><b>'+esc(c.name)+'</b><small>Коды '+c.regions.join(', ')+'</small></span><strong>'+count+' авто</strong></button>';}).join('');
    render('<div class="app world-app market-city-picker">'+head('Город объявлений')+'<section class="market-city-head"><small>ФИЛЬТР АВТОМАРКЕТА</small><h2>'+(selected?esc(selected):'Вся Россия')+'</h2><p>В каждом городе постоянно доступно 50 объявлений и ещё 50 находятся в резерве обновления.</p></section><button class="market-city-all '+(!selected?'selected':'')+'" onclick="selectMarketCity(\'all\')"><span>🇷🇺</span><div><b>Все города</b><small>Показать весь рынок</small></div><strong>›</strong></button><div class="market-city-grid">'+buttons+'</div><button class="action" onclick="market(\'all\',0)">Назад к объявлениям</button></div>');
  };
  window.selectMarketCity=function(id){var target=city(id);state.marketCityFilter=id==='all'?'':target.name;saveWorld();market('all',0);};
  window.goCity=function(name){openCityRoute(city(name).id);};
  window.autoFlipWorld={cities:world.cities,transports:world.transports,distance:distance,trip:trip,duration:duration};
  if(!world.cities.some(function(c){return c.name===state.city;}))state.city='Москва';
  if(state.marketCityFilter&&!world.cities.some(function(c){return c.name===state.marketCityFilter;}))state.marketCityFilter='';
  function migrateOwnedCity(car,index){
    if(!car||world.cities.some(function(c){return c.name===car.city;}))return;
    var seed=String(car._garageId||car.listingId||car.name||index),hash=0;
    for(var i=0;i<seed.length;i++)hash=((hash<<5)-hash+seed.charCodeAt(i))|0;
    car.city=world.cities[Math.abs(hash)%world.cities.length].name;
  }
  (Array.isArray(state.cars)?state.cars:[]).forEach(migrateOwnedCity);
  if(state.car)migrateOwnedCity(state.car,0);
  saveWorld();
})();
