/* 처즈왕 我要投诉 전수조사 흐름을 한국형 공개 공론화 게시판으로 옮긴 독립 테이블. */
(function(){
  'use strict';
  var tables=window.BBM_BOARD_TABLES=window.BBM_BOARD_TABLES||{};
  var cars=[
    ['BMW','X3','2025 X3 xDrive30e','공식 수입차','../%61ssets/vehicle-catalog/logos/logo_bmw.png','../%61ssets/cars/bmw/card-three-quarter/x3-three-quarter.png'],
    ['벤츠','E클래스','2025 E 300 4MATIC','공식 수입차','../%61ssets/vehicle-catalog/logos/logo_mercedes-benz.png','../%61ssets/cars/mercedes/models/card/e-class.png'],
    ['포르쉐','타이칸','2025 Taycan 4S','공식 수입차','../%61ssets/vehicle-catalog/logos/logo_porsche.png','../%61ssets/cars/seoul-autogallery-v01/sag-02-1.webp'],
    ['렉서스','RX','2025 RX 450h+','공식 수입차','../%61ssets/vehicle-catalog/logos/logo_lexus.png','../%61ssets/cars/seoul-autogallery-v01/sag-06-1.webp'],
    ['BMW','M3','2025 M3 xDrive 컴페티션','공식 수입차','../%61ssets/vehicle-catalog/logos/logo_bmw.png','../%61ssets/cars/bmw/card-three-quarter/m3-three-quarter.png'],
    ['벤츠','GLS클래스','2025 GLS 450 4MATIC','공식 수입차','../%61ssets/vehicle-catalog/logos/logo_mercedes-benz.png','../%61ssets/cars/mercedes/models/card/gls-class.png'],
    ['현대','아이오닉 5','2025 롱레인지 AWD','국내 신차','../%61ssets/vehicle-catalog/logos/logo_hyundai.png','../%61ssets/cars/seoul-autogallery-v01/sag-03-1.webp'],
    ['람보르기니','우루스 SE','2025 플러그인 하이브리드','공식 수입차','../%61ssets/vehicle-catalog/logos/logo_lamborghini.png','../%61ssets/listing-photos/v01/lamborghini_urus_phev_3003.jpg']
  ];
  var issues=[
    ['품질','엔진·모터','주행 중 출력이 순간적으로 제한됩니다','고속도로 합류 구간에서 출력이 떨어지고 경고 메시지가 표시됐습니다. 안전한 곳에 정차한 뒤 재시동하면 사라지지만 같은 증상이 반복돼 점검 기록을 공유합니다.'],
    ['품질','변속기','저속에서 변속 충격이 반복됩니다','냉간 상태에서 D단 전환과 2단 변속 때 충격이 큽니다. 서비스센터에서 학습값 초기화를 받았지만 재발해 추가 진단을 요청했습니다.'],
    ['품질','제동 시스템','제동 시 진동과 소음이 커졌습니다','고속 주행 후 감속하면 페달과 핸들에 진동이 전달됩니다. 패드 정상 판정 뒤에도 증상이 이어져 영상과 정비명세서를 보관했습니다.'],
    ['품질','차체 부속·전기장치','인포테인먼트와 후방 카메라가 꺼집니다','내비게이션 화면이 재부팅되며 후방 카메라도 함께 보이지 않습니다. 업데이트 후에도 동일한 발생 시각과 영상을 기록했습니다.'],
    ['서비스','약속 불이행','예약한 정비와 대차 안내가 달랐습니다','전화로 확인한 예약과 대차 가능 여부가 현장 안내와 달랐습니다. 담당자별 설명도 달라 계약서와 상담 기록을 기준으로 사실관계를 정리합니다.'],
    ['서비스','서비스 비용','사전 고지 없는 추가 비용이 청구됐습니다','작업 승인 전에 안내받지 못한 항목이 결제서에 포함됐습니다. 작업 전 견적과 최종 명세서의 차이를 공개합니다.'],
    ['기타','제품 문제','인도 직후 도장 얼룩과 단차를 발견했습니다','차량 인수 다음 날 밝은 곳에서 보닛 도장 얼룩과 범퍼 단차를 확인했습니다. 출고 전 검수 기록과 보수 범위를 요청했습니다.'],
    ['종합','타이어 · 서비스 절차 미흡','타이어 편마모 점검과 안내가 충분하지 않았습니다','정기점검에서 이상이 없다는 안내를 받았지만 곧 편마모가 확인됐습니다. 품질 증상과 서비스 절차를 함께 공유합니다.']
  ];
  /* 처즈왕 대표 문제(典型问题) 방식: [결함 부위 또는 서비스 유형, 구체 증상] */
  var problems=[
    [['엔진·모터','출력 제한'],['계기판','경고등 반복']],
    [['변속기','변속 충격']],
    [['제동 시스템','떨림·소음']],
    [['차체 부속·전기장치','내비 재부팅'],['차체 부속·전기장치','후방 카메라 꺼짐']],
    [['약속 불이행','대차 미제공'],['약속 불이행','안내 불일치']],
    [['서비스 비용','미고지 추가 청구']],
    [['도장·외관','도장 얼룩'],['도장·외관','범퍼 단차']],
    [['타이어','편마모'],['서비스 절차','점검 안내 부족']]
  ];
  var authors=['서울오너','차량기록장','안전제보','정비노트','주말드라이버','모터로그','출퇴근차주','패밀리카'];
  var cities=['서울','경기','인천','부산','대전','대구','광주','세종'];
  var rows=[];
  for(var i=0;i<32;i++){
    var car=cars[i%cars.length],k=(i+Math.floor(i/cars.length)*3)%issues.length,issue=issues[k];
    rows.push({
      id:String(9720001+i),complaintId:'czw-'+String(1001+i),category:issue[0],issueType:issue[0],subtypes:issue[1],title:issue[2],summary:issue[3],body:issue[3],
      author:authors[i%authors.length],publishedAt:'2026-10-'+String(17-(i%15)).padStart(2,'0')+'T'+String(8+(i%9)).padStart(2,'0')+':20:00+09:00',views:String(520+i*131),comments:String(3+(i*7)%36),likes:String(8+(i*13)%91),
      brand:car[0],manufacturer:car[0],model:car[1],trim:car[2],vehicleType:car[3],brandLogo:car[4],thumbnail:car[5],images:car[5],city:cities[i%cities.length],odometer:String(1800+i*1570),
      purchaseDate:'2025-'+String(1+(i%9)).padStart(2,'0')+'-12',problemDate:'2026-10-'+String(2+(i%14)).padStart(2,'0'),accident:i%7===0?'있음':'없음',injury:'없음',dealerGroup:car[3]==='공식 수입차'?'공식 딜러사':'신차 판매점',dealerBranch:cities[i%cities.length]+' 지점',publicLabel:['공개','추가 제보','작성자 업데이트','해결 후기'][i%4],verified:i%5!==4,problems:problems[k],hasPhoto:i%3!==1,hasVideo:i%5===0
    });
  }
  tables['chezhiwang-complaint']={board:'chezhiwang-complaint',displayName:'처즈왕 결함·불만',idStart:9720001,defaultView:'',updatedAt:'2026-10-17T23:00:00+09:00',topics:['전체','품질','서비스','기타','종합'],rows:rows};
})();
