// AutoFlip V7.9 — Live Market
// Seller personalities are layered over the existing V7.8 negotiation flow.
(function(){
  'use strict';
  var profiles=[
    {type:'Срочно продаёт',icon:'🔥',name:'Алексей',min:.88,style:'Ему нужны деньги сегодня. Готов уступить, но хочет закрыть сделку быстро.'},
    {type:'Обычный продавец',icon:'👤',name:'Дмитрий',min:.94,style:'Спокойно торгуется, но без большой причины цену снижать не хочет.'},
    {type:'Перекупщик',icon:'⚠️',name:'Илья',min:.97,style:'Знает рынок и почти не уступает. Будет защищать свою цену.'},
    {type:'Владелец',icon:'💎',name:'Сергей',min:.91,style:'Не спешит, но готов уступить, если покупатель аргументирует предложение.'}
  ];
  function profile(id){return profiles[id%profiles.length];}
  function moneyLocal(n){return Math.round(n).toLocaleString('ru-RU')+' ₽';}
  function install(){
    if(typeof window.deal!=='function'){setTimeout(install,100);return;}
    if(window.deal.__v79seller)return;
    window.deal=function(id){
      var c=window.makes&&window.makes[id]; if(!c)return;
      var p=profile(id), marketGap=Math.round((c.market-c.price)/c.price*100), quick=Math.round(c.price*(p.min+0.02)), fair=Math.round(c.price*p.min), aggressive=Math.round(c.price*(p.min-0.03));
      window.render('<div class="app">'+window.head('Переговоры')+'<div class="note"><div class="row"><span><b>'+p.icon+' '+p.name+'</b><small>'+p.type+'</small></span><b>'+moneyLocal(c.price)+'</b></div><p class="muted">'+p.style+'</p></div><div class="bubble seller">'+p.name+': «Цена '+moneyLocal(c.price)+'. Машина хорошая.»</div><div class="bubble you">Ты: «После диагностики вижу проблему с '+c.risk+'. Готов обсуждать цену.»</div><div class="deal-score"><span>РЫНОК<b>'+moneyLocal(c.market)+'</b></span><span>ТЕКУЩАЯ ЦЕНА<b>'+moneyLocal(c.price)+'</b></span><span>РАЗНИЦА<b class="profit">'+(marketGap>=0?'+':'')+marketGap+'%</b></span></div><button class="action green" onclick="sellerOffer('+id+','+quick+',\'quick\')">🤝 Предложить '+moneyLocal(quick)+'<small>Быстрая сделка</small></button><button class="action" onclick="sellerOffer('+id+','+fair+',\'fair\')">💬 Предложить '+moneyLocal(fair)+'<small>Обоснованный торг</small></button><button class="action" onclick="sellerOffer('+id+','+aggressive+',\'aggressive\')">🔥 Предложить '+moneyLocal(aggressive)+'<small>Жёсткий торг</small></button><button class="action" onclick="market()">Назад</button></div>');
    };
    window.deal.__v79seller=true;
    window.sellerOffer=function(id,offer,kind){
      var c=window.makes&&window.makes[id],p=profile(id);if(!c)return;
      var accepted=offer>=Math.round(c.price*p.min),counter=Math.round((offer+c.price*p.min)/2);
      if(p.type==='Срочно продаёт'&&kind==='aggressive')accepted=true;
      if(p.type==='Перекупщик'&&kind==='aggressive')accepted=false;
      if(accepted)window.render('<div class="app">'+window.head('Переговоры')+'<div class="bubble seller">'+p.name+': «Хорошо. Договорились на '+moneyLocal(offer)+'.»</div><div class="bubble you">Ты: «По рукам.»</div><div class="note"><b>✅ Продавец согласился</b><p class="muted">Цена зафиксирована. Можно оформлять покупку.</p></div><button class="action green" onclick="buy('+id+','+offer+')">🚗 Купить за '+moneyLocal(offer)+'</button><button class="action" onclick="market()">Отказаться</button></div>');
      else window.render('<div class="app">'+window.head('Переговоры')+'<div class="bubble seller">'+p.name+': «Нет. За '+moneyLocal(offer)+' не отдам.»</div><div class="bubble seller">«Могу уступить до '+moneyLocal(counter)+'. Это последнее предложение.»</div><div class="note"><b>⚖️ Продавец сделал встречное предложение</b><p class="muted">Решение за тобой.</p></div><button class="action green" onclick="buy('+id+','+counter+')">🤝 Согласиться на '+moneyLocal(counter)+'</button><button class="action" onclick="deal('+id+')">💬 Торговаться ещё</button><button class="action" onclick="market()">Уйти</button></div>');
    };
  }
  install();
})();
