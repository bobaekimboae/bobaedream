// 럭셔리카 카테고리(차량 › 중고차 › 럭셔리카) 가상 매물 v01 — 2026-10-08
// 원천: 구글 시트 「가상 매물 시나리오」 럭셔리카 탭(차량번호 · 등록연월 · 주행 · 연료 · 지역 · 차명)과
// 구글 드라이브 매물 사진(파일명 = 차량번호). 사진은 차량번호 대신 순번 파일명(lux-NN)으로 저장했다.
// 가격 · 매매단지 · 딜러 · 프로필 · 등록시각은 UI 검증용 가상 값이다(실제 매물·실제 판매 조건 아님).
// 매매단지는 전국 16곳에 나눴다(2026-10-08 사용자 지시 「서울오토갤러리 등 전국으로 여러 개」). 그래서 시트의 지역(sheetRegion)과 화면 지역이 다를 수 있다.
// 딜러는 실제 시장처럼 전문 차종을 둔다(2026-10-08 「진짜 매물정보처럼 체계적으로」): 서울오토갤러리 페라리 · 강남 롤스로이스/벤틀리 · 오토플렉스 맥라렌 ·
// 도이치오토월드 G-클래스 · SKV1 람보르기니 우루스 · 오토허브 포르쉐/아우디 · 엠파크 마이바흐 · 디오토몰·제주 테슬라 · 부산 시트 지역 매물 ·
// 대구 벤츠 S/벤틀리 · 광주 마세라티/애스턴마틴 · 울산 미국 대형 SUV/픽업 · 경남 BMW M · 청주 페라리 GTC4.
// 시트에 등록연월 · 주행 · 연료 · 지역이 없던 26번(178다6624)은 같은 차종의 그럴듯한 가상 값을 채웠다(filled: true).
// 사진이 없던 3대(121가3330 · 351거1113 · 181마3337)는 2026-10-08 사용자 지시로 뺐다(29대).

export type LuxuryDealer = {
  id: string;
  name: string;
  /** 시도 구군 · 매매단지(KB차차차 매매단지 마스터 2026-08-26에 있는 실제 단지명) */
  place: string;
  avatar: string;
};

export type LuxuryListingRow = {
  number: number;
  /** 시트의 차량번호(사진 대조용). 화면에는 표시하지 않는다 */
  vehicleNumber: string;
  maker: string;
  model: string;
  /** 세대·세부모델(없으면 빈 문자열) */
  generation: string;
  trim: string;
  /** 등록연월(시트 표기 그대로, 연식 다르면 「(25년형)」) */
  registered: string;
  year: number;
  mileage: number;
  fuel: string;
  /** 시트의 지역(시도) */
  sheetRegion: string;
  dealerId: string;
  /** 만원 */
  price: number;
  posted: string;
  body: "세단" | "SUV" | "쿠페" | "컨버터블" | "왜건" | "픽업";
  origin: string;
  /** 사진이 없으면 null(드라이브에 아직 없음) */
  image: string | null;
  filled?: true;
};

export const luxuryDealers: readonly LuxuryDealer[] = [
  { id: "d01", name: "정태윤 딜러", place: "서울 서초구 · 서울오토갤러리", avatar: "cars/sellers/luxury-v01/dealer-01.png" },
  { id: "d02", name: "한서준 딜러", place: "서울 강남구 · 강남자동차매매단지", avatar: "cars/sellers/luxury-v01/dealer-02.png" },
  { id: "d03", name: "김나연 딜러", place: "서울 강서구 · 오토플렉스", avatar: "cars/sellers/luxury-v01/dealer-03.png" },
  { id: "d04", name: "오재혁 딜러", place: "경기 수원시 권선구 · 도이치오토월드", avatar: "cars/sellers/luxury-v01/dealer-04.png" },
  { id: "d05", name: "이도현 딜러", place: "경기 수원시 권선구 · SKV1모터스매매단지", avatar: "cars/sellers/luxury-v01/dealer-05.png" },
  { id: "d06", name: "윤하린 딜러", place: "경기 용인시 기흥구 · 오토허브", avatar: "cars/sellers/luxury-v01/dealer-06.png" },
  { id: "d07", name: "박시우 딜러", place: "인천 서구 · 엠파크타워자동차매매단지", avatar: "cars/sellers/luxury-v01/dealer-07.png" },
  { id: "d08", name: "최은재 딜러", place: "대전 유성구 · 디오토몰", avatar: "cars/sellers/luxury-v01/dealer-08.png" },
  { id: "d09", name: "강민혁 딜러", place: "부산 기장군 · 오토필드", avatar: "cars/sellers/luxury-v01/dealer-09.png" },
  { id: "d10", name: "문지아 딜러", place: "부산 해운대구 · 원파크", avatar: "cars/sellers/luxury-v01/dealer-10.png" },
  { id: "d11", name: "서건우 딜러", place: "대구 서구 · 대구엠월드자동차매매단지", avatar: "cars/sellers/luxury-v01/dealer-11.png" },
  { id: "d12", name: "배수아 딜러", place: "광주 서구 · 빛고을오토갤러리", avatar: "cars/sellers/luxury-v01/dealer-12.png" },
  { id: "d13", name: "장도윤 딜러", place: "울산 북구 · 울산자동차매매단지", avatar: "cars/sellers/luxury-v01/dealer-13.png" },
  { id: "d14", name: "신동하 딜러", place: "경남 창원시 마산회원구 · KC월드카프라자", avatar: "cars/sellers/luxury-v01/dealer-14.png" },
  { id: "d15", name: "임재원 딜러", place: "충북 청주시 청원구 · 청주오토월드", avatar: "cars/sellers/luxury-v01/dealer-15.png" },
  { id: "d16", name: "고은솔 딜러", place: "제주 제주시 · 제주오토파크", avatar: "cars/sellers/luxury-v01/dealer-16.png" },
];

const photo = (number: number) => `cars/luxury-category-v01/lux-${String(number).padStart(2, "0")}.webp`;

// 시트 순서 그대로(중복된 368서5810 한 줄과 사진 없는 3대는 뺐다)
export const luxuryListingRows: readonly LuxuryListingRow[] = [
  { number: 1, vehicleNumber: "151어3973", maker: "페라리", model: "488", generation: "", trim: "스파이더 3.9", registered: "19년01월", year: 2019, mileage: 60022, fuel: "가솔린", sheetRegion: "경기", dealerId: "d01", price: 25800, posted: "12분 전", body: "컨버터블", origin: "이탈리아", image: photo(1) },
  { number: 2, vehicleNumber: "300버5353", maker: "페라리", model: "푸로산게", generation: "", trim: "6.5 V12", registered: "24년11월", year: 2024, mileage: 3685, fuel: "가솔린", sheetRegion: "경기", dealerId: "d01", price: 79000, posted: "18분 전", body: "SUV", origin: "이탈리아", image: photo(2) },
  { number: 3, vehicleNumber: "101로3567", maker: "롤스로이스", model: "컬리넌", generation: "", trim: "6.7 V12", registered: "24년12월", year: 2024, mileage: 14562, fuel: "가솔린", sheetRegion: "부산", dealerId: "d09", price: 56500, posted: "24분 전", body: "SUV", origin: "영국", image: photo(3) },
  { number: 4, vehicleNumber: "288라1993", maker: "람보르기니", model: "우루스", generation: "", trim: "PHEV 4.0 V8 SE", registered: "25년11월", year: 2025, mileage: 5679, fuel: "가솔린+전기", sheetRegion: "경기", dealerId: "d05", price: 39800, posted: "31분 전", body: "SUV", origin: "이탈리아", image: photo(4) },
  { number: 5, vehicleNumber: "127버7860", maker: "람보르기니", model: "우루스", generation: "", trim: "4.0 V8 S", registered: "24년03월", year: 2024, mileage: 14942, fuel: "가솔린", sheetRegion: "경기", dealerId: "d05", price: 31900, posted: "45분 전", body: "SUV", origin: "이탈리아", image: photo(5) },
  { number: 6, vehicleNumber: "127부5132", maker: "벤츠", model: "G-클래스", generation: "W463b", trim: "AMG G63", registered: "25년08월", year: 2025, mileage: 6101, fuel: "가솔린+전기", sheetRegion: "경기", dealerId: "d04", price: 26900, posted: "1시간 전", body: "SUV", origin: "독일", image: photo(6) },
  { number: 7, vehicleNumber: "125마4204", maker: "맥라렌", model: "720S", generation: "", trim: "4.0 스파이더", registered: "20년06월", year: 2020, mileage: 17168, fuel: "가솔린", sheetRegion: "경기", dealerId: "d03", price: 27500, posted: "1시간 전", body: "컨버터블", origin: "영국", image: photo(7) },
  { number: 8, vehicleNumber: "160어7843", maker: "포르쉐", model: "911", generation: "(992)", trim: "카레라 GTS", registered: "26년01월(25년형)", year: 2025, mileage: 3438, fuel: "가솔린+전기", sheetRegion: "경기", dealerId: "d06", price: 23900, posted: "2시간 전", body: "쿠페", origin: "독일", image: photo(8) },
  { number: 9, vehicleNumber: "175오6218", maker: "벤츠", model: "GLS-클래스", generation: "X167", trim: "마이바흐 GLS600 4MATIC", registered: "25년06월", year: 2025, mileage: 3199, fuel: "가솔린", sheetRegion: "경기", dealerId: "d07", price: 27800, posted: "2시간 전", body: "SUV", origin: "독일", image: photo(9) },
  { number: 10, vehicleNumber: "122수5559", maker: "벤츠", model: "S-클래스", generation: "W223", trim: "AMG S63e 퍼포먼스", registered: "24년05월", year: 2024, mileage: 19587, fuel: "가솔린+전기", sheetRegion: "경기", dealerId: "d11", price: 19800, posted: "3시간 전", body: "세단", origin: "독일", image: photo(10) },
  { number: 11, vehicleNumber: "241구4630", maker: "벤츠", model: "GLS-클래스", generation: "X167", trim: "마이바흐 GLS600 4MATIC 마누팍투어", registered: "23년12월", year: 2023, mileage: 25507, fuel: "가솔린+전기", sheetRegion: "경기", dealerId: "d07", price: 22900, posted: "3시간 전", body: "SUV", origin: "독일", image: photo(11) },
  { number: 12, vehicleNumber: "314너2707", maker: "벤츠", model: "G-클래스", generation: "W463b", trim: "AMG G63", registered: "23년06월", year: 2023, mileage: 35523, fuel: "가솔린", sheetRegion: "경기", dealerId: "d04", price: 19500, posted: "4시간 전", body: "SUV", origin: "독일", image: photo(12) },
  { number: 13, vehicleNumber: "80러3173", maker: "테슬라", model: "사이버트럭", generation: "", trim: "123kWh 사이버비스트", registered: "25년12월(26년형)", year: 2026, mileage: 29980, fuel: "전기", sheetRegion: "경기", dealerId: "d08", price: 17900, posted: "5시간 전", body: "픽업", origin: "미국", image: photo(13) },
  { number: 15, vehicleNumber: "368서5810", maker: "마세라티", model: "MC20", generation: "", trim: "3.0 V6", registered: "22년08월", year: 2022, mileage: 19967, fuel: "가솔린", sheetRegion: "경기", dealerId: "d12", price: 21500, posted: "7시간 전", body: "쿠페", origin: "이탈리아", image: photo(15) },
  { number: 16, vehicleNumber: "251누2700", maker: "벤틀리", model: "플라잉스퍼", generation: "3세대", trim: "4.0", registered: "21년11월(22년형)", year: 2022, mileage: 46892, fuel: "가솔린", sheetRegion: "경기", dealerId: "d11", price: 15900, posted: "8시간 전", body: "세단", origin: "영국", image: photo(16) },
  { number: 17, vehicleNumber: "342조8738", maker: "캐딜락", model: "에스컬레이드", generation: "5세대", trim: "6.2 스포츠 플래티넘 ESV", registered: "26년04월", year: 2026, mileage: 620, fuel: "가솔린", sheetRegion: "경기", dealerId: "d13", price: 19900, posted: "9시간 전", body: "SUV", origin: "미국", image: photo(17) },
  { number: 18, vehicleNumber: "308서4766", maker: "BMW", model: "M5", generation: "(G90)", trim: "M5 PHEV 투어링", registered: "26년03월", year: 2026, mileage: 5551, fuel: "가솔린+전기", sheetRegion: "경기", dealerId: "d14", price: 18700, posted: "10시간 전", body: "왜건", origin: "독일", image: photo(18) },
  { number: 19, vehicleNumber: "325무9999", maker: "아우디", model: "R8", generation: "(4S)", trim: "5.2 V10 스파이더", registered: "22년04월(21년형)", year: 2021, mileage: 25954, fuel: "가솔린", sheetRegion: "경기", dealerId: "d06", price: 18900, posted: "12시간 전", body: "컨버터블", origin: "독일", image: photo(19) },
  { number: 20, vehicleNumber: "49서4600", maker: "테슬라", model: "모델 X", generation: "", trim: "105kWh 스탠다드", registered: "25년02월", year: 2025, mileage: 18163, fuel: "전기", sheetRegion: "경기", dealerId: "d16", price: 10900, posted: "14시간 전", body: "SUV", origin: "미국", image: photo(20) },
  { number: 21, vehicleNumber: "111저7088", maker: "맥라렌", model: "GT", generation: "", trim: "4.0", registered: "23년07월", year: 2023, mileage: 11522, fuel: "가솔린", sheetRegion: "경기", dealerId: "d03", price: 19800, posted: "16시간 전", body: "쿠페", origin: "영국", image: photo(21) },
  { number: 22, vehicleNumber: "186고3974", maker: "애스턴마틴", model: "밴티지", generation: "2세대", trim: "4.0 V8 쿠페", registered: "23년06월", year: 2023, mileage: 1480, fuel: "가솔린", sheetRegion: "경기", dealerId: "d12", price: 17500, posted: "18시간 전", body: "쿠페", origin: "영국", image: photo(22) },
  { number: 23, vehicleNumber: "189어8073", maker: "BMW", model: "M8", generation: "(G15)", trim: "M8 그란쿠페 컴페티션", registered: "25년03월(24년형)", year: 2024, mileage: 9401, fuel: "가솔린", sheetRegion: "경기", dealerId: "d14", price: 15900, posted: "20시간 전", body: "세단", origin: "독일", image: photo(23) },
  { number: 25, vehicleNumber: "92소1338", maker: "GMC", model: "허머 EV", generation: "", trim: "199kWh 3X", registered: "24년12월", year: 2024, mileage: 13715, fuel: "전기", sheetRegion: "경기", dealerId: "d13", price: 21900, posted: "1일 전", body: "픽업", origin: "미국", image: photo(25) },
  { number: 26, vehicleNumber: "178다6624", maker: "벤틀리", model: "플라잉스퍼", generation: "3세대", trim: "4.0 AZURE 기본형", registered: "24년09월", year: 2024, mileage: 6800, fuel: "가솔린", sheetRegion: "", dealerId: "d02", price: 26800, posted: "2일 전", body: "세단", origin: "영국", image: photo(26), filled: true },
  { number: 28, vehicleNumber: "138저2888", maker: "롤스로이스", model: "레이스", generation: "", trim: "6.6", registered: "20년07월", year: 2020, mileage: 17107, fuel: "가솔린", sheetRegion: "경기", dealerId: "d02", price: 26500, posted: "3일 전", body: "쿠페", origin: "영국", image: photo(28) },
  { number: 29, vehicleNumber: "126러1278", maker: "포르쉐", model: "911", generation: "(992)", trim: "타르가 4 GTS", registered: "23년07월", year: 2023, mileage: 16518, fuel: "가솔린", sheetRegion: "부산", dealerId: "d10", price: 20500, posted: "3일 전", body: "컨버터블", origin: "독일", image: photo(29) },
  { number: 30, vehicleNumber: "09더1188", maker: "페라리", model: "GTC4 루쏘", generation: "", trim: "T 3.9 V8", registered: "17년10월(18년형)", year: 2018, mileage: 31135, fuel: "가솔린", sheetRegion: "경기", dealerId: "d15", price: 18990, posted: "4일 전", body: "쿠페", origin: "이탈리아", image: photo(30) },
  { number: 31, vehicleNumber: "319노3478", maker: "BMW", model: "7시리즈", generation: "(G70)", trim: "740i xDrive M 스포츠", registered: "25년08월", year: 2025, mileage: 5170, fuel: "가솔린", sheetRegion: "부산", dealerId: "d10", price: 15200, posted: "5일 전", body: "세단", origin: "독일", image: photo(31) },
  { number: 32, vehicleNumber: "36버8923", maker: "페라리", model: "캘리포니아", generation: "", trim: "T 3.9 V8", registered: "16년03월", year: 2016, mileage: 23926, fuel: "가솔린", sheetRegion: "경기", dealerId: "d09", price: 12900, posted: "6일 전", body: "컨버터블", origin: "이탈리아", image: photo(32) },
];
