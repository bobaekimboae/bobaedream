// QF-076: 개발 시안형 필터 선택지·문구 목록. 원본 전수 수집(docs/bbm-filter-spec.json, 2026-09-24) 기준.
// 매물 수는 우리 시안 데이터로 계산(bbm-filter-state.ts). 우리 데이터에 없는 선택지는 0대·비활성.
import type { BbmCheckKey, BbmRangeKey } from "./bbm-filter-state";

export type BbmFilterMode = "expand" | "modal";
export type BbmFilterItem = { label: string; mode: BbmFilterMode; modalTitle?: string; checkKey?: BbmCheckKey; rangeKey?: BbmRangeKey; columns?: 1 | 2 };

export const bbmCheckOptions: Record<BbmCheckKey, string[]> = {
  bodyType: ["승용", "SUV", "RV", "쿠페", "컨버터블", "승합", "화물", "기타"],
  carClass: ["경형", "소형", "준중형", "중형", "대형"],
  region: ["서울", "부산", "대구", "인천", "광주", "전남광주", "대전", "울산", "세종", "경기", "충북", "충남", "전남", "경북", "경남", "제주", "강원", "전북"],
  complex: ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "충북", "충남", "전남", "경북", "경남", "제주", "강원", "전북"],
  seats: ["2인승", "3인승", "4인승", "5인승", "6인승", "7인승", "8인승", "9인승", "10인승", "11인승", "15인승~"],
  drive: ["전륜", "후륜", "4륜"],
  history: ["성능기록부", "보험이력", "차량 이력 공개"],
  sellerKind: ["딜러", "개인", "인증차량", "브랜드인증 딜러", "리스렌트제휴", "실차주"],
  saleType: ["일반", "운용리스", "금융리스", "렌트승계"],
  exteriorColor: ["흰색", "검정색", "쥐색", "청색", "은색", "은회색", "빨간색", "진주색", "노란색", "갈색", "하늘색", "녹색", "담녹색", "연금색", "명은색", "주황색", "연두색", "자주색", "은하색", "갈대색", "청옥색", "분홍색", "검정투톤", "보라색", "흰색투톤", "은색투톤", "금색", "진주투톤", "갈색투톤", "금색투톤", "기타"],
  seatColor: ["검정색 계열", "갈색 계열", "베이지 계열", "회색 계열", "노란색 계열", "녹색 계열", "빨간색 계열", "주황색 계열", "청색 계열", "흰색 계열", "기타"],
  seatFinish: ["천연가죽", "인조가죽", "직물", "알칸타라", "혼합", "기타"],
  fuel: ["가솔린", "디젤", "LPG", "LPG 일반인구입", "가솔린/LPG겸용", "가솔린 하이브리드", "LPG 하이브리드", "디젤 하이브리드", "CNG", "전기", "기타"],
  transmission: ["자동", "수동"],
  options: [],
  features: ["사진", "영상", "제조사 보증", "사고차", "병행수입"],
};

// 옵션(모달 제목 "차량 옵션"): 왼쪽 세로 탭 6개 + 섹션별 목록, 아래 [취소] + [선택완료]
export const bbmOptionGroups: Array<[string, string[]]> = [
  ["외관", ["선루프", "파노라마선루프", "알루미늄휠", "전동사이드미러", "HID램프", "LED헤드램프", "어댑티드헤드램프", "LED리어램프", "데이라이트", "하이빔어시스트", "압축도어", "자동슬라이딩도어", "전동사이드스탭", "루프랙"]],
  ["내장", ["가죽시트", "전동시트(운전석)", "전동시트(동승석)", "열선시트(앞좌석)", "열선시트(뒷좌석)", "통풍시트", "메모리시트", "폴딩시트", "마사지시트", "워크인시트", "요추받침", "하이패스룸미러", "ECM룸미러", "뒷좌석에어벤트", "패들쉬프트", "전동햇빛가리개", "엠비언트라이트"]],
  ["안전", ["동승석에어백", "측면에어백", "커튼에어백", "무릎에어백", "승객감지에어백", "브레이크잠김방지(ABS)", "차체자세제어장치(ESC)", "후방센서", "전방센서", "후방카메라", "전방카메라", "어라운드뷰", "타이어공기압감지(TPMS)", "차선이탈경보(LDWS)", "자동긴급제동", "전자제어서스펜션(ECS)", "후측방경보", "미끄럼방지(TCS)"]],
  ["편의", ["스마트키", "열선핸들", "리모컨핸들", "자동에어컨", "좌우독립에어컨", "오토라이트", "크루즈컨트롤", "스마트크루즈컨트롤", "스탑앤고", "전동트렁크", "스마트트렁크", "전자주차브레이크(EPB)", "경사로밀림방지", "헤드업디스플레이(HUD)", "무선충전", "자동주차", "냉장고"]],
  ["멀티미디어", ["네비게이션(순정)", "네비게이션(비순정)", "USB", "AUX", "블루투스", "MP3", "DMB", "CD플레이어", "AV시스템", "뒷좌석TV", "텔레매틱스", "스마트폰미러링"]],
  ["튜닝", ["흡기", "배기", "ECU맵핑", "터보차저", "슈퍼차저", "NA튜닝", "스트럿바", "엔진스왑", "브레이크", "스포일러", "에어로파츠", "휠/타이어", "서스펜션", "오디오"]],
];
bbmCheckOptions.options = bbmOptionGroups.flatMap(([, list]) => list);

// 범위형 단위·구간 칩
export const bbmRangePresets: Partial<Record<BbmRangeKey, { unit: string; presets: string[] }>> = {
  year: { unit: "년", presets: ["~1년", "~2년", "~3년", "~4년", "~5년", "6년~"] },
  mileage: { unit: "km", presets: ["~5천km", "5천~1만km", "1~2만km", "2~3만km", "3~5만km", "5~10만km", "10~20만km", "20만km~"] },
  price: { unit: "만원", presets: ["전체", "1천만원", "2천만원", "3천만원", "4천만원", "5천만원", "6천만원", "7천만원", "8천만원", "9천만원~"] },
  power: { unit: "마력", presets: ["~100ps", "100~150ps", "150~200ps", "200~250ps", "250~300ps", "300~400ps", "400~500ps", "500ps~"] },
  efficiency: { unit: "km/L", presets: ["~9 km/L", "9~12 km/L", "12~14 km/L", "14~16 km/L", "16 km/L~"] },
  displacement: { unit: "cc", presets: ["~999 cc", "1,000~1,599 cc", "1,600~1,999 cc", "2,000~2,499 cc", "2,500~2,999 cc", "3,000~3,499 cc", "3,500~3,999 cc", "4,000 cc~"] },
  weight: { unit: "kg", presets: ["~1,000 kg", "1,000~1,200 kg", "1,200~1,400 kg", "1,400~1,600 kg", "1,600~1,800 kg", "1,800~2,000 kg", "2,000~2,300 kg", "2,300 kg~"] },
  evRange: { unit: "km", presets: ["~100 km", "100~200 km", "200~300 km", "300~400 km", "400~500 km", "500 km~"] },
};

export const bbmAdPeriods = ["전체", "1일", "2일", "3일", "4일", "5일", "6일", "1주일", "2주일"];

// PC 사이드바 항목 순서·열림 방식(원본 27개. 1번은 QF-067 "제조사 · 모델 · 등급"으로 바꿔 맨 위)
export const bbmSidebarItems: BbmFilterItem[] = [
  { label: "바디타입", mode: "expand", checkKey: "bodyType" },
  { label: "차급", mode: "expand", checkKey: "carClass" },
  { label: "연식", mode: "expand", rangeKey: "year" },
  { label: "주행거리", mode: "expand", rangeKey: "mileage" },
  { label: "가격", mode: "expand", rangeKey: "price" },
  { label: "지역", mode: "modal", checkKey: "region", columns: 2 },
  { label: "매매단지", mode: "modal", checkKey: "complex", columns: 2 },
  { label: "인승", mode: "modal", checkKey: "seats" },
  { label: "구동방식", mode: "modal", checkKey: "drive" },
  { label: "성능 · 보험", mode: "modal", checkKey: "history" },
  { label: "판매자 구분", mode: "modal", checkKey: "sellerKind" },
  { label: "판매방식", mode: "modal", checkKey: "saleType" },
  { label: "외부색상", mode: "modal", checkKey: "exteriorColor" },
  { label: "시트색상", mode: "modal", modalTitle: "시트", checkKey: "seatColor" },
  { label: "연료", mode: "modal", checkKey: "fuel" },
  { label: "변속기", mode: "modal", checkKey: "transmission" },
  { label: "옵션", mode: "modal", modalTitle: "차량 옵션", checkKey: "options" },
  { label: "최고출력", mode: "modal", rangeKey: "power" },
  { label: "연비", mode: "modal", rangeKey: "efficiency" },
  { label: "배기량", mode: "modal", rangeKey: "displacement" },
  { label: "공차중량", mode: "modal", rangeKey: "weight" },
  { label: "크기", mode: "modal" },
  { label: "전기차 주행 가능 거리", mode: "modal", rangeKey: "evRange" },
  { label: "차량 특징", mode: "modal", modalTitle: "차량특징", checkKey: "features" },
  { label: "광고기간", mode: "modal" },
  { label: "차량번호 / 판매자", mode: "expand" },
];
