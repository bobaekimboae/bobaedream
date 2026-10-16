export type Powertrain = "ev" | "phev" | "erev" | "hybrid" | "ice";

export type RatingCategoryId =
  | "exterior"
  | "interior"
  | "space"
  | "features"
  | "driving"
  | "range"
  | "adas"
  | "cockpit"
  | "power"
  | "fuel";

export type RatingCategory = {
  id: RatingCategoryId;
  label: string;
  originalLabel: string;
  comments: readonly [string, string, string, string, string];
  originalComments: readonly [string, string, string, string, string];
};

const category = (
  id: RatingCategoryId,
  label: string,
  originalLabel: string,
  comments: RatingCategory["comments"],
  originalComments: RatingCategory["originalComments"],
): RatingCategory => ({ id, label, originalLabel, comments, originalComments });

export const ratingCategories: Record<RatingCategoryId, RatingCategory> = {
  exterior: category("exterior", "외관", "外观", ["호불호가 커요", "겨우 볼 만해요", "무난한 디자인", "시선 끄는 디자인", "디자인 완성도 최고"], ["奇丑无比", "勉强接受", "平淡无奇", "颜值担当", "颜值巅峰"]),
  interior: category("interior", "실내", "内饰", ["받아들이기 어려움", "실내 구성이 아쉬움", "소박하고 무난해요", "보기 좋고 편안해요", "설계와 마감 훌륭"], ["不能接受", "勉强接受", "朴素无华", "赏心悦目", "设计完美"]),
  space: category("space", "공간", "空间", ["좁고 답답해요", "공간이 부족해요", "딱 필요한 만큼", "공간이 여유로워요", "아주 넉넉해요"], ["狭窄憋屈", "空间有限", "刚好够用", "比较宽裕", "十分充裕"]),
  features: category("features", "편의·안전 사양", "配置", ["기본 사양 부족", "필수 사양만 있음", "일상에는 충분", "편의 사양 만족", "사양 매우 풍부"], ["如同毛坯", "轻量简装", "日常够用", "舒适享受", "非常丰富"]),
  driving: category("driving", "주행감", "驾驶感受", ["견디기 어려워요", "주행감이 아쉬워요", "무난한 주행감", "편안하고 안정적", "주행 완성도 최고"], ["难以忍受", "或有欠缺", "中规中矩", "驾乘舒适", "极致体验"]),
  range: category("range", "주행거리·전비", "续航能耗", ["주행거리 부족", "거리 불안이 있어요", "출퇴근에는 충분", "거리·효율 우수", "장거리도 든든"], ["衰减严重", "有些焦虑", "通勤满足", "续航优秀", "扎实持久"]),
  adas: category("adas", "주행 보조", "辅助驾驶", ["실용성이 없어요", "가끔만 쓸 만해요", "기본 기능은 무난", "똑똑하고 안정적", "믿고 쓸 수 있어요"], ["毫不实用", "间或可用", "马马虎虎", "聪明可靠", "完全信赖"]),
  cockpit: category("cockpit", "인포테인먼트", "智能座舱", ["사용성이 나빠요", "다소 불편해요", "기본 사용엔 충분", "기능 풍부하고 편함", "빠르고 스마트함"], ["智商为零", "不太好用", "满足使用", "丰富好用", "高度智能"]),
  power: category("power", "동력·핸들링", "动力操控", ["동력·조향 불편", "힘과 핸들링 아쉬움", "무난한 동력 성능", "쉽고 안정적인 운전", "차와 하나 된 느낌"], ["难以忍受", "有所欠缺", "中规中矩", "驾驶信心", "人车合一"]),
  fuel: category("fuel", "연비", "油耗", ["연료비 부담 큼", "연료 소비 많음", "평균적인 연비", "연비가 우수해요", "효율 매우 뛰어남"], ["吞油黑洞", "烧油大户", "正常水平", "油耗优秀", "节油高效"]),
};

export const ratingProfiles: Record<Powertrain, { label: string; required: RatingCategoryId[]; optional: RatingCategoryId[]; ownerMetric: { label: string; placeholder: string; unit: string } }> = {
  ev: { label: "전기차", required: ["exterior", "interior", "space", "features", "driving", "range"], optional: ["adas", "cockpit"], ownerMetric: { label: "실주행거리", placeholder: "평균 주행거리", unit: "km" } },
  phev: { label: "플러그인 하이브리드", required: ["exterior", "interior", "space", "features", "driving", "range"], optional: ["adas", "cockpit"], ownerMetric: { label: "순수 전기 주행거리", placeholder: "실제 전기 주행거리", unit: "km" } },
  erev: { label: "주행거리 연장형", required: ["exterior", "interior", "space", "features", "driving", "range"], optional: ["adas", "cockpit"], ownerMetric: { label: "실주행거리", placeholder: "평균 주행거리", unit: "km" } },
  hybrid: { label: "하이브리드", required: ["exterior", "interior", "space", "features", "power", "fuel"], optional: [], ownerMetric: { label: "실연비", placeholder: "평균 연비", unit: "km/L" } },
  ice: { label: "내연기관", required: ["exterior", "interior", "space", "features", "power", "fuel"], optional: [], ownerMetric: { label: "실연비", placeholder: "평균 연비", unit: "km/L" } },
};

export const reviewSeedVehicles = [
  { id: "sag-01-m3", brand: "BMW", model: "M3", trim: "2023 M3 xDrive 컴페티션 M", powertrain: "ice" as const, logo: "bmw.png", benchmark: "고성능 세단 평균 4.4", photoKey: "sag-01" },
  { id: "sag-02-taycan", brand: "포르쉐", model: "타이칸", trim: "2023 EV", powertrain: "ev" as const, logo: "porsche.png", benchmark: "고성능 전기 세단 평균 4.5", photoKey: "sag-02" },
  { id: "sag-03-gls", brand: "벤츠", model: "GLS클래스", trim: "2022 GLS 580 4매틱", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "대형 SUV 평균 4.3", photoKey: "sag-03" },
  { id: "sag-04-glc", brand: "벤츠", model: "GLC클래스", trim: "2024 GLC 300 4매틱 쿠페", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "중형 SUV 평균 4.3", photoKey: "sag-04" },
  { id: "sag-05-eclass", brand: "벤츠", model: "E클래스", trim: "2023 E350 4매틱 AMG 라인", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "준대형 세단 평균 4.2", photoKey: "sag-05" },
  { id: "sag-06-rx", brand: "렉서스", model: "RX", trim: "2022 RX 450h", powertrain: "hybrid" as const, logo: "lexus.png", benchmark: "하이브리드 SUV 평균 4.4", photoKey: "sag-06" },
  { id: "sag-07-sclass", brand: "벤츠", model: "S클래스", trim: "2023 S350d", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "대형 세단 평균 4.5", photoKey: "sag-07" },
  { id: "sag-08-gla", brand: "벤츠", model: "GLA클래스", trim: "2018 GLA 45 AMG 4매틱", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "고성능 소형 SUV 평균 4.1", photoKey: "sag-08" },
  { id: "sag-09-defender", brand: "랜드로버", model: "올 뉴 디펜더", trim: "2025 90 D250 X다이나믹 SE", powertrain: "ice" as const, logo: "land-rover.png", benchmark: "대형 SUV 평균 4.3", photoKey: "sag-09" },
  { id: "sag-10-7series", brand: "BMW", model: "7시리즈", trim: "2021 740Li xDrive", powertrain: "ice" as const, logo: "bmw.png", benchmark: "대형 세단 평균 4.4", photoKey: "sag-10" },
  { id: "sag-11-eclass", brand: "벤츠", model: "E클래스", trim: "2002 E240", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "올드 세단 평균 4.0", photoKey: "sag-11" },
  { id: "sag-12-cls", brand: "벤츠", model: "CLS클래스", trim: "2022 CLS 450 4매틱", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "4도어 쿠페 평균 4.3", photoKey: "sag-12" },
  { id: "sag-13-sclass", brand: "벤츠", model: "S클래스", trim: "2021 S500L 4매틱", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "대형 세단 평균 4.5", photoKey: "sag-13" },
  { id: "sag-14-4series", brand: "BMW", model: "4시리즈", trim: "2021 M440i xDrive 쿠페", powertrain: "ice" as const, logo: "bmw.png", benchmark: "고성능 쿠페 평균 4.4", photoKey: "sag-14" },
  { id: "sag-15-sclass", brand: "벤츠", model: "S클래스", trim: "2022 S500L 4매틱", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "대형 세단 평균 4.5", photoKey: "sag-15" },
  { id: "sag-16-flying-spur", brand: "벤틀리", model: "플라잉스퍼", trim: "2022 4.0 V8", powertrain: "ice" as const, logo: "bentley.png", benchmark: "럭셔리 세단 평균 4.6", photoKey: "sag-16" },
  { id: "sag-17-ftype", brand: "재규어", model: "F-타입", trim: "2014 쿠페 3.0", powertrain: "ice" as const, logo: "jaguar.png", benchmark: "스포츠 쿠페 평균 4.3", photoKey: "sag-17" },
  { id: "sag-18-defender", brand: "랜드로버", model: "올 뉴 디펜더", trim: "2026 110 D250 X다이나믹 SE", powertrain: "ice" as const, logo: "land-rover.png", benchmark: "대형 SUV 평균 4.3", photoKey: "sag-18" },
  { id: "sag-19-macan", brand: "포르쉐", model: "마칸", trim: "2016 3.0 S 디젤", powertrain: "ice" as const, logo: "porsche.png", benchmark: "스포츠 SUV 평균 4.3", photoKey: "sag-19" },
  { id: "sag-20-sclass", brand: "벤츠", model: "S클래스", trim: "2021 S450L 4매틱", powertrain: "ice" as const, logo: "mercedes-benz.png", benchmark: "대형 세단 평균 4.5", photoKey: "sag-20" },
  { id: "sag-21-avante", brand: "현대", model: "더 뉴 아반떼", trim: "2024 1.6 스마트", powertrain: "ice" as const, logo: "hyundai.png", benchmark: "준중형 세단 평균 4.1", photoKey: "sag-21" },
  { id: "sag-22-carnival", brand: "기아", model: "카니발", trim: "2021 9인승 가솔린", powertrain: "ice" as const, logo: "kia.png", benchmark: "대형 MPV 평균 4.2", photoKey: "sag-22" },
  { id: "sag-23-maybach", brand: "벤츠", model: "마이바흐 S580", trim: "2021 S580 4매틱", powertrain: "ice" as const, logo: "maybach.png", benchmark: "최상위 럭셔리 세단 평균 4.7", photoKey: "sag-23" },
] as const;

export const reviewModels = [
  { id: "ev-a06", brand: "현대", model: "아이오닉 6", trim: "2026 롱레인지 2WD", powertrain: "ev" as const, logo: "hyundai.png", benchmark: "전기 세단 평균 4.3" },
  { id: "phev-xc60", brand: "볼보", model: "XC60", trim: "2026 T8 AWD 플러그인 하이브리드", powertrain: "phev" as const, logo: "volvo.png", benchmark: "중형 SUV 평균 4.4" },
  { id: "hybrid-camry", brand: "토요타", model: "캠리", trim: "2026 2.5 하이브리드", powertrain: "hybrid" as const, logo: "toyota.png", benchmark: "하이브리드 세단 평균 4.3" },
  { id: "erev-m7", brand: "AITO", model: "M7", trim: "2026 Max AWD 주행거리 연장형", powertrain: "erev" as const, logo: "", benchmark: "중형 SUV 평균 4.4" },
  { id: "ice-m3", brand: "BMW", model: "M3", trim: "2025 컴페티션 M xDrive", powertrain: "ice" as const, logo: "bmw.png", benchmark: "고성능 세단 평균 4.4" },
  { id: "ev-preview", brand: "기아", model: "EV4", trim: "출시 예정 · 사전 체험 모델", powertrain: "ev" as const, logo: "kia.png", benchmark: "준중형 전기차", released: false },
  ...reviewSeedVehicles,
] as const;

export type ReviewModel = (typeof reviewModels)[number];

export function scoreBucket(score: number) {
  // Verified against the native writer by tapping both halves of every star:
  // 0.5/1.0, 1.5/2.0, 2.5/3.0, 3.5/4.0, 4.5/5.0.
  if (score <= 1) return 0;
  if (score <= 2) return 1;
  if (score <= 3) return 2;
  if (score <= 4) return 3;
  return 4;
}

export function ratingComment(categoryId: RatingCategoryId, score: number) {
  const item = ratingCategories[categoryId];
  const bucket = scoreBucket(score);
  return { korean: item.comments[bucket], original: item.originalComments[bucket] };
}
