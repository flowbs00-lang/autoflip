// AutoFlip AutoPass — 60 free rewards and 60 Ultimate rewards.
(function(){
  'use strict';
  var SEASON='night-dealer-1',MAX_LEVEL=60,POINTS_PER_LEVEL=100;
  function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function cash(v){return Number(v||0).toLocaleString('ru-RU')+' ₽';}
  function persistPass(){if(typeof persist==='function')persist();else if(typeof save==='function')save();}
  function ensure(){
    if(!state.autopass||typeof state.autopass!=='object'||state.autopass.season!==SEASON){
      var owned=!!(state.autopass&&state.autopass.ultimate);
      state.autopass={season:SEASON,points:0,ultimate:owned,freeClaimed:[],ultimateClaimed:[],cosmetics:[],daily:{day:0,earned:0},history:[]};
    }
    var p=state.autopass;
    if(!Array.isArray(p.freeClaimed))p.freeClaimed=[];
    if(!Array.isArray(p.ultimateClaimed))p.ultimateClaimed=[];
    if(!Array.isArray(p.cosmetics))p.cosmetics=[];
    if(!Array.isArray(p.history))p.history=[];
    if(!p.daily||typeof p.daily!=='object')p.daily={day:0,earned:0};
    // Existing players start with a small, non-destructive amount of progress.
    p.points=Math.max(0,Math.floor(Number(p.points||0)),Math.floor(Number(state.rep||0)*4));
    p.points=Math.min(POINTS_PER_LEVEL*MAX_LEVEL,p.points);
    p.freeClaimed=p.freeClaimed.filter(function(x){return Number(x)>=1&&Number(x)<=MAX_LEVEL;});
    p.ultimateClaimed=p.ultimateClaimed.filter(function(x){return Number(x)>=1&&Number(x)<=MAX_LEVEL;});
    return p;
  }
  function summary(){
    var p=ensure(),level=Math.min(MAX_LEVEL,Math.floor(p.points/POINTS_PER_LEVEL)+1),within=level===MAX_LEVEL?POINTS_PER_LEVEL:p.points%POINTS_PER_LEVEL;
    return {level:level,points:p.points,progress:within,needed:POINTS_PER_LEVEL,ultimate:!!p.ultimate,freeClaimed:p.freeClaimed.length,ultimateClaimed:p.ultimateClaimed.length};
  }
  function reward(level,premium){
    if(!premium){
      if(level===60)return{type:'cosmetic',value:'season-one-badge',icon:'🏆',title:'Знак сезона',detail:'Ночной перекуп'};
      if(level===50)return{type:'money',value:75000,icon:'₽',title:'75 000 ₽',detail:'Финальный капитал'};
      if(level===40)return{type:'boost',value:12,icon:'⚡',title:'12 ч. ускорения',detail:'Покупатели пишут быстрее'};
      if(level===30)return{type:'money',value:50000,icon:'₽',title:'50 000 ₽',detail:'Большая награда'};
      if(level===20)return{type:'rep',value:4,icon:'★',title:'+4 репутации',detail:'Рубеж сезона'};
      if(level===10)return{type:'money',value:30000,icon:'₽',title:'30 000 ₽',detail:'Первая большая награда'};
      if(level%5===0)return{type:'rep',value:2,icon:'★',title:'+2 репутации',detail:'Опыт перекупа'};
      if(level%3===0)return{type:'boost',value:2,icon:'⚡',title:'2 ч. ускорения',detail:'Покупатели пишут быстрее'};
      var small=5000+(level%4)*2500;return{type:'money',value:small,icon:'₽',title:cash(small),detail:'Игровой капитал'};
    }
    if(level===60)return{type:'plate',value:{id:'autopass-s1-60',number:'А777МР',region:'77',rarity:'secret'},icon:'▰',title:'А777МР 77',detail:'Главный номер сезона'};
    if(level===50)return{type:'money',value:200000,icon:'₽',title:'200 000 ₽',detail:'Финальный капитал Ultimate'};
    if(level===40)return{type:'cosmetic',value:'gold-listing-frame',icon:'✦',title:'Золотая рамка',detail:'Оформление объявлений'};
    if(level===30)return{type:'plate',value:{id:'autopass-s1-30',number:'Н030МР',region:'43',rarity:'ultra'},icon:'▰',title:'Н030МР 43',detail:'Сезонный номер'};
    if(level===20)return{type:'money',value:100000,icon:'₽',title:'100 000 ₽',detail:'Большая награда Ultimate'};
    if(level===10)return{type:'cosmetic',value:'night-dealer-frame',icon:'♛',title:'Рамка профиля',detail:'Ночной перекуп'};
    if(level%5===0)return{type:'boost',value:6,icon:'⚡',title:'6 ч. ускорения',detail:'Покупатели пишут быстрее'};
    if(level%3===0)return{type:'rep',value:2,icon:'★',title:'+2 репутации',detail:'Ultimate-репутация'};
    var premiumCash=15000+(level%4)*5000;return{type:'money',value:premiumCash,icon:'₽',title:cash(premiumCash),detail:'Ultimate-капитал'};
  }
  function addPoints(value,reason,ignoreDailyLimit){
    var p=ensure(),amount=Math.max(0,Math.floor(Number(value||0))),day=Math.max(1,Number(state.day||1));
    if(!amount)return 0;
    if(p.daily.day!==day)p.daily={day:day,earned:0};
    if(!ignoreDailyLimit){amount=Math.min(amount,Math.max(0,300-Number(p.daily.earned||0)));p.daily.earned+=amount;}
    if(!amount)return 0;
    p.points=Math.min(POINTS_PER_LEVEL*MAX_LEVEL,p.points+amount);
    p.history.unshift({at:Date.now(),points:amount,text:String(reason||'Игровое действие')});p.history=p.history.slice(0,30);
    persistPass();return amount;
  }
  function grant(item,level,track){
    var p=ensure();
    if(item.type==='money')state.money=Number(state.money||0)+Number(item.value||0);
    if(item.type==='rep')state.rep=Number(state.rep||0)+Number(item.value||0);
    if(item.type==='boost'){
      if(!state.store||typeof state.store!=='object')state.store={};
      state.store.fastBuyersUntil=Math.max(Date.now(),Number(state.store.fastBuyersUntil||0))+Number(item.value||0)*3600000;
    }
    if(item.type==='cosmetic'&&p.cosmetics.indexOf(item.value)<0)p.cosmetics.push(item.value);
    if(item.type==='plate'){
      if(!state.plates||typeof state.plates!=='object')state.plates={items:[],nextId:1};
      if(!Array.isArray(state.plates.items))state.plates.items=[];
      if(!state.plates.items.some(function(x){return x&&x.id===item.value.id;}))state.plates.items.unshift({id:item.value.id,number:item.value.number,region:{code:item.value.region,city:item.value.region==='43'?'Киров':'Москва',country:'Россия'},rarity:item.value.rarity,value:0,createdAt:Date.now(),attachedCarId:null,premium:true,tradable:false});
    }
    p.history.unshift({at:Date.now(),reward:level,track:track,text:item.title});p.history=p.history.slice(0,30);
  }
  window.claimAutoPassReward=function(level,track){
    var p=ensure(),s=summary(),n=Math.max(1,Math.min(MAX_LEVEL,Number(level||0))),premium=track==='ultimate',list=premium?p.ultimateClaimed:p.freeClaimed;
    if(n>s.level||list.indexOf(n)>=0)return gamePass();
    if(premium&&!p.ultimate)return openStoreProduct('autopass_ultimate');
    var item=reward(n,premium);grant(item,n,premium?'ultimate':'free');list.push(n);list.sort(function(a,b){return a-b;});persistPass();
    if(typeof pushPhoneNotification==='function')pushPhoneNotification('AutoPass',premium?'♛':'✓','Получено: '+item.title+'.','autopass','autopass-'+track+'-'+n);
    gamePass();
  };
  window.claimAllAutoPassRewards=function(){
    var p=ensure(),s=summary(),changed=false;
    for(var level=1;level<=s.level;level++){
      if(p.freeClaimed.indexOf(level)<0){grant(reward(level,false),level,'free');p.freeClaimed.push(level);changed=true;}
      if(p.ultimate&&p.ultimateClaimed.indexOf(level)<0){grant(reward(level,true),level,'ultimate');p.ultimateClaimed.push(level);changed=true;}
    }
    if(changed){p.freeClaimed.sort(function(a,b){return a-b;});p.ultimateClaimed.sort(function(a,b){return a-b;});persistPass();}
    gamePass();
  };
  function rewardCard(level,premium){
    var p=ensure(),s=summary(),item=reward(level,premium),claimed=(premium?p.ultimateClaimed:p.freeClaimed).indexOf(level)>=0,locked=level>s.level||(premium&&!p.ultimate),canClaim=!claimed&&!locked;
    var action=premium&&!p.ultimate?'openStoreProduct(\'autopass_ultimate\')':'claimAutoPassReward('+level+',\''+(premium?'ultimate':'free')+'\')';
    return '<button class="pass-reward '+(premium?'ultimate ':'')+(claimed?'claimed ':canClaim?'claimable ':'locked ')+'" onclick="'+action+'" '+(level>s.level?'disabled':'')+'><span>'+item.icon+'</span><div><b>'+esc(item.title)+'</b><small>'+esc(item.detail)+'</small></div><em>'+(claimed?'✓':premium&&!p.ultimate?'♛':level>s.level?'🔒':'Забрать')+'</em></button>';
  }
  function passRows(){var s=summary(),html='';for(var level=1;level<=MAX_LEVEL;level++)html+='<article class="pass-level '+(level===s.level?'current ':'')+(level%10===0?'milestone ':'')+'" data-pass-level="'+level+'">'+rewardCard(level,false)+'<span class="pass-level-number">'+level+'</span>'+rewardCard(level,true)+'</article>';return html;}
  window.gamePass=function(){
    var p=ensure(),s=summary(),available=s.level-p.freeClaimed+(p.ultimate?s.level-p.ultimateClaimed:0),percent=Math.min(100,s.progress/s.needed*100);
    var offer='<section class="ultimate-offer '+(p.ultimate?'owned':'')+'"><div><small>ULTIMATE</small><b>'+(p.ultimate?'Уже активирован':'Ещё 60 премиальных наград')+'</b><p>'+(p.ultimate?'Все достигнутые уровни доступны для получения.':'Сезонные номера, оформление, ускорители и капитал.')+'</p></div>'+(p.ultimate?'<span>✓</span>':'<button onclick="openStoreProduct(\'autopass_ultimate\')">Купить · 499 ₽</button>')+'</section>';
    render('<div class="app game-pass-v3">'+head('AutoPass')+'<section class="autopass-hero"><div><small>СЕЗОН 1 · НОЧНОЙ ПЕРЕКУП</small><h2>AUTO<span>PASS</span></h2><p>Проходи задания и развивай автобизнес. Всего 60 уровней.</p></div><strong>'+s.level+'</strong><footer><b>'+s.progress+' / '+s.needed+' очков</b><i><em style="width:'+percent+'%"></em></i></footer></section><div class="autopass-actions"><button onclick="gameTasks()">Задания</button><button class="'+(available?'ready':'')+'" onclick="claimAllAutoPassRewards()" '+(available?'':'disabled')+'>'+(available?'Забрать · '+available:'Всё получено')+'</button></div>'+offer+'<div class="pass-columns"><b>БЕСПЛАТНО</b><span>УРОВЕНЬ</span><b>ULTIMATE</b></div><main class="pass-road-v3">'+passRows()+'</main></div>');
    setTimeout(function(){var current=document.querySelector('.pass-level.current');if(current&&s.level>3)current.scrollIntoView({block:'center'});},80);
  };
  var rawOperation=window.AUTOFLIP_RECORD_OPERATION;
  if(typeof rawOperation==='function'&&!rawOperation.__autopass){
    var operationPoints={purchase:20,sale:50,exchange:55,repair:10};
    var wrapped=function(type,details,deferSave){var entry=rawOperation.apply(this,arguments),points=operationPoints[type]||0;if(entry&&points)addPoints(points,entry.label||type,false);return entry;};
    wrapped.__autopass=true;window.AUTOFLIP_RECORD_OPERATION=wrapped;
  }
  var rawGoal=window.economyClaimGoal;
  if(typeof rawGoal==='function'&&!rawGoal.__autopass){
    var goalWrapped=async function(kind){var e=state.economy&&state.economy.goals,g=e&&(kind==='weekly'?e.weekly:e.daily),before=!!(g&&g.claimed),result=await rawGoal.apply(this,arguments);if(g&&!before&&g.claimed)addPoints(kind==='weekly'?450:150,kind==='weekly'?'Недельные задания':'Ежедневные задания',true);return result;};
    goalWrapped.__autopass=true;window.economyClaimGoal=goalWrapped;
  }
  var rawClan=window.economyClaimClanGoal;
  if(typeof rawClan==='function'&&!rawClan.__autopass){
    var clanWrapped=async function(){var g=state.economy&&state.economy.goals&&state.economy.goals.clan,before=!!(g&&g.claimed),result=await rawClan.apply(this,arguments);if(g&&!before&&g.claimed)addPoints(200,'Задание клана',true);return result;};
    clanWrapped.__autopass=true;window.economyClaimClanGoal=clanWrapped;
  }
  window.AUTOFLIP_AUTOPASS={season:SEASON,maxLevel:MAX_LEVEL,pointsPerLevel:POINTS_PER_LEVEL,ensure:ensure,summary:summary,reward:reward,addPoints:addPoints};
  ensure();persistPass();
  setTimeout(function(){if(document.querySelector('.game-home-v2')&&typeof home==='function')home();},0);
})();
