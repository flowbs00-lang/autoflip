const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
let storeModule;
async function store(){return storeModule||=(await import(pathToFileURL(path.join(root,'functions/_lib/store.js')).href));}

test('store catalog contains every requested product with server-owned prices',async()=>{
  const {STORE_PRODUCTS,publicCatalog}=await store();
  assert.deepEqual(Object.keys(STORE_PRODUCTS),['cash_200k','cash_1m','cash_2m','plate_cool','plate_custom','buyers_1d','buyers_7d','buyers_30d','garage_5','garage_10']);
  assert.equal(publicCatalog().length,10);
  assert.ok(publicCatalog().every(product=>product.price>0&&!('grant' in product)));
});

test('paid grants are idempotent for money, boosts and garage levels',async()=>{
  const {applyStoreOrder}=await store();
  const state={money:100000,garageLevel:1};
  const cash={id:'o1',product_code:'cash_200k',custom_payload:'{}',paid_at:1};
  assert.equal(applyStoreOrder(state,cash),true);
  assert.equal(applyStoreOrder(state,cash),false);
  assert.equal(state.money,300000);
  applyStoreOrder(state,{id:'o2',product_code:'buyers_1d',custom_payload:'{}',paid_at:2});
  assert.ok(state.store.fastBuyersUntil>Date.now());
  applyStoreOrder(state,{id:'o3',product_code:'garage_5',custom_payload:'{}',paid_at:3});
  assert.equal(state.garageLevel,5);assert.equal(state.garageProgress.level,5);
});

test('custom and premium plates are validated, uppercase and added once',async()=>{
  const {applyStoreOrder,validateCustomPlate}=await store();
  assert.deepEqual(validateCustomPlate({number:'а777аа',region:'77'}),{number:'А777АА',region:'77',city:'Москва'});
  assert.throws(()=>validateCustomPlate({number:'Z777ZZ',region:'77'}));
  const state={money:0},order={id:'01234567-89ab-cdef-0123-456789abcdef',product_code:'plate_custom',custom_payload:JSON.stringify({number:'А777АА',region:'43'}),paid_at:5};
  applyStoreOrder(state,order);applyStoreOrder(state,order);
  assert.equal(state.plates.items.length,1);assert.equal(state.plates.items[0].number,'А777АА');assert.equal(state.plates.items[0].region.city,'Киров');
});

test('payment creation keeps YooKassa secrets server-side and webhooks recheck payments',()=>{
  const create=read('functions/api/store/create-payment.js'),webhook=read('functions/api/store/webhook.js'),save=read('functions/api/save.js');
  assert.match(create,/YOOKASSA_SHOP_ID/);assert.match(create,/YOOKASSA_SECRET_KEY/);
  assert.match(create,/Idempotence-Key/);assert.match(create,/assertSameOrigin/);
  assert.match(webhook,/reconcileOrderPayment/);assert.match(save,/applyPaidOrdersToState/);
  assert.doesNotMatch(read('store.js'),/YOOKASSA_SECRET_KEY|YOOKASSA_SHOP_ID/);
});

test('shop is visible on the phone and fast buyers halve the generated delay',()=>{
  const ui=read('ui.js'),html=read('index.html');
  assert.match(ui,/openStore','Магазин','shop'/);
  assert.match(html,/store\.fastBuyersUntil/);assert.match(html,/Math\.ceil\(delay\/2\)/);
  assert.match(html,/store\.js\?v=20261010-1/);assert.match(html,/store\.css\?v=20261010-1/);
});
