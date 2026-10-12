import { useEffect, useMemo, useRef, useState } from "react";
import { asset, seoulAutoGalleryCars, type Car } from "../data";
import { dealers, type SeoulAutoGalleryDealer } from "../listing/seoul-auto-gallery-dealer-rail";
import { setPretendard } from "../fonts/pretendard";
import "./dealer-page.css";

// 딜러 화면 재제작(2026-10-11, 총괄 확정 규칙 1~9). 목록 위 덮개가 아닌 독립 화면이다.
// 아이콘은 초톳 원본 파일만 쓰고 asset()(= BASE_URL + assets/)으로 연결한다. 번들에 "/assets/" 글자가 남아야 Pages 배포가 경로를 바꾼다.
const icon = (name: string) => asset(`icons/chotot/${name}`);

type TabId = "store" | "posts" | "ads" | "rating" | "info";
// 원본(초톳)에 있는 탭은 숨기지 않고 모두 만든다(2026-10-11 22:15 결정). isActive=false 로 두면 화면에서만 숨길 수 있다.
const tabs: Array<{ id: TabId; label: string; isActive: boolean }> = [
  { id: "store", label: "상점", isActive: true },
  { id: "posts", label: "활동", isActive: true },
  { id: "ads", label: "판매 차량", isActive: true },
  { id: "rating", label: "평가", isActive: true },
  { id: "info", label: "정보", isActive: true },
];

const policies = [
  { icon: "chotot-shop-benefit-shield-icon.png", text: "실매물 확인 보증" },
  { icon: "chotot-shop-benefit-certificate-icon.png", text: "성능·상태 기록 안내" },
  { icon: "chotot-shop-benefit-loan-icon.png", text: "할부·금융 상담 지원" },
  { icon: "chotot-shop-benefit-test-drive-icon.png", text: "시승·방문 상담 지원" },
  { icon: "chotot-shop-benefit-used-car-icon.png", text: "내 차 팔기·매입 상담" },
  { icon: "chotot-shop-benefit-fix-2-icon.png", text: "정비·점검 서비스 안내" },
  { icon: "chotot-shop-benefit-search-icon.png", text: "차량 이력 조회 안내" },
];

// 임시값(MOCK): 실제 데이터가 연결되면 이 상수만 바꾼다. 안심번호(050) 표기이며 모의 데이터의 실제 번호는 쓰지 않는다.
const MOCK = {
  intro: "서울오토갤러리에서 수입차를 전문으로 안내합니다. 매물의 차량 상태와 이력을 직접 확인한 뒤 정확한 정보만 전달해 드립니다. 방문 상담과 시승 예약도 도와드립니다.",
  safeNumber: "0507-1234-5678",
  rating: 4.8,
  reviewCount: 12,
  sold: 12,
  followers: 26,
  lastActive: "최근 활동 6시간 전",
  bannerCarCount: 4,
  responseSpeed: "보통 1시간 이내",
  operatingPeriod: "3년 2개월",
  address: "서울특별시 서초구 양재대로11길 36, 서울오토갤러리",
  // 활동 글(임시). 본문에 실제 전화번호를 넣지 않는다.
  posts: [
    { text: "이번 주 입고 차량 3대를 점검했습니다. 차량 상태와 정비 이력은 방문 상담 때 직접 확인하실 수 있어요.", time: "3일 전", likes: 4, comments: 1 },
    { text: "겨울 전에 타이어와 배터리 점검을 무료로 도와드립니다. 구매 전 시승도 예약 가능합니다.", time: "1주 전", likes: 7, comments: 2 },
    { text: "서울오토갤러리 3층 전시장을 새 단장했습니다. 편하게 방문해 주세요.", time: "2주 전", likes: 3, comments: 0 },
    { text: "수입 SUV 신규 입고. 실매물 확인과 차량 이력 조회를 함께 안내해 드립니다.", time: "1개월 전", likes: 5, comments: 1 },
    { text: "중고차 할부·금융 상담도 한 번에 진행해 드립니다. 궁금한 점은 채팅으로 남겨 주세요.", time: "2개월 전", likes: 2, comments: 0 },
  ],
  // 평가 칩·후기(임시)
  ratingChips: [{ label: "친절해요", count: 8 }, { label: "설명이 자세해요", count: 5 }, { label: "응답이 빨라요", count: 3 }],
  reviews: [
    { name: "김**", role: "구매자", tags: ["친절해요"], score: 5, date: "2026.09.28", text: "차량 상태를 꼼꼼하게 설명해 주셔서 믿고 구매했어요. 응답도 빨랐습니다." },
    { name: "박**", role: "구매자", tags: ["응답이 빨라요"], score: 4, date: "2026.09.12", text: "문의에 바로 답해 주시고 방문 일정도 편하게 잡아 주셨어요." },
  ],
} as const;
const intro = MOCK.intro;
const SAFE_NUMBER = MOCK.safeNumber;

const tabFromUrl = (): TabId => {
  const raw = new URLSearchParams(window.location.search).get("tab");
  const value = raw === "inventory" ? "ads" : raw; // 예전 주소(tab=inventory)도 판매 차량 탭으로 연다
  const found = tabs.find((item) => item.id === value && item.isActive);
  return found ? found.id : "store";
};

function Icon({ name, className }: { name: string; className?: string }) {
  return <img className={`dp-icon${className ? ` ${className}` : ""}`} src={icon(name)} alt="" aria-hidden="true" draggable={false} />;
}

/** 별은 초톳 원본 별 파일을 마스크로 써서 채움/빈 색만 바꾼다(모양은 수정하지 않는다). */
function Stars({ score }: { score: number }) {
  const filled = Math.floor(score); // 초톳은 4.5점도 별 4개 채움 + 1개 회색
  return <span className="dp-stars" aria-label={`별점 ${score}점`}>{Array.from({ length: 5 }, (_, index) => <span key={index} className={`dp-star${index < filled ? " is-on" : ""}`} style={{ maskImage: `url(${icon("chotot-list-detail-review-star.svg")})`, WebkitMaskImage: `url(${icon("chotot-list-detail-review-star.svg")})` }} />)}</span>;
}

function Banners({ cars }: { cars: Car[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const slides = [asset("seoul-auto-gallery/header/building-bluehour-v01.png"), ...cars.slice(0, MOCK.bannerCarCount).map((car) => asset(car.image))];
  const move = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * 330, behavior: "smooth" });
  return <div className="dp-banners">
    <div className="dp-banner-track" ref={ref}>{slides.map((src, index) => <img key={src + index} src={src} alt="" draggable={false} />)}</div>
    <button type="button" className="dp-banner-arrow is-prev" aria-label="이전 배너" onClick={() => move(-1)}><Icon name="chotot-pc-detail-chevron-left-white-bg.svg" /></button>
    <button type="button" className="dp-banner-arrow is-next" aria-label="다음 배너" onClick={() => move(1)}><Icon name="chotot-pc-detail-chevron-right-white-bg.svg" /></button>
  </div>;
}

function PolicyCards() {
  return <div className="dp-policy-track">{policies.map((item) => <div key={item.icon} className="dp-policy-card"><img src={icon(item.icon)} alt="" aria-hidden="true" draggable={false} /><span>{item.text}</span></div>)}</div>;
}

function InventoryRows({ cars, limit }: { cars: Car[]; limit: number }) {
  const [liked, setLiked] = useState<Set<number>>(new Set());
  return <div className="dp-rows">{cars.slice(0, limit).map((car) => (
    <article key={car.id} className="dp-row">
      <img className="dp-row-photo" src={asset(car.listThumb ?? car.image)} alt="" draggable={false} />
      <div className="dp-row-copy">
        <h3>{[car.title, car.trim].filter(Boolean).join(" ")}</h3>
        <b>{car.price}</b>
        <span className="dp-row-time"><Icon name="chotot-common-clock.svg" />{car.posted}</span>
      </div>
      <button type="button" className={`dp-row-like${liked.has(car.id) ? " is-on" : ""}`} aria-label="관심 매물" aria-pressed={liked.has(car.id)} onClick={() => setLiked((set) => { const next = new Set(set); if (next.has(car.id)) next.delete(car.id); else next.add(car.id); return next; })}><Icon name={liked.has(car.id) ? "chotot-common-favorite-selected.svg" : "chotot-common-favorite.svg"} /></button>
    </article>
  ))}</div>;
}

function FilterPills() {
  return <div className="dp-pills"><button type="button">차종<Icon name="chotot-list-detail-dropdown-arrow-region-search.svg" /></button><button type="button">가격<Icon name="chotot-list-detail-dropdown-arrow-region-search.svg" /></button></div>;
}

/** 좋아요·댓글·전화·채팅 알약 버튼(활동 카드 공통). 아이콘은 초톳 원본 파일. */
function ActionPills({ likes, comments, qa, onCall, onChat }: { likes: number; comments: number; qa: "activityAction" | "postAction"; onCall: () => void; onChat: () => void }) {
  const [liked, setLiked] = useState(false);
  return <div className="dp-actions-row">
    <button type="button" className="dp-pill-action" data-qa={qa} aria-pressed={liked} onClick={() => setLiked((v) => !v)}><Icon name="chotot-list-detail-listing-like.svg" /><span>{likes + (liked ? 1 : 0)}</span></button>
    <button type="button" className="dp-pill-action" data-qa={qa}><Icon name="chotot-list-detail-listing-comment.svg" /><span>{comments}</span></button>
    <button type="button" className="dp-pill-action" data-qa={qa} aria-label="전화" onClick={onCall}><Icon name="chotot-list-detail-phone.svg" /></button>
    <button type="button" className="dp-pill-action" data-qa={qa} aria-label="채팅" onClick={onChat}><Icon name="chotot-list-detail-chat.svg" /></button>
  </div>;
}

function PostImage({ cars, index, qa }: { cars: Car[]; index: number; qa: "activityImg" | "postImg" }) {
  const car = cars[index % Math.max(cars.length, 1)];
  return <img className="dp-post-img" data-qa={qa} src={asset(car ? car.image : "seoul-auto-gallery/header/building-bluehour-v01.png")} alt="" draggable={false} />;
}

function ActivitySection({ dealer, cars, openTab, notify }: { dealer: SeoulAutoGalleryDealer; cars: Car[]; openTab: (tab: TabId) => void; notify: (text: string) => void }) {
  const avatar = asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`);
  return <section className="dp-section dp-activity">
    <h2 data-qa="activityTitle">활동</h2>
    <div className="dp-activity-track">{MOCK.posts.slice(0, 4).map((post, index) => (
      <article key={post.time} className="dp-activity-card" data-qa="activityCard">
        <header><img src={avatar} alt="" draggable={false} /><span><b data-qa="activityName">{dealer.name}</b><small data-qa="activityTime">{post.time}</small></span></header>
        <p data-qa="activityBody">{post.text}</p>
        <PostImage cars={cars} index={index} qa="activityImg" />
        <ActionPills likes={post.likes} comments={post.comments} qa="activityAction" onCall={() => notify(`안심번호 ${SAFE_NUMBER}`)} onChat={() => notify("채팅 상담은 준비 중이에요")} />
      </article>
    ))}</div>
    <button type="button" className="dp-link-act" data-qa="activityMore" onClick={() => openTab("posts")}>활동 더보기</button>
  </section>;
}

function PostsTab({ dealer, cars, notify }: { dealer: SeoulAutoGalleryDealer; cars: Car[]; notify: (text: string) => void }) {
  const avatar = asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`);
  return <div className="dp-posts">{MOCK.posts.map((post, index) => (
    <div key={post.time}>
      <article className="dp-post" data-qa="postCard">
        <header><img src={avatar} alt="" data-qa="postAvatar" draggable={false} /><span><b data-qa="postName">{dealer.name}</b><small data-qa="postTime">{post.time}</small></span></header>
        <p data-qa="postBody">{post.text}</p>
        <PostImage cars={cars} index={index} qa="postImg" />
        <ActionPills likes={post.likes} comments={post.comments} qa="postAction" onCall={() => notify(`안심번호 ${SAFE_NUMBER}`)} onChat={() => notify("채팅 상담은 준비 중이에요")} />
      </article>
      <div className="dp-band is-post" aria-hidden="true" />
    </div>
  ))}</div>;
}

/** 평가 요약(점수 · 큰 별 · 평가 칩). 별 모양은 초톳 원본 별 파일을 마스크로 쓰고 채움/빈 색만 바꾼다. */
function RatingSummary() {
  const filled = Math.floor(MOCK.rating);
  const star = `url(${icon("chotot-list-detail-review-star.svg")})`;
  return <div className="dp-rating-sum">
    <div className="dp-score-row">
      <b data-qa="ratingScore">{MOCK.rating}</b>
      <span className="dp-stars-big" aria-label={`별점 ${MOCK.rating}점`}>{Array.from({ length: 5 }, (_, i) => <span key={i} data-qa="ratingStarBig" className={`dp-star-big${i < filled ? " is-on" : ""}`} style={{ maskImage: star, WebkitMaskImage: star }} />)}</span>
    </div>
    <div className="dp-rating-chips" data-qa="ratingChips">{MOCK.ratingChips.map((chip) => <span key={chip.label} className="dp-rating-chip" data-qa="ratingChip">{chip.label} {chip.count}</span>)}</div>
  </div>;
}

type ReviewFilter = "all" | "buyer" | "seller";
const reviewFilters: Array<{ id: ReviewFilter; label: string }> = [{ id: "all", label: "전체" }, { id: "buyer", label: "구매자" }, { id: "seller", label: "판매자" }];

function ReviewList({ cars, limit }: { cars: Car[]; limit: number }) {
  const [filter, setFilter] = useState<ReviewFilter>("all");
  const star = `url(${icon("chotot-list-detail-review-star.svg")})`;
  const shown = MOCK.reviews.filter((review) => filter === "all" || (filter === "buyer" ? (review.role as string) === "구매자" : (review.role as string) === "판매자")).slice(0, limit);
  return <div className="dp-reviews">
    <div className="dp-review-tabs" role="tablist" aria-label="평가 구분">{reviewFilters.map((item) => <button key={item.id} type="button" role="tab" data-qa="reviewTab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)}><span>{item.label}</span></button>)}</div>
    {shown.length === 0 ? <div className="dp-empty"><Icon name="chotot-common-seller-review-write.svg" className="is-empty" /><strong>아직 받은 평가가 없어요</strong></div> : shown.map((review, index) => {
      const car = cars[index % Math.max(cars.length, 1)];
      return <article key={review.date} className="dp-review" data-qa="reviewCard">
        <header>
          <span className="dp-review-avatar"><Icon name="chotot-common-user.svg" /></span>
          <span className="dp-review-who"><b data-qa="reviewName">{review.name}</b><span className="dp-review-tags">{review.tags.map((tag) => <i key={tag} data-qa="reviewTag">{tag}</i>)}</span></span>
        </header>
        <div className="dp-review-meta"><b>{review.score}</b><span className="dp-stars" aria-label={`별점 ${review.score}점`}>{Array.from({ length: 5 }, (_, i) => <span key={i} className={`dp-star${i < review.score ? " is-on" : ""}`} style={{ maskImage: star, WebkitMaskImage: star }} />)}</span><time>{review.date}</time></div>
        <p>{review.text}</p>
        {car ? <div className="dp-review-item" data-qa="reviewItem"><img src={asset(car.listThumb ?? car.image)} alt="" data-qa="reviewItemImg" draggable={false} /><span><span>{car.title}</span><b data-qa="reviewPrice">{car.price}</b></span></div> : null}
      </article>;
    })}
  </div>;
}

function RatingTab({ cars }: { cars: Car[] }) {
  return <section className="dp-section dp-rating-tab">
    <RatingSummary />
    <div className="dp-band is-16" aria-hidden="true" />
    <ReviewList cars={cars} limit={MOCK.reviews.length} />
  </section>;
}

function StoreTab({ dealer, cars, openTab, notify }: { dealer: SeoulAutoGalleryDealer; cars: Car[]; openTab: (tab: TabId) => void; notify: (text: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  return <>
    <Banners cars={cars} />
    <section className="dp-section dp-intro">
      <h2>소개</h2>
      <p className={expanded ? "is-open" : undefined}>{intro}{!expanded ? <button type="button" onClick={() => setExpanded(true)}>… <span>더보기</span></button> : null}</p>
    </section>
    <section className="dp-section dp-policy">
      <h2>정책 · 혜택</h2>
      <PolicyCards />
      <button type="button" className="dp-link-center" onClick={() => openTab("info")}>정보 더보기</button>
    </section>
    <div className="dp-band" aria-hidden="true" />
    <ActivitySection dealer={dealer} cars={cars} openTab={openTab} notify={notify} />
    <div className="dp-band" aria-hidden="true" />
    <section className="dp-section dp-inventory">
      <h2 className="dp-title-tall">판매 차량 ({cars.length})</h2>
      <FilterPills />
      <InventoryRows cars={cars} limit={5} />
      <button type="button" className="dp-more-box" onClick={() => openTab("ads")}>판매 차량 더보기</button>
    </section>
    <div className="dp-band" aria-hidden="true" />
    <section className="dp-section dp-rating-home">
      <RatingSummary />
      <div className="dp-band is-16" aria-hidden="true" />
      <ReviewList cars={cars} limit={2} />
      <button type="button" className="dp-link-center is-review" onClick={() => openTab("rating")}>평가 더보기</button>
    </section>
  </>;
}

function InventoryTab({ cars }: { cars: Car[] }) {
  return <section className="dp-section dp-inventory is-tab">
    <h2 className="dp-title-tall" data-qa="adsTitle">판매 차량 ({cars.length})</h2>
    <FilterPills />
    <InventoryRows cars={cars} limit={cars.length} />
  </section>;
}

function InfoTab({ cars }: { cars: Car[] }) {
  return <>
    <Banners cars={cars} />
    <section className="dp-section dp-intro"><h2>소개</h2><p className="is-open">{intro}</p></section>
    <section className="dp-section dp-info-customer">
      <h2 data-qa="infoTitle">고객 정보</h2>
      <div className="dp-info-box" data-qa="infoBox">
        <div className="dp-info-cells">
          <div className="dp-info-cell" data-qa="infoCell"><span className="dp-info-label" data-qa="infoLabel">응답 속도</span><b className="dp-info-value" data-qa="infoValue">{MOCK.responseSpeed}</b></div>
          <div className="dp-info-cell" data-qa="infoCell"><span className="dp-info-label" data-qa="infoLabel">운영 기간</span><b className="dp-info-value" data-qa="infoValue">{MOCK.operatingPeriod}</b></div>
        </div>
        <div className="dp-info-address"><span className="dp-info-label" data-qa="infoLabel">주소</span><b className="dp-info-value" data-qa="infoValue">{MOCK.address}</b></div>
      </div>
      <h2 data-qa="policyTitle">정책·혜택</h2>
      <div className="dp-policy-grid">{policies.map((item) => <div key={item.icon} className="dp-policy-card is-grid" data-qa="infoPolicyCard"><img src={icon(item.icon)} alt="" aria-hidden="true" draggable={false} /><span>{item.text}</span></div>)}</div>
    </section>
  </>;
}

export default function DealerPage() {
  const params = new URLSearchParams(window.location.search);
  const dealer: SeoulAutoGalleryDealer = dealers.find((item) => item.shopNo === params.get("shop") && item.empNo === (params.get("emp") ?? item.empNo)) ?? dealers[0];
  const [tab, setTab] = useState<TabId>(tabFromUrl);
  const [following, setFollowing] = useState(false);
  const [toast, setToast] = useState("");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cars = useMemo(() => seoulAutoGalleryCars.filter((car) => car.dealer.startsWith(dealer.name)), [dealer.name]);

  useEffect(() => { setPretendard(true); document.title = `${dealer.name} · 서울오토갤러리`; }, [dealer.name]);
  useEffect(() => { document.querySelector<HTMLElement>(".dp-tabs [aria-selected=true]")?.scrollIntoView({ inline: "center", block: "nearest" }); }, [tab]);

  const openTab = (next: TabId) => {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "store") url.searchParams.delete("tab"); else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = `${window.location.pathname}?qf=guazi&category=${encodeURIComponent("서울오토갤러리")}`;
  };
  const notify = (text: string) => { setToast(text); window.setTimeout(() => setToast(""), 1800); };
  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: dealer.name, url });
      else { await navigator.clipboard.writeText(url); setToast("링크를 복사했어요"); window.setTimeout(() => setToast(""), 1800); }
    } catch { /* 공유 취소 */ }
  };

  return <div className="dp-root">
    <div className="dp-scroll" ref={scrollRef}>
      <main className="dp-page" aria-label={`${dealer.name} 상점`}>
        <header className="dp-topbar">
          <button type="button" aria-label="뒤로 가기" onClick={goBack}><Icon name="chotot-pc-detail-chevron-left-white-bg.svg" /></button>
          <strong>{dealer.name}</strong>
          <button type="button" aria-label="공유" onClick={share}><Icon name="chotot-common-share.svg" /></button>
        </header>
        <div className="dp-cover">
          <img className="dp-cover-photo" src={asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt="" draggable={false} />
          <div className="dp-cover-shade" aria-hidden="true" />
          <div className="dp-cover-brand">
            <img src={asset("seoul-auto-gallery/header/sag-mark-banner-v02.png")} alt="" aria-hidden="true" draggable={false} />
            <div><strong>서울오토갤러리</strong><small>수입차 전문 매매단지</small></div>
          </div>
          <span>{MOCK.lastActive}</span>
        </div>
        <section className="dp-head">
          <img className="dp-logo" src={asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`)} alt={`${dealer.name} 프로필`} draggable={false} />
          <div className="dp-actions">
            <button type="button" onClick={share}><Icon name="chotot-common-share.svg" />공유</button>
            <button type="button" aria-pressed={following} onClick={() => setFollowing((value) => !value)}><Icon name={following ? "chotot-list-detail-following.svg" : "chotot-list-detail-follow.svg"} />{following ? "팔로잉" : "팔로우"}</button>
          </div>
          <h1>{dealer.name}<Icon name="chotot-list-detail-verified-dealer-wavy-badge.svg" className="is-badge" /></h1>
          <div className="dp-rating"><b>{MOCK.rating}</b><Stars score={MOCK.rating} /><span>({MOCK.reviewCount}) 평가</span></div>
          <p className="dp-address"><Icon name="chotot-list-detail-address-location.svg" /><span>서울특별시 서초구 양재대로11길 36, 서울오토갤러리</span></p>
          <dl className="dp-stats"><div><dt>판매 완료</dt><dd>{MOCK.sold}</dd></div><div><dt>팔로워</dt><dd>{MOCK.followers + (following ? 1 : 0)}</dd></div><div><dt>판매 중</dt><dd>{cars.length}</dd></div></dl>
        </section>
        <nav className="dp-tabs" role="tablist" aria-label="상점 메뉴">{tabs.filter((item) => item.isActive).map((item) => <button key={item.id} type="button" role="tab" aria-selected={tab === item.id} onClick={() => openTab(item.id)}><span>{item.label}</span></button>)}</nav>
        <div className="dp-body">
          {tab === "store" ? <StoreTab dealer={dealer} cars={cars} openTab={openTab} notify={notify} /> : tab === "posts" ? <PostsTab dealer={dealer} cars={cars} notify={notify} /> : tab === "ads" ? <InventoryTab cars={cars} /> : tab === "rating" ? <RatingTab cars={cars} /> : <InfoTab cars={cars} />}
        </div>
      </main>
    </div>
    <div className="dp-bar" role="group" aria-label="상점 연락">
      <button type="button" className="is-chat"><Icon name="chotot-list-detail-chat.svg" />채팅</button>
      <button type="button" className="is-call" onClick={() => notify(`안심번호 ${SAFE_NUMBER}`)}><Icon name="chotot-common-phone-white.svg" />전화 상담</button>
    </div>
    {toast ? <div className="dp-toast" role="status">{toast}</div> : null}
  </div>;
}
