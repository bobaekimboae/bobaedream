import { useState } from "react";
import { BbmActionBar, BbmCheckGrid, BbmCheckRow, BbmFullFilter, BbmFullItem, BbmModal, BbmPresetChips, BbmRangeInputs, BbmSheet, BbmTabs } from "./bbm-filter-parts";
import { bbmCheckOptions, bbmOptionGroups, bbmRangePresets, bbmSidebarItems } from "./bbm-filter-options";
import { bbmOriginalCounts } from "./bbm-original-counts";
import { countBbmSelections, emptyBbmFilters, setBbmRange, toggleBbmCheck, type BbmCarLike, type BbmCheckKey, type BbmFilterValues } from "./bbm-filter-state";

// QF-076 부품 비교 화면(?bbmparts=1). 원본 캡처(reports/shots/bbm-original/)와 나란히 비교하려고 부품을 한 화면에 모은다.
// 값은 목록 화면과 같은 필터 상태(filters.bbm)를 쓴다(사이드바 모달과 같은 선택 모양). QF-076 범위에서는 목록을 거르지 않는다. 매물 수는 원본 숫자.

type Overlay = null | "modal-check" | "modal-region" | "modal-range" | "modal-option" | "sheet" | "full";

export function BbmPartsGallery({ value, onChange, countWith }: { value: BbmFilterValues; onChange: (next: BbmFilterValues) => void; cars?: BbmCarLike[]; countWith: (bbm: BbmFilterValues) => number }) {
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [draft, setDraft] = useState<BbmFilterValues>(value);
  const [optionTab, setOptionTab] = useState(bbmOptionGroups[0][0]);
  const [priceTab, setPriceTab] = useState<"일반" | "리스 / 렌트">("일반");
  const open = (next: Overlay) => { setDraft(value); setOverlay(next); };
  const close = () => setOverlay(null);
  const confirm = () => { onChange(draft); close(); };
  const checkList = (key: BbmCheckKey, source: BbmFilterValues, set: (next: BbmFilterValues) => void, size: "modal" | "sidebar" = "modal", columns: 1 | 2 = 1) => (
    <BbmCheckGrid columns={columns} label={key}>
      {bbmCheckOptions[key].map((option) => <BbmCheckRow key={option} size={size} label={option} count={bbmOriginalCounts[key]?.[option] ?? null} checked={Boolean(source.checks[key]?.includes(option))} onToggle={() => set(toggleBbmCheck(source, key, option))} />)}
    </BbmCheckGrid>
  );
  const power = draft.ranges.power ?? { min: "", max: "" };
  const actions = (variant: "modal" | "sheet" | "full", confirmStyle: "확인" | "보기" = "확인") => <BbmActionBar variant={variant} confirmStyle={confirmStyle} count={countWith(draft)} onReset={() => setDraft(emptyBbmFilters)} onConfirm={confirm} />;
  return (
    <div className="bbmf-gallery">
      <h1>QF-076 필터 공통 부품</h1>
      <p>개발 시안 원본 실측값으로 만든 부품 모음. 고른 값 {countBbmSelections(value)}개(모양만, 목록은 거르지 않음) · 지금 목록 {countWith(value).toLocaleString("ko-KR")}대</p>
      <div className="bbmf-gallery-grid">
        <section className="bbmf-gallery-card"><h2>체크 행 · 사이드바(상자 17, 수 오른쪽 끝) — 바디타입</h2>{checkList("bodyType", value, onChange, "sidebar")}</section>
        <section className="bbmf-gallery-card"><h2>체크 행 · 모달(상자 20, 수 이름 +8) — 연료</h2>{checkList("fuel", value, onChange)}</section>
        <section className="bbmf-gallery-card"><h2>2열 체크 — 지역</h2>{checkList("region", value, onChange, "modal", 2)}</section>
        <section className="bbmf-gallery-card"><h2>범위 입력 "~" + 구간 칩 2열 — 최고출력</h2><BbmRangeInputs unit="마력" min={value.ranges.power?.min ?? ""} max={value.ranges.power?.max ?? ""} onChange={(range) => onChange(setBbmRange(value, "power", range))} /><div style={{ height: 24 }} /><BbmPresetChips options={bbmRangePresets.power?.presets ?? []} onPick={() => undefined} /></section>
        <section className="bbmf-gallery-card"><h2>범위 입력 두 줄 "부터/까지" + 구간 칩 2열 — 주행거리(사이드바)</h2><BbmRangeInputs unit="km" layout="stack" min={value.ranges.mileage?.min ?? ""} max={value.ranges.mileage?.max ?? ""} onChange={(range) => onChange(setBbmRange(value, "mileage", range))} /><div style={{ height: 16 }} /><BbmPresetChips options={bbmRangePresets.mileage?.presets ?? []} onPick={() => undefined} /></section>
        <section className="bbmf-gallery-card"><h2>탭 — 가격</h2><BbmTabs label="가격 종류" tabs={["일반", "리스 / 렌트"] as const} value={priceTab} onChange={setPriceTab} /></section>
        <section className="bbmf-gallery-card"><h2>버튼 줄 — 모달 · 시트 · 전체 화면</h2>
          <BbmActionBar count={14847} onReset={() => undefined} onConfirm={() => undefined} />
          <BbmActionBar count={14847} variant="sheet" confirmStyle="보기" onReset={() => undefined} onConfirm={() => undefined} />
          <BbmActionBar count={14847} variant="full" confirmStyle="보기" onReset={() => undefined} onConfirm={() => undefined} />
        </section>
        <section className="bbmf-gallery-card"><h2>모달 412 · 바텀시트 · 전체 필터 화면 열기</h2>
          <div className="bbmf-gallery-buttons">
            <button type="button" onClick={() => open("modal-check")}>모달 · 연료</button>
            <button type="button" onClick={() => open("modal-region")}>모달 · 지역(2열)</button>
            <button type="button" onClick={() => open("modal-range")}>모달 · 최고출력</button>
            <button type="button" onClick={() => open("modal-option")}>모달 · 차량 옵션</button>
            <button type="button" onClick={() => open("sheet")}>바텀시트 · 연료</button>
            <button type="button" onClick={() => open("full")}>전체 필터 화면</button>
          </div>
        </section>
      </div>
      {overlay === "modal-check" ? <BbmModal title="연료" onClose={close} footer={actions("modal")}>{checkList("fuel", draft, setDraft)}</BbmModal> : null}
      {overlay === "modal-region" ? <BbmModal title="지역" onClose={close} footer={actions("modal")}>{checkList("region", draft, setDraft, "modal", 2)}</BbmModal> : null}
      {overlay === "modal-range" ? <BbmModal title="최고출력" onClose={close} footer={actions("modal")}><BbmRangeInputs unit="마력" min={power.min} max={power.max} onChange={(range) => setDraft(setBbmRange(draft, "power", range))} /><div style={{ height: 24 }} /><BbmPresetChips options={bbmRangePresets.power?.presets ?? []} onPick={() => undefined} /></BbmModal> : null}
      {overlay === "modal-option" ? (
        <BbmModal title="차량 옵션" wide onClose={close} footer={<BbmActionBar count={0} resetLabel="취소" confirmLabel="선택완료" onReset={close} onConfirm={confirm} />}>
          <div style={{ display: "flex", gap: 16 }}>
            <BbmTabs variant="side" label="옵션 분류" tabs={bbmOptionGroups.map(([name]) => name)} value={optionTab} onChange={setOptionTab} />
            <div style={{ flex: 1 }}><BbmCheckGrid>{(bbmOptionGroups.find(([name]) => name === optionTab)?.[1] ?? []).map((option) => <BbmCheckRow key={option} label={option} count={bbmOriginalCounts.options?.[option] ?? null} checked={Boolean(draft.checks.options?.includes(option))} onToggle={() => setDraft(toggleBbmCheck(draft, "options", option))} />)}</BbmCheckGrid></div>
          </div>
        </BbmModal>
      ) : null}
      {overlay === "sheet" ? <BbmSheet title="연료" onClose={close} footer={actions("sheet", "보기")}>{checkList("fuel", draft, setDraft)}</BbmSheet> : null}
      {overlay === "full" ? (
        <BbmFullFilter onClose={close} footer={actions("full", "보기")} tools={<button type="button" className="bbmf-save-search">검색조건 저장</button>}>
          {["카테고리", "제조사 · 모델", ...bbmSidebarItems.map((item) => item.label)].map((label) => <BbmFullItem key={label} label={label} onOpen={() => undefined} />)}
        </BbmFullFilter>
      ) : null}
    </div>
  );
}
