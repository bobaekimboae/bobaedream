// JDM 카테고리 v01(2026-10-11 「테마별 중고차에 JDM 추가」): 구글 시트 「JDM」 탭 21대 중 위키백과 JDM 기준(일본 내수 시장 전용 모델)에 맞는 9대(코리아카마켓·전국연합 공개 매물, 수집일 2026-10-11).
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
  { number: 5, maker: "토요타", group: "에스티마", model: "에스티마", trim: "", year: 2006, mileage: 152000, fuel: "가솔린", transmission: "오토", price: 1450, region: "서울 성동구", body: "MPV", color: "은", image: true },
  { number: 6, maker: "토요타", group: "bB", model: "bB(2세대)", trim: "", year: 2006, mileage: 179973, fuel: "가솔린", transmission: "오토", price: null, region: "경기 수원시", body: "해치백", color: "기타", image: true },
  { number: 7, maker: "토요타", group: "MR-S", model: "MR-S", trim: "", year: 2001, mileage: 252005, fuel: "가솔린", transmission: "오토", price: null, region: "경기 수원시", body: "컨버터블", color: "청", image: true },
  { number: 14, maker: "닛산", group: "큐브", model: "큐브(2세대) 1.5", trim: "1.5", year: 2008, mileage: 192000, fuel: "가솔린", transmission: "오토", price: 380, region: "경기 수원시", body: "해치백", color: "기타", image: true },
  { number: 17, maker: "스즈키", group: "허슬러", model: "허슬러 660", trim: "660", year: 2016, mileage: 84315, fuel: "가솔린", transmission: "오토", price: 1850, region: "경기 수원시", body: "해치백", color: "빨강", image: true },
  { number: 18, maker: "스즈키", group: "허슬러", model: "허슬러 660", trim: "660", year: 2016, mileage: 80438, fuel: "가솔린", transmission: "오토", price: 1790, region: "인천 남동구", body: "해치백", color: "기타", image: true },
  { number: 19, maker: "스즈키", group: "허슬러", model: "허슬러 660", trim: "660", year: 2015, mileage: 91797, fuel: "가솔린", transmission: "오토", price: 1490, region: "경기 수원시", body: "해치백", color: "카키", image: true },
  { number: 20, maker: "스즈키", group: "알토라팡", model: "알토라팡 660 터보", trim: "660 터보", year: 2015, mileage: 73283, fuel: "가솔린", transmission: "오토", price: 1650, region: "경기 수원시", body: "해치백", color: "흰", image: true },
  { number: 21, maker: "혼다", group: "N BOX", model: "N BOX 터보", trim: "터보", year: 2016, mileage: 94000, fuel: "가솔린", transmission: "오토", price: 2000, region: "경기 수원시", body: "해치백", color: "기타", image: true },
];
