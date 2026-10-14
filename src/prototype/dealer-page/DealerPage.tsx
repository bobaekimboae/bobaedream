import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { asset, seoulAutoGalleryCars, type Car } from "../data";
import { dealers, type SeoulAutoGalleryDealer } from "../listing/seoul-auto-gallery-dealer-rail";
import { setPretendard } from "../fonts/pretendard";
import "./dealer-page.css";

const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.location.href).pathname;
const icon = (name: string) => `${publicBase}icons/chotot/${name}`;
const bobaeAsset = (name: string) => asset(`pc-detail/${name}`);

type SectionId = "intro" | "ads" | "rating";
type ListingMode = "active" | "sold";
type ReviewFilter = "all" | "buyer" | "seller";

const MOCK = {
  rating: 4.8,
  reviewCount: 3,
  sold: 12,
  followers: 426,
  lastActive: "6시간 전 활동",
  response: "보통 1시간 이내",
  joined: "딜러 경력 7년",
  address: "서울 서초구 양재동",
  intro: "서울오토갤러리에서 수입차를 전문으로 판매합니다. 모든 차량의 상태와 이력을 직접 확인하고, 정확한 정보와 투명한 상담을 약속드립니다.",
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

function DealerProfile({ dealer, following, setFollowing, share }: { dealer: SeoulAutoGalleryDealer; following: boolean; setFollowing: (value: boolean) => void; share: () => void }) {
  return <section className="dp-profile" data-section="intro">
    <div className="dp-cover">
      <img className="dp-cover-photo" src={asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt="서울오토갤러리 전경" draggable={false} />
      <div className="dp-cover-brand"><strong>서울오토갤러리</strong><small>수입차 전문 매매단지</small></div>
      <span>{MOCK.lastActive}</span>
      <button type="button" className="dp-cover-more" aria-label="판매자 메뉴"><Icon name="chotot-common-more.svg" /></button>
    </div>
    <div className="dp-profile-body">
      <img className="dp-avatar" src={asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`)} alt={`${dealer.name} 프로필`} draggable={false} />
      <div className="dp-profile-copy">
        <h1>{dealer.name}<Icon name="chotot-list-detail-verified-dealer-wavy-badge.svg" className="is-badge" /></h1>
        <div className="dp-profile-inline is-channel-handle">@서울오토갤러리</div>
        <div className="dp-profile-inline is-channel-meta">팔로워 {MOCK.followers + (following ? 1 : 0)} · 판매중 7대</div>
        <div className="dp-profile-actions">
          <button type="button" onClick={share}><Icon name="chotot-common-share.svg" />공유</button>
          <button type="button" aria-pressed={following} onClick={() => setFollowing(!following)}><Icon name={following ? "chotot-list-detail-following.svg" : "chotot-list-detail-follow.svg"} />{following ? "팔로잉" : "팔로우"}</button>
        </div>
        <div className="dp-profile-inline is-first"><span className="dp-online-dot" />{MOCK.lastActive}<i />응답률: {MOCK.response}<i /><u>팔로워 {MOCK.followers + (following ? 1 : 0)}</u></div>
        <div className="dp-profile-inline is-rating"><b>{MOCK.rating}</b><Stars score={MOCK.rating} /><u>({MOCK.reviewCount}개 평가)</u><span className="dp-mobile-followers">· 팔로워 {MOCK.followers + (following ? 1 : 0)}</span><i /><span className="dp-desktop-career"><Icon name="chotot-common-clock.svg" />{MOCK.joined}</span></div>
        <div className="dp-profile-inline is-response"><Icon name="chotot-list-detail-response-rate.svg" />응답률: {MOCK.response}</div>
        <div className="dp-profile-inline is-location"><Icon name="chotot-profile-location.svg" /><span>{MOCK.address}</span><span className="dp-location-rating"><Icon name="chotot-list-detail-review-star.svg" /><b>{MOCK.rating}</b><u>리뷰 {MOCK.reviewCount}개</u></span></div>
        <div className="dp-profile-inline is-career"><Icon name="chotot-common-join-date.svg" />{MOCK.joined}</div>
        <p className="dp-intro-copy">{MOCK.intro}</p>
      </div>
    </div>
  </section>;
}

function ActiveCards({ cars, limit, notify }: { cars: Car[]; limit: number; notify: (text: string) => void }) {
  const [liked, setLiked] = useState<Set<number>>(new Set());
  return <div className="dp-listings-grid">{cars.slice(0, limit).map((car) => (
    <article className="dp-listing-card" key={car.id} onClick={() => notify(`${car.title} 상세를 선택했어요`)}>
      <div className="dp-listing-media">
        <img src={asset(car.listThumb ?? car.image)} alt="" draggable={false} />
        <span>{car.posted}</span>
        <small>{car.photos}</small>
        <button type="button" aria-label="관심 매물" aria-pressed={liked.has(car.id)} onClick={(event) => { event.stopPropagation(); setLiked((current) => { const next = new Set(current); if (next.has(car.id)) next.delete(car.id); else next.add(car.id); return next; }); }}><Icon name={liked.has(car.id) ? "chotot-pc-detail-favorite-selected.svg" : "chotot-pc-detail-thumbnail-favorite-white-bg.svg"} /></button>
      </div>
      <div className="dp-listing-copy">
        <h3>{[car.title, car.trim].filter(Boolean).join(" ")}</h3>
        <b>{car.price}</b>
        <p><Icon name="chotot-common-location-pin-gray.svg" />{car.place}</p>
      </div>
    </article>
  ))}</div>;
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

function ListingsSection({ cars, mode, setMode, notify }: { cars: Car[]; mode: ListingMode; setMode: (mode: ListingMode) => void; notify: (text: string) => void }) {
  const [limit, setLimit] = useState(5);
  const total = cars.length + MOCK.sold;
  const max = mode === "active" ? cars.length : MOCK.soldCars.length;
  return <section className="dp-content-card dp-listings" data-section="ads">
    <h2>전체 매물 ({total})</h2>
    <div className="dp-listing-modes" role="tablist" aria-label="판매 상태">
      <button type="button" role="tab" aria-selected={mode === "active"} onClick={() => { setMode("active"); setLimit(5); }}>판매중 ({cars.length})</button>
      <button type="button" role="tab" aria-selected={mode === "sold"} onClick={() => { setMode("sold"); setLimit(5); }}>판매완료 ({MOCK.sold})</button>
    </div>
    {mode === "active" ? <ActiveCards cars={cars} limit={limit} notify={notify} /> : <SoldCards limit={limit} />}
    {limit < max ? <button type="button" className="dp-more" onClick={() => setLimit((value) => Math.min(value + 5, max))}>매물 더보기</button> : null}
  </section>;
}

function AnchorNav({ active, goTo, total }: { active: SectionId; goTo: (section: SectionId) => void; total: number }) {
  const items: Array<[SectionId, string]> = [["intro", "소개"], ["ads", `전체 매물 (${total})`], ["rating", `평가 (${MOCK.reviewCount})`]];
  return <nav className="dp-anchor-nav" aria-label="판매자 페이지 구역">{items.map(([id, label]) => <button key={id} type="button" className={active === id ? "is-active" : ""} onClick={() => goTo(id)}>{label}</button>)}</nav>;
}

function RatingsSection({ cars }: { cars: Car[] }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const reviews = MOCK.reviews.filter((review) => filter === "all" || review.role === filter);
  const filterItems: Array<[ReviewFilter, string]> = [["all", `전체 (${MOCK.reviewCount})`], ["buyer", "구매자 (2)"], ["seller", "판매자 (1)"]];
  return <section className="dp-content-card dp-ratings" data-section="rating">
    <h2>평가</h2>
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

function Footer() {
  return <footer className="dp-footer"><div className="dp-footer-brand"><img src={bobaeAsset("9546-imgLogo.svg")} alt="보배드림" /><span>믿을 수 있는 자동차 거래</span></div><div className="dp-footer-links"><span>회사소개</span><span>이용약관</span><span>개인정보처리방침</span><span>고객센터</span></div><small>© BOBae Network. All rights reserved.</small></footer>;
}

export default function DealerPage() {
  const params = new URLSearchParams(window.location.search);
  const dealer: SeoulAutoGalleryDealer = dealers.find((item) => item.shopNo === params.get("shop") && item.empNo === (params.get("emp") ?? item.empNo)) ?? dealers[0];
  const cars = useMemo(() => seoulAutoGalleryCars.filter((car) => car.dealer.startsWith(dealer.name)), [dealer.name]);
  const [following, setFollowing] = useState(false);
  const [mode, setMode] = useState<ListingMode>("active");
  const [activeSection, setActiveSection] = useState<SectionId>("intro");
  const [toast, setToast] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const introRef = useRef<HTMLDivElement | null>(null);
  const adsRef = useRef<HTMLDivElement | null>(null);
  const ratingRef = useRef<HTMLDivElement | null>(null);
  const refs: Record<SectionId, RefObject<HTMLDivElement | null>> = { intro: introRef, ads: adsRef, rating: ratingRef };

  useEffect(() => { setPretendard(true); document.title = `${dealer.name} 딜러`; }, [dealer.name]);
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const onScroll = () => {
      const marker = root.scrollTop + 180;
      let next: SectionId = "intro";
      if ((adsRef.current?.offsetTop ?? Infinity) <= marker) next = "ads";
      if ((ratingRef.current?.offsetTop ?? Infinity) <= marker) next = "rating";
      setActiveSection(next);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 1800); };
  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: `${dealer.name} 딜러`, url: window.location.href });
      else { await navigator.clipboard.writeText(window.location.href); notify("링크를 복사했어요"); }
    } catch { /* 공유 취소 */ }
  };
  const goTo = (section: SectionId) => {
    setActiveSection(section);
    const root = scrollRef.current;
    const target = refs[section].current;
    if (root && target) root.scrollTo({ top: Math.max(0, target.offsetTop - 112), behavior: "smooth" });
  };

  return <div className="dp-root">
    <div className="dp-scroll" ref={scrollRef}>
      <SiteHeader />
      <main className="dp-page" aria-label={`${dealer.name} 딜러 판매자 페이지`}>
        <div ref={introRef}><DealerProfile dealer={dealer} following={following} setFollowing={setFollowing} share={share} /></div>
        <div ref={adsRef}><ListingsSection cars={cars} mode={mode} setMode={setMode} notify={notify} /></div>
        <AnchorNav active={activeSection} goTo={goTo} total={cars.length + MOCK.sold} />
        <div ref={ratingRef}><RatingsSection cars={cars} /></div>
      </main>
      <Footer />
    </div>
    {toast ? <div className="dp-toast" role="status">{toast}</div> : null}
  </div>;
}
