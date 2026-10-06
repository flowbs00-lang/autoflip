const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../theme-polish.css'),'utf8');

test('final theme layer loads after feature styles',()=>{
  const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(links.at(-1),'theme-polish.css?v=20261007-2');
  assert.ok(links.indexOf('theme-polish.css?v=20261007-2')>links.indexOf('garage-system.css?v=20261006-1'));
});

test('both themes define complete readable semantic palettes',()=>{
  for(const token of ['--os-bg','--os-surface','--os-raised','--os-text','--os-muted','--os-line','--os-success','--os-warning','--os-danger'])assert.ok(css.includes(token),token);
  assert.match(css,/:root\[data-theme=light\]/);
  assert.match(css,/\.garage-app/);
  assert.match(css,/\.bank-v22-app/);
  assert.match(css,/\.games-app/);
  assert.match(css,/\.plates-app/);
  assert.match(css,/\.meeting-app/);
});
