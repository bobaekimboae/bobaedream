// 서울오토갤러리 카테고리 실데이터 v01 — 2026-10-10
// 원천: 구글 시트 「서울오토갤러리」 탭 736행 중 사진 5장이 Drive 에 있는 23대(중복 행 제외). 나머지 713대는 원본 사진이 404 라 사진이 오면 넣는다.
// 상사명 · 딜러명은 사용자 지시(2026-10-10 「실제 상사명 실제 딜러명을 추가」)로 시트의 실제 값을 그대로 쓴다. 전화번호 · 차량번호 · 원본 URL · 매물번호는 저장하지 않는다.
// 판매가는 시트의 「공개」 또는 「추정」 값이다(priceKind). 사진은 글자 인식(번호판 · 전화번호 · 광고)으로 흐림 처리한 640px 사본이고, 목록 썸네일은 차 폭 90% · 바닥선 85%로 맞춘 사본이다.
// 서울오토갤러리 매매단지 소재지는 서울 서초구(KB 매매단지 마스터)다.

export type SeoulAutoGalleryRow = {
  number: number;
  maker: string;
  model: string;
  generation: string;
  trim: string;
  year: number;
  mileage: number;
  fuel: string;
  /** 만원 */
  price: number;
  priceKind: "공개" | "추정";
  /** 실제 상사명 */
  company: string;
  /** 실제 딜러명 */
  dealer: string;
  body: string;
  origin: string;
  posted: string;
};

export const seoulAutoGalleryRows: SeoulAutoGalleryRow[] = [
  {"number": 1, "maker": "BMW", "model": "M3", "generation": "6세대", "trim": "M3 xDrive 컴페티션 M", "year": 2023, "mileage": 22000, "fuel": "가솔린", "price": 9595, "priceKind": "추정", "company": "(주)디앤디플러스", "dealer": "박상용", "body": "세단", "origin": "독일", "posted": "10분 전"},
  {"number": 2, "maker": "포르쉐", "model": "타이칸", "generation": "", "trim": "EV", "year": 2023, "mileage": 30000, "fuel": "전기", "price": 12690, "priceKind": "추정", "company": "(주)서울자동차선물거래소", "dealer": "권재한", "body": "세단", "origin": "독일", "posted": "17분 전"},
  {"number": 3, "maker": "벤츠", "model": "GLS클래스", "generation": "3세대", "trim": "GLS 580 4매틱", "year": 2022, "mileage": 95000, "fuel": "가솔린", "price": 7575, "priceKind": "추정", "company": "(주)브로엠와이", "dealer": "강홍구", "body": "SUV", "origin": "독일", "posted": "24분 전"},
  {"number": 4, "maker": "벤츠", "model": "GLC클래스", "generation": "2세대", "trim": "GLC 300 4매틱 쿠페 아방가르드", "year": 2024, "mileage": 9563, "fuel": "가솔린", "price": 6375, "priceKind": "추정", "company": "점보모빌리티주식회사", "dealer": "이기련", "body": "SUV", "origin": "독일", "posted": "31분 전"},
  {"number": 5, "maker": "벤츠", "model": "E클래스", "generation": "5세대", "trim": "E350 4매틱 AMG 라인", "year": 2023, "mileage": 82000, "fuel": "가솔린", "price": 4344, "priceKind": "추정", "company": "(주)브로엠와이", "dealer": "강홍구", "body": "세단", "origin": "독일", "posted": "38분 전"},
  {"number": 6, "maker": "렉서스", "model": "RX", "generation": "4세대", "trim": "450h", "year": 2022, "mileage": 39000, "fuel": "하이브리드", "price": 6200, "priceKind": "공개", "company": "(주)브로엠제이", "dealer": "현정훈", "body": "SUV", "origin": "일본", "posted": "45분 전"},
  {"number": 7, "maker": "벤츠", "model": "S클래스", "generation": "7세대", "trim": "S350d", "year": 2023, "mileage": 69000, "fuel": "디젤", "price": 8145, "priceKind": "추정", "company": "(주)브로엠와이", "dealer": "강홍구", "body": "세단", "origin": "독일", "posted": "52분 전"},
  {"number": 8, "maker": "벤츠", "model": "GLA클래스", "generation": "", "trim": "GLA 45 AMG 4매틱", "year": 2018, "mileage": 23000, "fuel": "가솔린", "price": 1724, "priceKind": "추정", "company": "(주)라프모터스", "dealer": "차경민", "body": "SUV", "origin": "독일", "posted": "9분 전"},
  {"number": 9, "maker": "랜드로버", "model": "올 뉴 디펜더", "generation": "", "trim": "90 D250 X다이나믹 SE", "year": 2025, "mileage": 8356, "fuel": "디젤", "price": 6800, "priceKind": "추정", "company": "(주)디앤디플러스", "dealer": "김현종", "body": "SUV", "origin": "영국", "posted": "16분 전"},
  {"number": 10, "maker": "BMW", "model": "7시리즈", "generation": "6세대", "trim": "740Li xDrive 디자인 퓨어 엑셀런스", "year": 2021, "mileage": 70000, "fuel": "가솔린", "price": 4985, "priceKind": "추정", "company": "(주)기억", "dealer": "유광정", "body": "세단", "origin": "독일", "posted": "23분 전"},
  {"number": 11, "maker": "벤츠", "model": "E클래스", "generation": "2세대", "trim": "E240", "year": 2002, "mileage": 131000, "fuel": "가솔린", "price": 930, "priceKind": "추정", "company": "(주)디앤디플러스", "dealer": "김현종", "body": "세단", "origin": "독일", "posted": "30분 전"},
  {"number": 12, "maker": "벤츠", "model": "CLS클래스", "generation": "3세대", "trim": "CLS 450 4매틱", "year": 2022, "mileage": 42000, "fuel": "가솔린", "price": 5225, "priceKind": "추정", "company": "(주)브로엠와이", "dealer": "강홍구", "body": "세단", "origin": "독일", "posted": "37분 전"},
  {"number": 13, "maker": "벤츠", "model": "S클래스", "generation": "7세대", "trim": "S500L 4매틱", "year": 2021, "mileage": 70000, "fuel": "가솔린", "price": 8050, "priceKind": "추정", "company": "(주)브로엠와이", "dealer": "강홍구", "body": "세단", "origin": "독일", "posted": "44분 전"},
  {"number": 14, "maker": "BMW", "model": "4시리즈", "generation": "2세대", "trim": "쿠페 M440i xDrive", "year": 2021, "mileage": 52000, "fuel": "가솔린", "price": 4694, "priceKind": "추정", "company": "(주)디앤디플러스", "dealer": "박상용", "body": "쿠페", "origin": "독일", "posted": "51분 전"},
  {"number": 15, "maker": "벤츠", "model": "S클래스", "generation": "7세대", "trim": "S500L 4매틱", "year": 2022, "mileage": 28000, "fuel": "가솔린", "price": 9095, "priceKind": "추정", "company": "(주)브로엠와이", "dealer": "강홍구", "body": "세단", "origin": "독일", "posted": "8분 전"},
  {"number": 16, "maker": "벤틀리", "model": "플라잉스퍼", "generation": "3세대", "trim": "4.0 V8", "year": 2022, "mileage": 52000, "fuel": "가솔린", "price": 19300, "priceKind": "추정", "company": "(주)라프모터스", "dealer": "공오배", "body": "세단", "origin": "영국", "posted": "15분 전"},
  {"number": 17, "maker": "재규어", "model": "F-타입", "generation": "", "trim": "쿠페 3.0", "year": 2014, "mileage": 66000, "fuel": "가솔린", "price": 3200, "priceKind": "추정", "company": "(주)유알모터스", "dealer": "임재욱", "body": "쿠페", "origin": "영국", "posted": "22분 전"},
  {"number": 18, "maker": "랜드로버", "model": "올 뉴 디펜더", "generation": "", "trim": "110 D250 X다이나믹 SE", "year": 2026, "mileage": 20, "fuel": "디젤", "price": 8790, "priceKind": "추정", "company": "케이씨씨오토모빌(주)", "dealer": "조진희", "body": "SUV", "origin": "영국", "posted": "29분 전"},
  {"number": 19, "maker": "포르쉐", "model": "마칸", "generation": "", "trim": "3.0 S 디젤", "year": 2016, "mileage": 92000, "fuel": "디젤", "price": 2899, "priceKind": "추정", "company": "(주)더오토프라임", "dealer": "손동현", "body": "SUV", "origin": "독일", "posted": "36분 전"},
  {"number": 20, "maker": "벤츠", "model": "S클래스", "generation": "7세대", "trim": "S450L 4매틱", "year": 2021, "mileage": 30000, "fuel": "가솔린", "price": 8720, "priceKind": "추정", "company": "점보모빌리티주식회사", "dealer": "이창현", "body": "세단", "origin": "독일", "posted": "43분 전"},
  {"number": 21, "maker": "현대", "model": "더 뉴아반떼", "generation": "CN7", "trim": "가솔린 1.6 스마트", "year": 2024, "mileage": 22000, "fuel": "가솔린", "price": 2000, "priceKind": "추정", "company": "(주)서울자동차선물거래소", "dealer": "권재한", "body": "세단", "origin": "국산", "posted": "50분 전"},
  {"number": 22, "maker": "기아", "model": "신형 카니발", "generation": "KA4", "trim": "9인승 가솔린", "year": 2021, "mileage": 50000, "fuel": "가솔린", "price": 1950, "priceKind": "추정", "company": "점보모빌리티주식회사", "dealer": "김진혁", "body": "MPV", "origin": "국산", "posted": "7분 전"},
  {"number": 23, "maker": "벤츠", "model": "S클래스", "generation": "7세대", "trim": "마이바흐 S580 4매틱", "year": 2021, "mileage": 99000, "fuel": "가솔린", "price": 11500, "priceKind": "추정", "company": "(주)브로엠와이", "dealer": "강홍구", "body": "세단", "origin": "독일", "posted": "14분 전"},
];
