// 보배드림 바이크 메인 시안 v01 (2026-10-19 「베스트글 없이 오토스카우트 24 동일하게 · 바이크 메인에 · 보배드림 말고 바이크로」)
// 진입: /bike/?home=as24 (기존 /bike/ 목록은 그대로).
// AutoScout24.de 1536 실측 구성을 그대로 따른다: 짙은 헤더 → 사진 히어로(48 제목 · 가격 말풍선 · 노랑 곡선) → 히어로에 걸친 검색 카드
// (탭 · 3칸 · 결과 대수 버튼 · 유형 그림 8칸) → 인기 브랜드 8 → 내 차 팔기 2안 카드 → 「가장 많이 찾는」 4열 × 2줄 카드
// → 두 번째 4열 카드 묶음 → 뉴스레터 띠 → 인기 모델 글자 링크 → 짙은 바닥글. 커뮤니티 베스트글은 넣지 않는다.
// 색은 바이크 사이트 주황(#FA6819)을 AutoScout24 노랑 · 청록 자리에 쓴다. 매물은 바이크 매물 v08 + v11(550대)이다.
import { useEffect, useMemo, useRef, useState } from "react";
import { bikeScenarioV08 } from "../../prototype/bike/scenario-v08";
import { bikeScenarioV11 } from "../../prototype/bike/scenario-v11";
import "./bike-main-home.css";

const pic = (...parts: string[]) => parts.join("/");
const bikeImg = (file: string) => pic("..", "assets", "bike", "listings", file);
const bikeThumb = (file: string) => (file.startsWith("v11/") ? bikeImg(file.replace("v11/", "v11/thumb/")) : bikeImg(file));

type Row = (typeof bikeScenarioV11)[number];

const listUrl = (params: Record<string, string> = {}) => {
  const q = new URLSearchParams(params).toString();
  return `./${q ? `?${q}` : ""}`;
};

const brandLogos: Array<[string, string]> = [
  ["혼다", "BKM001_Honda.png"],
  ["야마하", "BKM002_Yamaha.png"],
  ["가와사키", "BKM006_Kawasaki.png"],
  ["스즈키", "BKM004_Suzuki.png"],
  ["BMW", "BKM003_BMW_Motorrad.png"],
  ["할리데이비슨", "BKM005_Harley_Davidson.png"],
  ["두카티", "BKM010_Ducati.png"],
  ["KTM", "BKM016_KTM.png"],
];

const genres: Array<[string, string]> = [
  ["스포츠", "sport"], ["네이키드", "naked"], ["스쿠터", "scooter"], ["크루저", "cruiser"],
  ["클래식", "classic"], ["멀티퍼포즈", "multipurpose"], ["투어러", "tourer"], ["언더본", "underbone"],
];

type TabKey = "중고 바이크" | "스쿠터" | "클래식" | "바이크 용품";
const tabs: TabKey[] = ["중고 바이크", "스쿠터", "클래식", "바이크 용품"];
const regions = ["전국", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

const won = (krw: number) => {
  const man = Math.round(krw / 10000);
  const eok = Math.floor(man / 10000);
  const rest = man % 10000;
  if (!eok) return `${man.toLocaleString("ko-KR")}만원`;
  return rest ? `${eok}억 ${rest.toLocaleString("ko-KR")}만원` : `${eok}억원`;
};
const km = (n: number) => (n >= 10000 ? `${(Math.round(n / 1000) / 10).toLocaleString("ko-KR")}만km` : `${n.toLocaleString("ko-KR")}km`);

function Card({ row, saved, onSave }: { row: Row; saved: boolean; onSave: () => void }) {
  return (
    <article className="bmh-card">
      <a href={listUrl({ maker: row.brand })} className="bmh-card-link">
        <span className="bmh-card-photo"><img src={bikeThumb(row.image_file)} alt="" loading="lazy" /></span>
        <span className="bmh-card-body">
          <span className="bmh-card-title"><b>{row.brand}</b> {row.model}</span>
          <span className="bmh-card-price">{won(row.price_krw)}</span>
          <span className="bmh-card-meta">{row.year} | {km(row.mileage_km)} | {row.displacement_cc.toLocaleString("ko-KR")}cc | {row.genre}</span>
          {row.posted_days === 0 ? <span className="bmh-badge">새 매물</span> : null}
        </span>
      </a>
      <footer className="bmh-card-foot">
        <span><small>{row.seller_type}</small>{row.region}</span>
        <button type="button" aria-pressed={saved} aria-label={saved ? "찜 해제" : "찜하기"} className={saved ? "is-on" : ""} onClick={onSave}>
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9Z" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
        </button>
      </footer>
    </article>
  );
}

export default function BikeMainHome() {
  const rows = useMemo(() => [...bikeScenarioV08, ...bikeScenarioV11] as Row[], []);
  const [tab, setTab] = useState<TabKey>("중고 바이크");
  const [maker, setMaker] = useState("");
  const [model, setModel] = useState("");
  const [region, setRegion] = useState("전국");
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"maker" | "model">("maker");
  const [draftMaker, setDraftMaker] = useState("");
  const [draftModel, setDraftModel] = useState("");
  const [keyword, setKeyword] = useState("");
  const [toast, setToast] = useState("");
  const opener = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    document.title = "보배드림 바이크 — 중고 바이크 사고팔기";
    // 공용 styles.css가 화면 고정(overflow hidden)을 걸어 두어 메인에서는 문서 스크롤을 다시 연다
    const targets = [document.documentElement, document.body, document.getElementById("root")].filter(Boolean) as HTMLElement[];
    const prev = targets.map((el) => [el.style.overflow, el.style.height] as const);
    targets.forEach((el) => { el.style.overflow = "visible"; el.style.height = "auto"; });
    document.documentElement.style.overflowY = "auto";
    return () => targets.forEach((el, i) => { el.style.overflow = prev[i][0]; el.style.height = prev[i][1]; });
  }, []);
  useEffect(() => { if (!toast) return undefined; const t = window.setTimeout(() => setToast(""), 2000); return () => window.clearTimeout(t); }, [toast]);

  const inTab = (r: Row) => (tab === "스쿠터" ? r.genre === "스쿠터" : tab === "클래식" ? r.genre === "클래식" : true);
  const sido = (r: Row) => r.region.split(" ")[0];
  const countOf = (mk: string, md: string) => rows.filter((r) => inTab(r) && (!mk || r.brand === mk) && (!md || r.model === md) && (region === "전국" || sido(r) === region)).length;
  const isParts = tab === "바이크 용품";
  const count = countOf(maker, model);

  const makerList = useMemo(() => {
    const m = new Map<string, number>();
    rows.filter(inTab).forEach((r) => m.set(r.brand, (m.get(r.brand) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, tab]);
  const modelList = useMemo(() => {
    const m = new Map<string, number>();
    rows.filter((r) => inTab(r) && r.brand === draftMaker).forEach((r) => m.set(r.model, (m.get(r.model) ?? 0) + 1));
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, tab, draftMaker]);

  const popular = useMemo(() => {
    const out: Row[] = [];
    for (const [brand] of brandLogos) {
      const pick = rows.filter((r) => r.brand === brand && r.posted_days <= 1).sort((a, b) => b.price_krw - a.price_krw)[0];
      if (pick) out.push(pick);
    }
    return out.slice(0, 8);
  }, [rows]);
  const fresh = useMemo(() => {
    const used = new Set(popular.map((r) => r.scenario_id));
    const seen = new Set<string>();
    return rows.filter((r) => r.posted_days === 0 && !used.has(r.scenario_id) && !seen.has(r.model) && seen.add(r.model)).slice(0, 8);
  }, [rows, popular]);
  const heroBubbles = useMemo(() => [popular[1], popular[5], popular[6]].filter(Boolean), [popular]);
  const brandModels = useMemo(() => brandLogos.slice(0, 5).map(([b]) => {
    const m = new Map<string, number>();
    rows.filter((r) => r.brand === b).forEach((r) => m.set(r.model, (m.get(r.model) ?? 0) + 1));
    return [b, [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([n]) => n)] as const;
  }), [rows]);

  const openPicker = () => { setDraftMaker(maker); setDraftModel(model); setStep(maker ? "model" : "maker"); setKeyword(""); setOpen(true); };
  const closePicker = () => { setOpen(false); opener.current?.focus(); };
  useEffect(() => {
    if (!open) return undefined;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePicker(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const search = () => {
    if (isParts) { window.location.href = listUrl({ category: "부품 · 용품", bikeMenu: "parts" }); return; }
    const p: Record<string, string> = {};
    if (maker) p.maker = maker;
    if (model) p.model = model;
    if (region !== "전국") p.region = region;
    window.location.href = listUrl(p);
  };
  const q = keyword.trim();
  const toggleSave = (id: string) => setSaved((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="bmh">
      <header className="bmh-header">
        <div className="bmh-wrap bmh-header-row">
          <a className="bmh-logo" href="./?home=as24" aria-label="보배드림 바이크 홈">
            <img src={pic("..", "assets", "bbm", "bike-emblem.svg")} alt="" />
            <span>보배드림 <b>바이크</b></span>
          </a>
          <nav className="bmh-gnb" aria-label="주 메뉴">
            <a href={listUrl()}>중고 바이크</a>
            <a href={listUrl({ register: "bike" })}>바이크 판매</a>
            <a href={listUrl({ category: "부품 · 용품", bikeMenu: "parts" })}>바이크 용품</a>
            <a href="../community/bobaedream-pc-board-list.html?layout=reddit">커뮤니티</a>
          </nav>
          <div className="bmh-header-right">
            <button type="button" aria-label="찜한 매물" onClick={() => setToast(`찜한 매물 ${saved.size}대`)}>
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.3 5.9.9-4.25 4.1 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.7l5.9-.9Z" fill="currentColor" /></svg>
            </button>
            <span className="bmh-divider" aria-hidden="true" />
            <button type="button" className="bmh-login">로그인</button>
            <a className="bmh-sell-btn" href={listUrl({ register: "bike" })}>바이크 판매</a>
          </div>
        </div>
      </header>

      <section className="bmh-hero" aria-label="소개">
        <div className="bmh-hero-art" aria-hidden="true">
          <span className="bmh-swoosh" />
          <img className="bmh-hero-bike" src={pic("..", "assets", "bike", "models", "honda", "BKM001-G003.png")} alt="" />
          {heroBubbles.map((r, i) => (
            <span key={r.scenario_id} className={`bmh-bubble is-${i}`}><i>₩</i><span><small>매물</small>{won(r.price_krw)}</span></span>
          ))}
        </div>
        <div className="bmh-wrap"><h1>달리고 싶은 바이크, 여기서.</h1></div>
      </section>

      <div className="bmh-wrap">
        <section className="bmh-search" aria-label="바이크 검색">
          <div className="bmh-tabs" role="tablist" aria-label="검색 종류">
            {tabs.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "is-on" : ""} onClick={() => { setTab(t); setMaker(""); setModel(""); }}>{t}</button>
            ))}
          </div>
          <div className="bmh-row">
            <button ref={opener} type="button" className="bmh-field" onClick={openPicker} disabled={isParts} aria-haspopup="dialog">
              <span className={maker ? "is-filled" : ""}>{maker ? (model ? `${maker} ${model}` : maker) : "제조사와 모델"}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <label className="bmh-field">
              <span className={region !== "전국" ? "is-filled" : ""}>{region === "전국" ? "지역 (전국)" : region}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <select value={region} onChange={(e) => setRegion(e.currentTarget.value)} aria-label="지역">{regions.map((r) => <option key={r} value={r}>{r}</option>)}</select>
            </label>
            <button type="button" className="bmh-cta" onClick={search}>{isParts ? "용품 보기" : `${count.toLocaleString("ko-KR")}대 보기`}</button>
          </div>
          <div className="bmh-more"><a href={listUrl()}>상세 조건으로 검색</a></div>
          <h2 className="bmh-search-sub">장르로 바이크 찾기</h2>
          <div className="bmh-genres">
            {genres.map(([label, file]) => (
              <a key={label} href={listUrl()}>
                <span><img src={pic("..", "assets", "bike", "types", "autoscout-v01", `${file}.png`)} alt="" loading="lazy" /></span>
                {label}
              </a>
            ))}
          </div>
        </section>

        <section className="bmh-sec" aria-labelledby="bmh-brands">
          <h2 id="bmh-brands" className="bmh-h2">인기 브랜드</h2>
          <div className="bmh-brands">
            {brandLogos.map(([name, file]) => (
              <a key={name} href={listUrl({ maker: name })}>
                <span><img src={pic("..", "assets", "bike", "logos", "lightwagen-trim", file)} alt="" /></span>
                {name}
              </a>
            ))}
          </div>
        </section>

        <section className="bmh-sell" aria-labelledby="bmh-sell-title">
          <div className="bmh-sell-lead">
            <span className="bmh-sell-swoosh" aria-hidden="true" />
            <h2 id="bmh-sell-title">내 바이크,<br />지금 팔아볼까요?</h2>
            <img src={pic("..", "assets", "bike", "models", "harley-davidson", "BKM005-G001.png")} alt="" aria-hidden="true" />
          </div>
          <div className="bmh-sell-card is-fast">
            <span className="bmh-sell-flag">가장 빠름</span>
            <h3>업체에 바로 팔기</h3>
            <ul><li>등록 무료</li><li>당일 견적</li><li>빠른 입금</li><li>번거로움 최소</li></ul>
            <a className="bmh-solid" href={listUrl({ register: "bike" })}>업체에 팔기</a>
          </div>
          <div className="bmh-sell-card">
            <h3>직접 올려 팔기</h3>
            <ul><li>무료로 매물 등록</li><li>가장 많은 사람에게 노출</li><li>원하는 가격에 판매</li><li>채팅으로 안전하게 거래</li></ul>
            <a className="bmh-outline" href={listUrl({ register: "bike" })}>직접 팔기</a>
          </div>
        </section>

        <section className="bmh-sec" aria-labelledby="bmh-popular">
          <h2 id="bmh-popular" className="bmh-h2">가장 많이 찾는 바이크</h2>
          <div className="bmh-grid">{popular.map((r) => <Card key={r.scenario_id} row={r} saved={saved.has(r.scenario_id)} onSave={() => toggleSave(r.scenario_id)} />)}</div>
        </section>

        <section className="bmh-sec" aria-labelledby="bmh-fresh">
          <h2 id="bmh-fresh" className="bmh-h2">오늘 올라온 매물</h2>
          <div className="bmh-grid">{fresh.map((r) => <Card key={r.scenario_id} row={r} saved={saved.has(r.scenario_id)} onSave={() => toggleSave(r.scenario_id)} />)}</div>
        </section>

        <section className="bmh-news" aria-labelledby="bmh-news-title">
          <div className="bmh-news-copy">
            <h2 id="bmh-news-title">새 매물 소식을 메일로 받아보세요</h2>
            <p>관심 브랜드의 새 매물과 시세 변화를 주 1회 정리해 보내드려요.</p>
            <form onSubmit={(e) => { e.preventDefault(); setToast("시안에서는 메일을 보내지 않습니다."); }}>
              <input type="email" placeholder="이메일 주소" aria-label="이메일 주소" />
              <button type="submit">소식 받기</button>
            </form>
          </div>
          <span className="bmh-news-art" aria-hidden="true"><span /><img src={pic("..", "assets", "bike", "models", "honda", "BKM001-G005.png")} alt="" /></span>
        </section>

        <section className="bmh-seo" aria-labelledby="bmh-seo-title">
          <h2 id="bmh-seo-title">보배드림 바이크에서 찾아보세요</h2>
          <h3>인기 모델</h3>
          <div className="bmh-seo-cols">
            {brandModels.map(([brand, models]) => (
              <div key={brand}>
                <h4>{brand}</h4>
                {models.map((m) => <a key={m} href={listUrl({ maker: brand, model: m })}>{m}</a>)}
              </div>
            ))}
          </div>
          <h3>장르별</h3>
          <div className="bmh-seo-inline">{genres.map(([g]) => <a key={g} href={listUrl()}>{g} 중고</a>)}</div>
        </section>
      </div>

      <footer className="bmh-footer">
        <div className="bmh-wrap">
          <strong>보배드림 바이크</strong>
          <span>바이크 메인 시안 v01 · 매물은 바이크 가상 매물 v08 · v11 기준입니다.</span>
        </div>
      </footer>

      {open ? (
        <div className="bmh-layer">
          <button type="button" className="bmh-dim" aria-label="닫기" onClick={closePicker} />
          <div className="bmh-modal" role="dialog" aria-modal="true" aria-labelledby="bmh-modal-title">
            <header>
              {step === "model" ? (
                <button type="button" className="bmh-icon" aria-label="제조사로 돌아가기" onClick={() => { setStep("maker"); setKeyword(""); }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              ) : <span />}
              <h2 id="bmh-modal-title">{step === "maker" ? "제조사" : draftMaker}</h2>
              <button ref={closeBtn} type="button" className="bmh-icon" aria-label="닫기" onClick={closePicker}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </header>
            <div className="bmh-modal-search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input value={keyword} onChange={(e) => setKeyword(e.currentTarget.value)} placeholder={step === "maker" ? "제조사 검색" : "모델 검색"} aria-label="검색" />
            </div>
            <div className="bmh-modal-body">
              <h3>{step === "maker" ? "인기 제조사" : "모델"}</h3>
              <ul>
                {step === "model" ? <li><button type="button" className={!draftModel ? "is-on" : ""} onClick={() => setDraftModel("")}><span>{draftMaker} 전체</span><em>{countOf(draftMaker, "")}</em></button></li> : null}
                {(step === "maker" ? makerList : modelList).filter(([n]) => !q || n.toLowerCase().includes(q.toLowerCase())).map(([n, c]) => (
                  <li key={n}>
                    <button type="button" className={(step === "maker" ? draftMaker : draftModel) === n ? "is-on" : ""} onClick={() => {
                      if (step === "maker") { setDraftMaker(n); setDraftModel(""); setStep("model"); setKeyword(""); } else setDraftModel(n);
                    }}>
                      <span>{n}</span><em>{c}</em>
                      {step === "maker" ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <footer>
              <button type="button" className="bmh-reset" disabled={!draftMaker} onClick={() => { setDraftMaker(""); setDraftModel(""); setStep("maker"); }}>초기화</button>
              <button type="button" className="bmh-cta" onClick={() => { setMaker(draftMaker); setModel(draftModel); closePicker(); }}>{countOf(draftMaker, draftModel).toLocaleString("ko-KR")}대 보기</button>
            </footer>
          </div>
        </div>
      ) : null}
      {toast ? <div className="bmh-toast" role="status">{toast}</div> : null}
    </div>
  );
}
