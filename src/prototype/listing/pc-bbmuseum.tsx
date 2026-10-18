import { Fragment, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from "react";
import { BbmActionBar, BbmModal } from "../filters/bbm-filter-parts";
import { BBM_MAKER_ITEM, bbmSidebarItems, daangnFilterLabel, splitDaangnFilterOrder, type BbmFilterItem } from "../filters/bbm-filter-options";
import { BbmExpandPanel, BbmModalPanel, clearBbmItem } from "../filters/bbm-filter-panels";
import { PriceFinalSheet } from "../filters/bbm-price";
import type { BbmCheckKey, BbmFilterValues } from "../filters/bbm-filter-state";
import { CategoryBrandLogo } from "./bbm-brand-logos";
import { bbmItemValue } from "../filters/bbm-applied";
import { asset, displayListPlace, displaySpecs, sellerAvatar, sellerLabel, type Car } from "../data";
import { truckFormatCatalog, truckFormatImageFor, truckSubtypeImageFor, truckSubtypeSecondaryLabel } from "../data/truck-format-catalog";
import { BbmVehicleTypeDropdown } from "./bbm-vehicle-type-dropdown";

// 보배드림 개발 시안(bbmuseum) PC 매물리스트 1단계 이식(QF-048~050). 구조·수치·문구만 따르고 코드·이미지는 새로 만든다.

// OP-010: 노션 "베트남 초톳" 아이콘(public/assets/icons/bb/, currentColor). 매핑표는 docs/icon-map.md
type BbIconName = "search" | "mypage" | "heart" | "heart-filled" | "chat" | "notification" | "menu" | "chevron-down" | "filter" | "saved-search" | "view-list" | "location-pin" | "photo-count" | "chevron-left" | "check" | "circle-check" | "circle-check-off" | "circle-close";

function BbIcon({ name, size = 20, className = "" }: { name: BbIconName; size?: 16 | 20 | 24 | 18 | 12; className?: string }) {
  const style = { "--bb-icon": `url("${asset(`icons/bb/${name}.svg`)}")`, "--bb-size": `${size}px` } as CSSProperties;
  return <span className={`bb-icon ${className}`} style={style} aria-hidden="true" />;
}

function BbAssetIcon({ name, size }: { name: "circle-check" | "circle-check-off" | "circle-close"; size: 20 | 24 }) {
  return <img className="bb-asset-icon" src={asset(`icons/bb/${name}.svg`)} width={size} height={size} alt="" aria-hidden="true" draggable={false} />;
}

type BbGnbItem = { label: string; category?: string; action?: "home" | "community" | "more" | "bike-sell" | "bike-parts" | "truck-sell" | "truck-parts" };
type BbGnbSubItem = { label: string; category: string; detail?: string };

const bbGnbItems: readonly BbGnbItem[] = [
  { label: "전체 차량", category: "전체" },
  { label: "국산차", category: "국산차" },
  { label: "수입차", category: "수입차" },
  { label: "트럭 · 특장", category: "트럭 · 특장" },
  { label: "바이크", category: "바이크" },
  { label: "중고부품", category: "부품 · 용품" },
  { label: "커뮤니티", action: "community" },
  { label: "더보기", action: "more" },
];
const bbGnbMoreItems: readonly BbGnbItem[] = [
  { label: "캠핑카", category: "캠핑카" },
  { label: "자재운반장비", category: "자재운반장비" },
  { label: "올드카", category: "올드카" },
];
const bbBikeSiteGnbItems: readonly BbGnbItem[] = [
  { label: "중고 바이크", category: "바이크" },
  { label: "바이크 판매", category: "바이크", action: "bike-sell" },
  { label: "바이크 용품", category: "부품 · 용품", action: "bike-parts" },
  { label: "커뮤니티", action: "community" },
];
const bbTruckSiteGnbItems: readonly BbGnbItem[] = [
  { label: "중고 트럭", category: "트럭 · 특장" },
  { label: "트럭 판매", category: "트럭 · 특장", action: "truck-sell" },
  { label: "트럭 부품", category: "부품 · 용품", action: "truck-parts" },
  { label: "커뮤니티", action: "community" },
];
const bbUsedCarCategories = new Set([
  "중고차", "국산차", "수입차", "전기차", "리스/렌트차량", "서울오토갤러리", "도이치오토월드",
  "브랜드 인증중고차", "매매단지별 검색", "팔린매물", "장애인차", "슈퍼카", "럭셔리카", "레어카", "JDM",
  "튜닝·커스텀카", "셀럽카",
]);
const bbGnbSubmenus: Readonly<Record<string, readonly BbGnbSubItem[]>> = {
  "전체 차량": [
    { label: "전체차량", category: "전체" },
    { label: "중고차", category: "중고차" },
    { label: "트럭 · 특장", category: "트럭 · 특장" },
    { label: "바이크", category: "바이크" },
    { label: "캠핑카", category: "캠핑카" },
    { label: "중장비", category: "건설기계" },
    { label: "자재운반장비", category: "자재운반장비" },
    { label: "부품/용품", category: "부품 · 용품" },
  ],
  국산차: [{ label: "전체 국산차", category: "국산차" }],
  수입차: [
    { label: "전체 수입차", category: "수입차" },
  ],
  "트럭 · 특장": [
    { label: "전체 트럭", category: "트럭 · 특장" },
    ...truckFormatCatalog.slice(0, 7).map((item) => ({ label: item.name, category: "트럭 · 특장", detail: item.name })),
  ],
  바이크: [{ label: "바이크 전체", category: "바이크" }],
  중고부품: [{ label: "부품/용품 전체", category: "부품 · 용품" }],
  더보기: [
    { label: "캠핑카", category: "캠핑카" },
    { label: "자재운반장비", category: "자재운반장비" },
    { label: "올드카", category: "올드카" },
  ],
};
function bbActiveGnbItem(category: string) {
  if (category === "부품 · 용품" && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("bikeMenu") === "parts") return "바이크";
  return category === "전체" ? "전체 차량"
    : category === "국산차" ? "국산차"
      : category === "수입차" ? "수입차"
        : bbUsedCarCategories.has(category) ? "전체 차량"
          : category === "트럭 · 특장" ? "트럭 · 특장"
            : category === "건설기계" || category === "자재운반장비" ? "전체 차량"
              : category === "캠핑카" ? "더보기"
                : category === "부품 · 용품" ? "중고부품"
                  : category === "바이크" ? category : "더보기";
}
const bbSubnavCurrent = (item: BbGnbSubItem, category: string, categoryDetail: string | null) => {
  return item.category === category && (item.detail ? item.detail === categoryDetail : !categoryDetail);
};
export function bbStandaloneBikeSite() {
  if (typeof window === "undefined") return false;
  return /\/bike\/?$/.test(window.location.pathname);
}
/* 독립 보배드림 트럭 사이트(/truck/, 2026-10-18) */
export function bbStandaloneTruckSite() {
  if (typeof window === "undefined") return false;
  return /\/truck\/?$/.test(window.location.pathname);
}
export function BbSecondaryNav({ category, categoryDetail, onChooseCategory }: { category: string; categoryDetail: string | null; onChooseCategory: (category: string, detail?: string) => void }) {
  const activeItem = bbActiveGnbItem(category);
  const subnavItems = bbGnbSubmenus[activeItem] ?? bbGnbSubmenus["전체 차량"];
  /* ?lnb=d: 하위 메뉴가 하나뿐(바이크 전체 등)이면 칩 줄을 그리지 않는다 */
  if (bbLnbVariant() === "d" && subnavItems.length <= 1) return null;
  return (
    <div className="bbm-secondary-nav">
      <nav className={`bbm-snb${activeItem === "국산차" ? " is-all-visible" : ""}`} aria-label={`${activeItem} 하위 메뉴`}>
        {subnavItems.map((item) => {
          const current = bbSubnavCurrent(item, category, categoryDetail);
          return <button key={`${item.category}-${item.detail ?? item.label}`} type="button" className={current ? "is-current" : ""} aria-current={current ? "page" : undefined} onClick={() => onChooseCategory(item.category, item.detail)}>{item.label}</button>;
        })}
      </nav>
    </div>
  );
}

/* 2026-10-18 ?lnb=f: 카드 제목 자리를 하위 메뉴 큰 글자 탭으로 */
export function BbLnbTitleTabs({ category, categoryDetail, onChooseCategory }: { category: string; categoryDetail: string | null; onChooseCategory: (category: string, detail?: string) => void }) {
  const activeItem = bbActiveGnbItem(category);
  const items = bbGnbSubmenus[activeItem] ?? bbGnbSubmenus["전체 차량"];
  return (
    <nav className="bbm-lnb-title-tabs" aria-label={`${activeItem} 하위 메뉴`}>
      {items.map((item) => {
        const current = bbSubnavCurrent(item, category, categoryDetail);
        return <button key={`${item.category}-${item.detail ?? item.label}`} type="button" className={current ? "is-current" : ""} aria-current={current ? "page" : undefined} onClick={() => onChooseCategory(item.category, item.detail)}>{item.label}</button>;
      })}
    </nav>
  );
}

type BbBreadcrumbItem = { label: string; category: string; detail?: string; current?: boolean };

export function BbBreadcrumb({ category, categoryDetail, onChooseCategory }: { category: string; categoryDetail: string | null; onChooseCategory: (category: string, detail?: string) => void }) {
  const activeItem = bbActiveGnbItem(category);
  const subnavItems = bbGnbSubmenus[activeItem] ?? bbGnbSubmenus["전체 차량"];
  const currentSubnavItem = subnavItems.find((item) => bbSubnavCurrent(item, category, categoryDetail));
  const items: BbBreadcrumbItem[] = [{ label: "보배드림 차량", category: "전체" }];

  if (activeItem === "트럭 · 특장") {
    if (!categoryDetail) items.push({ label: "트럭 · 특장", category, current: true });
    else {
      items.push({ label: "트럭 · 특장", category: "트럭 · 특장" });
      items.push({ label: currentSubnavItem?.label ?? categoryDetail, category, detail: categoryDetail, current: true });
    }
  } else {
    const activeLabel = bbGnbItems.find((item) => item.label === activeItem)?.label;
    const currentLabel = currentSubnavItem?.label ?? categoryDetail ?? (category === "전체" ? "전체차량" : activeLabel ?? category);
    items.push({ label: currentLabel, category, detail: categoryDetail ?? undefined, current: true });
  }

  return (
    <nav className="bbm-ct-crumbs" aria-label="현재 위치">
      <ol>
        {items.map((item, index) => (
          <li key={`${item.category}-${item.detail ?? item.label}`}>
            {index > 0 ? <span className="bbm-ct-crumb-sep" aria-hidden="true">/</span> : null}
            {item.current
              ? <strong aria-current="page">{item.label}</strong>
              : <button type="button" onClick={() => onChooseCategory(item.category, item.detail)}>{item.label}</button>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* 2026-10-18 GNB·LNB: 기본=초톳형 브레드크럼. ?lnb=a/b/c는 이전 비교안 확인용. */
export type BbLnbVariant = "default" | "a" | "b" | "c" | "d" | "e" | "f";
export function bbLnbVariant(): BbLnbVariant {
  if (typeof window === "undefined") return "default";
  const value = new URLSearchParams(window.location.search).get("lnb");
  return value === "a" || value === "b" || value === "c" || value === "d" || value === "e" || value === "f" ? value : "default";
}
export function BbLnbTitleMenu({ title, category, categoryDetail, onChooseCategory }: { title: string; category: string; categoryDetail: string | null; onChooseCategory: (category: string, detail?: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const activeItem = bbActiveGnbItem(category);
  const items = bbGnbSubmenus[activeItem] ?? bbGnbSubmenus["전체 차량"];
  const current = items.find((item) => bbSubnavCurrent(item, category, categoryDetail));
  useEffect(() => {
    if (!open) return;
    const close = (event: globalThis.MouseEvent) => { if (!ref.current?.contains(event.target as Node)) setOpen(false); };
    const esc = (event: globalThis.KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div className="bbm-lnb-title" ref={ref}>
      <h1 className="bbm-ct-title bbm-summary">
        <button type="button" className="bbm-lnb-title-button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <span>{title}</span>{current && current.label !== title && !current.label.includes("전체") ? <span className="bbm-lnb-title-sub">{current.label}</span> : null}
          <BbIcon name="chevron-down" size={20} />
        </button>
      </h1>
      {open ? <div className="bbm-lnb-title-menu" role="menu">
        {items.map((item) => {
          const isCurrent = item === current;
          return <button key={`${item.category}-${item.detail ?? item.label}`} type="button" role="menuitem" className={isCurrent ? "is-current" : ""} aria-current={isCurrent ? "page" : undefined} onClick={() => { setOpen(false); onChooseCategory(item.category, item.detail); }}>{item.label}</button>;
        })}
      </div> : null}
    </div>
  );
}
// 2026-10-18 헤더 검색바 = 초톳(xe.chotot.com) 원본 아이콘 패스 그대로(돋보기)
const ctSearchPath = "M18.2798 11.4399C18.2797 7.66239 15.2175 4.6001 11.4399 4.6001C7.66244 4.60018 4.60018 7.66244 4.6001 11.4399C4.6001 15.2175 7.66239 18.2797 11.4399 18.2798C15.2176 18.2798 18.2798 15.2176 18.2798 11.4399ZM20.2798 11.4399C20.2798 13.5439 19.5432 15.4748 18.3159 16.9927L21.0952 19.6812L21.1655 19.7563C21.4922 20.1438 21.4786 20.7232 21.1187 21.0952C20.7586 21.4674 20.1798 21.5 19.7817 21.186L19.7046 21.1187L16.8901 18.396C15.3881 19.5745 13.4972 20.2798 11.4399 20.2798C6.55782 20.2797 2.6001 16.3221 2.6001 11.4399C2.60018 6.55787 6.55787 2.60018 11.4399 2.6001C16.3221 2.6001 20.2797 6.55782 20.2798 11.4399Z";
export function ChototSearchIcon({ size = 20 }: { size?: number }) {
  return <svg className="ct-icon" viewBox="0 0 24 24" width={size} height={size} fill="none" aria-hidden="true"><path d={ctSearchPath} fill="currentColor" /></svg>;
}
// QF-091: 헤더 아이콘·로고는 개발 시안 원본 파일(public/assets/bbm/)
/* 2026-10-17 PC 메인 검색바 시안: 기본=비엑람똣형 블루 CTA, ?pcsearch=chotot(초톳 xe.chotot.com) · ?pcsearch=kaidee(카이디 kaidee.com) 비교안 */
export type BbSearchVariant = "default" | "chotot" | "kaidee";
// 2026-10-18 탑메뉴 현재 메뉴 표시: 기본 = 알약 없는 700 #222 글자 + 3px #222 밑줄(네이버 증권식).
// 비교 보존: `&gnbactive=pill`(이전 검정 알약) · `&gnbactive=text`(밑줄 없는 글자만)
function bbGnbActiveMode(): "line" | "text" | "pill" {
  if (typeof window === "undefined") return "line";
  const v = new URLSearchParams(window.location.search).get("gnbactive");
  return v === "pill" || v === "text" ? v : "line";
}

// 2026-10-18 「초톳의 지역」 `&gnbsearch=pill`: 탑메뉴 `차량검색 ▾`만 초톳 지역 버튼(Toàn quốc ▾) 모양의 연회색 알약
function bbGnbSearchPill(): boolean {
  if (typeof window === "undefined") return false;
  const v = new URLSearchParams(window.location.search).get("gnbsearch");
  return v === "pill" || v === "pillblue";
}
// 2026-10-18 「초톳 알약이 연한 블루」 `&gnbsearch=pillblue`: 같은 알약을 보배드림 파랑 #306BD9의 10% 연한 파랑으로(비교용)
function bbGnbSearchPillBlue(): boolean {
  return typeof window !== "undefined" && new URLSearchParams(window.location.search).get("gnbsearch") === "pillblue";
}

export function bbSearchVariant(): BbSearchVariant {
  if (typeof window === "undefined") return "default";
  const value = new URLSearchParams(window.location.search).get("pcsearch");
  return value === "chotot" || value === "kaidee" ? value : "default";
}
type BbLogoLanguage = "en" | "ko";
function bbLogoLanguage(): BbLogoLanguage {
  if (typeof window === "undefined") return "ko";
  return new URLSearchParams(window.location.search).get("pclogo") === "en" ? "en" : "ko";
}
type BbAuthState = "guest" | "member";
function bbAuthState(): BbAuthState {
  if (typeof window === "undefined") return "guest";
  return new URLSearchParams(window.location.search).get("pcauth") === "member" ? "member" : "guest";
}
const bbmAsset = (name: string) => asset(`bbm/${name}.svg`);

function BbHeader({ category, onChooseCategory, onNotify, onOpenFavorites, searchSlot }: { category: string; onChooseCategory: (category: string, detail?: string) => void; onNotify: (message: string) => void; onOpenFavorites: () => void; searchSlot?: ReactNode }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [authState, setAuthState] = useState<BbAuthState>(bbAuthState);
  const moreRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const variant = bbSearchVariant();
  const logoLanguage = bbLogoLanguage();
  const isMember = authState === "member";
  const isBikeSite = bbStandaloneBikeSite();
  const isTruckSite = bbStandaloneTruckSite();
  const isStandaloneSite = isBikeSite || isTruckSite;
  const siteName = isTruckSite ? "트럭" : "바이크";
  const siteEmblem = isTruckSite ? "truck-emblem" : "bike-emblem";
  const menuParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const isBikeParts = category === "부품 · 용품" && menuParam?.get("bikeMenu") === "parts";
  const isTruckParts = category === "부품 · 용품" && menuParam?.get("truckMenu") === "parts";
  const activeItem = isBikeSite ? isBikeParts ? "바이크 용품" : "중고 바이크" : isTruckSite ? isTruckParts ? "트럭 부품" : "중고 트럭" : bbActiveGnbItem(category);
  const gnbItems = isBikeSite ? bbBikeSiteGnbItems : isTruckSite ? bbTruckSiteGnbItems : bbGnbItems;

  useEffect(() => {
    const lnb = bbLnbVariant();
    if (lnb === "default") return;
    document.documentElement.dataset.lnb = lnb;
    return () => { delete document.documentElement.dataset.lnb; };
  }, []);

  useEffect(() => {
    if (!moreOpen) return;
    const closeMore = (event: MouseEvent) => {
      if (!moreRef.current?.contains(event.target as Node)) setMoreOpen(false);
    };
    document.addEventListener("pointerdown", closeMore);
    return () => document.removeEventListener("pointerdown", closeMore);
  }, [moreOpen]);

  useEffect(() => {
    if (!accountOpen) return;
    const closeAccount = (event: MouseEvent) => {
      if (!accountRef.current?.contains(event.target as Node)) setAccountOpen(false);
    };
    document.addEventListener("pointerdown", closeAccount);
    return () => document.removeEventListener("pointerdown", closeAccount);
  }, [accountOpen]);

  const chooseMenu = (item: BbGnbItem) => {
    if (item.action === "more") {
      setMoreOpen((open) => !open);
      return;
    }
    setMoreOpen(false);
    if (item.action === "home") {
      onChooseCategory("전체");
      document.querySelector(".app-screen")?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (item.action === "community") {
      onNotify("커뮤니티는 정식 서비스에서 이용해 주세요.");
      return;
    }
    if (item.action === "bike-sell") {
      onChooseCategory("바이크", "__bike_sell__");
      return;
    }
    if (item.action === "bike-parts") {
      onChooseCategory("부품 · 용품", "__bike_parts__");
      return;
    }
    if (item.action === "truck-sell") {
      onNotify("트럭 판매는 정식 서비스에서 이용해 주세요.");
      return;
    }
    if (item.action === "truck-parts") {
      onChooseCategory("부품 · 용품", "__truck_parts__");
      return;
    }
    if (item.category) onChooseCategory(item.category);
  };
  const changeAuthState = (next: BbAuthState) => {
    setAuthState(next);
    setAccountOpen(false);
    const url = new URL(window.location.href);
    if (next === "member") url.searchParams.set("pcauth", "member");
    else url.searchParams.delete("pcauth");
    window.history.replaceState({}, "", url);
  };
  return (
    <header className={`bbm-header${isStandaloneSite ? " is-bike-site" : ""}${isTruckSite ? " is-truck-site" : ""}${variant === "default" ? "" : ` is-search-${variant}`}${bbGnbActiveMode() === "pill" ? "" : bbGnbActiveMode() === "text" ? " is-gnb-text" : " is-gnb-text is-gnb-line"}${bbGnbSearchPill() ? " is-gnb-searchpill" : ""}${bbGnbSearchPillBlue() ? " is-gnb-searchpill-blue" : ""}`} aria-label={isStandaloneSite ? `보배드림 ${siteName}` : "보배드림"}>
      <div className="bbm-header-inner">
        <div className="bbm-header-main">
          <button type="button" className="bbm-logo" aria-label={isStandaloneSite ? `보배드림 ${siteName} 처음으로` : "보배드림 처음으로"} onClick={() => { if (isBikeSite) onChooseCategory("바이크"); if (isTruckSite) onChooseCategory("트럭 · 특장"); document.querySelector(".app-screen")?.scrollTo({ top: 0 }); }}>
            <span className="bbm-logo-emblem" aria-hidden="true">
              <img src={bbmAsset(isBikeSite && document.documentElement.dataset.bikelogo === "mark" ? "bike-logo-mark" : isStandaloneSite ? siteEmblem : "header-logo")} alt="" draggable={false} />
            </span>
            <span className={`bbm-logo-word is-${logoLanguage}`} aria-hidden="true">{logoLanguage === "ko" ? "보배드림" : "BOBAEDREAM"}</span>
            {isStandaloneSite ? <span className="bbm-bike-site-badge" aria-hidden="true">{siteName}</span> : null}
          </button>
          {searchSlot ? <div className="bbm-header-search-slot">
            {variant === "chotot" ? <button type="button" className="bbm-region-pill" aria-label="지역 선택, 현재 전국" onClick={() => onNotify("지역 선택은 목록 위 지역 줄에서 이용해 주세요.")}><img src={bbmAsset("header-location-chotot-v01")} alt="" aria-hidden="true" /><span>전국</span><BbIcon name="chevron-down" size={16} /></button> : null}
            {searchSlot}
          </div> : null}
          {variant === "default" ? <div className="bbm-header-auth" aria-label="회원 메뉴">
            <button type="button" className="bbm-auth-icon" aria-label="관심 매물" onClick={onOpenFavorites}><BbIcon name="heart" size={24} /></button>
            {isMember
              ? <>
                <button type="button" className="bbm-auth-icon has-badge" aria-label="읽지 않은 알림 80개" onClick={() => onNotify("알림은 정식 서비스에서 이용해 주세요.")}>
                  <BbIcon name="notification" size={24} />
                  <span className="bbm-auth-badge" aria-hidden="true">80</span>
                </button>
                <button type="button" className="bbm-auth-pill is-contact" onClick={() => onNotify("채팅은 정식 서비스에서 이용해 주세요.")}><BbIcon name="chat" size={20} /><span>채팅</span></button>
                <button type="button" className="bbm-auth-pill is-management" onClick={() => onNotify("매물관리는 정식 서비스에서 이용해 주세요.")}>매물관리</button>
              </>
              : <button type="button" className="bbm-auth-pill is-login" onClick={() => { changeAuthState("member"); onNotify("로그인 상태 화면으로 전환했습니다."); }}>로그인/회원가입</button>}
            <button type="button" className="bbm-listing-button" onClick={() => isBikeSite ? onChooseCategory("바이크", "__bike_sell__") : onNotify(`${isTruckSite ? "트럭 판매" : "차량 판매하기"}는 정식 서비스에서 이용해 주세요.`)}>{isStandaloneSite ? `${siteName} 판매` : "차량 판매하기"}</button>
            <div className="bbm-account-wrap" ref={accountRef}>
              <button type="button" className={`bbm-account-button${isMember ? " is-member" : " is-guest"}`} aria-label={isMember ? "회원 계정 메뉴" : "로그인 및 계정 메뉴"} aria-haspopup="menu" aria-expanded={accountOpen} onClick={() => setAccountOpen((open) => !open)}>
                {isMember
                  ? <span className="bbm-account-avatar" aria-hidden="true"><img src={bbmAsset(isStandaloneSite ? siteEmblem : "header-logo")} alt="" /></span>
                  : <span className="bbm-account-avatar is-guest" aria-hidden="true"><BbIcon name="mypage" size={20} /></span>}
                <BbIcon name="chevron-down" size={20} className="bbm-account-chevron" />
              </button>
              {accountOpen ? <div className="bbm-account-menu" role="menu">
                {isMember
                  ? <button type="button" role="menuitem" onClick={() => { changeAuthState("guest"); onNotify("미로그인 상태 화면으로 전환했습니다."); }}>로그아웃</button>
                  : <button type="button" role="menuitem" onClick={() => { changeAuthState("member"); onNotify("로그인 상태 화면으로 전환했습니다."); }}>로그인</button>}
                {!isMember ? <button type="button" role="menuitem" onClick={() => { setAccountOpen(false); onNotify("회원가입은 정식 서비스에서 이용해 주세요."); }}>회원가입</button> : null}
                <button type="button" role="menuitem" onClick={() => { setAccountOpen(false); onNotify("고객센터는 정식 서비스에서 이용해 주세요."); }}>고객센터</button>
              </div> : null}
            </div>
          </div> : <div className={`bbm-header-actions is-${variant}`}>
            {variant === "chotot" ? <>
              <button type="button" className="bbm-act-icon" aria-label="찜" onClick={onOpenFavorites}><img src={bbmAsset("header-heart")} alt="" aria-hidden="true" /></button>
              <button type="button" className="bbm-act-icon" aria-label="알림" onClick={() => onNotify("알림은 정식 서비스에서 이용해 주세요.")}><img src={bbmAsset("header-notification")} alt="" aria-hidden="true" /></button>
              <button type="button" className="bbm-act-pill" onClick={() => onNotify("채팅은 정식 서비스에서 이용해 주세요.")}><img src={bbmAsset("header-chat")} alt="" aria-hidden="true" />채팅</button>
              <button type="button" className="bbm-act-pill" onClick={() => onNotify("로그인은 정식 서비스에서 이용해 주세요.")}>로그인</button>
              <button type="button" className="bbm-act-primary" onClick={() => onNotify("내차팔기는 정식 서비스에서 이용해 주세요.")}>내차팔기</button>
            </> : <>
              <button type="button" className="bbm-act-primary" onClick={() => onNotify("내차팔기는 정식 서비스에서 이용해 주세요.")}>내차팔기</button>
              <button type="button" className="bbm-act-circle is-tint" aria-label="채팅" onClick={() => onNotify("채팅은 정식 서비스에서 이용해 주세요.")}><img src={bbmAsset("header-chat")} alt="" aria-hidden="true" /></button>
              <button type="button" className="bbm-act-circle" aria-label="찜" onClick={onOpenFavorites}><img src={bbmAsset("header-heart")} alt="" aria-hidden="true" /></button>
              <button type="button" className="bbm-act-circle" aria-label="마이페이지" onClick={() => onNotify("로그인은 정식 서비스에서 이용해 주세요.")}><img src={bbmAsset("header-mypage")} alt="" aria-hidden="true" /></button>
            </>}
          </div>}
        </div>
        <div className="bbm-gnb-row">
          <nav className="bbm-gnb" aria-label="주 메뉴">
            {gnbItems.map((item) => {
              const itemClassName = `${item.label === activeItem ? "is-active" : ""}${item.action === "home" ? " is-home" : ""}`;
              const itemDisplayLabel = item.label;
              if (item.label === "전체 차량") return <BbmVehicleTypeDropdown key={item.label} active={item.label === activeItem} onChoose={(nextCategory) => onChooseCategory(nextCategory)} />;
              return <Fragment key={item.label}>
              {item.action === "more" ? <div className="bbm-gnb-more-wrap" ref={moreRef}>
                <button type="button" className={`bbm-gnb-more ${itemClassName}`.trim()} aria-current={item.label === activeItem ? "page" : undefined} aria-haspopup="menu" aria-expanded={moreOpen} onClick={() => chooseMenu(item)}>
                  <span>{item.label}</span><span className="bbm-gnb-more-count" aria-hidden="true">{bbGnbMoreItems.length}</span><BbIcon name="chevron-down" size={18} />
                </button>
                {moreOpen ? <div className="bbm-gnb-more-menu" role="menu">{bbGnbMoreItems.map((moreItem) => <button key={moreItem.label} type="button" role="menuitem" className={moreItem.category === category ? "is-current" : ""} onClick={() => chooseMenu(moreItem)}><span>{moreItem.label}</span></button>)}</div> : null}
              </div> : <button type="button" className={itemClassName} aria-current={item.label === activeItem ? "page" : undefined} onClick={() => chooseMenu(item)}>
                <span>{itemDisplayLabel}</span>
              </button>}
            </Fragment>})}
          </nav>
          <button type="button" className="bbm-gnb-notice" aria-label="공지사항, 새로운 보배드림 서비스 안내" onClick={() => onNotify("공지사항은 정식 서비스에서 이용해 주세요.")}>
            <strong>공지</strong><span className="bbm-gnb-notice-divider" aria-hidden="true" /><span className="bbm-gnb-notice-copy">새로운 보배드림 서비스 안내</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// 원본 좌측 필터 27개 항목. 안의 제조사 → 모델 → 등급 동작은 QF-067 유지
const bbMakerItem = BBM_MAKER_ITEM;
// 항목 순서: 원본(초톳·동처띠 PC 등 동결 모드) = 바디타입 → 차급 → 제조사 · 모델 → 연식 …
// QF-110 과쯔는 설정 배열 bbmFilterOrder(제조사 · 모델 맨 위, 바디타입·차급은 가격 아래)를 order 로 넘긴다. 열림 방식(펼침/412 모달)은 원본 수집 결과(bbm-filter-options.ts)
const passengerSidebarItems = bbmSidebarItems.filter((item) => !item.scope);
const bbFilterMenuOriginal = [passengerSidebarItems[0].label, passengerSidebarItems[1].label, bbMakerItem, ...passengerSidebarItems.slice(2).map((item) => item.label)];
const bbFilterItemByLabel = new Map(bbmSidebarItems.map((item) => [item.label, item]));

type CatalogRow = [label: string, count: number, maker?: string];
type BbMakerSection = { title: string; rows: CatalogRow[] };
type BbTruckFilterOption = { name: string; count: number };
type BbTruckSpecGroup = { label: string; options: BbTruckFilterOption[] };
export type BbTruckFilter = {
  format: string | null;
  subtype: string | null;
  spec: string | null;
  formats: BbTruckFilterOption[];
  subtypes: BbTruckFilterOption[];
  specGroups: BbTruckSpecGroup[];
  countForSelection: (format: string, subtype?: string | null) => number;
  onChooseFormat: (format: string) => void;
  onChooseSubtype: (subtype: string) => void;
  onChooseSpec: (spec: string) => void;
  onApplySelection: (format: string | null, subtype: string | null) => void;
  onClearFormat: () => void;
  onClearSubtype: () => void;
  onClearSpec: () => void;
};
// 원본 제조사 목록·매물 수(2026-09-24 기준). maker는 우리 시안 데이터의 제조사 이름(다르면 지정)
const bbCatalog: Array<{ title: string; rows: CatalogRow[] }> = [
  { title: "국산차", rows: [["현대", 2697], ["제네시스", 1503], ["기아", 2352], ["쉐보레(국산)", 288, "쉐보레"], ["GM대우", 69], ["르노코리아(삼성)", 302, "르노코리아"], ["KG모빌리티(쌍용)", 390, "KG모빌리티"], ["어울림모터스", 1], ["기타 국산차", 6]] },
  { title: "수입차 인기", rows: [["벤츠", 1973], ["포르쉐", 899], ["BMW", 841], ["페라리", 541], ["람보르기니", 331], ["롤스로이스", 312]] },
  { title: "수입차 이름순", rows: [["BMW", 841], ["BYD", 0], ["DS", 0], ["GMC", 78], ["닛산", 10], ["다이하쓰", 3], ["닷지", 75], ["동펑", 2], ["란치아", 0], ["람보르기니", 331], ["랜드로버", 303], ["렉서스", 61], ["로버", 1], ["로터스", 11], ["롤스로이스", 312], ["르노", 1], ["링컨", 36], ["마세라티", 118], ["마이바흐", 13], ["마쯔다", 5], ["맥라렌", 97], ["머큐리", 0], ["모건", 1], ["미니", 76], ["미쓰비시", 1], ["미쯔오카", 6], ["벤츠", 1973], ["벤틀리", 305], ["볼보", 45], ["부가티", 1], ["북기은상", 0], ["뷰익", 0], ["비이스만", 0], ["사브", 4], ["새턴", 0], ["선롱", 0], ["쉐보레", 76], ["스마트", 11], ["스바루", 3], ["스즈키", 20], ["스카니아", 0], ["스파이커", 0], ["시트로엥", 3], ["아우디", 221], ["알파로메오", 3], ["알핀", 2], ["애스턴마틴", 70], ["어큐라", 0], ["오스틴", 0], ["오펠", 0], ["올즈모빌", 0], ["웨스트필드", 0], ["이네오스", 1], ["이베코", 9], ["이스즈", 0], ["인피니티", 12], ["재규어", 68], ["지프", 95], ["캐딜락", 88], ["코닉세크", 0, "코닉세그"], ["크라이슬러", 9], ["테슬라", 59], ["토요타", 52], ["파가니", 0], ["페라리", 541], ["포드", 152], ["포르쉐", 899], ["포톤", 0], ["폭스바겐", 50], ["폰티악", 1], ["폴스타", 3], ["푸조", 5], ["피스커", 0], ["피아트", 19], ["허머", 20], ["혼다", 12], ["홀덴", 0], ["히노", 0], ["기타 수입차", 25]] },
];
const bbMakerLabel = (maker: string) => bbCatalog.flatMap((section) => section.rows).find(([name, , key]) => (key ?? name) === maker)?.[0] ?? maker;

function BbSwitch({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`bbm-switch${checked ? " is-on" : ""}`} onClick={onChange}><span /></button>;
}

// PC 좌측 필터 제조사 → 모델 → 세부모델 → 등급 드릴다운.
// 선택 상태는 목록 화면(퀵필터와 같은 원본)에서 받아서 읽고 쓴다.
type BbModelRow = { name: string; label: string; count: number | null };
type BbGradeGroup = { name: string | null; title: string | null; displayName?: string; years?: string; grades: Array<{ name: string; count: number }>; count?: number };
type BbGradeTreeNode = {
  id: string;
  name: string;
  count: number;
  grades: Array<{ id: string; name: string; count: number; subgrades: Array<{ id: string; name: string; count: number; token: string }> }>;
};
type BbMakerSelection = {
  maker: string | null;
  model: string | null;
  modelLabel: string | null;
  generation: string | null;
  generationLabel: string | null;
  generationYears?: string | null;
  grades: string[];
  gradeLevels?: string[];
  gradeGroups?: string[];
  modelsFor: (maker: string) => BbModelRow[];
  gradeGroupsFor: (maker: string, model: string) => BbGradeGroup[];
  gradeTreeFor?: (generation: string) => BbGradeTreeNode[];
  onChooseMaker: (maker: string) => void;
  onChooseModel: (model: string) => void;
  onToggleGrade: (generation: string | null, grade: string) => void;
  onToggleGrades?: (generation: string, grades: string[], checked: boolean) => void;
  onToggleGradeLevel?: (generation: string, id: string) => void;
  onToggleGradeGroup?: (generation: string, id: string) => void;
  onClearMaker: () => void;
  onClearModel: () => void;
  onClearGrades: () => void;
  // QF-097(과쯔 카탈로그): 트림이 없는 세부 모델도 한 줄 체크로 고른다. 없으면 기존처럼 트림 있는 묶음만
  onChooseGeneration?: (generation: string) => void;
};
type BbDrillView =
  | { stage: "maker" }
  | { stage: "model"; maker: string }
  | { stage: "generation"; maker: string; model: string }
  | { stage: "grade"; maker: string; model: string; generation: string };

const popularModelsByMaker: Record<string, string[]> = {
  현대: ["그랜저", "아반떼", "싼타페", "쏘나타", "팰리세이드"],
  제네시스: ["G80", "GV80", "GV70", "G70", "G90"],
  기아: ["카니발", "쏘렌토", "K5", "스포티지", "K8"],
  쉐보레: ["트랙스", "스파크", "말리부", "트레일블레이저", "콜로라도"],
  르노코리아: ["QM6", "XM3", "SM6", "SM5", "SM3"],
  KG모빌리티: ["토레스", "티볼리", "렉스턴", "코란도", "무쏘"],
  BMW: ["5시리즈", "3시리즈", "X5", "X3", "X4"],
  벤츠: ["E클래스", "S클래스", "C클래스", "GLC클래스", "GLE클래스"],
};

// 스크롤 목록의 아래 끝이 행 경계에 걸리면 빈 칸처럼 보인다(2026-10-19 「수입차도 적용해봐라」).
// 기준 높이(CSS max-height) 근처에서 가로지르는 행을 찾아 그 행이 정확히 절반 보이게 높이를 맞춘다.
// 묶음 제목 높이가 화면마다 달라도 같은 규칙이 되도록 실제 행 위치를 잰다. 트럭도 같은 규칙(2026-10-19 「우리 커스텀으로」).
const HALF_ROW_SELECTOR = ".bbm-catalog-row, .bbm-encar-selected-row, .bbm-truck-spec-list > button";
function useHalfRowFit(ref: { current: HTMLDivElement | null }, enabled: boolean, deps: unknown[]) {
  useLayoutEffect(() => {
    const box = ref.current;
    if (!enabled || !box) return;
    const fit = () => {
      box.style.maxHeight = "";
      const base = parseFloat(getComputedStyle(box).maxHeight);
      if (!Number.isFinite(base) || box.scrollHeight <= base) return;
      const top = box.getBoundingClientRect().top - box.scrollTop;
      const mids = [...box.querySelectorAll<HTMLElement>(HALF_ROW_SELECTOR)]
        .map((row) => row.getBoundingClientRect())
        .map((r) => r.top - top + r.height / 2)
        .filter((mid) => mid >= base - 24)
        .sort((a, b) => a - b);
      if (mids.length) box.style.maxHeight = `${Math.round(mids[0])}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);
}

function BbMakerGradeFilter({ selection, view, setView, brandLogos = false, brandLogoCategory, makerSections = bbCatalog, referenceStyle = false, showInventoryCounts = true, allowEmptyOptions = false }: { selection: BbMakerSelection; view: BbDrillView; setView: (view: BbDrillView) => void; brandLogos?: boolean; brandLogoCategory?: string; makerSections?: BbMakerSection[]; referenceStyle?: boolean; showInventoryCounts?: boolean; allowEmptyOptions?: boolean }) {
  const { maker, model, grades } = selection;
  const catalogRef = useRef<HTMLDivElement>(null);
  // 차란차 원본은 제조사 → 모델 → 세부모델 → 등급 화면이 바뀔 때마다
  // 같은 500px 목록 상자를 맨 위에서 다시 시작한다. 이전 단계의 scrollTop을
  // 유지하면 짧아진 다음 목록의 중간/끝으로 브라우저가 보정해 화면이 꼬인다.
  useLayoutEffect(() => {
    if (referenceStyle && catalogRef.current) catalogRef.current.scrollTop = 0;
  }, [referenceStyle, view]);
  useHalfRowFit(catalogRef, referenceStyle, [view]);
  const pathRows = [
    maker ? { key: "maker", label: bbMakerLabel(maker), onOpen: () => setView({ stage: "maker" }), onClear: selection.onClearMaker } : null,
    maker && model ? { key: "model", label: selection.modelLabel ?? model, onOpen: () => setView({ stage: "model", maker }), onClear: selection.onClearModel } : null,
    maker && model && selection.generation ? { key: "generation", label: selection.generationLabel ?? selection.generation, sublabel: selection.generationYears ?? null, onOpen: () => setView({ stage: "generation", maker, model }), onClear: selection.onClearGrades } : null,
  ].filter((row): row is NonNullable<typeof row> => Boolean(row));
  const count = (value: number | null | undefined) => !showInventoryCounts || value === null || value === undefined ? null : <em className={value === 0 ? "is-zero" : ""}>{value.toLocaleString("ko-KR")}</em>;
  const checkbox = (checked: boolean, mixed = false) => referenceStyle
    ? <BbAssetIcon name={checked || mixed ? "circle-check" : "circle-check-off"} size={24} />
    : checked ? <BbIcon name="check" size={16} /> : mixed ? <span className="bbm-checkbox-mixed" /> : null;
  const modelRows = view.stage === "model" ? selection.modelsFor(view.maker) : [];
  const popularNames = view.stage === "model" ? popularModelsByMaker[view.maker] ?? [] : [];
  const popularRows = referenceStyle ? [] : popularNames.map((name) => modelRows.find((row) => row.name === name || row.label === name)).filter((row): row is BbModelRow => Boolean(row));
  const compactReferenceYears = (years?: string | null) => years?.replace(/\d{2}(\d{2})/g, "$1년").replace("~현재", "~현재");
  const chooseModelRow = (makerName: string, row: BbModelRow) => {
    if (maker !== makerName || model !== row.name) selection.onChooseModel(row.name);
    setView({ stage: "generation", maker: makerName, model: row.name });
  };

  const selectionPath = pathRows.length ? <div className="bbm-selection-path" aria-label="선택한 제조사·모델·세부모델">
        {pathRows.map((row) => <div key={row.key} className="bbm-selection-row">
          <button type="button" className="bbm-selection-label" onClick={row.onOpen}><span>{row.label}</span>{"sublabel" in row && row.sublabel ? <small>{compactReferenceYears(row.sublabel)}</small> : null}</button>
          <button type="button" className="bbm-selection-clear" aria-label={`${row.label} 선택 해제`} onClick={row.onClear}><BbAssetIcon name="circle-close" size={20} /></button>
        </div>)}
      </div> : null;

  return (
    <div className={`bbm-maker-grade${referenceStyle ? " is-reference" : ""}`}>
      {!referenceStyle ? selectionPath : null}
      <div className="bbm-catalog" ref={catalogRef}>
        {referenceStyle ? selectionPath : null}
        {view.stage === "maker" ? makerSections.map((section) => (
          <div key={section.title} className="bbm-catalog-section">
            <p className="bbm-catalog-title">{section.title}</p>
            {section.rows.map(([name, rowCount, makerKey]) => {
              const key = makerKey ?? name;
              const selected = maker === key;
              return <button key={`${section.title}-${name}`} type="button" className={`bbm-catalog-row${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => { if (maker !== key) selection.onChooseMaker(key); setView({ stage: "model", maker: key }); }}>{brandLogos ? <span className="bbm-catalog-name"><CategoryBrandLogo category={brandLogoCategory} name={name} kind="list" initialFallback /><span>{name}</span></span> : <span>{name}</span>}{count(rowCount)}</button>;
            })}
          </div>
        )) : view.stage === "model" ? (
          <div className="bbm-catalog-section is-drill">
            {popularRows.length ? <div className="bbm-model-group"><p className="bbm-catalog-title">인기모델</p>{popularRows.map((row) => {
              const selected = maker === view.maker && model === row.name;
              return <button key={`popular-${row.name}`} type="button" className={`bbm-catalog-row${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => chooseModelRow(view.maker, row)}><span>{row.label}</span>{count(row.count)}</button>;
            })}</div> : null}
            {modelRows.length ? <div className="bbm-model-group"><p className="bbm-catalog-title">{referenceStyle ? "모델" : "전체"}</p>{modelRows.map((row) => {
              const selected = maker === view.maker && model === row.name;
              return <button key={row.name} type="button" className={`bbm-catalog-row${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => chooseModelRow(view.maker, row)}><span>{row.label}</span>{count(row.count)}</button>;
            })}</div> : <p className="bbm-catalog-empty">모델 정보 없음</p>}
          </div>
        ) : view.stage === "generation" ? (
          <div className="bbm-catalog-section is-drill">
            <p className="bbm-catalog-title">세부모델</p>
            {(() => {
              const groups = selection.gradeGroupsFor(view.maker, view.model).filter((group) => Boolean(group.name));
              if (!groups.length) return <p className="bbm-catalog-empty">세부모델 정보 없음</p>;
              return groups.map((group) => {
                const generationName = group.name!;
                return <button key={generationName} type="button" className={`bbm-catalog-row is-generation${selection.generation === generationName ? " is-selected" : ""}`} aria-pressed={selection.generation === generationName} onClick={() => { if (selection.generation !== generationName) selection.onChooseGeneration?.(generationName); setView({ stage: "grade", maker: view.maker, model: view.model, generation: generationName }); }}>
                  <span className="bbm-generation-copy"><span>{group.displayName ?? group.title ?? generationName}</span>{group.years ? <small>{referenceStyle ? compactReferenceYears(group.years) : group.years}</small> : null}</span>{count(group.count)}
                </button>;
              });
            })()}
          </div>
        ) : (
          <div className="bbm-catalog-section is-drill">
            <p className="bbm-catalog-title">등급</p>
            {(() => {
              const tree = selection.gradeTreeFor?.(view.generation) ?? [];
              if (tree.length) return <div className="bbm-grade-tree">{tree.map((fuel) => {
                const fuelTokens = fuel.grades.flatMap((grade) => grade.subgrades.map((subgrade) => subgrade.token));
                const fuelCheckedCount = fuelTokens.filter((token) => grades.includes(token)).length;
                const independentFuelSelection = Boolean(selection.gradeLevels && selection.onToggleGradeLevel);
                const fuelChecked = independentFuelSelection ? selection.gradeLevels!.includes(fuel.id) : fuelCheckedCount > 0 && fuelCheckedCount === fuelTokens.length;
                const fuelMixed = independentFuelSelection ? false : fuelCheckedCount > 0 && !fuelChecked;
                return <div key={fuel.id} className="bbm-grade-branch">
                  <button type="button" role="checkbox" aria-checked={fuelMixed ? "mixed" : fuelChecked} className={`bbm-grade-row is-level-0${fuelChecked || fuelMixed ? " is-checked" : ""}${fuelMixed ? " is-mixed" : ""}`} onClick={() => independentFuelSelection ? selection.onToggleGradeLevel?.(view.generation, fuel.id) : selection.onToggleGrades?.(view.generation, fuelTokens, !fuelChecked)}>
                    <span className="bbm-checkbox" aria-hidden="true">{checkbox(fuelChecked, fuelMixed)}</span>
                    <span className="bbm-grade-name">{fuel.name}</span>{count(fuel.count)}
                  </button>
                  {fuel.grades.map((grade) => {
                    const gradeTokens = grade.subgrades.map((subgrade) => subgrade.token);
                    const gradeCheckedCount = gradeTokens.filter((token) => grades.includes(token)).length;
                    const independentGradeSelection = Boolean(selection.gradeGroups && selection.onToggleGradeGroup);
                    const gradeChecked = independentGradeSelection ? selection.gradeGroups!.includes(grade.id) : gradeCheckedCount > 0 && gradeCheckedCount === gradeTokens.length;
                    const gradeMixed = independentGradeSelection ? false : gradeCheckedCount > 0 && !gradeChecked;
                    return <div key={grade.id} className="bbm-grade-branch is-level-1">
                      <button type="button" role="checkbox" aria-checked={gradeMixed ? "mixed" : gradeChecked} className={`bbm-grade-row is-level-1${gradeChecked || gradeMixed ? " is-checked" : ""}${gradeMixed ? " is-mixed" : ""}`} onClick={() => independentGradeSelection ? selection.onToggleGradeGroup?.(view.generation, grade.id) : selection.onToggleGrades?.(view.generation, gradeTokens, !gradeChecked)}>
                        <span className="bbm-tree-elbow" aria-hidden="true" />
                        <span className="bbm-checkbox" aria-hidden="true">{checkbox(gradeChecked, gradeMixed)}</span>
                        <span className="bbm-grade-name">{grade.name}</span>{count(grade.count)}
                      </button>
                      {grade.subgrades.map((subgrade) => {
                        const checked = grades.includes(subgrade.token);
                        return <button key={subgrade.id} type="button" role="checkbox" aria-checked={checked} className={`bbm-grade-row is-level-2${checked ? " is-checked" : ""}`} onClick={() => selection.onToggleGrade(view.generation, subgrade.token)}>
                          <span className="bbm-tree-elbow" aria-hidden="true" />
                          <span className="bbm-checkbox" aria-hidden="true">{checkbox(checked)}</span>
                          <span className="bbm-grade-name">{subgrade.name}</span>{count(subgrade.count)}
                        </button>;
                      })}
                    </div>;
                  })}
                </div>;
              })}</div>;
              const group = selection.gradeGroupsFor(view.maker, view.model).find((item) => item.name === view.generation);
              if (!group?.grades.length) return <p className="bbm-catalog-empty">등급 정보 없음</p>;
              return group.grades.map((grade) => {
                const checked = model === view.model && selection.generation === view.generation && grades.includes(grade.name);
                return <button key={`${view.generation}-${grade.name}`} type="button" role="checkbox" aria-checked={checked} disabled={!allowEmptyOptions && grade.count === 0} className={`bbm-grade-row${checked ? " is-checked" : ""}`} onClick={() => selection.onToggleGrade(view.generation, grade.name)}>
                  <span className="bbm-checkbox" aria-hidden="true">{checkbox(checked)}</span>
                  <span className="bbm-grade-name">{grade.name}</span>
                  {count(grade.count)}
                </button>;
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

type BbTruckView = "format" | "subtype" | "spec" | "complete";

const inlineTruckPayloadSubtypes = new Set(["경형", "소형"]);

function BbTruckOptionLabel({ name, image, secondary }: { name: string; image: string | null; secondary?: string | null }) {
  return <span className="bbm-truck-option">{image ? <span className="bbm-truck-option-image"><img src={asset(image)} alt="" draggable={false} /></span> : null}<span className="bbm-truck-option-name">{name}{secondary ? <small>{secondary}</small> : null}</span></span>;
}

export function BbTruckFormatFilter({ value, showImages = true, referenceStyle = false }: { value: BbTruckFilter; showImages?: boolean; referenceStyle?: boolean }) {
  const stageFor = (): BbTruckView => !value.format
    ? "format"
    : !value.subtype
      ? "subtype"
      : referenceStyle
        ? value.specGroups.length ? "spec" : "complete"
        : inlineTruckPayloadSubtypes.has(value.subtype)
          ? "subtype"
          : value.specGroups.length ? "spec" : "subtype";
  const [view, setView] = useState<BbTruckView>(stageFor);
  const truckCatalogRef = useRef<HTMLDivElement>(null);
  useHalfRowFit(truckCatalogRef, referenceStyle, [view, value.format, value.subtype, value.spec]);
  useEffect(() => { setView(stageFor()); }, [value.format, value.subtype, value.spec, value.specGroups.length]);
  const count = (rowCount: number) => <em className={rowCount === 0 ? "is-zero" : ""}>{rowCount.toLocaleString("ko-KR")}</em>;
  const pathChips = [
    value.format ? { key: "format", label: value.format, clear: value.onClearFormat } : null,
    value.subtype ? { key: "subtype", label: value.subtype, clear: value.onClearSubtype } : null,
    value.spec ? { key: "spec", label: value.spec, clear: value.onClearSpec } : null,
  ].filter((chip): chip is NonNullable<typeof chip> => Boolean(chip));

  // 엔카 화물·특장 PC 좌측 필터(2026-10-18 실동작 대조):
  // 형식 → 세부형식 → 적재용량을 한 단계씩 전환한다. 선택 부모는 × 행으로 남기고,
  // 적재용량은 칩이 아니라 한 줄 체크 행으로 표시한다. 모바일용 2줄 차급 설명은 섞지 않는다.
  if (referenceStyle) {
    return (
      <div className="bbm-maker-grade bbm-truck-format is-reference is-encar" aria-label="형식과 적재용량 선택">
        <div className="bbm-catalog" ref={truckCatalogRef}>
          {view === "format" ? <div className="bbm-catalog-section">
            <p className="bbm-catalog-title">형식</p>
            {value.formats.map((option) => <button key={option.name} type="button" className="bbm-catalog-row" aria-pressed={false} onClick={() => { value.onChooseFormat(option.name); setView("subtype"); }}><BbTruckOptionLabel name={option.name} image={null} />{count(option.count)}</button>)}
          </div> : <div className="bbm-catalog-section is-drill">
            <button type="button" className="bbm-encar-selected-row" aria-label={`${value.format} 선택 해제`} onClick={value.onClearFormat}>
              <span>{value.format}</span><span className="bbm-encar-selected-x" aria-hidden="true">×</span>
            </button>
            {view === "subtype" ? <>
              <p className="bbm-catalog-title">세부형식</p>
              {value.subtypes.map((option) => <button key={option.name} type="button" className={`bbm-catalog-row${value.subtype === option.name ? " is-selected" : ""}`} aria-pressed={value.subtype === option.name} onClick={() => { value.onChooseSubtype(option.name); setView("complete"); }}>
                <BbTruckOptionLabel name={option.name} image={null} />
                {count(option.count)}
              </button>)}
            </> : <>
              <button type="button" className="bbm-encar-selected-row is-child" aria-label={`${value.subtype} 선택 해제`} onClick={value.onClearSubtype}>
                <span>{value.subtype}</span><span className="bbm-encar-selected-x" aria-hidden="true">×</span>
              </button>
              {value.specGroups.map((group) => <div key={group.label} className="bbm-grade-group bbm-truck-spec-group is-encar-list">
                <p className="bbm-catalog-title">{group.label.replace(/\s*\([^)]*\)\s*$/, "")}</p>
                <div className="bbm-truck-spec-list">{group.options.map((option) => {
                  const selected = value.spec === option.name;
                  return <button key={`${group.label}-${option.name}`} type="button" role="checkbox" aria-checked={selected} disabled={option.count === 0} className={selected ? "is-selected" : ""} onClick={() => value.onChooseSpec(option.name)}>
                    <span className="bbm-encar-checkbox" aria-hidden="true">{selected ? "✓" : ""}</span><span className="bbm-truck-spec-name">{option.name}</span>{count(option.count)}
                  </button>;
                })}</div>
              </div>)}
            </>}
          </div>}
        </div>
      </div>
    );
  }

  return (
    <div className="bbm-maker-grade bbm-truck-format" aria-label="형식과 적재용량 선택">
      {pathChips.length ? <div className="bbm-path-chips" aria-label="선택한 형식과 적재용량">
        {pathChips.map((chip) => <button key={chip.key} type="button" className="bbm-path-chip" aria-label={`${chip.label} 선택 해제`} onClick={chip.clear}><span>{chip.label}</span><span className="bbm-path-chip-x" aria-hidden="true">×</span></button>)}
      </div> : null}
      <div className="bbm-catalog">
        {view === "format" ? <div className="bbm-catalog-section">
          <p className="bbm-catalog-title">형식</p>
          {value.formats.map((option) => { const image = showImages ? truckFormatImageFor(option.name) : null; return <button key={option.name} type="button" className={`bbm-catalog-row${value.format === option.name ? " is-selected" : ""}${image ? " has-truck-image" : ""}`} aria-pressed={value.format === option.name} onClick={() => { value.onChooseFormat(option.name); setView("subtype"); }}><BbTruckOptionLabel name={option.name} image={image} />{count(option.count)}</button>; })}
        </div> : view === "subtype" ? <div className="bbm-catalog-section is-drill">
          <button type="button" className="bbm-catalog-back" onClick={() => setView("format")}><BbIcon name="chevron-left" size={20} />{value.format}</button>
          <p className="bbm-catalog-title">세부형식</p>
          {value.subtypes.map((option) => {
            const image = showImages ? truckSubtypeImageFor(value.format, option.name) : null;
            const inlinePayload = inlineTruckPayloadSubtypes.has(option.name);
            const expanded = inlinePayload && value.subtype === option.name;
            return <Fragment key={option.name}>
              <button type="button" className={`bbm-catalog-row${value.subtype === option.name ? " is-selected" : ""}${image ? " has-truck-image" : ""}`} aria-pressed={value.subtype === option.name} aria-expanded={inlinePayload ? expanded : undefined} onClick={() => { value.onChooseSubtype(option.name); setView(inlinePayload ? "subtype" : "spec"); }}>
                <BbTruckOptionLabel name={option.name} image={image} secondary={truckSubtypeSecondaryLabel(value.format, option.name)} />
                <span className="bbm-truck-option-tail">{count(option.count)}{inlinePayload ? <BbIcon name="chevron-down" size={16} className={expanded ? "is-expanded" : ""} /> : null}</span>
              </button>
              {expanded ? <div className="bbm-truck-inline-payload" aria-label={`${option.name} 적재중량`}>
                <p className="bbm-catalog-title">적재중량</p>
                {value.specGroups.map((group) => <div key={group.label} className="bbm-truck-spec-chips">
                  {group.options.map((specOption) => <button key={`${group.label}-${specOption.name}`} type="button" className={value.spec === specOption.name ? "is-selected" : ""} aria-pressed={value.spec === specOption.name} onClick={() => value.onChooseSpec(specOption.name)}><span>{specOption.name}</span>{count(specOption.count)}</button>)}
                </div>)}
              </div> : null}
            </Fragment>;
          })}
        </div> : <div className="bbm-catalog-section is-drill">
          <button type="button" className="bbm-catalog-back" onClick={() => setView("subtype")}><BbIcon name="chevron-left" size={20} />{value.subtype}</button>
          {value.specGroups.map((group) => <div key={group.label} className="bbm-grade-group bbm-truck-spec-group">
            <p className="bbm-catalog-title">{group.label}</p>
            <div className="bbm-truck-spec-chips">{group.options.map((option) => <button key={`${group.label}-${option.name}`} type="button" className={value.spec === option.name ? "is-selected" : ""} aria-pressed={value.spec === option.name} onClick={() => value.onChooseSpec(option.name)}><span>{option.name}</span>{count(option.count)}</button>)}</div>
          </div>)}
        </div>}
      </div>
    </div>
  );
}

// resetSignal: 값이 바뀔 때마다 "초기화" 확인 창을 연다(QF-093 왼쪽 펼침판 아래 [초기화] 버튼용)
// brandLogos: 과쯔 모드만 제조사 행 앞에 로고 24×24(QF-096). 초톳·동처띠 PC 는 그대로
const charanchaFilterOrder = [bbMakerItem, "차급", "바디타입", "연식", "주행거리", "가격", "옵션", "외부색상", "연료", "변속기", "지역", "매매단지", "판매자 유형", "판매방식"];
const charanchaFilterLabels: Record<string, string> = { 차급: "차종", 바디타입: "바디타입", 외부색상: "색상", "판매자 유형": "판매자유형", 판매방식: "판매 방식" };

function BbFilterSidebar({ leadingFilters, selection, appliedCount, historyCount, onReset, onNotify, bbm, onBbmChange, countWithBbm, countOf, resetSignal = 0, brandLogos = false, brandLogoCategory, makerSections = bbCatalog, order = bbFilterMenuOriginal, mileageFinal = false, priceFinal = false, pricePresets, truckFilter, collapsible = false, referenceMakerFlow = false, makerOpenByDefault = false, singleOpen = false, showMakerCounts = true, allowEmptyMakerOptions = false, makerLabel }: { leadingFilters?: ReactNode; mileageFinal?: boolean; priceFinal?: boolean; pricePresets?: string[]; order?: string[]; selection: BbMakerSelection; appliedCount: number; historyCount?: number; onReset: () => void; onNotify: (message: string) => void; bbm: BbmFilterValues; onBbmChange: (next: BbmFilterValues) => void; countWithBbm: (next: BbmFilterValues) => number; countOf?: (key: BbmCheckKey, option: string) => number | null; resetSignal?: number; brandLogos?: boolean; brandLogoCategory?: string; makerSections?: BbMakerSection[]; truckFilter?: BbTruckFilter; collapsible?: boolean; referenceMakerFlow?: boolean; makerOpenByDefault?: boolean; singleOpen?: boolean; showMakerCounts?: boolean; allowEmptyMakerOptions?: boolean; makerLabel?: string }) {
  // 모달형 항목: 사이드바 대신 412 모달을 연다. 원본 실측(2026-09-24): 모달 안 선택은 초안이고 [확인 N대]를 눌러야 조건이 걸린다(닫기 X는 버림)
  const [modalItem, setModalItem] = useState<BbmFilterItem | null>(null);
  const [priceOpen, setPriceOpen] = useState(false);
  const [draft, setDraft] = useState<BbmFilterValues>(bbm);
  const openModal = (item: BbmFilterItem) => { setDraft(bbm); setModalItem(item); };
  // 원본: 머리 "초기화"는 확인 창(필터 초기화 / 선택한 필터를 초기화하시겠습니까? / [취소][초기화])을 거친다
  const [confirmReset, setConfirmReset] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [moreFiltersOpen, setMoreFiltersOpen] = useState(false);
  const [availableOnly, setAvailableOnly] = useState(false);
  const resetSignalRef = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal === resetSignalRef.current) return;
    resetSignalRef.current = resetSignal;
    setConfirmReset(true);
  }, [resetSignal]);
  const truckFilterLabel = "형식/적재용량";
  const hasTruckFilter = Boolean(truckFilter);
  const [openItems, setOpenItems] = useState<string[]>(() => truckFilter ? [truckFilterLabel, ...(makerOpenByDefault ? [bbMakerItem] : [])] : makerOpenByDefault ? [bbMakerItem] : []);
  useEffect(() => {
    if (!makerOpenByDefault) return;
    setOpenItems((current) => current.includes(bbMakerItem) ? current : singleOpen ? [bbMakerItem] : [...current, bbMakerItem]);
  }, [makerOpenByDefault, singleOpen]);
  const [keepSearch, setKeepSearch] = useState(false);
  const { maker, model } = selection;
  const [view, setView] = useState<BbDrillView>(() => maker && model && selection.generation
    ? { stage: "grade", maker, model, generation: selection.generation }
    : maker && model
      ? { stage: "generation", maker, model }
      : maker
        ? { stage: "model", maker }
        : { stage: "maker" });
  // 퀵필터·상단 칩에서 바뀐 선택을 사이드바 단계에 반영(같은 단계로 열기)
  useEffect(() => {
    setView(maker && model && selection.generation
      ? { stage: "grade", maker, model, generation: selection.generation }
      : maker && model
        ? { stage: "generation", maker, model }
        : maker
          ? { stage: "model", maker }
          : { stage: "maker" });
  }, [maker, model, selection.generation]);
  const toggle = (label: string) => setOpenItems((current) => current.includes(label) ? current.filter((item) => item !== label) : singleOpen && !hasTruckFilter ? [label] : [...current, label]);
  const collapsedPath = [
    maker ? bbMakerLabel(maker) : null,
    maker && model ? selection.modelLabel ?? model : null,
    selection.grades.length ? `등급 ${selection.grades.length}개` : selection.generation ? selection.generationLabel ?? selection.generation : null,
  ].filter(Boolean).join(" › ");
  // 차란차 PC 좌측 필터(2026-10-18 「레퍼런스 하나 정해서 그대로」): 차란차 노출 순서를 그대로 쓰고 나머지는 「필터 더보기」 아래로
  const charancha = referenceMakerFlow;
  // 바이크는 라이트바겐 기준 항목을 전부 좌측에 노출하고, 승용만 차란차 핵심 항목/더보기 구성을 쓴다.
  const charanchaPrimary = charancha ? brandLogoCategory === "바이크" || hasTruckFilter ? order : charanchaFilterOrder.filter((label) => order.includes(label)) : [];
  const { primary: primaryFilterOrder, secondary: secondaryFilterOrder } = hasTruckFilter
    ? { primary: order, secondary: [] }
    : charancha
      ? { primary: charanchaPrimary, secondary: order.filter((label) => !charanchaPrimary.includes(label)) }
      : splitDaangnFilterOrder(order);
  // 필터 더보기 안에 숨은 항목 중 적용된 조건 수(검정 당구공 배지, 차란차 모드만)
  const hiddenAppliedCount = charancha ? secondaryFilterOrder.filter((label) => Boolean(bbmItemValue(label, bbm))).length : 0;
  const renderFilterItem = (label: string) => {
    const open = openItems.includes(label);
    const isMaker = label === bbMakerItem;
    const filterItem = bbFilterItemByLabel.get(label);
    const displayLabel = truckFilter && isMaker
      ? "제조사/모델/등급"
      : isMaker && makerLabel
        ? makerLabel
      : truckFilter && label === "차량번호 / 판매자"
        ? "차량번호/판매자 이름"
        : charancha && charanchaFilterLabels[label]
          ? charanchaFilterLabels[label]
          : daangnFilterLabel(label);
    const applied = isMaker ? Boolean(maker) : Boolean(bbmItemValue(label, bbm));
    return (
      <Fragment key={label}>
        <section className={`bbm-filter-item${open ? " is-open" : ""}${isMaker ? " is-maker-grade" : ""}${applied ? " is-applied" : ""}`}>
          <button type="button" className="bbm-filter-toggle" aria-expanded={filterItem?.mode === "modal" || priceFinal && label === "가격" ? undefined : open} aria-haspopup={filterItem?.mode === "modal" || priceFinal && label === "가격" ? "dialog" : undefined} onClick={() => { if (priceFinal && label === "가격") setPriceOpen(true); else if (filterItem?.mode === "modal") openModal(filterItem); else toggle(label); }}>
            <span className="bbm-filter-label"><span className="bbm-filter-label-text">{label === "전기차 주행 가능 거리" ? <img className="bbm-filter-label-icon" src={bbmAsset("filter-ev-range")} alt="" aria-hidden="true" /> : null}{displayLabel}</span>{isMaker && !open && collapsedPath ? <small className="bbm-filter-path">{collapsedPath}</small> : null}</span>
            <img className="bbm-filter-chevron" src={bbmAsset("filter-chevron")} alt="" aria-hidden="true" />
          </button>
          {isMaker && maker && !referenceMakerFlow ? <button type="button" className="bbm-filter-item-reset" onClick={selection.onClearMaker}>초기화</button> : null}
          {open ? (isMaker ? <BbMakerGradeFilter selection={selection} view={view} setView={setView} brandLogos={brandLogos} brandLogoCategory={brandLogoCategory} makerSections={makerSections} referenceStyle={referenceMakerFlow} showInventoryCounts={showMakerCounts} allowEmptyOptions={allowEmptyMakerOptions} /> : <BbmExpandPanel label={label} value={bbm} onChange={onBbmChange} countOf={countOf} mileageFinal={mileageFinal} />) : null}
        </section>
      </Fragment>
    );
  };
  const renderTruckFormat = () => {
    if (!truckFilter) return null;
    const open = openItems.includes(truckFilterLabel);
    const applied = Boolean(truckFilter.format || truckFilter.subtype || truckFilter.spec);
    const path = [truckFilter.format, truckFilter.subtype, truckFilter.spec].filter(Boolean).join(" › ");
    return <section className={`bbm-filter-item is-truck-format${open ? " is-open" : ""}${applied ? " is-applied" : ""}`}>
      <button type="button" className="bbm-filter-toggle" aria-expanded={open} onClick={() => toggle(truckFilterLabel)}>
        <span className="bbm-filter-label"><span className="bbm-filter-label-text">형식/적재용량</span>{path && !referenceMakerFlow ? <small className="bbm-filter-path">{path}</small> : null}</span>
        <img className="bbm-filter-chevron" src={bbmAsset("filter-chevron")} alt="" aria-hidden="true" />
      </button>
      {truckFilter.format ? <button type="button" className="bbm-filter-item-reset" onClick={truckFilter.onClearFormat}>초기화</button> : null}
      {/* 엔카 화물·특장 필터처럼 왼쪽 탐색은 이미지 없이 형식명과 매물 수만 읽게 한다. */}
      {open ? <BbTruckFormatFilter value={truckFilter} showImages={false} referenceStyle={referenceMakerFlow} /> : null}
    </section>;
  };
  if (collapsible && sidebarCollapsed) {
    return <aside className="bbm-filter is-collapsed" aria-label="필터 접힘">
      <button type="button" className="bbm-filter-expand" aria-label="좌측 필터 펼치기" onClick={() => setSidebarCollapsed(false)}><span aria-hidden="true">›</span><strong>필터</strong></button>
    </aside>;
  }
  return (
    <aside className={`bbm-filter${charancha ? " is-charancha" : ""}${hasTruckFilter ? " is-truck-reference" : ""}`} aria-label="필터">
      {charancha ? <div className="bbm-filter-summary is-charancha">
        <h4 className="bbm-cha-title">필터</h4>
        <div className="bbm-cha-actions">
          <button type="button" onClick={() => onNotify(bbm.history ? "최근 필터 기록은 정식 서비스에서 이용해 주세요." : "최근 필터 기록이 없습니다.")}>최근 필터 기록</button>
          <i aria-hidden="true" />
          <button type="button" onClick={() => setConfirmReset(true)}><span className="bbm-cha-reset-icon" aria-hidden="true">↺</span>초기화</button>
        </div>
      </div> : <div className="bbm-filter-summary">
        <div className="bbm-filter-summary-top">
          {/* QF-074: 제목 오른쪽 적용 필터 개수 배지(0개면 숨김) + 오른쪽 끝 모두 지우기 */}
          <div className="bbm-filter-title"><strong>필터</strong>{appliedCount > 0 ? <span className="bbm-filter-count" aria-label={`적용된 필터 ${appliedCount}개`}>{appliedCount}</span> : null}</div>
          <div className="bbm-filter-summary-actions">
            <button type="button" className="bbm-filter-reset" onClick={() => setConfirmReset(true)}>초기화</button>
            {collapsible ? <button type="button" className="bbm-filter-collapse" onClick={() => setSidebarCollapsed(true)}>숨기기</button> : null}
          </div>
        </div>
        <div className="bbm-filter-summary-tools">
          <label className="bbm-filter-keep"><BbSwitch checked={keepSearch} label="검색조건 유지" onChange={() => setKeepSearch((value) => !value)} /><span>검색조건 유지</span></label>
          <button type="button" className="bbm-filter-history" onClick={() => onNotify(bbm.history ? "최근 검색 기록은 정식 서비스에서 이용해 주세요." : "최근 검색 기록이 없습니다.")}>최근검색기록 <b>{historyCount ?? bbm.history ?? 0}</b></button>
        </div>
      </div>}
      <div className="bbm-filter-menu">
        {charancha ? null : <div className="bbm-filter-status">
          <span>상태</span>
          <label><BbSwitch checked={availableOnly} label="거래 가능만 보기" onChange={() => setAvailableOnly((value) => !value)} /><strong>거래 가능만 보기</strong></label>
        </div>}
        {leadingFilters}
        {renderTruckFormat()}
        {primaryFilterOrder.map(renderFilterItem)}
        {!secondaryFilterOrder.length ? null : <button type="button" className="bbm-filter-more-toggle" aria-expanded={moreFiltersOpen} onClick={() => setMoreFiltersOpen((value) => !value)}><span>{moreFiltersOpen ? "필터 접기" : "필터 더보기"}{hiddenAppliedCount ? <b className="bbm-cha-more-count" aria-label={`적용된 조건 ${hiddenAppliedCount}개`}>{hiddenAppliedCount}</b> : null}</span><i aria-hidden="true" /></button>}
        {moreFiltersOpen ? <>
          {truckFilter ? <div className="bbm-filter-group-title">추가 필터</div> : null}
          {secondaryFilterOrder.map(renderFilterItem)}
          {primaryFilterOrder.includes(bbMakerItem) && brandLogoCategory !== "바이크" ? <div className="bbm-filter-action"><button type="button" className="bbmf-exclude" onClick={() => onNotify("제조사·모델 제외하기는 정식 서비스에서 이용해 주세요.")}><i className="bbmf-circle-icon is-minus" aria-hidden="true" />제조사·모델 제외하기</button></div> : null}
        </> : null}
      </div>
      {modalItem ? (
        <BbmModal
          title={modalItem.modalTitle ?? modalItem.displayLabel ?? modalItem.label}
          wide={modalItem.label === "옵션"}
          onClose={() => setModalItem(null)}
          footer={modalItem.label === "광고기간" ? undefined : modalItem.label === "옵션"
            ? <BbmActionBar count={0} resetLabel="취소" confirmLabel="선택완료" onReset={() => setModalItem(null)} onConfirm={() => { onBbmChange(draft); setModalItem(null); }} />
            : <BbmActionBar count={countWithBbm(draft)} onReset={() => setDraft(clearBbmItem(modalItem, draft))} onConfirm={() => { onBbmChange(draft); setModalItem(null); }} />}
        >
          {/* 광고기간은 원본처럼 아래 버튼 없이 고르면 바로 반영하고 닫는다 */}
          <BbmModalPanel item={modalItem} value={draft} countOf={countOf} onChange={modalItem.label === "광고기간" ? (next) => { onBbmChange(next); setModalItem(null); } : setDraft} />
        </BbmModal>
      ) : null}
      {priceOpen ? <PriceFinalSheet variant="modal" value={bbm} countOf={countWithBbm} onApply={onBbmChange} onClose={() => setPriceOpen(false)} presets={pricePresets} hideTabs={Boolean(pricePresets)} /> : null}
      {confirmReset ? (
        <BbmModal title="필터 초기화" onClose={() => setConfirmReset(false)} footer={<BbmActionBar count={0} resetLabel="취소" confirmLabel="초기화" onReset={() => setConfirmReset(false)} onConfirm={() => { setAvailableOnly(false); setMoreFiltersOpen(false); onReset(); setConfirmReset(false); }} />}>
          <p className="bbmf-confirm-text">선택한 필터를 초기화하시겠습니까?</p>
        </BbmModal>
      ) : null}
    </aside>
  );
}

function BbCarCard({ car, liked, onToggleLike, onOpen, onNotify }: { car: Car; liked: boolean; onToggleLike: () => void; onOpen: () => void; onNotify: (message: string) => void }) {
  const seller = sellerLabel(car);
  const badges = car.badges ?? [];
  const priceMatch = car.price.match(/^(월\s*)?(.+?)\s*(만원)$/);
  const specs = [displaySpecs(car.specs.slice(0, 3)), car.filter?.transmission].filter(Boolean).join(" · ");
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };
  return (
    <article className="bbm-card" role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeyDown={onKeyDown}>
      <div className="bbm-card-main">
        <div className="bbm-card-image">
          <img className={car.imageFit === "contain" ? "is-catalog" : ""} src={asset(car.image)} alt={`${car.title} ${car.trim}`} draggable={false} />
          <div className="bbm-card-media-footer" aria-hidden="true"><span>{car.posted}</span></div>
        </div>
        <div className="bbm-card-content">
          <h2 className="bbm-card-title">{car.title} {car.trim}</h2>
          <p className="bbm-card-spec">{specs}</p>
          <div className="bbm-card-price-row">
            <p className="bbm-card-price">{priceMatch?.[1] ?? ""}{priceMatch?.[2] ?? car.price}{priceMatch ? <span>만원</span> : null}</p>
            {badges.length ? <div className="bbm-card-badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
          </div>
          <p className="bbm-card-location"><BbIcon name="location-pin" size={16} />{displayListPlace(car.place, car.sellerType)}</p>
          <div className="bbm-card-meta">
            <div className="bbm-card-seller">
              <img src={asset(sellerAvatar(car))} alt="" draggable={false} />
              <span className="bbm-card-seller-name">{seller}</span>
              {car.sellerType === "딜러" ? <span className="bbm-card-seller-info"><b>{car.stock}대</b> 판매중</span> : null}
            </div>
            <div className="bbm-card-actions">
              <button type="button" className={liked ? "is-liked" : ""} aria-label={`${car.title} ${liked ? "찜 해제" : "찜"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}><BbIcon name={liked ? "heart-filled" : "heart"} size={24} /></button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export { bbCatalog, bbMakerLabel, BbIcon, BbHeader, BbFilterSidebar, BbSwitch, BbCarCard, type BbMakerSelection, type BbModelRow, type BbGradeGroup, type BbMakerSection };
