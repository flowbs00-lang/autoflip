// AutoFlip V7.4 — диагностика автомобиля
(function(){
  const oldGarage=window.garage;
  const oldService=window.service;
  function ensureDiag(c){
    if(!c)return;
    if(!c.diagnostics)c.diagnostics={checked:false,items:[
      {name:'Двигатель',status:'good',label:'Состояние хорошее',cost:0},
      {name:'Подвеска',status:'warning',label:'Есть небольшой износ',cost:Math.round(c.repair*.38)},
      {name:'Кузов',status:'warning',label:'Найдены мелкие повреждения',cost:Math.round(c.repair*.27)},
      {name:c.risk,status:'danger',label:'Требует внимания',cost:c.repair}
    ]};
  }
  window.runDiagnostics=function(){
    const c=state.car;
    if(!c)return service();
    ensureDiag(c); c.diagnostics.checked=true;
    log(`СТО: проведена полная диагностика ${c.name}.`);
    objective.textContent='Автомобиль продиагностирован';
    objectiveSub.textContent='Изучи найденные проблемы перед ремонтом.';
    garage();
  };
  window.garage=function(){
    const c=state.car;
    if(!c)return oldGarage();
    ensureDiag(c);
    const items=c.diagnostics.items;
    const checked=c.diagnostics.checked;
    const statusText=checked?'Диагностика выполнена':'Диагностика не проводилась';
    const rows=checked?items.map(x=>`<div class="note" style="margin:7px 0"><div style="display:flex;justify-content:space-between;gap:8px"><b>${x.status==='danger'?'🔴':x.status==='warning'?'🟡':'🟢'} ${x.name}</b><span>${x.cost?money(x.cost):'OK'}</span></div><small>${x.label}</small></div>`).join(''):`<div class="note">🔎 ${statusText}<br><small>После диагностики появятся конкретные неисправности и стоимость работ.</small></div>`;
    render(`<div class="app">${head('Гараж')}<div class="pic" style="background-image:linear-gradient(#0002,#0008),url('${photo(c)}')">🚘</div><h3>${c.name}</h3><p class="muted">${c.city} · куплена за ${money(c.buy)}</p><div class="bar"><i style="width:${c.repaired?100:45}%"></i></div><p class="muted">Состояние ${c.repaired?'100':'45'}%</p><div class="deal-score"><span>ПОКУПКА<b>${money(c.buy)}</b></span><span>РЕМОНТ<b>${money(c.repair)}</b></span><span>ПРОДАЖА<b class="profit">${money(c.sale)}</b></span></div><h3 style="margin-top:16px">Диагностика</h3>${rows}<button class="action green" onclick="runDiagnostics()">🔎 ${checked?'Повторить диагностику':'Провести диагностику'}</button><button class="action" onclick="service()">🛠️ Открыть СТО</button><button class="action" onclick="sell()">💰 Найти покупателя</button></div>`);
  };
  window.service=function(){
    const c=state.car;
    if(!c)return oldService();
    ensureDiag(c);
    render(`<div class="app">${head('СТО')}<div class="note"><b>🔧 AutoFlip Service</b><small>${c.name} · ${c.diagnostics.checked?'диагностика готова':'диагностика не проводилась'}</small></div><div class="row"><span>Полная диагностика</span><b>7 500 ₽</b></div><button class="action green" onclick="runDiagnostics()">🔎 ${c.diagnostics.checked?'Повторить диагностику':'Провести диагностику'}</button>${c.diagnostics.checked?`<div style="margin-top:12px">${c.diagnostics.items.map(x=>`<div class="note" style="margin:7px 0"><b>${x.status==='danger'?'🔴':x.status==='warning'?'🟡':'🟢'} ${x.name}</b><small>${x.label}${x.cost?' · ремонт '+money(x.cost):''}</small></div>`).join('')}</div>`:''}<button class="action" onclick="garage()">← Вернуться в гараж</button></div>`);
  };
})();