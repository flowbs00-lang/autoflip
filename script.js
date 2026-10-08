// AutoFlip V7.9 compatibility layer
// Keeps the V7 core intact and adds a 3-car fleet plus live-market seller behavior.
// Dependencies are loaded synchronously by index.html before this layer.
(function(){function install(){if(typeof state==='undefined'||typeof KEY==='undefined'||typeof render!=='function'||typeof head!=='function'||typeof money!=='function'){setTimeout(install,50);return;}if(!Array.isArray(state.cars))state.cars=[];if(state.car&&!state.cars.some(function(x){return x===state.car||(x._garageId&&x._garageId===state.car._garageId);}))state.cars.push(state.car);state.cars=state.cars.filter(Boolean).slice(0,10);var seq=Date.now();state.cars.forEach(function(c){if(!c._garageId)c._garageId='car-'+(++seq);});if(!state.car&&state.cars.length)state.car=state.cars[0];if(!state.businessHistory)state.businessHistory=[];if(!Array.isArray(state.repHistory))state.repHistory=[];if(state.profitStreak===undefined)state.profitStreak=0;if(!state.liveMarket)state.liveMarket={cycle:0,visits:0};if(!state.liveMarket.priceFactors)state.liveMarket.priceFactors={};if(!Array.isArray(state.liveMarket.hiddenIds))state.liveMarket.hiddenIds=[];if(!Array.isArray(state.liveMarket.newIds))state.liveMarket.newIds=[];if(!Array.isArray(state.liveMarket.hotIds))state.liveMarket.hotIds=[];
var marketTemplates=(typeof makes!=='undefined'?makes:[]).map(function(x){return Object.assign({},x);});
var marketListingsPerCity=100;
var marketActivePerCity=50;
var marketTargetSize=cities.length*marketListingsPerCity;
var marketCatalogVersion=9;
var marketStarterPerCity=10;
var marketRestorationTemplates=[
 {name:'ВАЗ 2101 · проект',year:1984,km:286000,body:'Седан',risk:'сквозная коррозия кузова',repair:32000,photo:'Abandoned Car (88134285).jpeg',damage:'Сквозная коррозия, повреждён кузов',credit:'Wikimedia Commons · CC license'},
 {name:'Lada Niva · проект',year:1993,km:241000,body:'Внедорожник',risk:'кузов и пороги',repair:28000,photo:'Rusty Lada Niva.jpg',damage:'Сильная коррозия кузова и порогов',credit:'PeteVerdon · CC BY-SA 3.0'},
 {name:'Opel Kadett D · проект',year:1983,km:254000,body:'Хэтчбек',risk:'передняя часть кузова',repair:26000,photo:'1979-84 Opel Kadett D (abandoned) (10250799795).jpg',damage:'Нет бампера, кузов требует восстановления',credit:'Wikimedia Commons · CC BY 2.0'},
 {name:'Ford Sierra · проект',year:1984,km:279000,body:'Универсал',risk:'ходовая и кузов',repair:30000,photo:'1982-83 Ford Sierra Base estate (abandoned?!) (10315412895).jpg',damage:'Долгий простой, коррозия и неисправная ходовая',credit:'Wikimedia Commons · CC BY 2.0'},
 {name:'Toyota Corolla E70 · проект',year:1979,km:318000,body:'Седан',risk:'кузов и днище',repair:35000,photo:'1977-79 Toyota Corolla in an appaling "roadworthy" condition (10274398094).jpg',damage:'Гнилое днище и множественная коррозия',credit:'Wikimedia Commons · CC BY 2.0'},
 {name:'Cadillac DeVille · проект',year:1978,km:225000,body:'Седан',risk:'кузов и двигатель',repair:42000,photo:'Rusty Cadillac.JPG',damage:'Кузов покрыт ржавчиной, двигатель не запускается',credit:'Wikimedia Commons · свободная лицензия'},
 {name:'Ford Falcon · проект',year:1969,km:340000,body:'Седан',risk:'аварийный кузов',repair:45000,photo:'03 Falcon Wreck.jpg',damage:'Сильные повреждения кузова после простоя',credit:'Wikimedia Commons · свободная лицензия'},
 {name:'TagAZ Vortex Estina · проект',year:2010,km:198000,body:'Седан',risk:'коррозия и стёкла',repair:27000,photo:'Moscow, Tagaz Vortex Estina (Chery A5) decrepit Sept 2026 07.jpg',damage:'Коррозия, разбитое стекло и разукомплектованный салон',credit:'Wikimedia Commons · CC0'},
 {name:'Opel Kadett E · проект',year:1988,km:267000,body:'Универсал',risk:'пороги и арки',repair:29000,photo:'Rusty old Kadett van (15658910431).jpg',damage:'Сгнившие арки и пороги',credit:'Wikimedia Commons · CC BY 2.0'},
 {name:'Авто со свалки · проект',year:1996,km:301000,body:'Хэтчбек',risk:'стёкла и колёса',repair:38000,photo:'Damaged blue car sits in junkyard with open door and missing wheels.jpg',damage:'Нет колёс, разбиты стёкла, повреждены двери',credit:'Shixart1985 · CC BY 2.0'}
];
var marketBudgetRevision={
 'Fiat Punto II':[160000,120000],
 'Renault Clio II':[190000,135000],
 'Opel Corsa C':[220000,150000],
 'Opel Astra G':[260000,170000],
 'Opel Vectra B':[180000,145000]
};
var marketRestoreRevision={
 'Fiat Punto II':[120000,160000],
 'Renault Clio II':[135000,190000],
 'Opel Corsa C':[150000,220000],
 'Opel Astra G':[170000,260000],
 'Opel Vectra B':[145000,180000]
};
var marketColors=['Белый','Серебристый','Чёрный','Синий','Красный','Бежевый','Серый','Зелёный'];
var marketPhotoPositions=['50% 50%','42% 50%','58% 50%','50% 42%','50% 58%','35% 50%','65% 50%'];
var marketPhotoCatalogVersion=2;
var marketPhotoColorCatalogVersion=1;
var marketPhotoColors={};
[
 ['1992 Lada 2106.jpg','Бежевый'],
 ['VAZ-2106.jpg','Синий'],
 ['Lada 2106.jpg','Бежевый'],
 ['Lada 2107 (VAZ-2107) 01.jpg','Белый'],
 ['Vaz 2107.jpg','Белый'],
 ['Lada VAZ 2107.jpg','Белый'],
 ['Vaz-2107.JPG','Синий'],
 ['Vaz2107.jpg','Чёрный'],
 ['VAZ-2109 "Devyatka" (4714544714).jpg','Белый'],
 ['Lada 110-VAZ-2110 (4713570255).jpg','Белый'],
 ['LADA-110.jpg','Серебристый'],
 ['Lada priora.jpg','Чёрный'],
 ['Lada Priora.jpg','Чёрный'],
 ['Lada Kalina 1.jpg','Красный'],
 ['Lada Kalina.jpg','Жёлтый'],
 ['Lada Kalina.JPG','Красный'],
 ['20110809 daewoo nexia 01.jpg','Серый'],
 ['Renault Logan .jpg','Белый'],
 ['Ford Focus II.jpg','Серебристый'],
 ['2014-2017 Hyundai Solaris Sedan (front).jpg','Белый'],
 ['Kia Rio (UB) sedan in Babat Pertamina Petrol Station - Bbt. Supat, Musi Banyuasin, SS.jpg','Белый'],
 ['LADA Vesta.jpg','Серый'],
 ['2012 Škoda Rapid (NH) sedan (2012-10-26).jpg','Белый'],
 ['Vw polo sedan.jpg','Серебристый'],
 ['2015 Toyota Corolla Altis (ZRE172R) 2.0V sedan (2015-12-30).jpg','Серебристый'],
 ['BMW 320i F30 (10118122084).jpg','Белый'],
 ['2018 Toyota Camry (XV70).jpg','Белый'],
 ['Kia K5 DL3 grey (1).jpg','Серый'],
 ['BMW X5 F15.jpg','Белый'],
 ['Mercedes-Benz C180 W205 (16005105286).jpg','Чёрный'],
 ['Audi A4 B9.jpg','Белый'],
 ['2018 Volkswagen Tiguan 280 TSI (front).jpg','Белый'],
 ['Toyota RAV4 (XA50) IMG 1998.jpg','Белый'],
 ['Geely Monjaro.jpg','Синий'],
 ['Haval F7 IMG001.jpg','Серебристый'],
 ['Mercedes-Benz E 200 Sports (W213) front.jpg','Серебристый'],
 ['Audi Q5 FY Facelift IMG 5684.jpg','Зелёный'],
 ['BMW X5 xDrive45e M Sport (G05, 2022) (54537623230).jpg','Чёрный'],
 ['Mercedes-Benz W167 GLE 300d 4MATIC 2022.jpg','Серый'],
 ['2022 Porsche Macan 1X7A6048.jpg','Белый'],
 ['Chevrolet Lacetti front.jpg','Синий'],
 ['Chevrolet Lacetti 170530.jpg','Серебристый'],
 ['Chevrolet Lacetti (7158279272).jpg','Серебристый'],
 ['Chevrolet Cruze J300 sedan China 2012-06-16.jpg','Чёрный'],
 ['Chevrolet Cruze J300 sedan China 2012-06-23.jpg','Синий'],
 ['Chevrolet Cruze J300 sedan China 2012-04-14.jpg','Белый'],
 ['Opel Astra J.JPG','Чёрный'],
 ['Opel Astra J 100805.jpg','Зелёный'],
 ['Opel Astra J in Pendik.jpg','Чёрный'],
 ['Nissan Almera.jpg','Белый'],
 ['Mitsubishi Lancer X 001.jpg','Белый'],
 ['Mazda 3 3rd generation sedan.jpg','Синий'],
 ['Skoda Octavia III facelift IMG001.jpg','Белый'],
 ['Hyundai Elantra (AD).jpg','Белый'],
 ['HYUNDAI ELANTRA (AD) China.jpg','Белый'],
 ["Kia Ceed - Mondial de l'Automobile de Paris 2018 - 001.jpg",'Синий'],
 ['Kia Ceed Monrepos 2018 IMG 0107.jpg','Синий'],
 ['Kia Ceed, GIMS 2018, Le Grand-Saconnex (1X7A1901).jpg','Синий'],
 ['Renault Duster.JPG','Серебристый'],
 ['Renault-Duster-.jpg','Серебристый'],
 ['Nissan Qashqai J11 Enmis.jpeg','Белый'],
 ['Nissan Qashqai (J11) 190039.jpg','Белый'],
 ['0 Nissan Qashqai (J11) 1.jpg','Серый'],
 ['Mazda6 (GJ) front.jpg','Красный'],
 ['Mazda6 (GJ) in Jambi City, JA.jpg','Белый'],
 ['MAZDA6 (GJ) China (37).jpg','Красный'],
 ['HONDA ACCORD (CR1-CR3, CR6-CR7, CT1-CT2) China (63).jpg','Белый'],
 ['HONDA ACCORD (CR1-CR3, CR6-CR7, CT1-CT2) China (facelift).jpg','Белый'],
 ['Subaru Forester 2018 (SK) CUV Front.jpg','Белый'],
 ['Subaru FORESTER Premium (5BA-SK9) front.jpg','Белый'],
 ['Chery Tiggo7 Pro 2023 (53631773981).jpg','Серый'],
 ['2023 Chery Tiggo 7 Pro, Pakuwon Mall, West Surabaya.jpg','Красный'],
 ['Chery Tiggo 7 Pro каршеринга Ситидрайв в Москве (июнь 2022) (01).jpg','Белый'],
 ['Coolray Front.jpg','Синий'],
 ['Geely Coolray 2022 (1).jpg','Белый'],
 ['Geely Coolray 2023.jpg','Синий'],
 ['Volvo XC60 II Shishi 01 2022-09-09.jpg','Белый'],
 ['Volvo XC60 II Shishi 02 2022-09-09.jpg','Белый'],
 ['Volvo XC60 II Shishi 01 2022-03-11.jpg','Белый'],
 ['2018 Lexus RX 350L 3.5L front 3.24.19.jpg','Белый'],
 ['2018 Lexus RX 350L 3.5L rear 3.24.19.jpg','Белый'],
 ['Toyota Land Cruiser Prado 150.jpg','Белый']
].forEach(function(x){marketPhotoColors[commons(x[0])]=x[1];});

var marketModelPhotoColors={
 'ВАЗ 2106':'Бежевый','ВАЗ 2107':'Белый','ВАЗ 2109':'Белый','ВАЗ 2110':'Белый',
 'Lada Priora':'Чёрный','Lada Kalina':'Красный','Daewoo Nexia':'Серый',
 'Renault Logan':'Белый','Ford Focus II':'Серебристый','Hyundai Solaris':'Белый',
 'Kia Rio':'Белый','Lada Vesta':'Серый','Skoda Rapid':'Белый','Volkswagen Polo':'Серебристый',
 'Toyota Corolla':'Серебристый','BMW 320i':'Белый','Toyota Camry 70':'Белый','Kia K5':'Серый',
 'BMW X5':'Белый','Mercedes C180':'Чёрный','Audi A4':'Белый','Volkswagen Tiguan':'Белый',
 'Toyota RAV4':'Белый','Geely Monjaro':'Синий','Haval F7':'Серебристый','Mercedes E200':'Серебристый',
 'Audi Q5':'Зелёный','BMW X5 G05':'Чёрный','Mercedes GLE 300d':'Серый','Porsche Macan':'Белый',
 'Chevrolet Lacetti':'Синий','Chevrolet Cruze':'Чёрный','Opel Astra J':'Чёрный','Nissan Almera':'Белый',
 'Mitsubishi Lancer X':'Белый','Mazda 3':'Синий','Skoda Octavia':'Белый','Hyundai Elantra':'Белый',
 'Kia Ceed':'Синий','Renault Duster':'Серебристый','Nissan Qashqai':'Белый','Mazda 6':'Красный',
 'Honda Accord':'Белый','Subaru Forester':'Белый','Chery Tiggo 7 Pro':'Красный',
 'Geely Coolray':'Синий','Volvo XC60':'Белый','Lexus RX 350':'Белый',
 'Toyota Land Cruiser Prado':'Белый'
};

function marketColorFor(car,variant){
 var url=car&&car.photoUrl?car.photoUrl:marketPhotoFor(car,variant);
 return marketPhotoColors[url]||marketModelPhotoColors[car&&car.name]||(car&&car.color)||'Серый';
}
function marketPhotoHash(value){
 var s=String(value||''),h=0;
 for(var i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;
 return Math.abs(h);
}
function marketPhotoFor(car,variant){
 if(car&&window.carCatalogByName&&window.carCatalogByName[car.name])return window.carCatalogByName[car.name].photoUrl;
 var pool=marketPhotoPools[car&&car.name]||[];
 if(!pool.length)return exactPhotos[car&&car.name]||fallbackPhoto(car||{id:Number(variant||0)});
 var key=(car&&car.listingId)||((car&&car.name)||'car')+'-'+String(variant||0);
 return pool[marketPhotoHash(key)%pool.length];
}
var marketRisks=['кузов и пороги','двигатель','коробка','электрика','ходовая','сцепление','тормоза','охлаждение'];
var marketSellerNames=['Алексей','Дмитрий','Илья','Максим','Роман','Сергей','Антон','Никита','Олег','Андрей','Евгений','Виктор'];
var marketSellerKinds=['Частник','Срочная продажа','Владелец','Перекупщик'];
var marketPhotoPools={
 'ВАЗ 2106':[commons('1992 Lada 2106.jpg'),commons('VAZ-2106.jpg'),commons('Lada 2106.jpg')],
 'ВАЗ 2107':[commons('Lada 2107 (VAZ-2107) 01.jpg'),commons('Vaz 2107.jpg'),commons('Lada VAZ 2107.jpg'),commons('Vaz-2107.JPG'),commons('Vaz2107.jpg')],
 'ВАЗ 2110':[commons('Lada 110-VAZ-2110 (4713570255).jpg'),commons('LADA-110.jpg')],
 'Lada Priora':[commons('Lada priora.jpg'),commons('Lada Priora.jpg')],
 'Lada Kalina':[commons('Lada Kalina 1.jpg'),commons('Lada Kalina.jpg'),commons('Lada Kalina.JPG')],
 'Chevrolet Lacetti':[commons('Chevrolet Lacetti front.jpg'),commons('Chevrolet Lacetti 170530.jpg'),commons('Chevrolet Lacetti (7158279272).jpg')],
 'Chevrolet Cruze':[commons('Chevrolet Cruze J300 sedan China 2012-06-16.jpg'),commons('Chevrolet Cruze J300 sedan China 2012-06-23.jpg'),commons('Chevrolet Cruze J300 sedan China 2012-04-14.jpg')],
 'Opel Astra J':[commons('Opel Astra J.JPG'),commons('Opel Astra J 100805.jpg'),commons('Opel Astra J in Pendik.jpg')],
 'Nissan Almera':[commons('Nissan Almera.jpg')],
 'Mitsubishi Lancer X':[commons('Mitsubishi Lancer X 001.jpg')],
 'Mazda 3':[commons('Mazda 3 3rd generation sedan.jpg')],
 'Skoda Octavia':[commons('Skoda Octavia III facelift IMG001.jpg')],
 'Hyundai Elantra':[commons('Hyundai Elantra (AD).jpg'),commons('HYUNDAI ELANTRA (AD) China.jpg')],
 'Kia Ceed':[commons("Kia Ceed - Mondial de l'Automobile de Paris 2018 - 001.jpg"),commons('Kia Ceed Monrepos 2018 IMG 0107.jpg'),commons('Kia Ceed, GIMS 2018, Le Grand-Saconnex (1X7A1901).jpg')],
 'Renault Duster':[commons('Renault Duster.JPG'),commons('Renault-Duster-.jpg')],
 'Nissan Qashqai':[commons('Nissan Qashqai J11 Enmis.jpeg'),commons('Nissan Qashqai (J11) 190039.jpg'),commons('0 Nissan Qashqai (J11) 1.jpg')],
 'Mazda 6':[commons('Mazda6 (GJ) front.jpg'),commons('Mazda6 (GJ) in Jambi City, JA.jpg'),commons('MAZDA6 (GJ) China (37).jpg')],
 'Honda Accord':[commons('HONDA ACCORD (CR1-CR3, CR6-CR7, CT1-CT2) China (63).jpg'),commons('HONDA ACCORD (CR1-CR3, CR6-CR7, CT1-CT2) China (facelift).jpg')],
 'Subaru Forester':[commons('Subaru Forester 2018 (SK) CUV Front.jpg'),commons('Subaru FORESTER Premium (5BA-SK9) front.jpg')],
 'Chery Tiggo 7 Pro':[commons('Chery Tiggo7 Pro 2023 (53631773981).jpg'),commons('2023 Chery Tiggo 7 Pro, Pakuwon Mall, West Surabaya.jpg'),commons('Chery Tiggo 7 Pro каршеринга Ситидрайв в Москве (июнь 2022) (01).jpg')],
 'Geely Coolray':[commons('Coolray Front.jpg'),commons('Geely Coolray 2022 (1).jpg'),commons('Geely Coolray 2023.jpg')],
 'Volvo XC60':[commons('Volvo XC60 II Shishi 01 2022-09-09.jpg'),commons('Volvo XC60 II Shishi 02 2022-09-09.jpg'),commons('Volvo XC60 II Shishi 01 2022-03-11.jpg')],
 'Lexus RX 350':[commons('2018 Lexus RX 350L 3.5L front 3.24.19.jpg'),commons('2018 Lexus RX 350L 3.5L rear 3.24.19.jpg')],
 'Toyota Land Cruiser Prado':[commons('Toyota Land Cruiser Prado 150.jpg')]
};
function marketRound(n,step){step=step||1000;return Math.max(step,Math.round(Number(n||0)/step)*step);}
function marketBody(name){
 if(/X5|GLE|Q5|RAV4|Tiguan|Monjaro|F7|Macan/i.test(name))return 'Кроссовер';
 if(/2109|Kalina/i.test(name))return 'Хэтчбек';
 return 'Седан';
}
function marketTrim(template,variant){
 var old=Number(template.market||0)<300000;
 var mids=Number(template.market||0)<1500000;
 var pool=old?['Базовая','Стандарт','Люкс']:mids?['Стандарт','Комфорт','Комфорт+','Люкс']:['Base','Business','Premium','Sport'];
 return pool[Math.abs(variant)%pool.length];
}
function marketConditionLabel(factor){
 if(factor<.84)return 'Требует вложений';
 if(factor<.94)return 'Есть недостатки';
 if(factor<1.02)return 'Нормальное';
 return 'Хорошее';
}
function pickMarketTemplate(existing,city){
 var active=existing||makes,used=new Set(active.filter(function(c){return !city||c.city===city;}).map(function(c){return c.name;}));
 var available=marketTemplates.filter(function(c){return !used.has(c.name);});
 if(!available.length)available=marketTemplates.slice();
 // Price bands, not array positions: every model remains reachable after expansion.
 var r=Math.random(),band=r<.35?0:r<.65?1:r<.88?2:3;
 var pool=available.filter(function(c){var v=Number(c.market);return band===0?v<500000:band===1?v>=500000&&v<1500000:band===2?v>=1500000&&v<4000000:v>=4000000;});
 if(!pool.length)pool=available;
 return pool[Math.floor(Math.random()*pool.length)];
}
function createMarketListing(template,forcedVariant,forcedCity,forcedActive){
 var seq=Number(state.marketListingSeq||0)+1;state.marketListingSeq=seq;
 var variant=forcedVariant===undefined?seq:forcedVariant;
 var yearDelta=Math.floor(Math.random()*5)-2;
 var year=Math.max(Number(template.yearMin||1980),Math.min(Number(template.yearMax||2026),2026,Number(template.year||2000)+yearDelta));
 yearDelta=year-Number(template.year||2000);
 var kmFactor=.76+Math.random()*.55;
 var km=Math.max(12000,marketRound(Number(template.km||100000)*kmFactor,1000));
 var condition=.78+Math.random()*.30;
 var yearFactor=1+yearDelta*.018;
 var kmPriceFactor=Math.max(.82,Math.min(1.12,1.05-(kmFactor-1)*.23));
 var fair=marketRound(Number(template.market||template.price||50000)*yearFactor*kmPriceFactor);
 var askFactor=.78+Math.random()*.29;
 var price=marketRound(fair*askFactor);
 var repair=marketRound(Number(template.repair||10000)*(1.18+(1-condition)*1.7)*(.82+Math.random()*.35));
 var pool=marketPhotoPools[template.name]||[];
 var risk=Math.random()<.56?template.risk:marketRisks[Math.floor(Math.random()*marketRisks.length)];
 var listingId='AF-'+String(Date.now()).slice(-6)+'-'+String(seq).padStart(4,'0');
 var photoUrl=marketPhotoFor({name:template.name,listingId:listingId},variant);
 var city=cities.indexOf(forcedCity)>=0?forcedCity:(cities[Math.floor(Math.random()*cities.length)]||template.city);
 var postedAt=Number(state.gameClock&&state.gameClock.total||450),sellerIndex=Math.abs(variant)%marketSellerNames.length,sellerKind=marketSellerKinds[Math.abs(variant*3)%marketSellerKinds.length];
 return Object.assign({},template,{
   id:0,modelId:template.id,listingId:listingId,city:city,year:year,km:km,
   basePrice:price,price:price,market:fair,sale:fair,repair:repair,risk:risk,
   color:template.color||marketColorFor({name:template.name,photoUrl:photoUrl},variant),body:template.body||marketBody(template.name),
   trim:marketTrim(template,variant),condition:condition,conditionLabel:marketConditionLabel(condition),
   photoUrl:photoUrl,photoVariant:Math.abs(variant)%Math.max(1,pool.length),
   photoPosition:marketPhotoPositions[Math.abs(variant)%marketPhotoPositions.length],
   postedAt:postedAt,marketActive:forcedActive===undefined?true:!!forcedActive,sellerName:marketSellerNames[sellerIndex],sellerKind:sellerKind,
   sellerUrgency:sellerKind==='Срочная продажа'?'high':(sellerKind==='Перекупщик'?'medium':'normal')
 });
}
function starterTemplatesForCity(city){
 var cityIndex=Math.max(0,cities.indexOf(city));
 return marketRestorationTemplates.map(function(template,index){return Object.assign({id:3000+index,price:60000,market:110000,sale:110000,yearMin:template.year-2,yearMax:template.year+2,city:city,photoUrl:commons(template.photo),photoCredit:template.credit,photoSource:'https://commons.wikimedia.org/wiki/File:'+encodeURIComponent(template.photo)},template,{rotation:(cityIndex+index)%marketRestorationTemplates.length});});
}
function createStarterListing(template,city,slot){
 var cityIndex=Math.max(0,cities.indexOf(city)),fresh=createMarketListing(template,cityIndex*100+slot,city,true);
 var price=40000+((cityIndex+slot)%9)*5000;
 fresh.price=price;fresh.basePrice=price;fresh.market=price+Number(template.repair||30000)+22000;fresh.sale=fresh.market;
 fresh.repair=Number(template.repair||30000);fresh.risk=template.risk;fresh.photoUrl=template.photoUrl;
 fresh.photoCredit=template.photoCredit;fresh.photoSource=template.photoSource;fresh.damageSummary=template.damage;
 fresh.starterOffer=true;fresh.restorationProject=true;fresh.starterVersion=2;
 fresh.condition=.58;fresh.conditionLabel='Под восстановление';
 return balanceRestorationProject(fresh);
}
function balanceRestorationProject(car){
 if(!car||!car.restorationProject)return car;
 var index=Math.max(0,marketRestorationTemplates.findIndex(function(x){return x.name===car.name;}));
 var ask=Math.max(40000,Math.min(80000,Number(car.basePrice||car.price||50000))),markup=.12+(index%4)*.02;
 car.price=ask;car.basePrice=ask;car.repair=2000+(index%3)*500;
 car.market=marketRound(ask*(1+markup));car.sale=car.market;car.restorationBalanceVersion=2;
 if(car.marketFlipCondition&&!car.marketFlipCondition.healthy){car.marketFlipCondition.name=car.risk;car.marketFlipCondition.cost=car.repair;car.marketFlipCondition.healthyMarket=car.market;car.marketFlipCondition.loss=car.repair/car.market;}
 if(car.prePurchaseDiagnostic&&car.prePurchaseDiagnostic.found){car.prePurchaseDiagnostic.faultName=car.risk;car.prePurchaseDiagnostic.faultCost=car.repair;car.prePurchaseDiagnostic.loss=car.repair/car.market;}
 return car;
}
function ensureCityStarterListings(list,city,cityCars){
 var desired=starterTemplatesForCity(city),favorites=new Set(Array.isArray(state.marketFavorites)?state.marketFavorites:[]),inspections=state.marketInspections||{};
 desired.forEach(function(template,slot){
   var existing=cityCars.find(function(c){return c.starterOffer===true&&c.name===template.name;});
   if(existing){existing.marketActive=true;return;}
   var victim=cityCars.slice().reverse().find(function(c){return !c.starterOffer&&c.marketActive===false&&!favorites.has(c.listingId)&&!inspections[c.listingId];})||cityCars.slice().reverse().find(function(c){return !c.starterOffer&&!favorites.has(c.listingId)&&!inspections[c.listingId];});
   if(victim){var listIndex=list.indexOf(victim),cityIndex=cityCars.indexOf(victim);if(listIndex>=0)list.splice(listIndex,1);if(cityIndex>=0)cityCars.splice(cityIndex,1);}
   var fresh=createStarterListing(template,city,slot);list.push(fresh);cityCars.push(fresh);
 });
}
window.marketTemplates=marketTemplates;
window.createMarketListing=createMarketListing;
window.removePurchasedListing=removePurchasedListing;
function reindexMarketListings(){
 if(typeof makes==='undefined')return;
 makes.forEach(function(car,i){car.id=i;});
 state.marketListings=makes;
}
function marketNowStored(){return Number(state.gameClock&&state.gameClock.total||450);}
function ensureMarketListingMeta(car,index){
 var now=marketNowStored(),variant=Number(car.modelId||0)+Number(index||0);
 if(Number(state.marketListingsVersion||0)<6&&marketBudgetRevision[car.name]){
   var revision=marketBudgetRevision[car.name],ratio=revision[1]/revision[0],oldPrice=Number(car.price||0),oldBase=Number(car.basePrice||oldPrice);
   car.price=marketRound(oldPrice*ratio);car.basePrice=marketRound(oldBase*ratio);
   car.market=marketRound(Number(car.market||car.sale||0)*ratio);car.sale=car.market;
 }
 if(Number(state.marketListingsVersion||0)<8&&Number(car.marketPriceRevision||0)<8&&marketRestoreRevision[car.name]){
   var restore=marketRestoreRevision[car.name],restoreRatio=restore[1]/restore[0];
   car.price=marketRound(Number(car.price||0)*restoreRatio);car.basePrice=marketRound(Number(car.basePrice||car.price||0)*restoreRatio);
   car.market=marketRound(Number(car.market||car.sale||0)*restoreRatio);car.sale=car.market;
   car.marketPriceRevision=8;
 }
 if(Number(state.marketListingsVersion||0)<8&&car.starterOffer&&!car.restorationProject){
   var original=marketTemplates.find(function(x){return x.name===car.name;});
   if(original){car.price=Number(original.price||original.market);car.basePrice=car.price;car.market=Number(original.market||original.sale);car.sale=car.market;car.repair=Number(original.repair||car.repair);car.photoUrl=original.photoUrl||car.photoUrl;}
   car.starterOffer=false;car.starterVersion=0;car.marketPriceRevision=8;
 }
 if(cities.indexOf(car.city)<0)car.city=cities[Math.abs(Number(index||0))%cities.length];
 if(!Number.isFinite(Number(car.postedAt)))car.postedAt=Math.max(0,now-(30+((index||0)*37)%480));
 if(!car.sellerName)car.sellerName=marketSellerNames[Math.abs(variant)%marketSellerNames.length];
 if(!car.sellerKind)car.sellerKind=marketSellerKinds[Math.abs(variant*3)%marketSellerKinds.length];
 if(!car.sellerUrgency)car.sellerUrgency=car.sellerKind==='Срочная продажа'?'high':(car.sellerKind==='Перекупщик'?'medium':'normal');
 if(!car.photoPosition)car.photoPosition=marketPhotoPositions[Math.abs(variant)%marketPhotoPositions.length];
 if(car.restorationProject&&car.photo)car.photoUrl=commons(car.photo);
 else if(Number(state.marketPhotoCatalogVersion||0)<marketPhotoCatalogVersion)car.photoUrl=marketPhotoFor(car,variant);
 if(Number(state.marketPhotoColorCatalogVersion||0)<marketPhotoColorCatalogVersion)car.color=marketColorFor(car,variant);
 return balanceRestorationProject(car);
}
function marketAgeText(car){
 var now=(typeof gameTotal==='function'?gameTotal():marketNowStored()),mins=Math.max(0,Math.floor(now-Number(car.postedAt||now)));
 if(mins<60)return mins<5?'только что':mins+' мин назад';
 var h=Math.floor(mins/60);if(h<24)return h+' ч назад';
 return Math.floor(h/24)+' дн назад';
}
function marketEventText(){var e=Array.isArray(state.marketRecentEvents)?state.marketRecentEvents[0]:null;return e?e.text:'Рынок живой: объявления появляются и исчезают со временем.';}
function addMarketEvent(text,kind){
 if(!Array.isArray(state.marketRecentEvents))state.marketRecentEvents=[];
 state.marketRecentEvents.unshift({text:text,kind:kind||'info',total:(typeof gameTotal==='function'?gameTotal():marketNowStored())});
 state.marketRecentEvents=state.marketRecentEvents.slice(0,8);
}
function marketAttractiveness(car){
 var discount=(Number(car.market||0)-Number(car.price||0))/Math.max(1,Number(car.market||1));
 var urgency=car.sellerUrgency==='high'?.16:(car.sellerUrgency==='medium'?.07:0);
 return discount+urgency+(Math.random()*.08);
}
function removeMarketListingAt(index,reason){
 var car=makes[index];if(!car)return;
 var text=reason==='npc'?'🚙 '+car.name+' за '+money(car.price)+' купил другой покупатель.':'📴 '+car.name+' — продавец снял объявление.';
 addMarketEvent(text,reason);
 makes.splice(index,1);
}
function rotateMarketByCount(count,reason){
 if(typeof makes==='undefined'||!makes.length)return{removed:[],added:[],count:0};
 count=Math.max(cities.length,Math.min(Number(count||cities.length),cities.length*12));
 var perCity=Math.max(1,Math.round(count/cities.length)),removed=[],added=[];
 var now=(typeof gameTotal==='function'?gameTotal():marketNowStored());
 cities.forEach(function(city){
   var active=makes.filter(function(c){return c.city===city&&c.marketActive!==false&&!c.starterOffer;});
   var reserve=makes.filter(function(c){return c.city===city&&c.marketActive===false&&!c.starterOffer;});
   for(var n=0;n<Math.min(perCity,active.length,reserve.length);n++){
     var outgoing=active.splice(Math.floor(Math.random()*active.length),1)[0];
     var incoming=reserve.splice(Math.floor(Math.random()*reserve.length),1)[0];
     outgoing.marketActive=false;incoming.marketActive=true;incoming.postedAt=now;
     removed.push({name:outgoing.name,price:Number(outgoing.price||0),listingId:outgoing.listingId||'',city:city,reason:(n%3===0?'seller':'npc')});
     added.push({name:incoming.name,price:Number(incoming.price||0),listingId:incoming.listingId||'',city:city});
   }
 });
 reindexMarketListings();
 state.marketListingsVersion=marketCatalogVersion;
 return{removed:removed,added:added,count:removed.length};
}
function marketRefreshId(total){return 'mu-'+Math.floor(Number(total||0))+'-'+Math.floor(Math.random()*9999);}
function marketRefreshText(update){
 var gone=update.removed.slice(0,2).map(function(x){return x.name;}).join(', ');
 var fresh=update.added.slice(0,2).map(function(x){return x.name;}).join(', ');
 return 'Ушло: '+update.removed.length+(gone?' ('+gone+')':'')+' · Новых: '+update.added.length+(fresh?' ('+fresh+')':'');
}
function marketNextRefreshText(){
 var now=(typeof gameTotal==='function'?gameTotal():marketNowStored());
 var next=Number(state.liveMarket&&state.liveMarket.nextRefreshAt||0),left=Math.max(0,next-now),h=Math.floor(left/60),m=Math.floor(left%60);
 return left<=0?'обновление сейчас':'следующее обновление через '+(h?h+' ч ':'')+m+' мин';
}
function updateMarketCountdownUI(){
 var el=document.getElementById('autoMarketCountdown');if(!el)return;
 var text=marketNextRefreshText();
 el.textContent=text==='обновление сейчас'?'Обновление сейчас':'До обновления · '+text.replace('следующее обновление через ','');
}
function performMarketRefresh(refreshAt){
 var count=Math.max(6,Math.round(marketTargetSize*(.10+Math.random()*.05))),change=rotateMarketByCount(count,'scheduled');
 state.liveMarket.cycle=Number(state.liveMarket.cycle||0)+1;
 state.liveMarket.priceFactors={};state.liveMarket.hiddenIds=[];state.liveMarket.newIds=[];state.liveMarket.hotIds=[];
 rerollLiveMarket(false);applyLiveMarket();
 var update={id:marketRefreshId(refreshAt),total:Number(refreshAt||0),day:(typeof gameDateText==='function'?gameDateText():''),
   time:(typeof gameTimeText==='function'?gameTimeText():''),removed:change.removed,added:change.added};
 if(!Array.isArray(state.marketUpdateHistory))state.marketUpdateHistory=[];
 state.marketUpdateHistory.unshift(update);state.marketUpdateHistory=state.marketUpdateHistory.slice(0,12);
 addMarketEvent('📈 Плановое обновление рынка: '+change.removed.length+' объявлений ушло, '+change.added.length+' появилось.','refresh');
 if(typeof pushPhoneNotification==='function')pushPhoneNotification('AutoMarket','📈',marketRefreshText(update),'market-update:'+update.id,'market-update-'+update.id);
 return update;
}
function ensureMarketRefreshSchedule(){
 var now=(typeof gameTotal==='function'?gameTotal():marketNowStored());
 if(!Number.isFinite(Number(state.liveMarket.nextRefreshAt))||Number(state.liveMarket.nextRefreshAt)<=0)state.liveMarket.nextRefreshAt=now+360;
}
function processScheduledMarketRefresh(){
 ensureMarketRefreshSchedule();
 var now=(typeof gameTotal==='function'?gameTotal():marketNowStored()),updates=[],guard=0;
 while(now>=Number(state.liveMarket.nextRefreshAt)&&guard<6){
   var at=Number(state.liveMarket.nextRefreshAt);
   updates.push(performMarketRefresh(at));
   state.liveMarket.nextRefreshAt=at+360;
   guard++;
 }
 if(now>=Number(state.liveMarket.nextRefreshAt))state.liveMarket.nextRefreshAt=now+360;
 return updates;
}
function fillGeneratedMarket(list){
 var normalized=[];
 list.filter(Boolean).forEach(function(car,index){
   ensureMarketListingMeta(car,index);
   if(normalized.filter(function(x){return x.city===car.city;}).length<marketListingsPerCity)normalized.push(car);
 });
 list.splice.apply(list,[0,list.length].concat(normalized));
 cities.forEach(function(city){
   var cityCars=list.filter(function(c){return c.city===city;});
   ensureCityStarterListings(list,city,cityCars);
   while(cityCars.length<marketListingsPerCity){
     var template=pickMarketTemplate(cityCars,city);if(!template)break;
     var fresh=createMarketListing(template,undefined,city,cityCars.length<marketActivePerCity);
     list.push(fresh);cityCars.push(fresh);
   }
   var preferred=cityCars.filter(function(c){return c.starterOffer;}).concat(cityCars.filter(function(c){return !c.starterOffer&&c.marketActive!==false;}),cityCars.filter(function(c){return !c.starterOffer&&c.marketActive===false;}));
   preferred.forEach(function(c,index){c.marketActive=index<marketActivePerCity;});
 });
}
function generateInitialMarket(){
 var list=[];
 fillGeneratedMarket(list);
 makes.splice.apply(makes,[0,makes.length].concat(list));
 reindexMarketListings();state.marketListingsVersion=marketCatalogVersion;
}
function loadOrCreateGeneratedMarket(){
 if(typeof makes==='undefined'||!marketTemplates.length)return;
 if(Number(state.marketListingsVersion||0)>=2&&Array.isArray(state.marketListings)&&state.marketListings.length){
   var saved=state.marketListings.filter(Boolean).map(function(x,i){return ensureMarketListingMeta(Object.assign({},x),i);});
   // Keep existing listing identities, diagnostics and favourites. Only add new models.
   fillGeneratedMarket(saved);
   makes.splice.apply(makes,[0,makes.length].concat(saved));
   reindexMarketListings();state.marketListingsVersion=marketCatalogVersion;
 }else generateInitialMarket();
}
function rotateGeneratedMarket(){return processScheduledMarketRefresh();}
function consumedMarketListingIds(){
 if(!Array.isArray(state.consumedMarketListingIds))state.consumedMarketListingIds=[];
 var ids=state.consumedMarketListingIds;
 function remember(car){
   var id=car&&car.listingId?String(car.listingId):'';
   if(id&&ids.indexOf(id)<0)ids.push(id);
 }
 if(Array.isArray(state.cars))state.cars.forEach(remember);
 if(state.car)remember(state.car);
 state.consumedMarketListingIds=ids.slice(-120);
 return state.consumedMarketListingIds;
}
function pruneConsumedMarketListings(){
 if(typeof makes==='undefined')return 0;
 var consumed=new Set(consumedMarketListingIds().map(String)),before=makes.length;
 for(var i=makes.length-1;i>=0;i--){
   var id=makes[i]&&makes[i].listingId?String(makes[i].listingId):'';
   if(id&&consumed.has(id))makes.splice(i,1);
 }
 if(before!==makes.length){
   reindexMarketListings();
   if(Array.isArray(state.marketFavorites))state.marketFavorites=state.marketFavorites.filter(function(id){return !consumed.has(String(id));});
 }
 return before-makes.length;
}
function removePurchasedListing(listingId,snapshot){
 if(typeof makes==='undefined')return 0;
 var before=makes.length,id=String(listingId||(snapshot&&snapshot.listingId)||'');
 if(!Array.isArray(state.consumedMarketListingIds))state.consumedMarketListingIds=[];
 if(id&&state.consumedMarketListingIds.indexOf(id)<0)state.consumedMarketListingIds.push(id);
 for(var i=makes.length-1;i>=0;i--){
   var car=makes[i],sameId=id&&String(car.listingId||'')===id;
   var sameSnapshot=!id&&snapshot&&car&&car.name===snapshot.name&&Number(car.year||0)===Number(snapshot.year||0)&&Number(car.km||0)===Number(snapshot.km||0)&&Number(car.price||0)===Number(snapshot.price||0);
   if(sameId||sameSnapshot)makes.splice(i,1);
 }
 if(before===makes.length&&snapshot&&!id){
   var fallback=makes.findIndex(function(car){
     return car&&car.name===snapshot.name&&Number(car.year||0)===Number(snapshot.year||0)&&Number(car.km||0)===Number(snapshot.km||0);
   });
   if(fallback>=0)makes.splice(fallback,1);
 }
 pruneConsumedMarketListings();
 fillGeneratedMarket(makes);
 reindexMarketListings();
 if(Array.isArray(state.marketFavorites)&&id)state.marketFavorites=state.marketFavorites.filter(function(x){return String(x)!==id;});
 state.liveMarket.priceFactors={};state.liveMarket.hiddenIds=[];state.liveMarket.newIds=[];state.liveMarket.hotIds=[];
 if(typeof localStorage!=='undefined')localStorage.setItem(KEY,JSON.stringify(state));
 return before-makes.length;
}
loadOrCreateGeneratedMarket();
pruneConsumedMarketListings();
reindexMarketListings();
localStorage.setItem(KEY,JSON.stringify(state));
if(Number(state.marketPhotoCatalogVersion||0)<marketPhotoCatalogVersion){
 if(typeof makes!=='undefined')makes.forEach(function(car,i){car.photoUrl=car.restorationProject&&car.photo?commons(car.photo):marketPhotoFor(car,i);});
 if(Array.isArray(state.cars))state.cars.forEach(function(car,i){if(car)car.photoUrl=car.restorationProject&&car.photo?commons(car.photo):marketPhotoFor(car,i);});
 if(state.car)state.car.photoUrl=state.car.restorationProject&&state.car.photo?commons(state.car.photo):marketPhotoFor(state.car,0);
 state.marketPhotoCatalogVersion=marketPhotoCatalogVersion;
 reindexMarketListings();
 localStorage.setItem(KEY,JSON.stringify(state));
}
if(Number(state.marketPhotoColorCatalogVersion||0)<marketPhotoColorCatalogVersion){
 if(typeof makes!=='undefined')makes.forEach(function(car,i){if(car)car.color=marketColorFor(car,i);});
 if(Array.isArray(state.cars))state.cars.forEach(function(car,i){if(car)car.color=marketColorFor(car,i);});
 if(state.car)state.car.color=marketColorFor(state.car,0);
 state.marketPhotoColorCatalogVersion=marketPhotoColorCatalogVersion;
 reindexMarketListings();
 localStorage.setItem(KEY,JSON.stringify(state));
}

var liveBasePrices=(typeof makes!=='undefined'?makes:[]).map(function(x){return Number(x.price||0);});
if(!state.gameClock||typeof state.gameClock!=='object')state.gameClock={total:450};
if(!Number.isFinite(Number(state.gameClock.total)))state.gameClock.total=450;
var clockAnchorReal=Date.now(),clockAnchorTotal=Number(state.gameClock.total||450);
function gameTotal(){return clockAnchorTotal+Math.floor((Date.now()-clockAnchorReal)/1000);}
function syncGameClock(){state.gameClock.total=gameTotal();}
function gameTimeText(){var t=gameTotal(),m=((t%1440)+1440)%1440,h=Math.floor(m/60),mm=m%60;return String(h).padStart(2,'0')+':'+String(mm).padStart(2,'0');}
function gameDateText(){var t=gameTotal(),d=Math.floor(t/1440),days=['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];return 'День '+(d+1)+' · '+days[d%7];}
function persist(){syncGameClock();localStorage.setItem(KEY,JSON.stringify(state));try{if(typeof renderStats==='function')renderStats();}catch(e){}}function requiredRepForCar(car){var v=Number((car&&car.market)||0);if(v<500000)return 0;if(v<1000000)return 20;if(v<2000000)return 40;if(v<3500000)return 70;if(v<5500000)return 100;return 130;}function creditPlan(){var r=Number(state.rep||0);if(r<20)return{title:'Стартовый лимит',amount:25000,maxDebt:55000,rate:.10,next:'20 репутации → кредит 100 000 ₽'};if(r<50)return{title:'Базовый лимит',amount:100000,maxDebt:220000,rate:.10,next:'50 репутации → кредит 250 000 ₽'};if(r<100)return{title:'Бизнес-лимит',amount:250000,maxDebt:550000,rate:.10,next:'100 репутации → кредит 500 000 ₽'};return{title:'Дилерский лимит',amount:500000,maxDebt:1100000,rate:.10,next:'Максимальный кредитный уровень'};}var originalBuy=window.buy;if(typeof originalBuy==='function'&&!originalBuy.__v78){var wrappedBuy=function(id,price){var target=(typeof makes!=='undefined'&&makes[id])?makes[id]:null,need=requiredRepForCar(target),capacity=typeof window.garageCapacity==='function'?window.garageCapacity():2;if(need>Number(state.rep||0)){alert('Недостаточно репутации. Для этой машины нужно '+need+' репутации. Сейчас: '+Number(state.rep||0)+'.');return;}if(state.cars.length>=capacity){alert('Гараж заполнен. Доступно мест: '+capacity+'. Улучши гараж или сначала продай одну машину.');return;}var before=state.car,ask=target?Number(target.price||0):0;originalBuy(id,price);var added=state.car;if(added&&added!==before){if(target&&target.listingId){added.sourceListingId=target.listingId;added.listingId=target.listingId;}if(!added._garageId)added._garageId='car-'+(++seq);if(!state.cars.some(function(x){return x._garageId===added._garageId;}))state.cars.push(added);state.car=added;if(target&&target.listingId)removePurchasedListing(target.listingId);var discount=ask>0?(ask-Number(price||0))/ask:0,bonus=discount>=.10?2:(discount>=.05?1:0);if(bonus>0){state.rep=Number(state.rep||0)+bonus;state.repHistory.unshift({delta:bonus,reason:'Сильный торг за '+added.name,day:state.day});state.repHistory=state.repHistory.slice(0,20);}persist();}};wrappedBuy.__v78=true;window.buy=wrappedBuy;}var originalRepair=window.repair;if(typeof originalRepair==='function'&&!originalRepair.__v78){var wrappedRepair=function(){var c=state.car,before=Number(state.money||0),result=originalRepair.apply(this,arguments);if(c&&state.money<before){c.repairSpent=Number(c.repairSpent||0)+(before-Number(state.money||0));persist();}return result;};wrappedRepair.__v78=true;window.repair=wrappedRepair;}var originalCloseSale=window.closeSale;if(typeof originalCloseSale==='function'&&!originalCloseSale.__v78){var wrappedCloseSale=function(mult){var sold=state.car,beforeRep=Number(state.rep||0),repDelta=0,streakBonus=0,profit=0,finalPrice=0,repairSpent=0;if(sold){finalPrice=Math.round(Number(sold.sale||0)*Number(mult||1));repairSpent=Number(sold.repairSpent||0);profit=finalPrice-Number(sold.buy||0)-repairSpent;var invested=Math.max(1,Number(sold.buy||0)+repairSpent),margin=profit/invested;if(profit<0){repDelta=-6;state.profitStreak=0;}else{state.profitStreak=Number(state.profitStreak||0)+1;if(margin<.05)repDelta=4;else if(margin<.12)repDelta=7;else if(margin<.20)repDelta=10;else repDelta=14;if(state.profitStreak>=3)streakBonus=Math.min(6,Math.floor(state.profitStreak/3)*2);repDelta+=streakBonus;}state.businessHistory.unshift({car:sold.name,buy:Number(sold.buy||0),repair:repairSpent,sale:finalPrice,profit:profit,rep:repDelta,day:state.day,city:sold.city,year:sold.year});state.businessHistory=state.businessHistory.slice(0,30);}var result=originalCloseSale.apply(this,arguments);if(sold){state.rep=Math.max(0,beforeRep+repDelta);var reason=profit<0?'Убыточная продажа '+sold.name:'Прибыль '+money(profit)+' на '+sold.name+(streakBonus?' · серия +'+streakBonus:'');state.repHistory.unshift({delta:repDelta,reason:reason,day:state.day-1});state.repHistory=state.repHistory.slice(0,20);state.cars=state.cars.filter(function(x){return x!==sold&&x._garageId!==sold._garageId;});}state.car=state.cars[0]||null;persist();return result;};wrappedCloseSale.__v78=true;window.closeSale=wrappedCloseSale;}window.selectGarageCar=function(index){var c=state.cars[index];if(!c)return;state.car=c;persist();window.garageCarDetails(index);};window.garageCarDetails=function(index){var c=state.cars[index];if(!c)return garage();state.car=c;var repairSpent=Number(c.repairSpent||0),key=c._garageId||('car-'+c.id+'-'+c.buy),listed=state.activeListing&&state.activeListing.status==='active'&&state.activeListing.carKey===key;render('<div class="app">'+head(c.name)+'<div class="pic" style="background-image:linear-gradient(#0002,#0008),url(\''+photo(c)+'\')">🚘</div><h3>'+c.name+'</h3><p class="muted">'+c.city+' · '+c.year+' · '+c.km.toLocaleString('ru-RU')+' км</p>'+(listed?'<div class="note"><b>🟢 Объявление активно</b><p class="muted">Цена: '+money(state.activeListing.ask)+'. Покупатели могут написать в «Сообщения» в любой момент.</p></div>':'')+'<div class="bar"><i style="width:'+(c.repaired?100:45)+'%"></i></div><p class="muted">Состояние '+(c.repaired?'100':'45')+'%</p><div class="deal-score"><span>ПОКУПКА<b>'+money(c.buy)+'</b></span><span>РЕМОНТ<b>'+money(repairSpent)+'</b></span><span>ПРОДАЖА<b class="profit">'+money(c.sale)+'</b></span></div><button class="action" onclick="sellCar()">'+(listed?'💬 Моё объявление':'🏷️ Выставить на продажу')+'</button><button class="action" onclick="garage()">‹ Назад в гараж</button></div>');};window.garage=function(){var cars=Array.isArray(state.cars)?state.cars:[];if(!cars.length){render('<div class="app">'+head('Гараж')+'<div class="note"><b>Гараж пуст</b><p class="muted">Первая машина ждёт тебя на рынке.</p></div><button class="action green" onclick="market()">🚗 Открыть рынок</button></div>');return;}var cards=cars.map(function(c,i){var repairSpent=Number(c.repairSpent||0),buy=Number(c.buy||0),marketValue=Number(c.market||c.sale||0),status=c.repaired?'🟢 Готова к продаже':'🟠 Требует подготовки';return '<div class="note" style="margin-bottom:10px;cursor:pointer" onclick="selectGarageCar('+i+')"><div class="row"><span><b>🚗 '+c.name+'</b><small>'+c.year+' · '+c.km.toLocaleString('ru-RU')+' км</small></span><b>'+money(buy)+'</b></div><div class="muted">'+status+' · ремонт '+money(repairSpent)+'</div><div class="row"><span>Рыночная стоимость</span><b>'+money(marketValue)+'</b></div></div>';}).join('');render('<div class="app">'+head('Гараж')+'<div class="statsbox"><div class="stat"><b>'+cars.length+'/'+(typeof window.garageCapacity==='function'?window.garageCapacity():2)+'</b><small>места заняты</small></div><div class="stat"><b>'+money(state.money)+'</b><small>капитал</small></div><div class="stat"><b>'+money(cars.reduce(function(a,c){return a+Number(c.buy||0);},0))+'</b><small>вложено</small></div></div>'+cards+'<button class="action green" onclick="market()">🚗 Найти ещё автомобиль</button><p class="muted" style="text-align:center">Нажми на автомобиль, чтобы открыть его карточку.</p></div>');};
window.profile=function(){var r=Number(state.rep||0),rank=r<20?'Начинающий перекуп':r<50?'Перекуп':r<100?'Опытный перекуп':r<130?'Дилер':'Автодилер',next=r<20?'20':r<50?'50':r<100?'100':r<130?'130':'MAX',hist=(state.repHistory||[]).slice(0,5).map(function(x){var d=Number(x.delta||0);return '<div class="row"><span><b>'+(d>=0?'+'+d:d)+' реп.</b><small>'+x.reason+' · день '+x.day+'</small></span></div>';}).join('');render('<div class="app">'+head('Профиль')+'<div class="profile-card"><div class="avatar">A</div><h3>'+rank+'</h3><p class="muted">'+state.city+' · день '+state.day+'</p><div class="statsbox"><div class="stat"><b>'+money(state.money)+'</b><small>капитал</small></div><div class="stat"><b>'+r+'</b><small>репутация</small></div><div class="stat"><b>'+Number(state.profitStreak||0)+'</b><small>серия прибыли</small></div></div></div><div class="note"><b>⭐ Прогресс репутации</b><p class="muted">Следующий уровень: '+next+(next==='MAX'?'':' репутации')+'. Репутация теперь зависит от качества сделок, а не просто от их количества.</p></div>'+(hist||'<div class="note">История репутации появится после первой сделки.</div>')+'<div class="row"><span>🚗 Машина</span><b>'+(state.car?state.car.name:'нет')+'</b></div><div class="row"><span>🏦 Долг</span><b>'+money(state.loan)+'</b></div></div>');};
var basePayLoan=window.payLoan;window.bank=function(){var p=creditPlan(),available=Math.max(0,p.maxDebt-Number(state.loan||0)),canTake=available>=Math.round(p.amount*(1+p.rate)),due='';if(state.loan&&state.bankDueAt&&typeof gameTotal==='function'){var left=Math.max(0,Number(state.bankDueAt)-gameTotal()),hours=Math.ceil(left/60);due='<span class="muted">До платежа: '+hours+' игровых ч.</span>';}render('<div class="app">'+head('Банк')+'<div class="bank"><small>Свободные деньги</small><b>'+money(state.money)+'</b><span class="muted">Текущий долг: '+money(state.loan)+'</span>'+due+'</div><div class="note"><b>🏦 '+p.title+'</b><p class="muted">Репутация: '+Number(state.rep||0)+' · доступный транш: '+money(p.amount)+' · комиссия 10%</p><p class="muted">'+p.next+'</p></div><button class="action green" '+(canTake?'':'disabled')+' onclick="takeLoan()">Взять '+money(p.amount)+'</button>'+(state.loan?'<button class="action" onclick="payLoan()">Погасить '+money(state.loan)+'</button>':'')+'<div class="note" style="margin-top:10px">Кредитный лимит растёт вместе с репутацией. Банк напомнит о сроке платежа через уведомления.</div></div>');};window.takeLoan=function(){var p=creditPlan(),debt=Math.round(p.amount*(1+p.rate)),hadDebt=Number(state.loan||0)>0;if(Number(state.loan||0)+debt>p.maxDebt)return alert('Текущий кредитный лимит исчерпан. Повышай репутацию или погаси долг.');state.money+=p.amount;state.loan=Number(state.loan||0)+debt;if(!hadDebt&&typeof gameTotal==='function')state.bankDueAt=gameTotal()+2880;log('Банк выдал '+money(p.amount)+'. Долг вырос до '+money(state.loan)+'.');bank();};if(typeof basePayLoan==='function'){window.payLoan=function(){var r=basePayLoan.apply(this,arguments);if(Number(state.loan||0)<=0){state.bankDueAt=0;if(typeof persist==='function')persist();}return r;};}
function rerollLiveMarket(){
  var list=typeof makes!=='undefined'?makes:[];
  list.forEach(function(car,i){ensureMarketListingMeta(car,i);});
  if(!list.length)return;
  var factors={},hidden=[],fresh=[],hot=[];
  list.forEach(function(car,i){
    var roll=Math.random(),factor=1;
    if(roll<0.22)factor=.94+Math.random()*.04;
    else if(roll>.78)factor=1.02+Math.random()*.05;
    if(i<4)factor=Math.max(.96,Math.min(1.03,factor));
    factors[car.id]=Number(factor.toFixed(3));
  });
  hidden=[];
  var visible=list.map(function(car){return car.id;});
  while(fresh.length<Math.min(3,visible.length)){
    var n=visible[Math.floor(Math.random()*visible.length)];
    if(fresh.indexOf(n)<0)fresh.push(n);
  }
  while(hot.length<Math.min(3,visible.length)){
    var x=visible[Math.floor(Math.random()*visible.length)];
    if(hot.indexOf(x)<0&&fresh.indexOf(x)<0)hot.push(x);
  }
  state.liveMarket.priceFactors=factors;
  state.liveMarket.hiddenIds=hidden;
  state.liveMarket.newIds=fresh;
  state.liveMarket.hotIds=hot;
  persist();
}
function applyLiveMarket(){
  if(typeof makes==='undefined')return;
  if(!state.liveMarket.priceFactors||!Object.keys(state.liveMarket.priceFactors).length)rerollLiveMarket();
  makes.forEach(function(car,i){
    var base=Number(car.basePrice||liveBasePrices[i]||car.price||0),factor=Number(state.liveMarket.priceFactors[car.id]||1);
    car.price=Math.max(10000,Math.round(base*factor/1000)*1000);
  });
}
function cardId(card){
  var s=card.getAttribute('onclick')||'',m=s.match(/carView\((\d+)\)/);
  return m?Number(m[1]):-1;
}
function decorateMarket(){
  var cards=[].slice.call(document.querySelectorAll('.app .market'));
  if(!cards.length)return;
  var types=[['🔥','Срочно продаёт'],['👤','Обычный продавец'],['⚠️','Перекупщик'],['💎','Владелец']];
  cards.forEach(function(card){
    var id=cardId(card);
    if(state.liveMarket.hiddenIds.indexOf(id)>=0){card.remove();return;}if(card.querySelector('.v79-seller'))return;var needRep=(id>=0&&typeof makes!=='undefined'&&makes[id])?requiredRepForCar(makes[id]):0;if(needRep>Number(state.rep||0)){var lock=document.createElement('div');lock.className='muted';lock.style.marginTop='6px';lock.style.fontSize='12px';lock.textContent='🔒 Нужно '+needRep+' репутации · сейчас '+Number(state.rep||0);card.appendChild(lock);card.style.opacity='.68';}
    var car=(id>=0&&typeof makes!=='undefined')?makes[id]:null,t=types[(id>=0?id:0)%types.length],factor=Number(state.liveMarket.priceFactors[id]||1),status='',badge='';
    if(car){t=[car.sellerUrgency==='high'?'🔥':(car.sellerKind==='Перекупщик'?'⚠️':'👤'),(car.sellerName||'Продавец')+' · '+(car.sellerKind||'Частник')];}
    if(state.liveMarket.newIds.indexOf(id)>=0){status=' · 🆕 Новое объявление';badge='🆕 Новое';}
    else if(factor<.985){status=' · 🔻 Цена реально снижена';badge='🔻 Цена снижена';}
    else if(state.liveMarket.hotIds.indexOf(id)>=0||factor>1.025){status=' · ⏳ Высокий спрос';badge='⏳ Могут купить';}
    var delta=Math.round((factor-1)*100),priceText=delta===0?'цена без изменений':(delta>0?'цена +'+delta+'%':'цена '+delta+'%');
    var el=document.createElement('div');
    el.className='muted v79-seller';
    el.style.marginTop='6px';el.style.fontSize='12px';
    el.textContent=t[0]+' '+t[1]+(car?' · '+marketAgeText(car):'')+' · '+priceText+status;
    card.appendChild(el);
    if(badge){var pic=card.querySelector('.pic');if(pic){var tag=document.createElement('span');tag.textContent=badge;tag.style.cssText='display:inline-block;background:#111c;color:#fff;padding:4px 7px;border-radius:8px;font-size:10px;margin:6px';pic.appendChild(tag);}}
  });
  updateMarketCountdownUI();
}
var originalMarket=window.market;
if(typeof originalMarket==='function'&&!originalMarket.__v79){
  window.market=function(){
    state.liveMarket.visits=Number(state.liveMarket.visits||0)+1;
    var updates=processScheduledMarketRefresh();
    if(!state.liveMarket.priceFactors||!Object.keys(state.liveMarket.priceFactors).length||updates.length)rerollLiveMarket();
    applyLiveMarket();
    originalMarket.apply(this,arguments);
    setTimeout(decorateMarket,120);
  };
  window.market.__v79=true;
}
window.refreshLiveMarket=function(){return market('new',0);};
window.now=gameTimeText;
window.dateText=gameDateText;
window.getGameTotal=gameTotal;
if(!Array.isArray(state.phoneNotifications))state.phoneNotifications=[];
if(!state.phoneEventMeta||typeof state.phoneEventMeta!=='object')state.phoneEventMeta={};
function phoneUnread(){return state.phoneNotifications.filter(function(n){return !n.read;}).length;}
function pushPhoneNotification(app,icon,text,route,key){
  if(key&&state.phoneNotifications.some(function(n){return n.key===key;}))return;
  var n={id:'pn-'+Date.now()+'-'+Math.floor(Math.random()*9999),app:app,icon:icon,text:text,route:route||'',key:key||'',read:false,total:gameTotal(),time:gameTimeText(),day:gameDateText()};
  state.phoneNotifications.unshift(n);state.phoneNotifications=state.phoneNotifications.slice(0,40);
  localStorage.setItem(KEY,JSON.stringify(state));
  updateNotificationBadge();
}
function updateNotificationBadge(){
  var btn=document.getElementById('phoneNotificationsApp');if(!btn)return;
  var old=btn.querySelector('.phone-notification-badge');if(old)old.remove();
  var n=phoneUnread();if(!n)return;
  var b=document.createElement('span');b.className='phone-notification-badge';b.textContent=n>9?'9+':String(n);b.style.cssText='position:absolute;right:6px;top:2px;background:#e33;color:#fff;border-radius:10px;min-width:18px;height:18px;line-height:18px;font-size:10px;font-weight:800;text-align:center;padding:0 3px';btn.style.position='relative';btn.appendChild(b);
}
window.notificationCenter=function(){
  var list=state.phoneNotifications||[];
  var html='<div class="app">'+head('Уведомления')+'<div class="note"><b>🔔 Центр уведомлений</b><p class="muted">'+(phoneUnread()?'Непрочитанных: '+phoneUnread():'Новых уведомлений нет')+'</p></div>';
  if(!list.length)html+='<div class="note"><p class="muted">Здесь будут сообщения от AutoMarket, банка, покупателей и других приложений.</p></div>';
  else html+=list.map(function(n){return '<div class="notification" style="cursor:pointer;opacity:'+(n.read?'.72':'1')+'" onclick="openPhoneNotification(\''+n.id+'\')"><b>'+n.icon+' '+n.app+'</b><span>'+n.text+'</span><small class="muted">'+n.day+' · '+n.time+(n.read?'':' · новое')+'</small></div>';}).join('');
  html+='<button class="action" onclick="markPhoneNotificationsRead()">✓ Отметить всё прочитанным</button></div>';render(html);
};
window.markPhoneNotificationsRead=function(){(state.phoneNotifications||[]).forEach(function(n){n.read=true;});localStorage.setItem(KEY,JSON.stringify(state));notificationCenter();};
window.marketUpdateDetails=function(id){
 var list=Array.isArray(state.marketUpdateHistory)?state.marketUpdateHistory:[],u=list.find(function(x){return x.id===id;})||list[0];
 if(!u)return market('new',0);
 var removed=(u.removed||[]).map(function(x){return '<div class="row"><span><b>↗ '+x.name+'</b><small>'+(x.reason==='seller'?'Продавец снял объявление':'Купил другой покупатель')+'</small></span><strong>'+money(x.price)+'</strong></div>';}).join('');
 var added=(u.added||[]).map(function(x){return '<div class="row"><span><b>🆕 '+x.name+'</b><small>'+x.city+' · '+x.listingId+'</small></span><strong>'+money(x.price)+'</strong></div>';}).join('');
 render('<div class="app">'+head('Изменения рынка')+'<div class="note"><small>ОБНОВЛЕНИЕ РЫНКА</small><h3>📈 '+(u.day||'')+' · '+(u.time||'')+'</h3><p class="muted">AutoMarket обновляется автоматически каждые 6 игровых часов.</p></div><div class="note"><b>Ушли с рынка · '+(u.removed||[]).length+'</b></div>'+removed+'<div class="note" style="margin-top:10px"><b>Новые объявления · '+(u.added||[]).length+'</b></div>'+added+'<button class="action green" onclick="market(\'new\',0)">🆕 Смотреть новые объявления</button><button class="action" onclick="notificationCenter()">‹ К уведомлениям</button></div>');
};
window.openPhoneNotification=function(id){
  var n=(state.phoneNotifications||[]).find(function(x){return x.id===id;});if(!n)return notificationCenter();
  n.read=true;localStorage.setItem(KEY,JSON.stringify(state));
  if(n.route==='messages'&&typeof messages==='function')return messages();
  if(n.route==='bank'&&typeof bank==='function')return bank();
  if(n.route==='listing'&&typeof sellCar==='function')return sellCar();
  if(n.route&&n.route.indexOf('market-update:')===0&&typeof marketUpdateDetails==='function')return marketUpdateDetails(n.route.split(':')[1]);
  if(n.route==='market'&&typeof market==='function')return market('new',0);
  if(n.route==='garage'&&typeof garage==='function')return garage();
  notificationCenter();
};
function syncBuyerNotifications(){
  if(!Array.isArray(state.buyerInbox))return;
  state.buyerInbox.forEach(function(x){
    if(x&&x.id)pushPhoneNotification('Сообщения','💬',x.name+': '+x.text,'messages','buyer-'+x.id);
  });
}
function processPhoneLifeEvents(){
  var meta=state.phoneEventMeta||(state.phoneEventMeta={}),now=gameTotal(),day=Math.floor(now/1440);
  processScheduledMarketRefresh();
  syncBuyerNotifications();
  var saleListings=typeof window.autoFlipActiveListings==='function'?window.autoFlipActiveListings():(state.activeListing?[state.activeListing]:[]);
  if(!meta.listingStats||typeof meta.listingStats!=='object')meta.listingStats={};
  saleListings.forEach(function(l){
    if(!l||l.status!=='active')return;if(!Number.isFinite(Number(l.views)))l.views=0;if(!Number.isFinite(Number(l.favorites)))l.favorites=0;
    var last=Number(meta.listingStats[l.id]||l.postedAt||now);
    if(now-last>=90){
      var blocks=Math.min(4,Math.max(1,Math.floor((now-last)/90))),views=0,favs=0;
      for(var k=0;k<blocks;k++){var v=3+Math.floor(Math.random()*8);views+=v;if(Math.random()<.38)favs++;}
      l.views+=views;l.favorites+=favs;meta.listingStats[l.id]=last+blocks*90;
      pushPhoneNotification('AutoMarket','🚗','По объявлению: +'+views+' просмотров'+(favs?' · +'+favs+' в избранное':'')+'. Всего '+l.views+' просмотров.','listing','stats-'+l.id+'-'+Math.floor(meta.listingStats[l.id]/90));
    }
  });
  if(Number(state.loan||0)>0){
    if(!state.bankDueAt)state.bankDueAt=now+2880;
    var left=Number(state.bankDueAt)-now;
    if(left<=720&&left>0&&!meta.bankWarnedForDue){
      meta.bankWarnedForDue=state.bankDueAt;
      pushPhoneNotification('Банк','🏦','До срока платежа осталось около '+Math.max(1,Math.ceil(left/60))+' игровых часов. Долг: '+money(state.loan)+'.','bank','bank-warning-'+state.bankDueAt);
    }
    if(left<=0&&meta.bankOverdueDay!==day){
      meta.bankOverdueDay=day;
      pushPhoneNotification('Банк','⚠️','Срок платежа наступил. Текущий долг: '+money(state.loan)+'.','bank','bank-overdue-'+day);
    }
  }else{meta.bankWarnedForDue=0;meta.bankOverdueDay=-1;}
  localStorage.setItem(KEY,JSON.stringify(state));
}
setInterval(processPhoneLifeEvents,1000);
function updateGameClockUI(){
  var time=gameTimeText(),date=gameDateText();
  document.querySelectorAll('.status').forEach(function(s){var first=s.querySelector('span');if(first)first.textContent=time;});
  document.querySelectorAll('.clock').forEach(function(el){el.textContent=time;});
  document.querySelectorAll('.home-top small').forEach(function(el){el.textContent=date;});
}
setInterval(function(){updateGameClockUI();updateMarketCountdownUI();if(typeof window.updateBankCooldownUI==='function')window.updateBankCooldownUI();if(gameTotal()%10===0){syncGameClock();localStorage.setItem(KEY,JSON.stringify(state));}},1000);
window.addEventListener('beforeunload',function(){syncGameClock();localStorage.setItem(KEY,JSON.stringify(state));});
function advanceGameMinutes(mins){
  clockAnchorTotal=gameTotal()+Math.max(0,Math.round(Number(mins)||0));
  clockAnchorReal=Date.now();
  state.gameClock.total=clockAnchorTotal;
  updateGameClockUI();
}
window.advanceGameMinutes=advanceGameMinutes;
window.sleepUntilGame=function(clock){
  var total=gameTotal(),minute=((total%1440)+1440)%1440,canSleep=minute>=1260||minute<480;
  if(!canSleep){
    alert('Лечь спать можно только с 21:00 до 08:00. Сейчас '+gameTimeText()+'.');
    return realty();
  }
  var parts=String(clock||'08:00').split(':'),wakeMinute=Math.max(0,Math.min(480,Number(parts[0]||0)*60+Number(parts[1]||0)));
  var dayStart=total-minute,target=minute>=1260?dayStart+1440+wakeMinute:dayStart+wakeMinute;
  if(target<=total)return alert('Время пробуждения должно быть позже текущего времени и не позднее 08:00.');
  var mins=target-total;
  if(mins<=0)return realty();
  var sleepStart=gameTotal();
  advanceGameMinutes(mins);
  var sleepEnd=gameTotal(),sleepBuyerCount=0;
  if(typeof window.processBuyerSleep==='function')sleepBuyerCount=window.processBuyerSleep(sleepStart,sleepEnd,2);
  var sleepMarketUpdates=processScheduledMarketRefresh();
  state.notifications=Number(state.notifications||0)+1;
  if(!Array.isArray(state.lifeEvents))state.lifeEvents=[];
  if(sleepMarketUpdates.length)state.lifeEvents.unshift({time:gameTimeText(),day:gameDateText(),text:'Пока ты спал, AutoMarket обновился '+sleepMarketUpdates.length+' раз.'});
  state.lifeEvents=state.lifeEvents.slice(0,10);
  persist();
  render('<div class="app">'+head('Пробуждение')+'<div class="note"><small>СОН ЗАВЕРШЁН</small><h3>☀️ '+gameDateText()+' · '+gameTimeText()+'</h3><p class="muted">Ты проснулся в выбранное время. Встречи, рынок и сообщения учитывают прошедшие часы.</p></div>'+(sleepMarketUpdates.length?'<div class="notification"><b>🚗 AutoMarket</b><span>За время сна рынок обновился '+sleepMarketUpdates.length+' раз. Подробности уже в уведомлениях.</span></div>':'')+(sleepBuyerCount?'<div class="notification"><b>💬 Покупатели</b><span>Пока ты спал, пришло сообщений: '+sleepBuyerCount+'.</span></div>':'<div class="notification"><b>🔔 Телефон</b><span>За время сна новых сообщений от покупателей не было.</span></div>')+'<button class="action green" onclick="home()">📱 Взять телефон</button></div>');
};
window.sleepGame=function(){return sleepUntilGame('08:00');};
window.realty=function(){
  var total=gameTotal(),minute=((total%1440)+1440)%1440,canSleep=minute>=1260||minute<480;
  var nextMeeting=(state.meetings||[]).filter(function(m){return m.status==='scheduled'&&m.at>total;}).sort(function(a,b){return a.at-b.at;})[0];
  var meetingHint=nextMeeting?'<div class="meeting-travel-warning"><span>📅</span><div><b>Ближайшая встреча · '+nextMeeting.carName+'</b><small>'+((window.autoFlipMeetings&&window.autoFlipMeetings.format(nextMeeting.at))||nextMeeting.at)+' · '+nextMeeting.city+'</small></div></div>':'';
  var wakeValue=minute<420&&minute>=0?String(Math.max(Math.floor(minute/60)+1,6)).padStart(2,'0')+':00':'07:00';
  var sleepBlock=canSleep
    ?meetingHint+'<div class="sleep-wake-card"><b>Во сколько проснуться?</b><p>Выбери любое время до 08:00, чтобы успеть на встречу.</p><div class="sleep-wake-presets"><button onclick="sleepUntilGame(\'06:00\')">06:00</button><button onclick="sleepUntilGame(\'07:00\')">07:00</button><button onclick="sleepUntilGame(\'08:00\')">08:00</button></div><label>Другое время<input id="sleepWakeTime" type="time" min="00:00" max="08:00" value="'+wakeValue+'"></label><button class="action green" onclick="sleepUntilGame(document.getElementById(\'sleepWakeTime\').value)">🛏️ Лечь спать</button></div>'
    :'<div class="note" style="margin-top:10px"><b>🔒 Спать пока рано</b><p class="muted">Лечь спать можно только с 21:00 до 08:00. Днём занимайся рынком, ремонтом, поездками и сделками.</p></div><button class="action" disabled>😴 Сон откроется в 21:00</button>';
  render('<div class="app">'+head('Дом')+'<div class="note"><small>СЕЙЧАС</small><h3>🏠 '+gameDateText()+' · '+gameTimeText()+'</h3><p class="muted">'+(canSleep?'Можно закончить день и выбрать время пробуждения.':'Сейчас дневное время — спать нельзя.')+'</p></div>'+sleepBlock+'<div class="note" style="margin-top:10px"><b>⏱ Игровое время</b><p class="muted">1 реальная минута = 1 игровой час.</p></div></div>');
};

// Keep the currently selected garage car linked to its own sale listing.
var autoFlipSelectGarageCar=window.selectGarageCar;
if(typeof autoFlipSelectGarageCar==='function')window.selectGarageCar=function(index){
  var c=Array.isArray(state.cars)?state.cars[index]:null;
  if(c&&typeof window.activeListingForCar==='function')state.activeListing=window.activeListingForCar(c)||((state.activeListings||[])[0]||null);
  return autoFlipSelectGarageCar.apply(this,arguments);
};
var oldHome=window.home;if(typeof oldHome==='function'&&!oldHome.__v79live){window.home=function(){oldHome.apply(this,arguments);setTimeout(function(){var apps=document.querySelector('.apps'),appBtn=[].slice.call(document.querySelectorAll('.apps button')).find(function(b){return b.textContent.indexOf('Авто')>=0;});if(appBtn&&!document.getElementById('v79RefreshHint')){var h=document.createElement('small');h.id='v79RefreshHint';h.textContent=' LIVE';h.style.opacity='.65';appBtn.appendChild(h);}if(apps&&!document.getElementById('phoneNotificationsApp')){var btn=document.createElement('button');btn.id='phoneNotificationsApp';btn.setAttribute('onclick','notificationCenter()');btn.innerHTML='<div class="icon red">🔔</div><small>Уведомления</small>';apps.appendChild(btn);}updateNotificationBadge();},120);};window.home.__v79live=true;}
persist();}install();})();
