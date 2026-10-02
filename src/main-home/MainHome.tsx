import { useState } from "react";
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
  const openListing = () => {
    if (activeService === "all" || activeService === "used-car") window.location.href = "./?qf=guazi&filtericon=notion";
  };

  return (
    <div className="main-home-stage">
      <main className="main-home" aria-label="보배드림 중고차 메인">
        <header className="mh-topbar">
          <a className="mh-logo" href="./" aria-label="보배드림 홈"><span className="mh-title">보배드림</span></a>
          <div className="mh-top-icons">
            <button type="button" aria-label="즐겨찾기"><img src={prototypeAsset("icons/favorite.svg")} alt="" /></button>
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

        <form className="mh-search-strip" role="search" onSubmit={(event) => { event.preventDefault(); openListing(); }}>
            <label className="mh-search-field">
              <img src={prototypeAsset("icons/search.svg")} alt="" aria-hidden="true" />
              <input type="search" aria-label="중고차 검색" placeholder="어떤 차량을 찾고 있나요?" />
            </label>
        </form>

        <section className="mh-section mh-category-section" aria-labelledby="mh-body-title">
          <div className="mh-section-head"><h2 id="mh-body-title">차량 카테고리</h2><ArrowLink>전체보기</ArrowLink></div>
          <div className="mh-body-rail" aria-label="차량 카테고리 가로 목록">
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
