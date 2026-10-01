import { useState, type KeyboardEvent, type ReactNode } from "react";
import { asset, displayListPlace, sellerAvatar, sellerLabel, type Car } from "../data";
import { bbmCardBadges, bbmCardSpec } from "../data/bbm-card-samples";
import "./bbm-tokens.css";

// QF-091: 개발 시안(dev.bbmuseum.co.kr/car/list) 원본과 같은 목록 부품. 수치·아이콘은 원본에서 뽑은 값(bbm-tokens.css, public/assets/bbm/).

export const bbmIcon = (name: string) => asset(`bbm/${name}.svg`);

const headlinePositions = [
  "top", "before-model", "after-model", "after-spec", "after-price", "bottom", "overlay",
  "photo-top", "side-label", "photo-caption", "overlay-center", "overlay-bottom",
  "meta-top", "after-location", "after-seller", "price-inline", "spec-inline",
] as const;
type HeadlinePosition = (typeof headlinePositions)[number];

const headlinePositionLinks: Array<{ value: HeadlinePosition; short: string; label: string }> = [
  { value: "top", short: "1 상단", label: "카드 상단" },
  { value: "before-model", short: "2 모델 전", label: "제조사·모델 앞" },
  { value: "after-model", short: "3 모델 후", label: "세부모델 아래" },
  { value: "after-spec", short: "4 제원 후", label: "제원 아래" },
  { value: "after-price", short: "5 가격 후", label: "가격·배지 아래" },
  { value: "bottom", short: "6 하단", label: "카드 하단" },
  { value: "overlay", short: "7 사진 상단", label: "썸네일 상단 오버레이" },
  { value: "photo-top", short: "8 사진 위", label: "썸네일 위" },
  { value: "side-label", short: "9 사진 옆", label: "사진과 정보 사이" },
  { value: "photo-caption", short: "10 사진 아래", label: "썸네일 아래" },
  { value: "overlay-center", short: "11 사진 중앙", label: "썸네일 중앙 오버레이" },
  { value: "overlay-bottom", short: "12 사진 하단", label: "썸네일 하단 오버레이" },
  { value: "meta-top", short: "13 지역 위", label: "지역 위" },
  { value: "after-location", short: "14 지역 아래", label: "지역 아래" },
  { value: "after-seller", short: "15 판매자 아래", label: "판매자 아래" },
  { value: "price-inline", short: "16 가격 우측", label: "가격 오른쪽" },
  { value: "spec-inline", short: "17 제원 우측", label: "제원 오른쪽" },
];

function getHeadlinePosition(): HeadlinePosition {
  const value = new URLSearchParams(window.location.search).get("titlepos");
  return headlinePositions.includes(value as HeadlinePosition) ? value as HeadlinePosition : "top";
}

export function BbmHeadlinePreviewLinks() {
  const selected = getHeadlinePosition();
  const hrefFor = (value: HeadlinePosition) => {
    const params = new URLSearchParams(window.location.search);
    params.set("titlepos", value);
    return `${window.location.pathname}?${params.toString()}`;
  };
  return (
    <nav className="bbm-headline-preview" aria-label="제목 위치 17개 시안">
      <strong>제목 위치 17개</strong>
      <div className="bbm-headline-preview__links">
        {headlinePositionLinks.map((item) => (
          <a key={item.value} href={hrefFor(item.value)} className={selected === item.value ? "is-selected" : ""} aria-current={selected === item.value ? "page" : undefined} aria-label={`${item.short} — ${item.label}`} title={item.label}>{item.short}</a>
        ))}
      </div>
    </nav>
  );
}

// ── 차량 유형 줄(원본 원형 아이콘 7개). 유형을 고르면 같은 자리가 퀵필터 레일(제조사 단계부터)로 바뀐다
export const bbmCategoryItems: Array<[label: string, icon: string]> = [
  ["중고차", "category-used"], ["트럭 · 특장", "category-truck"], ["바이크", "category-bike"], ["캠핑카", "category-camping"],
  ["올드카", "category-old"], ["건설기계", "category-construction"], ["부품 · 용품", "category-equipment"],
];

export function BbmCategoryMenu({ onChoose }: { onChoose: (label: string) => void }) {
  return (
    <section className="bbm-category-menu" aria-label="차량 유형">
      <ul className="bbm-category-menu__list">
        {bbmCategoryItems.map(([label, icon]) => (
          <li key={label} className="bbm-category-menu__item">
            <button type="button" className="bbm-category-menu__button" onClick={() => onChoose(label)}>
              <span className="bbm-category-menu__icon-box"><img src={bbmIcon(icon)} alt="" aria-hidden="true" draggable={false} /></span>
              <span className="bbm-category-menu__label">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// ── 스위치(원본 ui-switch sm: 38×20, 손잡이 16)
export function BbmSwitch({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`bbm-switch-sm${checked ? " is-on" : ""}`} onClick={onChange}><span /></button>;
}

// ── 모바일 영상 매물 · 업데이트순 줄
export function BbmMobileOptions({ videoOnly, onToggleVideo, sortLabel, onSort, extra }: { videoOnly: boolean; onToggleVideo: () => void; sortLabel: string; onSort: () => void; extra?: ReactNode }) {
  return (
    <section className="bbm-m-options" aria-label="영상 매물과 정렬">
      <div className="bbm-m-video"><span>영상 매물</span><BbmSwitch checked={videoOnly} label="영상 매물" onChange={onToggleVideo} /></div>
      {extra}
      <button type="button" className="bbm-m-sort" onClick={onSort}><span>{sortLabel}</span><img src={bbmIcon("m-toolbar-sort")} alt="" aria-hidden="true" /></button>
    </section>
  );
}

// ── 목록 탭 전체 · 개인 · 딜러 · 브랜드 + 목록형 아이콘
export function BbmSellerTabs<T extends string>({ tabs, value, onChange, onBrand }: { tabs: readonly T[]; value: T; onChange: (tab: T) => void; onBrand: () => void }) {
  return (
    <div className="bbm-seller-tabs" role="tablist" aria-label="판매자 유형">
      {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={value === tab} className={value === tab ? "is-selected" : ""} onClick={() => onChange(tab)}>{tab}</button>)}
      <button type="button" role="tab" aria-selected={false} onClick={onBrand}>브랜드</button>
    </div>
  );
}

// ── 매물 카드(원본 car-list-result-card). variant pc: 사진 160, 마력 포함 / mobile 목록형: 사진 136×136, 마력 없음
export function BbmResultCard({ car, variant, liked, onToggleLike, onOpen, onChat }: { car: Car; variant: "pc" | "mobile"; liked: boolean; onToggleLike: () => void; onOpen: () => void; onChat: () => void }) {
  const seller = sellerLabel(car);
  const badges = bbmCardBadges(car);
  const priceMatch = car.price.match(/^(월\s*)?(.+?)\s*(만원)$/);
  const title = <strong className="bbm-card-title"><span className="bbm-card-model">{car.title}</span>{car.trim ? <><span aria-hidden="true"> </span><span className="bbm-card-trim">{car.trim}</span></> : null}</strong>;
  const headlinePosition = car.uiTest ? getHeadlinePosition() : null;
  const headline = car.uiTest ? <strong className={`bbm-card-headline is-${headlinePosition}`}>{car.uiTest.headline}</strong> : null;
  const headlineAt = (position: HeadlinePosition) => headlinePosition === position ? headline : null;
  const photo = (
    <div className={`bbm-card-photo${car.image ? "" : " is-empty"}`}>
      {car.image ? <img className={car.imageFit === "contain" ? "is-catalog" : ""} src={asset(car.image)} alt={car.uiTest?.fullTitle ?? `${car.title} ${car.trim}`.trim()} draggable={false} style={{ objectPosition: car.imagePosition ?? "center center" }} /> : null}
      {headlineAt("overlay")}
      {headlineAt("overlay-center")}
      {headlineAt("overlay-bottom")}
      <div className="bbm-card-media-footer" aria-hidden="true"><span className="bbm-card-time">{car.posted.replace(/\s/g, "")}</span><span className="bbm-card-count">{car.photos}<img src={bbmIcon("card-photo-count")} alt="" /></span></div>
    </div>
  );
  const photoNeedsCaption = headlinePosition === "photo-top" || headlinePosition === "photo-caption";
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); }
  };
  return (
    <article className={`bbm-result-card is-${variant}${badges.length ? " has-badges" : " has-no-badges"}${car.uiTest ? ` is-ui-test headline-${headlinePosition}` : ""}`} role="link" tabIndex={0} aria-label={`${car.uiTest?.fullTitle ?? `${car.title} ${car.trim}`.trim()} 상세 보기`} onClick={onOpen} onKeyDown={onKeyDown}>
      {headlineAt("top")}
      <div className="bbm-card-main">
        {/* 사진이 없는 매물은 원본처럼 빈 회색 칸(car-list-result-card__image 배경 #EBEBEB) */}
        {photoNeedsCaption ? <div className="bbm-card-photo-column">{headlineAt("photo-top")}{photo}{headlineAt("photo-caption")}</div> : photo}
        {headlineAt("side-label")}
        <div className="bbm-card-content">
          <div className="bbm-card-text">
            {headlineAt("before-model")}
            {title}
            {headlineAt("after-model")}
            {headlinePosition === "spec-inline" ? <div className="bbm-card-spec-inline-row"><span className="bbm-card-spec">{bbmCardSpec(car, variant === "pc")}</span>{headlineAt("spec-inline")}</div> : <span className="bbm-card-spec">{bbmCardSpec(car, variant === "pc")}</span>}
            {headlineAt("after-spec")}
            <div className="bbm-card-price-badges">
              {headlinePosition === "price-inline" ? <div className="bbm-card-price-inline-row"><strong className="bbm-card-price"><span>{priceMatch?.[1] ?? ""}{priceMatch?.[2] ?? car.price}</span>{priceMatch ? <span className="bbm-card-price-unit">만원</span> : null}</strong>{headlineAt("price-inline")}</div> : <strong className="bbm-card-price"><span>{priceMatch?.[1] ?? ""}{priceMatch?.[2] ?? car.price}</span>{priceMatch ? <span className="bbm-card-price-unit">만원</span> : null}</strong>}
              {badges.length ? <div className="bbm-card-badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
            </div>
            {headlineAt("after-price")}
          </div>
          <div className="bbm-card-meta">
            {headlineAt("meta-top")}
            <div className="bbm-card-location"><img src={bbmIcon("card-location")} alt="" aria-hidden="true" /><span className="bbm-card-location-text">{car.uiTest && car.sellerType === "개인" ? car.place : displayListPlace(car.place, car.sellerType)}</span></div>
            {headlineAt("after-location")}
            <div className="bbm-card-meta-row">
              <div className="bbm-card-seller">
                <img className="bbm-card-seller-logo" src={asset(sellerAvatar(car))} alt="" draggable={false} />
                <div className="bbm-card-seller-text"><strong>{seller}</strong></div>
              </div>
              <div className="bbm-card-actions">
                {variant === "pc" ? <button type="button" aria-label={`${seller}에게 채팅`} onClick={(event) => { event.stopPropagation(); onChat(); }}><img src={bbmIcon("card-chat")} alt="" aria-hidden="true" /></button> : null}
                <button type="button" className={liked ? "is-liked" : ""} aria-label={`${car.title} ${liked ? "찜 해제" : "찜"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}>
                  {liked ? <span className="bbm-card-wish-on" style={{ WebkitMaskImage: `url("${bbmIcon("card-wish-off")}")`, maskImage: `url("${bbmIcon("card-wish-off")}")` }} aria-hidden="true" /> : <img src={bbmIcon("card-wish-off")} alt="" aria-hidden="true" />}
                </button>
              </div>
            </div>
            {headlineAt("after-seller")}
          </div>
        </div>
      </div>
      {headlineAt("bottom")}
    </article>
  );
}

export function BbmOneLineCard({ car, liked, onToggleLike, onOpen }: { car: Car; liked: boolean; onToggleLike: () => void; onOpen: () => void }) {
  const year = car.filter?.year ? String(car.filter.year).slice(-2) : "-";
  const price = car.price.match(/[\d,]+/)?.[0] ?? "상담";
  return (
    <article className="bbm-one-line-card" role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); } }}>
      <strong>{car.title} {car.trim}</strong>
      <span>{year}/{year}</span>
      <b>{price}</b>
      <button type="button" aria-label={`${car.title} ${liked ? "찜 해제" : "찜"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}>
        {liked ? <span className="bbm-card-wish-on" style={{ WebkitMaskImage: `url("${bbmIcon("card-wish-off")}")`, maskImage: `url("${bbmIcon("card-wish-off")}")` }} aria-hidden="true" /> : <img src={bbmIcon("card-wish-off")} alt="" aria-hidden="true" />}
      </button>
    </article>
  );
}

// ── 모바일 하단 탭바: 홈 · 채팅 · 매물등록(＋ 원형) · 커뮤니티 · 마이
export function BbmBottomGnb({ onNotify }: { onNotify: (message: string) => void }) {
  const items: Array<[string, string]> = [["홈", "home"], ["채팅", "chat"], ["매물등록", "register"], ["커뮤니티", "community"], ["마이", "my"]];
  return (
    <nav className="bbm-bottom-gnb" aria-label="하단 메뉴">
      <img className="bbm-bottom-gnb__background" src={bbmIcon("m-gnb-background")} alt="" aria-hidden="true" />
      <div className="bbm-bottom-gnb__inner">
        {items.map(([label, icon]) => icon === "register" ? (
          <button key={label} type="button" className="bbm-bottom-gnb__item is-register" onClick={() => onNotify("매물등록은 정식 서비스에서 이용해 주세요.")}>
            <span className="bbm-bottom-gnb__register-button"><img src={bbmIcon("m-gnb-register")} alt="" aria-hidden="true" /></span>
            <span className="bbm-bottom-gnb__register-label">{label}</span>
          </button>
        ) : (
          <button key={label} type="button" className={`bbm-bottom-gnb__item${icon === "home" ? " is-active" : ""}`} aria-current={icon === "home" ? "page" : undefined} onClick={() => icon === "home" ? undefined : onNotify(`${label}은(는) 정식 서비스에서 이용해 주세요.`)}>
            <img src={bbmIcon(`m-gnb-${icon}`)} alt="" aria-hidden="true" />
            <span className="bbm-bottom-gnb__label">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}

// ── QF-085·086: 제조사 칩 모달·시트(원본: 검색칸 + 국산차/수입차 인기/수입차 이름순 로고 목록, 매물 수, 오른쪽 셰브론)
export type BbmMakerRow = { label: string; key: string; count: number | null };
export function BbmMakerList({ sections, selected, renderLogo, onChoose, allowEmpty = false }: { allowEmpty?: boolean; sections: Array<{ title: string; rows: BbmMakerRow[] }>; selected?: string | null; renderLogo: (key: string, label: string) => ReactNode; onChoose: (key: string) => void }) {
  const [query, setQuery] = useState("");
  const keyword = query.trim();
  return (
    <div className="bbm-maker-list">
      <div className="bbm-maker-search-wrap"><label className="bbm-maker-search"><img src={bbmIcon("m-header-search")} alt="" aria-hidden="true" /><input value={query} placeholder="검색" aria-label="제조사 검색" onChange={(event) => setQuery(event.target.value)} /></label></div>
      {sections.map((section) => {
        const rows = section.rows.filter((row) => !keyword || row.label.includes(keyword));
        if (!rows.length) return null;
        return (
          <section key={section.title} className="bbm-maker-section">
            <p className="bbm-maker-section-title">{section.title}</p>
            {rows.map((row) => (
              <button key={`${section.title}-${row.label}`} type="button" className={`bbm-maker-row${selected === row.key ? " is-selected" : ""}${row.count === 0 ? " is-empty" : ""}`} disabled={row.count === 0 && !allowEmpty} onClick={() => onChoose(row.key)}>
                <span className="bbm-maker-logo">{renderLogo(row.key, row.label)}</span>
                <span className="bbm-maker-name">{row.label}</span>
                {row.count === null ? null : <span className="bbm-maker-count">{row.count.toLocaleString("ko-KR")}</span>}
                <i className="bbm-maker-chevron" aria-hidden="true" />
              </button>
            ))}
          </section>
        );
      })}
    </div>
  );
}

// ── "모델" 칩 모달·시트: 그 제조사의 모델 목록. 고르면 퀵필터 모델 선택과 같은 동작
export function BbmModelList({ rows, selected, onChoose }: { rows: Array<{ name: string; label: string; count: number | null }>; selected?: string | null; onChoose: (name: string) => void }) {
  if (!rows.length) return <p className="bbm-maker-empty">모델 정보 없음</p>;
  return (
    <div className="bbm-maker-list">
      {rows.map((row) => (
        <button key={row.name} type="button" className={`bbm-maker-row is-model${selected === row.name ? " is-selected" : ""}${row.count === 0 ? " is-empty" : ""}`} disabled={row.count === 0} onClick={() => onChoose(row.name)}>
          <span className="bbm-maker-name">{row.label}</span>
          {row.count === null ? null : <span className="bbm-maker-count">{row.count.toLocaleString("ko-KR")}</span>}
          <i className="bbm-maker-chevron" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
