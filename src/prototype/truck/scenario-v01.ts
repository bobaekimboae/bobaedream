export type TruckScenarioV01Row = {
  id: string;
  maker: string;
  model: string;
  format: string;
  subtype: string;
  year: number;
  mileage: number;
  load: string;
  price10k: number;
  region: string;
  sellerType: "개인" | "딜러";
  fuel: "디젤" | "전기" | "LPG";
  transmission: "오토" | "수동";
  seats: string;
  image: string;
};

// UI 동작 검증용 가상 매물이다. 실제 판매 차량·가격·주소가 아니다.
export const truckScenarioV01: readonly TruckScenarioV01Row[] = [
  { id: "truck-001", maker: "현대", model: "포터2", format: "카고(화물)트럭", subtype: "경형 트럭 (1톤)", year: 2023, mileage: 28400, load: "1톤", price10k: 2490, region: "경기 수원시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "3인승", image: "icons/body-type/truck.svg" },
  { id: "truck-002", maker: "이스즈", model: "엘프", format: "카고(화물)트럭", subtype: "소형 트럭 (1.1~3.5톤)", year: 2022, mileage: 45100, load: "2.5톤", price10k: 4850, region: "인천 남동구", sellerType: "개인", fuel: "디젤", transmission: "오토", seats: "3인승", image: "icons/body-type/truck.svg" },
  { id: "truck-003", maker: "타타대우", model: "더쎈", format: "카고(화물)트럭", subtype: "중형 트럭 (4~8.5톤)", year: 2021, mileage: 67800, load: "5톤", price10k: 6850, region: "경기 화성시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "3인승", image: "icons/body-type/truck.svg" },
  { id: "truck-004", maker: "현대", model: "엑시언트", format: "카고(화물)트럭", subtype: "대형 트럭 (9톤 이상)", year: 2020, mileage: 92300, load: "11톤", price10k: 13990, region: "충남 천안시", sellerType: "딜러", fuel: "디젤", transmission: "수동", seats: "2인승", image: "icons/body-type/truck.svg" },
  { id: "truck-005", maker: "현대", model: "파비스", format: "윙바디/탑", subtype: "윙바디", year: 2022, mileage: 118000, load: "8.5톤", price10k: 11200, region: "경기 평택시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "3인승", image: "icons/body-type/cargo-van.svg" },
  { id: "truck-006", maker: "타타대우", model: "프리마", format: "윙바디/탑", subtype: "윙바디 파워게이트", year: 2021, mileage: 146000, load: "7.5톤", price10k: 9250, region: "경남 김해시", sellerType: "딜러", fuel: "디젤", transmission: "수동", seats: "3인승", image: "icons/body-type/cargo-van.svg" },
  { id: "truck-007", maker: "벤츠", model: "아테고", format: "윙바디/탑", subtype: "냉동윙", year: 2020, mileage: 183000, load: "5톤", price10k: 11800, region: "부산 강서구", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "3인승", image: "icons/body-type/cargo-van.svg" },
  { id: "truck-008", maker: "이베코", model: "유로카고", format: "윙바디/탑", subtype: "내장탑", year: 2019, mileage: 205000, load: "5톤", price10k: 7200, region: "대구 달서구", sellerType: "개인", fuel: "디젤", transmission: "오토", seats: "3인승", image: "icons/body-type/cargo-van.svg" },
  { id: "truck-009", maker: "현대", model: "카운티", format: "버스", subtype: "버스", year: 2022, mileage: 73000, load: "25인승", price10k: 6800, region: "서울 강서구", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "25인승", image: "icons/body-type/bus.svg" },
  { id: "truck-010", maker: "현대", model: "유니버스", format: "버스", subtype: "기타", year: 2020, mileage: 212000, load: "45인승", price10k: 13900, region: "전북 전주시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "45인승", image: "icons/body-type/bus.svg" },
  { id: "truck-011", maker: "현대", model: "엑시언트", format: "덤프/건설/중기", subtype: "덤프", year: 2021, mileage: 138000, load: "25.5톤", price10k: 15400, region: "충북 청주시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "2인승", image: "heavy/types/heavy_type_dump_v01.png" },
  { id: "truck-012", maker: "타타대우", model: "노부스", format: "덤프/건설/중기", subtype: "레미콘", year: 2018, mileage: 241000, load: "6㎥", price10k: 7200, region: "경기 안성시", sellerType: "개인", fuel: "디젤", transmission: "수동", seats: "2인승", image: "heavy/types/heavy_type_dump_v01.png" },
  { id: "truck-013", maker: "현대", model: "마이티", format: "크레인 형태", subtype: "바가지차", year: 2021, mileage: 86400, load: "3.5톤", price10k: 6990, region: "경기 고양시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "3인승", image: "heavy/types/heavy_type_attachment_v01.png" },
  { id: "truck-014", maker: "이스즈", model: "포워드", format: "크레인 형태", subtype: "사다리차", year: 2020, mileage: 119000, load: "5톤", price10k: 8400, region: "서울 송파구", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "3인승", image: "heavy/types/heavy_type_attachment_v01.png" },
  { id: "truck-015", maker: "스카니아", model: "P시리즈", format: "크레인 형태", subtype: "카고크레인", year: 2019, mileage: 198000, load: "25톤", price10k: 18900, region: "울산 남구", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "2인승", image: "heavy/types/heavy_type_attachment_v01.png" },
  { id: "truck-016", maker: "볼보", model: "FM", format: "탱크로리", subtype: "유류/액상탱크로리", year: 2021, mileage: 176000, load: "24㎘", price10k: 17800, region: "전남 여수시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "2인승", image: "icons/body-type/truck.svg" },
  { id: "truck-017", maker: "현대", model: "파비스", format: "탱크로리", subtype: "살수차", year: 2020, mileage: 133000, load: "16㎘", price10k: 9600, region: "강원 원주시", sellerType: "딜러", fuel: "디젤", transmission: "수동", seats: "3인승", image: "icons/body-type/truck.svg" },
  { id: "truck-018", maker: "현대", model: "쏠라티", format: "캠핑카/캠핑 트레일러", subtype: "캠핑카", year: 2023, mileage: 19400, load: "기타", price10k: 12800, region: "경기 용인시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "4인승", image: "icons/body-type/camper.svg" },
  { id: "truck-019", maker: "벤츠", model: "스프린터", format: "캠핑카/캠핑 트레일러", subtype: "캠핑트레일러", year: 2022, mileage: 32800, load: "7m", price10k: 18900, region: "경기 하남시", sellerType: "개인", fuel: "디젤", transmission: "오토", seats: "4인승", image: "icons/body-type/camper.svg" },
  { id: "truck-020", maker: "현대", model: "마이티", format: "폐기/음식물수송", subtype: "암롤/롤온", year: 2020, mileage: 151000, load: "5톤", price10k: 6700, region: "경기 시흥시", sellerType: "딜러", fuel: "디젤", transmission: "수동", seats: "3인승", image: "icons/body-type/truck.svg" },
  { id: "truck-021", maker: "타타대우", model: "더쎈", format: "폐기/음식물수송", subtype: "음식물수거", year: 2021, mileage: 107000, load: "4톤", price10k: 7450, region: "대전 대덕구", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "3인승", image: "icons/body-type/truck.svg" },
  { id: "truck-022", maker: "기아", model: "봉고3", format: "활어차", subtype: "활어차", year: 2022, mileage: 61200, load: "1톤", price10k: 3180, region: "부산 사하구", sellerType: "개인", fuel: "디젤", transmission: "수동", seats: "3인승", image: "icons/body-type/truck.svg" },
  { id: "truck-023", maker: "현대", model: "마이티", format: "차량견인/운송", subtype: "셀프로더", year: 2021, mileage: 98400, load: "3.5톤", price10k: 7900, region: "경기 남양주시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "3인승", image: "icons/body-type/truck.svg" },
  { id: "truck-024", maker: "볼보", model: "FM", format: "차량견인/운송", subtype: "카케리어", year: 2020, mileage: 231000, load: "5톤", price10k: 16500, region: "충남 아산시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "2인승", image: "icons/body-type/truck.svg" },
  { id: "truck-025", maker: "스카니아", model: "R시리즈", format: "트렉터", subtype: "트렉터", year: 2021, mileage: 344000, load: "6×2", price10k: 15900, region: "인천 중구", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "2인승", image: "icons/body-type/cargo-van.svg" },
  { id: "truck-026", maker: "만(MAN)", model: "TGX", format: "트렉터", subtype: "트렉터", year: 2020, mileage: 398000, load: "6×2", price10k: 13800, region: "부산 강서구", sellerType: "개인", fuel: "디젤", transmission: "오토", seats: "2인승", image: "icons/body-type/cargo-van.svg" },
  { id: "truck-027", maker: "다프(DAF)", model: "XF", format: "트레일러", subtype: "컨테이너 샤시", year: 2021, mileage: 286000, load: "40FT", price10k: 14200, region: "인천 중구", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "2인승", image: "icons/body-type/cargo-van.svg" },
  { id: "truck-028", maker: "볼보", model: "FH", format: "트레일러", subtype: "로우베드/릴리리", year: 2019, mileage: 422000, load: "25톤", price10k: 13200, region: "경남 창원시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "2인승", image: "icons/body-type/cargo-van.svg" },
  { id: "truck-029", maker: "이베코", model: "S-WAY", format: "트레일러", subtype: "윙트레일러", year: 2022, mileage: 197000, load: "14m", price10k: 16900, region: "경기 평택시", sellerType: "딜러", fuel: "디젤", transmission: "오토", seats: "2인승", image: "icons/body-type/cargo-van.svg" },
  { id: "truck-030", maker: "KG모빌리티", model: "렉스턴 스포츠", format: "기타", subtype: "기타", year: 2023, mileage: 33700, load: "기타", price10k: 3380, region: "서울 성동구", sellerType: "개인", fuel: "디젤", transmission: "오토", seats: "5인승", image: "icons/body-type/truck.svg" },
];

export const truckModelsByMaker = truckScenarioV01.reduce<Record<string, string[]>>((catalog, row) => {
  const models = catalog[row.maker] ?? [];
  if (!models.includes(row.model)) catalog[row.maker] = [...models, row.model];
  return catalog;
}, {});
