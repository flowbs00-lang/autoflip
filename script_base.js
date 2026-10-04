const KEY='autoflip-v7-save';
const cities=['Москва','Казань','Санкт-Петербург','Екатеринбург','Новосибирск'];
const cityFactor={Москва:1.05,Казань:.94,'Санкт-Петербург':1.03,Екатеринбург:.91,Новосибирск:.88};
const makes=[
['ВАЗ 2106','Новосибирск',1998,238000,42000,68000,'кузов и пороги',12000],['ВАЗ 2107','Екатеринбург',2004,214000,55000,82000,'карбюратор',9000],['ВАЗ 2109','Казань',2002,201000,72000,105000,'коробка',14000],['ВАЗ 2110','Новосибирск',2005,189000,88000,125000,'электрика',11000],['Lada Priora','Екатеринбург',2009,176000,145000,195000,'двигатель',22000],['Lada Kalina','Казань',2011,154000,185000,235000,'ходовая',18000],['Daewoo Nexia','Новосибирск',2010,181000,175000,225000,'кузов',20000],['Renault Logan','Казань',2012,167000,275000,345000,'сцепление',26000],['Ford Focus II','Санкт-Петербург',2008,193000,320000,405000,'коробка',35000],['Hyundai Solaris','Екатеринбург',2014,149000,520000,625000,'двигатель',42000],['Kia Rio','Новосибирск',2015,137000,570000,690000,'кузов',38000],['Lada Vesta','Казань',2018,112000,690000,820000,'электрика',32000],['Skoda Rapid','Санкт-Петербург',2017,128000,760000,900000,'турбина',48000],['Volkswagen Polo','Москва',2018,119000,820000,960000,'коробка',55000],['Toyota Corolla','Казань',2015,142000,920000,1080000,'ходовая',45000],['BMW 320i','Москва',2017,126000,1480000,1690000,'двигатель',85000],['Toyota Camry 70','Казань',2019,98000,2050000,2290000,'кузов',55000],['Kia K5','Санкт-Петербург',2021,72000,1790000,1990000,'документы',35000],['BMW X5','Екатеринбург',2016,155000,2290000,2650000,'подвеска',140000],['Mercedes C180','Москва',2018,108000,2200000,2490000,'турбина',105000],['Audi A4','Казань',2019,93000,2100000,2390000,'коробка',125000],['Volkswagen Tiguan','Москва',2018,119000,2050000,2320000,'подвеска',65000],['Toyota RAV4','Казань',2020,76000,2550000,2890000,'вариатор',115000],['Geely Monjaro','Новосибирск',2023,42000,2350000,2580000,'мультимедиа',30000],['Haval F7','Казань',2022,52000,1650000,1840000,'турбина',50000],['Mercedes E200','Москва',2020,78000,3150000,3590000,'пневма',145000],['Audi Q5','Екатеринбург',2021,69000,3450000,3890000,'коробка',130000],['BMW X5 G05','Москва',2021,64000,5150000,5790000,'пневма',190000],['Mercedes GLE 300d','Санкт-Петербург',2022,48000,6250000,6990000,'электроника',210000],['Porsche Macan','Москва',2022,39000,7350000,8190000,'подвеска',230000],
['Chevrolet Lacetti','Казань',2008,196000,260000,330000,'кузов',26000],
['Chevrolet Cruze','Екатеринбург',2012,172000,440000,525000,'охлаждение',34000],
['Opel Astra J','Москва',2012,164000,470000,565000,'коробка',42000],
['Nissan Almera','Новосибирск',2015,151000,520000,620000,'подвеска',36000],
['Mitsubishi Lancer X','Казань',2011,181000,560000,675000,'двигатель',47000],
['Mazda 3','Санкт-Петербург',2013,148000,690000,820000,'кузов',46000],
['Skoda Octavia','Москва',2016,132000,930000,1090000,'турбина',62000],
['Hyundai Elantra','Екатеринбург',2018,118000,1050000,1230000,'электрика',48000],
['Kia Ceed','Казань',2018,126000,1120000,1310000,'ходовая',52000],
['Renault Duster','Новосибирск',2018,139000,1180000,1380000,'сцепление',61000],
['Nissan Qashqai','Москва',2019,111000,1450000,1690000,'вариатор',85000],
['Mazda 6','Санкт-Петербург',2019,105000,1680000,1940000,'двигатель',83000],
['Honda Accord','Казань',2017,128000,1780000,2050000,'коробка',92000],
['Subaru Forester','Екатеринбург',2019,117000,1980000,2290000,'двигатель',105000],
['Chery Tiggo 7 Pro','Москва',2022,61000,1850000,2090000,'электроника',52000],
['Geely Coolray','Новосибирск',2021,72000,1650000,1880000,'турбина',58000],
['Volvo XC60','Санкт-Петербург',2019,104000,2650000,3020000,'электрика',120000],
['Lexus RX 350','Москва',2018,116000,3450000,3920000,'подвеска',140000],
['Toyota Land Cruiser Prado','Казань',2018,129000,4250000,4790000,'ходовая',165000]
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
'Porsche Macan':commons('2022 Porsche Macan 1X7A6048.jpg'),
'Chevrolet Lacetti':commons('Chevrolet Lacetti front 20080118.jpg'),
'Chevrolet Cruze':commons('Chevrolet Cruze J300 sedan.jpg'),
'Opel Astra J':commons('Opel Astra J 1.4 Turbo Innovation – Frontansicht, 11. August 2013, Münster.jpg'),
'Nissan Almera':commons('Nissan Almera III (G15) 2013.jpg'),
'Mitsubishi Lancer X':commons('Mitsubishi Lancer X sedan.jpg'),
'Mazda 3':commons('Mazda3 BM sedan 01 China 2014-04-16.jpg'),
'Skoda Octavia':commons('Skoda Octavia III.jpg'),
'Hyundai Elantra':commons('2017 Hyundai Elantra (AD) Active sedan (2017-11-28) 01.jpg'),
'Kia Ceed':commons('Kia Ceed III IMG 3364.jpg'),
'Renault Duster':commons('Renault Duster 1.5 dCi 4WD Laureate – Frontansicht, 10. August 2014, Ratingen.jpg'),
'Nissan Qashqai':commons('Nissan Qashqai J11 1.6 dCi 2014 (15136359668).jpg'),
'Mazda 6':commons('Mazda6 GJ 2.2 SKYACTIV-D Sports-Line – Frontansicht, 3. Januar 2014, Düsseldorf.jpg'),
'Honda Accord':commons('2016 Honda Accord (CR6) VTi-L sedan (2018-10-01) 01.jpg'),
'Subaru Forester':commons('2018 Subaru Forester 2.5i-S S4 (2018-08-27) 01.jpg'),
'Chery Tiggo 7 Pro':commons('Chery Tiggo 7 Pro.jpg'),
'Geely Coolray':commons('Geely Binyue 001.jpg'),
'Volvo XC60':commons('Volvo XC60 II IMG 0628.jpg'),
'Lexus RX 350':commons('2018 Lexus RX 350L AWD front 5.26.18.jpg'),
'Toyota Land Cruiser Prado':commons('Toyota Land Cruiser Prado 150 IMG 1968.jpg')
};
function fallbackPhoto(c){return `https://images.unsplash.com/${photos[c.id%photos.length]}?auto=format&fit=crop&w=700&q=75`}
function photo(c){return c&&c.photoUrl?c.photoUrl:(exactPhotos[c.name]||fallbackPhoto(c))}
const initial={money:100000,rep:0,deals:0,city:'Москва',car:null,loan:0,logs:['Старт: капитал 100 000 ₽. Найди первую выгодную машину.'],sound:true,day:1,locked:false,notifications:2,seen:{},notes:['Цель: купить первую машину ниже рынка.']};
let state=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(initial);
if(Number(state.money||0)===50000&&Number(state.deals||0)===0&&!state.car&&(!Array.isArray(state.cars)||state.cars.length===0)&&Number(state.loan||0)===0)state.money=100000;
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
let marketAllOrder=[];
function marketListingKey(c){return c&&c.listingId?c.listingId:('market-'+c.id+'-'+c.name)}
function shuffleMarketAll(arr,renew){
 if(renew||!Array.isArray(marketAllOrder)||!marketAllOrder.length){
   marketAllOrder=arr.map(marketListingKey);
   for(let i=marketAllOrder.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[marketAllOrder[i],marketAllOrder[j]]=[marketAllOrder[j],marketAllOrder[i]]}
 }
 const pos=new Map(marketAllOrder.map((k,i)=>[k,i]));
 return arr.sort((a,b)=>(pos.has(marketListingKey(a))?pos.get(marketListingKey(a)):99999)-(pos.has(marketListingKey(b))?pos.get(marketListingKey(b)):99999));
}
function marketSearch(){
  const input=document.getElementById('marketSearch');
  marketSearchTerm=(input?input.value:'').trim();
  market('all',0);
}
function clearMarketSearch(){
  marketSearchTerm='';
  market('all',0);
}
function market(filter='all',page=0){
 let arr=[...makes];
 const q=String(marketSearchTerm||'').trim().toLowerCase();
 if(q)arr=arr.filter(c=>[c.name,c.city,c.year,String(c.km),c.color,c.body,c.trim,c.listingId].join(' ').toLowerCase().includes(q));
 if(filter==='all')arr=shuffleMarketAll(arr,Number(page||0)===0);
 if(filter==='cheap')arr.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
 if(filter==='expensive')arr.sort((a,b)=>Number(b.price||0)-Number(a.price||0));
 if(filter==='city')arr=arr.filter(c=>c.city===state.city).sort((a,b)=>Number(b.postedAt||0)-Number(a.postedAt||0));
 if(filter==='new')arr.sort((a,b)=>Number(b.postedAt||0)-Number(a.postedAt||0));
 const perPage=8,totalPages=Math.max(1,Math.ceil(arr.length/perPage));
 page=Math.max(0,Math.min(Number(page)||0,totalPages-1));
 const start=page*perPage,visible=arr.slice(start,start+perPage),garageCount=Array.isArray(state.cars)?state.cars.length:(state.car?1:0);
 render(`<div class="app">${head('Авто')}
   <section class="auto-market-hero">
     <div class="auto-market-hero-copy"><small>AUTOMARKET · LIVE</small><h3>Рынок автомобилей</h3><p>Новые объявления появляются автоматически каждые 6 игровых часов.</p></div>
     <div class="auto-market-wallet"><span>Свободные деньги</span><b>${money(state.money)}</b></div>
   </section>
   <div class="auto-market-stats">
     <div><b>${arr.length}</b><span>объявлений</span></div>
     <div><b>${garageCount}/3</b><span>в гараже</span></div>
     <div><b>${Number(state.rep||0)}</b><span>репутация</span></div>
   </div>
   <div class="market-search-box">
     <span>🔎</span>
     <input id="marketSearch" type="text" value="${String(marketSearchTerm||'').replace(/"/g,'&quot;')}" placeholder="Марка, модель или город" onkeydown="if(event.key==='Enter')marketSearch()">
     ${marketSearchTerm?'<button onclick="clearMarketSearch()">Сбросить</button>':'<button onclick="marketSearch()">Поиск</button>'}
   </div>
   <div class="filters auto-market-filters">
     <button class="${filter==='all'?'active':''}" onclick="market('all',0)">Все</button>
     <button class="${filter==='cheap'?'active':''}" onclick="market('cheap',0)">↑ Дешевле</button>
     <button class="${filter==='expensive'?'active':''}" onclick="market('expensive',0)">↓ Дороже</button>
     <button class="${filter==='city'?'active':''}" onclick="market('city',0)">📍 ${state.city}</button>
     <button class="${filter==='new'?'active':''}" onclick="market('new',0)">🆕 Новые</button>
   </div>
   ${visible.length?'':'<div class="note"><b>Ничего не найдено</b><p class="muted">Попробуй другое название машины или сбрось поиск.</p></div>'}
   <div class="auto-market-list">
   ${visible.map(c=>{const potential=Number(c.market||0)-Number(c.price||0)-Number(c.repair||0),pct=Math.round(potential/Math.max(1,Number(c.price||0)+Number(c.repair||0))*100);return `<div class="market auto-market-card" onclick="carView(${c.id})">
     <div class="pic auto-market-photo" style="background-image:linear-gradient(180deg,#0001,#0007),url('${photo(c)}'),url('${fallbackPhoto(c)}');background-position:${c.photoPosition||'50% 50%'}"><span class="auto-card-city">📍 ${c.city}</span></div>
     <div class="auto-market-info">
       <div class="auto-market-title"><b>${c.name}</b><strong>${money(c.price)}</strong></div>
       <div class="auto-market-specs"><span>🆔 ${c.listingId?c.listingId.slice(-5):('M'+c.id)}</span><span>📅 ${c.year}</span><span>🛣️ ${c.km.toLocaleString('ru-RU')} км</span><span>🎨 ${c.color||'—'}</span><span>🚘 ${c.body||'—'}</span></div>
       <div class="auto-market-bottom">
         <span>Рынок <b>${money(c.market)}</b></span>
         <span class="${potential>=0?'auto-profit':'auto-loss'}">Потенциал ${potential>=0?'+':''}${money(potential)} · ${pct>=0?'+':''}${pct}%</span>
       </div>
     </div>
   </div>`}).join('')}
   </div>
   ${visible.length?`<div class="auto-market-pagination">
     <button class="action" ${page<=0?'disabled':''} onclick="market('${filter}',${page-1})">‹ Назад</button>
     <div><small>СТРАНИЦА</small><b>${page+1} / ${totalPages}</b></div>
     <button class="action" ${page>=totalPages-1?'disabled':''} onclick="market('${filter}',${page+1})">Дальше ›</button>
   </div>`:''}
 </div>`)
}
function marketInspectionKey(c){return c&&c.listingId?c.listingId:('market-'+c.id+'-'+c.year+'-'+c.km)}
function marketInspectionData(c){
 if(!state.marketInspections||typeof state.marketInspections!=='object')state.marketInspections={};
 return state.marketInspections[marketInspectionKey(c)]||null;
}
function purchaseFlowHtml(step){
 const labels=['Объявление','Осмотр','Торг','Покупка'];
 return '<div class="purchase-flow">'+labels.map(function(label,i){var n=i+1,cls=n<step?'done':(n===step?'active':'');return '<div class="purchase-step '+cls+'"><b>'+n+'</b><span>'+label+'</span></div>';}).join('')+'</div>';
}
function marketInspection(id){
 const c=makes[id];if(!c)return market();
 const key=marketInspectionKey(c),done=marketInspectionData(c);
 if(done){
   const estimate=done.mode==='expert'?'<div class="hero-line"><span>Ориентир ремонта</span><strong>'+money(done.repairLow)+' – '+money(done.repairHigh)+'</strong></div>':'';
   render('<div class="app">'+head('Осмотр автомобиля')+purchaseFlowHtml(2)+'<div class="pic car-detail-photo" style="background-image:linear-gradient(180deg,#0000 45%,#0009),url(\''+photo(c)+'\'),url(\''+fallbackPhoto(c)+'\')"><span class="market-city-badge">📍 '+c.city+'</span></div><div class="note inspection-result"><small>РЕЗУЛЬТАТ ОСМОТРА</small><h3>'+(done.mode==='expert'?'🧑‍🔧 Осмотр экспертом':'👀 Самостоятельный осмотр')+'</h3><div class="hero-line"><span>Объявление</span><strong>'+key+'</strong></div><div class="hero-line"><span>Обнаружено</span><strong>'+done.risk+'</strong></div>'+estimate+'<p class="muted">'+(done.mode==='expert'?'Эксперт снижает неопределённость и даёт более сильную позицию в торге. Скрытые дефекты всё ещё возможны.':'Ты заметил основной внешний риск. Без эксперта часть проблем может остаться незамеченной.')+'</p></div><button class="action green" onclick="deal('+id+')">💬 Перейти к торгу</button><button class="action" onclick="carView('+id+')">‹ Назад к машине</button></div>');
   return;
 }
 render('<div class="app">'+head('Осмотр автомобиля')+purchaseFlowHtml(2)+'<div class="pic car-detail-photo" style="background-image:linear-gradient(180deg,#0000 45%,#0009),url(\''+photo(c)+'\'),url(\''+fallbackPhoto(c)+'\')"><span class="market-city-badge">📍 '+c.city+'</span></div><div class="note"><small>ПЕРЕД ТОРГОМ</small><h3>'+c.name+'</h3><p class="muted">Сначала реши, насколько глубоко проверять машину. Осмотр не гарантирует отсутствие скрытых дефектов.</p></div><div class="inspection-choice"><div><b>👀 Самостоятельно</b><small>Бесплатно · увидишь основной заметный риск</small><button class="action" onclick="completeMarketInspection('+id+',\'self\')">Осмотреть самому</button></div><div><b>🧑‍🔧 Эксперт</b><small>3 000 ₽ · ориентир ремонта + преимущество в торге</small><button class="action green" onclick="completeMarketInspection('+id+',\'expert\')">Позвать эксперта</button></div></div><button class="action" onclick="carView('+id+')">‹ Назад к объявлению</button></div>');
}
function completeMarketInspection(id,mode){
 const c=makes[id];if(!c)return market();
 const expert=mode==='expert',cost=expert?3000:0;
 if(cost&&Number(state.money||0)<cost)return alert('Для осмотра экспертом нужно 3 000 ₽.');
 if(cost)state.money-=cost;
 if(!state.marketInspections||typeof state.marketInspections!=='object')state.marketInspections={};
 const low=Math.max(1000,Math.round(Number(c.repair||0)*.75/1000)*1000),high=Math.max(low,Math.round(Number(c.repair||0)*1.25/1000)*1000);
 state.marketInspections[marketInspectionKey(c)]={mode:expert?'expert':'self',risk:c.risk,repairLow:low,repairHigh:high,negotiationBonus:expert?.02:.01};
 objective.textContent='Осмотр завершён';
 objectiveSub.textContent='Используй найденный риск в переговорах с продавцом.';
 log((expert?'Эксперт осмотрел ':'Самостоятельно осмотрен ')+c.name+'. Найден риск: '+c.risk+'.');
 marketInspection(id);
}
function carView(id){
 let c=makes[id];if(!c)return market();
 let inspection=marketInspectionData(c);
 let profit=Number(c.market||0)-Number(c.price||0)-Number(c.repair||0),margin=Math.round(profit/Math.max(1,Number(c.price||1))*100),needRep=(typeof requiredRepForCar==='function'?requiredRepForCar(c):0),repOk=Number(state.rep||0)>=needRep,canAfford=Number(state.money||0)>=Number(c.price||0);
 render(`<div class="app auto-car-view">${head(c.name)}
   ${purchaseFlowHtml(inspection?3:2)}
   <div class="pic car-detail-photo" style="background-image:linear-gradient(180deg,#0000 45%,#0009),url('${photo(c)}'),url('${fallbackPhoto(c)}')"><span class="market-city-badge">📍 ${c.city}</span><span class="car-year-badge">${c.year}</span></div>
   <div class="car-detail-heading"><div><small>ЦЕНА ПРОДАВЦА</small><div class="price">${money(c.price)}</div></div><span class="car-km">${c.km.toLocaleString('ru-RU')} км</span></div>
   <div class="note" style="margin:8px 0"><div class="hero-line"><span>ID объявления</span><strong>${c.listingId||('M-'+c.id)}</strong></div><div class="hero-line"><span>Цвет</span><strong>${c.color||'—'}</strong></div><div class="hero-line"><span>Кузов</span><strong>${c.body||'—'}</strong></div><div class="hero-line"><span>Комплектация</span><strong>${c.trim||'—'}</strong></div><div class="hero-line"><span>Состояние</span><strong>${c.conditionLabel||'Неизвестно'}</strong></div></div>
   <div class="deal-score car-economics">
     <span>РЫНОК<b>${money(c.market)}</b></span>
     <span>РЕМОНТ ~<b>${money(c.repair)}</b></span>
     <span>ПОТЕНЦИАЛ<b class="${profit>=0?'profit':'market-bad'}">${profit>=0?'+':''}${money(profit)}</b></span>
   </div>
   <div class="note car-opportunity"><b>${profit>=0?'📈 Потенциал сделки':'📉 Слабая экономика'}</b><p class="muted">Расчётная маржа: ${margin}% до дополнительных скрытых расходов и торга.</p></div>
   ${inspection?'<div class="note inspection-brief"><b>'+(inspection.mode==='expert'?'🧑‍🔧 Эксперт осмотрел машину':'👀 Ты осмотрел машину')+'</b><p class="muted">Обнаружено: '+inspection.risk+(inspection.mode==='expert'?'. Ремонт ориентировочно '+money(inspection.repairLow)+' – '+money(inspection.repairHigh):'. Детальная стоимость пока неизвестна')+'.</p></div>':'<div class="warning"><b>⚠ Машина ещё не осмотрена</b><br>Перед торгом лучше проверить автомобиль. Скрытые проблемы возможны даже после осмотра.</div>'}
   <div class="car-buy-status">
     <span><small>На руках</small><b>${money(state.money)}</b></span>
     <span><small>Репутация</small><b>${Number(state.rep||0)}${needRep?' / '+needRep:''}</b></span>
   </div>
   ${!repOk?'<div class="note"><b>🔒 Автомобиль пока недоступен</b><p class="muted">Для этого уровня сделки нужно '+needRep+' репутации.</p></div>':''}
   ${repOk&&!canAfford?'<div class="note"><b>🏦 Не хватает '+money(c.price-state.money)+'</b><p class="muted">Можно накопить или проверить доступный лимит в Банке.</p></div>':''}
   <button class="action" onclick="marketInspection(${id})">🔎 ${inspection?'Результат осмотра':'Осмотреть автомобиль'}</button>
   <button class="action green" onclick="deal(${id})" ${repOk?'':'disabled'}>💬 ${inspection?'Перейти к торгу':'Связаться с продавцом'}</button>
 </div>`)
}
function inspect(id){return marketInspection(id)}
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
