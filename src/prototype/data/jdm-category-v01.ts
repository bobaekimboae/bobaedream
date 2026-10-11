// JDM 카테고리 v01(2026-10-11 「테마별 중고차에 JDM 추가」): 구글 시트 「JDM」 탭 21대(코리아카마켓·전국연합 공개 매물, 수집일 2026-10-11).
// 판매자명·연락처·차량번호·원본 URL·매물번호는 저장하지 않는다. 사진은 시트 주소에서 받은 원본 그대로이고(가공 없음) 받지 못한 3대는 빈 사진 칸이다.
// 가격이 「가격문의」·「상담」인 7대는 `가격 상담`으로 둔다. 시트 지역이 시도뿐이라 구·군은 대표 구·군으로 채웠고, 판매자(딜러) · 등록시각은 UI 검증용 가상 값이다.
export type JdmRow = {
  number: number;
  maker: string;
  group: string;
  model: string;
  trim: string;
  year: number;
  mileage: number;
  fuel: string;
  transmission: "오토" | "수동";
  price: number | null;
  region: string;
  body: string;
  color: string;
  image: boolean;
};

export const jdmListingRows: JdmRow[] = [
  { number: 1, maker: "토요타", group: "GR 수프라", model: "GR 수프라 3.0", trim: "3.0", year: 2024, mileage: 36530, fuel: "가솔린", transmission: "오토", price: null, region: "경기 수원시", body: "쿠페", color: "검정", image: true },
  { number: 2, maker: "토요타", group: "GR86", model: "GR86 2.4 프리미엄", trim: "2.4 프리미엄", year: 2022, mileage: 18336, fuel: "가솔린", transmission: "수동", price: null, region: "경기 수원시", body: "쿠페", color: "흰", image: true },
  { number: 3, maker: "토요타", group: "86", model: "86 2.0", trim: "2.0", year: 2016, mileage: 140530, fuel: "가솔린", transmission: "수동", price: null, region: "경기 수원시", body: "쿠페", color: "기타", image: true },
  { number: 4, maker: "토요타", group: "86", model: "86 2.0 서킷세팅", trim: "2.0 서킷세팅", year: 2013, mileage: 98000, fuel: "가솔린", transmission: "수동", price: 1700, region: "경기 수원시", body: "쿠페", color: "기타", image: true },
  { number: 5, maker: "토요타", group: "에스티마", model: "에스티마", trim: "", year: 2006, mileage: 152000, fuel: "가솔린", transmission: "오토", price: 1450, region: "서울 성동구", body: "MPV", color: "은", image: true },
  { number: 6, maker: "토요타", group: "bB", model: "bB(2세대)", trim: "", year: 2006, mileage: 179973, fuel: "가솔린", transmission: "오토", price: null, region: "경기 수원시", body: "해치백", color: "기타", image: true },
  { number: 7, maker: "토요타", group: "MR-S", model: "MR-S", trim: "", year: 2001, mileage: 252005, fuel: "가솔린", transmission: "오토", price: null, region: "경기 수원시", body: "컨버터블", color: "청", image: true },
  { number: 8, maker: "닛산", group: "큐브", model: "큐브(3세대) 1.8 SL", trim: "1.8 SL", year: 2014, mileage: 59000, fuel: "가솔린", transmission: "오토", price: 970, region: "경기 수원시", body: "해치백", color: "기타", image: false },
  { number: 9, maker: "닛산", group: "큐브", model: "큐브(3세대) 1.8 S", trim: "1.8 S", year: 2012, mileage: 67456, fuel: "가솔린", transmission: "오토", price: 690, region: "경기 수원시", body: "해치백", color: "자주", image: true },
  { number: 10, maker: "닛산", group: "큐브", model: "큐브(3세대) 1.8 S", trim: "1.8 S", year: 2012, mileage: 125452, fuel: "가솔린", transmission: "오토", price: 590, region: "인천 남동구", body: "해치백", color: "갈", image: true },
  { number: 11, maker: "닛산", group: "큐브", model: "큐브(3세대) 1.8", trim: "1.8", year: 2012, mileage: 139000, fuel: "가솔린", transmission: "오토", price: null, region: "경기 수원시", body: "해치백", color: "기타", image: false },
  { number: 12, maker: "닛산", group: "큐브", model: "큐브(3세대) 1.8 S", trim: "1.8 S", year: 2011, mileage: 122694, fuel: "가솔린", transmission: "오토", price: 590, region: "경기 수원시", body: "해치백", color: "은", image: true },
  { number: 13, maker: "닛산", group: "큐브", model: "큐브(3세대) 1.8 SL", trim: "1.8 SL", year: 2011, mileage: 127315, fuel: "가솔린", transmission: "오토", price: 740, region: "인천 남동구", body: "해치백", color: "갈", image: true },
  { number: 14, maker: "닛산", group: "큐브", model: "큐브(2세대) 1.5", trim: "1.5", year: 2008, mileage: 192000, fuel: "가솔린", transmission: "오토", price: 380, region: "경기 수원시", body: "해치백", color: "기타", image: true },
  { number: 15, maker: "닛산", group: "350Z", model: "350Z 3.5 컨버터블", trim: "3.5 컨버터블", year: 2007, mileage: 107098, fuel: "가솔린", transmission: "오토", price: 2300, region: "울산 남구", body: "컨버터블", color: "미", image: false },
  { number: 16, maker: "닛산", group: "350Z", model: "350Z 3.5 컨버터블", trim: "3.5 컨버터블", year: 2004, mileage: 98000, fuel: "가솔린", transmission: "오토", price: 1650, region: "경기 수원시", body: "컨버터블", color: "기타", image: true },
  { number: 17, maker: "스즈키", group: "허슬러", model: "허슬러 660", trim: "660", year: 2016, mileage: 84315, fuel: "가솔린", transmission: "오토", price: 1850, region: "경기 수원시", body: "해치백", color: "빨강", image: true },
  { number: 18, maker: "스즈키", group: "허슬러", model: "허슬러 660", trim: "660", year: 2016, mileage: 80438, fuel: "가솔린", transmission: "오토", price: 1790, region: "인천 남동구", body: "해치백", color: "기타", image: true },
  { number: 19, maker: "스즈키", group: "허슬러", model: "허슬러 660", trim: "660", year: 2015, mileage: 91797, fuel: "가솔린", transmission: "오토", price: 1490, region: "경기 수원시", body: "해치백", color: "카키", image: true },
  { number: 20, maker: "스즈키", group: "알토라팡", model: "알토라팡 660 터보", trim: "660 터보", year: 2015, mileage: 73283, fuel: "가솔린", transmission: "오토", price: 1650, region: "경기 수원시", body: "해치백", color: "흰", image: true },
  { number: 21, maker: "혼다", group: "N BOX", model: "N BOX 터보", trim: "터보", year: 2016, mileage: 94000, fuel: "가솔린", transmission: "오토", price: 2000, region: "경기 수원시", body: "해치백", color: "기타", image: true },
];
