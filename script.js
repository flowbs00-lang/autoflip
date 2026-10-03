// AutoFlip V7.7 loader: preserves the existing core and runs the new profile/history layer after the inline V7 updates.
document.write('<script src="script_base.js"><\\/script>');
setTimeout(function(){
  if(typeof state==='undefined'||typeof KEY==='undefined') return;
  if(!state.businessHistory) state.businessHistory=[];
  function saveBusinessHistory(){ localStorage.setItem(KEY,JSON.stringify(state)); }
  const completeSaleV77=typeof completeSale==='function'?completeSale:null;
  if(completeSaleV77){
    completeSale=function(price){
      const c=state.car;
      if(c){
        const repairSpent=Number(c.repairSpent||0);
        const profit=Math.round(price-c.buy-repairSpent);
        state.businessHistory.unshift({car:c.name,buy:Math.round(c.buy),repair:Math.round(repairSpent),sale:Math.round(price),profit,day:state.day,city:c.city,year:c.year});
        state.businessHistory=state.businessHistory.slice(0,30);
        saveBusinessHistory();
      }
      return completeSaleV77(price);
    };
  }
  window.profile=function(){
    const h=state.businessHistory||[];
    const current=state.car;
    const bought=h.length+(current?1:0), sold=h.length;
    const totalBuy=h.reduce((a,x)=>a+x.buy,0)+(current?Number(current.buy||0):0);
    const totalRepair=h.reduce((a,x)=>a+x.repair,0)+(current?Number(current.repairSpent||0):0);
    const revenue=h.reduce((a,x)=>a+x.sale,0), profit=h.reduce((a,x)=>a+x.profit,0);
    const best=h.length?Math.max.apply(null,h.map(x=>x.profit)):0, avg=sold?Math.round(profit/sold):0;
    const rank=state.rep<30?'Начинающий перекуп':state.rep<80?'Опытный перекуп':'Автодилер';
    const history=h.length?'<div class="note"><b>Последние сделки</b>'+h.slice(0,6).map(x=>'<div class="row"><span>🚗 '+x.car+'<small>'+x.year+' · '+x.city+'</small></span><b class="'+(x.profit>=0?'profit':'')+'">'+(x.profit>=0?'+':'')+money(x.profit)+'</b></div><div class="muted" style="padding:0 0 8px">Покупка '+money(x.buy)+' · ремонт '+money(x.repair)+' · продажа '+money(x.sale)+'</div>').join('')+'</div>':'<div class="note"><b>История пока пуста</b><p class="muted">Продай первый автомобиль, и здесь появится результат сделки.</p></div>';
    render('<div class="app">'+head('Профиль')+'<div class="profile-card"><div class="avatar">A</div><h3>'+rank+'</h3><p class="muted">'+state.city+' · день '+state.day+'</p></div><div class="statsbox"><div class="stat"><b>'+money(state.money)+'</b><small>капитал</small></div><div class="stat"><b>'+state.rep+'</b><small>репутация</small></div><div class="stat"><b>'+sold+'</b><small>продано</small></div></div><div class="note"><b>📊 Статистика бизнеса</b><div class="row"><span>🚗 Куплено</span><b>'+bought+'</b></div><div class="row"><span>🏷️ Продано</span><b>'+sold+'</b></div><div class="row"><span>💸 Покупки</span><b>'+money(totalBuy)+'</b></div><div class="row"><span>🔧 Ремонт</span><b>'+money(totalRepair)+'</b></div><div class="row"><span>💰 Выручка</span><b>'+money(revenue)+'</b></div><div class="row"><span>📈 Общая прибыль</span><b class="'+(profit>=0?'profit':'')+'">'+(profit>=0?'+':'')+money(profit)+'</b></div><div class="row"><span>📊 Средняя прибыль</span><b>'+money(avg)+'</b></div><div class="row"><span>🏆 Лучшая сделка</span><b>'+money(best)+'</b></div></div>'+(current?'<div class="note"><b>🚘 Текущая машина</b><div class="row"><span>'+current.name+'</span><b>'+money(current.buy)+'</b></div><p class="muted">Она ещё не попала в историю — сделка появится после продажи.</p></div>':'')+history+'</div>');
  };
  localStorage.setItem(KEY,JSON.stringify(state));
},0);
