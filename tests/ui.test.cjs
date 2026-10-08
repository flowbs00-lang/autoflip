const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ui=fs.readFileSync(path.join(__dirname,'../ui.js'),'utf8');
function game(saved){
  let output='',stored;
  const properties={};
  const root={dataset:{},style:{setProperty(key,value){properties[key]=value;}}};
  const c={state:saved||{money:123456,cars:[{id:1}],city:'Киров',sound:false},document:{documentElement:root,querySelectorAll:()=>[],getElementById:()=>null},render:v=>output=v,money:n=>n+' ₽',now:()=> '07:30',dateText:()=> 'День 1',persist:()=>stored=JSON.parse(JSON.stringify(c.state)),setInterval(){},toggleSound(){c.state.sound=!c.state.sound;}};
  c.window=c;vm.createContext(c);vm.runInContext(ui,c);
  return {c,root,properties,html:()=>output,saved:()=>stored};
}
test('appearance persists across reload without altering economic state',()=>{
  const g=game();g.c.setAppearance('wallpaper','ocean');g.c.setAppearance('theme','light');g.c.setAppearance('accent','violet');g.c.setAppearance('motion',false);
  const fresh=game(g.saved());assert.equal(fresh.root.dataset.theme,'light');assert.equal(fresh.root.dataset.motion,'off');assert.equal(fresh.c.state.appearance.wallpaper,'ocean');assert.equal(fresh.c.state.money,123456);assert.equal(fresh.c.state.cars[0].id,1);
});
test('invalid saved preferences recover to defaults and unknown updates do not touch game fields',()=>{
  const g=game({money:20,cars:[],city:'Киров',appearance:{wallpaper:'invalid',theme:'invalid',accent:'invalid',widgets:'no'}});
  assert.equal(g.c.state.appearance.wallpaper,'aurora');assert.equal(g.c.state.appearance.widgets,true);
  g.c.setAppearance('money',999999);assert.equal(g.c.state.money,20);
});
test('balance privacy, widget toggle and quick settings work together',()=>{
  const g=game();g.c.toggleQuickSetting('privateBalance');g.c.home();assert.doesNotMatch(g.html(),/123456/);assert.match(g.html(),/•••/);
  g.c.setAppearance('widgets',false);g.c.home();assert.doesNotMatch(g.html(),/class="os-widgets"/);
  g.c.toggleQuickSetting('sound');assert.equal(g.c.state.sound,true);
  g.c.toggleQuickSetting('theme');assert.equal(g.root.dataset.theme,'light');
});
test('launcher renders every app in one compact grid and exposes personal wallpaper picker',()=>{
  const g=game();g.c.home();
  assert.equal((g.html().match(/class="os-app"/g)||[]).length,18);
  assert.match(g.html(),/os-home-glance/);
  g.c.settings();assert.match(g.html(),/accept="image\/\*"/);assert.match(g.html(),/Выбрать своё фото/);
});
test('saved custom wallpaper is restored as the active phone background',()=>{
  const image='data:image/jpeg;base64,abc123';
  const g=game({money:20,cars:[],city:'Киров',appearance:{wallpaper:'custom',customWallpaper:image,theme:'dark',accent:'mint',motion:true,widgets:true,privateBalance:false}});
  assert.equal(g.root.dataset.wallpaper,'custom');assert.match(g.properties['--os-wallpaper'],/data:image\/jpeg;base64,abc123/);
  g.c.clearCustomWallpaper();assert.equal(g.c.state.appearance.wallpaper,'aurora');assert.equal(g.c.state.appearance.customWallpaper,'');
});
