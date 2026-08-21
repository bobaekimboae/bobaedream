import { useMemo, useState } from "react";
import { BottomSheet, Carousel, KeyboardInput, MobileScroll, useKeyboard } from "./mobile";
import "./prototype.css";

type SellerType = "전체" | "개인" | "딜러";
type SheetType = "filter" | "carType" | "maker" | "year" | "price" | "region" | "sort" | null;

type Car = {
  id: number;
  maker: string;
  sellerType: Exclude<SellerType, "전체">;
  title: string;
  trim: string;
  specs: string[];
  price: string;
  lease?: string;
  place: string;
  views: number;
  dealer: string;
  stock: number;
  posted: string;
  photos: number;
};

const asset = (path: string) => `${import.meta.env.BASE_URL}assets/${path}`;

const brands = [
  { name: "BMW", logo: asset("brand/bmw.svg") },
  { name: "벤츠", logo: asset("brand/benz.png") },
  { name: "아우디", logo: asset("brand/audi.svg") },
  { name: "포르쉐", logo: asset("brand/porsche.png"), full: true },
  { name: "미니", logo: asset("brand/mini.svg") },
];

const cars: Car[] = [
  {
    id: 1, maker: "벤츠", sellerType: "딜러", title: "제네시스 G80", trim: "가솔린 2.5 터보",
    specs: ["26년02월", "17km", "가솔린", "갈색시트"], price: "7,000 만원",
    place: "서울 서초구 · 오토갤러리", views: 73, dealer: "한강모터스 박강산 딜러", stock: 17, posted: "1분 전", photos: 9,
  },
  {
    id: 2, maker: "벤츠", sellerType: "개인", title: "제네시스 G80", trim: "가솔린 2.5 터보",
    specs: ["26년02월", "17km", "가솔린", "갈색시트"], price: "월 7,000 만원", lease: "/15개월 (인수금 500만원)",
    place: "서울 서초구 · 오토갤러리", views: 73, dealer: "한강모터스 박강산 딜러", stock: 17, posted: "1분 전", photos: 9,
  },
  {
    id: 3, maker: "BMW", sellerType: "딜러", title: "제네시스 G80", trim: "가솔린 2.5 터보",
    specs: ["26년02월", "17km", "가솔린", "갈색시트"], price: "7,000 만원",
    place: "서울 서초구 · 오토갤러리", views: 73, dealer: "한강모터스 박강산 딜러", stock: 17, posted: "1분 전", photos: 9,
  },
  {
    id: 4, maker: "아우디", sellerType: "딜러", title: "제네시스 G80", trim: "가솔린 2.5 터보",
    specs: ["26년02월", "17km", "가솔린", "갈색시트"], price: "7,000 만원",
    place: "서울 서초구 · 오토갤러리", views: 73, dealer: "한강모터스 박강산 딜러", stock: 17, posted: "1분 전", photos: 9,
  },
];

const sheetLabels: Record<Exclude<SheetType, null>, string> = {
  filter: "상세 필터", carType: "차량 유형", maker: "제조사", year: "연식", price: "가격", region: "지역", sort: "정렬",
};

function Icon({ name, className = "" }: { name: string; className?: string }) {
  return <img className={`ui-icon ${className}`} src={asset(`ui/${name}`)} alt="" aria-hidden="true" draggable={false} />;
}

function Header({ query, setQuery }: { query: string; setQuery: (query: string) => void }) {
  const keyboard = useKeyboard();

  return (
    <header className="top-bar" aria-label="중고차 검색">
      <button className="icon-button back-button" type="button" aria-label="뒤로 가기" onClick={() => window.history.back()}><Icon name="back.svg" /></button>
      <label className="search-field">
        <Icon name="search.svg" />
        <KeyboardInput aria-label="중고차 검색" value={query} onChange={(event) => setQuery(event.currentTarget.value)} onBlur={() => keyboard.hide()} placeholder="중고차" />
        <span className="search-divider" />
        <button type="button" className="search-save" aria-label="검색 조건 저장"><Icon name="bookmark.svg" /></button>
      </label>
      <button className="icon-button" type="button" aria-label="찜한 차량"><Icon name="heart.svg" /></button>
      <button className="icon-button" type="button" aria-label="메시지"><Icon name="message.svg" /></button>
    </header>
  );
}

function FilterChip({ label, icon, active, onClick }: { label: string; icon?: string; active?: boolean; onClick: () => void }) {
  return (
    <button className={`filter-chip${active ? " is-active" : ""}`} type="button" aria-pressed={active} onClick={onClick}>
      {icon ? <Icon name={icon} /> : null}<span>{label}</span>{!icon || active ? <Icon name={active ? "close.svg" : "chevron-down.svg"} /> : null}
    </button>
  );
}

function CarCard({ car, compact, liked, onToggleLike }: { car: Car; compact: boolean; liked: boolean; onToggleLike: () => void }) {
  return (
    <article className={`car-card${compact ? " is-compact" : ""}`}>
      <div className="car-photo-wrap">
        <img className="car-photo" src={asset("cars/thumbnail.png")} alt={`${car.title} ${car.trim} 흰색 차량, ${car.posted}, 사진 ${car.photos}장`} draggable={false} />
      </div>
      <div className="car-copy">
        <div className="car-main">
          <h2>{car.title}</h2><p className="trim">{car.trim}</p><p className="specs">{car.specs.join(" · ")}</p>
          <p className="price">{car.price}</p>{car.lease ? <p className="lease">{car.lease}</p> : null}
          <div className="badges"><span>인증중고차</span><span>1년 보증</span></div>
        </div>
        <div className="car-footer">
          <p className="location-line"><Icon name="location-gray.svg" />{car.place}<span className="dot">·</span><Icon name="views.svg" />{car.views}</p>
          <div className="dealer-line">
            <img className="dealer-avatar" src={asset("cars/dealer.png")} alt="" aria-hidden="true" draggable={false} />
            <p><strong>{car.dealer}</strong> · 판매중 <b>{car.stock}대</b></p>
            <button className={`like-button${liked ? " is-liked" : ""}`} type="button" aria-label={`${car.title} 찜하기`} aria-pressed={liked} onClick={onToggleLike}><Icon name="heart-outline.svg" /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Prototype() {
  const [query, setQuery] = useState("");
  const [sellerType, setSellerType] = useState<SellerType>("전체");
  const [maker, setMaker] = useState<string | null>(null);
  const [sheet, setSheet] = useState<SheetType>(null);
  const [sort, setSort] = useState("최신순");
  const [compact, setCompact] = useState(false);
  const [videoOnly, setVideoOnly] = useState(false);
  const [liked, setLiked] = useState<number[]>([]);

  const visibleCars = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cars.filter((car) => (sellerType === "전체" || car.sellerType === sellerType) && (!maker || car.maker === maker) && (!normalized || `${car.title} ${car.trim} ${car.maker}`.toLowerCase().includes(normalized)));
  }, [maker, query, sellerType]);

  const resetFilters = () => { setMaker(null); setSellerType("전체"); setQuery(""); setSort("최신순"); };
  const chooseMaker = (nextMaker: string | null) => { setMaker(nextMaker); setSheet(null); };

  return (
    <>
      <MobileScroll className="app-screen">
        <main className="marketplace" aria-label="중고차 리스트">
          <Header query={query} setQuery={setQuery} />
          <section className="region-bar" aria-label="지역 선택">
            <button type="button" onClick={() => setSheet("region")}><Icon name="location-blue.svg" /><span className="region-label">지역:</span><strong>전국</strong><Icon name="region-chevron.svg" /></button>
            <button type="button" className="reset-button" onClick={resetFilters}>초기화</button>
          </section>
          <Carousel ariaLabel="중고차 필터" className="filter-rail" contentClassName="filter-track">
            <FilterChip label="필터" icon="filter.svg" onClick={() => setSheet("filter")} />
            <FilterChip label="중고차" active onClick={() => setSheet("carType")} />
            <FilterChip label={maker ?? "제조사"} active={Boolean(maker)} onClick={() => setSheet("maker")} />
            <FilterChip label="연식" onClick={() => setSheet("year")} />
            <FilterChip label="가격" onClick={() => setSheet("price")} />
          </Carousel>
          <section className="brand-row" aria-label="제조사 빠른 선택">
            <span className="brand-title">제조사</span>
            <Carousel ariaLabel="제조사" className="brand-carousel" contentClassName="brand-track">
              {brands.map((brand) => (
                <button key={brand.name} className={`brand-item${maker === brand.name ? " is-selected" : ""}`} type="button" aria-pressed={maker === brand.name} onClick={() => setMaker(maker === brand.name ? null : brand.name)}>
                  {brand.full ? <img className="brand-full" src={brand.logo} alt="" aria-hidden="true" draggable={false} /> : <span className="brand-logo"><img src={brand.logo} alt="" aria-hidden="true" draggable={false} /></span>}
                  {!brand.full ? <span>{brand.name}</span> : null}
                </button>
              ))}
            </Carousel>
          </section>
          <section className="video-toggle-row" aria-label="영상 매물 설정">
            <span>영상 매물</span>
            <button type="button" role="switch" aria-checked={videoOnly} className={videoOnly ? "is-on" : ""} onClick={() => setVideoOnly((value) => !value)}><span /></button>
          </section>
          <nav className="list-toolbar" aria-label="매물 유형과 정렬">
            <div className="seller-tabs" role="tablist" aria-label="판매자 유형">
              {(["전체", "개인", "딜러"] as SellerType[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={sellerType === tab} className={sellerType === tab ? "is-selected" : ""} onClick={() => setSellerType(tab)}>{tab}</button>)}
            </div>
            <div className="sort-controls">
              <button type="button" className="sort-button" onClick={() => setSheet("sort")}>{sort}<Icon name="sort-arrow.svg" /></button><span className="toolbar-divider" />
              <button type="button" className={`density-button${compact ? " is-active" : ""}`} aria-label="목록 간격 전환" aria-pressed={compact} onClick={() => setCompact((value) => !value)}><Icon name="list.svg" /></button>
            </div>
          </nav>
          <section className="car-list" aria-live="polite">
            {visibleCars.length ? visibleCars.map((car) => <CarCard key={car.id} car={car} compact={compact} liked={liked.includes(car.id)} onToggleLike={() => setLiked((current) => current.includes(car.id) ? current.filter((id) => id !== car.id) : [...current, car.id])} />) : (
              <div className="empty-state"><strong>조건에 맞는 차량이 없어요</strong><span>필터를 초기화하고 다시 찾아보세요.</span><button type="button" onClick={resetFilters}>필터 초기화</button></div>
            )}
          </section>
        </main>
      </MobileScroll>
      <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)} title={sheet ? sheetLabels[sheet] : "필터"} description="원하는 조건을 선택해 매물을 좁혀보세요." snap={0.48}>
        <div className="sheet-options">
          {sheet === "maker" || sheet === "filter" ? <><button type="button" className={!maker ? "is-selected" : ""} onClick={() => chooseMaker(null)}>전체 제조사</button>{brands.map((brand) => <button key={brand.name} type="button" className={maker === brand.name ? "is-selected" : ""} onClick={() => chooseMaker(brand.name)}>{brand.name}</button>)}</> : sheet === "sort" ? ["최신순", "낮은 가격순", "높은 가격순"].map((label) => <button key={label} type="button" className={sort === label ? "is-selected" : ""} onClick={() => { setSort(label); setSheet(null); }}>{label}</button>) : ["전체", sheet === "region" ? "서울" : "추천 조건", sheet === "region" ? "경기" : "인기 조건"].map((label) => <button key={label} type="button" onClick={() => setSheet(null)}>{label}</button>)}
        </div>
      </BottomSheet>
    </>
  );
}

