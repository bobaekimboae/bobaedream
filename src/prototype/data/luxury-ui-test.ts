export type LuxuryUiTestRow = {
  number: number;
  imageFile: string;
  brand: string;
  fullTitle: string;
  year: number;
  mileage: string;
  fuel: string;
  transmission: string;
  price: string;
  region: string;
  sellerTypeLabel: string;
  sellerName: string;
  badges: string[];
  posted: string;
  photos: number;
  testPoint: string;
  sourceListingId: string;
};

// UI 테스트용 가상 매물. 이미지 파일 번호와 노션 시나리오 번호(1~30)를 그대로 맞춘다.
export const luxuryUiTestRows: LuxuryUiTestRow[] = [
  {
    "number": 1,
    "imageFile": "001_람보르기니_28635648.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우르스 SE 4.0 V8 신차급 완전무사고 1인신조 제조사보증",
    "year": 2026,
    "mileage": "120km",
    "fuel": "하이브리드(가솔린)",
    "transmission": "자동",
    "price": "4억 4,500만원",
    "region": "경기 성남시",
    "sellerTypeLabel": "브랜드 인증관",
    "sellerName": "프레스티지 오토",
    "badges": [
      "무사고",
      "1인신조"
    ],
    "posted": "3분 전",
    "photos": 8,
    "testPoint": "긴 모델명 + 긴 배지 조합",
    "sourceListingId": "28635648"
  },
  {
    "number": 2,
    "imageFile": "002_람보르기니_28604220.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우라칸 LP610-4 Spyder 정식출고 오픈에어링 패키지 브라운 시트",
    "year": 2017,
    "mileage": "43,263km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "2억 900만원",
    "region": "서울 강남구",
    "sellerTypeLabel": "전문 딜러",
    "sellerName": "강남 럭셔리 모터스",
    "badges": [
      "제조사보증",
      "정식출고"
    ],
    "posted": "7분 전",
    "photos": 11,
    "testPoint": "영문 혼합 모델명의 2줄 줄바꿈",
    "sourceListingId": "28604220"
  },
  {
    "number": 3,
    "imageFile": "003_람보르기니_28557627.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우라칸 EVO 5.2 LP640-4 Spyder 카본 익스테리어 풀옵션 리프팅 시스템",
    "year": 2023,
    "mileage": "18,910km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 2,300만원",
    "region": "부산 해운대구",
    "sellerTypeLabel": "개인 판매",
    "sellerName": "로얄 모빌리티",
    "badges": [
      "KB진단",
      "홈배송"
    ],
    "posted": "11분 전",
    "photos": 14,
    "testPoint": "가장 긴 제목과 카본 옵션 문구",
    "sourceListingId": "28557627"
  },
  {
    "number": 4,
    "imageFile": "004_람보르기니_27964284.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우루스 퍼포만테 4.0 V8 무사고 퍼포먼스 패키지 고급유 관리",
    "year": 2024,
    "mileage": "15,472km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 8,400만원",
    "region": "경기 수원시",
    "sellerTypeLabel": "KB진단 딜러",
    "sellerName": "오토갤러리 원",
    "badges": [
      "가격인하",
      "즉시출고"
    ],
    "posted": "15분 전",
    "photos": 17,
    "testPoint": "고가 가격 숫자 자간과 단위 정렬",
    "sourceListingId": "27964284"
  },
  {
    "number": 5,
    "imageFile": "005_람보르기니_28435973.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우르스 SE 4.0 V8 출고 대기 없는 즉시 인도 가능 차량",
    "year": 2025,
    "mileage": "8,711km",
    "fuel": "하이브리드(가솔린)",
    "transmission": "자동",
    "price": "4억 1,500만원",
    "region": "서울 서초구",
    "sellerTypeLabel": "브랜드 인증관",
    "sellerName": "VIP 모터스",
    "badges": [
      "희소매물",
      "풀옵션"
    ],
    "posted": "19분 전",
    "photos": 20,
    "testPoint": "하이브리드 연료명 폭 테스트",
    "sourceListingId": "28435973"
  },
  {
    "number": 6,
    "imageFile": "006_람보르기니_28258100.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우루스 퍼포만테 4.0 V8 세라믹 브레이크 파노라마 루프 풀옵션",
    "year": 2024,
    "mileage": "14,841km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 6,300만원",
    "region": "대구 수성구",
    "sellerTypeLabel": "전문 딜러",
    "sellerName": "더클래스 오토",
    "badges": [
      "무사고",
      "1인신조"
    ],
    "posted": "23분 전",
    "photos": 23,
    "testPoint": "긴 옵션 문구 말줄임 처리",
    "sourceListingId": "28258100"
  },
  {
    "number": 7,
    "imageFile": "007_람보르기니_28495311.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우루스 S 4.0 V8 1인 소유 정식센터 관리내역 완비",
    "year": 2023,
    "mileage": "18,881km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 1,800만원",
    "region": "인천 연수구",
    "sellerTypeLabel": "개인 판매",
    "sellerName": "엘리트 모터스",
    "badges": [
      "제조사보증",
      "정식출고"
    ],
    "posted": "27분 전",
    "photos": 26,
    "testPoint": "지역명과 판매자명 한 줄 정렬",
    "sourceListingId": "28495311"
  },
  {
    "number": 8,
    "imageFile": "008_람보르기니_28401434.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우르스 SE 4.0 V8 신차 컨디션 보증 연장 프로그램 적용",
    "year": 2025,
    "mileage": "4,456km",
    "fuel": "하이브리드(가솔린)",
    "transmission": "자동",
    "price": "4억 2,900만원",
    "region": "경기 용인시",
    "sellerTypeLabel": "KB진단 딜러",
    "sellerName": "시그니처 카",
    "badges": [
      "KB진단",
      "홈배송"
    ],
    "posted": "31분 전",
    "photos": 29,
    "testPoint": "다중 배지 높이와 행간",
    "sourceListingId": "28401434"
  },
  {
    "number": 9,
    "imageFile": "009_람보르기니_28589536.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우루스 S 4.0 V8 희소 컬러 실내외 풀 PPF 시공",
    "year": 2023,
    "mileage": "16,092km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 4,500만원",
    "region": "서울 송파구",
    "sellerTypeLabel": "브랜드 인증관",
    "sellerName": "프라임 오토",
    "badges": [
      "가격인하",
      "즉시출고"
    ],
    "posted": "35분 전",
    "photos": 8,
    "testPoint": "한글·영문·숫자 혼합 제목",
    "sourceListingId": "28589536"
  },
  {
    "number": 10,
    "imageFile": "010_람보르기니_28647307.jpg",
    "brand": "람보르기니",
    "fullTitle": "람보르기니 우루스 S 4.0 V8 주행거리 짧은 무사고 최상급 매물",
    "year": 2024,
    "mileage": "1,570km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 5,700만원",
    "region": "경기 고양시",
    "sellerTypeLabel": "전문 딜러",
    "sellerName": "하이엔드 모터스",
    "badges": [
      "희소매물",
      "풀옵션"
    ],
    "posted": "39분 전",
    "photos": 11,
    "testPoint": "짧은 주행거리와 고가 가격 대비",
    "sourceListingId": "28647307"
  },
  {
    "number": 11,
    "imageFile": "011_롤스로이스_28786128.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 고스트 6.6 V12 EWB 롱휠베이스 리어 시어터 비스포크 옵션",
    "year": 2015,
    "mileage": "108,931km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "1억 3,500만원",
    "region": "서울 강남구",
    "sellerTypeLabel": "개인 판매",
    "sellerName": "프레스티지 오토",
    "badges": [
      "무사고",
      "1인신조"
    ],
    "posted": "43분 전",
    "photos": 14,
    "testPoint": "10만km 이상 주행거리 표기",
    "sourceListingId": "28786128"
  },
  {
    "number": 12,
    "imageFile": "012_롤스로이스_28785480.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 레이스 6.6 기본형 스타라이트 헤드라이너 투톤 인테리어",
    "year": 2017,
    "mileage": "79,100km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "1억 7,900만원",
    "region": "경기 성남시",
    "sellerTypeLabel": "KB진단 딜러",
    "sellerName": "강남 럭셔리 모터스",
    "badges": [
      "제조사보증",
      "정식출고"
    ],
    "posted": "47분 전",
    "photos": 17,
    "testPoint": "긴 판매자명과 중간 가격",
    "sourceListingId": "28785480"
  },
  {
    "number": 13,
    "imageFile": "013_롤스로이스_27794368.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 고스트 6.6 V12 EWB 정식수입 무사고 실내외 최상급",
    "year": 2016,
    "mileage": "56,532km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "1억 7,000만원",
    "region": "인천 연수구",
    "sellerTypeLabel": "브랜드 인증관",
    "sellerName": "로얄 모빌리티",
    "badges": [
      "KB진단",
      "홈배송"
    ],
    "posted": "51분 전",
    "photos": 20,
    "testPoint": "EWB 영문 약어 줄바꿈",
    "sourceListingId": "27794368"
  },
  {
    "number": 14,
    "imageFile": "014_롤스로이스_28590139.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 고스트 2세대 6.75 V12 SWB 신형 페이스리프트 제조사 보증 잔존",
    "year": 2026,
    "mileage": "2,654km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "5억 9,800만원",
    "region": "서울 서초구",
    "sellerTypeLabel": "전문 딜러",
    "sellerName": "오토갤러리 원",
    "badges": [
      "가격인하",
      "즉시출고"
    ],
    "posted": "55분 전",
    "photos": 23,
    "testPoint": "최고가 5억대 가격 강조",
    "sourceListingId": "28590139"
  },
  {
    "number": 15,
    "imageFile": "015_롤스로이스_28201230.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 컬리넌 6.7 V12 Black Badge 블랙 배지 코치라인 비스포크 오디오",
    "year": 2023,
    "mileage": "2,013km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "4억 3,200만원",
    "region": "부산 해운대구",
    "sellerTypeLabel": "개인 판매",
    "sellerName": "VIP 모터스",
    "badges": [
      "희소매물",
      "풀옵션"
    ],
    "posted": "59분 전",
    "photos": 26,
    "testPoint": "Black Badge 긴 모델명",
    "sourceListingId": "28201230"
  },
  {
    "number": 16,
    "imageFile": "016_롤스로이스_28763521.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 고스트 6.6 V12 Black Badge 완전무사고 기사관리 센터점검 완료",
    "year": 2020,
    "mileage": "14,531km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "2억 4,999만원",
    "region": "대구 수성구",
    "sellerTypeLabel": "KB진단 딜러",
    "sellerName": "더클래스 오토",
    "badges": [
      "무사고",
      "1인신조"
    ],
    "posted": "63분 전",
    "photos": 29,
    "testPoint": "24,999만원 비정형 가격",
    "sourceListingId": "28763521"
  },
  {
    "number": 17,
    "imageFile": "017_롤스로이스_28439245.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 고스트 2세대 6.75 V12 Black Badge 리어 라운지 시트 냉장고 풀옵션",
    "year": 2023,
    "mileage": "8,896km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "4억 7,000만원",
    "region": "경기 수원시",
    "sellerTypeLabel": "브랜드 인증관",
    "sellerName": "엘리트 모터스",
    "badges": [
      "제조사보증",
      "정식출고"
    ],
    "posted": "67분 전",
    "photos": 8,
    "testPoint": "가장 긴 롤스로이스 모델명",
    "sourceListingId": "28439245"
  },
  {
    "number": 18,
    "imageFile": "018_롤스로이스_28297975.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 고스트 2세대 6.75 V12 EWB EWB 비스포크 투톤 컬러 1인신조",
    "year": 2024,
    "mileage": "2,787km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "5억 3,000만원",
    "region": "서울 강남구",
    "sellerTypeLabel": "전문 딜러",
    "sellerName": "시그니처 카",
    "badges": [
      "KB진단",
      "홈배송"
    ],
    "posted": "71분 전",
    "photos": 11,
    "testPoint": "5억원대 가격과 짧은 주행거리",
    "sourceListingId": "28297975"
  },
  {
    "number": 19,
    "imageFile": "019_롤스로이스_27802710.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 레이스 6.6 기본형 정식출고 스타라이트 헤드라이너",
    "year": 2021,
    "mileage": "24,218km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 1,100만원",
    "region": "경기 용인시",
    "sellerTypeLabel": "개인 판매",
    "sellerName": "프라임 오토",
    "badges": [
      "가격인하",
      "즉시출고"
    ],
    "posted": "75분 전",
    "photos": 14,
    "testPoint": "중간 길이 제목 기본 상태",
    "sourceListingId": "27802710"
  },
  {
    "number": 20,
    "imageFile": "020_롤스로이스_28614624.jpg",
    "brand": "롤스로이스",
    "fullTitle": "롤스로이스 고스트 2세대 6.75 V12 EWB 저주행 VIP 의전 사양 보증 가능",
    "year": 2022,
    "mileage": "3,688km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 3,790만원",
    "region": "대전 유성구",
    "sellerTypeLabel": "KB진단 딜러",
    "sellerName": "하이엔드 모터스",
    "badges": [
      "희소매물",
      "풀옵션"
    ],
    "posted": "79분 전",
    "photos": 17,
    "testPoint": "지역명이 긴 경우 하단 정렬",
    "sourceListingId": "28614624"
  },
  {
    "number": 21,
    "imageFile": "021_페라리_28661957.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 488 GTB 3.9 V8 카본 레이싱 시트 정식센터 관리",
    "year": 2018,
    "mileage": "24,336km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "2억 4,000만원",
    "region": "서울 강남구",
    "sellerTypeLabel": "브랜드 인증관",
    "sellerName": "프레스티지 오토",
    "badges": [
      "무사고",
      "1인신조"
    ],
    "posted": "83분 전",
    "photos": 20,
    "testPoint": "짧은 모델명과 2억원대 가격",
    "sourceListingId": "28661957"
  },
  {
    "number": 22,
    "imageFile": "022_페라리_28580372.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 푸로산게 6.5 V12 기본형 신차급 푸로산게 풀옵션 즉시출고",
    "year": 2024,
    "mileage": "3,675km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "6억 8,000만원",
    "region": "경기 성남시",
    "sellerTypeLabel": "전문 딜러",
    "sellerName": "강남 럭셔리 모터스",
    "badges": [
      "제조사보증",
      "정식출고"
    ],
    "posted": "87분 전",
    "photos": 23,
    "testPoint": "최고가 6억대 가격 폭 테스트",
    "sourceListingId": "28580372"
  },
  {
    "number": 23,
    "imageFile": "023_페라리_26864591.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 F8 Spider 3.9 V8 오픈톱 카본패키지 제조사 보증",
    "year": 2021,
    "mileage": "16,306km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 6,680만원",
    "region": "부산 해운대구",
    "sellerTypeLabel": "개인 판매",
    "sellerName": "로얄 모빌리티",
    "badges": [
      "KB진단",
      "홈배송"
    ],
    "posted": "91분 전",
    "photos": 26,
    "testPoint": "Spider 영문 혼합 제목",
    "sourceListingId": "26864591"
  },
  {
    "number": 24,
    "imageFile": "024_페라리_28450863.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 488 스파이더 4.0 V8 정식출고 무사고 레드 인테리어",
    "year": 2017,
    "mileage": "31,330km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "2억 2,500만원",
    "region": "경기 수원시",
    "sellerTypeLabel": "KB진단 딜러",
    "sellerName": "오토갤러리 원",
    "badges": [
      "가격인하",
      "즉시출고"
    ],
    "posted": "95분 전",
    "photos": 29,
    "testPoint": "할인가·이전가격 동시 노출",
    "sourceListingId": "28450863"
  },
  {
    "number": 25,
    "imageFile": "025_페라리_28046041.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 캘리포니아 T 3.9 V8 하드톱 컨버터블 1인신조 센터관리",
    "year": 2016,
    "mileage": "35,775km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "1억 300만원",
    "region": "서울 서초구",
    "sellerTypeLabel": "브랜드 인증관",
    "sellerName": "VIP 모터스",
    "badges": [
      "희소매물",
      "풀옵션"
    ],
    "posted": "99분 전",
    "photos": 8,
    "testPoint": "계약중 상태 배지 조합",
    "sourceListingId": "28046041"
  },
  {
    "number": 26,
    "imageFile": "026_페라리_28694582.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 포르토피노 3.9 V8 포르토피노 옵션 다수 현금차량",
    "year": 2020,
    "mileage": "18,446km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "2억 2,500만원",
    "region": "인천 연수구",
    "sellerTypeLabel": "전문 딜러",
    "sellerName": "더클래스 오토",
    "badges": [
      "무사고",
      "1인신조"
    ],
    "posted": "103분 전",
    "photos": 11,
    "testPoint": "중간 가격 기본 상태",
    "sourceListingId": "28694582"
  },
  {
    "number": 27,
    "imageFile": "027_페라리_28671254.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 F8 Spider 3.9 V8 저주행 F8 스파이더 카본 풀패키지",
    "year": 2021,
    "mileage": "4,857km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 6,899만원",
    "region": "경기 용인시",
    "sellerTypeLabel": "개인 판매",
    "sellerName": "엘리트 모터스",
    "badges": [
      "제조사보증",
      "정식출고"
    ],
    "posted": "107분 전",
    "photos": 14,
    "testPoint": "36,899만원 비정형 가격",
    "sourceListingId": "28671254"
  },
  {
    "number": 28,
    "imageFile": "028_페라리_28627090.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 포르토피노 3.9 V8 데일리 슈퍼카 무사고 관리상태 우수",
    "year": 2019,
    "mileage": "43,400km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "1억 6,700만원",
    "region": "부산 남구",
    "sellerTypeLabel": "KB진단 딜러",
    "sellerName": "시그니처 카",
    "badges": [
      "KB진단",
      "홈배송"
    ],
    "posted": "111분 전",
    "photos": 17,
    "testPoint": "4만km 이상 주행거리",
    "sourceListingId": "28627090"
  },
  {
    "number": 29,
    "imageFile": "029_페라리_28316860.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 SF90 4.0 스파이더 기본형 SF90 스파이더 아세토 피오라노 패키지",
    "year": 2023,
    "mileage": "967km",
    "fuel": "플러그인 하이브리드",
    "transmission": "자동",
    "price": "5억 7,500만원",
    "region": "대구 수성구",
    "sellerTypeLabel": "브랜드 인증관",
    "sellerName": "프라임 오토",
    "badges": [
      "가격인하",
      "즉시출고"
    ],
    "posted": "115분 전",
    "photos": 20,
    "testPoint": "플러그인 하이브리드 긴 연료명",
    "sourceListingId": "28316860"
  },
  {
    "number": 30,
    "imageFile": "030_페라리_28566432.jpg",
    "brand": "페라리",
    "fullTitle": "페라리 F8 Tributo 3.9 V8 F8 트리뷰토 카본 레이싱 패키지",
    "year": 2022,
    "mileage": "8,873km",
    "fuel": "가솔린",
    "transmission": "자동",
    "price": "3억 2,000만원",
    "region": "인천 중구",
    "sellerTypeLabel": "전문 딜러",
    "sellerName": "하이엔드 모터스",
    "badges": [
      "희소매물",
      "풀옵션"
    ],
    "posted": "119분 전",
    "photos": 23,
    "testPoint": "Tributo 영문 혼합 긴 제목",
    "sourceListingId": "28566432"
  }
];
