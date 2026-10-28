// src/prototype/listing/bbm-list.tsx 안의 export 되지 않은 계산 함수·상수.
// 리액트 파일에서 import 할 수 없어서 글자 그대로 옮겼다(리액트 판을 고치면 여기도 같이 고친다).
import { bbmCategoryGroups } from "@proto/listing/bbm-list";
import type { Car } from "@proto/data";

export type HeadlineTone = "default" | "blue";
export type HeadlinePosition = "top" | "photo-top" | "after-model";

export const headlinePositionLinks: Array<{ short: string; label: string; tone: HeadlineTone }> = [
  { short: "3 기본", label: "세부모델 아래 · 기본색", tone: "default" },
  { short: "3B 블루", label: "세부모델 아래 · 보배드림 블루", tone: "blue" },
];

export function getHeadlineTone(): HeadlineTone {
  return new URLSearchParams(window.location.search).get("titlecolor") === "blue" ? "blue" : "default";
}

export function getHeadlinePosition(): HeadlinePosition {
  const position = new URLSearchParams(window.location.search).get("titlepos");
  if (position === "top" || position === "photo-top") return position;
  return "after-model";
}

export type BbmCategoryGroup = (typeof bbmCategoryGroups)[number];

export function categoryGroupForSelection(selected: string) {
  // 자기 값이 같은 그룹을 먼저 찾는다(전체차량 그룹의 알약에는 다른 카테고리 값도 들어 있다)
  return bbmCategoryGroups.find((group) => group.value === selected)
    ?? bbmCategoryGroups.find((group) => group.value !== "전체" && group.children.some((child) => child.value === selected))
    ?? bbmCategoryGroups[0];
}

export type ImageGuideFamily = "body" | "gclass" | "heavy";

export const imageGuideItems: Record<ImageGuideFamily, Array<[value: string, image: string, label?: string]>> = {
  body: [
    ["중고차", "bbm/generated/quickfilter-v01/car_body_sedan_v01.png", "세단"],
    ["중고차", "bbm/generated/quickfilter-v01/car_body_hatchback_v01.png", "해치백"],
    ["중고차", "bbm/generated/quickfilter-v01/car_body_suv_v01.png", "SUV"],
    ["중고차", "bbm/generated/quickfilter-v01/car_body_coupe_v01.png", "쿠페"],
  ],
  gclass: [
    ["중고차", "bbm/generated/quickfilter-v01/car_mercedes_gclass_w460_v01.png", "G-클래스 W460"],
    ["중고차", "bbm/generated/quickfilter-v01/car_mercedes_gclass_w463_v01.png", "G-클래스 W463"],
    ["중고차", "bbm/generated/quickfilter-v01/car_mercedes_gclass_w465_v01.png", "G-클래스 최신형"],
  ],
  heavy: [
    ["건설기계", "bbm/generated/quickfilter-v01/heavy_excavator_v01.png", "굴착기"],
    ["건설기계", "bbm/generated/quickfilter-v01/heavy_wheel_loader_v01.png", "휠로더"],
    ["건설기계", "bbm/generated/quickfilter-v01/heavy_forklift_v02.png", "지게차"],
  ],
};

export function getImageGuideFamily(): ImageGuideFamily | null {
  const value = new URLSearchParams(window.location.search).get("imageguide");
  return value === "body" || value === "gclass" || value === "heavy" ? value : null;
}

// 카드 제목 축약(2026-10-08): 긴 제조사명은 줄이고(만(MAN) → MAN 등, 필터 목록은 정식 이름 그대로),
// 등급 앞부분이 제목과 겹치면(A클래스 + A-클래스 W177) 빼고, 「6세대 W206」처럼 세대 번호와 코드가 겹치면 코드만 남긴다
const titleMakerShort: Record<string, string> = { "만(MAN)": "MAN", "다프(DAF)": "DAF", 미쓰비시로지스넥스트: "미쓰비시", 현대머티리얼핸들링: "현대" };
const squash = (text: string) => text.replace(/[-\s]/g, "");
export function cardTitleText(car: Car) {
  const maker = Object.keys(titleMakerShort).find((name) => car.title.startsWith(`${name} `));
  const title = maker ? `${titleMakerShort[maker]}${car.title.slice(maker.length)}` : car.title;
  // 제목에 이미 있는 영문·숫자 낱말(3자 이상, 하이픈·띄어쓰기 무시)은 등급에서 뺀다: A-클래스, C220d (「클래스 A」의 「클래스」 같은 한글 낱말은 유지)
  const words = (car.trim ?? "").split(" ").filter((word) => word && !(squash(word).length >= 3 && /[A-Za-z0-9]/.test(word) && squash(title).includes(squash(word))));
  const trim = words.join(" ").replace(/\d+세대 (?=[A-Z]\d)/, "");
  return trim ? `${title} ${trim}` : title;
}

// 피드 사양 줄 아이콘(노션 「N_독일_오토스카우트 24」 02_승용_매물리스트 · 차량 필터 원본, 2026-10-10 「메타정보에 아이콘 배치」)
export const specIconFiles = { motorcycle: "motorcycle", year: "year-calendar", mileage: "mileage-road", fuelGasoline: "fuel-gasoline", fuelDiesel: "fuel-diesel", fuelElectric: "fuel-electric", fuelHybrid: "fuel-hybrid", fuelLpg: "fuel-lpg", fuelCng: "fuel-cng", fuelOther: "fuel-other", power: "power", axle: "axle", displacement: "engine-displacement", berth: "sleeping-berth", seats: "seats", hours: "usage-hours" } as const;
export const specIconOf = (item: string, bikeGenre = false): keyof typeof specIconFiles | null => {
  if (bikeGenre && /^(네이키드|스쿠터|스포츠|멀티퍼포즈|크루저|클래식|언더본|투어러|오프로드|전기|삼륜|ATV|기타)$/.test(item)) return "motorcycle";
  if (/^\d{2}년\d{2}월(\(\d{2}년형\))?$/.test(item) || /^(19|20)\d{2}$/.test(item)) return "year";
  if (/km$/.test(item)) return "mileage";
  // 연료는 종류별 아이콘(노션 「보정된 폭스바겐 독일 연료」 01 가솔린 · 02 디젤 · 03 전기 · 04 하이브리드(가솔린/전기) · 06 LPG · 08 CNG · 09 기타 연료, 2026-10-10)
  if (/^(가솔린\+전기|가솔린 하이브리드|플러그인|하이브리드)/.test(item)) return "fuelHybrid";
  if (/^디젤/.test(item)) return "fuelDiesel";
  if (/^가솔린$/.test(item)) return "fuelGasoline";
  if (/^전기$/.test(item)) return "fuelElectric";
  if (/^LPG$/.test(item)) return "fuelLpg";
  if (/^CNG$/.test(item)) return "fuelCng";
  if (/^(수소|기타)/.test(item)) return "fuelOther";
  if (/마력$/.test(item)) return "power";
  if (/^\d축$/.test(item)) return "axle";
  if (/^[\d,]+cc$/.test(item)) return "displacement";
  if (/^취침 \d+명$/.test(item)) return "berth";
  if (/^승차 \d+명$/.test(item)) return "seats";
  if (/^[\d,]+시간$/.test(item)) return "hours";
  return null;
};

// 리액트 renderFeedSpec 이 그리던 항목 목록(DOM은 BbmResultCard.vue 템플릿이 그린다).
// 아이콘이 하나라도 있는 줄은 아이콘이 항목 구분을 맡고 가운데 점을 쓰지 않는다(없는 줄은 가운데 점 유지)
export function feedSpecItems(text: string, forceIcons = false, bikeGenre = false) {
  const items = text.split(" · ");
  // 2026-10-10 「아이콘 빼자, 복잡하다」: 기본은 아이콘 없는 가운데 점 사양 줄. 주소 끝 &specicon=on 이면 아이콘(비교용)
  // 2026-10-18 PC 바이크 목록은 가독성을 위해 아이콘 없이 가운데 점으로 항목을 구분한다.
  const iconsOff = !forceIcons && new URLSearchParams(window.location.search).get("specicon") !== "on";
  const iconOf = (item: string) => iconsOff ? null : specIconOf(item, bikeGenre);
  const hasIcon = items.some((item) => iconOf(item));
  return items.map((item, index) => {
    const icon = iconOf(item);
    return { item, index, dot: Boolean(index && !hasIcon), icon: icon ? specIconFiles[icon] : null };
  });
}

// Drive 공개 링크(내부 테스트용)는 동시에 많이 부르면 가끔 막히므로 실패한 사진은 1~2번 다시 부른다
export const retryExternalPhoto = (event: Event) => {
  const img = event.currentTarget as HTMLImageElement;
  const tries = Number(img.dataset.retry ?? "0");
  if (!/^https?:/.test(img.src) || img.src.startsWith(window.location.origin) || tries >= 2) return;
  img.dataset.retry = String(tries + 1);
  const base = img.src.split("#")[0];
  window.setTimeout(() => { img.src = `${base}${base.includes("?") ? "&" : "?"}r=${tries + 1}`; }, 700 * (tries + 1));
};

// ── PC 한줄 광고로 보기(테스트 서버 dev.bbmuseum car-list-text-view 실측 10/9)
export const textViewColors: Record<string, string> = { 흰색: "#FFFFFF", 진주색: "#F4F1E8", 검정색: "#000000", 검정투톤: "#1A1A1A", 은색: "#C9CDD2", 명은색: "#D8DBDF", 은회색: "#A9AEB4", 쥐색: "#6E7277", 회색: "#8C8C8C", 청색: "#1F4E99", 하늘색: "#8EC5EC", 빨간색: "#D7263D", 자주색: "#7A2B5E", 분홍색: "#F2A7BB", 주황색: "#F28C28", 노란색: "#F5C518", 갈색: "#7B5134", 갈대색: "#B9A27A", 연금색: "#D8C27E", 녹색: "#2E7D32", 담녹색: "#7FA37C", 연두색: "#A6CE39", 청옥색: "#2A9D8F", 은하색: "#9DA3AF" };
export const textViewYear = (car: Car, spec: string) => {
  const yy = car.filter?.year ? String(car.filter.year).slice(-2) : "";
  const month = spec.match(/(\d{2})년(\d{2})월/);
  if (month) return `${month[1]}/${month[2]}(${yy || month[1]})`;
  const only = spec.match(/(\d{2})년식|(?:^|\s)(\d{4})(?:\s|$)/);
  const y = only?.[1] ?? only?.[2]?.slice(-2) ?? yy;
  return y ? `${y}/00(${yy || y})` : "-";
};

export const wishMaskStyle = (url: string) => ({ WebkitMaskImage: `url("${url}")`, maskImage: `url("${url}")` });
