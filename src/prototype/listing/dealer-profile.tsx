import { useEffect, useRef, useState } from "react";
import { MobileScroll, useFlow } from "../../mobile";
import { asset, type Car } from "../data";
import type { SeoulAutoGalleryDealer } from "./seoul-auto-gallery-dealer-rail";
import "./dealer-profile.css";

type DealerProfileTab = "store" | "activity" | "inventory" | "reviews" | "info";

const tabs: Array<{ id: DealerProfileTab; label: string }> = [
  { id: "store", label: "상점" },
  { id: "activity", label: "활동" },
  { id: "inventory", label: "판매 차량" },
  { id: "reviews", label: "후기" },
  { id: "info", label: "정보" },
];

const policies = [
  "실매물 여부를 확인합니다",
  "차량 이력을 투명하게 안내합니다",
  "성능·상태 기록을 고지합니다",
  "사고·보험 이력을 안내합니다",
  "이전등록 절차를 안내합니다",
  "계약 조건을 사전에 설명합니다",
  "방문 상담 예약을 지원합니다",
  "개인정보를 안전하게 관리합니다",
];

const iconPath = (name: string) => `${import.meta.env.BASE_URL}icons/chotot/${name}`;

function ChototIcon({ name, className }: { name: string; className?: string }) {
  return <img className={`chotot-icon${className ? ` ${className}` : ""}`} src={iconPath(name)} alt="" aria-hidden="true" draggable={false} />;
}

function RightChevron() {
  return <ChototIcon name="chotot-pc-detail-chevron-right-white-bg.svg" className="is-chevron" />;
}

function PolicyList({ compact = false }: { compact?: boolean }) {
  return <section className={`dealer-policy-card${compact ? " is-compact" : ""}`} aria-labelledby={compact ? "dealer-policy-info-title" : "dealer-policy-title"}>
    <h2 id={compact ? "dealer-policy-info-title" : "dealer-policy-title"}>안심 거래 정책</h2>
    <div>{policies.map((policy) => <p key={policy}><ChototIcon name="chotot-list-detail-verified-check-circle.svg" />{policy}</p>)}</div>
  </section>;
}

function DealerInventoryRows({ cars, onOpenCar }: { cars: Car[]; onOpenCar: (car: Car) => void }) {
  return <div className="dealer-inventory-list">{cars.slice(0, 8).map((car) => (
    <button key={car.id} type="button" className="dealer-inventory-row" onClick={() => onOpenCar(car)}>
      <img src={asset(car.image)} alt={`${car.title} ${car.trim}`} draggable={false} />
      <span className="dealer-inventory-copy">
        <strong>{car.title}</strong>
        <small>{car.trim} · {car.specs.slice(0, 2).join(" · ")}</small>
        <b>{car.price}</b>
      </span>
      <RightChevron />
    </button>
  ))}</div>;
}

function DealerActivity({ dealer, cars }: { dealer: SeoulAutoGalleryDealer; cars: Car[] }) {
  return <section className="dealer-profile-section is-tab dealer-post-list"><h2>최근 활동</h2>{cars.slice(0, 3).map((car, index) => <article key={car.id} className="dealer-post-card">
    <header><img src={asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`)} alt="" aria-hidden="true" /><span><strong>{dealer.name}</strong><small>{index === 0 ? "최근 업데이트" : `${index + 1}주 전`}</small></span></header>
    <p>{index === 0 ? "새 매물의 차량 상태와 주요 옵션을 확인해 판매 정보를 업데이트했습니다." : `${car.title} 상담과 방문 예약이 가능합니다. 차량 이력과 상태를 꼼꼼히 안내해 드립니다.`}</p>
    <img className="dealer-post-image" src={asset(car.image)} alt={`${car.title} 판매 차량`} />
    <footer><span>좋아요 {index}</span><span>문의 {index + 1}</span><button type="button"><ChototIcon name="chotot-list-detail-chat.svg" />채팅</button></footer>
  </article>)}</section>;
}

function DealerStore({ dealer, cars, onOpenTab, onOpenCar }: { dealer: SeoulAutoGalleryDealer; cars: Car[]; onOpenTab: (tab: DealerProfileTab) => void; onOpenCar: (car: Car) => void }) {
  return <>
    <section className="dealer-profile-section dealer-store-intro">
      <div className="dealer-section-head"><h2>소개</h2><button type="button" onClick={() => onOpenTab("info")}>더보기 <RightChevron /></button></div>
      <p className="dealer-intro">서울오토갤러리의 수입차 매물을 직접 확인하고 차량 상태, 이력과 구매 절차를 이해하기 쉽게 안내합니다.</p>
    </section>
    <section className="dealer-profile-section">
      <div className="dealer-section-head"><h2>판매 차량</h2><button type="button" onClick={() => onOpenTab("inventory")}>전체 {dealer.listingCount}대 <RightChevron /></button></div>
      <DealerInventoryRows cars={cars.slice(0, 3)} onOpenCar={onOpenCar} />
    </section>
    <section className="dealer-profile-section">
      <div className="dealer-section-head"><h2>최근 활동</h2><button type="button" onClick={() => onOpenTab("activity")}>더보기 <RightChevron /></button></div>
      <article className="dealer-activity-preview"><img src={asset(cars[0]?.image ?? "seoul-auto-gallery/header/building-bluehour-v01.png")} alt="" aria-hidden="true" /><span><strong>새 매물을 점검했습니다</strong><small>차량 상태와 주요 옵션을 업데이트했습니다.</small></span></article>
    </section>
  </>;
}

function DealerInfo({ cars }: { cars: Car[] }) {
  return <section className="dealer-profile-section is-tab"><h2>상점 정보</h2><p className="dealer-intro">서울오토갤러리에서 수입차를 전문으로 안내합니다. 매물 상태와 차량 이력을 확인한 뒤 정확한 정보를 전달합니다.</p><div className="dealer-gallery" aria-label="상점 판매 차량 미리보기">{cars.slice(0, 4).map((car) => <img key={car.id} src={asset(car.image)} alt="" aria-hidden="true" />)}</div><dl className="dealer-info-list"><div><dt><ChototIcon name="chotot-list-detail-response-rate.svg" />응답</dt><dd>영업시간 내 순차 답변</dd></div><div><dt><ChototIcon name="chotot-profile-membership-period.svg" />운영 기간</dt><dd>서울오토갤러리 인증 상점</dd></div><div><dt><ChototIcon name="chotot-common-clock.svg" />활동 시간</dt><dd>판매 차량 정보 수시 갱신</dd></div><div><dt><ChototIcon name="chotot-list-detail-address-location.svg" />주소</dt><dd>서울특별시 서초구 양재대로11길 36</dd></div></dl><PolicyList compact /></section>;
}

function DealerTabContent({ tab, dealer, cars, onOpenTab, onOpenCar }: { tab: DealerProfileTab; dealer: SeoulAutoGalleryDealer; cars: Car[]; onOpenTab: (tab: DealerProfileTab) => void; onOpenCar: (car: Car) => void }) {
  if (tab === "store") return <DealerStore dealer={dealer} cars={cars} onOpenTab={onOpenTab} onOpenCar={onOpenCar} />;
  if (tab === "activity") return <DealerActivity dealer={dealer} cars={cars} />;
  if (tab === "inventory") return <section className="dealer-profile-section is-tab"><div className="dealer-section-head"><h2>판매 차량</h2><span>{dealer.listingCount}대</span></div><div className="dealer-filter-chips" aria-label="판매 차량 필터"><button type="button">차종</button><button type="button">가격</button><button type="button">연식</button></div><DealerInventoryRows cars={cars} onOpenCar={onOpenCar} /></section>;
  if (tab === "reviews") return <section className="dealer-profile-section is-tab"><h2>구매 후기</h2><div className="dealer-rating-summary"><strong>4.8</strong><span><span className="dealer-stars" aria-label="별점 4.8점">{Array.from({ length: 5 }, (_, index) => <ChototIcon key={index} name="chotot-list-detail-review-star.svg" />)}</span><small>친절한 설명 · 빠른 응답</small></span></div><div className="dealer-empty-state"><ChototIcon name="chotot-list-detail-review-star.svg" /><strong>검증된 상담 후기를 준비하고 있어요</strong><p>실제 거래가 확인된 후기만 보여드릴 예정입니다.</p></div></section>;
  return <DealerInfo cars={cars} />;
}

export function DealerProfileScreen({ dealer, cars, onOpenCar }: { dealer: SeoulAutoGalleryDealer; cars: Car[]; onOpenCar: (car: Car) => void }) {
  const flow = useFlow();
  const [tab, setTab] = useState<DealerProfileTab>("store");
  const [following, setFollowing] = useState(false);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { activeTabRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); }, [tab]);

  return <MobileScroll className="dealer-profile-scroll">
    <main className="dealer-profile-page" aria-label={`${dealer.name} 전문상점`}>
      <header className="dealer-profile-header">
        <button type="button" aria-label="딜러 목록으로 돌아가기" onClick={() => flow.pop()}><ChototIcon name="chotot-pc-detail-chevron-left-white-bg.svg" /></button>
        <strong>{dealer.name}</strong>
        <span className="dealer-header-actions"><button type="button" aria-label="상점 공유"><ChototIcon name="chotot-common-share.svg" /></button><button type="button" aria-label="판매자 신고"><ChototIcon name="chotot-common-report-profile.svg" /></button></span>
      </header>
      <div className="dealer-profile-layout">
        <aside className="dealer-profile-summary">
          <div className="dealer-cover"><img src={asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt="" aria-hidden="true" /><span><ChototIcon name="chotot-common-clock.svg" />최근 활동</span></div>
          <div className="dealer-identity">
            <span className="dealer-profile-avatar" aria-hidden="true"><img src={asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`)} alt="" draggable={false} /></span>
            <div className="dealer-profile-actions"><button type="button" aria-label="상점 공유"><ChototIcon name="chotot-common-share.svg" />공유</button><button type="button" className={following ? "is-following" : undefined} aria-pressed={following} onClick={() => setFollowing((value) => !value)}><ChototIcon name={following ? "chotot-list-detail-following.svg" : "chotot-list-detail-follow.svg"} />{following ? "팔로잉" : "팔로우"}</button></div>
            <h1>{dealer.name} <ChototIcon name="chotot-list-detail-verified-dealer-wavy-badge.svg" /></h1>
            <p className="dealer-rating"><ChototIcon name="chotot-list-detail-review-star.svg" />4.8 <button type="button" onClick={() => setTab("reviews")}>(후기 보기)</button></p>
            <p className="dealer-address"><ChototIcon name="chotot-list-detail-address-location.svg" />서울특별시 서초구 양재대로11길 36, 서울오토갤러리</p>
          </div>
          <dl className="dealer-metrics"><div><dt>판매 완료</dt><dd>12</dd></div><div><dt><ChototIcon name="chotot-list-detail-followers.svg" />팔로워</dt><dd>26</dd></div><div><dt>판매 중</dt><dd>{dealer.listingCount}</dd></div></dl>
          <PolicyList />
          <button type="button" className="dealer-profile-summary-contact"><ChototIcon name="chotot-list-detail-phone.svg" /><span><strong>02-2059-5000</strong><small>전화번호 보기</small></span></button>
        </aside>
        <div className="dealer-profile-main">
          <nav className="dealer-profile-tabs" role="tablist" aria-label="상점 메뉴">{tabs.map((item) => <button key={item.id} ref={tab === item.id ? activeTabRef : undefined} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-selected" : undefined} onClick={() => setTab(item.id)}>{item.label}</button>)}</nav>
          <DealerTabContent tab={tab} dealer={dealer} cars={cars} onOpenTab={setTab} onOpenCar={onOpenCar} />
        </div>
      </div>
    </main>
  </MobileScroll>;
}

export function DealerContactBar() {
  return <div className="dealer-contact-bar" aria-label="상점 연락 방법"><button type="button"><ChototIcon name="chotot-list-detail-chat.svg" />채팅</button><button type="button"><ChototIcon name="chotot-list-detail-phone.svg" />전화 상담</button></div>;
}
