// 카테고리별 「상세 정보」 칸 정의(2026-11-01).
// 화면 틀은 초톳 앱 「Thông tin chi tiết」 하나로 두고, 칸만 카테고리마다 바꾼다(노션 「보배드림 매물 등록」 에이전트 의견 반영).
// 초톳 트럭(Xe tải, xe ben) 폼 실측 순서: 카테고리 → 상태(알약) → 제조사 → 적재 → 연식 → 연료 → 원산지 → 색상 → 주행거리(직접 입력).
// 값이 없는 칸은 0 · 「없음」으로 바꾸지 않는다(빈 값 = 미입력).
import truckCatalog from "./truck";

export type FieldKind = "pick" | "pills" | "number" | "text";
export type OptionSource = string[] | "maker" | "model" | "year" | "truckFormat" | "truckSubtype";
export type Field = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  options?: OptionSource;
  unit?: string;
  placeholder?: string;
  /** 다른 칸 값에 따라 보이기(예: 캠핑카 주행거리는 모터홈만) */
  when?: (v: Record<string, string>) => boolean;
  /** 이 칸을 바꾸면 비울 하위 칸 */
  resets?: string[];
};
export type CategoryId = "car" | "ev" | "bike" | "truck" | "heavy" | "camping" | "parts";
export type Category = {
  id: CategoryId;
  name: string;
  /** 제조사 · 모델 목록 출처 */
  catalog: "car" | "bike" | "list";
  makers?: string[];
  fields: Field[];
  /** 매물 제목 · 설명 안내 문구 */
  titleHint: string;
  descHint: string;
  /** 가격 단위 */
  priceUnit: string;
  /** 촬영 키트 사용 여부(부품은 일반 사진만) */
  shootKit: boolean;
};

const COLORS = ["검정", "흰색", "은색", "회색", "쥐색", "진주색", "파랑", "남색", "빨강", "갈색", "베이지", "초록", "노랑", "주황", "기타"];
const CONDITION = ["중고", "신차"];
const FUEL = ["가솔린", "디젤", "LPG", "하이브리드", "플러그인 하이브리드", "전기", "수소"];
const GEAR = ["오토", "수동", "CVT", "DCT"];
const BODY = ["경차", "세단", "해치백", "SUV", "RV", "쿠페", "컨버터블", "왜건", "밴(승합)", "픽업트럭"];

const maker: Field = { key: "maker", label: "제조사", kind: "pick", required: true, options: "maker", resets: ["model"] };
const model: Field = { key: "model", label: "모델", kind: "pick", required: true, options: "model" };
const year: Field = { key: "year", label: "연식", kind: "pick", required: true, options: "year" };
const mileage: Field = { key: "mileage", label: "주행거리", kind: "number", required: true, unit: "km" };
const color: Field = { key: "color", label: "색상", kind: "pick", options: COLORS };

export const CATEGORIES: Category[] = [
  {
    id: "car",
    name: "중고차",
    catalog: "car",
    priceUnit: "만원",
    shootKit: true,
    titleHint: "예) 현대 그랜저 IG 2.5 프리미엄 2020",
    descHint: "옵션, 사고 · 정비 이력, 소모품 교환 등 차량 상태를 적어 주세요.",
    fields: [
      { key: "condition", label: "상태", kind: "pills", required: true, options: CONDITION },
      maker,
      model,
      year,
      { key: "fuel", label: "연료", kind: "pick", required: true, options: FUEL },
      { key: "gear", label: "변속기", kind: "pick", required: true, options: GEAR },
      mileage,
      { key: "body", label: "차종", kind: "pick", options: BODY },
      { key: "seats", label: "승차정원", kind: "pick", options: ["2인승", "4인승", "5인승", "7인승", "9인승", "11인승 이상"] },
      color,
      { key: "accident", label: "사고 이력", kind: "pick", options: ["무사고", "단순 교환", "사고 있음", "확인 안 됨"] },
      { key: "inspection", label: "성능점검기록부", kind: "pills", options: ["있음", "없음"] },
    ],
  },
  {
    id: "ev",
    name: "전기차",
    catalog: "car",
    priceUnit: "만원",
    shootKit: true,
    titleHint: "예) 기아 EV6 롱레인지 2023",
    descHint: "배터리 점검 결과(측정일 · 기관), 충전 케이블 · 어댑터 포함 여부를 적어 주세요.",
    fields: [
      { key: "condition", label: "상태", kind: "pills", required: true, options: CONDITION },
      maker,
      model,
      year,
      mileage,
      { key: "battery", label: "배터리 용량", kind: "number", unit: "kWh" },
      { key: "soh", label: "배터리 상태(SOH)", kind: "number", unit: "%", placeholder: "점검서가 있을 때만" },
      { key: "range", label: "1회 충전 주행거리", kind: "number", unit: "km", placeholder: "인증 기준" },
      { key: "charge", label: "급속 충전 방식", kind: "pick", options: ["DC콤보", "차데모", "NACS", "기타"] },
      { key: "body", label: "차종", kind: "pick", options: BODY },
      color,
    ],
  },
  {
    id: "bike",
    name: "바이크",
    catalog: "bike",
    priceUnit: "만원",
    shootKit: true,
    titleHint: "예) 혼다 PCX 125 2022",
    descHint: "튜닝 · 교환 부품, 전도 이력, 서류(사용신고필증) 상태를 적어 주세요.",
    fields: [
      { key: "condition", label: "상태", kind: "pills", required: true, options: CONDITION },
      { key: "genre", label: "장르", kind: "pick", required: true, options: ["스쿠터", "네이키드", "스포츠", "멀티퍼포즈", "크루저", "클래식", "언더본", "투어러", "오프로드", "전기", "삼륜", "ATV", "기타"] },
      maker,
      model,
      year,
      { key: "cc", label: "배기량", kind: "number", required: true, unit: "cc", when: (v) => v.genre !== "전기" },
      { key: "motor", label: "모터 출력", kind: "number", unit: "kW", when: (v) => v.genre === "전기" },
      mileage,
      { key: "gear", label: "변속기", kind: "pick", options: ["자동(CVT)", "수동", "반자동"] },
      color,
      { key: "tuning", label: "튜닝", kind: "pills", options: ["순정", "튜닝 있음"] },
      { key: "paper", label: "사용신고필증", kind: "pills", options: ["있음", "없음"] },
    ],
  },
  {
    id: "truck",
    name: "트럭/특장차",
    catalog: "list",
    makers: ["현대", "기아", "타타대우", "KG모빌리티", "볼보", "스카니아", "만(MAN)", "벤츠", "이베코", "다프(DAF)", "기타"],
    priceUnit: "만원",
    shootKit: true,
    titleHint: "예) 현대 마이티 2.5톤 카고 2019",
    descHint: "적재함 크기, 특장 장비 제조사 · 연식, 영업용 번호판 포함 여부를 적어 주세요.",
    fields: [
      { key: "condition", label: "상태", kind: "pills", required: true, options: CONDITION },
      { key: "format", label: "형식", kind: "pick", required: true, options: "truckFormat", resets: ["subtype"] },
      { key: "subtype", label: "세부형식", kind: "pick", required: true, options: "truckSubtype" },
      maker,
      { key: "model", label: "모델", kind: "text", required: true, placeholder: "예) 마이티" },
      { key: "load", label: "적재중량", kind: "pick", required: true, options: ["1톤 미만", "1톤", "1.2톤", "1.4톤", "2.5톤", "3.5톤", "4.5톤", "5톤", "8톤", "11톤", "14톤", "15톤", "18톤", "25톤", "25톤 초과"] },
      year,
      { key: "fuel", label: "연료", kind: "pick", required: true, options: ["디젤", "LPG", "전기", "가솔린", "CNG"] },
      { key: "gear", label: "변속기", kind: "pick", options: ["오토", "수동"] },
      mileage,
      { key: "axle", label: "구동 방식", kind: "pick", options: ["4x2", "4x4", "6x2", "6x4", "8x4", "10x4"] },
      { key: "plate", label: "영업용 번호판", kind: "pills", options: ["포함", "미포함"] },
      color,
    ],
  },
  {
    id: "heavy",
    name: "건설기계",
    catalog: "list",
    makers: ["HD건설기계", "디벨론", "볼보CE", "캐터필러", "코마츠", "히타치", "코벨코", "밥캣", "구보타", "JCB", "기타"],
    priceUnit: "만원",
    shootKit: true,
    titleHint: "예) 디벨론 DX55W 휠굴삭기 2020",
    descHint: "부착 장비(브레이커 등), 정비 · 부품 교환 이력, 누유 여부를 적어 주세요.",
    fields: [
      { key: "condition", label: "상태", kind: "pills", required: true, options: CONDITION },
      { key: "type", label: "장비 유형", kind: "pick", required: true, options: ["굴삭기", "휠로더", "불도저", "지게차", "모터그레이더", "롤러", "크레인", "덤프트럭", "콘크리트펌프", "천공기", "기타"] },
      maker,
      { key: "model", label: "모델", kind: "text", required: true, placeholder: "예) DX55W" },
      { key: "year", label: "제작연도", kind: "pick", required: true, options: "year" },
      { key: "hours", label: "가동시간", kind: "number", required: true, unit: "시간" },
      { key: "weight", label: "장비 중량", kind: "number", unit: "톤" },
      { key: "under", label: "하부 형식", kind: "pills", options: ["무한궤도", "타이어"] },
      { key: "registered", label: "건설기계 등록", kind: "pills", options: ["등록", "미등록"] },
    ],
  },
  {
    id: "camping",
    name: "캠핑카",
    catalog: "list",
    makers: ["현대", "기아", "르노코리아", "제일모빌", "벤츠", "포드", "피아트", "코치맨", "아드리아", "하이머", "기타"],
    priceUnit: "만원",
    shootKit: true,
    titleHint: "예) 현대 쏠라티 캠퍼 2021",
    descHint: "침대 · 주방 · 화장실 구성, 배터리 · 인버터 · 태양광 용량, 누수 여부를 적어 주세요.",
    fields: [
      { key: "kind", label: "구분", kind: "pills", required: true, options: ["모터홈", "카라반", "트레일러"], resets: ["mileage"] },
      maker,
      { key: "model", label: "모델", kind: "text", required: true, placeholder: "예) 쏠라티 캠퍼" },
      year,
      { ...mileage, when: (v) => v.kind === "모터홈" },
      { key: "seats", label: "승차 인원", kind: "pick", options: ["2명", "3명", "4명", "5명", "6명", "7명 이상"], when: (v) => v.kind === "모터홈" },
      { key: "berth", label: "취침 인원", kind: "pick", required: true, options: ["1명", "2명", "3명", "4명", "5명", "6명 이상"] },
      { key: "approval", label: "구조변경 승인", kind: "pills", options: ["있음", "없음"], when: (v) => v.kind === "모터홈" },
    ],
  },
  {
    id: "parts",
    name: "부품/용품",
    catalog: "list",
    makers: ["한국타이어", "금호타이어", "넥센타이어", "현대모비스", "미쉐린", "브리지스톤", "BBS", "OZ레이싱", "브렘보", "보쉬", "기타"],
    priceUnit: "원",
    shootKit: false,
    titleHint: "예) 미쉐린 파일럿 스포츠5 245/40R19 4개",
    descHint: "품번, 규격, 구성품 · 수량, 사용 기간과 마모 · 파손 상태를 적어 주세요.",
    fields: [
      { key: "condition", label: "상태", kind: "pills", required: true, options: ["새 상품", "미사용", "중고"] },
      { key: "group", label: "분류", kind: "pick", required: true, options: ["타이어", "휠", "블랙박스 · 내비", "오디오 · 영상", "조명", "외장 부품", "내장 부품", "엔진 · 미션", "브레이크 · 서스펜션", "배터리", "오일 · 케미컬", "바이크 용품", "캠핑 용품", "기타"] },
      { ...maker, label: "브랜드", required: false, resets: [] },
      { key: "fit", label: "적용 차종", kind: "text", placeholder: "예) 그랜저 IG · 범용" },
      { key: "partNo", label: "품번", kind: "text", placeholder: "확인된 것만" },
      { key: "qty", label: "수량", kind: "number", required: true, unit: "개" },
      { key: "deal", label: "거래 방법", kind: "pills", options: ["직거래", "택배"] },
    ],
  },
];

export const categoryOf = (id: string | null | undefined) => CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[0];

/** 지금 보여 줄 칸(조건부 칸 걸러냄) */
export const visibleFields = (cat: Category, v: Record<string, string>) => cat.fields.filter((f) => !f.when || f.when(v));

export const YEARS = (() => {
  const now = new Date().getFullYear() + 1;
  const out: string[] = [];
  for (let y = now; y >= 1980; y -= 1) out.push(String(y));
  out.push("1979년 이전");
  return out;
})();

export const truckFormats = () => truckCatalog.formats;
export const truckSubtypes = (format: string) => truckCatalog.subtypes(format);
