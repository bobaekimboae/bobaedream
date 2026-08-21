import { createContext, useContext, useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  BookmarkFilledIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeOpenIcon,
  HeartFilledIcon,
  HeartIcon,
  LockClosedIcon,
  MobileIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
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
import "./prototype.css";

type SellerType = "전체" | "개인" | "딜러";
type SheetType = "filter" | "carType" | "maker" | "year" | "price" | "region" | "sort" | null;
type DetailSheet = "contact" | "more" | "priceHistory" | null;
type RegionSelection = { province: string; district: string; radius: string };
type RegionMenu = "province" | "district" | "radius" | null;

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
};

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;

const brands = [
  { name: "BMW", logo: asset("brand/bmw.svg") },
  { name: "벤츠", logo: asset("brand/benz.png") },
  { name: "아우디", logo: asset("brand/audi.svg") },
  { name: "포르쉐", logo: asset("brand/porsche.png"), full: true },
  { name: "미니", logo: asset("brand/mini.svg") },
];

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
    place: "부산 해운대구", views: 219, dealer: "개인판매자 이현우", stock: 1, posted: "24분 전", photos: 18,
  },
  {
    id: 4, maker: "벤틀리", sellerType: "딜러", image: "detail/raw-07.jpeg", title: "벤틀리 컨티넨탈 GT", trim: "6.0 W12",
    specs: ["19년11월", "42,920km", "가솔린", "검정색"], price: "15,700 만원",
    place: "서울 서초구 · 양재전시장", views: 410, dealer: "라스트라다 최민석 딜러", stock: 21, posted: "37분 전", photos: 26,
  },
  {
    id: 5, maker: "벤틀리", sellerType: "개인", image: "detail/raw-04.png", title: "벤틀리 플라잉스퍼", trim: "4.0 V8 아주르",
    specs: ["22년05월", "26,500km", "가솔린", "흰색시트"], price: "21,500 만원",
    place: "대구 수성구", views: 175, dealer: "개인판매자 박서연", stock: 1, posted: "1시간 전", photos: 16,
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
  { id: 102, maker: "BMW", modelGroup: "3시리즈", sellerType: "개인", image: "cars/bmw/3-series.webp", imageFit: "contain", title: "BMW 3시리즈 330e", trim: "M 스포츠", specs: ["22년04월", "34,800km", "플러그인 하이브리드", "검정색"], price: "4,850 만원", place: "경기 고양시", views: 137, dealer: "개인판매자 강민준", stock: 1, posted: "18분 전", photos: 12 },
  { id: 103, maker: "BMW", modelGroup: "X1", sellerType: "딜러", image: "cars/bmw/x1.webp", imageFit: "contain", title: "BMW X1 sDrive20i", trim: "xLine", specs: ["24년01월", "12,700km", "가솔린", "흰색시트"], price: "5,120 만원", place: "부산 해운대구 · BMW 프리미엄 셀렉션", views: 211, dealer: "동성모터스 박지훈 딜러", stock: 9, posted: "6분 전", photos: 21 },
  { id: 104, maker: "BMW", modelGroup: "X1", sellerType: "개인", image: "cars/bmw/x1.webp", imageFit: "contain", title: "BMW X1 xDrive20i", trim: "M 스포츠", specs: ["23년07월", "18,050km", "가솔린", "흰색시트"], price: "5,450 만원", place: "대전 유성구", views: 102, dealer: "개인판매자 이서진", stock: 1, posted: "41분 전", photos: 15 },
  { id: 105, maker: "BMW", modelGroup: "5시리즈", sellerType: "딜러", image: "cars/bmw/5-series.webp", imageFit: "contain", title: "BMW 5시리즈 530i", trim: "M 스포츠", specs: ["24년03월", "9,820km", "가솔린", "남색"], price: "7,640 만원", place: "서울 성동구 · 성수 전시장", views: 328, dealer: "한독모터스 오세훈 딜러", stock: 18, posted: "9분 전", photos: 27 },
  { id: 106, maker: "BMW", modelGroup: "5시리즈", sellerType: "딜러", image: "cars/bmw/5-series.webp", imageFit: "contain", title: "BMW 5시리즈 520i", trim: "럭셔리", specs: ["22년11월", "29,600km", "가솔린", "남색"], price: "5,750 만원", place: "광주 서구 · BMW 인증센터", views: 165, dealer: "코오롱모터스 한소희 딜러", stock: 11, posted: "53분 전", photos: 17 },
  { id: 107, maker: "BMW", modelGroup: "X3", sellerType: "딜러", image: "cars/bmw/x3.webp", imageFit: "contain", title: "BMW X3 xDrive20i", trim: "M 스포츠 프로", specs: ["24년02월", "14,390km", "가솔린", "갈색"], price: "7,180 만원", place: "경기 수원시 · BMW 프리미엄 셀렉션", views: 287, dealer: "내쇼날모터스 정우성 딜러", stock: 7, posted: "4분 전", photos: 23 },
  { id: 108, maker: "BMW", modelGroup: "X3", sellerType: "개인", image: "cars/bmw/x3.webp", imageFit: "contain", title: "BMW X3 xDrive30e", trim: "M 스포츠", specs: ["22년08월", "41,200km", "플러그인 하이브리드", "갈색"], price: "5,980 만원", place: "울산 남구", views: 119, dealer: "개인판매자 김하늘", stock: 1, posted: "1시간 전", photos: 14 },
  { id: 109, maker: "BMW", modelGroup: "1시리즈", sellerType: "딜러", image: "cars/bmw/1-series.webp", imageFit: "contain", title: "BMW 1시리즈 120i", trim: "M 스포츠", specs: ["23년05월", "25,900km", "가솔린", "흰색시트"], price: "3,890 만원", place: "인천 남동구 · BMW 인증센터", views: 148, dealer: "바바리안모터스 장민호 딜러", stock: 13, posted: "14분 전", photos: 18 },
  { id: 110, maker: "BMW", modelGroup: "1시리즈", sellerType: "개인", image: "cars/bmw/1-series.webp", imageFit: "contain", title: "BMW 1시리즈 M135i", trim: "xDrive", specs: ["22년06월", "33,100km", "가솔린", "흰색시트"], price: "4,320 만원", place: "경남 창원시", views: 202, dealer: "개인판매자 최은지", stock: 1, posted: "2시간 전", photos: 20 },
];

const benzCars: Car[] = [
  { id: 201, maker: "벤츠", modelGroup: "E클래스", sellerType: "딜러", image: "cars/thumbnail.png", title: "벤츠 E클래스 E 300 4MATIC", trim: "AMG Line", specs: ["23년06월", "18,420km", "가솔린", "흰색시트"], price: "8,420 만원", place: "서울 강남구 · 한성자동차", views: 128, dealer: "스타모터스 이준호 딜러", stock: 12, posted: "3분 전", photos: 14 },
  { id: 202, maker: "벤츠", modelGroup: "E클래스", sellerType: "개인", image: "cars/thumbnail.png", title: "벤츠 E클래스 E 220 d 4MATIC", trim: "Exclusive", specs: ["22년02월", "36,700km", "디젤", "흰색시트"], price: "5,480 만원", place: "인천 연수구", views: 96, dealer: "개인판매자", stock: 1, posted: "18분 전", photos: 11 },
  { id: 203, maker: "벤츠", modelGroup: "S클래스", sellerType: "딜러", image: "cars/thumbnail.png", title: "벤츠 S클래스 S 450 4MATIC", trim: "Long", specs: ["23년11월", "11,840km", "가솔린", "검정색"], price: "16,900 만원", place: "서울 서초구 · 더클래스 효성", views: 342, dealer: "효성프리미어모터스 박정우 딜러", stock: 7, posted: "7분 전", photos: 24 },
  { id: 204, maker: "벤츠", modelGroup: "S클래스", sellerType: "개인", image: "cars/thumbnail.png", title: "벤츠 S클래스 S 580 e 4MATIC", trim: "Long", specs: ["22년09월", "28,100km", "플러그인 하이브리드", "회색시트"], price: "14,700 만원", place: "경기 성남시", views: 207, dealer: "개인판매자 김도현", stock: 1, posted: "32분 전", photos: 18 },
  { id: 205, maker: "벤츠", modelGroup: "GLC클래스", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 GLC클래스 GLC 300 4MATIC", trim: "AMG Line", specs: ["24년01월", "9,760km", "가솔린", "흰색시트"], price: "7,950 만원", place: "부산 해운대구 · 벤츠 인증중고차", views: 255, dealer: "스타자동차 김민석 딜러", stock: 9, posted: "11분 전", photos: 21 },
  { id: 206, maker: "벤츠", modelGroup: "GLC클래스", sellerType: "개인", image: "detail/raw-18.jpeg", title: "벤츠 GLC클래스 GLC 220 d 4MATIC", trim: "Avantgarde", specs: ["21년08월", "44,200km", "디젤", "흰색시트"], price: "4,890 만원", place: "대전 유성구", views: 154, dealer: "개인판매자 이서연", stock: 1, posted: "46분 전", photos: 13 },
  { id: 207, maker: "벤츠", modelGroup: "GLE클래스", sellerType: "딜러", image: "detail/raw-18.jpeg", title: "벤츠 GLE클래스 GLE 450 4MATIC", trim: "AMG Line", specs: ["23년04월", "22,600km", "가솔린", "흰색시트"], price: "11,900 만원", place: "경기 수원시 · 벤츠 인증중고차", views: 319, dealer: "모터원 이재훈 딜러", stock: 15, posted: "5분 전", photos: 27 },
  { id: 208, maker: "벤츠", modelGroup: "GLE클래스", sellerType: "개인", image: "detail/raw-18.jpeg", title: "벤츠 GLE클래스 GLE 300 d 4MATIC", trim: "Premium", specs: ["22년12월", "31,300km", "디젤", "흰색시트"], price: "8,780 만원", place: "광주 서구", views: 181, dealer: "개인판매자 최윤아", stock: 1, posted: "1시간 전", photos: 17 },
  { id: 209, maker: "벤츠", modelGroup: "C클래스", sellerType: "딜러", image: "cars/thumbnail.png", title: "벤츠 C클래스 C 300 4MATIC", trim: "AMG Line", specs: ["24년02월", "7,900km", "가솔린", "흰색시트"], price: "6,480 만원", place: "서울 성동구 · KCC오토", views: 223, dealer: "KCC오토 장현수 딜러", stock: 11, posted: "9분 전", photos: 20 },
  { id: 210, maker: "벤츠", modelGroup: "C클래스", sellerType: "개인", image: "cars/thumbnail.png", title: "벤츠 C클래스 C 200 Avantgarde", trim: "Avantgarde", specs: ["22년05월", "29,400km", "가솔린", "흰색시트"], price: "4,350 만원", place: "경남 창원시", views: 117, dealer: "개인판매자 박지민", stock: 1, posted: "2시간 전", photos: 12 },
];

function shuffleCars(source: Car[]) {
  const shuffled = [...source];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const target = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
  }
  return shuffled;
}

const sheetLabels: Record<Exclude<SheetType, null>, string> = {
  filter: "상세 필터", carType: "차량 유형", maker: "제조사", year: "연식", price: "가격", region: "지역", sort: "정렬",
};

const detailPhotos = ["raw-04.png", "raw-09.jpeg", "raw-07.jpeg", "raw-20.jpeg"].map((name) => asset(`detail/${name}`));

const optionItems = [
  "파노라마 선루프", "LED 헤드램프", "어댑티브 크루즈 컨트롤", "후방카메라",
  "어라운드뷰", "스마트키", "순정 내비게이션", "열선시트",
  "통풍시트", "헤드업 디스플레이", "전동트렁크", "자동 긴급제동",
  "차선 이탈방지", "메모리 시트", "스마트 하이빔", "전자식 파킹브레이크",
];

const vehicleInfo = [
  ["연식", "2021년 1월"], ["주행거리", "42,000 km"], ["연료", "가솔린"], ["변속기", "자동 8단"],
  ["배기량", "2,497 cc"], ["색상", "검정색 (외장) · 흰색 (시트)"], ["지역", "서울 서초구"], ["사고이력", "없음"],
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

function Header({ query, setQuery, searchSaved, onToggleSearchSaved }: { query: string; setQuery: (query: string) => void; searchSaved: boolean; onToggleSearchSaved: () => void }) {
  const keyboard = useKeyboard();

  return (
    <header className="top-bar" aria-label="중고차 검색">
      <button className="icon-button back-button" type="button" aria-label="뒤로 가기" onClick={() => window.history.back()}><Icon name="back.svg" /></button>
      <label className="search-field">
        <Icon name="search.svg" />
        <KeyboardInput aria-label="중고차 검색" value={query} onChange={(event) => setQuery(event.currentTarget.value)} onBlur={() => keyboard.hide()} placeholder="중고차" />
        <span className="search-divider" />
        <button type="button" className={`search-save${searchSaved ? " is-saved" : ""}`} aria-label={searchSaved ? "저장한 검색 조건 삭제" : "검색 조건 저장"} aria-pressed={searchSaved} onPointerDown={(event) => event.preventDefault()} onClick={onToggleSearchSaved}>{searchSaved ? <BookmarkFilledIcon /> : <Icon name="bookmark.svg" />}</button>
      </label>
      <button className="icon-button" type="button" aria-label="찜한 차량"><Icon name="heart.svg" /></button>
      <button className="icon-button" type="button" aria-label="메시지"><Icon name="message.svg" /></button>
    </header>
  );
}

function FilterChip({ label, icon, active, onClick }: { label: string; icon?: string; active?: boolean; onClick: () => void }) {
  return (
    <button className={`filter-chip${active ? " is-active" : ""}`} type="button" aria-pressed={active} onClick={onClick}>
      {icon ? <Icon name={icon} /> : null}<span>{label}</span>{!icon || active ? <Icon name={active ? "close.svg" : "chevron-down.svg"} /> : null}
    </button>
  );
}

function CarCard({ car, cardView, liked, onToggleLike, onOpen }: { car: Car; cardView: boolean; liked: boolean; onToggleLike: () => void; onOpen: () => void }) {
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article className={`car-card${cardView ? " is-card-view" : ""}`} role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeyDown={onKeyDown}>
      <div className="car-photo-wrap">
        <img className={`car-photo${car.imageFit === "contain" ? " is-catalog" : ""}`} src={asset(car.image)} alt={`${car.title} ${car.trim} 차량, ${car.posted}, 사진 ${car.photos}장`} draggable={false} />
        {cardView ? <div className="card-photo-meta"><span>{car.posted}</span><span>{car.photos}<Icon name="photo-count.svg" /></span></div> : null}
      </div>
      <div className="car-copy">
        <div className="car-main">
          {cardView ? <div className="card-title-row"><h2>{car.title} {car.trim}</h2><button type="button" aria-label={`${car.title} 더보기`} onClick={(event) => event.stopPropagation()}><Icon name="card-more.svg" /></button></div> : <><h2>{car.title}</h2><p className="trim">{car.trim}</p></>}
          <p className="specs">{car.specs.join(" · ")}</p>
          <p className="price">{car.price}</p>{car.lease ? <p className="lease">{car.lease}</p> : null}
          <div className="badges"><span>인증중고차</span><span>1년 보증</span></div>
        </div>
        <div className="car-footer">
          <p className="location-line"><Icon name="location-gray.svg" />{car.place}<span className="dot">·</span><Icon name="views.svg" />{car.views}</p>
          <div className="dealer-line">
            <img className="dealer-avatar" src={asset("cars/dealer.png")} alt="" aria-hidden="true" draggable={false} />
              <p><strong>{car.dealer}</strong><span>· 판매중 <b>{car.stock}대</b></span></p>
            {cardView ? <div className="card-contact-actions"><button type="button" aria-label={`${car.dealer} 전화`} onClick={(event) => event.stopPropagation()}><Icon name="card-call.svg" /></button><button type="button" aria-label={`${car.dealer} 메시지`} onClick={(event) => event.stopPropagation()}><Icon name="card-message.svg" /></button></div> : null}
            <button className={`like-button${liked ? " is-liked" : ""}`} type="button" aria-label={`${car.title} 찜하기`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}><Icon name={cardView ? "card-heart.svg" : "heart-outline.svg"} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

function RegionSheet({ value, onChange, onClose, onConfirm }: { value: RegionSelection; onChange: (value: RegionSelection) => void; onClose: () => void; onConfirm: () => void }) {
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
          <button className="region-select" type="button" aria-expanded={menu === "province"} onClick={() => setMenu((current) => current === "province" ? null : "province")}><span className={value.province ? "has-value" : ""}>{value.province || "시/도 선택"}</span><Icon name="sheet-chevron.svg" /></button>
          {menu === "province" ? <div className="region-menu" role="listbox" aria-label="시도 선택">{provinceOptions.map((province) => <button key={province} type="button" role="option" aria-selected={(value.province || "전국") === province} onClick={() => chooseProvince(province)}>{province}</button>)}</div> : null}
        </div>
        <div className="region-quick-chips" aria-label="빠른 지역 선택">{quickRegions.map((label) => <button key={label} type="button" className={(value.province === (label === "전남광주" ? "광주" : label)) ? "is-selected" : ""} aria-pressed={value.province === (label === "전남광주" ? "광주" : label)} onClick={() => chooseQuickRegion(label)}>{label}</button>)}</div>
        <div className="region-select-wrap">
          <button className="region-select" type="button" disabled={!value.province} aria-expanded={menu === "district"} onClick={() => setMenu((current) => current === "district" ? null : "district")}><span className={value.district ? "has-value" : ""}>{value.district || "시/군/구 선택"}</span><Icon name="sheet-chevron.svg" /></button>
          {menu === "district" ? <div className="region-menu" role="listbox" aria-label="시군구 선택">{districtOptions.map((district) => <button key={district} type="button" role="option" aria-selected={(value.district || "전체") === district} onClick={() => { onChange({ ...value, district: district === "전체" ? "" : district, radius: "" }); setMenu(null); }}>{district}</button>)}</div> : null}
        </div>
      </div>
      <div className="region-around">
        <div className="region-around-heading"><span /><strong>내 주변 검색</strong></div>
        <div className="region-select-wrap">
          <button className="region-select" type="button" aria-expanded={menu === "radius"} onClick={() => setMenu((current) => current === "radius" ? null : "radius")}><span className={value.radius ? "has-value" : ""}>{value.radius ? `내 위치에서 ${value.radius}` : "내 위치와 검색 반경 선택"}</span><Icon name="sheet-chevron.svg" /></button>
          {menu === "radius" ? <div className="region-menu is-upward" role="listbox" aria-label="검색 반경 선택">{radiusOptions.map((radius) => <button key={radius} type="button" role="option" aria-selected={value.radius === radius} onClick={() => { onChange({ province: "", district: "", radius }); setMenu(null); }}>{radius}</button>)}</div> : null}
        </div>
      </div>
      <div className="region-actions"><button type="button" className="region-reset" onClick={() => { onChange(emptyRegion); setMenu(null); }}>초기화</button><button type="button" className="region-confirm" onClick={onConfirm}>확인</button></div>
    </div>
  );
}

function MarketplaceScreen() {
  const flow = useFlow();
  const [query, setQuery] = useState("");
  const [sellerType, setSellerType] = useState<SellerType>("전체");
  const [maker, setMaker] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetType>(null);
  const [sort, setSort] = useState("최신순");
  const [cardView, setCardView] = useState(false);
  const [videoOnly, setVideoOnly] = useState(false);
  const [liked, setLiked] = useState<number[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [shuffledCars, setShuffledCars] = useState<Car[]>(() => shuffleCars(defaultCars));
  const [region, setRegion] = useState<RegionSelection>(emptyRegion);
  const [draftRegion, setDraftRegion] = useState<RegionSelection>(emptyRegion);
  const [searchSaved, setSearchSaved] = useState(false);
  const [searchToast, setSearchToast] = useState("");

  useEffect(() => {
    if (!searchToast) return;
    const timer = window.setTimeout(() => setSearchToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [searchToast]);

  const regionLabel = region.radius ? `내 주변 ${region.radius}` : [region.province, region.district].filter(Boolean).join(" ") || "전국";
  const regionKeyword = region.province === "광주" ? "광주" : region.province;

  const visibleCars = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return shuffledCars.filter((car) => (sellerType === "전체" || car.sellerType === sellerType) && (!maker || car.maker === maker) && (!selectedModel || car.modelGroup === selectedModel) && (!regionKeyword || car.place.includes(regionKeyword)) && (!region.district || car.place.includes(region.district)) && (!normalized || `${car.title} ${car.trim} ${car.maker}`.toLowerCase().includes(normalized)));
  }, [maker, query, region.district, regionKeyword, selectedModel, sellerType, shuffledCars]);

  const resetFilters = () => {
    setMaker(null);
    setSelectedModel(null);
    setShuffledCars(shuffleCars(defaultCars));
    setSellerType("전체");
    setQuery("");
    setSort("최신순");
    setRegion(emptyRegion);
  };

  const openRegionSheet = () => {
    setDraftRegion(region);
    setSheet("region");
  };

  const toggleSearchSaved = () => {
    const nextSaved = !searchSaved;
    setSearchSaved(nextSaved);
    setSearchToast(nextSaved ? "검색 조건을 저장했습니다." : "저장한 검색 조건을 삭제했습니다.");
  };

  const chooseMaker = (nextMaker: string | null) => {
    setMaker(nextMaker);
    setSelectedModel(null);
    setShuffledCars(shuffleCars(nextMaker === "BMW" ? bmwCars : nextMaker === "벤츠" ? benzCars : defaultCars));
    setSheet(null);
  };

  const chooseModel = (modelName: string) => {
    const nextModel = selectedModel === modelName ? null : modelName;
    setSelectedModel(nextModel);
    setShuffledCars(shuffleCars(maker === "벤츠" ? benzCars : bmwCars));
  };

  return (
    <>
      <MobileScroll className="app-screen">
        <main className="marketplace" aria-label="중고차 리스트">
          <Header query={query} setQuery={setQuery} searchSaved={searchSaved} onToggleSearchSaved={toggleSearchSaved} />
          <section className="region-bar" aria-label="지역 선택">
            <button type="button" aria-label={`현재 지역 ${regionLabel}, 지역 선택 열기`} onClick={openRegionSheet}><Icon name="location-blue.svg" /><span className="region-label">지역:</span><strong>{regionLabel}</strong><Icon name="region-chevron.svg" /></button>
            <button type="button" className="reset-button" onClick={resetFilters}>초기화</button>
          </section>
          <Carousel ariaLabel="중고차 필터" className="filter-rail" contentClassName="filter-track">
            <FilterChip label="필터" icon="filter.svg" onClick={() => setSheet("filter")} />
            <FilterChip label="중고차" active onClick={() => setSheet("carType")} />
            <FilterChip label={maker ?? "제조사"} active={Boolean(maker)} onClick={() => setSheet("maker")} />
            <FilterChip label="연식" onClick={() => setSheet("year")} />
            <FilterChip label="가격" onClick={() => setSheet("price")} />
          </Carousel>
          <section className={`brand-row${maker === "BMW" ? " is-model-mode" : maker === "벤츠" ? " is-benz-model-mode" : ""}`} aria-label={maker === "BMW" ? "BMW 모델 빠른 선택" : maker === "벤츠" ? "벤츠 모델 빠른 선택" : "제조사 빠른 선택"}>
            <span className="brand-title">{maker === "BMW" || maker === "벤츠" ? "모델" : "제조사"}</span>
            <Carousel ariaLabel={maker === "BMW" ? "BMW 모델" : maker === "벤츠" ? "벤츠 모델" : "제조사"} className="brand-carousel" contentClassName={maker === "BMW" ? "bmw-model-track" : maker === "벤츠" ? "benz-model-track" : "brand-track"}>
              {maker === "BMW" ? bmwModels.map((model) => (
                <button key={model.name} className={`bmw-model-card${selectedModel === model.name ? " is-selected" : ""}`} type="button" aria-pressed={selectedModel === model.name} onClick={() => chooseModel(model.name)}>
                  <img src={model.image} alt={`${model.name} 차량`} draggable={false} />
                  <span>{model.name}</span>
                </button>
              )) : maker === "벤츠" ? benzModels.map((model) => (
                <button key={model} className={`benz-model-chip${selectedModel === model ? " is-selected" : ""}`} type="button" aria-pressed={selectedModel === model} onClick={() => chooseModel(model)}>{model}</button>
              )) : brands.map((brand) => (
                <button key={brand.name} className="brand-item" type="button" aria-pressed={false} onClick={() => chooseMaker(brand.name)}>
                  {brand.full ? <img className="brand-full" src={brand.logo} alt="" aria-hidden="true" draggable={false} /> : <span className="brand-logo"><img src={brand.logo} alt="" aria-hidden="true" draggable={false} /></span>}
                  {!brand.full ? <span>{brand.name}</span> : null}
                </button>
              ))}
            </Carousel>
          </section>
          <section className="video-toggle-row" aria-label="영상 매물 설정">
            <span>영상 매물</span>
            <button type="button" role="switch" aria-checked={videoOnly} className={videoOnly ? "is-on" : ""} onClick={() => setVideoOnly((value) => !value)}><span /></button>
          </section>
          <nav className="list-toolbar" aria-label="매물 유형과 정렬">
            <div className="seller-tabs" role="tablist" aria-label="판매자 유형">
              {(["전체", "개인", "딜러"] as SellerType[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={sellerType === tab} className={sellerType === tab ? "is-selected" : ""} onClick={() => setSellerType(tab)}>{tab}</button>)}
            </div>
            <div className="sort-controls">
              <button type="button" className="sort-button" onClick={() => setSheet("sort")}>{sort}<Icon name="sort-arrow.svg" /></button><span className="toolbar-divider" />
              <button type="button" className={`density-button${cardView ? " is-active" : ""}`} aria-label={cardView ? "목록형 보기로 전환" : "카드형 보기로 전환"} aria-pressed={cardView} onClick={() => setCardView((value) => !value)}><Icon name={cardView ? "card-view.svg" : "list.svg"} /></button>
            </div>
          </nav>
          <section className="car-list" aria-live="polite">
            {visibleCars.length ? visibleCars.map((car) => <CarCard key={car.id} car={car} cardView={cardView} liked={liked.includes(car.id)} onOpen={() => flow.push(detailScreen)} onToggleLike={() => setLiked((current) => current.includes(car.id) ? current.filter((id) => id !== car.id) : [...current, car.id])} />) : (
              <div className="empty-state"><strong>조건에 맞는 차량이 없어요</strong><span>필터를 초기화하고 다시 찾아보세요.</span><button type="button" onClick={resetFilters}>필터 초기화</button></div>
            )}
          </section>
        </main>
      </MobileScroll>
      {searchToast ? <div className="market-toast" role="status" aria-live="polite">{searchToast}</div> : null}
      <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)} title={sheet ? sheetLabels[sheet] : "필터"} description={sheet === "region" ? undefined : "원하는 조건을 선택해 매물을 좁혀보세요."} snap={sheet === "region" ? 0.53 : 0.48}>
        {sheet === "region" ? <RegionSheet value={draftRegion} onChange={setDraftRegion} onClose={() => setSheet(null)} onConfirm={() => { setRegion(draftRegion); setSheet(null); }} /> : <div className="sheet-options">
          {sheet === "maker" || sheet === "filter" ? <><button type="button" className={!maker ? "is-selected" : ""} onClick={() => chooseMaker(null)}>전체 제조사</button>{brands.map((brand) => <button key={brand.name} type="button" className={maker === brand.name ? "is-selected" : ""} onClick={() => chooseMaker(brand.name)}>{brand.name}</button>)}</> : sheet === "sort" ? ["최신순", "낮은 가격순", "높은 가격순"].map((label) => <button key={label} type="button" className={sort === label ? "is-selected" : ""} onClick={() => { setSort(label); setSheet(null); }}>{label}</button>) : ["전체", "추천 조건", "인기 조건"].map((label) => <button key={label} type="button" onClick={() => setSheet(null)}>{label}</button>)}
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

function DetailHero({ onBack }: { onBack: () => void }) {
  const { setSheet, notify } = useDetailUi();
  const [media, setMedia] = useState<"video" | "photos">("photos");

  return (
    <section className="detail-hero" aria-label="차량 사진">
      <Carousel ariaLabel="차량 사진" className="detail-media-carousel" contentClassName="detail-media-track">
        {detailPhotos.map((photo, index) => <img key={photo} src={photo} alt={`벤틀리 차량 사진 ${index + 1}`} draggable={false} />)}
      </Carousel>
      {media === "video" ? <div className="detail-video-overlay"><button type="button" onClick={() => setMedia("photos")} aria-label="영상 일시정지"><span>▶</span><b>차량 영상 재생 중</b></button></div> : null}
      <div className="detail-photo-count">1/24</div>
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
  return (
    <section className="vehicle-summary">
      <div className="vehicle-title-row"><h1>2019 벤틀리 컨티넨탈 GT 3세대 6.0 퍼스트 에디션</h1><button type="button" aria-label="매물 찜하기" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? <HeartFilledIcon /> : <HeartIcon />}</button></div>
      <p className="vehicle-lead">6인승 독립시트로 뒷좌석의 편안함을 최우선으로 느껴보세요.</p>
      <p className="vehicle-meta">172무2323 · 19년 02월 · 17,000 km · 가솔린</p>
      <div className="detail-badges"><span>인증중고차</span><span>1년 보증</span></div>
      <div className="detail-price-row">
        <strong>1억 4,500만원</strong>
        <button type="button" onClick={() => setSheet("priceHistory")}>가격 변동</button>
      </div>
      <div className="detail-calculators">
        <button type="button" onClick={() => notify("비용 계산기를 열었어요")}>비용 계산기</button>
        <button type="button" onClick={() => notify("보험료 계산을 시작해요")}>보험료 계산</button>
      </div>
      <div className="vehicle-stats"><span><HeartFilledIcon />480</span><span><EyeOpenIcon />2,301</span><span><ClockIcon />1분 전</span></div>
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
        <button type="button" aria-label="이전 페이지" disabled={page === 1} onClick={() => selectPage(page - 1)}><img src={asset("detail/pagination-left.svg")} alt="" /></button>
        {visiblePages.map((pageNumber, index) => (
          <span key={pageNumber} className="price-history-page-slot">
            {index === visiblePages.length - 1 ? <img className="price-history-ellipsis" src={asset("detail/pagination-ellipsis.svg")} alt="" /> : null}
            <button type="button" aria-label={`${pageNumber} 페이지`} aria-current={page === pageNumber ? "page" : undefined} onClick={() => selectPage(pageNumber)}>{pageNumber}</button>
          </span>
        ))}
        <button type="button" aria-label="다음 페이지" disabled={page === 10} onClick={() => selectPage(page + 1)}><img src={asset("detail/pagination-right.svg")} alt="" /></button>
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
      <div className="selected-options"><h3>선택 옵션</h3><dl><div><dt>빌트인 캠 패키지 <QuestionMarkCircledIcon /></dt><dd>70만원</dd></div><div><dt>헤드업 디스플레이 <QuestionMarkCircledIcon /></dt><dd>130만원</dd></div></dl></div>
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
      <div className="seller-profile"><img src={asset("detail/raw-10.jpeg")} alt="한강모터스 박성수 딜러" /><div><h2>한강모터스 박성수 <span>딜러</span></h2><p><b>10대</b> 판매완료 · <b>5대</b> 판매중</p><p>● 서울 서초구 오토갤러리</p></div></div>
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
      {railCars.map((car) => <button key={`${title}-${car.title}`} className="related-card" type="button" onClick={() => notify(`${car.title} 매물을 열었어요`)}><div className="related-photo"><img src={asset(`detail/${car.image}`)} alt={car.title} draggable={false} /><span>{car.posted}</span><b>10 ▣</b></div><div><h3>{car.title}</h3>{car.meta ? <p>{car.meta}</p> : null}<strong>{car.price}</strong><small>● {car.place}</small></div></button>)}
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
            <SectionCard title="차량 정보"><InfoGrid items={vehicleInfo} /><div className="detail-subsection"><h3>상세 정보</h3><InfoGrid items={extraInfo} /></div></SectionCard>
            <OptionsCard />
            <HistoryCard />
            <InspectionCard />
            <WarrantyCard />
            <SellerCard />
            <SaleCard />
            <DescriptionCard />
          </div>
          <CarRail title="김종선 딜러의 다른 매물" cars={relatedCars} />
          <CarRail title="동급매물" cars={classCars} />
          <p className="safety-copy">안전한 거래와 허위매물 근절을 위해 안심번호(050) 이용 시 통화 내용이 보배드림에 안전하게 보관됩니다.<br />보배드림은 등록 시스템만 제공하며, 판매자가 직접 등록한 차량에 대한 모든 책임은 판매자에게 있습니다. <button type="button" onClick={() => notify("신고하기를 선택했어요")}>신고하기</button></p>
        </main>
      </MobileScroll>
      {toast ? <div className="detail-toast" role="status">{toast}</div> : null}
      <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)} title={sheet === "priceHistory" ? "가격 변동 내역" : sheet === "more" ? "매물 더보기" : "딜러 상담"} description={sheet === "priceHistory" ? undefined : sheet === "more" ? "원하는 작업을 선택하세요." : "한강모터스 박성수 딜러에게 문의할 수 있어요."} snap={sheet === "priceHistory" ? 0.75 : 0.42}>
        {sheet === "priceHistory" ? <PriceHistorySheet onClose={() => setSheet(null)} /> : <div className="detail-sheet-actions">
          {sheet === "more" ? <><button type="button" onClick={() => { notify("매물 신고를 선택했어요"); setSheet(null); }}>허위매물 신고</button><button type="button" onClick={() => { notify("판매자를 차단했어요"); setSheet(null); }}>판매자 차단</button><button type="button" onClick={() => setSheet(null)}>취소</button></> : <><a href="tel:05062469261"><MobileIcon /> 050-6246-9261 전화하기</a><button type="button" onClick={() => { notify("상담 요청을 보냈어요"); setSheet(null); }}>문자로 상담 요청</button><button type="button" onClick={() => setSheet(null)}>닫기</button></>}
        </div>}
      </BottomSheet>
    </div>
  );
}

function DetailFooter() {
  const { liked, setLiked, setSheet } = useDetailUi();
  return (
    <div className="detail-bottom-bar">
      <button className={`detail-bottom-like${liked ? " is-liked" : ""}`} type="button" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? <HeartFilledIcon /> : <HeartIcon />}<span>{liked ? "찜함" : "찜하기"}</span></button>
      <button className="detail-consult" type="button" onClick={() => setSheet("contact")}>상담</button>
      <a className="detail-call" href="tel:05062469261"><img src={asset("detail/call.svg")} alt="" /> 전화하기</a>
    </div>
  );
}

const listScreen: FlowScreen = { id: "marketplace", render: () => <MarketplaceScreen /> };
const detailScreen: FlowScreen = { id: "vehicle-detail", footer: () => <DetailFooter />, footerHeight: 56, render: () => <VehicleDetail /> };

export default function Prototype() {
  return <DetailUiProvider><FlowStack initial={listScreen} /></DetailUiProvider>;
}

