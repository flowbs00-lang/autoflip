const KEY='autoflip-v6-save';
const cities=['Москва','Казань','Санкт-Петербург','Екатеринбург','Новосибирск'];
const cityFactor={Москва:1.05,Казань:.94,'Санкт-Петербург':1.03,Екатеринбург:.91,Новосибирск:.88};
const makes=[
['BMW 320i','Москва',2017,126000,1480000,1690000,'двигатель',85000],
['Toyota Camry 70','Казань',2019,98000,2050000,2290000,'кузов',55000],
['Kia K5','Санкт-Петербург',2021,72000,1790000,1990000,'документы',35000],
['BMW X5','Екатеринбург',2016,155000,2290000,2650000,'подвеска',140000],
['Lada Vesta','Новосибирск',2022,48000,980000,1110000,'электрика',30000],
['Mercedes C180','Москва',2018,108000,2200000,2490000,'турбина',105000],
['Audi A4','Казань',2019,93000,2100000,2390000,'коробка',125000],
['Skoda Octavia','Санкт-Петербург',2020,81000,1650000,1880000,'кузов',45000],
['Hyundai Solaris','Екатеринбург',2021,64000,1050000,1210000,'кондиционер',22000],
['Volkswagen Tiguan','Москва',2018,119000,2050000,2320000,'подвеска',65000],
['Mazda 6','Казань',2019,101000,1880000,2140000,'двигатель',75000],
['Volvo XC60','Санкт-Петербург',2017,134000,2450000,2810000,'электрика',90000],
['Lexus RX','Москва',2016,142000,2850000,3210000,'ходовая',95000],
['Kia Rio','Новосибирск',2020,59000,970000,1120000,'кузов',28000],
['Renault Duster','Екатеринбург',2021,76000,1250000,1430000,'сцепление',42000],
['Toyota RAV4','Казань',2018,111000,2250000,2550000,'вариатор',115000],
['Ford Focus','Санкт-Петербург',2019,97000,1200000,1390000,'электрика',35000],
['Mercedes E200','Москва',2017,145000,2600000,3010000,'пневма',145000],
['Audi Q5','Екатеринбург',2018,127000,2450000,2780000,'коробка',130000],
['Geely Monjaro','Новосибирск',2023,42000,2350000,2580000,'мультимедиа',30000],
['Haval F7','Казань',2022,52000,1650000,1840000,'турбина',50000],
['Porsche Macan','Москва',2016,139000,3450000,3880000,'подвеска',180000],
['Genesis G70','Санкт-Петербург',2020,67000,2350000,2680000,'тормоза',65000],
['Nissan Qashqai','Екатеринбург',2019,89000,1420000,1600000,'вариатор',80000],
['Mitsubishi Outlander','Новосибирск',2020,95000,1580000,1780000,'кузов',50000],
['Honda CR-V','Казань',2017,121000,1850000,2120000,'кондиционер',35000],
['Subaru Forester','Санкт-Петербург',2018,116000,1950000,2260000,'двигатель',90000],
['Lada Niva Travel','Екатеринбург',2022,44000,1150000,1320000,'ходовая',25000],
['Camry 55','Москва',2015,173000,1370000,1590000,'кузов',65000]
].map((x,i)=>({id:i,name:x[0],city:x[1],year:x[2],km:x[3],price:x[4],market:x[5],risk:x[6],repair:x[7],sale:x[5]}));

const photos=['photo-1555215695-3004980ad54e','photo-1621007947382-bb3c3994e3fb','photo-1619767886558-efdc259cde1a','photo-1556189250-72ba954cfc2b','photo-1503376780353-7e6692767b70'];
function photo(c){return `https://images.unsplash.com/${photos[c.id%photos.length]}?auto=format&fit=crop&w=700&q=75`}
const initial={money:1500000,rep:0,deals:0,city:'Москва',car:null,loan:0,logs:['Старт: капитал 1 500 000 ₽.'],sound:true,day:1};
let state=JSON.parse(localStorage.getItem(KEY)||'null')||structuredClone(initial);
const screen=document.getElementById('screen'),objective=document.getElementById('objective'),objectiveSub=document.getElementById('objectiveSub'),journal=document.getElementById('journal');
function money(n){return Math.round(n).toLocaleString('ru-RU')+' ₽'}
function save(){localStorage.setItem(KEY,JSON.stringify(state));document.getElementById('saveState').textContent='Сохранено';document.getElementById('heroMoney').textContent=money(state.money);document.getElementById('heroRep').textContent=state.rep;document.getElementById('heroDeals').textContent=state.deals;renderStats()}
function renderStats(){document.getElementById('statsbox').innerHTML=`<div class="stat"><b>${money(state.money)}</b><small>капитал</small></div><div class="stat"><b>${state.rep}</b><small>репутация</small></div><div class="stat"><b>${state.deals}</b><small>сделок</small></div>`}
function log(t){state.logs.unshift(t);state.logs=state.logs.slice(0,5);journal.innerHTML='<b>Журнал</b>'+state.logs.map(x=>`<p>${x}</p>`).join('');save()}
function fx(){if(!state.sound)return;try{let a=new AudioContext(),o=a.createOscillator(),g=a.createGain();o.frequency.value=430;g.gain.value=.02;o.connect(g);g.connect(a.destination);o.start();o.stop(a.currentTime+.045)}catch(e){}}
function render(x){screen.classList.add('fade');setTimeout(()=>{screen.innerHTML=x;screen.classList.remove('fade')},70);fx()}
function toggleSound(){state.sound=!state.sound;document.getElementById('soundBtn').textContent=state.sound?'🔊':'🔇';save()}
function status(){return `<div class="status"><span>День ${state.day}</span><span>${state.city} · ● ◔ ▮</span></div>`}
function head(t){return status()+`<div class="head"><button onclick="home()">‹</button><b>${t}</b><span>•••</span></div>`}
function home(){render(`<div class="app">${status()}<div class="app-title">AutoFlip</div><div class="money"><small>Свободные деньги</small><b>${money(state.money)}</b></div><div class="apps">
<button onclick="market()">🚗<small>Рынок</small></button><button onclick="messages()">💬<small>Сообщения</small></button><button onclick="garage()">🔧<small>Гараж</small></button><button onclick="bank()">🏦<small>Банк</small></button><button onclick="mapApp()">🗺️<small>Карта</small></button><button onclick="travel()">✈️<small>Поездки</small></button><button onclick="realty()">🏠<small>Недвижимость</small></button><button onclick="blocks()">🧩<small>Blocks</small></button><button onclick="profile()">👤<small>Профиль</small></button></div></div>`)}
function market(filter='all'){let arr=[...makes];if(filter==='cheap')arr=arr.filter(c=>c.price<1600000);if(filter==='profit')arr.sort((a,b)=>(b.market-b.price-b.repair)-(a.market-a.price-a.repair));if(filter==='city')arr=arr.filter(c=>c.city===state.city);render(`<div class="app">${head('АвтоРынок')}<div class="filters"><button class="${filter==='all'?'active':''}" onclick="market('all')">Все</button><button class="${filter==='city'?'active':''}" onclick="market('city')">${state.city}</button><button class="${filter==='cheap'?'active':''}" onclick="market('cheap')">До 1.6М</button><button class="${filter==='profit'?'active':''}" onclick="market('profit')">Маржа</button></div>${arr.slice(0,8).map(c=>`<div class="market" onclick="carView(${c.id})"><div class="pic" style="background-image:linear-gradient(#0003,#0008),url('${photo(c)}')">🚘</div><b>${c.name}</b><small>${c.city} · ${c.year} · ${c.km.toLocaleString('ru-RU')} км</small><strong>${money(c.price)}</strong></div>`).join('')}</div>`)}
function carView(id){let c=makes[id],profit=c.market-c.price-c.repair;render(`<div class="app">${head(c.name)}<div class="pic" style="background-image:linear-gradient(#0002,#0008),url('${photo(c)}')">🚘</div><div class="price">${money(c.price)}</div><div class="muted">${c.city} · ${c.year} · ${c.km.toLocaleString('ru-RU')} км</div><div class="deal-score"><span>РЫНОК<b>${money(c.market)}</b></span><span>РЕМОНТ<b>${money(c.repair)}</b></span><span>ЧИСТАЯ МАРЖА<b class="profit">${money(profit)}</b></span></div><div class="warning">⚠ Предварительный риск: ${c.risk}. Точная диагностика нужна перед покупкой.</div><button class="action" onclick="inspect(${id})">🔎 Диагностика</button><button class="action green" onclick="deal(${id})">💬 Переговоры</button></div>`)}
function inspect(id){let c=makes[id];objective.textContent='Переговоры';objectiveSub.textContent='Найден риск: '+c.risk+'. Используй его в торге.';log(`Диагностика ${c.name}: найден риск — ${c.risk}.`);carView(id)}
function deal(id){let c=makes[id],base=c.price*(1-.08),buyerNames=['Алексей','Дмитрий','Илья'];render(`<div class="app">${head('Торг')}<div class="bubble seller">${buyerNames[id%3]}: «Цена ${money(c.price)}. Машина хорошая.»</div><div class="bubble you">Ты: «После диагностики готов дать ${money(base)}.»</div><div class="buyers"><div class="buyer"><b>🤝 Торгаш</b><small>-12% к цене</small></div><div class="buyer"><b>⚡ Срочный</b><small>-6%, но быстро</small></div><div class="buyer"><b>💎 Премиум</b><small>+5% после ремонта</small></div></div><button class="action green" onclick="buy(${id},${Math.floor(base)})">Согласовать ${money(Math.floor(base))}</button><button class="action" onclick="market()">Назад</button></div>`)}
function buy(id,price){if(state.money<price)return alert('Не хватает денег. Используй Банк.');let c=makes[id];state.money-=price;state.car={...c,buy:price,repaired:false};state.deals++;objective.textContent='Проверить и отремонтировать';objectiveSub.textContent='Открой гараж и подготовь машину к продаже.';log(`Куплен ${c.name} за ${money(price)}.`);garage()}
function garage(){let c=state.car;if(!c)return render(`<div class="app">${head('Гараж')}<p class="muted">Гараж пуст. Ищи машину на рынке.</p><button class="action green" onclick="market()">Открыть рынок</button></div>`);render(`<div class="app">${head('Гараж')}<div class="pic" style="background-image:linear-gradient(#0002,#0008),url('${photo(c)}')">🚘</div><h3>${c.name}</h3><p class="muted">${c.city} · куплена за ${money(c.buy)}</p><div class="bar"><i style="width:${c.repaired?100:45}%"></i></div><p class="muted">Состояние ${c.repaired?'100':'45'}%</p><div class="deal-score"><span>ПОКУПКА<b>${money(c.buy)}</b></span><span>РЕМОНТ<b>${money(c.repair)}</b></span><span>ПРОДАЖА<b class="profit">${money(c.sale)}</b></span></div><button class="action green" onclick="repair()">🔧 ${c.repaired?'Готово':`Ремонт · ${money(c.repair)}`}</button><button class="action" onclick="sell()">💰 Найти покупателя</button></div>`)}
function repair(){let c=state.car;if(c.repaired)return;if(state.money<c.repair)return alert('Не хватает денег на ремонт.');state.money-=c.repair;c.repaired=true;objective.textContent='Продать автомобиль';objectiveSub.textContent='Выбери покупателя и зафиксируй прибыль.';log(`Ремонт ${c.name}: -${money(c.repair)}.`);garage()}
function sell(){let c=state.car;if(!c.repaired)return alert('Сначала закончи ремонт.');let names=[['Андрей','торгаш',.94],['Максим','срочный',.99],['Роман','премиум',1.05]];render(`<div class="app">${head('Покупатели')}<p class="muted">Выбери стратегию продажи.</p>${names.map((n,i)=>`<div class="buyer" style="margin:7px 0"><b>${i===0?'🤝':i===1?'⚡':'💎'} ${n[0]} · ${n[1]}</b><small>Предложение: ${money(c.sale*n[2])}</small><button class="action ${i===2?'green':''}" onclick="closeSale(${n[2]})">Принять</button></div>`).join('')}</div>`)}
function closeSale(mult){let c=state.car,final=c.sale*mult;state.money+=final;state.rep+=10;state.deals++;state.day++;let profit=final-c.buy-c.repair;log(`Продан ${c.name} за ${money(final)}. Прибыль ${money(profit)}.`);state.car=null;objective.textContent='Новая сделка';objectiveSub.textContent='Рынок обновился. Ищи следующую машину.';save();home()}
function messages(){render(`<div class="app">${head('Сообщения')}<div class="bubble seller">Продавец: «Машина ещё в продаже».</div><div class="bubble you">Ты: «Есть вопросы после диагностики».</div><div class="bubble seller">«Если заберёте сегодня — уступлю».</div><button class="action green" onclick="log('Продавец согласился обсуждать цену.');messages()">Предложить цену</button></div>`)}
function bank(){render(`<div class="app">${head('Банк')}<div class="bank"><small>Доступный лимит</small><b>1 000 000 ₽</b><span class="muted">Текущий долг: ${money(state.loan)}</span></div><button class="action green" onclick="takeLoan()">Взять 500 000 ₽</button>${state.loan?'<button class="action" onclick="payLoan()">Погасить 540 000 ₽</button>':''}</div>`)}
function takeLoan(){state.money+=500000;state.loan+=540000;log('Банк выдал 500 000 ₽. Долг вырос до 540 000 ₽.');bank()}
function payLoan(){if(state.money<state.loan)return alert('Недостаточно денег.');state.money-=state.loan;log('Кредит полностью погашен.');state.loan=0;save();bank()}
function mapApp(){render(`<div class="app">${head('Карта')}<div class="map">${cities.map((c,i)=>`<button class="city ${state.city===c?'active':''} m${i+1}" onclick="goCity('${c}')">${c}</button>`).join('')}</div><p class="muted">Переезд стоит 3 500 ₽. Цены рынка зависят от города.</p></div>`)}
function goCity(city){if(city===state.city)return mapApp();if(state.money<3500)return alert('Не хватает денег.');state.money-=3500;state.city=city;state.day++;log(`Переезд в ${city}. Новый день.`);mapApp()}
function travel(){mapApp()}
function realty(){render(`<div class="app">${head('Недвижимость')}<div class="row"><span>🏢 Парковочное место</span><b>1 850 000 ₽</b></div><div class="row"><span>🏠 Дом в Казани</span><b>5 400 000 ₽</b></div><p class="muted">Откроется после накопления 5 млн ₽.</p></div>`)}
function blocks(){render(`<div class="app">${head('PlameBlocks')}<p class="muted">Нажимай клетки и собери 10 совпадений.</p><div class="apps">${Array.from({length:9},(_,i)=>`<button onclick="this.style.background='#263719';this.textContent='✓'">◆<small>блок ${i+1}</small></button>`).join('')}</div></div>`)}
function profile(){render(`<div class="app">${head('Профиль')}<div style="text-align:center"><div style="width:65px;height:65px;border-radius:50%;background:var(--g);color:#111;display:grid;place-items:center;font-size:24px;font-weight:900;margin:25px auto 10px">A</div><h3>${state.rep<30?'Начинающий перекуп':state.rep<80?'Опытный перекуп':'Автодилер'}</h3><div class="statsbox"><div class="stat"><b>${money(state.money)}</b><small>капитал</small></div><div class="stat"><b>${state.deals}</b><small>сделок</small></div><div class="stat"><b>${state.rep}</b><small>репутация</small></div></div><p class="muted">${state.city} · день ${state.day}</p></div></div>`)}
function randomEvent(){let e=[['📈 Спрос вырос','Следующая продажа получает +5%.',5],['🔧 Ремонт подорожал','СТО сообщает о повышении цен.',0],['⭐ Хороший отзыв','Репутация +8.',8],['💸 Распродажа','Следующая покупка дешевле на 3%.',0]][Math.floor(Math.random()*4)];if(e[2])state.rep+=e[2];log(`${e[0]}: ${e[1]}`);render(`<div class="app">${head('Событие')}<div class="event"><b>${e[0]}</b><small>${e[1]}</small></div><button class="action green" onclick="home()">Продолжить</button></div>`)}
function resetGame(){if(confirm('Удалить весь прогресс?')){state=structuredClone(initial);save();journal.innerHTML='<b>Журнал</b><p>Новая игра начата.</p>';objective.textContent='Найди выгодный автомобиль';objectiveSub.textContent='Открой рынок.';home()}}
journal.innerHTML='<b>Журнал</b>'+state.logs.map(x=>`<p>${x}</p>`).join('');save();home();
