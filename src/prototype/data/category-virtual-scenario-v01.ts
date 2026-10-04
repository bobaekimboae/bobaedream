export type VirtualCategoryCode = "캠핑카" | "자재운반장비" | "부품·용품";

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
  condition?: string;
  compatibleModels?: string;
  quantity?: number;
};

type BrandSeed = { maker: string; models: readonly [string, string, string]; subtypes: readonly [string, string, string] };

const actualPlaces = [
  ["서울 강서구", "강서오토플렉스"],
  ["경기 수원시 권선구", "도이치오토월드"],
  ["인천 남동구", "간석"],
  ["경기 용인시 기흥구", "오토허브"],
  ["대전 유성구", "디오토몰"],
  ["대구 달서구", "남부단지"],
  ["부산 강서구", "오토필드"],
  ["광주 광산구", "하남단지"],
  ["충남 천안시 동남구", "천안매매단지"],
  ["경남 김해시", "김해모터스밸리"],
] as const;
const virtualPeople = ["김도윤", "이서준", "박하린", "최지호", "정민서", "윤재현", "한서아", "오민준", "강지우", "임도현"];

function buildScenario(category: VirtualCategoryCode, prefix: string, seeds: readonly BrandSeed[], images: readonly string[], basePrice: number) {
  return seeds.flatMap((seed, brandIndex) => seed.models.map((model, modelIndex) => {
    const index = brandIndex * 3 + modelIndex;
    const [region, complex] = actualPlaces[index % actualPlaces.length];
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
      mileage: category === "부품·용품" ? 0 : 4_800 + index * 2_750,
      fuel: category === "자재운반장비" ? ["디젤", "전기", "LPG"][index % 3] : category === "캠핑카" ? ["디젤", "가솔린", "전기"][index % 3] : "",
      transmission: category === "부품·용품" ? "" : "오토",
      price10k: category === "부품·용품" ? basePrice + brandIndex * 12 + modelIndex * 5 : basePrice + brandIndex * 630 + modelIndex * 280,
      region,
      sellerType,
      sellerName: sellerType === "개인" ? `${virtualPeople[index % virtualPeople.length]} 개인판매자` : `${seed.maker} 전문상사`,
      sellerAddress: sellerType === "개인" ? region : `${region} · ${complex}`,
      image: images[index % images.length],
      isVirtual: true as const,
      scenarioVersion: "v01" as const,
      condition: category === "부품·용품" ? (index % 3 === 0 ? "미사용" : "중고 A급") : undefined,
      compatibleModels: category === "부품·용품" ? ["현대·기아 승용", "수입 승용", "SUV·RV", "차종 확인 필요"][index % 4] : undefined,
      quantity: category === "부품·용품" ? 1 + index % 4 : undefined,
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
  { maker: "현대머티리얼핸들링", models: ["25D-9", "30D-9", "50D-9"], subtypes: ["디젤 지게차", "디젤 지게차", "대형 지게차"] },
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
], 3_900);

export const materialHandlingScenarioV01 = buildScenario("자재운반장비", "material", materialSeeds, [
  "bbm/generated/quickfilter-v01/heavy_forklift_v02.png",
  "truck/formats/v01/truck_subtype_forklift_v01.png",
], 1_450);

export const partsScenarioV01 = buildScenario("부품·용품", "parts", partsSeeds, [
  "category-photo/vehicle_type_parts_v01.png",
  "categories/parts.svg",
], 18);

export const virtualCategoryBrands: Record<VirtualCategoryCode, string[]> = {
  캠핑카: campingSeeds.map((seed) => seed.maker),
  자재운반장비: materialSeeds.map((seed) => seed.maker),
  "부품·용품": partsSeeds.map((seed) => seed.maker),
};
