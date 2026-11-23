// AutoFlip game shell — presentation and navigation. Economic rules remain in the game layers.
(function(){
  'use strict';
  const wallpapers={aurora:['Северное сияние','radial-gradient(ellipse at 90% 15%,#6479cb 0,transparent 52%),radial-gradient(ellipse at 0 80%,#256e70 0,transparent 65%),#14253b'],dusk:['Закат','radial-gradient(ellipse at 85% 20%,#e9ab8c 0,transparent 60%),radial-gradient(ellipse at 10% 90%,#643a81 0,transparent 65%),#9b667c'],ocean:['Океан','radial-gradient(ellipse at 10% 5%,#5299bc 0,transparent 65%),radial-gradient(ellipse at 90% 95%,#133849 0,transparent 60%),#256e85'],forest:['Хвойный лес','radial-gradient(ellipse at 90% 10%,#7e9c76 0,transparent 60%),radial-gradient(ellipse at 0 85%,#163d37 0,transparent 65%),#365e4b'],ink:['Графит','radial-gradient(ellipse at 95% 10%,#6a6d7e 0,transparent 60%),radial-gradient(ellipse at 0 95%,#171922 0,transparent 65%),#333643'],plum:['Ультрафиолет','radial-gradient(ellipse at 85% 15%,#bd82be 0,transparent 60%),radial-gradient(ellipse at 10% 95%,#373e96 0,transparent 65%),#664f92']};
  const accents={mint:'#79e2bc',blue:'#8ebcff',violet:'#c7adff',peach:'#ffbd9e'};
  const paths={car:'M3 15v-5l2-5h14l2 5v5M3 10h18M5 15v3m14-3v3M6 13h2m8 0h2',chat:'M4 4h16v12H9l-5 4V4',garage:'M3 10l9-7 9 7v11H3V10m4 11V11h10v10M7 15h10',bank:'M3 8l9-5 9 5H3m2 3v7m7-7v7m7-7v7M3 21h18',map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5m6-2v16m6-14v16',home:'M3 11l9-8 9 8M5 9v12h14V9m-10 12v-8h6v8',phone:'M7 3l3 5-3 3a14 14 0 0 0 6 6l3-3 5 3-1 4C10 22 2 14 3 4l4-1',note:'M5 3h14v18H5V3m4 5h6m-6 4h6m-6 4h4',user:'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 21v-2a8 8 0 0 1 16 0v2',news:'M4 3h16v18H4V3m4 4h8m-8 4h8m-8 4h3m3 0h2',game:'M8 7h8c5 0 6 13 3 13l-4-4H9l-4 4C2 20 3 7 8 7m0 3v5m-2-2h4m5-2h.1m2 3h.1',shop:'M4 8h16l-1 13H5L4 8m4 0a4 4 0 0 1 8 0',settings:'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-5 0v6',bell:'M5 17h14l-2-4V9A5 5 0 0 0 7 9v4l-2 4m5 3h4',search:'M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14m5 12 6 6',arrow:'M14 5l-7 7 7 7',lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10m7 4v3',sun:'M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7m7 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',volume:'M3 9h4l5-4v14l-5-4H3V9m13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16',spark:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7'};
  Object.assign(paths,{users:'M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m10 1a3 3 0 1 0 0-6m-15 15v-2a5 5 0 0 1 10 0v2m2-6a4 4 0 0 1 6 3.5V21',briefcase:'M4 7h16v13H4V7m5 0V4h6v3m-11 5h16m-9 0v2h2v-2',plate:'M4 7h16v10H4V7m3 3h2m6 0h2m-10 4h10',shield:'M12 3l8 3v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3',menu:'M4 6h16M4 12h16M4 18h16',close:'M6 6l12 12M18 6L6 18',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 1 0 0-18m0 4v5l3 2',gift:'M4 10h16v11H4V10m-1-4h18v4H3V6m9 0v15M12 6c-2-4-6-3-5-1s2 3 5 1m0 0c2-4 6-3 5-1s-2 3-5 1'});
  const apps=[['market','Автомаркет','car','mint'],['messages','Сообщения','chat','blue'],['economyHub','Бизнес','briefcase','peach'],['openCommunity','Сообщество','users','violet'],['garage','Гараж','garage','peach'],['openPlatesApp','Номера','plate','violet'],['autoBankHome','Банк','bank','violet'],['mapApp','Карта','map','mint'],['realty','Дом','home','peach'],['contacts','Контакты','phone','blue'],['notes','Заметки','note','yellow'],['newsApp','Новости','news','peach'],['gamesApp','Игры','game','blue'],['settings','Настройки','settings','silver']];
  const gameTabs=[['shop','Магазин','shop'],['garage','Гараж','garage'],['home','Главная','home'],['community','Сообщество','users'],['plates','Номера','plate']];
  const screenHistory=[];
  const defaults={wallpaper:'aurora',customWallpaper:'',theme:'dark',accent:'mint',motion:true,widgets:true,privateBalance:false};
  function prefs(){
    if(!state.appearance||typeof state.appearance!=='object')state.appearance={};
    const p=state.appearance;
    for(const k of Object.keys(defaults))if(typeof p[k]!==typeof defaults[k])p[k]=defaults[k];
    if(p.wallpaper==='custom'&&!p.customWallpaper)p.wallpaper=defaults.wallpaper;
    if(p.wallpaper!=='custom'&&!wallpapers[p.wallpaper])p.wallpaper=defaults.wallpaper;
    if(!accents[p.accent])p.accent=defaults.accent;
    if(!['dark','light'].includes(p.theme))p.theme=defaults.theme;
    return p;
  }
  function icon(name){return '<svg class="af-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[name]||paths.spark)+'"/></svg>';}
  function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function balance(){return prefs().privateBalance?'••• ••• ₽':money(state.money);}
  function unread(){return (state.buyerInbox||[]).filter(x=>!x.read&&!['declined','sold'].includes(x.status)).length;}
  function time(){return typeof gameTimeText==='function'?gameTimeText():now();}
  function date(){return typeof gameDateText==='function'?gameDateText():dateText();}
  function persistUI(){if(typeof persist==='function')persist();else save();}
  window.openPlatesApp=function(){if(typeof window.plates==='function')return window.plates();render('<div class="app">'+head('Номера')+'<div class="note"><b>Приложение обновляется</b><p class="muted">Файл коллекции ещё загружается. Обнови страницу и открой «Номера» снова.</p></div><button class="action green" onclick="home()">На главный экран</button></div>');};
  function wallpaperCss(p){return p.wallpaper==='custom'&&p.customWallpaper?'linear-gradient(180deg,#07132142,#07132180),url("'+p.customWallpaper+'") center / cover no-repeat':wallpapers[p.wallpaper][1];}
  function apply(){const p=prefs(),root=document.documentElement;root.dataset.theme=p.theme;root.dataset.motion=p.motion?'on':'off';root.dataset.privateBalance=p.privateBalance?'on':'off';root.dataset.wallpaper=p.wallpaper;root.style.setProperty('--os-wallpaper',wallpaperCss(p));root.style.setProperty('--os-accent',accents[p.accent]);}
  window.setAppearance=function(key,value){if(!(key in defaults))return;const p=prefs();if(typeof value!==typeof defaults[key])return;p[key]=value;prefs();apply();persistUI();settings();};
  window.uploadCustomWallpaper=function(input){
    const file=input&&input.files&&input.files[0];if(!file)return;
    if(!/^image\//.test(file.type)||file.size>12*1024*1024){alert('Выбери изображение размером до 12 МБ.');input.value='';return;}
    const reader=new FileReader();
    reader.onerror=function(){alert('Не удалось прочитать изображение. Попробуй другой файл.');};
    reader.onload=function(){
      const image=new Image();
      image.onerror=function(){alert('Этот формат изображения не поддерживается.');};
      image.onload=function(){
        const maxW=720,maxH=1280,scale=Math.min(1,maxW/image.width,maxH/image.height),canvas=document.createElement('canvas');
        canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
        const context=canvas.getContext('2d');context.drawImage(image,0,0,canvas.width,canvas.height);
        const p=prefs();p.customWallpaper=canvas.toDataURL('image/jpeg',.72);p.wallpaper='custom';apply();persistUI();settings();
      };
      image.src=reader.result;
    };
    reader.readAsDataURL(file);
  };
  window.clearCustomWallpaper=function(){const p=prefs();p.customWallpaper='';if(p.wallpaper==='custom')p.wallpaper='aurora';apply();persistUI();settings();};
  window.toggleQuickSetting=function(key){if(key==='sound')toggleSound();else if(key==='theme')prefs().theme=prefs().theme==='dark'?'light':'dark';else if(key==='privateBalance')prefs().privateBalance=!prefs().privateBalance;apply();persistUI();quickSettings();};
  window.status=function(){return '<div class="game-clock-overlay"><span data-os-time>'+time()+'</span></div>';};
  let skipHistory=false;
  window.gameBack=function(){const previous=screenHistory.pop();if(!previous)return closeGameFlow();window.AUTOFLIP_ACTIVE_TAB=previous.active||'home';coreRender(previous.markup);setTimeout(function(){if(previous.active==='garage')decorateGarage();window.mountGameNav(previous.active);},120);};
  window.closeGameFlow=function(){const active=window.AUTOFLIP_ACTIVE_TAB||'home';screenHistory.length=0;skipHistory=true;return openGameTab(active);};
  window.head=function(title){return status()+'<div class="head os-head"><button onclick="gameBack()" aria-label="Назад">'+icon('arrow')+'</button><b>'+esc(title)+'</b><button class="game-close-flow" onclick="closeGameFlow()" aria-label="Закрыть раздел">'+icon('close')+'</button></div>';};
  function appButton(a){const badge=a[0]==='messages'?unread():0;return '<button class="os-app" data-app-name="'+a[1].toLowerCase()+'" onclick="'+a[0]+'()"><span class="os-icon '+a[3]+'">'+icon(a[2])+(badge?'<em>'+badge+'</em>':'')+'</span><small>'+a[1]+'</small></button>';}
  window.filterHomeApps=function(value){let n=0;document.querySelectorAll('.os-app-grid .os-app').forEach(el=>{el.hidden=!el.dataset.appName.includes(value.toLowerCase().trim());if(!el.hidden)n++;});const empty=document.getElementById('os-search-empty');if(empty)empty.hidden=n>0;};
  function detectGameTab(markup){
    const html=String(markup||'');
    if(html.includes('game-home-v2'))return 'home';
    // Match by screen component, not by visible copy. The plates screen mentions
    // the garage level, which previously made the garage tab light up.
    if(/plates-app|plate-collection|case-machine|plate-item/.test(html))return 'plates';
    if(/community-app|community-profile-app/.test(html))return 'community';
    if(html.includes('game-shop-v2')||html.includes('store-app'))return 'shop';
    if(/garage-app|garage-home|garage-levelup-screen/.test(html))return 'garage';
    // Bank, map, settings, messages, mini-games and sleep are lobby actions.
    return 'home';
  }
  function gameNavButton(tab,active){
    const badge=tab[0]==='community'?unread():0;
    return '<button class="game-tab '+(active===tab[0]?'active':'')+'" onclick="openGameTab(\''+tab[0]+'\')" aria-current="'+(active===tab[0]?'page':'false')+'"><span>'+icon(tab[2])+(badge?'<em>'+Math.min(9,badge)+(badge>9?'+':'')+'</em>':'')+'</span><small>'+tab[1]+'</small></button>';
  }
  window.mountGameNav=function(active){
    const screen=document.getElementById('screen');if(!screen)return;
    const old=document.getElementById('gameBottomNav');if(old)old.remove();
    if(screen.querySelector('.os-lockscreen'))return;
    const current=active||window.AUTOFLIP_ACTIVE_TAB||'home';
    window.AUTOFLIP_ACTIVE_TAB=current;
    const page=screen.querySelector('.app,.game-home-v2');if(page)page.classList.add('game-nav-page');
    const nav=document.createElement('nav');nav.id='gameBottomNav';nav.className='game-bottom-nav';nav.setAttribute('aria-label','Основные разделы');
    nav.innerHTML=gameTabs.map(tab=>gameNavButton(tab,current)).join('');
    screen.appendChild(nav);
    if(!screen.__autoflipSwipe){let startX=0,startY=0,ignoreSwipe=false;screen.addEventListener('touchstart',function(e){const t=e.changedTouches[0];startX=t.clientX;startY=t.clientY;ignoreSwipe=!!(e.target&&e.target.closest&&e.target.closest('[data-no-tab-swipe],.auto-market-filters,.filters,input,textarea,select'));},{passive:true});screen.addEventListener('touchend',function(e){if(ignoreSwipe){ignoreSwipe=false;return;}const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)<70||Math.abs(dx)<Math.abs(dy)*1.25)return;const i=gameTabs.findIndex(x=>x[0]===window.AUTOFLIP_ACTIVE_TAB),next=gameTabs[(i+(dx<0?1:-1)+gameTabs.length)%gameTabs.length];if(next)openGameTab(next[0]);},{passive:true});screen.__autoflipSwipe=true;}
  };
  window.openGameTab=function(tab){
    screenHistory.length=0;skipHistory=true;
    window.AUTOFLIP_ACTIVE_TAB=tab;
    if(tab==='home')return home();
    if(tab==='shop')return gameShop();
    if(tab==='garage')return garage();
    if(tab==='community')return openCommunity('global');
    if(tab==='plates')return openPlatesApp();
  };
  // The plate collection has its own main tab. Keeping a second copy in the
  // garage made the garage hierarchy noisy and caused two competing entry
  // points to the same inventory.
  function decorateGarage(){}
  const coreRender=window.render;
  function comparableMarkup(markup){return String(markup||'')
    .replace(/\s*game-nav-page\b/g,'')
    .replace(/<div class="game-clock-overlay">[\s\S]*?<\/div>/g,'')
    .replace(/<nav[^>]*id="gameBottomNav"[\s\S]*?<\/nav>/g,'')
    .replace(/data-os-time>[^<]*/g,'data-os-time>')
    .replace(/\s+/g,' ').trim();}
  if(typeof coreRender==='function')window.render=render=function(markup){
    const current=document.getElementById('screen'),currentMarkup=current&&current.innerHTML;
    const sameScreen=comparableMarkup(currentMarkup)===comparableMarkup(markup);
    if(!skipHistory&&!sameScreen&&currentMarkup&&!currentMarkup.includes('autoflip-booting')&&!currentMarkup.includes('os-lockscreen')){
      const previous=screenHistory[screenHistory.length-1];
      if(!previous||comparableMarkup(previous.markup)!==comparableMarkup(currentMarkup))screenHistory.push({markup:currentMarkup,active:window.AUTOFLIP_ACTIVE_TAB||'home'});
    }
    skipHistory=false;
    if(screenHistory.length>20)screenHistory.shift();
    const result=coreRender(markup),active=detectGameTab(markup);
    window.AUTOFLIP_ACTIVE_TAB=active;
    const finish=function(){if(active==='garage')decorateGarage();window.mountGameNav(active);};
    if(typeof setTimeout==='function')setTimeout(finish,100);else finish();
    return result;
  };
  const gameScreen=document.getElementById('screen');
  if(gameScreen&&typeof MutationObserver==='function')new MutationObserver(function(){
    if(gameScreen.querySelector('.os-lockscreen')||gameScreen.querySelector('#gameBottomNav'))return;
    if(!gameScreen.querySelector('.app,.game-home-v2'))return;
    const active=detectGameTab(gameScreen.innerHTML);
    if(active==='garage')decorateGarage();
    window.mountGameNav(active);
  }).observe(gameScreen,{childList:true});
  window.gameInbox=function(){
    const count=unread(),notifications=Array.isArray(state.phoneNotifications)?state.phoneNotifications.filter(x=>!x.read).length:Number(state.notifications||0);
    render('<div class="app game-inbox-v2">'+head('Центр событий')+'<section class="game-panel-title"><small>ВСЁ В ОДНОМ МЕСТЕ</small><h2>Сообщения и события</h2><p>Переговоры, встречи и важные новости бизнеса.</p></section><button class="game-inbox-card messages" onclick="messages()"><span>'+icon('chat')+(count?'<em>'+count+'</em>':'')+'</span><div><small>ПЕРЕГОВОРЫ</small><b>Сообщения</b><p>'+(count?count+' новых диалогов':'Новых сообщений нет')+'</p></div><i>›</i></button><button class="game-inbox-card alerts" onclick="notificationCenter()"><span>'+icon('bell')+(notifications?'<em>'+notifications+'</em>':'')+'</span><div><small>СОБЫТИЯ</small><b>Уведомления</b><p>'+(notifications?notifications+' непрочитанных':'Всё просмотрено')+'</p></div><i>›</i></button></div>');
  };
  window.gameTasks=function(){
    const economy=state.economy||{},daily=economy.goals&&economy.goals.daily&&economy.goals.daily.targets||[],weekly=economy.goals&&economy.goals.weekly&&economy.goals.weekly.targets||[];
    const block=function(title,items,reward,kind){const ready=items.length&&items.every(t=>Number(t.value||0)>=Number(t.need||1));return '<section class="game-task-block"><header><div><small>'+title+'</small><b>'+items.filter(t=>Number(t.value||0)>=Number(t.need||1)).length+'/'+items.length+' выполнено</b></div><strong>'+money(reward)+'</strong></header>'+(items.length?items.map(function(t){const done=Number(t.value||0)>=Number(t.need||1),progress=Math.min(100,Number(t.value||0)/Math.max(1,Number(t.need||1))*100);return '<article class="'+(done?'done':'')+'"><span>'+ (done?'✓':'○') +'</span><div><b>'+esc(t.label)+'</b><i><em style="width:'+progress+'%"></em></i><small>'+Math.min(Number(t.value||0),Number(t.need||1))+' / '+Number(t.need||1)+'</small></div></article>';}).join(''):'<p class="muted">Задания появятся после синхронизации прогресса.</p>')+'<button '+(ready?'':'disabled')+' onclick="economyClaimGoal(\''+kind+'\')">'+(ready?'Забрать награду':'Выполняется')+'</button></section>';};
    render('<div class="app game-tasks-v2">'+head('Задания')+'<section class="game-panel-title"><small>ТВОЙ ПРОГРЕСС</small><h2>Задания перекупа</h2><p>Выполняй игровые цели и получай награды. Бизнес и автосервис находятся отдельно.</p></section>'+block('ЗАДАНИЯ НА СЕГОДНЯ',daily,25000,'daily')+block('НЕДЕЛЬНЫЕ ЗАДАНИЯ',weekly,125000,'weekly')+'</div>');
  };
  window.gamePass=function(){
    const rep=Math.max(0,Number(state.rep||0)),level=Math.floor(rep/25)+1,progress=rep%25;
    render('<div class="app game-pass-v2">'+head('AutoPass')+'<section class="pass-hero"><small>СЕЗОН ПЕРЕКУПА</small><h2>AUTOPASS</h2><p>Выполняй задания, заключай сделки и открывай награды.</p><div><b>Уровень '+level+'</b><span><i style="width:'+(progress*4)+'%"></i></span><em>'+progress+' / 25 опыта</em></div></section><div class="pass-road">'+[0,1,2,3].map((n)=>'<article class="'+(n===0?'ready':'')+'"><span>'+(n===0?'✓':level+n)+'</span><div><small>'+(n===0?'ПОЛУЧЕНО':'НАГРАДА')+'</small><b>'+(n%2?'25 000 ₽':'Кейс номеров')+'</b></div><button '+(n===0?'disabled':'')+'>'+(n===0?'Готово':'Скоро')+'</button></article>').join('')+'</div><button class="action green" onclick="economyHub()">Открыть задания</button></div>');
  };
  window.gameShop=function(focusCode){
    window.AUTOFLIP_ACTIVE_TAB='shop';
    const hour=new Date().getHours(),left=24-hour;
    const daily=[['gift','Бесплатная диагностика','Один полный осмотр','Подарок'],['plate','Кейс «Город»','Шанс на редкий номер','Скоро'],['spark','Бонус репутации','+2 за следующую сделку','Скоро']];
    const product=(code,kind,title,detail,price,badge)=>'<button id="shop-product-'+code+'" class="shop-product-card '+kind+'" onclick="storeCheckout(\''+code+'\')">'+(badge?'<em>'+badge+'</em>':'')+'<span>'+icon(kind==='autopass'?'shield':kind==='plates'?'plate':kind==='boosts'?'spark':'garage')+'</span><div><b>'+title+'</b><small>'+detail+'</small></div><strong>'+price+' ₽</strong></button>';
    render('<div class="app game-shop-v2">'+head('Магазин')+'<header class="shop-v2-head"><div><small>ИГРОВОЙ МАГАЗИН</small><h2>Ежедневные предложения</h2></div><button onclick="storeHistory()">История</button></header><section class="shop-daily"><div class="shop-ribbon"><small>ЕЖЕДНЕВНЫЕ ТОВАРЫ</small><b>Новые предложения через '+left+' ч.</b></div><div class="shop-daily-grid">'+daily.map((item,i)=>'<article class="'+(i===0?'featured':'')+'"><span>'+icon(item[0])+'</span><small>'+item[1]+'</small><p>'+item[2]+'</p><button disabled>'+item[3]+'</button></article>').join('')+'</div></section><section class="shop-v2-section"><div class="shop-v2-title"><small>ВАЛЮТА</small><h3>Пополнить капитал</h3></div><div class="shop-currency-grid"><button onclick="storeCheckout(\'cash_200k\')"><span>₽</span><b>200 000 ₽</b><small>99 ₽</small></button><button onclick="storeCheckout(\'cash_1m\')"><span>₽₽</span><b>1 000 000 ₽</b><small>399 ₽</small></button><button onclick="storeCheckout(\'cash_2m\')"><span>₽₽₽</span><b>2 000 000 ₽</b><small>699 ₽</small></button></div></section><section class="shop-v2-section"><div class="shop-v2-title"><small>AUTOPASS</small><h3>Премиальная дорога</h3></div>'+product('autopass_ultimate','autopass','AutoPass Ultimate','60 наград сезона «Ночной перекуп»','499','60 НАГРАД')+'</section><section class="shop-v2-section"><div class="shop-v2-title"><small>РАЗВИТИЕ ГАРАЖА</small><h3>Все уровни сразу</h3></div><div class="shop-product-grid">'+product('garage_5','garage','Гараж 5 уровня','Больше мест и автосервис','499')+product('garage_10','garage','Гараж 10 уровня','Максимум мест и возможностей','1 499','МАКСИМУМ')+'</div></section><section class="shop-v2-section"><div class="shop-v2-title"><small>НОМЕРА</small><h3>Собери свой номер</h3></div>'+product('plate_custom','plates','Свой номер','Выбери буквы, цифры и регион','999','КОНСТРУКТОР')+'</section><section class="shop-v2-section"><div class="shop-v2-title"><small>УСКОРИТЕЛИ</small><h3>Покупатели пишут быстрее</h3></div><div class="shop-product-grid boosts">'+product('buyers_1d','boosts','Быстрые покупатели','На 1 день','99')+product('buyers_7d','boosts','Быстрые покупатели','На 7 дней','399','ПОПУЛЯРНОЕ')+product('buyers_30d','boosts','Быстрые покупатели','На 30 дней','1 199','ЛУЧШИЙ ВЫБОР')+'</div></section><div class="shop-beta-note">Платёж обрабатывается через ЮKassa. Все покупки привязываются к аккаунту.</div></div>');
    if(focusCode)setTimeout(function(){const target=document.getElementById('shop-product-'+focusCode);if(target){target.classList.add('store-product-focus');target.scrollIntoView({block:'center'});}},90);
  };
  window.gameMenu=function(){
    window.AUTOFLIP_ACTIVE_TAB='home';
    render('<div class="app game-menu-v2">'+head('Игровое меню')+'<div class="game-menu-sheet"><header><div><small>РАЗДЕЛЫ И ИНСТРУМЕНТЫ</small><h2>Меню</h2></div></header><button onclick="notes()"><span>'+icon('note')+'</span><div><b>Заметки</b><small>Записывай идеи и планы</small></div><i>›</i></button><button onclick="mapApp()"><span>'+icon('map')+'</span><div><b>Карта</b><small>Города, маршруты и переезды</small></div><i>›</i></button><button onclick="autoBankHome()"><span>'+icon('bank')+'</span><div><b>Банк</b><small>Кредиты и финансовая история</small></div><i>›</i></button><button onclick="contacts()"><span>'+icon('phone')+'</span><div><b>Контакты</b><small>Деловая телефонная книга</small></div><i>›</i></button><button onclick="newsApp()"><span>'+icon('news')+'</span><div><b>Новости</b><small>События автомобильного мира</small></div><i>›</i></button></div></div>');
  };
  window.home=function(){
    apply();window.AUTOFLIP_ACTIVE_TAB='home';
    const cars=Array.isArray(state.cars)?state.cars.filter(Boolean):(state.car?[state.car]:[]),count=cars.length,account=window.AUTOFLIP_ACCOUNT||{},nickname=account.nickname||'Перекуп',initial=esc(String(nickname).slice(0,1).toUpperCase());
    const garageLevel=Math.max(1,Number((state.garageProgress&&state.garageProgress.level)||state.garageLevel||1)),rep=Math.max(0,Number(state.rep||0)),passSummary=window.AUTOFLIP_AUTOPASS&&window.AUTOFLIP_AUTOPASS.summary?window.AUTOFLIP_AUTOPASS.summary():null,passLevel=passSummary?passSummary.level:Math.floor(rep/25)+1,passProgress=passSummary?passSummary.progress:rep%25,passNeed=passSummary?passSummary.needed:25;
    const clan=(state.community&&state.community.clan&&state.community.clan.name)||account.clanName||'Без клана',unreadCount=unread(),rawTasks=state.economy&&state.economy.goals&&state.economy.goals.daily&&state.economy.goals.daily.targets,tasks=Array.isArray(rawTasks)?rawTasks:[],done=tasks.filter(t=>t&&Number(t.value||0)>=Number(t.need||1)).length;
    render('<div class="game-home-v2">'+status()+'<div class="game-resource-bar"><button onclick="garageProgress()"><span>'+icon('garage')+'</span><small>ГАРАЖ</small><b>'+garageLevel+' ур.</b></button><button onclick="autoBankHome()"><span>₽</span><small>КАПИТАЛ</small><b>'+balance()+'</b></button><button onclick="openAccountProfile()"><span>★</span><small>РЕПУТАЦИЯ</small><b>'+rep+'</b></button></div><section class="lobby-top"><button class="lobby-profile" onclick="openAccountProfile()"><span>'+initial+'</span><div><b>'+esc(nickname)+'</b><small>'+esc(clan)+'</small></div></button><button class="lobby-pass" onclick="gamePass()"><small>AUTOPASS</small><div><b>'+passLevel+'</b><i><em style="width:'+(passProgress/passNeed*100)+'%"></em></i><span>'+passProgress+'/'+passNeed+'</span></div></button><nav class="lobby-tools"><button onclick="economyHub()" aria-label="Бизнес">'+icon('briefcase')+'<small>Бизнес</small></button><button onclick="settings()" aria-label="Настройки">'+icon('settings')+'<small>Настройки</small></button><button onclick="gameMenu()" aria-label="Меню">'+icon('menu')+'<small>Меню</small></button></nav></section><div class="lobby-city"><span>'+icon('map')+'</span><b>'+esc(state.city)+'</b><small>'+esc(date())+'</small></div><div class="lobby-side left"><button onclick="gameTasks()"><span>'+icon('note')+'</span><b>Задания</b><small>'+done+'/'+(tasks.length||3)+'</small></button><button onclick="gamesApp()"><span>'+icon('game')+'</span><b>Мини-игры</b></button></div><div class="lobby-side right"><button onclick="gameInbox()"><span>'+icon('bell')+(unreadCount?'<em>'+unreadCount+'</em>':'')+'</span><b>События</b><small>Чаты</small></button><button onclick="realty()"><span>'+icon('home')+'</span><b>Дом</b><small>Сон</small></button></div><div class="lobby-clock"><span>'+icon('clock')+'</span><b data-os-time>'+time()+'</b><small>игровое время</small></div><section class="lobby-action"><div><small>АВТОМАРКЕТ · '+count+' авто в гараже</small><h1>Найди свою следующую сделку</h1></div><button onclick="market(\'all\',0)"><span>'+icon('search')+'</span><b>Искать авто</b><small>Открыть рынок</small></button></section></div>');
  };
  function toggle(key,label,detail){const on=prefs()[key];return '<button class="os-setting-row" role="switch" aria-checked="'+on+'" onclick="setAppearance(\''+key+'\','+!on+')"><span><b>'+label+'</b><small>'+detail+'</small></span><i class="os-switch '+(on?'on':'')+'"></i></button>';}
  function customWallpaperCard(p){
    const preview=p.customWallpaper?' style="background-image:linear-gradient(180deg,#07132120,#07132170),url(\''+p.customWallpaper+'\')"':'';
    return '<label class="os-custom-wallpaper '+(p.wallpaper==='custom'?'selected':'')+'"><span'+preview+'>'+(p.customWallpaper?'✓':'＋')+'</span><b>'+(p.customWallpaper?'Свои обои':'Выбрать своё фото')+'</b><small>Фото уменьшится и сохранится вместе с прогрессом</small><input type="file" accept="image/*" onchange="uploadCustomWallpaper(this)" hidden></label>'+(p.customWallpaper?'<button class="os-remove-wallpaper" onclick="clearCustomWallpaper()">Удалить свои обои</button>':'');
  }
  window.settings=function(){const p=prefs(),account=window.AUTOFLIP_ACCOUNT||{};apply();render('<div class="app os-settings">'+head('Настройки')+'<div class="os-section-intro"><small>СДЕЛАЙ ЕГО СВОИМ</small><h2>Твой AutoFlip.</h2><p>Аккаунт, оформление и сохранения в одном месте.</p></div><h3 class="os-section-label">Аккаунт</h3><button class="os-account-row" onclick="openAccountProfile()"><span class="os-account-avatar">'+esc(String(account.nickname||'?').slice(0,1).toUpperCase())+'</span><span><b>'+esc(account.nickname||'Профиль аккаунта')+'</b><small>'+(account.id?'ID '+esc(account.id):'Никнейм, ID и данные входа')+'</small></span><i>›</i></button><h3 class="os-section-label">Обои</h3>'+customWallpaperCard(p)+'<div class="os-wall-grid">'+Object.keys(wallpapers).map(k=>'<button class="os-wall-choice '+(p.wallpaper===k?'selected':'')+'" aria-pressed="'+(p.wallpaper===k)+'" onclick="setAppearance(\'wallpaper\',\''+k+'\')"><span style="background:'+wallpapers[k][1]+'">'+(p.wallpaper===k?'✓':'')+'</span><small>'+wallpapers[k][0]+'</small></button>').join('')+'</div><h3 class="os-section-label">Оформление</h3><div class="os-segment">'+[['dark','Тёмное'],['light','Светлое']].map(a=>'<button class="'+(p.theme===a[0]?'selected':'')+'" aria-pressed="'+(p.theme===a[0])+'" onclick="setAppearance(\'theme\',\''+a[0]+'\')">'+a[1]+'</button>').join('')+'</div><div class="os-accent-row"><span>Цвет акцента</span>'+Object.keys(accents).map((k,i)=>'<button style="--swatch:'+accents[k]+'" aria-label="'+['Мятный','Голубой','Сиреневый','Персиковый'][i]+'" aria-pressed="'+(p.accent===k)+'" onclick="setAppearance(\'accent\',\''+k+'\')">'+(p.accent===k?'✓':'')+'</button>').join('')+'</div><h3 class="os-section-label">Удобство</h3>'+toggle('widgets','Виджеты','Капитал и гараж на главном экране')+toggle('privateBalance','Скрыть баланс','На главном экране и в сводке')+toggle('motion','Анимации','Плавные переходы между экранами')+'<button class="os-setting-row" role="switch" aria-checked="'+!!state.sound+'" onclick="toggleSound();settings()"><span><b>Звуки интерфейса</b><small>Отклик при открытии приложений</small></span><i class="os-switch '+(state.sound?'on':'')+'"></i></button><h3 class="os-section-label">Данные</h3><button class="os-setting-row" onclick="openSaveCenter()"><span><b>Сохранения и резервные копии</b><small>Облако, восстановление и журнал операций</small></span><i>›</i></button><div class="os-save-note">'+icon('lock')+'<span>Прогресс автоматически сохраняется в защищённом облаке.<br>При потере связи остаётся резервная копия на устройстве.</span></div><p class="os-version">AUTOFLIP · Интерфейс 6.0</p><button class="action green" onclick="home()">Посмотреть главный экран</button></div>');};
  window.quickSettings=function(){const p=prefs();render('<div class="app os-settings">'+head('Пункт управления')+'<div class="os-section-intro"><small>ВСЁ ПОД РУКОЙ</small><h2>Быстрые действия</h2></div><div class="os-quick-grid">'+[['sound','volume','Звуки',state.sound],['theme','sun','Светлая тема',p.theme==='light'],['privateBalance','eye','Скрыть баланс',p.privateBalance]].map(a=>'<button aria-pressed="'+!!a[3]+'" class="'+(a[3]?'selected':'')+'" onclick="toggleQuickSetting(\''+a[0]+'\')">'+icon(a[1])+'<b>'+a[2]+'</b><small>'+(a[3]?'Включено':'Выключено')+'</small></button>').join('')+'<button onclick="lockScreen()">'+icon('lock')+'<b>Блокировка</b><small>Экран ожидания</small></button></div><button class="action green" onclick="settings()">Обои и все настройки ↗</button><button class="action" onclick="notificationCenter()">Открыть уведомления</button></div>');};
  window.lockScreen=function(){apply();render('<button class="os-lockscreen" onclick="home()" aria-label="Разблокировать телефон">'+status()+'<span class="os-lock-mark">'+icon('lock')+'</span><small data-os-date>'+esc(date())+'</small><strong data-os-time>'+time()+'</strong><span class="os-lock-message">Новые возможности ждут.<br>Твой следующий ход — за тобой.</span><span class="os-unlock">Нажми, чтобы разблокировать ↑</span></button>');};
  const oldBottomNav=window.mountAutoBottomNav;
  if(typeof oldBottomNav==='function')window.mountAutoBottomNav=function(){window.mountGameNav('market');};
  // Update only the clock nodes; never replace a form while the player is typing.
  (typeof startVisibleInterval==='function'?startVisibleInterval:function(fn,delay){return setInterval(fn,delay);})(function(){if(window.AUTOFLIP_UPDATE_NEXT_ACTION)window.AUTOFLIP_UPDATE_NEXT_ACTION();document.querySelectorAll('[data-os-time]').forEach(el=>el.textContent=time());document.querySelectorAll('[data-os-date]').forEach(el=>el.textContent=date());},1000);
  const revealModernInterface=function(){
    const root=document.documentElement,screen=document.getElementById('screen');
    if(root&&root.classList)root.classList.remove('autoflip-booting');
    if(screen&&screen.removeAttribute)screen.removeAttribute('aria-busy');
  };
  // Never leave the game hidden when an old or partially migrated save contains
  // an unexpected value. Reveal first, then recover to a usable screen.
  revealModernInterface();
  screenHistory.length=0;
  try{
    apply();
    home();
  }catch(error){
    console.error('AutoFlip interface startup failed',error);
    const screen=document.getElementById('screen');
    if(screen){
      screen.innerHTML='<div class="app game-nav-page game-start-recovery"><section class="game-panel-title"><small>AUTOFLIP</small><h2>Интерфейс восстановлен</h2><p>Старые настройки экрана не повредят твой игровой прогресс.</p></section><button class="action green" id="recoverInterface">Открыть главный экран</button></div>';
      const recover=document.getElementById('recoverInterface');
      if(recover)recover.addEventListener('click',function(){
        state.appearance={};
        try{persistUI();}catch(_){}
        location.reload();
      });
    }
  }
})();

// Inform players about the strictly necessary session cookie and local game data.
(()=>{
  const key='autoflip-cookie-notice-v1';
  if(typeof document==='undefined'||!document.body||typeof document.createElement!=='function')return;
  try{if(localStorage.getItem(key)==='acknowledged')return;}catch(_){}
  const notice=document.createElement('section');
  notice.className='cookie-notice';notice.setAttribute('role','region');notice.setAttribute('aria-label','Уведомление об использовании cookies');
  notice.innerHTML='<div class="cookie-notice__copy"><strong class="cookie-notice__title">Необходимые cookies и данные на устройстве</strong><p class="cookie-notice__text">AutoFlip использует техническую cookie для безопасного входа и локальное хранилище для настроек, синхронизации и резервной копии игры. Рекламных cookies нет. <a href="/legal/privacy/#cookies">Подробнее в политике</a>.</p></div><button class="cookie-notice__button" type="button">Понятно</button>';
  notice.querySelector('button').addEventListener('click',()=>{try{localStorage.setItem(key,'acknowledged');}catch(_){}notice.hidden=true;});
  document.body.appendChild(notice);
})();
