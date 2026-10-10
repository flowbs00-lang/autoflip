// AutoFlip OS — presentation and personalisation. Economic rules remain in the game layers.
(function(){
  'use strict';
  const wallpapers={aurora:['Северное сияние','radial-gradient(ellipse at 90% 15%,#6479cb 0,transparent 52%),radial-gradient(ellipse at 0 80%,#256e70 0,transparent 65%),#14253b'],dusk:['Закат','radial-gradient(ellipse at 85% 20%,#e9ab8c 0,transparent 60%),radial-gradient(ellipse at 10% 90%,#643a81 0,transparent 65%),#9b667c'],ocean:['Океан','radial-gradient(ellipse at 10% 5%,#5299bc 0,transparent 65%),radial-gradient(ellipse at 90% 95%,#133849 0,transparent 60%),#256e85'],forest:['Хвойный лес','radial-gradient(ellipse at 90% 10%,#7e9c76 0,transparent 60%),radial-gradient(ellipse at 0 85%,#163d37 0,transparent 65%),#365e4b'],ink:['Графит','radial-gradient(ellipse at 95% 10%,#6a6d7e 0,transparent 60%),radial-gradient(ellipse at 0 95%,#171922 0,transparent 65%),#333643'],plum:['Ультрафиолет','radial-gradient(ellipse at 85% 15%,#bd82be 0,transparent 60%),radial-gradient(ellipse at 10% 95%,#373e96 0,transparent 65%),#664f92']};
  const accents={mint:'#79e2bc',blue:'#8ebcff',violet:'#c7adff',peach:'#ffbd9e'};
  const paths={car:'M3 15v-5l2-5h14l2 5v5M3 10h18M5 15v3m14-3v3M6 13h2m8 0h2',chat:'M4 4h16v12H9l-5 4V4',garage:'M3 10l9-7 9 7v11H3V10m4 11V11h10v10M7 15h10',bank:'M3 8l9-5 9 5H3m2 3v7m7-7v7m7-7v7M3 21h18',map:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5m6-2v16m6-14v16',home:'M3 11l9-8 9 8M5 9v12h14V9m-10 12v-8h6v8',phone:'M7 3l3 5-3 3a14 14 0 0 0 6 6l3-3 5 3-1 4C10 22 2 14 3 4l4-1',note:'M5 3h14v18H5V3m4 5h6m-6 4h6m-6 4h4',user:'M8 7a4 4 0 1 0 8 0 4 4 0 1 0-8 0M4 21v-2a8 8 0 0 1 16 0v2',news:'M4 3h16v18H4V3m4 4h8m-8 4h8m-8 4h3m3 0h2',game:'M8 7h8c5 0 6 13 3 13l-4-4H9l-4 4C2 20 3 7 8 7m0 3v5m-2-2h4m5-2h.1m2 3h.1',shop:'M4 8h16l-1 13H5L4 8m4 0a4 4 0 0 1 8 0',settings:'M4 6h16M4 12h16M4 18h16M8 3v6m8 0v6m-5 0v6',bell:'M5 17h14l-2-4V9A5 5 0 0 0 7 9v4l-2 4m5 3h4',search:'M10 3a7 7 0 1 0 0 14 7 7 0 1 0 0-14m5 12 6 6',arrow:'M14 5l-7 7 7 7',lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10m7 4v3',sun:'M8 12a4 4 0 1 0 8 0 4 4 0 1 0-8 0M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1 1m12 12 1 1M5 19l1-1M18 6l1-1',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7m7 0a3 3 0 1 0 6 0 3 3 0 1 0-6 0',volume:'M3 9h4l5-4v14l-5-4H3V9m13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16',spark:'M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7'};
  const apps=[['market','Автомаркет','car','mint'],['messages','Сообщения','chat','blue'],['openCommunity','Сообщество','spark','violet'],['garage','Гараж','garage','peach'],['openPlatesApp','Номера','note','violet'],['openStore','Магазин','shop','mint'],['autoBankHome','Банк','bank','violet'],['mapApp','Карта','map','mint'],['realty','Дом','home','peach'],['contacts','Контакты','phone','blue'],['notes','Заметки','note','yellow'],['profile','Профиль','user','violet'],['newsApp','Новости','news','peach'],['gamesApp','Игры','game','blue'],['settings','Настройки','settings','silver']];
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
  function icon(name){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="'+(paths[name]||paths.spark)+'"/></svg>';}
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
  window.home=function(){
    apply();const p=prefs(),count=(state.cars||[]).length;
    const capacity=typeof window.garageCapacity==='function'?window.garageCapacity():2;
    render('<div class="os-home">'+status()+'<div class="os-topline"><span>AUTOFLIP <b>OS</b></span><div class="os-top-actions"><button class="os-round" onclick="notificationCenter()" aria-label="Уведомления">'+icon('bell')+(unread()?'<em>'+unread()+'</em>':'')+'</button><button class="os-round" onclick="quickSettings()" aria-label="Быстрые настройки">'+icon('settings')+'</button><button class="os-round" onclick="lockScreen()" aria-label="Заблокировать">'+icon('lock')+'</button></div></div><section class="os-home-glance"><div class="os-clock"><small data-os-date>'+esc(date())+'</small><strong data-os-time>'+time()+'</strong><span>📍 '+esc(state.city)+'</span></div>'+(p.widgets?'<div class="os-mini-widgets"><button onclick="autoBankHome()"><small>КАПИТАЛ</small><b>'+balance()+'</b></button><button onclick="garage()"><small>ГАРАЖ</small><b>'+count+' / '+capacity+'</b></button></div>':'')+'</section><div class="os-app-grid">'+apps.map(appButton).join('')+'</div><div class="os-home-bottom"><div class="os-dock">'+[apps[8],apps[0],apps[1],apps[3]].map(appButton).join('')+'</div></div></div>');
  };
  function toggle(key,label,detail){const on=prefs()[key];return '<button class="os-setting-row" role="switch" aria-checked="'+on+'" onclick="setAppearance(\''+key+'\','+!on+')"><span><b>'+label+'</b><small>'+detail+'</small></span><i class="os-switch '+(on?'on':'')+'"></i></button>';}
  function customWallpaperCard(p){
    const preview=p.customWallpaper?' style="background-image:linear-gradient(180deg,#07132120,#07132170),url(\''+p.customWallpaper+'\')"':'';
    return '<label class="os-custom-wallpaper '+(p.wallpaper==='custom'?'selected':'')+'"><span'+preview+'>'+(p.customWallpaper?'✓':'＋')+'</span><b>'+(p.customWallpaper?'Свои обои':'Выбрать своё фото')+'</b><small>Фото уменьшится и сохранится вместе с прогрессом</small><input type="file" accept="image/*" onchange="uploadCustomWallpaper(this)" hidden></label>'+(p.customWallpaper?'<button class="os-remove-wallpaper" onclick="clearCustomWallpaper()">Удалить свои обои</button>':'');
  }
  window.settings=function(){const p=prefs();apply();render('<div class="app os-settings">'+head('Настройки')+'<div class="os-section-intro"><small>СДЕЛАЙ ЕГО СВОИМ</small><h2>Твой AutoFlip.</h2><p>Настроение меняется. Интерфейс тоже.</p></div><h3 class="os-section-label">Обои</h3>'+customWallpaperCard(p)+'<div class="os-wall-grid">'+Object.keys(wallpapers).map(k=>'<button class="os-wall-choice '+(p.wallpaper===k?'selected':'')+'" aria-pressed="'+(p.wallpaper===k)+'" onclick="setAppearance(\'wallpaper\',\''+k+'\')"><span style="background:'+wallpapers[k][1]+'">'+(p.wallpaper===k?'✓':'')+'</span><small>'+wallpapers[k][0]+'</small></button>').join('')+'</div><h3 class="os-section-label">Оформление</h3><div class="os-segment">'+[['dark','Тёмное'],['light','Светлое']].map(a=>'<button class="'+(p.theme===a[0]?'selected':'')+'" aria-pressed="'+(p.theme===a[0])+'" onclick="setAppearance(\'theme\',\''+a[0]+'\')">'+a[1]+'</button>').join('')+'</div><div class="os-accent-row"><span>Цвет акцента</span>'+Object.keys(accents).map((k,i)=>'<button style="--swatch:'+accents[k]+'" aria-label="'+['Мятный','Голубой','Сиреневый','Персиковый'][i]+'" aria-pressed="'+(p.accent===k)+'" onclick="setAppearance(\'accent\',\''+k+'\')">'+(p.accent===k?'✓':'')+'</button>').join('')+'</div><h3 class="os-section-label">Удобство</h3>'+toggle('widgets','Виджеты','Капитал и гараж на главном экране')+toggle('privateBalance','Скрыть баланс','На главном экране и в сводке')+toggle('motion','Анимации','Плавные переходы между экранами')+'<button class="os-setting-row" role="switch" aria-checked="'+!!state.sound+'" onclick="toggleSound();settings()"><span><b>Звуки интерфейса</b><small>Отклик при открытии приложений</small></span><i class="os-switch '+(state.sound?'on':'')+'"></i></button><h3 class="os-section-label">Данные</h3><button class="os-setting-row" onclick="openSaveCenter()"><span><b>Сохранения и резервные копии</b><small>Облако, восстановление и журнал операций</small></span><i>›</i></button><div class="os-save-note">'+icon('lock')+'<span>Прогресс автоматически сохраняется в защищённом облаке.<br>При потере связи остаётся резервная копия на устройстве.</span></div><p class="os-version">AUTOFLIP OS · Интерфейс 3.0</p><button class="action green" onclick="home()">Посмотреть главный экран ↗</button></div>');};
  window.quickSettings=function(){const p=prefs();render('<div class="app os-settings">'+head('Пункт управления')+'<div class="os-section-intro"><small>ВСЁ ПОД РУКОЙ</small><h2>Быстрые действия</h2></div><div class="os-quick-grid">'+[['sound','volume','Звуки',state.sound],['theme','sun','Светлая тема',p.theme==='light'],['privateBalance','eye','Скрыть баланс',p.privateBalance]].map(a=>'<button aria-pressed="'+!!a[3]+'" class="'+(a[3]?'selected':'')+'" onclick="toggleQuickSetting(\''+a[0]+'\')">'+icon(a[1])+'<b>'+a[2]+'</b><small>'+(a[3]?'Включено':'Выключено')+'</small></button>').join('')+'<button onclick="lockScreen()">'+icon('lock')+'<b>Блокировка</b><small>Экран ожидания</small></button></div><button class="action green" onclick="settings()">Обои и все настройки ↗</button><button class="action" onclick="notificationCenter()">Открыть уведомления</button></div>');};
  window.lockScreen=function(){apply();render('<button class="os-lockscreen" onclick="home()" aria-label="Разблокировать телефон">'+status()+'<span class="os-lock-mark">'+icon('lock')+'</span><small data-os-date>'+esc(date())+'</small><strong data-os-time>'+time()+'</strong><span class="os-lock-message">Новые возможности ждут.<br>Твой следующий ход — за тобой.</span><span class="os-unlock">Нажми, чтобы разблокировать ↑</span></button>');};
  const oldBottomNav=window.mountAutoBottomNav;
  if(typeof oldBottomNav==='function')window.mountAutoBottomNav=function(){
    oldBottomNav.apply(this,arguments);
    const names=['car',null,'chat','user'];
    document.querySelectorAll('#autoBottomNav .auto-tab-icon').forEach((el,i)=>{if(names[i])el.innerHTML=icon(names[i]);});
  };
  // Update only the clock nodes; never replace a form while the player is typing.
  (typeof startVisibleInterval==='function'?startVisibleInterval:function(fn,delay){return setInterval(fn,delay);})(function(){document.querySelectorAll('[data-os-time]').forEach(el=>el.textContent=time());document.querySelectorAll('[data-os-date]').forEach(el=>el.textContent=date());},1000);
  apply();home();
})();
