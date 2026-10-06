const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const base=fs.readFileSync(path.join(__dirname,'../script_base.js'),'utf8');
const live=fs.readFileSync(path.join(__dirname,'../script.js'),'utf8');

test('market refresh countdown is inside the market heading',()=>{
  const heading=base.indexOf('Рынок автомобилей');
  const countdown=base.indexOf('id="autoMarketCountdown"');
  const filters=base.indexOf('auto-market-filters');
  assert.ok(heading>=0&&countdown>heading&&countdown<filters);
  assert.match(base,/Новые объявления появляются автоматически каждые 6 игровых часов/);
});

test('separate live market window is removed and countdown updates every second',()=>{
  assert.doesNotMatch(live,/📡 Живой рынок/);
  assert.doesNotMatch(live,/createElement\('div'\);box\.id='v79MarketRefresh'/);
  assert.match(live,/function updateMarketCountdownUI\(\)/);
  assert.match(live,/updateGameClockUI\(\);updateMarketCountdownUI\(\)/);
});
