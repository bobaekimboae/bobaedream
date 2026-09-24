import { useState, type CSSProperties, type KeyboardEvent } from "react";
import { asset, displayListPlace, displaySpecs, sellerAvatar, sellerLabel, type Car } from "../data";

// 보배드림 개발 시안(bbmuseum) PC 매물리스트 1단계 이식(QF-048~050). 구조·수치·문구만 따르고 코드·이미지는 새로 만든다.

// OP-010: 노션 "베트남 초톳" 아이콘(public/assets/icons/bb/, currentColor). 매핑표는 docs/icon-map.md
type BbIconName = "search" | "mypage" | "heart" | "heart-filled" | "chat" | "notification" | "menu" | "chevron-down" | "filter" | "saved-search" | "view-list" | "location-pin" | "photo-count";

function BbIcon({ name, size = 20, className = "" }: { name: BbIconName; size?: 16 | 20 | 24 | 18 | 12; className?: string }) {
  const style = { "--bb-icon": `url("${asset(`icons/bb/${name}.svg`)}")`, "--bb-size": `${size}px` } as CSSProperties;
  return <span className={`bb-icon ${className}`} style={style} aria-hidden="true" />;
}

const bbGnbItems = ["숏폼카", "중고차", "수입차", "매물등록", "중고차딜러", "커뮤니티"];
const bbHeaderIcons: Array<[BbIconName, string]> = [["search", "검색"], ["mypage", "마이페이지"], ["heart", "찜"], ["chat", "채팅"], ["notification", "알림"], ["menu", "메뉴"]];

function BbHeader({ onNotify, onOpenFavorites }: { onNotify: (message: string) => void; onOpenFavorites: () => void }) {
  return (
    <header className="bbm-header" aria-label="보배드림">
      <div className="bbm-header-inner">
        <div className="bbm-header-top">
          {["로그인", "회원가입", "고객센터"].map((label) => <button key={label} type="button" onClick={() => onNotify(`${label}은(는) 정식 서비스에서 이용해 주세요.`)}>{label}</button>)}
        </div>
        <button type="button" className="bbm-logo" aria-label="보배드림 처음으로" onClick={() => document.querySelector(".app-screen")?.scrollTo({ top: 0 })}>
          <span><img src={asset("pc-detail/9546-imgGroup.svg")} alt="" draggable={false} /></span>
          <img src={asset("pc-detail/9546-imgLogo.svg")} alt="보배드림" draggable={false} />
        </button>
        <div className="bbm-gnb-row">
          <nav className="bbm-gnb" aria-label="주 메뉴">
            {bbGnbItems.map((label) => <button key={label} type="button" className={label === "중고차" ? "is-active" : ""} aria-current={label === "중고차" ? "page" : undefined} onClick={() => label === "중고차" ? undefined : onNotify(`${label}은(는) 정식 서비스에서 이용해 주세요.`)}>{label}</button>)}
            <button type="button" className="bbm-gnb-more" onClick={() => onNotify("더보기는 정식 서비스에서 이용해 주세요.")}>더보기<BbIcon name="chevron-down" size={18} /></button>
          </nav>
          <div className="bbm-header-icons">
            {bbHeaderIcons.map(([icon, label]) => <button key={icon} type="button" aria-label={label} onClick={() => icon === "heart" ? onOpenFavorites() : onNotify(`${label}은(는) 정식 서비스에서 이용해 주세요.`)}><BbIcon name={icon} size={24} /></button>)}
          </div>
        </div>
      </div>
    </header>
  );
}

// 원본 좌측 필터 27개 항목(순서 그대로). 1단계는 제조사·모델만 펼침 내용을 만든다.
const bbFilterMenu = ["바디타입", "차급", "제조사 · 모델", "연식", "주행거리", "가격", "지역", "매매단지", "인승", "구동방식", "성능 · 보험", "판매자 구분", "판매방식", "외부색상", "시트색상", "연료", "변속기", "옵션", "최고출력", "연비", "배기량", "공차중량", "크기", "전기차 주행 가능 거리", "차량 특징", "광고기간", "차량번호 / 판매자"];

type CatalogRow = [label: string, count: number, maker?: string];
// 원본 제조사 목록·매물 수(2026-09-24 기준). maker는 우리 시안 데이터의 제조사 이름(다르면 지정)
const bbCatalog: Array<{ title: string; rows: CatalogRow[] }> = [
  { title: "국산차", rows: [["현대", 2697], ["제네시스", 1503], ["기아", 2352], ["쉐보레(국산)", 288, "쉐보레"], ["GM대우", 69], ["르노코리아(삼성)", 302, "르노코리아"], ["KG모빌리티(쌍용)", 390, "KG모빌리티"], ["어울림모터스", 1], ["기타 국산차", 6]] },
  { title: "수입차 인기", rows: [["벤츠", 1973], ["포르쉐", 899], ["BMW", 841], ["페라리", 541], ["람보르기니", 331], ["롤스로이스", 312]] },
  { title: "수입차 이름순", rows: [["BMW", 841], ["BYD", 0], ["DS", 0], ["GMC", 78], ["닛산", 10], ["다이하쓰", 3], ["닷지", 75], ["동펑", 2], ["란치아", 0], ["람보르기니", 331], ["랜드로버", 303], ["렉서스", 61], ["로버", 1], ["로터스", 11], ["롤스로이스", 312], ["르노", 1], ["링컨", 36], ["마세라티", 118], ["마이바흐", 13], ["마쯔다", 5], ["맥라렌", 97], ["머큐리", 0], ["모건", 1], ["미니", 76], ["미쓰비시", 1], ["미쯔오카", 6], ["벤츠", 1973], ["벤틀리", 305], ["볼보", 45], ["부가티", 1], ["북기은상", 0], ["뷰익", 0], ["비이스만", 0], ["사브", 4], ["새턴", 0], ["선롱", 0], ["쉐보레", 76], ["스마트", 11], ["스바루", 3], ["스즈키", 20], ["스카니아", 0], ["스파이커", 0], ["시트로엥", 3], ["아우디", 221], ["알파로메오", 3], ["알핀", 2], ["애스턴마틴", 70], ["어큐라", 0], ["오스틴", 0], ["오펠", 0], ["올즈모빌", 0], ["웨스트필드", 0], ["이네오스", 1], ["이베코", 9], ["이스즈", 0], ["인피니티", 12], ["재규어", 68], ["지프", 95], ["캐딜락", 88], ["코닉세크", 0, "코닉세그"], ["크라이슬러", 9], ["테슬라", 59], ["토요타", 52], ["파가니", 0], ["페라리", 541], ["포드", 152], ["포르쉐", 899], ["포톤", 0], ["폭스바겐", 50], ["폰티악", 1], ["폴스타", 3], ["푸조", 5], ["피스커", 0], ["피아트", 19], ["허머", 20], ["혼다", 12], ["홀덴", 0], ["히노", 0], ["기타 수입차", 25]] },
];

function BbSwitch({ checked, label, onChange }: { checked: boolean; label: string; onChange: () => void }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className={`bbm-switch${checked ? " is-on" : ""}`} onClick={onChange}><span /></button>;
}

function BbFilterSidebar({ maker, onChooseMaker, onReset, onNotify }: { maker: string | null; onChooseMaker: (maker: string | null) => void; onReset: () => void; onNotify: (message: string) => void }) {
  const [openItems, setOpenItems] = useState<string[]>(["제조사 · 모델"]);
  const [keepSearch, setKeepSearch] = useState(false);
  const toggle = (label: string) => setOpenItems((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]);
  return (
    <aside className="bbm-filter" aria-label="필터">
      <div className="bbm-filter-summary">
        <div className="bbm-filter-summary-top"><strong>필터</strong><button type="button" className="bbm-filter-reset" onClick={onReset}>초기화</button></div>
        <div className="bbm-filter-summary-tools">
          <label className="bbm-filter-keep"><BbSwitch checked={keepSearch} label="검색조건 유지" onChange={() => setKeepSearch((value) => !value)} /><span>검색조건 유지</span></label>
          <button type="button" className="bbm-filter-history" onClick={() => onNotify("최근 검색 기록이 없습니다.")}>최근검색기록 <b>0</b></button>
        </div>
      </div>
      <div className="bbm-filter-menu">
        {bbFilterMenu.map((label) => {
          const open = openItems.includes(label);
          return (
            <section key={label} className={`bbm-filter-item${open ? " is-open" : ""}`}>
              <button type="button" className="bbm-filter-toggle" aria-expanded={open} onClick={() => toggle(label)}><span>{label}</span><BbIcon name="chevron-down" size={20} className="bbm-filter-chevron" /></button>
              {open ? (label === "제조사 · 모델" ? (
                <div className="bbm-catalog">
                  {bbCatalog.map((section) => (
                    <div key={section.title} className="bbm-catalog-section">
                      <p className="bbm-catalog-title">{section.title}</p>
                      {section.rows.map(([name, count, makerKey]) => {
                        const key = makerKey ?? name;
                        const selected = maker === key;
                        return (
                          <button key={`${section.title}-${name}`} type="button" className={`bbm-catalog-row${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => onChooseMaker(selected ? null : key)}>
                            <span>{name}</span><em className={count === 0 ? "is-zero" : ""}>{count.toLocaleString("ko-KR")}</em>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ) : <p className="bbm-filter-pending">준비 중</p>) : null}
            </section>
          );
        })}
      </div>
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
          <div className="bbm-card-media-footer" aria-hidden="true"><span>{car.posted}</span><span className="bbm-card-count">{car.photos}<BbIcon name="photo-count" size={12} /></span></div>
        </div>
        <div className="bbm-card-content">
          <h2 className="bbm-card-title">{car.title} {car.trim}</h2>
          <p className="bbm-card-spec">{specs}</p>
          <div className="bbm-card-price-row">
            <p className="bbm-card-price">{priceMatch?.[1] ?? ""}{priceMatch?.[2] ?? car.price}{priceMatch ? <span>만원</span> : null}</p>
            {badges.length ? <div className="bbm-card-badges">{badges.map((badge) => <span key={badge}>{badge}</span>)}</div> : null}
          </div>
          <p className="bbm-card-location"><BbIcon name="location-pin" size={16} />{displayListPlace(car.place)}</p>
          <div className="bbm-card-meta">
            <div className="bbm-card-seller">
              <img src={asset(sellerAvatar(car))} alt="" draggable={false} />
              <span className="bbm-card-seller-name">{seller}</span>
              {car.sellerType === "딜러" ? <span className="bbm-card-seller-info"><b>{car.stock}대</b> 판매중</span> : null}
            </div>
            <div className="bbm-card-actions">
              <button type="button" aria-label={`${seller}에게 채팅`} onClick={(event) => { event.stopPropagation(); onNotify("채팅은 정식 서비스에서 이용해 주세요."); }}><BbIcon name="chat" size={24} /></button>
              <button type="button" className={liked ? "is-liked" : ""} aria-label={`${car.title} ${liked ? "찜 해제" : "찜"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}><BbIcon name={liked ? "heart-filled" : "heart"} size={24} /></button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export { BbIcon, BbHeader, BbFilterSidebar, BbSwitch, BbCarCard };
