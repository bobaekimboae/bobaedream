export type VirtualCategoryCode = "캠핑카" | "자재운반장비" | "부품 · 용품";

export type VirtualCategoryListingRow = {
  id: string;
  category: VirtualCategoryCode;
  maker: string;
  model: string;
  subtype: string;
  categoryDetail?: "모터홈" | "캐러밴";
  year: number;
  mileage: number;
  fuel: string;
  transmission: string;
  price10k: number;
  region: string;
  sellerType: "개인" | "딜러";
  sellerName: string;
  sellerAddress: string;
  image: string;
  isVirtual: true;
  scenarioVersion: "v01";
};

type BrandSeed = { maker: string; models: readonly [string, string, string]; subtypes: readonly [string, string, string] };

const regions = ["서울 강서구", "경기 수원시", "인천 남동구", "경기 화성시", "대전 유성구", "대구 달서구", "부산 강서구", "광주 광산구", "충남 천안시", "경남 김해시"];
const virtualPeople = ["김도윤", "이서준", "박하린", "최지호", "정민서", "윤재현", "한서아", "오민준", "강지우", "임도현"];

function buildScenario(category: VirtualCategoryCode, prefix: string, seeds: readonly BrandSeed[], images: readonly string[], basePrice: number) {
  return seeds.flatMap((seed, brandIndex) => seed.models.map((model, modelIndex) => {
    const index = brandIndex * 3 + modelIndex;
    const region = regions[index % regions.length];
    const sellerType = index % 4 === 0 ? "개인" as const : "딜러" as const;
    const categoryDetail: VirtualCategoryListingRow["categoryDetail"] = category === "캠핑카" ? (seed.subtypes[modelIndex] === "캐러밴" ? "캐러밴" : "모터홈") : undefined;
    return {
      id: `${prefix}-${String(index + 1).padStart(3, "0")}`,
      category,
      maker: seed.maker,
      model,
      subtype: seed.subtypes[modelIndex],
      categoryDetail,
      year: 2018 + index % 9,
      mileage: category === "부품 · 용품" ? 0 : 4_800 + index * 2_750,
      // 전동 지게차·팔레트트럭은 전기
      fuel: category === "자재운반장비" ? (/전동/.test(seed.subtypes[modelIndex]) ? "전기" : ["디젤", "전기", "LPG"][index % 3]) : category === "캠핑카" ? ["디젤", "가솔린", "전기"][index % 3] : "해당 없음",
      transmission: category === "부품 · 용품" ? "해당 없음" : "오토",
      price10k: basePrice + brandIndex * 630 + modelIndex * 280,
      region,
      sellerType,
      sellerName: sellerType === "개인" ? `${virtualPeople[index % virtualPeople.length]} 개인판매자 (가상)` : `${seed.maker} ${category.replace(" · ", "/")}센터 (가상)`,
      sellerAddress: `${region} · 가상 매물 전시장`,
      image: images[index % images.length],
      isVirtual: true as const,
      scenarioVersion: "v01" as const,
    };
  }));
}

const campingSeeds: readonly BrandSeed[] = [
  { maker: "현대", models: ["쏠라티 캠퍼", "포레스트", "스타리아 라운지 캠퍼"], subtypes: ["클래스 B", "클래스 C", "캠퍼밴"] },
  { maker: "기아", models: ["봉고3 캠퍼", "레이 캠퍼", "카니발 팝업 캠퍼"], subtypes: ["클래스 C", "미니 캠퍼", "팝업 캠퍼"] },
  { maker: "르노코리아", models: ["마스터 캠퍼", "마스터 L 캠퍼", "마스터 팝업"], subtypes: ["클래스 B", "클래스 B", "팝업 캠퍼"] },
  { maker: "제일모빌", models: ["에이스 650", "드림 560", "아쿠아 790"], subtypes: ["클래스 C", "클래스 C", "클래스 A"] },
  { maker: "코치맨", models: ["루소", "아카디아", "레이저"], subtypes: ["캐러밴", "캐러밴", "캐러밴"] },
  { maker: "벤츠", models: ["스프린터 519", "스프린터 417", "스프린터 투어러"], subtypes: ["클래스 B", "클래스 B", "모터홈"] },
  { maker: "포드", models: ["트랜짓 캠퍼", "트랜짓 커스텀", "E-트랜짓 캠퍼"], subtypes: ["클래스 B", "캠퍼밴", "전기 캠퍼"] },
  { maker: "피아트", models: ["두카토 540", "두카토 600", "두카토 700"], subtypes: ["클래스 B", "클래스 C", "클래스 A"] },
  { maker: "아드리아", models: ["아비바", "아도라", "알테아"], subtypes: ["캐러밴", "캐러밴", "캐러밴"] },
  { maker: "하이머", models: ["B-클래스", "ML-T", "엑시스"], subtypes: ["클래스 A", "클래스 C", "클래스 A"] },
];

const materialSeeds: readonly BrandSeed[] = [
  // 첫 모델은 사용자 제공 사진(25B-9F 전동 지게차)에 맞춤(2026-10-07)
  { maker: "현대머티리얼핸들링", models: ["25B-9F", "30D-9", "50D-9"], subtypes: ["전동 지게차", "디젤 지게차", "대형 지게차"] },
  { maker: "두산밥캣", models: ["D25S", "B25X-7", "D30S"], subtypes: ["디젤 지게차", "전동 지게차", "디젤 지게차"] },
  { maker: "토요타L&F", models: ["8FD25", "8FB25", "8FBR15"], subtypes: ["디젤 지게차", "전동 지게차", "리치 지게차"] },
  { maker: "미쓰비시로지스넥스트", models: ["FD25N", "FB25N", "RB14N"], subtypes: ["디젤 지게차", "전동 지게차", "리치 지게차"] },
  { maker: "코마츠", models: ["FD25T", "FB25", "FG30"], subtypes: ["디젤 지게차", "전동 지게차", "LPG 지게차"] },
  { maker: "클라크", models: ["C25D", "GTS25", "S30"], subtypes: ["디젤 지게차", "LPG 지게차", "디젤 지게차"] },
  { maker: "헬리", models: ["CPCD25", "CPD25", "CQD16"], subtypes: ["디젤 지게차", "전동 지게차", "리치 지게차"] },
  { maker: "항차", models: ["CPCD30", "CPD30", "CQD20"], subtypes: ["디젤 지게차", "전동 지게차", "리치 지게차"] },
  { maker: "융하인리히", models: ["EFG 216", "ETV 216", "ERE 225"], subtypes: ["전동 지게차", "리치 지게차", "전동 팔레트트럭"] },
  { maker: "린데", models: ["H25D", "E25", "R16"], subtypes: ["디젤 지게차", "전동 지게차", "리치 지게차"] },
];

const partsSeeds: readonly BrandSeed[] = [
  { maker: "한국타이어", models: ["벤투스 S2 AS", "다이나프로 HPX", "아이온 에보"], subtypes: ["승용 타이어", "SUV 타이어", "전기차 타이어"] },
  { maker: "금호타이어", models: ["마제스티9", "크루젠 HP71", "엑스타 PS71"], subtypes: ["승용 타이어", "SUV 타이어", "퍼포먼스 타이어"] },
  { maker: "넥센타이어", models: ["엔페라 AU7", "로디안 GTX", "엔페라 슈프림"], subtypes: ["승용 타이어", "SUV 타이어", "사계절 타이어"] },
  { maker: "미쉐린", models: ["프라이머시 4", "파일럿 스포츠 5", "크로스클라이밋 2"], subtypes: ["승용 타이어", "퍼포먼스 타이어", "사계절 타이어"] },
  { maker: "브리지스톤", models: ["투란자 T005", "포텐자 스포츠", "듀얼러 H/L"], subtypes: ["승용 타이어", "퍼포먼스 타이어", "SUV 타이어"] },
  { maker: "BBS", models: ["CH-R II", "LM", "RI-A"], subtypes: ["알로이 휠", "단조 휠", "경량 휠"] },
  { maker: "OZ레이싱", models: ["울트라레제라", "수퍼투리스모", "랠리 레이싱"], subtypes: ["경량 휠", "알로이 휠", "랠리 휠"] },
  { maker: "브렘보", models: ["GT 브레이크 키트", "Xtra 디스크", "세라믹 패드"], subtypes: ["브레이크 키트", "브레이크 디스크", "브레이크 패드"] },
  { maker: "보쉬", models: ["AGM 배터리", "에어로트윈", "점화 플러그"], subtypes: ["배터리", "와이퍼", "점화 부품"] },
  { maker: "현대모비스", models: ["순정 LED 램프", "순정 블랙박스", "순정 루프랙"], subtypes: ["램프", "전자 용품", "외장 용품"] },
];

export const campingScenarioV01 = buildScenario("캠핑카", "camping", campingSeeds, [
  "category-photo/vehicle_type_motorhome_v01.png",
  "truck/listings/truck_camper_v01.png",
  "truck/formats/v01/truck_subtype_motorhome_v01.png",
], 3_900).map((row) => row.id === "camping-001"
  // 2026-10-08 사용자 지시 「캠핑카 교체」: 첫 캠핑카(현대 쏠라티 캠퍼) 자리를 하비 프리미엄 495UL(18년형 · 4인용 유럽식 견인형 카라반, 사용자 사진)로. 가격·지역·판매자는 자리 값 유지
  ? { ...row, maker: "하비", model: "프리미엄 495UL", subtype: "캐러밴", categoryDetail: "캐러밴" as const, year: 2018 }
  : row);

export const materialHandlingScenarioV01 = buildScenario("자재운반장비", "material", materialSeeds, [
  "bbm/generated/quickfilter-v01/heavy_forklift_v02.png",
  "truck/formats/v01/truck_subtype_forklift_v01.png",
], 1_450);

export const partsScenarioV01 = buildScenario("부품 · 용품", "parts", partsSeeds, [
  "category-photo/vehicle_type_parts_v01.png",
  "categories/parts.svg",
], 18);

export const virtualCategoryBrands: Record<VirtualCategoryCode, string[]> = {
  캠핑카: campingSeeds.map((seed) => seed.maker),
  자재운반장비: materialSeeds.map((seed) => seed.maker),
  "부품 · 용품": partsSeeds.map((seed) => seed.maker),
};

// 부품·용품 카드 값(UI 검증용 가상 값, 2026-10-07): 규격 · 수량 · 적용 차종 · 상태와 부품 가격대(만원)
export const partsCardDetailsV01: Record<string, { spec: string; quantity: string; fit: string; condition: string; price10k: number }> = {
  "벤투스 S2 AS": { spec: "245/45R18", quantity: "4개", fit: "그랜저 GN7", condition: "중고 80%", price10k: 32 },
  "다이나프로 HPX": { spec: "235/60R18", quantity: "4개", fit: "쏘렌토 MQ4", condition: "중고 70%", price10k: 28 },
  "아이온 에보": { spec: "255/45R20", quantity: "4개", fit: "아이오닉 5", condition: "새 상품", price10k: 96 },
  "마제스티9": { spec: "225/45R18", quantity: "4개", fit: "쏘나타 DN8", condition: "중고 85%", price10k: 30 },
  "크루젠 HP71": { spec: "235/55R19", quantity: "4개", fit: "싼타페 MX5", condition: "중고 75%", price10k: 34 },
  "엑스타 PS71": { spec: "245/40R19", quantity: "2개", fit: "스팅어", condition: "중고 60%", price10k: 14 },
  "엔페라 AU7": { spec: "215/55R17", quantity: "4개", fit: "아반떼 CN7", condition: "새 상품", price10k: 42 },
  "로디안 GTX": { spec: "265/60R18", quantity: "4개", fit: "렉스턴 스포츠", condition: "중고 70%", price10k: 30 },
  "엔페라 슈프림": { spec: "245/45R19", quantity: "4개", fit: "K8", condition: "중고 80%", price10k: 38 },
  "프라이머시 4": { spec: "225/50R17", quantity: "4개", fit: "BMW 3시리즈", condition: "중고 85%", price10k: 48 },
  "파일럿 스포츠 5": { spec: "255/35R19", quantity: "2개", fit: "벤츠 C클래스", condition: "새 상품", price10k: 64 },
  "크로스클라이밋 2": { spec: "235/55R18", quantity: "4개", fit: "투싼 NX4", condition: "중고 70%", price10k: 52 },
  "투란자 T005": { spec: "225/45R17", quantity: "4개", fit: "K5 DL3", condition: "중고 80%", price10k: 36 },
  "포텐자 스포츠": { spec: "245/40R20", quantity: "4개", fit: "제네시스 G80", condition: "새 상품", price10k: 118 },
  "듀얼러 H/L": { spec: "265/50R20", quantity: "4개", fit: "팰리세이드", condition: "중고 75%", price10k: 44 },
  "CH-R II": { spec: "19인치 8.5J", quantity: "4개", fit: "BMW 5시리즈", condition: "중고", price10k: 280 },
  "LM": { spec: "19인치 8.5J", quantity: "4개", fit: "벤츠 E클래스", condition: "중고", price10k: 420 },
  "RI-A": { spec: "18인치 8J", quantity: "4개", fit: "범용 5x112", condition: "중고", price10k: 310 },
  "울트라레제라": { spec: "18인치 8J", quantity: "4개", fit: "범용 5x114.3", condition: "중고", price10k: 160 },
  "수퍼투리스모": { spec: "19인치 8J", quantity: "4개", fit: "범용 5x112", condition: "새 상품", price10k: 220 },
  "랠리 레이싱": { spec: "17인치 7.5J", quantity: "4개", fit: "범용 5x100", condition: "중고", price10k: 140 },
  "GT 브레이크 키트": { spec: "6피스톤 380mm", quantity: "1세트", fit: "제네시스 G80", condition: "중고", price10k: 380 },
  "Xtra 디스크": { spec: "345mm", quantity: "2개", fit: "BMW 5시리즈", condition: "새 상품", price10k: 36 },
  "세라믹 패드": { spec: "앞 패드", quantity: "1세트", fit: "벤츠 E클래스", condition: "새 상품", price10k: 12 },
  "AGM 배터리": { spec: "70Ah", quantity: "1개", fit: "범용", condition: "새 상품", price10k: 24 },
  "에어로트윈": { spec: "650/400mm", quantity: "1세트", fit: "범용", condition: "새 상품", price10k: 3 },
  "점화 플러그": { spec: "이리듐", quantity: "4개", fit: "아반떼 CN7", condition: "새 상품", price10k: 5 },
  "순정 LED 램프": { spec: "헤드램프 좌", quantity: "1개", fit: "그랜저 GN7", condition: "중고", price10k: 65 },
  "순정 블랙박스": { spec: "전후방 2채널", quantity: "1개", fit: "범용", condition: "중고", price10k: 15 },
  "순정 루프랙": { spec: "크로스바", quantity: "1세트", fit: "팰리세이드 LX2", condition: "미사용", price10k: 18 },
};

// 캠핑카 취침 인원(침대 수, UI 검증용 가상 값, 2026-10-07)
export const campingBerthsV01: Record<string, number> = {
  "프리미엄 495UL": 4,
  "쏠라티 캠퍼": 4,
  "포레스트": 4,
  "스타리아 라운지 캠퍼": 4,
  "봉고3 캠퍼": 2,
  "레이 캠퍼": 2,
  "카니발 팝업 캠퍼": 4,
  "마스터 캠퍼": 4,
  "마스터 L 캠퍼": 4,
  "마스터 팝업": 4,
  "에이스 650": 5,
  "드림 560": 4,
  "아쿠아 790": 6,
  "루소": 4,
  "아카디아": 5,
  "레이저": 4,
  "스프린터 519": 4,
  "스프린터 417": 3,
  "스프린터 투어러": 4,
  "트랜짓 캠퍼": 4,
  "트랜짓 커스텀": 2,
  "E-트랜짓 캠퍼": 3,
  "두카토 540": 2,
  "두카토 600": 4,
  "두카토 700": 5,
  "아비바": 4,
  "아도라": 5,
  "알테아": 6,
  "B-클래스": 4,
  "ML-T": 3,
  "엑시스": 5,
};

// 캠핑카 승차 정원(모터홈만, UI 검증용 가상 값, 2026-10-08 「승차 6인 · 취침 3인」). 엔진 없는 캐러밴은 승차 정원이 없다
export const campingSeatsV01: Record<string, number> = {
  "포레스트": 6,
  "스타리아 라운지 캠퍼": 5,
  "봉고3 캠퍼": 3,
  "레이 캠퍼": 2,
  "카니발 팝업 캠퍼": 7,
  "마스터 캠퍼": 5,
  "마스터 L 캠퍼": 6,
  "마스터 팝업": 5,
  "에이스 650": 6,
  "드림 560": 5,
  "아쿠아 790": 6,
  "스프린터 519": 6,
  "스프린터 417": 4,
  "스프린터 투어러": 6,
  "트랜짓 캠퍼": 5,
  "트랜짓 커스텀": 4,
  "E-트랜짓 캠퍼": 4,
  "두카토 540": 3,
  "두카토 600": 4,
  "두카토 700": 5,
  "B-클래스": 4,
  "ML-T": 4,
  "엑시스": 5,
};

// 실사 썸네일(모델명 → 사진). 없으면 유형 대표 이미지
// 사용자 지시 매물의 카드 스펙 줄(지시값 그대로, 샘플 배지 없음)
export const virtualCardSpecV01: Record<string, string[]> = {
  "camping-001": ["18년형", "견인형", "취침 4인"],
};

export const virtualListingPhotosV01: Record<string, string> = {
  "25B-9F": "listing-photos/v01/hyundai_forklift_25b9f.jpg",
  포레스트: "listing-photos/v01/hyundai_forest_camper.jpg",
  "프리미엄 495UL": "listing-photos/v01/hobby_premium_495ul_2018.jpg",
};
