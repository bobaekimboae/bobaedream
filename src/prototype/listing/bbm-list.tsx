import { useState, type KeyboardEvent, type ReactNode } from "react";
import { asset, displayListPlace, sellerAvatar, sellerLabel, type Car } from "../data";
import { bbmCardBadges, bbmCardSpec } from "../data/bbm-card-samples";
import "./bbm-tokens.css";

// QF-091: 개발 시안(dev.bbmuseum.co.kr/car/list) 원본과 같은 목록 부품. 수치·아이콘은 원본에서 뽑은 값(bbm-tokens.css, public/assets/bbm/).

export const bbmIcon = (name: string) => asset(`bbm/${name}.svg`);

type HeadlineTone = "default" | "blue";
type HeadlinePosition = "top" | "photo-top" | "after-model";

const headlinePositionLinks: Array<{ short: string; label: string; tone: HeadlineTone }> = [
  { short: "3 기본", label: "세부모델 아래 · 기본색", tone: "default" },
  { short: "3B 블루", label: "세부모델 아래 · 보배드림 블루", tone: "blue" },
];

function getHeadlineTone(): HeadlineTone {
  return new URLSearchParams(window.location.search).get("titlecolor") === "blue" ? "blue" : "default";
}

function getHeadlinePosition(): HeadlinePosition {
  const position = new URLSearchParams(window.location.search).get("titlepos");
  if (position === "top" || position === "photo-top") return position;
  return "after-model";
}

export function BbmHeadlinePreviewLinks() {
  const selectedTone = getHeadlineTone();
  const hrefFor = (tone: HeadlineTone) => {
    const params = new URLSearchParams(window.location.search);
    params.set("titlepos", "after-model");
    if (tone === "blue") params.set("titlecolor", "blue");
    else params.delete("titlecolor");
    return `${window.location.pathname}?${params.toString()}`;
  };
  return (
    <nav className="bbm-headline-preview" aria-label="제목 3번 색상 시안">
      <strong>제목 3번 색상 비교</strong>
      <div className="bbm-headline-preview__links">
        {headlinePositionLinks.map((item) => {
          const isSelected = selectedTone === item.tone;
          return <a key={item.tone} href={hrefFor(item.tone)} className={isSelected ? "is-selected" : ""} aria-current={isSelected ? "page" : undefined} aria-label={`${item.short} — ${item.label}`} title={item.label}>{item.short}</a>;
        })}
      </div>
    </nav>
  );
}

// ── 차량 유형 줄. 초톳 슬롯 기준의 동일 높이·바닥선 실사 컷을 쓰고, 선택 시 기존 내부 필터 값은 유지한다.
export const bbmCategoryItems: Array<[value: string, image: string, label?: string]> = [
  ["중고차", "category-photo/vehicle_type_car_v01.png", "자동차"],
  ["트럭 · 특장", "category-photo/vehicle_type_cargo_truck_v01.png", "화물트럭"],
  ["바이크", "category-photo/vehicle_type_bike_v01.png"],
  ["캠핑카", "category-photo/vehicle_type_motorhome_v01.png", "모터홈"],
  ["올드카", "category-photo/vehicle_type_old_car_v01.png"],
  ["건설기계", "category-photo/vehicle_type_construction_v01.png", "건설기계(덤프/지게차)"],
  ["부품 · 용품", "category-photo/vehicle_type_parts_v01.png"],
];

type ImageGuideFamily = "body" | "gclass" | "heavy";

const imageGuideItems: Record<ImageGuideFamily, Array<[value: string, image: string, label?: string]>> = {
  body: [
    ["중고차", "bbm/generated/quickfilter-v01/car_body_sedan_v01.png", "세단"],
    ["중고차", "bbm/generated/quickfilter-v01/car_body_hatchback_v01.png", "해치백"],
    ["중고차", "bbm/generated/quickfilter-v01/car_body_suv_v01.png", "SUV"],
    ["중고차", "bbm/generated/quickfilter-v01/car_body_coupe_v01.png", "쿠페"],
  ],
  gclass: [
    ["중고차", "bbm/generated/quickfilter-v01/car_mercedes_gclass_w460_v01.png", "G-클래스 W460"],
    ["중고차", "bbm/generated/quickfilter-v01/car_mercedes_gclass_w463_v01.png", "G-클래스 W463"],
    ["중고차", "bbm/generated/quickfilter-v01/car_mercedes_gclass_w465_v01.png", "G-클래스 최신형"],
  ],
  heavy: [
    ["건설기계", "bbm/generated/quickfilter-v01/heavy_excavator_v01.png", "굴착기"],
    ["건설기계", "bbm/generated/quickfilter-v01/heavy_wheel_loader_v01.png", "휠로더"],
    ["건설기계", "bbm/generated/quickfilter-v01/heavy_forklift_v02.png", "지게차"],
  ],
};

function getImageGuideFamily(): ImageGuideFamily | null {
  const value = new URLSearchParams(window.location.search).get("imageguide");
  return value === "body" || value === "gclass" || value === "heavy" ? value : null;
}

export function BbmCategoryMenu({ onChoose }: { onChoose: (label: string) => void }) {
  const imageGuideFamily = getImageGuideFamily();
  const items = imageGuideFamily ? imageGuideItems[imageGuideFamily] : bbmCategoryItems;
  return (
    <section className={`bbm-category-menu${imageGuideFamily ? " is-image-guide" : ""}`} aria-label={imageGuideFamily ? "AI 제작 이미지 슬롯 검수" : "차량 유형"} data-image-guide={imageGuideFamily ?? undefined}>
      <ul className="bbm-category-menu__list">
        {items.map(([value, image, label = value]) => (
          <li key={`${value}-${label}`} className="bbm-category-menu__item">
            <button type="button" className="bbm-category-menu__button" onClick={() => onChoose(value)}>
              <span className="bbm-category-menu__icon-box is-photo"><img src={asset(image)} alt="" aria-hidden="true" draggable={false} /></span>
              <span className="bbm-category-menu__label">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

// 오토홈 제조사 로고 비교 시안: 카테고리 바텀시트와 같은 1열 가로 슬롯 규격을 쓴다.
export function BbmBrandMenu({ items, selected, renderLogo, onChoose }: { items: Array<{ label: string; key: string; logoName?: string }>; selected: string | null; renderLogo: (name: string) => ReactNode; onChoose: (key: string) => void }) {
  return (
    <section className="bbm-category-menu bbm-brand-menu" aria-label="제조사">
      <ul className="bbm-category-menu__list">
        {items.map((item) => (
          <li key={item.key} className="bbm-category-menu__item">
            <button type="button" className={`bbm-category-menu__button${selected === item.key ? " is-selected" : ""}`} aria-pressed={selected === item.key} onClick={() => onChoose(item.key)}>
              <span className="bbm-category-menu__icon-box is-logo">{renderLogo(item.logoName ?? item.label)}</span>
              <span className="bbm-category-menu__label">{item.label}</span>
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
export function BbmResultCard({ car, variant, featured = false, liked, onToggleLike, onOpen, onChat }: { car: Car; variant: "pc" | "mobile"; featured?: boolean; liked: boolean; onToggleLike: () => void; onOpen: () => void; onChat: () => void }) {
  const seller = sellerLabel(car);
  const badges = bbmCardBadges(car);
  const priceMatch = car.price.match(/^(월\s*)?(.+?)\s*(만원)$/);
  const title = <strong className="bbm-card-title"><span className="bbm-card-model">{car.title}</span>{car.trim ? <><span aria-hidden="true"> </span><span className="bbm-card-trim">{car.trim}</span></> : null}</strong>;
  const headlinePosition = getHeadlinePosition();
  const headlineTone = car.uiTest ? getHeadlineTone() : "default";
  const headline = car.uiTest ? <strong className={`bbm-card-headline is-${headlinePosition}${headlineTone === "blue" ? " is-blue" : ""}`}>{car.uiTest.headline}</strong> : null;
  const photo = (
    <div className={`bbm-card-photo${car.image ? "" : " is-empty"}`}>
      {car.image ? <img className={car.imageFit === "contain" ? "is-catalog" : ""} src={asset(car.image)} alt={car.uiTest?.fullTitle ?? `${car.title} ${car.trim}`.trim()} draggable={false} style={{ objectPosition: car.imagePosition ?? "center center" }} /> : null}
      <div className="bbm-card-media-footer" aria-hidden="true"><span className="bbm-card-time">{car.posted.replace(/\s/g, "")}</span><span className="bbm-card-count">{car.photos}<img src={bbmIcon("card-photo-count")} alt="" /></span></div>
    </div>
  );
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); }
  };
  return (
    <article className={`bbm-result-card is-${variant}${featured ? " is-feed-featured" : ""}${badges.length ? " has-badges" : " has-no-badges"}${car.uiTest ? ` is-ui-test headline-${headlinePosition}` : ""}`} role="link" tabIndex={0} aria-label={`${car.uiTest?.fullTitle ?? `${car.title} ${car.trim}`.trim()} 상세 보기`} onClick={onOpen} onKeyDown={onKeyDown}>
      {headlinePosition === "top" ? headline : null}
      <div className="bbm-card-main">
        {/* 사진이 없는 매물은 원본처럼 빈 회색 칸(car-list-result-card__image 배경 #EBEBEB) */}
        {headlinePosition === "photo-top" ? <div className="bbm-card-photo-column">{headline}{photo}</div> : photo}
        <div className="bbm-card-content">
          <div className="bbm-card-text">
            {title}
            {headlinePosition === "after-model" ? headline : null}
            <span className="bbm-card-spec">{bbmCardSpec(car, variant === "pc")}</span>
            <div className="bbm-card-price-badges">
              <strong className="bbm-card-price"><span>{priceMatch?.[1] ?? ""}{priceMatch?.[2] ?? car.price}</span>{priceMatch ? <span className="bbm-card-price-unit">만원</span> : null}</strong>
              {badges.length ? <div className="bbm-card-badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
            </div>
          </div>
          <div className="bbm-card-meta">
            <div className="bbm-card-location"><img src={bbmIcon("card-location")} alt="" aria-hidden="true" /><span className="bbm-card-location-text">{car.uiTest && car.sellerType === "개인" ? car.place : displayListPlace(car.place, car.sellerType)}</span></div>
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
          </div>
        </div>
      </div>
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
