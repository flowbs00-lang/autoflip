const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../theme-polish.css'),'utf8');

test('final theme layer loads after feature styles',()=>{
  const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1]);
  assert.equal(links.at(-1),'theme-polish.css?v=20261010-2');
  assert.ok(links.indexOf('theme-polish.css?v=20261010-2')>links.indexOf('community.css?v=20261008-2'));
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

test('store uses explicit readable colors in both themes',()=>{
  assert.match(css,/:root\{--store-accent-text:#86e9c3\}/);
  assert.match(css,/:root\[data-theme=light\]\{--store-accent-text:#126b4d\}/);
  assert.match(css,/\.app\.store-app :is\(\.store-group-title h2,[^}]+color:var\(--os-text\)!important/);
  assert.match(css,/\.app\.store-app :is\(\.store-product,[^}]+background:var\(--os-surface\)!important/);
  assert.match(css,/\.app\.store-app \.store-hero :is\(h2,p,small\)\{color:inherit!important\}/);
  assert.match(css,/\.app\.store-app \.store-product>button:disabled\{background:var\(--os-elevated\);color:var\(--os-faint\);opacity:1\}/);
});

test('timed service card keeps light text in the light theme',()=>{
  assert.match(css,/\.garage-app \.service-active :is\(h3,b\)\{color:#f3f7fb!important\}/);
  assert.match(css,/\.garage-app \.service-active p\{color:#bcc8d4\}/);
  assert.match(css,/\.service-message button:disabled\{background:var\(--os-elevated\);color:var\(--os-faint\);opacity:1\}/);
});
