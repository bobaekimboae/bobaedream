/* 독립 연비·전비 게시판. 동력 방식별 입력 항목을 별도 보존한다. */
(function(){
  'use strict';
  var tables=window.BBM_BOARD_TABLES=window.BBM_BOARD_TABLES||{};
  var models=[
    ['bmw-m3','BMW','M3','2023 M3 xDrive 컴페티션 M','ice','../%61ssets/brand/kr/bmw.png','sag-01'],
    ['porsche-taycan','포르쉐','타이칸','2023 EV','ev','../%61ssets/brand/kr/porsche.png','sag-02'],
    ['lamborghini-urus-phev','람보르기니','우루스 SE','2025 플러그인 하이브리드','phev','../%61ssets/brand/kr/lamborghini.png','listing-photos/v01/lamborghini_urus_phev_3003.jpg'],
    ['lexus-rx450h','렉서스','RX','2022 RX 450h','hybrid','../%61ssets/brand/kr/lexus.png','sag-06'],
    ['mercedes-gls','벤츠','GLS클래스','2022 GLS 580 4매틱','ice','../%61ssets/brand/kr/mercedes-benz.png','sag-03']
  ];
  var bodies=[
    '출퇴근 도심 70%, 자동차전용도로 30% 조건입니다. 공조는 22도로 유지했고 급가속을 줄이니 표시 수치가 안정적으로 유지됐습니다.',
    '주말 장거리 왕복 주행 기록입니다. 성인 2명과 짐을 싣고 정속 주행했으며 정체 구간을 포함한 실제 사용 수치입니다.',
    '아침 출근길과 저녁 퇴근길을 합산했습니다. 기온과 공조 사용량에 따라 차이가 있어 같은 경로에서 다시 측정했습니다.',
    '충전과 주유 비용을 함께 기록하려고 한 달 동안 누적했습니다. 짧은 시내 주행보다 장거리에서 효율이 더 안정적이었습니다.'
  ];
  var authors=['에코드라이버','출퇴근오너','주말장거리','모터로그','실주행연구소','서울카라이프'];
  var cities=['서울','경기','인천','부산','대구','대전'];
  function make(index){
    var model=models[index%models.length],variant=Math.floor(index/models.length),type=model[4];
    var energy=type==='ev'||type==='phev'?String((14.8+(index%7)*.7).toFixed(1)):'';
    var fuel=type==='ice'||type==='hybrid'||type==='phev'?String((5.9+(index%8)*.8).toFixed(1)):'';
    var custom=model[6].indexOf('/')>=0;var first=custom?'../%61ssets/'+model[6]:'../%61ssets/cars/seoul-autogallery-v01/'+model[6]+'-1.webp';var photos=custom?first:[1,2,3].map(function(number){return'../%61ssets/cars/seoul-autogallery-v01/'+model[6]+'-'+number+'.webp'}).join('|');
    return{
      id:String(9300001+index),energyId:'energy-'+model[0]+'-'+(variant+1),category:type==='ev'?'전기차':type==='phev'?'플러그인':type==='hybrid'?'하이브리드':'내연기관',
      title:model[1]+' '+model[2]+' '+(variant?'장거리':'출퇴근')+' 실주행 '+(energy?'전비':'연비')+' 기록',summary:bodies[index%bodies.length],body:bodies[index%bodies.length],
      author:authors[index%authors.length],publishedAt:'2026-10-'+String(16-index%14).padStart(2,'0')+'T09:00:00+09:00',time:(index+1)+'시간 전',views:String(180+index*37),comments:String(2+index%9),likes:String(8+index*3),
      thumbnail:first,images:photos,
      modelId:model[0],brand:model[1],model:model[2],trim:model[3],powertrain:type,brandLogo:model[5],city:cities[index%cities.length],odometer:String(2400+index*1830),fuelConsumption:fuel,energyConsumption:energy,fullChargeRange:type==='ev'?String(382+(index%5)*19):'',temperature:type==='ev'?String(10+(index%4)*5):'',verified:index%3!==2
    };
  }
  var rows=[];for(var i=0;i<20;i++)rows.push(make(i));
  tables['fuel-economy']={board:'fuel-economy',displayName:'연비·전비',idStart:9300001,defaultView:'',updatedAt:'2026-10-17T13:00:00+09:00',topics:['전체','전기차','플러그인','하이브리드','내연기관'],rows:rows};
})();
