import { useState } from "react";
import "./main-home.css";

type ServiceKey = "all" | "used-car" | "community" | "truck" | "bike" | "construction" | "camping" | "parts";

const prototypeAsset = (path: string) => `./prototypes/autotrader-bobaedream-main/${path}`;
const passengerAsset = (path: string) => ["prototypes", "passenger-body-types", "assets", path].join("/");
const brandAsset = (path: string) => ["assets", "brand", "kr", path].join("/");

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

const vehicleCategories = [
  [prototypeAsset("category-vehicles-v3/domestic-left-v01.png"), "국산차"],
  [prototypeAsset("category-vehicles-v3/imported-left-v01.png"), "수입차"],
  [prototypeAsset("category-vehicles-v3/truck-left-v01.png"), "트럭"],
  [prototypeAsset("category-vehicles-v3/bike-left-v01.png"), "바이크"],
  [prototypeAsset("category-vehicles-v3/electric-left-v01.png"), "전기차"],
  [prototypeAsset("category-vehicles-v3/camper-left-v01.png"), "캠핑카"],
];

const luxuryBrands = [
  [brandAsset("porsche.png"), "포르쉐", ""],
  [brandAsset("lamborghini.png"), "람보르기니", ""],
  [brandAsset("ferrari.png"), "페라리", ""],
  [brandAsset("bentley.png"), "벤틀리", "wide"],
  [brandAsset("rolls-royce.png"), "롤스로이스", "tall"],
];

const ArrowLink = ({ children }: { children: string }) => (
  <span className="mh-more">{children}<img src={prototypeAsset("icons/arrow-right.svg")} alt="" aria-hidden="true" /></span>
);

export default function MainHome() {
  const [activeService, setActiveService] = useState<ServiceKey>("all");
  const openCommunity = () => {
    window.location.href = "./community/index.html";
  };
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
                if (service.key === "community") {
                  openCommunity();
                  return;
                }
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
          <div className="mh-section-head">
            <div className="mh-section-heading-copy"><h2 id="mh-body-title">차량 카테고리</h2></div>
            <ArrowLink>전체보기</ArrowLink>
          </div>
          <div className="mh-category-rows">
            <div className="mh-category-rail" aria-label="차량 유형 가로 목록">
              {vehicleCategories.map(([image, label]) => <button className="mh-category-item" type="button" key={label}><span className="mh-category-image"><img src={image} alt="" /></span><strong>{label}</strong></button>)}
            </div>
            <div className="mh-category-rail mh-luxury-rail" aria-label="럭셔리 제조사 가로 목록">
              {luxuryBrands.map(([image, label, variant]) => <button className="mh-luxury-item" type="button" key={label}><span className="mh-luxury-disc"><img className={variant} src={image} alt="" /><strong>{label}</strong></span></button>)}
            </div>
          </div>
        </section>

        <section className="mh-sell-block">
          <div className="mh-sell-card"><div><h2>내 차 팔기,<br />빠르고 쉽게</h2><p>간단한 정보 입력으로<br />내 차의 가치를 확인해보세요.</p></div><img src={prototypeAsset("autotrader-body-types-v2/sedan.png")} alt="" /></div>
        </section>

        <section className="mh-section" aria-labelledby="mh-offer-title">
          <div className="mh-section-head">
            <div className="mh-section-heading-copy"><h2 id="mh-offer-title">추천 매물</h2><p>지금 관심 있게 볼 만한 차량이에요</p></div>
            <ArrowLink>전체</ArrowLink>
          </div>
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
