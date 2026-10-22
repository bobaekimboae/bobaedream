import { useEffect, useRef, useState } from "react";
import "./main-home.css";

const bbmAsset = (path: string) => ["assets", "bbm", path].join("/");

const vehicleIcon = (name: string) => `./prototypes/autotrader-bobaedream-main/category-vehicles-v3/${name}-left-v01.png`;
const categoryItems = [
  { label: "숏폼카", icon: "short", category: "중고차" },
  { label: "국산차", icon: "domestic", category: "중고차", image: vehicleIcon("domestic") },
  { label: "수입차", icon: "import", category: "수입차", image: vehicleIcon("imported") },
  { label: "화물·특장", icon: "truck", category: "트럭 · 특장", image: vehicleIcon("truck") },
  { label: "전기차", icon: "electric", category: "전기차", image: vehicleIcon("electric") },
  { label: "바이크", icon: "bike", category: "바이크", image: vehicleIcon("bike") },
  { label: "슈퍼카", icon: "super", category: "수입차", image: "./prototypes/autotrader-bobaedream-main/autotrader-body-types-v2/coupe.png" },
  { label: "올드카", icon: "old", category: "올드카", image: bbmAsset("generated/quickfilter-v01/car_mercedes_gclass_w460_v01.png") },
  { label: "캠핑카", icon: "camping", category: "캠핑카", image: vehicleIcon("camper") },
  { label: "더보기", icon: "more", category: "more" },
];

const shortformItems = [
  {
    rank: 1,
    image: bbmAsset("generated/quickfilter-v01/car_mercedes_gclass_w465_v01.png"),
    title: "포드 머스탱 코스트 67",
    description: "맞춤 제작된 클래식의 정석",
    author: "조이모터스 이인걸",
  },
  {
    rank: 2,
    image: bbmAsset("generated/quickfilter-v01/car_mercedes_gclass_w460_v01.png"),
    title: "로터스 에미라 V6",
    description: "AMG와 협업한 6기통 괴물 엔진",
    author: "벤츠인증중고차",
  },
];

const communityPosts = [
  ["대패 삼겹살 개발자.", "3241"],
  ["남자들이 여자 배 만지는걸 좋아하는 이유", "248"],
  ["아스날 교수님 렌즈를 통해본 손흥민", "248"],
  ["실시간 국뽕타임 손 흥 민", "248"],
  ["경기도 중학교 운동회 도중 경찰이 출동했어요.", "248"],
  ["출소 후 다시 찾아온 성폭행범 불태운 엄마", "248"],
  ["컬러화한 광복군 창설식 사진", "248"],
  ["30년 다닌 직장에서 퇴직금 갖고 장난치는것 같습니다...", "248"],
  ["손흥민에 대해 엄청난 리스펙을 보이는 제이미 캐러거", "248"],
  ["팁으로 50달러 받고 빡친 이유", "248"],
];

export default function MainHome() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState("");
  const [popularRange, setPopularRange] = useState("1~10위");
  const [hidePolitics, setHidePolitics] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const openCommunity = () => { window.location.href = "./community/bobaedream-pc-board-list.html?layout=reddit"; };
  const navigateToListing = ({ query, category }: { query?: string; category?: string } = {}) => {
    const params = new URLSearchParams({ qf: "guazi" });
    if (query?.trim()) params.set("q", query.trim());
    if (category && category !== "중고차") params.set("category", category);
    window.location.href = `./?${params.toString()}`;
  };
  const showPreparing = (message: string) => setToast(message);

  return (
    <div className="main-home-stage">
      <main className="main-home" aria-label="보배드림 모바일 메인 시안 2">
        <header className="mh-header">
          <a className="mh-brand" href="./?home=1" aria-label="보배드림 홈">
            <img src={bbmAsset("main-home-logo.svg")} alt="보배드림" />
          </a>
          <div className="mh-header-actions">
            <button type="button" aria-label="검색창으로 이동" onClick={() => searchRef.current?.focus()}><img src={bbmAsset("header-search.svg")} alt="" /></button>
            <button type="button" aria-label="전체 메뉴" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><img src={bbmAsset("header-menu.svg")} alt="" /></button>
          </div>
        </header>

        <nav className="mh-primary-nav" aria-label="주요 메뉴">
          <a className="is-active" href="./?home=1" aria-current="page">홈</a>
          <button type="button" onClick={() => document.getElementById("today-shortform")?.scrollIntoView({ behavior: "smooth" })}>숏폼카</button>
          <button type="button" onClick={() => navigateToListing()}>차량 검색</button>
          <button type="button" onClick={() => showPreparing("내차팔기 등록 화면을 준비 중입니다.")}>내차팔기</button>
          <button type="button" onClick={openCommunity}>커뮤니티</button>
        </nav>

        <form className="mh-search-wrap" role="search" onSubmit={(event) => { event.preventDefault(); navigateToListing({ query: searchQuery }); }}>
          <label className="mh-search-box">
            <img src={bbmAsset("header-search.svg")} alt="" aria-hidden="true" />
            <input ref={searchRef} type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.currentTarget.value)} placeholder="원하는 차량을 검색하세요" aria-label="차량 검색" />
          </label>
        </form>

        <section className="mh-category-grid" aria-label="차량 서비스">
          {categoryItems.map((item) => (
            <button key={item.label} type="button" onClick={() => item.category === "more" ? setMenuOpen(true) : navigateToListing({ category: item.category })}>
              <span className={`mh-category-icon is-${item.icon}`} aria-hidden="true">
                {item.image ? <img src={item.image} alt="" /> : null}
                {item.icon === "more" ? <><i /><i /><i /><i /></> : null}
              </span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </section>

        <div className="mh-section-divider" />

        <section className="mh-content-section mh-shortform" id="today-shortform" aria-labelledby="mh-shortform-title">
          <header className="mh-section-title"><h2 id="mh-shortform-title">오늘의 숏폼카</h2><button type="button" onClick={() => showPreparing("숏폼카 전체 목록을 준비 중입니다.")}>더보기</button></header>
          <div className="mh-shortform-list">
            {shortformItems.map((item) => (
              <button className="mh-shortform-row" type="button" key={item.rank} onClick={() => showPreparing(`${item.title} 영상을 준비 중입니다.`)}>
                <span className="mh-shortform-thumb"><img src={item.image} alt="" /></span>
                <span className="mh-shortform-copy">
                  <strong><em>{item.rank}</em>{item.title}</strong>
                  <span>{item.description}</span>
                  <small>{item.author} · 조회 <b>30,000</b></small>
                </span>
              </button>
            ))}
          </div>
        </section>

        <div className="mh-section-divider" />

        <section className="mh-content-section mh-community" aria-labelledby="mh-community-title">
          <header className="mh-section-title">
            <h2 id="mh-community-title">커뮤니티 인기글</h2>
            <label className="mh-politics-toggle"><input type="checkbox" checked={hidePolitics} onChange={(event) => setHidePolitics(event.currentTarget.checked)} /><span aria-hidden="true" />정치 X</label>
          </header>
          <div className="mh-popular-tabs" role="tablist" aria-label="인기글 기간">
            {["1~10위", "11~20위", "실시간", "어제", "주간", "댓글순"].map((label) => <button key={label} type="button" className={popularRange === label ? "is-active" : ""} onClick={() => setPopularRange(label)}>{label}</button>)}
          </div>
          <ol className="mh-popular-list">
            {communityPosts.map(([title, comments], index) => <li key={title}><button type="button" onClick={openCommunity}><b>{index + 1}</b><span>{title}</span><em>[{comments}]</em></button></li>)}
          </ol>
        </section>

        {menuOpen ? <div className="mh-menu-layer">
          <button className="mh-menu-dim" type="button" aria-label="전체 메뉴 닫기" onClick={() => setMenuOpen(false)} />
          <aside className="mh-menu-panel" role="dialog" aria-modal="true" aria-labelledby="mh-menu-title">
            <header><h2 id="mh-menu-title">전체 메뉴</h2><button type="button" aria-label="닫기" onClick={() => setMenuOpen(false)}><img src={bbmAsset("m-full-close.svg")} alt="" /></button></header>
            <nav aria-label="전체 서비스">
              <button type="button" onClick={() => navigateToListing()}><strong>차량 검색</strong><span>국산·수입 중고차 찾기</span></button>
              <button type="button" onClick={openCommunity}><strong>커뮤니티</strong><span>자동차 이야기와 실시간 피드</span></button>
              <button type="button" onClick={() => navigateToListing({ category: "트럭 · 특장" })}><strong>화물·특장</strong><span>화물차와 특장차 매물</span></button>
              <button type="button" onClick={() => navigateToListing({ category: "바이크" })}><strong>바이크</strong><span>모터사이클 매물</span></button>
              <button type="button" onClick={() => navigateToListing({ category: "캠핑카" })}><strong>캠핑카</strong><span>캠핑카와 트레일러 매물</span></button>
            </nav>
          </aside>
        </div> : null}
        {toast ? <div className="mh-toast" role="status">{toast}</div> : null}
      </main>
    </div>
  );
}
