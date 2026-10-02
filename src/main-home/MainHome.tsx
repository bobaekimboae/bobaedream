import { useState, type CSSProperties } from "react";
import "./main-home.css";

type ServiceKey = "all" | "used-car" | "community" | "truck" | "bike" | "construction" | "camping" | "parts";

const prototypeAsset = (path: string) => `./prototypes/autotrader-bobaedream-main/${path}`;
const publicAsset = (path: string) => ["assets", path].join("/");
const passengerAsset = (path: string) => ["prototypes", "passenger-body-types", "assets", path].join("/");

const services: Array<{ key: ServiceKey; label: string }> = [
  { key: "all", label: "전체" },
  { key: "used-car", label: "중고차" },
  { key: "community", label: "커뮤니티" },
  { key: "truck", label: "트럭/특장" },
  { key: "bike", label: "바이크" },
  { key: "construction", label: "건설기계" },
  { key: "camping", label: "캠핑카" },
  { key: "parts", label: "부품/용품" },
];

const heroData: Record<ServiceKey, { title: string; copy: string; image: string; cta: string }> = {
  all: { title: "자동차 생활의 모든 것", copy: "매물부터 커뮤니티까지 보배드림에서 한 번에 만나보세요.", image: "hero-types/used-car.jpg", cta: "64대 매물 보기" },
  "used-car": { title: "좋은 차를 찾는 가장 빠른 방법", copy: "내 조건에 맞는 중고차를 바로 찾아보세요.", image: "hero-types/used-car.jpg", cta: "64대 매물 보기" },
  community: { title: "자동차 이야기가 모이는 곳", copy: "유저들의 생생한 경험과 자동차 소식을 확인하세요.", image: "hero-types/used-car.jpg", cta: "커뮤니티 둘러보기" },
  truck: { title: "일을 움직이는 트럭과 특장차", copy: "화물과 특장 매물을 목적에 맞게 찾아보세요.", image: "hero-types/commercial.jpg", cta: "트럭/특장 준비 중" },
  bike: { title: "라이딩을 시작할 바이크 찾기", copy: "스쿠터부터 대형 바이크까지 원하는 조건으로 탐색하세요.", image: "hero-types/bike.jpg", cta: "바이크 준비 중" },
  construction: { title: "현장을 위한 건설기계 찾기", copy: "용도와 작업 조건에 맞는 건설기계를 살펴보세요.", image: "hero-types/commercial.jpg", cta: "건설기계 준비 중" },
  camping: { title: "여행을 넓히는 캠핑카", copy: "카라반부터 모터홈까지 원하는 방식으로 찾아보세요.", image: "hero-types/trailer.jpg", cta: "캠핑카 준비 중" },
  parts: { title: "차를 위한 부품과 용품", copy: "필요한 부품과 자동차 용품을 한곳에서 찾아보세요.", image: "hero-types/used-car.jpg", cta: "부품/용품 준비 중" },
};

const bodyTypes = [
  ["suv.png", "SUV"], ["truck.png", "트럭"], ["sedan.png", "세단"], ["coupe.png", "쿠페"],
  ["minivan.png", "미니밴"], ["hatchback.png", "해치백"], ["convertible.png", "컨버터블"], ["wagon.png", "왜건"],
];

const brands = [
  [prototypeAsset("brand-emblems/hyundai.svg"), "현대", ""],
  [prototypeAsset("brand-emblems/kia.svg"), "기아", "wide"],
  [publicAsset("brand/bmw.svg"), "BMW", ""],
  [publicAsset("brand/benz.png"), "벤츠", ""],
  [publicAsset("brand/audi.svg"), "아우디", "wide"],
  [publicAsset("brand/porsche-symbol.png"), "포르쉐", "porsche"],
];

const ArrowLink = ({ children }: { children: string }) => (
  <span className="mh-more">{children}<img src={prototypeAsset("icons/arrow-right.svg")} alt="" aria-hidden="true" /></span>
);

export default function MainHome() {
  const [activeService, setActiveService] = useState<ServiceKey>("all");
  const hero = heroData[activeService];
  const openListing = () => {
    if (activeService === "all" || activeService === "used-car") window.location.href = "./?qf=guazi&filtericon=notion";
  };

  return (
    <div className="main-home-stage">
      <main className="main-home" aria-label="보배드림 중고차 메인">
        <header className="mh-topbar">
          <a className="mh-logo" href="./" aria-label="보배드림 홈"><img src={publicAsset("bbm/header-logo.svg")} alt="보배드림" /></a>
          <div className="mh-top-icons">
            <button type="button" aria-label="검색"><img src={prototypeAsset("icons/search.svg")} alt="" /></button>
            <button type="button" aria-label="전체 메뉴"><img src={prototypeAsset("icons/menu.svg")} alt="" /></button>
          </div>
        </header>

        <nav className="mh-service-menu" aria-label="서비스 메뉴">
          {services.map((service) => (
            <button
              key={service.key}
              className={`mh-service-chip${activeService === service.key ? " is-active" : ""}`}
              type="button"
              aria-pressed={activeService === service.key}
              onClick={(event) => {
                setActiveService(service.key);
                event.currentTarget.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
              }}
            >{service.label}</button>
          ))}
        </nav>

        <section
          className="mh-hero"
          style={{ backgroundImage: `linear-gradient(180deg, rgba(5,10,20,.2), rgba(5,10,20,.38)), url("${prototypeAsset(hero.image)}")` } as CSSProperties}
        >
          <div className="mh-hero-copy"><h1>{hero.title}</h1><p>{hero.copy}</p></div>
        </section>

        <section className="mh-search-panel" aria-label="매물 검색 패널">
          <div className="mh-search-form">
            <div className="mh-row-2">
              <button className="mh-select-field" type="button"><span>제조사 선택</span><img src={prototypeAsset("icons/chevron-down.svg")} alt="" /></button>
              <button className="mh-select-field is-muted" type="button"><span>모델 선택</span><img src={prototypeAsset("icons/chevron-down.svg")} alt="" /></button>
            </div>
            <button className="mh-select-field" type="button"><span className="mh-select-leading"><img src={prototypeAsset("icons/location.svg")} alt="" /><span>전국</span></span><img src={prototypeAsset("icons/chevron-down.svg")} alt="" /></button>
            <button className="mh-cta" type="button" onClick={openListing}>{hero.cta}</button>
            <button className="mh-advanced-link" type="button">상세 필터</button>
          </div>
        </section>

        <section className="mh-section" aria-labelledby="mh-body-title">
          <div className="mh-section-head"><h2 id="mh-body-title">바디 타입</h2><ArrowLink>전체보기</ArrowLink></div>
          <div className="mh-body-rail" aria-label="바디 타입 가로 목록">
            {bodyTypes.map(([image, label]) => <button className="mh-body-type" type="button" key={label}><span><img src={prototypeAsset(`autotrader-body-types-v2/${image}`)} alt="" /></span><strong>{label}</strong></button>)}
          </div>
        </section>

        <section className="mh-section" aria-labelledby="mh-brand-title">
          <div className="mh-section-head"><h2 id="mh-brand-title">인기 제조사</h2><ArrowLink>더보기</ArrowLink></div>
          <div className="mh-brand-rail" aria-label="인기 제조사">
            {brands.map(([image, label, variant]) => <button className="mh-brand-card" type="button" key={label}><span className={`mh-brand-emblem ${variant}`}><img src={image} alt="" /></span><strong>{label}</strong></button>)}
          </div>
        </section>

        <section className="mh-sell-block">
          <div className="mh-sell-card"><div><h2>내 차 팔기,<br />빠르고 쉽게</h2><p>간단한 정보 입력으로<br />내 차의 가치를 확인해보세요.</p></div><img src={prototypeAsset("autotrader-body-types-v2/sedan.png")} alt="" /></div>
        </section>

        <section className="mh-section" aria-labelledby="mh-offer-title">
          <div className="mh-section-head"><h2 id="mh-offer-title">추천 매물</h2><ArrowLink>전체</ArrowLink></div>
          <div className="mh-offer-rail">
            {[["suv.svg", "BMW X3 xDrive20i", "5,280만원"], ["sedan.svg", "벤츠 E300 AMG", "6,150만원"], ["coupe.svg", "포르쉐 911 Carrera", "1억 6,900만원"]].map(([image, title, price]) => (
              <article className="mh-offer-card" key={title}><div><img src={passengerAsset(image)} alt="" /></div><p><strong>{title}</strong><span>{price}</span></p></article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
