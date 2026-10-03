// AutoFlip V7.8 compatibility layer
// Keeps the V7 core intact and adds a 3-car fleet on top of it.
document.write('<script src="script_base.js"></'+'script>');

(function(){
  function install(){
    if(typeof state==='undefined' || typeof KEY==='undefined' || typeof render!=='function' || typeof head!=='function' || typeof money!=='function'){
      setTimeout(install,50); return;
    }

    if(!Array.isArray(state.cars)) state.cars=[];
    if(state.car && !state.cars.some(function(x){return x===state.car || (x._garageId && x._garageId===state.car._garageId);})) state.cars.push(state.car);
    state.cars=state.cars.filter(Boolean).slice(0,3);
    var seq=Date.now();
    state.cars.forEach(function(c){ if(!c._garageId) c._garageId='car-'+(++seq); });
    if(!state.car && state.cars.length) state.car=state.cars[0];
    if(!state.businessHistory) state.businessHistory=[];

    function persist(){
      localStorage.setItem(KEY,JSON.stringify(state));
      try{ if(typeof renderStats==='function') renderStats(); }catch(e){}
    }

    // Buying: preserve the original V7 purchase mechanics, but keep every purchased car.
    var originalBuy=window.buy;
    if(typeof originalBuy==='function' && !originalBuy.__v78){
      var wrappedBuy=function(id,price){
        if(state.cars.length>=3){ alert('Гараж заполнен. Максимум 3 автомобиля. Сначала продай одну машину.'); return; }
        var before=state.car;
        originalBuy(id,price);
        var added=state.car;
        if(added && added!==before){
          if(!added._garageId) added._garageId='car-'+(++seq);
          if(!state.cars.some(function(x){return x._garageId===added._garageId;})) state.cars.push(added);
          state.car=added;
          persist();
        }
      };
      wrappedBuy.__v78=true;
      window.buy=wrappedBuy;
    }

    // Track repair spending because the original V7 repair function only changes the balance.
    var originalRepair=window.repair;
    if(typeof originalRepair==='function' && !originalRepair.__v78){
      var wrappedRepair=function(){
        var c=state.car, before=Number(state.money||0);
        var result=originalRepair.apply(this,arguments);
        if(c && state.money<before){
          c.repairSpent=Number(c.repairSpent||0)+(before-Number(state.money||0));
          persist();
        }
        return result;
      };
      wrappedRepair.__v78=true;
      window.repair=wrappedRepair;
    }

    // The actual V7 sale function is closeSale(mult). Record the deal and remove only that car.
    var originalCloseSale=window.closeSale;
    if(typeof originalCloseSale==='function' && !originalCloseSale.__v78){
      var wrappedCloseSale=function(mult){
        var sold=state.car;
        if(sold){
          var finalPrice=Math.round(Number(sold.sale||0)*Number(mult||1));
          var repairSpent=Number(sold.repairSpent||0);
          var profit=finalPrice-Number(sold.buy||0)-repairSpent;
          state.businessHistory.unshift({car:sold.name,buy:Number(sold.buy||0),repair:repairSpent,sale:finalPrice,profit:profit,day:state.day,city:sold.city,year:sold.year});
          state.businessHistory=state.businessHistory.slice(0,30);
        }
        var result=originalCloseSale.apply(this,arguments);
        if(sold){ state.cars=state.cars.filter(function(x){return x!==sold && x._garageId!==sold._garageId;}); }
        state.car=state.cars[0]||null;
        persist();
        return result;
      };
      wrappedCloseSale.__v78=true;
      window.closeSale=wrappedCloseSale;
    }

    window.selectGarageCar=function(index){
      var c=state.cars[index];
      if(!c) return;
      state.car=c;
      persist();
      window.garageCarDetails(index);
    };

    window.garageCarDetails=function(index){
      var c=state.cars[index];
      if(!c) return garage();
      state.car=c;
      var repairSpent=Number(c.repairSpent||0);
      render('<div class="app">'+head(c.name)+
        '<div class="pic" style="background-image:linear-gradient(#0002,#0008),url(\''+photo(c)+'\')">🚘</div>'+ 
        '<h3>'+c.name+'</h3><p class="muted">'+c.city+' · '+c.year+' · '+c.km.toLocaleString('ru-RU')+' км</p>'+ 
        '<div class="bar"><i style="width:'+(c.repaired?100:45)+'%"></i></div>'+ 
        '<p class="muted">Состояние '+(c.repaired?'100':'45')+'%</p>'+ 
        '<div class="deal-score"><span>ПОКУПКА<b>'+money(c.buy)+'</b></span><span>РЕМОНТ<b>'+money(repairSpent)+'</b></span><span>ПРОДАЖА<b class="profit">'+money(c.sale)+'</b></span></div>'+ 
        '<button class="action green" onclick="repair()">🔧 '+(c.repaired?'Авто отремонтировано':('Ремонт · '+money(c.repair)))+'</button>'+ 
        '<button class="action" onclick="service()">🛠️ Открыть СТО</button>'+ 
        '<button class="action" onclick="sell()">💰 Найти покупателя</button>'+ 
        '<button class="action" onclick="garage()">‹ Назад в гараж</button></div>');
    };

    window.garage=function(){
      var cars=Array.isArray(state.cars)?state.cars:[];
      if(!cars.length){
        render('<div class="app">'+head('Гараж')+'<div class="note"><b>Гараж пуст</b><p class="muted">Первая машина ждёт тебя на рынке.</p></div><button class="action green" onclick="market()">🚗 Открыть рынок</button></div>');
        return;
      }
      var cards=cars.map(function(c,i){
        var repairSpent=Number(c.repairSpent||0), buy=Number(c.buy||0), market=Number(c.market||c.sale||0), status=c.repaired?'🟢 Готова к продаже':'🟠 Требует подготовки';
        return '<div class="note" style="margin-bottom:10px;cursor:pointer" onclick="selectGarageCar('+i+')">'+
          '<div class="row"><span><b>🚗 '+c.name+'</b><small>'+c.year+' · '+c.km.toLocaleString('ru-RU')+' км</small></span><b>'+money(buy)+'</b></div>'+ 
          '<div class="muted">'+status+' · ремонт '+money(repairSpent)+'</div>'+ 
          '<div class="row"><span>Рыночная стоимость</span><b>'+money(market)+'</b></div>'+ 
          '</div>';
      }).join('');
      render('<div class="app">'+head('Гараж')+'<div class="statsbox"><div class="stat"><b>'+cars.length+'/3</b><small>места заняты</small></div><div class="stat"><b>'+money(state.money)+'</b><small>капитал</small></div><div class="stat"><b>'+money(cars.reduce(function(a,c){return a+Number(c.buy||0);},0))+'</b><small>вложено</small></div></div>'+cards+'<button class="action green" onclick="market()">🚗 Найти ещё автомобиль</button><p class="muted" style="text-align:center">Нажми на автомобиль, чтобы открыть его карточку.</p></div>');
    };

    // Profile remains compatible with V7.7 and now includes active inventory.
    window.profile=function(){
      var h=Array.isArray(state.businessHistory)?state.businessHistory:[], cars=Array.isArray(state.cars)?state.cars:[];
      var sold=h.length, bought=sold+cars.length;
      var totalBuy=h.reduce(function(a,x){return a+Number(x.buy||0);},0)+cars.reduce(function(a,x){return a+Number(x.buy||0);},0);
      var totalRepair=h.reduce(function(a,x){return a+Number(x.repair||0);},0)+cars.reduce(function(a,x){return a+Number(x.repairSpent||0);},0);
      var revenue=h.reduce(function(a,x){return a+Number(x.sale||0);},0), profit=h.reduce(function(a,x){return a+Number(x.profit||0);},0);
      var best=sold?Math.max.apply(null,h.map(function(x){return Number(x.profit||0);})):0, avg=sold?Math.round(profit/sold):0;
      var rank=Number(state.rep||0)<30?'Начинающий перекуп':Number(state.rep||0)<80?'Опытный перекуп':'Автодилер';
      var history=h.length?'<div class="note"><b>Последние сделки</b>'+h.slice(0,6).map(function(x){var p=Number(x.profit||0);return '<div class="row"><span>🚗 '+(x.car||'Автомобиль')+'<small>'+(x.year||'')+' · '+(x.city||'')+'</small></span><b class="'+(p>=0?'profit':'')+'">'+(p>=0?'+':'')+money(p)+'</b></div><div class="muted" style="padding:0 0 8px">Покупка '+money(x.buy)+' · ремонт '+money(x.repair)+' · продажа '+money(x.sale)+'</div>';}).join('')+'</div>':'<div class="note"><b>История пока пуста</b><p class="muted">Продай первый автомобиль, и здесь появится результат сделки.</p></div>';
      render('<div class="app">'+head('Профиль')+'<div class="profile-card"><div class="avatar">A</div><h3>'+rank+'</h3><p class="muted">'+(state.city||'Москва')+' · день '+(state.day||1)+'</p></div><div class="statsbox"><div class="stat"><b>'+money(state.money)+'</b><small>капитал</small></div><div class="stat"><b>'+Number(state.rep||0)+'</b><small>репутация</small></div><div class="stat"><b>'+sold+'</b><small>продано</small></div></div><div class="note"><b>📊 Статистика бизнеса</b><div class="row"><span>🚗 Куплено</span><b>'+bought+'</b></div><div class="row"><span>🏷️ Продано</span><b>'+sold+'</b></div><div class="row"><span>🚘 В гараже</span><b>'+cars.length+'</b></div><div class="row"><span>💸 Покупки</span><b>'+money(totalBuy)+'</b></div><div class="row"><span>🔧 Ремонт</span><b>'+money(totalRepair)+'</b></div><div class="row"><span>💰 Выручка</span><b>'+money(revenue)+'</b></div><div class="row"><span>📈 Общая прибыль</span><b class="'+(profit>=0?'profit':'')+'">'+(profit>=0?'+':'')+money(profit)+'</b></div><div class="row"><span>📊 Средняя прибыль</span><b>'+money(avg)+'</b></div><div class="row"><span>🏆 Лучшая сделка</span><b>'+money(best)+'</b></div></div>'+ (cars.length?'<div class="note"><b>🚘 Автопарк</b>'+cars.map(function(c){return '<div class="row"><span>'+c.name+'<small>'+c.year+'</small></span><b>'+money(c.buy)+'</b></div>';}).join('')+'</div>':'')+history+'</div>');
    };

    persist();
  }
  install();
})();
