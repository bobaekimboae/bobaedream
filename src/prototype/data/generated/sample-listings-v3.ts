// 과쯔 샘플 매물 v3.
// 화면/퀵필터 구조를 바꾸지 않고, 기존 Car 호환 필드와 필터 그룹핑용 상세 값을 함께 제공한다.
// 모든 값과 사진은 데모용이며 실제 판매 매물이 아니다.

export type AccidentStatus = "무사고" | "단순교환" | "사고 이력";
export type SellerKind = "딜러" | "개인";
export type PriceEvaluation = "저렴" | "적정" | "높음";

export type SampleListingV3 = {
  id: number;
  listingNo: string;
  maker: string;
  modelGroup: string;
  sellerType: SellerKind;
  image: string;
  imageFit: "cover";
  title: string;
  trim: string;
  specs: string[];
  price: string;
  place: string;
  views: number;
  dealer: string;
  stock: number;
  posted: string;
  photos: number;
  badges: Array<"브랜드인증" | "제조사보증" | "1인소유" | "가격인하" | "인증중고차">;
  filter: {
    year: number;
    seats: string;
    condition: "중고";
    mileage: number;
    owners: string;
    transmission: string;
    fuel: string;
    color: string;
    origin: string;
    body: string;
    video: boolean;
  };
  vehicle: {
    manufacturer: string;
    model: string;
    generation: string;
    grade: string;
    bodyType: string;
    carClass: string;
    fuel: string;
  };
  budget: {
    priceTenThousandWon: number;
    marketPriceTenThousandWon: number;
    priceEvaluation: PriceEvaluation;
    firstRegistrationYear: number;
    firstRegistrationMonth: number;
    modelYear: number;
    mileageKm: number;
  };
  trust: {
    accidentStatus: AccidentStatus;
    totalLossHistory: boolean;
    floodHistory: boolean;
    ownerCount: number;
    rentalOrCommercialHistory: "없음" | "렌터카" | "영업용";
    manufacturerWarrantyRemaining: boolean;
    manufacturerWarrantyMonths: number;
    records: {
      inspectionRecordPublished: boolean;
      insuranceHistoryPublished: boolean;
      vehicleHistoryPublished: boolean;
    };
    parallelImport: boolean;
  };
  transaction: {
    region: string;
    complex: string;
    sellerKind: SellerKind;
    saleMethods: Array<"배송" | "방문 구매" | "직접 거래" | "탁송 상담">;
  };
  equipment: {
    transmission: string;
    drivetrain: string;
    seats: number;
    exteriorColor: string;
    seatColor: string;
    seatFinish: string;
    options: string[];
  };
  dimensions: {
    maxPowerPs: number;
    efficiency: number;
    efficiencyUnit: "km/L" | "km/kWh";
    displacementCc: number | null;
    curbWeightKg: number;
    lengthMm: number;
    widthMm: number;
    heightMm: number;
    evRangeKm: number | null;
    batteryHealthPercent: number | null;
    dcFastChargeKw: number | null;
  };
  listing: {
    registeredAt: string;
    priceReduced: boolean;
    discountAvailable: boolean;
    photoCount: number;
    hasVideo: boolean;
    sellerName: string;
    dealerInventoryCount: number;
  };
};

type Profile = {
  count: number;
  maker: string;
  model: string;
  generation: string;
  trims: string[];
  bodyType: "세단" | "SUV" | "MPV";
  carClass: string;
  fuel: "가솔린" | "디젤" | "하이브리드" | "전기";
  minYear: number;
  basePrice: number;
  origin: string;
  transmission: string;
  drivetrain: string[];
  seats: number;
  colors: string[];
  seatColors: string[];
  seatFinishes: string[];
  options: string[];
  maxPowerPs: number;
  efficiency: number;
  efficiencyUnit: "km/L" | "km/kWh";
  displacementCc: number | null;
  curbWeightKg: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  evRangeKm: number | null;
  dcFastChargeKw: number | null;
  image: string;
};

const profiles: Profile[] = [
  { count: 20, maker: "현대", model: "그랜저", generation: "GN7", trims: ["프리미엄", "익스클루시브", "캘리그래피"], bodyType: "세단", carClass: "준대형", fuel: "하이브리드", minYear: 2023, basePrice: 4520, origin: "국산", transmission: "6단 자동", drivetrain: ["전륜구동"], seats: 5, colors: ["어비스 블랙 펄", "세레니티 화이트 펄", "녹턴 그레이 메탈릭"], seatColors: ["블랙", "브라운", "베이지"], seatFinishes: ["천연가죽", "나파가죽"], options: ["현대 스마트센스", "파노라마 선루프", "헤드업 디스플레이"], maxPowerPs: 230, efficiency: 18.0, efficiencyUnit: "km/L", displacementCc: 1598, curbWeightKg: 1725, lengthMm: 5035, widthMm: 1880, heightMm: 1460, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/hyundai-grandeur-gn7.webp" },
  { count: 15, maker: "현대", model: "아반떼", generation: "CN7", trims: ["스마트", "모던", "인스퍼레이션"], bodyType: "세단", carClass: "준중형", fuel: "가솔린", minYear: 2021, basePrice: 2680, origin: "국산", transmission: "CVT", drivetrain: ["전륜구동"], seats: 5, colors: ["아마존 그레이", "아틀라스 화이트", "어비스 블랙 펄"], seatColors: ["블랙", "그레이"], seatFinishes: ["인조가죽", "천연가죽"], options: ["현대 스마트센스", "통풍시트", "내비게이션"], maxPowerPs: 123, efficiency: 15.3, efficiencyUnit: "km/L", displacementCc: 1598, curbWeightKg: 1265, lengthMm: 4710, widthMm: 1825, heightMm: 1420, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/hyundai-avante-cn7.webp" },
  { count: 10, maker: "현대", model: "쏘나타", generation: "DN8", trims: ["프리미엄", "익스클루시브", "인스퍼레이션"], bodyType: "세단", carClass: "중형", fuel: "가솔린", minYear: 2020, basePrice: 3360, origin: "국산", transmission: "8단 자동", drivetrain: ["전륜구동"], seats: 5, colors: ["세레니티 화이트 펄", "녹턴 그레이", "어비스 블랙 펄"], seatColors: ["블랙", "네이비"], seatFinishes: ["인조가죽", "천연가죽"], options: ["현대 스마트센스", "BOSE 사운드", "원격 스마트 주차"], maxPowerPs: 160, efficiency: 12.6, efficiencyUnit: "km/L", displacementCc: 1999, curbWeightKg: 1475, lengthMm: 4910, widthMm: 1860, heightMm: 1445, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/hyundai-sonata-dn8.webp" },
  { count: 15, maker: "현대", model: "싼타페", generation: "MX5", trims: ["프레스티지", "캘리그래피", "블랙잉크"], bodyType: "SUV", carClass: "중형 SUV", fuel: "하이브리드", minYear: 2024, basePrice: 4920, origin: "국산", transmission: "6단 자동", drivetrain: ["전륜구동", "사륜구동"], seats: 6, colors: ["크리미 화이트 펄", "페블 블루 펄", "어비스 블랙 펄"], seatColors: ["블랙", "피칸 브라운"], seatFinishes: ["천연가죽", "나파가죽"], options: ["현대 스마트센스", "듀얼 와이드 선루프", "빌트인 캠 2"], maxPowerPs: 235, efficiency: 15.5, efficiencyUnit: "km/L", displacementCc: 1598, curbWeightKg: 1990, lengthMm: 4830, widthMm: 1900, heightMm: 1720, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/hyundai-santafe-mx5.webp" },
  { count: 10, maker: "현대", model: "투싼", generation: "NX4", trims: ["모던", "프리미엄", "인스퍼레이션"], bodyType: "SUV", carClass: "준중형 SUV", fuel: "가솔린", minYear: 2021, basePrice: 3240, origin: "국산", transmission: "7단 DCT", drivetrain: ["전륜구동", "사륜구동"], seats: 5, colors: ["딥 씨", "크리미 화이트 펄", "타이탄 그레이"], seatColors: ["블랙", "그레이"], seatFinishes: ["인조가죽", "천연가죽"], options: ["현대 스마트센스", "파노라마 선루프", "서라운드 뷰"], maxPowerPs: 180, efficiency: 12.5, efficiencyUnit: "km/L", displacementCc: 1598, curbWeightKg: 1570, lengthMm: 4640, widthMm: 1865, heightMm: 1665, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/hyundai-tucson-nx4.webp" },
  { count: 5, maker: "현대", model: "아이오닉 5", generation: "NE", trims: ["익스클루시브", "프레스티지", "E-Lite"], bodyType: "SUV", carClass: "중형 전기 SUV", fuel: "전기", minYear: 2022, basePrice: 5180, origin: "국산", transmission: "단속 감속기", drivetrain: ["후륜구동", "사륜구동"], seats: 5, colors: ["아틀라스 화이트", "사이버 그레이 메탈릭", "어비스 블랙 펄"], seatColors: ["블랙", "라이트 그레이"], seatFinishes: ["바이오 인조가죽", "천연가죽"], options: ["고속도로 주행 보조 2", "비전 루프", "디지털 사이드 미러"], maxPowerPs: 229, efficiency: 5.2, efficiencyUnit: "km/kWh", displacementCc: null, curbWeightKg: 2060, lengthMm: 4655, widthMm: 1890, heightMm: 1605, evRangeKm: 485, dcFastChargeKw: 240, image: "listings/v3/hyundai-ioniq5-ne.webp" },
  { count: 15, maker: "기아", model: "카니발", generation: "KA4", trims: ["노블레스", "시그니처", "그래비티"], bodyType: "MPV", carClass: "대형 MPV", fuel: "디젤", minYear: 2021, basePrice: 4650, origin: "국산", transmission: "8단 자동", drivetrain: ["전륜구동"], seats: 9, colors: ["스노우 화이트 펄", "오로라 블랙 펄", "판테라 메탈"], seatColors: ["새들 브라운", "코튼 베이지", "블랙"], seatFinishes: ["가죽", "나파가죽"], options: ["드라이브 와이즈", "듀얼 선루프", "후석 엔터테인먼트"], maxPowerPs: 194, efficiency: 13.1, efficiencyUnit: "km/L", displacementCc: 2151, curbWeightKg: 2095, lengthMm: 5155, widthMm: 1995, heightMm: 1775, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/kia-carnival-ka4.webp" },
  { count: 15, maker: "기아", model: "쏘렌토", generation: "MQ4", trims: ["프레스티지", "노블레스", "시그니처"], bodyType: "SUV", carClass: "중형 SUV", fuel: "하이브리드", minYear: 2021, basePrice: 4480, origin: "국산", transmission: "6단 자동", drivetrain: ["전륜구동", "사륜구동"], seats: 6, colors: ["인터스텔라 그레이", "스노우 화이트 펄", "오로라 블랙 펄"], seatColors: ["블랙", "올리브 브라운"], seatFinishes: ["가죽", "나파가죽"], options: ["드라이브 와이즈", "헤드업 디스플레이", "BOSE 사운드"], maxPowerPs: 235, efficiency: 15.7, efficiencyUnit: "km/L", displacementCc: 1598, curbWeightKg: 1885, lengthMm: 4815, widthMm: 1900, heightMm: 1695, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/kia-sorento-mq4.webp" },
  { count: 10, maker: "기아", model: "스포티지", generation: "NQ5", trims: ["프레스티지", "노블레스", "시그니처"], bodyType: "SUV", carClass: "준중형 SUV", fuel: "가솔린", minYear: 2022, basePrice: 3380, origin: "국산", transmission: "7단 DCT", drivetrain: ["전륜구동", "사륜구동"], seats: 5, colors: ["스노우 화이트 펄", "그래비티 그레이", "퓨전 블랙"], seatColors: ["블랙", "네이비 그레이"], seatFinishes: ["인조가죽", "가죽"], options: ["드라이브 와이즈", "파노라마 선루프", "서라운드 뷰"], maxPowerPs: 180, efficiency: 12.5, efficiencyUnit: "km/L", displacementCc: 1598, curbWeightKg: 1555, lengthMm: 4660, widthMm: 1865, heightMm: 1660, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/kia-sportage-nq5.webp" },
  { count: 10, maker: "기아", model: "K5", generation: "DL3", trims: ["프레스티지", "노블레스", "시그니처"], bodyType: "세단", carClass: "중형", fuel: "가솔린", minYear: 2020, basePrice: 3210, origin: "국산", transmission: "8단 자동", drivetrain: ["전륜구동"], seats: 5, colors: ["오로라 블랙 펄", "스노우 화이트 펄", "인터스텔라 그레이"], seatColors: ["블랙", "새들 브라운"], seatFinishes: ["인조가죽", "가죽"], options: ["드라이브 와이즈", "헤드업 디스플레이", "KRELL 사운드"], maxPowerPs: 160, efficiency: 13.0, efficiencyUnit: "km/L", displacementCc: 1999, curbWeightKg: 1460, lengthMm: 4905, widthMm: 1860, heightMm: 1445, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/kia-k5-dl3.webp" },
  { count: 10, maker: "제네시스", model: "G80", generation: "RG3", trims: ["2.5T", "2.5T 스포츠 패키지", "3.5T AWD"], bodyType: "세단", carClass: "대형", fuel: "가솔린", minYear: 2021, basePrice: 6720, origin: "국산", transmission: "8단 자동", drivetrain: ["후륜구동", "사륜구동"], seats: 5, colors: ["한라산 그린", "비크 블랙", "우유니 화이트"], seatColors: ["옵시디언 블랙", "하바나 브라운"], seatFinishes: ["천연가죽", "나파가죽"], options: ["파퓰러 패키지", "드라이빙 어시스턴스 패키지", "렉시콘 사운드"], maxPowerPs: 304, efficiency: 10.6, efficiencyUnit: "km/L", displacementCc: 2497, curbWeightKg: 1900, lengthMm: 5005, widthMm: 1925, heightMm: 1465, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/genesis-g80-rg3.webp" },
  { count: 5, maker: "제네시스", model: "GV70", generation: "JK1", trims: ["2.5T", "2.5T 스포츠 패키지", "3.5T 스포츠"], bodyType: "SUV", carClass: "중형 SUV", fuel: "가솔린", minYear: 2022, basePrice: 6210, origin: "국산", transmission: "8단 자동", drivetrain: ["후륜구동", "사륜구동"], seats: 5, colors: ["우유니 화이트", "비크 블랙", "세빌 실버"], seatColors: ["옵시디언 블랙", "바닐라 베이지"], seatFinishes: ["천연가죽", "나파가죽"], options: ["파퓰러 패키지", "드라이빙 어시스턴스 패키지", "파노라마 선루프"], maxPowerPs: 304, efficiency: 10.2, efficiencyUnit: "km/L", displacementCc: 2497, curbWeightKg: 1905, lengthMm: 4715, widthMm: 1910, heightMm: 1630, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/genesis-gv70-jk1.webp" },
  { count: 12, maker: "BMW", model: "5시리즈", generation: "G60", trims: ["520i", "530i xDrive", "523d M 스포츠"], bodyType: "세단", carClass: "준대형", fuel: "가솔린", minYear: 2024, basePrice: 7240, origin: "독일", transmission: "8단 자동", drivetrain: ["후륜구동", "사륜구동"], seats: 5, colors: ["옥사이드 그레이", "알파인 화이트", "블랙 사파이어"], seatColors: ["블랙", "에스프레소 브라운"], seatFinishes: ["베간자", "메리노 가죽"], options: ["드라이빙 어시스턴트 프로페셔널", "파킹 어시스턴트 플러스", "하만카돈"], maxPowerPs: 190, efficiency: 12.1, efficiencyUnit: "km/L", displacementCc: 1998, curbWeightKg: 1835, lengthMm: 5060, widthMm: 1900, heightMm: 1515, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/bmw-5-g60.webp" },
  { count: 8, maker: "BMW", model: "3시리즈", generation: "G20", trims: ["320i", "320i M 스포츠", "330e M 스포츠"], bodyType: "세단", carClass: "중형", fuel: "가솔린", minYear: 2020, basePrice: 5480, origin: "독일", transmission: "8단 자동", drivetrain: ["후륜구동", "사륜구동"], seats: 5, colors: ["알파인 화이트", "블랙 사파이어", "브루클린 그레이"], seatColors: ["블랙", "모카"], seatFinishes: ["버네스카 가죽", "센사텍"], options: ["드라이빙 어시스턴트", "파킹 어시스턴트", "하만카돈"], maxPowerPs: 184, efficiency: 11.2, efficiencyUnit: "km/L", displacementCc: 1998, curbWeightKg: 1655, lengthMm: 4715, widthMm: 1825, heightMm: 1440, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/bmw-3-g20.webp" },
  { count: 12, maker: "벤츠", model: "E클래스", generation: "W214", trims: ["E 200 아방가르드", "E 300 4MATIC 익스클루시브", "E 450 4MATIC"], bodyType: "세단", carClass: "준대형", fuel: "가솔린", minYear: 2024, basePrice: 8620, origin: "독일", transmission: "9단 자동", drivetrain: ["후륜구동", "사륜구동"], seats: 5, colors: ["하이테크 실버", "옵시디언 블랙", "폴라 화이트"], seatColors: ["블랙", "마키아토 베이지"], seatFinishes: ["아티코", "나파가죽"], options: ["드라이빙 어시스턴스 패키지", "디지털 라이트", "부메스터 4D"], maxPowerPs: 258, efficiency: 11.6, efficiencyUnit: "km/L", displacementCc: 1999, curbWeightKg: 1900, lengthMm: 4955, widthMm: 1880, heightMm: 1475, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/mercedes-e-w214.webp" },
  { count: 8, maker: "벤츠", model: "C클래스", generation: "W206", trims: ["C 200 아방가르드", "C 300 AMG Line", "C 300 4MATIC"], bodyType: "세단", carClass: "중형", fuel: "가솔린", minYear: 2022, basePrice: 6120, origin: "독일", transmission: "9단 자동", drivetrain: ["후륜구동", "사륜구동"], seats: 5, colors: ["옵시디언 블랙", "폴라 화이트", "하이테크 실버"], seatColors: ["블랙", "시에나 브라운"], seatFinishes: ["아티코", "천연가죽"], options: ["드라이빙 어시스턴스 패키지", "디지털 라이트", "부메스터 사운드"], maxPowerPs: 258, efficiency: 11.3, efficiencyUnit: "km/L", displacementCc: 1999, curbWeightKg: 1765, lengthMm: 4755, widthMm: 1820, heightMm: 1440, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/mercedes-c-w206.webp" },
  { count: 8, maker: "테슬라", model: "모델 Y", generation: "1세대", trims: ["RWD", "Long Range AWD", "Performance"], bodyType: "SUV", carClass: "중형 전기 SUV", fuel: "전기", minYear: 2025, basePrice: 5990, origin: "중국", transmission: "단속 감속기", drivetrain: ["후륜구동", "사륜구동"], seats: 5, colors: ["펄 화이트", "스텔스 그레이", "다이아몬드 블랙"], seatColors: ["블랙", "화이트"], seatFinishes: ["비건 레더"], options: ["오토파일럿", "프리미엄 오디오", "글래스 루프"], maxPowerPs: 347, efficiency: 5.1, efficiencyUnit: "km/kWh", displacementCc: null, curbWeightKg: 1997, lengthMm: 4790, widthMm: 1920, heightMm: 1625, evRangeKm: 476, dcFastChargeKw: 250, image: "listings/v3/tesla-model-y.webp" },
  { count: 6, maker: "렉서스", model: "ES 300h", generation: "7세대", trims: ["Luxury", "Luxury Plus", "Executive"], bodyType: "세단", carClass: "준대형", fuel: "하이브리드", minYear: 2019, basePrice: 6160, origin: "일본", transmission: "e-CVT", drivetrain: ["전륜구동"], seats: 5, colors: ["소닉 티타늄", "소닉 쿼츠", "그래파이트 블랙"], seatColors: ["블랙", "헤이즐"], seatFinishes: ["천연가죽", "세미 아닐린 가죽"], options: ["LSS+", "마크 레빈슨", "파노라마 뷰 모니터"], maxPowerPs: 218, efficiency: 17.2, efficiencyUnit: "km/L", displacementCc: 2487, curbWeightKg: 1680, lengthMm: 4975, widthMm: 1865, heightMm: 1445, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/lexus-es300h-7.webp" },
  { count: 4, maker: "볼보", model: "XC60", generation: "2세대", trims: ["B5 Plus", "B5 Ultimate", "T8 Recharge"], bodyType: "SUV", carClass: "중형 SUV", fuel: "가솔린", minYear: 2021, basePrice: 7020, origin: "스웨덴", transmission: "8단 자동", drivetrain: ["사륜구동"], seats: 5, colors: ["크리스탈 화이트", "오닉스 블랙", "썬더 그레이"], seatColors: ["차콜", "블론드"], seatFinishes: ["천연가죽", "나파가죽"], options: ["파일럿 어시스트", "바워스 앤 윌킨스", "에어 서스펜션"], maxPowerPs: 250, efficiency: 10.1, efficiencyUnit: "km/L", displacementCc: 1969, curbWeightKg: 1975, lengthMm: 4710, widthMm: 1900, heightMm: 1645, evRangeKm: null, dcFastChargeKw: null, image: "listings/v3/volvo-xc60-2.webp" },
  { count: 2, maker: "BYD", model: "아토 3", generation: "1세대", trims: ["Active", "Design"], bodyType: "SUV", carClass: "준중형 전기 SUV", fuel: "전기", minYear: 2025, basePrice: 3290, origin: "중국", transmission: "단속 감속기", drivetrain: ["전륜구동"], seats: 5, colors: ["서프 블루", "스키 화이트", "코스모스 블랙"], seatColors: ["블랙", "네이비"], seatFinishes: ["비건 레더"], options: ["어댑티브 크루즈", "파노라마 선루프", "360도 카메라"], maxPowerPs: 204, efficiency: 4.7, efficiencyUnit: "km/kWh", displacementCc: null, curbWeightKg: 1750, lengthMm: 4455, widthMm: 1875, heightMm: 1615, evRangeKm: 321, dcFastChargeKw: 88, image: "listings/v3/byd-atto3.webp" },
];

const regions = [
  ["서울", "장한평 매매단지"], ["경기", "수원 도이치오토월드"], ["인천", "엠파크"], ["부산", "반여 자동차매매단지"],
  ["대구", "동촌 자동차매매단지"], ["대전", "오토월드"], ["광주", "서부 자동차매매단지"], ["경남", "창원 자동차매매단지"],
] as const;
const dealerNames = ["한길모터스 김도윤", "정우자동차 박서준", "카온 이지훈", "드림오토 김민재", "프라임모터스 최유진", "오토플러스 정하늘"];
const exteriorColorLabels: Record<string, string> = {
  "어비스 블랙 펄": "검정", "오로라 블랙 펄": "검정", "퓨전 블랙": "검정", "비크 블랙": "검정", "블랙 사파이어": "검정",
  "옵시디언 블랙": "검정", "그래파이트 블랙": "검정", "오닉스 블랙": "검정", "코스모스 블랙": "검정", "다이아몬드 블랙": "검정",
  "세레니티 화이트 펄": "흰색", "아틀라스 화이트": "흰색", "크리미 화이트 펄": "흰색", "스노우 화이트 펄": "흰색",
  "우유니 화이트": "흰색", "알파인 화이트": "흰색", "폴라 화이트": "흰색", "펄 화이트": "흰색", "소닉 쿼츠": "흰색",
  "크리스탈 화이트": "흰색", "스키 화이트": "흰색", "소닉 티타늄": "은색", "하이테크 실버": "은색", "세빌 실버": "은색",
};

const priceEvaluation = (price: number, marketPrice: number): PriceEvaluation => {
  const ratio = price / marketPrice;
  return ratio <= 0.96 ? "저렴" : ratio >= 1.04 ? "높음" : "적정";
};

let globalIndex = 0;
export const sampleListingsV3: SampleListingV3[] = profiles.flatMap((profile, profileIndex) =>
  Array.from({ length: profile.count }, (_, serial) => {
    const index = globalIndex++;
    const id = 3001 + index;
    const year = profile.minYear + ((serial * 3 + profileIndex) % (2026 - profile.minYear + 1));
    const month = ((serial * 5 + profileIndex) % 12) + 1;
    const modelYear = Math.min(2027, year + (serial % 5 === 0 ? 1 : 0));
    const age = Math.max(0, 2026 - year);
    const mileage = Math.max(1200, age * 11200 + 2800 + ((serial * 1379 + profileIndex * 811) % 14500));
    const depreciation = Math.max(0.43, 1 - age * 0.075 - mileage / 1_500_000);
    const marketPrice = Math.round((profile.basePrice * depreciation) / 10) * 10;
    const priceOffset = [-0.055, -0.025, 0, 0.018, 0.047][(serial + profileIndex) % 5];
    const price = Math.max(650, Math.round((marketPrice * (1 + priceOffset)) / 10) * 10);
    const trim = profile.trims[serial % profile.trims.length];
    const exteriorColor = profile.colors[(serial * 2 + profileIndex) % profile.colors.length];
    const seatColor = profile.seatColors[(serial + profileIndex) % profile.seatColors.length];
    const seatFinish = profile.seatFinishes[(serial + profileIndex) % profile.seatFinishes.length];
    const drivetrain = profile.drivetrain[(serial + profileIndex) % profile.drivetrain.length];
    const [region, complex] = regions[(serial * 3 + profileIndex) % regions.length];
    const sellerKind: SellerKind = index % 5 === 0 ? "개인" : "딜러";
    const sellerName = sellerKind === "개인" ? "개인판매자" : dealerNames[(serial + profileIndex) % dealerNames.length];
    const ownerCount = 1 + ((serial + profileIndex) % 3);
    const totalLossHistory = index > 0 && index % 97 === 0;
    const floodHistory = index === 177;
    const accidentStatus: AccidentStatus = totalLossHistory || floodHistory || index % 13 === 0 ? "사고 이력" : index % 4 === 0 ? "단순교환" : "무사고";
    const warrantyMonths = year >= 2025 ? 24 - (serial % 10) : year === 2024 ? 6 + (serial % 8) : 0;
    const priceReduced = (serial + profileIndex) % 4 === 0;
    const discountAvailable = (serial + profileIndex) % 5 === 0;
    const hasVideo = (serial + profileIndex) % 3 === 0;
    const photoCount = 12 + ((serial * 3 + profileIndex) % 24);
    const dealerInventoryCount = sellerKind === "개인" ? 1 : 4 + ((serial * 7 + profileIndex) % 38);
    const batteryHealthPercent = profile.fuel === "전기" ? Math.max(87, 100 - age * 2 - (serial % 4)) : null;
    const badges: SampleListingV3["badges"] = [
      ...(sellerKind === "딜러" ? ["인증중고차" as const] : []),
      ...(warrantyMonths > 0 ? ["제조사보증" as const] : []),
      ...(ownerCount === 1 ? ["1인소유" as const] : []),
      ...(priceReduced ? ["가격인하" as const] : []),
    ];
    const filterTransmission = profile.transmission.includes("CVT") ? "CVT" : "오토";
    const legacyColor = exteriorColorLabels[exteriorColor] ?? (exteriorColor.includes("그레이") ? "회색" : exteriorColor.includes("블루") || exteriorColor.includes("딥 씨") ? "파랑" : "기타");
    const saleMethods: SampleListingV3["transaction"]["saleMethods"] = sellerKind === "개인"
      ? ["직접 거래", "방문 구매"]
      : index % 2 === 0 ? ["배송", "방문 구매", "탁송 상담"] : ["방문 구매", "탁송 상담"];

    return {
      id,
      listingNo: `GZ-${String(id).padStart(6, "0")}`,
      maker: profile.maker,
      modelGroup: profile.model,
      sellerType: sellerKind,
      image: profile.image,
      imageFit: "cover",
      title: `${profile.maker} ${profile.model} ${profile.generation}`,
      trim,
      specs: [`${year}년${String(month).padStart(2, "0")}월(${modelYear}년형)`, `${mileage.toLocaleString("ko-KR")}km`, profile.fuel, `${profile.maxPowerPs}마력`],
      price: `${price.toLocaleString("ko-KR")} 만원`,
      place: sellerKind === "개인" ? `${region} · 개인 직거래` : `${region} · ${complex}`,
      views: 47 + ((index * 37) % 860),
      dealer: sellerName,
      stock: dealerInventoryCount,
      posted: index % 11 === 0 ? "오늘" : `${(index % 58) + 1}분 전`,
      photos: photoCount,
      badges,
      filter: {
        year,
        seats: `${profile.seats}인승`,
        condition: "중고",
        mileage,
        owners: ownerCount >= 3 ? "3인 이상" : `${ownerCount}인`,
        transmission: filterTransmission,
        fuel: profile.fuel,
        color: legacyColor,
        origin: profile.origin,
        body: profile.bodyType,
        video: hasVideo,
      },
      vehicle: {
        manufacturer: profile.maker,
        model: profile.model,
        generation: profile.generation,
        grade: trim,
        bodyType: profile.bodyType,
        carClass: profile.carClass,
        fuel: profile.fuel,
      },
      budget: {
        priceTenThousandWon: price,
        marketPriceTenThousandWon: marketPrice,
        priceEvaluation: priceEvaluation(price, marketPrice),
        firstRegistrationYear: year,
        firstRegistrationMonth: month,
        modelYear,
        mileageKm: mileage,
      },
      trust: {
        accidentStatus,
        totalLossHistory,
        floodHistory,
        ownerCount,
        rentalOrCommercialHistory: index % 29 === 0 ? "렌터카" : index % 47 === 0 ? "영업용" : "없음",
        manufacturerWarrantyRemaining: warrantyMonths > 0,
        manufacturerWarrantyMonths: warrantyMonths,
        records: {
          inspectionRecordPublished: index % 17 !== 0,
          insuranceHistoryPublished: index % 19 !== 0,
          vehicleHistoryPublished: index % 23 !== 0,
        },
        parallelImport: profile.origin !== "국산" && profile.maker !== "BYD" && index % 71 === 0,
      },
      transaction: {
        region,
        complex: sellerKind === "개인" ? "개인 직거래" : complex,
        sellerKind,
        saleMethods,
      },
      equipment: {
        transmission: profile.transmission,
        drivetrain,
        seats: profile.seats,
        exteriorColor,
        seatColor,
        seatFinish,
        options: [...profile.options, serial % 2 === 0 ? "전동 트렁크" : "스마트 크루즈 컨트롤"],
      },
      dimensions: {
        maxPowerPs: profile.maxPowerPs,
        efficiency: Number((profile.efficiency - age * 0.04).toFixed(1)),
        efficiencyUnit: profile.efficiencyUnit,
        displacementCc: profile.displacementCc,
        curbWeightKg: profile.curbWeightKg,
        lengthMm: profile.lengthMm,
        widthMm: profile.widthMm,
        heightMm: profile.heightMm,
        evRangeKm: profile.evRangeKm,
        batteryHealthPercent,
        dcFastChargeKw: profile.dcFastChargeKw,
      },
      listing: {
        registeredAt: `2026-09-${String(1 + (index % 24)).padStart(2, "0")}`,
        priceReduced,
        discountAvailable,
        photoCount,
        hasVideo,
        sellerName,
        dealerInventoryCount,
      },
    };
  }),
);

export const sampleListingsV3Meta = {
  version: 3,
  generatedAt: "2026-09-25",
  total: sampleListingsV3.length,
  domestic: sampleListingsV3.filter((listing) => listing.filter.origin === "국산").length,
  imported: sampleListingsV3.filter((listing) => listing.filter.origin !== "국산").length,
  photoMissing: sampleListingsV3.filter((listing) => !listing.image).length,
} as const;
