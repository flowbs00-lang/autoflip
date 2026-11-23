const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../theme-polish.css'),'utf8');
const mobileCss=fs.readFileSync(path.join(__dirname,'../mobile-redesign.css'),'utf8');
const unifiedCss=fs.readFileSync(path.join(__dirname,'../unified-game.css'),'utf8');

test('theme and mobile redesign layers load after feature styles',()=>{
  const links=[...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map(x=>x[1]);
  const find=name=>links.findIndex(value=>value.startsWith(name+'?'));
  assert.match(links.at(-1),/^autopass\.css\?/);
  assert.ok(find('unified-game.css')>find('gameplay-flow.css'));
  assert.ok(find('autopass.css')>find('unified-game.css'));
  assert.ok(find('theme-polish.css')>find('community.css'));
  assert.ok(find('mobile-redesign.css')>find('theme-polish.css'));
});

test('phone redesign has safe areas, readable controls and stable bottom navigation',()=>{
  assert.match(mobileCss,/@media \(max-width:600px\)/);
  assert.match(mobileCss,/env\(safe-area-inset-bottom\)/);
  assert.match(mobileCss,/--af-touch:48px/);
  assert.match(mobileCss,/\.auto-bottom-nav/);
  assert.match(mobileCss,/backdrop-filter:blur\(28px\)/);
  assert.match(mobileCss,/\.os-home>\.os-app-grid/);
  assert.match(mobileCss,/prefers-reduced-motion:reduce/);
});

test('dark feature cards keep light text when the OS theme is light',()=>{
  assert.match(css,/\.meeting-app \.meeting-hero h2\{color:#f2f6fb\}/);
  assert.match(css,/\.meeting-app \.meeting-hero p\{color:#d4dbe3\}/);
  assert.match(css,/\.garage-upgrade-head h3[^\{]*\{color:#f2f6fb\}/);
  assert.match(css,/\.garage-upgrade-head p\{color:#c9d2dc\}/);
});

test('paid-risk coinflip and mines games are removed from the arcade',()=>{
  assert.doesNotMatch(html,/higherLowerGame|playHigherLower|Выше \/ ниже/);
  assert.doesNotMatch(html,/coinflipGame|playCoinflip|gamesMinesStart|gamesMinesReveal/);
  assert.match(html,/Мини-игры<\/span><small>2 режима/);
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

test('long screens clear the fixed navigation and remaining legacy panels use the game theme',()=>{
  assert.match(unifiedCss,/padding-bottom:calc\(230px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(unifiedCss,/touch-action:pan-y/);
  assert.match(unifiedCss,/\.plates-app :is\(\.case-list,\.plate-list\)/);
  assert.match(unifiedCss,/\.game-pass-v3 \.pass-road-v3/);
  assert.match(unifiedCss,/\.garage-plate-strip\{display:none/);
  assert.match(unifiedCss,/\.bank-home-credit-levels/);
  assert.match(unifiedCss,/\.bank-preview-table/);
  assert.match(unifiedCss,/\.world-route-fields>div/);
  assert.match(unifiedCss,/Purchase checkout and purchase history/);
  assert.match(unifiedCss,/Deals, buyers and live conversations/);
});
