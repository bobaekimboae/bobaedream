// 리액트 src/prototype/listing/index.tsx 의 작은 부품들(MarketplaceScreen 이 쓰는 것) — TSX 렌더 함수로 옮김.
//   PcHeader(516) · BbmCatalogHeaderSearch(563) · PcSidebarCard(628) · Header(643) · FilterChip(701) · PcCarRow(720)
//   CarCard(761) · RegionSheet(830) · SavedListingsHeader(871) · SavedListingsScreen(882)
// 리액트 판과 줄 단위로 대조할 수 있게 같은 JSX 를 그대로 두었다. 콜백 prop(onXxx)은 emit 이 아니라 리액트처럼 함수 prop 이다
// (MarketplaceScreen.tsx 도 TSX 라 onXxx 로 그대로 넘긴다).
// 차이: KeyboardInput 의 onChange(글자마다) → onInput, ref → 부품의 el(input). 리액트 useMemo → 렌더 때 바로 계산.
import { defineComponent, shallowRef, type FunctionalComponent, type VNodeChild } from "vue";
import {
  asset,
  bikeNeighborhoodsForDistrict,
  displayListPlace,
  displaySpecs,
  districtsByProvince,
  emptyRegion,
  inventoryCars,
  provinceOptions,
  quickRegions,
  radiusOptions,
  sellerAvatar,
  sellerLabel,
  setActiveDetailCar,
  type Car,
  type RegionMenu,
  type RegionSelection,
} from "@proto/data";
import { bbSearchVariant, bbStandaloneTruckSite } from "@proto/listing/pc-bbmuseum";
import { bbmIcon } from "@proto/listing/bbm-list";
import type { VehicleSearchRecord } from "@proto/vehicle-catalog";
import { renderHooks, setter } from "../../lib/render-hooks";
import { useRef } from "../../lib/listing/react-state";
import { bbSearchCategories, bbSearchCatMode, bbSearchPopular, pcAsset } from "../../lib/listing/marketplace-local";
import { detailScreen } from "../../lib/listing/listing-screens";
import { useKeyboard } from "../../composables/mobile/useKeyboard";
import { useFlow } from "../../composables/mobile/useFlow";
import { useFavorites } from "../../composables/data/useFavorites";
import KeyboardInput from "../mobile/KeyboardInput.vue";
import MobileScroll from "../mobile/MobileScroll.vue";
import Icon from "../shared/Icon.vue";
import CatalogSearchResults from "../vehicle-catalog/CatalogSearchResults.vue";
import ListingLanguageSelect from "./ListingLanguageSelect.vue";
import BbIcon from "./BbIcon.vue";
import ChototSearchIcon from "./ChototSearchIcon.vue";
import BookmarkFilledIcon from "../icons/BookmarkFilledIcon.vue";
import ChevronDownIcon from "../icons/ChevronDownIcon.vue";
import ChevronUpIcon from "../icons/ChevronUpIcon.vue";
import HeartFilledIcon from "../icons/HeartFilledIcon.vue";
import HeartIcon from "../icons/HeartIcon.vue";
import MagnifyingGlassIcon from "../icons/MagnifyingGlassIcon.vue";

type ReactNode = VNodeChild;
const inputValue = (event: Event) => (event.currentTarget as HTMLInputElement).value;
// KeyboardInput 은 Vue 부품이라 ref 가 부품을 가리킨다. 리액트처럼 input 요소를 담는다.
const inputRefOf = (box: { current: HTMLInputElement | null }) => (instance: unknown) => {
  box.current = (instance as { el?: HTMLInputElement | null } | null)?.el ?? null;
};

type PcHeaderProps = { query: string; setQuery: (query: string) => void; searchPlaceholder: string; regionLabel: string; onOpenRegion: () => void; onOpenFavorites: () => void; onNotify: (message: string) => void; catalogRecords?: VehicleSearchRecord[] | null; onCatalogFocus?: () => void; onCatalogChoose?: (record: VehicleSearchRecord) => void };
export const PcHeader = defineComponent((props: PcHeaderProps) => {
  const keyboard = useKeyboard();
  const searchOpen$ = shallowRef(false);
  const setSearchOpen = setter(searchOpen$);
  return () => {
    const { query, setQuery, searchPlaceholder, regionLabel, onOpenRegion, onOpenFavorites, onNotify, catalogRecords, onCatalogFocus, onCatalogChoose } = props;
    const searchOpen = searchOpen$.value;
    return (
      <header class="pc-list-header" aria-label="보배드림 중고차 검색">
        <div class="pc-list-header-inner">
          <div class="pc-list-header-left">
            <button type="button" class="pc-header-icon" aria-label="전체 메뉴" onClick={() => onNotify("전체 메뉴는 정식 서비스에서 이용해 주세요.")}><img src={pcAsset("9546-imgGroup1000005392.svg")} alt="" draggable={false} /></button>
            <button type="button" class="pc-list-logo" aria-label="보배드림 중고차 처음으로" onClick={() => document.querySelector(".app-screen")?.scrollTo({ top: 0 })}><span><img src={pcAsset("9546-imgGroup.svg")} alt="" draggable={false} /></span><img src={pcAsset("9546-imgLogo.svg")} alt="보배드림" draggable={false} /></button>
            <button type="button" class="pc-region-pill" aria-label={`현재 지역 ${regionLabel}, 지역 선택 열기`} onClick={onOpenRegion}><Icon name="location-blue.svg" /><span>{regionLabel}</span><ChevronDownIcon /></button>
          </div>
          <label class="pc-search">
            <KeyboardInput aria-label={`${searchPlaceholder} 검색`} value={query} onFocus={() => { setSearchOpen(true); onCatalogFocus?.(); }} onInput={(event: Event) => { setQuery(inputValue(event)); setSearchOpen(true); onCatalogFocus?.(); }} onBlur={() => keyboard.hide()} placeholder={`${searchPlaceholder} 모델명, 트림으로 검색`} />
            <button type="button" class="pc-search-button" aria-label="검색" onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={() => keyboard.hide()}><MagnifyingGlassIcon /></button>
            {searchOpen && query.trim() && onCatalogChoose ? <CatalogSearchResults records={catalogRecords ?? null} query={query} onChoose={(record: VehicleSearchRecord) => { setSearchOpen(false); keyboard.hide(); onCatalogChoose(record); }} /> : null}
          </label>
          <div class="pc-list-header-right">
            <button type="button" class="pc-header-icon" aria-label="저장한 매물 열기" onClick={onOpenFavorites}><img src={pcAsset("9546-img1IconHeartSize24.svg")} alt="" draggable={false} /></button>
            <button type="button" class="pc-header-icon" aria-label="알림" onClick={() => onNotify("알림은 정식 서비스에서 이용해 주세요.")}><img src={pcAsset("9546-img1IconNoticeSize24.svg")} alt="" draggable={false} /></button>
            <button type="button" class="pc-header-pill is-support" onClick={() => onNotify("고객센터는 정식 서비스에서 이용해 주세요.")}>고객센터</button>
            <button type="button" class="pc-header-pill is-login" onClick={() => onNotify("로그인은 정식 서비스에서 이용해 주세요.")}>로그인</button>
            <button type="button" class="pc-header-pill is-primary" onClick={() => onNotify("내차팔기는 정식 서비스에서 이용해 주세요.")}>내차팔기</button>
            <button type="button" class="pc-profile-menu" aria-label="내 정보 메뉴" onClick={() => onNotify("내 정보는 정식 서비스에서 이용해 주세요.")}><img src={pcAsset("9546-img1IconUserSmileSize24.svg")} alt="" draggable={false} /><ChevronDownIcon /></button>
          </div>
        </div>
      </header>
    );
  };
}, { name: "PcHeader", props: ["query", "setQuery", "searchPlaceholder", "regionLabel", "onOpenRegion", "onOpenFavorites", "onNotify", "catalogRecords", "onCatalogFocus", "onCatalogChoose"] });

type BbmCatalogHeaderSearchProps = { query: string; setQuery: (query: string) => void; searchPlaceholder: string; catalogRecords?: VehicleSearchRecord[] | null; onCatalogFocus?: () => void; onCatalogChoose?: (record: VehicleSearchRecord) => void; category?: string; onChooseCategory?: (category: string) => void };
export const BbmCatalogHeaderSearch = defineComponent((props: BbmCatalogHeaderSearchProps) => {
  const keyboard = useKeyboard();
  const hooks = renderHooks();
  const searchOpen$ = shallowRef(false);
  const setSearchOpen = setter(searchOpen$);
  const catOpen$ = shallowRef(false);
  const setCatOpen = setter(catOpen$);
  const catRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  return () => {
    hooks.begin();
    const { query, setQuery, searchPlaceholder, catalogRecords, onCatalogFocus, onCatalogChoose, category, onChooseCategory } = props;
    const searchOpen = searchOpen$.value;
    const catOpen = catOpen$.value;
    const variant = bbSearchVariant();
    const catMode = variant === "default" && bbSearchCatMode() && Boolean(onChooseCategory);
    const catValue = bbSearchCategories.some((item) => item.value === category) ? category! : (["국산차", "수입차", "전기차", "럭셔리카", "슈퍼카", "올드카", "JDM", "서울오토갤러리", "도이치오토월드", "SK V1 모터스"].includes(category ?? "") ? "중고차" : "전체");
    const catLabel = bbSearchCategories.find((item) => item.value === catValue)?.label ?? "전체차량";
    hooks.effect(() => {
      if (!catMode || (!catOpen && !searchOpen)) return;
      const onDown = (event: PointerEvent) => { if (catRef.current && !catRef.current.contains(event.target as Node)) { setCatOpen(false); setSearchOpen(false); } };
      const onKey = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") { setCatOpen(false); setSearchOpen(false); } };
      window.addEventListener("pointerdown", onDown); window.addEventListener("keydown", onKey);
      return () => { window.removeEventListener("pointerdown", onDown); window.removeEventListener("keydown", onKey); };
    }, [catMode, catOpen, searchOpen]);
    if (catMode) {
      const popular = bbSearchPopular[catValue] ?? bbSearchPopular["전체"];
      const poshParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("pcsearch") : null;
      // 기본 = 회색 간결형(포쉬마크 요소 + 회색 채움). cat1 = 이전 기본(회색 · 굵은 범위 · 왼쪽 돋보기) 보존
      const poshGray = poshParam !== "posh" && poshParam !== "posh2" && poshParam !== "cat1";
      const posh = poshParam === "posh" || poshParam === "posh2" || poshGray;
      const poshBlue = poshParam === "posh2" || poshGray;
      return <div class={`bbm-catalog-search is-main is-cat${posh ? " is-posh" : ""}${poshBlue ? " is-posh-blue" : ""}${poshGray ? " is-posh-gray" : ""}`} ref={(el: any) => { catRef.current = el; }}>
        <button type="button" class="bbm-search-cat" aria-haspopup="listbox" aria-expanded={catOpen} aria-label={`검색 범위 ${catLabel}, 바꾸기`} onClick={() => { setCatOpen((open) => !open); setSearchOpen(false); }}>
          <span>{catLabel}</span><BbIcon name="chevron-down" size={16} />
        </button>
        <span class="bbm-search-cat-divider" aria-hidden="true" />
        {posh ? null : <ChototSearchIcon />}
        <KeyboardInput ref={inputRefOf(inputRef)} aria-label={`${catLabel}에서 검색`} value={query} placeholder={posh ? "어떤 차를 찾으세요?" : `${catLabel}에서 모델명, 트림 검색`} onFocus={() => { setSearchOpen(true); setCatOpen(false); onCatalogFocus?.(); }} onInput={(event: Event) => { setQuery(inputValue(event)); setSearchOpen(true); onCatalogFocus?.(); }} onBlur={() => keyboard.hide()} />
        {query ? <button type="button" class="bbm-catalog-search-clear" aria-label="검색어 지우기" onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={() => setQuery("")}>×</button> : null}
        <button type="button" class="bbm-catalog-search-go" aria-label="검색" onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={() => { if (!query.trim()) inputRef.current?.focus(); else { setSearchOpen(false); keyboard.hide(); } }}><ChototSearchIcon size={posh && !poshBlue ? 22 : 16} /></button>
        {catOpen ? <ul class="bbm-search-cat-menu" role="listbox" aria-label="검색 범위">
          {bbSearchCategories.map((item) => <li key={item.value}><button type="button" role="option" aria-selected={item.value === catValue} class={item.value === catValue ? "is-selected" : ""} onClick={() => { setCatOpen(false); if (item.value !== catValue) onChooseCategory?.(item.value); inputRef.current?.focus(); }}><span>{item.label}</span>{item.value === catValue ? <BbIcon name="check" size={16} /> : null}</button></li>)}
        </ul> : null}
        {searchOpen && !query.trim() ? <div class="bbm-search-popular" role="region" aria-label={`${catLabel} 인기 검색어`}>
          <strong>{catLabel} 인기 검색어</strong>
          <div>{popular.map((word) => <button type="button" key={word} onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={() => { setQuery(word); setSearchOpen(false); keyboard.hide(); }}>{word}</button>)}</div>
        </div> : null}
        {searchOpen && query.trim() && onCatalogChoose ? <CatalogSearchResults records={catalogRecords ?? null} query={query} onChoose={(record: VehicleSearchRecord) => { setSearchOpen(false); keyboard.hide(); onCatalogChoose(record); }} /> : null}
      </div>;
    }
    hooks.effect(() => {
      if (variant !== "kaidee") return;
      const onKey = (event: globalThis.KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
        if (event.key !== "/" || !target || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable) return;
        event.preventDefault();
        inputRef.current?.focus();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [variant]);
    const placeholder = variant === "kaidee" ? `${searchPlaceholder}에서 무엇을 찾으세요? / 를 눌러 검색` : variant === "chotot" ? `${searchPlaceholder} 모델명, 트림으로 찾기…` : `${searchPlaceholder} 모델명, 트림으로 검색`;
    const submitButton = <button type="button" class="bbm-catalog-search-go" aria-label="검색" onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={() => { if (!query.trim()) inputRef.current?.focus(); else keyboard.hide(); }}>{variant === "default" ? <ChototSearchIcon size={16} /> : <MagnifyingGlassIcon aria-hidden="true" />}</button>;
    return <label class={`bbm-catalog-search is-${variant === "default" ? "main" : variant}`}>
      {variant === "kaidee" ? submitButton : variant === "chotot" ? <MagnifyingGlassIcon aria-hidden="true" /> : <ChototSearchIcon />}
      <KeyboardInput ref={inputRefOf(inputRef)} aria-label={`${searchPlaceholder} 검색`} value={query} placeholder={placeholder} onFocus={() => { setSearchOpen(true); onCatalogFocus?.(); }} onInput={(event: Event) => { setQuery(inputValue(event)); setSearchOpen(true); onCatalogFocus?.(); }} onBlur={() => keyboard.hide()} />
      {query ? <button type="button" class="bbm-catalog-search-clear" aria-label="검색어 지우기" onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={() => setQuery("")}>×</button> : null}
      {variant === "chotot" || variant === "default" ? submitButton : null}
      {searchOpen && query.trim() && onCatalogChoose ? <CatalogSearchResults records={catalogRecords ?? null} query={query} onChoose={(record: VehicleSearchRecord) => { setSearchOpen(false); keyboard.hide(); onCatalogChoose(record); }} /> : null}
    </label>;
  };
}, { name: "BbmCatalogHeaderSearch", props: ["query", "setQuery", "searchPlaceholder", "catalogRecords", "onCatalogFocus", "onCatalogChoose", "category", "onChooseCategory"] });

type PcSidebarCardProps = { title: string; items: string[]; activeLabel?: string; onChoose: (label: string) => void; visibleCount?: number };
export const PcSidebarCard = defineComponent((props: PcSidebarCardProps) => {
  const open$ = shallowRef(true);
  const setOpen = setter(open$);
  const expanded$ = shallowRef(false);
  const setExpanded = setter(expanded$);
  return () => {
    const { title, items, activeLabel, onChoose, visibleCount = 5 } = props;
    const open = open$.value;
    const expanded = expanded$.value;
    const shownItems = expanded ? items : items.slice(0, visibleCount);
    return (
      <section class="pc-sidebar-card" aria-label={title}>
        <button type="button" class="pc-sidebar-title" aria-expanded={open} onClick={() => setOpen((value) => !value)}><strong>{title}</strong>{open ? <ChevronUpIcon /> : <ChevronDownIcon />}</button>
        {open ? <>
          <ul>{shownItems.map((label) => <li key={label}><button type="button" class={activeLabel === label ? "is-selected" : ""} aria-pressed={activeLabel === label} onClick={() => onChoose(label)}>{label}</button></li>)}</ul>
          {items.length > visibleCount ? <button type="button" class="pc-sidebar-more" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "접기" : "더보기"}{expanded ? <ChevronUpIcon /> : <ChevronDownIcon />}</button> : null}
        </> : null}
      </section>
    );
  };
}, { name: "PcSidebarCard", props: ["title", "items", "activeLabel", "onChoose", "visibleCount"] });

type HeaderProps = { query: string; setQuery: (query: string) => void; searchPlaceholder: string; searchSaved: boolean; onToggleSearchSaved: () => void; onOpenFavorites: () => void; bbm?: boolean; siteTitle?: string; catalogRecords?: VehicleSearchRecord[] | null; onCatalogFocus?: () => void; onCatalogChoose?: (record: VehicleSearchRecord) => void };
export const Header = defineComponent((props: HeaderProps) => {
  const keyboard = useKeyboard();
  const searchOpen$ = shallowRef(false);
  const setSearchOpen = setter(searchOpen$);
  return () => {
    const { query, setQuery, searchPlaceholder, searchSaved, onToggleSearchSaved, onOpenFavorites, bbm = false, siteTitle, catalogRecords, onCatalogFocus, onCatalogChoose } = props;
    const searchOpen = searchOpen$.value;
    // QF-091: 과쯔(개발 시안형) 모바일은 원본 아이콘
    const headerIcon = (name: string, fallback: string) => bbm ? <img class="ui-icon" src={bbmIcon(`m-header-${name}`)} alt="" aria-hidden="true" /> : <Icon name={fallback} />;
    const normalizedQuery = query.trim().toLowerCase();
    const searchSuggestions = (() => {
      const categorySuggestions = searchPlaceholder.includes("특장")
        ? ["현대 포터 1톤", "1톤 탑차", "카고 화물트럭", "윙바디", "파워게이트", "냉동탑차"]
        : searchPlaceholder.includes("바이크")
          ? ["혼다 PCX", "야마하 NMAX", "할리데이비슨", "스쿠터", "투어러"]
          : ["현대 그랜저", "기아 쏘렌토", "제네시스 G80", "벤츠 E클래스", "BMW 5시리즈", "토요타 캠리"];
      if (!normalizedQuery) return categorySuggestions.slice(0, 4);
      const matches = categorySuggestions.filter((item) => item.toLowerCase().includes(normalizedQuery));
      const suffixes = searchPlaceholder.includes("특장")
        ? ["1톤", "카고", "탑차", "윙바디", "파워게이트", "냉동탑차", "특장차"]
        : searchPlaceholder.includes("바이크")
          ? ["스쿠터", "스포츠", "투어러", "네이키드", "125cc", "300cc", "중고"]
          : ["E클래스", "C클래스", "S클래스", "SUV", "세단", "AMG", "4MATIC"];
      return [...new Set([query.trim(), ...matches, ...suffixes.map((suffix) => `${query.trim()} ${suffix}`)])].slice(0, 8);
    })();

    const closeSearch = () => { setSearchOpen(false); keyboard.hide(); };

    return (
      <>{siteTitle && !searchOpen ? <div class="bike-site-mobile-brand" aria-label={siteTitle}>
        <span class="bike-site-mobile-brand__logo is-service-logo" aria-hidden="true"><img src={asset(bbStandaloneTruckSite() ? "bbm/service-logos/v01/bobaedream-truck-v01.png" : "bbm/service-logos/v01/bobaedream-bike-v01.png")} alt="" draggable={false} /></span>
        <h1>{siteTitle.startsWith("보배드림 ") ? <>보배드림 <span class="bike-site-mobile-brand__accent">{siteTitle.slice(5)}</span></> : siteTitle}</h1>
      </div> : null}
      <header class={`top-bar${bbm ? " is-bbm" : ""}${searchOpen ? " is-search-open" : ""}`} aria-label={siteTitle ? `${siteTitle} 검색` : "중고차 검색"}>
        <button class="icon-button back-button" type="button" aria-label={searchOpen ? "검색 닫기" : "뒤로 가기"} onClick={() => searchOpen ? closeSearch() : window.history.back()}>{headerIcon("back", "back.svg")}</button>
        <label class="search-field">
          {headerIcon("search", "search.svg")}
          <KeyboardInput aria-label={`${searchPlaceholder} 검색`} value={query} onFocus={() => { setSearchOpen(true); onCatalogFocus?.(); }} onInput={(event: Event) => { setQuery(inputValue(event)); setSearchOpen(true); onCatalogFocus?.(); }} onBlur={() => keyboard.hide()} placeholder={searchPlaceholder} />
          {bbm && query ? <button type="button" class="search-clear" aria-label="검색어 지우기" onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={() => setQuery("")}>×</button> : null}
          <span class="search-divider" />
          <button type="button" class={`search-save${searchSaved ? " is-saved" : ""}`} aria-label={searchSaved ? "저장한 검색 조건 삭제" : "검색 조건 저장"} aria-pressed={searchSaved} onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={onToggleSearchSaved}>{searchSaved ? <BookmarkFilledIcon /> : headerIcon("bookmark", "bookmark.svg")}</button>
        </label>
        <ListingLanguageSelect compact />
        <button class="icon-button" type="button" aria-label="저장한 매물 열기" onClick={onOpenFavorites}>{headerIcon("heart", "heart.svg")}</button>
        {!bbm ? <button class="icon-button" type="button" aria-label="메시지">{headerIcon("chat", "message.svg")}</button> : null}
      </header>
      {bbm && searchOpen ? <section class="bbm-search-suggest" aria-label="검색어 추천" aria-live="polite">
        {normalizedQuery && onCatalogChoose ? <CatalogSearchResults records={catalogRecords ?? null} query={query} onChoose={(record: VehicleSearchRecord) => { setSearchOpen(false); keyboard.hide(); onCatalogChoose(record); }} /> : null}
        {!normalizedQuery || !onCatalogChoose ? <>
        {!normalizedQuery ? <h2>추천 검색어</h2> : null}
        <div class="bbm-search-suggest__list">
          {searchSuggestions.map((suggestion, index) => <button key={`${suggestion}-${index}`} type="button" onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={() => { setQuery(suggestion); setSearchOpen(false); keyboard.hide(); }}>
            <MagnifyingGlassIcon aria-hidden="true" />
            <span><strong>{suggestion}</strong><small>{normalizedQuery ? `${searchPlaceholder}에서` : index === 0 ? "최근 많이 찾은 검색어" : "추천 검색어"}</small></span>
          </button>)}
        </div>
        {normalizedQuery ? <button type="button" class="bbm-search-seller" onPointerdown={(event: PointerEvent) => event.preventDefault()} onClick={() => { setSearchOpen(false); keyboard.hide(); }}>판매자 상호 “{query.trim()}” 검색</button> : null}
        </> : null}
      </section> : null}</>
    );
  };
}, { name: "Header", props: ["query", "setQuery", "searchPlaceholder", "searchSaved", "onToggleSearchSaved", "onOpenFavorites", "bbm", "siteTitle", "catalogRecords", "onCatalogFocus", "onCatalogChoose"] });

type FilterChipProps = { label: string; icon?: string; active?: boolean; className?: string; onClick: () => void; onClear?: () => void; bbm?: boolean; prefix?: ReactNode };
export const FilterChip: FunctionalComponent<FilterChipProps> = ({ label, icon, active, className = "", onClick, onClear, bbm = false, prefix }) => {
  const chipClassName = `filter-chip${active ? " is-active" : ""}${className ? ` ${className}` : ""}`;
  if (active && onClear) {
    return (
      <div class={chipClassName}>
        <button class="filter-chip-label" type="button" aria-pressed="true" onClick={onClick}>{prefix}<span>{label}</span></button>
        <button class="filter-chip-clear" type="button" aria-label={`${label} 필터 해제`} onClick={onClear}>{bbm ? <><img class="ui-icon" src={bbmIcon("chip-remove")} alt="" aria-hidden="true" /><span class="filter-chip-clear-mark" aria-hidden="true" /></> : <Icon name="close.svg" />}</button>
      </div>
    );
  }
  return (
    <button class={chipClassName} type="button" aria-pressed={active} onClick={onClick}>
      {icon ? <Icon name={icon} /> : null}{prefix}<span>{label}</span>{!icon && !active ? (bbm ? <img class="ui-icon" src={bbmIcon("filter-toggle-chotot-v01")} alt="" aria-hidden="true" /> : <Icon name="chevron-down.svg" />) : null}
    </button>
  );
};
FilterChip.inheritAttrs = false;
FilterChip.displayName = "FilterChip";

// PC 기본 목록: 초톳 PC처럼 한 줄에 1개인 가로형 카드
type CarRowProps = { car: Car; liked: boolean; onToggleLike: () => void; onOpen: () => void };
export const PcCarRow: FunctionalComponent<CarRowProps> = ({ car, liked, onToggleLike, onOpen }) => {
  const displayedSeller = sellerLabel(car);
  const badges = car.badges ?? [];
  const specs = [displaySpecs(car.specs.slice(0, 3)), car.filter?.transmission].filter(Boolean).join(" · ");
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };
  return (
    <article class="car-card pc-car-row" role="link" tabindex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeydown={onKeyDown}>
      <div class="car-photo-wrap">
        <img class={`car-photo${car.imageFit === "contain" ? " is-catalog" : ""}`} src={asset(car.image)} alt={`${car.title} ${car.trim} 차량, ${car.posted}, 사진 ${car.photos}장`} draggable={false} />
        <div class="card-photo-meta" aria-hidden="true">
          <span class="card-posted">{car.posted}</span>
          <span class="card-photo-count">{car.photos}<Icon name="photo-count.svg" /></span>
        </div>
      </div>
      <div class="pc-car-copy">
        <h2 class="pc-car-title">{car.title} {car.trim}</h2>
        <p class="pc-car-specs">{specs}</p>
        <div class="pc-car-price">
          <p class="price">{car.price}</p>
          {car.lease ? <span class="pc-car-lease">{car.lease}</span> : null}
          {badges.length ? <div class="badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
        </div>
        <p class="pc-car-location"><Icon name="location-gray.svg" />{displayListPlace(car.place, car.sellerType)}</p>
        <div class="pc-car-seller">
          <img class="dealer-avatar" src={asset(sellerAvatar(car))} alt={`${displayedSeller} 프로필`} draggable={false} />
          <strong>{displayedSeller}</strong>
          <div class="pc-car-actions">
            <button type="button" class="pc-inquiry-button" onClick={(event: MouseEvent) => event.stopPropagation()}>문의</button>
            <button class={`pc-like-button${liked ? " is-liked" : ""}`} type="button" aria-label={`${car.title} ${liked ? "저장 해제" : "저장"}`} aria-pressed={liked} onClick={(event: MouseEvent) => { event.stopPropagation(); onToggleLike(); }}>{liked ? <HeartFilledIcon /> : <HeartIcon />}</button>
          </div>
        </div>
      </div>
    </article>
  );
};
PcCarRow.inheritAttrs = false;
PcCarRow.displayName = "PcCarRow";

export const CarCard: FunctionalComponent<CarRowProps & { cardView: boolean }> = ({ car, cardView, liked, onToggleLike, onOpen }) => {
  const displayedSeller = sellerLabel(car);
  const badges = car.badges ?? [];
  const cardPriceMatch = car.price.match(/^(월\s*)?(.+?)(\s*만원)$/);
  const cardPricePrefix = cardPriceMatch?.[1] ?? "";
  const cardPriceAmount = cardPriceMatch?.[2] ?? car.price;
  const cardPriceUnit = cardPriceMatch?.[3] ?? "";
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  const likeButton = (
    <button class={`like-button${liked ? " is-liked" : ""}`} type="button" aria-label={`${car.title} ${liked ? "저장 해제" : "저장"}`} aria-pressed={liked} onClick={(event: MouseEvent) => { event.stopPropagation(); onToggleLike(); }}>{liked ? <HeartFilledIcon /> : <HeartIcon />}</button>
  );

  return (
    <article class={`car-card${cardView ? " is-card-view" : ""}${badges.length ? " has-badges" : " has-no-badges"}`} role="link" tabindex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeydown={onKeyDown}>
      <div class="car-photo-wrap">
        <img class={`car-photo${car.imageFit === "contain" ? " is-catalog" : ""}`} src={asset(car.image)} alt={`${car.title} ${car.trim} 차량, ${car.posted}, 사진 ${car.photos}장`} draggable={false} />
        <div class="card-photo-meta" aria-hidden="true">
          <span class="card-posted">{car.posted}</span>
          <span class="card-photo-count">{car.photos}<Icon name="photo-count.svg" /></span>
        </div>
      </div>
      <div class="car-copy">
        <div class="car-main">
          {cardView ? (
            <div class="card-title-row">
              <div class="car-title-copy">
                <h2>{car.title}</h2>
                <p class="trim">{car.trim}</p>
              </div>
              <div class="card-title-actions">
                <button class="card-more-button" type="button" aria-label={`${car.title} 더보기`} onClick={(event: MouseEvent) => event.stopPropagation()}><Icon name="card-more.svg" /></button>
                {likeButton}
              </div>
            </div>
          ) : (
            <>
              <div class="car-title-row">
                <div class="car-title-copy">
                  <h2>{car.title}</h2>
                  <p class="trim">{car.trim}</p>
                </div>
              </div>
            </>
          )}
          <p class="specs">{displaySpecs(car.specs)}</p>
          {cardView ? <div class="card-price-block">
            <div class="card-price-row"><p class="price">{cardPricePrefix ? <span class="price-unit">{cardPricePrefix}</span> : null}<span>{cardPriceAmount}</span><span class="price-unit">{cardPriceUnit}</span></p>{car.lease ? <p class="lease">{car.lease}</p> : null}</div>
            {badges.length ? <div class="badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
          </div> : <><p class="price">{cardPricePrefix ? <span class="price-unit">{cardPricePrefix}</span> : null}<span>{cardPriceAmount}</span><span class="price-unit">{cardPriceUnit}</span></p>{car.lease ? <p class="lease">{car.lease}</p> : null}{badges.length ? <div class="badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}</>}
        </div>
        <div class="car-footer">
          <p class="location-line"><Icon name="location-gray.svg" />{displayListPlace(car.place, car.sellerType)}</p>
          <div class="dealer-line">
            <img class="dealer-avatar" src={asset(sellerAvatar(car))} alt={`${displayedSeller} 프로필`} draggable={false} />
            {cardView ? <div class="dealer-copy"><strong>{displayedSeller}</strong></div> : <p><strong>{displayedSeller}</strong></p>}
            {cardView ? <div class="card-contact-actions"><button type="button" aria-label={`${displayedSeller} 전화`} onClick={(event: MouseEvent) => event.stopPropagation()}><Icon name="card-call.svg" /></button><button type="button" aria-label={`${displayedSeller} 메시지`} onClick={(event: MouseEvent) => event.stopPropagation()}><Icon name="card-message.svg" /></button></div> : likeButton}
          </div>
        </div>
      </div>
    </article>
  );
};
CarCard.inheritAttrs = false;
CarCard.displayName = "CarCard";

type RegionSheetProps = { value: RegionSelection; resultCount: number; onChange: (value: RegionSelection) => void; onClose: () => void; onConfirm: () => void; allowNeighborhood?: boolean };
export const RegionSheet = defineComponent((props: RegionSheetProps) => {
  const menu$ = shallowRef<RegionMenu>(null);
  const setMenu = setter(menu$);
  return () => {
    const { value, resultCount, onChange, onClose, onConfirm, allowNeighborhood = false } = props;
    const menu = menu$.value;
    const districtOptions = value.province ? districtsByProvince[value.province] ?? ["전체"] : [];
    const districtPath = value.province && value.district ? `${value.province} ${value.district}` : "";
    const neighborhoodOptions = allowNeighborhood && districtPath ? bikeNeighborhoodsForDistrict(districtPath) : [];
    const chooseProvince = (province: string) => {
      onChange(province === "전국" ? emptyRegion : { province, district: "", neighborhood: "", radius: "" });
      setMenu(null);
    };
    const chooseQuickRegion = (label: string) => chooseProvince(label === "전남광주" ? "광주" : label);

    return (
      <div class="region-sheet">
        <button class="region-sheet-close" type="button" aria-label="지역 선택 닫기" onClick={onClose}><Icon name="sheet-close.svg" /></button>
        <div class="region-fields">
          <div class="region-select-wrap">
            <button class="region-select" type="button" aria-expanded={menu === "province"} onClick={() => setMenu((current) => current === "province" ? null : "province")}><span class={`region-select-value${value.province ? " has-value" : ""}`}>{value.province || "시/도 선택"}</span><span class="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
            {menu === "province" ? <div class="region-menu" role="listbox" aria-label="시도 선택">{provinceOptions.map((province) => <button key={province} type="button" role="option" aria-selected={(value.province || "전국") === province} onClick={() => chooseProvince(province)}>{province}</button>)}</div> : null}
          </div>
          <div class="region-quick-chips" aria-label="빠른 지역 선택">{quickRegions.map((label) => <button key={label} type="button" class={(value.province === (label === "전남광주" ? "광주" : label)) ? "is-selected" : ""} aria-pressed={value.province === (label === "전남광주" ? "광주" : label)} onClick={() => chooseQuickRegion(label)}>{label}</button>)}</div>
          <div class="region-select-wrap">
            <button class="region-select" type="button" disabled={!value.province} aria-expanded={menu === "district"} onClick={() => setMenu((current) => current === "district" ? null : "district")}><span class={`region-select-value${value.district ? " has-value" : ""}`}>{value.district || "시/군/구 선택"}</span><span class="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
            {menu === "district" ? <div class="region-menu" role="listbox" aria-label="시군구 선택">{districtOptions.map((district) => <button key={district} type="button" role="option" aria-selected={(value.district || "전체") === district} onClick={() => { onChange({ ...value, district: district === "전체" ? "" : district, neighborhood: "", radius: "" }); setMenu(null); }}>{district}</button>)}</div> : null}
          </div>
          {allowNeighborhood ? <div class="region-select-wrap">
            <button class="region-select" type="button" disabled={!value.district} aria-expanded={menu === "neighborhood"} onClick={() => setMenu((current) => current === "neighborhood" ? null : "neighborhood")}><span class={`region-select-value${value.neighborhood ? " has-value" : ""}`}>{value.neighborhood || "동·읍·면 선택"}</span><span class="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
            {menu === "neighborhood" ? <div class="region-menu" role="listbox" aria-label="동읍면 선택">{["전체", ...neighborhoodOptions].map((neighborhood) => <button key={neighborhood} type="button" role="option" aria-selected={(value.neighborhood || "전체") === neighborhood} onClick={() => { onChange({ ...value, neighborhood: neighborhood === "전체" ? "" : neighborhood, radius: "" }); setMenu(null); }}>{neighborhood}</button>)}</div> : null}
          </div> : null}
        </div>
        <div class="region-around">
          <div class="region-around-heading"><span /><strong>내 주변 검색</strong></div>
          <div class="region-select-wrap">
            <button class="region-select" type="button" aria-expanded={menu === "radius"} onClick={() => setMenu((current) => current === "radius" ? null : "radius")}><span class={`region-select-value${value.radius ? " has-value" : ""}`}>{value.radius ? `내 위치에서 ${value.radius}` : "내 위치와 검색 반경 선택"}</span><span class="region-select-chevron" aria-hidden="true"><Icon name="sheet-chevron.svg" /></span></button>
            {menu === "radius" ? <div class="region-menu is-upward" role="listbox" aria-label="검색 반경 선택">{radiusOptions.map((radius) => <button key={radius} type="button" role="option" aria-selected={value.radius === radius} onClick={() => { onChange({ province: "", district: "", neighborhood: "", radius }); setMenu(null); }}>{radius}</button>)}</div> : null}
          </div>
        </div>
        <div class="region-actions"><button type="button" class="region-reset" onClick={() => { onChange(emptyRegion); setMenu(null); }}>초기화</button><button type="button" class="region-confirm" onClick={onConfirm}>{Math.max(798, resultCount).toLocaleString("ko-KR")}대 매물 보기</button></div>
      </div>
    );
  };
}, { name: "RegionSheet", props: ["value", "resultCount", "onChange", "onClose", "onConfirm", "allowNeighborhood"] });

export const SavedListingsHeader = defineComponent(() => {
  const flow = useFlow();
  return () => (
    <header class="saved-header">
      <button type="button" aria-label="중고차 목록으로 돌아가기" onClick={() => flow.pop()}><Icon name="back.svg" /></button>
      <h1>저장한 매물</h1>
      <span aria-hidden="true" />
    </header>
  );
}, { name: "SavedListingsHeader" });

export const SavedListingsScreen = defineComponent(() => {
  const flow = useFlow();
  const favorites = useFavorites();
  const activeTab$ = shallowRef<"listings" | "videos">("listings");
  const setActiveTab = setter(activeTab$);
  return () => {
    const likedIds = favorites.likedIds.value; const { toggleLiked } = favorites;
    const activeTab = activeTab$.value;
    const savedCars = inventoryCars.filter((car) => likedIds.includes(car.id));

    return (
      <MobileScroll className="saved-screen">
        <main class="saved-listings" aria-label="저장한 매물">
          <div class="saved-tabs" role="tablist" aria-label="저장 항목 유형">
            <button type="button" role="tab" aria-selected={activeTab === "listings"} class={activeTab === "listings" ? "is-selected" : ""} onClick={() => setActiveTab("listings")}>매물 ({savedCars.length}/100)</button>
            <button type="button" role="tab" aria-selected={activeTab === "videos"} class={activeTab === "videos" ? "is-selected" : ""} onClick={() => setActiveTab("videos")}>동영상 (0/100)</button>
          </div>
          {activeTab === "listings" && savedCars.length ? <section class="saved-car-list" aria-live="polite">
            {savedCars.map((car) => (
              <article key={car.id} class="saved-car-row" role="link" tabindex={0} aria-label={`${car.title} 상세 보기`} onClick={() => { setActiveDetailCar(car); flow.push(detailScreen); }} onKeydown={(event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setActiveDetailCar(car); flow.push(detailScreen); } }}>
                <img class={`saved-car-photo${car.imageFit === "contain" ? " is-catalog" : ""}`} src={asset(car.image)} alt={`${car.title} ${car.trim}`} draggable={false} />
                <div class="saved-car-copy"><h2>{car.title}</h2><p>{car.trim} · {car.specs[0]} · {car.specs[3]}</p><strong>{car.price.replace(" ", "")}</strong></div>
                <button type="button" class="saved-like-button" aria-label={`${car.title} 저장 해제`} aria-pressed="true" onClick={(event: MouseEvent) => { event.stopPropagation(); toggleLiked(car.id); }}><HeartFilledIcon /></button>
              </article>
            ))}
          </section> : <div class="saved-empty"><HeartIcon /><strong>{activeTab === "listings" ? "저장한 매물이 없어요" : "저장한 동영상이 없어요"}</strong><p>{activeTab === "listings" ? "목록에서 하트를 눌러 관심 매물을 모아보세요." : "마음에 드는 매물 영상을 저장해보세요."}</p></div>}
        </main>
      </MobileScroll>
    );
  };
}, { name: "SavedListingsScreen" });
