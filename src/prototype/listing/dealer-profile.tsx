import { useEffect, useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ChatBubbleIcon,
  ChevronRightIcon,
  HeartFilledIcon,
  HeartIcon,
  MobileIcon,
  Share2Icon,
  StarFilledIcon,
} from "@radix-ui/react-icons";
import { MobileScroll, useFlow } from "../../mobile";
import { asset, type Car } from "../data";
import type { SeoulAutoGalleryDealer } from "./seoul-auto-gallery-dealer-rail";
import "./dealer-profile.css";

type DealerProfileTab = "home" | "activity" | "inventory" | "reviews" | "info";

const tabs: Array<{ id: DealerProfileTab; label: string }> = [
  { id: "home", label: "홈" },
  { id: "activity", label: "활동" },
  { id: "inventory", label: "판매 차량" },
  { id: "reviews", label: "후기" },
  { id: "info", label: "정보" },
];

function DealerInventoryRows({ cars, onOpenCar }: { cars: Car[]; onOpenCar: (car: Car) => void }) {
  return <div className="dealer-inventory-list">{cars.slice(0, 5).map((car) => (
    <button key={car.id} type="button" className="dealer-inventory-row" onClick={() => onOpenCar(car)}>
      <img src={asset(car.image)} alt="" aria-hidden="true" draggable={false} />
      <span className="dealer-inventory-copy">
        <strong>{car.title}</strong>
        <small>{car.trim} · {car.specs.slice(0, 2).join(" · ")}</small>
        <b>{car.price}</b>
      </span>
      <ChevronRightIcon aria-hidden="true" />
    </button>
  ))}</div>;
}

function DealerHome({ dealer, cars, onOpenTab, onOpenCar }: { dealer: SeoulAutoGalleryDealer; cars: Car[]; onOpenTab: (tab: DealerProfileTab) => void; onOpenCar: (car: Car) => void }) {
  return <>
    <section className="dealer-promo" aria-label="딜러 안내">
      <div><span>안심 상담</span><strong>차량의 상태와 이력을<br />투명하게 안내합니다</strong></div>
      <img src={asset("seoul-auto-gallery/header/sag-mark-banner-v02.png")} alt="" aria-hidden="true" />
    </section>
    <section className="dealer-profile-section">
      <div className="dealer-section-head"><h2>딜러 소개</h2><button type="button" onClick={() => onOpenTab("info")}>더보기 <ChevronRightIcon /></button></div>
      <p className="dealer-intro">서울오토갤러리의 수입차 매물을 꼼꼼히 확인하고, 필요한 정보만 이해하기 쉽게 안내합니다.</p>
    </section>
    <section className="dealer-profile-section">
      <div className="dealer-section-head"><h2>판매 차량</h2><button type="button" onClick={() => onOpenTab("inventory")}>전체 {dealer.listingCount}대 <ChevronRightIcon /></button></div>
      <DealerInventoryRows cars={cars} onOpenCar={onOpenCar} />
    </section>
    <section className="dealer-profile-section">
      <div className="dealer-section-head"><h2>최근 활동</h2><button type="button" onClick={() => onOpenTab("activity")}>더보기 <ChevronRightIcon /></button></div>
      <article className="dealer-activity-card"><strong>새 매물을 점검했습니다</strong><p>차량 상태와 주요 옵션을 확인해 판매 차량 정보를 업데이트했습니다.</p><time>최근 업데이트</time></article>
    </section>
  </>;
}

function DealerTabContent({ tab, dealer, cars, onOpenTab, onOpenCar }: { tab: DealerProfileTab; dealer: SeoulAutoGalleryDealer; cars: Car[]; onOpenTab: (tab: DealerProfileTab) => void; onOpenCar: (car: Car) => void }) {
  if (tab === "home") return <DealerHome dealer={dealer} cars={cars} onOpenTab={onOpenTab} onOpenCar={onOpenCar} />;
  if (tab === "activity") return <section className="dealer-profile-section is-tab"><h2>활동</h2><article className="dealer-activity-card"><strong>차량 정보를 새로 확인했습니다</strong><p>판매 중인 차량의 상태, 이력과 옵션 정보를 다시 점검했습니다.</p><time>최근 업데이트</time></article><article className="dealer-activity-card"><strong>상담 가능 차량을 정리했습니다</strong><p>현재 바로 상담 가능한 차량을 판매 목록에 반영했습니다.</p><time>이번 주</time></article></section>;
  if (tab === "inventory") return <section className="dealer-profile-section is-tab"><div className="dealer-section-head"><h2>판매 차량</h2><span>{dealer.listingCount}대</span></div><div className="dealer-filter-chips" aria-label="판매 차량 필터"><button type="button">제조사 · 모델</button><button type="button">가격</button><button type="button">연식</button></div><DealerInventoryRows cars={cars} onOpenCar={onOpenCar} /></section>;
  if (tab === "reviews") return <section className="dealer-profile-section is-tab"><h2>후기</h2><div className="dealer-rating-summary"><strong>4.8</strong><span><span className="dealer-stars" aria-label="별점 4.8점"><StarFilledIcon /><StarFilledIcon /><StarFilledIcon /><StarFilledIcon /><StarFilledIcon /></span><small>친절한 설명 · 빠른 응답</small></span></div><div className="dealer-empty-state"><HeartIcon /><strong>검증된 상담 후기를 준비하고 있어요</strong><p>실제 거래가 확인된 후기만 보여드릴 예정입니다.</p></div></section>;
  return <section className="dealer-profile-section is-tab"><h2>정보</h2><p className="dealer-intro">서울오토갤러리에서 수입차를 전문으로 안내합니다. 매물 상태와 차량 이력을 확인한 뒤 정확한 정보를 전달합니다.</p><div className="dealer-gallery" aria-label="딜러 판매 차량 미리보기">{cars.slice(0, 4).map((car) => <img key={car.id} src={asset(car.image)} alt="" aria-hidden="true" />)}</div><dl className="dealer-info-list"><div><dt>응답</dt><dd>영업시간 내 순차 답변</dd></div><div><dt>활동</dt><dd>판매 차량 정보 수시 갱신</dd></div><div><dt>위치</dt><dd>서울오토갤러리</dd></div></dl><div className="dealer-service-grid"><article><HeartFilledIcon /><strong>차량 이력 확인</strong><span>주요 이력과 상태 안내</span></article><article><ChatBubbleIcon /><strong>상담 예약</strong><span>방문 전 상담 지원</span></article></div></section>;
}

export function DealerProfileScreen({ dealer, cars, onOpenCar }: { dealer: SeoulAutoGalleryDealer; cars: Car[]; onOpenCar: (car: Car) => void }) {
  const flow = useFlow();
  const [tab, setTab] = useState<DealerProfileTab>("home");
  const [following, setFollowing] = useState(false);
  const activeTabRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => { activeTabRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" }); }, [tab]);

  return <MobileScroll className="dealer-profile-scroll">
    <main className="dealer-profile-page" aria-label={`${dealer.name} 딜러 프로필`}>
      <header className="dealer-profile-header">
        <button type="button" aria-label="딜러 목록으로 돌아가기" onClick={() => flow.pop()}><ArrowLeftIcon /></button>
        <strong>{dealer.name}</strong>
        <button type="button" aria-label="딜러 프로필 공유"><Share2Icon /></button>
      </header>
      <div className="dealer-profile-layout">
        <aside className="dealer-profile-summary">
          <div className="dealer-cover"><img src={asset("seoul-auto-gallery/header/building-bluehour-v01.png")} alt="" aria-hidden="true" /></div>
          <div className="dealer-identity">
            <span className="dealer-profile-avatar" aria-hidden="true"><img src={asset(`dealer-illustrations/seoul-auto-gallery/v02/suit/${dealer.image}`)} alt="" draggable={false} /></span>
            <button type="button" className={following ? "is-following" : undefined} aria-pressed={following} onClick={() => setFollowing((value) => !value)}>{following ? "팔로잉" : "팔로우"}</button>
            <h1>{dealer.name}</h1>
            <p><StarFilledIcon aria-hidden="true" /> 4.8 · 서울오토갤러리</p>
          </div>
          <dl className="dealer-metrics"><div><dt>판매 중</dt><dd>{dealer.listingCount}</dd></div><div><dt>후기</dt><dd>0</dd></div><div><dt>응답</dt><dd>빠름</dd></div></dl>
        </aside>
        <div className="dealer-profile-main">
          <nav className="dealer-profile-tabs" role="tablist" aria-label="딜러 프로필 메뉴">
            {tabs.map((item) => <button key={item.id} ref={tab === item.id ? activeTabRef : undefined} type="button" role="tab" aria-selected={tab === item.id} className={tab === item.id ? "is-selected" : undefined} onClick={() => setTab(item.id)}>{item.label}</button>)}
          </nav>
          <DealerTabContent tab={tab} dealer={dealer} cars={cars} onOpenTab={setTab} onOpenCar={onOpenCar} />
        </div>
      </div>
    </main>
  </MobileScroll>;
}

export function DealerContactBar() {
  return <div className="dealer-contact-bar" aria-label="딜러 연락 방법"><button type="button"><ChatBubbleIcon /> 메시지</button><button type="button"><MobileIcon /> 전화 상담</button></div>;
}
