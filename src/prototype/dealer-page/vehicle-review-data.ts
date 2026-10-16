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

export const reviewModels = [
  { id: "ev-a06", brand: "현대", model: "아이오닉 6", trim: "2026 롱레인지 2WD", powertrain: "ev" as const, logo: "hyundai.png", benchmark: "전기 세단 평균 4.3" },
  { id: "phev-xc60", brand: "볼보", model: "XC60", trim: "2026 T8 AWD 플러그인 하이브리드", powertrain: "phev" as const, logo: "volvo.png", benchmark: "중형 SUV 평균 4.4" },
  { id: "hybrid-camry", brand: "토요타", model: "캠리", trim: "2026 2.5 하이브리드", powertrain: "hybrid" as const, logo: "toyota.png", benchmark: "하이브리드 세단 평균 4.3" },
  { id: "erev-m7", brand: "AITO", model: "M7", trim: "2026 Max AWD 주행거리 연장형", powertrain: "erev" as const, logo: "", benchmark: "중형 SUV 평균 4.4" },
  { id: "ice-m3", brand: "BMW", model: "M3", trim: "2025 컴페티션 M xDrive", powertrain: "ice" as const, logo: "bmw.png", benchmark: "고성능 세단 평균 4.4" },
  { id: "ev-preview", brand: "기아", model: "EV4", trim: "출시 예정 · 사전 체험 모델", powertrain: "ev" as const, logo: "kia.png", benchmark: "준중형 전기차", released: false },
] as const;

export type ReviewModel = (typeof reviewModels)[number];

export function scoreBucket(score: number) {
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
