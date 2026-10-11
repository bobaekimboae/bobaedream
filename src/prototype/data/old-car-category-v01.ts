// 올드카 카테고리(차량 › 테마별 중고차 › 올드카) 가상 매물 v01 — 2026-10-11
// 원천: 구글 시트 「가상 매물 시나리오 › 올드카」 42행(제조사 · 모델 · 연식 · 연료 · 변속기 · 주행거리 · 가격 · 색상 · 지역 · 차종 · 사진).
// 제외 2행: 6번(매물명 「[]」 · 주행 1km 인 오류 행), 38번(41번 벤츠 560SL 과 같은 차 · 주행 188,201km 의 중복 행) → 40대.
// 판매자명 · 전화번호 · 원본 상세 URL · 매물번호는 시트에 없거나 저장하지 않는다. 판매자 · 딜러 이름 · 지역 · 등록시각은 UI 검증용 가상 값이다.
// 가격이 빈 29대는 같은 시대 · 같은 급의 그럴듯한 가상 값을 채웠다(priceFilled: true).
// 시트 지역이 「경기」뿐이거나 비어 있는 매물은 경기 4개 도시에 나눠 붙였다(인천 · 강원은 시트 값 그대로).
// 사진은 시트에서 실제 사진이 있는 10대 중 번호판 · 전화번호 · 서류가 크게 나온 04번(정비소 콜라주)과 08번(저해상도 · 타사 로고)을 뺀 8대만 쓴다.
// 번호판은 흐림 처리했고 차 바깥 배경(간판 · 다른 차 번호판)은 흐리게 했다. 사진이 없는 32대는 목록 끝으로 보내고 빈 사진 칸으로 둔다.
// 사진 파일: public/assets/cars/old-car-category-v01/old-NN.webp(640 폭) + thumb/old-NN.webp(600×600, 차 폭 90% · 바닥선 85%).

export type OldCarRow = {
  /** 시트의 순번 */
  number: number;
  /** 제목에 쓰는 제조사 표기(시트 값 · 예: 쉐보레(대우)) */
  titleMaker: string;
  /** 필터 · 제조사 레일에 쓰는 제조사 */
  maker: string;
  model: string;
  trim: string;
  year: number;
  mileage: number;
  fuel: string;
  transmission: "오토" | "수동";
  /** 만원 */
  price: number;
  priceFilled: boolean;
  color: string;
  /** 시도 구군 */
  region: string;
  body: "세단" | "SUV" | "쿠페" | "컨버터블" | "왜건" | "픽업";
  origin: "국산" | "수입";
  image: boolean;
};

export const oldCarListingRows: OldCarRow[] = [
  { number: 1, titleMaker: "현대", maker: "현대", model: "그랜저", trim: "2.0", year: 1989, mileage: 199000, fuel: "가솔린", transmission: "오토", price: 960, priceFilled: false, color: "기타", region: "경기 수원시", body: "세단", origin: "국산", image: true },
  { number: 9, titleMaker: "쉐보레(대우)", maker: "쉐보레", model: "티코", trim: "오토", year: 1996, mileage: 83350, fuel: "가솔린", transmission: "오토", price: 440, priceFilled: false, color: "흰색", region: "인천 남동구", body: "세단", origin: "국산", image: true },
  { number: 25, titleMaker: "현대", maker: "현대", model: "쏘나타", trim: "III 2.0 GLS", year: 1994, mileage: 77941, fuel: "가솔린", transmission: "오토", price: 440, priceFilled: false, color: "회색", region: "인천 남동구", body: "세단", origin: "국산", image: true },
  { number: 27, titleMaker: "현대", maker: "현대", model: "뉴그랜저", trim: "2.0 엑시모", year: 1993, mileage: 53308, fuel: "가솔린", transmission: "오토", price: 340, priceFilled: false, color: "검정", region: "인천 남동구", body: "세단", origin: "국산", image: true },
  { number: 33, titleMaker: "현대", maker: "현대", model: "그랜저", trim: "2.4", year: 1991, mileage: 181946, fuel: "가솔린", transmission: "오토", price: 470, priceFilled: false, color: "은색", region: "강원 원주시", body: "세단", origin: "국산", image: true },
  { number: 36, titleMaker: "벤츠", maker: "벤츠", model: "300E", trim: "", year: 1986, mileage: 150827, fuel: "가솔린", transmission: "오토", price: 3050, priceFilled: false, color: "검정", region: "인천 남동구", body: "세단", origin: "수입", image: true },
  { number: 41, titleMaker: "벤츠", maker: "벤츠", model: "SL-클래스", trim: "R107 560SL", year: 1986, mileage: 188201, fuel: "가솔린", transmission: "오토", price: 10900, priceFilled: false, color: "흰색", region: "경기 성남시", body: "컨버터블", origin: "수입", image: true },
  { number: 42, titleMaker: "지프", maker: "지프", model: "체로키", trim: "XJ 4.0", year: 1993, mileage: 326680, fuel: "가솔린", transmission: "오토", price: 2500, priceFilled: false, color: "파랑", region: "경기 고양시", body: "SUV", origin: "수입", image: true },
  { number: 2, titleMaker: "기아", maker: "기아", model: "캐피탈", trim: "", year: 1994, mileage: 72000, fuel: "가솔린", transmission: "수동", price: 1111, priceFilled: false, color: "기타", region: "경기 용인시", body: "세단", origin: "국산", image: false },
  { number: 3, titleMaker: "KG모빌리티(쌍용)", maker: "KG모빌리티", model: "코란도", trim: "4인승", year: 1990, mileage: 18000, fuel: "디젤", transmission: "수동", price: 800, priceFilled: false, color: "기타", region: "경기 수원시", body: "SUV", origin: "국산", image: false },
  { number: 4, titleMaker: "현대", maker: "현대", model: "그랜저", trim: "2.4", year: 1988, mileage: 162000, fuel: "가솔린", transmission: "오토", price: 450, priceFilled: true, color: "기타", region: "경기 성남시", body: "세단", origin: "국산", image: false },
  { number: 5, titleMaker: "기아", maker: "기아", model: "프라이드", trim: "왜건 1.3", year: 1996, mileage: 78000, fuel: "가솔린", transmission: "수동", price: 380, priceFilled: true, color: "기타", region: "경기 고양시", body: "왜건", origin: "국산", image: false },
  { number: 7, titleMaker: "토요타", maker: "토요타", model: "셀시오", trim: "", year: 1992, mileage: 129000, fuel: "가솔린", transmission: "오토", price: 650, priceFilled: true, color: "기타", region: "경기 용인시", body: "세단", origin: "수입", image: false },
  { number: 8, titleMaker: "현대", maker: "현대", model: "아반떼", trim: "1.5 GLS", year: 1996, mileage: 92761, fuel: "가솔린", transmission: "오토", price: 190, priceFilled: false, color: "빨강", region: "경기 수원시", body: "세단", origin: "국산", image: false },
  { number: 10, titleMaker: "지프", maker: "지프", model: "체로키", trim: "XJ 2.5", year: 1996, mileage: 340168, fuel: "가솔린", transmission: "수동", price: 380, priceFilled: true, color: "기타", region: "경기 성남시", body: "SUV", origin: "수입", image: false },
  { number: 11, titleMaker: "쉐보레(대우)", maker: "쉐보레", model: "티코", trim: "SE", year: 1996, mileage: 99181, fuel: "가솔린", transmission: "오토", price: 250, priceFilled: true, color: "빨강", region: "경기 고양시", body: "세단", origin: "국산", image: false },
  { number: 12, titleMaker: "현대", maker: "현대", model: "갤로퍼", trim: "", year: 1996, mileage: 133314, fuel: "디젤", transmission: "오토", price: 780, priceFilled: true, color: "기타", region: "경기 용인시", body: "SUV", origin: "국산", image: false },
  { number: 13, titleMaker: "벤츠", maker: "벤츠", model: "E클래스", trim: "2세대", year: 1996, mileage: 280245, fuel: "디젤", transmission: "오토", price: 520, priceFilled: true, color: "기타", region: "경기 수원시", body: "세단", origin: "수입", image: false },
  { number: 14, titleMaker: "BMW", maker: "BMW", model: "3시리즈", trim: "3세대 323i", year: 1996, mileage: 293921, fuel: "가솔린", transmission: "오토", price: 480, priceFilled: true, color: "흰색", region: "경기 성남시", body: "세단", origin: "수입", image: false },
  { number: 15, titleMaker: "뷰익", maker: "뷰익", model: "파크애비뉴", trim: "3.8", year: 1996, mileage: 140250, fuel: "가솔린", transmission: "오토", price: 620, priceFilled: true, color: "흰색", region: "경기 고양시", body: "세단", origin: "수입", image: false },
  { number: 16, titleMaker: "GMC", maker: "GMC", model: "벤츄라", trim: "5.7", year: 1995, mileage: 259960, fuel: "LPG", transmission: "오토", price: 680, priceFilled: true, color: "초록", region: "경기 용인시", body: "세단", origin: "수입", image: false },
  { number: 17, titleMaker: "BMW", maker: "BMW", model: "5시리즈", trim: "3세대 530i", year: 1995, mileage: 582581, fuel: "가솔린", transmission: "오토", price: 450, priceFilled: true, color: "흰색", region: "경기 수원시", body: "세단", origin: "수입", image: false },
  { number: 18, titleMaker: "페라리", maker: "페라리", model: "F355", trim: "3.5 V8 GTS", year: 1995, mileage: 67446, fuel: "가솔린", transmission: "수동", price: 10500, priceFilled: true, color: "노랑", region: "경기 성남시", body: "쿠페", origin: "수입", image: false },
  { number: 19, titleMaker: "현대", maker: "현대", model: "쏘나타", trim: "II 2.0", year: 1995, mileage: 92218, fuel: "가솔린", transmission: "오토", price: 360, priceFilled: true, color: "기타", region: "경기 고양시", body: "세단", origin: "국산", image: false },
  { number: 20, titleMaker: "기아", maker: "기아", model: "아벨라", trim: "델타 1.5", year: 1995, mileage: 34523, fuel: "가솔린", transmission: "오토", price: 520, priceFilled: true, color: "파랑", region: "경기 용인시", body: "세단", origin: "국산", image: false },
  { number: 21, titleMaker: "현대", maker: "현대", model: "마르샤", trim: "2.5 V6", year: 1995, mileage: 254606, fuel: "가솔린", transmission: "오토", price: 330, priceFilled: true, color: "기타", region: "경기 수원시", body: "세단", origin: "국산", image: false },
  { number: 22, titleMaker: "BMW", maker: "BMW", model: "5시리즈", trim: "3세대 520i", year: 1995, mileage: 204611, fuel: "가솔린", transmission: "오토", price: 480, priceFilled: true, color: "흰색", region: "경기 성남시", body: "세단", origin: "수입", image: false },
  { number: 23, titleMaker: "쉐보레(대우)", maker: "쉐보레", model: "프린스", trim: "1.8", year: 1995, mileage: 61000, fuel: "가솔린", transmission: "오토", price: 420, priceFilled: true, color: "검정", region: "경기 고양시", body: "세단", origin: "국산", image: false },
  { number: 24, titleMaker: "현대", maker: "현대", model: "뉴그랜저", trim: "2.0", year: 1995, mileage: 48121, fuel: "가솔린", transmission: "오토", price: 880, priceFilled: true, color: "기타", region: "경기 용인시", body: "세단", origin: "국산", image: false },
  { number: 26, titleMaker: "현대", maker: "현대", model: "쏘나타", trim: "II 1.8", year: 1994, mileage: 173068, fuel: "가솔린", transmission: "오토", price: 280, priceFilled: true, color: "회색", region: "경기 수원시", body: "세단", origin: "국산", image: false },
  { number: 28, titleMaker: "BMW", maker: "BMW", model: "기타", trim: "", year: 1993, mileage: 259876, fuel: "가솔린", transmission: "오토", price: 540, priceFilled: true, color: "검정", region: "경기 성남시", body: "세단", origin: "수입", image: false },
  { number: 29, titleMaker: "지프", maker: "지프", model: "랭글러", trim: "YJ 2.5", year: 1992, mileage: 220075, fuel: "가솔린", transmission: "오토", price: 1150, priceFilled: true, color: "흰색", region: "경기 고양시", body: "세단", origin: "수입", image: false },
  { number: 30, titleMaker: "현대", maker: "현대", model: "그랜저", trim: "2.0", year: 1992, mileage: 155166, fuel: "가솔린", transmission: "오토", price: 520, priceFilled: true, color: "검정", region: "경기 용인시", body: "세단", origin: "국산", image: false },
  { number: 31, titleMaker: "기아", maker: "기아", model: "프라이드", trim: "베타 1.3", year: 1992, mileage: 196361, fuel: "가솔린", transmission: "수동", price: 260, priceFilled: true, color: "빨강", region: "경기 수원시", body: "세단", origin: "국산", image: false },
  { number: 32, titleMaker: "현대", maker: "현대", model: "그랜저", trim: "2.0", year: 1992, mileage: 272720, fuel: "가솔린", transmission: "오토", price: 380, priceFilled: true, color: "회색", region: "경기 성남시", body: "세단", origin: "국산", image: false },
  { number: 34, titleMaker: "현대", maker: "현대", model: "그랜저", trim: "3.0 V6", year: 1991, mileage: 127353, fuel: "가솔린", transmission: "오토", price: 650, priceFilled: true, color: "검정", region: "경기 고양시", body: "세단", origin: "국산", image: false },
  { number: 35, titleMaker: "닛산", maker: "닛산", model: "300ZX", trim: "3.0 쿠페", year: 1991, mileage: 101033, fuel: "가솔린", transmission: "오토", price: 1450, priceFilled: true, color: "기타", region: "경기 용인시", body: "쿠페", origin: "수입", image: false },
  { number: 37, titleMaker: "현대", maker: "현대", model: "포니II", trim: "2도어 픽업", year: 1986, mileage: 46321, fuel: "가솔린", transmission: "수동", price: 2200, priceFilled: true, color: "기타", region: "경기 수원시", body: "픽업", origin: "국산", image: false },
  { number: 39, titleMaker: "벤츠", maker: "벤츠", model: "230E", trim: "", year: 1985, mileage: 129498, fuel: "가솔린", transmission: "오토", price: 480, priceFilled: true, color: "파랑", region: "경기 성남시", body: "세단", origin: "수입", image: false },
  { number: 40, titleMaker: "벤츠", maker: "벤츠", model: "SEC", trim: "560 SEC", year: 1982, mileage: 37954, fuel: "가솔린", transmission: "오토", price: 3600, priceFilled: true, color: "회색", region: "경기 고양시", body: "세단", origin: "수입", image: false },
];
