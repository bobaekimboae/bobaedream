// 보배드림 바이크 메인 시안 v02 — 영국 Autotrader Bikes 구성 (2026-10-19 「영국 오토트레이더 바이크 메인으로」)
// 진입: /bike/?home=at  (v01 AutoScout24식은 /bike/?home=as24 로 비교용 유지, 기존 /bike/ 목록은 그대로)
// autotrader.co.uk/bikes 1536 실측: 맨 위 차종 글자 줄 → 흰 헤더(로고 · 메뉴 14/500 · 찜 · 로그인) → 사진 1224×280 반경 16
// → 사진에 걸친 검색 카드 800(반경 16 · 그림자 0 2 10 .15, 사기/팔기 탭 빨강 밑줄, 지역 · 제조사 · 모델 · 조건 원 · 「Search N bikes」 둥근 버튼 52)
// → 가운데 32/700 「Your trusted bike marketplace」 → 짙은 남색 「Place an advert」 판 + 사진 → 「buying essentials」 4칸 테두리 카드
// → 「The latest」 3열 둥근 카드 → 소셜 상자 → 맨 위로 → 흰 바닥글. 빨강 밑줄 · 파랑 버튼 자리는 바이크 주황 하나로 쓴다.
// 기사 자료가 없어 「The latest」 자리는 오늘 올라온 매물 카드로 채운다. 매물은 바이크 가상 매물 v08 + v11(550대).
import { useEffect, useMemo, useState } from "react";
import { bikeScenarioV08 } from "../../prototype/bike/scenario-v08";
import { bikeScenarioV11 } from "../../prototype/bike/scenario-v11";
import "./bike-main-autotrader.css";

const pic = (...parts: string[]) => parts.join("/");
const bikeThumb = (file: string) => pic("..", "assets", "bike", "listings", file.startsWith("v11/") ? file.replace("v11/", "v11/thumb/") : file);
type Row = (typeof bikeScenarioV11)[number];
const listUrl = (params: Record<string, string> = {}) => { const q = new URLSearchParams(params).toString(); return `./${q ? `?${q}` : ""}`; };
const mainUrl = (category: string) => `../?${new URLSearchParams({ qf: "guazi", pc: "1", category }).toString()}`;
const regions = ["전국", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];
const won = (krw: number) => {
  const man = Math.round(krw / 10000);
  const eok = Math.floor(man / 10000);
  const rest = man % 10000;
  if (!eok) return `${man.toLocaleString("ko-KR")}만원`;
  return rest ? `${eok}억 ${rest.toLocaleString("ko-KR")}만원` : `${eok}억원`;
};
const km = (n: number) => (n >= 10000 ? `${(Math.round(n / 1000) / 10).toLocaleString("ko-KR")}만km` : `${n.toLocaleString("ko-KR")}km`);
const ago = (d: number) => (d === 0 ? "오늘 등록" : `${d}일 전 등록`);

const Icon = ({ name }: { name: "swap" | "store" | "loan" | "check" }) => {
  const p = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
      {name === "swap" ? <><rect x="14" y="10" width="28" height="36" rx="3" {...p} /><path d="M20 20h16M20 27h16M20 34h9" {...p} /><path d="m34 38 6 6M40 38l-6 6" {...p} /></> : null}
      {name === "store" ? <><path d="M10 22 14 12h28l4 10" {...p} /><path d="M10 22h36v4a6 6 0 0 1-12 0 6 6 0 0 1-12 0 6 6 0 0 1-12 0Z" {...p} /><path d="M13 32v14h30V32M24 46v-8h8v8" {...p} /></> : null}
      {name === "loan" ? <><rect x="10" y="12" width="22" height="30" rx="3" {...p} /><path d="M15 18h12M15 25h3M21 25h3M27 25h0M15 31h3M21 31h3M15 37h3M21 37h3" {...p} /><rect x="28" y="28" width="20" height="14" rx="2" {...p} /><path d="M28 33h20" {...p} /></> : null}
      {name === "check" ? <><rect x="14" y="10" width="28" height="36" rx="3" {...p} /><path d="M22 8h12v6H22Z" {...p} /><path d="m20 24 3 3 5-5M20 35l3 3 5-5M31 25h6M31 36h6" {...p} /></> : null}
    </svg>
  );
};

export default function BikeMainAutotrader() {
  const rows = useMemo(() => [...bikeScenarioV08, ...bikeScenarioV11] as Row[], []);
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [region, setRegion] = useState("전국");
  const [maker, setMaker] = useState("");
  const [model, setModel] = useState("");
  const [toast, setToast] = useState("");
  const [plate, setPlate] = useState("");
  const [mileage, setMileage] = useState("");

  useEffect(() => {
    document.title = "보배드림 바이크 — 중고 바이크 사고팔기";
    const targets = [document.documentElement, document.body, document.getElementById("root")].filter(Boolean) as HTMLElement[];
    const prev = targets.map((el) => [el.style.overflow, el.style.height] as const);
    targets.forEach((el) => { el.style.overflow = "visible"; el.style.height = "auto"; });
    document.documentElement.style.overflowY = "auto";
    return () => targets.forEach((el, i) => { el.style.overflow = prev[i][0]; el.style.height = prev[i][1]; });
  }, []);
  useEffect(() => { if (!toast) return undefined; const t = window.setTimeout(() => setToast(""), 2000); return () => window.clearTimeout(t); }, [toast]);

  const sido = (r: Row) => r.region.split(" ")[0];
  const makers = useMemo(() => {
    const m = new Map<string, number>();
    rows.forEach((r) => m.set(r.brand, (m.get(r.brand) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [rows]);
  const models = useMemo(() => {
    const m = new Map<string, number>();
    rows.filter((r) => r.brand === maker).forEach((r) => m.set(r.model, (m.get(r.model) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([n]) => n);
  }, [rows, maker]);
  const count = rows.filter((r) => (region === "전국" || sido(r) === region) && (!maker || r.brand === maker) && (!model || r.model === model)).length;
  const latest = useMemo(() => {
    const seen = new Set<string>();
    return rows.filter((r) => r.posted_days <= 1 && !seen.has(r.brand) && seen.add(r.brand)).slice(0, 6);
  }, [rows]);

  const search = () => {
    const p: Record<string, string> = {};
    if (maker) p.maker = maker;
    if (model) p.model = model;
    if (region !== "전국") p.region = region;
    window.location.href = listUrl(p);
  };

  return (
    <div className="atm">
      <nav className="atm-types" aria-label="차종">
        <div className="atm-wrap">
          <a href={mainUrl("중고차")}>중고차</a>
          <a href={mainUrl("트럭 · 특장")}>트럭</a>
          <a className="is-on" href="./?home=at" aria-current="page">바이크</a>
          <a href={mainUrl("캠핑카")}>캠핑카</a>
          <a href={mainUrl("건설기계")}>건설기계</a>
          <a href={mainUrl("부품 · 용품")}>부품 · 용품</a>
        </div>
      </nav>

      <header className="atm-header">
        <div className="atm-wrap atm-header-row">
          <a className="atm-logo" href="./?home=at" aria-label="보배드림 바이크 홈">
            <img src={pic("..", "assets", "bbm", "bike-emblem.svg")} alt="" />
            <span>보배드림<small>바이크</small></span>
          </a>
          <nav className="atm-menu" aria-label="주 메뉴">
            <a href={listUrl()}>중고 바이크</a>
            <a href={listUrl({ register: "bike" })}>내 바이크 팔기</a>
            <a href={listUrl({ category: "부품 · 용품", bikeMenu: "parts" })}>바이크 용품</a>
            <a href="../community/bobaedream-pc-board-list.html?layout=reddit">커뮤니티</a>
          </nav>
          <div className="atm-header-icons">
            <button type="button" onClick={() => setToast("찜한 매물 화면은 준비 중입니다.")}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" /></svg>
              <span>찜</span>
            </button>
            <button type="button" onClick={() => setToast("로그인 화면은 준비 중입니다.")}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="12" cy="10" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" /><path d="M6.5 18.2a6.5 6.5 0 0 1 11 0" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
              <span>로그인</span>
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="atm-hero" aria-label="바이크 검색">
          <div className="atm-wrap">
            <div className="atm-photo" aria-hidden="true">
              <img className="is-a" src={pic("..", "assets", "bike", "models", "harley-davidson", "BKM005-G001.png")} alt="" />
              <img className="is-b" src={pic("..", "assets", "bike", "models", "honda", "BKM001-G004.png")} alt="" />
            </div>
            <div className="atm-search">
              <div className="atm-tabs" role="tablist" aria-label="거래 방식">
                <button type="button" role="tab" aria-selected={mode === "buy"} className={mode === "buy" ? "is-on" : ""} onClick={() => setMode("buy")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="7" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" /><circle cx="18" cy="16" r="3" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M7 16 11 9h4l3 7M9 9h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
                  사기
                </button>
                <button type="button" role="tab" aria-selected={mode === "sell"} className={mode === "sell" ? "is-on" : ""} onClick={() => setMode("sell")}>
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M8.5 9.5 10 15l2-4 2 4 1.5-5.5M8 12h8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  팔기
                </button>
              </div>
              {mode === "buy" ? (
                <form className="atm-fields" role="search" onSubmit={(e) => { e.preventDefault(); search(); }}>
                  <label className="atm-f">
                    <span>지역</span>
                    <select value={region} onChange={(e) => setRegion(e.currentTarget.value)}>{regions.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                  </label>
                  <label className="atm-f">
                    <span>제조사</span>
                    <select value={maker} onChange={(e) => { setMaker(e.currentTarget.value); setModel(""); }}>
                      <option value="">전체</option>
                      {makers.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </label>
                  <label className={`atm-f${maker ? "" : " is-off"}`}>
                    <span>모델</span>
                    <select value={model} disabled={!maker} onChange={(e) => setModel(e.currentTarget.value)}>
                      <option value="">전체</option>
                      {models.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </label>
                  <a className="atm-more" href={listUrl()} aria-label="상세 조건">
                    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" /><circle cx="16" cy="7" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" /><circle cx="10" cy="17" r="2" fill="none" stroke="currentColor" strokeWidth="1.7" /></svg>
                  </a>
                  <button type="submit" className="atm-cta">
                    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                    {count.toLocaleString("ko-KR")}대 검색
                  </button>
                </form>
              ) : (
                <form className="atm-fields is-sell" onSubmit={(e) => { e.preventDefault(); window.location.href = listUrl({ register: "bike" }); }}>
                  <label className="atm-f"><span>차량번호</span><input value={plate} onChange={(e) => setPlate(e.currentTarget.value)} placeholder="예: 서울 가 1234" /></label>
                  <label className="atm-f"><span>주행거리 (km)</span><input value={mileage} onChange={(e) => setMileage(e.currentTarget.value.replace(/[^0-9]/g, ""))} inputMode="numeric" placeholder="예: 12000" /></label>
                  <button type="submit" className="atm-cta">내 바이크 팔기</button>
                </form>
              )}
            </div>
          </div>
        </section>

        <h2 className="atm-h2 is-center">믿고 사고파는 바이크 마켓</h2>

        <section className="atm-wrap atm-advert" aria-labelledby="atm-advert-title">
          <div className="atm-advert-copy">
            <h2 id="atm-advert-title">보배드림 바이크에 매물 올리기</h2>
            <p>제값 받고 파세요</p>
            <p className="atm-small">광고 요금: <a href={listUrl({ register: "bike" })}>요금 안내</a></p>
            <form onSubmit={(e) => { e.preventDefault(); window.location.href = listUrl({ register: "bike" }); }}>
              <label><span>차량번호</span><input placeholder="예: 서울 가 1234" /></label>
              <label className="is-short"><span>현재 주행거리</span><input inputMode="numeric" placeholder="예: 12000" /></label>
              <button type="submit">매물 만들기</button>
            </form>
            <a className="atm-link" href={listUrl({ register: "bike" })}>내 매물 관리</a>
          </div>
          <div className="atm-advert-photo" aria-hidden="true"><img src={pic("..", "assets", "bike", "models", "honda", "BKM001-G003.png")} alt="" /></div>
        </section>

        <section className="atm-wrap atm-sec" aria-labelledby="atm-ess-title">
          <h2 id="atm-ess-title" className="atm-h2 is-center">바이크 구매 가이드</h2>
          <div className="atm-ess">
            {([
              ["swap", "타던 바이크 보상 판매", "타던 바이크 정보를 판매점에 보내 견적을 받아요."],
              ["store", "가까운 판매점 찾기", "실제 구매자 후기를 보고 판매점을 고르세요."],
              ["loan", "바이크 할부 · 대출", "얼마까지 빌릴 수 있는지 알아보고 맞는 상품을 찾아요."],
              ["check", "이력 조회", "사고 · 소유자 변경 이력을 한 번에 확인해요."],
            ] as const).map(([icon, title, desc]) => (
              <button key={title} type="button" className="atm-ess-card" onClick={() => setToast(`${title} 화면은 준비 중입니다.`)}>
                <Icon name={icon} />
                <strong>{title}</strong>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="atm-wrap atm-sec" aria-labelledby="atm-latest-title">
          <h2 id="atm-latest-title" className="atm-h2 is-center">새로 올라온 바이크</h2>
          <div className="atm-latest">
            {latest.map((r) => (
              <a key={r.scenario_id} className="atm-art" href={listUrl({ maker: r.brand })}>
                <span className="atm-art-photo"><img src={bikeThumb(r.image_file)} alt="" loading="lazy" /></span>
                <span className="atm-art-body">
                  <b className="atm-tag">{r.certified !== "해당 없음" ? "인증 중고" : r.seller_type === "개인 판매" ? "개인 매물" : "판매점 매물"}</b>
                  <strong>{r.brand} {r.model} ({r.year})</strong>
                  <span>{won(r.price_krw)} · {km(r.mileage_km)} · {r.displacement_cc.toLocaleString("ko-KR")}cc · {r.region}</span>
                  <small>{ago(r.posted_days)}</small>
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="atm-wrap atm-social" aria-labelledby="atm-social-title">
          <h2 id="atm-social-title">SNS에서 만나요</h2>
          <p>새 소식을 가장 먼저 전해 드려요</p>
          <div>{["유튜브", "인스타그램", "페이스북", "블로그"].map((n) => <button key={n} type="button" onClick={() => setToast(`${n} 연결은 준비 중입니다.`)}>{n}</button>)}</div>
        </section>

        <div className="atm-top">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}>
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12.5" fill="none" stroke="currentColor" strokeWidth="1.5" /><path d="m9 16 5-5 5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            맨 위로
          </button>
        </div>
      </main>

      <footer className="atm-footer">
        <div className="atm-wrap atm-footer-row">
          <div>
            <span className="atm-logo is-foot"><img src={pic("..", "assets", "bbm", "bike-emblem.svg")} alt="" /><span>보배드림<small>바이크</small></span></span>
            <ul>{["안전 거래 안내", "고객센터", "회사 소개", "이용약관", "개인정보처리방침"].map((t) => <li key={t}>{t}</li>)}</ul>
          </div>
          <div className="atm-acc">{["서비스", "개인 판매자", "빠른 검색", "판매점 안내"].map((t) => <div key={t}>{t}<svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></div>)}</div>
          <p className="atm-note">바이크 메인 시안 v02 · 매물은 바이크 가상 매물 v08 · v11 기준입니다.</p>
        </div>
      </footer>
      {toast ? <div className="atm-toast" role="status">{toast}</div> : null}
    </div>
  );
}
