import { useEffect, useMemo, useRef, useState } from "react";
import { asset, seoulAutoGalleryCars, type Car } from "../data";
import { dealers, type SeoulAutoGalleryDealer } from "../listing/seoul-auto-gallery-dealer-rail";
import { setPretendard } from "../fonts/pretendard";
import "./dealer-page.css";

// 딜러 화면 재제작(2026-10-11, 총괄 확정 규칙 1~9). 목록 위 덮개가 아닌 독립 화면이다.
// 아이콘은 초톳 원본 파일만 쓰고 asset()(= BASE_URL + assets/)으로 연결한다. 번들에 "/assets/" 글자가 남아야 Pages 배포가 경로를 바꾼다.
const icon = (name: string) => asset(`icons/chotot/${name}`);

type TabId = "store" | "activity" | "ads" | "reviews" | "info";
// isActive=false 인 탭·구역은 구조만 두고 화면에서 숨긴다(총괄 규칙 6).
const tabs: Array<{ id: TabId; label: string; isActive: boolean }> = [
  { id: "store", label: "상점", isActive: true },
  { id: "activity", label: "활동", isActive: false },
  { id: "ads", label: "판매 차량", isActive: true },
  { id: "reviews", label: "평가", isActive: false },
  { id: "info", label: "정보", isActive: true },
];
const sections = { activity: false, reviews: false };

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
  const filled = Math.round(score);
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

function StoreTab({ cars, openTab }: { cars: Car[]; openTab: (tab: TabId) => void }) {
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
    {sections.activity ? null : null}
    <div className="dp-band" aria-hidden="true" />
    <section className="dp-section dp-inventory">
      <h2 className="dp-title-tall">판매 차량 ({cars.length})</h2>
      <FilterPills />
      <InventoryRows cars={cars} limit={5} />
      <button type="button" className="dp-more-box" onClick={() => openTab("ads")}>판매 차량 더보기</button>
    </section>
    {sections.reviews ? null : null}
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
        <div className="dp-cover"><img src={asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt="" draggable={false} /><span>{MOCK.lastActive}</span></div>
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
          {tab === "store" ? <StoreTab cars={cars} openTab={openTab} /> : tab === "ads" ? <InventoryTab cars={cars} /> : <InfoTab cars={cars} />}
        </div>
      </main>
    </div>
    <div className="dp-bar" role="group" aria-label="상점 연락">
      <button type="button" className="is-chat"><Icon name="chotot-list-detail-chat.svg" />채팅</button>
      <button type="button" className="is-call" onClick={() => setToast(`안심번호 ${SAFE_NUMBER}`)}><Icon name="chotot-common-phone-white.svg" />전화 상담</button>
    </div>
    {toast ? <div className="dp-toast" role="status">{toast}</div> : null}
  </div>;
}
