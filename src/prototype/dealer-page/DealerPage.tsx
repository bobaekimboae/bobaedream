import { luxuryLogoBrands, luxuryLogoPath, luxuryLogoSource } from "../listing/luxury-logo-rail";
import { instagramHandleFor, instagramPostsFor, type DealerInstagramPost } from "../data/seoul-autogallery-instagram-v01";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Cross2Icon, ExternalLinkIcon, PauseIcon, PlayIcon } from "@radix-ui/react-icons";
import { FlowStack, type FlowScreen } from "../../mobile";
import { DetailFooter, DetailUiProvider, VehicleDetail } from "../detail";
import { FavoritesProvider, asset, joyMotorsCars, seoulAutoGalleryCars, setActiveDetailCar, type Car } from "../data";
import { BbmResultCard } from "../listing/bbm-list";
import { ListingLanguageSelect } from "../listing/listing-i18n";
import { allSeoulAutoGalleryDealers, type SeoulAutoGalleryDealer } from "../listing/seoul-auto-gallery-dealer-rail";

// 조이모터스(SK V1 모터스 173호) 대표 이지유(2026-10-21 「조이모터스 상사페이지 만들어」). 공개 홈페이지의 대표·상호·사업자번호·대표번호·팩스·이메일·주소만 쓴다.
export const JOY_SHOP_NO = "joy";
const joyDealer: SeoulAutoGalleryDealer = { name: "이지유", listingCount: joyMotorsCars.length, shopNo: JOY_SHOP_NO, empNo: "1", image: "dealer-02.png", role: "대표" };
const dealers: readonly SeoulAutoGalleryDealer[] = [...allSeoulAutoGalleryDealers, joyDealer];
import { SagGoogleMap } from "../listing/sag-google-map";
import { dealerSnsLinks, snsLabel } from "../data/seoul-autogallery-sns-v01";
import { seoulAutoGalleryShopByNo } from "../data/seoul-autogallery-shops-v01";
import { setPretendard } from "../fonts/pretendard";
import { DealerBusinessCard } from "./DealerBusinessCard";
import { matchesStockCategories, matchesStockCategory, readStockCategories, stockCategories, type StockCategory } from "./dealer-stock";
import "./dealer-page.css";

const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.location.href).pathname;
const icon = (name: string) => `${publicBase}icons/chotot/${name}`;
const dealerIcon = (name: string) => `${publicBase}icons/dealer-profile/${name}.${name === "dealership-building" ? "png" : "svg"}`;
const bobaeAsset = (name: string) => asset(`pc-detail/${name}`);
const dealerPhoto = (dealer: SeoulAutoGalleryDealer) => asset(dealer.profileAsset ?? `dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`);

type SectionId = "home" | "ads" | "community" | "valuation" | "reviews" | "social" | "dealers" | "intro";
type ListingMode = "active" | "sold" | "sns";
// SNS 판매 차량 = SNS 게시물 중 차량이 걸린 글(2026-10-21 「SNS 탭을 없애고 판매완료 옆으로 SNS 판매 차량 (2)」).
const SNS_LISTING_COUNT = 2;
type ReviewFilter = "all" | "buyer" | "seller";
type StoreReview = {
  id: number;
  name: string;
  role: Exclude<ReviewFilter, "all">;
  score: number;
  date: string;
  body?: string;
  tags: string[];
  carIndex: number;
  reply?: string;
  replyDate?: string;
  transactionKey?: string;
};

const dealerDetailScreen: FlowScreen = {
  id: "dealer-vehicle-detail",
  footer: () => <DetailFooter />,
  footerHeight: 56,
  render: () => <VehicleDetail />,
};

const TWOJ_PROFILE = {
  rating: 4.9,
  reviewCount: 17,
  sold: 12,
  followers: 425,
  lastActive: "6시간 전 활동",
  joined: "딜러 경력 7년",
  company: "(주)투제이모터웍스",
  complex: "서울SAG · 서울오토갤러리",
  gallery: "서울오토갤러리",
  licenseNo: "02-1123-000075",
  businessNo: "462-86-03494",
  employeeNo: "26-003-00097",
  phone: "02-2059-5211",
  fax: "02-2059-5200",
  email: "이메일 문의",
  staff: "4명",
  address: "서울 서초구 양재대로11길 36, 은관 421호",
  intro: "서울오토갤러리 은관에 위치한 (주)투제이모터웍스 대표 김태규입니다. 모든 차량의 상태와 이력을 직접 확인하고, 정확한 정보와 투명한 상담을 약속드립니다.",
  soldCars: [
    ["BMW X5 xDrive40i M 스포츠", "3일 전"],
    ["벤츠 GLE 450 4매틱", "1개월 전"],
    ["포르쉐 카이엔 3.0", "2개월 전"],
    ["BMW 740Li xDrive", "3개월 전"],
    ["벤츠 S580 4매틱", "4개월 전"],
    ["아우디 Q8 55 TFSI", "5개월 전"],
    ["랜드로버 레인지로버 스포츠", "7개월 전"],
    ["마세라티 르반떼", "8개월 전"],
    ["BMW M4 컴페티션", "10개월 전"],
    ["벤츠 AMG GT 43", "1년 전"],
    ["포르쉐 파나메라 4", "1년 전"],
    ["BMW 530i M 스포츠", "1년 전"],
  ] as const,
} as const;

type DealerProfileInfo = {
  rating: number; reviewCount: number; sold: number; followers: number; lastActive: string; joined: string;
  company: string; complex: string; gallery: string; licenseNo: string; businessNo: string; employeeNo: string;
  phone: string; phoneIsGallery?: boolean; homepage?: string; homepageLabel?: string; mapQuery?: string; mapAddress?: string; mapPlace?: string; coverImage?: string; specialty?: string; fax: string; email: string; staff: string; address: string; intro: string;
  soldCars: ReadonlyArray<readonly [string, string]>;
};

const stripCorp = (name: string) => name.replace(/\(주\)|\(유\)|주식회사|\(주$|\)$/g, "").replace(/\s+/g, " ").trim();
const seedOf = (text: string) => [...text].reduce((sum, ch) => (sum * 31 + ch.charCodeAt(0)) % 100003, 7);

// 투제이모터웍스(김태규)는 실제 확인한 값 그대로, 나머지 78개 상사 대표는 공개 목록의 상사명·대표·호수만 쓰고
// 상사 대표 전화도 공개 목록 값을 쓴다(미기재 상사는 전화 줄을 뺀다). 평점·판매완료·팔로워·리뷰 수·경력은
// 상사 번호로 정한 화면 확인용 가상 값이다. 팩스·허가·사업자 번호는 목록에 없어 화면에서 뺀다.
function profileFor(dealer: SeoulAutoGalleryDealer): DealerProfileInfo {
  if (dealer.shopNo === "450554") return TWOJ_PROFILE;
  if (dealer.shopNo === JOY_SHOP_NO) return JOY_PROFILE;
  const shop = seoulAutoGalleryShopByNo.get(dealer.shopNo);
  const company = shop?.company ?? "서울오토갤러리 회원사";
  const room = shop?.room ?? "";
  const hall = room.startsWith("금관") ? room : `은관 ${room}`;
  const seed = seedOf(`${dealer.shopNo}-${dealer.name}`);
  const sold = 6 + (seed % 7);
  const years = 3 + (seed % 15);
  const coOwners = dealer.role && dealer.role !== "대표" ? `소속딜러 ${dealer.name}` : shop && shop.owners.length > 1 ? `공동대표 ${shop.owners.join(" · ")}` : `대표 ${dealer.name}`;
  return {
    rating: Math.round((4.5 + (seed % 5) / 10) * 10) / 10,
    reviewCount: 3 + (seed % 28),
    sold,
    followers: 40 + (seed % 860),
    lastActive: `${1 + (seed % 22)}시간 전 활동`,
    joined: `딜러 경력 ${years}년`,
    company,
    complex: "서울SAG · 서울오토갤러리",
    gallery: "서울오토갤러리",
    licenseNo: "",
    businessNo: "",
    employeeNo: "",
    phone: shop?.phone || SAG_MAIN_PHONE,
    phoneIsGallery: !shop?.phone,
    fax: "",
    email: "이메일 문의",
    staff: `${dealers.filter((item) => item.shopNo === dealer.shopNo).length}명`,
    address: `서울 서초구 양재대로11길 36, ${hall}`.trim(),
    intro: `서울오토갤러리 ${hall}에 위치한 ${company} ${coOwners}입니다. 모든 차량의 상태와 이력을 직접 확인하고, 정확한 정보와 투명한 상담을 약속드립니다.`,
    soldCars: TWOJ_PROFILE.soldCars.slice(0, sold),
  };
}

const JOY_PROFILE: DealerProfileInfo = {
  rating: 4.9,
  reviewCount: 27,
  sold: 12,
  followers: 1280,
  lastActive: "1시간 전 활동",
  joined: "딜러 경력 25년",
  company: "e-조이모터스",
  complex: "SK V1 모터스 · 수원",
  homepage: "https://xn--v52b29lt4d12ac80a.com/",
  homepageLabel: "조이모터스.com",
  gallery: "SK V1 모터스",
  licenseNo: "",
  businessNo: "203-85-06411",
  employeeNo: "",
  phone: "031-278-3030",
  mapQuery: "SK V1 모터스 경기도 수원시 권선구 평동로79번길 45",
  mapAddress: "경기 수원시 권선구 평동로79번길 45",
  mapPlace: "SK V1 모터스 · 평동",
  coverImage: joyMotorsCars.find((car) => car.image)?.image,
  specialty: "수입차 · 슈퍼카 · 신차 · 수출",
  fax: "0504-203-7388",
  email: "ejoymotors24@naver.com",
  staff: "",
  address: "경기 수원시 권선구 평동로79번길 45, SK V1 모터스 173호",
  intro: "2001년부터 25년 동안 수입차·슈퍼카를 다뤄 온 e-조이모터스 대표 이지유입니다. 전시 중인 차량은 모두 대표가 직접 매입하고 검수했으며, 구매 상담부터 출고 이후 관리까지 같은 기준으로 책임집니다. 수원 SK V1 모터스 173호와 서울 성동구 쇼룸에서 만나실 수 있습니다. (상호 (주)이조이모터스24)",
  soldCars: TWOJ_PROFILE.soldCars.slice(0, 12),
};

// 한 화면에 딜러 한 명이라 렌더 전에 한 번 정한다(DealerPage).
let MOCK: DealerProfileInfo = TWOJ_PROFILE;

const STORE_REVIEW_TAGS = [
  "친절한 상담",
  "믿을 수 있어요",
  "차량 상태가 설명과 같아요",
  "차량 품질이 좋아요",
  "가격이 합리적이에요",
  "약속을 잘 지켜요",
] as const;

const REVIEW_RATING_COPY = ["", "매우 아쉬웠어요", "아쉬웠어요", "보통이에요", "만족했어요", "매우 만족했어요"] as const;
const REVIEW_TAG_OPTIONS = {
  buyer: {
    low: ["설명이 부족해요", "응답이 아쉬워요", "약속 시간이 아쉬워요", "차량 상태 확인이 필요해요"],
    neutral: ["응대가 무난해요", "설명이 충분해요", "거래가 원활해요"],
    high: [...STORE_REVIEW_TAGS],
  },
  seller: {
    low: ["가격 안내가 아쉬워요", "응답이 아쉬워요", "약속 시간이 아쉬워요"],
    neutral: ["응대가 무난해요", "가격 설명이 충분해요", "거래가 원활해요"],
    high: ["친절한 상담", "믿을 수 있어요", "가격이 합리적이에요", "약속을 잘 지켜요", "응답이 빨라요", "거래가 원활해요"],
  },
} as const;

const STORE_REVIEWS: StoreReview[] = [
  { id: 1, name: "김민수", role: "buyer", score: 5, date: "2주 전", body: "차량 상태와 이력을 하나씩 설명해 주셔서 안심하고 계약했습니다.", tags: ["친절한 상담", "믿을 수 있어요"], carIndex: 0, reply: "소중한 후기 감사합니다. 안전하고 즐거운 운행 되시길 바랍니다.", replyDate: "2주 전" },
  { id: 2, name: "오토라이프", role: "buyer", score: 5, date: "1개월 전", body: "사진과 실제 차량 상태가 같았고 출고 준비도 꼼꼼했습니다.", tags: ["차량 상태가 설명과 같아요", "차량 품질이 좋아요"], carIndex: 1 },
  { id: 3, name: "박준호", role: "buyer", score: 5, date: "2개월 전", body: "질문이 많았는데 끝까지 친절하게 안내해 주셨습니다.", tags: ["친절한 상담", "약속을 잘 지켜요"], carIndex: 2, reply: "믿고 방문해 주셔서 감사합니다. 궁금한 점은 언제든 편하게 연락 주세요.", replyDate: "2개월 전" },
  { id: 4, name: "이서연", role: "buyer", score: 4, date: "3개월 전", body: "가격과 이전 절차를 투명하게 알려주셔서 편하게 거래했습니다.", tags: ["가격이 합리적이에요", "믿을 수 있어요"], carIndex: 3 },
  { id: 5, name: "드림카찾기", role: "buyer", score: 5, date: "4개월 전", body: "멀리서 방문했는데 차량을 미리 준비해 주셔서 바로 확인할 수 있었습니다.", tags: ["친절한 상담", "차량 상태가 설명과 같아요"], carIndex: 4 },
  { id: 6, name: "최현우", role: "buyer", score: 5, date: "5개월 전", body: "상담부터 출고까지 진행이 빠르고 설명도 정확했습니다.", tags: ["믿을 수 있어요"], carIndex: 0, reply: "좋은 차량을 함께 찾아드릴 수 있어 기쁩니다. 감사합니다.", replyDate: "5개월 전" },
  { id: 7, name: "서울드라이버", role: "buyer", score: 5, date: "6개월 전", body: "시승할 때 장단점을 솔직하게 알려주셔서 선택에 도움이 됐습니다.", tags: ["친절한 상담", "차량 품질이 좋아요"], carIndex: 1 },
  { id: 8, name: "정우성", role: "buyer", score: 5, date: "7개월 전", tags: ["믿을 수 있어요"], carIndex: 2 },
  { id: 9, name: "카라이프", role: "buyer", score: 5, date: "8개월 전", body: "필요한 서류와 보험 절차까지 차분하게 안내받았습니다.", tags: ["친절한 상담"], carIndex: 3 },
  { id: 10, name: "윤지호", role: "buyer", score: 5, date: "9개월 전", tags: [], carIndex: 4 },
  { id: 11, name: "패밀리카", role: "buyer", score: 5, date: "10개월 전", body: "가족이 탈 차라 꼼꼼히 확인했는데 관리 상태가 좋았습니다.", tags: ["차량 품질이 좋아요", "차량 상태가 설명과 같아요"], carIndex: 0 },
  { id: 12, name: "로드트립", role: "buyer", score: 4, date: "11개월 전", tags: ["친절한 상담"], carIndex: 1 },
  { id: 13, name: "강민호", role: "buyer", score: 5, date: "1년 전", body: "과장 없이 필요한 내용만 설명해 주셔서 믿음이 갔습니다.", tags: [], carIndex: 2 },
  { id: 14, name: "주말오너", role: "buyer", score: 5, date: "1년 전", tags: [], carIndex: 3 },
  { id: 15, name: "모터로그", role: "buyer", score: 5, date: "1년 전", body: "차량 인도 뒤에도 궁금한 점을 바로 답변해 주셨습니다.", tags: [], carIndex: 4 },
  { id: 16, name: "윤서진", role: "buyer", score: 5, date: "1년 전", tags: [], carIndex: 0 },
  { id: 17, name: "스피드모터스", role: "seller", score: 5, date: "3개월 전", body: "응대가 빠르고 거래 조건을 명확하게 조율해 주셨습니다.", tags: ["친절한 상담", "믿을 수 있어요"], carIndex: 1 },
];

const SOCIAL_CHANNELS = [
  { id: "facebook", label: "페이스북", description: "판매 소식", href: "https://www.facebook.com/search/top?q=%ED%88%AC%EC%A0%9C%EC%9D%B4%EB%AA%A8%ED%84%B0%EC%9B%8D%EC%8A%A4" },
  { id: "youtube", label: "유튜브", description: "차량 영상", href: "https://www.youtube.com/results?search_query=%ED%88%AC%EC%A0%9C%EC%9D%B4%EB%AA%A8%ED%84%B0%EC%9B%8D%EC%8A%A4" },
  { id: "instagram", label: "인스타그램", description: "신규 매물", href: "https://www.instagram.com/explore/tags/%ED%88%AC%EC%A0%9C%EC%9D%B4%EB%AA%A8%ED%84%B0%EC%9B%8D%EC%8A%A4/" },
  { id: "tiktok", label: "틱톡", description: "숏폼 영상", href: "https://www.tiktok.com/search?q=%ED%88%AC%EC%A0%9C%EC%9D%B4%EB%AA%A8%ED%84%B0%EC%9B%8D%EC%8A%A4" },
] as const;

const DEALER_HERO_POSTER = asset("seoul-auto-gallery/header/building-bluehour-v01.png");

// e-조이모터스 헤더: 각 브랜드 공식 홈페이지의 양산 모델 가로형 영상 CDN.
// 배너가 약 3.2:1이므로 세로형 모바일 소스보다 가로 원본이 차량 실루엣을 안정적으로 유지한다.
const JOY_HERO_VIDEOS = [
  {
    brand: "Ferrari",
    model: "12Cilindri",
    src: "https://ferrari-cdn.thron.com/delivery/public/video/ferrari/00a07e31-f626-4ef7-86cc-0226c7d5d30d/bocxuw/WEBFULLHD/urxmo7_ferrari-12cilindri-off",
    poster: "https://ferrari-cdn.thron.com/delivery/public/thumbnail/ferrari/00a07e31-f626-4ef7-86cc-0226c7d5d30d/bocxuw/std/1280x720/urxmo7_ferrari-12cilindri-off",
  },
  {
    brand: "Lamborghini",
    model: "Revuelto SV",
    src: "https://videolamborghini-meride-tv.akamaized.net/video/folder2/1786627119hero_lamborghini.mp4",
    poster: "https://medialamborghini-meride-tv.akamaized.net/meride/lamborghini/video/images/folder1/2846/1786627119hero.jpg",
  },
] as const;

function Icon({ name, className }: { name: string; className?: string }) {
  return <img className={`dp-icon${className ? ` ${className}` : ""}`} src={icon(name)} alt="" aria-hidden="true" draggable={false} />;
}

const SAG_MAIN_PHONE = "02-2059-5000"; // 서울오토갤러리 공식 일반문의(사이트 하단). 상사 대표 전화가 0000(미기재)인 22곳에 쓴다.

function DealerIcon({ name, className }: { name: string; className?: string }) {
  return <img className={`dp-icon dp-dealer-icon${className ? ` ${className}` : ""}`} src={dealerIcon(name)} alt="" aria-hidden="true" draggable={false} />;
}

function Stars({ score }: { score: number }) {
  const filled = Math.round(score);
  const star = `url(${icon("chotot-list-detail-review-star.svg")})`;
  return <span className="dp-stars" aria-label={`별점 ${score.toFixed(1)}점`}>
    {Array.from({ length: 5 }, (_, index) => <span key={index} className={`dp-star${index < filled ? " is-on" : ""}`} style={{ maskImage: star, WebkitMaskImage: star }} />)}
  </span>;
}

function SiteHeader() {
  return <header className="dp-site-header">
    <div className="dp-mobile-channel-head">
      <button type="button" aria-label="뒤로가기" onClick={() => window.history.back()}><img src={asset("detail/back.svg")} alt="" aria-hidden="true" /></button>
      <strong className="dp-mobile-channel-name">{stripCorp(MOCK.company)}</strong>
      <div>
        <ListingLanguageSelect compact />
        <button type="button" aria-label="판매자 매물 검색"><Icon name="chotot-common-search-thin-line.svg" /></button>
        <button type="button" aria-label="판매자 메뉴"><Icon name="chotot-common-menu.svg" /></button>
      </div>
    </div>
    <div className="dp-site-main">
      <button type="button" className="dp-site-menu" aria-label="전체 메뉴"><Icon name="chotot-common-menu.svg" /></button>
      <a className="dp-wordmark" href="./" aria-label="보배드림 홈">
        <span className="dp-wordmark-mark"><img src={bobaeAsset("9546-imgGroup.svg")} alt="" /></span>
        <img src={bobaeAsset("9546-imgLogo.svg")} alt="보배드림" />
      </a>
      <button type="button" className="dp-region"><Icon name="chotot-common-location-pin.svg" />전국 <Icon name="chotot-pc-detail-chevron-down-white-bg.svg" /></button>
      <div className="dp-search-country">
        <ListingLanguageSelect compact />
        <label className="dp-search"><Icon name="chotot-pc-detail-search-magnifier-gray.svg" /><input aria-label="차량 검색" placeholder="차량을 검색해 보세요" /></label>
      </div>
      <div className="dp-site-actions">
        <button type="button" aria-label="관심 차량"><Icon name="chotot-common-favorite.svg" /></button>
        <button type="button" aria-label="채팅"><Icon name="chotot-common-chat.svg" /></button>
        <button type="button" className="dp-login">로그인</button>
        <button type="button" className="dp-register">내차팔기</button>
      </div>
      <button type="button" className="dp-open-app">앱 열기</button>
    </div>
    <div className="dp-mobile-search">
      <label><Icon name="chotot-pc-detail-search-magnifier-gray.svg" /><input aria-label="차량 검색" placeholder="차량을 검색해 보세요" /></label>
      <button type="button" aria-label="관심 차량"><Icon name="chotot-common-favorite.svg" /></button>
      <button type="button" aria-label="채팅"><Icon name="chotot-common-chat.svg" /></button>
    </div>
  </header>;
}

// 딜러·상사 인스타그램·유튜브 링크(2026-10-21): 인스타그램 프로필 소개 아래 링크 줄처럼 아이콘 + 짧은 주소.
function DealerSnsList({ sns, pc = false }: { sns: NonNullable<ReturnType<typeof dealerSnsLinks>>; pc?: boolean }) {
  return <ul className={`dp-profile-sns${pc ? " is-pc" : ""}`} aria-label={sns.shop ? "상사 SNS" : "딜러 SNS"}>
    {sns.links.instagram ? <li><a href={sns.links.instagram} target="_blank" rel="noreferrer"><img src={dealerIcon("instagram")} alt="" aria-hidden="true" />{snsLabel(sns.links.instagram)}</a></li> : null}
    {sns.links.youtube ? <li><a href={sns.links.youtube} target="_blank" rel="noreferrer"><img src={dealerIcon("youtube")} alt="" aria-hidden="true" />{snsLabel(sns.links.youtube)}</a></li> : null}
    {sns.shop ? <li className="is-note">상사 공식 계정</li> : null}
  </ul>;
}

function DealerCoverMedia({ fallback, alt }: { fallback: string; alt: string }) {
  const [activeVideo, setActiveVideo] = useState(0);
  const [failedVideo, setFailedVideo] = useState<number | null>(null);
  const [paused, setPaused] = useState(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const videoRef = useRef<HTMLVideoElement>(null);
  const current = JOY_HERO_VIDEOS[activeVideo];

  const showVideo = failedVideo !== activeVideo;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo) return;
    if (paused) {
      video.pause();
      return;
    }
    void video.play().catch(() => setPaused(true));
  }, [activeVideo, paused, showVideo]);

  const changeVideo = (index: number) => {
    setActiveVideo(index);
    setFailedVideo(null);
  };
  const togglePlayback = () => {
    const video = videoRef.current;
    if (!video || !showVideo) return;
    if (paused) {
      void video.play().then(() => setPaused(false)).catch(() => setPaused(true));
    } else {
      video.pause();
      setPaused(true);
    }
  };

  return <>
    <img className="dp-cover-photo" src={fallback} alt={alt} draggable={false} />
    {showVideo ? <video
      key={current.brand}
      ref={videoRef}
      className="dp-cover-video"
      src={current.src}
      poster={current.poster}
      autoPlay={!paused}
      muted
      playsInline
      preload="metadata"
      tabIndex={-1}
      aria-hidden="true"
      disablePictureInPicture
      onEnded={() => changeVideo((activeVideo + 1) % JOY_HERO_VIDEOS.length)}
      onError={() => setFailedVideo(activeVideo)}
    /> : null}
    <div className="dp-cover-dots" role="group" aria-label="헤더 영상 선택">
      {JOY_HERO_VIDEOS.map((video, index) => <button
        key={video.brand}
        type="button"
        className={index === activeVideo ? "is-active" : undefined}
        aria-label={`${video.brand} ${video.model} 공식 영상 보기`}
        aria-pressed={index === activeVideo}
        onClick={() => changeVideo(index)}
      />)}
    </div>
    <button type="button" className="dp-cover-playback" aria-label={paused ? "헤더 영상 재생" : "헤더 영상 일시정지"} aria-pressed={paused} onClick={togglePlayback} disabled={!showVideo}>
      {paused ? <PlayIcon /> : <PauseIcon />}
    </button>
  </>;
}

function DealerProfile({ dealer, cars, following, setFollowing, notify, onValuation, rating = MOCK.rating, reviewCount = MOCK.reviewCount }: { dealer: SeoulAutoGalleryDealer; cars: Car[]; following: boolean; setFollowing: (value: boolean) => void; notify: (message: string) => void; onValuation: () => void; rating?: number; reviewCount?: number }) {
  const [bioExpanded, setBioExpanded] = useState(false);
  const listingCount = cars.length;
  const bioPreview = `${MOCK.intro.slice(0, 46).trimEnd()}…`;
  const sns = dealerSnsLinks(dealer.shopNo, dealer.name);

  return <section className="dp-profile">
    <div className="dp-cover">
      {dealer.shopNo === JOY_SHOP_NO
        ? <DealerCoverMedia fallback={MOCK.coverImage ?? DEALER_HERO_POSTER} alt={MOCK.coverImage ? `${stripCorp(MOCK.company)} 전시 차량` : "서울오토갤러리 전경"} />
        : <img className="dp-cover-photo" src={MOCK.coverImage ?? DEALER_HERO_POSTER} alt={MOCK.coverImage ? `${stripCorp(MOCK.company)} 전시 차량` : "서울오토갤러리 전경"} draggable={false} />}
      <div className="dp-cover-brand-copy">
        <strong>{stripCorp(MOCK.company)}</strong>
        <span>수입차 전문 매매</span>
        <small>수입차 판매·구매 상담은 언제든 문의하세요.</small>
      </div>
      <button type="button" className="dp-cover-more" aria-label="판매자 메뉴"><Icon name="chotot-common-more.svg" /></button>
    </div>
    <div className="dp-profile-body">
      <img className="dp-avatar" src={dealerPhoto(dealer)} alt={`${dealer.name} 프로필`} draggable={false} />
      <div className="dp-profile-copy">
        <h1>{dealer.name}<Icon name="chotot-list-detail-verified-dealer-wavy-badge.svg" className="is-badge" /></h1>
        <div className="dp-profile-stats dp-profile-stats-mobile" aria-label="판매 실적">
          <span><small>판매중</small><b>{listingCount.toLocaleString("ko-KR")}</b></span>
          <span><small>판매완료</small><b>{MOCK.sold.toLocaleString("ko-KR")}</b></span>
          <span><small>팔로워</small><b>{(MOCK.followers + (following ? 1 : 0)).toLocaleString("ko-KR")}</b></span>
        </div>
        <div className="dp-profile-bio">
          <b>{MOCK.company} · {dealer.role ?? "인증딜러"}</b>
          <p>
            <span>{bioExpanded ? MOCK.intro : bioPreview}</span>{" "}
            <button type="button" aria-expanded={bioExpanded} onClick={() => setBioExpanded((expanded) => !expanded)}>{bioExpanded ? "접기" : "더 보기"}</button>
          </p>
          {sns ? <DealerSnsList sns={sns} /> : null}
        </div>
        <div className="dp-profile-actions has-card">
          <button type="button" className="is-follow" aria-pressed={following} onClick={() => setFollowing(!following)}><Icon name={following ? "chotot-listing-register-check-mark.svg" : "chotot-list-detail-follow.svg"} />{following ? "팔로우 중" : "팔로우"}</button>
          <button type="button" onClick={() => notify(`${dealer.name} 딜러와 채팅을 시작할 수 있어요`)}><Icon name="chotot-list-detail-chat.svg" />채팅</button>
          {MOCK.phone ? <a href={`tel:${MOCK.phone.replaceAll("-", "")}`} aria-label={`${dealer.name} 딜러에게 전화하기`}><DealerIcon name="phone" />전화</a> : <button type="button" onClick={() => notify(`${stripCorp(MOCK.company)}은 등록된 연락처가 없어요. 채팅으로 문의해 주세요`)}><DealerIcon name="phone" />전화</button>}
          <DealerBusinessCard shop={dealer.shopNo} emp={dealer.empNo} contact={{ name: dealer.name, role: dealer.role ?? "딜러", company: MOCK.company, gallery: MOCK.gallery, phone: MOCK.phone, address: MOCK.address, photo: dealerPhoto(dealer), listingCount }} trigger={<button type="button" className="is-card" aria-label={`${dealer.name} 딜러 명함 보기·공유`}><DealerIcon name="business-card-as24-143" />명함</button>} />
        </div>
        <div className="dp-profile-inline is-first"><DealerIcon name="clock" />{MOCK.lastActive}<i /><b>{rating.toFixed(1)}</b><Stars score={rating} /><u>리뷰 {reviewCount}</u></div>
        <div className="dp-profile-inline is-mobile-rating"><b>{rating.toFixed(1)}</b><Stars score={rating} /><u>리뷰 {reviewCount}</u></div>
        <div className="dp-profile-career-meta">
          <div className="dp-profile-inline is-career"><DealerIcon name="dealership" />{MOCK.joined}</div>
        </div>
        {MOCK.phone ? <div className="dp-profile-inline is-phone"><DealerIcon name="phone" /><a href={`tel:${MOCK.phone.replaceAll("-", "")}`}>{MOCK.phone}</a>{MOCK.phoneIsGallery ? <span className="dp-phone-note">서울오토갤러리 대표</span> : null}</div> : null}
        <div className="dp-profile-inline is-location"><Icon name="chotot-profile-location.svg" /><span>{MOCK.address}</span></div>
        <div className="dp-profile-inline is-dealership"><DealerIcon name="complex-home-as24" /><span>{MOCK.gallery}<i>·</i><b>{MOCK.company}</b></span>{MOCK.homepage ? <a className="dp-profile-homepage" href={MOCK.homepage} target="_blank" rel="noreferrer"><span className="dp-profile-homepage-icon" aria-hidden="true"><ExternalLinkIcon /></span>{MOCK.homepageLabel ?? MOCK.homepage}</a> : null}</div>
        {sns ? <DealerSnsList sns={sns} pc /> : null}
        <SellPriceCta onRequest={onValuation} profile />
        <div className="dp-profile-stats dp-profile-stats-desktop" aria-label="판매 실적">
          <span><small>판매중</small><b>{listingCount}</b></span>
          <span><small>판매완료</small><b>{MOCK.sold}</b></span>
          <span><small>팔로워</small><b>{MOCK.followers + (following ? 1 : 0)}</b></span>
        </div>
      </div>
    </div>
  </section>;
}

type DealerListView = "list" | "feed";
function ActiveCards({ cars, limit, onOpen, view = "list" }: { cars: Car[]; limit: number; onOpen: (car: Car) => void; view?: DealerListView }) {
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [desktop, setDesktop] = useState(() => window.matchMedia("(min-width: 820px)").matches);
  useEffect(() => {
    const media = window.matchMedia("(min-width: 820px)");
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  const toggleLiked = (id: number) => setLiked((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
  // 피드 보기: 목록 화면의 모바일 피드 카드(큰 사진 · 넘기기)를 그대로 쓴다. PC도 같은 카드를 가운데 한 열로
  const feed = view === "feed";
  return <div className={`dp-listings-shell marketplace ${desktop && !feed ? "is-bbm" : "is-bbm-m is-qf-guazi"}${feed ? " is-dp-feed" : ""}`}>
    <div className={`bbm-m-list${feed ? " is-feed" : ""}`}>{cars.slice(0, limit).map((car, index) => <BbmResultCard
      key={car.id}
      car={car}
      variant={desktop && !feed ? "pc" : "mobile"}
      featured={feed}
      eagerPhoto={index < 4}
      feedPhotos={feed ? (car.photoList?.length ? car.photoList : [car.image]) : undefined}
      liked={liked.has(car.id)}
      onToggleLike={() => toggleLiked(car.id)}
      onOpen={() => onOpen(car)}
      onChat={() => undefined}
    />)}</div>
  </div>;
}

function SoldCards({ limit }: { limit: number }) {
  return <div className="dp-sold-grid">{MOCK.soldCars.slice(0, limit).map(([title, time]) => (
    <article className="dp-sold-card" key={title}>
      <span><i />판매완료</span>
      <h3>{title}</h3>
      <time>{time}</time>
    </article>
  ))}</div>;
}

// 커뮤니티 임베드(public/community/community-embed.js)와 같은 방식: 인스타 겉틀(본문·반응 줄)을 잘라
// 사진 게시물은 계정 줄 + 사진만, 릴스는 9:16 영상만 우리 SNS 카드 안에 보여 준다(2026-10-21 「우리 임베드 인스타 기능, 우리 화면에서」).
// 인스타가 보내는 높이 신호(MEASURE)로 사진 게시물 칸 높이를 맞춘다(판매차량 · 커뮤니티 피드 공용, 한 번만 등록).
if (typeof window !== "undefined" && !(window as unknown as { __dpIgMeasure?: boolean }).__dpIgMeasure) {
  (window as unknown as { __dpIgMeasure?: boolean }).__dpIgMeasure = true;
  window.addEventListener("message", (event: MessageEvent) => {
    let host = "";
    try { host = new URL(event.origin).hostname; } catch { return; }
    if (!/(^|\.)instagram\.com$/.test(host)) return;
    let data = event.data;
    try { if (typeof data === "string") data = JSON.parse(data); } catch { return; }
    const height = data && data.type === "MEASURE" && data.details ? Number(data.details.height) : 0;
    if (!(height > 50)) return;
    document.querySelectorAll<HTMLIFrameElement>(".dp-ig-crop iframe").forEach((frame) => {
      if (frame.contentWindow !== event.source) return;
      frame.parentElement?.style.setProperty("--crop-h", `${Math.max(120, Math.ceil(height) - 154)}px`);
    });
  });
}

const igHref = (post: DealerInstagramPost) => `https://www.instagram.com/${post.kind === "reel" ? "reel" : "p"}/${post.code}/`;
function IgMedia({ post }: { post: DealerInstagramPost }) {
  const href = igHref(post);
  return post.kind === "reel"
    ? <div className="dp-ig-reel"><iframe src={`${href}embed/`} title={`인스타그램 릴스 ${post.date}`} loading="lazy" scrolling="no" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups allow-presentation" /></div>
    : <div className="dp-ig-crop"><iframe src={`${href}embed/`} title={`인스타그램 게시물 ${post.date}`} loading="lazy" scrolling="no" allow="encrypted-media; picture-in-picture" sandbox="allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation allow-same-origin allow-scripts" /></div>;
}
const igDateText = (date: string) => { const [y, m, d] = date.split("-"); return `${Number(y) % 100}.${m}.${d}`; };

function InstagramEmbeds({ posts, limit, handle }: { posts: readonly DealerInstagramPost[]; limit: number; handle: string }) {
  return <div className="dp-social-feed-list dp-ig-embeds">
    {posts.slice(0, limit).map((post) => {
      const href = igHref(post);
      const label = post.kind === "reel" ? "릴스" : "게시물";
      return <article className="dp-social-post dp-ig-post" key={post.code}>
        <header>
          <DealerIcon name="instagram" />
          <span><b>인스타그램 {label}</b><small>@{handle} · {igDateText(post.date)}</small></span>
          <a href={href} target="_blank" rel="noreferrer" aria-label={`인스타그램 ${label} 원문 보기`}><ExternalLinkIcon aria-hidden="true" /></a>
        </header>
        <IgMedia post={post} />
        <footer><span>판매 문의는 채팅·전화로</span><a href={href} target="_blank" rel="noreferrer">원문 보기 <ExternalLinkIcon aria-hidden="true" /></a></footer>
      </article>;
    })}
  </div>;
}

function ListingsSection({ cars, mode, setMode, onOpen, categories, toggleCategory, igPosts = [], igHandle = "", view = "list", setView }: { view?: DealerListView; setView?: (view: DealerListView) => void; cars: Car[]; mode: ListingMode; setMode: (mode: ListingMode) => void; onOpen: (car: Car) => void; categories: readonly StockCategory[]; toggleCategory: (category: StockCategory) => void; igPosts?: readonly DealerInstagramPost[]; igHandle?: string }) {
  const [limit, setLimit] = useState(5);
  const filteredCars = cars.filter((car) => matchesStockCategories(car, categories));
  const categoryLabel = categories.length ? categories.join(" · ") : "전체";
  const snsCount = igPosts.length || SNS_LISTING_COUNT;
  const max = mode === "active" ? filteredCars.length : mode === "sold" ? MOCK.soldCars.length : snsCount;
  return <section className="dp-content-card dp-listings">
    <div className="dp-listing-modes" role="tablist" aria-label="판매 상태">
      <button type="button" role="tab" aria-selected={mode === "active"} onClick={() => { setMode("active"); setLimit(5); }}>판매중 ({cars.length})</button>
      <button type="button" role="tab" aria-selected={mode === "sold"} onClick={() => { setMode("sold"); setLimit(5); }}>판매완료 ({MOCK.sold})</button>
      <button type="button" role="tab" aria-selected={mode === "sns"} onClick={() => { setMode("sns"); setLimit(5); }}>SNS 판매 차량 ({snsCount})</button>
    </div>
    {mode === "active" ? <><div className="dp-stock-categories" role="group" aria-label="판매차량 분류">{stockCategories.map((item) => { const selected = categories.includes(item); return <button key={item} type="button" aria-pressed={selected} onClick={() => { toggleCategory(item); setLimit(5); }}>{item}<span className="dp-stock-category-count">{cars.filter((car) => matchesStockCategory(car, item)).length}</span>{selected ? <Cross2Icon aria-hidden="true" /> : null}</button>; })}</div><div className="dp-view-row"><div className="dp-view-toggle" role="group" aria-label="보기 방식">{([["list", "목록 보기"], ["feed", "피드 보기"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={view === id} onClick={() => setView?.(id)}>{label}</button>)}</div></div>{filteredCars.length ? <ActiveCards cars={filteredCars} limit={limit} onOpen={onOpen} view={view} /> : <p className="dp-listings-empty">지금 판매 중인 {categoryLabel} 차량이 없어요. 새 차량이 등록되면 이곳에 보여드릴게요.</p>}</> : mode === "sold" ? <SoldCards limit={limit} /> : igPosts.length ? <InstagramEmbeds posts={igPosts} limit={limit} handle={igHandle} /> : <SocialFeedSection cars={cars} limit={SNS_LISTING_COUNT} embedded />}
    {limit < max ? <button type="button" className="dp-more" onClick={() => setLimit((value) => Math.min(value + 5, max))}>매물 더보기</button> : null}
  </section>;
}

// 판매차량 탭 위 슈퍼카 브랜드 로고 줄(2026-10-21 「판매차량 위 구분선에 우리 슈퍼카 로고 카드들 배치하자」).
// 슈퍼카·럭셔리카 카테고리와 같은 오토홈 로고 16개 · 같은 칸(모바일 76×102 · PC 84×102). 누르면 그 브랜드 판매차량만, 다시 누르면 해제. 0대는 흐리게.
// 페라리를 고르면 로고 줄 아래에 우리 페라리 모델 이미지 줄(2026-10-21 「페라리 다음에 우리 모델 이미지 나오게해라」).
// 이미지·이름·순서는 차량 기준표(cars-index-v1)의 페라리 모델그룹 18개, 3/4 카탈로그 컷(ferrari-models/angle). 0대는 흐리게.
const ferrariModelCards: Array<[string, string, string[]]> = [
  ["12 칠린드리", "12cilindri", ["12칠린드리", "12cilindri"]], ["296", "296", ["296"]], ["360", "360", ["360"]], ["458", "458", ["458"]], ["488", "488", ["488"]], ["599", "599", ["599"]], ["812", "812", ["812"]],
  ["F12 베를리네타", "f12", ["f12"]], ["F355", "f355", ["f355"]], ["F430", "f430", ["f430"]], ["F8", "f8", ["f8"]], ["FF", "ff", ["ff"]], ["GTC4 루쏘", "gtc4lusso", ["gtc4"]], ["SF90", "sf90", ["sf90"]],
  ["로마", "roma", ["로마", "roma"]], ["캘리포니아", "california", ["캘리포니아", "california"]], ["포르토피노", "portofino", ["포르토피노", "portofino"]], ["푸로산게", "purosangue", ["푸로산게", "purosangue"]],
];
const modelKey = (value: string) => value.replace(/[\s-]/g, "").toLowerCase();
function dealerFerrariModelOf(car: Car) {
  const text = modelKey(car.modelGroup || car.title.replace(/^페라리\s*/, ""));
  return ferrariModelCards.find(([, , keys]) => keys.some((key) => text.startsWith(key)))?.[0] ?? "";
}
function DealerModelRail({ cars, model, onPick }: { cars: Car[]; model: string; onPick: (model: string) => void }) {
  const counts = new Map<string, number>();
  cars.forEach((car) => { const name = dealerFerrariModelOf(car); if (name) counts.set(name, (counts.get(name) ?? 0) + 1); });
  return <div className="dp-brand-rail-track dp-model-rail" role="group" aria-label="페라리 모델로 판매차량 보기">
    {ferrariModelCards.map(([name, slug]) => {
      const count = counts.get(name) ?? 0;
      return <button type="button" key={name} className={`${model === name ? "is-active" : ""}${count ? "" : " is-empty"}`} aria-pressed={model === name} aria-label={`페라리 ${name} ${count}대`} onClick={() => onPick(name)}>
        <span className="dp-model-rail-image"><img src={asset(["quickfilter", "car", "ferrari-models", "angle", `ferrari_${slug}_angle_v01.png`].join("/"))} alt="" draggable={false} loading="lazy" /></span>
        <span className="dp-brand-rail-name">{name}</span>
        <span className="dp-brand-rail-count">({count})</span>
      </button>;
    })}
  </div>;
}

function DealerBrandRail({ cars, brand, onPick, model, onPickModel }: { cars: Car[]; brand: string; onPick: (maker: string) => void; model: string; onPickModel: (model: string) => void }) {
  const source = luxuryLogoSource();
  const counts = new Map<string, number>();
  cars.forEach((car) => counts.set(car.maker, (counts.get(car.maker) ?? 0) + 1));
  return <nav className="dp-brand-rail" aria-label="브랜드로 판매차량 보기">
    <div className="dp-brand-rail-track">
      {luxuryLogoBrands.map((item, index) => {
        const count = counts.get(item.maker) ?? 0;
        return <button type="button" key={item.maker} className={`${brand === item.maker ? "is-active" : ""}${count ? "" : " is-empty"}`} aria-pressed={brand === item.maker} aria-label={`${item.maker} ${count}대`} onClick={() => onPick(item.maker)}>
          <span className="dp-brand-rail-logo"><img src={asset(luxuryLogoPath(source, index))} alt="" draggable={false} /></span>
          <span className="dp-brand-rail-name">{item.maker}</span>
          <span className="dp-brand-rail-count">({count})</span>
        </button>;
      })}
    </div>
    {brand === "페라리" ? <DealerModelRail cars={cars.filter((car) => car.maker === "페라리")} model={model} onPick={onPickModel} /> : null}
  </nav>;
}

function AnchorNav({ active, onChange }: { active: SectionId; onChange: (section: SectionId) => void }) {
  const items: Array<[SectionId, string]> = [["home", "홈"], ["ads", "판매차량"], ["community", "커뮤니티"], ["dealers", "소속딜러"], ["valuation", "내차견적"], ["reviews", "리뷰"], ["intro", "소개"]];
  return <nav className="dp-anchor-nav" aria-label="딜러페이지 구역" role="tablist">{items.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={active === id} className={`${active === id ? "is-active" : ""}${id === "valuation" ? " is-valuation" : ""}`} onClick={() => onChange(id)}>{label}</button>)}</nav>;
}

function HomeSection() {
  return <section className="dp-content-card dp-home-pending" aria-labelledby="dp-home-title">
    <h2 id="dp-home-title">홈</h2>
    <p>판매자 홈 구성은 다음 단계에서 준비합니다.</p>
  </section>;
}

// 판매자페이지 커뮤니티 = 우리 커뮤니티 기본 보기 「네이버 토론 피드」와 같은 카드(2026-10-21 「판매자페이지 커뮤니티 네이버 토론 피드로」).
// 분류 칩 → 프사 24 · 작성자 · 시간 → 제목 → 본문 3줄 → 사진 → 버프·너프·댓글 · 조회. 글·반응 수는 화면 확인용 가상 값이다.
// 배포 빌드가 코드 안의 "/assets/" 문자열을 다시 고쳐 쓰므로 경로를 조각으로 이어 붙인다(2026-10-21 아이콘 깨짐 수정).
const communityIcon = (name: string) => ["community", "assets", "chzzk-detail", "icons", `${name}.svg`].join("/");
// 딜러 커뮤니티 말머리(2026-10-21 「말머리 딜러에 맞게 추가」).
const noticePinStyle = { "--pin": `url("${dealerIcon("pin-reddit")}")` } as CSSProperties;
const dealerCommunityTags = ["전체", "공지", "입고 소식", "출고 후기", "관리 팁", "시세 정보", "SNS", "딜러 구인", "이벤트"] as const;
type DealerCommunityTag = (typeof dealerCommunityTags)[number];

function CommunitySection({ cars, dealer, notify }: { cars: Car[]; dealer: SeoulAutoGalleryDealer; notify: (message: string) => void }) {
  const company = stripCorp(MOCK.company);
  const [tag, setTag] = useState<DealerCommunityTag>("전체");
  const pick = (index: number) => cars.length ? cars[index % cars.length] : undefined;
  const allPosts: { category: Exclude<DealerCommunityTag, "전체">; title: string; copy: string; author: string; byDealer: boolean; photo?: string; time: string; views: number; comments: number; up: number; down: number; car?: Car; ig?: DealerInstagramPost }[] = [
    { category: "공지", photo: MOCK.coverImage ?? asset("seoul-auto-gallery/header/building-bluehour-v01.png"), title: "방문 상담 예약 안내", copy: "주말에는 상담이 몰려 대기 시간이 길어질 수 있습니다. 방문 전 채팅이나 전화로 시간을 정해 주시면 차량을 미리 준비해 두겠습니다.", author: company, byDealer: false, time: "1시간 전", views: 302, comments: 2, up: 18, down: 0 },
    { category: "공지", title: "추석 연휴 영업 시간 안내", copy: "연휴 기간에도 전시장은 오전 10시부터 오후 6시까지 엽니다. 시승은 미리 예약해 주세요.", author: company, byDealer: false, time: "3일 전", views: 221, comments: 1, up: 9, down: 0 },
    { category: "공지", title: "차량 사진과 이력은 직접 확인합니다", copy: "올린 모든 차량은 담당 딜러가 사진과 보험 이력, 성능점검 기록을 직접 확인한 뒤 등록합니다.", author: company, byDealer: false, time: "1주 전", views: 488, comments: 5, up: 41, down: 0 },
    { category: "입고 소식", title: `${pick(0)?.title ?? "새 차량"} 입고`, copy: "관리 상태와 주요 옵션을 직접 확인했습니다. 실내·외 사진을 함께 올려 두었으니 방문 전 궁금한 점을 댓글로 남겨 주세요.", author: dealer.name, byDealer: true, time: "2시간 전", views: 128, comments: 6, up: 14, down: 0, car: pick(0) },
    { category: "출고 후기", title: "멀리서 방문해 주신 고객님 출고 후기", copy: "차량 이력과 상품화 과정을 함께 확인하고 안전하게 출고를 마쳤습니다. 먼 길 와 주셔서 감사합니다.", author: dealer.name, byDealer: true, time: "1일 전", views: 193, comments: 4, up: 21, down: 0, car: pick(1) },
    { category: "관리 팁", title: "수입차 장기 보관 전 확인할 세 가지", copy: "배터리와 타이어 공기압, 실내 습도만 점검해도 차량 컨디션을 오래 유지할 수 있습니다. 겨울철에는 배터리 충전 상태를 한 번 더 확인해 주세요.", author: dealer.name, byDealer: true, time: "2일 전", views: 246, comments: 11, up: 32, down: 1 },
    { category: "시세 정보", title: "요즘 수입 SUV 시세, 상담하면서 느낀 점", copy: "연식 3~4년 차 수입 SUV는 주행거리보다 사고 이력과 보증 잔여 기간이 가격 차이를 더 크게 만듭니다. 비교하실 때 참고해 주세요.", author: dealer.name, byDealer: true, time: "4일 전", views: 412, comments: 17, up: 45, down: 3, car: pick(2) },
    { category: "SNS", title: "인스타그램에 올린 출고 영상 반응이 좋아요", copy: "어제 올린 실내·외 워크어라운드 영상에 문의가 많았습니다. 영상 속 차량은 판매차량 탭의 SNS 판매 차량에서도 볼 수 있어요.", author: dealer.name, byDealer: true, time: "5일 전", views: 154, comments: 4, up: 19, down: 0, car: pick(3) },
    { category: "딜러 구인", title: "함께 일할 딜러를 찾습니다", copy: "수입차 상담 경험이 있는 분이면 좋습니다. 상사 사무실과 전시 공간을 함께 씁니다. 관심 있는 분은 채팅으로 연락 주세요.", author: company, byDealer: false, time: "1주 전", views: 98, comments: 2, up: 7, down: 0 },
    { category: "이벤트", title: "이달 출고 고객 실내 클리닝 무료", copy: "이번 달 계약 후 출고하시는 고객님께 실내 클리닝을 무료로 해 드립니다. 자세한 조건은 상담 때 안내해 드릴게요.", author: company, byDealer: false, time: "6일 전", views: 167, comments: 3, up: 12, down: 0 },
  ];
  // 인스타 게시물이 있는 딜러는 피드에도 릴스를 그대로 띄운다(2026-10-21 「인스타 릴스 매물 임베드, 피드와 매물 두곳 다」).
  const igPosts = instagramPostsFor(dealer.shopNo, dealer.name);
  const igHandle = instagramHandleFor(dealer.shopNo, dealer.name);
  if (igPosts.length) {
    const fakeSns = allPosts.findIndex((post) => post.category === "SNS");
    const igFeed = igPosts.filter((post) => post.kind === "reel").slice(0, 4).map((post, index) => ({ category: "SNS" as const, title: index === 0 ? "인스타그램 새 릴스" : "인스타그램 릴스", copy: `@${igHandle}에 올린 매물 영상이에요. 영상 속 차량 문의는 채팅이나 전화로 주세요.`, author: dealer.name, byDealer: true, time: igDateText(post.date), views: 0, comments: 0, up: 0, down: 0, ig: post }));
    allPosts.splice(fakeSns >= 0 ? fakeSns : 1, fakeSns >= 0 ? 1 : 0);
    allPosts.splice(4, 0, ...igFeed);
  }
  const notices = allPosts.filter((post) => post.category === "공지");
  // 「전체」에서는 공지를 네이버 증권 토론 「핫글」처럼 회색 띠 안의 가로 넘김 카드로 따로 모은다(2026-10-21 「공지는 인기글처럼」).
  const posts = tag === "전체" ? allPosts.filter((post) => post.category !== "공지") : allPosts.filter((post) => post.category === tag);
  const [noticeIndex, setNoticeIndex] = useState(0);
  const noticeTrack = useRef<HTMLDivElement>(null);
  const onNoticeScroll = () => {
    const el = noticeTrack.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const pitch = card ? card.offsetWidth + 10 : el.clientWidth;
    setNoticeIndex(Math.max(0, Math.min(notices.length - 1, Math.round(el.scrollLeft / pitch))));
  };
  return <section className="dp-content-card dp-community" aria-labelledby="dp-community-title">
    <div className="dp-section-heading">
      <div><h2 id="dp-community-title">커뮤니티</h2><p>딜러가 전하는 차량 소식과 관리 정보입니다.</p></div>
      <button type="button" onClick={() => notify("커뮤니티 글쓰기를 준비 중이에요")}>글쓰기</button>
    </div>
    <div className="dp-discussion-tags" role="tablist" aria-label="말머리">
      {dealerCommunityTags.map((item) => <button type="button" role="tab" key={item} aria-selected={tag === item} className={tag === item ? "is-active" : undefined} onClick={() => setTag(item)}>{item}</button>)}
    </div>
    {tag === "전체" && notices.length ? <section className="dp-notice-band" aria-labelledby="dp-notice-title">
      <h3 id="dp-notice-title"><i className="dp-notice-pin" aria-hidden="true" style={noticePinStyle} />공지</h3>
      <div className="dp-notice-track" ref={noticeTrack} onScroll={onNoticeScroll}>
        {notices.map((post) => <article className="dp-notice-card" key={post.title}>
          <div className="dp-notice-identity">
            <i aria-hidden="true">{company.slice(0, 1)}</i>
            <strong>{post.author}</strong>
            <time>{post.time}</time>
          </div>
          <div className={post.photo ? "dp-thumb-row has-thumb" : "dp-thumb-row"}>
            <div className="dp-thumb-text">
              <button type="button" className="dp-notice-title" onClick={() => notify(post.title)}><i className="dp-notice-pin" aria-hidden="true" style={noticePinStyle} /><span className="dp-notice-title-text">{post.title}</span></button>
              <p>{post.copy}</p>
            </div>
            {post.photo ? <span className="dp-notice-media"><img src={post.photo} alt="" loading="lazy" draggable={false} /></span> : null}
          </div>
          <div className="dp-discussion-metrics is-notice" aria-label="게시물 반응">
            <button type="button" aria-label={`버프 ${post.up}`}><img src={communityIcon("buff")} alt="" />{post.up}</button>
            <button type="button" aria-label={`너프 ${post.down}`}><img src={communityIcon("nerf")} alt="" />{post.down}</button>
            <button type="button" aria-label={`댓글 ${post.comments}개`} onClick={() => notify("댓글은 상세 화면에서 볼 수 있어요")}><img src={communityIcon("comment-reddit")} alt="" />{post.comments}</button>
            <span>조회 {post.views.toLocaleString("ko-KR")}</span>
          </div>
        </article>)}
      </div>
      {notices.length > 1 ? <div className="dp-notice-dots" aria-hidden="true">{notices.map((post, index) => <i key={post.title} className={index === noticeIndex ? "is-active" : undefined} />)}</div> : null}
    </section> : null}
    <div className="dp-discussion-list">
      {posts.length === 0 ? <p className="dp-discussion-empty">아직 이 말머리의 글이 없어요</p> : null}
      {posts.map((post) => <article className="dp-discussion-card" key={post.ig?.code ?? post.title}>
        <div className="dp-discussion-chips"><span className={post.category === "공지" ? "is-notice" : undefined}>{post.category}</span></div>
        <div className="dp-discussion-identity">
          {post.byDealer ? <img src={dealerPhoto(dealer)} alt="" aria-hidden="true" draggable={false} /> : <i aria-hidden="true">{company.slice(0, 1)}</i>}
          <strong>{post.author}</strong>
          <time>{post.time}</time>
        </div>
        <button type="button" className="dp-discussion-title" onClick={() => notify(post.title)}>{post.title}</button>
        <p className="dp-discussion-body">{post.copy}</p>
        {post.ig ? <div className="dp-discussion-ig"><IgMedia post={post.ig} /></div> : null}
        {!post.ig && post.car ? <button type="button" className="dp-discussion-media" onClick={() => notify(post.title)} aria-label={`${post.title} 사진 보기`}><img src={asset(post.car.image)} alt="" draggable={false} loading="lazy" /></button> : null}
        <div className="dp-discussion-metrics" aria-label="게시물 반응">
          <button type="button" aria-label={`버프 ${post.up}`}><img src={communityIcon("buff")} alt="" />{post.up}</button>
          <button type="button" aria-label={`너프 ${post.down}`}><img src={communityIcon("nerf")} alt="" />{post.down}</button>
          <button type="button" aria-label={`댓글 ${post.comments}개`} onClick={() => notify("댓글은 상세 화면에서 볼 수 있어요")}><img src={communityIcon("comment-reddit")} alt="" />{post.comments}</button>
          {post.ig ? <a className="dp-discussion-ig-link" href={igHref(post.ig)} target="_blank" rel="noreferrer">인스타그램에서 보기 <ExternalLinkIcon aria-hidden="true" /></a> : <span>조회 {post.views.toLocaleString("ko-KR")}</span>}
        </div>
      </article>)}
    </div>
  </section>;
}

function ValuationSection({ dealer, notify }: { dealer: SeoulAutoGalleryDealer; notify: (message: string) => void }) {
  const [plate, setPlate] = useState("");
  const [owner, setOwner] = useState("");
  const canSubmit = plate.trim().length >= 6 && owner.trim().length >= 2;
  return <section className="dp-content-card dp-valuation" aria-labelledby="dp-valuation-title">
    <div className="dp-valuation-heading">
      <span>내 차, 얼마에 팔 수 있을까요?</span>
      <h2 id="dp-valuation-title">김태규 딜러에게 시세 문의</h2>
      <p>차량번호와 소유자명을 입력하면 차량 기본정보를 확인해 상담을 시작합니다.</p>
    </div>
    <form onSubmit={(event) => { event.preventDefault(); if (canSubmit) notify(`${dealer.name} 딜러에게 시세 문의를 접수했어요`); }}>
      <label><span>차량번호</span><input value={plate} onChange={(event) => setPlate(event.target.value)} placeholder="예: 12가 3456" autoComplete="off" /></label>
      <label><span>소유자명</span><input value={owner} onChange={(event) => setOwner(event.target.value)} placeholder="차량 소유자 이름" autoComplete="name" /></label>
      <button type="submit" disabled={!canSubmit}>내 차 시세 확인하기</button>
    </form>
    <small>입력한 정보는 차량 조회 및 시세 상담 목적으로만 사용됩니다.</small>
  </section>;
}

function SocialFeedSection({ cars, limit, embedded = false }: { cars: Car[]; limit?: number; embedded?: boolean }) {
  const allPosts = [
    {
      platform: "instagram",
      label: "인스타그램",
      handle: "@twoj_motorworks",
      time: "2일 전",
      copy: "입고부터 상품화까지 직접 확인한 레인지로버 LWB입니다. 실내외 상태와 옵션을 영상으로 확인해 보세요.",
      car: cars[0],
      href: SOCIAL_CHANNELS.find((channel) => channel.id === "instagram")?.href ?? "#",
      stats: "좋아요 128 · 댓글 9",
    },
    {
      platform: "youtube",
      label: "유튜브",
      handle: "투제이모터웍스",
      time: "5일 전",
      copy: "BMW M3 xDrive 컴페티션, 실제 주행감과 관리 상태를 한 번에 소개합니다.",
      car: cars[1] ?? cars[0],
      href: SOCIAL_CHANNELS.find((channel) => channel.id === "youtube")?.href ?? "#",
      stats: "조회 1.2천회",
    },
    {
      platform: "facebook",
      label: "페이스북",
      handle: "(주)투제이모터웍스",
      time: "1주 전",
      copy: "새로 입고된 수입차 라인업을 공개합니다. 차량별 상세 상담과 방문 예약은 딜러페이지에서 가능합니다.",
      car: cars[2] ?? cars[0],
      href: SOCIAL_CHANNELS.find((channel) => channel.id === "facebook")?.href ?? "#",
      stats: "반응 46 · 공유 3",
    },
    {
      platform: "tiktok",
      label: "틱톡",
      handle: "@twoj_motorworks",
      time: "2주 전",
      copy: "출고 전 최종 점검 현장을 짧은 영상으로 담았습니다. 상담 차량의 실제 상태를 투명하게 확인해 보세요.",
      car: cars[3] ?? cars[0],
      href: SOCIAL_CHANNELS.find((channel) => channel.id === "tiktok")?.href ?? "#",
      stats: "조회 3.4천회 · 좋아요 182",
    },
  ];

  const posts = (embedded ? allPosts.filter((post) => post.car) : allPosts).slice(0, limit ?? allPosts.length);
  const list = <div className="dp-social-feed-list">
      {posts.map((post) => <article className="dp-social-post" key={`${post.platform}-${post.time}`}>
        <header>
          <DealerIcon name={post.platform} />
          <span><b>{post.label}</b><small>{post.handle} · {post.time}</small></span>
          <a href={post.href} target="_blank" rel="noreferrer" aria-label={`${post.label} 원문 보기`}><ExternalLinkIcon aria-hidden="true" /></a>
        </header>
        <p>{post.copy}</p>
        {post.car ? <a className="dp-social-media" href={post.href} target="_blank" rel="noreferrer" aria-label={`${post.label}에서 ${post.car.title} 게시물 보기`}>
          <img src={asset(post.car.listThumb ?? post.car.image)} alt={`${post.car.title} SNS 게시물`} draggable={false} />
          <span><b>{post.car.title}</b><small>{/상담/.test(String(post.car.price)) ? "가격 상담" : /만원/.test(String(post.car.price)) ? String(post.car.price).replace(/\s*만원/, "만원") : `${post.car.price}만원`}</small></span>
        </a> : null}
        <footer><span>{post.stats}</span><a href={post.href} target="_blank" rel="noreferrer">원문 보기 <ExternalLinkIcon aria-hidden="true" /></a></footer>
      </article>)}
    </div>;
  if (embedded) return <div className="dp-social-feed is-embedded">{list}</div>;
  return <section className="dp-content-card dp-social-feed" aria-labelledby="dp-social-title">
    <div className="dp-section-heading">
      <div><h2 id="dp-social-title">SNS</h2><p>판매자가 등록한 채널의 최신 게시물입니다.</p></div>
      <span>{posts.length}개 채널 게시물</span>
    </div>
    {list}
  </section>;
}

function AffiliatedDealersSection({ currentDealer, onOpenDealer }: { currentDealer: SeoulAutoGalleryDealer; onOpenDealer: (dealer: SeoulAutoGalleryDealer) => void }) {
  const staff = dealers.filter((item) => item.shopNo === currentDealer.shopNo);
  const totalListings = staff.reduce((sum, item) => sum + item.listingCount, 0);
  return <section className="dp-content-card dp-affiliated" aria-labelledby="dp-affiliated-title">
    <div className="dp-affiliated-company">
      <img src={MOCK.coverImage ?? asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt={MOCK.coverImage ? `${stripCorp(MOCK.company)} 전시 차량` : "서울오토갤러리 전경"} draggable={false} />
      <div>
        <span>{MOCK.complex}</span>
        <h2 id="dp-affiliated-title">{MOCK.company}</h2>
        <p>{MOCK.address}</p>
      </div>
    </div>
    <div className="dp-affiliated-stats" aria-label="상사 운영 정보">
      <span><b>{staff.length}명</b>등록 딜러</span>
      <span><b>{totalListings}대</b>판매중 차량</span>
      <span><b>확인</b>상사 허가</span>
    </div>
    <div className="dp-affiliated-trust"><span>사업자 확인</span><span>상사 허가 확인</span><span>실매물 운영</span></div>
    <div className="dp-affiliated-heading"><h3>소속 딜러</h3><small>딜러를 선택하면 등록 매물을 확인할 수 있습니다.</small></div>
    <div className="dp-dealer-grid">
      {staff.map((item) => <button key={`${item.shopNo}-${item.empNo}`} type="button" className="dp-dealer-card" onClick={() => onOpenDealer(item)} aria-label={`${item.name} 딜러 판매차량 ${item.listingCount}대 보기`}>
        <img src={dealerPhoto(item)} alt="" aria-hidden="true" draggable={false} />
        <span><b>{item.name}{item.name === currentDealer.name ? <em>현재</em> : null}</b><small>{item.role ?? "인증딜러"} · {stripCorp(MOCK.company)}</small>{item.employeeNo ? <small>종사원번호 {item.employeeNo}</small> : null}</span>
        <strong><span>판매차량</span><b>{item.listingCount}</b></strong>
      </button>)}
    </div>
  </section>;
}

function ReviewWriteDialog({ cars, reviews, onClose, onSubmit }: { cars: Car[]; reviews: StoreReview[]; onClose: () => void; onSubmit: (review: StoreReview) => void }) {
  const [role, setRole] = useState<Exclude<ReviewFilter, "all">>("buyer");
  const [transactionKey, setTransactionKey] = useState("");
  const [score, setScore] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [body, setBody] = useState("");
  const [verified, setVerified] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const transactionOptions = role === "buyer"
    ? cars.slice(0, 5).map((car, index) => ({ key: `buyer-${car.id}`, label: car.title, carIndex: index }))
    : TWOJ_PROFILE.soldCars.slice(0, 5).map(([title], index) => ({ key: `seller-${index}-${title}`, label: title, carIndex: index % Math.max(cars.length, 1) }));
  const selectedTransaction = transactionOptions.find((item) => item.key === transactionKey);
  const alreadyReviewed = Boolean(transactionKey && reviews.some((review) => review.transactionKey === transactionKey));
  const tagGroup = score <= 2 ? "low" : score === 3 ? "neutral" : "high";
  const tagOptions = REVIEW_TAG_OPTIONS[role][tagGroup];
  const canContinue = Boolean(selectedTransaction && score && verified && !alreadyReviewed);

  useEffect(() => {
    dialogRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const changeRole = (nextRole: Exclude<ReviewFilter, "all">) => {
    setRole(nextRole);
    setTransactionKey("");
    setScore(0);
    setTags([]);
    setConfirming(false);
  };
  const changeScore = (nextScore: number) => {
    setScore(nextScore);
    setTags([]);
    setConfirming(false);
  };
  const toggleTag = (tag: string) => setTags((current) => current.includes(tag) ? current.filter((item) => item !== tag) : current.length < 3 ? [...current, tag] : current);
  const submit = () => {
    if (!selectedTransaction || !canContinue) return;
    onSubmit({
      id: Date.now(),
      name: "보배회원",
      role,
      score,
      date: "방금 전",
      body: body.trim() || undefined,
      tags,
      carIndex: selectedTransaction.carIndex,
      transactionKey: selectedTransaction.key,
    });
  };

  return <div className="dp-review-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="dp-review-dialog" role="dialog" aria-modal="true" aria-labelledby="dp-review-write-title" tabIndex={-1} ref={dialogRef}>
      <header className="dp-review-dialog-head">
        <button type="button" onClick={onClose} aria-label="리뷰 작성 닫기">×</button>
        <div><h2 id="dp-review-write-title">리뷰 작성</h2><p>{stripCorp(MOCK.company)}와 거래한 경험을 알려주세요.</p></div>
      </header>
      {!confirming ? <div className="dp-review-form">
        <section>
          <h3>어떤 거래였나요?</h3>
          <div className="dp-review-role-options">
            <button type="button" aria-pressed={role === "buyer"} onClick={() => changeRole("buyer")}><b>차량 구매</b><span>이 판매점에서 차를 샀어요</span></button>
            <button type="button" aria-pressed={role === "seller"} onClick={() => changeRole("seller")}><b>내차 판매</b><span>이 판매점에 차를 팔았어요</span></button>
          </div>
        </section>
        <section>
          <label htmlFor="dp-review-transaction"><b>거래 차량</b><span>거래가 완료된 차량만 리뷰할 수 있어요.</span></label>
          <select id="dp-review-transaction" value={transactionKey} onChange={(event) => { setTransactionKey(event.target.value); setConfirming(false); }}>
            <option value="">거래 차량을 선택하세요</option>
            {transactionOptions.map((item) => <option key={item.key} value={item.key} disabled={reviews.some((review) => review.transactionKey === item.key)}>{item.label}{reviews.some((review) => review.transactionKey === item.key) ? " · 작성 완료" : ""}</option>)}
          </select>
          {alreadyReviewed ? <p className="dp-review-field-error" role="alert">이 거래의 리뷰는 이미 등록되었습니다.</p> : null}
        </section>
        <section className="dp-review-score-input">
          <h3>거래는 어떠셨나요?</h3>
          <div className="dp-review-score-stars" role="radiogroup" aria-label="별점 선택">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1;
              return <button type="button" key={value} role="radio" aria-checked={score === value} aria-label={`${value}점`} onClick={() => changeScore(value)}><span className={value <= score ? "is-on" : ""} style={{ maskImage: `url(${icon("chotot-list-detail-review-star.svg")})`, WebkitMaskImage: `url(${icon("chotot-list-detail-review-star.svg")})` }} /></button>;
            })}
          </div>
          <strong aria-live="polite">{score ? REVIEW_RATING_COPY[score] : "별점을 선택해 주세요"}</strong>
        </section>
        {score ? <section>
          <h3>어떤 점이 기억에 남나요? <small>최대 3개</small></h3>
          <div className="dp-review-write-tags">{tagOptions.map((tag) => <button type="button" key={tag} aria-pressed={tags.includes(tag)} onClick={() => toggleTag(tag)}>{tag}</button>)}</div>
        </section> : null}
        <section>
          <label htmlFor="dp-review-body"><b>상세 후기 <small>선택</small></b><span>개인정보나 연락처는 입력하지 마세요.</span></label>
          <textarea id="dp-review-body" value={body} maxLength={300} placeholder="차량 상태, 상담, 계약 과정에서 느낀 점을 적어주세요." onChange={(event) => setBody(event.target.value)} />
          <small className="dp-review-character-count">{body.length}/300</small>
        </section>
        <label className="dp-review-verified"><input type="checkbox" checked={verified} onChange={(event) => setVerified(event.target.checked)} /><span>실제 거래 경험을 바탕으로 작성했습니다.</span></label>
        <button type="button" className="dp-review-submit" disabled={!canContinue} onClick={() => setConfirming(true)}>등록하기</button>
      </div> : <div className="dp-review-confirm">
        <span className="dp-review-confirm-icon">✓</span>
        <h3>리뷰를 등록할까요?</h3>
        <p>등록한 별점과 후기는 수정하거나 삭제할 수 없습니다. 거래 경험에 맞게 작성했는지 한 번 더 확인해 주세요.</p>
        <dl><div><dt>거래</dt><dd>{role === "buyer" ? "차량 구매" : "내차 판매"}</dd></div><div><dt>차량</dt><dd>{selectedTransaction?.label}</dd></div><div><dt>평점</dt><dd>{score}.0 · {REVIEW_RATING_COPY[score]}</dd></div></dl>
        <div><button type="button" onClick={() => setConfirming(false)}>다시 확인</button><button type="button" onClick={submit}>확인하고 등록</button></div>
      </div>}
    </div>
  </div>;
}

function StoreRatingsSection({ cars, allReviews, onSubmit }: { cars: Car[]; allReviews: StoreReview[]; onSubmit: (review: StoreReview) => void }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [writeOpen, setWriteOpen] = useState(false);
  const reviews = allReviews.filter((review) => (filter === "all" || review.role === filter) && (!selectedTag || review.tags.includes(selectedTag)));
  const average = allReviews.reduce((sum, review) => sum + review.score, 0) / Math.max(allReviews.length, 1);
  const buyerCount = allReviews.filter((review) => review.role === "buyer").length;
  const sellerCount = allReviews.filter((review) => review.role === "seller").length;
  const filterItems: Array<[ReviewFilter, string]> = [["all", `전체 (${allReviews.length})`], ["buyer", `차량 구매 (${buyerCount})`], ["seller", `내차 판매 (${sellerCount})`]];
  const selectTag = (tag: string) => {
    setFilter("all");
    setSelectedTag((current) => current === tag ? null : tag);
  };
  const selectRole = (role: ReviewFilter) => {
    setSelectedTag(null);
    setFilter(role);
  };
  return <section className="dp-content-card dp-ratings" aria-labelledby="dp-store-rating-title">
    <div className="dp-store-rating-summary">
      <div className="dp-store-rating-score">
        <h2 id="dp-store-rating-title" className="dp-visually-hidden">리뷰</h2>
        <span><b>{average.toFixed(1)}</b><Stars score={average} /></span>
        <button type="button" className="dp-review-write-button" onClick={() => setWriteOpen(true)}>리뷰 쓰기</button>
      </div>
      <div className="dp-store-rating-tags" aria-label="판매점 평가 키워드">
        {STORE_REVIEW_TAGS.map((label) => {
          const count = allReviews.filter((review) => review.tags.includes(label)).length;
          return <button type="button" key={label} aria-pressed={selectedTag === label} onClick={() => selectTag(label)}>{label} <b>({count})</b></button>;
        })}
      </div>
    </div>
    <div className="dp-store-review-panel">
      <div className="dp-review-filters" role="tablist" aria-label="리뷰 유형">
        {filterItems.map(([id, label]) => <button type="button" role="tab" aria-selected={!selectedTag && filter === id} key={id} onClick={() => selectRole(id)}>{label}</button>)}
      </div>
      <p className="dp-visually-hidden" role="status" aria-live="polite">{selectedTag ? `${selectedTag} 리뷰 ${reviews.length}개` : `${filterItems.find(([id]) => id === filter)?.[1]} 리뷰`}</p>
      <div className="dp-review-list">{reviews.length ? reviews.map((review) => {
        const car = cars.length ? cars[review.carIndex % cars.length] : undefined;
        const price = car?.price === "상담" ? "가격 상담" : car?.price ?? "거래 완료";
        return <article className="dp-review" key={review.id}>
          <header>
            <span className="dp-review-avatar" aria-hidden="true">{review.name.slice(0, 1)}</span>
            <b>{review.name}</b>
          </header>
          {review.body ? <p className="dp-review-body">{review.body}</p> : null}
          {review.tags.length ? <div className="dp-review-tags">{review.tags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
          <div className="dp-review-meta"><b>{review.score.toFixed(1)}</b><Stars score={review.score} /><i /> <time>{review.date}</time></div>
          <div className="dp-review-car">
            <img src={car ? asset(car.listThumb ?? car.image) : asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt="" aria-hidden="true" />
            <span><b>{car?.title ?? "거래 차량"}</b><strong>{price}</strong></span>
          </div>
          {review.reply ? <div className="dp-review-reply"><b>딜러 답글</b><p>{review.reply}</p><time>{review.replyDate}</time></div> : null}
        </article>;
      }) : <div className="dp-review-empty"><b>조건에 맞는 리뷰가 없습니다.</b><span>다른 유형이나 키워드를 선택해 주세요.</span></div>}</div>
    </div>
    {writeOpen ? <ReviewWriteDialog cars={cars} reviews={allReviews} onClose={() => setWriteOpen(false)} onSubmit={(review) => { onSubmit(review); setFilter(review.role); setSelectedTag(null); setWriteOpen(false); }} /> : null}
  </section>;
}

function AboutSection({ dealer, notify }: { dealer: SeoulAutoGalleryDealer; notify: (message: string) => void }) {
  const introduction = dealer.empNo === "1"
    ? MOCK.intro
    : dealer.role === "대표" ? MOCK.intro : `서울오토갤러리 ${MOCK.company} 소속 ${dealer.name} 딜러입니다. 차량 상태와 이력을 꼼꼼히 확인하고 정확한 정보로 상담드리겠습니다.`;
  return <section className="dp-content-card dp-about">
    <h2>소개</h2>
    <article className="dp-about-story">
      <header><img src={dealerPhoto(dealer)} alt="" aria-hidden="true" draggable={false} /><span><b>{dealer.name}</b><small>{MOCK.company} · {MOCK.joined}</small></span></header>
      <p>{introduction}</p>
    </article>
    <dl>
      <div><dt><DealerIcon name="car-sale-as24" />전문 분야</dt><dd>{MOCK.specialty ?? "수입차"}</dd></div>
      <div><dt><DealerIcon name="location-as24" />활동 지역</dt><dd>{MOCK.address}</dd></div>
      <div><dt><DealerIcon name="calendar-as24" />딜러 경력</dt><dd>{MOCK.joined.replace("딜러 경력 ", "")}</dd></div>
      <div><dt><DealerIcon name="complex-home-as24" />소속 상사</dt><dd>{MOCK.company}</dd></div>
      {dealer.employeeNo ?? MOCK.employeeNo ? <div><dt><DealerIcon name="person-as24" />종사원 번호</dt><dd>{dealer.employeeNo ?? MOCK.employeeNo}</dd></div> : null}
      {MOCK.licenseNo ? <div><dt><DealerIcon name="document-as24" />상사 허가번호</dt><dd>{MOCK.licenseNo}</dd></div> : null}
      {MOCK.businessNo ? <div><dt><DealerIcon name="document-as24" />사업자 번호</dt><dd>{MOCK.businessNo}</dd></div> : null}
      {MOCK.phone ? <div><dt><DealerIcon name="phone-as24" />{MOCK.phoneIsGallery ? "단지 대표 전화" : "상사 연락처"}</dt><dd><a href={`tel:${MOCK.phone.replaceAll("-", "")}`}>{MOCK.phone}</a></dd></div> : null}
      <div><dt><DealerIcon name="email-as24" />이메일</dt><dd><button type="button" className="dp-about-link" onClick={() => notify("딜러 이메일 문의를 준비 중이에요")}>{MOCK.email}</button></dd></div>
      {MOCK.fax ? <div><dt><DealerIcon name="printer-as24" />팩스</dt><dd>{MOCK.fax}</dd></div> : null}
      {MOCK.staff ? <div><dt><DealerIcon name="person-as24" />소속 직원</dt><dd>{MOCK.staff}</dd></div> : null}
    </dl>
    <SagGoogleMap title="상사 위치" address={MOCK.mapAddress ?? "서울 서초구 양재대로11길 36"} detail={MOCK.address.split(", ").slice(1).join(", ") || undefined} query={MOCK.mapQuery} place={MOCK.mapPlace} />
  </section>;
}

function SellPriceCta({ onRequest, profile = false }: { onRequest: () => void; profile?: boolean }) {
  return <aside className={`dp-sell-price-cta${profile ? " is-profile" : ""}`} aria-label="내 차 판매 가격 무료 견적">
    <span><b>내 차 판매 가격, 무료 견적 받아보세요</b></span>
    <button type="button" onClick={onRequest}>견적신청</button>
  </aside>;
}

function Footer() {
  return <footer className="dp-footer"><div className="dp-footer-brand"><img src={bobaeAsset("9546-imgLogo.svg")} alt="보배드림" /><span>믿을 수 있는 자동차 거래</span></div><div className="dp-footer-links"><span>회사소개</span><span>이용약관</span><span>개인정보처리방침</span><span>고객센터</span></div><small>© BOBae Network. All rights reserved.</small></footer>;
}

function DealerProfilePage({ dealer, cars }: { dealer: SeoulAutoGalleryDealer; cars: Car[] }) {
  const [following, setFollowing] = useState(true);
  const [mode, setMode] = useState<ListingMode>("active");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [listView, setListView] = useState<DealerListView>(() => new URLSearchParams(window.location.search).get("view") === "feed" ? "feed" : "list");
  const [selectedStockCategories, setSelectedStockCategories] = useState<StockCategory[]>(() => readStockCategories(new URLSearchParams(window.location.search).getAll("stockCategory")));
  const toggleStockCategory = (category: StockCategory) => {
    const next = selectedStockCategories.includes(category)
      ? selectedStockCategories.filter((item) => item !== category)
      : stockCategories.filter((item) => selectedStockCategories.includes(item) || item === category);
    setSelectedStockCategories(next);
    const target = new URL(window.location.href);
    target.searchParams.delete("stockCategory");
    next.forEach((item) => target.searchParams.append("stockCategory", item));
    window.history.replaceState(null, "", `${target.pathname}${target.search}${target.hash}`);
  };
  const [activeSection, setActiveSection] = useState<SectionId>(() => {
    const requested = new URLSearchParams(window.location.search).get("tab");
    return (["home", "ads", "community", "valuation", "reviews", "social", "dealers", "intro"] as SectionId[]).includes(requested as SectionId) && requested !== "social" ? requested as SectionId : "ads";
  });
  const [toast, setToast] = useState("");
  const reviewStorageKey = `bobaedream:dealer-reviews:${dealer.shopNo}:${dealer.empNo}`;
  const [submittedReviews, setSubmittedReviews] = useState<StoreReview[]>(() => {
    try {
      const saved = window.localStorage.getItem(reviewStorageKey);
      return saved ? JSON.parse(saved) as StoreReview[] : [];
    } catch {
      return [];
    }
  });
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const allReviews = [...submittedReviews, ...STORE_REVIEWS];
  const reviewRating = allReviews.reduce((sum, review) => sum + review.score, 0) / Math.max(allReviews.length, 1);

  useEffect(() => { setPretendard(true); document.title = `${dealer.name} 딜러`; }, [dealer.name]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 1800); };
  const submitReview = (review: StoreReview) => {
    setSubmittedReviews((current) => {
      const next = [review, ...current];
      try { window.localStorage.setItem(reviewStorageKey, JSON.stringify(next)); } catch { /* Prototype still works for this session. */ }
      return next;
    });
    notify("리뷰가 등록되었습니다");
  };
  const openListing = (car: Car) => {
    const target = new URL(window.location.href);
    target.searchParams.set("profile", "dealer");
    target.searchParams.set("shop", dealer.shopNo);
    target.searchParams.set("emp", dealer.empNo);
    target.searchParams.set("listing", String(car.id));
    window.location.assign(`${target.pathname}${target.search}${target.hash}`);
  };
  const openDealer = (targetDealer: SeoulAutoGalleryDealer) => {
    if (targetDealer.shopNo === dealer.shopNo && targetDealer.empNo === dealer.empNo) {
      setActiveSection("ads");
      return;
    }
    const target = new URL(window.location.href);
    target.searchParams.set("profile", "dealer");
    target.searchParams.set("shop", targetDealer.shopNo);
    target.searchParams.set("emp", targetDealer.empNo);
    target.searchParams.delete("listing");
    target.searchParams.delete("stockCategory");
    window.location.assign(`${target.pathname}${target.search}${target.hash}`);
  };
  const changeSection = (section: SectionId) => {
    setActiveSection(section);
    const target = new URL(window.location.href);
    target.searchParams.set("tab", section);
    window.history.replaceState(null, "", `${target.pathname}${target.search}${target.hash}`);
    const root = scrollRef.current;
    const nav = root?.querySelector<HTMLElement>(".dp-anchor-nav");
    if (root && nav && nav.getBoundingClientRect().top < 50) root.scrollTo({ top: nav.offsetTop - 50, behavior: "smooth" });
  };

  return <div className="dp-root">
    <div className="dp-scroll" ref={scrollRef}>
      <SiteHeader />
      <main className={`dp-page${activeSection === "reviews" ? " is-reviews" : ""}`} aria-label={`${dealer.name} 딜러페이지`}>
        {activeSection === "reviews" ? <div className="dp-review-page-shell">
          <DealerProfile dealer={dealer} cars={cars} following={following} setFollowing={setFollowing} notify={notify} onValuation={() => changeSection("valuation")} rating={reviewRating} reviewCount={allReviews.length} />
          <div className="dp-review-page-main">
            <AnchorNav active={activeSection} onChange={changeSection} />
            <StoreRatingsSection cars={cars} allReviews={allReviews} onSubmit={submitReview} />
          </div>
        </div> : <>
          <DealerProfile dealer={dealer} cars={cars} following={following} setFollowing={setFollowing} notify={notify} onValuation={() => changeSection("valuation")} rating={reviewRating} reviewCount={allReviews.length} />
          {cars.length ? <DealerBrandRail cars={cars} brand={brand} model={model} onPick={(maker) => { setBrand((value) => value === maker ? "" : maker); setModel(""); setMode("active"); changeSection("ads"); }} onPickModel={(name) => { setModel((value) => value === name ? "" : name); setMode("active"); changeSection("ads"); }} /> : null}
          <AnchorNav active={activeSection} onChange={changeSection} />
          {activeSection === "home" ? <HomeSection /> : null}
          {activeSection === "ads" ? <ListingsSection key={`${brand}|${model}`} view={listView} setView={setListView} cars={brand ? cars.filter((car) => car.maker === brand && (!model || dealerFerrariModelOf(car) === model)) : cars} mode={mode} setMode={setMode} onOpen={openListing} categories={selectedStockCategories} toggleCategory={toggleStockCategory} igPosts={instagramPostsFor(dealer.shopNo, dealer.name)} igHandle={instagramHandleFor(dealer.shopNo, dealer.name)} /> : null}
          {activeSection === "community" ? <CommunitySection cars={cars} dealer={dealer} notify={notify} /> : null}
          {activeSection === "valuation" ? <ValuationSection dealer={dealer} notify={notify} /> : null}
          {activeSection === "dealers" ? <AffiliatedDealersSection currentDealer={dealer} onOpenDealer={openDealer} /> : null}
          {activeSection === "intro" ? <AboutSection dealer={dealer} notify={notify} /> : null}
        </>}
      </main>
      <Footer />
    </div>
    {toast ? <div className="dp-toast" role="status">{toast}</div> : null}
  </div>;
}

export default function DealerPage() {
  const params = new URLSearchParams(window.location.search);
  const matchedDealer = dealers.find((item) => item.shopNo === params.get("shop") && item.empNo === (params.get("emp") ?? item.empNo));
  const dealer: SeoulAutoGalleryDealer = matchedDealer ?? dealers[0];
  MOCK = profileFor(dealer);
  const cars = useMemo(() => dealer.shopNo === JOY_SHOP_NO ? joyMotorsCars : dealer.shopNo === dealers[0].shopNo
    ? seoulAutoGalleryCars
    : seoulAutoGalleryCars.filter((car) => car.seoulAutoGallery?.dealer === dealer.name && (!seoulAutoGalleryShopByNo.has(dealer.shopNo) || car.seoulAutoGallery?.company === seoulAutoGalleryShopByNo.get(dealer.shopNo)?.company)), [dealer.name, dealer.shopNo]);
  const linkedCar = cars.find((car) => String(car.id) === params.get("listing"));

  if (params.get("card") === "1") {
    if (!matchedDealer) return <main className="dbc-page"><div className="dbc-page-wrap"><h1>명함을 찾을 수 없어요</h1><p>공유받은 딜러 명함 주소를 다시 확인해 주세요.</p><a className="dbc-home" href="./?qf=guazi">보배드림으로 이동 →</a></div></main>;
    return <DealerCardPage dealer={dealer} cars={cars} />;
  }

  if (linkedCar) {
    setActiveDetailCar(linkedCar);
    return <FavoritesProvider><DetailUiProvider><FlowStack initial={dealerDetailScreen} /></DetailUiProvider></FavoritesProvider>;
  }

  return <DealerProfilePage dealer={dealer} cars={cars} />;
}

function DealerCardPage({ dealer, cars }: { dealer: SeoulAutoGalleryDealer; cars: Car[] }) {
  useEffect(() => { setPretendard(true); }, []);
  return <DealerBusinessCard standalone shop={dealer.shopNo} emp={dealer.empNo} contact={{ name: dealer.name, role: dealer.role ?? "딜러", company: MOCK.company, gallery: MOCK.gallery, phone: MOCK.phone, address: MOCK.address, photo: dealerPhoto(dealer), listingCount: cars.length }} />;
}
