/* 오토홈 质量反馈 원본 흐름을 한국형으로 옮긴 독립 차량 불만 게시판. */
(function(){
  'use strict';
  var tables=window.BBM_BOARD_TABLES=window.BBM_BOARD_TABLES||{};
  var cars=[
    ['bmw-x3','BMW','X3','2025 X3 xDrive30e','phev','../%61ssets/vehicle-catalog/logos/logo_bmw.png','../%61ssets/cars/bmw/card-three-quarter/x3-three-quarter.png'],
    ['mercedes-gls','벤츠','GLS클래스','2025 GLS 450 4MATIC','hybrid','../%61ssets/vehicle-catalog/logos/logo_mercedes-benz.png','../%61ssets/cars/mercedes/models/card/gls-class.png'],
    ['lexus-rx','렉서스','RX','2025 RX 450h+','hybrid','../%61ssets/vehicle-catalog/logos/logo_lexus.png','../%61ssets/cars/seoul-autogallery-v01/sag-06-1.webp'],
    ['bmw-5','BMW','5시리즈','2025 520i M Sport','ice','../%61ssets/vehicle-catalog/logos/logo_bmw.png','../%61ssets/cars/bmw/card-three-quarter/5-series-three-quarter.png'],
    ['benz-e','벤츠','E클래스','2025 E 300 4MATIC','hybrid','../%61ssets/vehicle-catalog/logos/logo_mercedes-benz.png','../%61ssets/cars/mercedes/models/card/e-class.png'],
    ['lamborghini-urus','람보르기니','우루스 SE','2025 플러그인 하이브리드','phev','../%61ssets/vehicle-catalog/logos/logo_lamborghini.png','../%61ssets/listing-photos/v01/lamborghini_urus_phev_3003.jpg'],
    ['porsche-taycan','포르쉐','타이칸','2025 Taycan 4S','ev','../%61ssets/vehicle-catalog/logos/logo_porsche.png','../%61ssets/cars/seoul-autogallery-v01/sag-02-1.webp'],
    ['bmw-m3','BMW','M3','2025 M3 xDrive 컴페티션','ice','../%61ssets/vehicle-catalog/logos/logo_bmw.png','../%61ssets/cars/bmw/card-three-quarter/m3-three-quarter.png']
  ];
  var issues=[
    ['조향','저속 회전 중 조향 보조가 갑자기 무거워졌습니다','주차장 출구에서 핸들이 순간적으로 굳어 안전한 곳에 정차했습니다. 경고등이 켜졌다가 재시동 후 사라졌지만 같은 현상이 두 번 반복됐습니다. 서비스센터 점검 예약과 원인 확인을 요청했습니다.'],
    ['서비스','예약한 정비가 현장에서 접수되지 않았습니다','전화로 날짜와 대차 가능 여부까지 확인했지만 방문 당일 예약 내역이 없다는 답변을 받았습니다. 담당자 연결과 일정 재조정 과정도 안내가 달라 처리 기준을 확인하고 싶습니다.'],
    ['전장','주행 중 인포테인먼트 화면이 반복 재부팅됩니다','내비게이션과 후방 카메라 화면이 함께 꺼졌다가 다시 켜집니다. 소프트웨어 업데이트 뒤에도 동일하며 발생 시각과 영상을 기록해 센터에 전달했습니다.'],
    ['제동','브레이크 작동 시 소음과 진동이 커졌습니다','고속 주행 후 감속할 때 페달과 핸들에 진동이 전달됩니다. 패드 점검에서는 정상이라고 했지만 증상이 계속돼 추가 진단을 요청했습니다.'],
    ['배터리·충전','급속 충전이 여러 충전소에서 중단됩니다','서로 다른 사업자의 충전기에서 20분 전후로 충전이 멈췄습니다. 차량 로그와 충전기 오류 화면을 확보했고 배터리 관리 시스템 점검을 요청했습니다.'],
    ['누수','비 온 뒤 2열 바닥에 물이 고입니다','세차나 비가 온 다음 날 2열 매트 아래가 젖어 있습니다. 도어 실링을 교환했지만 다시 발생해 유입 경로 재점검을 요청했습니다.'],
    ['변속','정차 후 출발할 때 변속 충격이 발생합니다','냉간 상태에서 D단으로 전환하면 큰 충격이 느껴집니다. 주행 후에는 완화되지만 최근 빈도가 늘어 진단 결과와 조치 계획을 기다리고 있습니다.'],
    ['도장·마감','인도 직후 도장면 얼룩과 단차를 발견했습니다','차량 인수 다음 날 밝은 곳에서 보닛 도장 얼룩과 범퍼 단차를 확인했습니다. 출고 전 검수 기록과 보수 범위를 서면으로 요청했습니다.']
  ];
  var authors=['강남출퇴근','주말패밀리카','모터로그','대전차주','오너리포트','차량기록장','안전제보','정비노트'];
  var cities=['서울','경기','인천','부산','대전','대구','광주','세종'];
  /* 공개 공론화 게시판이므로 공식 접수·통지·처리 상태를 가장하지 않는다. */
  var publicLabels=['추가 제보 3','작성자 업데이트','해결 후기','공개'];
  var stakeholders={
    'BMW':{vehicleType:'official-import',manufacturer:'BMW',importer:'BMW 코리아',dealerGroup:'도이치 모터스',dealerBranch:'BMW 성수 서비스센터'},
    '벤츠':{vehicleType:'official-import',manufacturer:'메르세데스-벤츠',importer:'메르세데스-벤츠 코리아',dealerGroup:'한성자동차',dealerBranch:'메르세데스-벤츠 성수 서비스센터'},
    '렉서스':{vehicleType:'official-import',manufacturer:'렉서스',importer:'한국토요타자동차',dealerGroup:'엘앤티렉서스',dealerBranch:'렉서스 강남 서비스센터'},
    '람보르기니':{vehicleType:'official-import',manufacturer:'람보르기니',importer:'수입사 직접 확인',dealerGroup:'SQDA Motors',dealerBranch:'람보르기니 서울'},
    '포르쉐':{vehicleType:'official-import',manufacturer:'포르쉐',importer:'포르쉐코리아',dealerGroup:'스투트가르트스포츠카',dealerBranch:'포르쉐 센터 대치'}
  };
  var rows=[];
  for(var i=0;i<24;i++){
    var car=cars[i%cars.length],issue=issues[i%issues.length];
    var party=stakeholders[car[1]]||{vehicleType:'domestic-new',manufacturer:car[1],dealerGroup:'신차 판매 딜러사',dealerBranch:'판매 지점'};
    rows.push({
      id:String(9600001+i),complaintId:'ah-'+String(1001+i),category:issue[0],title:issue[1],summary:issue[2],body:issue[2],
      author:authors[i%authors.length],publishedAt:'2026-10-'+String(17-(i%15)).padStart(2,'0')+'T'+String(8+(i%9)).padStart(2,'0')+':20:00+09:00',
      views:String(420+i*137),comments:String(4+(i*7)%42),likes:String(9+(i*11)%96),thumbnail:car[6],images:[car[6]].join('|'),
      modelId:car[0],brand:car[1],model:car[2],trim:car[3],powertrain:car[4],brandLogo:car[5],city:cities[i%cities.length],
      issueType:issue[0],publicLabel:publicLabels[i%publicLabels.length],odometer:String(3100+i*1860),verified:i%4!==3,
      vehicleType:party.vehicleType,manufacturer:party.manufacturer,importer:party.importer||'',dealerGroup:party.dealerGroup||'',dealerBranch:party.dealerBranch||''
    });
  }
  tables['autohome-complaint']={board:'autohome-complaint',displayName:'차량 결함·불만',idStart:9600001,defaultView:'',updatedAt:'2026-10-17T21:30:00+09:00',topics:['전체','조향','서비스','전장','제동','배터리·충전','누수','변속','도장·마감'],rows:rows};
})();
