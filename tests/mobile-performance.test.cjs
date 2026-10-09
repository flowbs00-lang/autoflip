const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('market starts with a bounded feed and appends more cars on demand',()=>{
  const base=read('script_base.js');
  assert.match(base,/marketInitialCount=18,marketBatchCount=12/);
  assert.match(base,/IntersectionObserver/);
  assert.match(base,/marketLoadMore/);
  assert.doesNotMatch(base,/const perPage=8/);
});

test('market cards use lazy decoded thumbnails while details keep original photos',()=>{
  const base=read('script_base.js');
  assert.match(base,/assets\/cars\/thumbs\//);
  assert.match(base,/loading="\$\{index<2\?'eager':'lazy'\}"/);
  assert.match(base,/decoding="async"/);
  const originals=fs.readdirSync(path.join(root,'assets/cars')).filter(name=>name.endsWith('.webp'));
  const thumbs=fs.readdirSync(path.join(root,'assets/cars/thumbs')).filter(name=>name.endsWith('.webp'));
  assert.equal(thumbs.length,originals.length);
  const originalBytes=originals.reduce((sum,name)=>sum+fs.statSync(path.join(root,'assets/cars',name)).size,0);
  const thumbBytes=thumbs.reduce((sum,name)=>sum+fs.statSync(path.join(root,'assets/cars/thumbs',name)).size,0);
  assert.ok(thumbBytes<originalBytes*.65);
});

test('recurring game work pauses when the browser tab is hidden',()=>{
  const base=read('script_base.js'),community=read('community.js'),compat=read('script.js');
  assert.match(base,/visibilitychange/);
  assert.match(base,/document\.hidden/);
  assert.match(base,/clearInterval\(timer\)/);
  assert.match(community,/pollMessages, 8000/);
  assert.match(compat,/liveMarketAppliedVersion/);
});
