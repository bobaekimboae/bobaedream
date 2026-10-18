// PC 메인 시안 v01 (2026-10-18) — 레거시 보배드림 메인(좌 매물 · 우 커뮤니티 베스트)을 신버전으로 정리한 미리보기.
// 진입: ./?home=pc  (기존 모바일 메인 ./ 는 그대로)
// v02(2026-10-18 「腾讯网 汽车처럼 분리」): 전체 폭 검색 띠를 없애고 헤더 바로 아래부터 좌(큰 추천 슬라이드 + 3열 카드) · 우(커뮤니티 레일) 두 칸으로 나눴다. 검색은 헤더로 올렸다.
// 구성 근거: 유럽(mobile.de · AutoScout24 · Autotrader UK · La Centrale) 상단 검색 띠 + 차량 유형 줄,
// 한국 레거시 보배드림의 좌 매물 · 우 커뮤니티 베스트 2단. 매물은 럭셔리카 가상 매물 v01(UI 검증용 가상 값),
// 커뮤니티 글은 화면 확인용 예시 문구다(실제 게시글 · 작성자 아님).
import { useEffect, useMemo, useState } from "react";
import { luxuryDealers, luxuryListingRows, type LuxuryListingRow } from "../prototype/data/luxury-category-v01";
import "./pc-main-home.css";

// 배포 빌드가 「./assets/」 문자열을 고쳐 쓰므로 기존 메인과 같이 조각을 이어 붙인다
const asset = (path: string) => ["assets", path].join("/");

const gnbItems: Array<{ label: string; category?: string; community?: true }> = [
  { label: "차량검색", category: "전체" },
  { label: "국산차", category: "국산차" },
  { label: "수입차", category: "수입차" },
  { label: "트럭 · 특장", category: "트럭 · 특장" },
  { label: "중장비", category: "건설기계" },
  { label: "바이크", category: "바이크" },
  { label: "중고부품", category: "부품 · 용품" },
  { label: "커뮤니티", community: true },
];

const vehicleTypes = [
  { label: "전체차량", category: "전체", icon: "category_all_vehicles_v01.svg" },
  { label: "중고차", category: "중고차", icon: "category_used_car_v01.svg" },
  { label: "테마별 중고차", category: "슈퍼카", icon: "category_theme_used_car_v01.svg" },
  { label: "트럭 · 특장", category: "트럭 · 특장", icon: "category_truck_special_v01.svg" },
  { label: "바이크", category: "바이크", icon: "category_bike_v01.svg" },
  { label: "캠핑카", category: "캠핑카", icon: "category_camper_v01.svg" },
  { label: "건설기계", category: "건설기계", icon: "category_construction_v01.svg" },
  { label: "자재운반장비", category: "자재운반장비", icon: "category_material_handling_v01.svg" },
  { label: "부품 · 용품", category: "부품 · 용품", icon: "category_parts_v01.svg" },
];

const popularKeywords = ["그랜저", "카니발", "포터2", "G80", "쏘렌토", "E클래스", "포르쉐 911", "레인지로버"];

const priceShortcuts = [
  { label: "1천만원 이하", max: "1000" },
  { label: "1~2천만원", min: "1000", max: "2000" },
  { label: "2~3천만원", min: "2000", max: "3000" },
  { label: "3~5천만원", min: "3000", max: "5000" },
  { label: "5천~1억", min: "5000", max: "10000" },
  { label: "1억 이상", min: "10000" },
];

const rareTags = ["슈퍼카", "튜닝카", "올드카", "캠핑카", "픽업트럭", "컨버터블", "JDM"];

// 화면 확인용 예시 글(실제 게시글 아님). 순위 · 댓글 수도 예시 값이다.
const bestPosts: Record<string, Array<[string, number, string]>> = {
  실시간: [
    ["고속도로 2차로 정속 주행, 이게 맞나요?", 142, "자유게시판"],
    ["신차 출고 3일 만에 문콕… 블박 확인했습니다", 98, "블랙박스"],
    ["10년 탄 그랜저 보내고 왔습니다", 87, "자유게시판"],
    ["겨울 타이어 지금 바꿔도 될까요", 64, "정비"],
    ["주차장 이중주차 매너, 다들 어떻게 하세요", 211, "자유게시판"],
    ["전기차 첫 겨울, 주행거리 실측 공유", 73, "전기차"],
    ["중고 SUV 고르는 중인데 의견 부탁드려요", 56, "구매상담"],
    ["세차 후 물자국 안 남기는 방법", 41, "세차"],
    ["터널 안 차로 변경 단속 기준 정리", 129, "교통"],
    ["첫 차로 경차 vs 준중형 고민입니다", 88, "구매상담"],
  ],
  오늘: [
    ["엔진오일 교환 주기, 정답이 있을까요", 77, "정비"],
    ["시골길 야간 운전, 하이빔 매너 이야기", 102, "자유게시판"],
    ["캠핑카 6개월 차 솔직 후기", 69, "캠핑"],
    ["중고차 계약 전 꼭 보는 서류 체크리스트", 154, "구매상담"],
    ["트럭 적재함 정리 아이디어 모음", 33, "트럭"],
    ["출퇴근 연비 한 달 기록 공유합니다", 48, "연비"],
    ["바이크 입문 장비 어디까지 사야 하나요", 61, "바이크"],
    ["타이어 공기압 경고등 자주 뜨는 이유", 52, "정비"],
    ["주말 드라이브 코스 추천 받아요", 95, "여행"],
    ["썬팅 농도 몇 % 하셨어요?", 117, "자유게시판"],
  ],
  주간: [
    ["올드카 복원 1년 기록 마무리했습니다", 233, "올드카"],
    ["사고 처리 과정 정리 (과실 협의까지)", 318, "사고"],
    ["수입 중고차 첫 정비비 실제로 얼마 나왔나", 201, "정비"],
    ["가족용 7인승 3종 비교 시승 후기", 187, "시승기"],
    ["블랙박스 메모리 관리 이렇게 하세요", 92, "블랙박스"],
    ["장거리 운전 피로 줄이는 시트 세팅", 76, "자유게시판"],
    ["전기 트럭 한 달 운행 후기", 108, "트럭"],
    ["세차장 매너 이야기", 164, "세차"],
    ["타이어 브랜드별 소음 비교", 83, "정비"],
    ["중고 바이크 거래 시 확인할 것", 71, "바이크"],
  ],
  댓글순: [
    ["사고 처리 과정 정리 (과실 협의까지)", 318, "사고"],
    ["올드카 복원 1년 기록 마무리했습니다", 233, "올드카"],
    ["주차장 이중주차 매너, 다들 어떻게 하세요", 211, "자유게시판"],
    ["수입 중고차 첫 정비비 실제로 얼마 나왔나", 201, "정비"],
    ["가족용 7인승 3종 비교 시승 후기", 187, "시승기"],
    ["세차장 매너 이야기", 164, "세차"],
    ["중고차 계약 전 꼭 보는 서류 체크리스트", 154, "구매상담"],
    ["고속도로 2차로 정속 주행, 이게 맞나요?", 142, "자유게시판"],
    ["터널 안 차로 변경 단속 기준 정리", 129, "교통"],
    ["썬팅 농도 몇 % 하셨어요?", 117, "자유게시판"],
  ],
};

const newsItems = [
  "겨울철 배터리 점검, 언제 하면 좋을까",
  "자동차 관리법 개정에 따른 차량 등록 안내",
  "중고차 성능·상태점검기록부 읽는 법",
];

const formatPrice = (manwon: number) => {
  const eok = Math.floor(manwon / 10000);
  const rest = manwon % 10000;
  if (!eok) return `${rest.toLocaleString("ko-KR")}만원`;
  return rest ? `${eok}억 ${rest.toLocaleString("ko-KR")}만원` : `${eok}억원`;
};
const formatMileage = (km: number) => (km >= 9500 ? `${Math.round(km / 10000).toLocaleString("ko-KR")}만km` : `${(Math.round(km / 1000) * 1000).toLocaleString("ko-KR")}km`);
const titleOf = (row: LuxuryListingRow) => [row.maker, row.model, row.generation, row.trim].filter(Boolean).join(" ");
const placeOf = (row: LuxuryListingRow) => luxuryDealers.find((d) => d.id === row.dealerId)?.place ?? row.sheetRegion;

const listingUrl = (params: Record<string, string>) => `./?${new URLSearchParams({ qf: "guazi", pc: "1", ...params }).toString()}`;
const go = (url: string) => { window.location.href = url; };
const communityUrl = "./community/bobaedream-pc-board-list.html?layout=reddit";

function CarCard({ row, rank }: { row: LuxuryListingRow; rank?: number }) {
  return (
    <a className="pmh-card" href={listingUrl({ category: "럭셔리카", maker: row.maker })}>
      <span className="pmh-card-photo">
        {row.image ? <img src={asset(row.image)} alt="" loading="lazy" /> : null}
        {rank ? <b className="pmh-card-rank">{rank}</b> : null}
      </span>
      <span className="pmh-card-body">
        <strong className="pmh-card-title">{titleOf(row)}</strong>
        <span className="pmh-card-spec">{row.registered}<i />{formatMileage(row.mileage)}<i />{row.fuel}</span>
        <span className="pmh-card-price">{formatPrice(row.price).replace(/만원$/, "")}<small>만원</small></span>
        <span className="pmh-card-place">{placeOf(row)}</span>
      </span>
    </a>
  );
}

export default function PcMainHome() {
  const [bestTab, setBestTab] = useState<"전체" | "SUV" | "세단" | "스포츠카">("전체");
  const [postTab, setPostTab] = useState<keyof typeof bestPosts>("실시간");
  const [rareTag, setRareTag] = useState(rareTags[0]);
  const [query, setQuery] = useState("");
  const maker = "";
  const priceMax = "";
  const [slide, setSlide] = useState(0);

  const rows = useMemo(() => luxuryListingRows.filter((r) => r.image), []);
  const bestRows = useMemo(() => {
    const pool = bestTab === "SUV" ? rows.filter((r) => r.body === "SUV")
      : bestTab === "세단" ? rows.filter((r) => r.body === "세단" || r.body === "왜건")
      : bestTab === "스포츠카" ? rows.filter((r) => r.body === "쿠페" || r.body === "컨버터블")
      : rows;
    return pool.slice(0, 6);
  }, [bestTab, rows]);
  const scoopRows = rows.slice(6, 12);
  const slideRows = useMemo(() => [...rows].sort((x, y) => y.price - x.price).slice(0, 5), [rows]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setTimeout(() => setSlide((n) => (n + 1) % slideRows.length), 5000);
    return () => window.clearTimeout(timer);
  }, [slide, slideRows.length]);
  const rareRows = useMemo(() => {
    const pool = rows.slice(10);
    const offset = (rareTags.indexOf(rareTag) * 3) % pool.length;
    return [...pool, ...pool].slice(offset, offset + 6);
  }, [rareTag, rows]);

  const submitSearch = () => {
    const params: Record<string, string> = {};
    if (query.trim()) params.q = query.trim();
    if (maker) params.maker = maker;
    if (priceMax) params.priceMax = priceMax;
    go(listingUrl(params));
  };

  return (
    <div className="pmh">
      <header className="pmh-header">
        <div className="pmh-wrap pmh-header-row">
          <a className="pmh-logo" href="./?home=pc" aria-label="보배드림 홈">
            <img src={asset("bbm/header-logo.svg")} alt="" />
            <span>보배드림</span>
          </a>
          <nav className="pmh-gnb" aria-label="주 메뉴">
            {gnbItems.map((item) => (
              <a key={item.label} href={item.community ? communityUrl : listingUrl({ category: item.category ?? "전체" })}>{item.label}</a>
            ))}
          </nav>
          <form className="pmh-header-search" role="search" onSubmit={(e) => { e.preventDefault(); submitSearch(); }}>
            <input value={query} onChange={(e) => setQuery(e.currentTarget.value)} placeholder="어떤 차를 찾으세요?" aria-label="차량 검색" />
            <button type="submit" aria-label="검색"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="#fff" strokeWidth="2.4" /><path d="m20 20-4-4" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg></button>
          </form>
          <div className="pmh-header-actions">
            <button type="button" className="pmh-btn-line">로그인/회원가입</button>
            <button type="button" className="pmh-btn-blue" onClick={() => go("./?register=car")}>차량 판매하기</button>
          </div>
        </div>
      </header>

      <div className="pmh-wrap pmh-body">
        <main className="pmh-left">
          <section className="pmh-hero-slide" aria-roledescription="carousel" aria-label="오늘의 추천 매물">
            {(() => {
              const row = slideRows[slide];
              return (
                <a className="pmh-slide" href={listingUrl({ category: "럭셔리카", maker: row.maker })}>
                  <span className="pmh-slide-copy">
                    <b className="pmh-slide-tag">오늘의 추천</b>
                    <strong>{titleOf(row)}</strong>
                    <span className="pmh-card-spec">{row.registered}<i />{formatMileage(row.mileage)}<i />{row.fuel}</span>
                    <span className="pmh-slide-price">{formatPrice(row.price).replace(/만원$/, "")}<small>만원</small></span>
                    <span className="pmh-card-place">{placeOf(row)}</span>
                    <span className="pmh-slide-dots" aria-hidden="true">{slideRows.map((r, i) => <i key={r.number} className={i === slide ? "is-on" : ""} />)}</span>
                  </span>
                  <span className="pmh-slide-photo">{row.image ? <img src={asset(row.image)} alt="" /> : null}</span>
                </a>
              );
            })()}
            <button type="button" className="pmh-slide-nav is-prev" aria-label="이전 매물" onClick={() => setSlide((slide + slideRows.length - 1) % slideRows.length)}>‹</button>
            <button type="button" className="pmh-slide-nav is-next" aria-label="다음 매물" onClick={() => setSlide((slide + 1) % slideRows.length)}>›</button>
          </section>

          <nav className="pmh-types" aria-label="차량 유형">
            {vehicleTypes.map((t) => (
              <a key={t.label} href={listingUrl({ category: t.category })}>
                <span><img src={asset(`category/icons/v01/${t.icon}`)} alt="" /></span>
                {t.label}
              </a>
            ))}
          </nav>

          <section className="pmh-box" aria-labelledby="pmh-best-title">
            <div className="pmh-box-head">
              <h2 id="pmh-best-title">오늘의 베스트카</h2>
              <div className="pmh-seg" role="tablist" aria-label="베스트카 구분">
                {(["전체", "SUV", "세단", "스포츠카"] as const).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={bestTab === t} className={bestTab === t ? "is-on" : ""} onClick={() => setBestTab(t)}>{t}</button>
                ))}
              </div>
              <a className="pmh-more" href={listingUrl({ category: "럭셔리카" })}>전체보기</a>
            </div>
            <div className="pmh-grid pmh-grid-3">
              {bestRows.map((row, i) => <CarCard key={row.number} row={row} rank={i + 1} />)}
            </div>
          </section>

          <section className="pmh-box" aria-labelledby="pmh-scoop-title">
            <div className="pmh-box-head">
              <h2 id="pmh-scoop-title">특종매물</h2>
              <p>딜러가 광고로 올린 추천 매물이에요</p>
              <a className="pmh-more" href={listingUrl({ category: "중고차" })}>전체보기</a>
            </div>
            <div className="pmh-grid pmh-grid-3">
              {scoopRows.map((row) => <CarCard key={row.number} row={row} />)}
            </div>
          </section>

          <section className="pmh-box" aria-labelledby="pmh-rare-title">
            <div className="pmh-box-head">
              <h2 id="pmh-rare-title">보배에서만 볼 수 있는 희귀차</h2>
              <a className="pmh-more" href={listingUrl({ category: "슈퍼카" })}>전체보기</a>
            </div>
            <div className="pmh-chips" role="tablist" aria-label="희귀차 테마">
              {rareTags.map((t) => (
                <button key={t} type="button" role="tab" aria-selected={rareTag === t} className={rareTag === t ? "is-on" : ""} onClick={() => setRareTag(t)}>#{t}</button>
              ))}
            </div>
            <div className="pmh-grid pmh-grid-3">
              {rareRows.map((row) => <CarCard key={row.number} row={row} />)}
            </div>
          </section>

          <section className="pmh-box" aria-labelledby="pmh-price-title">
            <div className="pmh-box-head"><h2 id="pmh-price-title">가격대별 중고차</h2></div>
            <div className="pmh-price-links">
              {priceShortcuts.map((p) => (
                <a key={p.label} href={listingUrl({ ...(p.min ? { priceMin: p.min } : {}), ...(p.max ? { priceMax: p.max } : {}) })}>{p.label}</a>
              ))}
            </div>
          </section>
        </main>

        <aside className="pmh-right" aria-label="커뮤니티">
          <div className="pmh-sticky">
            <section className="pmh-box pmh-community" aria-labelledby="pmh-community-title">
              <div className="pmh-box-head">
                <h2 id="pmh-community-title">커뮤니티 베스트</h2>
                <a className="pmh-more" href={communityUrl}>더보기</a>
              </div>
              <div className="pmh-tabs" role="tablist" aria-label="베스트글 기준">
                {(Object.keys(bestPosts) as Array<keyof typeof bestPosts>).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={postTab === t} className={postTab === t ? "is-on" : ""} onClick={() => setPostTab(t)}>{t}</button>
                ))}
              </div>
              <ol className="pmh-posts">
                {bestPosts[postTab].map(([title, comments, board], i) => (
                  <li key={title}>
                    <a href={communityUrl}>
                      <b className={i < 3 ? "is-top" : ""}>{i + 1}</b>
                      <span className="pmh-post-title">{title}</span>
                      <em>{comments}</em>
                    </a>
                    <small>{board}</small>
                  </li>
                ))}
              </ol>
            </section>
            <section className="pmh-box pmh-side" aria-labelledby="pmh-news-title">
              <div className="pmh-box-head"><h2 id="pmh-news-title">자동차 뉴스 · 공지</h2></div>
              <ul className="pmh-news">{newsItems.map((n) => <li key={n}>{n}</li>)}</ul>
            </section>
            <section className="pmh-box pmh-side" aria-labelledby="pmh-kw-title">
              <div className="pmh-box-head"><h2 id="pmh-kw-title">인기 검색어</h2></div>
              <div className="pmh-keywords">{popularKeywords.map((k) => <a key={k} href={listingUrl({ q: k })}>{k}</a>)}</div>
            </section>
            <a className="pmh-box pmh-sell" href="./?register=car">
              <strong>내 차 팔기</strong>
              <span>차량번호만 입력하면 딜러 견적을 비교해 드려요</span>
              <b>견적 받기 ›</b>
            </a>
          </div>
        </aside>
      </div>

      <footer className="pmh-footer">
        <div className="pmh-wrap">보배드림 PC 메인 시안 v01 · 매물과 커뮤니티 글은 화면 확인용 예시입니다.</div>
      </footer>
    </div>
  );
}
