// 페라리 시트 매물 v02(2026-10-12 「페라리 추가해라」): 구글 시트 「페라리 모델별 매물 수집_차란차_코리아카_전국연합_2026-10-12」 중복 제거본 9대 중 8대.
// 차란차 4 + 전국연합(carku) 5(코리아카마켓은 접속 오류로 0). GTC4 루쏘 T(18,990만원)는 사용자 지시 매물 3004와 같아 뺐다.
// 연락처·차량번호·VIN·개인 딜러명·원본 URL·매물 ID는 저장하지 않는다. 사진은 시트에 없어 `photo`가 있는 행만 노출한다. 차란차 3대(488 스파이더 · 푸로산게 · 로마 3.9)는 같은 매물의 대표 사진 1장(`og:image` 1280×720 원본, 가공 없음)을 `public/assets/cars/ferrari-sheet-v02/`에 두었다. 전국연합(carku) 5대는 이 환경에서 접속이 거부되어(연결 재설정) 사진을 받지 못해 계속 뺀다. 판매자 이름은 가상 값이고 매매단지는 시트의 실제 단지다.
export type FerrariSheetRow = {
  number: number;
  model: string;
  group: string;
  year: number;
  firstReg: string;
  fuel: string;
  mileage: number;
  price: number | null;
  region: string;
  complex: string;
  body: string;
  // 사진 파일 경로(`cars/ferrari-sheet-v02/...`). 없으면 목록에서 뺀다(2026-10-12 「사진 없는건 빼」).
  photo?: string;
};

export const ferrariSheetRows: FerrariSheetRow[] = [
  { number: 1, photo: "cars/ferrari-sheet-v02/fr-001.webp", model: "488 스파이더 3.9", group: "488", year: 2019, firstReg: "2019-01", fuel: "가솔린", mileage: 60022, price: 21900, region: "경기 수원시", complex: "도이치오토월드", body: "컨버터블" },
  { number: 2, photo: "cars/ferrari-sheet-v02/fr-002.webp", model: "푸로산게 6.5 V12", group: "푸로산게", year: 2024, firstReg: "2024-11", fuel: "가솔린", mileage: 3685, price: 67000, region: "경기 수원시", complex: "도이치오토월드", body: "SUV" },
  { number: 3, photo: "cars/ferrari-sheet-v02/fr-003.webp", model: "로마 3.9", group: "로마", year: 2022, firstReg: "2023-08", fuel: "가솔린", mileage: 39496, price: 19900, region: "경기 수원시", complex: "도이치오토월드", body: "쿠페" },
  { number: 4, model: "296 GTB 3.0 V6 PHEV", group: "296", year: 2023, firstReg: "2023-12", fuel: "하이브리드", mileage: 4000, price: 31000, region: "서울 서초구", complex: "서울오토갤러리", body: "쿠페" },
  { number: 5, model: "812 슈퍼패스트 6.5 V12", group: "812", year: 2019, firstReg: "2018-10", fuel: "가솔린", mileage: 27473, price: 33000, region: "서울 서초구", complex: "서울오토갤러리", body: "쿠페" },
  { number: 6, model: "포르토피노 3.9 V8 컨버터블 GT M", group: "포르토피노", year: 2022, firstReg: "2022-11", fuel: "가솔린", mileage: 13700, price: null, region: "서울 서초구", complex: "서울오토갤러리", body: "컨버터블" },
  { number: 7, model: "296 GTS 3.0 V6 PHEV", group: "296", year: 2025, firstReg: "2025-03", fuel: "하이브리드", mileage: 2860, price: null, region: "서울 서초구", complex: "서울오토갤러리", body: "컨버터블" },
  { number: 8, model: "로마 3.9 V8 스파이더", group: "로마", year: 2025, firstReg: "2025-04", fuel: "가솔린", mileage: 2800, price: null, region: "서울 서초구", complex: "서울오토갤러리", body: "컨버터블" },
];
