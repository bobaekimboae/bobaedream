// 과쯔 샘플 매물 v3. 필터 선택지 값은 bbm-filter-options.ts와 동일하다.
// 모든 값과 사진은 데모용이며 실제 판매 매물이 아니다.

export type AccidentStatus = "무사고" | "단순교환" | "사고 이력";
export type PriceEvaluation = "저렴" | "적정" | "높음";
export type BodyType = "승용" | "SUV" | "RV" | "쿠페" | "컨버터블" | "승합" | "화물" | "기타";
export type CarClass = "경형" | "소형" | "준중형" | "중형" | "대형";
export type Fuel = "가솔린" | "디젤" | "LPG" | "LPG 일반인구입" | "가솔린/LPG겸용" | "가솔린 하이브리드" | "LPG 하이브리드" | "디젤 하이브리드" | "CNG" | "전기" | "기타";
export type Transmission = "자동" | "수동";
export type Drive = "전륜" | "후륜" | "4륜";
export type SellerKind = "딜러" | "개인" | "인증차량" | "브랜드인증 딜러" | "리스렌트제휴" | "실차주";
export type SaleType = "일반" | "운용리스" | "금융리스" | "렌트승계";

export type SampleListingV3 = {
  id: number; listingNo: string; maker: string; modelGroup: string; sellerType: "딜러" | "개인";
  image: string; imageFit: "cover"; title: string; trim: string; specs: string[]; price: string; place: string;
  views: number; dealer: string; stock: number; posted: string; photos: number;
  badges: Array<"브랜드인증" | "제조사보증" | "1인소유" | "가격인하" | "인증중고차">;
  filter: { year: number; seats: string; condition: "중고"; mileage: number; owners: "1인" | "2인" | "3인 이상"; transmission: Transmission; fuel: Fuel; color: string; origin: string; body: string; video: boolean };
  vehicle: { manufacturer: string; model: string; generation: string; grade: string; bodyType: BodyType; bodyTypeDetail: string; carClass: CarClass; carClassDetail: string; fuel: Fuel };
  budget: { priceTenThousandWon: number; marketPriceTenThousandWon: number; priceEvaluation: PriceEvaluation; firstRegistrationYear: number; firstRegistrationMonth: number; modelYear: number; mileageKm: number };
  trust: { accidentStatus: AccidentStatus; totalLossHistory: boolean; floodHistory: boolean; ownerCount: number; rentalOrCommercialHistory: "없음" | "렌터카" | "영업용"; manufacturerWarrantyRemaining: boolean; manufacturerWarrantyMonths: number; records: { inspectionRecordPublished: boolean; insuranceHistoryPublished: boolean; vehicleHistoryPublished: boolean }; publishedRecords: Array<"성능기록부" | "보험이력" | "차량 이력 공개">; parallelImport: boolean };
  transaction: { region: string; district: string; complex: string; complexRegion: string | null; sellerKind: SellerKind; saleType: SaleType; saleMethods: Array<"배송" | "방문 구매" | "직접 거래" | "탁송 상담"> };
  equipment: { transmission: Transmission; transmissionDetail: string; drivetrain: Drive; seats: number; exteriorColor: string; seatColor: string; seatFinish: string; options: string[] };
  dimensions: { maxPowerPs: number; efficiency: number; efficiencyUnit: "km/L" | "km/kWh"; displacementCc: number | null; curbWeightKg: number; lengthMm: number; widthMm: number; heightMm: number; evRangeKm: number | null; batteryHealthPercent: number | null; dcFastChargeKw: number | null };
  listing: { registeredAt: string; priceReduced: boolean; discountAvailable: boolean; photoCount: number; hasVideo: boolean; sellerName: string; dealerInventoryCount: number };
};

type RawProfile = [number, string, string, string, string, BodyType, string, CarClass, string, string, number, number, number, string, string, string, string, string, string, number, number?, number?];
type ImageSpec = { file: string; color: string };
type Profile = { count: number; maker: string; model: string; generation: string; trims: string[]; bodyType: BodyType; bodyTypeDetail: string; carClass: CarClass; carClassDetail: string; fuels: Fuel[]; yearFrom: number; yearTo: number; basePrice: number; origin: string; transmissions: Transmission[]; transmissionDetail: string; drives: Drive[]; seats: number[]; images: ImageSpec[]; power: number; evRange?: number; fastCharge?: number };

// 구분자는 각각 |이며, 사진은 파일명@필터 외부색상이다. 모델당 최대 6대다.
const rawProfiles: RawProfile[] = [
  [6,"현대","그랜저","GN7","프리미엄|익스클루시브|캘리그래피","승용","세단","대형","준대형 세단","가솔린 하이브리드",2023,2026,4850,"국산","자동","6단 자동","전륜","5","hyundai-grandeur-gn7.webp@쥐색|hyundai-grandeur-gn7-brown.webp@갈색",230],
  [6,"현대","아반떼","CN7","스마트|모던|인스퍼레이션","승용","세단","준중형","준중형 세단","가솔린",2021,2026,2800,"국산","자동","CVT","전륜","5","hyundai-avante-cn7.webp@은색|hyundai-avante-cn7-red.webp@빨간색",123],
  [6,"현대","쏘나타","DN8","프리미엄|익스클루시브|인스퍼레이션","승용","세단","중형","중형 세단","LPG|가솔린",2020,2025,3600,"국산","자동","8단 자동","전륜","5","hyundai-sonata-dn8.webp@흰색",160],
  [6,"현대","싼타페","MX5","프레스티지|캘리그래피|블랙잉크","SUV","중형 SUV","중형","중형 SUV","가솔린 하이브리드",2024,2026,5200,"국산","자동","6단 자동","전륜|4륜","5|6|7","hyundai-santafe-mx5.webp@은회색|hyundai-santafe-mx5-green.webp@녹색",235],
  [6,"현대","투싼","NX4","모던|프리미엄|인스퍼레이션","SUV","준중형 SUV","준중형","준중형 SUV","디젤|가솔린",2021,2026,3650,"국산","자동","7단 DCT","전륜|4륜","5","hyundai-tucson-nx4.webp@청색",184],
  [6,"현대","아이오닉 5","NE","익스클루시브|프레스티지|E-Lite","SUV","전기 크로스오버","중형","중형 전기 SUV","전기",2022,2026,5900,"국산","자동","단속 감속기","후륜|4륜","5","hyundai-ioniq5-ne.webp@진주색",229,485,240],
  [6,"기아","카니발","KA4","노블레스|시그니처|그래비티","RV","대형 MPV","대형","대형 MPV","디젤",2021,2026,4900,"국산","자동","8단 자동","전륜","7|9","kia-carnival-ka4.webp@검정색|kia-carnival-ka4-pearl-two-tone.webp@진주투톤",194],
  [6,"기아","쏘렌토","MQ4","프레스티지|노블레스|시그니처","SUV","중형 SUV","중형","중형 SUV","가솔린 하이브리드",2021,2026,4800,"국산","자동","6단 자동","전륜|4륜","5|6|7","kia-sorento-mq4.webp@명은색|kia-sorento-mq4-brown.webp@갈색",235],
  [6,"기아","스포티지","NQ5","프레스티지|노블레스|시그니처","SUV","준중형 SUV","준중형","준중형 SUV","가솔린",2022,2026,3700,"국산","자동","7단 DCT","전륜|4륜","5","kia-sportage-nq5.webp@흰색투톤|kia-sportage-nq5-orange.webp@주황색",180],
  [6,"기아","K5","DL3","프레스티지|노블레스|시그니처","승용","세단","중형","중형 세단","가솔린|가솔린|가솔린|가솔린|가솔린|LPG 하이브리드",2020,2025,3500,"국산","자동","8단 자동","전륜","5","kia-k5-dl3.webp@검정투톤",160],
  [6,"제네시스","G80","RG3","2.5T|2.5T 스포츠|3.5T AWD","승용","세단","대형","대형 세단","가솔린",2021,2026,7200,"국산","자동","8단 자동","후륜|4륜","5","genesis-g80-rg3.webp@청옥색|genesis-g80-rg3-gold.webp@금색",304],
  [6,"제네시스","GV70","JK1","2.5T|2.5T 스포츠|3.5T 스포츠","SUV","중형 SUV","중형","중형 SUV","가솔린",2022,2026,6600,"국산","자동","8단 자동","후륜|4륜","5","genesis-gv70-jk1.webp@진주색",304],
  [6,"기아","모닝","TA","디럭스|럭셔리|스포츠","승용","해치백","경형","경형 해치백","가솔린",2012,2017,1150,"국산","수동|자동|자동|자동|자동|자동","4단 자동/5단 수동","전륜","5","kia-morning-ta-red.webp@빨간색",78],
  [6,"기아","레이","TAM","럭셔리|프레스티지|시그니처","RV","경형 박스카","경형","경형 RV","LPG 일반인구입",2012,2017,1450,"국산","자동","4단 자동","전륜","5","kia-ray-tam-yellow.webp@노란색",78],
  [6,"현대","캐스퍼","AX1","스마트|모던|인스퍼레이션","SUV","경형 SUV","경형","경형 SUV","가솔린",2022,2026,2050,"국산","자동","4단 자동","전륜","4","hyundai-casper-ax1-khaki.webp@담녹색",100],
  [6,"현대","스타리아","US4","투어러|라운지|카고","승합","대형 승합","대형","대형 승합","디젤|디젤|디젤|디젤|디젤|CNG",2022,2026,4700,"국산","자동","8단 자동","전륜|4륜","8|9|10|11","hyundai-staria-us4-bronze.webp@갈색",177],
  [6,"현대","포터2","HR","슈퍼캡|더블캡|내장탑차","화물","소형 트럭","소형","소형 화물","디젤",2012,2023,2350,"국산","수동|자동|자동|자동|자동|자동","6단 수동/5단 자동","후륜|4륜","3","hyundai-porter2-hr-blue.webp@청색",133],
  [6,"기아","봉고3","PU","킹캡|더블캡|내장탑차","화물","소형 트럭","소형","소형 화물","디젤",2012,2023,2400,"국산","수동|자동|자동|자동|자동|자동","6단 수동/5단 자동","후륜|4륜","3","kia-bongo3-pu-white-blue.webp@기타",133],
  [6,"현대","벨로스터","JS","1.4 터보|1.6 터보|N","쿠페","3도어 해치백","소형","소형 스포츠","가솔린",2019,2022,3100,"국산","수동|자동|자동|자동|자동|자동","7단 DCT/6단 수동","전륜","4","hyundai-veloster-js-orange.webp@주황색",204],
  [6,"기아","EV6","CV","라이트|에어|GT-Line","SUV","전기 크로스오버","중형","중형 전기 SUV","전기",2022,2026,6400,"국산","자동","단속 감속기","후륜|4륜","5","kia-ev6-cv-green.webp@녹색",325,475,240],
  [6,"쉐보레","스파크","M400","LS|LT|프리미어","승용","해치백","경형","경형 해치백","가솔린|가솔린|가솔린|가솔린|가솔린|가솔린/LPG겸용",2016,2022,1250,"국산","수동|자동|자동|자동|자동|자동","CVT/5단 수동","전륜","5","chevrolet-spark-m400-pink.webp@분홍색",75],
  [6,"르노코리아","QM6","HZG","LE|RE|프리미에르","SUV","중형 SUV","중형","중형 SUV","LPG|LPG 일반인구입",2017,2024,3300,"국산","자동","CVT","전륜","5","renault-qm6-hzg-burgundy.webp@자주색",140],
  [6,"KGM","토레스","J100","T5|T7|블랙에디션","SUV","중형 SUV","중형","중형 SUV","가솔린",2023,2026,3800,"국산","자동","6단 자동","전륜|4륜","5","kgm-torres-j100-champagne.webp@연금색",170],
  [6,"쉐보레","말리부","V400","LT|프리미어|레드라인","승용","세단","중형","중형 세단","가솔린",2017,2022,3200,"국산","자동","6단 자동","전륜","5","chevrolet-malibu-v400-purple.webp@보라색",166],
  [6,"현대","포레스트","캠핑카","스탠다드|컴포트|디럭스","기타","캠핑카","대형","대형 특장","디젤",2021,2024,7900,"국산","자동","5단 자동","후륜","4","hyundai-porest-camper-white-beige.webp@흰색투톤",133],
  [5,"현대","넥쏘","FE","모던|프리미엄","SUV","수소전기 SUV","준중형","준중형 수소전기 SUV","기타",2018,2024,6900,"국산","자동","단속 감속기","전륜","5","hyundai-nexo-fe-teal.webp@은하색",163,609,0],
  [5,"기아","K8","GL3","노블레스|시그니처|플래티넘","승용","세단","대형","준대형 세단","가솔린 하이브리드",2022,2026,5100,"국산","자동","6단 자동","전륜","5","kia-k8-gl3-blue.webp@청색",230],
  [5,"현대","팰리세이드","LX2","프레스티지|캘리그래피|VIP","SUV","대형 SUV","대형","대형 SUV","디젤",2020,2024,5300,"국산","자동","8단 자동","전륜|4륜","7|8","hyundai-palisade-lx2-pearl.webp@진주색",202],
  [5,"제네시스","GV80","JX1","2.5T|3.0D|3.5T","SUV","대형 SUV","대형","대형 SUV","가솔린",2021,2025,8800,"국산","자동","8단 자동","후륜|4륜","5|6|7","genesis-gv80-jx1-black.webp@검정색",304],
  [5,"르노코리아","SM6","LFD","LE|RE|프리미에르","승용","세단","중형","중형 세단","LPG",2018,2022,3100,"국산","자동","CVT","전륜","5","renault-sm6-lfd-gray.webp@은회색",140],
  [5,"BMW","5시리즈","G60","520i|530i xDrive|523d M 스포츠","승용","세단","대형","준대형 세단","가솔린",2024,2026,8600,"독일","자동","8단 자동","후륜|4륜","5","bmw-5-g60.webp@은회색|bmw-5-g60-light-blue.webp@하늘색",190],
  [5,"BMW","3시리즈","G20","320i|320i M 스포츠|330e","승용","세단","중형","중형 세단","가솔린",2020,2024,6100,"독일","자동","8단 자동","후륜|4륜","5","bmw-3-g20.webp@흰색",184],
  [5,"벤츠","E클래스","W214","E 200|E 300 4MATIC|E 450 4MATIC","승용","세단","대형","준대형 세단","가솔린",2024,2026,9900,"독일","자동","9단 자동","후륜|4륜","5","mercedes-e-w214.webp@은색|mercedes-e-w214-reed-beige.webp@갈대색",258],
  [5,"벤츠","C클래스","W206","C 200|C 300 AMG Line|C 300 4MATIC","승용","세단","중형","중형 세단","가솔린",2022,2026,7000,"독일","자동","9단 자동","후륜|4륜","5","mercedes-c-w206.webp@검정색",258],
  [5,"테슬라","모델 Y","1세대","RWD|Long Range AWD|Performance","SUV","전기 크로스오버","중형","중형 전기 SUV","전기",2021,2025,6900,"중국","자동","단속 감속기","후륜|4륜","5","tesla-model-y.webp@흰색|tesla-model-y-red.webp@빨간색",347,476,250],
  [5,"렉서스","ES 300h","7세대","Luxury|Luxury Plus|Executive","승용","세단","대형","준대형 세단","가솔린 하이브리드",2019,2023,6700,"일본","자동","e-CVT","전륜","5","lexus-es300h-7.webp@명은색",218],
  [5,"볼보","XC60","2세대","B5 Plus|B5 Ultimate|T8 Recharge","SUV","중형 SUV","중형","중형 SUV","가솔린 하이브리드",2021,2025,7900,"스웨덴","자동","8단 자동","4륜","5","volvo-xc60-2.webp@흰색",250],
  [5,"BYD","아토 3","1세대","Active|Design","SUV","전기 SUV","준중형","준중형 전기 SUV","전기",2025,2026,3400,"중국","자동","단속 감속기","전륜","5","byd-atto3.webp@하늘색",204,321,88],
  [5,"아우디","A6","C8","40 TDI|45 TFSI|50 TDI quattro","승용","세단","대형","준대형 세단","디젤",2019,2023,8300,"독일","자동","7단 S tronic","전륜|4륜","5","audi-a6-c8-gold.webp@금색",204],
  [5,"폭스바겐","골프","Mk8","Premium|Prestige|GTI","승용","해치백","소형","소형 해치백","디젤",2022,2026,4600,"독일","자동","7단 DSG","전륜","5","volkswagen-golf-mk8-lime.webp@연두색",150],
  [5,"MINI","쿠퍼","F56","Cooper|Cooper S|JCW","승용","해치백","소형","소형 해치백","가솔린",2015,2019,4800,"영국","수동|자동|자동|자동|자동","7단 DCT/6단 수동","전륜","4","mini-cooper-f56-yellow-black.webp@금색투톤",192],
  [5,"포르쉐","911","991","Carrera|Carrera S|Turbo","쿠페","2도어 쿠페","중형","스포츠 쿠페","가솔린",2012,2016,19500,"독일","자동","7단 PDK","후륜|4륜","4","porsche-911-991-red.webp@빨간색",400],
  [5,"포르쉐","718 박스터","982","Boxster|Boxster S|GTS 4.0","컨버터블","로드스터","소형","소형 스포츠","가솔린",2017,2021,12500,"독일","자동","7단 PDK","후륜","2","porsche-718-boxster-982-purple.webp@보라색",350],
  [5,"랜드로버","레인지로버 스포츠","L461","D300 Dynamic|P360 Dynamic|P510e","SUV","대형 SUV","대형","대형 SUV","디젤 하이브리드",2023,2026,16500,"영국","자동","8단 자동","4륜","5","landrover-range-rover-sport-l461-brown-black.webp@갈색투톤",300],
  [5,"벤츠","S클래스","W223","S 450 4MATIC|S 500 4MATIC|S 580 4MATIC","승용","세단","대형","대형 세단","가솔린",2021,2025,19000,"독일","자동","9단 자동","4륜","5","mercedes-s-w223-silver-black.webp@은색투톤",381],
];

const profiles: Profile[] = rawProfiles.map(([count,maker,model,generation,trims,bodyType,bodyTypeDetail,carClass,carClassDetail,fuels,yearFrom,yearTo,basePrice,origin,transmissions,transmissionDetail,drives,seats,images,power,evRange,fastCharge]) => ({
  count,maker,model,generation,trims: trims.split("|"),bodyType,bodyTypeDetail,carClass,carClassDetail,fuels: fuels.split("|") as Fuel[],yearFrom,yearTo,basePrice,origin,transmissions: transmissions.split("|") as Transmission[],transmissionDetail,drives: drives.split("|") as Drive[],seats: seats.split("|").map(Number),images: images.split("|").map((value) => { const [file,color] = value.split("@"); return { file: `listings/v3/${file}`, color }; }),power,evRange,fastCharge,
}));

const regions = ["서울","부산","대구","인천","광주","전남광주","대전","울산","세종","경기","충북","충남","전남","경북","경남","제주","강원","전북"] as const;
const districts: Record<string,string> = { 서울:"강남구",부산:"해운대구",대구:"동구",인천:"서구",광주:"서구",전남광주:"광산구",대전:"유성구",울산:"남구",세종:"세종시",경기:"수원시",충북:"청주시",충남:"천안시",전남:"순천시",경북:"구미시",경남:"창원시",제주:"제주시",강원:"원주시",전북:"전주시" };
const complexes: Record<string,string> = { 서울:"장한평 매매단지",부산:"반여 자동차매매단지",대구:"동촌 자동차매매단지",인천:"엠파크",광주:"서부 자동차매매단지",대전:"오토월드",울산:"울산 자동차매매단지",경기:"수원 도이치오토월드",충북:"청주 자동차매매단지",충남:"천안 자동차매매단지",전남:"순천 자동차매매단지",경북:"구미 자동차매매단지",경남:"창원 자동차매매단지",제주:"제주 자동차매매단지",강원:"원주 자동차매매단지",전북:"전주 자동차매매단지" };
const sellerKinds: SellerKind[] = ["딜러","딜러","딜러","개인","인증차량","브랜드인증 딜러","리스렌트제휴","실차주"];
const saleTypes: SaleType[] = ["일반","일반","일반","운용리스","금융리스","렌트승계"];
const seatColors = ["검정색 계열","갈색 계열","베이지 계열","회색 계열","노란색 계열","녹색 계열","빨간색 계열","주황색 계열","청색 계열","흰색 계열","기타"];
const seatFinishes = ["천연가죽","인조가죽","직물","알칸타라","혼합","기타"];
const optionValues = ["선루프","파노라마선루프","LED헤드램프","가죽시트","통풍시트","어라운드뷰","자동긴급제동","스마트크루즈컨트롤","전동트렁크","헤드업디스플레이(HUD)","네비게이션(순정)","블루투스"];
const dealers = ["한길모터스 김도윤","정우자동차 박서준","카온 이지훈","드림오토 김민재","프라임모터스 최유진","오토플러스 정하늘"];

const forcedPrices: Record<string,number[]> = { 모닝:[300],레이:[1000],아반떼:[2000],쏘나타:[3000],그랜저:[4000],GV70:[5000],"3시리즈":[6000],"5시리즈":[7000],E클래스:[8000],S클래스:[9000],"레인지로버 스포츠":[15000],"911":[20000] };
const forcedMileage: Record<string,number> = { "모델 Y":3200,"아이오닉 5":8000,아반떼:15000,쏘나타:25000,그랜저:40000,K5:75000,모닝:150000,포터2:230000 };
const priceEvaluation = (price:number,market:number): PriceEvaluation => price / market <= .96 ? "저렴" : price / market >= 1.04 ? "높음" : "적정";

const derivedDimensions = (profile:Profile,fuel:Fuel) => {
  const electric = fuel === "전기" || fuel === "기타";
  const size = profile.carClass === "경형" ? 0 : profile.carClass === "소형" ? 1 : profile.carClass === "준중형" ? 2 : profile.carClass === "중형" ? 3 : 4;
  const suv = ["SUV","RV","승합","화물","기타"].includes(profile.bodyType);
  return {
    maxPowerPs: profile.power,
    efficiency: electric ? Number((4.4 + (4-size)*.2).toFixed(1)) : Number((17.2-size*1.7-(suv?1.1:0)).toFixed(1)),
    efficiencyUnit: (electric ? "km/kWh" : "km/L") as "km/L" | "km/kWh",
    displacementCc: electric ? null : [998,1497,1598,1998,2998][size],
    curbWeightKg: [960,1260,1510,1830,2180][size] + (suv?120:0),
    lengthMm: [3595,4210,4660,4870,5160][size], widthMm: [1595,1775,1865,1900,1995][size],
    heightMm: suv ? [1605,1660,1690,1725,1840][size] : [1485,1440,1435,1460,1505][size],
    evRangeKm: electric ? (profile.evRange ?? 430) : null,
    dcFastChargeKw: fuel === "전기" ? (profile.fastCharge ?? 150) : null,
  };
};

let globalIndex = 0;
export const sampleListingsV3: SampleListingV3[] = profiles.flatMap((profile,profileIndex) =>
  Array.from({length:profile.count},(_,serial) => {
    const index = globalIndex++; const id = 3001+index;
    const year = profile.yearFrom + (serial % (profile.yearTo-profile.yearFrom+1));
    const month = (index*5)%12+1; const modelYear = Math.min(2026,year+(serial%4===0?1:0)); const age = 2026-year;
    const generatedMileage = Math.min(248000,Math.max(1200,age*11800+2500+((index*977)%12500)));
    const mileage = serial===0 && forcedMileage[profile.model] ? forcedMileage[profile.model] : generatedMileage;
    const depreciation = Math.max(.14,1-age*.067-mileage/2_000_000);
    const marketPrice = Math.max(320,Math.min(20000,Math.round(profile.basePrice*depreciation/10)*10));
    const price = forcedPrices[profile.model]?.[serial] ?? Math.max(300,Math.min(20000,Math.round(marketPrice*(.95+(index%5)*.025)/10)*10));
    const trim = profile.trims[serial%profile.trims.length]; const fuel = profile.fuels[serial%profile.fuels.length];
    const transmission = profile.transmissions[serial%profile.transmissions.length]; const drivetrain = profile.drives[(serial+profileIndex)%profile.drives.length];
    const seats = profile.seats[serial%profile.seats.length]; const image = profile.images[serial%profile.images.length];
    const region = regions[index%regions.length]; const noComplex = region==="전남광주" || region==="세종";
    const sellerKind: SellerKind = noComplex ? "개인" : sellerKinds[index%sellerKinds.length];
    const sellerType: "딜러"|"개인" = sellerKind==="개인" || sellerKind==="실차주" ? "개인" : "딜러";
    const sellerName = sellerType==="개인" ? "개인판매자" : dealers[index%dealers.length]; const ownerCount = index%3+1;
    const accidentStatus: AccidentStatus = index%11===0 ? "사고 이력" : index%4===0 ? "단순교환" : "무사고";
    const inspectionRecordPublished=index%17!==0, insuranceHistoryPublished=index%19!==0, vehicleHistoryPublished=index%23!==0;
    const publishedRecords: SampleListingV3["trust"]["publishedRecords"] = [...(inspectionRecordPublished?["성능기록부" as const]:[]),...(insuranceHistoryPublished?["보험이력" as const]:[]),...(vehicleHistoryPublished?["차량 이력 공개" as const]:[])];
    const warrantyMonths = year>=2024 ? Math.max(3,30-age*8-(serial%4)) : 0; const priceReduced=index%4===0, discountAvailable=index%5===0, hasVideo=index%3===0;
    const photoCount=12+(index%29), dealerInventoryCount=sellerType==="개인"?1:5+(index%43), dimensions=derivedDimensions(profile,fuel);
    const saleMethods: SampleListingV3["transaction"]["saleMethods"] = sellerType==="개인" ? ["직접 거래","방문 구매"] : ["배송","방문 구매","탁송 상담"];
    const badges: SampleListingV3["badges"] = [...(sellerKind==="인증차량"||sellerKind==="브랜드인증 딜러"?["인증중고차" as const]:[]),...(warrantyMonths>0?["제조사보증" as const]:[]),...(ownerCount===1?["1인소유" as const]:[]),...(priceReduced?["가격인하" as const]:[])];
    return {
      id,listingNo:`GZ-${String(id).padStart(6,"0")}`,maker:profile.maker,modelGroup:profile.model,sellerType,image:image.file,imageFit:"cover",title:`${profile.maker} ${profile.model} ${profile.generation}`,trim,
      specs:[`${year}년${String(month).padStart(2,"0")}월(${modelYear}년형)`,`${mileage.toLocaleString("ko-KR")}km`,fuel,`${dimensions.maxPowerPs}마력`],price:`${price.toLocaleString("ko-KR")} 만원`,place:`${region==="전남광주"?"광주":region} ${districts[region]}`,views:45+(index*37)%950,dealer:sellerName,stock:dealerInventoryCount,posted:index%13===0?"오늘":`${index%58+1}분 전`,photos:photoCount,badges,
      filter:{year,seats:seats>=15?"15인승~":`${seats}인승`,condition:"중고",mileage,owners:ownerCount===1?"1인":ownerCount===2?"2인":"3인 이상",transmission,fuel,color:image.color,origin:profile.origin,body:profile.bodyTypeDetail,video:hasVideo},
      vehicle:{manufacturer:profile.maker,model:profile.model,generation:profile.generation,grade:trim,bodyType:profile.bodyType,bodyTypeDetail:profile.bodyTypeDetail,carClass:profile.carClass,carClassDetail:profile.carClassDetail,fuel},
      budget:{priceTenThousandWon:price,marketPriceTenThousandWon:marketPrice,priceEvaluation:priceEvaluation(price,marketPrice),firstRegistrationYear:year,firstRegistrationMonth:month,modelYear,mileageKm:mileage},
      trust:{accidentStatus,totalLossHistory:index>0&&index%97===0,floodHistory:index===177,ownerCount,rentalOrCommercialHistory:index%29===0?"렌터카":index%47===0?"영업용":"없음",manufacturerWarrantyRemaining:warrantyMonths>0,manufacturerWarrantyMonths:warrantyMonths,records:{inspectionRecordPublished,insuranceHistoryPublished,vehicleHistoryPublished},publishedRecords,parallelImport:profile.origin!=="국산"&&profile.maker!=="BYD"&&index%37===0},
      transaction:{region,district:districts[region],complex:noComplex?"해당 없음":complexes[region],complexRegion:noComplex?null:region,sellerKind,saleType:saleTypes[index%saleTypes.length],saleMethods},
      equipment:{transmission,transmissionDetail:profile.transmissionDetail,drivetrain,seats,exteriorColor:image.color,seatColor:seatColors[index%seatColors.length],seatFinish:seatFinishes[index%seatFinishes.length],options:[optionValues[index%optionValues.length],optionValues[(index+3)%optionValues.length],optionValues[(index+7)%optionValues.length]]},
      dimensions:{...dimensions,batteryHealthPercent:fuel==="전기"?Math.max(86,100-age*2-(serial%3)):null},
      listing:{registeredAt:`2026-09-${String(1+index%24).padStart(2,"0")}`,priceReduced,discountAvailable,photoCount,hasVideo,sellerName,dealerInventoryCount},
    };
  })
);

export const sampleListingsV3Meta = { version:3,generatedAt:"2026-09-25",total:sampleListingsV3.length,models:new Set(sampleListingsV3.map((listing)=>`${listing.maker} ${listing.modelGroup}`)).size,domestic:sampleListingsV3.filter((listing)=>listing.filter.origin==="국산").length,imported:sampleListingsV3.filter((listing)=>listing.filter.origin!=="국산").length,photoMissing:sampleListingsV3.filter((listing)=>!listing.image).length } as const;
