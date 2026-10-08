const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../theme-polish.css'),'utf8');

test('final theme layer loads after feature styles',()=>{
  const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(links.at(-1),'theme-polish.css?v=20261008-5');
  assert.ok(links.indexOf('theme-polish.css?v=20261008-5')>links.indexOf('community.css?v=20261008-2'));
});

test('dark feature cards keep light text when the OS theme is light',()=>{
  assert.match(css,/\.meeting-app \.meeting-hero h2\{color:#f2f6fb\}/);
  assert.match(css,/\.meeting-app \.meeting-hero p\{color:#d4dbe3\}/);
  assert.match(css,/\.garage-upgrade-head h3[^\{]*\{color:#f2f6fb\}/);
  assert.match(css,/\.garage-upgrade-head p\{color:#c9d2dc\}/);
});

test('higher or lower card game is removed from the arcade',()=>{
  assert.doesNotMatch(html,/higherLowerGame|playHigherLower|Выше \/ ниже/);
  assert.match(html,/Мини-игры<\/span><small>4 режима/);
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
