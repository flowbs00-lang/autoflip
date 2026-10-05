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
    {id:'collector',name:'Коллекционный кейс',price:70000,level:10,weights:[['ordinary',10],['unusual',30],['rare',35],['ultra',20],['secret',5]]},
    {id:'legend',name:'Легендарный кейс',price:150000,level:15,weights:[['ordinary',5],['unusual',20],['rare',35],['ultra',28],['secret',11.9],['priceless',.1]]}
  ];
  const REGIONS=[
    ['77','Москва','Россия'],['78','Санкт-Петербург','Россия'],['16','Казань','Россия'],['54','Новосибирск','Россия'],['66','Екатеринбург','Россия'],['23','Краснодар','Россия'],['61','Ростов-на-Дону','Россия'],['02','Уфа','Россия'],
    ['01','Минск','Беларусь'],['02','Брест','Беларусь'],['01','Астана','Казахстан'],['02','Алматы','Казахстан'],['01','Ташкент','Узбекистан'],['01','Бишкек','Кыргызстан'],['01','Душанбе','Таджикистан'],['01','Ереван','Армения'],['01','Баку','Азербайджан'],['10','Кишинёв','Молдова']
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
    return {id:'plate-'+Date.now()+'-'+rnd(1000000),number:base.number,region:r,rarity:rarity,value:RARITIES[rarity].value,createdAt:Date.now(),attachedCarId:null};
  }
  function rollPlateRarity(weights,randomValue){
    const roll=(typeof randomValue==='number'?randomValue:Math.random())*100;let edge=0;
    for(let i=0;i<weights.length;i++){edge+=Number(weights[i][1]);if(roll<edge)return weights[i][0];}
    return weights[weights.length-1][0];
  }
  function escape(v){return String(v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function plateFace(p,large){return '<div class="plate-face plate-'+p.rarity+(large?' large':'')+'"><b>'+escape(p.number)+'</b><i>'+escape(p.region.code)+'</i><small>RUS</small></div>';}
  function chanceText(c){return c.weights.map(function(w){return RARITIES[w[0]].title+' '+String(w[1]).replace('.',',')+'%';}).join(' · ');}
  function caseCard(c){
    const locked=currentGarageLevel()<c.level,canPay=Number(state.money||0)>=c.price;
    return '<article class="case-card '+(locked?'locked':'')+'"><div class="case-top"><span class="case-orb">✦</span><div><small>КЕЙС · УР. '+c.level+'</small><h3>'+c.name+'</h3></div></div><p>'+chanceText(c)+'</p><div class="case-bottom"><b>'+formatMoney(c.price)+'</b>'+(locked?'<span class="case-lock">🔒 Уровень '+c.level+'</span>':'<button class="plate-open" '+(canPay?'':'disabled')+' onclick="openPlateCase(\''+c.id+'\')">Открыть</button>')+'</div>'+(locked?'<small class="case-hint">Откроется с уровнем гаража '+c.level+'. Уровни появятся в следующем обновлении.</small>':'')+'</article>';
  }
  function inventoryCard(p){return '<article class="plate-item"><div>'+plateFace(p,false)+'</div><div class="plate-info"><small class="rarity '+p.rarity+'">'+RARITIES[p.rarity].title+'</small><b>'+escape(p.region.city)+', '+escape(p.region.country)+'</b><span>'+RARITIES[p.rarity].description+'</span></div><div class="plate-value"><b>'+formatMoney(p.value)+'</b><button onclick="sellPlate(\''+p.id+'\')">Продать</button></div></article>';}
  function renderPlates(reveal){
    const collection=ensure(),items=collection.items,total=items.reduce(function(sum,p){return sum+Number(p.value||0);},0);
    const title=typeof head==='function'?head('Номера'):'';
    const revealHtml=reveal?'<section class="plate-reveal"><small>НОМЕР ПОЛУЧЕН</small>'+plateFace(reveal,true)+'<h2>'+RARITIES[reveal.rarity].title+'</h2><p>'+RARITIES[reveal.rarity].description+' · '+escape(reveal.region.city)+', '+escape(reveal.region.country)+'</p><b>'+formatMoney(reveal.value)+'</b><button class="action green" onclick="plates()">В коллекцию</button></section>':'';
    const content=revealHtml||'<section class="plates-hero"><div><small>КОЛЛЕКЦИЯ НОМЕРОВ</small><h2>'+items.length+' '+(items.length===1?'номер':'номеров')+'</h2><p>Собирай комбинации, продавай дубликаты и жди обновления гаражей для установки на автомобили.</p></div><b>'+formatMoney(total)+'</b></section><h3 class="plates-section-title">Кейсы</h3><div class="case-list">'+CASES.map(caseCard).join('')+'</div><h3 class="plates-section-title">Коллекция</h3>'+(items.length?'<div class="plate-list">'+items.map(inventoryCard).join('')+'</div>':'<div class="plates-empty">Пока пусто. Открой первый кейс и начни коллекцию.</div>');
    render('<div class="app plates-app">'+title+content+'</div>');
  }
  window.plates=function(){renderPlates(null);};
  window.openPlateCase=function(id){
    const c=CASES.filter(function(x){return x.id===id;})[0];if(!c)return;
    if(currentGarageLevel()<c.level){alert('Этот кейс откроется на '+c.level+' уровне гаража. Уровни будут добавлены в следующем обновлении.');return;}
    if(Number(state.money||0)<c.price){alert('Недостаточно денег для открытия кейса. Нужно '+formatMoney(c.price)+'.');return;}
    const rarity=rollPlateRarity(c.weights),p=makePlate(rarity),collection=ensure();
    state.money=Number(state.money||0)-c.price;collection.items.unshift(p);collection.nextId=Number(collection.nextId||1)+1;persistPlates();
    if(typeof pushPhoneNotification==='function')pushPhoneNotification('Номера','✦','Открыт '+c.name+': '+RARITIES[rarity].title+' номер.','plates','plate-'+p.id);
    renderPlates(p);
  };
  window.sellPlate=function(id){
    const collection=ensure(),index=collection.items.findIndex(function(p){return p.id===id;});if(index<0)return;
    const p=collection.items[index];state.money=Number(state.money||0)+Number(p.value||0);collection.items.splice(index,1);persistPlates();
    if(typeof pushPhoneNotification==='function')pushPhoneNotification('Номера','₽','Продан номер '+p.number+' за '+formatMoney(p.value)+'.','plates','plate-sale-'+p.id);
    plates();
  };
  window.plateSystem={rarities:RARITIES,cases:CASES,regions:REGIONS,makePlate:makePlate,rollPlateRarity:rollPlateRarity,currentGarageLevel:currentGarageLevel};
})();
