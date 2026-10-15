import { useEffect, useMemo, useRef, useState } from "react";
import { ExternalLinkIcon } from "@radix-ui/react-icons";
import { FlowStack, type FlowScreen } from "../../mobile";
import { DetailFooter, DetailUiProvider, VehicleDetail } from "../detail";
import { FavoritesProvider, asset, seoulAutoGalleryCars, setActiveDetailCar, type Car } from "../data";
import { BbmResultCard } from "../listing/bbm-list";
import { dealers, type SeoulAutoGalleryDealer } from "../listing/seoul-auto-gallery-dealer-rail";
import { setPretendard } from "../fonts/pretendard";
import "./dealer-page.css";

const publicBase = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.location.href).pathname;
const icon = (name: string) => `${publicBase}icons/chotot/${name}`;
const dealerIcon = (name: string) => `${publicBase}icons/dealer-profile/${name}.svg`;
const bobaeAsset = (name: string) => asset(`pc-detail/${name}`);
const dealerPhoto = (dealer: SeoulAutoGalleryDealer) => asset(dealer.profileAsset ?? `dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`);

type SectionId = "home" | "ads" | "community" | "valuation" | "reviews" | "social" | "dealers" | "intro";
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
  followers: 425,
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
  email: "이메일 문의",
  staff: "4명",
  address: "서울특별시 서초구 양재대로11길 36, 은관 421호",
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

const SOCIAL_CHANNELS = [
  { id: "facebook", label: "페이스북", description: "판매 소식", href: "https://www.facebook.com/search/top?q=%ED%88%AC%EC%A0%9C%EC%9D%B4%EB%AA%A8%ED%84%B0%EC%9B%8D%EC%8A%A4" },
  { id: "youtube", label: "유튜브", description: "차량 영상", href: "https://www.youtube.com/results?search_query=%ED%88%AC%EC%A0%9C%EC%9D%B4%EB%AA%A8%ED%84%B0%EC%9B%8D%EC%8A%A4" },
  { id: "instagram", label: "인스타그램", description: "신규 매물", href: "https://www.instagram.com/explore/tags/%ED%88%AC%EC%A0%9C%EC%9D%B4%EB%AA%A8%ED%84%B0%EC%9B%8D%EC%8A%A4/" },
  { id: "tiktok", label: "틱톡", description: "숏폼 영상", href: "https://www.tiktok.com/search?q=%ED%88%AC%EC%A0%9C%EC%9D%B4%EB%AA%A8%ED%84%B0%EC%9B%8D%EC%8A%A4" },
] as const;

const FERRARI_HERO_VIDEO = "https://s7mbrstream-g1.scene7.com/is/content/ferrari/_media_/13d/13d2b055-5408-40dc-b461-c1e2439868f6-stream.mp4?utm_medium=fmp4_dash";
const FERRARI_HERO_POSTER = asset("supercar-header/ferrari-f80.jpg");

function Icon({ name, className }: { name: string; className?: string }) {
  return <img className={`dp-icon${className ? ` ${className}` : ""}`} src={icon(name)} alt="" aria-hidden="true" draggable={false} />;
}

function DealerIcon({ name, className }: { name: string; className?: string }) {
  return <img className={`dp-icon dp-dealer-icon${className ? ` ${className}` : ""}`} src={dealerIcon(name)} alt="" aria-hidden="true" draggable={false} />;
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
      <strong className="dp-mobile-channel-name">{MOCK.company.replace("(주)", "")}</strong>
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

function DealerProfile({ dealer, cars, following, setFollowing, notify }: { dealer: SeoulAutoGalleryDealer; cars: Car[]; following: boolean; setFollowing: (value: boolean) => void; notify: (message: string) => void }) {
  const [heroVideoFailed, setHeroVideoFailed] = useState(false);
  const reduceMotion = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const listingCount = cars.length;

  return <section className="dp-profile">
    <div className="dp-cover">
      {heroVideoFailed || reduceMotion ? <img
        className="dp-cover-photo dp-cover-video"
        src={FERRARI_HERO_POSTER}
        alt="페라리 F80"
        draggable={false}
      /> : <video
        className="dp-cover-photo dp-cover-video"
        src={FERRARI_HERO_VIDEO}
        poster={FERRARI_HERO_POSTER}
        muted
        autoPlay
        playsInline
        loop
        preload="metadata"
        aria-hidden="true"
        onError={() => setHeroVideoFailed(true)}
      />}
      <div className="dp-cover-brand-copy">
        <strong>투제이모터웍스</strong>
        <span>수입차 전문 매매</span>
      </div>
      <button type="button" className="dp-cover-more" aria-label="판매자 메뉴"><Icon name="chotot-common-more.svg" /></button>
    </div>
    <div className="dp-profile-body">
      <img className="dp-avatar" src={dealerPhoto(dealer)} alt={`${dealer.name} 프로필`} draggable={false} />
      <div className="dp-profile-copy">
        <h1>{dealer.name}<Icon name="chotot-list-detail-verified-dealer-wavy-badge.svg" className="is-badge" /></h1>
        <div className="dp-profile-stats dp-profile-stats-mobile" aria-label="판매 실적">
          <span><small>판매중</small><b>{listingCount}</b></span>
          <span><small>판매완료</small><b>{MOCK.sold}</b></span>
          <span><small>팔로워</small><b>{MOCK.followers + (following ? 1 : 0)}</b></span>
        </div>
        <div className="dp-profile-bio">
          <b>{MOCK.company} · {dealer.role ?? "인증딜러"}</b>
          <p>{MOCK.intro}</p>
        </div>
        <div className="dp-profile-actions">
          <button type="button" className="is-follow" aria-pressed={following} onClick={() => setFollowing(!following)}><Icon name={following ? "chotot-listing-register-check-mark.svg" : "chotot-list-detail-follow.svg"} />{following ? "팔로잉" : "팔로우"}</button>
          <button type="button" onClick={() => notify(`${dealer.name} 딜러와 채팅을 시작할 수 있어요`)}><Icon name="chotot-list-detail-chat.svg" />채팅하기</button>
          <a href={`tel:${MOCK.phone.replaceAll("-", "")}`} aria-label={`${dealer.name} 딜러에게 전화하기`}><Icon name="chotot-list-detail-phone.svg" />전화하기</a>
        </div>
        <div className="dp-profile-inline is-first"><DealerIcon name="clock" />{MOCK.lastActive}<i /><b>{MOCK.rating}</b><Stars score={MOCK.rating} /><u>리뷰 {MOCK.reviewCount}</u></div>
        <div className="dp-profile-inline is-mobile-rating"><b>{MOCK.rating}</b><Stars score={MOCK.rating} /><u>리뷰 {MOCK.reviewCount}</u></div>
        <div className="dp-profile-inline is-location"><Icon name="chotot-profile-location.svg" /><span>{MOCK.address}</span></div>
        <div className="dp-profile-inline is-phone"><DealerIcon name="phone" /><a href={`tel:${MOCK.phone.replaceAll("-", "")}`}>{MOCK.phone}</a></div>
        <div className="dp-profile-career-meta">
          <div className="dp-profile-inline is-career"><DealerIcon name="calendar" />{MOCK.joined}</div>
          <div className="dp-profile-inline is-career-response"><DealerIcon name="clock" />응답률: {MOCK.response}</div>
        </div>
        <div className="dp-profile-stats dp-profile-stats-desktop" aria-label="판매 실적">
          <span><small>판매중</small><b>{listingCount}</b></span>
          <span><small>판매완료</small><b>{MOCK.sold}</b></span>
          <span><small>팔로워</small><b>{MOCK.followers + (following ? 1 : 0)}</b></span>
        </div>
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
  const items: Array<[SectionId, string]> = [["home", "홈"], ["ads", "판매차량"], ["community", "커뮤니티"], ["valuation", "내차시세문의"], ["reviews", "리뷰"], ["social", "SNS"], ["dealers", "소속딜러"], ["intro", "소개"]];
  return <nav className="dp-anchor-nav" aria-label="판매자 페이지 구역" role="tablist">{items.map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={active === id} className={`${active === id ? "is-active" : ""}${id === "valuation" ? " is-valuation" : ""}`} onClick={() => onChange(id)}>{label}</button>)}</nav>;
}

function HomeSection() {
  return <section className="dp-content-card dp-home-pending" aria-labelledby="dp-home-title">
    <h2 id="dp-home-title">홈</h2>
    <p>판매자 홈 구성은 다음 단계에서 준비합니다.</p>
  </section>;
}

function CommunitySection({ cars, notify }: { cars: Car[]; notify: (message: string) => void }) {
  const posts = [
    { category: "차량 소개", title: "BMW M3 xDrive 컴페티션 입고 안내", copy: "관리 상태와 주요 옵션을 직접 확인했습니다. 방문 전 궁금한 점을 댓글로 남겨주세요.", author: "김태규", time: "2시간 전", views: 128, comments: 6, car: cars[1] ?? cars[0] },
    { category: "관리 팁", title: "수입차 장기 보관 전 확인할 세 가지", copy: "배터리와 타이어 공기압, 실내 습도만 점검해도 차량 컨디션을 오래 유지할 수 있습니다.", author: "투제이모터웍스", time: "1일 전", views: 246, comments: 11, car: cars[0] },
    { category: "상담 후기", title: "멀리서 방문해 주신 고객님 출고 후기", copy: "차량 이력과 상품화 과정을 함께 확인하고 안전하게 출고를 마쳤습니다.", author: "김태규", time: "3일 전", views: 193, comments: 4, car: cars[2] ?? cars[0] },
  ];
  return <section className="dp-content-card dp-community" aria-labelledby="dp-community-title">
    <div className="dp-section-heading">
      <div><h2 id="dp-community-title">커뮤니티</h2><p>딜러가 전하는 차량 소식과 관리 정보입니다.</p></div>
      <button type="button" onClick={() => notify("커뮤니티 글쓰기를 준비 중이에요")}>글쓰기</button>
    </div>
    <div className="dp-community-list">
      {posts.map((post) => <button type="button" className="dp-community-post" key={post.title} onClick={() => notify(post.title)}>
        <span className="dp-community-copy"><small>{post.category}</small><b>{post.title}</b><p>{post.copy}</p><em>{post.author} · {post.time} · 조회 {post.views} · 댓글 {post.comments}</em></span>
        {post.car ? <img src={asset(post.car.listThumb ?? post.car.image)} alt="" aria-hidden="true" draggable={false} /> : null}
      </button>)}
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

function SocialFeedSection({ cars }: { cars: Car[] }) {
  const posts = [
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
      copy: "새로 입고된 수입차 라인업을 공개합니다. 차량별 상세 상담과 방문 예약은 판매자 페이지에서 가능합니다.",
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

  return <section className="dp-content-card dp-social-feed" aria-labelledby="dp-social-title">
    <div className="dp-section-heading">
      <div><h2 id="dp-social-title">SNS</h2><p>판매자가 등록한 채널의 최신 게시물입니다.</p></div>
      <span>{posts.length}개 채널 게시물</span>
    </div>
    <div className="dp-social-feed-list">
      {posts.map((post) => <article className="dp-social-post" key={`${post.platform}-${post.time}`}>
        <header>
          <DealerIcon name={post.platform} />
          <span><b>{post.label}</b><small>{post.handle} · {post.time}</small></span>
          <a href={post.href} target="_blank" rel="noreferrer" aria-label={`${post.label} 원문 보기`}><ExternalLinkIcon aria-hidden="true" /></a>
        </header>
        <p>{post.copy}</p>
        {post.car ? <a className="dp-social-media" href={post.href} target="_blank" rel="noreferrer" aria-label={`${post.label}에서 ${post.car.title} 게시물 보기`}>
          <img src={asset(post.car.listThumb ?? post.car.image)} alt={`${post.car.title} SNS 게시물`} draggable={false} />
          <span><b>{post.car.title}</b><small>{post.car.price === "상담" ? "가격 상담" : `${post.car.price}만원`}</small></span>
        </a> : null}
        <footer><span>{post.stats}</span><a href={post.href} target="_blank" rel="noreferrer">원문 보기 <ExternalLinkIcon aria-hidden="true" /></a></footer>
      </article>)}
    </div>
  </section>;
}

function AffiliatedDealersSection({ currentDealer, onOpenDealer }: { currentDealer: SeoulAutoGalleryDealer; onOpenDealer: (dealer: SeoulAutoGalleryDealer) => void }) {
  const staff = dealers.filter((item) => item.shopNo === "450554");
  const totalListings = staff.reduce((sum, item) => sum + item.listingCount, 0);
  return <section className="dp-content-card dp-affiliated" aria-labelledby="dp-affiliated-title">
    <div className="dp-affiliated-company">
      <img src={asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt="서울오토갤러리 전경" draggable={false} />
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
        <span><b>{item.name}{item.name === currentDealer.name ? <em>현재</em> : null}</b><small>{item.role} · 투제이모터웍스</small><small>종사원번호 {item.employeeNo}</small></span>
        <strong>매물 보기</strong>
      </button>)}
    </div>
  </section>;
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

function AboutSection({ dealer, notify }: { dealer: SeoulAutoGalleryDealer; notify: (message: string) => void }) {
  const introduction = dealer.empNo === "1"
    ? MOCK.intro
    : `서울오토갤러리 은관 (주)투제이모터웍스 소속 ${dealer.name} 딜러입니다. 차량 상태와 이력을 꼼꼼히 확인하고 정확한 정보로 상담드리겠습니다.`;
  return <section className="dp-content-card dp-about">
    <h2>소개</h2>
    <article className="dp-about-story">
      <header><img src={dealerPhoto(dealer)} alt="" aria-hidden="true" draggable={false} /><span><b>{dealer.name}</b><small>{MOCK.company} · 딜러 경력 7년</small></span></header>
      <p>{introduction}</p>
    </article>
    <dl>
      <div><dt>전문 분야</dt><dd>수입차</dd></div>
      <div><dt>활동 지역</dt><dd>{MOCK.address}</dd></div>
      <div><dt><DealerIcon name="clock" />응답 시간</dt><dd>{MOCK.response}</dd></div>
      <div><dt><DealerIcon name="calendar" />딜러 경력</dt><dd>7년</dd></div>
      <div><dt><DealerIcon name="dealership" />소속 상사</dt><dd>{MOCK.company}</dd></div>
      <div><dt>종사원 번호</dt><dd>{dealer.employeeNo ?? MOCK.employeeNo}</dd></div>
      <div><dt>상사 허가번호</dt><dd>{MOCK.licenseNo}</dd></div>
      <div><dt>사업자 번호</dt><dd>{MOCK.businessNo}</dd></div>
      <div><dt><DealerIcon name="phone" />상사 연락처</dt><dd><a href={`tel:${MOCK.phone.replaceAll("-", "")}`}>{MOCK.phone}</a></dd></div>
      <div><dt><DealerIcon name="email" />이메일</dt><dd><button type="button" className="dp-about-link" onClick={() => notify("딜러 이메일 문의를 준비 중이에요")}>{MOCK.email}</button></dd></div>
      <div><dt>팩스</dt><dd>{MOCK.fax}</dd></div>
      <div><dt>소속 직원</dt><dd>{MOCK.staff}</dd></div>
    </dl>
  </section>;
}

function Footer() {
  return <footer className="dp-footer"><div className="dp-footer-brand"><img src={bobaeAsset("9546-imgLogo.svg")} alt="보배드림" /><span>믿을 수 있는 자동차 거래</span></div><div className="dp-footer-links"><span>회사소개</span><span>이용약관</span><span>개인정보처리방침</span><span>고객센터</span></div><small>© BOBae Network. All rights reserved.</small></footer>;
}

function DealerProfilePage({ dealer, cars }: { dealer: SeoulAutoGalleryDealer; cars: Car[] }) {
  const [following, setFollowing] = useState(true);
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
    window.location.assign(`${target.pathname}${target.search}${target.hash}`);
  };
  const changeSection = (section: SectionId) => {
    setActiveSection(section);
    const root = scrollRef.current;
    const nav = root?.querySelector<HTMLElement>(".dp-anchor-nav");
    if (root && nav && nav.getBoundingClientRect().top < 50) root.scrollTo({ top: nav.offsetTop - 50, behavior: "smooth" });
  };

  return <div className="dp-root">
    <div className="dp-scroll" ref={scrollRef}>
      <SiteHeader />
      <main className="dp-page" aria-label={`${dealer.name} 딜러 판매자 페이지`}>
        <DealerProfile dealer={dealer} cars={cars} following={following} setFollowing={setFollowing} notify={notify} />
        <AnchorNav active={activeSection} onChange={changeSection} />
        {activeSection === "home" ? <HomeSection /> : null}
        {activeSection === "ads" ? <ListingsSection cars={cars} mode={mode} setMode={setMode} onOpen={openListing} /> : null}
        {activeSection === "community" ? <CommunitySection cars={cars} notify={notify} /> : null}
        {activeSection === "valuation" ? <ValuationSection dealer={dealer} notify={notify} /> : null}
        {activeSection === "reviews" ? <RatingsSection cars={cars} /> : null}
        {activeSection === "social" ? <SocialFeedSection cars={cars} /> : null}
        {activeSection === "dealers" ? <AffiliatedDealersSection currentDealer={dealer} onOpenDealer={openDealer} /> : null}
        {activeSection === "intro" ? <AboutSection dealer={dealer} notify={notify} /> : null}
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
