import { useEffect, useState } from "react";
import "./main-home.css";

type ServiceKey = "all" | "used-car" | "community" | "truck" | "bike" | "construction" | "camping" | "parts";

const prototypeAsset = (path: string) => `./prototypes/autotrader-bobaedream-main/${path}`;
const brandAsset = (path: string) => ["assets", "brand", "kr", path].join("/");
const bbmAsset = (path: string) => ["assets", "bbm", path].join("/");
const luxuryListingAsset = (path: string) => ["assets", "cars", "luxury-ui-test", path].join("/");

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

const vehicleTypes = [
  { value: "중고차", label: "자동차", icon: "category-used.svg" },
  { value: "트럭 · 특장", label: "트럭 · 특장", icon: "category-truck.svg" },
  { value: "바이크", label: "바이크", icon: "category-bike.svg" },
  { value: "캠핑카", label: "캠핑카", icon: "category-camping.svg" },
  { value: "올드카", label: "올드카", icon: "category-old.svg" },
  { value: "건설기계", label: "건설기계", icon: "category-construction.svg" },
  { value: "부품 · 용품", label: "부품 · 용품", icon: "category-equipment.svg" },
];

const luxuryBrands = [
  [brandAsset("porsche.png"), "포르쉐", ""],
  [brandAsset("lamborghini.png"), "람보르기니", ""],
  [brandAsset("ferrari.png"), "페라리", ""],
  [brandAsset("bentley.png"), "벤틀리", "wide"],
  [brandAsset("rolls-royce.png"), "롤스로이스", "tall"],
];

const featuredOffers = [
  {
    image: "001_람보르기니_28635648.jpg",
    title: "람보르기니 우르스 SE 4.0 V8",
    spec: "26년식 · 120km",
    price: "4억 4,500만원",
  },
  {
    image: "011_롤스로이스_28786128.jpg",
    title: "롤스로이스 고스트 6.6 V12 EWB",
    spec: "15년식 · 10.8만km",
    price: "1억 3,500만원",
  },
  {
    image: "021_페라리_28661957.jpg",
    title: "페라리 488 GTB 3.9 V8",
    spec: "18년식 · 2.4만km",
    price: "2억 4,000만원",
  },
];

const ArrowLink = ({ children }: { children: string }) => (
  <span className="mh-more">{children}<img src={prototypeAsset("icons/arrow-right.svg")} alt="" aria-hidden="true" /></span>
);

export default function MainHome() {
  const [activeService, setActiveService] = useState<ServiceKey>("all");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  const openCommunity = () => {
    window.location.href = "./community/bobaedream-pc-board-list.html?layout=reddit";
  };
  const navigateToListing = ({ query, maker, category }: { query?: string; maker?: string; category?: string } = {}) => {
    const params = new URLSearchParams({ qf: "guazi", filtericon: "notion" });
    if (query?.trim()) params.set("q", query.trim());
    if (maker) params.set("maker", maker);
    if (category && category !== "중고차") params.set("category", category);
    window.location.href = `./?${params.toString()}`;
  };
  const openListing = () => navigateToListing();
  const openVehicleType = (value: string) => {
    navigateToListing({ category: value });
  };
  const showPreparing = (message: string) => setToast(message);

  return (
    <div className="main-home-stage">
      <main className="main-home" aria-label="보배드림 중고차 메인">
        <header className="mh-topbar">
          <a className="mh-logo" href="./" aria-label="보배드림 홈"><span className="mh-title">보배드림</span></a>
          <div className="mh-top-icons">
            <button type="button" aria-label="즐겨찾기" onClick={() => showPreparing("찜한 차량 화면을 준비 중입니다.")}><img src={prototypeAsset("icons/favorite.svg")} alt="" /></button>
            <button type="button" aria-label="전체 메뉴" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><img src={prototypeAsset("icons/menu.svg")} alt="" /></button>
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

        <form className="mh-search-strip" role="search" onSubmit={(event) => { event.preventDefault(); navigateToListing({ query: searchQuery }); }}>
            <label className="mh-search-field">
              <img src={prototypeAsset("icons/search.svg")} alt="" aria-hidden="true" />
              <input type="search" aria-label="중고차 검색" placeholder="어떤 차량을 찾고 있나요?" value={searchQuery} onChange={(event) => setSearchQuery(event.currentTarget.value)} />
            </label>
        </form>

        <section className="mh-section mh-category-section" aria-labelledby="mh-body-title">
          <div className="mh-section-head">
            <div className="mh-section-heading-copy"><h2 id="mh-body-title">차량 유형</h2></div>
            <ArrowLink>전체보기</ArrowLink>
          </div>
          <div className="mh-category-rows">
            <div className="mh-category-rail" aria-label="차량 유형 가로 목록">
              {vehicleTypes.map(({ value, label, icon }) => <button className="mh-category-item" type="button" key={value} onClick={() => openVehicleType(value)}><span className="mh-category-image"><img src={bbmAsset(icon)} alt="" aria-hidden="true" /></span><strong>{label}</strong></button>)}
            </div>
            <div className="mh-category-rail mh-luxury-rail" aria-label="럭셔리 제조사 가로 목록">
              {luxuryBrands.map(([image, label, variant]) => <button className="mh-luxury-item" type="button" key={label} onClick={() => navigateToListing({ maker: label })}><span className="mh-luxury-disc"><img className={variant} src={image} alt="" /><strong>{label}</strong></span></button>)}
            </div>
          </div>
        </section>

        <section className="mh-sell-block">
          <button className="mh-sell-card" type="button" onClick={() => showPreparing("내 차 팔기 등록 시안을 준비 중입니다.")}><span><h2>내 차 팔기,<br />빠르고 쉽게</h2><p>간단한 정보 입력으로<br />내 차의 가치를 확인해보세요.</p></span><img src={prototypeAsset("autotrader-body-types-v2/sedan.png")} alt="" /></button>
        </section>

        <section className="mh-section" aria-labelledby="mh-offer-title">
          <div className="mh-section-head">
            <div className="mh-section-heading-copy"><h2 id="mh-offer-title">추천 매물</h2><p>지금 관심 있게 볼 만한 차량이에요</p></div>
            <ArrowLink>전체</ArrowLink>
          </div>
          <div className="mh-offer-rail">
            {featuredOffers.map(({ image, title, spec, price }) => (
              <button className="mh-offer-card" type="button" key={title} onClick={openListing} aria-label={`${title} ${price}`}><div><img src={luxuryListingAsset(image)} alt="" /></div><p><strong>{title}</strong><small>{spec}</small><span>{price}</span></p></button>
            ))}
          </div>
        </section>

        <nav className="mh-bottom-nav" aria-label="모바일 주요 메뉴">
          <a className="is-active" href="./" aria-current="page"><img src={bbmAsset("m-gnb-home.svg")} alt="" /><span>홈</span></a>
          <button type="button" onClick={openListing}><img src={bbmAsset("category-used.svg")} alt="" /><span>매물</span></button>
          <button className="mh-register-nav" type="button" onClick={() => showPreparing("내 차 팔기 등록 시안을 준비 중입니다.")}><b><img src={bbmAsset("m-gnb-register.svg")} alt="" /></b><span>내 차 팔기</span></button>
          <button type="button" onClick={openCommunity}><img src={bbmAsset("m-gnb-community.svg")} alt="" /><span>커뮤니티</span></button>
          <button type="button" onClick={() => showPreparing("찜한 차량 화면을 준비 중입니다.")}><img src={prototypeAsset("icons/favorite.svg")} alt="" /><span>찜</span></button>
        </nav>

        {menuOpen ? <div className="mh-menu-layer">
          <button className="mh-menu-dim" type="button" aria-label="전체 메뉴 닫기" onClick={() => setMenuOpen(false)} />
          <aside className="mh-menu-panel" role="dialog" aria-modal="true" aria-labelledby="mh-menu-title">
            <header><h2 id="mh-menu-title">전체 메뉴</h2><button type="button" aria-label="닫기" onClick={() => setMenuOpen(false)}><img src={bbmAsset("m-full-close.svg")} alt="" /></button></header>
            <nav aria-label="전체 서비스">
              <button type="button" onClick={openListing}><strong>중고차</strong><span>국산·수입 중고차 찾기</span></button>
              <button type="button" onClick={openCommunity}><strong>커뮤니티</strong><span>자동차 이야기와 실시간 피드</span></button>
              <button type="button" onClick={() => showPreparing("트럭·특장 메인 시안을 준비 중입니다.")}><strong>트럭·특장</strong><span>화물차와 특장차 매물</span></button>
              <button type="button" onClick={() => showPreparing("바이크 메인 시안을 준비 중입니다.")}><strong>바이크</strong><span>모터사이클 매물</span></button>
              <button type="button" onClick={() => showPreparing("건설기계 메인 시안을 준비 중입니다.")}><strong>건설기계</strong><span>중장비 매물</span></button>
              <button type="button" onClick={() => showPreparing("부품·용품 메인 시안을 준비 중입니다.")}><strong>부품·용품</strong><span>자동차 관련 용품</span></button>
            </nav>
          </aside>
        </div> : null}
        {toast ? <div className="mh-toast" role="status">{toast}</div> : null}
      </main>
    </div>
  );
}
