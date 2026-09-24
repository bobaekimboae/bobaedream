import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { BookmarkFilledIcon, BookmarkIcon, ChevronDownIcon, ChevronRightIcon, ChevronUpIcon, DashboardIcon, HeartFilledIcon, HeartIcon, MagnifyingGlassIcon, RowsIcon } from "@radix-ui/react-icons";
import { BottomSheet, Carousel, KeyboardInput, MobileScroll, type FlowScreen, useFlow, useKeyboard } from "../../mobile";
import { ChoTotFilterSheet, ChoTotQuickFilterSheet, emptyChoTotFilters, type ChoTotFilterFocus, type ChoTotFilterState } from "../../ChoTotFilterSheet";
import { Icon } from "../shared";
import {
  asset,
  bodyTypeLabel,
  categoryBrandRails,
  chototTestCars,
  compactYearLabel,
  compactGenerationCardYearLabel,
  defaultBrandRailOptions,
  displayListPlace,
  displaySpecs,
  domesticMakerNames,
  emptyPrice,
  emptyRegion,
  districtsByProvince,
  formatModelLabel,
  getInitialChoTotFilters,
  getInitialQuickFilterStyle,
  generationCardLabel,
  generationCodeLabel,
  generationCountLabel,
  generationDisplayLabel,
  guaziVehicleTypeCategories,
  importedBrandRailOptions,
  inventoryCars,
  isDesktopPreview,
  matchesChoTotFilters,
  matchesPrice,
  normalizeModelSearchText,
  parsePrice,
  priceFilterLabel,
  provinceOptions,
  quickFilterStyleOptions,
  quickGenerationsByMakerModel,
  quickModelVisualsByMaker,
  quickModelsByMaker,
  quickRegions,
  radiusOptions,
  sellerAvatar,
  sellerLabel,
  sheetLabels,
  showGuaziInventoryCounts,
  shuffleCars,
  superLuxuryBrandRailOptions,
  toTrimOption,
  useFavorites,
  vehicleCategories,
  vehicleCategoryOptions,
  type BrandRailOption,
  type Car,
  type QuickTrimOption,
  type QuickFilterStyle,
  type RegionMenu,
  type RegionSelection,
  type SellerType,
  type SheetType,
} from "../data";
import { BrandRailMark, CategoryFilterSheet, DepthCard, MakerSheet, PriceSheet, TrimChip, VehiclePickerSheet } from "../quick-filter";
import { BbCarCard, BbFilterSidebar, BbHeader, BbIcon, BbSwitch } from "./pc-bbmuseum";

let detailScreen: FlowScreen;
let savedListingsScreen: FlowScreen;

function configureListingScreens(screens: { detailScreen: FlowScreen; savedListingsScreen: FlowScreen }) {
  detailScreen = screens.detailScreen;
  savedListingsScreen = screens.savedListingsScreen;
}

// PC 목록 레이아웃은 ?pc=1 이고 폭 820 이상일 때만 켠다. 모바일 마크업은 그대로 둔다.
// 기본은 보배드림 개발 시안형(QF-048~050), &pcl=chotot 이면 초톳형(QF-042~045) 비교 화면.
const desktopLayoutQuery = "(min-width: 820px)";
const pcLayoutStyle = new URLSearchParams(window.location.search).get("pcl") === "chotot" ? "chotot" : "bbmuseum";
const pcAsset = (name: string) => asset(`pc-detail/${name}`);

function useDesktopLayout() {
  const [desktop, setDesktop] = useState(() => isDesktopPreview() && window.matchMedia(desktopLayoutQuery).matches);
  useEffect(() => {
    if (!isDesktopPreview()) return undefined;
    const media = window.matchMedia(desktopLayoutQuery);
    const update = () => setDesktop(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  return desktop;
}

const pcPriceLinks = [
  { label: "1,000만원 이하", min: 0, max: 1000 },
  { label: "1,000~2,000만원", min: 1000, max: 2000 },
  { label: "2,000~3,000만원", min: 2000, max: 3000 },
  { label: "3,000~5,000만원", min: 3000, max: 5000 },
  { label: "5,000만원~1억원", min: 5000, max: 10000 },
  { label: "1억~2억원", min: 10000, max: 20000 },
  { label: "2억원 이상", min: 20000, max: null },
];
const pcBodyLinks = ["세단", "SUV", "해치백", "스포츠카", "승합"];

function PcHeader({ query, setQuery, searchPlaceholder, regionLabel, onOpenRegion, onOpenFavorites, onNotify }: { query: string; setQuery: (query: string) => void; searchPlaceholder: string; regionLabel: string; onOpenRegion: () => void; onOpenFavorites: () => void; onNotify: (message: string) => void }) {
  const keyboard = useKeyboard();
  return (
    <header className="pc-list-header" aria-label="보배드림 중고차 검색">
      <div className="pc-list-header-inner">
        <div className="pc-list-header-left">
          <button type="button" className="pc-header-icon" aria-label="전체 메뉴" onClick={() => onNotify("전체 메뉴는 정식 서비스에서 이용해 주세요.")}><img src={pcAsset("9546-imgGroup1000005392.svg")} alt="" draggable={false} /></button>
          <button type="button" className="pc-list-logo" aria-label="보배드림 중고차 처음으로" onClick={() => document.querySelector(".app-screen")?.scrollTo({ top: 0 })}><span><img src={pcAsset("9546-imgGroup.svg")} alt="" draggable={false} /></span><img src={pcAsset("9546-imgLogo.svg")} alt="보배드림" draggable={false} /></button>
          <button type="button" className="pc-region-pill" aria-label={`현재 지역 ${regionLabel}, 지역 선택 열기`} onClick={onOpenRegion}><Icon name="location-blue.svg" /><span>{regionLabel}</span><ChevronDownIcon /></button>
        </div>
        <label className="pc-search">
          <KeyboardInput aria-label={`${searchPlaceholder} 검색`} value={query} onChange={(event) => setQuery(event.currentTarget.value)} onBlur={() => keyboard.hide()} placeholder={`${searchPlaceholder} 모델명, 트림으로 검색`} />
          <button type="button" className="pc-search-button" aria-label="검색" onPointerDown={(event) => event.preventDefault()} onClick={() => keyboard.hide()}><MagnifyingGlassIcon /></button>
        </label>
        <div className="pc-list-header-right">
          <button type="button" className="pc-header-icon" aria-label="저장한 매물 열기" onClick={onOpenFavorites}><img src={pcAsset("9546-img1IconHeartSize24.svg")} alt="" draggable={false} /></button>
          <button type="button" className="pc-header-icon" aria-label="알림" onClick={() => onNotify("알림은 정식 서비스에서 이용해 주세요.")}><img src={pcAsset("9546-img1IconNoticeSize24.svg")} alt="" draggable={false} /></button>
          <button type="button" className="pc-header-pill is-support" onClick={() => onNotify("고객센터는 정식 서비스에서 이용해 주세요.")}>고객센터</button>
          <button type="button" className="pc-header-pill is-login" onClick={() => onNotify("로그인은 정식 서비스에서 이용해 주세요.")}>로그인</button>
          <button type="button" className="pc-header-pill is-primary" onClick={() => onNotify("내차팔기는 정식 서비스에서 이용해 주세요.")}>내차팔기</button>
          <button type="button" className="pc-profile-menu" aria-label="내 정보 메뉴" onClick={() => onNotify("내 정보는 정식 서비스에서 이용해 주세요.")}><img src={pcAsset("9546-img1IconUserSmileSize24.svg")} alt="" draggable={false} /><ChevronDownIcon /></button>
        </div>
      </div>
    </header>
  );
}

function PcSidebarCard({ title, items, activeLabel, onChoose, visibleCount = 5 }: { title: string; items: string[]; activeLabel?: string; onChoose: (label: string) => void; visibleCount?: number }) {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const shownItems = expanded ? items : items.slice(0, visibleCount);
  return (
    <section className="pc-sidebar-card" aria-label={title}>
      <button type="button" className="pc-sidebar-title" aria-expanded={open} onClick={() => setOpen((value) => !value)}><strong>{title}</strong>{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</button>
      {open ? <>
        <ul>{shownItems.map((label) => <li key={label}><button type="button" className={activeLabel === label ? "is-selected" : ""} aria-pressed={activeLabel === label} onClick={() => onChoose(label)}>{label}</button></li>)}</ul>
        {items.length > visibleCount ? <button type="button" className="pc-sidebar-more" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "접기" : "더보기"}{expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</button> : null}
      </> : null}
    </section>
  );
}

function Header({ query, setQuery, searchPlaceholder, searchSaved, onToggleSearchSaved, onOpenFavorites }: { query: string; setQuery: (query: string) => void; searchPlaceholder: string; searchSaved: boolean; onToggleSearchSaved: () => void; onOpenFavorites: () => void }) {
  const keyboard = useKeyboard();

  return (
    <header className="top-bar" aria-label="중고차 검색">
      <button className="icon-button back-button" type="button" aria-label="뒤로 가기" onClick={() => window.history.back()}><Icon name="back.svg" /></button>
      <label className="search-field">
        <Icon name="search.svg" />
        <KeyboardInput aria-label={`${searchPlaceholder} 검색`} value={query} onChange={(event) => setQuery(event.currentTarget.value)} onBlur={() => keyboard.hide()} placeholder={searchPlaceholder} />
        <span className="search-divider" />
        <button type="button" className={`search-save${searchSaved ? " is-saved" : ""}`} aria-label={searchSaved ? "저장한 검색 조건 삭제" : "검색 조건 저장"} aria-pressed={searchSaved} onPointerDown={(event) => event.preventDefault()} onClick={onToggleSearchSaved}>{searchSaved ? <BookmarkFilledIcon /> : <Icon name="bookmark.svg" />}</button>
      </label>
      <button className="icon-button" type="button" aria-label="저장한 매물 열기" onClick={onOpenFavorites}><Icon name="heart.svg" /></button>
      <button className="icon-button" type="button" aria-label="메시지"><Icon name="message.svg" /></button>
    </header>
  );
}

function FilterChip({ label, icon, active, className = "", onClick, onClear }: { label: string; icon?: string; active?: boolean; className?: string; onClick: () => void; onClear?: () => void }) {
  const chipClassName = `filter-chip${active ? " is-active" : ""}${className ? ` ${className}` : ""}`;
  if (active && onClear) {
    return (
      <div className={chipClassName}>
        <button className="filter-chip-label" type="button" aria-pressed="true" onClick={onClick}><span>{label}</span></button>
        <button className="filter-chip-clear" type="button" aria-label={`${label} 필터 해제`} onClick={onClear}><Icon name="close.svg" /></button>
      </div>
    );
  }
  return (
    <button className={chipClassName} type="button" aria-pressed={active} onClick={onClick}>
      {icon ? <Icon name={icon} /> : null}<span>{label}</span>{!icon && !active ? <Icon name="chevron-down.svg" /> : null}
    </button>
  );
}


// PC 초톳형 카드(QF-045, QF-071 정밀 교정): 초톳 PC 1440 실측 좌표. 사진 왼쪽 위 = (0,0), 오른쪽 내용 x 176
// 제목 y0 · 사양 y28 · 가격 y52 · 위치 y85 · 판매자 y126(문의·찜 y120) — 아래 줄은 사진 아래 끝에 맞춘다
function PcCarRow({ car, liked, onToggleLike, onOpen }: { car: Car; liked: boolean; onToggleLike: () => void; onOpen: () => void }) {
  const displayedSeller = sellerLabel(car);
  const badges = car.badges ?? [];
  const [photoFailed, setPhotoFailed] = useState(!car.image);
  // 사양은 "·" 없이 항목별로(연식·주행거리·연료·변속기)
  const specItems = [...displaySpecs(car.specs.slice(0, 3)).split(" · "), car.filter?.transmission].filter((item): item is string => Boolean(item));
  // 위치: 기본 글자 + 괄호 보조 지역(있을 때만 #8C8C8C)
  const place = displayListPlace(car.place);
  const placeMatch = place.match(/^(.*?)\s*(\(.+\))$/);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };
  return (
    <article className="car-card pc-car-row" role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeyDown={onKeyDown}>
      <div className={`car-photo-wrap${photoFailed ? " is-empty" : ""}`}>
        {photoFailed
          ? <span className="pc-car-photo-empty" aria-label="사진 없음" role="img"><BbIcon name="photo-count" size={24} /></span>
          : <img className="car-photo" src={asset(car.image)} alt={`${car.title} ${car.trim} 차량, ${car.posted}, 사진 ${car.photos}장`} draggable={false} onError={() => setPhotoFailed(true)} />}
        <div className="pc-car-photo-meta" aria-hidden="true">
          <span className="pc-car-posted">{car.posted}</span>
          <span className="pc-car-photo-count">{car.photos}<BbIcon name="photo-count" box={[9, 12]} /></span>
        </div>
      </div>
      <div className="pc-car-copy">
        <h2 className="pc-car-title">{car.title} {car.trim}</h2>
        <p className="pc-car-specs">{specItems.map((item) => <span key={item}>{item}</span>)}</p>
        <div className="pc-car-price">
          <p className="price">{car.price}</p>
          {car.market ? <span className="pc-car-market"><BbIcon name="arrow-down" size={12} />{car.market}</span> : null}
          {car.lease ? <span className="pc-car-lease">{car.lease}</span> : null}
          {badges.length ? <div className="badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
        </div>
        <div className="pc-car-location">
          <BbIcon name="location-pin" size={16} />
          <span className="pc-car-place">{placeMatch ? <>{placeMatch[1]} <em>{placeMatch[2]}</em></> : place}</span>
          {car.filter?.video ? <span className="pc-car-views"><BbIcon name="play" size={18} />{car.views.toLocaleString("ko-KR")}</span> : null}
        </div>
        <div className="pc-car-seller">
          <img className="dealer-avatar" src={asset(sellerAvatar(car))} alt={`${displayedSeller} 프로필`} draggable={false} />
          <strong>{displayedSeller}</strong>
          {car.sellerType === "딜러" ? <><BbIcon name="verified" size={16} className="pc-car-verified" /><span className="pc-car-sold">{car.stock}대 판매</span></> : null}
          <div className="pc-car-actions">
            <button type="button" className="pc-inquiry-button" onClick={(event) => event.stopPropagation()}><BbIcon name="chat" size={20} />문의</button>
            <button className={`pc-like-button${liked ? " is-liked" : ""}`} type="button" aria-label={`${car.title} ${liked ? "저장 해제" : "저장"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}><BbIcon name={liked ? "heart-filled" : "heart"} size={24} /></button>
          </div>
        </div>
      </div>
    </article>
  );
}

function CarCard({ car, cardView, liked, onToggleLike, onOpen }: { car: Car; cardView: boolean; liked: boolean; onToggleLike: () => void; onOpen: () => void }) {
  const displayedSeller = sellerLabel(car);
  const badges = car.badges ?? [];
  const cardPriceMatch = car.price.match(/^(월\s*)?(.+?)(\s*만원)$/);
  const cardPricePrefix = cardPriceMatch?.[1] ?? "";
  const cardPriceAmount = cardPriceMatch?.[2] ?? car.price;
  const cardPriceUnit = cardPriceMatch?.[3] ?? "";
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const likeButton = (
    <button className={`like-button${liked ? " is-liked" : ""}`} type="button" aria-label={`${car.title} ${liked ? "저장 해제" : "저장"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}>{liked ? <HeartFilledIcon /> : <HeartIcon />}</button>
  );

  return (
    <article className={`car-card${cardView ? " is-card-view" : ""}${badges.length ? " has-badges" : " has-no-badges"}`} role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeyDown={onKeyDown}>
      <div className="car-photo-wrap">
        <img className={`car-photo${car.imageFit === "contain" ? " is-catalog" : ""}`} src={asset(car.image)} alt={`${car.title} ${car.trim} 차량, ${car.posted}, 사진 ${car.photos}장`} draggable={false} />
        <div className="card-photo-meta" aria-hidden="true">
          <span className="card-posted">{car.posted}</span>
          <span className="card-photo-count">{car.photos}<Icon name="photo-count.svg" /></span>
        </div>
      </div>
      <div className="car-copy">
        <div className="car-main">
          {cardView ? (
            <div className="card-title-row">
              <div className="car-title-copy">
                <h2>{car.title}</h2>
                <p className="trim">{car.trim}</p>
              </div>
              <div className="card-title-actions">
                <button className="card-more-button" type="button" aria-label={`${car.title} 더보기`} onClick={(event) => event.stopPropagation()}><Icon name="card-more.svg" /></button>
                {likeButton}
              </div>
            </div>
          ) : (
            <>
              <div className="car-title-row">
                <div className="car-title-copy">
                  <h2>{car.title}</h2>
                  <p className="trim">{car.trim}</p>
                </div>
              </div>
            </>
          )}
          <p className="specs">{displaySpecs(car.specs)}</p>
          {cardView ? <div className="card-price-block">
            <div className="card-price-row"><p className="price">{cardPricePrefix ? <span className="price-unit">{cardPricePrefix}</span> : null}<span>{cardPriceAmount}</span><span className="price-unit">{cardPriceUnit}</span></p>{car.lease ? <p className="lease">{car.lease}</p> : null}</div>
            {badges.length ? <div className="badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
          </div> : <><p className="price">{cardPricePrefix ? <span className="price-unit">{cardPricePrefix}</span> : null}<span>{cardPriceAmount}</span><span className="price-unit">{cardPriceUnit}</span></p>{car.lease ? <p className="lease">{car.lease}</p> : null}{badges.length ? <div className="badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}</>}
        </div>
        <div className="car-footer">
          <p className="location-line"><Icon name="location-gray.svg" />{displayListPlace(car.place)}</p>
          <div className="dealer-line">
            <img className="dealer-avatar" src={asset(sellerAvatar(car))} alt={`${displayedSeller} 프로필`} draggable={false} />
            {cardView ? <div className="dealer-copy"><strong>{displayedSeller}</strong></div> : <p><strong>{displayedSeller}</strong></p>}
            {cardView ? <div className="card-contact-actions"><button type="button" aria-label={`${displayedSeller} 전화`} onClick={(event) => event.stopPropagation()}><Icon name="card-call.svg" /></button><button type="button" aria-label={`${displayedSeller} 메시지`} onClick={(event) => event.stopPropagation()}><Icon name="card-message.svg" /></button></div> : likeButton}
          </div>
        </div>
      </div>
    </article>
  );
}

function RegionSheet({ value, resultCount, onChange, onClose, onConfirm }: { value: RegionSelection; resultCount: number; onChange: (value: RegionSelection) => void; onClose: () => void; onConfirm: () => void }) {
  const [menu, setMenu] = useState<RegionMenu>(null);
  const districtOptions = value.province ? districtsByProvince[value.province] ?? ["전체"] : [];
  const chooseProvince = (province: string) => {
    onChange(province === "전국" ? emptyRegion : { province, district: "", radius: "" });
    setMenu(null);
  };
  const chooseQuickRegion = (label: string) => chooseProvince(label === "전남광주" ? "광주" : label);

  return (
    <div className="region-sheet">
      <button className="region-sheet-close" type="button" aria-label="지역 선택 닫기" onClick={onClose}><Icon name="sheet-close.svg" /></button>
      <div className="region-fields">
        <div className="region-select-wrap">
          <button className="region-select" type="button" aria-expanded={menu === "province"} onClick={() => setMenu((current) => current === "province" ? null : "province")}><span className={`region-select-value${value.province ? " has-value" : ""}`}>{value.province || "시/도 선택"}</span><span className="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
          {menu === "province" ? <div className="region-menu" role="listbox" aria-label="시도 선택">{provinceOptions.map((province) => <button key={province} type="button" role="option" aria-selected={(value.province || "전국") === province} onClick={() => chooseProvince(province)}>{province}</button>)}</div> : null}
        </div>
        <div className="region-quick-chips" aria-label="빠른 지역 선택">{quickRegions.map((label) => <button key={label} type="button" className={(value.province === (label === "전남광주" ? "광주" : label)) ? "is-selected" : ""} aria-pressed={value.province === (label === "전남광주" ? "광주" : label)} onClick={() => chooseQuickRegion(label)}>{label}</button>)}</div>
        <div className="region-select-wrap">
          <button className="region-select" type="button" disabled={!value.province} aria-expanded={menu === "district"} onClick={() => setMenu((current) => current === "district" ? null : "district")}><span className={`region-select-value${value.district ? " has-value" : ""}`}>{value.district || "시/군/구 선택"}</span><span className="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
          {menu === "district" ? <div className="region-menu" role="listbox" aria-label="시군구 선택">{districtOptions.map((district) => <button key={district} type="button" role="option" aria-selected={(value.district || "전체") === district} onClick={() => { onChange({ ...value, district: district === "전체" ? "" : district, radius: "" }); setMenu(null); }}>{district}</button>)}</div> : null}
        </div>
      </div>
      <div className="region-around">
        <div className="region-around-heading"><span /><strong>내 주변 검색</strong></div>
        <div className="region-select-wrap">
          <button className="region-select" type="button" aria-expanded={menu === "radius"} onClick={() => setMenu((current) => current === "radius" ? null : "radius")}><span className={`region-select-value${value.radius ? " has-value" : ""}`}>{value.radius ? `내 위치에서 ${value.radius}` : "내 위치와 검색 반경 선택"}</span><span className="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
          {menu === "radius" ? <div className="region-menu is-upward" role="listbox" aria-label="검색 반경 선택">{radiusOptions.map((radius) => <button key={radius} type="button" role="option" aria-selected={value.radius === radius} onClick={() => { onChange({ province: "", district: "", radius }); setMenu(null); }}>{radius}</button>)}</div> : null}
        </div>
      </div>
      <div className="region-actions"><button type="button" className="region-reset" onClick={() => { onChange(emptyRegion); setMenu(null); }}>초기화</button><button type="button" className="region-confirm" onClick={onConfirm}>{Math.max(798, resultCount).toLocaleString("ko-KR")}대 매물 보기</button></div>
    </div>
  );
}

function SavedListingsHeader() {
  const flow = useFlow();
  return (
    <header className="saved-header">
      <button type="button" aria-label="중고차 목록으로 돌아가기" onClick={() => flow.pop()}><Icon name="back.svg" /></button>
      <h1>저장한 매물</h1>
      <span aria-hidden="true" />
    </header>
  );
}

function SavedListingsScreen() {
  const flow = useFlow();
  const { likedIds, toggleLiked } = useFavorites();
  const [activeTab, setActiveTab] = useState<"listings" | "videos">("listings");
  const savedCars = inventoryCars.filter((car) => likedIds.includes(car.id));

  return (
    <MobileScroll className="saved-screen">
      <main className="saved-listings" aria-label="저장한 매물">
        <div className="saved-tabs" role="tablist" aria-label="저장 항목 유형">
          <button type="button" role="tab" aria-selected={activeTab === "listings"} className={activeTab === "listings" ? "is-selected" : ""} onClick={() => setActiveTab("listings")}>매물 ({savedCars.length}/100)</button>
          <button type="button" role="tab" aria-selected={activeTab === "videos"} className={activeTab === "videos" ? "is-selected" : ""} onClick={() => setActiveTab("videos")}>동영상 (0/100)</button>
        </div>
        {activeTab === "listings" && savedCars.length ? <section className="saved-car-list" aria-live="polite">
          {savedCars.map((car) => (
            <article key={car.id} className="saved-car-row" role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={() => flow.push(detailScreen)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); flow.push(detailScreen); } }}>
              <img className={`saved-car-photo${car.imageFit === "contain" ? " is-catalog" : ""}`} src={asset(car.image)} alt={`${car.title} ${car.trim}`} draggable={false} />
              <div className="saved-car-copy"><h2>{car.title}</h2><p>{car.trim} · {car.specs[0]} · {car.specs[3]}</p><strong>{car.price.replace(" ", "")}</strong></div>
              <button type="button" className="saved-like-button" aria-label={`${car.title} 저장 해제`} aria-pressed="true" onClick={(event) => { event.stopPropagation(); toggleLiked(car.id); }}><HeartFilledIcon /></button>
            </article>
          ))}
        </section> : <div className="saved-empty"><HeartIcon /><strong>{activeTab === "listings" ? "저장한 매물이 없어요" : "저장한 동영상이 없어요"}</strong><p>{activeTab === "listings" ? "목록에서 하트를 눌러 관심 매물을 모아보세요." : "마음에 드는 매물 영상을 저장해보세요."}</p></div>}
      </main>
    </MobileScroll>
  );
}

function MarketplaceScreen() {
  const flow = useFlow();
  const keyboard = useKeyboard();
  const { likedIds, toggleLiked } = useFavorites();
  const initialFilters = getInitialChoTotFilters();
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<ChoTotFilterState>(() => initialFilters);
  const [draftFilters, setDraftFilters] = useState<ChoTotFilterState>(() => initialFilters);
  const [filterFocus, setFilterFocus] = useState<ChoTotFilterFocus | null>(null);
  const [quickFilterFocus, setQuickFilterFocus] = useState<ChoTotFilterFocus | null>(null);
  const [sheet, setSheet] = useState<SheetType>(null);
  const [sort, setSort] = useState("최신순");
  const [cardView, setCardView] = useState(false);
  const [region, setRegion] = useState<RegionSelection>(emptyRegion);
  const [draftRegion, setDraftRegion] = useState<RegionSelection>(emptyRegion);
  const [searchSaved, setSearchSaved] = useState(false);
  const [searchToast, setSearchToast] = useState("");
  const [categoryLandingOpen, setCategoryLandingOpen] = useState(() => !initialFilters.maker && initialFilters.category === "전체");
  const [quickFilterStyle, setQuickFilterStyle] = useState<QuickFilterStyle>(() => getInitialQuickFilterStyle());
  const [selectedGeneration, setSelectedGeneration] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [debouncedSelectedVariants, setDebouncedSelectedVariants] = useState<string[]>([]);
  const [trimApplied, setTrimApplied] = useState(false);
  const desktop = useDesktopLayout();
  const [pcGridView, setPcGridView] = useState(false);
  const pcFilterRowRef = useRef<HTMLDivElement>(null);
  const [pcFilterCanScroll, setPcFilterCanScroll] = useState(false);

  useEffect(() => {
    if (!searchToast) return;
    const timer = window.setTimeout(() => setSearchToast(""), 1800);
    return () => window.clearTimeout(timer);
  }, [searchToast]);

  const closeSheet = () => {
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    keyboard.hide();
    setSheet(null);
  };

  const regionLabel = region.radius ? `내 주변 ${region.radius}` : [region.province, region.district].filter(Boolean).join(" ") || "전국";
  const regionKeyword = region.province === "광주" ? "광주" : region.province;
  const { maker, model: selectedModel, price, seller: sellerType, videoOnly, category } = filters;
  const categoryIsDefault = category === "전체";
  const categorySearchPlaceholder = categoryIsDefault ? "중고차" : category;
  const categoryBrandRail = categoryBrandRails[category] ?? categoryBrandRails["전체"];
  const usesUxDepth = maker === "BMW" || maker === "벤츠";
  const isGuaziQuickStyle = quickFilterStyle === "guazi";
  const modelQuickOptions = maker ? quickModelsByMaker[maker] ?? [] : [];
  const generationQuickOptions = maker && selectedModel ? quickGenerationsByMakerModel[maker]?.[selectedModel] ?? [] : [];
  const selectedGenerationOption = generationQuickOptions.find((generation) => generation.name === selectedGeneration);
  const variantQuickOptions = selectedGenerationOption?.variants ?? [];
  const directVariantQuickOptions: Array<string | QuickTrimOption> = [];
  const activeVariantQuickOptions = selectedGeneration ? variantQuickOptions : directVariantQuickOptions;
  const effectiveSelectedVariants = isGuaziQuickStyle ? debouncedSelectedVariants : selectedVariants;

  useEffect(() => {
    setSelectedGeneration(null);
    setSelectedVariants([]);
    setTrimApplied(false);
  }, [maker, selectedModel]);

  useEffect(() => {
    if (!isGuaziQuickStyle) {
      setDebouncedSelectedVariants(selectedVariants);
      return undefined;
    }
    const timer = window.setTimeout(() => setDebouncedSelectedVariants(selectedVariants), 300);
    return () => window.clearTimeout(timer);
  }, [isGuaziQuickStyle, selectedVariants]);

  const activeFilterCount = [
    Boolean(maker),
    Boolean(selectedModel),
    Boolean(selectedGeneration),
    isGuaziQuickStyle ? selectedVariants.length > 0 : trimApplied && selectedVariants.length > 0,
    price.min !== 0 || price.max !== null,
    filters.year !== "전체",
    filters.condition !== "전체",
    filters.seller !== "전체",
    filters.seats !== "전체",
    Boolean(filters.mileageMax),
    filters.owners !== "전체",
    filters.transmission !== "전체",
    filters.fuel !== "전체",
    filters.colors.length > 0,
    filters.origin !== "전체",
    filters.body !== "전체",
    filters.videoOnly,
  ].filter(Boolean).length;

  const filteredWithoutPrice = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return chototTestCars.filter((car) => {
      const searchText = `${car.title} ${car.trim} ${car.maker} ${car.modelGroup ?? ""}`;
      const generationMatch = !selectedGeneration || normalizeModelSearchText(searchText).includes(normalizeModelSearchText(generationDisplayLabel(selectedGenerationOption ?? { name: selectedGeneration, years: "", variants: [] }))) || normalizeModelSearchText(searchText).includes(normalizeModelSearchText(selectedGeneration));
      const activeTrimVariants = isGuaziQuickStyle ? effectiveSelectedVariants : trimApplied ? selectedVariants : [];
      const trimMatch = activeTrimVariants.length === 0 || activeTrimVariants.some((variant) => normalizeModelSearchText(searchText).includes(normalizeModelSearchText(variant)));
      return matchesChoTotFilters(car, filters) && generationMatch && trimMatch && (!regionKeyword || car.place.includes(regionKeyword)) && (!region.district || car.place.includes(region.district)) && (!normalized || searchText.toLowerCase().includes(normalized));
    });
  }, [effectiveSelectedVariants, filters, isGuaziQuickStyle, query, region.district, regionKeyword, selectedGeneration, selectedGenerationOption, selectedVariants, trimApplied]);
  const visibleCars = useMemo(() => [...filteredWithoutPrice].sort((first, second) => sort === "낮은 가격순" ? parsePrice(first.price) - parsePrice(second.price) : sort === "높은 가격순" ? parsePrice(second.price) - parsePrice(first.price) : second.id - first.id), [filteredWithoutPrice, sort]);
  const draftFilterCount = useMemo(() => chototTestCars.filter((car) => matchesChoTotFilters(car, draftFilters)).length, [draftFilters]);

  const replaceFilterParams = (nextMaker: string | null, nextModel: string | null, nextCategory = filters.category) => {
    const url = new URL(window.location.href);
    if (nextCategory === "전체") url.searchParams.delete("category");
    else url.searchParams.set("category", nextCategory);
    if (nextMaker) url.searchParams.set("maker", nextMaker);
    else url.searchParams.delete("maker");
    if (nextMaker && nextModel) url.searchParams.set("model", nextModel);
    else url.searchParams.delete("model");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const resetFilters = ({ closeActiveSheet = true }: { closeActiveSheet?: boolean } = {}) => {
    setFilters(emptyChoTotFilters);
    setDraftFilters(emptyChoTotFilters);
    setDraftRegion(emptyRegion);
    setQuery("");
    setSort("최신순");
    setRegion(emptyRegion);
    setCategoryLandingOpen(true);
    setFilterFocus(null);
    setQuickFilterFocus(null);
    setSelectedGeneration(null);
    setSelectedVariants([]);
    setTrimApplied(false);
    replaceFilterParams(null, null);
    if (closeActiveSheet) setSheet(null);
  };

  const clearCategoryFilter = () => {
    setFilters((current) => ({ ...current, category: "전체", maker: null, model: null }));
    setDraftFilters((current) => ({ ...current, category: "전체", maker: null, model: null }));
    setSelectedGeneration(null);
    setSelectedVariants([]);
    setTrimApplied(false);
    setCategoryLandingOpen(true);
    replaceFilterParams(null, null, "전체");
  };

  const clearMakerFilter = () => {
    setFilters((current) => ({ ...current, maker: null, model: null }));
    setDraftFilters((current) => ({ ...current, maker: null, model: null }));
    setSelectedGeneration(null);
    setSelectedVariants([]);
    setTrimApplied(false);
    setCategoryLandingOpen(category === "전체");
    replaceFilterParams(null, null);
  };

  const clearModelFilter = () => {
    setFilters((current) => ({ ...current, model: null }));
    setDraftFilters((current) => ({ ...current, model: null }));
    setSelectedGeneration(null);
    setSelectedVariants([]);
    setTrimApplied(false);
    replaceFilterParams(maker, null);
  };

  const clearGenerationFilter = () => {
    setSelectedGeneration(null);
    setSelectedVariants([]);
    setTrimApplied(false);
  };

  const clearVariantFilter = () => {
    setSelectedVariants([]);
    setTrimApplied(false);
  };

  const returnToModelDepth = () => {
    setFilters((current) => ({ ...current, model: null }));
    setDraftFilters((current) => ({ ...current, model: null }));
    setSelectedGeneration(null);
    setSelectedVariants([]);
    setTrimApplied(false);
    replaceFilterParams(maker, null);
  };

  const returnToGenerationDepth = () => {
    setSelectedGeneration(null);
    setSelectedVariants([]);
    setTrimApplied(false);
  };

  const returnToTrimDepth = () => {
    setTrimApplied(false);
  };

  const clearVehicleSummaryStep = () => {
    if (selectedGeneration) {
      clearGenerationFilter();
      return;
    }
    if (selectedModel) {
      clearModelFilter();
      return;
    }
    clearMakerFilter();
  };

  const applyMakerFilter = (nextMaker: string | null) => {
    setFilters((current) => ({ ...current, maker: nextMaker, model: null }));
    setDraftFilters((current) => ({ ...current, maker: nextMaker, model: null }));
    setSelectedGeneration(null);
    setSelectedVariants([]);
    setTrimApplied(false);
    replaceFilterParams(nextMaker, null);
  };

  const openRegionSheet = () => {
    setDraftRegion(region);
    setSheet("region");
  };

  const openPriceSheet = () => {
    setDraftFilters(filters);
    setSheet("price");
  };

  const openQuickFilter = (focus: ChoTotFilterFocus) => {
    setDraftFilters(filters);
    if (focus === "category") {
      setQuickFilterFocus(null);
      setSheet("carType");
      return;
    }
    setQuickFilterFocus(focus);
    setSheet("quick");
  };

  const toggleSearchSaved = () => {
    const nextSaved = !searchSaved;
    setSearchSaved(nextSaved);
    setSearchToast(nextSaved ? "검색 조건을 저장했습니다." : "저장한 검색 조건을 삭제했습니다.");
  };

  const chooseMaker = (nextMaker: string | null) => {
    applyMakerFilter(nextMaker);
    closeSheet();
  };

  const applyVehicleSummarySelection = (nextMaker: string | null, nextModel: string | null, nextGeneration: string | null) => {
    const safeModel = nextMaker && nextModel ? nextModel : null;
    const generationOptionsForSelection = nextMaker && safeModel ? quickGenerationsByMakerModel[nextMaker]?.[safeModel] ?? [] : [];
    const safeGeneration = generationOptionsForSelection.some((option) => option.name === nextGeneration) ? nextGeneration : null;
    const nextFilters = { ...filters, maker: nextMaker, model: safeModel };
    setFilters(nextFilters);
    setDraftFilters(nextFilters);
    setSelectedGeneration(safeGeneration);
    setSelectedVariants([]);
    setTrimApplied(false);
    setCategoryLandingOpen(!nextMaker && category === "전체");
    replaceFilterParams(nextMaker, safeModel);
    closeSheet();
  };

  const chooseModel = (modelName: string) => {
    const nextModel = selectedModel === modelName ? null : modelName;
    const nextGenerations = nextModel && maker ? quickGenerationsByMakerModel[maker]?.[nextModel] ?? [] : [];
    setFilters((current) => ({ ...current, model: nextModel }));
    setDraftFilters((current) => ({ ...current, model: nextModel }));
    setSelectedGeneration(isGuaziQuickStyle && nextGenerations.length === 1 ? nextGenerations[0].name : null);
    setSelectedVariants([]);
    setTrimApplied(false);
    replaceFilterParams(maker, nextModel);
  };

  const chooseGeneration = (generationName: string) => {
    const nextGeneration = selectedGeneration === generationName ? null : generationName;
    setSelectedGeneration(nextGeneration);
    setSelectedVariants([]);
    setTrimApplied(false);
  };

  const chooseVariant = (variantName: string) => {
    setSelectedVariants((current) => current.includes(variantName) ? current.filter((variant) => variant !== variantName) : [...current, variantName]);
    setTrimApplied(false);
  };

  const chooseQuickFilterStyle = (style: QuickFilterStyle) => {
    setQuickFilterStyle(style);
    const url = new URL(window.location.href);
    if (style === "chotot") url.searchParams.delete("qf");
    else url.searchParams.set("qf", style);
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  };

  const chooseVehicleCategory = (categoryName: string) => {
    if (vehicleCategoryOptions.includes(categoryName)) {
      const nextFilters = { ...filters, category: categoryName, maker: null, model: null };
      setFilters(nextFilters);
      setDraftFilters(nextFilters);
      setSelectedGeneration(null);
      setSelectedVariants([]);
      setTrimApplied(false);
      setCategoryLandingOpen(categoryName === "전체");
      replaceFilterParams(null, null, categoryName);
      return;
    }
    setSearchToast(`${categoryName.replace("\n", " ")} 카테고리는 준비 중입니다.`);
  };

  const chooseCategoryFilter = (categoryName: string) => {
    if (vehicleCategoryOptions.includes(categoryName)) {
      const nextFilters = { ...filters, category: categoryName, maker: null, model: null };
      setFilters(nextFilters);
      setDraftFilters(nextFilters);
      setSelectedGeneration(null);
      setSelectedVariants([]);
      setTrimApplied(false);
      setCategoryLandingOpen(categoryName === "전체");
      replaceFilterParams(null, null, categoryName);
      closeSheet();
      return;
    }
    setSearchToast(`${categoryName} 카테고리는 준비 중입니다.`);
    closeSheet();
  };

  const guaziVisualsForMaker = maker ? quickModelVisualsByMaker[maker] : undefined;
  const selectedGenerationVisual = selectedGenerationOption?.image ?? (selectedModel && guaziVisualsForMaker ? guaziVisualsForMaker[selectedModel]?.image : undefined);
  const selectedGenerationSummary = selectedGenerationOption
    ? (showGuaziInventoryCounts
        ? `${compactYearLabel(selectedGenerationOption.years)} · ${generationCountLabel(selectedGenerationOption)}`
        : compactYearLabel(selectedGenerationOption.years))
    : "";
  const variantTrimOptions = activeVariantQuickOptions.map(toTrimOption);
  const selectedTrimChipLabel = selectedVariants.length === 0
    ? "트림"
    : selectedVariants.length === 1
      ? selectedVariants[0]
      : `${selectedVariants[0]} 외 ${selectedVariants.length - 1}`;
  const mileageChipLabel = filters.mileageMax
    ? `${Number(filters.mileageMax).toLocaleString("ko-KR")}km 이하`
    : "주행";
  const accessibleDepthLabel = (value: string | null) => (value ? formatModelLabel(value).replaceAll("A-클래스", "A클래스") : "");
  const vehicleSummaryLabel = [
    maker,
    selectedModel ? formatModelLabel(selectedModel) : null,
    selectedGenerationOption ? generationDisplayLabel(selectedGenerationOption) : null,
  ].filter(Boolean).join(" ");

  type QuickFilterChip = { key: string; label: string; active: boolean; className?: string; onClick: () => void; onClear?: () => void };
  const quickFilterChips: QuickFilterChip[] = ([
    {
      key: "category",
      label: categoryIsDefault ? "전체" : category,
      active: true,
      onClick: () => openQuickFilter("category"),
      onClear: clearCategoryFilter,
    },
    isGuaziQuickStyle && maker ? {
      key: "vehicle-summary",
      label: vehicleSummaryLabel,
      active: true,
      className: "is-vehicle-summary",
      onClick: () => setSheet("vehicle"),
      onClear: clearVehicleSummaryStep,
    } : maker ? {
      key: "maker",
      label: maker,
      active: true,
      onClick: () => openQuickFilter("maker"),
      onClear: clearMakerFilter,
    } : {
      key: "maker",
      label: "제조사",
      active: false,
      onClick: () => openQuickFilter("maker"),
    },
    isGuaziQuickStyle ? null : maker && selectedModel ? {
      key: "model",
      label: formatModelLabel(selectedModel),
      active: true,
      onClick: usesUxDepth ? returnToModelDepth : () => openQuickFilter("model"),
      onClear: clearModelFilter,
    } : maker ? {
      key: "model",
      label: "모델",
      active: false,
      onClick: () => openQuickFilter("model"),
    } : null,
    isGuaziQuickStyle ? null : usesUxDepth && selectedModel ? {
      key: "generation",
      label: selectedGenerationOption ? generationDisplayLabel(selectedGenerationOption) : "세대",
      active: Boolean(selectedGeneration),
      onClick: selectedGeneration ? returnToGenerationDepth : () => setSearchToast("아래 세대 칩에서 선택하세요."),
      onClear: selectedGeneration ? clearGenerationFilter : undefined,
    } : null,
    usesUxDepth && selectedGeneration ? {
      key: "variant",
      label: selectedTrimChipLabel,
      active: isGuaziQuickStyle ? selectedVariants.length > 0 : trimApplied && selectedVariants.length > 0,
      onClick: selectedVariants.length ? returnToTrimDepth : () => setSearchToast("아래 트림 칩에서 선택하세요."),
      onClear: selectedVariants.length ? clearVariantFilter : undefined,
    } : null,
    {
      key: "price",
      label: priceFilterLabel(price),
      active: price.min !== 0 || price.max !== null,
      onClick: () => openQuickFilter("price"),
    },
    !selectedGeneration ? {
      key: "year",
      label: filters.year === "전체" ? "연식" : filters.year,
      active: filters.year !== "전체",
      onClick: () => openQuickFilter("year"),
    } : null,
    {
      key: "mileage",
      label: mileageChipLabel,
      active: Boolean(filters.mileageMax),
      onClick: () => openQuickFilter("mileage"),
      onClear: filters.mileageMax ? () => {
        setFilters((current) => ({ ...current, mileageMax: "" }));
        setDraftFilters((current) => ({ ...current, mileageMax: "" }));
      } : undefined,
    },
    {
      key: "color",
      label: filters.colors.length ? filters.colors.join(", ") : "색상",
      active: filters.colors.length > 0,
      onClick: () => openQuickFilter("color"),
      onClear: filters.colors.length ? () => {
        setFilters((current) => ({ ...current, colors: [] }));
        setDraftFilters((current) => ({ ...current, colors: [] }));
      } : undefined,
    },
  ] as Array<QuickFilterChip | null>).filter((chip): chip is QuickFilterChip => Boolean(chip));
  const marketSheet = (
      <BottomSheet open={sheet !== null} onOpenChange={(open) => !open && closeSheet()} title={sheet ? sheetLabels[sheet] : "필터"} description={sheet === "region" || sheet === "maker" || sheet === "vehicle" || sheet === "price" || sheet === "filter" || sheet === "quick" || sheet === "carType" ? undefined : "원하는 조건을 선택해 매물을 좁혀보세요."} snap={sheet === "filter" || sheet === "maker" || sheet === "quick" ? 0.96 : sheet === "vehicle" ? 0.8 : sheet === "carType" ? 0.8 : sheet === "region" ? 0.53 : sheet === "price" ? 0.62 : 0.48}>
        {sheet === "filter" ? <ChoTotFilterSheet value={draftFilters} focus={filterFocus} onChange={setDraftFilters} onClose={() => { setFilterFocus(null); closeSheet(); }} onReset={() => resetFilters({ closeActiveSheet: false })} onConfirm={() => { setFilters(draftFilters); setFilterFocus(null); closeSheet(); }} resultCount={draftFilterCount} /> : sheet === "carType" ? <CategoryFilterSheet selected={category} onChoose={chooseCategoryFilter} onClose={closeSheet} /> : sheet === "quick" && quickFilterFocus ? <ChoTotQuickFilterSheet focus={quickFilterFocus} value={draftFilters} onChange={setDraftFilters} onClose={() => { setQuickFilterFocus(null); closeSheet(); }} onConfirm={() => { setFilters(draftFilters); setQuickFilterFocus(null); closeSheet(); }} resultCount={draftFilterCount} /> : sheet === "vehicle" ? <VehiclePickerSheet maker={maker} model={selectedModel} generation={selectedGeneration} makerOptions={categoryBrandRail.options} onApply={applyVehicleSummarySelection} /> : sheet === "maker" ? <MakerSheet selected={maker} onChoose={chooseMaker} onClose={closeSheet} /> : sheet === "region" ? <RegionSheet value={draftRegion} resultCount={filteredWithoutPrice.length} onChange={setDraftRegion} onClose={closeSheet} onConfirm={() => { setRegion(draftRegion); closeSheet(); }} /> : sheet === "price" ? <PriceSheet value={draftFilters.price} onChange={(nextPrice) => setDraftFilters((current) => ({ ...current, price: nextPrice }))} onClose={closeSheet} onReset={() => setDraftFilters((current) => ({ ...current, price: emptyPrice }))} onConfirm={() => { setFilters((current) => ({ ...current, price: draftFilters.price })); closeSheet(); }} resultCount={draftFilterCount} /> : <div className="sheet-options">
          {sheet === "sort" ? ["최신순", "낮은 가격순", "높은 가격순"].map((label) => <button key={label} type="button" className={sort === label ? "is-selected" : ""} onClick={() => { setSort(label); setSheet(null); }}>{label}</button>) : ["전체", "추천 조건", "인기 조건"].map((label) => <button key={label} type="button" onClick={() => setSheet(null)}>{label}</button>)}
        </div>}
      </BottomSheet>
  );

  if (desktop) {
    // PC 필터 칩 줄은 초톳 PC처럼 연료·변속기를 색상 앞에 추가한다(모바일 칩 순서는 그대로).
    const colorIndex = quickFilterChips.findIndex((chip) => chip.key === "color");
    quickFilterChips.splice(colorIndex < 0 ? quickFilterChips.length : colorIndex, 0,
      {
        key: "fuel",
        label: filters.fuel === "전체" ? "연료" : filters.fuel,
        active: filters.fuel !== "전체",
        onClick: () => openQuickFilter("fuel"),
        onClear: filters.fuel !== "전체" ? () => {
          setFilters((current) => ({ ...current, fuel: "전체" }));
          setDraftFilters((current) => ({ ...current, fuel: "전체" }));
        } : undefined,
      },
      {
        key: "transmission",
        label: filters.transmission === "전체" ? "변속기" : filters.transmission,
        active: filters.transmission !== "전체",
        onClick: () => openQuickFilter("transmission"),
        onClear: filters.transmission !== "전체" ? () => {
          setFilters((current) => ({ ...current, transmission: "전체" }));
          setDraftFilters((current) => ({ ...current, transmission: "전체" }));
        } : undefined,
      },
    );
  }

  useEffect(() => {
    if (!desktop) return undefined;
    const rail = pcFilterRowRef.current?.querySelector<HTMLElement>(".filter-rail");
    if (!rail) return undefined;
    const update = () => setPcFilterCanScroll(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 1);
    update();
    rail.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update);
    observer.observe(rail);
    const track = rail.querySelector(".filter-track");
    if (track) observer.observe(track);
    return () => {
      rail.removeEventListener("scroll", update);
      observer.disconnect();
    };
  }, [desktop, quickFilterChips.length]);

  const hasGenerationDepth = Boolean(usesUxDepth && selectedModel && generationQuickOptions.length);
  const hasDirectVariantDepth = Boolean(usesUxDepth && selectedModel && !hasGenerationDepth && directVariantQuickOptions.length);
  const shouldStayOnSelectedModelRail = Boolean(isGuaziQuickStyle && selectedModel && !hasGenerationDepth && !hasDirectVariantDepth);
  const showModelQuickRail = Boolean(maker && modelQuickOptions.length && (!selectedModel || shouldStayOnSelectedModelRail));
  const showGenerationQuickRail = Boolean(usesUxDepth && selectedModel && !selectedGeneration && generationQuickOptions.length);
  const showVariantQuickRail = Boolean(usesUxDepth && ((selectedGeneration && variantQuickOptions.length) || hasDirectVariantDepth) && (isGuaziQuickStyle || !trimApplied));
  const showVehicleHeaderRail = Boolean(!isGuaziQuickStyle && usesUxDepth && selectedGeneration && trimApplied);
  const showCategoryQuickRail = categoryLandingOpen && !maker;
  const showGuaziMakerRail = Boolean(isGuaziQuickStyle && !showCategoryQuickRail && !showModelQuickRail && !showGenerationQuickRail && !showVariantQuickRail && !showVehicleHeaderRail && categoryBrandRail.title === "제조사");

  // 필터 칩 줄과 퀵필터 레일은 모바일·PC가 같은 마크업을 쓰고, PC에서는 필터 헤더 패널 안으로 위치만 옮긴다.
  const filterShell = (
          <section className={`filter-shell quick-style-${quickFilterStyle}${activeFilterCount ? " has-active-filters" : ""}`} aria-label="중고차 필터">
            <button className="filter-fixed" type="button" aria-label={activeFilterCount ? `필터 ${activeFilterCount}개 적용됨` : "필터"} onClick={() => { setDraftFilters(filters); setFilterFocus(null); setSheet("filter"); }}><Icon name="filter.svg" /><span>{activeFilterCount || "필터"}</span></button>
            <Carousel ariaLabel="중고차 조건" className="filter-rail" contentClassName="filter-track">
              {quickFilterChips.map((chip) => <FilterChip key={chip.key} label={chip.label} active={chip.active} className={chip.className} onClick={chip.onClick} onClear={chip.onClear} />)}
            </Carousel>
          </section>
  );
  const quickRail = (
          showCategoryQuickRail && isGuaziQuickStyle ? <section className="depth-rail no-label" aria-label="차량유형 빠른 선택">
            <Carousel ariaLabel="차량유형" className="brand-carousel" contentClassName="depth-rail-track">
              <DepthCard label="전체" onClick={() => { clearCategoryFilter(); setCategoryLandingOpen(false); }} />
              {guaziVehicleTypeCategories.map((categoryOption) => (
                <DepthCard
                  key={categoryOption.name}
                  label={categoryOption.name}
                  image={<img src={asset(categoryOption.icon)} alt="" aria-hidden="true" draggable={false} />}
                  imageFit={categoryOption.bodyFit}
                  selected={category === categoryOption.name}
                  onClick={() => chooseVehicleCategory(categoryOption.name)}
                />
              ))}
            </Carousel>
          </section> : showCategoryQuickRail ? <section className="category-row" aria-label="차량 대카테고리 선택">
            <Carousel ariaLabel="차량 대카테고리" className="category-carousel" contentClassName="category-track">
              {vehicleCategories.map((categoryOption) => (
                <button key={categoryOption.name} className="category-item" type="button" onClick={() => chooseVehicleCategory(categoryOption.name)}>
                  <span className={`category-icon is-fit-${categoryOption.bodyFit}`}><img src={asset(categoryOption.icon)} alt="" aria-hidden="true" draggable={false} /></span>
                  <span>{categoryOption.name.split("\n").map((line, index) => <span key={line}>{index ? <><br />{line}</> : line}</span>)}</span>
                </button>
              ))}
            </Carousel>
          </section> : showModelQuickRail && isGuaziQuickStyle ? <section className="depth-rail" aria-label={`${maker} 모델 빠른 선택`}>
            <span className="depth-rail-label">모델</span>
            <Carousel ariaLabel={`${maker} 모델`} className="brand-carousel" contentClassName="depth-rail-track">
              {modelQuickOptions.map((model) => {
                const modelVisual = guaziVisualsForMaker?.[model];
                return (
                  <DepthCard
                    key={model}
                    label={formatModelLabel(model)}
                    sub={bodyTypeLabel(modelVisual?.bodyType)}
                    image={modelVisual?.image ? <img src={modelVisual.image} alt="" aria-hidden="true" draggable={false} /> : undefined}
                    imageFit={modelVisual?.bodyFit ?? "width"}
                    isEV={modelVisual?.isEV}
                    selected={selectedModel === model}
                    disabled={modelVisual?.count === "0대"}
                    onClick={() => chooseModel(model)}
                  />
                );
              })}
            </Carousel>
          </section> : showModelQuickRail ? <section className="brand-row is-benz-model-mode" aria-label={`${maker} 모델 빠른 선택`}>
            <span className="brand-title">모델</span>
            <Carousel ariaLabel={`${maker} 모델`} className="brand-carousel" contentClassName="benz-model-track">
              {modelQuickOptions.map((model) => {
                const modelVisual = guaziVisualsForMaker?.[model];
                return <button key={model} className={`benz-model-chip${selectedModel === model ? " is-selected" : ""}`} type="button" aria-pressed={selectedModel === model} disabled={modelVisual?.count === "0대"} onClick={() => chooseModel(model)}>{formatModelLabel(model)}</button>;
              })}
            </Carousel>
          </section> : showGenerationQuickRail && isGuaziQuickStyle ? <section className="depth-rail" aria-label={`${accessibleDepthLabel(selectedModel)} 세대 빠른 선택`}>
            <span className="depth-rail-label">세대</span>
            <Carousel ariaLabel={`${accessibleDepthLabel(selectedModel)} 세대`} className="brand-carousel" contentClassName="depth-rail-track">
              {generationQuickOptions.map((generation) => {
                const generationImage = generation.image ?? (selectedModel && guaziVisualsForMaker ? guaziVisualsForMaker[selectedModel]?.image : undefined);
                const selectedModelVisual = selectedModel && guaziVisualsForMaker ? guaziVisualsForMaker[selectedModel] : undefined;
                const generationImageFit = generation.bodyFit ?? selectedModelVisual?.bodyFit ?? "width";
                return (
                  <DepthCard
                    key={generation.name}
                    label={generationCardLabel(generation)}
                    sub={compactGenerationCardYearLabel(generation.years)}
                    image={generationImage ? <img src={generationImage} alt="" aria-hidden="true" draggable={false} /> : undefined}
                    imageFit={generationImageFit}
                    isEV={generation.isEV ?? selectedModelVisual?.isEV}
                    selected={selectedGeneration === generation.name}
                    disabled={(generation.count ?? generation.variants.reduce((sum, variant) => sum + toTrimOption(variant).count, 0)) === 0}
                    onClick={() => chooseGeneration(generation.name)}
                  />
                );
              })}
            </Carousel>
          </section> : showGenerationQuickRail ? <section className="brand-row is-generation-mode" aria-label={`${accessibleDepthLabel(selectedModel)} 세대 빠른 선택`}>
            <span className="brand-title">세대</span>
            <Carousel ariaLabel={`${accessibleDepthLabel(selectedModel)} 세대`} className="brand-carousel" contentClassName="generation-track">
              {generationQuickOptions.map((generation) => {
                return (
                  <button key={generation.name} className={`benz-model-chip generation-chip${selectedGeneration === generation.name ? " is-selected" : ""}`} type="button" aria-pressed={selectedGeneration === generation.name} onClick={() => chooseGeneration(generation.name)}>
                    <strong>{generation.name}</strong>
                    <span>{generation.years}</span>
                  </button>
                );
              })}
            </Carousel>
          </section> : showVariantQuickRail && isGuaziQuickStyle ? <section className="depth-rail" aria-label={`${accessibleDepthLabel(selectedGeneration ?? selectedModel)} 트림 빠른 선택`}>
            <span className="depth-rail-label">트림</span>
            <Carousel ariaLabel={`${accessibleDepthLabel(selectedGeneration ?? selectedModel)} 트림`} className="brand-carousel" contentClassName="depth-rail-track is-chips">
              <TrimChip label="전체" selected={selectedVariants.length === 0} onClick={clearVariantFilter} />
              {variantTrimOptions.map((variant) => (
                <TrimChip key={variant.name} label={variant.name} selected={selectedVariants.includes(variant.name)} disabled={variant.count === 0} onClick={() => chooseVariant(variant.name)} />
              ))}
            </Carousel>
          </section> : showVariantQuickRail ? <section className="brand-row is-benz-model-mode" aria-label={`${accessibleDepthLabel(selectedGeneration ?? selectedModel)} 트림 빠른 선택`}>
            <span className="brand-title">트림</span>
            <Carousel ariaLabel={`${accessibleDepthLabel(selectedGeneration ?? selectedModel)} 트림`} className="brand-carousel" contentClassName="benz-model-track">
              {variantTrimOptions.map((variant) => (
                <button key={variant.name} className={`benz-model-chip${selectedVariants.includes(variant.name) ? " is-selected" : ""}`} type="button" aria-pressed={selectedVariants.includes(variant.name)} disabled={variant.count === 0} onClick={() => chooseVariant(variant.name)}>{variant.name}</button>
              ))}
            </Carousel>
          </section> : showVehicleHeaderRail && isGuaziQuickStyle ? <section className="depth-rail is-vehicle-header" aria-label="선택 차종 요약">
            <span className="depth-rail-label">차종</span>
            <div className="depth-vehicle-header">
              {selectedGenerationVisual ? <img src={selectedGenerationVisual} alt="" aria-hidden="true" draggable={false} /> : null}
              <div>
                <strong>{maker} {selectedModel ? formatModelLabel(selectedModel) : ""} {selectedGenerationOption ? generationDisplayLabel(selectedGenerationOption) : ""}</strong>
                <span>{selectedGenerationSummary}</span>
              </div>
            </div>
          </section> : showGuaziMakerRail ? <section className="depth-rail" aria-label={`${categoryBrandRail.title} 빠른 선택`}>
            <span className="depth-rail-label">{categoryBrandRail.title}</span>
            <Carousel ariaLabel={categoryBrandRail.title} className="brand-carousel" contentClassName="depth-rail-track">
              {categoryBrandRail.options.map((option) => (
                <DepthCard
                  key={option.name}
                  label={option.name}
                  image={<BrandRailMark option={option} variant="depth" />}
                  mediaKind="brand"
                  selected={Boolean(option.maker && maker === option.maker)}
                  onClick={() => option.maker ? applyMakerFilter(option.maker) : undefined}
                />
              ))}
            </Carousel>
          </section> : <section className="brand-row category-brand-row" aria-label={`${categoryBrandRail.title} 빠른 선택`}>
            <span className="brand-title">{categoryBrandRail.title}</span>
            <Carousel ariaLabel={categoryBrandRail.title} className="brand-carousel" contentClassName="brand-track">
              {categoryBrandRail.options.map((option) => (
                <button key={option.name} className={`brand-item${option.maker && maker === option.maker ? " is-selected" : ""}`} type="button" aria-pressed={Boolean(option.maker && maker === option.maker)} onClick={() => option.maker ? applyMakerFilter(option.maker) : undefined}>
                  <BrandRailMark option={option} />
                  <span>{option.name}</span>
                </button>
              ))}
            </Carousel>
          </section>
  );
  const quickStyleSelect = (
            <label className="quick-style-select">
              <span>적용 사이트</span>
              <select value={quickFilterStyle} onChange={(event) => chooseQuickFilterStyle(event.currentTarget.value as QuickFilterStyle)}>
                {quickFilterStyleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
  );
  const carListItems = visibleCars.length ? visibleCars.map((car) => desktop && !pcGridView
    ? <PcCarRow key={car.id} car={car} liked={likedIds.includes(car.id)} onOpen={() => flow.push(detailScreen)} onToggleLike={() => toggleLiked(car.id)} />
    : <CarCard key={car.id} car={car} cardView={cardView && !desktop} liked={likedIds.includes(car.id)} onOpen={() => flow.push(detailScreen)} onToggleLike={() => toggleLiked(car.id)} />) : (
    <div className="empty-state"><strong>조건에 맞는 차량이 없어요</strong><span>필터를 초기화하고 다시 찾아보세요.</span><button type="button" onClick={() => resetFilters()}>필터 초기화</button></div>
  );
  const pcToday = new Date();
  const pcTitleMonth = `${pcToday.getFullYear()}.${String(pcToday.getMonth() + 1).padStart(2, "0")}`;
  const pcCurrentSelection = vehicleSummaryLabel || (categoryIsDefault ? "전체" : category);
  const pcActivePriceLink = pcPriceLinks.find((link) => link.min === price.min && link.max === price.max)?.label;

  if (desktop && pcLayoutStyle === "bbmuseum") {
    // 칩 순서: 원본 [필터][전체차량][제조사][연식][가격][연료][판매자] + 요약 칩·트림 칩은 퀵필터 규격 위치(카테고리 바로 뒤)
    const chipByKey = (key: string) => quickFilterChips.find((chip) => chip.key === key);
    const bbmChips = [
      (() => { const chip = chipByKey("category"); return chip ? { ...chip, label: chip.label === "전체" ? "전체차량" : chip.label } : undefined; })(),
      chipByKey("vehicle-summary") ?? chipByKey("maker"),
      chipByKey("variant"),
      chipByKey("year"),
      chipByKey("price"),
      chipByKey("fuel"),
      {
        key: "seller",
        label: sellerType === "전체" ? "판매자" : sellerType,
        active: sellerType !== "전체",
        onClick: () => openQuickFilter("seller"),
        onClear: sellerType !== "전체" ? () => setFilters((current) => ({ ...current, seller: "전체" })) : undefined,
      },
    ].filter((chip): chip is NonNullable<typeof chip> => Boolean(chip));
    const bbmItems = visibleCars.length ? visibleCars.map((car) => pcGridView
      ? <CarCard key={car.id} car={car} cardView={false} liked={likedIds.includes(car.id)} onOpen={() => flow.push(detailScreen)} onToggleLike={() => toggleLiked(car.id)} />
      : <BbCarCard key={car.id} car={car} liked={likedIds.includes(car.id)} onOpen={() => flow.push(detailScreen)} onToggleLike={() => toggleLiked(car.id)} onNotify={setSearchToast} />) : carListItems;
    return (
      <>
        <MobileScroll className="app-screen">
          <main className="marketplace is-bbm" aria-label="중고차 리스트">
            <BbHeader onNotify={setSearchToast} onOpenFavorites={() => flow.push(savedListingsScreen)} />
            <div className="bbm-page">
              <BbFilterSidebar maker={maker} onChooseMaker={applyMakerFilter} onReset={() => resetFilters()} onNotify={setSearchToast} />
              <div className="bbm-content">
                <section className="bbm-content-head" aria-label="검색 조건">
                  <nav className="bbm-breadcrumb" aria-label="현재 위치"><strong>{categoryIsDefault ? "전체차량" : category}</strong>{vehicleSummaryLabel ? <span>{vehicleSummaryLabel}</span> : null}</nav>
                  <div className="bbm-summary">
                    <strong>{visibleCars.length.toLocaleString("ko-KR")}대</strong>
                    <button type="button" className={`bbm-save-search${searchSaved ? " is-saved" : ""}`} aria-pressed={searchSaved} onClick={toggleSearchSaved}><BbIcon name="saved-search" size={20} />검색저장</button>
                  </div>
                  <div className="bbm-chips">
                    <button type="button" className="bbm-filter-button" aria-label={activeFilterCount ? `필터 ${activeFilterCount}개 적용됨` : "필터"} onClick={() => { setDraftFilters(filters); setFilterFocus(null); setSheet("filter"); }}><BbIcon name="filter" size={20} />{activeFilterCount ? <b>{activeFilterCount}</b> : null}<span>필터</span></button>
                    {bbmChips.map((chip) => <FilterChip key={chip.key} label={chip.label} active={chip.active} className={chip.className} onClick={chip.onClick} onClear={chip.onClear} />)}
                  </div>
                  <div className="bbm-quick-slot">{quickRail}</div>
                </section>
                <section className="bbm-results" aria-label="매물 목록">
                  <nav className="bbm-toolbar" aria-label="매물 유형과 정렬">
                    <div className="bbm-seller-tabs" role="tablist" aria-label="판매자 유형">
                      {(["전체", "개인", "딜러"] as SellerType[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={sellerType === tab} className={sellerType === tab ? "is-selected" : ""} onClick={() => setFilters((current) => ({ ...current, seller: tab }))}>{tab}</button>)}
                      <button type="button" role="tab" aria-selected={false} onClick={() => setSearchToast("브랜드 매물은 정식 서비스에서 이용해 주세요.")}>브랜드</button>
                    </div>
                    <div className="bbm-toolbar-actions">
                      <label className="bbm-video-filter"><span>영상 매물</span><BbSwitch checked={videoOnly} label="영상 매물" onChange={() => setFilters((current) => ({ ...current, videoOnly: !current.videoOnly }))} /></label>
                      <span className="bbm-toolbar-divider" aria-hidden="true" />
                      <button type="button" className="bbm-sort" onClick={() => setSheet("sort")}>{sort === "최신순" ? "업데이트순" : sort}<BbIcon name="chevron-down" size={20} /></button>
                      <span className="bbm-toolbar-divider" aria-hidden="true" />
                      <button type="button" className="bbm-view" aria-pressed={pcGridView} onClick={() => setPcGridView((value) => !value)}>{pcGridView ? "앨범형" : "목록형"}<BbIcon name="view-list" size={20} /></button>
                    </div>
                  </nav>
                  <div className={`car-list ${pcGridView ? "is-pc-grid" : "bbm-list"}`} aria-live="polite">{bbmItems}</div>
                </section>
              </div>
            </div>
          </main>
        </MobileScroll>
        {searchToast ? <div className="market-toast" role="status" aria-live="polite">{searchToast}</div> : null}
        {marketSheet}
      </>
    );
  }

  if (desktop) {
    return (
      <>
        <MobileScroll className="app-screen">
          <main className="marketplace is-pc" aria-label="중고차 리스트">
            <PcHeader query={query} setQuery={setQuery} searchPlaceholder={categorySearchPlaceholder} regionLabel={regionLabel} onOpenRegion={openRegionSheet} onOpenFavorites={() => flow.push(savedListingsScreen)} onNotify={setSearchToast} />
            <div className="pc-page">
              <section className="pc-filter-panel" aria-label="검색 조건">
                <nav className="pc-breadcrumb" aria-label="현재 위치"><span>보배드림 중고차</span><span>중고차</span><span>{regionLabel}</span><strong>{pcCurrentSelection}</strong></nav>
                <div className="pc-filter-title">
                  <h1>{visibleCars.length.toLocaleString("ko-KR")}대 중고차 · {regionLabel} · {pcTitleMonth}</h1>
                  <button type="button" className={`pc-save-search${searchSaved ? " is-saved" : ""}`} aria-pressed={searchSaved} onClick={toggleSearchSaved}>{searchSaved ? <BookmarkFilledIcon /> : <BookmarkIcon />}검색 저장</button>
                </div>
                <div className="pc-filter-row" ref={pcFilterRowRef}>
                  {filterShell}
                  {pcFilterCanScroll ? <button type="button" className="pc-filter-next" aria-label="필터 더 보기" onClick={() => pcFilterRowRef.current?.querySelector<HTMLElement>(".filter-rail")?.scrollBy({ left: 240, behavior: "smooth" })}><ChevronRightIcon /></button> : null}
                  <button type="button" className="pc-filter-reset" onClick={() => resetFilters()}>초기화</button>
                </div>
                <div className="pc-quick-slot">{quickRail}</div>
              </section>
              <div className="pc-columns">
                <section className="pc-list-panel" aria-label="매물 목록">
                  <nav className="pc-list-head" aria-label="매물 유형과 정렬">
                    <div className="pc-seller-tabs" role="tablist" aria-label="판매자 유형">
                      {(["전체", "개인", "딜러"] as SellerType[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={sellerType === tab} className={sellerType === tab ? "is-selected" : ""} onClick={() => setFilters((current) => ({ ...current, seller: tab }))}>{tab}</button>)}
                    </div>
                    <div className="pc-list-controls">
                      <label className="pc-video-toggle"><span>영상 보기</span><button type="button" role="switch" aria-checked={videoOnly} className={videoOnly ? "is-on" : ""} onClick={() => setFilters((current) => ({ ...current, videoOnly: !current.videoOnly }))}><span /></button></label>
                      <span className="pc-list-divider" aria-hidden="true" />
                      <button type="button" className="pc-sort-button" onClick={() => setSheet("sort")}>{sort}<ChevronDownIcon /></button>
                      <span className="pc-list-divider" aria-hidden="true" />
                      <button type="button" className="pc-view-toggle" aria-pressed={pcGridView} onClick={() => setPcGridView((value) => !value)}>{pcGridView ? <RowsIcon /> : <DashboardIcon />}{pcGridView ? "목록 보기" : "그리드 보기"}</button>
                    </div>
                  </nav>
                  <section className={`car-list ${pcGridView ? "is-pc-grid" : "is-pc-rows"}`} aria-live="polite">{carListItems}</section>
                </section>
                <aside className="pc-sidebar" aria-label="추천 검색">
                  <section className="pc-sidebar-card is-site-select" aria-label="퀵필터 사례">{quickStyleSelect}</section>
                  <PcSidebarCard title="가격대별 중고차" items={pcPriceLinks.map((link) => link.label)} activeLabel={pcActivePriceLink} onChoose={(label) => {
                    const link = pcPriceLinks.find((item) => item.label === label);
                    if (!link) return;
                    const nextPrice = label === pcActivePriceLink ? emptyPrice : { ...price, min: link.min, max: link.max };
                    setFilters((current) => ({ ...current, price: nextPrice }));
                    setDraftFilters((current) => ({ ...current, price: nextPrice }));
                  }} />
                  <PcSidebarCard title="차체 유형별 중고차" items={pcBodyLinks} activeLabel={filters.body === "전체" ? undefined : filters.body} onChoose={(label) => {
                    const nextBody = filters.body === label ? "전체" : label;
                    setFilters((current) => ({ ...current, body: nextBody }));
                    setDraftFilters((current) => ({ ...current, body: nextBody }));
                  }} />
                </aside>
              </div>
            </div>
          </main>
        </MobileScroll>
        {searchToast ? <div className="market-toast" role="status" aria-live="polite">{searchToast}</div> : null}
        {marketSheet}
      </>
    );
  }

  return (
    <>
      <MobileScroll className="app-screen">
        <main className="marketplace" aria-label="중고차 리스트">
          <Header query={query} setQuery={setQuery} searchPlaceholder={categorySearchPlaceholder} searchSaved={searchSaved} onToggleSearchSaved={toggleSearchSaved} onOpenFavorites={() => flow.push(savedListingsScreen)} />
          <section className="region-bar" aria-label="지역 선택">
            <button type="button" aria-label={`현재 지역 ${regionLabel}, 지역 선택 열기`} onClick={openRegionSheet}><Icon name="location-blue.svg" /><span className="region-label">지역:</span><strong>{regionLabel}</strong><span className="region-chevron-icon" aria-hidden="true"><Icon name="region-chevron.svg" /></span></button>
            <button type="button" className="reset-button" onClick={() => resetFilters()}>초기화</button>
          </section>
          {filterShell}
          {quickRail}
          <section className="video-toggle-row" aria-label="영상 보기와 퀵필터 사례 선택">
            <div className="video-toggle-copy">
              <span>영상보기</span>
              <button type="button" role="switch" aria-checked={videoOnly} className={videoOnly ? "is-on" : ""} onClick={() => setFilters((current) => ({ ...current, videoOnly: !current.videoOnly }))}><span /></button>
            </div>
            <label className="quick-style-select">
              <span>적용 사이트</span>
              <select value={quickFilterStyle} onChange={(event) => chooseQuickFilterStyle(event.currentTarget.value as QuickFilterStyle)}>
                {quickFilterStyleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </section>
          <nav className="list-toolbar" aria-label="매물 유형과 정렬">
            <div className="seller-tabs" role="tablist" aria-label="판매자 유형">
              {(["전체", "개인", "딜러"] as SellerType[]).map((tab) => <button key={tab} type="button" role="tab" aria-selected={sellerType === tab} className={sellerType === tab ? "is-selected" : ""} onClick={() => setFilters((current) => ({ ...current, seller: tab }))}>{tab}</button>)}
            </div>
            <div className="sort-controls">
              <button type="button" className="sort-button" onClick={() => setSheet("sort")}>{sort}<span className="sort-arrow-icon" aria-hidden="true"><Icon name="sort-arrow.svg" /></span></button><span className="toolbar-divider" />
              <button type="button" className={`density-button${cardView ? " is-active" : ""}`} aria-label={cardView ? "목록형 보기로 전환" : "카드형 보기로 전환"} aria-pressed={cardView} onClick={() => setCardView((value) => !value)}><Icon name={cardView ? "card-view.svg" : "notion-list.svg"} /></button>
            </div>
          </nav>
          <section className="car-list" aria-live="polite">{carListItems}</section>
        </main>
      </MobileScroll>
      {searchToast ? <div className="market-toast" role="status" aria-live="polite">{searchToast}</div> : null}
      {marketSheet}
    </>
  );
}


export { configureListingScreens, Header, FilterChip, CarCard, RegionSheet, SavedListingsHeader, SavedListingsScreen, MarketplaceScreen };
