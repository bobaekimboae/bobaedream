import { createContext, useContext, useState, type ReactNode } from "react";
import {
  siCadillac,
  siChevrolet,
  siFord,
  siHyundai,
  siHonda,
  siInfiniti,
  siJeep,
  siKia,
  siNissan,
  siPiaggiogroup,
  siSubaru,
  siSuzuki,
  siTesla,
  siToyota,
  siVolkswagen,
  siVolvo,
  siYamahamotorcorporation,
  type SimpleIcon,
} from "simple-icons";
import { emptyChoTotFilters, vehicleCategoryOptions, type ChoTotFilterState } from "../../ChoTotFilterSheet";

export type SellerType = "전체" | "개인" | "딜러";
type SheetType = "filter" | "quick" | "carType" | "maker" | "vehicle" | "year" | "price" | "region" | "sort" | null;
type DetailSheet = "contact" | "more" | "priceHistory" | null;
type RegionSelection = { province: string; district: string; radius: string };
type RegionMenu = "province" | "district" | "radius" | null;
type PriceMode = "cash" | "lease";
type QuickFilterStyle = "chotot" | "guazi" | "dongchedi";
export type PriceSelection = { mode: PriceMode; min: number; max: number | null };
type ListingBadge = "브랜드인증" | "제조사보증" | "1인소유" | "가격인하" | "인증중고차";

const isDesktopPreview = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("desktop") === "1" || params.get("pc") === "1";
};
const getInitialQuickFilterStyle = (): QuickFilterStyle => {
  const qf = new URLSearchParams(window.location.search).get("qf");
  return qf === "guazi" || qf === "dongchedi" ? qf : "chotot";
};
const isForcedMobileView = () => !isDesktopPreview();
const forcedMobileDesignWidth = 430;

type Car = {
  id: number;
  maker: string;
  modelGroup?: string;
  sellerType: Exclude<SellerType, "전체">;
  image: string;
  imageFit?: "cover" | "contain";
  title: string;
  trim: string;
  specs: string[];
  price: string;
  lease?: string;
  place: string;
  views: number;
  dealer: string;
  stock: number;
  posted: string;
  photos: number;
  badges?: ListingBadge[];
  filter?: {
    year: number;
    seats: string;
    condition: "신차" | "중고";
    mileage: number;
    owners: string;
    transmission: string;
    fuel: string;
    color: string;
    origin: string;
    body: string;
    video: boolean;
  };
};

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;

type FavoritesUi = { likedIds: number[]; toggleLiked: (id: number) => void };
const FavoritesContext = createContext<FavoritesUi | null>(null);

function FavoritesProvider({ children }: { children: ReactNode }) {
  const [likedIds, setLikedIds] = useState<number[]>([]);
  const toggleLiked = (id: number) => setLikedIds((current) => current.includes(id) ? current.filter((likedId) => likedId !== id) : [...current, id]);
  return <FavoritesContext.Provider value={{ likedIds, toggleLiked }}>{children}</FavoritesContext.Provider>;
}

function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error("FavoritesProvider is missing");
  return context;
}

const sellerScenario = {
  name: "이은호 딜러",
  location: "서울 서초구 오토갤러리",
  staffNumber: "SE25-00585",
  phoneLabel: "050-6246-9261",
  phoneHref: "tel:05062469261",
} as const;

const dealerNamePool = [
  sellerScenario.name,
  "김혜원 딜러",
  "박준서 딜러",
  "최민재 딜러",
  "정다은 딜러",
  "오세훈 딜러",
  "한지우 딜러",
  "서민호 딜러",
] as const;

const dealerAvatarPool = [
  "cars/sellers/lee-eunho.png",
  "cars/sellers/kim-hyewon.png",
  "cars/sellers/park-junseo.png",
  "cars/sellers/choi-minjae.png",
  "cars/sellers/jung-daeun.png",
  "cars/sellers/oh-sehun.png",
  "cars/sellers/han-jiwoo.png",
  "cars/sellers/seo-minho.png",
] as const;

const privateSellerAvatar = "cars/sellers/private-seller.png";

const sellerLabel = (car: Car) => {
  if (car.sellerType === "개인") return "개인판매자";
  if (car.dealer && car.dealer !== sellerScenario.name) return car.dealer;
  const index = ((car.id - 1) % dealerNamePool.length + dealerNamePool.length) % dealerNamePool.length;
  return dealerNamePool[index];
};

const sellerAvatar = (car: Car) => {
  if (car.sellerType === "개인") return privateSellerAvatar;
  const index = ((car.id - 1) % dealerAvatarPool.length + dealerAvatarPool.length) % dealerAvatarPool.length;
  return dealerAvatarPool[index];
};

const vehicleNumberPattern = /^([가-힣]{2}\s*)?\d{2,3}\s*[가-힣]\s*\d{4}$/;
const displaySpecs = (specs: string[]) => specs
  .filter((spec) => !vehicleNumberPattern.test(spec.trim()))
  .map((spec, index) => index === 1 ? formatMileage(spec) : spec)
  .join(" · ");

const displayListPlace = (place: string) => place.split(" · ")[0].trim();
const emptyPrice: PriceSelection = { mode: "cash", min: 0, max: null };
const priceSteps = [0, 500, 1000, 2000, 3000, 5000, 7000, 10000, 15000, 20000, 30000];
const pricePresets = [
  { label: "5백 이하", min: 0, max: 500 },
  { label: "5백~1천", min: 500, max: 1000 },
  { label: "1천~2천", min: 1000, max: 2000 },
  { label: "2천~3천", min: 2000, max: 3000 },
  { label: "3천~5천", min: 3000, max: 5000 },
  { label: "5천~7천", min: 5000, max: 7000 },
  { label: "7천~1억", min: 7000, max: 10000 },
  { label: "1억 이상", min: 10000, max: null },
];
const parsePrice = (value: string) => Number(value.replace(/[^\d]/g, ""));
const normalizeModelSearchText = (value: string) => value.replace(/[-\s]/g, "").toLowerCase();
const matchesPrice = (car: Car, value: PriceSelection) => {
  const amount = parsePrice(car.price);
  return amount >= value.min && (value.max === null || amount <= value.max);
};
const formatPriceValue = (value: number) => value.toLocaleString("ko-KR");
const priceFilterLabel = (value: PriceSelection) => {
  if (value.min === 0 && value.max === null) return "가격";
  if (value.max === null) return `${formatPriceValue(value.min)}만원 이상`;
  if (value.min === 0) return `${formatPriceValue(value.max)}만원 이하`;
  return `${formatPriceValue(value.min)}~${formatPriceValue(value.max)}만원`;
};
const formatMileage = (value: string) => value.replace(/(\d[\d,]*)\s*km/i, (match, digits: string) => {
  const kilometers = Number(digits.replaceAll(",", ""));
  if (!Number.isFinite(kilometers)) return match;
  if (kilometers < 1_000) return "1천km 미만";
  return kilometers < 10_000 ? `${Math.floor(kilometers / 1_000)}천km` : `${Math.floor(kilometers / 10_000)}만km`;
});

const brands = [
  { name: "BMW", logo: asset("brand/dongchedi/bmw.png") },
  { name: "벤츠", logo: asset("brand/dongchedi/benz.png") },
  { name: "아우디", logo: asset("brand/audi.svg") },
  { name: "포르쉐", logo: asset("brand/porsche-symbol.png") },
  { name: "미니", logo: asset("brand/dongchedi/mini.png") },
];

type VehicleBodyFit = "width" | "height";
type BodyType = "세단" | "SUV" | "해치백" | "쿠페" | "컨버터블" | "왜건" | "MPV" | "밴" | "픽업";
const vehicleCategories: ReadonlyArray<{ name: string; icon: string; bodyFit: VehicleBodyFit }> = [
  { name: "중고차", icon: "categories/used-car.svg", bodyFit: "width" },
  { name: "트럭 · 특장", icon: "categories/truck.svg", bodyFit: "height" },
  { name: "바이크", icon: "categories/bike.svg", bodyFit: "height" },
  { name: "캠핑카", icon: "categories/camping.svg", bodyFit: "height" },
  { name: "올드카", icon: "categories/old-car.svg", bodyFit: "width" },
  { name: "건설기계", icon: "categories/construction.svg", bodyFit: "height" },
  { name: "부품 · 용품", icon: "categories/parts.svg", bodyFit: "height" },
] as const;
const guaziVehicleTypeCategories = vehicleCategories.filter((category) => ["중고차", "트럭 · 특장", "바이크", "캠핑카", "올드카"].includes(category.name));

const categorySheetItems: ReadonlyArray<{ name: string; icon?: string }> = [
  { name: "중고차", icon: "categories/used-car.svg" },
  { name: "트럭 · 특장", icon: "categories/truck.svg" },
  { name: "바이크", icon: "categories/bike.svg" },
  { name: "캠핑카", icon: "categories/camping.svg" },
  { name: "올드카", icon: "categories/old-car.svg" },
  { name: "건설기계", icon: "categories/construction.svg" },
  { name: "부품 · 용품", icon: "categories/parts.svg" },
];

const usedCarCategoryOptions = ["전체", "국산차", "수입차", "전기차"] as const;

type MakerOption = { name: string; maker: string; logo?: string; icon?: SimpleIcon; color?: string };
const autohomeBrandLogo = (name: string) => asset(`brand/autohome/${name}.png`);
const dongchediBrandLogo = (name: string) => {
  if (name === "audi") return asset("brand/audi.svg");
  if (name === "porsche") return asset("brand/porsche-symbol.png");
  return asset(`brand/dongchedi/${name}.png`);
};
const makerOptions: MakerOption[] = [
  { name: "BMW", maker: "BMW", logo: dongchediBrandLogo("bmw") },
  { name: "메르세데스-벤츠", maker: "벤츠", logo: dongchediBrandLogo("benz") },
  { name: "아우디", maker: "아우디", logo: dongchediBrandLogo("audi") },
  { name: "포르쉐", maker: "포르쉐", logo: dongchediBrandLogo("porsche") },
  { name: "미니", maker: "미니", logo: dongchediBrandLogo("mini") },
  { name: "랜드로버", maker: "랜드로버", logo: dongchediBrandLogo("land-rover") },
  { name: "볼보", maker: "볼보", logo: dongchediBrandLogo("volvo") },
  { name: "렉서스", maker: "렉서스", logo: dongchediBrandLogo("lexus") },
  { name: "테슬라", maker: "테슬라", logo: dongchediBrandLogo("tesla") },
  { name: "폭스바겐", maker: "폭스바겐", logo: dongchediBrandLogo("volkswagen") },
  { name: "토요타", maker: "토요타", logo: dongchediBrandLogo("toyota") },
  { name: "혼다", maker: "혼다", logo: dongchediBrandLogo("honda") },
  { name: "재규어", maker: "재규어", logo: dongchediBrandLogo("jaguar") },
  { name: "쉐보레", maker: "쉐보레", logo: dongchediBrandLogo("chevrolet") },
  { name: "포드", maker: "포드", logo: dongchediBrandLogo("ford") },
  { name: "지프", maker: "지프", logo: dongchediBrandLogo("jeep") },
  { name: "캐딜락", maker: "캐딜락", logo: dongchediBrandLogo("cadillac") },
  { name: "링컨", maker: "링컨", logo: dongchediBrandLogo("lincoln") },
  { name: "닛산", maker: "닛산", logo: dongchediBrandLogo("nissan") },
  { name: "인피니티", maker: "인피니티", logo: dongchediBrandLogo("infiniti") },
  { name: "마세라티", maker: "마세라티", logo: dongchediBrandLogo("maserati") },
  { name: "벤틀리", maker: "벤틀리", logo: dongchediBrandLogo("bentley") },
  { name: "페라리", maker: "페라리", logo: dongchediBrandLogo("ferrari") },
  { name: "람보르기니", maker: "람보르기니", logo: dongchediBrandLogo("lamborghini") },
  { name: "부가티", maker: "부가티", logo: dongchediBrandLogo("bugatti") },
  { name: "롤스로이스", maker: "롤스로이스", logo: dongchediBrandLogo("rolls-royce") },
  { name: "맥라렌", maker: "맥라렌", logo: dongchediBrandLogo("mclaren") },
  { name: "애스턴마틴", maker: "애스턴마틴", logo: dongchediBrandLogo("aston-martin") },
  { name: "코닉세그", maker: "코닉세그", logo: dongchediBrandLogo("koenigsegg") },
  { name: "리막", maker: "리막", logo: autohomeBrandLogo("rimac") },
  { name: "루시드", maker: "루시드", logo: autohomeBrandLogo("lucid") },
  { name: "폴스타", maker: "폴스타", logo: dongchediBrandLogo("polestar") },
  { name: "애큐라", maker: "애큐라", logo: dongchediBrandLogo("acura") },
  { name: "DS", maker: "DS", logo: dongchediBrandLogo("ds") },
  { name: "마이바흐", maker: "마이바흐", logo: dongchediBrandLogo("maybach") },
  { name: "스바루", maker: "스바루", logo: dongchediBrandLogo("subaru") },
  { name: "스즈키", maker: "스즈키", logo: dongchediBrandLogo("suzuki") },
];

type BrandRailOption = { name: string; maker?: string; logo?: string; icon?: SimpleIcon; color?: string; full?: boolean };
type CategoryBrandRail = { title: string; options: BrandRailOption[] };

const domesticMakerNames = new Set(["현대", "기아", "제네시스"]);
const defaultBrandRailOptions: BrandRailOption[] = [
  ...brands.map((brand) => ({ ...brand, maker: brand.name })),
  { name: "현대", maker: "현대", logo: dongchediBrandLogo("hyundai") },
  { name: "기아", maker: "기아", logo: dongchediBrandLogo("kia") },
];
const superLuxuryBrandRailOptions: BrandRailOption[] = [
  { name: "벤틀리", maker: "벤틀리", logo: dongchediBrandLogo("bentley") },
  { name: "페라리", maker: "페라리", logo: dongchediBrandLogo("ferrari") },
  { name: "람보르기니", maker: "람보르기니", logo: dongchediBrandLogo("lamborghini") },
  { name: "롤스로이스", maker: "롤스로이스", logo: dongchediBrandLogo("rolls-royce") },
  { name: "맥라렌", maker: "맥라렌", logo: dongchediBrandLogo("mclaren") },
  { name: "애스턴마틴", maker: "애스턴마틴", logo: dongchediBrandLogo("aston-martin") },
  { name: "코닉세그", maker: "코닉세그", logo: dongchediBrandLogo("koenigsegg") },
  { name: "리막", maker: "리막", logo: autohomeBrandLogo("rimac") },
  { name: "루시드", maker: "루시드", logo: autohomeBrandLogo("lucid") },
  { name: "폴스타", maker: "폴스타", logo: dongchediBrandLogo("polestar") },
];
const importedBrandRailOptions: BrandRailOption[] = [
  { name: "BMW", maker: "BMW", logo: dongchediBrandLogo("bmw") },
  { name: "벤츠", maker: "벤츠", logo: dongchediBrandLogo("benz") },
  { name: "아우디", maker: "아우디", logo: dongchediBrandLogo("audi") },
  { name: "포르쉐", maker: "포르쉐", logo: dongchediBrandLogo("porsche") },
  { name: "렉서스", maker: "렉서스", logo: dongchediBrandLogo("lexus") },
  ...superLuxuryBrandRailOptions,
];
const categoryBrandRails: Record<string, CategoryBrandRail> = {
  "전체": { title: "제조사", options: [...defaultBrandRailOptions, ...superLuxuryBrandRailOptions] },
  중고차: { title: "제조사", options: [...defaultBrandRailOptions, ...superLuxuryBrandRailOptions] },
  국산차: {
    title: "제조사",
    options: [
      { name: "현대", maker: "현대", logo: dongchediBrandLogo("hyundai") },
      { name: "기아", maker: "기아", logo: dongchediBrandLogo("kia") },
      { name: "제네시스", maker: "제네시스", logo: dongchediBrandLogo("genesis") },
    ],
  },
  수입차: {
    title: "제조사",
    options: importedBrandRailOptions,
  },
  전기차: {
    title: "제조사",
    options: [
      { name: "현대", maker: "현대", logo: dongchediBrandLogo("hyundai") },
      { name: "테슬라", maker: "테슬라", logo: dongchediBrandLogo("tesla") },
      { name: "BMW", maker: "BMW", logo: dongchediBrandLogo("bmw") },
    ],
  },
  바이크: {
    title: "브랜드",
    options: [
      { name: "혼다", maker: "혼다", icon: siHonda },
      { name: "야마하", maker: "야마하", icon: siYamahamotorcorporation, color: "#4b1f84" },
      { name: "스즈키", maker: "스즈키", icon: siSuzuki, color: "#d71920" },
      { name: "피아지오", maker: "피아지오", icon: siPiaggiogroup, color: "#00573f" },
    ],
  },
  "트럭 · 특장": {
    title: "제조사",
    options: [
      { name: "현대", maker: "현대", logo: dongchediBrandLogo("hyundai") },
      { name: "타타대우", maker: "타타대우" },
      { name: "이스즈", maker: "이스즈" },
      { name: "만트럭", maker: "만트럭" },
      { name: "볼보", maker: "볼보", logo: dongchediBrandLogo("volvo") },
    ],
  },
  캠핑카: { title: "제조사", options: defaultBrandRailOptions.slice(0, 5) },
  올드카: { title: "제조사", options: defaultBrandRailOptions.slice(0, 5) },
  건설기계: { title: "제조사", options: [{ name: "현대", maker: "현대", logo: dongchediBrandLogo("hyundai") }, { name: "볼보", maker: "볼보", logo: dongchediBrandLogo("volvo") }] },
  "부품 · 용품": { title: "분류", options: [{ name: "타이어" }, { name: "휠" }, { name: "튜닝" }, { name: "오디오" }] },
};

const mercedesModelCard = (name: string) => asset(`cars/mercedes/models/card/${name}.png`);
const bmwModelCard = (name: string) => asset(`cars/bmw/card/${name}.png`);
const bmw3SeriesGenerationCard = (name: string) => asset(`cars/bmw/3-series/${name}.webp`);

const bmwModels = [
  { name: "3시리즈", image: bmwModelCard("3-series"), bodyFit: "width" as const, bodyType: "세단" as const },
  { name: "X1", image: bmwModelCard("x1"), bodyFit: "width" as const, bodyType: "SUV" as const },
  { name: "5시리즈", image: bmwModelCard("5-series"), bodyFit: "width" as const, bodyType: "세단" as const },
  { name: "X3", image: bmwModelCard("x3"), bodyFit: "width" as const, bodyType: "SUV" as const },
  { name: "1시리즈", image: bmwModelCard("1-series"), bodyFit: "width" as const, bodyType: "해치백" as const },
];

const benzAClassImages = {
  W177: asset("cars/mercedes/a-class/card/w177.png"),
  W176: asset("cars/mercedes/a-class/card/w176.png"),
  W169: asset("cars/mercedes/a-class/card/w169.png"),
  W168: asset("cars/mercedes/a-class/card/w168.png"),
};
const benzEClassGenerationCard = (name: string) => asset(`cars/mercedes/e-class/${name}.webp`);

const benzEncarClassOrder = [
  "A-클래스", "B-클래스", "C-클래스", "CL-클래스", "CLA-클래스", "CLE-클래스", "CLK-클래스", "CLS-클래스",
  "E-클래스", "EQA", "EQB", "EQC", "EQE", "EQS", "G-클래스", "GL-클래스", "GLA-클래스", "GLB-클래스",
  "GLC-클래스", "GLE-클래스", "GLK-클래스", "GLS-클래스", "M-클래스", "R-클래스", "S-클래스",
  "SL-클래스", "SLC-클래스", "SLK-클래스", "SLR", "SLS AMG", "AMG GT", "SEL/SEC", "V-클래스",
  "스프린터", "190-클래스", "기타",
];
type QuickTrimOption = { name: string; count: number };
type QuickGenerationOption = { name: string; years: string; variants: Array<string | QuickTrimOption>; image?: string; bodyFit?: VehicleBodyFit; bodyType?: BodyType; isEV?: boolean; count?: number };
type QuickModelVisual = { image: string; bodyFit?: VehicleBodyFit; bodyType?: BodyType; isEV?: boolean; count?: string };
const quickModelVisualsByMaker: Record<string, Record<string, QuickModelVisual>> = {
  BMW: Object.fromEntries(bmwModels.map((model) => [model.name, { image: model.image, bodyFit: model.bodyFit, bodyType: model.bodyType }])) as Record<string, QuickModelVisual>,
  벤츠: {
    "A-클래스": { image: mercedesModelCard("a-class"), bodyType: "해치백", count: "588대" },
    "B-클래스": { image: mercedesModelCard("b-class"), bodyType: "MPV", count: "67대" },
    "C-클래스": { image: mercedesModelCard("c-class"), bodyType: "세단", count: "1,285대" },
    "CL-클래스": { image: mercedesModelCard("cl-class"), bodyType: "쿠페", count: "15대" },
    "CLA-클래스": { image: mercedesModelCard("cla-class"), bodyType: "쿠페", count: "468대" },
    "CLE-클래스": { image: mercedesModelCard("cle-class"), bodyType: "쿠페", count: "307대" },
    "CLK-클래스": { image: mercedesModelCard("clk-class"), bodyType: "쿠페", count: "3대" },
    "CLS-클래스": { image: mercedesModelCard("cls-class"), bodyType: "쿠페", count: "786대" },
    "E-클래스": { image: mercedesModelCard("e-class"), bodyType: "세단", count: "4,538대" },
    EQA: { image: mercedesModelCard("eqa"), bodyType: "SUV", isEV: true, count: "106대" },
    EQB: { image: mercedesModelCard("eqb"), bodyType: "SUV", isEV: true, count: "113대" },
    EQC: { image: mercedesModelCard("eqc"), bodyType: "SUV", isEV: true, count: "18대" },
    EQE: { image: mercedesModelCard("eqe"), bodyType: "세단", isEV: true, count: "132대" },
    EQS: { image: mercedesModelCard("eqs"), bodyType: "세단", isEV: true, count: "170대" },
    "G-클래스": { image: mercedesModelCard("g-class"), bodyType: "SUV", count: "490대" },
    "GL-클래스": { image: mercedesModelCard("gl-class"), bodyType: "SUV", count: "7대" },
    "GLA-클래스": { image: mercedesModelCard("gla-class"), bodyType: "SUV", count: "341대" },
    "GLB-클래스": { image: mercedesModelCard("glb-class"), bodyType: "SUV", count: "455대" },
    "GLC-클래스": { image: mercedesModelCard("glc-class"), bodyType: "SUV", count: "1,473대" },
    "GLE-클래스": { image: mercedesModelCard("gle-class"), bodyType: "SUV", count: "1,436대" },
    "GLK-클래스": { image: mercedesModelCard("glk-class"), bodyType: "SUV", count: "46대" },
    "GLS-클래스": { image: mercedesModelCard("gls-class"), bodyType: "SUV", count: "410대" },
    "M-클래스": { image: mercedesModelCard("m-class"), bodyType: "SUV", count: "40대" },
    "R-클래스": { image: mercedesModelCard("r-class"), bodyType: "MPV", count: "2대" },
    "S-클래스": { image: mercedesModelCard("s-class"), bodyType: "세단", count: "2,835대" },
    "SL-클래스": { image: mercedesModelCard("sl-class"), bodyType: "컨버터블", count: "79대" },
    "SLC-클래스": { image: mercedesModelCard("slc-class"), bodyType: "컨버터블", count: "27대" },
    "SLK-클래스": { image: mercedesModelCard("slk-class"), bodyType: "컨버터블", count: "38대" },
    SLR: { image: mercedesModelCard("slr"), bodyType: "쿠페", count: "0대" },
    "SLS AMG": { image: mercedesModelCard("sls-amg"), bodyType: "쿠페", count: "2대" },
    "AMG GT": { image: mercedesModelCard("amg-gt"), bodyType: "쿠페", count: "403대" },
    "SEL/SEC": { image: mercedesModelCard("sel-sec"), bodyType: "쿠페", count: "7대" },
    "V-클래스": { image: mercedesModelCard("v-class"), bodyType: "밴", count: "21대" },
    스프린터: { image: mercedesModelCard("sprinter"), bodyType: "밴", bodyFit: "height", count: "85대" },
    "190-클래스": { image: mercedesModelCard("190-class"), bodyType: "세단", count: "0대" },
    기타: { image: mercedesModelCard("other") },
  },
};
const showGuaziInventoryCounts = false;

const trimCountOverrides: Record<string, number> = {
  A180: 0,
  A200d: 6,
  A220: 18,
  "A250 4MATIC": 12,
  "AMG A35 4MATIC": 5,
  "AMG A45 S 4MATIC+": 2,
  "A180 CDI": 3,
  "A200 CDI": 4,
  A200: 8,
  "A45 AMG 4MATIC": 1,
  A170: 0,
  "A200 Turbo": 1,
  A140: 0,
  A160: 2,
  A190: 0,
  C200: 23,
  C300: 16,
  "AMG Line": 11,
  C220d: 18,
  "C220 CDI": 4,
  C250: 5,
  E200: 34,
  "E300 4MATIC": 41,
  "E350 e 4MATIC": 9,
  E220d: 28,
  E250: 36,
  "E300 아방가르드": 24,
  "E350 e 4MATIC 익스클루시브": 6,
  S350d: 18,
  "S500 4MATIC": 22,
  Maybach: 9,
};
const toTrimOption = (variant: string | QuickTrimOption): QuickTrimOption => typeof variant === "string" ? { name: variant, count: trimCountOverrides[variant] ?? 7 } : variant;
const formatModelLabel = (value: string) => value.replace(/-/g, "");
const generationLabelByCode: Record<string, string> = {
  G20: "7세대",
  F30: "6세대",
  E90: "5세대",
  G60: "8세대",
  G30: "7세대",
  F10: "6세대",
  U11: "3세대",
  F48: "2세대",
  G45: "4세대",
  G01: "3세대",
  F40: "3세대",
  F20: "2세대",
};
const generationDisplayLabel = (generation: QuickGenerationOption) => {
  const explicit = generation.name.match(/(\d+)세대/);
  if (explicit) return `${explicit[1]}세대`;
  const codeLabel = generationLabelByCode[generation.name];
  if (codeLabel) return codeLabel;
  if (generation.name.includes("W177")) return "4세대";
  if (generation.name.includes("W176")) return "3세대";
  if (generation.name.includes("W169")) return "2세대";
  if (generation.name.includes("W168")) return "1세대";
  return generation.name.replace(/\s?[A-Z]\d{2,3}.*/, "");
};
const generationCodeLabel = (generation: QuickGenerationOption) => {
  const code = generation.name.match(/\b[A-Z]{1,3}\d{2,3}\b/);
  return code?.[0] ?? "";
};
const generationCardLabel = (generation: QuickGenerationOption) => {
  const display = generationDisplayLabel(generation);
  const code = generationCodeLabel(generation);
  return code ? `${display} ${code}` : display;
};
const compactYearLabel = (years: string) => {
  const current = years.match(/^(\d{4})~현재$/);
  if (current) return `${current[1].slice(2)} ~ 현재`;
  const range = years.match(/^(\d{4})~(\d{4})$/);
  if (range) return `${range[1].slice(2)} ~ ${range[2].slice(2)}년식`;
  return years;
};
const compactGenerationCardYearLabel = (years: string) => {
  const current = years.match(/^(\d{4})~현재$/);
  if (current) return `${current[1].slice(2)}~현재`;
  const range = years.match(/^(\d{4})~(\d{4})$/);
  if (range) return `${range[1].slice(2)}~${range[2].slice(2)}년`;
  return years.replace(/\s+/g, "");
};
const generationCountLabel = (generation: QuickGenerationOption) => {
  const count = generation.count ?? generation.variants.reduce((sum, variant) => sum + toTrimOption(variant).count, 0);
  return `${count.toLocaleString("ko-KR")}대`;
};
const bodyTypeLabel = (bodyType?: BodyType) => bodyType ?? "";
const quickModelsByMaker: Record<string, string[]> = {
  BMW: bmwModels.map((model) => model.name),
  벤츠: benzEncarClassOrder,
  현대: ["그랜저", "아이오닉 5", "쏘나타", "아반떼"],
  기아: ["카니발", "쏘렌토", "K5", "스포티지"],
  제네시스: ["G80", "GV70", "GV80"],
  아우디: ["A6", "A7", "Q5"],
  포르쉐: ["718", "911", "카이엔"],
  렉서스: ["ES300h", "NX", "RX"],
  벤틀리: ["컨티넨탈 GT", "플라잉스퍼", "벤테이가"],
  페라리: ["296 GTB", "로마", "SF90"],
  람보르기니: ["우라칸", "우루스", "아벤타도르"],
  롤스로이스: ["팬텀", "고스트", "컬리넌"],
  맥라렌: ["570S", "720S", "아투라"],
  애스턴마틴: ["DB11", "밴티지", "DBX"],
  코닉세그: ["제스코", "레제라", "아제라"],
  리막: ["네베라"],
  루시드: ["에어"],
  폴스타: ["폴스타 2", "폴스타 3"],
};
const quickGenerationsByMakerModel: Record<string, Record<string, QuickGenerationOption[]>> = {
  BMW: {
    "3시리즈": [
      { name: "G20", years: "2019~현재", image: bmw3SeriesGenerationCard("g20"), bodyFit: "width", bodyType: "세단", variants: ["320i", "320d", "330i", "M 스포츠"] },
      { name: "F30", years: "2012~2018", image: bmw3SeriesGenerationCard("f30"), bodyFit: "width", bodyType: "세단", variants: ["320d", "328i", "Luxury", "M 스포츠"] },
      { name: "E90", years: "2005~2011", image: bmw3SeriesGenerationCard("e90"), bodyFit: "width", bodyType: "세단", variants: ["320i", "325i", "330i"] },
    ],
    "5시리즈": [
      { name: "G60", years: "2023~현재", bodyType: "세단", variants: ["520i", "530i", "530e", "M 스포츠"] },
      { name: "G30", years: "2017~2023", bodyType: "세단", variants: ["520d", "530i", "530e", "M 스포츠"] },
      { name: "F10", years: "2010~2016", bodyType: "세단", variants: ["520d", "528i", "535i"] },
    ],
    X1: [
      { name: "U11", years: "2022~현재", bodyType: "SUV", variants: ["sDrive18d", "xDrive20i", "M 스포츠"] },
      { name: "F48", years: "2015~2022", bodyType: "SUV", variants: ["sDrive18d", "xDrive20d"] },
    ],
    X3: [
      { name: "G45", years: "2024~현재", bodyType: "SUV", variants: ["20 xDrive", "30e xDrive", "M50"] },
      { name: "G01", years: "2017~2024", bodyType: "SUV", variants: ["20d", "30d", "M40i"] },
    ],
    "1시리즈": [
      { name: "F40", years: "2019~현재", bodyType: "해치백", variants: ["118d", "120i", "M135i"] },
      { name: "F20", years: "2011~2019", bodyType: "해치백", variants: ["118d", "120d", "M 스포츠"] },
    ],
  },
  벤츠: {
    "E-클래스": [
      { name: "6세대 W214", years: "2023~현재", image: benzEClassGenerationCard("w214"), bodyFit: "width", bodyType: "세단", variants: ["E200", "E300 4MATIC", "E350 e 4MATIC"] },
      { name: "5세대 W213", years: "2016~2023", image: benzEClassGenerationCard("w213"), bodyFit: "width", bodyType: "세단", variants: ["E220d", "E250", "E300 아방가르드", "E300 4MATIC", "E350 e 4MATIC 익스클루시브"] },
      { name: "4세대 W212", years: "2009~2016", image: benzEClassGenerationCard("w212"), bodyFit: "width", bodyType: "세단", variants: ["E200 CGI 블루이피션시", "E220 CDI", "E300", "E350"] },
    ],
    "S-클래스": [
      { name: "7세대 W223", years: "2020~현재", bodyType: "세단", variants: ["S350d", "S500 4MATIC", "Maybach"] },
      { name: "6세대 W222", years: "2013~2020", bodyType: "세단", variants: ["S350d", "S400", "S560"] },
      { name: "5세대 W221", years: "2005~2013", bodyType: "세단", variants: ["S350", "S500L", "S600L"] },
      { name: "4세대 W220", years: "1998~2005", bodyType: "세단", variants: ["S320", "S500", "S500L"] },
    ],
    "C-클래스": [
      { name: "6세대 W206", years: "2021~현재", bodyType: "세단", variants: ["C200", "C300", "AMG Line"] },
      { name: "5세대 W205", years: "2014~2021", bodyType: "세단", variants: ["C200", "C220d", "C300"] },
      { name: "4세대 W204", years: "2007~2014", bodyType: "세단", variants: ["C200", "C220 CDI", "C250"] },
    ],
    "GLC-클래스": [
      { name: "2세대 X254", years: "2022~현재", bodyType: "SUV", variants: ["GLC 300 4MATIC", "GLC 300e 4MATIC", "AMG Line"] },
      { name: "1세대 X253", years: "2015~2022", bodyType: "SUV", variants: ["GLC350e 4MATIC", "GLC300 4MATIC 쿠페", "GLC220d 4MATIC"] },
    ],
    "GLE-클래스": [
      { name: "2세대 V167", years: "2019~현재", bodyType: "SUV", variants: ["GLE 300d 4MATIC", "GLE 450 4MATIC", "AMG Line"] },
      { name: "1세대 W166", years: "2015~2019", bodyType: "SUV", variants: ["GLE 350d", "GLE 400", "AMG"] },
    ],
    "A-클래스": [
      { name: "A-클래스 W177", years: "2019~현재", image: benzAClassImages.W177, bodyType: "해치백", variants: ["A180", "A200d", "A220", "A250 4MATIC", "AMG A35 4MATIC", "AMG A45 S 4MATIC+"] },
      { name: "A-클래스 W176", years: "2013~2018", image: benzAClassImages.W176, bodyType: "해치백", variants: ["A180 CDI", "A200 CDI", "A200", "A220", "A45 AMG 4MATIC"] },
      { name: "A-클래스 W169", years: "2005~2012", image: benzAClassImages.W169, bodyType: "해치백", variants: ["A170", "A180 CDI", "A200", "A200 Turbo"] },
      { name: "A-클래스 W168", years: "1997~2004", image: benzAClassImages.W168, bodyType: "해치백", variants: ["A140", "A160", "A190"] },
    ],
    "CLA-클래스": [
      { name: "2세대 C118", years: "2019~현재", bodyType: "쿠페", variants: ["CLA 220", "CLA 250 4MATIC", "AMG CLA 45 S"] },
      { name: "1세대 C117", years: "2013~2019", bodyType: "쿠페", variants: ["CLA 200", "CLA 250", "CLA 45 AMG"] },
    ],
  },
};
const quickRegions = ["경기", "서울", "부산", "대구", "인천", "전남광주"];
const quickFilterStyleOptions: Array<{ value: QuickFilterStyle; label: string }> = [
  { value: "chotot", label: "초톳" },
  { value: "guazi", label: "과쯔" },
  { value: "dongchedi", label: "동처띠" },
];
const provinceOptions = ["전국", "경기", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "경남"];
const districtsByProvince: Record<string, string[]> = {
  경기: ["전체", "성남시", "고양시", "수원시"], 서울: ["전체", "강남구", "서초구", "성동구"], 부산: ["전체", "해운대구"],
  대구: ["전체", "수성구"], 인천: ["전체", "연수구", "남동구"], 광주: ["전체", "서구"], 대전: ["전체", "유성구"],
  울산: ["전체", "남구"], 경남: ["전체", "창원시"],
};
const radiusOptions = ["5km", "10km", "20km", "50km"];
const emptyRegion: RegionSelection = { province: "", district: "", radius: "" };
const getInitialChoTotFilters = (): ChoTotFilterState => {
  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get("category") ?? "";
  const makerParam = params.get("maker") ?? "";
  const modelParam = params.get("model") ?? "";
  const category = vehicleCategoryOptions.includes(categoryParam) ? categoryParam : "전체";
  const maker = quickModelsByMaker[makerParam] ? makerParam : null;
  const model = maker && quickModelsByMaker[maker]?.includes(modelParam) ? modelParam : null;

  return { ...emptyChoTotFilters, category, maker, model };
};
const listingBadgeOptions: ListingBadge[] = ["브랜드인증", "제조사보증", "1인소유", "가격인하", "인증중고차"];

const defaultCars: Car[] = [
  {
    id: 1, maker: "벤츠", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 CLS 450 4MATIC", trim: "AMG Line",
    specs: ["23년06월", "18,420km", "가솔린", "흰색시트"], price: "8,420 만원",
    place: "서울 강남구 · 오토갤러리", views: 128, dealer: sellerScenario.name, stock: 12, posted: "3분 전", photos: 14,
  },
  {
    id: 2, maker: "벤츠", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 G63 AMG", trim: "매뉴팩처 프로그램",
    specs: ["21년12월", "31,900km", "가솔린", "흰색시트"], price: "19,800 만원",
    place: "경기 성남시 · 오토갤러리", views: 301, dealer: sellerScenario.name, stock: 8, posted: "12분 전", photos: 22,
  },
  {
    id: 3, maker: "포르쉐", sellerType: "개인", image: "detail/raw-20.jpeg", title: "포르쉐 718 박스터", trim: "4.0 GTS",
    specs: ["24년03월", "8,130km", "가솔린", "흰색시트"], price: "13,900 만원",
    place: "부산 해운대구", views: 219, dealer: "개인판매자", stock: 1, posted: "24분 전", photos: 18,
  },
  {
    id: 4, maker: "벤틀리", sellerType: "딜러", image: "detail/raw-07.jpeg", title: "벤틀리 컨티넨탈 GT", trim: "6.0 W12",
    specs: ["19년11월", "42,920km", "가솔린", "검정색"], price: "15,700 만원",
    place: "서울 서초구 · 양재전시장", views: 410, dealer: sellerScenario.name, stock: 21, posted: "37분 전", photos: 26,
  },
  {
    id: 5, maker: "벤틀리", sellerType: "개인", image: "detail/raw-04.png", title: "벤틀리 플라잉스퍼", trim: "4.0 V8 아주르",
    specs: ["22년05월", "26,500km", "가솔린", "흰색시트"], price: "21,500 만원",
    place: "대구 수성구", views: 175, dealer: "개인판매자", stock: 1, posted: "1시간 전", photos: 16,
  },
  {
    id: 6, maker: "맥라렌", sellerType: "딜러", image: "detail/raw-19.jpeg", title: "맥라렌 570S 스파이더", trim: "3.8 V8",
    specs: ["19년08월", "19,600km", "가솔린", "흰색시트"], price: "18,900 만원",
    place: "서울 성동구 · 성수전시장", views: 362, dealer: sellerScenario.name, stock: 15, posted: "2시간 전", photos: 24,
  },
  {
    id: 7, maker: "롤스로이스", sellerType: "딜러", image: "detail/raw-05.jpeg", title: "롤스로이스 팬텀", trim: "6.7 V12 EWB",
    specs: ["13년09월", "54,200km", "가솔린", "회색시트"], price: "27,000 만원",
    place: "서울 서초구 · 오토갤러리", views: 508, dealer: sellerScenario.name, stock: 6, posted: "어제", photos: 31,
  },
  {
    id: 8, maker: "벤츠", sellerType: "개인", image: "detail/raw-20.jpeg", title: "벤츠 E 300 4MATIC", trim: "아방가르드",
    specs: ["22년02월", "36,700km", "가솔린", "흰색시트"], price: "5,480 만원",
    place: "인천 연수구", views: 96, dealer: "개인판매자", stock: 1, posted: "어제", photos: 11,
  },
];

const bmwCars: Car[] = [
  { id: 101, maker: "BMW", modelGroup: "3시리즈", sellerType: "딜러", image: "detail/raw-07.jpeg", title: "BMW 3시리즈 320i", trim: "M 스포츠 프로", specs: ["23년09월", "21,430km", "가솔린", "검정색"], price: "5,390 만원", place: "서울 강남구 · BMW 인증센터", views: 184, dealer: sellerScenario.name, stock: 14, posted: "2분 전", photos: 19 },
  { id: 102, maker: "BMW", modelGroup: "3시리즈", sellerType: "개인", image: "detail/raw-04.png", title: "BMW 3시리즈 330e", trim: "M 스포츠", specs: ["22년04월", "34,800km", "플러그인 하이브리드", "검정색"], price: "4,850 만원", place: "경기 고양시", views: 137, dealer: "개인판매자", stock: 1, posted: "18분 전", photos: 12 },
  { id: 103, maker: "BMW", modelGroup: "X1", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "BMW X1 sDrive20i", trim: "xLine", specs: ["24년01월", "12,700km", "가솔린", "흰색시트"], price: "5,120 만원", place: "부산 해운대구 · BMW 프리미엄 셀렉션", views: 211, dealer: sellerScenario.name, stock: 9, posted: "6분 전", photos: 21 },
  { id: 104, maker: "BMW", modelGroup: "X1", sellerType: "개인", image: "detail/raw-20.jpeg", title: "BMW X1 xDrive20i", trim: "M 스포츠", specs: ["23년07월", "18,050km", "가솔린", "흰색시트"], price: "5,450 만원", place: "대전 유성구", views: 102, dealer: "개인판매자", stock: 1, posted: "41분 전", photos: 15 },
  { id: 105, maker: "BMW", modelGroup: "5시리즈", sellerType: "딜러", image: "detail/raw-09.jpeg", title: "BMW 5시리즈 530i", trim: "M 스포츠", specs: ["24년03월", "9,820km", "가솔린", "남색"], price: "7,640 만원", place: "서울 성동구 · 성수 전시장", views: 328, dealer: sellerScenario.name, stock: 18, posted: "9분 전", photos: 27 },
  { id: 106, maker: "BMW", modelGroup: "5시리즈", sellerType: "딜러", image: "detail/raw-05.jpeg", title: "BMW 5시리즈 520i", trim: "럭셔리", specs: ["22년11월", "29,600km", "가솔린", "남색"], price: "5,750 만원", place: "광주 서구 · BMW 인증센터", views: 165, dealer: sellerScenario.name, stock: 11, posted: "53분 전", photos: 17 },
  { id: 107, maker: "BMW", modelGroup: "X3", sellerType: "딜러", image: "detail/raw-07.jpeg", title: "BMW X3 xDrive20i", trim: "M 스포츠 프로", specs: ["24년02월", "14,390km", "가솔린", "갈색"], price: "7,180 만원", place: "경기 수원시 · BMW 프리미엄 셀렉션", views: 287, dealer: sellerScenario.name, stock: 7, posted: "4분 전", photos: 23 },
  { id: 108, maker: "BMW", modelGroup: "X3", sellerType: "개인", image: "detail/raw-18.jpeg", title: "BMW X3 xDrive30e", trim: "M 스포츠", specs: ["22년08월", "41,200km", "플러그인 하이브리드", "갈색"], price: "5,980 만원", place: "울산 남구", views: 119, dealer: "개인판매자", stock: 1, posted: "1시간 전", photos: 14 },
  { id: 109, maker: "BMW", modelGroup: "1시리즈", sellerType: "딜러", image: "detail/raw-04.png", title: "BMW 1시리즈 120i", trim: "M 스포츠", specs: ["23년05월", "25,900km", "가솔린", "흰색시트"], price: "3,890 만원", place: "인천 남동구 · BMW 인증센터", views: 148, dealer: sellerScenario.name, stock: 13, posted: "14분 전", photos: 18 },
  { id: 110, maker: "BMW", modelGroup: "1시리즈", sellerType: "개인", image: "detail/raw-19.jpeg", title: "BMW 1시리즈 M135i", trim: "xDrive", specs: ["22년06월", "33,100km", "가솔린", "흰색시트"], price: "4,320 만원", place: "경남 창원시", views: 202, dealer: "개인판매자", stock: 1, posted: "2시간 전", photos: 20 },
];

const benzCars: Car[] = [
  { id: 201, maker: "벤츠", modelGroup: "E클래스", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 E클래스 E 300 4MATIC", trim: "AMG Line", specs: ["23년06월", "18,420km", "가솔린", "흰색시트"], price: "8,420 만원", place: "서울 강남구 · 한성자동차", views: 128, dealer: sellerScenario.name, stock: 12, posted: "3분 전", photos: 14 },
  { id: 202, maker: "벤츠", modelGroup: "E클래스", sellerType: "개인", image: "detail/raw-20.jpeg", title: "벤츠 E클래스 E 220 d 4MATIC", trim: "Exclusive", specs: ["22년02월", "36,700km", "디젤", "흰색시트"], price: "5,480 만원", place: "인천 연수구", views: 96, dealer: "개인판매자", stock: 1, posted: "18분 전", photos: 11 },
  { id: 203, maker: "벤츠", modelGroup: "S클래스", sellerType: "딜러", image: "detail/raw-05.jpeg", title: "벤츠 S클래스 S 450 4MATIC", trim: "Long", specs: ["23년11월", "11,840km", "가솔린", "검정색"], price: "16,900 만원", place: "서울 서초구 · 더클래스 효성", views: 342, dealer: sellerScenario.name, stock: 7, posted: "7분 전", photos: 24 },
  { id: 204, maker: "벤츠", modelGroup: "S클래스", sellerType: "개인", image: "detail/raw-07.jpeg", title: "벤츠 S클래스 S 580 e 4MATIC", trim: "Long", specs: ["22년09월", "28,100km", "플러그인 하이브리드", "회색시트"], price: "14,700 만원", place: "경기 성남시", views: 207, dealer: "개인판매자", stock: 1, posted: "32분 전", photos: 18 },
  { id: 205, maker: "벤츠", modelGroup: "GLC클래스", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 GLC클래스 GLC 300 4MATIC", trim: "AMG Line", specs: ["24년01월", "9,760km", "가솔린", "흰색시트"], price: "7,950 만원", place: "부산 해운대구 · 벤츠 인증중고차", views: 255, dealer: sellerScenario.name, stock: 9, posted: "11분 전", photos: 21 },
  { id: 206, maker: "벤츠", modelGroup: "GLC클래스", sellerType: "개인", image: "detail/raw-18.jpeg", title: "벤츠 GLC클래스 GLC 220 d 4MATIC", trim: "Avantgarde", specs: ["21년08월", "44,200km", "디젤", "흰색시트"], price: "4,890 만원", place: "대전 유성구", views: 154, dealer: "개인판매자", stock: 1, posted: "46분 전", photos: 13 },
  { id: 207, maker: "벤츠", modelGroup: "GLE클래스", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 GLE클래스 GLE 450 4MATIC", trim: "AMG Line", specs: ["23년04월", "22,600km", "가솔린", "흰색시트"], price: "11,900 만원", place: "경기 수원시 · 벤츠 인증중고차", views: 319, dealer: sellerScenario.name, stock: 15, posted: "5분 전", photos: 27 },
  { id: 208, maker: "벤츠", modelGroup: "GLE클래스", sellerType: "개인", image: "detail/raw-18.jpeg", title: "벤츠 GLE클래스 GLE 300 d 4MATIC", trim: "Premium", specs: ["22년12월", "31,300km", "디젤", "흰색시트"], price: "8,780 만원", place: "광주 서구", views: 181, dealer: "개인판매자", stock: 1, posted: "1시간 전", photos: 17 },
  { id: 209, maker: "벤츠", modelGroup: "C클래스", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 C클래스 C 300 4MATIC", trim: "AMG Line", specs: ["24년02월", "7,900km", "가솔린", "흰색시트"], price: "6,480 만원", place: "서울 성동구 · KCC오토", views: 223, dealer: sellerScenario.name, stock: 11, posted: "9분 전", photos: 20 },
  { id: 210, maker: "벤츠", modelGroup: "C클래스", sellerType: "개인", image: "detail/raw-20.jpeg", title: "벤츠 C클래스 C 200 Avantgarde", trim: "Avantgarde", specs: ["22년05월", "29,400km", "가솔린", "흰색시트"], price: "4,350 만원", place: "경남 창원시", views: 117, dealer: "개인판매자", stock: 1, posted: "2시간 전", photos: 12 },
];

const inventoryCars = [...defaultCars, ...bmwCars, ...benzCars];

type ChoTotCarSeed = Omit<Car, "id" | "sellerType" | "views" | "dealer" | "stock" | "posted" | "photos">;
const makeChoTotCar = (id: number, seed: ChoTotCarSeed): Car => ({
  ...seed,
  id,
  sellerType: seed.title.includes("개인") ? "개인" : seed.maker === "제네시스" || seed.maker === "현대" && seed.title.includes("아이오닉") || seed.maker === "렉서스" || seed.maker === "포르쉐" ? "개인" : "딜러",
  views: 160 + id * 17,
  dealer: seed.title.includes("개인") ? "개인판매자" : sellerScenario.name,
  stock: seed.title.includes("개인") ? 1 : 6,
  posted: `${(id % 11) + 2}분 전`,
  photos: 12 + (id % 16),
});

const chototTestCars: Car[] = [
  makeChoTotCar(1001, { maker: "현대", image: "detail/raw-18.jpeg", title: "현대 그랜저 GN7", trim: "캘리그래피 무사고", specs: ["2023년식", "30,000km", "가솔린", "312하8451"], price: "4,150 만원", place: "서울 강남구 · 오토갤러리", filter: { year: 2023, seats: "5인승", condition: "중고", mileage: 30000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "검정", origin: "국산", body: "세단", video: true } }),
  makeChoTotCar(1002, { maker: "기아", image: "detail/raw-09.jpeg", title: "기아 카니발 4세대", trim: "하이리무진 7인승 리무진시트", specs: ["2022년식", "50,000km", "디젤", "265루0194"], price: "3,980 만원", place: "경기 성남시 · 분당전시장", filter: { year: 2022, seats: "7인승 이상", condition: "중고", mileage: 50000, owners: "1인", transmission: "오토", fuel: "디젤", color: "흰색", origin: "국산", body: "승합", video: true } }),
  makeChoTotCar(1003, { maker: "제네시스", image: "detail/raw-04.png", title: "제네시스 G80 RG3", trim: "2.5T AWD 파퓰러패키지", specs: ["2021년식", "40,000km", "가솔린", "157거6028"], price: "4,290 만원", place: "서울 서초구", filter: { year: 2021, seats: "5인승", condition: "중고", mileage: 40000, owners: "2인", transmission: "오토", fuel: "가솔린", color: "회색", origin: "국산", body: "세단", video: false } }),
  makeChoTotCar(1004, { maker: "현대", image: "detail/raw-20.jpeg", title: "현대 아이오닉 5", trim: "롱레인지 프레스티지 AWD", specs: ["2022년식", "30,000km", "전기", "49버1307"], price: "3,190 만원", place: "인천 연수구", filter: { year: 2022, seats: "5인승", condition: "중고", mileage: 30000, owners: "1인", transmission: "오토", fuel: "전기", color: "흰색", origin: "국산", body: "SUV", video: true } }),
  makeChoTotCar(1005, { maker: "기아", image: "detail/raw-07.jpeg", title: "기아 쏘렌토 MQ4", trim: "시그니처 6인승", specs: ["2023년식", "20,000km", "가솔린", "201나7735"], price: "3,690 만원", place: "부산 해운대구 · 센텀전시장", filter: { year: 2023, seats: "6인승", condition: "중고", mileage: 20000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "회색", origin: "국산", body: "SUV", video: false } }),
  makeChoTotCar(1006, { maker: "BMW", image: "detail/raw-05.jpeg", title: "BMW 5시리즈 530i", trim: "M 스포츠 정식출고", specs: ["2024년식", "9,000km", "가솔린", "329도5521"], price: "7,640 만원", place: "서울 성동구 · 성수전시장", filter: { year: 2024, seats: "5인승", condition: "중고", mileage: 9000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "흰색", origin: "독일", body: "세단", video: true } }),
  makeChoTotCar(1007, { maker: "벤츠", image: "detail/raw-18.jpeg", title: "벤츠 E클래스 E 300 4MATIC", trim: "AMG Line 제조사보증", specs: ["2023년식", "10,000km", "가솔린", "118머4207"], price: "8,420 만원", place: "서울 강남구 · 한성자동차", filter: { year: 2023, seats: "5인승", condition: "중고", mileage: 10000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "검정", origin: "독일", body: "세단", video: true } }),
  makeChoTotCar(1016, { maker: "벤츠", modelGroup: "A-클래스", image: "cars/mercedes/models/a-class.png", imageFit: "contain", title: "벤츠 A클래스 A 220", trim: "A-클래스 W177 AMG Line", specs: ["2022년식", "18,000km", "가솔린", "220어1770"], price: "3,390 만원", place: "서울 강남구 · 벤츠 인증중고차", filter: { year: 2022, seats: "5인승", condition: "중고", mileage: 18000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "흰색", origin: "독일", body: "해치백", video: true } }),
  makeChoTotCar(1017, { maker: "벤츠", modelGroup: "C-클래스", image: "cars/mercedes/models/c-class.png", imageFit: "contain", title: "벤츠 C클래스 C 300 4MATIC", trim: "6세대 W206 AMG Line", specs: ["2024년식", "12,000km", "가솔린", "300서2060"], price: "6,780 만원", place: "서울 강남구 · 벤츠 인증중고차", filter: { year: 2024, seats: "5인승", condition: "중고", mileage: 12000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "검정", origin: "독일", body: "세단", video: true } }),
  makeChoTotCar(1018, { maker: "벤츠", modelGroup: "C-클래스", image: "cars/mercedes/models/c-class.png", imageFit: "contain", title: "벤츠 C클래스 C 200", trim: "6세대 W206 Avantgarde", specs: ["2023년식", "24,000km", "가솔린", "200다2061"], price: "5,690 만원", place: "서울 서초구 · 한성자동차", filter: { year: 2023, seats: "5인승", condition: "중고", mileage: 24000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "흰색", origin: "독일", body: "세단", video: false } }),
  makeChoTotCar(1019, { maker: "벤츠", modelGroup: "C-클래스", image: "cars/mercedes/models/c-class.png", imageFit: "contain", title: "벤츠 C클래스 C 220d", trim: "5세대 W205 C220d", specs: ["2019년식", "58,000km", "디젤", "220마2050"], price: "3,280 만원", place: "경기 고양시 · 수입차전시장", filter: { year: 2019, seats: "5인승", condition: "중고", mileage: 58000, owners: "2인", transmission: "오토", fuel: "디젤", color: "은색", origin: "독일", body: "세단", video: false } }),
  makeChoTotCar(1008, { maker: "아우디", image: "detail/raw-18.jpeg", title: "아우디 A6 3.0 TDI 콰트로", trim: "정식수입 무사고 실매물", specs: ["2012년식", "125,109km", "디젤", "28나7105"], price: "600 만원", place: "서울 강남구 도곡동 · 오토갤러리", filter: { year: 2012, seats: "5인승", condition: "중고", mileage: 125109, owners: "3인 이상", transmission: "오토", fuel: "디젤", color: "은색", origin: "독일", body: "세단", video: false } }),
  makeChoTotCar(1009, { maker: "포르쉐", image: "detail/raw-20.jpeg", title: "포르쉐 718 박스터", trim: "4.0 GTS 스포츠크로노", specs: ["2024년식", "8,000km", "가솔린", "39라7180"], price: "13,900 만원", place: "부산 해운대구", filter: { year: 2024, seats: "2인승", condition: "중고", mileage: 8000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "노랑", origin: "독일", body: "스포츠카", video: true } }),
  makeChoTotCar(1010, { maker: "랜드로버", image: "detail/raw-07.jpeg", title: "랜드로버 레인지로버 스포츠", trim: "P360 HSE 다이내믹", specs: ["2020년식", "60,000km", "가솔린", "143무9116"], price: "6,290 만원", place: "대구 수성구 · 수입차전시장", filter: { year: 2020, seats: "5인승", condition: "중고", mileage: 60000, owners: "2인", transmission: "오토", fuel: "가솔린", color: "흰색", origin: "영국", body: "SUV", video: false } }),
  makeChoTotCar(1011, { maker: "렉서스", image: "detail/raw-09.jpeg", title: "렉서스 ES300h", trim: "럭셔리 플러스 1인소유", specs: ["2022년식", "30,000km", "가솔린", "177서3001"], price: "4,550 만원", place: "경기 고양시", filter: { year: 2022, seats: "5인승", condition: "중고", mileage: 30000, owners: "1인", transmission: "CVT", fuel: "가솔린", color: "은색", origin: "일본", body: "세단", video: true } }),
  makeChoTotCar(1012, { maker: "벤틀리", image: "detail/raw-05.jpeg", title: "벤틀리 컨티넨탈 GT", trim: "6.0 W12 뮬리너 사양", specs: ["2019년식", "40,000km", "가솔린", "172무2323"], price: "15,700 만원", place: "서울 서초구 · 양재전시장", filter: { year: 2019, seats: "4인승", condition: "중고", mileage: 40000, owners: "2인", transmission: "오토", fuel: "가솔린", color: "검정", origin: "영국", body: "스포츠카", video: false } }),
  makeChoTotCar(1013, { maker: "페라리", image: "detail/raw-19.jpeg", title: "페라리 296 GTB", trim: "3.0 터보 카본패키지", specs: ["2024년식", "1,000km", "가솔린", "229마2626"], price: "33,900 만원", place: "서울 성동구 · 성수전시장", filter: { year: 2024, seats: "2인승", condition: "신차", mileage: 1000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "빨강", origin: "이탈리아", body: "스포츠카", video: true } }),
  makeChoTotCar(1014, { maker: "람보르기니", image: "detail/raw-04.png", title: "람보르기니 우라칸 EVO", trim: "LP640-4 리프팅시스템", specs: ["2020년식", "10,000km", "가솔린", "640어2020"], price: "24,900 만원", place: "서울 강남구 · 슈퍼카전시장", filter: { year: 2020, seats: "2인승", condition: "중고", mileage: 10000, owners: "2인", transmission: "오토", fuel: "가솔린", color: "노랑", origin: "이탈리아", body: "스포츠카", video: true } }),
  makeChoTotCar(1015, { maker: "롤스로이스", image: "detail/raw-05.jpeg", title: "롤스로이스 팬텀", trim: "6.7 V12 EWB 투톤", specs: ["2013년식", "50,000km", "가솔린", "100러6700"], price: "27,000 만원", place: "서울 서초구 · 오토갤러리", filter: { year: 2013, seats: "4인승", condition: "중고", mileage: 50000, owners: "3인 이상", transmission: "오토", fuel: "가솔린", color: "검정", origin: "영국", body: "세단", video: false } }),
];

// QF-090: 과쯔(개발 시안형) 필터 동작 확인용 추가 샘플 매물 41대 + 아래 RV·화물 4대(합계 64대). 차종·사진은 기존 매물을 그대로 쓰고
// 연식·주행·가격·연료·바디·색상·인승·변속기·판매자·지역·영상 값만 고르게 섞는다(새 이미지 없음). 초톳·동처띠 모드에는 쓰지 않는다.
const bbmSamplePools = {
  year: [2016, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2017, 2015, 2021],
  mileage: [3000, 8000, 15000, 27000, 42000, 65000, 88000, 120000, 160000, 230000, 51000, 36000],
  price: [890, 1450, 2280, 3150, 3490, 3820, 4380, 5260, 6190, 7450, 8900, 12800, 3270, 2650],
  body: ["세단", "SUV", "SUV", "해치백", "승합", "세단", "SUV", "스포츠카", "세단", "SUV", "해치백"],
  fuel: ["가솔린", "디젤", "가솔린", "하이브리드", "디젤", "LPG", "가솔린", "디젤", "하이브리드"],
  color: ["흰색", "검정", "회색", "은색", "흰색", "파랑", "검정", "빨강", "흰색", "은색"],
  seats: ["5인승", "5인승", "7인승 이상", "4인승", "5인승", "2인승", "6인승", "5인승"],
  transmission: ["오토", "오토", "오토", "수동", "오토", "CVT"],
  place: ["서울 강남구", "경기 수원시", "부산 해운대구", "인천 남동구", "대구 수성구", "대전 유성구", "광주 서구", "울산 남구", "경기 고양시", "충남 천안시", "경북 포항시", "서울 송파구", "경남 창원시", "제주 제주시", "강원 원주시", "전북 전주시"],
};
const bbmExtraCars: Car[] = Array.from({ length: 41 }, (_, index) => {
  const base = chototTestCars[index % chototTestCars.length];
  const pick = <T,>(list: readonly T[], salt: number) => list[(index * 7 + salt) % list.length];
  const baseFilter = base.filter!;
  // 다섯 대에 한 대(와 현대 그랜저 기반)는 "SUV · 디젤 · 3천만원대"로 두어 조건을 여러 개 걸어도 목록이 비지 않게 한다
  const featured = index % 5 === 0 || index % 19 === 0;
  const fuel = baseFilter.fuel === "전기" ? "전기" : featured ? "디젤" : pick(bbmSamplePools.fuel, 3);
  const year = pick(bbmSamplePools.year, 1);
  const mileage = pick(bbmSamplePools.mileage, 5);
  const price = featured ? [3150, 3490, 3820, 3270, 3650, 3990, 3050, 3710, 3380, 3560][index % 10] : pick(bbmSamplePools.price, 2);
  const id = 2001 + index;
  return {
    ...base,
    id,
    sellerType: index % 4 === 1 ? "개인" : "딜러",
    dealer: index % 4 === 1 ? "개인판매자" : base.dealer,
    stock: index % 4 === 1 ? 1 : 2 + (index % 9),
    specs: [`${year}년식`, `${mileage.toLocaleString("ko-KR")}km`, fuel, base.specs[3] ?? ""],
    price: `${price.toLocaleString("ko-KR")} 만원`,
    place: pick(bbmSamplePools.place, 4),
    posted: `${(index % 23) + 1}분 전`,
    photos: 8 + (index % 20),
    views: 120 + index * 13,
    filter: { ...baseFilter, year, mileage, fuel, body: featured ? "SUV" : pick(bbmSamplePools.body, 6), color: pick(bbmSamplePools.color, 8), seats: pick(bbmSamplePools.seats, 9), transmission: pick(bbmSamplePools.transmission, 10), video: index % 3 === 0 },
  };
});
// 크로스체크 보강: RV·화물 선택지도 목록이 걸러지도록 RV 2대(기존 카니발 사진 재사용)·화물 2대 추가. 새 이미지 없음
// QF-092: 화물 2대는 사진 없이 원본 카드의 빈 사진 자리(#EBEBEB 회색 칸)로 보인다(image "")
// id 는 기존 매물보다 작게 — 최신순(id 큰 순) 목록 맨 뒤에 둬서 첫 화면 카드는 그대로
const bbmBodyExtraCars: Car[] = [
  { base: 1002, id: 901, title: "기아 카니발 4세대", trim: "9인승 노블레스", body: "RV", year: 2021, mileage: 62000, price: 3290, fuel: "디젤", seats: "9인승", place: "경기 수원시", sellerType: "딜러" as const },
  { base: 1002, id: 902, title: "기아 카니발 하이리무진", trim: "7인승 시그니처", body: "RV", year: 2023, mileage: 21000, price: 4890, fuel: "가솔린", seats: "7인승 이상", place: "서울 송파구", sellerType: "개인" as const },
  { base: 1001, id: 903, title: "현대 포터2", trim: "초장축 슈퍼캡 CRDi", body: "화물", year: 2020, mileage: 118000, price: 1480, fuel: "디젤", seats: "3인승", place: "인천 남동구", sellerType: "딜러" as const, image: "" },
  { base: 1001, id: 904, title: "기아 봉고3", trim: "1톤 킹캡 초장축", body: "화물", year: 2019, mileage: 142000, price: 1290, fuel: "디젤", seats: "3인승", place: "대구 달서구", sellerType: "개인" as const, image: "" },
].map((seed) => {
  const base = chototTestCars.find((car) => car.id === seed.base) ?? chototTestCars[0];
  return {
    ...base,
    id: seed.id,
    maker: seed.title.split(" ")[0],
    title: seed.title,
    trim: seed.trim,
    image: seed.image ?? base.image,
    imageFit: base.imageFit,
    sellerType: seed.sellerType,
    dealer: seed.sellerType === "개인" ? "개인판매자" : base.dealer,
    stock: seed.sellerType === "개인" ? 1 : 4,
    specs: [`${seed.year}년식`, `${seed.mileage.toLocaleString("ko-KR")}km`, seed.fuel, ""],
    price: `${seed.price.toLocaleString("ko-KR")} 만원`,
    place: seed.place,
    posted: `${seed.id % 20 + 1}분 전`,
    photos: 10 + (seed.id % 9),
    filter: { ...base.filter!, year: seed.year, mileage: seed.mileage, fuel: seed.fuel, body: seed.body, seats: seed.seats, transmission: seed.body === "화물" ? "수동" : "오토", video: false },
  };
});
const bbmSampleCars: Car[] = [...chototTestCars, ...bbmExtraCars, ...bbmBodyExtraCars];

function matchesChoTotFilters(car: Car, value: ChoTotFilterState) {
  const data = car.filter;
  if (!data) return false;
  const price = parsePrice(car.price);
  const category = vehicleCategoryOptions.includes(value.category) ? value.category : "전체";
  const categoryMatch = category === "전체"
    || category === "중고차"
    || category === "국산차" && domesticMakerNames.has(car.maker)
    || category === "수입차" && !domesticMakerNames.has(car.maker)
    || category === "전기차" && data.fuel === "전기"
    || ["트럭 · 특장", "바이크", "캠핑카", "올드카", "건설기계", "부품 · 용품"].includes(category);
  const yearMatch = value.year === "전체"
    || value.year === "2024~2026" && data.year >= 2024
    || value.year === "2021~2023" && data.year >= 2021 && data.year <= 2023
    || value.year === "2018~2020" && data.year >= 2018 && data.year <= 2020
    || value.year === "2017 이전" && data.year <= 2017;
  const mileageLimit = Number(value.mileageMax.replaceAll(",", ""));

  return (value.price.min === 0 || price >= value.price.min)
    && categoryMatch
    && (value.price.max === null || price <= value.price.max)
    && (value.seats === "전체" || data.seats === value.seats)
    && (!value.maker || car.maker === value.maker)
    && (!value.model || normalizeModelSearchText(`${car.title} ${car.trim} ${car.modelGroup ?? ""}`).includes(normalizeModelSearchText(value.model)))
    && yearMatch
    && (value.condition === "전체" || data.condition === value.condition)
    && (!mileageLimit || data.mileage <= mileageLimit)
    && (value.owners === "전체" || data.owners === value.owners)
    && (value.transmission === "전체" || data.transmission === value.transmission)
    && (value.fuel === "전체" || data.fuel === value.fuel)
    && (!value.colors.length || value.colors.includes(data.color))
    && (value.origin === "전체" || data.origin === value.origin)
    && (value.body === "전체" || data.body === value.body)
    && (!value.videoOnly || data.video)
    && (value.seller === "전체" || car.sellerType === value.seller);
}

function shuffleCars(source: Car[]) {
  const shuffled = source.map((car) => {
    const badgePool = [...listingBadgeOptions];
    for (let index = badgePool.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [badgePool[index], badgePool[target]] = [badgePool[target], badgePool[index]];
    }
    return { ...car, badges: badgePool.slice(0, car.id % 4) };
  });
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

const sheetLabels: Record<Exclude<SheetType, null>, string> = {
  filter: "상세 필터", quick: "빠른 필터", carType: "카테고리", maker: "제조사", vehicle: "차종 선택", year: "연식", price: "가격", region: "지역", sort: "정렬",
};

const detailPhotoSources = ["raw-04.png", "raw-09.jpeg", "raw-07.jpeg", "raw-20.jpeg", "raw-05.jpeg", "raw-10.jpeg", "raw-18.jpeg", "raw-19.jpeg"].map((name) => asset(`detail/${name}`));
const detailPhotos = Array.from({ length: 24 }, (_, index) => detailPhotoSources[index % detailPhotoSources.length]);
const detailVehiclePlate = "172무2323";
const vehicleHistoryUrl = (plate: string) => `vehicle-history/?mode=dealer&plate=${encodeURIComponent(plate.replace(/\s+/g, ""))}`;

const optionItems = [
  { label: "파노라마 선루프", icon: "option-01.png" },
  { label: "LED 헤드램프", icon: "option-02.png" },
  { label: "어댑티브 크루즈 컨트롤", icon: "option-03.png" },
  { label: "후방카메라", icon: "option-04.png" },
  { label: "어라운드뷰", icon: "option-05.png" },
  { label: "스마트키", icon: "option-smart-key.png" },
  { label: "순정 내비게이션", icon: "option-07.png" },
  { label: "열선시트", icon: "option-08.png" },
  { label: "통풍시트", icon: "option-09.png" },
  { label: "헤드업 디스플레이", icon: "option-10.png" },
  { label: "전동트렁크", icon: "option-11.png" },
  { label: "자동 긴급제동", icon: "option-12.png" },
];

const vehicleInfo = [
  ["연식", "2021년 1월"], ["주행거리", formatMileage("42,000 km")], ["연료", "가솔린"], ["변속기", "자동 8단"],
  ["배기량", "2,497 cc"], ["색상", "검정색 (외장) · 흰색 (시트)"], ["사고이력", "없음"],
];

const extraInfo = [
  ["최초등록일", "2021년 09월 15일"], ["차종", "준중형 SUV"], ["최고출력", "281마력"], ["최대토크", "43kg·m"],
  ["복합연비", "15.7km/ℓ"], ["전장 · 전폭 · 전고", "4,815 × 1,900 × 1,695"], ["공차중량", "1,375kg"], ["인승", "5인승"],
  ["압류 · 저당", "0건 · 0건"], ["재조사 보증", "가능"], ["수입구분", "정식수입"],
];

const priceHistoryRows = [
  { date: "2026.08.10", direction: "down", change: "50만원 인하", price: "1,519만원" },
  { date: "2026.07.31", direction: "down", change: "40만원 인하", price: "1,519만원" },
  { date: "2026.07.20", direction: "down", change: "30만원 인하", price: "1,489만원" },
  { date: "2026.07.11", direction: "up", change: "100만원 인상", price: "1,519만원" },
  { date: "2026.06.17", direction: "down", change: "20만원 인하", price: "1,499만원" },
  { date: "2026.06.05", direction: "down", change: "50만원 인상", price: "1,569만원" },
  { date: "2026.05.20", direction: "down", change: "10만원 인하", price: "1,509만원" },
  { date: "2026.05.01", direction: "first", change: "최초 등록", price: "1,589만원" },
] as const;

const relatedCars = [
  { image: "raw-18.jpeg", title: "2021 벤츠 G클래스 3세대 G63 AMG", meta: "19년 12월식 · 42,920 km", price: "9,500만원", place: "경기 수원시", posted: "2일 전" },
  { image: "raw-09.jpeg", title: "2010 쉐보레 타호 6.0L 하이브리드", meta: "19년 12월식 · 42,920 km", price: "1,420만원", place: "서울 성동구", posted: "10일 전" },
  { image: "raw-05.jpeg", title: "2013 롤스로이스 팬텀 6.7 V12", meta: "19년 12월식 · 42,920 km", price: "9,500만원", place: "서울 서초구", posted: "2일 전" },
];

const classCars = [
  { image: "raw-20.jpeg", title: "2024 포르쉐 718 박스터 4.0 GTS", price: "9,500만원", place: "서울 서초구", posted: "32일 전" },
  { image: "raw-07.jpeg", title: "2019 벤틀리 컨티넨탈 GT 3세대 6.0 GTC", price: "9,500만원", place: "서울 서초구", posted: "28일 전" },
  { image: "raw-19.jpeg", title: "2019 맥라렌 570S 스파이더", price: "9,500만원", place: "서울 서초구", posted: "2일 전" },
];


export {
  bbmSampleCars,
  isDesktopPreview,
  getInitialQuickFilterStyle,
  isForcedMobileView,
  forcedMobileDesignWidth,
  asset,
  FavoritesProvider,
  useFavorites,
  sellerScenario,
  sellerLabel,
  sellerAvatar,
  displaySpecs,
  displayListPlace,
  emptyPrice,
  priceSteps,
  pricePresets,
  parsePrice,
  normalizeModelSearchText,
  matchesPrice,
  formatPriceValue,
  priceFilterLabel,
  formatMileage,
  brands,
  vehicleCategories,
  guaziVehicleTypeCategories,
  categorySheetItems,
  usedCarCategoryOptions,
  vehicleCategoryOptions,
  dongchediBrandLogo,
  makerOptions,
  domesticMakerNames,
  defaultBrandRailOptions,
  superLuxuryBrandRailOptions,
  importedBrandRailOptions,
  categoryBrandRails,
  bmwModels,
  benzAClassImages,
  benzEncarClassOrder,
  quickModelVisualsByMaker,
  showGuaziInventoryCounts,
  toTrimOption,
  formatModelLabel,
  generationDisplayLabel,
  generationCodeLabel,
  generationCardLabel,
  compactYearLabel,
  compactGenerationCardYearLabel,
  generationCountLabel,
  bodyTypeLabel,
  quickModelsByMaker,
  quickGenerationsByMakerModel,
  quickRegions,
  quickFilterStyleOptions,
  provinceOptions,
  districtsByProvince,
  radiusOptions,
  emptyRegion,
  getInitialChoTotFilters,
  listingBadgeOptions,
  defaultCars,
  bmwCars,
  benzCars,
  inventoryCars,
  chototTestCars,
  matchesChoTotFilters,
  shuffleCars,
  sheetLabels,
  detailPhotos,
  detailVehiclePlate,
  vehicleHistoryUrl,
  optionItems,
  vehicleInfo,
  extraInfo,
  priceHistoryRows,
  relatedCars,
  classCars
};

export type {
  SheetType,
  DetailSheet,
  RegionSelection,
  RegionMenu,
  PriceMode,
  QuickFilterStyle,
  ListingBadge,
  Car,
  VehicleBodyFit,
  BodyType,
  MakerOption,
  BrandRailOption,
  CategoryBrandRail,
  QuickTrimOption,
  QuickGenerationOption,
  QuickModelVisual
};
