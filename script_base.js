const KEY='autoflip-v7-save';
const cities=(window.AUTOFLIP_CITIES||['Москва','Санкт-Петербург','Нижний Новгород','Екатеринбург','Киров','Краснодар','Пермь','Калининград','Сургут','Чита','Казань','Владивосток','Ярославль','Ростов','Махачкала','Уфа','Воронеж','Оренбург','Тверь','Самара']).slice();
const cityFactor=Object.fromEntries(cities.map((city,index)=>[city,.94+(index%7)*.015]));
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
'Chevrolet Lacetti':commons('Chevrolet Lacetti front.jpg'),
'Chevrolet Cruze':commons('Chevrolet Cruze J300 sedan China 2012-06-16.jpg'),
'Opel Astra J':commons('Opel Astra J.JPG'),
'Nissan Almera':commons('Nissan Almera.jpg'),
'Mitsubishi Lancer X':commons('Mitsubishi Lancer X 001.jpg'),
'Mazda 3':commons('Mazda 3 3rd generation sedan.jpg'),
'Skoda Octavia':commons('Skoda Octavia III facelift IMG001.jpg'),
'Hyundai Elantra':commons('Hyundai Elantra (AD).jpg'),
'Kia Ceed':commons("Kia Ceed - Mondial de l'Automobile de Paris 2018 - 001.jpg"),
'Renault Duster':commons('Renault Duster.JPG'),
'Nissan Qashqai':commons('Nissan Qashqai J11 Enmis.jpeg'),
'Mazda 6':commons('Mazda6 (GJ) front.jpg'),
'Honda Accord':commons('HONDA ACCORD (CR1-CR3, CR6-CR7, CT1-CT2) China (63).jpg'),
'Subaru Forester':commons('Subaru Forester 2018 (SK) CUV Front.jpg'),
'Chery Tiggo 7 Pro':commons('Chery Tiggo7 Pro 2023 (53631773981).jpg'),
'Geely Coolray':commons('Coolray Front.jpg'),
'Volvo XC60':commons('Volvo XC60 II Shishi 01 2022-09-09.jpg'),
'Lexus RX 350':commons('2018 Lexus RX 350L 3.5L front 3.24.19.jpg'),
'Toyota Land Cruiser Prado':commons('Toyota Land Cruiser Prado 150.jpg')
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
 <button onclick="window.autoBankHome&&autoBankHome()"><div class="icon">🏦</div><small>Банк</small></button>
 <button onclick="mapApp()"><div class="icon blue">🗺️</div><small>Карты</small></button>
 <button onclick="realty()"><div class="icon">🏠</div><small>Дом</small></button>
 <button onclick="contacts()"><div class="icon blue">📞</div><small>Телефон</small></button>
 <button onclick="notes()"><div class="icon">📝</div><small>Заметки</small></button>
 <button onclick="profile()"><div class="icon">👤</div><small>Профиль</small></button>
 <button onclick="newsApp()"><div class="icon red">📰</div><small>Новости</small></button>
 <button onclick="gamesApp()"><div class="icon purple">🎮</div><small>Games</small></button>
 <button onclick="settings()"><div class="icon">⚙️</div><small>Настройки</small></button>
 </div><div class="dock"><button onclick="messages()"><div class="icon blue">💬</div></button><button onclick="market()"><div class="icon green">🚗</div></button><button onclick="contacts()"><div class="icon">📞</div></button><button onclick="window.autoBankHome&&autoBankHome()"><div class="icon">🏦</div></button></div></div></div>`)
}
function lockScreen(){render(`<div class="lock" onclick="unlock()">${status()}<div class="time">${now()}</div><div class="date">${dateText()}</div><div class="lock-card"><b>🔔 AutoFlip</b><small>Нажми, чтобы разблокировать телефон</small></div><div class="swipe">▲ НАЖМИТЕ ДЛЯ РАЗБЛОКИРОВКИ</div></div>`)}
function unlock(){home()}

function ensureMarketFavorites(){
 if(!Array.isArray(state.marketFavorites))state.marketFavorites=[];
 return state.marketFavorites;
}
function marketFavoriteId(car){return car&&car.listingId?car.listingId:''}
function isMarketFavorite(car){
 var id=marketFavoriteId(car);return !!id&&ensureMarketFavorites().indexOf(id)>=0;
}
function toggleMarketFavorite(id,event,source){
 if(event){event.preventDefault();event.stopPropagation();}
 var car=makes[id];if(!car||!car.listingId)return;
 var list=ensureMarketFavorites(),key=car.listingId,pos=list.indexOf(key);
 if(pos>=0)list.splice(pos,1);else list.unshift(key);
 localStorage.setItem(KEY,JSON.stringify(state));
 if(source==='favorites')return autoFavorites();
 if(source==='detail')return carView(id);
 if(event&&event.currentTarget){
   var saved=list.indexOf(key)>=0;
   event.currentTarget.classList.toggle('saved',saved);
   event.currentTarget.textContent=saved?'♥':'♡';
   event.currentTarget.setAttribute('aria-label',saved?'Убрать из избранного':'Добавить в избранное');
 }
 setTimeout(function(){if(typeof mountAutoBottomNav==='function')mountAutoBottomNav('listings');},40);
}
function autoBottomUnread(){
 return Array.isArray(state.buyerInbox)?state.buyerInbox.filter(function(x){return x&&!x.read&&x.status!=='declined';}).length:0;
}
function mountAutoBottomNav(active){
 var screen=document.getElementById('screen');if(!screen)return;
 var old=document.getElementById('autoBottomNav');if(old)old.remove();
 var app=screen.querySelector('.app');if(!app)return;
 app.classList.add('auto-market-tab-page');
 var fav=ensureMarketFavorites().length,unread=autoBottomUnread();
 var nav=document.createElement('nav');nav.id='autoBottomNav';nav.className='auto-bottom-nav';
 nav.innerHTML=
   '<button class="auto-tab '+(active==='listings'?'active':'')+'" onclick="market(\'all\',0)"><span class="auto-tab-icon">🚗</span><small>Объявления</small></button>'+
   '<button class="auto-tab '+(active==='favorites'?'active':'')+'" onclick="autoFavorites()"><span class="auto-tab-icon">♡</span><small>Избранное</small>'+(fav?'<i class="auto-tab-badge">'+(fav>9?'9+':fav)+'</i>':'')+'</button>'+
   '<button class="auto-tab auto-tab-plus '+(active==='sell'?'active':'')+'" onclick="autoSellHub()" aria-label="Продать автомобиль"><span>+</span></button>'+
   '<button class="auto-tab '+(active==='messages'?'active':'')+'" onclick="messages()"><span class="auto-tab-icon">💬</span><small>Сообщения</small>'+(unread?'<i class="auto-tab-badge">'+(unread>9?'9+':unread)+'</i>':'')+'</button>'+
   '<button class="auto-tab '+(active==='profile'?'active':'')+'" onclick="profile()"><span class="auto-tab-icon">👤</span><small>Профиль</small></button>';
 screen.appendChild(nav);
}
function autoFavorites(){
 var ids=ensureMarketFavorites().slice(),live=ids.map(function(key){return makes.find(function(c){return c.listingId===key;});}).filter(Boolean),removed=Math.max(0,ids.length-live.length);
 state.marketFavorites=live.map(function(c){return c.listingId;});
 localStorage.setItem(KEY,JSON.stringify(state));
 var cards=live.map(function(c){
   var potential=Number(c.market||0)-Number(c.price||0)-Number(c.repair||0),pct=Math.round(potential/Math.max(1,Number(c.price||0)+Number(c.repair||0))*100);
   return '<div class="market auto-market-card" onclick="carView('+c.id+')">'+
     '<div class="pic auto-market-photo" style="background-image:linear-gradient(180deg,#0001,#0007),url(\''+photo(c)+'\'),url(\''+fallbackPhoto(c)+'\');background-position:'+(c.photoPosition||'50% 50%')+'">'+
       '<span class="auto-card-city">📍 '+c.city+'</span><button class="auto-favorite-btn saved" onclick="toggleMarketFavorite('+c.id+',event,\'favorites\')" aria-label="Убрать из избранного">♥</button>'+
     '</div><div class="auto-market-info"><div class="auto-market-title"><b>'+c.name+'</b><strong>'+money(c.price)+'</strong></div>'+
     '<div class="auto-market-specs"><span>🆔 '+(c.listingId?c.listingId.slice(-5):('M'+c.id))+'</span><span>📅 '+c.year+'</span><span>🛣️ '+c.km.toLocaleString('ru-RU')+' км</span><span>🚘 '+(c.body||'—')+'</span></div>'+
     '<div class="auto-market-bottom"><span>Рынок <b>'+money(c.market)+'</b></span><span class="'+(potential>=0?'auto-profit':'auto-loss')+'">Потенциал '+(potential>=0?'+':'')+money(potential)+' · '+(pct>=0?'+':'')+pct+'%</span></div></div></div>';
 }).join('');
 render('<div class="app">'+head('Избранное')+
   '<div class="auto-tab-intro"><div><small>AUTOMARKET</small><h3>Избранные объявления</h3><p>Сохраняй интересные машины и возвращайся к ним до того, как объявление уйдёт с рынка.</p></div><b>'+live.length+'</b></div>'+
   (removed?'<div class="note"><b>📴 '+removed+' объявл. уже снято</b><p class="muted">Они автоматически удалены из избранного.</p></div>':'')+
   (cards?'<div class="auto-market-list">'+cards+'</div>':'<div class="note auto-empty-tab"><b>♡ Пока пусто</b><p class="muted">Нажми на сердечко в объявлении, чтобы сохранить машину сюда.</p><button class="action green" onclick="market(\'all\',0)">Смотреть объявления</button></div>')+
   '</div>');
 setTimeout(function(){mountAutoBottomNav('favorites');},130);
}
function autoSellCarKey(c){return c?(c._garageId||('car-'+c.id+'-'+c.buy)):''}
function autoSelectSellCar(index){
 var cars=Array.isArray(state.cars)?state.cars:[],c=cars[index];if(!c)return autoSellHub();
 state.car=c;localStorage.setItem(KEY,JSON.stringify(state));return sellCar();
}
function autoSellHub(){
 var cars=Array.isArray(state.cars)?state.cars.filter(Boolean):[],active=state.activeListing&&state.activeListing.status==='active'?state.activeListing:null;
 var cards=cars.map(function(c,i){
   var listed=active&&active.carKey===autoSellCarKey(c),marketValue=c.repaired?Math.round(Number(c.market||0)*1.02):Number(c.market||0);
   return '<button class="auto-sell-car" onclick="autoSelectSellCar('+i+')"><div class="auto-sell-car-photo" style="background-image:url(\''+photo(c)+'\')"></div><div><small>'+(listed?'🟢 ОБЪЯВЛЕНИЕ АКТИВНО':'ТВОЯ МАШИНА')+'</small><b>'+c.name+'</b><span>'+c.year+' · '+c.km.toLocaleString('ru-RU')+' км</span><strong>'+(listed?'Открыть объявление':'Рынок ~ '+money(marketValue))+'</strong></div><em>›</em></button>';
 }).join('');
 render('<div class="app">'+head('Продать автомобиль')+
   '<div class="auto-tab-intro sell"><div><small>МОИ АВТО</small><h3>Выбери машину для продажи</h3><p>Нажми на купленный автомобиль, чтобы создать или открыть его объявление.</p></div><b>'+cars.length+'/'+(typeof window.garageCapacity==='function'?window.garageCapacity():2)+'</b></div>'+
   (cards||'<div class="note auto-empty-tab"><b>🚗 У тебя пока нет машин</b><p class="muted">Купи автомобиль в «Объявлениях», и он появится здесь.</p><button class="action green" onclick="market(\'all\',0)">Перейти к объявлениям</button></div>')+
   '</div>');
 setTimeout(function(){mountAutoBottomNav('sell');},130);
}

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
function diversifyMarketModels(arr){
 const groups=new Map();
 arr.forEach(car=>{const key=String(car.name||'Автомобиль');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(car)});
 const result=[];let round=0,added=true;
 while(added){added=false;for(const list of groups.values()){if(list[round]){result.push(list[round]);added=true}}round++}
 return result;
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
 const consumedIds=new Set([...(Array.isArray(state.consumedMarketListingIds)?state.consumedMarketListingIds:[]),...(Array.isArray(state.cars)?state.cars.map(c=>c&&c.listingId).filter(Boolean):[]),...(state.car&&state.car.listingId?[state.car.listingId]:[])].map(String));
 let arr=[...makes].filter(c=>(c.marketActive!==false)&&(!c.listingId||!consumedIds.has(String(c.listingId))));
 const selectedMarketCity=cities.includes(state.marketCityFilter)?state.marketCityFilter:'';
 if(selectedMarketCity)arr=arr.filter(c=>c.city===selectedMarketCity);
 const q=String(marketSearchTerm||'').trim().toLowerCase();
 if(q)arr=arr.filter(c=>[c.name,c.city,c.year,String(c.km),c.color,c.body,c.trim,c.listingId].join(' ').toLowerCase().includes(q));
 if(filter==='all')arr=shuffleMarketAll(arr,Number(page||0)===0);
 if(filter==='cheap')arr.sort((a,b)=>Number(a.price||0)-Number(b.price||0));
 if(filter==='expensive')arr.sort((a,b)=>Number(b.price||0)-Number(a.price||0));
 if(filter==='city')arr=arr.filter(c=>c.city===state.city).sort((a,b)=>Number(b.postedAt||0)-Number(a.postedAt||0));
 if(filter==='new')arr.sort((a,b)=>Number(b.postedAt||0)-Number(a.postedAt||0));
 arr=diversifyMarketModels(arr);
 const perPage=8,totalPages=Math.max(1,Math.ceil(arr.length/perPage));
 page=Math.max(0,Math.min(Number(page)||0,totalPages-1));
 const start=page*perPage,visible=arr.slice(start,start+perPage),garageCount=Array.isArray(state.cars)?state.cars.length:(state.car?1:0);
 render(`<div class="app">${head('Объявления')}
   <section class="auto-market-hero">
     <div class="auto-market-hero-copy"><small>AUTOMARKET · LIVE</small><h3>Рынок автомобилей</h3><div class="auto-market-refresh-line"><p>Новые объявления появляются автоматически каждые 6 игровых часов.</p><span id="autoMarketCountdown">До обновления —</span></div></div>
     <div class="auto-market-wallet"><span>Свободные деньги</span><b>${money(state.money)}</b></div>
   </section>
   <div class="auto-market-stats">
     <div><b>${arr.length}</b><span>объявлений</span></div>
     <div><b>${garageCount}/${typeof window.garageCapacity==='function'?window.garageCapacity():2}</b><span>в гараже</span></div>
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
     <button class="${selectedMarketCity?'active':''}" onclick="marketCityPicker()">📍 ${selectedMarketCity||'Выбрать город'}</button>
     <button class="${filter==='new'?'active':''}" onclick="market('new',0)">🆕 Новые</button>
   </div>
   ${visible.length?'':'<div class="note"><b>Ничего не найдено</b><p class="muted">Попробуй другое название машины или сбрось поиск.</p></div>'}
   <div class="auto-market-list">
   ${visible.map(c=>{const potential=Number(c.market||0)-Number(c.price||0),pct=Math.round(potential/Math.max(1,Number(c.price||1))*100);return `<div class="market auto-market-card" onclick="carView(${c.id})">
     <div class="pic auto-market-photo" style="background-image:linear-gradient(180deg,#0001,#0007),url('${photo(c)}'),url('${fallbackPhoto(c)}');background-position:${c.photoPosition||'50% 50%'}"><span class="auto-card-city">📍 ${c.city}</span><button class="auto-favorite-btn ${isMarketFavorite(c)?'saved':''}" onclick="toggleMarketFavorite(${c.id},event)" aria-label="${isMarketFavorite(c)?'Убрать из избранного':'Добавить в избранное'}">${isMarketFavorite(c)?'♥':'♡'}</button></div>
     <div class="auto-market-info">
       <div class="auto-market-title"><b>${c.name}</b><strong>${money(c.price)}</strong></div>
       <div class="auto-market-specs"><span>🆔 ${c.listingId?c.listingId.slice(-5):('M'+c.id)}</span><span>📅 ${c.year}</span><span>🛣️ ${c.km.toLocaleString('ru-RU')} км</span><span>🚘 ${c.body||'—'}</span>${c.starterOffer?'<span>💸 Стартовый авто</span>':''}</div>
       <div class="auto-market-bottom">
         <span>Рынок <b>${money(c.market)}</b></span>
         <span class="${potential>=0?'auto-profit':'auto-loss'}">Разница ${potential>=0?'+':''}${money(potential)} · ${pct>=0?'+':''}${pct}%</span>
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
 const value=state.marketInspections[marketInspectionKey(c)]||null;
 return value&&value.kind==='diagnostic-v2'?value:null;
}
function purchaseFlowHtml(step){
 const labels=['Объявление','Диагностика','Торг','Покупка'];
 return '<div class="purchase-flow">'+labels.map(function(label,i){var n=i+1,cls=n<step?'done':(n===step?'active':'');return '<div class="purchase-step '+cls+'"><b>'+n+'</b><span>'+label+'</span></div>';}).join('')+'</div>';
}
function marketDiagnosticCost(c,mode){
 const market=Math.max(10000,Number(c&&c.market||0));
 return mode==='full'?Math.max(1,Math.floor(market/3)):Math.max(1,Math.floor(market*.10));
}
function marketInspection(id){
 const c=makes[id];if(!c)return market();
 const key=marketInspectionKey(c),done=marketInspectionData(c);
 const standardCost=marketDiagnosticCost(c,'standard'),fullCost=marketDiagnosticCost(c,'full');
 if(done){
   let resultHtml='';
   if(done.found){
     const after=Math.max(10000,Math.floor(Number(c.market||0)*(1-Number(done.loss||0))));
     resultHtml='<div class="condition-card broken"><small>'+(done.mode==='full'?'ПОЛНАЯ':'СТАНДАРТНАЯ')+' ДИАГНОСТИКА</small><h3>⚠️ '+done.faultName+'</h3><p>Поломка обнаружена до покупки. Если купить машину и не ремонтировать её, рыночная стоимость снизится на '+Math.round(Number(done.loss||0)*100)+'%.</p><div class="hero-line"><span>Цена ремонта</span><strong>'+money(done.faultCost)+'</strong></div><div class="hero-line"><span>Рынок после покупки</span><strong>'+money(after)+'</strong></div></div>';
   }else if(done.healthyConfirmed){
     resultHtml='<div class="condition-card healthy"><small>ПОЛНАЯ ДИАГНОСТИКА</small><h3>✅ Автомобиль исправен</h3><p>Полная диагностика не обнаружила технических неисправностей.</p></div>';
   }else{
     resultHtml='<div class="condition-card unknown"><small>СТАНДАРТНАЯ ДИАГНОСТИКА</small><h3>Поломок не обнаружено</h3><p>Стандартная диагностика находит существующую скрытую поломку с шансом 30%, поэтому результат не гарантирует, что автомобиль исправен.</p></div>';
   }
   const fullUpgrade=(done.mode==='standard'&&!done.found)?'<button class="action" onclick="completeMarketInspection('+id+',\'full\')">🧰 Провести полную диагностику · '+money(fullCost)+'</button>':'';
   render('<div class="app">'+head('Диагностика')+purchaseFlowHtml(2)+'<div class="pic car-detail-photo" style="background-image:linear-gradient(180deg,#0000 45%,#0009),url(\''+photo(c)+'\'),url(\''+fallbackPhoto(c)+'\')"><span class="market-city-badge">📍 '+c.city+'</span></div>'+resultHtml+'<div class="note"><div class="hero-line"><span>Потрачено на диагностику</span><strong>'+money(done.totalSpent||done.cost||0)+'</strong></div></div>'+fullUpgrade+'<button class="action green" onclick="deal('+id+')">💬 Перейти к торгу</button><button class="action" onclick="carView('+id+')">‹ Назад к машине</button></div>');
   return;
 }
 render('<div class="app">'+head('Диагностика')+purchaseFlowHtml(2)+'<div class="pic car-detail-photo" style="background-image:linear-gradient(180deg,#0000 45%,#0009),url(\''+photo(c)+'\'),url(\''+fallbackPhoto(c)+'\')"><span class="market-city-badge">📍 '+c.city+'</span></div><div class="note"><small>ПРОВЕРКА ДО ПОКУПКИ</small><h3>'+c.name+'</h3><p class="muted">Выбери глубину диагностики. Если поломка будет найдена, ты увидишь её название и стоимость ремонта ещё до торга.</p></div><div class="diagnostic-choice-v2"><div><small>СТАНДАРТНАЯ</small><b>'+money(standardCost)+'</b><span>10% от рыночной цены · шанс обнаружить существующую поломку 30%</span><button class="action" onclick="completeMarketInspection('+id+',\'standard\')">🔎 Стандартная</button></div><div><small>ПОЛНАЯ</small><b>'+money(fullCost)+'</b><span>1/3 рыночной цены · шанс обнаружить поломку 100%</span><button class="action green" onclick="completeMarketInspection('+id+',\'full\')">🧰 Полная</button></div></div><button class="action" onclick="carView('+id+')">‹ Назад к объявлению</button></div>');
}
function completeMarketInspection(id,mode){
 const c=makes[id];if(!c)return market();
 const full=mode==='full',cost=marketDiagnosticCost(c,full?'full':'standard');
 if(Number(state.money||0)<cost)return alert('Не хватает '+money(cost-Number(state.money||0))+' на диагностику.');
 if(typeof ensureMarketFlipCondition!=='function')return alert('Диагностика временно недоступна. Обнови страницу и попробуй ещё раз.');
 const condition=ensureMarketFlipCondition(c);
 state.money=Number(state.money||0)-cost;
 if(!state.marketInspections||typeof state.marketInspections!=='object')state.marketInspections={};
 const key=marketInspectionKey(c),previous=marketInspectionData(c),found=!condition.healthy&&(full||Math.random()<.30);
 const result={
   kind:'diagnostic-v2',
   mode:full?'full':'standard',
   cost:cost,
   totalSpent:Number(previous&&previous.totalSpent||0)+cost,
   found:found,
   healthyConfirmed:full&&condition.healthy,
   faultName:found?condition.name:'',
   faultCost:found?Number(condition.cost||0):0,
   loss:found?Number(condition.loss||0):0,
   risk:found?condition.name:(full&&condition.healthy?'автомобиль исправен':'поломок не обнаружено'),
   negotiationBonus:found?(full?.05:.03):(full?.01:0)
 };
 state.marketInspections[key]=result;
 c.prePurchaseDiagnostic=Object.assign({},result);
 objective.textContent=found?'Поломка найдена':'Диагностика завершена';
 objectiveSub.textContent=found?(condition.name+' · ремонт '+money(condition.cost)+'.'):(full&&condition.healthy?'Автомобиль исправен.':'Стандартная диагностика поломок не обнаружила.');
 log((full?'Полная':'Стандартная')+' диагностика '+c.name+': '+(found?('обнаружено — '+condition.name+', ремонт '+money(condition.cost)):(full&&condition.healthy?'автомобиль исправен':'поломок не обнаружено'))+'.');
 if(typeof persist==='function')persist();else localStorage.setItem(KEY,JSON.stringify(state));
 marketInspection(id);
}
function carView(id){
 let c=makes[id];if(!c)return market();
 let inspection=marketInspectionData(c);
 let spread=Number(c.market||0)-Number(c.price||0),needRep=(typeof requiredRepForCar==='function'?requiredRepForCar(c):0),repOk=Number(state.rep||0)>=needRep,canAfford=Number(state.money||0)>=Number(c.price||0);
 let conditionText='неизвестно',diagBrief='<div class="warning"><b>🔍 Диагностика не проведена</b><br>Можно купить машину сразу или сначала проверить её техническое состояние.</div>';
 if(inspection){
   if(inspection.found){conditionText='обнаружена поломка';diagBrief='<div class="note inspection-brief"><b>⚠️ '+inspection.faultName+'</b><p class="muted">Диагностика выявила поломку. Ремонт: '+money(inspection.faultCost)+'. Это даёт дополнительный аргумент в торге.</p></div>';}
   else if(inspection.healthyConfirmed){conditionText='исправна';diagBrief='<div class="note inspection-brief"><b>✅ Полная диагностика: исправна</b><p class="muted">Технических поломок не обнаружено.</p></div>';}
   else{conditionText='не подтверждено';diagBrief='<div class="note inspection-brief"><b>🟡 Стандартная диагностика</b><p class="muted">Поломок не обнаружено, но шанс обнаружения существующей неисправности — 30%.</p></div>';}
 }
 render(`<div class="app auto-car-view">${head(c.name)}
   ${purchaseFlowHtml(inspection?3:2)}
   <div class="pic car-detail-photo" style="background-image:linear-gradient(180deg,#0000 45%,#0009),url('${photo(c)}'),url('${fallbackPhoto(c)}')"><span class="market-city-badge">📍 ${c.city}</span><span class="car-year-badge">${c.year}</span></div>
   <div class="car-detail-heading"><div><small>ЦЕНА ПРОДАВЦА</small><div class="price">${money(c.price)}</div></div><span class="car-km">${c.km.toLocaleString('ru-RU')} км</span></div>
   <div class="note" style="margin:8px 0"><div class="hero-line"><span>ID объявления</span><strong>${c.listingId||('M-'+c.id)}</strong></div><div class="hero-line"><span>Кузов</span><strong>${c.body||'—'}</strong></div><div class="hero-line"><span>Комплектация</span><strong>${c.trim||'—'}</strong></div><div class="hero-line"><span>Тех. состояние</span><strong>${conditionText}</strong></div></div>
   <div class="deal-score car-economics">
     <span>РЫНОК<b>${money(c.market)}</b></span>
     <span>ЦЕНА<b>${money(c.price)}</b></span>
     <span>РАЗНИЦА<b class="${spread>=0?'profit':'market-bad'}">${spread>=0?'+':''}${money(spread)}</b></span>
   </div>
   ${diagBrief}
   <div class="car-buy-status">
     <span><small>На руках</small><b>${money(state.money)}</b></span>
     <span><small>Репутация</small><b>${Number(state.rep||0)}${needRep?' / '+needRep:''}</b></span>
   </div>
   ${!repOk?'<div class="note"><b>🔒 Автомобиль пока недоступен</b><p class="muted">Для этого уровня сделки нужно '+needRep+' репутации.</p></div>':''}
   ${repOk&&!canAfford?'<div class="note"><b>🏦 Не хватает '+money(c.price-state.money)+'</b><p class="muted">Можно накопить или проверить доступный лимит в Банке.</p></div>':''}
   <button class="action auto-detail-favorite ${isMarketFavorite(c)?'saved':''}" onclick="toggleMarketFavorite(${id},event,'detail')">${isMarketFavorite(c)?'♥ В избранном':'♡ Добавить в избранное'}</button>
   <button class="action" onclick="marketInspection(${id})">🔎 ${inspection?'Результат диагностики':'Провести диагностику'}</button>
   <button class="action green" onclick="deal(${id})" ${repOk?'':'disabled'}>💬 Перейти к торгу</button>
 </div>`)
}
function inspect(id){return marketInspection(id)}
function deal(id){let c=makes[id],base=Math.floor(c.price*.92),seller=['Алексей','Дмитрий','Илья'][id%3];render(`<div class="app">${head('Переговоры')}<div class="bubble seller">${seller}: «Цена ${money(c.price)}. Машина хорошая.»</div><div class="bubble you">Ты: «После диагностики вижу проблему с ${c.risk}. Готов дать ${money(base)}.»</div><div class="buyers"><div class="buyer"><b>🤝 Торг</b><small>−12% · риск выше</small></div><div class="buyer"><b>⚡ Сегодня</b><small>−6% · быстро</small></div><div class="buyer"><b>💎 Премиум</b><small>позже дороже</small></div></div><button class="action green" onclick="buy(${id},${base})">Согласовать ${money(base)}</button><button class="action" onclick="market()">Назад</button></div>`)}
function buy(id,price){price=Number(price);let c=makes[id];if(!c)return market('all',0);if(!Number.isFinite(price)||price<10000)return alert('Ошибка сделки: некорректная цена. Вернись в объявления и начни переговоры заново.');if(state.money<price)return alert('Не хватает денег. Используй Банк.');state.money-=price;state.car={...c,buy:price,repaired:false};state.deals++;state.notifications++;objective.textContent='Подготовить автомобиль';objectiveSub.textContent='Открой гараж и проверь техническое состояние.';log(`Куплен ${c.name} за ${money(price)}.`);return state.car}
function garage(){let c=state.car;if(!c)return render(`<div class="app">${head('Гараж')}<div class="note">Гараж пуст. Первая машина ждёт тебя на рынке.</div><button class="action green" onclick="market()">🚗 Открыть рынок</button></div>`);render(`<div class="app">${head('Гараж')}<div class="pic" style="background-image:linear-gradient(#0002,#0008),url('${photo(c)}'),url('${fallbackPhoto(c)}')">🚘</div><h3>${c.name}</h3><p class="muted">${c.city} · куплена за ${money(c.buy)}</p><div class="bar"><i style="width:${c.repaired?100:45}%"></i></div><p class="muted">Состояние ${c.repaired?'100':'45'}%</p><div class="deal-score"><span>ПОКУПКА<b>${money(c.buy)}</b></span><span>РЕМОНТ<b>${money(c.repair)}</b></span><span>ПРОДАЖА<b class="profit">${money(c.sale)}</b></span></div><button class="action" onclick="garageDetails()">🔍 Диагностика и состояние</button><button class="action" onclick="sell()">💰 Найти покупателя</button></div>`)}
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
