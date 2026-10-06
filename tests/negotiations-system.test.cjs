const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');

const source=fs.readFileSync(path.join(__dirname,'../negotiations-system.js'),'utf8');

function game(extra={}){
  let now=450,html='',purchases=0,sales=0;
  const state={money:200000,rep:10,city:'Москва',day:1,gameClock:{total:450},cars:[],buyerInbox:[],meetings:[],repHistory:[],notifications:0,...extra};
  const makes=[{id:0,name:'Lada',city:'Москва',price:90000,market:110000,listingId:'M-1'}];
  const c={window:null,state,makes,Math:Object.create(Math),Date,JSON,Number,String,Object,Array,console,localStorage:{setItem(){},getItem(){return null}},KEY:'k',
    getGameTotal:()=>now,render:x=>html=x,head:t=>'<h1>'+t+'</h1>',money:n=>n+' ₽',persist(){},save(){},log(){},market(){},garage(){},mapApp(){},returnToPurchaseNegotiation(){},alert(){},setTimeout(){},setInterval(){},
    buy(id,price){purchases++;state.cars.push({...makes[id],buy:price,_garageId:'bought'});},
    completeSellerTrade(){},completeBuyerSale(){sales++;},completeBuyerTrade(){sales++;},
    openBuyerChat(){},mountAutoBottomNav(){},document:{getElementById(){return {value:''};}}
  };
  c.window=c;vm.createContext(c);vm.runInContext(source,c);
  return {c,state,makes,setNow:v=>now=v,get html(){return html;},get purchases(){return purchases;},get sales(){return sales;}};
}

test('accepted market price creates an appointment instead of an instant purchase',()=>{
  const g=game();g.c.buy(0,90000);assert.equal(g.purchases,0);assert.equal(g.state.meetings.length,0);
  g.c.chooseMeetingPlace('Москва');g.c.confirmMeetingTime(510);
  assert.equal(g.state.meetings.length,1);assert.equal(g.state.meetings[0].city,'Москва');assert.equal(g.purchases,0);
  g.setNow(510);g.c.completeMeeting(g.state.meetings[0].id);
  assert.equal(g.purchases,1);assert.equal(g.state.meetings[0].status,'completed');assert.equal(g.state.cars[0].city,'Москва');assert.equal(g.state.rep,11);
});

test('a buyer deal only completes in the car city at the booked time',()=>{
  const car={id:3,name:'Ford',city:'Киров',buy:60000,_garageId:'owned'};
  const buyer={id:'B1',listingId:'L1',name:'Илья',kind:'Покупатель',icon:'👤',text:'Заберу.',offer:80000,status:'accepted',read:true,trade:false};
  const g=game({city:'Москва',cars:[car],buyerInbox:[buyer],activeListing:{id:'L1',status:'active',carKey:'owned'}});
  g.c.scheduleBuyerMeeting('B1');g.c.confirmBuyerMeeting(510);const m=g.state.meetings[0];g.setNow(510);g.c.completeMeeting(m.id);
  assert.equal(g.sales,0);assert.equal(m.status,'scheduled');
  g.state.city='Киров';g.c.completeMeeting(m.id);
  assert.equal(g.sales,1);assert.equal(m.status,'completed');assert.equal(g.state.rep,13);
});

test('missing a booked meeting cancels it and lowers reputation once',()=>{
  const g=game();g.c.buy(0,90000);g.c.chooseMeetingPlace('Москва');g.c.confirmMeetingTime(510);const m=g.state.meetings[0];g.setNow(571);g.c.processMeetings(false);
  assert.equal(m.status,'missed');assert.equal(g.state.rep,6);g.c.processMeetings(false);assert.equal(g.state.rep,6);
});
