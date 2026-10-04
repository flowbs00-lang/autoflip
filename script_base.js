const KEY='autoflip-v7-save';
const cities=['Москва','Казань','Санкт-Петербург','Екатеринбург','Новосибирск'];
const cityFactor={Москва:1.05,Казань:.94,'Санкт-Петербург':1.03,Екатеринбург:.91,Новосибирск:.88};
const makes=[
['ВАЗ 2106','Новосибирск',1998,238000,42000,68000,'кузов и пороги',12000],['ВАЗ 2107','Екатеринбург',2004,214000,55000,82000,'карбюратор',9000],['ВАЗ 2109','Казань',2002,201000,72000,105000,'коробка',14000],['ВАЗ 2110','Новосибирск',2005,189000,88000,125000,'электрика',11000],['Lada Priora','Екатеринбург',2009,176000,145000,195000,'двигатель',22000],['Lada Kalina','Казань',2011,154000,185000,235000,'ходовая',18000],['Daewoo Nexia','Новосибирск',2010,181000,175000,225000,'кузов',20000],['Renault Logan','Казань',2012,167000,275000,345000,'сцепление',26000],['Ford Focus II','Санкт-Петербург',2008,193000,320000,405000,'коробка',35000],['Hyundai Solaris','Екатеринбург',2014,149000,520000,625000,'двигатель',42000],['Kia Rio','Новосибирск',2015,137000,570000,690000,'кузов',38000],['Lada Vesta','Казань',2018,112000,690000,820000,'электрика',32000],['Skoda Rapid','Санкт-Петербург',2017,128000,760000,900000,'турбина',48000],['Volkswagen Polo','Москва',2018,119000,820000,960000,'коробка',55000],['Toyota Corolla','Казань',2015,142000,920000,1080000,'ходовая',45000],['BMW 320i','Москва',2017,126000,1480000,1690000,'двигатель',85000],['Toyota Camry 70','Казань',2019,98000,2050000,2290000,'кузов',55000],['Kia K5','Санкт-Петербург',2021,72000,1790000,1990000,'документы',35000],['BMW X5','Екатеринбург',2016,155000,2290000,2650000,'подвеска',140000],['Mercedes C180','Москва',2018,108000,2200000,2490000,'турбина',105000],['Audi A4','Казань',2019,93000,2100000,2390000,'коробка',125000],['Volkswagen Tiguan','Москва',2018,119000,2050000,2320000,'подвеска',65000],['Toyota RAV4','Казань',2020,76000,2550000,2890000,'вариатор',115000],['Geely Monjaro','Новосибирск',2023,42000,2350000,2580000,'мультимедиа',30000],['Haval F7','Казань',2022,52000,1650000,1840000,'турбина',50000],['Mercedes E200','Москва',2020,78000,3150000,3590000,'пневма',145000],['Audi Q5','Екатеринбург',2021,69000,3450000,3890000,'коробка',130000],['BMW X5 G05','Москва',2021,64000,5150000,5790000,'пневма',190000],['Mercedes GLE 300d','Санкт-Петербург',2022,48000,6250000,6990000,'электроника',210000],['Porsche Macan','Москва',2022,39000,7350000,8190000,'подвеска',230000]
].map((x,i)=>({id:i,name:x[0],city:x[1],year:x[2],km:x[3],price:x[4],market:x[5],risk:x[6],repair:x[7],sale:x[5]}));
const photos=['photo-1555215695-3004980ad54e','photo-1621007947382-bb3c3994e3fb','photo-1619767886558-efdc259cde1a','photo-1556189250-72ba954cfc2b','photo-1503376780353-7e6692767b70'];
function commons(file){return 'https://commons.wikimedia.org/wiki/Special:Redirect/file/'+encodeURIComponent(file)+'?width=900'}
const exactPhotos={
'ВАЗ 2106':commons('1992 Lada 2106.jpg'),
'ВАЗ 2107':commons('Lada 2107 (VAZ-2107) 01.jpg'),
'ВАЗ 2109':commons('VAZ-2109 "Devyatka" (4714544714).jpg'),
'ВАЗ 2110':commons('Lada 110-VAZ-2110 (4713570255).jpg'),
'Lada Priora':commons('Lada priora.jpg'),
'Lada Kalina':commons('Lada Kalina 1.jpg'),
'Daewoo Nexia':commons('20110809 daewoo nexia 01.jpg'),
'Renault Logan':commons('Renault Logan .jpg'),
'Ford Focus II':commons('Ford Focus II.jpg'),
'Hyundai Solaris':commons('2014-2017 Hyundai Solaris Sedan (front).jpg'),
'Kia Rio':commons('Kia Rio (UB) sedan in Babat Pertamina Petrol Station - Bbt. Supat, Musi Banyuasin, SS.jpg'),
'Lada Vesta':commons('LADA Vesta.jpg'),
'Skoda Rapid':commons('2012 Škoda Rapid (NH) sedan (2012-10-26).jpg'),
'Volkswagen Polo':commons('Vw polo sedan.jpg'),
'Toyota Corolla':commons('2015 Toyota Corolla Altis (ZRE172R) 2.0V sedan (2015-12-30).jpg'),
'BMW 320i':commons('BMW 320i F30 (10118122084).jpg'),
'Toyota Camry 70':commons('2018 Toyota Camry (XV70).jpg'),
'Kia K5':commons('Kia K5 DL3 grey (1).jpg'),
'BMW X5':commons('BMW X5 F15.jpg'),
'Mercedes C180':commons('Mercedes-Benz C180 W205 (16005105286).jpg'),
'Audi A4':commons('Audi A4 B9.jpg'),
'Volkswagen Tiguan':commons('2018 Volkswagen Tiguan 280 TSI (front).jpg'),
'Toyota RAV4':commons('Toyota RAV4 (XA50) IMG 1998.jpg'),
'Geely Monjaro':commons('Geely Monjaro.jpg'),
'Haval F7':commons('Haval F7 IMG001.jpg'),
'Mercedes E200':commons('Mercedes-Benz E 200 Sports (W213) front.jpg'),
'Audi Q5':commons('Audi Q5 FY Facelift IMG 5684.jpg'),
'BMW X5 G05':commons('BMW X5 xDrive45e M Sport (G05, 2022) (54537623230).jpg'),
'Mercedes GLE 300d':commons('Mercedes-Benz W167 GLE 300d 4MATIC 2022.jpg'),
'Porsche Macan':commons('2022 Porsche Macan 1X7A6048.jpg')
};
function fallbackPhoto(c){return `https://images.unsplash.com/${photos[c.id%photos.length]}?auto=format&fit=crop&w=700&q=75`}
function photo(c){return exactPhotos[c.name]||fallbackPhoto(c)}
const initial={money:50000,rep:0,deals:0,city:'Москва',car:null,loan:0,logs:['Старт: капитал 50 000 ₽. Поднимись с самого низа.'],sound:true,day:1,locked:false,notifications:2,seen:{},notes:['Цель: купить первую машину ниже рынка.']};
let state=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(initial);
if(state.notifications===undefined)state.notifications=2;if(!state.notes)state.notes=[];if(!state.seen)state.seen={};
const screen=document.getElementById('screen'),objective=document.getElementById('objective'),objectiveSub=document.getElementById('objectiveSub'),journal=document.getElementById('journal');
function money(n){return Math.round(n).toLocaleString('ru-RU')+' ₽'}
function save(){localStorage.setItem(KEY,JSON.stringify(state));document.getElementById('saveState').textContent='Сохранено';document.getElementById('heroMoney').textContent=money(state.money);document.getElementById('heroRep').textContent=state.rep;document.getElementById('heroDeals').textContent=state.deals;document.getElementById('heroCity').textContent=state.city;renderStats()}
function renderStats(){document.getElementById('statsbox').innerHTML=`<div class="stat"><b>${money(state.money)}</b><small>капитал</small></div><div class="stat"><b>${state.rep}</b><small>репутация</small></div><div class="stat"><b>${state.deals}</b><small>сделок</small></div>`}
function log(t){state.logs.unshift(t);state.logs=state.logs.slice(0,5);journal.innerHTML='<b>Журнал</b>'+state.logs.map(x=>`<p>${x}</p>`).join('');save()}
function fx(){if(!state.sound)return;try{let a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=430;g.gain.value=.018;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.045)}catch(e){}}
function render(x){screen.classList.add('fade');setTimeout(()=>{screen.innerHTML=x;screen.classList.remove('fade');screen.querySelectorAll('[data-action="home"]').forEach(el=>el.onclick=home)},80);fx()}
function toggleSound(){state.sound=!state.sound;document.getElementById('soundBtn').textContent=state.sound?'🔊':'🔇';save()}
function now(){return new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}
function dateText(){return new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})}
function status(){return `<div class="status"><span>${now()}</span><span class="right"><span>●</span><span>◔</span><span>▮</span></span></div>`}
function head(t){return status()+`<div class="head"><button onclick="home()">‹</button><b>${t}</b><span>•••</span></div>`}
function home(){
 const unread=state.notifications>0;
 render(`<div class="home"><div class="home-wall">${status()}<div class="home-top"><div><small>${dateText()}</small><div class="clock">${now()}</div></div><button class="sound" onclick="lockScreen()">🔒</button></div>${unread?`<div class="notification" onclick="messages();state.notifications=0;save()"><b>💬 AutoFlip Messages</b><span>${state.notifications} новых сообщения от продавцов</span></div>`:''}<div class="apps">
 <button onclick="market()"><div class="icon green">🚗</div><small>Авто</small></button>
 <button onclick="messages()"><div class="icon blue">💬</div><small>Сообщения${unread?' •':''}</small></button>
 <button onclick="garage()"><div class="icon orange">🔧</div><small>Гараж</small></button>
 <button onclick="bank()"><div class="icon">🏦</div><small>Банк</small></button>
 <button onclick="mapApp()"><div class="icon blue">🗺️</div><small>Карты</small></button>
 <button onclick="service()"><div class="icon orange">🛠️</div><small>СТО</small></button>
 <button onclick="realty()"><div class="icon">🏠</div><small>Дом</small></button>
 <button onclick="contacts()"><div class="icon blue">📞</div><small>Телефон</small></button>
 <button onclick="notes()"><div class="icon">📝</div><small>Заметки</small></button>
 <button onclick="profile()"><div class="icon">👤</div><small>Профиль</small></button>
 <button onclick="newsApp()"><div class="icon red">📰</div><small>Новости</small></button>
 <button onclick="settings()"><div class="icon">⚙️</div><small>Настройки</small></button>
 </div><div class="dock"><button onclick="messages()"><div class="icon blue">💬</div></button><button onclick="market()"><div class="icon green">🚗</div></button><button onclick="contacts()"><div class="icon">📞</div></button><button onclick="bank()"><div class="icon">🏦</div></button></div></div></div>`)
}
function lockScreen(){render(`<div class="lock" onclick="unlock()">${status()}<div class="time">${now()}</div><div class="date">${dateText()}</div><div class="lock-card"><b>🔔 AutoFlip</b><small>Нажми, чтобы разблокировать телефон</small></div><div class="swipe">▲ НАЖМИТЕ ДЛЯ РАЗБЛОКИРОВКИ</div></div>`)}
function unlock(){home()}
let marketSearchTerm='';
function marketSearch(){
 const input=document.getElementById('marketSearch');
 marketSearchTerm=(input?input.value:'').trim();
 market('all',0);
}
function clearMarketSearch(){marketSearchTerm='';market('all',0)}
function market(filter='all',page=0){
 let arr=[...makes];
 if(filter==='cheap')arr=arr.filter(c=>c.price<500000);
 if(filter==='profit')arr.sort((a,b)=>(b.market-b.price-b.repair)-(a.market-a.price-a.repair));
 if(filter==='city')arr=arr.filter(c=>c.city===state.city);
 const perPage=8,totalPages=Math.max(1,Math.ceil(arr.length/perPage));
 page=Math.max(0,Math.min(Number(page)||0,totalPages-1));
 const start=page*perPage,visible=arr.slice(start,start+perPage),garageCount=Array.isArray(state.cars)?state.cars.length:(state.car?1:0);
 render(`<div class="app">${head('Авто')}
   <section class="auto-market-hero">
     <div class="auto-market-hero-copy"><small>AUTOMARKET</small><h3>Рынок автомобилей</h3><p>Ищи недооценённые машины, считай вложения и выбирай сделки с запасом по прибыли.</p></div>
     <div class="auto-market-wallet"><span>Свободные деньги</span><b>${money(state.money)}</b></div>
   </section>
   <div class="auto-market-stats">
     <div><b>${arr.length}</b><span>объявлений</span></div>
     <div><b>${garageCount}/3</b><span>в гараже</span></div>
     <div><b>${Number(state.rep||0)}</b><span>репутация</span></div>
   </div>
   <div class="filters auto-market-filters">
     <button class="${filter==='all'?'active':''}" onclick="market('all',0)">Все</button>
     <button class="${filter==='city'?'active':''}" onclick="market('city',0)">📍 ${state.city}</button>
     <button class="${filter==='cheap'?'active':''}" onclick="market('cheap',0)">До 500К</button>
     <button class="${filter==='profit'?'active':''}" onclick="market('profit',0)">Лучший потенциал</button>
   </div>
   <div class="auto-market-list">
   ${visible.map(c=>{const potential=Number(c.market||0)-Number(c.price||0)-Number(c.repair||0),pct=Math.round(potential/Math.max(1,Number(c.price||0)+Number(c.repair||0))*100);return `<div class="market auto-market-card" onclick="carView(${c.id})">
     <div class="pic auto-market-photo" style="background-image:linear-gradient(180deg,#0001,#0007),url('${photo(c)}'),url('${fallbackPhoto(c)}')"><span class="auto-card-city">📍 ${c.city}</span></div>
     <div class="auto-market-info">
       <div class="auto-market-title"><b>${c.name}</b><strong>${money(c.price)}</strong></div>
       <div class="auto-market-specs"><span>📅 ${c.year}</span><span>🛣️ ${c.km.toLocaleString('ru-RU')} км</span></div>
       <div class="auto-market-bottom">
         <span>Рынок <b>${money(c.market)}</b></span>
         <span class="${potential>=0?'auto-profit':'auto-loss'}">Потенциал ${potential>=0?'+':''}${money(potential)} · ${pct>=0?'+':''}${pct}%</span>
       </div>
     </div>
   </div>`}).join('')}
   </div>
   <div class="auto-market-pagination">
     <button class="action" ${page<=0?'disabled':''} onclick="market('${filter}',${page-1})">‹ Назад</button>
     <div><small>СТРАНИЦА</small><b>${page+1} / ${totalPages}</b></div>
     <button class="action" ${page>=totalPages-1?'disabled':''} onclick="market('${filter}',${page+1})">Дальше ›</button>
   </div>
 </div>`)
}
function carView(id){
 let c=makes[id];if(!c)return market();
 let profit=Number(c.market||0)-Number(c.price||0)-Number(c.repair||0),margin=Math.round(profit/Math.max(1,Number(c.price||1))*100),needRep=(typeof requiredRepForCar==='function'?requiredRepForCar(c):0),repOk=Number(state.rep||0)>=needRep,canAfford=Number(state.money||0)>=Number(c.price||0);
 render(`<div class="app auto-car-view">${head(c.name)}
   <div class="pic car-detail-photo" style="background-image:linear-gradient(180deg,#0000 45%,#0009),url('${photo(c)}'),url('${fallbackPhoto(c)}')"><span class="market-city-badge">📍 ${c.city}</span><span class="car-year-badge">${c.year}</span></div>
   <div class="car-detail-heading"><div><small>ЦЕНА ПРОДАВЦА</small><div class="price">${money(c.price)}</div></div><span class="car-km">${c.km.toLocaleString('ru-RU')} км</span></div>
   <div class="deal-score car-economics">
     <span>РЫНОК<b>${money(c.market)}</b></span>
     <span>РЕМОНТ ~<b>${money(c.repair)}</b></span>
     <span>ПОТЕНЦИАЛ<b class="${profit>=0?'profit':'market-bad'}">${profit>=0?'+':''}${money(profit)}</b></span>
   </div>
   <div class="note car-opportunity"><b>${profit>=0?'📈 Потенциал сделки':'📉 Слабая экономика'}</b><p class="muted">Расчётная маржа: ${margin}% до дополнительных скрытых расходов и торга.</p></div>
   <div class="warning"><b>⚠ Что известно сейчас</b><br>Риск: ${c.risk}. Диагностика поможет узнать машину лучше, но скрытые проблемы всё равно возможны.</div>
   <div class="car-buy-status">
     <span><small>На руках</small><b>${money(state.money)}</b></span>
     <span><small>Репутация</small><b>${Number(state.rep||0)}${needRep?' / '+needRep:''}</b></span>
   </div>
   ${!repOk?'<div class="note"><b>🔒 Автомобиль пока недоступен</b><p class="muted">Для этого уровня сделки нужно '+needRep+' репутации.</p></div>':''}
   ${repOk&&!canAfford?'<div class="note"><b>🏦 Не хватает '+money(c.price-state.money)+'</b><p class="muted">Можно накопить или проверить доступный лимит в Банке.</p></div>':''}
   <button class="action" onclick="inspect(${id})">🔎 Проверить автомобиль</button>
   <button class="action green" onclick="deal(${id})" ${repOk?'':'disabled'}>💬 Связаться с продавцом</button>
 </div>`)
}
function inspect(id){let c=makes[id];objective.textContent='Переговоры';objectiveSub.textContent='Найден риск: '+c.risk+'. Используй его в торге.';log(`Диагностика ${c.name}: найден риск — ${c.risk}.`);carView(id)}
function deal(id){let c=makes[id],base=Math.floor(c.price*.92),seller=['Алексей','Дмитрий','Илья'][id%3];render(`<div class="app">${head('Переговоры')}<div class="bubble seller">${seller}: «Цена ${money(c.price)}. Машина хорошая.»</div><div class="bubble you">Ты: «После диагностики вижу проблему с ${c.risk}. Готов дать ${money(base)}.»</div><div class="buyers"><div class="buyer"><b>🤝 Торг</b><small>−12% · риск выше</small></div><div class="buyer"><b>⚡ Сегодня</b><small>−6% · быстро</small></div><div class="buyer"><b>💎 Премиум</b><small>позже дороже</small></div></div><button class="action green" onclick="buy(${id},${base})">Согласовать ${money(base)}</button><button class="action" onclick="market()">Назад</button></div>`)}
function buy(id,price){if(state.money<price)return alert('Не хватает денег. Используй Банк.');let c=makes[id];state.money-=price;state.car={...c,buy:price,repaired:false};state.deals++;state.notifications++;objective.textContent='Подготовить автомобиль';objectiveSub.textContent='Открой гараж или СТО.';log(`Куплен ${c.name} за ${money(price)}.`);garage()}
function garage(){let c=state.car;if(!c)return render(`<div class="app">${head('Гараж')}<div class="note">Гараж пуст. Первая машина ждёт тебя на рынке.</div><button class="action green" onclick="market()">🚗 Открыть рынок</button></div>`);render(`<div class="app">${head('Гараж')}<div class="pic" style="background-image:linear-gradient(#0002,#0008),url('${photo(c)}'),url('${fallbackPhoto(c)}')">🚘</div><h3>${c.name}</h3><p class="muted">${c.city} · куплена за ${money(c.buy)}</p><div class="bar"><i style="width:${c.repaired?100:45}%"></i></div><p class="muted">Состояние ${c.repaired?'100':'45'}%</p><div class="deal-score"><span>ПОКУПКА<b>${money(c.buy)}</b></span><span>РЕМОНТ<b>${money(c.repair)}</b></span><span>ПРОДАЖА<b class="profit">${money(c.sale)}</b></span></div><button class="action green" onclick="repair()">🔧 ${c.repaired?'Авто отремонтировано':`Ремонт · ${money(c.repair)}`}</button><button class="action" onclick="sell()">💰 Найти покупателя</button><button class="action" onclick="service()">🛠️ Открыть СТО</button></div>`)}
function repair(){let c=state.car;if(!c)return garage();if(c.repaired)return; if(state.money<c.repair)return alert('Не хватает денег на ремонт.');state.money-=c.repair;c.repaired=true;objective.textContent='Продать автомобиль';objectiveSub.textContent='Открой сообщения или гараж и выбери покупателя.';log(`Ремонт ${c.name}: -${money(c.repair)}.`);garage()}
function sell(){let c=state.car;if(!c)return garage();if(!c.repaired)return alert('Сначала закончи ремонт.');let names=[['Андрей','торгаш',.94],['Максим','срочный',.99],['Роман','премиум',1.05]];render(`<div class="app">${head('Покупатели')}<p class="muted">Выбери стратегию продажи.</p>${names.map((n,i)=>`<div class="buyer" style="margin:7px 0"><b>${i===0?'🤝':i===1?'⚡':'💎'} ${n[0]} · ${n[1]}</b><small>Предложение: ${money(c.sale*n[2])}</small><button class="action ${i===2?'green':''}" onclick="closeSale(${n[2]})">Принять</button></div>`).join('')}</div>`)}
function closeSale(mult){let c=state.car,final=c.sale*mult,profit=final-c.buy-c.repair;state.money+=final;state.rep+=10;state.deals++;state.day++;state.car=null;state.notifications++;log(`Продан ${c.name} за ${money(final)}. Прибыль ${money(profit)}.`);objective.textContent='Новая сделка';objectiveSub.textContent='Рынок обновился. Ищи следующую машину.';save();home()}
function messages(){state.notifications=0;save();render(`<div class="app">${head('Сообщения')}<div class="contact" onclick="chat('Алексей')"><div class="mini">👨</div><div><b>Алексей · BMW 320i</b><small>«Машина ещё в продаже»</small></div><span class="unread">1</span></div><div class="contact" onclick="chat('Мария')"><div class="mini">👩</div><div><b>Мария · Toyota Camry</b><small>«Готова обсудить цену»</small></div></div><div class="contact" onclick="chat('Илья')"><div class="mini">👨</div><div><b>Илья · Audi A4</b><small>«Когда сможете приехать?»</small></div></div></div>`)}
function chat(name){render(`<div class="app">${head(name)}<div class="bubble seller">${name}: «Привет. Автомобиль ещё в продаже.»</div><div class="bubble you">Ты: «После диагностики есть вопросы. Уступите по цене?»</div><div class="bubble seller">${name}: «Если заберёте сегодня — могу немного уступить.»</div><button class="action green" onclick="log('Через чат договорились о встрече.');messages()">Договориться о встрече</button><button class="action" onclick="messages()">Назад</button></div>`)}
function bank(){render(`<div class="app">${head('Банк')}<div class="bank"><small>Свободные деньги</small><b>${money(state.money)}</b><span class="muted">Текущий долг: ${money(state.loan)}</span></div><button class="action green" onclick="takeLoan()">Взять 500 000 ₽</button>${state.loan?'<button class="action" onclick="payLoan()">Погасить '+money(state.loan)+'</button>':''}<div class="note" style="margin-top:10px">Банк помогает пережить крупную покупку, но долг нужно погашать.</div></div>`)}
function takeLoan(){if(state.loan>=1000000)return alert('Лимит кредита уже использован.');state.money+=500000;state.loan+=540000;log('Банк выдал 500 000 ₽. Долг вырос до 540 000 ₽.');bank()}
function payLoan(){if(state.money<state.loan)return alert('Недостаточно денег.');state.money-=state.loan;log('Кредит полностью погашен.');state.loan=0;save();bank()}
function mapApp(){render(`<div class="app">${head('Карты')}<div class="map">${cities.map((c,i)=>`<button class="city ${state.city===c?'active':''} m${i+1}" onclick="goCity('${c}')">${c}</button>`).join('')}</div><p class="muted">Переезд стоит 3 500 ₽. Новый город меняет доступный рынок.</p></div>`)}
function goCity(city){if(city===state.city)return mapApp();if(state.money<3500)return alert('Не хватает денег.');state.money-=3500;state.city=city;state.day++;log(`Переезд в ${city}. Новый день.`);mapApp()}
function service(){let c=state.car;let diag=c?`текущий автомобиль — ${c.name}`:'автомобиля в гараже нет';let work=c?`<div class="row"><span>Замена узла · ${c.risk}</span><b>${money(c.repair)}</b></div><button class="action green" onclick="repair()">🔧 Запустить ремонт</button>`:'<button class="action" onclick="market()">Найти автомобиль</button>';render(`<div class="app">${head('СТО')}<div class="note">Диагностика: ${diag}.</div>${work}<div class="row"><span>Экспресс-диагностика</span><b>7 500 ₽</b></div><button class="action" onclick="log('СТО выполнила экспресс-диагностику.');home()">Проверить</button></div>`)}
function realty(){render(`<div class="app">${head('Дом')}<div class="row"><span>🏢 Парковочное место</span><b>1 850 000 ₽</b></div><div class="row"><span>🏠 Дом в Казани</span><b>5 400 000 ₽</b></div><div class="note">Недвижимость станет отдельной веткой прогресса после накопления капитала.</div></div>`)}
function contacts(){render(`<div class="app">${head('Телефон')}<div class="contact" onclick="chat('Алексей')"><div class="mini">👨</div><div><b>Алексей</b><small>Продавец · BMW</small></div></div><div class="contact" onclick="chat('Мария')"><div class="mini">👩</div><div><b>Мария</b><small>Продавец · Toyota</small></div></div><div class="contact" onclick="chat('Илья')"><div class="mini">👨</div><div><b>Илья</b><small>Продавец · Audi</small></div></div></div>`)}
function notes(){render(`<div class="app">${head('Заметки')}<div class="note"><b>Мои планы</b><br><br>1. Купить машину ниже рынка.<br>2. Проверить слабое место.<br>3. Отремонтировать.<br>4. Продать с прибылью.</div><button class="action green" onclick="state.notes.unshift('Идея сделки: сравнивать маржу после ремонта.');state.notes=state.notes.slice(0,5);save();notes()">＋ Добавить заметку</button></div>`)}
function newsApp(){render(`<div class="app">${head('Новости')}<div class="notification"><b>📈 Рынок Москвы</b><span>Спрос на кроссоверы вырос. Проверь X5 и Q5.</span></div><div class="notification"><b>🔧 СТО</b><span>На этой неделе ремонт ходовой подешевел.</span></div><div class="notification"><b>💰 Банк</b><span>Доступен кредит на расширение бизнеса.</span></div></div>`)}
function profile(){let rank=state.rep<30?'Начинающий перекуп':state.rep<80?'Опытный перекуп':'Автодилер';render(`<div class="app">${head('Профиль')}<div class="profile-card"><div class="avatar">A</div><h3>${rank}</h3><p class="muted">${state.city} · день ${state.day}</p><div class="statsbox"><div class="stat"><b>${money(state.money)}</b><small>капитал</small></div><div class="stat"><b>${state.deals}</b><small>сделок</small></div><div class="stat"><b>${state.rep}</b><small>репутация</small></div></div></div><div class="row"><span>🚗 Машина</span><b>${state.car?state.car.name:'нет'}</b></div><div class="row"><span>🏦 Долг</span><b>${money(state.loan)}</b></div></div>`)}
function settings(){render(`<div class="app">${head('Настройки')}<div class="setting"><span>Звуки</span><div class="toggle ${state.sound?'on':''}" onclick="toggleSound();settings()"><i></i></div></div><div class="setting"><span>Уведомления</span><b>${state.notifications}</b></div><div class="setting"><span>Версия</span><b>V7.0</b></div><div class="note">Прогресс хранится локально в браузере. При очистке данных браузера сохранение может исчезнуть.</div></div>`)}
function randomEvent(){let e=[['📈 Спрос вырос','Следующая продажа получает бонус к цене.',5],['🔧 СТО сделала скидку','Репутация рынка дала скидку.',0],['⭐ Хороший отзыв','Репутация +8.',8],['💸 Распродажа','Рынок сегодня выглядит дешевле.',0]][Math.floor(Math.random()*4)];if(e[2])state.rep+=e[2];log(`${e[0]}: ${e[1]}`);render(`<div class="app">${head('Событие')}<div class="event"><b>${e[0]}</b><small>${e[1]}</small></div><button class="action green" onclick="home()">Продолжить</button></div>`)}
function resetGame(){if(confirm('Удалить весь прогресс V7?')){state=structuredClone(initial);save();journal.innerHTML='<b>Журнал</b><p>Новая игра начата.</p>';objective.textContent='Найди выгодный автомобиль';objectiveSub.textContent='Открой рынок и изучи объявления.';home()}}
journal.innerHTML='<b>Журнал</b>'+state.logs.map(x=>`<p>${x}</p>`).join('');save();home();
