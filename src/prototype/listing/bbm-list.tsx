import type { KeyboardEvent, ReactNode } from "react";
import { asset, displayListPlace, sellerAvatar, sellerLabel, type Car } from "../data";
import { bbmCardBadges, bbmCardSpec } from "../data/bbm-card-samples";
import "./bbm-tokens.css";

// QF-091: 개발 시안(dev.bbmuseum.co.kr/car/list) 원본과 같은 목록 부품. 수치·아이콘은 원본에서 뽑은 값(bbm-tokens.css, public/assets/bbm/).

export const bbmIcon = (name: string) => asset(`bbm/${name}.svg`);

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

// ── 매물 카드(원본 car-list-result-card). variant pc: 사진 160, 마력 포함 / mobile: 사진 122×120, 마력 없음
export function BbmResultCard({ car, variant, liked, onToggleLike, onOpen, onChat }: { car: Car; variant: "pc" | "mobile"; liked: boolean; onToggleLike: () => void; onOpen: () => void; onChat: () => void }) {
  const seller = sellerLabel(car);
  const badges = bbmCardBadges(car);
  const priceMatch = car.price.match(/^(월\s*)?(.+?)\s*(만원)$/);
  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); }
  };
  return (
    <article className={`bbm-result-card is-${variant}`} role="link" tabIndex={0} aria-label={`${car.title} 상세 보기`} onClick={onOpen} onKeyDown={onKeyDown}>
      <div className="bbm-card-main">
        <div className="bbm-card-photo">
          <img className={car.imageFit === "contain" ? "is-catalog" : ""} src={asset(car.image)} alt={`${car.title} ${car.trim}`} draggable={false} />
          <div className="bbm-card-media-footer" aria-hidden="true"><span className="bbm-card-time">{car.posted.replace(/\s/g, "")}</span><span className="bbm-card-count">{car.photos}<img src={bbmIcon("card-photo-count")} alt="" /></span></div>
        </div>
        <div className="bbm-card-content">
          <div className="bbm-card-text">
            <strong className="bbm-card-title">{car.title} {car.trim}</strong>
            <span className="bbm-card-spec">{bbmCardSpec(car, variant === "pc")}</span>
            <div className="bbm-card-price-badges">
              <strong className="bbm-card-price"><span>{priceMatch?.[1] ?? ""}{priceMatch?.[2] ?? car.price}</span>{priceMatch ? <span className="bbm-card-price-unit">만원</span> : null}</strong>
              {badges.length ? <div className="bbm-card-badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
            </div>
          </div>
          <div className="bbm-card-meta">
            <div className="bbm-card-location"><img src={bbmIcon("card-location")} alt="" aria-hidden="true" /><span className="bbm-card-location-text">{displayListPlace(car.place)}</span></div>
            <div className="bbm-card-meta-row">
              <div className="bbm-card-seller">
                <img className="bbm-card-seller-logo" src={asset(sellerAvatar(car))} alt="" draggable={false} />
                <div className="bbm-card-seller-text"><strong>{seller}</strong>{car.sellerType === "딜러" ? <span className="bbm-card-seller-info"><b>{car.stock}대</b> 판매중</span> : null}</div>
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
