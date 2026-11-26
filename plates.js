// AutoFlip Plates — collectible registration numbers, case rolls and resale.
(function(){
  'use strict';
  const LETTERS='АВЕКМНОРСТУХ'.split('');
  const RARITIES={
    ordinary:{title:'Обычный',value:1000,description:'Разные буквы и цифры'},
    unusual:{title:'Необычный',value:5000,description:'Парные буквы или цифры'},
    rare:{title:'Редкий',value:20000,description:'Сочетания, зеркальные мотивы'},
    ultra:{title:'Сверхредкий',value:100000,description:'Зеркалка или серия гос-уровня'},
    secret:{title:'Тайный',value:500000,description:'Сильная связка символов'},
    priceless:{title:'Бесценный',value:10000000,description:'Один из пяти номеров серии 777'}
  };
  const CASES=[
    {id:'standard',name:'Обычный кейс',price:3000,level:1,weights:[['ordinary',70],['unusual',25],['rare',5]]},
    {id:'rare',name:'Редкий кейс',price:10000,level:3,weights:[['ordinary',45],['unusual',38],['rare',14],['ultra',3]]},
    {id:'secret',name:'Тайный кейс',price:30000,level:6,weights:[['ordinary',25],['unusual',38],['rare',27],['ultra',9],['secret',1]]},
    {id:'collector',name:'Коллекционный кейс',price:70000,level:8,weights:[['ordinary',10],['unusual',30],['rare',35],['ultra',20],['secret',5]]},
    {id:'legend',name:'Легендарный кейс',price:150000,level:10,weights:[['ordinary',5],['unusual',20],['rare',35],['ultra',28],['secret',11.9],['priceless',.1]]}
  ];
  const REGIONS=(window.AUTOFLIP_WORLD&&window.AUTOFLIP_WORLD.cities||[]).flatMap(function(city){return city.regions.map(function(code){return [code,city.name,'Россия'];});});
  const PRICELESS=['А777МР','Е777КХ','А777АА','В777ОР','О777ОО'];
  function rnd(n){return Math.floor(Math.random()*n);}
  function pick(a){return a[rnd(a.length)];}
  function letter(except){let value=pick(LETTERS);while(except&&except.indexOf(value)>=0)value=pick(LETTERS);return value;}
  function region(){let r=pick(REGIONS);return {code:r[0],city:r[1],country:r[2]};}
  function digitsNoPair(){let s='';while(new Set(s).size<3||s[0]===s[2])s=''+rnd(10)+rnd(10)+rnd(10);return s;}
  function ensure(){
    // The game declares `let state`: it is shared across scripts, not on window.
    if(typeof state==='undefined'||!state)throw new Error('Игровое состояние ещё не загружено');
    if(!state.plates||typeof state.plates!=='object')state.plates={items:[],nextId:1};
    if(!Array.isArray(state.plates.items))state.plates.items=[];
    if(!Array.isArray(state.plates.appliedOpeningIds))state.plates.appliedOpeningIds=[];
    if(!Array.isArray(state.plates.pendingOpeningIds))state.plates.pendingOpeningIds=[];
    if(!Array.isArray(state.plates.caseRewards))state.plates.caseRewards=[];
    state.plates.appliedOpeningIds=state.plates.appliedOpeningIds.slice(-300);
    state.plates.pendingOpeningIds=state.plates.pendingOpeningIds.slice(-10);
    const allowed=new Set(REGIONS.map(function(r){return r[0];}));
    state.plates.items.forEach(function(p,index){if(!p)return;if(p.number)p.number=String(p.number).toUpperCase();if(!p.region||!allowed.has(String(p.region.code))){let r=REGIONS[index%REGIONS.length];p.region={code:r[0],city:r[1],country:r[2]};}});
    if(!Number.isFinite(Number(state.plates.nextId)))state.plates.nextId=1;
    return state.plates;
  }
  function formatMoney(v){return typeof money==='function'?money(v):Number(v).toLocaleString('ru-RU')+' ₽';}
  function persistPlates(){if(typeof persist==='function')persist();else if(typeof save==='function')save();}
  function currentGarageLevel(){return Math.max(1,Number(state.garageLevel||1));}
  function plateBase(rarity){
    let a,b,c,d;
    if(rarity==='ordinary'){
      a=letter();b=letter([a]);c=letter([a,b]);return {number:a+digitsNoPair()+b+c};
    }
    if(rarity==='unusual'){
      if(Math.random()<.5){a=letter();b=letter([a]);return {number:a+pick(['001','112','223','334','445','556','667','778','889'])+b+letter([a,b])};}
      a=letter();b=letter([a]);return {number:a+digitsNoPair()+b+b};
    }
    if(rarity==='rare'){
      const pair=pick(['00','11','22','33','44','55','66','77','88','99']);
      if(Math.random()<.55){a=letter();b=letter([a]);return {number:a+pair+rnd(10)+b+b};}
      a=letter();b=letter([a]);return {number:a+pick([pair+rnd(10),rnd(10)+pair])+b+a};
    }
    if(rarity==='ultra'){
      if(Math.random()<.62){a=pick(['А','Е']);return {number:a+pick(['013','070','101','114','202','303'])+(a==='Е'?'КХ':'МР')};}
      a=letter();b=letter([a]);return {number:a+pick(['010','020','030','040','050','060','070','080','090'])+b+a};
    }
    if(rarity==='secret'){
      const d=pick(['111','222','333','444','555','666','888','999']);
      if(Math.random()<.55){a=pick(['А','Е']);return {number:a+d+(a==='Е'?'КХ':'МР')};}
      a=letter();return {number:a+d+a+a};
    }
    return {number:pick(PRICELESS)};
  }
  function makePlate(rarity){
    const base=plateBase(rarity),r=base.region||region();
    return {id:'plate-'+Date.now()+'-'+rnd(1000000),number:String(base.number).toUpperCase(),region:r,rarity:rarity,value:RARITIES[rarity].value,createdAt:Date.now(),attachedCarId:null};
  }
  function rollPlateRarity(weights,randomValue){
    const roll=(typeof randomValue==='number'?randomValue:Math.random())*100;let edge=0;
    for(let i=0;i<weights.length;i++){edge+=Number(weights[i][1]);if(roll<edge)return weights[i][0];}
    return weights[weights.length-1][0];
  }
  function escape(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  let albumFilter='all';
  let activeTab='cases',filter='all',sort='new',opening=null,lastCase='standard',notice='';
  let openingBusy=false,reconcilingOpenings=false;
  async function openingRequest(body){
    const response=await fetch('/api/plates/open',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify(body)}),payload=await response.json().catch(function(){return {};});
    if(!response.ok||!payload.ok)throw new Error(payload.error||'Сервер не подтвердил открытие кейса');return payload;
  }
  async function reconcilePlateOpenings(){
    if(reconcilingOpenings)return false;const collection=ensure(),ids=collection.pendingOpeningIds.slice();if(!ids.length)return true;reconcilingOpenings=true;
    try{
      if(typeof window.AUTOFLIP_CLOUD_FLUSH==='function'){const saved=await window.AUTOFLIP_CLOUD_FLUSH();if(saved===false)return false;}
      for(const id of ids){await openingRequest({openingId:id,phase:'commit',clientId:window.AUTOFLIP_CLOUD_CLIENT_ID||'device-legacy-client'});collection.pendingOpeningIds=collection.pendingOpeningIds.filter(function(value){return value!==id;});}
      persistPlates();return true;
    }catch(_){return false;}finally{reconcilingOpenings=false;}
  }
  window.AUTOFLIP_RECONCILE_PLATE_OPENINGS=reconcilePlateOpenings;
  function plateFace(p,large){
    const countries={Россия:['RUS','🇷🇺'],Беларусь:['BY','🇧🇾'],Казахстан:['KZ','🇰🇿'],Узбекистан:['UZ','🇺🇿'],Кыргызстан:['KG','🇰🇬'],Таджикистан:['TJ','🇹🇯'],Армения:['AM','🇦🇲'],Азербайджан:['AZ','🇦🇿'],Молдова:['MD','🇲🇩']},country=countries[p.region.country]||['',''];
    const normalized=String(p.number).toUpperCase(),match=normalized.match(/^([^\d])(\d{3})([^\d]{2})$/),number=match?'<em>'+escape(match[1])+'</em><strong>'+match[2]+'</strong><em>'+escape(match[3])+'</em>':'<strong>'+escape(normalized)+'</strong>';
    return '<div class="plate-face plate-'+p.rarity+(large?' large':'')+'"><span class="plate-main">'+number+'</span><span class="plate-region"><i>'+escape(p.region.code)+'</i><small>'+country[0]+' <em>'+country[1]+'</em></small></span><u aria-hidden="true"></u><u aria-hidden="true"></u></div>';
  }
  function fullPlateText(p){return String(p.number).toUpperCase()+' '+String(p.region.code).toUpperCase();}
  function chanceText(c){return c.weights.map(function(w){return RARITIES[w[0]].title+' '+String(w[1]).replace('.',',')+'%';}).join(' · ');}
  function caseRewards(caseId){return ensure().caseRewards.filter(function(item){return item&&item.caseId===caseId&&item.key;});}
  function caseCard(c){
    const rewards=caseRewards(c.id),free=rewards.length>0,locked=!free&&currentGarageLevel()<c.level,canPay=Number(state.money||0)>=c.price;
    const tier=c.weights[c.weights.length-1][0];
    return '<article class="case-card crate-'+c.id+' '+tier+(free?' reward-case':'')+'"><div class="case-top"><span class="crate-art" aria-hidden="true"><i></i></span><div><small>'+(free?'🎁 НАГРАДА AUTOPASS · '+rewards.length:locked?'🔒 ГАРАЖ · УРОВЕНЬ '+c.level:'ДОСТУПЕН СЕЙЧАС')+'</small><h3>'+c.name+'</h3><span class="rarity '+tier+'">До «'+RARITIES[tier].title+'»</span></div></div><details class="case-odds"><summary>Шансы выпадения <span>⌄</span></summary>'+c.weights.map(w=>'<div><span class="rarity '+w[0]+'">'+RARITIES[w[0]].title+'</span><b>'+String(w[1]).replace('.',',')+'%</b><meter min="0" max="100" value="'+w[1]+'">'+w[1]+'%</meter></div>').join('')+'</details><div class="case-bottom"><div><small>'+(free?'Награда AutoPass':'Стоимость кейса')+'</small><b>'+(free?'Бесплатно':formatMoney(c.price))+'</b></div><button class="plate-open" '+(!free&&(locked||!canPay)?'disabled':'')+' onclick="openPlateCase(\''+c.id+'\')">'+(free?'Открыть бесплатно':locked?'Уровень '+c.level:canPay?'Открыть':'Не хватает денег')+'</button></div>'+(locked?'<small class="case-hint">Повысь уровень в разделе «Гараж → Развитие».</small>':!free&&!canPay?'<small class="case-hint">Нужно ещё '+formatMoney(c.price-Number(state.money||0))+'</small>':'')+'</article>';
  }
  function inventoryCard(p){const locked=p.tradable===false;return '<article class="plate-item"><div class="plate-item-top"><span class="rarity '+p.rarity+'">'+RARITIES[p.rarity].title+'</span><button class="plate-star" aria-label="'+(p.favorite?'Убрать из избранного':'В избранное')+'" aria-pressed="'+!!p.favorite+'" onclick="favoritePlate(\''+p.id+'\')">'+(p.favorite?'★':'☆')+'</button></div>'+plateFace(p,true)+'<div class="plate-info"><b>'+escape(p.region.city)+'</b><span>'+escape(p.region.country)+'</span></div><div class="plate-value"><b>'+(locked?'Премиальный':formatMoney(p.value))+'</b>'+(locked?'<button disabled>Не продаётся</button>':'<button onclick="confirmPlateSale(\''+p.id+'\')">Продать</button>')+'</div></article>';}
  function tabs(items){
    const labels={cases:'Кейсы',collection:'Коллекция',album:'Альбом'};
    return '<nav class="plate-tabs" aria-label="Разделы номеров">'+Object.entries(labels).map(([key,label])=>
      `<button type="button" class="${activeTab===key?'active':''}" aria-pressed="${activeTab===key}" onclick="setPlateTab('${key}')">${label}</button>`
    ).join('')+'</nav>';
  }
  function albumView(items){
    const byCode=new Map();
    for(const p of items){
      const code=String(p.region.code);
      if(!byCode.has(code))byCode.set(code,[]);
      byCode.get(code).push(p);
    }
    const cities=window.AUTOFLIP_WORLD.cities;
    let complete=0;
    const rows=cities.map(city=>{
      const owned=city.regions.filter(code=>byCode.has(code));
      const finished=owned.length===city.regions.length;
      if(finished)complete++;
      if(albumFilter==='complete'&&!finished)return '';
      if(albumFilter==='started'&&(!owned.length||finished))return '';
      const stamps=city.regions.map(code=>`<i class="${byCode.has(code)?'owned':''}">${escape(code)}</i>`).join('');
      const codes=city.regions.map(code=>{
        const plates=byCode.get(code)||[];
        const numbers=plates.map(p=>escape(p.number)).join(' · ');
        return `<li><b>${escape(code)}</b><span>${numbers||'Ещё предстоит найти'}</span></li>`;
      }).join('');
      return `<details class="album-city" data-complete="${owned.length===city.regions.length}"><summary><strong>${escape(city.name)}</strong><span>${owned.length} / ${city.regions.length}</span><div class="city-stamps" aria-hidden="true">${stamps}</div></summary><ul>${codes}</ul></details>`;
    }).join('');
    const modes=[['all','Все города'],['started','В процессе'],['complete','Собраны']];
    const controls=modes.map(([key,label])=>`<button aria-pressed="${albumFilter===key}" onclick="setAlbumFilter('${key}')">${label}</button>`).join('');
    return `<section class="region-album"><div class="album-overview"><h3>Альбом регионов</h3><p>Открой город, чтобы посмотреть номера и найти недостающий код.</p><strong>Коды в коллекции · ${byCode.size} / ${REGIONS.length}</strong><progress aria-label="Коды в коллекции" value="${byCode.size}" max="${REGIONS.length}"></progress><span>Города в сборе · ${complete} / ${cities.length}</span></div><div class="album-modes">${controls}</div>${rows||'<p class="album-empty">Здесь пока нет городов. Все доступные коды есть в разделе «Все города».</p>'}</section>`;
  }
  window.setAlbumFilter=function(key){
    albumFilter=['started','complete'].includes(key)?key:'all';
    renderPlates();
  };
  function dashboard(items,total){
    const favorite=items.find(p=>p.favorite);
    const exhibit=favorite||items.reduce((best,p)=>!best||p.value>best.value?p:best,null);
    const showcase=exhibit?
      `<div class="plate-exhibit"><small>${favorite?'Из избранного':'Самый ценный номер'}</small>${plateFace(exhibit,true)}<span>${escape(exhibit.region.city)} · ${RARITIES[exhibit.rarity].title}</span></div>`:
      '<p>Открой первый кейс, чтобы выставить номер на витрину.</p>';
    return `<section class="plate-gallery"><h2>Витрина номеров</h2>${showcase}<div class="gallery-totals"><span>В коллекции <b>${items.length}</b></span><span>Стоимость <b>${formatMoney(total)}</b></span></div></section>`;
  }
  function collectionView(items){
    let shown=items.filter(p=>filter==='favorites'?p.favorite:filter==='all'||p.rarity===filter);
    shown=shown.slice().sort((a,b)=>sort==='value'?Number(b.value)-Number(a.value):Number(b.createdAt)-Number(a.createdAt));
    const filters=[['all','Все'],['favorites','Избранные'],['ordinary','Обычные'],['unusual','Необычные'],['rare','Редкие'],['ultra','Сверхредкие'],['secret','Тайные'],['priceless','Бесценные']];
    return  '<div class="collection-tools plate-selectors"><label>Показать<select onchange="setPlateFilter(this.value)">'+filters.map(([key,label])=>'<option value="'+key+'" '+(key===filter?'selected':'')+'>'+label+'</option>').join('')+'</select></label><label>Сортировка <select onchange="setPlateSort(this.value)"><option value="new" '+(sort==='new'?'selected':'')+'>Сначала новые</option><option value="value" '+(sort==='value'?'selected':'')+'>Сначала дорогие</option></select></label></div>'+(shown.length?'<div class="plate-list">'+shown.map(inventoryCard).join('')+'</div>':'<div class="plates-empty"><span>▱</span><b>'+(items.length?'Здесь пока пусто':'Начни коллекцию')+'</b><p>'+(items.length?'Измени фильтр, чтобы увидеть другие номера.':'Открой доступный кейс — новый номер сохранится здесь.')+'</p><button onclick="setPlateTab(\'cases\')">Перейти к кейсам</button></div>');
  }
  function casesView(){return '<div class="plate-intro"><div><small>5 КЕЙСОВ</small><h3>Каталог кейсов</h3></div><span>Гараж · ур. '+currentGarageLevel()+'</span></div><div class="case-list">'+CASES.map(caseCard).join('')+'</div>';}
  function saleSheet(items){if(!opening||opening.type!=='sale')return '';const p=items.find(x=>x.id===opening.id);if(!p)return '';return '<div class="plate-sheet-backdrop"><section class="plate-sheet"><i></i><small>ПРОДАЖА НОМЕРА</small>'+plateFace(p,true)+'<p>'+RARITIES[p.rarity].title+' · '+escape(p.region.city)+'</p><h3>'+formatMoney(p.value)+'</h3><button class="action green" onclick="sellPlate(\''+p.id+'\')">Продать номер</button><button class="action" onclick="cancelPlateSale()">Отмена</button></section></div>';}
  function renderPlates(){
    const collection=ensure(),items=collection.items,total=items.reduce(function(sum,p){return sum+Number(p.value||0);},0),title=typeof head==='function'?head('Номера'):'';
    const toast=notice?'<div class="plate-toast">✓ '+escape(notice)+'</div>':'';notice='';
    render('<div class="app plates-app">'+title+dashboard(items,total)+tabs(items)+'<main class="plate-content">'+(activeTab==='album'?albumView(items):activeTab==='collection'?collectionView(items):casesView())+'</main>'+toast+saleSheet(items)+'</div>');
  }
  function openingScreen(c,p,phase){
    const reveal=phase==='reveal',rolling=phase==='rolling';
    const freeCount=caseRewards(c.id).length,canRepeat=freeCount>0||Number(state.money||0)>=c.price;
    let discovery='';
    if(reveal){
      const count=ensure().items.filter(item=>String(item.region.code)===String(p.region.code)).length;
      discovery=count===1?'Первый номер с этим кодом':'Номеров с этим кодом: '+count;
    }
    const samples=['Т462ВР 77','Р684УО 78','Е213ТТ 43','А338КК 16','Н303ВВ 52','А070ВА 66','Е114КХ 97','Т333ТТ 23','В444ВВ 61','О554РО 02'];
    const reel='<div class="number-reel"><i></i><div class="reel-track">'+samples.map(x=>'<span>'+x+'</span>').join('')+'<span class="winning-number">'+escape(fullPlateText(p))+'</span></div></div>';
    const process='<small>'+(rolling?'КЕЙС ОТКРЫТ':'ОТКРЫВАЕМ КЕЙС')+'</small><div class="case-machine '+(rolling?'is-open':'')+' '+p.rarity+'"><div class="case-lid">AUTOFLIP</div><div class="case-core">✦</div><div class="case-base"></div></div>'+(rolling?reel:'<div class="opening-progress"><i></i></div>')+'<h2>'+(rolling?'Ищем твой номер':c.name)+'</h2><p>'+(rolling?'Лента замедляется…':'Снимаем защиту и открываем замки…')+'</p><button class="skip-opening" onclick="revealPlateOpening()">Пропустить анимацию</button>';
    render('<div class="app plates-app opening-screen '+(reveal?'is-revealed':rolling?'is-rolling':'is-opening')+'"><button class="opening-close" onclick="finishPlateOpening()" aria-label="Закрыть">×</button><section class="opening-stage"><div class="opening-glow"></div>'+(reveal?'<small>НОВЫЙ НОМЕР</small><div class="reveal-rarity '+p.rarity+'">'+RARITIES[p.rarity].title+'</div>'+plateFace(p,true)+'<h2>'+formatMoney(p.value)+'</h2><p>'+escape(p.region.city)+' · '+escape(p.region.country)+'</p><p class="album-discovery">'+discovery+'</p><div class="opening-actions"><button class="action green" onclick="finishPlateOpening()">В коллекцию</button><button class="action" '+(canRepeat?'':'disabled')+' onclick="openPlateCase(\''+c.id+'\')">'+(freeCount?'Открыть ещё бесплатно':canRepeat?'Открыть ещё · '+formatMoney(c.price):'Недостаточно денег')+'</button></div>':process)+'</section></div>');
  }
  function clearOpeningTimers(){if(!opening)return;if(opening.timer&&typeof clearTimeout==='function')clearTimeout(opening.timer);if(opening.revealTimer&&typeof clearTimeout==='function')clearTimeout(opening.revealTimer);}
  window.plates=function(){opening=null;renderPlates();};
  window.setPlateTab=function(tab){activeTab=['album','collection'].includes(tab)?tab:'cases';opening=null;renderPlates();};
  window.setPlateFilter=function(value){filter=value;renderPlates();};
  window.setPlateSort=function(value){sort=value==='value'?'value':'new';renderPlates();};
  window.favoritePlate=function(id){const p=ensure().items.find(x=>x.id===id);if(!p)return;p.favorite=!p.favorite;persistPlates();renderPlates();};
  window.confirmPlateSale=function(id){const p=ensure().items.find(x=>x.id===id);if(!p||p.tradable===false)return;opening={type:'sale',id:id};renderPlates();};
  window.cancelPlateSale=function(){opening=null;renderPlates();};
  window.openPlateCase=async function(id){
    const c=CASES.filter(function(x){return x.id===id;})[0];if(!c)return;
    if(openingBusy)return;
    const reward=caseRewards(c.id)[0]||null;
    if(!reward&&currentGarageLevel()<c.level){alert('Этот кейс откроется на '+c.level+' уровне. Выполняй задания в разделе «Гараж → Развитие».');return;}
    if(!reward&&Number(state.money||0)<c.price){alert('Недостаточно денег для открытия кейса. Нужно '+formatMoney(c.price)+'.');return;}
    openingBusy=true;let applied=false;
    try{
      // A temporary cloud-sync delay must not block a case opening. The local
      // save is already committed before the server roll, and pending cloud
      // work is reconciled by the normal save queue afterwards.
      persistPlates();
      if(typeof window.AUTOFLIP_CLOUD_FLUSH==='function'){
        Promise.resolve(window.AUTOFLIP_CLOUD_FLUSH()).catch(function(){return false;});
      }
      const openingId='case:'+c.id+':'+Date.now().toString(36)+':'+Math.random().toString(36).slice(2,10),clientId=window.AUTOFLIP_CLOUD_CLIENT_ID||'device-legacy-client';
      const result=await openingRequest({openingId:openingId,caseId:c.id,phase:'prepare',clientId:clientId,rewardKey:reward&&reward.key});
      if(result.committed){location.reload();return;}
      const p=result.plate,collection=ensure();clearOpeningTimers();lastCase=c.id;
      state.money=Number(state.money||0)-Number(result.price);collection.items.unshift(p);collection.nextId=Number(collection.nextId||1)+1;collection.appliedOpeningIds.push(openingId);collection.pendingOpeningIds.push(openingId);if(reward)collection.caseRewards=collection.caseRewards.filter(function(item){return item&&item.key!==reward.key;});applied=true;persistPlates();
      if(typeof pushPhoneNotification==='function')pushPhoneNotification('Номера','✦','Открыт '+c.name+': '+RARITIES[p.rarity].title+' номер.','plates','plate-'+p.id);
      opening={type:'case',caseId:c.id,plateId:p.id};openingScreen(c,p,'opening');
      if(typeof setTimeout==='function')opening.timer=setTimeout(function(){startPlateRoll();},1200);else revealPlateOpening();
      await reconcilePlateOpenings();
    }catch(error){if(!applied)alert('Кейс не открыт: '+error.message+'. Деньги не списаны.');}
    finally{openingBusy=false;}
  };
  window.startPlateRoll=function(){if(!opening||opening.type!=='case')return;const c=CASES.find(x=>x.id===opening.caseId),p=ensure().items.find(x=>x.id===opening.plateId);if(!c||!p)return plates();openingScreen(c,p,'rolling');if(typeof setTimeout==='function')opening.revealTimer=setTimeout(function(){revealPlateOpening();},3600);else revealPlateOpening();};
  window.revealPlateOpening=function(){if(!opening||opening.type!=='case')return;clearOpeningTimers();const c=CASES.find(x=>x.id===opening.caseId),p=ensure().items.find(x=>x.id===opening.plateId);if(!c||!p)return plates();openingScreen(c,p,'reveal');};
  window.finishPlateOpening=function(){clearOpeningTimers();opening=null;activeTab='collection';filter='all';renderPlates();};
  window.sellPlate=function(id){
    const collection=ensure(),index=collection.items.findIndex(function(p){return p.id===id;});if(index<0)return;
    const p=collection.items[index];if(p.tradable===false)return;state.money=Number(state.money||0)+Number(p.value||0);collection.items.splice(index,1);opening=null;notice='Номер продан за '+formatMoney(p.value);persistPlates();
    if(typeof pushPhoneNotification==='function')pushPhoneNotification('Номера','₽','Продан номер '+p.number+' за '+formatMoney(p.value)+'.','plates','plate-sale-'+p.id);
    activeTab='collection';renderPlates();
  };
  window.plateSystem={rarities:RARITIES,cases:CASES,regions:REGIONS,makePlate:makePlate,rollPlateRarity:rollPlateRarity,currentGarageLevel:currentGarageLevel};
  if(typeof setTimeout==='function'&&ensure().pendingOpeningIds.length)setTimeout(function(){reconcilePlateOpenings();},4000);
})();
