// AutoFlip OS — presentation and personalisation. Economic rules remain in the game layers.
(function(){
  'use strict';
  const wallpapers={aurora:['Северное сияние','radial-gradient(ellipse at 90% 15%,#6479cb 0,transparent 52%),radial-gradient(ellipse at 0 80%,#256e70 0,transparent 65%),#14253b'],dusk:['Закат','radial-gradient(ellipse at 85% 20%,#e9ab8c 0,transparent 60%),radial-gradient(ellipse at 10% 90%,#643a81 0,transparent 65%),#9b667c'],ocean:['Океан','radial-gradient(ellipse at 10% 5%,#5299bc 0,transparent 65%),radial-gradient(ellipse at 90% 95%,#133849 0,transparent 60%),#256e85'],forest:['Хвойный лес','radial-gradient(ellipse at 90% 10%,#7e9c76 0,transparent 60%),radial-gradient(ellipse at 0 85%,#163d37 0,transparent 65%),#365e4b'],ink:['Графит','radial-gradient(ellipse at 95% 10%,#6a6d7e 0,transparent 60%),radial-gradient(ellipse at 0 95%,#171922 0,transparent 65%),#333643'],plum:['Ультрафиолет','radial-gradient(ellipse at 85% 15%,#bd82be 0,transparent 60%),radial-gradient(ellipse at 10% 95%,#373e96 0,transparent 65%),#664f92']};
  const accents={mint:'#79e2bc',blue:'#8ebcff',violet:'#c7adff',peach:'#ffbd9e'};
  const paths={car:'M3 15v-5l2-5h14l2 5v5M3 10h18M5 15v3m14-3v3M6 13h2m8 0h2',chat:'M4 4h16v12H9l-5 4V4',garage:'M3 10l9-7 9 7v11H3V10m4 11V11h10v10M7 15h10',bank:'M3 8l9-5 9 5H3m2 3v7m7-7v7m7-7v7M3 21h18',map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5m6-2v16m6-14v16',home:'M3 11l9-8 9 8M5 9v12h14V9m-10 12v-8h6v8',phone:'M7 3l3 5-3 3a14 14 0 0 0 6 6l3-3 5 3-1 4C10 22 2 14 3 4l4-1',note:'M5 3h14v18H5V3m4 5h6m-6 4h6m-6 4h4',user:'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 21v-2a8 8 0 0 1 16 0v2',news:'M4 3h16v18H4V3m4 4h8m-8 4h8m-8 4h3m3 0h2',game:'M8 7h8c5 0 6 13 3 13l-4-4H9l-4 4C2 20 3 7 8 7m0 3v5m-2-2h4m5-2h.1m2 3h.1',shop:'M4 8h16l-1 13H5L4 8m4 0a4 4 0 0 1 8 0',settings:'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-5 0v6',bell:'M5 17h14l-2-4V9A5 5 0 0 0 7 9v4l-2 4m5 3h4',search:'M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14m5 12 6 6',arrow:'M14 5l-7 7 7 7',lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10m7 4v3',sun:'M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7m7 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',volume:'M3 9h4l5-4v14l-5-4H3V9m13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16',spark:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7'};
  Object.assign(paths,{users:'M7 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8m10 1a3 3 0 1 0 0-6m-15 15v-2a5 5 0 0 1 10 0v2m2-6a4 4 0 0 1 6 3.5V21',briefcase:'M4 7h16v13H4V7m5 0V4h6v3m-11 5h16m-9 0v2h2v-2',plate:'M4 7h16v10H4V7m3 3h2m6 0h2m-10 4h10',shield:'M12 3l8 3v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3'});
  const apps=[['market','Автомаркет','car','mint'],['messages','Сообщения','chat','blue'],['economyHub','Бизнес','briefcase','peach'],['openCommunity','Сообщество','users','violet'],['garage','Гараж','garage','peach'],['openPlatesApp','Номера','plate','violet'],['autoBankHome','Банк','bank','violet'],['mapApp','Карта','map','mint'],['realty','Дом','home','peach'],['contacts','Контакты','phone','blue'],['notes','Заметки','note','yellow'],['newsApp','Новости','news','peach'],['gamesApp','Игры','game','blue'],['settings','Настройки','settings','silver']];
  const gameTabs=[['home','Главная','home'],['market','Рынок','car'],['garage','Гараж','garage'],['map','Карта','map'],['community','Клуб','users']];
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
  window.status=function(){return '<div class="status os-status"><span data-os-time>'+time()+'</span><span class="os-signal">▂▄▆ <span class="os-battery" aria-label="Батарея заряжена"></span></span></div>';};
  window.head=function(title){return status()+'<div class="head os-head"><button onclick="home()" aria-label="На главный экран">'+icon('arrow')+'</button><b>'+esc(title)+'</b><button onclick="quickSettings()" aria-label="Быстрые настройки">'+icon('settings')+'</button></div>';};
  function appButton(a){const badge=a[0]==='messages'?unread():0;return '<button class="os-app" data-app-name="'+a[1].toLowerCase()+'" onclick="'+a[0]+'()"><span class="os-icon '+a[3]+'">'+icon(a[2])+(badge?'<em>'+badge+'</em>':'')+'</span><small>'+a[1]+'</small></button>';}
  window.filterHomeApps=function(value){let n=0;document.querySelectorAll('.os-app-grid .os-app').forEach(el=>{el.hidden=!el.dataset.appName.includes(value.toLowerCase().trim());if(!el.hidden)n++;});const empty=document.getElementById('os-search-empty');if(empty)empty.hidden=n>0;};
  function detectGameTab(markup){
    const html=String(markup||'');
    if(html.includes('game-home'))return 'home';
    if(/auto-market|market-search-box|Избранные объявления|Продать автомобиль/.test(html))return 'market';
    if(/garage-app|garage-home|Гараж/.test(html))return 'garage';
    if(/world-|map-|Карта городов|Переезд/.test(html))return 'map';
    if(/community-|Лучшие перекупы|Рейтинг игроков/.test(html))return 'community';
    return window.AUTOFLIP_ACTIVE_TAB||'home';
  }
  function gameNavButton(tab,active){
    const badge=tab[0]==='market'?unread():0;
    return '<button class="game-tab '+(active===tab[0]?'active':'')+'" onclick="openGameTab(\''+tab[0]+'\')" aria-current="'+(active===tab[0]?'page':'false')+'"><span>'+icon(tab[2])+(badge?'<em>'+Math.min(9,badge)+(badge>9?'+':'')+'</em>':'')+'</span><small>'+tab[1]+'</small></button>';
  }
  window.mountGameNav=function(active){
    const screen=document.getElementById('screen');if(!screen)return;
    const old=document.getElementById('gameBottomNav');if(old)old.remove();
    if(screen.querySelector('.os-lockscreen'))return;
    const current=active||window.AUTOFLIP_ACTIVE_TAB||'home';
    window.AUTOFLIP_ACTIVE_TAB=current;
    const page=screen.querySelector('.app,.game-home');if(page)page.classList.add('game-nav-page');
    const nav=document.createElement('nav');nav.id='gameBottomNav';nav.className='game-bottom-nav';nav.setAttribute('aria-label','Основные разделы');
    nav.innerHTML=gameTabs.map(tab=>gameNavButton(tab,current)).join('');
    screen.appendChild(nav);
  };
  window.openGameTab=function(tab){
    window.AUTOFLIP_ACTIVE_TAB=tab;
    if(tab==='home')return home();
    if(tab==='market')return market('all',0);
    if(tab==='garage')return garage();
    if(tab==='map')return mapApp();
    if(tab==='community')return openCommunity('global');
  };
  const coreRender=window.render;
  if(typeof coreRender==='function')window.render=function(markup){
    const result=coreRender(markup),active=detectGameTab(markup);
    window.AUTOFLIP_ACTIVE_TAB=active;
    window.mountGameNav(active);
    return result;
  };
  window.gameMenu=function(){
    window.AUTOFLIP_ACTIVE_TAB='home';
    render('<div class="app game-menu">'+head('Все разделы')+'<section class="game-menu-head"><small>AUTOFLIP</small><h2>Все возможности</h2><p>Рынок, бизнес, коллекции и настройки в одном месте.</p></section><div class="game-menu-grid">'+apps.map(appButton).join('')+'</div></div>');
  };
  window.home=function(){
    apply();window.AUTOFLIP_ACTIVE_TAB='home';
    const p=prefs(),cars=(state.cars||[]).filter(Boolean),count=cars.length,capacity=typeof window.garageCapacity==='function'?window.garageCapacity():2;
    const next=window.AUTOFLIP_NEXT_ACTION?window.AUTOFLIP_NEXT_ACTION():{title:'Следующий ход',detail:'Открыть сводку'};
    const account=window.AUTOFLIP_ACCOUNT||{},nickname=account.nickname||'Перекуп',initial=esc(String(nickname).slice(0,1).toUpperCase());
    const garageLevel=Math.max(1,Number(state.garageLevel||(state.garage&&state.garage.level)||1)),rep=Math.max(0,Number(state.rep||0)),levelProgress=rep%100,progress=Math.max(8,Math.min(100,levelProgress||8));
    const activeCar=cars[0],carTitle=activeCar?activeCar.name:'Твоя первая машина ждёт',carMeta=activeCar?(activeCar.year+' · '+(activeCar.repaired?'готова к продаже':'нужна подготовка')):'Начни с выгодного объявления на рынке';
    const favorites=typeof ensureMarketFavorites==='function'?ensureMarketFavorites().length:Number((state.marketFavorites||[]).length),plates=Array.isArray(state.plates)?state.plates.length:Array.isArray(state.plateCollection)?state.plateCollection.length:0;
    render('<div class="game-home">'+status()+
      '<header class="game-hud"><button class="game-profile" onclick="openAccountProfile()"><span>'+initial+'</span><div><small>УРОВЕНЬ ГАРАЖА '+garageLevel+'</small><b>'+esc(nickname)+'</b></div></button><div class="game-hud-actions"><button class="game-money" onclick="autoBankHome()"><small>КАПИТАЛ</small><b>'+balance()+'</b></button><button class="game-icon-button" onclick="notificationCenter()" aria-label="Уведомления">'+icon('bell')+(unread()?'<em>'+unread()+'</em>':'')+'</button><button class="game-icon-button" onclick="quickSettings()" aria-label="Настройки">'+icon('settings')+'</button></div></header>'+
      '<section class="game-showroom"><div class="game-showroom-city">'+icon('map')+' '+esc(state.city)+' · '+esc(date())+'</div><div class="game-car-copy"><small>МОЙ АВТОБИЗНЕС</small><h1>'+esc(carTitle)+'</h1><p>'+esc(carMeta)+'</p></div><div class="game-reputation"><span><b>'+rep+'</b> репутация</span><i><b style="width:'+progress+'%"></b></i><small>До следующего уровня</small></div></section>'+
      '<button class="game-mission os-plan" onclick="window.autoFlipNextAction?autoFlipNextAction():market()"><span class="game-mission-mark">'+icon('spark')+'</span><span class="game-mission-copy"><small>СЛЕДУЮЩИЙ ХОД</small><b>'+esc(next.title)+'</b><em>'+esc(next.detail)+'</em></span><strong>Играть</strong></button>'+
      '<section class="game-section"><div class="game-section-title"><div><small>СЕЙЧАС В ИГРЕ</small><b>Важное для бизнеса</b></div><button onclick="gameMenu()">Все разделы</button></div><div class="game-event-row">'+
        '<button class="game-event market" onclick="autoFavorites()"><span>'+icon('car')+'</span><small>ИЗБРАННОЕ</small><b>'+favorites+' авто</b><em>Следи за ценами</em></button>'+
        '<button class="game-event garage" onclick="openGameTab(\'garage\')"><span>'+icon('garage')+'</span><small>ГАРАЖ</small><b>'+count+' из '+capacity+'</b><em>Машины и задания</em></button>'+
        '<button class="game-event plate" onclick="openPlatesApp()"><span>'+icon('plate')+'</span><small>КОЛЛЕКЦИЯ</small><b>'+plates+' номеров</b><em>Редкие серии</em></button>'+
      '</div></section>'+
      '<section class="game-quick"><button onclick="autoBankHome()">'+icon('bank')+'<span><b>Банк</b><small>Кредиты</small></span></button><button onclick="economyHub()">'+icon('briefcase')+'<span><b>Бизнес</b><small>Цели</small></span></button><button onclick="gamesApp()">'+icon('game')+'<span><b>Мини-игры</b><small>Отдохнуть</small></span></button><button onclick="gameMenu()">'+icon('settings')+'<span><b>Ещё</b><small>Все разделы</small></span></button></section>'+
    '</div>');
  };
  function toggle(key,label,detail){const on=prefs()[key];return '<button class="os-setting-row" role="switch" aria-checked="'+on+'" onclick="setAppearance(\''+key+'\','+!on+')"><span><b>'+label+'</b><small>'+detail+'</small></span><i class="os-switch '+(on?'on':'')+'"></i></button>';}
  function customWallpaperCard(p){
    const preview=p.customWallpaper?' style="background-image:linear-gradient(180deg,#07132120,#07132170),url(\''+p.customWallpaper+'\')"':'';
    return '<label class="os-custom-wallpaper '+(p.wallpaper==='custom'?'selected':'')+'"><span'+preview+'>'+(p.customWallpaper?'✓':'＋')+'</span><b>'+(p.customWallpaper?'Свои обои':'Выбрать своё фото')+'</b><small>Фото уменьшится и сохранится вместе с прогрессом</small><input type="file" accept="image/*" onchange="uploadCustomWallpaper(this)" hidden></label>'+(p.customWallpaper?'<button class="os-remove-wallpaper" onclick="clearCustomWallpaper()">Удалить свои обои</button>':'');
  }
  window.settings=function(){const p=prefs(),account=window.AUTOFLIP_ACCOUNT||{};apply();render('<div class="app os-settings">'+head('Настройки')+'<div class="os-section-intro"><small>СДЕЛАЙ ЕГО СВОИМ</small><h2>Твой AutoFlip.</h2><p>Аккаунт, оформление и сохранения в одном месте.</p></div><h3 class="os-section-label">Аккаунт</h3><button class="os-account-row" onclick="openAccountProfile()"><span class="os-account-avatar">'+esc(String(account.nickname||'?').slice(0,1).toUpperCase())+'</span><span><b>'+esc(account.nickname||'Профиль аккаунта')+'</b><small>'+(account.id?'ID '+esc(account.id):'Никнейм, ID и данные входа')+'</small></span><i>›</i></button><h3 class="os-section-label">Обои</h3>'+customWallpaperCard(p)+'<div class="os-wall-grid">'+Object.keys(wallpapers).map(k=>'<button class="os-wall-choice '+(p.wallpaper===k?'selected':'')+'" aria-pressed="'+(p.wallpaper===k)+'" onclick="setAppearance(\'wallpaper\',\''+k+'\')"><span style="background:'+wallpapers[k][1]+'">'+(p.wallpaper===k?'✓':'')+'</span><small>'+wallpapers[k][0]+'</small></button>').join('')+'</div><h3 class="os-section-label">Оформление</h3><div class="os-segment">'+[['dark','Тёмное'],['light','Светлое']].map(a=>'<button class="'+(p.theme===a[0]?'selected':'')+'" aria-pressed="'+(p.theme===a[0])+'" onclick="setAppearance(\'theme\',\''+a[0]+'\')">'+a[1]+'</button>').join('')+'</div><div class="os-accent-row"><span>Цвет акцента</span>'+Object.keys(accents).map((k,i)=>'<button style="--swatch:'+accents[k]+'" aria-label="'+['Мятный','Голубой','Сиреневый','Персиковый'][i]+'" aria-pressed="'+(p.accent===k)+'" onclick="setAppearance(\'accent\',\''+k+'\')">'+(p.accent===k?'✓':'')+'</button>').join('')+'</div><h3 class="os-section-label">Удобство</h3>'+toggle('widgets','Виджеты','Капитал и гараж на главном экране')+toggle('privateBalance','Скрыть баланс','На главном экране и в сводке')+toggle('motion','Анимации','Плавные переходы между экранами')+'<button class="os-setting-row" role="switch" aria-checked="'+!!state.sound+'" onclick="toggleSound();settings()"><span><b>Звуки интерфейса</b><small>Отклик при открытии приложений</small></span><i class="os-switch '+(state.sound?'on':'')+'"></i></button><h3 class="os-section-label">Данные</h3><button class="os-setting-row" onclick="openSaveCenter()"><span><b>Сохранения и резервные копии</b><small>Облако, восстановление и журнал операций</small></span><i>›</i></button><div class="os-save-note">'+icon('lock')+'<span>Прогресс автоматически сохраняется в защищённом облаке.<br>При потере связи остаётся резервная копия на устройстве.</span></div><p class="os-version">AUTOFLIP · Интерфейс 5.0</p><button class="action green" onclick="home()">Посмотреть главный экран</button></div>');};
  window.quickSettings=function(){const p=prefs();render('<div class="app os-settings">'+head('Пункт управления')+'<div class="os-section-intro"><small>ВСЁ ПОД РУКОЙ</small><h2>Быстрые действия</h2></div><div class="os-quick-grid">'+[['sound','volume','Звуки',state.sound],['theme','sun','Светлая тема',p.theme==='light'],['privateBalance','eye','Скрыть баланс',p.privateBalance]].map(a=>'<button aria-pressed="'+!!a[3]+'" class="'+(a[3]?'selected':'')+'" onclick="toggleQuickSetting(\''+a[0]+'\')">'+icon(a[1])+'<b>'+a[2]+'</b><small>'+(a[3]?'Включено':'Выключено')+'</small></button>').join('')+'<button onclick="lockScreen()">'+icon('lock')+'<b>Блокировка</b><small>Экран ожидания</small></button></div><button class="action green" onclick="settings()">Обои и все настройки ↗</button><button class="action" onclick="notificationCenter()">Открыть уведомления</button></div>');};
  window.lockScreen=function(){apply();render('<button class="os-lockscreen" onclick="home()" aria-label="Разблокировать телефон">'+status()+'<span class="os-lock-mark">'+icon('lock')+'</span><small data-os-date>'+esc(date())+'</small><strong data-os-time>'+time()+'</strong><span class="os-lock-message">Новые возможности ждут.<br>Твой следующий ход — за тобой.</span><span class="os-unlock">Нажми, чтобы разблокировать ↑</span></button>');};
  const oldBottomNav=window.mountAutoBottomNav;
  if(typeof oldBottomNav==='function')window.mountAutoBottomNav=function(){window.mountGameNav('market');};
  // Update only the clock nodes; never replace a form while the player is typing.
  (typeof startVisibleInterval==='function'?startVisibleInterval:function(fn,delay){return setInterval(fn,delay);})(function(){if(window.AUTOFLIP_UPDATE_NEXT_ACTION)window.AUTOFLIP_UPDATE_NEXT_ACTION();document.querySelectorAll('[data-os-time]').forEach(el=>el.textContent=time());document.querySelectorAll('[data-os-date]').forEach(el=>el.textContent=date());},1000);
  apply();home();
  const revealModernInterface=function(){
    const root=document.documentElement,screen=document.getElementById('screen');
    if(root&&root.classList)root.classList.remove('autoflip-booting');
    if(screen&&screen.removeAttribute)screen.removeAttribute('aria-busy');
  };
  if(typeof setTimeout==='function')setTimeout(revealModernInterface,120);else revealModernInterface();
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
