// 올드카 보배드림 매물 v01 — 2026-10-12 수집분
// 원천: 구글 시트 「올드카_보배드림」 탭 100행 중 수집 상태 ok 55대(판매완료 35 · 기간만료 9 · 계약 1 제외).
// 판매자명 · 연락처 · 차량번호 · 원본 URL · 매물번호는 저장하지 않는다. 사진은 보배드림 공개 사진 640×480을 손대지 않고 그대로 쓴다.
// 주행 단위가 ml인 매물(1 · 11 · 15 · 27 · 39 · 56 · 65)은 마일을 km로 환산해 천 단위로 반올림했다. 가격이 「상담」 「보류」이면 price는 null(가격 상담).
// 판매자(딜러 · 개인) · 딜러 이름은 UI 검증용 가상 값이다.

export type OldCarBobaeRow = {
  number: number;
  titleMaker: string;
  maker: string;
  model: string;
  year: number;
  mileage: number;
  fuel: string;
  /** 만원, null = 가격 상담 */
  price: number | null;
  region: string;
  body: "세단" | "SUV" | "쿠페" | "컨버터블" | "왜건";
  origin: "국산" | "수입";
  /** 수집일(2026-10-12) 기준 등록 후 일수 */
  days: number;
  image: boolean;
};

const oldCarBobaeSheetRows: OldCarBobaeRow[] = [
  {number: 1, titleMaker: "폭스바겐", maker: "폭스바겐", model: "T3 바나곤 캠퍼", year: 1990, mileage: 129000, fuel: "가솔린", price: 10500, region: "서울 종로구", body: "왜건", origin: "수입", days: 4, image: true},
  {number: 2, titleMaker: "BMW", maker: "BMW", model: "Z8 5.0", year: 2000, mileage: 20000, fuel: "가솔린", price: null, region: "서울 서초구", body: "컨버터블", origin: "수입", days: 4, image: true},
  {number: 3, titleMaker: "랜드로버", maker: "랜드로버", model: "레인지로버 3.9 V8", year: 1994, mileage: 110000, fuel: "가솔린", price: null, region: "서울 성동구", body: "SUV", origin: "수입", days: 5, image: true},
  {number: 5, titleMaker: "벤츠", maker: "벤츠", model: "SLK350", year: 2005, mileage: 70000, fuel: "가솔린", price: null, region: "서울 서초구", body: "컨버터블", origin: "수입", days: 10, image: true},
  {number: 6, titleMaker: "마이바흐", maker: "마이바흐", model: "62 5.5 V12", year: 2006, mileage: 230000, fuel: "가솔린", price: 2500, region: "서울 서초구", body: "세단", origin: "수입", days: 11, image: true},
  {number: 7, titleMaker: "페라리", maker: "페라리", model: "360 스파이더", year: 2004, mileage: 40000, fuel: "가솔린", price: null, region: "서울 강서구", body: "컨버터블", origin: "수입", days: 11, image: true},
  {number: 8, titleMaker: "벤츠", maker: "벤츠", model: "S500L", year: 2001, mileage: 90000, fuel: "가솔린", price: 3600, region: "서울 마포구", body: "세단", origin: "수입", days: 11, image: true},
  {number: 9, titleMaker: "닛산", maker: "닛산", model: "스카이라인 GTR", year: 1999, mileage: 60000, fuel: "가솔린", price: null, region: "서울 강서구", body: "쿠페", origin: "수입", days: 17, image: true},
  {number: 10, titleMaker: "쉐보레", maker: "쉐보레", model: "콜벳 컨버터블 C1", year: 1961, mileage: 211, fuel: "가솔린", price: null, region: "서울 서초구", body: "컨버터블", origin: "수입", days: 17, image: true},
  {number: 11, titleMaker: "벤츠", maker: "벤츠", model: "450 SL", year: 1977, mileage: 113000, fuel: "가솔린", price: null, region: "서울 구로구", body: "컨버터블", origin: "수입", days: 17, image: true},
  {number: 12, titleMaker: "크라이슬러", maker: "크라이슬러", model: "프라울러 3.5", year: 2001, mileage: 20000, fuel: "가솔린", price: null, region: "경기 수원시", body: "쿠페", origin: "수입", days: 17, image: true},
  {number: 13, titleMaker: "람보르기니", maker: "람보르기니", model: "무르시엘라고 6.2 V12 쿠페", year: 2006, mileage: 50000, fuel: "가솔린", price: null, region: "서울 서초구", body: "쿠페", origin: "수입", days: 17, image: true},
  {number: 14, titleMaker: "닛산", maker: "닛산", model: "스카이라인 GTR", year: 1996, mileage: 20000, fuel: "가솔린", price: null, region: "인천 남구", body: "쿠페", origin: "수입", days: 19, image: true},
  {number: 15, titleMaker: "크라이슬러", maker: "크라이슬러", model: "프라울러", year: 2002, mileage: 13000, fuel: "가솔린", price: null, region: "부산 강서구", body: "쿠페", origin: "수입", days: 31, image: true},
  {number: 16, titleMaker: "롤스로이스", maker: "롤스로이스", model: "팬텀 6.7 V12", year: 2007, mileage: 140000, fuel: "가솔린", price: 14500, region: "서울 서초구", body: "세단", origin: "수입", days: 31, image: true},
  {number: 17, titleMaker: "재규어", maker: "재규어", model: "XJ6 3.6", year: 1993, mileage: 240000, fuel: "가솔린", price: 1100, region: "서울 서초구", body: "세단", origin: "수입", days: 33, image: true},
  {number: 18, titleMaker: "재규어", maker: "재규어", model: "XJ6 3.2", year: 1995, mileage: 170000, fuel: "가솔린", price: null, region: "서울 서초구", body: "세단", origin: "수입", days: 33, image: true},
  {number: 19, titleMaker: "포르쉐", maker: "포르쉐", model: "911 카레라", year: 1994, mileage: 100000, fuel: "가솔린", price: null, region: "서울 강서구", body: "쿠페", origin: "수입", days: 33, image: true},
  {number: 20, titleMaker: "포르쉐", maker: "포르쉐", model: "911 카레라 S", year: 1997, mileage: 60000, fuel: "가솔린", price: null, region: "서울 서초구", body: "쿠페", origin: "수입", days: 45, image: true},
  {number: 22, titleMaker: "재규어", maker: "재규어", model: "XK R 4.0 SC 쿠페 X100", year: 2002, mileage: 90000, fuel: "가솔린", price: null, region: "서울 서초구", body: "쿠페", origin: "수입", days: 48, image: true},
  {number: 23, titleMaker: "벤츠", maker: "벤츠", model: "300 GE", year: 1991, mileage: 150000, fuel: "가솔린", price: null, region: "서울 성동구", body: "SUV", origin: "수입", days: 49, image: true},
  {number: 24, titleMaker: "BMW", maker: "BMW", model: "635CSi", year: 1988, mileage: 60000, fuel: "가솔린", price: null, region: "서울 서초구", body: "쿠페", origin: "수입", days: 67, image: true},
  {number: 25, titleMaker: "쉐보레", maker: "쉐보레", model: "트랙커 1.6", year: 1994, mileage: 210000, fuel: "가솔린", price: 1500, region: "경기 수원시", body: "SUV", origin: "수입", days: 70, image: true},
  {number: 26, titleMaker: "포르쉐", maker: "포르쉐", model: "911 터보 카브리올레", year: 2004, mileage: 2000, fuel: "가솔린", price: null, region: "서울 서초구", body: "컨버터블", origin: "수입", days: 77, image: true},
  {number: 27, titleMaker: "벤틀리", maker: "벤틀리", model: "아르나지 6.8", year: 2001, mileage: 16000, fuel: "가솔린", price: null, region: "서울 서초구", body: "세단", origin: "수입", days: 82, image: true},
  {number: 29, titleMaker: "벤츠", maker: "벤츠", model: "450 SL", year: 1977, mileage: 70000, fuel: "가솔린", price: 9500, region: "경기 수원시", body: "컨버터블", origin: "수입", days: 90, image: true},
  {number: 31, titleMaker: "쌍용", maker: "KGM", model: "칼리스타 2.0 STD", year: 1993, mileage: 90000, fuel: "가솔린", price: 17000, region: "서울 구로구", body: "세단", origin: "국산", days: 97, image: true},
  {number: 32, titleMaker: "벤츠", maker: "벤츠", model: "S280", year: 1995, mileage: 250000, fuel: "가솔린", price: null, region: "충남 공주시", body: "세단", origin: "수입", days: 98, image: true},
  {number: 33, titleMaker: "벤츠", maker: "벤츠", model: "G230 GE", year: 1995, mileage: 210000, fuel: "가솔린", price: null, region: "서울 서초구", body: "SUV", origin: "수입", days: 105, image: true},
  {number: 35, titleMaker: "BMW", maker: "BMW", model: "알피나 B10", year: 1998, mileage: 190000, fuel: "가솔린", price: null, region: "서울 서초구", body: "세단", origin: "수입", days: 115, image: true},
  {number: 36, titleMaker: "BMW", maker: "BMW", model: "Z3 2.2", year: 2001, mileage: 150000, fuel: "가솔린", price: null, region: "경기 성남시", body: "컨버터블", origin: "수입", days: 115, image: true},
  {number: 37, titleMaker: "벤츠", maker: "벤츠", model: "500 SEL", year: 1983, mileage: 40000, fuel: "가솔린", price: null, region: "경기 성남시", body: "세단", origin: "수입", days: 115, image: true},
  {number: 39, titleMaker: "폭스바겐", maker: "폭스바겐", model: "T3 바나곤 GL 캠퍼", year: 1987, mileage: 80000, fuel: "가솔린", price: null, region: "서울 성북구", body: "왜건", origin: "수입", days: 122, image: true},
  {number: 40, titleMaker: "마세라티", maker: "마세라티", model: "그란투리스모 S 4.7 V8", year: 2009, mileage: 100000, fuel: "가솔린", price: 4000, region: "경기 용인시", body: "쿠페", origin: "수입", days: 122, image: true},
  {number: 41, titleMaker: "폭스바겐", maker: "폭스바겐", model: "비틀 클래식", year: 1970, mileage: 20000, fuel: "가솔린", price: 3999, region: "서울 성동구", body: "세단", origin: "수입", days: 123, image: true},
  {number: 42, titleMaker: "포르쉐", maker: "포르쉐", model: "911 카레라 4S", year: 2004, mileage: 90000, fuel: "가솔린", price: 4350, region: "강원 원주시", body: "쿠페", origin: "수입", days: 126, image: true},
  {number: 43, titleMaker: "벤츠", maker: "벤츠", model: "300 SEL", year: 1990, mileage: 80000, fuel: "가솔린", price: null, region: "서울 서초구", body: "세단", origin: "수입", days: 130, image: true},
  {number: 44, titleMaker: "벤츠", maker: "벤츠", model: "300SEL", year: 1989, mileage: 130000, fuel: "가솔린", price: 3000, region: "경기 성남시", body: "세단", origin: "수입", days: 138, image: true},
  {number: 45, titleMaker: "재규어", maker: "재규어", model: "XJ6 4.2 시리즈 3", year: 1986, mileage: 120000, fuel: "가솔린", price: 5700, region: "경기 김포시", body: "세단", origin: "수입", days: 143, image: true},
  {number: 46, titleMaker: "포르쉐", maker: "포르쉐", model: "911 타르가 4", year: 2007, mileage: 50000, fuel: "가솔린", price: null, region: "서울 서초구", body: "컨버터블", origin: "수입", days: 150, image: true},
  {number: 47, titleMaker: "현대", maker: "현대", model: "다이너스티 3.0", year: 1996, mileage: 20000, fuel: "가솔린", price: 1890, region: "서울 송파구", body: "세단", origin: "국산", days: 171, image: true},
  {number: 48, titleMaker: "쉐보레", maker: "쉐보레", model: "콜벳 컨버터블 C3", year: 1979, mileage: 130000, fuel: "가솔린", price: null, region: "서울 서초구", body: "컨버터블", origin: "수입", days: 192, image: true},
  {number: 49, titleMaker: "모건", maker: "모건", model: "플러스 8 3.5 V8", year: 1987, mileage: 40000, fuel: "가솔린", price: 20000, region: "강원 양구군", body: "세단", origin: "수입", days: 192, image: true},
  {number: 53, titleMaker: "미쯔오카", maker: "미쓰오카", model: "라세드 5.0 도라", year: 1992, mileage: 20000, fuel: "가솔린", price: null, region: "강원 양구군", body: "세단", origin: "수입", days: 237, image: true},
  {number: 54, titleMaker: "포르쉐", maker: "포르쉐", model: "911 터보", year: 1976, mileage: 130000, fuel: "가솔린", price: null, region: "서울 서초구", body: "쿠페", origin: "수입", days: 237, image: true},
  {number: 55, titleMaker: "로버", maker: "로버", model: "미니 1.3", year: 1995, mileage: 60000, fuel: "가솔린", price: null, region: "서울 서초구", body: "세단", origin: "수입", days: 241, image: true},
  {number: 56, titleMaker: "재규어", maker: "재규어", model: "E타입 4.2 컨버터블", year: 1970, mileage: 145000, fuel: "가솔린", price: null, region: "서울 서초구", body: "컨버터블", origin: "수입", days: 283, image: true},
  {number: 57, titleMaker: "현대", maker: "현대", model: "쏘나타2 1.8 GL", year: 1994, mileage: 170000, fuel: "가솔린", price: 800, region: "경기 안산시", body: "세단", origin: "국산", days: 283, image: true},
  {number: 58, titleMaker: "벤츠", maker: "벤츠", model: "190 E 2.6", year: 2007, mileage: 110000, fuel: "가솔린", price: 2890, region: "서울 서초구", body: "세단", origin: "수입", days: 283, image: true},
  {number: 60, titleMaker: "GM대우", maker: "쉐보레", model: "프린스 1.8 MPFi", year: 1995, mileage: 60000, fuel: "가솔린", price: 450, region: "경기 안산시", body: "세단", origin: "국산", days: 290, image: true},
  {number: 61, titleMaker: "벤츠", maker: "벤츠", model: "바론 레플리카", year: 1953, mileage: 10000, fuel: "가솔린", price: null, region: "서울 서초구", body: "컨버터블", origin: "수입", days: 292, image: true},
  {number: 63, titleMaker: "토요타", maker: "토요타", model: "랜드크루저 4.2", year: 1991, mileage: 370000, fuel: "디젤", price: null, region: "서울 강서구", body: "SUV", origin: "수입", days: 311, image: true},
  {number: 64, titleMaker: "재규어", maker: "재규어", model: "E타입 4.2", year: 1969, mileage: 100000, fuel: "가솔린", price: null, region: "서울 서초구", body: "세단", origin: "수입", days: 313, image: true},
  {number: 65, titleMaker: "벤츠", maker: "벤츠", model: "SL560", year: 1986, mileage: 177000, fuel: "가솔린", price: null, region: "경기 수원시", body: "컨버터블", origin: "수입", days: 314, image: true},
  {number: 72, titleMaker: "폭스바겐", maker: "폭스바겐", model: "비틀 클래식", year: 1996, mileage: 20000, fuel: "가솔린", price: null, region: "경기 수원시", body: "세단", origin: "수입", days: 360, image: true},
];

// 올드카 기준(2026-10-12 「올드카에 2000년대 모델 들어가있다」): 1999년식 이하만 목록에 쓴다(2000년식 이상 17대 제외, 위 시트 값은 보존).
export const oldCarBobaeRows: OldCarBobaeRow[] = oldCarBobaeSheetRows.filter((row) => row.year < 2000);
