/* 투후 오너 리뷰 독립 테이블 */
(function(){
  'use strict';
  var tables=window.BBM_BOARD_TABLES=window.BBM_BOARD_TABLES||{};
  var cars=[
    ['BMW','M3','2023 M3 xDrive 컴페티션','ice','대구','../assets/vehicle-catalog/logos/logo_bmw.png'],
    ['테슬라','Model Y','2026 Long Range RWD','ev','서울','../assets/vehicle-catalog/logos/logo_tesla.png'],
    ['현대','그랜저','2025 1.6 터보 하이브리드','hybrid','부산','../assets/vehicle-catalog/logos/logo_hyundai.png'],
    ['BYD','Qin Plus DM-i','2026 DM-i 128km','phev','인천','../assets/vehicle-catalog/logos/logo_byd.png'],
    ['기아','EV6','2025 롱레인지 AWD','ev','수원','../assets/vehicle-catalog/logos/logo_kia.png'],
    ['토요타','캠리','2027 2.0 HEV 프리미엄','hybrid','서울','../assets/vehicle-catalog/logos/logo_toyota.png'],
    ['제네시스','GV80','2024 3.5T AWD','ice','용인','../assets/vehicle-catalog/logos/logo_genesis.png'],
    ['포르쉐','타이칸','2024 4S','ev','성남','../assets/vehicle-catalog/logos/logo_porsche.png'],
    ['볼보','XC60','2025 T8 Recharge','phev','고양','../assets/vehicle-catalog/logos/logo_volvo.png'],
    ['혼다','어코드','2025 2.0 HEV Touring','hybrid','대전','../assets/vehicle-catalog/logos/logo_honda.png'],
    ['벤츠','E-Class','2025 E300 4MATIC','ice','서울','../assets/vehicle-catalog/logos/logo_mercedes-benz.png'],
    ['아우디','Q8 e-tron','2024 55 quattro','ev','광주','../assets/vehicle-catalog/logos/logo_audi.png']
  ];
  var titles=['한 달 타보니 매일 손이 가는 이유','출퇴근 실사용에서 느낀 장점과 아쉬움','가족용으로 선택한 뒤 8개월 솔직 후기','장거리 위주 오너가 남기는 실제 경험','주행감은 만족, 공간은 직접 확인하세요','연비와 승차감 모두 챙긴 현실적인 선택','디자인보다 기본기가 더 마음에 듭니다','충전·유지비까지 계산한 오너 리뷰'];
  var bodies=[
    '처음에는 디자인 때문에 선택했지만 실제로는 주행 안정감과 일상 편의성이 더 큰 장점이었습니다. 시내와 고속도로를 번갈아 타도 피로가 적고, 필요한 기능이 자연스럽게 손에 익습니다.',
    '가속 반응은 기대보다 매끄럽고 차체 움직임이 안정적입니다. 다만 좁은 주차장에서는 차폭이 부담스럽고, 2열 승객은 노면 상태에 따라 단단하다고 느낄 수 있습니다.',
    '가족과 함께 쓰는 차라 공간과 승차감을 우선했습니다. 트렁크 활용이 편하고 뒷좌석도 여유가 있습니다. 실내 마감은 만족하지만 자주 쓰는 메뉴는 물리 버튼이 있었으면 좋겠습니다.',
    '매일 왕복 70km를 달리며 기록했습니다. 고속 정속에서는 효율이 안정적이고 보조 기능도 자연스럽습니다. 겨울철에는 표시 주행거리보다 실제 주행거리가 줄어드는 점을 감안해야 합니다.'
  ];
  var rows=[];
  for(var i=0;i<36;i++){
    var c=cars[i%cars.length],score=[5,4,4,3,5,4][i%6],power=c[3];
    rows.push({id:9700001+i,tuhuReviewId:'tuhu-'+(1001+i),category:'오너리뷰',brand:c[0],model:c[1],trim:c[2],powertrain:power,location:c[4],brandLogo:c[5],author:['드라이브노트','매일출근러','패밀리카생활','주말장거리','차분한오너','효율기록장'][i%6],verified:true,ownershipLabel:'실소유자',title:c[1]+' '+titles[i%titles.length],summary:bodies[i%bodies.length],body:bodies[i%bodies.length]+'\n\n'+bodies[(i+1)%bodies.length],satisfaction:score,satisfactionLabel:['','사지 마세요','아쉬워요','보통이에요','좋아요','최고예요'][score],purchaseMonth:'202'+(3+i%4)+'-'+String(1+i%12).padStart(2,'0'),purchasePrice:String(2800+i*137),fuelConsumption:power==='ice'||power==='hybrid'?String((6.8+(i%7)*.7).toFixed(1)):'',fullChargeRange:power==='ev'||power==='phev'?String(348+(i%8)*29):power==='hybrid'?String(6+i%4):'',highlights:['주행이 안정적이에요','실내가 편안해요','기본기가 좋아요'],drawbacks:i%2?['뒷좌석이 조금 단단해요']:['주차할 때 차폭이 부담돼요'],images:['../assets/cars/supercar-sheet-v01/sc-'+String(1+i%100).padStart(3,'0')+'.jpg','../assets/cars/supercar-sheet-v01/sc-'+String(31+i%60).padStart(3,'0')+'.jpg'],thumbnail:'../assets/cars/supercar-sheet-v01/sc-'+String(1+i%100).padStart(3,'0')+'.jpg',comments:7+i%23,likes:18+i*3,views:420+i*37,publishedAt:new Date(Date.UTC(2026,9,16-Math.floor(i/4),10-i%8,10)).toISOString()});
  }
  tables['tuhu-review']={board:'tuhu-review',displayName:'투후 오너 리뷰',idStart:9700001,defaultView:'',updatedAt:'2026-10-17T21:30:00+09:00',topics:['전체','내연기관','전기차','하이브리드','플러그인 하이브리드'],rows:rows};
})();
