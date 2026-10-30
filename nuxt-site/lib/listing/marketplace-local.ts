// copy of src/prototype/listing/index.tsx — keep in sync.
// 리액트 index.tsx 의 모듈 수준(파일 맨 위) 상수·계산 함수 중 export 되지 않은 것의 사본.
// 원본 줄 범위: 131~132, 134~363, 368~400, 410~425, 453~514, 545~561, 909~925.
// (365~366 setPretendard 부수 효과는 MarketplaceScreen.tsx, 402~408 화면 연결은 listing-screens.ts, 427~451 훅은 composables/listing/)
import {
  asset,
  bbmSampleCars,
  bikeCars,
  campingCars,
  heavyCars,
  materialHandlingCars,
  partsCars,
  truckCars,
  type Car,
  type QuickModelVisual,
} from "@proto/data";
import { sortBbmCars } from "@proto/listing/bbm-list-area";
import { normalizeTruckFormatSelection } from "@proto/data/truck-format-catalog";
import { truckSpecOptionsFor } from "@proto/data/truck-depth4-catalog";
import type { SeoulAutoGallerySection } from "@proto/listing/seoul-auto-gallery-directory";

export type BbmMobileView = "목록으로 보기" | "피드로 보기" | "갤러리로 보기" | "한줄 광고로 보기" | "텍스트로 보기";
export type OldcarDecade = 1950 | 1960 | 1970 | 1980 | 1990;

// 엔카 버스 모델명은 승용 카탈로그의 표기(e- 하이픈, 그룹명)와 달라
// 이름 기반 자동 매칭만 쓰면 일부 카드만 이미지가 생겨 레일 기준선이 무너진다.
// 같은 228×120 규격으로 정규화된 내부 자산을 명시적으로 연결한다.
export const hyundaiBusModelVisuals: Readonly<Record<string, QuickModelVisual>> = {
  "e에어로타운": { image: "assets/models/kr/49/710.png", bodyFit: "width" },
  "e카운티": { image: "assets/models/kr/49/757.png", bodyFit: "width" },
  "글로벌 900 (그린시티)": { image: "assets/models/kr/49/799.png", bodyFit: "width" },
  "뉴 카운티": { image: "assets/models/kr/49/1281.png", bodyFit: "width" },
  "슈퍼에어로시티": { image: "assets/models/kr/49/799.png", bodyFit: "width" },
  "에어로타운": { image: "assets/models/kr/49/710.png", bodyFit: "width" },
  "유니버스": { image: "assets/models/kr/49/734.png", bodyFit: "width" },
  "유니시티": { image: "assets/models/kr/49/734.png", bodyFit: "width" },
  "카운티": { image: "assets/models/kr/49/413.png", bodyFit: "width" },
};

export const oldcarDecades: Array<{ value: OldcarDecade; label: string }> = [
  { value: 1950, label: "50년대" },
  { value: 1960, label: "60년대" },
  { value: 1970, label: "70년대" },
  { value: 1980, label: "80년대" },
  { value: 1990, label: "90년대" },
];

export const getInitialOldcarDecade = (): OldcarDecade | null => {
  if (typeof window === "undefined") return null;
  const value = Number(new URLSearchParams(window.location.search).get("decade"));
  return oldcarDecades.some((option) => option.value === value) ? value as OldcarDecade : null;
};

// 바이크는 제조사보다 유형을 먼저 고른다. 슬롯은 초톳 76/84×102,
// 이미지는 AutoScout24 카탈로그 톤의 좌향 전신 컷으로 통일한다.
export const bikeTypeQuickOptions = [
  { label: "네이키드", image: "bike/types/autoscout-v01/naked.png" },
  { label: "스쿠터", image: "bike/types/autoscout-v01/scooter.png" },
  { label: "스포츠", image: "bike/types/autoscout-v01/sport.png" },
  { label: "멀티퍼포즈", image: "bike/types/autoscout-v01/multipurpose.png" },
  { label: "크루저", image: "bike/types/autoscout-v01/cruiser.png" },
  { label: "클래식", image: "bike/types/autoscout-v01/classic.png" },
  { label: "언더본", image: "bike/types/autoscout-v01/underbone.png" },
  { label: "투어러", image: "bike/types/autoscout-v01/tourer.png" },
  { label: "오프로드", image: "bike/types/autoscout-v01/offroad.png" },
  { label: "전기", image: "bike/types/autoscout-v01/electric.png" },
  { label: "삼륜", image: "bike/types/autoscout-v01/trike.png" },
  { label: "ATV", image: "bike/types/autoscout-v01/atv.png" },
  { label: "기타", image: "bike/types/autoscout-v01/other.png" },
] as const;

// 윙바디·탑차 2뎁스 비교 시안은 실제 상위 분류만 노출한다.
// 내장탑의 일반·하이탑·저상형·상승형은 다음 뎁스에서 다룬다.
export const wingbodyQuickSubtypes = ["윙바디", "내장탑", "워크스루밴", "다용도탑"] as const;

// BMW 공식 라인업의 대표 차체 분류를 카드칩 보조 정보로 사용한다.
// 한 모델군에 여러 차체가 있는 경우 국내 대표 형태를 우선하고,
// 실제 이름부터 두 형태가 함께인 M 쿠페/로드스터만 복수 표기한다.
export const bmwModelBodyTypes: Record<string, string> = {
  "1시리즈": "해치백",
  "2시리즈": "쿠페",
  "3시리즈": "세단",
  "4시리즈": "쿠페",
  "5시리즈": "세단",
  "6시리즈": "쿠페",
  "7시리즈": "세단",
  "8시리즈": "쿠페",
  "그란투리스모 (GT)": "해치백",
  "1M": "쿠페",
  "M2": "쿠페",
  "M3": "세단",
  "M4": "쿠페",
  "M5": "세단",
  "M6": "쿠페",
  "M8": "쿠페",
  "X1": "SUV",
  "X2": "SUV",
  "X3": "SUV",
  "X4": "SUV",
  "X5": "SUV",
  "X6": "SUV",
  "X7": "SUV",
  "X3M": "SUV",
  "X4M": "SUV",
  "X5M": "SUV",
  "X6M": "SUV",
  "XM": "SUV",
  "Z3": "컨버터블",
  "Z4": "컨버터블",
  "M 쿠페/로드스터": "쿠페·컨버터블",
  "i3": "해치백",
  "i4": "쿠페",
  "i5": "세단",
  "i7": "세단",
  "i8": "쿠페",
  "iX1": "SUV",
  "iX2": "SUV",
  "iX3": "SUV",
  "iX": "SUV",
};

// 과쯔 원본처럼 첫 화면에서 서로 다른 차체가 바로 구분되도록
// 숫자명 DB 순서 대신 세단·SUV·해치백·로드스터를 교차 배치한다.
export const bmwGuaziQuickOrder = [
  "5시리즈", "X5", "3시리즈", "X3", "7시리즈", "X1", "1시리즈", "Z4", "i5", "iX",
  "2시리즈", "X6", "4시리즈", "X7", "M3", "i4", "8시리즈", "X2", "M5", "i7",
  "6시리즈", "M2", "M4", "XM", "Z3", "iX1", "그란투리스모 (GT)", "M8", "i8", "iX3",
  "1M", "M6", "X3M", "X4M", "X5M", "X6M", "i3", "iX2", "M 쿠페/로드스터",
] as const;
export const bmwGuaziQuickRank = new Map<string, number>(bmwGuaziQuickOrder.map((name, index) => [name, index]));

// 페라리 카탈로그의 모델그룹별 최신 세대 출시월 기준 상위 5개.
// 나머지 모델은 기존 카탈로그 순서를 유지한다.
export const ferrariLatestModelOrder = ["12 칠린드리", "푸로산게", "296", "SF90", "로마"] as const;
export const ferrariLatestModelRank = new Map<string, number>(ferrariLatestModelOrder.map((name, index) => [name, index]));
export const ferrariSpecialRegions = ["서울오토갤러리", "도이치오토월드"] as const;
export const ferrariProvinceOrder = ["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"] as const;

// 과쯔 카드칩 측면 비교 시안. 기존 3/4 이미지는 그대로 보존하고
// &qfangle=side 일 때 BMW 전체 모델을 완전 측면 이미지로 바꾼다.
export const bmwGuaziSideVisuals: Record<string, QuickModelVisual> = {
  "5시리즈": { image: asset("cars/bmw/card-side/5-series-side.png"), bodyType: "세단", bodyFit: "width" },
  "X5": { image: asset("cars/bmw/card-side/x5-side.png"), bodyType: "SUV", bodyFit: "width" },
  "3시리즈": { image: asset("cars/bmw/card-side/3-series-side.png"), bodyType: "세단", bodyFit: "width" },
  "X3": { image: asset("cars/bmw/card-side/x3-side.png"), bodyType: "SUV", bodyFit: "width" },
  "7시리즈": { image: asset("cars/bmw/card-side/7-series-side.png"), bodyType: "세단", bodyFit: "width" },
  "X1": { image: asset("cars/bmw/card-side/x1-side.png"), bodyType: "SUV", bodyFit: "width" },
  "1시리즈": { image: asset("cars/bmw/card-side/1-series-side.png"), bodyType: "해치백", bodyFit: "width" },
  "Z4": { image: asset("cars/bmw/card-side/z4-side.png"), bodyType: "컨버터블", bodyFit: "width" },
  "i5": { image: asset("cars/bmw/card-side/i5-side.png"), bodyType: "세단", bodyFit: "width" },
  "iX": { image: asset("cars/bmw/card-side/ix-side.png"), bodyType: "SUV", bodyFit: "width" },
  "2시리즈": { image: asset("cars/bmw/card-side/2-series-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "X6": { image: asset("cars/bmw/card-side/x6-side.png"), bodyType: "SUV", bodyFit: "width" },
  "4시리즈": { image: asset("cars/bmw/card-side/4-series-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "X7": { image: asset("cars/bmw/card-side/x7-side.png"), bodyType: "SUV", bodyFit: "width" },
  "M3": { image: asset("cars/bmw/card-side/m3-side.png"), bodyType: "세단", bodyFit: "width" },
  "i4": { image: asset("cars/bmw/card-side/i4-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "8시리즈": { image: asset("cars/bmw/card-side/8-series-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "X2": { image: asset("cars/bmw/card-side/x2-side.png"), bodyType: "SUV", bodyFit: "width" },
  "M5": { image: asset("cars/bmw/card-side/m5-side.png"), bodyType: "세단", bodyFit: "width" },
  "i7": { image: asset("cars/bmw/card-side/i7-side.png"), bodyType: "세단", bodyFit: "width" },
  "6시리즈": { image: asset("cars/bmw/card-side/6-series-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "M2": { image: asset("cars/bmw/card-side/m2-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "M4": { image: asset("cars/bmw/card-side/m4-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "XM": { image: asset("cars/bmw/card-side/xm-side.png"), bodyType: "SUV", bodyFit: "width" },
  "Z3": { image: asset("cars/bmw/card-side/z3-side.png"), bodyType: "컨버터블", bodyFit: "width" },
  "iX1": { image: asset("cars/bmw/card-side/ix1-side.png"), bodyType: "SUV", bodyFit: "width" },
  "그란투리스모 (GT)": { image: asset("cars/bmw/card-side/gt-side.png"), bodyType: "해치백", bodyFit: "width" },
  "M8": { image: asset("cars/bmw/card-side/m8-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "i8": { image: asset("cars/bmw/card-side/i8-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "iX3": { image: asset("cars/bmw/card-side/ix3-side.png"), bodyType: "SUV", bodyFit: "width" },
  "1M": { image: asset("cars/bmw/card-side/1m-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "M6": { image: asset("cars/bmw/card-side/m6-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "X3M": { image: asset("cars/bmw/card-side/x3m-side.png"), bodyType: "SUV", bodyFit: "width" },
  "X4M": { image: asset("cars/bmw/card-side/x4m-side.png"), bodyType: "SUV", bodyFit: "width" },
  "X5M": { image: asset("cars/bmw/card-side/x5m-side.png"), bodyType: "SUV", bodyFit: "width" },
  "X6M": { image: asset("cars/bmw/card-side/x6m-side.png"), bodyType: "SUV", bodyFit: "width" },
  "i3": { image: asset("cars/bmw/card-side/i3-side.png"), bodyType: "해치백", bodyFit: "width" },
  "iX2": { image: asset("cars/bmw/card-side/ix2-side.png"), bodyType: "SUV", bodyFit: "width" },
  "M 쿠페/로드스터": { image: asset("cars/bmw/card-side/m-coupe-roadster-side.png"), bodyType: "쿠페", bodyFit: "width" },
  "X4": { image: asset("cars/bmw/card-side/x4-side.png"), bodyType: "SUV", bodyFit: "width" },
};

// 완전 측면 자산은 비교용으로 보존하고, &qfangle=three-quarter 에서는
// 같은 슬롯·색상·바닥선을 유지한 좌측 전방 3/4 자산을 사용한다.
export const bmwGuaziThreeQuarterVisuals = Object.fromEntries(
  Object.entries(bmwGuaziSideVisuals).map(([name, visual]) => [name, {
    ...visual,
    image: visual.image
      ? visual.image.replace("/card-side/", "/card-three-quarter/").replace("-side.png", "-three-quarter.png")
      : visual.image,
  }]),
) as Record<string, QuickModelVisual>;

// 보기 방식 주소 값(검수 링크용): &view=list · feed · gallery · oneline · text. PC는 목록·갤러리·한줄 광고만 쓴다
export const bbmViewParam: Record<string, BbmMobileView> = { list: "목록으로 보기", feed: "피드로 보기", gallery: "갤러리로 보기", oneline: "한줄 광고로 보기", text: "텍스트로 보기" };
// 피드 사진 넘기기 시안(2026-10-10 「레딧처럼 사진 이동」): 매물마다 사진이 1장뿐이라 같은 목록의 다음 매물 사진을 임시 슬라이드로 붙인다(3~6장). &feedphotos=single 이면 1장 그대로
export const feedPhotosFor = (cars: Car[], index: number): string[] | undefined => {
  if (new URLSearchParams(window.location.search).get("feedphotos") === "single") return undefined;
  const car = cars[index];
  if (!car?.image) return undefined;
  // 수집한 실사진은 다른 매물 사진을 임시 슬라이드로 섞지 않는다.
  if (car.imageAspectRatio && car.photoList?.length) return car.photoList;
  // 실제 다중 사진이 있는 매물(서울오토갤러리)은 임시 슬라이드 대신 그 사진을 쓴다
  if (car.photoList && car.photoList.length > 1) return car.photoList;
  const count = 3 + (car.id % 4);
  const photos = [car.image];
  // 같은 제조사 매물 사진을 먼저, 모자라면 같은 목록의 다음 매물 사진으로 채운다
  const candidates = cars.filter((other) => other.id !== car.id && other.image && other.imageFit === car.imageFit);
  const sameMaker = candidates.filter((other) => other.maker === car.maker);
  const rest = candidates.filter((other) => other.maker !== car.maker);
  for (const other of [...sameMaker, ...rest]) {
    if (photos.length >= count) break;
    if (!photos.includes(other.image)) photos.push(other.image);
  }
  return photos.length > 1 ? photos : undefined;
};
export const initialBbmMobileView = (): BbmMobileView => bbmViewParam[new URLSearchParams(window.location.search).get("view") ?? ""] ?? "목록으로 보기";

export const initialSeoulAutoGallerySection = (): SeoulAutoGallerySection => {
  const value = new URLSearchParams(window.location.search).get("sag");
  return value === "companies" || value === "dealers" || value === "about" ? value : "vehicles";
};

export const initialAutohomeMakerSheetPreview = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("brandlogo") === "autohome" && params.get("preview") === "maker-sheet";
};

export const initialTruckFormatSelection = () => {
  const params = new URLSearchParams(window.location.search);
  const selection = normalizeTruckFormatSelection(params.get("truckFormat"), params.get("truckSubtype"));
  const spec = params.get("truckSpec");
  return {
    ...selection,
    spec: truckSpecOptionsFor(selection.format, selection.subtype).includes(spec ?? "") ? spec : null,
  };
};

export const truckQuickLabelAliases: Record<string, string> = {
  "카고(화물)트럭": "카고트럭",
  "냉장·냉동차": "냉장·냉동",
  "크레인·고소작업차": "크레인·고소",
  "환경·폐기물차": "환경·폐기물",
  "견인·운송차": "견인·운송",
  "캠핑카/캠핑 트레일러": "캠핑카·트레일러",
  "폐기/음식물수송": "폐기물·음식물",
  "차량견인/운송": "견인·운송",
  "덤프/건설/중기": "덤프·건설",
  "캠핑트레일러": "캠핑 트레일러",
  "경형 트럭 (1톤 미만)": "경형 트럭",
};

export const truckQuickLabel = (label: string) => truckQuickLabelAliases[label] ?? label;

// QF-091: 적용 사이트 선택(시안 전환 도구)은 &debug=1 일 때만
export const debugMode = new URLSearchParams(window.location.search).get("debug") === "1";
// 과쯔 「전체차량」: 승용·트럭·바이크·캠핑카·건설기계·자재운반장비·부품 매물을 한 목록에 섞는다.
// 유형마다 자기 업데이트순(승용 id 큰 순, 나머지 데이터 순서)을 지키며 목록 전체에 고르게 퍼지도록 (순번+0.5)/개수 위치로 섞고 updateRank 로 고정한다.
export const allVehicleMixedCars: Car[] = (() => {
  // 2026-10-08 사용자 지시 「한국타이어 볼보 윙바디로 바꿔」: 전체 목록에서 부품 첫 매물(한국타이어 벤투스) 자리에 볼보 FE 윙바디(truck-031)를 둔다. 부품·트럭 개별 목록은 그대로
  const volvo = truckCars.find((car) => car.truck?.scenarioId === "truck-031");
  // 2026-10-08 「디젤 지게차 트레일러로 교체」: 자재운반장비 둘째 매물(30D-9 디젤 지게차) 자리에 명성정공 로베드 트레일러(truck-032)
  const lowbed = truckCars.find((car) => car.truck?.scenarioId === "truck-032");
  const mixedTrucks = truckCars.filter((car) => car !== volvo && car !== lowbed);
  const mixedMaterial = lowbed ? materialHandlingCars.map((car, index) => (index === 1 ? lowbed : car)) : materialHandlingCars;
  const mixedParts = volvo ? [volvo, ...partsCars.slice(1)] : partsCars;
  const groups = [sortBbmCars(bbmSampleCars, "업데이트순"), mixedTrucks, bikeCars, campingCars, heavyCars, mixedMaterial, mixedParts];
  const placed = groups.flatMap((group, groupIndex) => group.map((car, index) => ({ car, key: (index + 0.5) / group.length, groupIndex })));
  placed.sort((first, second) => first.key - second.key || first.groupIndex - second.groupIndex);
  return placed.map(({ car }, index) => ({ ...car, updateRank: placed.length - index }));
})();

// QF-076 부품 비교 화면(&bbmparts=1)
export const bbmPartsMode = new URLSearchParams(window.location.search).get("bbmparts") === "1";

// 최종 선택은 노션에서 받은 세 개 조절선 FilterHeader 원본이다.
// `filtericon=notion`은 이전 2단 비교 시안만 유지한다.
// 확정(2026-10-10 「2번 크기로 적용」): 기본은 시안 2 `chip-filter-chotot-24-s`(노션 24px 원본, 잉크 13.3). 「필터_16/16 (1)」은 `filtericon=leasing`으로만 비교. 이전 세 조절선은 `filtericon=header`. 시안(2026-10-10 「이 아이콘으로 시안」): `filtericon=chotot24`(노션 필터 24px 원본, 잉크 15) · `chotot24s`(작게 13.3) · `chotot24l`(크게 17).
export const bbmFilterIconParam = new URLSearchParams(window.location.search).get("filtericon");
export const bbmFilterIconName = bbmFilterIconParam === "notion"
  ? "chip-filter-notion"
  : bbmFilterIconParam === "chotot24" ? "chip-filter-chotot-24"
  : bbmFilterIconParam === "chotot24s" ? "chip-filter-chotot-24-s"
  : bbmFilterIconParam === "chotot24l" ? "chip-filter-chotot-24-l"
  : bbmFilterIconParam === "header" ? "chip-filter-header"
  : bbmFilterIconParam === "leasing" ? "chip-filter-leasing-24"
  : "chip-filter-chotot-24-s";

// PC 목록 레이아웃은 ?pc=1 이고 폭 820 이상일 때만 켠다. 모바일 마크업은 그대로 둔다.
// 기본은 보배드림 개발 시안형(QF-048~050), &pcl=chotot 이면 초톳형(QF-042~045) 비교 화면.
export const desktopLayoutQuery = "(min-width: 820px)";
// QF-093: 과쯔 PC 혼합 배치 — PC 공통 시작점인 820px부터 헤더·GNB를 유지한다.
// 1280 이상은 좌측 필터 + 목록, 820~1279는 좌측 필터를 숨기고 펼침판으로 제공한다.
export const hybridLayoutQuery = "(min-width: 820px)";
export const hybridNarrowQuery = "(max-width: 1279px)";
export const pcLayoutStyle = new URLSearchParams(window.location.search).get("pcl") === "chotot" ? "chotot" : "bbmuseum";
export type PcFilterLayout = "balanced" | "left" | "right" | "compact" | "bare" | "modern" | "charancha";
export const pcFilterLayout: PcFilterLayout = (() => {
  const value = new URLSearchParams(window.location.search).get("filterLayout");
  return value === "left" || value === "right" || value === "compact" || value === "bare" || value === "modern" || value === "charancha" ? value : "balanced";
})();
// 페라리 PC 배너 폭 비교안. 기본은 매물 폭(880px), `bannerLayout=full`은 페이지 전체 폭(1200px)이다.
export const ferrariBannerFull = new URLSearchParams(window.location.search).get("bannerLayout") === "full";
export const pcAsset = (name: string) => asset(`pc-detail/${name}`);

export const pcPriceLinks = [
  { label: "1,000만원 이하", min: 0, max: 1000 },
  { label: "1,000~2,000만원", min: 1000, max: 2000 },
  { label: "2,000~3,000만원", min: 2000, max: 3000 },
  { label: "3,000~5,000만원", min: 3000, max: 5000 },
  { label: "5,000만원~1억원", min: 5000, max: 10000 },
  { label: "1억~2억원", min: 10000, max: 20000 },
  { label: "2억원 이상", min: 20000, max: null },
];
export const pcBodyLinks = ["세단", "SUV", "해치백", "스포츠카", "승합"];

export type CarBodyBrandTheme = "hyundai" | "mercedes";

export const carBodyQuickOptions = [
  { label: "세단", assetName: "sedan" },
  { label: "해치백", assetName: "hatchback" },
  { label: "왜건", assetName: "wagon" },
  { label: "쿠페", assetName: "coupe" },
  { label: "컨버터블", assetName: "convertible" },
  { label: "SUV", assetName: "suv" },
  { label: "RV", assetName: "rv" },
  { label: "밴(승합)", assetName: "van" },
  { label: "픽업트럭", assetName: "pickup" },
  { label: "리무진", assetName: "limousine" },
] as const;

// 국산차 PC 퀵필터: 바디타입을 고른 뒤 제조사를 한 번 더 고르게 하지 않고
// 대표 모델로 바로 이동한다. 이름은 모델 카탈로그의 실제 1뎁스 이름과 맞춘다.
export const domesticModelsByBodyType: Record<string, ReadonlyArray<readonly [maker: string, model: string]>> = {
  세단: [["현대", "그랜저"], ["현대", "쏘나타"], ["현대", "아반떼"], ["현대", "아이오닉6"], ["기아", "K5"], ["기아", "K8"], ["기아", "K9"], ["제네시스", "G80"]],
  해치백: [["현대", "i30"], ["현대", "i20"], ["현대", "벨로스터"], ["기아", "모닝"], ["기아", "프라이드"], ["기아", "쏘울"]],
  왜건: [["현대", "i40"], ["기아", "X-트렉"], ["기아", "파크타운"]],
  쿠페: [["현대", "제네시스"], ["현대", "투스카니"], ["현대", "티뷰론"], ["현대", "스쿠프"], ["기아", "스팅어"]],
  컨버터블: [["기아", "엘란"]],
  SUV: [["현대", "싼타페"], ["현대", "투싼"], ["현대", "팰리세이드"], ["현대", "코나"], ["현대", "아이오닉5"], ["기아", "쏘렌토"], ["기아", "스포티지"], ["기아", "셀토스"], ["기아", "EV9"], ["제네시스", "GV70"], ["제네시스", "GV80"]],
  RV: [["기아", "카니발"], ["기아", "카렌스"], ["현대", "스타리아"], ["현대", "트라제XG"], ["현대", "싼타모"]],
  "밴(승합)": [["현대", "스타리아"], ["현대", "스타렉스"], ["현대", "쏠라티"], ["현대", "그레이스"], ["기아", "베스타"], ["기아", "프레지오"]],
  픽업트럭: [["기아", "타스만"], ["현대", "리베로"]],
  리무진: [["현대", "에쿠스"], ["현대", "그랜저"], ["기아", "K9"], ["기아", "카니발"], ["제네시스", "G80"]],
};

// 수입차도 국산차와 같은 바디타입 → 대표 모델 직행 구조를 쓴다.
// 모델명은 차량 기준표의 제조사별 1뎁스 이름과 일치시켜 선택 뒤 세대 단계로 바로 이어지게 한다.
export const importedModelsByBodyType: Record<string, ReadonlyArray<readonly [maker: string, model: string]>> = {
  세단: [["BMW", "5시리즈"], ["벤츠", "E-클래스"], ["아우디", "A6"], ["볼보", "S90"], ["렉서스", "ES"], ["테슬라", "모델 3"], ["포르쉐", "파나메라"], ["마세라티", "기블리"], ["롤스로이스", "고스트"]],
  해치백: [["BMW", "1시리즈"], ["벤츠", "A-클래스"], ["아우디", "A3"], ["미니", "쿠퍼"], ["폭스바겐", "골프"], ["볼보", "V40"], ["렉서스", "CT200h"], ["혼다", "시빅"], ["포드", "포커스"]],
  왜건: [["BMW", "3시리즈"], ["벤츠", "E-클래스"], ["아우디", "A4"], ["아우디", "A6"], ["볼보", "V60"], ["볼보", "V90"], ["폭스바겐", "파사트"], ["미니", "클럽맨"]],
  쿠페: [["BMW", "4시리즈"], ["벤츠", "CLE-클래스"], ["아우디", "TT"], ["포르쉐", "911"], ["페라리", "296"], ["람보르기니", "우라칸"], ["벤틀리", "컨티넨탈"], ["마세라티", "그란투리스모"], ["렉서스", "RC"]],
  컨버터블: [["BMW", "Z4"], ["벤츠", "SL-클래스"], ["포르쉐", "718"], ["미니", "쿠퍼 컨버터블"], ["페라리", "포르토피노"], ["롤스로이스", "던"], ["마세라티", "그란카브리오"], ["렉서스", "SC"]],
  SUV: [["BMW", "X5"], ["벤츠", "GLE-클래스"], ["아우디", "Q8"], ["포르쉐", "카이엔"], ["랜드로버", "레인지로버"], ["볼보", "XC90"], ["렉서스", "RX"], ["테슬라", "모델 Y"], ["람보르기니", "우루스"]],
  RV: [["벤츠", "B-클래스"], ["벤츠", "R-클래스"], ["BMW", "2시리즈"], ["BMW", "그란투리스모 (GT)"], ["미니", "컨트리맨"], ["미니", "클럽맨"], ["렉서스", "LM"], ["도요타", "시에나"], ["혼다", "오딧세이"]],
  "밴(승합)": [["벤츠", "V-클래스"], ["벤츠", "스프린터"], ["폭스바겐", "멀티밴"], ["포드", "트랜짓"], ["포드", "E-Series"], ["GMC", "사바나"], ["도요타", "알파드"], ["도요타", "시에나"], ["혼다", "오딧세이"]],
  픽업트럭: [["테슬라", "사이버트럭"], ["지프", "글래디에이터"], ["포드", "F150"], ["포드", "F250"], ["포드", "레인저"], ["GMC", "시에라"], ["GMC", "캐니언"], ["도요타", "타코마"], ["도요타", "툰드라"]],
  리무진: [["BMW", "7시리즈"], ["벤츠", "S-클래스"], ["아우디", "A8"], ["렉서스", "LS"], ["롤스로이스", "팬텀"], ["벤틀리", "플라잉스퍼"], ["마세라티", "콰트로포르테"]],
};

export function carBodyQuickImage(assetName: string, brand: CarBodyBrandTheme) {
  if (brand === "hyundai" && assetName === "convertible") {
    return asset("car/body-types/v02/hyundai/body_convertible_kia_elan_side_v02.png");
  }
  return asset(`car/body-types/v02/${brand}/body_${assetName}_${brand}_side_v02.png`);
}

// 2026-10-18 「vieclamtot에서 아이디어 내보고 시안」 · truck2hand: 검색창 안 카테고리 선택 + 빈 검색칸 포커스 시 인기 검색어 (`&pcsearch=cat` 미리보기)
export const bbSearchCategories: readonly { value: string; label: string }[] = [
  { value: "전체", label: "전체차량" }, { value: "중고차", label: "중고차" }, { value: "트럭 · 특장", label: "트럭·특장" }, { value: "바이크", label: "바이크" },
  { value: "캠핑카", label: "캠핑카" }, { value: "건설기계", label: "건설기계" }, { value: "자재운반장비", label: "자재운반장비" }, { value: "부품 · 용품", label: "부품·용품" },
];
export const bbSearchPopular: Record<string, readonly string[]> = {
  "전체": ["그랜저", "포터2", "쏘렌토", "카니발", "E클래스", "봉고3", "PCX", "모하비"],
  "중고차": ["그랜저", "쏘렌토", "카니발", "아반떼", "E클래스", "5시리즈", "G80", "팰리세이드"],
  "트럭 · 특장": ["포터2 1톤", "봉고3", "윙바디", "냉동탑차", "덤프", "카고 5톤", "마이티", "메가트럭"],
  "바이크": ["PCX", "NMAX", "할리데이비슨", "포르자", "슈퍼커브", "R1250GS"],
  "캠핑카": ["모터홈", "카라반", "스타리아 캠퍼", "쏠라티 캠핑카"],
  "건설기계": ["굴삭기 02", "미니굴삭기", "휠로더", "지게차"],
  "자재운반장비": ["전동 지게차", "디젤 지게차 3톤", "리치 지게차"],
  "부품 · 용품": ["타이어", "휠", "블랙박스", "브레이크 패드"],
};
// 2026-10-18 「왜 카테고리 없어진거야」: 범위 선택 검색을 기본으로. 이전 검색칸은 `&pcsearch=basic` 비교용
export function bbSearchCatMode() { return typeof window === "undefined" || new URLSearchParams(window.location.search).get("pcsearch") !== "basic"; }

/* 2026-10-18 초톳처럼 PC 카드 제목 아래 한 줄 설명(초톳 12/18 400 #595959) */
export const bbmCategoryDescriptions: Record<string, string> = {
  전체: "승용차부터 트럭·바이크·캠핑카·건설기계·부품까지 모든 차량 매물을 검색할 수 있습니다.",
  중고차: "국산차·수입차·전기차 등 모든 유형의 중고차 매물을 검색할 수 있습니다.",
  국산차: "현대·기아·제네시스 등 국산 중고차 매물을 검색할 수 있습니다.",
  수입차: "벤츠·BMW·아우디 등 수입 중고차 매물을 검색할 수 있습니다.",
  전기차: "전기차·하이브리드 등 친환경 중고차 매물을 검색할 수 있습니다.",
  "트럭 · 특장": "카고·윙바디·냉동탑·덤프 등 모든 형식의 트럭·특장차 매물을 검색할 수 있습니다.",
  바이크: "스쿠터부터 대형 바이크까지 모든 유형의 바이크 매물을 검색할 수 있습니다.",
  캠핑카: "모터홈·카라반·트레일러 매물을 검색할 수 있습니다.",
  건설기계: "굴착기·로더·크레인 등 건설기계 매물을 검색할 수 있습니다.",
  자재운반장비: "지게차 등 자재운반장비 매물을 검색할 수 있습니다.",
  "부품 · 용품": "타이어·휠·튜닝 부품 등 자동차 부품과 용품을 검색할 수 있습니다.",
};
export function bbmCategoryDescription(category: string) {
  return bbmCategoryDescriptions[category] ?? `${category} 매물을 검색할 수 있습니다.`;
}
