import { useEffect, useMemo, useRef, useState } from "react";
import { CheckIcon, PlusIcon } from "@radix-ui/react-icons";
import { FlowStack, type FlowScreen } from "../../mobile";
import { DetailFooter, DetailUiProvider, VehicleDetail } from "../detail";
import { FavoritesProvider, asset, seoulAutoGalleryCars, setActiveDetailCar, type Car } from "../data";
import { BbmResultCard } from "../listing/bbm-list";
import { dealers, type SeoulAutoGalleryDealer } from "../listing/seoul-auto-gallery-dealer-rail";
import { setPretendard } from "../fonts/pretendard";
import "./dealer-page.css";

const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.location.href).pathname;
const icon = (name: string) => `${publicBase}icons/chotot/${name}`;
const bobaeAsset = (name: string) => asset(`pc-detail/${name}`);

type SectionId = "intro" | "ads" | "rating";
type ListingMode = "active" | "sold";
type ReviewFilter = "all" | "buyer" | "seller";

const dealerDetailScreen: FlowScreen = {
  id: "dealer-vehicle-detail",
  footer: () => <DetailFooter />,
  footerHeight: 56,
  render: () => <VehicleDetail />,
};

const MOCK = {
  rating: 4.8,
  reviewCount: 3,
  sold: 12,
  followers: 426,
  lastActive: "6시간 전 활동",
  response: "보통 1시간 이내",
  joined: "딜러 경력 7년",
  company: "(주)투제이모터웍스",
  complex: "서울SAG · 서울오토갤러리",
  licenseNo: "02-1123-000075",
  businessNo: "462-86-03494",
  employeeNo: "26-003-00097",
  phone: "02-2059-5211",
  fax: "02-2059-5200",
  staff: "4명",
  address: "서울특별시 서초구 양재대로11길 36 은관 421호 (양재동)",
  intro: "서울오토갤러리 은관에 위치한 (주)투제이모터웍스 대표 김태규입니다. 모든 차량의 상태와 이력을 직접 확인하고, 정확한 정보와 투명한 상담을 약속드립니다.",
  reviews: [
    { name: "김**", role: "buyer", score: 4, date: "3개월 전", car: "벤츠 GLS클래스 3세대", price: "7,575만원" },
    { name: "박**", role: "buyer", score: 5, date: "5개월 전", car: "벤츠 E클래스 5세대", price: "4,344만원" },
    { name: "이**", role: "seller", score: 5, date: "8개월 전", car: "벤츠 S클래스 7세대", price: "8,145만원" },
  ],
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

function Icon({ name, className }: { name: string; className?: string }) {
  return <img className={`dp-icon${className ? ` ${className}` : ""}`} src={icon(name)} alt="" aria-hidden="true" draggable={false} />;
}

function Stars({ score }: { score: number }) {
  const filled = Math.floor(score);
  const star = `url(${icon("chotot-list-detail-review-star.svg")})`;
  return <span className="dp-stars" aria-label={`별점 ${score}점`}>
    {Array.from({ length: 5 }, (_, index) => <span key={index} className={`dp-star${index < filled ? " is-on" : ""}`} style={{ maskImage: star, WebkitMaskImage: star }} />)}
  </span>;
}

function SiteHeader() {
  return <header className="dp-site-header">
    <div className="dp-mobile-channel-head">
      <button type="button" aria-label="뒤로가기" onClick={() => window.history.back()}><img src={asset("detail/back.svg")} alt="" aria-hidden="true" /></button>
      <div>
        <button type="button" aria-label="판매자 매물 검색"><Icon name="chotot-common-search-thin-line.svg" /></button>
        <button type="button" aria-label="판매자 메뉴"><Icon name="chotot-common-more.svg" /></button>
      </div>
    </div>
    <div className="dp-site-main">
      <button type="button" className="dp-site-menu" aria-label="전체 메뉴"><Icon name="chotot-common-menu.svg" /></button>
      <a className="dp-wordmark" href="./" aria-label="보배드림 홈">
        <span className="dp-wordmark-mark"><img src={bobaeAsset("9546-imgGroup.svg")} alt="" /></span>
        <img src={bobaeAsset("9546-imgLogo.svg")} alt="보배드림" />
      </a>
      <button type="button" className="dp-region"><Icon name="chotot-common-location-pin.svg" />전국 <Icon name="chotot-pc-detail-chevron-down-white-bg.svg" /></button>
      <label className="dp-search"><Icon name="chotot-pc-detail-search-magnifier-gray.svg" /><input aria-label="차량 검색" placeholder="차량을 검색해 보세요" /></label>
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

function DealerProfile({ dealer, listingCount, following, setFollowing, share }: { dealer: SeoulAutoGalleryDealer; listingCount: number; following: boolean; setFollowing: (value: boolean) => void; share: () => void }) {
  return <section className="dp-profile">
    <div className="dp-cover">
      <img className="dp-cover-photo" src={asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt="서울오토갤러리 전경" draggable={false} />
      <div className="dp-cover-brand"><small>{MOCK.complex}</small><strong>{MOCK.company}</strong><em>IMPORT MOTORS · SEOUL</em></div>
      <span>{MOCK.lastActive}</span>
      <button type="button" className="dp-cover-more" aria-label="판매자 메뉴"><Icon name="chotot-common-more.svg" /></button>
    </div>
    <div className="dp-profile-body">
      <img className="dp-avatar" src={asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`)} alt={`${dealer.name} 프로필`} draggable={false} />
      <div className="dp-profile-copy">
        <h1>{dealer.name}<Icon name="chotot-list-detail-verified-dealer-wavy-badge.svg" className="is-badge" /></h1>
        <div className="dp-profile-inline is-channel-handle">대표 · {MOCK.company}</div>
        <div className="dp-profile-inline is-channel-meta">{MOCK.complex} · 판매중 {listingCount}대</div>
        <div className="dp-profile-inline is-mobile-rating"><b>{MOCK.rating}</b><Stars score={MOCK.rating} /><u>({MOCK.reviewCount}개 평가)</u><span>· 팔로워 {MOCK.followers + (following ? 1 : 0)}</span></div>
        <div className="dp-profile-actions">
          <button type="button" onClick={share}><Icon name="chotot-common-share.svg" />공유</button>
          <button type="button" aria-pressed={following} onClick={() => setFollowing(!following)}>{following ? <CheckIcon aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}{following ? "팔로잉" : "팔로우"}</button>
        </div>
        <div className="dp-profile-inline is-first"><span className="dp-online-dot" />{MOCK.lastActive}<i />응답률: {MOCK.response}<i /><u>팔로워 {MOCK.followers + (following ? 1 : 0)}</u></div>
        <div className="dp-profile-inline is-rating"><b>{MOCK.rating}</b><Stars score={MOCK.rating} /><u>({MOCK.reviewCount}개 평가)</u><span className="dp-mobile-followers">· 팔로워 {MOCK.followers + (following ? 1 : 0)}</span><i /><span className="dp-desktop-career"><Icon name="chotot-common-clock.svg" />{MOCK.joined}</span></div>
        <div className="dp-profile-inline is-response"><Icon name="chotot-list-detail-response-rate.svg" />응답률: {MOCK.response}</div>
        <div className="dp-profile-inline is-location"><Icon name="chotot-profile-location.svg" /><span>{MOCK.address}</span></div>
        <div className="dp-profile-inline is-career"><Icon name="chotot-common-join-date.svg" />{MOCK.joined}</div>
      </div>
    </div>
  </section>;
}

function ActiveCards({ cars, limit, onOpen }: { cars: Car[]; limit: number; onOpen: (car: Car) => void }) {
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
  return <div className={`dp-listings-shell marketplace ${desktop ? "is-bbm" : "is-bbm-m"}`}>
    <div className="bbm-m-list">{cars.slice(0, limit).map((car) => <BbmResultCard
      key={car.id}
      car={car}
      variant={desktop ? "pc" : "mobile"}
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

function ListingsSection({ cars, mode, setMode, onOpen }: { cars: Car[]; mode: ListingMode; setMode: (mode: ListingMode) => void; onOpen: (car: Car) => void }) {
  const [limit, setLimit] = useState(5);
  const max = mode === "active" ? cars.length : MOCK.soldCars.length;
  return <section className="dp-content-card dp-listings">
    <div className="dp-listing-modes" role="tablist" aria-label="판매 상태">
      <button type="button" role="tab" aria-selected={mode === "active"} onClick={() => { setMode("active"); setLimit(5); }}>판매중 ({cars.length})</button>
      <button type="button" role="tab" aria-selected={mode === "sold"} onClick={() => { setMode("sold"); setLimit(5); }}>판매완료 ({MOCK.sold})</button>
    </div>
    {mode === "active" ? <ActiveCards cars={cars} limit={limit} onOpen={onOpen} /> : <SoldCards limit={limit} />}
    {limit < max ? <button type="button" className="dp-more" onClick={() => setLimit((value) => Math.min(value + 5, max))}>매물 더보기</button> : null}
  </section>;
}

function AnchorNav({ active, onChange }: { active: SectionId; onChange: (section: SectionId) => void }) {
  const items: Array<[SectionId, string]> = [["ads", "판매차량"], ["rating", "리뷰"], ["intro", "소개"]];
  return <nav className="dp-anchor-nav" aria-label="판매자 페이지 구역" role="tablist">{items.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={active === id} className={active === id ? "is-active" : ""} onClick={() => onChange(id)}>{label}</button>)}</nav>;
}

function RatingsSection({ cars }: { cars: Car[] }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const reviews = MOCK.reviews.filter((review) => filter === "all" || review.role === filter);
  const filterItems: Array<[ReviewFilter, string]> = [["all", `전체 (${MOCK.reviewCount})`], ["buyer", "구매자 (2)"], ["seller", "판매자 (1)"]];
  return <section className="dp-content-card dp-ratings">
    <h2>리뷰</h2>
    <div className="dp-rating-layout">
      <div className="dp-rating-summary"><strong>{MOCK.rating}<span>★</span> 매우 만족</strong><small>({MOCK.reviewCount}명의 이용자 평가)</small></div>
      <div className="dp-rating-list">
        <h3>이용자 평가 <span aria-label="도움말">ⓘ</span></h3>
        <p>평가 유형</p>
        <div className="dp-review-filters" role="tablist" aria-label="평가 유형">{filterItems.map(([id, label]) => <button type="button" role="tab" aria-selected={filter === id} key={id} onClick={() => setFilter(id)}>{label}</button>)}</div>
        <div className="dp-review-grid">{reviews.map((review, index) => {
          const car = cars[index % Math.max(cars.length, 1)];
          return <article className="dp-review" key={review.name + review.date}>
            <header><span className="dp-review-avatar"><Icon name="chotot-common-user.svg" /></span><b>{review.name}</b></header>
            <div className="dp-review-meta"><Stars score={review.score} /><time>{review.date}</time></div>
            <div className="dp-review-car"><img src={car ? asset(car.listThumb ?? car.image) : asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt="" /><span><b>{review.car}</b><strong>{review.price}</strong></span></div>
          </article>;
        })}</div>
      </div>
    </div>
  </section>;
}

function AboutSection() {
  return <section className="dp-content-card dp-about">
    <h2>소개</h2>
    <p>{MOCK.intro}</p>
    <dl>
      <div><dt>전문 분야</dt><dd>수입차</dd></div>
      <div><dt>활동 지역</dt><dd>{MOCK.address}</dd></div>
      <div><dt>응답 시간</dt><dd>{MOCK.response}</dd></div>
      <div><dt>딜러 경력</dt><dd>7년</dd></div>
      <div><dt>소속 상사</dt><dd>{MOCK.company}</dd></div>
      <div><dt>종사원 번호</dt><dd>{MOCK.employeeNo}</dd></div>
      <div><dt>상사 허가번호</dt><dd>{MOCK.licenseNo}</dd></div>
      <div><dt>사업자 번호</dt><dd>{MOCK.businessNo}</dd></div>
      <div><dt>상사 연락처</dt><dd>{MOCK.phone}</dd></div>
      <div><dt>팩스</dt><dd>{MOCK.fax}</dd></div>
      <div><dt>소속 직원</dt><dd>{MOCK.staff}</dd></div>
    </dl>
  </section>;
}

function Footer() {
  return <footer className="dp-footer"><div className="dp-footer-brand"><img src={bobaeAsset("9546-imgLogo.svg")} alt="보배드림" /><span>믿을 수 있는 자동차 거래</span></div><div className="dp-footer-links"><span>회사소개</span><span>이용약관</span><span>개인정보처리방침</span><span>고객센터</span></div><small>© BOBae Network. All rights reserved.</small></footer>;
}

function DealerProfilePage({ dealer, cars }: { dealer: SeoulAutoGalleryDealer; cars: Car[] }) {
  const [following, setFollowing] = useState(false);
  const [mode, setMode] = useState<ListingMode>("active");
  const [activeSection, setActiveSection] = useState<SectionId>("ads");
  const [toast, setToast] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { setPretendard(true); document.title = `${dealer.name} 딜러`; }, [dealer.name]);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 1800); };
  const openListing = (car: Car) => {
    const target = new URL(window.location.href);
    target.searchParams.set("profile", "dealer");
    target.searchParams.set("shop", dealer.shopNo);
    target.searchParams.set("emp", dealer.empNo);
    target.searchParams.set("listing", String(car.id));
    window.location.assign(`${target.pathname}${target.search}${target.hash}`);
  };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${dealer.name} 딜러`, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); notify("링크를 복사했어요"); }
    } catch { /* 공유 취소 */ }
  };
  const changeSection = (section: SectionId) => {
    setActiveSection(section);
    const root = scrollRef.current;
    const nav = root?.querySelector<HTMLElement>(".dp-anchor-nav");
    if (root && nav && nav.getBoundingClientRect().top < 56) root.scrollTo({ top: nav.offsetTop - 56, behavior: "smooth" });
  };

  return <div className="dp-root">
    <div className="dp-scroll" ref={scrollRef}>
      <SiteHeader />
      <main className="dp-page" aria-label={`${dealer.name} 딜러 판매자 페이지`}>
        <DealerProfile dealer={dealer} listingCount={cars.length} following={following} setFollowing={setFollowing} share={share} />
        <AnchorNav active={activeSection} onChange={changeSection} />
        {activeSection === "ads" ? <ListingsSection cars={cars} mode={mode} setMode={setMode} onOpen={openListing} /> : null}
        {activeSection === "rating" ? <RatingsSection cars={cars} /> : null}
        {activeSection === "intro" ? <AboutSection /> : null}
      </main>
      <Footer />
    </div>
    {toast ? <div className="dp-toast" role="status">{toast}</div> : null}
  </div>;
}

export default function DealerPage() {
  const params = new URLSearchParams(window.location.search);
  const dealer: SeoulAutoGalleryDealer = dealers.find((item) => item.shopNo === params.get("shop") && item.empNo === (params.get("emp") ?? item.empNo)) ?? dealers[0];
  const cars = useMemo(() => dealer.shopNo === dealers[0].shopNo
    ? seoulAutoGalleryCars
    : seoulAutoGalleryCars.filter((car) => car.dealer.startsWith(dealer.name)), [dealer.name, dealer.shopNo]);
  const linkedCar = cars.find((car) => String(car.id) === params.get("listing"));

  if (linkedCar) {
    setActiveDetailCar(linkedCar);
    return <FavoritesProvider><DetailUiProvider><FlowStack initial={dealerDetailScreen} /></DetailUiProvider></FavoritesProvider>;
  }

  return <DealerProfilePage dealer={dealer} cars={cars} />;
}
