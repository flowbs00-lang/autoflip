const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'..');

test('legacy photo map is loaded before the market scripts',()=>{
 for(const file of ['index.html','cloudflare/app/index.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  assert.ok(html.indexOf('legacy-photo-map.js')>=0,file+' includes the generated map');
  assert.ok(html.indexOf('legacy-photo-map.js')<html.indexOf('script_base.js'),file+' loads the map first');
 }
});

test('legacy commons helper prefers reviewed local assets',()=>{
 for(const file of ['script_base.js','cloudflare/app/script_base.js']){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  assert.match(source,/AUTOFLIP_LEGACY_PHOTOS/);
 }
});

test('all generated legacy assets exist in both app trees',()=>{
 const annotations=JSON.parse(fs.readFileSync(path.join(root,'config/legacy-photo-annotations.json'),'utf8'));
 const records=Object.values(annotations.photos);
 assert.equal(records.length,82);
 assert.ok(records.every(record=>record.reviewed===true));
 for(const record of records){
  for(const prefix of ['assets/cars/legacy','cloudflare/app/assets/cars/legacy']){
   const file=path.join(root,prefix,record.asset);
   assert.ok(fs.existsSync(file),file);
   assert.equal(fs.readFileSync(file).subarray(0,4).toString('ascii'),'RIFF');
  }
 }
});
