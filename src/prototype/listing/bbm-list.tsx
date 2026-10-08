import { useState, type KeyboardEvent, type ReactNode } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";
import { asset, displayListPlace, placeSidoGugun, sellerAvatar, sellerLabel, type Car } from "../data";
import { bbmCardBadges, bbmCardSpec } from "../data/bbm-card-samples";
import { truckFormatCatalog } from "../data/truck-format-catalog";
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
  ["중고차", "category-photo/vehicle_type_car_v01.png", "중고차"],
  ["트럭 · 특장", "category-photo/vehicle_type_cargo_truck_v03.png", "화물/특장"],
  ["바이크", "category-photo/vehicle_type_bike_v01.png"],
  ["캠핑카", "category-photo/vehicle_type_motorhome_v01.png", "캠핑카"],
  ["올드카", "category-photo/vehicle_type_old_car_v02.png"],
  ["건설기계", "category-photo/vehicle_type_construction_v01.png", "건설기계(덤프/지게차)"],
  ["부품 · 용품", "category-photo/vehicle_type_parts_v01.png"],
];

type BbmCategoryChild = {
  label: string;
  value: string;
  detail?: string;
};

type BbmCategoryGroup = {
  value: string;
  label: string;
  icon: string;
  children: readonly BbmCategoryChild[];
};

const categoryIcon = (file: string) => `category/icons/v01/${file}`;

// 노션에서 전달받은 원본 SVG 7개를 그대로 쓰고, 초톳처럼 상위는 아이콘·하위는 알약칩으로 분리한다.
// 사용자가 명시하지 않은 하위 분류는 임의로 만들지 않고 "전체"만 둔다.
export const bbmCategoryGroups: readonly BbmCategoryGroup[] = [
  {
    value: "중고차",
    label: "중고차",
    icon: categoryIcon("category_used_car_v01.svg"),
    children: [
      { label: "전체차량", value: "전체" },
      { label: "국산차", value: "국산차" },
      { label: "수입차", value: "수입차" },
      { label: "전기차", value: "전기차" },
      { label: "리스/렌트차량", value: "리스/렌트차량" },
      { label: "올드카", value: "올드카" },
      { label: "럭셔리카", value: "럭셔리카" },
      { label: "슈퍼카", value: "슈퍼카" },
      { label: "브랜드 인증중고차", value: "브랜드 인증중고차" },
      { label: "매매단지별 검색", value: "매매단지별 검색" },
      { label: "팔린매물", value: "팔린매물" },
      { label: "장애인차", value: "장애인차" },
    ],
  },
  {
    value: "트럭 · 특장",
    label: "트럭/특장차",
    icon: categoryIcon("category_truck_special_v01.svg"),
    children: [
      { label: "전체", value: "트럭 · 특장" },
      ...truckFormatCatalog.map((group) => ({ label: group.name, value: "트럭 · 특장", detail: group.name })),
    ],
  },
  {
    value: "바이크",
    label: "바이크",
    icon: categoryIcon("category_bike_v01.svg"),
    children: [{ label: "전체", value: "바이크" }],
  },
  {
    value: "캠핑카",
    label: "캠핑카",
    icon: categoryIcon("category_camper_v01.svg"),
    children: [
      { label: "전체", value: "캠핑카" },
      { label: "모터홈", value: "캠핑카", detail: "모터홈" },
      { label: "카라반", value: "캠핑카", detail: "카라반" },
      { label: "트레일러", value: "캠핑카", detail: "트레일러" },
    ],
  },
  {
    value: "건설기계",
    label: "건설기계",
    icon: categoryIcon("category_construction_v01.svg"),
    children: [{ label: "전체", value: "건설기계" }],
  },
  {
    value: "자재운반장비",
    label: "자재운반장비",
    icon: categoryIcon("category_material_handling_v01.svg"),
    children: [{ label: "전체", value: "자재운반장비" }],
  },
  {
    value: "부품 · 용품",
    label: "부품/용품",
    icon: categoryIcon("category_parts_v01.svg"),
    children: [{ label: "전체", value: "부품 · 용품" }],
  },
];

function categoryGroupForSelection(selected: string) {
  return bbmCategoryGroups.find((group) => group.value === selected || group.children.some((child) => child.value === selected)) ?? bbmCategoryGroups[0];
}

function BbmCategoryIconRow({ activeValue, onActivate }: { activeValue: string; onActivate: (value: string) => void }) {
  return (
    <ul className="bbm-category-menu__list" role="list">
      {bbmCategoryGroups.map((group) => {
        const isActiveGroup = group.value === activeValue;
        return (
          <li key={group.value} className="bbm-category-menu__item">
            <button type="button" className="bbm-category-menu__button" data-active-group={isActiveGroup ? "true" : undefined} onClick={() => onActivate(group.value)}>
              <span className="bbm-category-menu__icon-box is-category-icon"><img src={asset(group.icon)} alt="" aria-hidden="true" draggable={false} /></span>
              <span className="bbm-category-menu__label">{group.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function BbmCategoryChildPills({ group, selected, selectedChild, onChoose }: { group: BbmCategoryGroup; selected?: string; selectedChild?: string | null; onChoose: (value: string, detail?: string) => void }) {
  return (
    <div className="bbm-category-child-pills" role="group" aria-label={`${group.label} 하위 카테고리`}>
      {group.children.map((child) => {
        const isSelected = child.detail ? selected === child.value && selectedChild === child.detail : selected === child.value && !selectedChild;
        return <button key={`${child.value}-${child.detail ?? child.label}`} type="button" className={isSelected ? "is-selected" : ""} aria-pressed={isSelected} onClick={() => onChoose(child.value, child.detail)}>{child.label}</button>;
      })}
    </div>
  );
}

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

export function BbmCategoryMenu({ onChoose }: { onChoose: (label: string, detail?: string) => void }) {
  const imageGuideFamily = getImageGuideFamily();
  const items = imageGuideFamily ? imageGuideItems[imageGuideFamily] : bbmCategoryItems;
  const [activeValue, setActiveValue] = useState(bbmCategoryGroups[0].value);
  if (!imageGuideFamily) {
    const activeGroup = bbmCategoryGroups.find((group) => group.value === activeValue) ?? bbmCategoryGroups[0];
    const entersNextDepthDirectly = (group: BbmCategoryGroup) => group.value === "중고차" || group.value === "트럭 · 특장" || group.children.length === 1;
    const activateGroup = (value: string) => {
      setActiveValue(value);
      const nextGroup = bbmCategoryGroups.find((group) => group.value === value);
      if (!nextGroup || !entersNextDepthDirectly(nextGroup)) return;
      const onlyChild = nextGroup.children.length === 1 ? nextGroup.children[0] : undefined;
      // 중고차는 브랜드, 트럭/특장은 형식 이미지, 단일 "전체" 카테고리는 각 전용 퀵필터로 바로 진입한다.
      onChoose(onlyChild?.value ?? value, onlyChild?.detail);
    };
    return (
      <section className="bbm-category-menu is-hierarchical" aria-label="차량 카테고리">
        <div className="bbm-category-labeled-row is-type-row is-titleless">
          <div className="bbm-category-labeled-content"><BbmCategoryIconRow activeValue={activeGroup.value} onActivate={activateGroup} /></div>
        </div>
        {entersNextDepthDirectly(activeGroup) ? null : (
          <div className="bbm-category-labeled-row is-detail-row is-titleless">
            <div className="bbm-category-labeled-content"><BbmCategoryChildPills group={activeGroup} onChoose={onChoose} /></div>
          </div>
        )}
      </section>
    );
  }
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

// QF-121: 초톳 모바일 카테고리 바텀시트처럼 그룹 제목 + 32px 알약 칩으로 선택한다.
// 실사 퀴필터 레일과 바텀시트의 역할을 분리해, 시트에서는 중복 이미지를 나열하지 않는다.
export function BbmCategoryPicker({ selected, selectedChild, onChoose }: { selected: string; selectedChild?: string | null; onChoose: (label: string, detail?: string) => void }) {
  const initialGroup = categoryGroupForSelection(selected);
  const [activeValue, setActiveValue] = useState(initialGroup.value);
  const activeGroup = bbmCategoryGroups.find((group) => group.value === activeValue) ?? initialGroup;
  return (
    <section className="bbm-category-picker" aria-label="차량 카테고리 선택">
      <div className="bbm-category-picker__icons"><BbmCategoryIconRow activeValue={activeGroup.value} onActivate={setActiveValue} /></div>
      <div className="bbm-category-picker__group"><strong className="bbm-category-picker__title">{activeGroup.label}</strong><BbmCategoryChildPills group={activeGroup} selected={selected} selectedChild={selectedChild} onChoose={onChoose} /></div>
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

// ── 모바일 목록 제어 줄: 숏폼매물 · 판매자 · 정렬 · 보기 방식
export function BbmMobileOptions<T extends string>({
  videoOnly,
  onToggleVideo,
  sortLabel,
  onSort,
  sellerTabs,
  sellerValue,
  onSellerChange,
  onView,
  viewMode,
  extra,
}: {
  videoOnly: boolean;
  onToggleVideo: () => void;
  sortLabel: string;
  onSort: () => void;
  sellerTabs: readonly T[];
  sellerValue: string;
  onSellerChange: (tab: T) => void;
  onView: () => void;
  viewMode: string;
  extra?: ReactNode;
}) {
  const viewIcon = viewMode === "갤러리로 보기" ? "view-list-chotot-v02" : "view-grid-chotot";
  return (
    <nav className="bbm-m-options" aria-label="정렬, 숏폼중고차, 판매자 유형과 보기 방식">
      <button type="button" className="bbm-m-sort" onClick={onSort}><span>{sortLabel}</span><img src={bbmIcon("toolbar-sort-chevron")} alt="" aria-hidden="true" /></button>
      <div className="bbm-m-filter-tabs" role="group" aria-label="숏폼중고차와 판매자 유형">
        <button type="button" className={`bbm-m-filter-tab${videoOnly ? " is-selected" : ""}`} aria-pressed={videoOnly} onClick={onToggleVideo}>
          <span>숏폼중고차</span>{videoOnly ? <Cross2Icon className="bbm-m-filter-clear" aria-hidden="true" /> : null}
        </button>
        {sellerTabs.map((tab) => {
          const selected = sellerValue === tab;
          return (
            <button key={tab} type="button" className={`bbm-m-filter-tab${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => onSellerChange(tab)}>
              <span>{tab}</span>{selected ? <Cross2Icon className="bbm-m-filter-clear" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
      {extra}
      <button type="button" className="bbm-m-view" aria-label="보기 방식 선택" onClick={onView}><img src={bbmIcon(viewIcon)} alt="" aria-hidden="true" /></button>
    </nav>
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

// ── 매물 카드(원본 car-list-result-card). variant pc: 사진 160, 마력 포함 / mobile 목록형: 초톳 기준 사진 120×120, 마력 없음
export function BbmResultCard({ car, variant, featured = false, liked, onToggleLike, onOpen, onChat }: { car: Car; variant: "pc" | "mobile"; featured?: boolean; liked: boolean; onToggleLike: () => void; onOpen: () => void; onChat: () => void }) {
  const seller = sellerLabel(car);
  // 중고차(승용)는 「시도 구군 · 단지」, 그 밖의 카테고리(트럭·바이크·건설기계·캠핑카 등)는 「시도 구군」까지만(2026-10-08)
  const isPassenger = !(car.truck || car.bike || car.heavy || car.virtualCategory);
  // 중고차는 개인·딜러 모두 「시도 구군 · 단지」(2026-10-08 「중고차 매물은 지역에 단지 붙이고」)
  const listPlace = !isPassenger ? placeSidoGugun(car.place.split(" · ")[0]) : displayListPlace(car.place, "딜러");
  const badges = bbmCardBadges(car);
  // dev 원본처럼 스펙 항목을 " · "(공백+가운데점+공백) 텍스트로 잇는다(JOB-8). 한 줄 넘치면 말줄임
  const specText = bbmCardSpec(car, variant === "pc");
  // 캠핑카 모터홈은 「승차 N인 · 취침 N인」(카라반·트레일러는 한 줄에 들어가 나누지 않음, 2026-10-08), 트럭은 「적재 · 마력 · 차축」이 한 줄에 다 안 들어가 둘째 줄로 내린다(2026-10-08)
  const seatSplit = car.virtualCategory?.category === "캠핑카" ? specText.search(/ · 승차 /) : car.truck ? specText.search(/ · (적재 [\d,]+kg|\d+인승|[\d.]+(㎘|㎥|m) · |\d+마력)/) : -1;
  const specMain = seatSplit > 0 ? specText.slice(0, seatSplit) : specText;
  const specCapacity = seatSplit > 0 ? specText.slice(seatSplit + 3) : "";
  const [locationMain, ...locationSecondaryParts] = listPlace.split(" · ");
  const locationSecondary = locationSecondaryParts.join(" · ");
  const priceMatch = car.price.match(/^(월\s*)?(.+?)\s*(만원)$/);
  // 모든 카테고리가 차명을 붙여 한 제목으로(최대 2줄). 중고차도 「제조사 모델 세부모델」을 끊지 않고 잇는다(2026-10-08 「중고차도 차명 끊지 말고 연결」)
  const title = <strong className="bbm-card-title"><span className="bbm-card-model is-joined">{car.trim ? `${car.title} ${car.trim}` : car.title}</span></strong>;
  const headlinePosition = getHeadlinePosition();
  const headlineTone = car.uiTest ? getHeadlineTone() : "default";
  const headline = car.uiTest ? <strong className={`bbm-card-headline is-${headlinePosition}${headlineTone === "blue" ? " is-blue" : ""}`}>{car.uiTest.headline}</strong> : null;
  const photo = (
    <div className={`bbm-card-photo${car.image ? "" : " is-empty"}`}>
      {car.image ? <img className={car.imageFit === "contain" ? "is-catalog" : ""} src={asset(car.image)} alt={car.uiTest?.fullTitle ?? `${car.title} ${car.trim}`.trim()} draggable={false} style={{ objectPosition: car.imagePosition ?? "center center" }} /> : null}
      <div className="bbm-card-media-footer" aria-hidden="true"><span className="bbm-card-time">{car.posted.replace(/\s/g, "")}</span></div>
    </div>
  );
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); }
  };
  const sellerRow = (
    <div className={`bbm-card-meta-row${variant === "mobile" ? " bbm-card-mobile-footer" : ""}`}>
      <div className="bbm-card-seller">
        <img className="bbm-card-seller-logo" src={asset(sellerAvatar(car))} alt="" draggable={false} />
        <div className="bbm-card-seller-text"><strong>{seller}</strong></div>
      </div>
      <div className="bbm-card-actions">
        <button type="button" className={`bbm-card-wish${liked ? " is-liked" : ""}`} aria-label={`${car.title} ${liked ? "찜 해제" : "찜"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}>
          {liked ? <span className="bbm-card-wish-on" style={{ WebkitMaskImage: `url("${bbmIcon("card-wish-off")}")`, maskImage: `url("${bbmIcon("card-wish-off")}")` }} aria-hidden="true" /> : <img src={bbmIcon("card-wish-off")} alt="" aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
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
            <span className="bbm-card-spec">{specMain}</span>
            {specCapacity ? <span className="bbm-card-spec is-capacity">{specCapacity}</span> : null}
            <div className="bbm-card-price-badges">
              <strong className="bbm-card-price"><span>{priceMatch?.[1] ?? ""}{priceMatch?.[2] ?? car.price}</span>{priceMatch ? <span className="bbm-card-price-unit">만원</span> : null}</strong>
              {badges.length ? <div className="bbm-card-badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
            </div>
          </div>
          <div className="bbm-card-meta">
            <div className="bbm-card-location"><img src={bbmIcon("card-location")} alt="" aria-hidden="true" /><span className="bbm-card-location-text"><span>{locationMain}</span>{locationSecondary ? <span className="bbm-card-location-secondary">{locationSecondary}</span> : null}</span></div>
            {/* JOB-8: 모바일도 초톳처럼 판매자 줄을 지역 바로 아래(오른쪽 글 칸 안)에 둔다 */}
            {sellerRow}
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
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLocaleLowerCase("ko-KR");
  const visibleRows = rows.filter((row) => !keyword || `${row.label} ${row.name}`.toLocaleLowerCase("ko-KR").includes(keyword));
  const availableCount = rows.filter((row) => (row.count ?? 0) > 0).length;
  if (!rows.length) return <p className="bbm-maker-empty">모델 정보 없음</p>;
  return (
    <div className="bbm-maker-list is-model-list">
      <div className="bbm-maker-search-wrap"><label className="bbm-maker-search"><img src={bbmIcon("m-header-search")} alt="" aria-hidden="true" /><input value={query} placeholder="모델 검색" aria-label="모델 검색" onChange={(event) => setQuery(event.target.value)} /></label></div>
      <p className="bbm-model-summary">전체 {rows.length.toLocaleString("ko-KR")}개 · 현재 매물 {availableCount.toLocaleString("ko-KR")}개 모델</p>
      {visibleRows.map((row) => (
        <button key={row.name} type="button" className={`bbm-maker-row is-model${selected === row.name ? " is-selected" : ""}${row.count === 0 ? " is-empty" : ""}`} disabled={row.count === 0} onClick={() => onChoose(row.name)}>
          <i className="bbm-model-check" aria-hidden="true" />
          <span className="bbm-maker-name">{row.label}</span>
          {row.count === null ? null : <span className="bbm-maker-count">{row.count.toLocaleString("ko-KR")}</span>}
        </button>
      ))}
      {!visibleRows.length ? <p className="bbm-maker-empty">검색 결과가 없습니다.</p> : null}
    </div>
  );
}
