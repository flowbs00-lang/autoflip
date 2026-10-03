// AutoFlip V7.9 — Live Market (safe prototype)
// This file is intentionally standalone. It does not modify V7.8 until explicitly connected.
(function(){
  'use strict';
  window.AutoFlipV79Market = {
    version:'7.9-market',
    sellers:[
      {type:'Срочно продаёт',tag:'🔥 Ниже рынка'},
      {type:'Обычный продавец',tag:'Рыночная цена'},
      {type:'Перекупщик',tag:'⚠️ Выше рынка'},
      {type:'Владелец',tag:'💎 Хороший вариант'}
    ],
    refresh:function(){
      var cars=Array.isArray(window.CARS)?window.CARS:[];
      return cars.map(function(car,i){
        var seller=this.sellers[i%this.sellers.length];
        var delta=[-0.09,0,0.05,-0.04][i%4];
        return Object.assign({},car,{marketDelta:delta,sellerType:seller.type,sellerTag:seller.tag});
      },this);
    }
  };
})();
