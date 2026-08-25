import { createContext, useContext, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import {
  BookmarkFilledIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  HeartFilledIcon,
  HeartIcon,
  LockClosedIcon,
  MobileIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import {
  siBentley,
  siBugatti,
  siCadillac,
  siChevrolet,
  siFerrari,
  siFord,
  siHyundai,
  siHonda,
  siInfiniti,
  siJeep,
  siKia,
  siLamborghini,
  siMaserati,
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
import {
  BottomSheet,
  Carousel,
  FlowStack,
  KeyboardInput,
  MobileScroll,
  type FlowScreen,
  useFlow,
  useKeyboard,
} from "./mobile";
import { ChoTotFilterSheet, ChoTotQuickFilterSheet, emptyChoTotFilters, vehicleCategoryOptions, type ChoTotFilterFocus, type ChoTotFilterState } from "./ChoTotFilterSheet";
import "./prototype.css";

export type SellerType = "전체" | "개인" | "딜러";
type SheetType = "filter" | "quick" | "carType" | "maker" | "year" | "price" | "region" | "sort" | null;
type DetailSheet = "contact" | "more" | "priceHistory" | null;
type RegionSelection = { province: string; district: string; radius: string };
type RegionMenu = "province" | "district" | "radius" | null;
type PriceMode = "cash" | "lease";
export type PriceSelection = { mode: PriceMode; min: number; max: number | null };
type ListingBadge = "브랜드인증" | "제조사보증" | "1인소유" | "가격인하" | "인증중고차";

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

const sellerLabel = (car: Car) => car.sellerType === "개인" ? "개인판매자" : car.dealer.replace(/\s*딜러$/, "");
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
  { name: "BMW", logo: asset("brand/bmw.svg") },
  { name: "벤츠", logo: asset("brand/benz.png") },
  { name: "아우디", logo: asset("brand/audi.svg") },
  { name: "포르쉐", logo: asset("brand/porsche-symbol.png") },
  { name: "미니", logo: asset("brand/mini.svg") },
];

const vehicleCategories = [
  { name: "중고차", icon: "categories/used-car.svg" },
  { name: "트럭 · 특장", icon: "categories/truck.svg" },
  { name: "바이크", icon: "categories/bike.svg" },
  { name: "캠핑카", icon: "categories/camping.svg" },
  { name: "올드카", icon: "categories/used-car.svg" },
  { name: "건설기계", icon: "categories/construction.svg" },
  { name: "부품 · 용품", icon: "categories/parts.svg" },
] as const;

const categorySheetItems: ReadonlyArray<{ name: string; icon?: string }> = [
  { name: "중고차", icon: "categories/used-car.svg" },
  { name: "트럭 · 특장", icon: "categories/truck.svg" },
  { name: "바이크", icon: "categories/bike.svg" },
  { name: "캠핑카", icon: "categories/camping.svg" },
  { name: "올드카", icon: "categories/used-car.svg" },
  { name: "건설기계", icon: "categories/construction.svg" },
  { name: "부품 · 용품", icon: "categories/parts.svg" },
];

const usedCarCategoryOptions = ["전체 중고차", "국산차", "수입차", "전기차"] as const;

type MakerOption = { name: string; maker: string; logo?: string; icon?: SimpleIcon; color?: string };
const makerOptions: MakerOption[] = [
  { name: "BMW", maker: "BMW", logo: asset("brand/bmw.svg") },
  { name: "메르세데스-벤츠", maker: "벤츠", logo: asset("brand/benz.png") },
  { name: "아우디", maker: "아우디", logo: asset("brand/audi.svg") },
  { name: "포르쉐", maker: "포르쉐", logo: asset("brand/porsche-symbol.png") },
  { name: "미니", maker: "미니", logo: asset("brand/mini.svg") },
  { name: "랜드로버", maker: "랜드로버", logo: asset("brand/land-rover.svg") },
  { name: "볼보", maker: "볼보", icon: siVolvo, color: "#173a6b" },
  { name: "렉서스", maker: "렉서스", logo: asset("brand/lexus.svg") },
  { name: "테슬라", maker: "테슬라", icon: siTesla, color: "#e82127" },
  { name: "폭스바겐", maker: "폭스바겐", icon: siVolkswagen, color: "#143c6f" },
  { name: "토요타", maker: "토요타", icon: siToyota },
  { name: "혼다", maker: "혼다", icon: siHonda },
  { name: "재규어", maker: "재규어", logo: asset("brand/jaguar.png") },
  { name: "쉐보레", maker: "쉐보레", icon: siChevrolet, color: "#d7a52b" },
  { name: "포드", maker: "포드", icon: siFord, color: "#153e7b" },
  { name: "지프", maker: "지프", icon: siJeep },
  { name: "캐딜락", maker: "캐딜락", icon: siCadillac },
  { name: "링컨", maker: "링컨", logo: asset("brand/lincoln.png") },
  { name: "닛산", maker: "닛산", icon: siNissan },
  { name: "인피니티", maker: "인피니티", icon: siInfiniti },
  { name: "마세라티", maker: "마세라티", icon: siMaserati },
  { name: "벤틀리", maker: "벤틀리", icon: siBentley },
  { name: "페라리", maker: "페라리", icon: siFerrari, color: "#d3182d" },
  { name: "람보르기니", maker: "람보르기니", icon: siLamborghini, color: "#a98224" },
  { name: "부가티", maker: "부가티", icon: siBugatti, color: "#bf1238" },
  { name: "스바루", maker: "스바루", icon: siSubaru, color: "#174c92" },
  { name: "스즈키", maker: "스즈키", icon: siSuzuki, color: "#d71920" },
];

type BrandRailOption = { name: string; maker?: string; logo?: string; icon?: SimpleIcon; color?: string; full?: boolean };
type CategoryBrandRail = { title: string; options: BrandRailOption[] };

const domesticMakerNames = new Set(["현대", "기아", "제네시스"]);
const defaultBrandRailOptions: BrandRailOption[] = [
  ...brands.map((brand) => ({ ...brand, maker: brand.name })),
  { name: "현대", maker: "현대", icon: siHyundai, color: "#002c5f" },
  { name: "기아", maker: "기아", icon: siKia, color: "#05141f" },
];
const categoryBrandRails: Record<string, CategoryBrandRail> = {
  "전체 차량": { title: "제조사", options: defaultBrandRailOptions },
  중고차: { title: "제조사", options: defaultBrandRailOptions },
  국산차: {
    title: "제조사",
    options: [
      { name: "현대", maker: "현대", icon: siHyundai, color: "#002c5f" },
      { name: "기아", maker: "기아", icon: siKia, color: "#05141f" },
      { name: "제네시스", maker: "제네시스" },
    ],
  },
  수입차: {
    title: "제조사",
    options: [
      { name: "BMW", maker: "BMW", logo: asset("brand/bmw.svg") },
      { name: "벤츠", maker: "벤츠", logo: asset("brand/benz.png") },
      { name: "아우디", maker: "아우디", logo: asset("brand/audi.svg") },
      { name: "포르쉐", maker: "포르쉐", logo: asset("brand/porsche-symbol.png") },
      { name: "렉서스", maker: "렉서스", logo: asset("brand/lexus.svg") },
    ],
  },
  전기차: {
    title: "제조사",
    options: [
      { name: "현대", maker: "현대", icon: siHyundai, color: "#002c5f" },
      { name: "테슬라", maker: "테슬라", icon: siTesla, color: "#e82127" },
      { name: "BMW", maker: "BMW", logo: asset("brand/bmw.svg") },
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
  "화물 · 특장 · 버스": {
    title: "제조사",
    options: [
      { name: "현대", maker: "현대", icon: siHyundai, color: "#002c5f" },
      { name: "기아", maker: "기아", icon: siKia, color: "#05141f" },
      { name: "쉐보레", maker: "쉐보레", icon: siChevrolet, color: "#d7a52b" },
    ],
  },
  캠핑카: { title: "제조사", options: defaultBrandRailOptions.slice(0, 5) },
  올드카: { title: "제조사", options: defaultBrandRailOptions.slice(0, 5) },
  건설기계: { title: "제조사", options: [{ name: "현대", maker: "현대", icon: siHyundai, color: "#002c5f" }, { name: "볼보", maker: "볼보", icon: siVolvo, color: "#173a6b" }] },
  "부품 · 용품": { title: "분류", options: [{ name: "타이어" }, { name: "휠" }, { name: "튜닝" }, { name: "오디오" }] },
};

const bmwModels = [
  { name: "3시리즈", image: asset("cars/bmw/3-series.webp") },
  { name: "X1", image: asset("cars/bmw/x1.webp") },
  { name: "5시리즈", image: asset("cars/bmw/5-series.webp") },
  { name: "X3", image: asset("cars/bmw/x3.webp") },
  { name: "1시리즈", image: asset("cars/bmw/1-series.webp") },
];

const benzModels = ["E클래스", "S클래스", "GLC클래스", "GLE클래스", "C클래스"];
const quickRegions = ["경기", "서울", "부산", "대구", "인천", "전남광주"];
const provinceOptions = ["전국", "경기", "서울", "부산", "대구", "인천", "광주", "대전", "울산", "경남"];
const districtsByProvince: Record<string, string[]> = {
  경기: ["전체", "성남시", "고양시", "수원시"], 서울: ["전체", "강남구", "서초구", "성동구"], 부산: ["전체", "해운대구"],
  대구: ["전체", "수성구"], 인천: ["전체", "연수구", "남동구"], 광주: ["전체", "서구"], 대전: ["전체", "유성구"],
  울산: ["전체", "남구"], 경남: ["전체", "창원시"],
};
const radiusOptions = ["5km", "10km", "20km", "50km"];
const emptyRegion: RegionSelection = { province: "", district: "", radius: "" };
const listingBadgeOptions: ListingBadge[] = ["브랜드인증", "제조사보증", "1인소유", "가격인하", "인증중고차"];

const defaultCars: Car[] = [
  {
    id: 1, maker: "벤츠", sellerType: "딜러", image: "cars/thumbnail.png", title: "벤츠 CLS 450 4MATIC", trim: "AMG Line",
    specs: ["23년06월", "18,420km", "가솔린", "흰색시트"], price: "8,420 만원",
    place: "서울 강남구 · 오토갤러리", views: 128, dealer: "스타모터스 이준호 딜러", stock: 12, posted: "3분 전", photos: 14,
  },
  {
    id: 2, maker: "벤츠", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 G63 AMG", trim: "매뉴팩처 프로그램",
    specs: ["21년12월", "31,900km", "가솔린", "흰색시트"], price: "19,800 만원",
    place: "경기 성남시 · 오토갤러리", views: 301, dealer: "와이즈오토 김태윤", stock: 8, posted: "12분 전", photos: 22,
  },
  {
    id: 3, maker: "포르쉐", sellerType: "개인", image: "detail/raw-20.jpeg", title: "포르쉐 718 박스터", trim: "4.0 GTS",
    specs: ["24년03월", "8,130km", "가솔린", "흰색시트"], price: "13,900 만원",
    place: "부산 해운대구", views: 219, dealer: "개인판매자", stock: 1, posted: "24분 전", photos: 18,
  },
  {
    id: 4, maker: "벤틀리", sellerType: "딜러", image: "detail/raw-07.jpeg", title: "벤틀리 컨티넨탈 GT", trim: "6.0 W12",
    specs: ["19년11월", "42,920km", "가솔린", "검정색"], price: "15,700 만원",
    place: "서울 서초구 · 양재전시장", views: 410, dealer: "라스트라다 최민석 딜러", stock: 21, posted: "37분 전", photos: 26,
  },
  {
    id: 5, maker: "벤틀리", sellerType: "개인", image: "detail/raw-04.png", title: "벤틀리 플라잉스퍼", trim: "4.0 V8 아주르",
    specs: ["22년05월", "26,500km", "가솔린", "흰색시트"], price: "21,500 만원",
    place: "대구 수성구", views: 175, dealer: "개인판매자", stock: 1, posted: "1시간 전", photos: 16,
  },
  {
    id: 6, maker: "맥라렌", sellerType: "딜러", image: "detail/raw-19.jpeg", title: "맥라렌 570S 스파이더", trim: "3.8 V8",
    specs: ["19년08월", "19,600km", "가솔린", "흰색시트"], price: "18,900 만원",
    place: "서울 성동구 · 성수전시장", views: 362, dealer: "프라임카 김도윤 딜러", stock: 15, posted: "2시간 전", photos: 24,
  },
  {
    id: 7, maker: "롤스로이스", sellerType: "딜러", image: "detail/raw-05.jpeg", title: "롤스로이스 팬텀", trim: "6.7 V12 EWB",
    specs: ["13년09월", "54,200km", "가솔린", "회색시트"], price: "27,000 만원",
    place: "서울 서초구 · 오토갤러리", views: 508, dealer: "더클래스 윤성호 딜러", stock: 6, posted: "어제", photos: 31,
  },
  {
    id: 8, maker: "벤츠", sellerType: "개인", image: "cars/thumbnail.png", title: "벤츠 E 300 4MATIC", trim: "아방가르드",
    specs: ["22년02월", "36,700km", "가솔린", "흰색시트"], price: "5,480 만원",
    place: "인천 연수구", views: 96, dealer: "개인판매자", stock: 1, posted: "어제", photos: 11,
  },
];

const bmwCars: Car[] = [
  { id: 101, maker: "BMW", modelGroup: "3시리즈", sellerType: "딜러", image: "cars/bmw/3-series.webp", imageFit: "contain", title: "BMW 3시리즈 320i", trim: "M 스포츠 프로", specs: ["23년09월", "21,430km", "가솔린", "검정색"], price: "5,390 만원", place: "서울 강남구 · BMW 인증센터", views: 184, dealer: "도이치모터스 김재현 딜러", stock: 14, posted: "2분 전", photos: 19 },
  { id: 102, maker: "BMW", modelGroup: "3시리즈", sellerType: "개인", image: "cars/bmw/3-series.webp", imageFit: "contain", title: "BMW 3시리즈 330e", trim: "M 스포츠", specs: ["22년04월", "34,800km", "플러그인 하이브리드", "검정색"], price: "4,850 만원", place: "경기 고양시", views: 137, dealer: "개인판매자", stock: 1, posted: "18분 전", photos: 12 },
  { id: 103, maker: "BMW", modelGroup: "X1", sellerType: "딜러", image: "cars/bmw/x1.webp", imageFit: "contain", title: "BMW X1 sDrive20i", trim: "xLine", specs: ["24년01월", "12,700km", "가솔린", "흰색시트"], price: "5,120 만원", place: "부산 해운대구 · BMW 프리미엄 셀렉션", views: 211, dealer: "동성모터스 박지훈 딜러", stock: 9, posted: "6분 전", photos: 21 },
  { id: 104, maker: "BMW", modelGroup: "X1", sellerType: "개인", image: "cars/bmw/x1.webp", imageFit: "contain", title: "BMW X1 xDrive20i", trim: "M 스포츠", specs: ["23년07월", "18,050km", "가솔린", "흰색시트"], price: "5,450 만원", place: "대전 유성구", views: 102, dealer: "개인판매자", stock: 1, posted: "41분 전", photos: 15 },
  { id: 105, maker: "BMW", modelGroup: "5시리즈", sellerType: "딜러", image: "cars/bmw/5-series.webp", imageFit: "contain", title: "BMW 5시리즈 530i", trim: "M 스포츠", specs: ["24년03월", "9,820km", "가솔린", "남색"], price: "7,640 만원", place: "서울 성동구 · 성수 전시장", views: 328, dealer: "한독모터스 오세훈 딜러", stock: 18, posted: "9분 전", photos: 27 },
  { id: 106, maker: "BMW", modelGroup: "5시리즈", sellerType: "딜러", image: "cars/bmw/5-series.webp", imageFit: "contain", title: "BMW 5시리즈 520i", trim: "럭셔리", specs: ["22년11월", "29,600km", "가솔린", "남색"], price: "5,750 만원", place: "광주 서구 · BMW 인증센터", views: 165, dealer: "코오롱모터스 한소희 딜러", stock: 11, posted: "53분 전", photos: 17 },
  { id: 107, maker: "BMW", modelGroup: "X3", sellerType: "딜러", image: "cars/bmw/x3.webp", imageFit: "contain", title: "BMW X3 xDrive20i", trim: "M 스포츠 프로", specs: ["24년02월", "14,390km", "가솔린", "갈색"], price: "7,180 만원", place: "경기 수원시 · BMW 프리미엄 셀렉션", views: 287, dealer: "내쇼날모터스 정우성 딜러", stock: 7, posted: "4분 전", photos: 23 },
  { id: 108, maker: "BMW", modelGroup: "X3", sellerType: "개인", image: "cars/bmw/x3.webp", imageFit: "contain", title: "BMW X3 xDrive30e", trim: "M 스포츠", specs: ["22년08월", "41,200km", "플러그인 하이브리드", "갈색"], price: "5,980 만원", place: "울산 남구", views: 119, dealer: "개인판매자", stock: 1, posted: "1시간 전", photos: 14 },
  { id: 109, maker: "BMW", modelGroup: "1시리즈", sellerType: "딜러", image: "cars/bmw/1-series.webp", imageFit: "contain", title: "BMW 1시리즈 120i", trim: "M 스포츠", specs: ["23년05월", "25,900km", "가솔린", "흰색시트"], price: "3,890 만원", place: "인천 남동구 · BMW 인증센터", views: 148, dealer: "바바리안모터스 장민호 딜러", stock: 13, posted: "14분 전", photos: 18 },
  { id: 110, maker: "BMW", modelGroup: "1시리즈", sellerType: "개인", image: "cars/bmw/1-series.webp", imageFit: "contain", title: "BMW 1시리즈 M135i", trim: "xDrive", specs: ["22년06월", "33,100km", "가솔린", "흰색시트"], price: "4,320 만원", place: "경남 창원시", views: 202, dealer: "개인판매자", stock: 1, posted: "2시간 전", photos: 20 },
];

const benzCars: Car[] = [
  { id: 201, maker: "벤츠", modelGroup: "E클래스", sellerType: "딜러", image: "cars/thumbnail.png", title: "벤츠 E클래스 E 300 4MATIC", trim: "AMG Line", specs: ["23년06월", "18,420km", "가솔린", "흰색시트"], price: "8,420 만원", place: "서울 강남구 · 한성자동차", views: 128, dealer: "스타모터스 이준호 딜러", stock: 12, posted: "3분 전", photos: 14 },
  { id: 202, maker: "벤츠", modelGroup: "E클래스", sellerType: "개인", image: "cars/thumbnail.png", title: "벤츠 E클래스 E 220 d 4MATIC", trim: "Exclusive", specs: ["22년02월", "36,700km", "디젤", "흰색시트"], price: "5,480 만원", place: "인천 연수구", views: 96, dealer: "개인판매자", stock: 1, posted: "18분 전", photos: 11 },
  { id: 203, maker: "벤츠", modelGroup: "S클래스", sellerType: "딜러", image: "cars/thumbnail.png", title: "벤츠 S클래스 S 450 4MATIC", trim: "Long", specs: ["23년11월", "11,840km", "가솔린", "검정색"], price: "16,900 만원", place: "서울 서초구 · 더클래스 효성", views: 342, dealer: "효성프리미어모터스 박정우 딜러", stock: 7, posted: "7분 전", photos: 24 },
  { id: 204, maker: "벤츠", modelGroup: "S클래스", sellerType: "개인", image: "cars/thumbnail.png", title: "벤츠 S클래스 S 580 e 4MATIC", trim: "Long", specs: ["22년09월", "28,100km", "플러그인 하이브리드", "회색시트"], price: "14,700 만원", place: "경기 성남시", views: 207, dealer: "개인판매자", stock: 1, posted: "32분 전", photos: 18 },
  { id: 205, maker: "벤츠", modelGroup: "GLC클래스", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 GLC클래스 GLC 300 4MATIC", trim: "AMG Line", specs: ["24년01월", "9,760km", "가솔린", "흰색시트"], price: "7,950 만원", place: "부산 해운대구 · 벤츠 인증중고차", views: 255, dealer: "스타자동차 김민석 딜러", stock: 9, posted: "11분 전", photos: 21 },
  { id: 206, maker: "벤츠", modelGroup: "GLC클래스", sellerType: "개인", image: "detail/raw-18.jpeg", title: "벤츠 GLC클래스 GLC 220 d 4MATIC", trim: "Avantgarde", specs: ["21년08월", "44,200km", "디젤", "흰색시트"], price: "4,890 만원", place: "대전 유성구", views: 154, dealer: "개인판매자", stock: 1, posted: "46분 전", photos: 13 },
  { id: 207, maker: "벤츠", modelGroup: "GLE클래스", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 GLE클래스 GLE 450 4MATIC", trim: "AMG Line", specs: ["23년04월", "22,600km", "가솔린", "흰색시트"], price: "11,900 만원", place: "경기 수원시 · 벤츠 인증중고차", views: 319, dealer: "모터원 이재훈 딜러", stock: 15, posted: "5분 전", photos: 27 },
  { id: 208, maker: "벤츠", modelGroup: "GLE클래스", sellerType: "개인", image: "detail/raw-18.jpeg", title: "벤츠 GLE클래스 GLE 300 d 4MATIC", trim: "Premium", specs: ["22년12월", "31,300km", "디젤", "흰색시트"], price: "8,780 만원", place: "광주 서구", views: 181, dealer: "개인판매자", stock: 1, posted: "1시간 전", photos: 17 },
  { id: 209, maker: "벤츠", modelGroup: "C클래스", sellerType: "딜러", image: "cars/thumbnail.png", title: "벤츠 C클래스 C 300 4MATIC", trim: "AMG Line", specs: ["24년02월", "7,900km", "가솔린", "흰색시트"], price: "6,480 만원", place: "서울 성동구 · KCC오토", views: 223, dealer: "KCC오토 장현수 딜러", stock: 11, posted: "9분 전", photos: 20 },
  { id: 210, maker: "벤츠", modelGroup: "C클래스", sellerType: "개인", image: "cars/thumbnail.png", title: "벤츠 C클래스 C 200 Avantgarde", trim: "Avantgarde", specs: ["22년05월", "29,400km", "가솔린", "흰색시트"], price: "4,350 만원", place: "경남 창원시", views: 117, dealer: "개인판매자", stock: 1, posted: "2시간 전", photos: 12 },
];

const inventoryCars = [...defaultCars, ...bmwCars, ...benzCars];

type ChoTotCarSeed = Omit<Car, "id" | "sellerType" | "views" | "dealer" | "stock" | "posted" | "photos">;
const makeChoTotCar = (id: number, seed: ChoTotCarSeed): Car => ({
  ...seed,
  id,
  sellerType: seed.title.includes("개인") ? "개인" : seed.maker === "제네시스" || seed.maker === "현대" && seed.title.includes("아이오닉") || seed.maker === "렉서스" || seed.maker === "포르쉐" ? "개인" : "딜러",
  views: 160 + id * 17,
  dealer: seed.title.includes("개인") ? "개인판매자" : `${seed.maker} 인증센터 딜러`,
  stock: seed.title.includes("개인") ? 1 : 6,
  posted: `${(id % 11) + 2}분 전`,
  photos: 12 + (id % 16),
});

const chototTestCars: Car[] = [
  makeChoTotCar(1001, { maker: "현대", image: "cars/thumbnail.png", title: "현대 그랜저 GN7", trim: "캘리그래피 무사고", specs: ["2023년식", "30,000km", "가솔린", "312하8451"], price: "4,150 만원", place: "서울 강남구 · 오토갤러리", filter: { year: 2023, seats: "5인승", condition: "중고", mileage: 30000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "검정", origin: "국산", body: "세단", video: true } }),
  makeChoTotCar(1002, { maker: "기아", image: "detail/raw-09.jpeg", title: "기아 카니발 4세대", trim: "하이리무진 7인승 리무진시트", specs: ["2022년식", "50,000km", "디젤", "265루0194"], price: "3,980 만원", place: "경기 성남시 · 분당전시장", filter: { year: 2022, seats: "7인승 이상", condition: "중고", mileage: 50000, owners: "1인", transmission: "오토", fuel: "디젤", color: "흰색", origin: "국산", body: "승합", video: true } }),
  makeChoTotCar(1003, { maker: "제네시스", image: "detail/raw-04.png", title: "제네시스 G80 RG3", trim: "2.5T AWD 파퓰러패키지", specs: ["2021년식", "40,000km", "가솔린", "157거6028"], price: "4,290 만원", place: "서울 서초구", filter: { year: 2021, seats: "5인승", condition: "중고", mileage: 40000, owners: "2인", transmission: "오토", fuel: "가솔린", color: "회색", origin: "국산", body: "세단", video: false } }),
  makeChoTotCar(1004, { maker: "현대", image: "cars/thumbnail.png", title: "현대 아이오닉 5", trim: "롱레인지 프레스티지 AWD", specs: ["2022년식", "30,000km", "전기", "49버1307"], price: "3,190 만원", place: "인천 연수구", filter: { year: 2022, seats: "5인승", condition: "중고", mileage: 30000, owners: "1인", transmission: "오토", fuel: "전기", color: "흰색", origin: "국산", body: "SUV", video: true } }),
  makeChoTotCar(1005, { maker: "기아", image: "detail/raw-20.jpeg", title: "기아 쏘렌토 MQ4", trim: "시그니처 6인승", specs: ["2023년식", "20,000km", "가솔린", "201나7735"], price: "3,690 만원", place: "부산 해운대구 · 센텀전시장", filter: { year: 2023, seats: "6인승", condition: "중고", mileage: 20000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "회색", origin: "국산", body: "SUV", video: false } }),
  makeChoTotCar(1006, { maker: "BMW", image: "cars/bmw/5-series.webp", imageFit: "contain", title: "BMW 5시리즈 530i", trim: "M 스포츠 정식출고", specs: ["2024년식", "9,000km", "가솔린", "329도5521"], price: "7,640 만원", place: "서울 성동구 · 성수전시장", filter: { year: 2024, seats: "5인승", condition: "중고", mileage: 9000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "흰색", origin: "독일", body: "세단", video: true } }),
  makeChoTotCar(1007, { maker: "벤츠", image: "cars/thumbnail.png", title: "벤츠 E클래스 E 300 4MATIC", trim: "AMG Line 제조사보증", specs: ["2023년식", "10,000km", "가솔린", "118머4207"], price: "8,420 만원", place: "서울 강남구 · 한성자동차", filter: { year: 2023, seats: "5인승", condition: "중고", mileage: 10000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "검정", origin: "독일", body: "세단", video: true } }),
  makeChoTotCar(1008, { maker: "아우디", image: "detail/raw-18.jpeg", title: "아우디 A6 3.0 TDI 콰트로", trim: "정식수입 무사고 실매물", specs: ["2012년식", "125,109km", "디젤", "28나7105"], price: "600 만원", place: "서울 강남구 도곡동 · 오토갤러리", filter: { year: 2012, seats: "5인승", condition: "중고", mileage: 125109, owners: "3인 이상", transmission: "오토", fuel: "디젤", color: "은색", origin: "독일", body: "세단", video: false } }),
  makeChoTotCar(1009, { maker: "포르쉐", image: "detail/raw-20.jpeg", title: "포르쉐 718 박스터", trim: "4.0 GTS 스포츠크로노", specs: ["2024년식", "8,000km", "가솔린", "39라7180"], price: "13,900 만원", place: "부산 해운대구", filter: { year: 2024, seats: "2인승", condition: "중고", mileage: 8000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "노랑", origin: "독일", body: "스포츠카", video: true } }),
  makeChoTotCar(1010, { maker: "랜드로버", image: "detail/raw-07.jpeg", title: "랜드로버 레인지로버 스포츠", trim: "P360 HSE 다이내믹", specs: ["2020년식", "60,000km", "가솔린", "143무9116"], price: "6,290 만원", place: "대구 수성구 · 수입차전시장", filter: { year: 2020, seats: "5인승", condition: "중고", mileage: 60000, owners: "2인", transmission: "오토", fuel: "가솔린", color: "흰색", origin: "영국", body: "SUV", video: false } }),
  makeChoTotCar(1011, { maker: "렉서스", image: "cars/bmw/x1.webp", imageFit: "contain", title: "렉서스 ES300h", trim: "럭셔리 플러스 1인소유", specs: ["2022년식", "30,000km", "가솔린", "177서3001"], price: "4,550 만원", place: "경기 고양시", filter: { year: 2022, seats: "5인승", condition: "중고", mileage: 30000, owners: "1인", transmission: "CVT", fuel: "가솔린", color: "은색", origin: "일본", body: "세단", video: true } }),
  makeChoTotCar(1012, { maker: "벤틀리", image: "detail/raw-05.jpeg", title: "벤틀리 컨티넨탈 GT", trim: "6.0 W12 뮬리너 사양", specs: ["2019년식", "40,000km", "가솔린", "172무2323"], price: "15,700 만원", place: "서울 서초구 · 양재전시장", filter: { year: 2019, seats: "4인승", condition: "중고", mileage: 40000, owners: "2인", transmission: "오토", fuel: "가솔린", color: "검정", origin: "영국", body: "스포츠카", video: false } }),
  makeChoTotCar(1013, { maker: "페라리", image: "detail/raw-19.jpeg", title: "페라리 296 GTB", trim: "3.0 터보 카본패키지", specs: ["2024년식", "1,000km", "가솔린", "229마2626"], price: "33,900 만원", place: "서울 성동구 · 성수전시장", filter: { year: 2024, seats: "2인승", condition: "신차", mileage: 1000, owners: "1인", transmission: "오토", fuel: "가솔린", color: "빨강", origin: "이탈리아", body: "스포츠카", video: true } }),
  makeChoTotCar(1014, { maker: "람보르기니", image: "detail/raw-04.png", title: "람보르기니 우라칸 EVO", trim: "LP640-4 리프팅시스템", specs: ["2020년식", "10,000km", "가솔린", "640어2020"], price: "24,900 만원", place: "서울 강남구 · 슈퍼카전시장", filter: { year: 2020, seats: "2인승", condition: "중고", mileage: 10000, owners: "2인", transmission: "오토", fuel: "가솔린", color: "노랑", origin: "이탈리아", body: "스포츠카", video: true } }),
  makeChoTotCar(1015, { maker: "롤스로이스", image: "detail/raw-05.jpeg", title: "롤스로이스 팬텀", trim: "6.7 V12 EWB 투톤", specs: ["2013년식", "50,000km", "가솔린", "100러6700"], price: "27,000 만원", place: "서울 서초구 · 오토갤러리", filter: { year: 2013, seats: "4인승", condition: "중고", mileage: 50000, owners: "3인 이상", transmission: "오토", fuel: "가솔린", color: "검정", origin: "영국", body: "세단", video: false } }),
];

function matchesChoTotFilters(car: Car, value: ChoTotFilterState) {
  const data = car.filter;
  if (!data) return false;
  const price = parsePrice(car.price);
  const category = vehicleCategoryOptions.includes(value.category) ? value.category : "전체 차량";
  const categoryMatch = category === "전체 차량"
    || category === "중고차"
    || category === "국산차" && domesticMakerNames.has(car.maker)
    || category === "수입차" && !domesticMakerNames.has(car.maker)
    || category === "전기차" && data.fuel === "전기";
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
    && (!value.model || car.title.includes(value.model))
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
  filter: "상세 필터", quick: "빠른 필터", carType: "카테고리", maker: "제조사", year: "연식", price: "가격", region: "지역", sort: "정렬",
};

const detailPhotoSources = ["raw-04.png", "raw-09.jpeg", "raw-07.jpeg", "raw-20.jpeg", "raw-05.jpeg", "raw-10.jpeg", "raw-18.jpeg", "raw-19.jpeg"].map((name) => asset(`detail/${name}`));
const detailPhotos = Array.from({ length: 24 }, (_, index) => detailPhotoSources[index % detailPhotoSources.length]);

const optionItems = [
  "파노라마 선루프", "LED 헤드램프", "어댑티브 크루즈 컨트롤", "후방카메라",
  "어라운드뷰", "사이드 에어백", "순정 내비게이션", "열선시트",
  "통풍시트", "헤드업 디스플레이", "전동트렁크", "자동 긴급제동",
  "차선 이탈방지", "메모리 시트", "스마트 하이빔", "전자식 파킹브레이크",
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

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <img className={`ui-icon ${className}`} src={asset(`ui/${name}`)} alt="" aria-hidden="true" draggable={false} />;
}

function Header({ query, setQuery, searchPlaceholder, searchSaved, onToggleSearchSaved, onOpenFavorites }: { query: string; setQuery: (query: string) => void; searchPlaceholder: string; searchSaved: boolean; onToggleSearchSaved: () => void; onOpenFavorites: () => void }) {
  const keyboard = useKeyboard();

  return (
    <header className="top-bar" aria-label="중고차 검색">
      <button className="icon-button back-button" type="button" aria-label="뒤로 가기" onClick={() => window.history.back()}><Icon name="back.svg" /></button>
      <label className="search-field">
        <Icon name="search.svg" />
        <KeyboardInput aria-label={`${searchPlaceholder} 검색`} value={query} onChange={(event) => setQuery(event.currentTarget.value)} onBlur={() => keyboard.hide()} placeholder={searchPlaceholder} />
        <span className="search-divider" />
        <button type="button" className={`search-save${searchSaved ? " is-saved" : ""}`} aria-label={searchSaved ? "저장한 검색 조건 삭제" : "검색 조건 저장"} aria-pressed={searchSaved} onPointerDown={(event) => event.preventDefault()} onClick={onToggleSearchSaved}>{searchSaved ? <BookmarkFilledIcon /> : <Icon name="bookmark.svg" />}</button>
      </label>
      <button className="icon-button" type="button" aria-label="저장한 매물 열기" onClick={onOpenFavorites}><Icon name="heart.svg" /></button>
      <button className="icon-button" type="button" aria-label="메시지"><Icon name="message.svg" /></button>
    </header>
  );
}

function FilterChip({ label, icon, active, onClick, onClear }: { label: string; icon?: string; active?: boolean; onClick: () => void; onClear?: () => void }) {
  if (active && onClear) {
    return (
      <div className="filter-chip is-active">
        <button className="filter-chip-label" type="button" aria-pressed="true" onClick={onClick}><span>{label}</span></button>
        <button className="filter-chip-clear" type="button" aria-label={`${label} 필터 해제`} onClick={onClear}><Icon name="close.svg" /></button>
      </div>
    );
  }
  return (
    <button className={`filter-chip${active ? " is-active" : ""}`} type="button" aria-pressed={active} onClick={onClick}>
      {icon ? <Icon name={icon} /> : null}<span>{label}</span>{!icon && !active ? <Icon name="chevron-down.svg" /> : null}
    </button>
  );
}

function CategoryFilterSheet({ selected, onChoose, onClose }: { selected: string; onChoose: (category: string) => void; onClose: () => void }) {
  const [usedCarOpen, setUsedCarOpen] = useState(true);
  const selectedChild = selected === "전체 차량" || selected === "중고차" ? "전체 중고차" : selected;

  return (
    <div className="category-filter-sheet">
      <header className="category-filter-header">
        <h2>카테고리</h2>
        <button type="button" aria-label="카테고리 닫기" onClick={onClose}><Icon name="category-sheet-close.svg" /></button>
      </header>
      <div className="category-filter-list">
        {categorySheetItems.map((item) => item.name === "중고차" ? (
          <section key={item.name} className="category-filter-group">
            <div className="category-filter-row">
              <span className="category-filter-mark"><img src={asset(item.icon ?? "categories/used-car.svg")} alt="" aria-hidden="true" draggable={false} /></span>
              <strong>{item.name}</strong>
              <button className="category-filter-toggle" type="button" aria-label={`중고차 하위 카테고리 ${usedCarOpen ? "숨기기" : "보기"}`} aria-expanded={usedCarOpen} onClick={() => setUsedCarOpen((open) => !open)}><Icon name={usedCarOpen ? "category-chevron-down.svg" : "category-chevron-right.svg"} /></button>
            </div>
            {usedCarOpen ? <div className="category-filter-children" aria-label="중고차 하위 카테고리">
              {usedCarCategoryOptions.map((option) => <button key={option} type="button" className={selectedChild === option ? "is-selected" : ""} aria-pressed={selectedChild === option} onClick={() => onChoose(option)}>{option}</button>)}
            </div> : null}
          </section>
        ) : (
          <button key={item.name} className="category-filter-row category-filter-link" type="button" onClick={() => onChoose(item.name)}>
            <span className="category-filter-mark">{item.icon ? <img src={asset(item.icon)} alt="" aria-hidden="true" draggable={false} /> : null}</span>
            <strong>{item.name}</strong>
            <Icon name="category-chevron-right.svg" />
          </button>
        ))}
      </div>
    </div>
  );
}

function MakerMark({ option }: { option: MakerOption }) {
  if (option.logo) return <img className="maker-option-logo" src={option.logo} alt="" aria-hidden="true" draggable={false} />;
  if (!option.icon) return null;
  return <svg className="maker-option-logo" viewBox="0 0 24 24" fill={option.color ?? `#${option.icon.hex}`} aria-hidden="true"><path d={option.icon.path} /></svg>;
}

function BrandRailMark({ option }: { option: BrandRailOption }) {
  if (option.logo) return <span className="brand-logo"><img className={option.full ? "brand-full" : ""} src={option.logo} alt="" aria-hidden="true" draggable={false} /></span>;
  if (option.icon) return <span className="brand-logo"><svg viewBox="0 0 24 24" fill={option.color ?? `#${option.icon.hex}`} aria-hidden="true"><path d={option.icon.path} /></svg></span>;
  return <span className="brand-logo"><span className="brand-logo-fallback" aria-hidden="true">{option.name.slice(0, 2)}</span></span>;
}

function MakerSheet({ selected, onChoose, onClose }: { selected: string | null; onChoose: (maker: string | null) => void; onClose: () => void }) {
  const keyboard = useKeyboard();
  const [query, setQuery] = useState("");
  const filteredOptions = makerOptions.filter((option) => option.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div className="maker-sheet">
      <button type="button" className="maker-sheet-close" aria-label="제조사 선택 닫기" onClick={onClose}><Icon name="sheet-close.svg" /></button>
      <label className="maker-search">
        <Icon name="search.svg" />
        <KeyboardInput aria-label="제조사 검색" value={query} onChange={(event) => setQuery(event.currentTarget.value)} onBlur={() => keyboard.hide()} placeholder="검색" />
      </label>
      <div className="maker-list" role="radiogroup" aria-label="제조사 목록">
        {filteredOptions.map((option) => (
          <label key={option.name} className={`maker-option${selected === option.maker ? " is-selected" : ""}`}>
            <MakerMark option={option} />
            <span>{option.name}</span>
            <input type="radio" name="maker" value={option.maker} checked={selected === option.maker} onChange={() => onChoose(option.maker)} />
          </label>
        ))}
        {!filteredOptions.length ? <div className="maker-empty"><strong>검색 결과가 없어요</strong><span>다른 제조사명을 입력해보세요.</span></div> : null}
      </div>
    </div>
  );
}

function PriceSheet({ value, onChange, onClose, onReset, onConfirm, resultCount }: { value: PriceSelection; onChange: (value: PriceSelection) => void; onClose: () => void; onReset: () => void; onConfirm: () => void; resultCount: number }) {
  const minIndex = Math.max(0, priceSteps.indexOf(value.min));
  const maxIndex = value.max === null ? priceSteps.length - 1 : Math.max(1, priceSteps.indexOf(value.max));
  const rangeMax = priceSteps.length - 1;
  const rangeStyle = {
    "--price-start": `${(minIndex / rangeMax) * 100}%`,
    "--price-end": `${(maxIndex / rangeMax) * 100}%`,
  } as CSSProperties;
  const setMinIndex = (nextIndex: number) => {
    const safeIndex = Math.min(nextIndex, maxIndex - 1);
    onChange({ ...value, min: priceSteps[safeIndex] });
  };
  const setMaxIndex = (nextIndex: number) => {
    const safeIndex = Math.max(nextIndex, minIndex + 1);
    onChange({ ...value, max: safeIndex === rangeMax ? null : priceSteps[safeIndex] });
  };

  return (
    <div className="price-filter-sheet">
      <button className="price-filter-close" type="button" aria-label="가격 필터 닫기" onClick={onClose}><Icon name="sheet-close.svg" /></button>
      <div className="price-mode-tabs" role="tablist" aria-label="가격 유형">
        <button type="button" role="tab" aria-selected={value.mode === "cash"} className={value.mode === "cash" ? "is-selected" : ""} onClick={() => onChange({ ...value, mode: "cash" })}>현금 차량</button>
        <button type="button" role="tab" aria-selected={value.mode === "lease"} className={value.mode === "lease" ? "is-selected" : ""} onClick={() => onChange({ ...value, mode: "lease" })}>리스/렌트</button>
      </div>
      <div className="price-filter-body">
        <div className="price-input-row" aria-label="선택한 가격 범위">
          <div className="price-input-box"><span>최소</span><strong>{formatPriceValue(value.min)}</strong><b>만원</b></div>
          <span className="price-range-separator">~</span>
          <div className="price-input-box"><span>최대</span><strong>{value.max === null ? "전체" : formatPriceValue(value.max)}</strong><b>만원</b></div>
        </div>
        <div className="price-range" style={rangeStyle}>
          <div className="price-range-line" aria-hidden="true" />
          <input type="range" min="0" max={rangeMax} step="1" value={minIndex} aria-label="최소 가격" onChange={(event) => setMinIndex(Number(event.currentTarget.value))} />
          <input type="range" min="0" max={rangeMax} step="1" value={maxIndex} aria-label="최대 가격" onChange={(event) => setMaxIndex(Number(event.currentTarget.value))} />
          <div className="price-range-labels" aria-hidden="true"><span>0원</span><span>5,000만원</span><span>전체</span></div>
        </div>
        <div className="price-presets" aria-label="추천 가격 범위">
          {pricePresets.map((preset) => {
            const selected = value.min === preset.min && value.max === preset.max;
            return <button key={preset.label} type="button" className={selected ? "is-selected" : ""} aria-pressed={selected} onClick={() => onChange({ ...value, min: preset.min, max: preset.max })}>{preset.label}</button>;
          })}
        </div>
      </div>
      <div className="price-filter-actions">
        <button type="button" className="price-filter-reset" onClick={onReset}>초기화</button>
        <button type="button" className="price-filter-confirm" onClick={onConfirm}>{resultCount.toLocaleString("ko-KR")}대 매물 보기</button>
      </div>
    </div>
  );
}

function CarCard({ car, cardView, liked, onToggleLike, onOpen }: { car: Car; cardView: boolean; liked: boolean; onToggleLike: () => void; onOpen: () => void }) {
  const displayedSeller = sellerLabel(car);
  const badges = car.badges ?? [];
  const cardPriceMatch = car.price.match(/^(월\s*)?(.+?)(\s*만원)$/);
  const cardPricePrefix = cardPriceMatch?.[1] ?? "";
  const cardPriceAmount = cardPriceMatch?.[2] ?? car.price;
  const cardPriceUnit = cardPriceMatch?.[3] ?? "";
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article className={`car-card${cardView ? " is-card-view" : ""}${badges.length ? " has-badges" : " has-no-badges"}`} role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeyDown={onKeyDown}>
      <div className="car-photo-wrap">
        <img className={`car-photo${car.imageFit === "contain" ? " is-catalog" : ""}`} src={asset(car.image)} alt={`${car.title} ${car.trim} 차량, ${car.posted}, 사진 ${car.photos}장`} draggable={false} />
        {cardView ? <div className="card-photo-meta"><span>{car.posted}</span><span>{car.photos}<Icon name="photo-count.svg" /></span></div> : null}
      </div>
      <div className="car-copy">
        <div className="car-main">
          {cardView ? <div className="card-title-row"><h2>{car.title} {car.trim}</h2><button type="button" aria-label={`${car.title} 더보기`} onClick={(event) => event.stopPropagation()}><Icon name="card-more.svg" /></button></div> : <><h2>{car.title}</h2><p className="trim">{car.trim}</p></>}
          <p className="specs">{car.specs.map((spec, index) => index === 1 ? formatMileage(spec) : spec).join(" · ")}</p>
          {cardView ? <div className="card-price-block">
            <div className="card-price-row"><p className="price">{cardPricePrefix ? <span className="card-price-unit">{cardPricePrefix}</span> : null}<span>{cardPriceAmount}</span><span className="card-price-unit">{cardPriceUnit}</span></p>{car.lease ? <p className="lease">{car.lease}</p> : null}</div>
            {badges.length ? <div className="badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
          </div> : <><p className="price">{car.price}</p>{car.lease ? <p className="lease">{car.lease}</p> : null}{badges.length ? <div className="badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}</>}
        </div>
        <div className="car-footer">
          <p className="location-line"><Icon name="location-gray.svg" />{car.place}</p>
          <div className="dealer-line">
            <img className="dealer-avatar" src={asset("cars/dealer.png")} alt="" aria-hidden="true" draggable={false} />
            {cardView ? <div className="dealer-copy"><strong>{displayedSeller}</strong><p><span>판매중 <b>{car.stock}대</b></span></p></div> : <p><strong>{displayedSeller}</strong><span>· 판매중 <b>{car.stock}대</b></span></p>}
            {cardView ? <div className="card-contact-actions"><button type="button" aria-label={`${displayedSeller} 전화`} onClick={(event) => event.stopPropagation()}><Icon name="card-call.svg" /></button><button type="button" aria-label={`${displayedSeller} 메시지`} onClick={(event) => event.stopPropagation()}><Icon name="card-message.svg" /></button><button className={`like-button${liked ? " is-liked" : ""}`} type="button" aria-label={`${car.title} ${liked ? "저장 해제" : "저장"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}>{liked ? <HeartFilledIcon /> : <HeartIcon />}</button></div> : <button className={`like-button${liked ? " is-liked" : ""}`} type="button" aria-label={`${car.title} ${liked ? "저장 해제" : "저장"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}>{liked ? <HeartFilledIcon /> : <HeartIcon />}</button>}
          </div>
        </div>
      </div>
    </article>
  );
}

function RegionSheet({ value, resultCount, onChange, onClose, onConfirm }: { value: RegionSelection; resultCount: number; onChange: (value: RegionSelection) => void; onClose: () => void; onConfirm: () => void }) {
  const [menu, setMenu] = useState<RegionMenu>(null);
  const districtOptions = value.province ? districtsByProvince[value.province] ?? ["전체"] : [];
  const chooseProvince = (province: string) => {
    onChange(province === "전국" ? emptyRegion : { province, district: "", radius: "" });
    setMenu(null);
  };
  const chooseQuickRegion = (label: string) => chooseProvince(label === "전남광주" ? "광주" : label);

  return (
    <div className="region-sheet">
      <button className="region-sheet-close" type="button" aria-label="지역 선택 닫기" onClick={onClose}><Icon name="sheet-close.svg" /></button>
      <div className="region-fields">
        <div className="region-select-wrap">
          <button className="region-select" type="button" aria-expanded={menu === "province"} onClick={() => setMenu((current) => current === "province" ? null : "province")}><span className={`region-select-value${value.province ? " has-value" : ""}`}>{value.province || "시/도 선택"}</span><span className="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
          {menu === "province" ? <div className="region-menu" role="listbox" aria-label="시도 선택">{provinceOptions.map((province) => <button key={province} type="button" role="option" aria-selected={(value.province || "전국") === province} onClick={() => chooseProvince(province)}>{province}</button>)}</div> : null}
        </div>
        <div className="region-quick-chips" aria-label="빠른 지역 선택">{quickRegions.map((label) => <button key={label} type="button" className={(value.province === (label === "전남광주" ? "광주" : label)) ? "is-selected" : ""} aria-pressed={value.province === (label === "전남광주" ? "광주" : label)} onClick={() => chooseQuickRegion(label)}>{label}</button>)}</div>
        <div className="region-select-wrap">
          <button className="region-select" type="button" disabled={!value.province} aria-expanded={menu === "district"} onClick={() => setMenu((current) => current === "district" ? null : "district")}><span className={`region-select-value${value.district ? " has-value" : ""}`}>{value.district || "시/군/구 선택"}</span><span className="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
          {menu === "district" ? <div className="region-menu" role="listbox" aria-label="시군구 선택">{districtOptions.map((district) => <button key={district} type="button" role="option" aria-selected={(value.district || "전체") === district} onClick={() => { onChange({ ...value, district: district === "전체" ? "" : district, radius: "" }); setMenu(null); }}>{district}</button>)}</div> : null}
        </div>
      </div>
      <div className="region-around">
        <div className="region-around-heading"><span /><strong>내 주변 검색</strong></div>
        <div className="region-select-wrap">
          <button className="region-select" type="button" aria-expanded={menu === "radius"} onClick={() => setMenu((current) => current === "radius" ? null : "radius")}><span className={`region-select-value${value.radius ? " has-value" : ""}`}>{value.radius ? `내 위치에서 ${value.radius}` : "내 위치와 검색 반경 선택"}</span><span className="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
          {menu === "radius" ? <div className="region-menu is-upward" role="listbox" aria-label="검색 반경 선택">{radiusOptions.map((radius) => <button key={radius} type="button" role="option" aria-selected={value.radius === radius} onClick={() => { onChange({ province: "", district: "", radius }); setMenu(null); }}>{radius}</button>)}</div> : null}
        </div>
      </div>
      <div className="region-actions"><button type="button" className="region-reset" onClick={() => { onChange(emptyRegion); setMenu(null); }}>초기화</button><button type="button" className="region-confirm" onClick={onConfirm}>{Math.max(798, resultCount).toLocaleString("ko-KR")}대 매물 보기</button></div>
    </div>
  );
}

function SavedListingsHeader() {
  const flow = useFlow();
  return (
    <header className="saved-header">
      <button type="button" aria-label="중고차 목록으로 돌아가기" onClick={() => flow.pop()}><Icon name="back.svg" /></button>
      <h1>저장한 매물</h1>
      <span aria-hidden="true" />
    </header>
  );
}

function SavedListingsScreen() {
  const flow = useFlow();
  const { likedIds, toggleLiked } = useFavorites();
  const [activeTab, setActiveTab] = useState<"listings" | "videos">("listings");
  const savedCars = inventoryCars.filter((car) => likedIds.includes(car.id));

  return (
    <MobileScroll className="saved-screen">
      <main className="saved-listings" aria-label="저장한 매물">
        <div className="saved-tabs" role="tablist" aria-label="저장 항목 유형">
          <button type="button" role="tab" aria-selected={activeTab === "listings"} className={activeTab === "listings" ? "is-selected" : ""} onClick={() => setActiveTab("listings")}>매물 ({savedCars.length}/100)</button>
          <button type="button" role="tab" aria-selected={activeTab === "videos"} className={activeTab === "videos" ? "is-selected" : ""} onClick={() => setActiveTab("videos")}>동영상 (0/100)</button>
        </div>
        {activeTab === "listings" && savedCars.length ? <section className="saved-car-list" aria-live="polite">
          {savedCars.map((car) => (
            <article key={car.id} className="saved-car-row" role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={() => flow.push(detailScreen)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); flow.push(detailScreen); } }}>
              <img className={`saved-car-photo${car.imageFit === "contain" ? " is-catalog" : ""}`} src={asset(car.image)} alt={`${car.title} ${car.trim}`} draggable={false} />
              <div className="saved-car-copy"><h2>{car.title}</h2><p>{car.trim} · {car.specs[0]} · {car.specs[3]}</p><strong>{car.price.replace(" ", "")}</strong></div>
              <button type="button" className="saved-like-button" aria-label={`${car.title} 저장 해제`} aria-pressed="true" onClick={(event) => { event.stopPropagation(); toggleLiked(car.id); }}><HeartFilledIcon /></button>
            </article>
          ))}
        </section> : <div className="saved-empty"><HeartIcon /><strong>{activeTab === "listings" ? "저장한 매물이 없어요" : "저장한 동영상이 없어요"}</strong><p>{activeTab === "listings" ? "목록에서 하트를 눌러 관심 매물을 모아보세요." : "마음에 드는 매물 영상을 저장해보세요."}</p></div>}
      </main>
    </MobileScroll>
  );
}

function MarketplaceScreen() {
  const flow = useFlow();
  const keyboard = useKeyboard();
  const { likedIds, toggleLiked } = useFavorites();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ChoTotFilterState>(emptyChoTotFilters);
  const [draftFilters, setDraftFilters] = useState<ChoTotFilterState>(emptyChoTotFilters);
  const [filterFocus, setFilterFocus] = useState<ChoTotFilterFocus | null>(null);
  const [quickFilterFocus, setQuickFilterFocus] = useState<ChoTotFilterFocus | null>(null);
  const [sheet, setSheet] = useState<SheetType>(null);
  const [sort, setSort] = useState("최신순");
  const [cardView, setCardView] = useState(false);
  const [region, setRegion] = useState<RegionSelection>(emptyRegion);
  const [draftRegion, setDraftRegion] = useState<RegionSelection>(emptyRegion);
  const [searchSaved, setSearchSaved] = useState(false);
  const [searchToast, setSearchToast] = useState("");
  const [categoryLandingOpen, setCategoryLandingOpen] = useState(true);

  useEffect(() => {
    if (!searchToast) return;
    const timer = window.setTimeout(() => setSearchToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [searchToast]);

  const closeSheet = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    keyboard.hide();
    setSheet(null);
  };

  const regionLabel = region.radius ? `내 주변 ${region.radius}` : [region.province, region.district].filter(Boolean).join(" ") || "전국";
  const regionKeyword = region.province === "광주" ? "광주" : region.province;
  const { maker, model: selectedModel, price, seller: sellerType, videoOnly, category } = filters;
  const categoryIsDefault = category === "전체 차량";
  const categorySearchPlaceholder = categoryIsDefault ? "중고차" : category;
  const categoryBrandRail = categoryBrandRails[category] ?? categoryBrandRails["전체 차량"];

  const filteredWithoutPrice = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return chototTestCars.filter((car) => matchesChoTotFilters(car, filters) && (!regionKeyword || car.place.includes(regionKeyword)) && (!region.district || car.place.includes(region.district)) && (!normalized || `${car.title} ${car.trim} ${car.maker}`.toLowerCase().includes(normalized)));
  }, [filters, query, region.district, regionKeyword]);
  const visibleCars = useMemo(() => [...filteredWithoutPrice].sort((first, second) => sort === "낮은 가격순" ? parsePrice(first.price) - parsePrice(second.price) : sort === "높은 가격순" ? parsePrice(second.price) - parsePrice(first.price) : second.id - first.id), [filteredWithoutPrice, sort]);
  const draftFilterCount = useMemo(() => chototTestCars.filter((car) => matchesChoTotFilters(car, draftFilters)).length, [draftFilters]);

  const resetFilters = () => {
    setFilters(emptyChoTotFilters);
    setDraftFilters(emptyChoTotFilters);
    setQuery("");
    setSort("최신순");
    setRegion(emptyRegion);
  };

  const openRegionSheet = () => {
    setDraftRegion(region);
    setSheet("region");
  };

  const openPriceSheet = () => {
    setDraftFilters(filters);
    setSheet("price");
  };

  const openQuickFilter = (focus: ChoTotFilterFocus) => {
    setDraftFilters(filters);
    if (focus === "category") {
      setQuickFilterFocus(null);
      setSheet("carType");
      return;
    }
    setQuickFilterFocus(focus);
    setSheet("quick");
  };

  const toggleSearchSaved = () => {
    const nextSaved = !searchSaved;
    setSearchSaved(nextSaved);
    setSearchToast(nextSaved ? "검색 조건을 저장했습니다." : "저장한 검색 조건을 삭제했습니다.");
  };

  const chooseMaker = (nextMaker: string | null) => {
    setFilters((current) => ({ ...current, maker: nextMaker, model: null }));
    closeSheet();
  };

  const chooseModel = (modelName: string) => {
    const nextModel = selectedModel === modelName ? null : modelName;
    setFilters((current) => ({ ...current, model: nextModel }));
  };

  const chooseVehicleCategory = (categoryName: string) => {
    if (categoryName === "중고차") {
      setFilters((current) => ({ ...current, category: "중고차", maker: null, model: null }));
      setCategoryLandingOpen(false);
      return;
    }
    setSearchToast(`${categoryName.replace("\n", " ")} 카테고리는 준비 중입니다.`);
  };

  const chooseCategoryFilter = (categoryName: string) => {
    const nextCategory = categoryName === "전체 중고차" ? "중고차" : categoryName;
    if (["중고차", "국산차", "수입차", "전기차"].includes(nextCategory)) {
      const nextFilters = { ...filters, category: nextCategory, maker: null, model: null };
      setFilters(nextFilters);
      setDraftFilters(nextFilters);
      setCategoryLandingOpen(false);
      closeSheet();
      return;
    }
    setSearchToast(`${categoryName} 카테고리는 준비 중입니다.`);
    closeSheet();
  };

  return (
    <>
      <MobileScroll className="app-screen">
        <main className="marketplace" aria-label="중고차 리스트">
          <Header query={query} setQuery={setQuery} searchPlaceholder={categorySearchPlaceholder} searchSaved={searchSaved} onToggleSearchSaved={toggleSearchSaved} onOpenFavorites={() => flow.push(savedListingsScreen)} />
          <section className="region-bar" aria-label="지역 선택">
            <button type="button" aria-label={`현재 지역 ${regionLabel}, 지역 선택 열기`} onClick={openRegionSheet}><Icon name="location-blue.svg" /><span className="region-label">지역:</span><strong>{regionLabel}</strong><span className="region-chevron-icon" aria-hidden="true"><Icon name="region-chevron.svg" /></span></button>
            <button type="button" className="reset-button" onClick={resetFilters}>초기화</button>
          </section>
          <section className="filter-shell" aria-label="중고차 필터">
            <button className="filter-fixed" type="button" aria-label="필터" onClick={() => { setDraftFilters(filters); setFilterFocus(null); setSheet("filter"); }}><Icon name="filter.svg" /><span>필터</span></button>
            <div className="filter-pinned-chip">
              <FilterChip label={categoryIsDefault ? "전체차량" : category} active onClick={() => openQuickFilter("category")} onClear={() => setFilters((current) => ({ ...current, category: "전체 차량", maker: null, model: null }))} />
            </div>
            <Carousel ariaLabel="중고차 조건" className="filter-rail" contentClassName="filter-track">
              <FilterChip label={maker ?? "제조사"} active={Boolean(maker)} onClick={() => openQuickFilter("maker")} onClear={maker ? () => setFilters((current) => ({ ...current, maker: null, model: null })) : undefined} />
              <FilterChip label={filters.year === "전체" ? "연식" : filters.year} active={filters.year !== "전체"} onClick={() => openQuickFilter("year")} />
              <FilterChip label={priceFilterLabel(price)} active={price.min !== 0 || price.max !== null} onClick={() => openQuickFilter("price")} />
              <FilterChip label={filters.condition === "전체" ? "차량 상태" : filters.condition} active={filters.condition !== "전체"} onClick={() => openQuickFilter("condition")} />
              <FilterChip label={filters.seller === "전체" ? "판매자" : filters.seller} active={filters.seller !== "전체"} onClick={() => openQuickFilter("seller")} />
              <FilterChip label={selectedModel ?? "모델"} active={Boolean(selectedModel)} onClick={() => openQuickFilter("model")} />
              <FilterChip label={filters.seats === "전체" ? "좌석 수" : filters.seats} active={filters.seats !== "전체"} onClick={() => openQuickFilter("seats")} />
              <FilterChip label={filters.mileageMax ? `${filters.mileageMax}km 이하` : "주행거리"} active={Boolean(filters.mileageMax)} onClick={() => openQuickFilter("mileage")} />
              <FilterChip label={filters.owners === "전체" ? "소유자 수" : filters.owners} active={filters.owners !== "전체"} onClick={() => openQuickFilter("owners")} />
              <FilterChip label={filters.transmission === "전체" ? "변속기" : filters.transmission} active={filters.transmission !== "전체"} onClick={() => openQuickFilter("transmission")} />
              <FilterChip label={filters.fuel === "전체" ? "연료" : filters.fuel} active={filters.fuel !== "전체"} onClick={() => openQuickFilter("fuel")} />
              <FilterChip label={filters.colors.length ? `색상 ${filters.colors.length}` : "색상"} active={filters.colors.length > 0} onClick={() => openQuickFilter("color")} />
              <FilterChip label={filters.origin === "전체" ? "원산지" : filters.origin} active={filters.origin !== "전체"} onClick={() => openQuickFilter("origin")} />
              <FilterChip label={filters.body === "전체" ? "차체 유형" : filters.body} active={filters.body !== "전체"} onClick={() => openQuickFilter("body")} />
              <FilterChip label="영상 매물" active={filters.videoOnly} onClick={() => openQuickFilter("video")} />
            </Carousel>
          </section>
          {categoryLandingOpen ? <section className="category-row" aria-label="차량 대카테고리 선택">
            <Carousel ariaLabel="차량 대카테고리" className="category-carousel" contentClassName="category-track">
              {vehicleCategories.map((categoryOption) => (
                <button key={categoryOption.name} className="category-item" type="button" onClick={() => chooseVehicleCategory(categoryOption.name)}>
                  <span className="category-icon"><img src={asset(categoryOption.icon)} alt="" aria-hidden="true" draggable={false} /></span>
                  <span>{categoryOption.name.split("\n").map((line, index) => <span key={line}>{index ? <><br />{line}</> : line}</span>)}</span>
                </button>
              ))}
            </Carousel>
          </section> : maker === "BMW" || maker === "벤츠" ? <section className={`brand-row${maker === "BMW" ? " is-model-mode" : " is-benz-model-mode"}`} aria-label={maker === "BMW" ? "BMW 모델 빠른 선택" : "벤츠 모델 빠른 선택"}>
            <span className="brand-title">모델</span>
            <Carousel ariaLabel={maker === "BMW" ? "BMW 모델" : "벤츠 모델"} className="brand-carousel" contentClassName={maker === "BMW" ? "bmw-model-track" : "benz-model-track"}>
              {maker === "BMW" ? bmwModels.map((model) => (
                <button key={model.name} className={`bmw-model-card${selectedModel === model.name ? " is-selected" : ""}`} type="button" aria-pressed={selectedModel === model.name} onClick={() => chooseModel(model.name)}>
                  <img src={model.image} alt={`${model.name} 차량`} draggable={false} />
                  <span>{model.name}</span>
                </button>
              )) : benzModels.map((model) => (
                <button key={model} className={`benz-model-chip${selectedModel === model ? " is-selected" : ""}`} type="button" aria-pressed={selectedModel === model} onClick={() => chooseModel(model)}>{model}</button>
              ))}
            </Carousel>
          </section> : <section className="brand-row category-brand-row" aria-label={`${categoryBrandRail.title} 빠른 선택`}>
            <span className="brand-title">{categoryBrandRail.title}</span>
            <Carousel ariaLabel={categoryBrandRail.title} className="brand-carousel" contentClassName="brand-track">
              {categoryBrandRail.options.map((option) => (
                <button key={option.name} className={`brand-item${option.maker && maker === option.maker ? " is-selected" : ""}`} type="button" aria-pressed={Boolean(option.maker && maker === option.maker)} onClick={() => option.maker ? setFilters((current) => ({ ...current, maker: option.maker ?? null, model: null })) : undefined}>
                  <BrandRailMark option={option} />
                  <span>{option.name}</span>
                </button>
              ))}
            </Carousel>
          </section>}
          <section className="video-toggle-row" aria-label="영상 매물 설정">
            <span>영상 매물</span>
            <button type="button" role="switch" aria-checked={videoOnly} className={videoOnly ? "is-on" : ""} onClick={() => setFilters((current) => ({ ...current, videoOnly: !current.videoOnly }))}><span /></button>
          </section>
          <nav className="list-toolbar" aria-label="매물 유형과 정렬">
            <div className="seller-tabs" role="tablist" aria-label="판매자 유형">
              {(["전체", "개인", "딜러"] as SellerType[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={sellerType === tab} className={sellerType === tab ? "is-selected" : ""} onClick={() => setFilters((current) => ({ ...current, seller: tab }))}>{tab}</button>)}
            </div>
            <div className="sort-controls">
              <button type="button" className="sort-button" onClick={() => setSheet("sort")}>{sort}<span className="sort-arrow-icon" aria-hidden="true"><Icon name="sort-arrow.svg" /></span></button><span className="toolbar-divider" />
              <button type="button" className={`density-button${cardView ? " is-active" : ""}`} aria-label={cardView ? "목록형 보기로 전환" : "카드형 보기로 전환"} aria-pressed={cardView} onClick={() => setCardView((value) => !value)}><Icon name={cardView ? "card-view.svg" : "notion-list.svg"} /></button>
            </div>
          </nav>
          <section className="car-list" aria-live="polite">
            {visibleCars.length ? visibleCars.map((car) => <CarCard key={car.id} car={car} cardView={cardView} liked={likedIds.includes(car.id)} onOpen={() => flow.push(detailScreen)} onToggleLike={() => toggleLiked(car.id)} />) : (
              <div className="empty-state"><strong>조건에 맞는 차량이 없어요</strong><span>필터를 초기화하고 다시 찾아보세요.</span><button type="button" onClick={resetFilters}>필터 초기화</button></div>
            )}
          </section>
        </main>
      </MobileScroll>
      {searchToast ? <div className="market-toast" role="status" aria-live="polite">{searchToast}</div> : null}
      <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && closeSheet()} title={sheet ? sheetLabels[sheet] : "필터"} description={sheet === "region" || sheet === "maker" || sheet === "price" || sheet === "filter" || sheet === "quick" || sheet === "carType" ? undefined : "원하는 조건을 선택해 매물을 좁혀보세요."} snap={sheet === "filter" || sheet === "maker" || sheet === "quick" ? 0.96 : sheet === "carType" ? 0.8 : sheet === "region" ? 0.53 : sheet === "price" ? 0.62 : 0.48}>
        {sheet === "filter" ? <ChoTotFilterSheet value={draftFilters} focus={filterFocus} onChange={setDraftFilters} onClose={() => { setFilterFocus(null); closeSheet(); }} onReset={() => setDraftFilters(emptyChoTotFilters)} onConfirm={() => { setFilters(draftFilters); setFilterFocus(null); closeSheet(); }} resultCount={draftFilterCount} /> : sheet === "carType" ? <CategoryFilterSheet selected={category} onChoose={chooseCategoryFilter} onClose={closeSheet} /> : sheet === "quick" && quickFilterFocus ? <ChoTotQuickFilterSheet focus={quickFilterFocus} value={draftFilters} onChange={setDraftFilters} onClose={() => { setQuickFilterFocus(null); closeSheet(); }} onConfirm={() => { setFilters(draftFilters); setQuickFilterFocus(null); closeSheet(); }} resultCount={draftFilterCount} /> : sheet === "maker" ? <MakerSheet selected={maker} onChoose={chooseMaker} onClose={closeSheet} /> : sheet === "region" ? <RegionSheet value={draftRegion} resultCount={filteredWithoutPrice.length} onChange={setDraftRegion} onClose={closeSheet} onConfirm={() => { setRegion(draftRegion); closeSheet(); }} /> : sheet === "price" ? <PriceSheet value={draftFilters.price} onChange={(nextPrice) => setDraftFilters((current) => ({ ...current, price: nextPrice }))} onClose={closeSheet} onReset={() => setDraftFilters((current) => ({ ...current, price: emptyPrice }))} onConfirm={() => { setFilters((current) => ({ ...current, price: draftFilters.price })); closeSheet(); }} resultCount={draftFilterCount} /> : <div className="sheet-options">
          {sheet === "sort" ? ["최신순", "낮은 가격순", "높은 가격순"].map((label) => <button key={label} type="button" className={sort === label ? "is-selected" : ""} onClick={() => { setSort(label); setSheet(null); }}>{label}</button>) : ["전체", "추천 조건", "인기 조건"].map((label) => <button key={label} type="button" onClick={() => setSheet(null)}>{label}</button>)}
        </div>}
      </BottomSheet>
    </>
  );
}

type DetailUi = {
  liked: boolean;
  setLiked: (liked: boolean) => void;
  sheet: DetailSheet;
  setSheet: (sheet: DetailSheet) => void;
  toast: string;
  notify: (message: string) => void;
};

const DetailUiContext = createContext<DetailUi | null>(null);

function useDetailUi() {
  const value = useContext(DetailUiContext);
  if (!value) throw new Error("useDetailUi must be used inside DetailUiProvider");
  return value;
}

function DetailUiProvider({ children }: { children: ReactNode }) {
  const [liked, setLiked] = useState(false);
  const [sheet, setSheet] = useState<DetailSheet>(null);
  const [toast, setToast] = useState("");
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  return <DetailUiContext.Provider value={{ liked, setLiked, sheet, setSheet, toast, notify }}>{children}</DetailUiContext.Provider>;
}

function SectionCard({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`detail-card ${className}`}>
      <div className="detail-section-heading"><h2>{title}</h2>{action}</div>
      {children}
    </section>
  );
}

function InfoGrid({ items }: { items: string[][] }) {
  return <dl className="detail-info-grid">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function VehicleInfoCard() {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? [...vehicleInfo, ...extraInfo] : vehicleInfo;

  return (
    <SectionCard title="차량 정보" className="vehicle-info-card">
      <dl className="vehicle-info-rows">
        {items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
      </dl>
      <button className="vehicle-info-toggle" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
        {expanded ? "접기" : "더보기"}
        <img className={expanded ? "is-expanded" : ""} src={asset("detail/vehicle-info-chevron.svg")} alt="" />
      </button>
    </SectionCard>
  );
}

function DetailHero({ onBack }: { onBack: () => void }) {
  const { setSheet, notify } = useDetailUi();
  const [media, setMedia] = useState<"video" | "photos">("photos");
  const [photoIndex, setPhotoIndex] = useState(1);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const carousel = heroRef.current?.querySelector<HTMLElement>(".detail-media-carousel");
    const firstPhoto = carousel?.querySelector<HTMLElement>(".detail-media-track > img");
    if (!carousel || !firstPhoto) return;
    const updatePhotoIndex = () => {
      const photoWidth = firstPhoto.getBoundingClientRect().width || carousel.clientWidth;
      setPhotoIndex(Math.min(detailPhotos.length, Math.max(1, Math.round(carousel.scrollLeft / photoWidth) + 1)));
    };
    carousel.addEventListener("scroll", updatePhotoIndex, { passive: true });
    updatePhotoIndex();
    return () => carousel.removeEventListener("scroll", updatePhotoIndex);
  }, []);

  return (
    <section ref={heroRef} className="detail-hero" aria-label="차량 사진">
      <Carousel ariaLabel="차량 사진" className="detail-media-carousel" contentClassName="detail-media-track">
        {detailPhotos.map((photo, index) => <img key={`${photo}-${index}`} src={photo} alt={`벤틀리 차량 사진 ${index + 1}`} draggable={false} />)}
      </Carousel>
      {media === "video" ? <div className="detail-video-overlay"><button type="button" onClick={() => setMedia("photos")} aria-label="영상 일시정지"><span>▶</span><b>차량 영상 재생 중</b></button></div> : null}
      <div className="detail-photo-count" aria-live="polite">{photoIndex}/{detailPhotos.length}</div>
      <div className="detail-media-tabs" role="tablist" aria-label="미디어 유형">
        <button type="button" role="tab" aria-selected={media === "video"} className={media === "video" ? "is-selected" : ""} onClick={() => setMedia("video")}>영상</button>
        <button type="button" role="tab" aria-selected={media === "photos"} className={media === "photos" ? "is-selected" : ""} onClick={() => setMedia("photos")}>사진 24</button>
      </div>
      <div className="detail-hero-actions">
        <button type="button" aria-label="목록으로 돌아가기" onClick={onBack}><img src={asset("detail/back.svg")} alt="" /></button>
        <div>
          <button type="button" aria-label="공유하기" onClick={() => notify("공유 링크를 복사했어요")}><img src={asset("detail/share.svg")} alt="" /></button>
          <button type="button" aria-label="더보기" onClick={() => setSheet("more")}><img src={asset("detail/more.svg")} alt="" /></button>
        </div>
      </div>
    </section>
  );
}

function VehicleSummary() {
  const { liked, setLiked, setSheet, notify } = useDetailUi();
  const summarySpecs = ["2019", formatMileage("42,920 km"), "가솔린", "자동", "1인소유"];
  return (
    <section className="vehicle-summary">
      <div className="vehicle-title-row"><h1>2019 벤틀리 컨티넨탈 GT 3세대 6.0 퍼스트 에디션</h1><button type="button" aria-label="매물 저장" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? <HeartFilledIcon /> : <HeartIcon />}<span>{liked ? "저장됨" : "저장"}</span></button></div>
      <div className="vehicle-spec-row" aria-label="차량 핵심 정보">
        {summarySpecs.map((spec) => <span key={spec}>{spec}</span>)}
      </div>
      <div className="detail-price-row">
        <strong>1억 4,500만원</strong>
        <button type="button" onClick={() => setSheet("priceHistory")}>가격 변동</button>
      </div>
      <p className="vehicle-finance">할부 예상 월 153만원부터</p>
      <p className="vehicle-phone-note">판매자가 안심번호로 연락을 받아요</p>
      <div className="detail-contact-row" aria-label="판매자 연락">
        <a href="tel:05062469261">안심번호</a>
        <button type="button" onClick={() => notify("카카오 상담을 준비했어요")}>카카오</button>
        <button type="button" onClick={() => setSheet("contact")}>채팅</button>
      </div>
      <div className="vehicle-location-row">
        <p>서울 서초구 양재동</p>
        <span>등록 2개월 전</span>
      </div>
    </section>
  );
}

function PriceHistorySheet({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(1);
  const visiblePages = [1, 2, 3, 4, 5, 10];
  const selectPage = (nextPage: number) => setPage(Math.min(10, Math.max(1, nextPage)));

  useEffect(() => {
    const overlay = document.querySelector<HTMLElement>('[data-testid="sheet-overlay"]');
    if (!overlay) return;
    overlay.addEventListener("click", onClose);
    return () => overlay.removeEventListener("click", onClose);
  }, [onClose]);

  return (
    <div className="price-history-sheet">
      <button className="price-history-close" type="button" aria-label="가격 변동 내역 닫기" onClick={onClose}>
        <img src={asset("detail/price-history-close.svg")} alt="" />
      </button>
      <div className="price-history-table" role="table" aria-label="가격 변동 내역">
        <div className="price-history-head" role="row">
          <span role="columnheader">날짜</span><span role="columnheader">변동</span><span role="columnheader">가격</span>
        </div>
        {priceHistoryRows.map((row) => (
          <div className="price-history-row" role="row" key={row.date}>
            <span role="cell">{row.date}</span>
            <strong className={row.direction === "down" ? "is-down" : ""} role="cell">
              {row.direction === "first" ? <span className="price-history-tag-icon"><img src={asset("detail/price-tag.svg")} alt="" /><img src={asset("detail/price-tag-dot.svg")} alt="" /></span> : <img src={asset(`detail/price-${row.direction}.svg`)} alt="" />}
              {row.change}
            </strong>
            <b role="cell">{row.price}</b>
          </div>
        ))}
      </div>
      <p className="price-history-note">가격 변동 내역은 판매자가 제공한 정보를 기준으로 합니다.</p>
      <nav className="price-history-pagination" aria-label="가격 변동 페이지">
        <button type="button" aria-label="이전 페이지" disabled={page === 1} onClick={() => selectPage(page - 1)}><span className="price-history-pagination-arrow is-previous" aria-hidden="true"><img src={asset("detail/pagination-left.svg")} alt="" /></span></button>
        {visiblePages.map((pageNumber, index) => (
          <span key={pageNumber} className="price-history-page-slot">
            {index === visiblePages.length - 1 ? <img className="price-history-ellipsis" src={asset("detail/pagination-ellipsis.svg")} alt="" /> : null}
            <button type="button" aria-label={`${pageNumber} 페이지`} aria-current={page === pageNumber ? "page" : undefined} onClick={() => selectPage(pageNumber)}>{pageNumber}</button>
          </span>
        ))}
        <button type="button" aria-label="다음 페이지" disabled={page === 10} onClick={() => selectPage(page + 1)}><span className="price-history-pagination-arrow is-next" aria-hidden="true"><img src={asset("detail/pagination-right.svg")} alt="" /></span></button>
      </nav>
    </div>
  );
}

function OptionsCard() {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? optionItems : optionItems.slice(0, 12);
  return (
    <SectionCard title="차량 옵션" action={<button className="text-action" type="button" onClick={() => setExpanded(!expanded)}>옵션설명</button>}>
      <div className="option-grid">{items.map((label, index) => <div key={label}><img src={asset(`detail/option-${String((index % 13) + 1).padStart(2, "0")}.png`)} alt="" draggable={false} /><span>{label}</span></div>)}</div>
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "옵션 접기" : "옵션 32개 모두 보기"}</button>
      <div className="selected-options"><h3>선택 옵션</h3><dl><div><dt>빌트인 캠 패키지 <img src={asset("detail/option-info.svg")} alt="옵션 정보" /></dt><dd>70만원</dd></div><div><dt>헤드업 디스플레이 <img src={asset("detail/option-info.svg")} alt="옵션 정보" /></dt><dd>130만원</dd></div></dl></div>
    </SectionCard>
  );
}

function HistoryCard() {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="보험 이력">
      <div className="insurance-summary"><div>내 차 피해<strong>0건</strong></div><div>상대 차 피해<strong>0건</strong></div><div>특수사항<strong>없음</strong></div></div>
      <h3 className="subheading">차량 이력 상세</h3>
      <dl className="detail-rows"><div><dt>특수 용도 이력</dt><dd>없음</dd></div><div><dt>용도 및 차종</dt><dd>자가용 승용</dd></div>{expanded ? <><div><dt>소유자 변경</dt><dd>1회</dd></div><div><dt>번호판 변경</dt><dd>없음</dd></div></> : null}</dl>
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "보험 이력 접기" : "보험 이력 전체 보기"}</button>
    </SectionCard>
  );
}

function InspectionCard() {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="성능 점검" action={<span className="muted-label">제시번호 : 262621002567</span>}>
      <dl className="detail-info-grid compact"><div><dt>사고이력 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div><div><dt>단순수리 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div></dl>
      {expanded ? <p className="inspection-note">성능·상태 점검기록부 기준으로 주요 골격 손상과 침수 이력이 없습니다.</p> : null}
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "성능 점검 접기" : "성능 점검 전체 보기"}</button>
    </SectionCard>
  );
}

function WarrantyCard() {
  return (
    <SectionCard title="제조사 보증">
      <div className="warranty-box"><div><span>일반/차체</span><small>보증 종료</small><i><b style={{ width: "0%" }} /></i></div><div><span>엔진/미션</span><small>2년 10개월 / 99,984km 남음</small><i><b style={{ width: "67%" }} /></i></div></div>
    </SectionCard>
  );
}

function SellerCard() {
  return (
    <section className="detail-card seller-card">
      <div className="seller-profile"><img src={asset("detail/raw-10.jpeg")} alt="한강모터스 박성수" /><div><h2>한강모터스 박성수</h2><p><b>10대</b> 판매완료 · <b>5대</b> 판매중</p><p>● 서울 서초구 오토갤러리</p></div></div>
      <dl className="detail-rows"><div><dt>종사원번호</dt><dd>SE25-00585 <u>상사/조합정보</u></dd></div><div><dt>매매유형</dt><dd>매매알선(소속 상사 매물)</dd></div></dl>
    </section>
  );
}

function SaleCard() {
  const { notify } = useDetailUi();
  return (
    <SectionCard title="판매 정보">
      <div className="cost-box"><dl><div><dt>차량가</dt><dd>1억5,980만원</dd></div><div><dt>이전 등록비(예상)</dt><dd>314만원</dd></div><div><dt>매도비</dt><dd>33만원</dd></div></dl><div className="cost-total"><span>예상 총 비용</span><strong>1억 6,328만원</strong></div></div>
      <div className="sale-actions"><button type="button" onClick={() => notify("비용 계산기를 열었어요")}>비용계산기</button><button type="button" onClick={() => notify("동급매물로 이동했어요")}>동급매물</button><button type="button" onClick={() => notify("할부매물을 확인해요")}>할부매물</button></div>
      <button className="report-button" type="button" onClick={() => notify("신고 접수 화면을 준비했어요")}><LockClosedIcon /> 신고하기</button>
    </SectionCard>
  );
}

function DescriptionCard() {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="상세 설명">
      <div className={`description-copy${expanded ? " is-expanded" : ""}`}>
        <p>2022년 5월식 벤틀리 컨티넨탈 GT 4.0 모델을 판매합니다.<br />벤틀리가 V8엔진으로 구동되는 3세대 컨티넨탈 GT를 선보였다. 쿠페와 컨버터블 형태로 출시될 이 모델은 올해 말부터 미국에서 판매될 예정이며, 이어 2020년 상반기에는 유럽 및 다른 국가에서도 판매될 예정이다.</p>
        <p>파워트레인은 기존의 6.0리터 W12엔진 대신 4.0리터 V8 가솔린 트윈터보 엔진이 장착됐다. 최대출력 550마력, 최고토크 78.5kg·m의 파워를 발휘합니다.</p>
      </div>
      <div className="contact-chip">연락처: 050-6246-9261 <a href="tel:05062469261">연락하기</a></div>
      <button className="more-copy-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "접기" : "더보기"} <ChevronDownIcon /></button>
    </SectionCard>
  );
}

type RailCar = { image: string; title: string; price: string; place: string; posted: string; meta?: string };

function CarRail({ title, cars: railCars }: { title: string; cars: RailCar[] }) {
  const { notify } = useDetailUi();
  return (
    <section className="related-section"><h2>{title}</h2><Carousel ariaLabel={title} className="related-carousel" contentClassName="related-track">
      {railCars.map((car) => <button key={`${title}-${car.title}`} className="related-card" type="button" onClick={() => notify(`${car.title} 매물을 열었어요`)}><div className="related-photo"><img src={asset(`detail/${car.image}`)} alt={car.title} draggable={false} /><span>{car.posted}</span><b>10 ▣</b></div><div><h3>{car.title}</h3>{car.meta ? <p>{formatMileage(car.meta)}</p> : null}<strong>{car.price}</strong><small>● {car.place}</small></div></button>)}
    </Carousel></section>
  );
}

function VehicleDetail() {
  const flow = useFlow();
  const { sheet, setSheet, toast, notify } = useDetailUi();
  return (
    <div className="detail-scene">
      <MobileScroll className="detail-screen">
        <main className="vehicle-detail" aria-label="중고차 상세">
          <DetailHero onBack={flow.pop} />
          <VehicleSummary />
          <div className="detail-gray-stack">
            <SellerCard />
            <VehicleInfoCard />
            <OptionsCard />
            <HistoryCard />
            <InspectionCard />
            <WarrantyCard />
            <SaleCard />
            <DescriptionCard />
          </div>
          <CarRail title="김종선 딜러의 다른 매물" cars={relatedCars} />
          <CarRail title="동급매물" cars={classCars} />
          <p className="safety-copy">안전한 거래와 허위매물 근절을 위해 안심번호(050) 이용 시 통화 내용이 보배드림에 안전하게 보관됩니다.<br />보배드림은 등록 시스템만 제공하며, 판매자가 직접 등록한 차량에 대한 모든 책임은 판매자에게 있습니다. <button type="button" onClick={() => notify("신고하기를 선택했어요")}>신고하기</button></p>
        </main>
      </MobileScroll>
      {toast ? <div className="detail-toast" role="status">{toast}</div> : null}
      <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)} title={sheet === "priceHistory" ? "가격 변동 내역" : sheet === "more" ? "매물 더보기" : "판매자 상담"} description={sheet === "priceHistory" ? undefined : sheet === "more" ? "원하는 작업을 선택하세요." : "한강모터스 박성수에게 문의할 수 있어요."} snap={sheet === "priceHistory" ? 0.75 : 0.42}>
        {sheet === "priceHistory" ? <PriceHistorySheet onClose={() => setSheet(null)} /> : <div className="detail-sheet-actions">
          {sheet === "more" ? <><button type="button" onClick={() => { notify("매물 신고를 선택했어요"); setSheet(null); }}>허위매물 신고</button><button type="button" onClick={() => { notify("판매자를 차단했어요"); setSheet(null); }}>판매자 차단</button><button type="button" onClick={() => setSheet(null)}>취소</button></> : <><a href="tel:05062469261"><MobileIcon /> 050-6246-9261 전화하기</a><button type="button" onClick={() => { notify("상담 요청을 보냈어요"); setSheet(null); }}>문자로 상담 요청</button><button type="button" onClick={() => setSheet(null)}>닫기</button></>}
        </div>}
      </BottomSheet>
    </div>
  );
}

function DetailFooter() {
  const { setSheet, notify } = useDetailUi();
  return (
    <div className="detail-bottom-bar">
      <a className="detail-call" href="tel:05062469261"><img src={asset("detail/call.svg")} alt="" /> 전화</a>
      <button className="detail-zalo" type="button" onClick={() => notify("카카오 상담을 준비했어요")}>카카오</button>
      <button className="detail-consult" type="button" onClick={() => setSheet("contact")}>채팅</button>
    </div>
  );
}

const listScreen: FlowScreen = { id: "marketplace", render: () => <MarketplaceScreen /> };
const savedListingsScreen: FlowScreen = { id: "saved-listings", header: () => <SavedListingsHeader />, headerHeight: 58, render: () => <SavedListingsScreen /> };
const detailScreen: FlowScreen = { id: "vehicle-detail", footer: () => <DetailFooter />, footerHeight: 56, render: () => <VehicleDetail /> };

export default function Prototype() {
  return <FavoritesProvider><DetailUiProvider><FlowStack initial={listScreen} /></DetailUiProvider></FavoritesProvider>;
}


