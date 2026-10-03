import { Fragment, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { BbmActionBar, BbmModal } from "../filters/bbm-filter-parts";
import { BBM_MAKER_ITEM, bbmSidebarItems, daangnFilterLabel, splitDaangnFilterOrder, type BbmFilterItem } from "../filters/bbm-filter-options";
import { BbmExpandPanel, BbmModalPanel, clearBbmItem } from "../filters/bbm-filter-panels";
import { PriceFinalSheet } from "../filters/bbm-price";
import type { BbmCheckKey, BbmFilterValues } from "../filters/bbm-filter-state";
import { CategoryBrandLogo } from "./bbm-brand-logos";
import { bbmItemValue } from "../filters/bbm-applied";
import { asset, displayListPlace, displaySpecs, sellerAvatar, sellerLabel, type Car } from "../data";
import { truckFormatImageFor, truckSubtypeImageFor } from "../data/truck-format-catalog";

// 보배드림 개발 시안(bbmuseum) PC 매물리스트 1단계 이식(QF-048~050). 구조·수치·문구만 따르고 코드·이미지는 새로 만든다.

// OP-010: 노션 "베트남 초톳" 아이콘(public/assets/icons/bb/, currentColor). 매핑표는 docs/icon-map.md
type BbIconName = "search" | "mypage" | "heart" | "heart-filled" | "chat" | "notification" | "menu" | "chevron-down" | "filter" | "saved-search" | "view-list" | "location-pin" | "photo-count" | "chevron-left" | "check";

function BbIcon({ name, size = 20, className = "" }: { name: BbIconName; size?: 16 | 20 | 24 | 18 | 12; className?: string }) {
  const style = { "--bb-icon": `url("${asset(`icons/bb/${name}.svg`)}")`, "--bb-size": `${size}px` } as CSSProperties;
  return <span className={`bb-icon ${className}`} style={style} aria-hidden="true" />;
}

const bbGnbItems = ["홈", "전체차량", "중고차", "수입차", "화물/특장차", "건설기계(덤프/지게차)", "캠핑카(모터홈/캐러밴)", "바이크", "부품/용품", "커뮤니티"];
// QF-091: 헤더 아이콘·로고는 개발 시안 원본 파일(public/assets/bbm/)
const bbHeaderIcons: Array<[string, string]> = [["search", "검색"], ["mypage", "마이페이지"], ["heart", "찜"], ["chat", "채팅"], ["notification", "알림"], ["menu", "메뉴"]];
const bbmAsset = (name: string) => asset(`bbm/${name}.svg`);

function BbHeader({ category, onNotify, onOpenFavorites }: { category: string; onNotify: (message: string) => void; onOpenFavorites: () => void }) {
  const activeItem = category === "트럭 · 특장" ? "화물/특장차"
    : category === "건설기계" ? "건설기계(덤프/지게차)"
      : category === "캠핑카" ? "캠핑카(모터홈/캐러밴)"
        : category === "부품 · 용품" ? "부품/용품"
          : category === "수입차" || category === "바이크" ? category : "중고차";
  return (
    <header className="bbm-header" aria-label="보배드림">
      <div className="bbm-header-inner">
        <div className="bbm-header-top">
          {["로그인", "회원가입", "고객센터"].map((label, index) => <span key={label} className="bbm-header-top-item">{index ? <img src={bbmAsset("header-top-divider")} alt="" aria-hidden="true" /> : null}<button type="button" onClick={() => onNotify(`${label}은(는) 정식 서비스에서 이용해 주세요.`)}>{label}</button></span>)}
        </div>
        <button type="button" className="bbm-logo" aria-label="보배드림 처음으로" onClick={() => document.querySelector(".app-screen")?.scrollTo({ top: 0 })}>
          <img src={bbmAsset("header-logo")} alt="보배드림" draggable={false} />
        </button>
        <div className="bbm-gnb-row">
          <nav className="bbm-gnb" aria-label="주 메뉴">
            {bbGnbItems.map((label) => <button key={label} type="button" className={label === activeItem ? "is-active" : ""} aria-current={label === activeItem ? "page" : undefined} onClick={() => label === activeItem ? undefined : onNotify(`${label}은(는) 정식 서비스에서 이용해 주세요.`)}>{label}</button>)}
          </nav>
          <div className="bbm-header-icons">
            {bbHeaderIcons.map(([icon, label]) => <button key={icon} type="button" aria-label={label} onClick={() => icon === "heart" ? onOpenFavorites() : onNotify(`${label}은(는) 정식 서비스에서 이용해 주세요.`)}><img src={bbmAsset(`header-${icon}`)} alt="" aria-hidden="true" /></button>)}
          </div>
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
  onChooseFormat: (format: string) => void;
  onChooseSubtype: (subtype: string) => void;
  onChooseSpec: (spec: string) => void;
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

// QF-067 제조사 → 모델 → 등급 드릴다운. 선택 상태는 목록 화면(퀵필터와 같은 원본)에서 받아서 읽고 쓴다.
type BbModelRow = { name: string; label: string; count: number | null };
type BbGradeGroup = { name: string | null; title: string | null; grades: Array<{ name: string; count: number }>; count?: number };
type BbMakerSelection = {
  maker: string | null;
  model: string | null;
  modelLabel: string | null;
  generation: string | null;
  generationLabel: string | null;
  grades: string[];
  modelsFor: (maker: string) => BbModelRow[];
  gradeGroupsFor: (maker: string, model: string) => BbGradeGroup[];
  onChooseMaker: (maker: string) => void;
  onChooseModel: (model: string) => void;
  onToggleGrade: (generation: string | null, grade: string) => void;
  onClearMaker: () => void;
  onClearModel: () => void;
  onClearGrades: () => void;
  // QF-097(과쯔 카탈로그): 트림이 없는 세부 모델도 한 줄 체크로 고른다. 없으면 기존처럼 트림 있는 묶음만
  onChooseGeneration?: (generation: string) => void;
};
type BbDrillView = { stage: "maker" } | { stage: "model"; maker: string } | { stage: "grade"; maker: string; model: string };

function BbMakerGradeFilter({ selection, view, setView, brandLogos = false, brandLogoCategory, makerSections = bbCatalog }: { selection: BbMakerSelection; view: BbDrillView; setView: (view: BbDrillView) => void; brandLogos?: boolean; brandLogoCategory?: string; makerSections?: BbMakerSection[] }) {
  const { maker, model, grades } = selection;
  const pathChips = [
    maker ? { key: "maker", label: bbMakerLabel(maker), onClear: selection.onClearMaker } : null,
    maker && model ? { key: "model", label: selection.modelLabel ?? model, onClear: selection.onClearModel } : null,
    grades.length ? { key: "grades", label: `등급 ${grades.length}개`, onClear: selection.onClearGrades } : selection.generation ? { key: "grades", label: selection.generationLabel ?? selection.generation, onClear: selection.onClearGrades } : null,
  ].filter((chip): chip is NonNullable<typeof chip> => Boolean(chip));
  const count = (value: number | null) => value === null ? null : <em className={value === 0 ? "is-zero" : ""}>{value.toLocaleString("ko-KR")}</em>;

  return (
    <div className="bbm-maker-grade">
      {pathChips.length ? <div className="bbm-path-chips" aria-label="선택한 제조사·모델·등급">
        {pathChips.map((chip) => <button key={chip.key} type="button" className="bbm-path-chip" aria-label={`${chip.label} 선택 해제`} onClick={chip.onClear}><span>{chip.label}</span><span className="bbm-path-chip-x" aria-hidden="true">×</span></button>)}
      </div> : null}
      <div className="bbm-catalog">
        {view.stage === "maker" ? makerSections.map((section) => (
          <div key={section.title} className="bbm-catalog-section">
            <p className="bbm-catalog-title">{section.title}</p>
            {section.rows.map(([name, rowCount, makerKey]) => {
              const key = makerKey ?? name;
              const selected = maker === key;
              return <button key={`${section.title}-${name}`} type="button" className={`bbm-catalog-row${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => { selection.onChooseMaker(key); setView({ stage: "model", maker: key }); }}>{brandLogos ? <span className="bbm-catalog-name"><CategoryBrandLogo category={brandLogoCategory} name={name} kind="list" initialFallback /><span>{name}</span></span> : <span>{name}</span>}{count(rowCount)}</button>;
            })}
          </div>
        )) : view.stage === "model" ? (
          <div className="bbm-catalog-section is-drill">
            <button type="button" className="bbm-catalog-back" onClick={() => setView({ stage: "maker" })}><BbIcon name="chevron-left" size={20} />{bbMakerLabel(view.maker)}</button>
            {selection.modelsFor(view.maker).length ? selection.modelsFor(view.maker).map((row) => {
              const selected = maker === view.maker && model === row.name;
              return <button key={row.name} type="button" className={`bbm-catalog-row${selected ? " is-selected" : ""}`} aria-pressed={selected} onClick={() => { selection.onChooseModel(row.name); setView({ stage: "grade", maker: view.maker, model: row.name }); }}><span>{row.label}</span>{count(row.count)}</button>;
            }) : <p className="bbm-catalog-empty">모델 정보 없음</p>}
          </div>
        ) : (
          <div className="bbm-catalog-section is-drill">
            <button type="button" className="bbm-catalog-back" onClick={() => setView({ stage: "model", maker: view.maker })}><BbIcon name="chevron-left" size={20} />{selection.modelsFor(view.maker).find((row) => row.name === view.model)?.label ?? view.model}</button>
            {(() => {
              const groups = selection.gradeGroupsFor(view.maker, view.model).filter((group) => group.grades.length || (selection.onChooseGeneration && group.name));
              if (!groups.length) return <p className="bbm-catalog-empty">등급 정보 없음</p>;
              return groups.map((group) => !group.grades.length && group.name ? (() => {
                const checked = model === view.model && selection.generation === group.name;
                return (
                  <button key={group.name} type="button" role="checkbox" aria-checked={checked} disabled={group.count === 0} className={`bbm-grade-row${checked ? " is-checked" : ""}`} onClick={() => selection.onChooseGeneration?.(group.name!)}>
                    <span className="bbm-checkbox" aria-hidden="true">{checked ? <BbIcon name="check" size={16} /> : null}</span>
                    <span className="bbm-grade-name">{group.title}</span>
                    {group.count !== undefined ? count(group.count) : null}
                  </button>
                );
              })() : (
                <div key={group.name ?? "direct"} className="bbm-grade-group">
                  {group.title ? <p className="bbm-catalog-title">{group.title}</p> : null}
                  {group.grades.map((grade) => {
                    const checked = model === view.model && grades.includes(grade.name) && (!group.name || selection.generation === group.name);
                    return (
                      <button key={`${group.name}-${grade.name}`} type="button" role="checkbox" aria-checked={checked} disabled={grade.count === 0} className={`bbm-grade-row${checked ? " is-checked" : ""}`} onClick={() => selection.onToggleGrade(group.name, grade.name)}>
                        <span className="bbm-checkbox" aria-hidden="true">{checked ? <BbIcon name="check" size={16} /> : null}</span>
                        <span className="bbm-grade-name">{grade.name}</span>
                        {count(grade.count)}
                      </button>
                    );
                  })}
                </div>
              ));
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

type BbTruckView = "format" | "subtype" | "spec";

const inlineTruckPayloadSubtypes = new Set(["경형 트럭 (1톤 미만)", "1톤 트럭"]);

function BbTruckOptionLabel({ name, image }: { name: string; image: string | null }) {
  return <span className="bbm-truck-option">{image ? <span className="bbm-truck-option-image"><img src={asset(image)} alt="" draggable={false} /></span> : null}<span className="bbm-truck-option-name">{name}</span></span>;
}

export function BbTruckFormatFilter({ value, showImages = true }: { value: BbTruckFilter; showImages?: boolean }) {
  const stageFor = (): BbTruckView => !value.format
    ? "format"
    : !value.subtype || inlineTruckPayloadSubtypes.has(value.subtype)
      ? "subtype"
      : value.specGroups.length ? "spec" : "subtype";
  const [view, setView] = useState<BbTruckView>(stageFor);
  useEffect(() => { setView(stageFor()); }, [value.format, value.subtype, value.spec, value.specGroups.length]);
  const count = (rowCount: number) => <em className={rowCount === 0 ? "is-zero" : ""}>{rowCount.toLocaleString("ko-KR")}</em>;
  const pathChips = [
    value.format ? { key: "format", label: value.format, clear: value.onClearFormat } : null,
    value.subtype ? { key: "subtype", label: value.subtype, clear: value.onClearSubtype } : null,
    value.spec ? { key: "spec", label: value.spec, clear: value.onClearSpec } : null,
  ].filter((chip): chip is NonNullable<typeof chip> => Boolean(chip));

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
                <BbTruckOptionLabel name={option.name} image={image} />
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
function BbFilterSidebar({ selection, appliedCount, historyCount, onReset, onNotify, bbm, onBbmChange, countWithBbm, countOf, resetSignal = 0, brandLogos = false, brandLogoCategory, makerSections = bbCatalog, order = bbFilterMenuOriginal, mileageFinal = false, priceFinal = false, truckFilter, collapsible = false }: { mileageFinal?: boolean; priceFinal?: boolean; order?: string[]; selection: BbMakerSelection; appliedCount: number; historyCount?: number; onReset: () => void; onNotify: (message: string) => void; bbm: BbmFilterValues; onBbmChange: (next: BbmFilterValues) => void; countWithBbm: (next: BbmFilterValues) => number; countOf?: (key: BbmCheckKey, option: string) => number | null; resetSignal?: number; brandLogos?: boolean; brandLogoCategory?: string; makerSections?: BbMakerSection[]; truckFilter?: BbTruckFilter; collapsible?: boolean }) {
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
  const [openItems, setOpenItems] = useState<string[]>([]);
  const [keepSearch, setKeepSearch] = useState(false);
  const { maker, model } = selection;
  const [view, setView] = useState<BbDrillView>(() => maker && model ? { stage: "grade", maker, model } : maker ? { stage: "model", maker } : { stage: "maker" });
  // 퀵필터·상단 칩에서 바뀐 선택을 사이드바 단계에 반영(같은 단계로 열기)
  useEffect(() => {
    setView(maker && model ? { stage: "grade", maker, model } : maker ? { stage: "model", maker } : { stage: "maker" });
  }, [maker, model]);
  useEffect(() => {
    setOpenItems((current) => current.filter((item) => item !== truckFilterLabel));
  }, [hasTruckFilter]);
  const toggle = (label: string) => setOpenItems((current) => current.includes(label) ? current.filter((item) => item !== label) : [...current, label]);
  const collapsedPath = [
    maker ? bbMakerLabel(maker) : null,
    maker && model ? selection.modelLabel ?? model : null,
    selection.grades.length ? `등급 ${selection.grades.length}개` : selection.generation ? selection.generationLabel ?? selection.generation : null,
  ].filter(Boolean).join(" › ");
  const { primary: primaryFilterOrder, secondary: secondaryFilterOrder } = splitDaangnFilterOrder(order);
  const renderFilterItem = (label: string) => {
    const open = openItems.includes(label);
    const isMaker = label === bbMakerItem;
    const filterItem = bbFilterItemByLabel.get(label);
    const displayLabel = truckFilter && isMaker
      ? "브랜드"
      : truckFilter && label === "차량번호 / 판매자"
        ? "차량번호/판매자 이름"
        : daangnFilterLabel(label);
    const applied = isMaker ? Boolean(maker) : Boolean(bbmItemValue(label, bbm));
    return (
      <Fragment key={label}>
        <section className={`bbm-filter-item${open ? " is-open" : ""}${isMaker ? " is-maker-grade" : ""}${applied ? " is-applied" : ""}`}>
          <button type="button" className="bbm-filter-toggle" aria-expanded={filterItem?.mode === "modal" || priceFinal && label === "가격" ? undefined : open} aria-haspopup={filterItem?.mode === "modal" || priceFinal && label === "가격" ? "dialog" : undefined} onClick={() => { if (priceFinal && label === "가격") setPriceOpen(true); else if (filterItem?.mode === "modal") openModal(filterItem); else toggle(label); }}>
            <span className="bbm-filter-label"><span className="bbm-filter-label-text">{label === "전기차 주행 가능 거리" ? <img className="bbm-filter-label-icon" src={bbmAsset("filter-ev-range")} alt="" aria-hidden="true" /> : null}{displayLabel}</span>{isMaker && !open && collapsedPath ? <small className="bbm-filter-path">{collapsedPath}</small> : null}</span>
            <img className="bbm-filter-chevron" src={bbmAsset("filter-chevron")} alt="" aria-hidden="true" />
          </button>
          {isMaker && maker ? <button type="button" className="bbm-filter-item-reset" onClick={selection.onClearMaker}>초기화</button> : null}
          {open ? (isMaker ? <BbMakerGradeFilter selection={selection} view={view} setView={setView} brandLogos={brandLogos} brandLogoCategory={brandLogoCategory} makerSections={makerSections} /> : <BbmExpandPanel label={label} value={bbm} onChange={onBbmChange} countOf={countOf} mileageFinal={mileageFinal} />) : null}
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
        <span className="bbm-filter-label"><span className="bbm-filter-label-text">{truckFilterLabel}</span>{!open && path ? <small className="bbm-filter-path">{path}</small> : null}</span>
        <img className="bbm-filter-chevron" src={bbmAsset("filter-chevron")} alt="" aria-hidden="true" />
      </button>
      {truckFilter.format ? <button type="button" className="bbm-filter-item-reset" onClick={truckFilter.onClearFormat}>초기화</button> : null}
      {open ? <BbTruckFormatFilter value={truckFilter} /> : null}
    </section>;
  };
  if (collapsible && sidebarCollapsed) {
    return <aside className="bbm-filter is-collapsed" aria-label="필터 접힘">
      <button type="button" className="bbm-filter-expand" aria-label="좌측 필터 펼치기" onClick={() => setSidebarCollapsed(false)}><span aria-hidden="true">›</span><strong>필터</strong></button>
    </aside>;
  }
  return (
    <aside className="bbm-filter" aria-label="필터">
      <div className="bbm-filter-summary">
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
      </div>
      <div className="bbm-filter-menu">
        <div className="bbm-filter-status">
          <span>상태</span>
          <label><BbSwitch checked={availableOnly} label="거래 가능만 보기" onChange={() => setAvailableOnly((value) => !value)} /><strong>거래 가능만 보기</strong></label>
        </div>
        {primaryFilterOrder.map(renderFilterItem)}
        <button type="button" className="bbm-filter-more-toggle" aria-expanded={moreFiltersOpen} onClick={() => setMoreFiltersOpen((value) => !value)}><span>{moreFiltersOpen ? "필터 접기" : "필터 더보기"}</span><i aria-hidden="true" /></button>
        {moreFiltersOpen ? <>
          {renderTruckFormat()}
          {truckFilter ? <div className="bbm-filter-group-title">추가 필터</div> : null}
          {secondaryFilterOrder.map(renderFilterItem)}
          {primaryFilterOrder.includes(bbMakerItem) ? <div className="bbm-filter-action"><button type="button" className="bbmf-exclude" onClick={() => onNotify("제조사·모델 제외하기는 정식 서비스에서 이용해 주세요.")}><i className="bbmf-circle-icon is-minus" aria-hidden="true" />제조사·모델 제외하기</button></div> : null}
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
      {priceOpen ? <PriceFinalSheet variant="modal" value={bbm} countOf={countWithBbm} onApply={onBbmChange} onClose={() => setPriceOpen(false)} /> : null}
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
          <div className="bbm-card-media-footer" aria-hidden="true"><span>{car.posted}</span><span className="bbm-card-count">{car.photos}<BbIcon name="photo-count" size={12} /></span></div>
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
              <button type="button" aria-label={`${seller}에게 채팅`} onClick={(event) => { event.stopPropagation(); onNotify("채팅은 정식 서비스에서 이용해 주세요."); }}><BbIcon name="chat" size={24} /></button>
              <button type="button" className={liked ? "is-liked" : ""} aria-label={`${car.title} ${liked ? "찜 해제" : "찜"}`} aria-pressed={liked} onClick={(event) => { event.stopPropagation(); onToggleLike(); }}><BbIcon name={liked ? "heart-filled" : "heart"} size={24} /></button>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export { bbCatalog, bbMakerLabel, BbIcon, BbHeader, BbFilterSidebar, BbSwitch, BbCarCard, type BbMakerSelection, type BbModelRow, type BbGradeGroup, type BbMakerSection };
