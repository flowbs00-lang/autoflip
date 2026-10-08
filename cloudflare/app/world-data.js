// Shared geography for maps, market listings and registration plates.
(function(){
  var cities=[
    {id:'moscow',name:'Москва',lat:55.7558,lon:37.6173,x:28,y:35,regions:['77','97','799']},
    {id:'spb',name:'Санкт-Петербург',lat:59.9343,lon:30.3351,x:19,y:19,regions:['78','98','178']},
    {id:'nizhny',name:'Нижний Новгород',lat:56.2965,lon:43.9361,x:38,y:38,regions:['52','152']},
    {id:'ekb',name:'Екатеринбург',lat:56.8389,lon:60.6057,x:65,y:39,regions:['66','96','196']},
    {id:'kirov',name:'Киров',lat:58.6036,lon:49.6680,x:47,y:29,regions:['43']},
    {id:'krasnodar',name:'Краснодар',lat:45.0355,lon:38.9753,x:25,y:70,regions:['23','93','123']},
    {id:'perm',name:'Пермь',lat:58.0105,lon:56.2502,x:58,y:29,regions:['59','81','159']},
    {id:'kaliningrad',name:'Калининград',lat:54.7104,lon:20.4522,x:5,y:31,regions:['39','91']},
    {id:'surgut',name:'Сургут',lat:61.2540,lon:73.3962,x:74,y:23,regions:['86','186']},
    {id:'chita',name:'Чита',lat:52.0340,lon:113.4994,x:89,y:49,regions:['75','80']},
    {id:'kazan',name:'Казань',lat:55.7961,lon:49.1064,x:46,y:43,regions:['16','116','716']},
    {id:'vladivostok',name:'Владивосток',lat:43.1155,lon:131.8855,x:96,y:70,regions:['25','125']},
    {id:'yaroslavl',name:'Ярославль',lat:57.6261,lon:39.8845,x:31,y:27,regions:['76']},
    {id:'rostov',name:'Ростов',lat:47.2357,lon:39.7015,x:31,y:61,regions:['61','161','761']},
    {id:'makhachkala',name:'Махачкала',lat:42.9849,lon:47.5047,x:43,y:77,regions:['05']},
    {id:'ufa',name:'Уфа',lat:54.7388,lon:55.9721,x:58,y:47,regions:['02','102','702']},
    {id:'voronezh',name:'Воронеж',lat:51.6608,lon:39.2003,x:31,y:51,regions:['36','136']},
    {id:'orenburg',name:'Оренбург',lat:51.7682,lon:55.0969,x:58,y:59,regions:['56']},
    {id:'tver',name:'Тверь',lat:56.8587,lon:35.9176,x:24,y:30,regions:['69']},
    {id:'samara',name:'Самара',lat:53.1959,lon:50.1002,x:51,y:51,regions:['63','163','763']}
  ];
  var transports=[
    {id:'taxi',name:'Такси',icon:'🚕',rate:18,min:1500,speed:78,extra:0,description:'От двери до двери'},
    {id:'train',name:'Поезд',icon:'🚆',rate:3.2,min:900,speed:72,extra:120,description:'Вокзал и спокойная дорога'},
    {id:'plane',name:'Самолёт',icon:'✈️',rate:6.5,min:4500,speed:720,extra:180,description:'Регистрация и перелёт'},
    {id:'minibus',name:'Микроавтобус',icon:'🚐',rate:5,min:800,speed:62,extra:60,description:'Недорого, но дольше'}
  ];
  window.AUTOFLIP_WORLD={version:1,cities:cities,transports:transports};
  window.AUTOFLIP_CITIES=cities.map(function(c){return c.name;});
})();
