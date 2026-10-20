// 보배드림 바이크 메인 시안 v01 (2026-10-19 「베스트글 없이 오토스카우트 24 동일하게 · 바이크 메인에 · 보배드림 말고 바이크로」)
// 진입: /bike/?home=as24 (기존 /bike/ 목록은 그대로).
// AutoScout24.de 1536 실측 구성을 그대로 따른다: 짙은 헤더 → 사진 히어로(48 제목 · 가격 말풍선 · 노랑 곡선) → 히어로에 걸친 검색 카드
// (탭 · 3칸 · 결과 대수 버튼 · 유형 그림 8칸) → 인기 브랜드 8 → 내 차 팔기 2안 카드 → 「인기 바이크」 초톳 그리드 6열 × 2줄
// → 두 번째 4열 카드 묶음 → 뉴스레터 띠 → 인기 모델 글자 링크 → 짙은 바닥글. 커뮤니티 베스트글은 넣지 않는다.
// 색은 바이크 사이트 주황(#FA6819)을 AutoScout24 노랑 · 청록 자리에 쓴다. 매물은 바이크 매물 v08 + v11(550대)이다.
import { useEffect, useMemo, useRef, useState } from "react";
import { bikeScenarioV08 } from "../../prototype/bike/scenario-v08";
import { bikeScenarioV11 } from "../../prototype/bike/scenario-v11";
import { BikeFlag, bikeLocaleOptions, bikeMainCopies, localizeBikeBrand, readBikeLocale, type BikeLocale } from "./bike-main-i18n";
import "./bike-main-home.css";

const pic = (...parts: string[]) => parts.join("/");
const bikeImg = (file: string) => pic("..", "assets", "bike", "listings", file);
const bikeThumb = (file: string) => (file.startsWith("v11/") ? bikeImg(file.replace("v11/", "v11/thumb/")) : bikeImg(file));

type Row = (typeof bikeScenarioV11)[number];

const listUrl = (params: Record<string, string> = {}, locale = readBikeLocale()) => {
  const query = new URLSearchParams({ ...params, lang: locale });
  const q = query.toString();
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

/** 인기 브랜드 줄에 더하는 브랜드(매물이 있는 것만 노출) */
const brandExtra: Array<[string, string]> = [
  ["트라이엄프", "BKM078_Triumph.png"],
  ["로얄엔필드", "BKM009_Royal_Enfield.png"],
  ["베스파", "BKM008_Vespa.png"],
  ["SYM", "BKM007_SYM.png"],
];

const genres: Array<[string, string]> = [
  ["네이키드", "naked"], ["스쿠터", "scooter"], ["크루저", "cruiser"], ["멀티퍼포즈", "multipurpose"],
  ["스포츠", "sport"], ["투어러", "tourer"], ["오프로드", "offroad"], ["ATV", "atv"],
];

type HeroKey = "ducati" | "bmw" | "harley";

const heroMedia: Array<{
  key: HeroKey;
  poster: string;
  kind: "iframe" | "image";
  video?: string;
  title: string;
}> = [
  {
    key: "ducati",
    kind: "iframe",
    poster: "https://images.ctfassets.net/x7j9qwvpvr5s/4t2zR01xZmlZKL4tCxe8tL/48bcc2da642a078d1f70cc5a1760cbf0/WorldSBK-Jerez-18-Ottobre-2026-Hero-1600x1000.jpg?fm=webp&q=90",
    video: "https://player.vimeo.com/video/1236270813?background=1&autoplay=1&muted=1&loop=1&autopause=0&title=0&byline=0&portrait=0",
    title: "Ducati Panigale V4 MY27 공식 영상",
  },
  {
    key: "bmw",
    kind: "image",
    poster: "https://i.ytimg.com/vi/v6W8Gqg71oE/maxresdefault.jpg",
    title: "BMW Motorrad S 1000 RR 공식 이미지",
  },
  {
    key: "harley",
    kind: "image",
    poster: "https://h-dmediakit.com/theme/img/cms/h-d/new-for/2026/ssJHgdshvc/newfor-flhd.jpg",
    title: "Harley-Davidson 2026 공식 이미지",
  },
];

type TabKey = "전체" | "중고" | "신차";
const regions = ["전국", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

const won = (krw: number, locale: BikeLocale, intl: string) => {
  if (locale !== "ko") return `₩${krw.toLocaleString(intl)}`;
  const man = Math.round(krw / 10000);
  const eok = Math.floor(man / 10000);
  const rest = man % 10000;
  if (!eok) return `${man.toLocaleString("ko-KR")}만원`;
  return rest ? `${eok}억 ${rest.toLocaleString("ko-KR")}만원` : `${eok}억원`;
};
const km = (n: number, locale: BikeLocale, intl: string) => locale === "ko" && n >= 10000
  ? `${(Math.round(n / 1000) / 10).toLocaleString("ko-KR")}만km`
  : `${n.toLocaleString(intl)} km`;

/* 썸네일 등록 시각(초톳처럼 사진 왼쪽 아래): 게시 0일 = N시간 전(매물 id로 정한 1~23, 가상 값), 그 밖 N일 전 */
const postedAgo = (row: Row, locale: BikeLocale, intl: string) => {
  if (row.posted_days > 0) {
    const n = row.posted_days.toLocaleString(intl);
    if (locale === "en") return `${n} day${row.posted_days === 1 ? "" : "s"} ago`;
    if (locale === "ru") return `${n} дн. назад`;
    if (locale === "ar") return `قبل ${n} يوم`;
    return `${n}일 전`;
  }
  let h = 0;
  for (const ch of row.scenario_id) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const hours = 1 + (h % 23);
  const n = hours.toLocaleString(intl);
  if (locale === "en") return `${n} hour${hours === 1 ? "" : "s"} ago`;
  if (locale === "ru") return `${n} ч. назад`;
  if (locale === "ar") return `قبل ${n} ساعة`;
  return `${n}시간 전`;
};

/* 인기 바이크 카드: 초톳(xe.chotot.com) 그리드 카드 1536 실측(2026-10-19) — 정사각 사진 반경 12, 사진 아래 10에 제목 16/23 2줄,
   사양 14/20 #8C8C8C 한 줄, 가격 16/24 700, 위치 아이콘 14 + 14/21, 좌우 안쪽 8 */
function ChototCard({ row, saved, onSave, locale }: { row: Row; saved: boolean; onSave: () => void; locale: BikeLocale }) {
  const copy = bikeMainCopies[locale];
  const option = bikeLocaleOptions.find(({ id }) => id === locale) ?? bikeLocaleOptions[0];
  const genreIndex = genres.findIndex(([value]) => value === row.genre);
  const regionIndex = regions.findIndex((value) => value === row.region.split(" ")[0]);
  return (
    <article className="bmh-ct-card">
      <a href={listUrl({ maker: row.brand })} className="bmh-ct-link">
        <span className="bmh-ct-photo">
          <img src={bikeThumb(row.image_file)} alt="" loading="lazy" />
          <span className="bmh-ct-label">{postedAgo(row, locale, option.intl)}</span>
        </span>
        <span className="bmh-ct-title">{localizeBikeBrand(row.brand, locale)} {row.model} {row.year}</span>
        <span className="bmh-ct-meta"><span>{row.year}</span><span>{genreIndex >= 0 ? copy.genres[genreIndex] : row.genre}</span><span>{row.displacement_cc.toLocaleString(option.intl)} cc</span><span>{km(row.mileage_km, locale, option.intl)}</span></span>
        <span className="bmh-ct-price">{won(row.price_krw, locale, option.intl)}</span>
        <span className="bmh-ct-loc">
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" fill="currentColor" /></svg>
          {regionIndex >= 0 ? `${copy.regions[regionIndex]}${row.region.includes(" ") ? ` ${row.region.split(" ").slice(1).join(" ")}` : ""}` : row.region}
        </span>
      </a>
      <button type="button" className={saved ? "bmh-ct-save is-on" : "bmh-ct-save"} aria-pressed={saved} aria-label={saved ? copy.unsave : copy.save} onClick={onSave}>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-7.5-10.1A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.5 2.8c0 5.5-7.5 10.1-7.5 10.1Z" fill={saved ? "#fff" : "rgba(0,0,0,.25)"} stroke="#fff" strokeWidth="1.8" strokeLinejoin="round" /></svg>
      </button>
    </article>
  );
}

export default function BikeMainHome() {
  const rows = useMemo(() => [...bikeScenarioV08, ...bikeScenarioV11] as Row[], []);
  const [locale, setLocale] = useState<BikeLocale>(readBikeLocale);
  const [languageOpen, setLanguageOpen] = useState(false);
  const copy = bikeMainCopies[locale];
  const localeOption = bikeLocaleOptions.find(({ id }) => id === locale) ?? bikeLocaleOptions[0];
  const [hero] = useState(() => {
    const forced = new URLSearchParams(window.location.search).get("hero")?.toLowerCase() as HeroKey | undefined;
    return heroMedia.find((item) => item.key === forced) ?? heroMedia[Math.floor(Math.random() * heroMedia.length)];
  });
  const [tab] = useState<TabKey>("전체"); // 탭 줄은 2026-10-19에 뺐다(전체 고정)
  const [genre, setGenre] = useState("");
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
  const [headerQuery, setHeaderQuery] = useState("");
  const opener = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = copy.documentTitle;
    document.documentElement.lang = locale;
    document.documentElement.dir = localeOption.dir;
    window.localStorage.setItem("bbm-bike-language", locale);
    const url = new URL(window.location.href);
    if (url.searchParams.get("lang") !== locale) {
      url.searchParams.set("lang", locale);
      window.history.replaceState({}, "", url);
    }
    // 공용 styles.css가 화면 고정(overflow hidden)을 걸어 두어 메인에서는 문서 스크롤을 다시 연다
    const targets = [document.documentElement, document.body, document.getElementById("root")].filter(Boolean) as HTMLElement[];
    const prev = targets.map((el) => [el.style.overflow, el.style.height] as const);
    targets.forEach((el) => { el.style.overflow = "visible"; el.style.height = "auto"; });
    document.documentElement.style.overflowY = "auto";
    return () => targets.forEach((el, i) => { el.style.overflow = prev[i][0]; el.style.height = prev[i][1]; });
  }, [copy.documentTitle, locale, localeOption.dir]);
  useEffect(() => { if (!toast) return undefined; const t = window.setTimeout(() => setToast(""), 2000); return () => window.clearTimeout(t); }, [toast]);
  useEffect(() => {
    const closeLanguage = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) setLanguageOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLanguageOpen(false);
    };
    document.addEventListener("mousedown", closeLanguage);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeLanguage);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  const selectLocale = (nextLocale: BikeLocale) => {
    const url = new URL(window.location.href);
    url.searchParams.set("lang", nextLocale);
    window.history.replaceState({}, "", url);
    setLocale(nextLocale);
    setLanguageOpen(false);
  };

  const isNew = (r: Row) => r.year >= 2024 && r.mileage_km <= 1000;
  const inTab = (r: Row) => (tab === "신차" ? isNew(r) : tab === "중고" ? !isNew(r) : true) && (!genre || r.genre === genre);
  const sido = (r: Row) => r.region.split(" ")[0];
  const countOf = (mk: string, md: string) => rows.filter((r) => inTab(r) && (!mk || r.brand === mk) && (!md || r.model === md) && (region === "전국" || sido(r) === region)).length;
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
    // 인기 바이크는 초톳 그리드처럼 6열 × 2줄 = 12대: 브랜드별 1대 뒤에 최근 고가 매물로 채운다
    const ids = new Set(out.map((r) => r.scenario_id));
    for (const r of [...rows].filter((r) => r.posted_days <= 2).sort((a, b) => b.price_krw - a.price_krw)) { if (out.length >= 12) break; if (!ids.has(r.scenario_id)) { out.push(r); ids.add(r.scenario_id); } }
    return out.slice(0, 12);
  }, [rows]);
  const fresh = useMemo(() => {
    const used = new Set(popular.map((r) => r.scenario_id));
    const seen = new Set<string>();
    return rows.filter((r) => r.posted_days === 0 && !used.has(r.scenario_id) && !seen.has(r.model) && seen.add(r.model)).slice(0, 12);
  }, [rows, popular]);
  const brandModels = useMemo(() => brandLogos.slice(0, 5).map(([b]) => {
    const m = new Map<string, number>();
    rows.filter((r) => r.brand === b).forEach((r) => m.set(r.model, (m.get(r.model) ?? 0) + 1));
    return [b, [...m.entries()].sort((x, y) => y[1] - x[1]).slice(0, 5).map(([n]) => n)] as const;
  }), [rows]);

  const brandRail = useMemo(() => {
    const m = new Map<string, number>(); rows.forEach((r) => m.set(r.brand, (m.get(r.brand) ?? 0) + 1));
    return [...brandLogos, ...brandExtra].map(([n, f]) => [n, f, m.get(n) ?? 0] as const).filter(([, , c]) => c > 0);
  }, [rows]);
  const brandRow = useRef<HTMLDivElement>(null);
  const [brandEdge, setBrandEdge] = useState({ prev: false, next: true });
  const updateBrandEdge = () => { const el = brandRow.current; if (!el) return; setBrandEdge({ prev: el.scrollLeft > 2, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 2 }); };
  useEffect(() => { updateBrandEdge(); window.addEventListener("resize", updateBrandEdge); return () => window.removeEventListener("resize", updateBrandEdge); }, []);
  const scrollBrands = (dir: number) => { const el = brandRow.current; if (!el) return; const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: reduce ? "auto" : "smooth" }); };

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
    const p: Record<string, string> = {};
    if (tab !== "전체") p.condition = tab;
    if (genre) p.genre = genre;
    if (maker) p.maker = maker;
    if (model) p.model = model;
    if (region !== "전국") p.region = region;
    window.location.href = listUrl(p, locale);
  };
  const q = keyword.trim();
  const toggleSave = (id: string) => setSaved((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="bmh" lang={locale} dir={localeOption.dir}>
      <header className="bmh-site-header" aria-label={copy.siteAria}>
        <div className="bmh-wrap bmh-site-header-main">
          <a className="bmh-site-logo" href={listUrl({ home: "as24" }, locale)} aria-label={copy.homeAria}>
            <span className="bmh-site-logo-emblem bmh-site-logo-emblem--cycle"><img src={pic("..", "assets", "bbm", "service-logos", "v01", "bobaedream-bike-v01.png")} alt="" /></span>
            <span className="bmh-site-logo-word">{copy.logoWord}</span>
            <span className="bmh-site-logo-badge">{copy.logoBadge}</span>
          </a>
          <form className="bmh-site-search" onSubmit={(event) => { event.preventDefault(); const query = headerQuery.trim(); if (query) window.location.href = listUrl({ search: query }, locale); }}>
            <input value={headerQuery} onChange={(event) => setHeaderQuery(event.currentTarget.value)} placeholder={copy.headerSearch} aria-label={copy.headerSearch} />
            <button type="submit" aria-label={copy.search}><img src={pic("..", "assets", "icons", "bb", "search.svg")} alt="" /></button>
          </form>
          <div className="bmh-site-actions" aria-label={copy.memberMenu}>
            <button type="button" className="bmh-site-icon" aria-label={copy.saved} onClick={() => setToast(copy.savedToast(saved.size))}><img src={pic("..", "assets", "icons", "bb", "heart.svg")} alt="" /></button>
            <a className="bmh-site-login" href={listUrl({ home: "as24", auth: "login" }, locale)}>{copy.login}</a>
            <a className="bmh-site-sell" href={listUrl({ register: "bike" }, locale)}>{copy.sellBike}</a>
            <button type="button" className="bmh-site-account" aria-label={copy.account} onClick={() => setToast(copy.accountToast)}>
              <span><img src={pic("..", "assets", "icons", "bb", "mypage.svg")} alt="" /></span>
              <img src={pic("..", "assets", "icons", "bb", "chevron-down.svg")} alt="" />
            </button>
            <div className="bmh-language" ref={languageRef}>
              <button
                type="button"
                className="bmh-language-trigger"
                aria-label={copy.language}
                aria-haspopup="menu"
                aria-expanded={languageOpen}
                onClick={() => setLanguageOpen((value) => !value)}
              >
                <BikeFlag locale={locale} />
                <span className="bmh-language-code">{localeOption.code}</span>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              {languageOpen ? (
                <div className="bmh-language-menu" role="menu" aria-label={copy.language}>
                  {bikeLocaleOptions.map((option) => (
                    <button key={option.id} type="button" role="menuitemradio" aria-checked={locale === option.id} className={locale === option.id ? "is-active" : ""} onClick={() => selectLocale(option.id)}>
                      <BikeFlag locale={option.id} />
                      <strong>{option.name}</strong>
                      <small>{option.code}</small>
                      <i aria-hidden="true">{locale === option.id ? "✓" : ""}</i>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="bmh-wrap bmh-site-nav-row">
          <nav className="bmh-site-gnb" aria-label={copy.memberMenu}>
            <a href={listUrl({ home: "as24" }, locale)}>{copy.nav[0]}</a>
            <a href={listUrl({ condition: "중고" }, locale)}>{copy.nav[1]}</a>
            <a href={listUrl({ condition: "신차" }, locale)}>{copy.nav[2]}</a>
            <button type="button" onClick={() => setToast(copy.shopToast)}>{copy.nav[3]}</button>
            <a href={listUrl({ category: "부품 · 용품", bikeMenu: "parts" }, locale)}>{copy.nav[4]}</a>
            <a href={`../community/bobaedream-pc-board-list.html?layout=reddit&lang=${locale}`}>{copy.nav[5]}</a>
          </nav>
          <a className="bmh-site-notice" href={`../community/bobaedream-pc-board-list.html?layout=reddit&lang=${locale}`}>
            <strong>{copy.notice}</strong><span aria-hidden="true" /><em>{copy.noticeText}</em>
          </a>
        </div>
      </header>

      <section className="bmh-hero" aria-label={copy.introAria}>
        <div className="bmh-hero-art" aria-hidden="true">
          <div className="bmh-hero-photo">
            <img className="bmh-hero-poster" src={hero.poster} alt="" />
            {hero.kind === "iframe" ? (
              <iframe
                key={hero.key}
                className="bmh-hero-video"
                src={hero.video}
                title={hero.title}
                allow="autoplay; fullscreen; picture-in-picture"
                referrerPolicy="strict-origin-when-cross-origin"
                tabIndex={-1}
              />
            ) : null}
          </div>
        </div>
        <div className="bmh-wrap bmh-hero-copy"><span>{copy.heroEyebrow}</span><h1>{copy.heroTitle[0]}<br />{copy.heroTitle[1]}</h1></div>
      </section>

      <div className="bmh-wrap">
        <section className="bmh-search" aria-label={copy.headerSearch}>
          <div className="bmh-row">
            <label className="bmh-field">
              <span className={genre ? "is-filled" : ""}>{genre ? copy.genres[genres.findIndex(([value]) => value === genre)] : copy.bikeType}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <select value={genre} onChange={(e) => setGenre(e.currentTarget.value)} aria-label={copy.bikeType}><option value="">{copy.allTypes}</option>{genres.map(([label], index) => <option key={label} value={label}>{copy.genres[index]}</option>)}</select>
            </label>
            <button ref={opener} type="button" className="bmh-field" onClick={openPicker} aria-haspopup="dialog">
              <span className={maker ? "is-filled" : ""}>{maker ? (model ? `${localizeBikeBrand(maker, locale)} ${model}` : localizeBikeBrand(maker, locale)) : copy.makerModel}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <label className="bmh-field">
              <span className={region !== "전국" ? "is-filled" : ""}>{region === "전국" ? copy.regionAll : copy.regions[regions.indexOf(region)]}</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <select value={region} onChange={(e) => setRegion(e.currentTarget.value)} aria-label={copy.region}>{regions.map((r, index) => <option key={r} value={r}>{copy.regions[index]}</option>)}</select>
            </label>
            <button type="button" className="bmh-cta" onClick={search}>{count.toLocaleString(localeOption.intl)}{copy.viewUnit}</button>
          </div>
          <h2 className="bmh-genres-title">{copy.genreTitle}</h2>
          <div className="bmh-genres">
            {genres.map(([label, file], index) => (
              <a key={label} href={listUrl({ genre: label }, locale)}>
                <span><img src={pic("..", "assets", "bike", "types", "autoscout-v01", `${file}.png`)} alt="" loading="lazy" /></span>
                {copy.genres[index]}
              </a>
            ))}
          </div>
        </section>

        <section className="bmh-abrand" aria-labelledby="bmh-abrand-title">
          <div className="bmh-abrand-head">
            <h2 id="bmh-abrand-title"><button type="button" onClick={openPicker}>{copy.popularBrands}<span className="bmh-abrand-go" aria-hidden="true"><svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M2 8h11M9 3.5 13.5 8 9 12.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></span></button></h2>
            <div className="bmh-abrand-nav">
              <button type="button" aria-label={copy.previousBrand} disabled={!brandEdge.prev} onClick={() => scrollBrands(-1)}><svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M10 3 5 8l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
              <button type="button" aria-label={copy.nextBrand} disabled={!brandEdge.next} onClick={() => scrollBrands(1)}><svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m6 3 5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg></button>
            </div>
          </div>
          <div className="bmh-abrand-row" ref={brandRow} onScroll={updateBrandEdge}>
            {brandRail.map(([name, file, n]) => (
              <a key={name} href={listUrl({ maker: name }, locale)}>
                <span className="bmh-abrand-tile"><img src={pic("..", "assets", "bike", "logos", "lightwagen-trim", file)} alt="" loading="lazy" /></span>
                <strong>{localizeBikeBrand(name, locale)}</strong>
                <small>{copy.listingCount} {n.toLocaleString(localeOption.intl)}</small>
              </a>
            ))}
          </div>
        </section>

        <section className="bmh-sell" aria-labelledby="bmh-sell-title">
          <div className="bmh-sell-lead">
            <span className="bmh-sell-swoosh" aria-hidden="true" />
            <h2 id="bmh-sell-title">{copy.sellLead[0]}<br />{copy.sellLead[1]}</h2>
            <img src={pic("..", "assets", "bike", "models", "harley-davidson", "BKM005-G001.png")} alt="" aria-hidden="true" />
          </div>
          <div className="bmh-sell-card is-fast">
            <span className="bmh-sell-flag">{copy.fastest}</span>
            <h3>{copy.sellDealerTitle}</h3>
            <ul>{copy.sellDealerBullets.map((item) => <li key={item}>{item}</li>)}</ul>
            <a className="bmh-solid" href={listUrl({ register: "bike" }, locale)}>{copy.sellDealerButton}</a>
          </div>
          <div className="bmh-sell-card">
            <h3>{copy.sellDirectTitle}</h3>
            <ul>{copy.sellDirectBullets.map((item) => <li key={item}>{item}</li>)}</ul>
            <a className="bmh-outline" href={listUrl({ register: "bike" }, locale)}>{copy.sellDirectButton}</a>
          </div>
        </section>

        <section className="bmh-sec" aria-labelledby="bmh-popular">
          <h2 id="bmh-popular" className="bmh-h2">{copy.popular}</h2>
          <div className="bmh-ct-grid">{popular.map((r) => <ChototCard key={r.scenario_id} row={r} saved={saved.has(r.scenario_id)} onSave={() => toggleSave(r.scenario_id)} locale={locale} />)}</div>
        </section>

        <section className="bmh-sec" aria-labelledby="bmh-fresh">
          <h2 id="bmh-fresh" className="bmh-h2">{copy.fresh}</h2>
          <div className="bmh-ct-grid">{fresh.map((r) => <ChototCard key={r.scenario_id} row={r} saved={saved.has(r.scenario_id)} onSave={() => toggleSave(r.scenario_id)} locale={locale} />)}</div>
        </section>

        <section className="bmh-news" aria-labelledby="bmh-news-title">
          <div className="bmh-news-copy">
            <h2 id="bmh-news-title">{copy.newsletterTitle}</h2>
            <p>{copy.newsletterBody}</p>
            <form onSubmit={(e) => { e.preventDefault(); setToast(copy.emailToast); }}>
              <input type="email" placeholder={copy.email} aria-label={copy.email} />
              <button type="submit">{copy.subscribe}</button>
            </form>
          </div>
          <span className="bmh-news-art" aria-hidden="true"><span /><img src={pic("..", "assets", "bike", "models", "honda", "BKM001-G005.png")} alt="" /></span>
        </section>

        <section className="bmh-seo" aria-labelledby="bmh-seo-title">
          <h2 id="bmh-seo-title">{copy.seoTitle}</h2>
          <h3>{copy.popularModels}</h3>
          <div className="bmh-seo-cols">
            {brandModels.map(([brand, models]) => (
              <div key={brand}>
                <h4>{localizeBikeBrand(brand, locale)}</h4>
                {models.map((m) => <a key={m} href={listUrl({ maker: brand, model: m }, locale)}>{m}</a>)}
              </div>
            ))}
          </div>
          <h3>{copy.byGenre}</h3>
          <div className="bmh-seo-inline">{genres.map(([g], index) => <a key={g} href={listUrl({ genre: g }, locale)}>{copy.genres[index]} {copy.usedSuffix}</a>)}</div>
        </section>
      </div>

      <footer className="bmh-footer">
        <div className="bmh-wrap">
          <strong>{copy.siteAria}</strong>
          <span>{copy.footer}</span>
        </div>
      </footer>

      {open ? (
        <div className="bmh-layer">
          <button type="button" className="bmh-dim" aria-label={copy.close} onClick={closePicker} />
          <div className="bmh-modal" role="dialog" aria-modal="true" aria-labelledby="bmh-modal-title">
            <header>
              {step === "model" ? (
                <button type="button" className="bmh-icon" aria-label={copy.backToMaker} onClick={() => { setStep("maker"); setKeyword(""); }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              ) : <span />}
              <h2 id="bmh-modal-title">{step === "maker" ? copy.manufacturer : localizeBikeBrand(draftMaker, locale)}</h2>
              <button ref={closeBtn} type="button" className="bmh-icon" aria-label={copy.close} onClick={closePicker}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </header>
            <div className="bmh-modal-search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" /><path d="m20 20-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input value={keyword} onChange={(e) => setKeyword(e.currentTarget.value)} placeholder={step === "maker" ? copy.makerSearch : copy.modelSearch} aria-label={copy.search} />
            </div>
            <div className="bmh-modal-body">
              <h3>{step === "maker" ? copy.popularMaker : copy.model}</h3>
              <ul>
                {step === "model" ? <li><button type="button" className={!draftModel ? "is-on" : ""} onClick={() => setDraftModel("")}><span>{copy.allMaker(localizeBikeBrand(draftMaker, locale))}</span><em>{countOf(draftMaker, "").toLocaleString(localeOption.intl)}</em></button></li> : null}
                {(step === "maker" ? makerList : modelList).filter(([n]) => !q || n.toLowerCase().includes(q.toLowerCase())).map(([n, c]) => (
                  <li key={n}>
                    <button type="button" className={(step === "maker" ? draftMaker : draftModel) === n ? "is-on" : ""} onClick={() => {
                      if (step === "maker") { setDraftMaker(n); setDraftModel(""); setStep("model"); setKeyword(""); } else setDraftModel(n);
                    }}>
                      <span>{step === "maker" ? localizeBikeBrand(n, locale) : n}</span><em>{c.toLocaleString(localeOption.intl)}</em>
                      {step === "maker" ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <footer>
              <button type="button" className="bmh-reset" disabled={!draftMaker} onClick={() => { setDraftMaker(""); setDraftModel(""); setStep("maker"); }}>{copy.reset}</button>
              <button type="button" className="bmh-cta" onClick={() => { setMaker(draftMaker); setModel(draftModel); closePicker(); }}>{countOf(draftMaker, draftModel).toLocaleString(localeOption.intl)}{copy.viewUnit}</button>
            </footer>
          </div>
        </div>
      ) : null}
      {toast ? <div className="bmh-toast" role="status">{toast}</div> : null}
    </div>
  );
}
