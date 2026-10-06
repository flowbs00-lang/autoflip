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
  const REGIONS=[
    ['01','Майкоп','Россия'],['02','Уфа','Россия'],['03','Улан-Удэ','Россия'],['04','Горно-Алтайск','Россия'],['05','Махачкала','Россия'],['06','Магас','Россия'],['07','Нальчик','Россия'],['08','Элиста','Россия'],['09','Черкесск','Россия'],['10','Петрозаводск','Россия'],
    ['11','Сыктывкар','Россия'],['12','Йошкар-Ола','Россия'],['13','Саранск','Россия'],['14','Якутск','Россия'],['15','Владикавказ','Россия'],['16','Казань','Россия'],['17','Кызыл','Россия'],['18','Ижевск','Россия'],['19','Абакан','Россия'],['20','Грозный','Россия'],
    ['21','Чебоксары','Россия'],['22','Барнаул','Россия'],['23','Краснодар','Россия'],['24','Красноярск','Россия'],['25','Владивосток','Россия'],['26','Ставрополь','Россия'],['27','Хабаровск','Россия'],['28','Благовещенск','Россия'],['29','Архангельск','Россия'],['30','Астрахань','Россия'],
    ['31','Белгород','Россия'],['32','Брянск','Россия'],['33','Владимир','Россия'],['34','Волгоград','Россия'],['35','Вологда','Россия'],['36','Воронеж','Россия'],['37','Иваново','Россия'],['38','Иркутск','Россия'],['39','Калининград','Россия'],['40','Калуга','Россия'],
    ['41','Петропавловск-Камчатский','Россия'],['42','Кемерово','Россия'],['43','Киров','Россия'],['44','Кострома','Россия'],['45','Курган','Россия'],['46','Курск','Россия'],['47','Гатчина','Россия'],['48','Липецк','Россия'],['49','Магадан','Россия'],['50','Красногорск','Россия'],
    ['51','Мурманск','Россия'],['52','Нижний Новгород','Россия'],['53','Великий Новгород','Россия'],['54','Новосибирск','Россия'],['55','Омск','Россия'],['56','Оренбург','Россия'],['57','Орёл','Россия'],['58','Пенза','Россия'],['59','Пермь','Россия'],['60','Псков','Россия'],
    ['61','Ростов-на-Дону','Россия'],['62','Рязань','Россия'],['63','Самара','Россия'],['64','Саратов','Россия'],['65','Южно-Сахалинск','Россия'],['66','Екатеринбург','Россия'],['67','Смоленск','Россия'],['68','Тамбов','Россия'],['69','Тверь','Россия'],['70','Томск','Россия'],
    ['71','Тула','Россия'],['72','Тюмень','Россия'],['73','Ульяновск','Россия'],['74','Челябинск','Россия'],['75','Чита','Россия'],['76','Ярославль','Россия'],['77','Москва','Россия'],['78','Санкт-Петербург','Россия'],['79','Биробиджан','Россия'],['80','Донецк','Россия'],
    ['81','Луганск','Россия'],['82','Симферополь','Россия'],['83','Нарьян-Мар','Россия'],['84','Херсон','Россия'],['85','Мелитополь','Россия'],['86','Ханты-Мансийск','Россия'],['87','Анадырь','Россия'],['89','Салехард','Россия'],['92','Севастополь','Россия'],['94','Байконур','Россия']
  ];
  const PRICELESS=[['А777МР','777'],['Е777КХ','777'],['А777АА','777'],['В777ОР','777'],['О777ОО','777']];
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
    state.plates.items.forEach(function(p){if(p&&p.number)p.number=String(p.number).toUpperCase();});
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
    const fixed=pick(PRICELESS);return {number:fixed[0],region:{code:fixed[1],city:'Москва',country:'Россия'}};
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
  let activeTab='cases',filter='all',sort='new',opening=null,lastCase='standard',notice='';
  function plateFace(p,large){
    const countries={Россия:['RUS','🇷🇺'],Беларусь:['BY','🇧🇾'],Казахстан:['KZ','🇰🇿'],Узбекистан:['UZ','🇺🇿'],Кыргызстан:['KG','🇰🇬'],Таджикистан:['TJ','🇹🇯'],Армения:['AM','🇦🇲'],Азербайджан:['AZ','🇦🇿'],Молдова:['MD','🇲🇩']},country=countries[p.region.country]||['',''];
    const normalized=String(p.number).toUpperCase(),match=normalized.match(/^([^\d])(\d{3})([^\d]{2})$/),number=match?'<em>'+escape(match[1])+'</em><strong>'+match[2]+'</strong><em>'+escape(match[3])+'</em>':'<strong>'+escape(normalized)+'</strong>';
    return '<div class="plate-face plate-'+p.rarity+(large?' large':'')+'"><span class="plate-main">'+number+'</span><span class="plate-region"><i>'+escape(p.region.code)+'</i><small>'+country[0]+' <em>'+country[1]+'</em></small></span><u aria-hidden="true"></u><u aria-hidden="true"></u></div>';
  }
  function fullPlateText(p){return String(p.number).toUpperCase()+' '+String(p.region.code).toUpperCase();}
  function chanceText(c){return c.weights.map(function(w){return RARITIES[w[0]].title+' '+String(w[1]).replace('.',',')+'%';}).join(' · ');}
  function caseCard(c){
    const locked=currentGarageLevel()<c.level,canPay=Number(state.money||0)>=c.price;
    const tier=c.weights[c.weights.length-1][0];
    return '<article class="case-card '+tier+'"><div class="case-top"><span class="case-orb" aria-hidden="true">▱<i>✦</i></span><div><small>'+(locked?'🔒 ГАРАЖ · УРОВЕНЬ '+c.level:'ДОСТУПЕН СЕЙЧАС')+'</small><h3>'+c.name+'</h3><span class="rarity '+tier+'">До «'+RARITIES[tier].title+'»</span></div></div><details class="case-odds"><summary>Шансы выпадения <span>⌄</span></summary>'+c.weights.map(w=>'<div><span class="rarity '+w[0]+'">'+RARITIES[w[0]].title+'</span><b>'+String(w[1]).replace('.',',')+'%</b><meter min="0" max="100" value="'+w[1]+'">'+w[1]+'%</meter></div>').join('')+'</details><div class="case-bottom"><div><small>Стоимость кейса</small><b>'+formatMoney(c.price)+'</b></div><button class="plate-open" '+(locked||!canPay?'disabled':'')+' onclick="openPlateCase(\''+c.id+'\')">'+(locked?'Уровень '+c.level:canPay?'Открыть ↗':'Не хватает денег')+'</button></div>'+(locked?'<small class="case-hint">Уровни гаража — в следующем обновлении.</small>':!canPay?'<small class="case-hint">Нужно ещё '+formatMoney(c.price-Number(state.money||0))+'</small>':'')+'</article>';
  }
  function inventoryCard(p){return '<article class="plate-item"><div class="plate-item-top"><span class="rarity '+p.rarity+'">'+RARITIES[p.rarity].title+'</span><button class="plate-star" aria-label="'+(p.favorite?'Убрать из избранного':'В избранное')+'" aria-pressed="'+!!p.favorite+'" onclick="favoritePlate(\''+p.id+'\')">'+(p.favorite?'★':'☆')+'</button></div>'+plateFace(p,true)+'<div class="plate-info"><b>'+escape(p.region.city)+'</b><span>'+escape(p.region.country)+'</span></div><div class="plate-value"><b>'+formatMoney(p.value)+'</b><button onclick="confirmPlateSale(\''+p.id+'\')">Продать</button></div></article>';}
  function tabs(items){return '<nav class="plate-tabs" aria-label="Разделы"><button class="'+(activeTab==='cases'?'active':'')+'" onclick="setPlateTab(\'cases\')">Кейсы</button><button class="'+(activeTab==='collection'?'active':'')+'" onclick="setPlateTab(\'collection\')">Коллекция <i>'+items.length+'</i></button></nav>';}
  function dashboard(items,total){return '<section class="plates-hero"><div><small>НОМЕРНОЙ ФОНД</small><h2>Твоя коллекция</h2><p>Открывай кейсы и собирай редкие сочетания.</p></div><div class="plates-stats"><span><small>НОМЕРОВ</small><b>'+items.length+'</b></span><span><small>ЦЕННОСТЬ</small><b>'+formatMoney(total)+'</b></span></div></section>';}
  function collectionView(items){
    let shown=items.filter(p=>filter==='favorites'?p.favorite:filter==='all'||p.rarity===filter);
    shown=shown.slice().sort((a,b)=>sort==='value'?Number(b.value)-Number(a.value):Number(b.createdAt)-Number(a.createdAt));
    const filters=[['all','Все'],['favorites','★'],['rare','Редкие'],['ultra','Сверхредкие'],['secret','Тайные'],['priceless','Бесценные']];
    return '<div class="collection-tools"><div class="plate-filters">'+filters.map(x=>'<button class="'+(filter===x[0]?'active':'')+'" onclick="setPlateFilter(\''+x[0]+'\')">'+x[1]+'</button>').join('')+'</div><label>Сортировка <select onchange="setPlateSort(this.value)"><option value="new" '+(sort==='new'?'selected':'')+'>Сначала новые</option><option value="value" '+(sort==='value'?'selected':'')+'>Сначала дорогие</option></select></label></div>'+(shown.length?'<div class="plate-list">'+shown.map(inventoryCard).join('')+'</div>':'<div class="plates-empty"><span>▱</span><b>'+(items.length?'Здесь пока пусто':'Начни коллекцию')+'</b><p>'+(items.length?'Измени фильтр, чтобы увидеть другие номера.':'Открой доступный кейс — новый номер сохранится здесь.')+'</p><button onclick="setPlateTab(\'cases\')">Перейти к кейсам</button></div>');
  }
  function casesView(){return '<div class="plate-intro"><div><small>5 КЕЙСОВ</small><h3>Выбери свой шанс</h3></div><span>Гараж · ур. '+currentGarageLevel()+'</span></div><div class="case-list">'+CASES.map(caseCard).join('')+'</div>';}
  function saleSheet(items){if(!opening||opening.type!=='sale')return '';const p=items.find(x=>x.id===opening.id);if(!p)return '';return '<div class="plate-sheet-backdrop"><section class="plate-sheet"><i></i><small>ПРОДАЖА НОМЕРА</small>'+plateFace(p,true)+'<p>'+RARITIES[p.rarity].title+' · '+escape(p.region.city)+'</p><h3>'+formatMoney(p.value)+'</h3><button class="action green" onclick="sellPlate(\''+p.id+'\')">Продать номер</button><button class="action" onclick="cancelPlateSale()">Отмена</button></section></div>';}
  function renderPlates(){
    const collection=ensure(),items=collection.items,total=items.reduce(function(sum,p){return sum+Number(p.value||0);},0),title=typeof head==='function'?head('Номера'):'';
    const toast=notice?'<div class="plate-toast">✓ '+escape(notice)+'</div>':'';notice='';
    render('<div class="app plates-app">'+title+dashboard(items,total)+tabs(items)+'<main class="plate-content">'+(activeTab==='cases'?casesView():collectionView(items))+'</main>'+toast+saleSheet(items)+'</div>');
  }
  function openingScreen(c,p,phase){
    const reveal=phase==='reveal',rolling=phase==='rolling';
    const canRepeat=Number(state.money||0)>=c.price;
    const samples=['Т462ВР 77','Р684УО 78','Е213ТТ 43','А338КК 16','Н303ВВ 54','А070ВА 66','Е114КХ 77','Т333ТТ 23','В444ВВ 61','О554РО 02'];
    const reel='<div class="number-reel"><i></i><div class="reel-track">'+samples.map(x=>'<span>'+x+'</span>').join('')+'<span class="winning-number">'+escape(fullPlateText(p))+'</span></div></div>';
    const process='<small>'+(rolling?'КЕЙС ОТКРЫТ':'ОТКРЫВАЕМ КЕЙС')+'</small><div class="case-machine '+(rolling?'is-open':'')+' '+p.rarity+'"><div class="case-lid">AUTOFLIP</div><div class="case-core">✦</div><div class="case-base"></div></div>'+(rolling?reel:'<div class="opening-progress"><i></i></div>')+'<h2>'+(rolling?'Ищем твой номер':c.name)+'</h2><p>'+(rolling?'Лента замедляется…':'Снимаем защиту и открываем замки…')+'</p><button class="skip-opening" onclick="revealPlateOpening()">Пропустить анимацию</button>';
    render('<div class="app plates-app opening-screen '+(reveal?'is-revealed':rolling?'is-rolling':'is-opening')+'"><button class="opening-close" onclick="finishPlateOpening()" aria-label="Закрыть">×</button><section class="opening-stage"><div class="opening-glow"></div>'+(reveal?'<small>НОВЫЙ НОМЕР</small><div class="reveal-rarity '+p.rarity+'">'+RARITIES[p.rarity].title+'</div>'+plateFace(p,true)+'<h2>'+formatMoney(p.value)+'</h2><p>'+escape(p.region.city)+' · '+escape(p.region.country)+'</p><div class="opening-actions"><button class="action green" onclick="finishPlateOpening()">В коллекцию</button><button class="action" '+(canRepeat?'':'disabled')+' onclick="openPlateCase(\''+c.id+'\')">'+(canRepeat?'Открыть ещё · '+formatMoney(c.price):'Недостаточно денег')+'</button></div>':process)+'</section></div>');
  }
  function clearOpeningTimers(){if(!opening)return;if(opening.timer&&typeof clearTimeout==='function')clearTimeout(opening.timer);if(opening.revealTimer&&typeof clearTimeout==='function')clearTimeout(opening.revealTimer);}
  window.plates=function(){opening=null;renderPlates();};
  window.setPlateTab=function(tab){activeTab=tab==='collection'?'collection':'cases';opening=null;renderPlates();};
  window.setPlateFilter=function(value){filter=value;renderPlates();};
  window.setPlateSort=function(value){sort=value==='value'?'value':'new';renderPlates();};
  window.favoritePlate=function(id){const p=ensure().items.find(x=>x.id===id);if(!p)return;p.favorite=!p.favorite;persistPlates();renderPlates();};
  window.confirmPlateSale=function(id){opening={type:'sale',id:id};renderPlates();};
  window.cancelPlateSale=function(){opening=null;renderPlates();};
  window.openPlateCase=function(id){
    const c=CASES.filter(function(x){return x.id===id;})[0];if(!c)return;
    if(currentGarageLevel()<c.level){alert('Этот кейс откроется на '+c.level+' уровне гаража. Уровни будут добавлены в следующем обновлении.');return;}
    if(Number(state.money||0)<c.price){alert('Недостаточно денег для открытия кейса. Нужно '+formatMoney(c.price)+'.');return;}
    clearOpeningTimers();
    const rarity=rollPlateRarity(c.weights),p=makePlate(rarity),collection=ensure();lastCase=c.id;
    state.money=Number(state.money||0)-c.price;collection.items.unshift(p);collection.nextId=Number(collection.nextId||1)+1;persistPlates();
    if(typeof pushPhoneNotification==='function')pushPhoneNotification('Номера','✦','Открыт '+c.name+': '+RARITIES[rarity].title+' номер.','plates','plate-'+p.id);
    opening={type:'case',caseId:c.id,plateId:p.id};openingScreen(c,p,'opening');
    if(typeof setTimeout==='function')opening.timer=setTimeout(function(){startPlateRoll();},1200);else revealPlateOpening();
  };
  window.startPlateRoll=function(){if(!opening||opening.type!=='case')return;const c=CASES.find(x=>x.id===opening.caseId),p=ensure().items.find(x=>x.id===opening.plateId);if(!c||!p)return plates();openingScreen(c,p,'rolling');if(typeof setTimeout==='function')opening.revealTimer=setTimeout(function(){revealPlateOpening();},3600);else revealPlateOpening();};
  window.revealPlateOpening=function(){if(!opening||opening.type!=='case')return;clearOpeningTimers();const c=CASES.find(x=>x.id===opening.caseId),p=ensure().items.find(x=>x.id===opening.plateId);if(!c||!p)return plates();openingScreen(c,p,'reveal');};
  window.finishPlateOpening=function(){clearOpeningTimers();opening=null;activeTab='collection';filter='all';renderPlates();};
  window.sellPlate=function(id){
    const collection=ensure(),index=collection.items.findIndex(function(p){return p.id===id;});if(index<0)return;
    const p=collection.items[index];state.money=Number(state.money||0)+Number(p.value||0);collection.items.splice(index,1);opening=null;notice='Номер продан за '+formatMoney(p.value);persistPlates();
    if(typeof pushPhoneNotification==='function')pushPhoneNotification('Номера','₽','Продан номер '+p.number+' за '+formatMoney(p.value)+'.','plates','plate-sale-'+p.id);
    activeTab='collection';renderPlates();
  };
  window.plateSystem={rarities:RARITIES,cases:CASES,regions:REGIONS,makePlate:makePlate,rollPlateRarity:rollPlateRarity,currentGarageLevel:currentGarageLevel};
})();
