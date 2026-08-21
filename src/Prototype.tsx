import { createContext, useContext, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClockIcon,
  EyeOpenIcon,
  HeartFilledIcon,
  HeartIcon,
  LockClosedIcon,
  MobileIcon,
  QuestionMarkCircledIcon,
} from "@radix-ui/react-icons";
import {
  BottomSheet,
  Carousel,
  FlowStack,
  KeyboardInput,
  MobileScroll,
  type FlowScreen,
  useFlow,
  useKeyboard,
} from "./mobile";
import "./prototype.css";

type SellerType = "전체" | "개인" | "딜러";
type SheetType = "filter" | "carType" | "maker" | "year" | "price" | "region" | "sort" | null;
type DetailSheet = "contact" | "more" | null;

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

const detailPhotos = ["raw-04.png", "raw-09.jpeg", "raw-07.jpeg", "raw-20.jpeg"].map((name) => asset(`detail/${name}`));

const optionItems = [
  "파노라마 선루프", "LED 헤드램프", "어댑티브 크루즈 컨트롤", "후방카메라",
  "어라운드뷰", "스마트키", "순정 내비게이션", "열선시트",
  "통풍시트", "헤드업 디스플레이", "전동트렁크", "자동 긴급제동",
  "차선 이탈방지", "메모리 시트", "스마트 하이빔", "전자식 파킹브레이크",
];

const vehicleInfo = [
  ["연식", "2021년 1월"], ["주행거리", "42,000 km"], ["연료", "가솔린"], ["변속기", "자동 8단"],
  ["배기량", "2,497 cc"], ["색상", "검정색 (외장) · 흰색 (시트)"], ["지역", "서울 서초구"], ["사고이력", "없음"],
];

const extraInfo = [
  ["최초등록일", "2021년 09월 15일"], ["차종", "준중형 SUV"], ["최고출력", "281마력"], ["최대토크", "43kg·m"],
  ["복합연비", "15.7km/ℓ"], ["전장 · 전폭 · 전고", "4,815 × 1,900 × 1,695"], ["공차중량", "1,375kg"], ["인승", "5인승"],
  ["압류 · 저당", "0건 · 0건"], ["재조사 보증", "가능"], ["수입구분", "정식수입"],
];

const relatedCars = [
  { image: "raw-18.jpeg", title: "2021 벤츠 G클래스 3세대 G63 AMG", meta: "19년 12월식 · 42,920 km", price: "9,500만원", place: "경기 수원시", posted: "2일 전" },
  { image: "raw-09.jpeg", title: "2010 쉐보레 타호 6.0L 하이브리드", meta: "19년 12월식 · 42,920 km", price: "1,420만원", place: "서울 성동구", posted: "10일 전" },
  { image: "raw-05.jpeg", title: "2013 롤스로이스 팬텀 6.7 V12", meta: "19년 12월식 · 42,920 km", price: "9,500만원", place: "서울 서초구", posted: "2일 전" },
];

const classCars = [
  { image: "raw-20.jpeg", title: "2024 포르쉐 718 박스터 4.0 GTS", price: "9,500만원", place: "서울 서초구", posted: "32일 전" },
  { image: "raw-07.jpeg", title: "2019 벤틀리 컨티넨탈 GT 3세대 6.0 GTC", price: "9,500만원", place: "서울 서초구", posted: "28일 전" },
  { image: "raw-19.jpeg", title: "2019 맥라렌 570S 스파이더", price: "9,500만원", place: "서울 서초구", posted: "2일 전" },
];

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

function CarCard({ car, compact, liked, onToggleLike, onOpen }: { car: Car; compact: boolean; liked: boolean; onToggleLike: () => void; onOpen: () => void }) {
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article className={`car-card${compact ? " is-compact" : ""}`} role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeyDown={onKeyDown}>
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
            <button className={`like-button${liked ? " is-liked" : ""}`} type="button" aria-label={`${car.title} 찜하기`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}><Icon name="heart-outline.svg" /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

function MarketplaceScreen() {
  const flow = useFlow();
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
            {visibleCars.length ? visibleCars.map((car) => <CarCard key={car.id} car={car} compact={compact} liked={liked.includes(car.id)} onOpen={() => flow.push(detailScreen)} onToggleLike={() => setLiked((current) => current.includes(car.id) ? current.filter((id) => id !== car.id) : [...current, car.id])} />) : (
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

type DetailUi = {
  liked: boolean;
  setLiked: (liked: boolean) => void;
  sheet: DetailSheet;
  setSheet: (sheet: DetailSheet) => void;
  toast: string;
  notify: (message: string) => void;
};

const DetailUiContext = createContext<DetailUi | null>(null);

function useDetailUi() {
  const value = useContext(DetailUiContext);
  if (!value) throw new Error("useDetailUi must be used inside DetailUiProvider");
  return value;
}

function DetailUiProvider({ children }: { children: ReactNode }) {
  const [liked, setLiked] = useState(false);
  const [sheet, setSheet] = useState<DetailSheet>(null);
  const [toast, setToast] = useState("");
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  return <DetailUiContext.Provider value={{ liked, setLiked, sheet, setSheet, toast, notify }}>{children}</DetailUiContext.Provider>;
}

function SectionCard({ title, action, children, className = "" }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`detail-card ${className}`}>
      <div className="detail-section-heading"><h2>{title}</h2>{action}</div>
      {children}
    </section>
  );
}

function InfoGrid({ items }: { items: string[][] }) {
  return <dl className="detail-info-grid">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}

function DetailHero({ onBack }: { onBack: () => void }) {
  const { setSheet, notify } = useDetailUi();
  const [media, setMedia] = useState<"video" | "photos">("photos");

  return (
    <section className="detail-hero" aria-label="차량 사진">
      <Carousel ariaLabel="차량 사진" className="detail-media-carousel" contentClassName="detail-media-track">
        {detailPhotos.map((photo, index) => <img key={photo} src={photo} alt={`벤틀리 차량 사진 ${index + 1}`} draggable={false} />)}
      </Carousel>
      {media === "video" ? <div className="detail-video-overlay"><button type="button" onClick={() => setMedia("photos")} aria-label="영상 일시정지"><span>▶</span><b>차량 영상 재생 중</b></button></div> : null}
      <div className="detail-photo-count">1/24</div>
      <div className="detail-media-tabs" role="tablist" aria-label="미디어 유형">
        <button type="button" role="tab" aria-selected={media === "video"} className={media === "video" ? "is-selected" : ""} onClick={() => setMedia("video")}>영상</button>
        <button type="button" role="tab" aria-selected={media === "photos"} className={media === "photos" ? "is-selected" : ""} onClick={() => setMedia("photos")}>사진 24</button>
      </div>
      <div className="detail-hero-actions">
        <button type="button" aria-label="목록으로 돌아가기" onClick={onBack}><img src={asset("detail/back.svg")} alt="" /></button>
        <div>
          <button type="button" aria-label="공유하기" onClick={() => notify("공유 링크를 복사했어요")}><img src={asset("detail/share.svg")} alt="" /></button>
          <button type="button" aria-label="더보기" onClick={() => setSheet("more")}><img src={asset("detail/more.svg")} alt="" /></button>
        </div>
      </div>
    </section>
  );
}

function VehicleSummary() {
  const { liked, setLiked, notify } = useDetailUi();
  return (
    <section className="vehicle-summary">
      <div className="vehicle-title-row"><h1>2019 벤틀리 컨티넨탈 GT 3세대 6.0 퍼스트 에디션</h1><button type="button" aria-label="매물 찜하기" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? <HeartFilledIcon /> : <HeartIcon />}</button></div>
      <p className="vehicle-lead">6인승 독립시트로 뒷좌석의 편안함을 최우선으로 느껴보세요.</p>
      <p className="vehicle-meta">172무2323 · 19년 02월 · 17,000 km · 가솔린</p>
      <div className="detail-badges"><span>인증중고차</span><span>1년 보증</span></div>
      <div className="detail-price-row">
        <strong>1억 4,500만원</strong>
        <button type="button" onClick={() => notify("최근 가격 변동 내역을 확인했어요")}>가격 변동</button>
      </div>
      <div className="detail-calculators">
        <button type="button" onClick={() => notify("비용 계산기를 열었어요")}>비용 계산기</button>
        <button type="button" onClick={() => notify("보험료 계산을 시작해요")}>보험료 계산</button>
      </div>
      <div className="vehicle-stats"><span><HeartFilledIcon />480</span><span><EyeOpenIcon />2,301</span><span><ClockIcon />1분 전</span></div>
    </section>
  );
}

function OptionsCard() {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? optionItems : optionItems.slice(0, 12);
  return (
    <SectionCard title="차량 옵션" action={<button className="text-action" type="button" onClick={() => setExpanded(!expanded)}>옵션설명</button>}>
      <div className="option-grid">{items.map((label, index) => <div key={label}><img src={asset(`detail/option-${String((index % 13) + 1).padStart(2, "0")}.png`)} alt="" draggable={false} /><span>{label}</span></div>)}</div>
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "옵션 접기" : "옵션 32개 모두 보기"}</button>
      <div className="selected-options"><h3>선택 옵션</h3><dl><div><dt>빌트인 캠 패키지 <QuestionMarkCircledIcon /></dt><dd>70만원</dd></div><div><dt>헤드업 디스플레이 <QuestionMarkCircledIcon /></dt><dd>130만원</dd></div></dl></div>
    </SectionCard>
  );
}

function HistoryCard() {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="보험 이력">
      <div className="insurance-summary"><div>내 차 피해<strong>0건</strong></div><div>상대 차 피해<strong>0건</strong></div><div>특수사항<strong>없음</strong></div></div>
      <h3 className="subheading">차량 이력 상세</h3>
      <dl className="detail-rows"><div><dt>특수 용도 이력</dt><dd>없음</dd></div><div><dt>용도 및 차종</dt><dd>자가용 승용</dd></div>{expanded ? <><div><dt>소유자 변경</dt><dd>1회</dd></div><div><dt>번호판 변경</dt><dd>없음</dd></div></> : null}</dl>
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "보험 이력 접기" : "보험 이력 전체 보기"}</button>
    </SectionCard>
  );
}

function InspectionCard() {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="성능 점검" action={<span className="muted-label">제시번호 : 262621002567</span>}>
      <dl className="detail-info-grid compact"><div><dt>사고이력 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div><div><dt>단순수리 <QuestionMarkCircledIcon /></dt><dd>없음</dd></div></dl>
      {expanded ? <p className="inspection-note">성능·상태 점검기록부 기준으로 주요 골격 손상과 침수 이력이 없습니다.</p> : null}
      <button className="outline-wide-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "성능 점검 접기" : "성능 점검 전체 보기"}</button>
    </SectionCard>
  );
}

function WarrantyCard() {
  return (
    <SectionCard title="제조사 보증">
      <div className="warranty-box"><div><span>일반/차체</span><small>보증 종료</small><i><b style={{ width: "0%" }} /></i></div><div><span>엔진/미션</span><small>2년 10개월 / 99,984km 남음</small><i><b style={{ width: "67%" }} /></i></div></div>
    </SectionCard>
  );
}

function SellerCard() {
  return (
    <section className="detail-card seller-card">
      <div className="seller-profile"><img src={asset("detail/raw-10.jpeg")} alt="한강모터스 박성수 딜러" /><div><h2>한강모터스 박성수 <span>딜러</span></h2><p><b>10대</b> 판매완료 · <b>5대</b> 판매중</p><p>● 서울 서초구 오토갤러리</p></div></div>
      <dl className="detail-rows"><div><dt>종사원번호</dt><dd>SE25-00585 <u>상사/조합정보</u></dd></div><div><dt>매매유형</dt><dd>매매알선(소속 상사 매물)</dd></div></dl>
    </section>
  );
}

function SaleCard() {
  const { notify } = useDetailUi();
  return (
    <SectionCard title="판매 정보">
      <div className="cost-box"><dl><div><dt>차량가</dt><dd>1억5,980만원</dd></div><div><dt>이전 등록비(예상)</dt><dd>314만원</dd></div><div><dt>매도비</dt><dd>33만원</dd></div></dl><div className="cost-total"><span>예상 총 비용</span><strong>1억 6,328만원</strong></div></div>
      <div className="sale-actions"><button type="button" onClick={() => notify("비용 계산기를 열었어요")}>비용계산기</button><button type="button" onClick={() => notify("동급매물로 이동했어요")}>동급매물</button><button type="button" onClick={() => notify("할부매물을 확인해요")}>할부매물</button></div>
      <button className="report-button" type="button" onClick={() => notify("신고 접수 화면을 준비했어요")}><LockClosedIcon /> 신고하기</button>
    </SectionCard>
  );
}

function DescriptionCard() {
  const [expanded, setExpanded] = useState(false);
  return (
    <SectionCard title="상세 설명">
      <div className={`description-copy${expanded ? " is-expanded" : ""}`}>
        <p>2022년 5월식 벤틀리 컨티넨탈 GT 4.0 모델을 판매합니다.<br />벤틀리가 V8엔진으로 구동되는 3세대 컨티넨탈 GT를 선보였다. 쿠페와 컨버터블 형태로 출시될 이 모델은 올해 말부터 미국에서 판매될 예정이며, 이어 2020년 상반기에는 유럽 및 다른 국가에서도 판매될 예정이다.</p>
        <p>파워트레인은 기존의 6.0리터 W12엔진 대신 4.0리터 V8 가솔린 트윈터보 엔진이 장착됐다. 최대출력 550마력, 최고토크 78.5kg·m의 파워를 발휘합니다.</p>
      </div>
      <div className="contact-chip">연락처: 050-6246-9261 <a href="tel:05062469261">연락하기</a></div>
      <button className="more-copy-button" type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>{expanded ? "접기" : "더보기"} <ChevronDownIcon /></button>
    </SectionCard>
  );
}

type RailCar = { image: string; title: string; price: string; place: string; posted: string; meta?: string };

function CarRail({ title, cars: railCars }: { title: string; cars: RailCar[] }) {
  const { notify } = useDetailUi();
  return (
    <section className="related-section"><h2>{title}</h2><Carousel ariaLabel={title} className="related-carousel" contentClassName="related-track">
      {railCars.map((car) => <button key={`${title}-${car.title}`} className="related-card" type="button" onClick={() => notify(`${car.title} 매물을 열었어요`)}><div className="related-photo"><img src={asset(`detail/${car.image}`)} alt={car.title} draggable={false} /><span>{car.posted}</span><b>10 ▣</b></div><div><h3>{car.title}</h3>{car.meta ? <p>{car.meta}</p> : null}<strong>{car.price}</strong><small>● {car.place}</small></div></button>)}
    </Carousel></section>
  );
}

function VehicleDetail() {
  const flow = useFlow();
  const { sheet, setSheet, toast, notify } = useDetailUi();
  return (
    <div className="detail-scene">
      <MobileScroll className="detail-screen">
        <main className="vehicle-detail" aria-label="중고차 상세">
          <DetailHero onBack={flow.pop} />
          <VehicleSummary />
          <div className="detail-gray-stack">
            <SectionCard title="차량 정보"><InfoGrid items={vehicleInfo} /><div className="detail-subsection"><h3>상세 정보</h3><InfoGrid items={extraInfo} /></div></SectionCard>
            <OptionsCard />
            <HistoryCard />
            <InspectionCard />
            <WarrantyCard />
            <SellerCard />
            <SaleCard />
            <DescriptionCard />
          </div>
          <CarRail title="김종선 딜러의 다른 매물" cars={relatedCars} />
          <CarRail title="동급매물" cars={classCars} />
          <p className="safety-copy">안전한 거래와 허위매물 근절을 위해 안심번호(050) 이용 시 통화 내용이 보배드림에 안전하게 보관됩니다.<br />보배드림은 등록 시스템만 제공하며, 판매자가 직접 등록한 차량에 대한 모든 책임은 판매자에게 있습니다. <button type="button" onClick={() => notify("신고하기를 선택했어요")}>신고하기</button></p>
        </main>
      </MobileScroll>
      {toast ? <div className="detail-toast" role="status">{toast}</div> : null}
      <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && setSheet(null)} title={sheet === "more" ? "매물 더보기" : "딜러 상담"} description={sheet === "more" ? "원하는 작업을 선택하세요." : "한강모터스 박성수 딜러에게 문의할 수 있어요."} snap={0.42}>
        <div className="detail-sheet-actions">
          {sheet === "more" ? <><button type="button" onClick={() => { notify("매물 신고를 선택했어요"); setSheet(null); }}>허위매물 신고</button><button type="button" onClick={() => { notify("판매자를 차단했어요"); setSheet(null); }}>판매자 차단</button><button type="button" onClick={() => setSheet(null)}>취소</button></> : <><a href="tel:05062469261"><MobileIcon /> 050-6246-9261 전화하기</a><button type="button" onClick={() => { notify("상담 요청을 보냈어요"); setSheet(null); }}>문자로 상담 요청</button><button type="button" onClick={() => setSheet(null)}>닫기</button></>}
        </div>
      </BottomSheet>
    </div>
  );
}

function DetailFooter() {
  const { liked, setLiked, setSheet } = useDetailUi();
  return (
    <div className="detail-bottom-bar">
      <button className={`detail-bottom-like${liked ? " is-liked" : ""}`} type="button" aria-pressed={liked} onClick={() => setLiked(!liked)}>{liked ? <HeartFilledIcon /> : <HeartIcon />}<span>{liked ? "찜함" : "찜하기"}</span></button>
      <button className="detail-consult" type="button" onClick={() => setSheet("contact")}>상담</button>
      <a className="detail-call" href="tel:05062469261"><img src={asset("detail/call.svg")} alt="" /> 전화하기</a>
    </div>
  );
}

const listScreen: FlowScreen = { id: "marketplace", render: () => <MarketplaceScreen /> };
const detailScreen: FlowScreen = { id: "vehicle-detail", footer: () => <DetailFooter />, footerHeight: 56, render: () => <VehicleDetail /> };

export default function Prototype() {
  return <DetailUiProvider><FlowStack initial={listScreen} /></DetailUiProvider>;
}

