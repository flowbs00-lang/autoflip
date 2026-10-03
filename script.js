// AutoFlip V7.7 compatibility layer
// Load the existing V7 core first. The split closing tag avoids HTML parser issues.
document.write('<script src="script_base.js"></'+'script>');

(function(){
  function install(){
    if(typeof state==='undefined' || typeof KEY==='undefined' || typeof render!=='function' || typeof head!=='function' || typeof money!=='function'){
      setTimeout(install,50);
      return;
    }

    if(!state.businessHistory) state.businessHistory=[];

    function persist(){
      localStorage.setItem(KEY,JSON.stringify(state));
      if(typeof renderStats==='function') renderStats();
    }

    // Keep the current profile/history layer available even when the original
    // sale implementation is defined later by the inline V7 modules.
    function drawProfile(){
      const h=Array.isArray(state.businessHistory)?state.businessHistory:[];
      const current=state.car;
      const sold=h.length;
      const bought=sold+(current?1:0);
      const totalBuy=h.reduce((a,x)=>a+Number(x.buy||0),0)+(current?Number(current.buy||0):0);
      const totalRepair=h.reduce((a,x)=>a+Number(x.repair||0),0)+(current?Number(current.repairSpent||0):0);
      const revenue=h.reduce((a,x)=>a+Number(x.sale||0),0);
      const profit=h.reduce((a,x)=>a+Number(x.profit||0),0);
      const best=h.length?Math.max.apply(null,h.map(x=>Number(x.profit||0))):0;
      const avg=sold?Math.round(profit/sold):0;
      const rank=Number(state.rep||0)<30?'Начинающий перекуп':Number(state.rep||0)<80?'Опытный перекуп':'Автодилер';
      const history=h.length
        ? '<div class="note"><b>Последние сделки</b>'+h.slice(0,6).map(function(x){
            const p=Number(x.profit||0);
            return '<div class="row"><span>🚗 '+(x.car||'Автомобиль')+'<small>'+(x.year||'')+' · '+(x.city||'')+'</small></span><b class="'+(p>=0?'profit':'')+'">'+(p>=0?'+':'')+money(p)+'</b></div><div class="muted" style="padding:0 0 8px">Покупка '+money(Number(x.buy||0))+' · ремонт '+money(Number(x.repair||0))+' · продажа '+money(Number(x.sale||0))+'</div>';
          }).join('')+'</div>'
        : '<div class="note"><b>История пока пуста</b><p class="muted">Продай первый автомобиль, и здесь появится результат сделки.</p></div>';

      render('<div class="app">'+head('Профиль')+
        '<div class="profile-card"><div class="avatar">A</div><h3>'+rank+'</h3><p class="muted">'+(state.city||'Москва')+' · день '+(state.day||1)+'</p></div>'+
        '<div class="statsbox"><div class="stat"><b>'+money(state.money)+'</b><small>капитал</small></div><div class="stat"><b>'+Number(state.rep||0)+'</b><small>репутация</small></div><div class="stat"><b>'+sold+'</b><small>продано</small></div></div>'+
        '<div class="note"><b>📊 Статистика бизнеса</b>'+
        '<div class="row"><span>🚗 Куплено</span><b>'+bought+'</b></div>'+ 
        '<div class="row"><span>🏷️ Продано</span><b>'+sold+'</b></div>'+ 
        '<div class="row"><span>💸 Покупки</span><b>'+money(totalBuy)+'</b></div>'+ 
        '<div class="row"><span>🔧 Ремонт</span><b>'+money(totalRepair)+'</b></div>'+ 
        '<div class="row"><span>💰 Выручка</span><b>'+money(revenue)+'</b></div>'+ 
        '<div class="row"><span>📈 Общая прибыль</span><b class="'+(profit>=0?'profit':'')+'">'+(profit>=0?'+':'')+money(profit)+'</b></div>'+ 
        '<div class="row"><span>📊 Средняя прибыль</span><b>'+money(avg)+'</b></div>'+ 
        '<div class="row"><span>🏆 Лучшая сделка</span><b>'+money(best)+'</b></div></div>'+ 
        (current?'<div class="note"><b>🚘 Текущая машина</b><div class="row"><span>'+current.name+'</span><b>'+money(Number(current.buy||0))+'</b></div><p class="muted">Она ещё не попала в историю — сделка появится после продажи.</p></div>':'')+
        history+'</div>');
    }

    window.profile=drawProfile;
    persist();
  }
  install();
})();
