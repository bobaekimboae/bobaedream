// AutoScout24 메인 검색 카드 응용 (2026-10-18 「오토스카우트24 검색을 응용해봐」)
// AutoScout24.de 1536 실측: 흰 카드 반경 16 · 안쪽 24/32 · 차종 탭(현재 20/700, 나머지 16/400, 간격 32)
// → 한 줄 3칸(제조사·모델 / 지역 / 「N Treffer」 버튼, 각 높이 40 · 간격 8) → 버튼 아래 「Weitere Suchoptionen」
// → 「Finde …」 제목 16/700 + 바디타입 그림 8칸(그림 120×73 · 이름 16/600).
// 제조사·모델 칸은 가운데 창(뒤로 · 제목 · 닫기 / 검색 / 인기 제조사 목록 + 꺾쇠 / 아래 「Löschen」 + 「N Treffer」)으로 연다.
// 보배드림은 버튼 색을 AutoScout24 청록 대신 브랜드 파랑으로 쓴다. 대수는 메인 화면에 실린 가상 매물 기준이다.
import { useEffect, useMemo, useRef, useState } from "react";
import type { LuxuryListingRow } from "../prototype/data/luxury-category-v01";

const pic = (...parts: string[]) => parts.join("/");

type TabKey = "중고차" | "수입차" | "트럭 · 특장" | "바이크" | "캠핑카" | "건설기계" | "부품 · 용품";
const tabs: TabKey[] = ["중고차", "수입차", "트럭 · 특장", "바이크", "캠핑카", "건설기계", "부품 · 용품"];

const carBodies = [
  ["SUV · 픽업", "suv", "SUV"],
  ["세단", "sedan", "세단"],
  ["왜건", "wagon", "왜건"],
  ["해치백", "hatchback", "해치백"],
  ["RV · 승합", "minivan", "RV"],
  ["쿠페", "coupe", "쿠페"],
  ["컨버터블", "convertible", "컨버터블"],
  ["화물 · 밴", "truck", "밴"],
].map(([label, file, value]) => ({ label, value, src: pic("prototypes", "autotrader-bobaedream-main", "autotrader-body-types-v2", `${file}.png`) }));
const truckTypes = [
  ["카고", "cargo"], ["윙바디", "wingbody"], ["냉장 · 냉동", "reefer"], ["덤프", "dump"],
  ["크레인", "crane"], ["탱크로리", "tanker"], ["트랙터", "tractor"], ["버스", "bus"],
].map(([label, file]) => ({ label, value: label, src: pic("assets", "truck", "types", "autoscout-v01", `${file}.png`) }));
const bikeTypes = [
  ["네이키드", "naked"], ["스쿠터", "scooter"], ["스포츠", "sport"], ["멀티퍼포즈", "multipurpose"],
  ["크루저", "cruiser"], ["클래식", "classic"], ["투어러", "tourer"], ["오프로드", "offroad"],
].map(([label, file]) => ({ label, value: label, src: pic("assets", "bike", "types", "autoscout-v01", `${file}.png`) }));

const typeRow: Partial<Record<TabKey, { title: string; items: Array<{ label: string; value: string; src: string }> }>> = {
  중고차: { title: "바디타입으로 중고차 찾기", items: carBodies },
  수입차: { title: "바디타입으로 수입차 찾기", items: carBodies },
  "트럭 · 특장": { title: "형식으로 트럭 찾기", items: truckTypes },
  바이크: { title: "장르로 바이크 찾기", items: bikeTypes },
};

const categoryOf: Record<TabKey, string> = {
  중고차: "중고차", 수입차: "수입차", "트럭 · 특장": "트럭 · 특장", 바이크: "바이크", 캠핑카: "캠핑카", 건설기계: "건설기계", "부품 · 용품": "부품 · 용품",
};

const regions = ["전국", "서울", "경기", "인천", "부산", "대구", "대전", "광주", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

type Props = {
  rows: readonly LuxuryListingRow[];
  placeOf: (row: LuxuryListingRow) => string;
  listingUrl: (params: Record<string, string>) => string;
};

export default function As24SearchCard({ rows, placeOf, listingUrl }: Props) {
  const [tab, setTab] = useState<TabKey>("중고차");
  const [maker, setMaker] = useState("");
  const [model, setModel] = useState("");
  const [region, setRegion] = useState("전국");
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"maker" | "model">("maker");
  const [draftMaker, setDraftMaker] = useState("");
  const [draftModel, setDraftModel] = useState("");
  const [keyword, setKeyword] = useState("");
  const opener = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);

  // 메인에 실린 가상 매물은 수입 승용뿐이라 「중고차 · 수입차」 탭에서만 대수를 센다
  const hasData = tab === "중고차" || tab === "수입차";
  const regionOf = (row: LuxuryListingRow) => placeOf(row).split(" ")[0];
  const countWhere = (mk: string, md: string, rg: string) =>
    rows.filter((r) => (!mk || r.maker === mk) && (!md || r.model === md) && (rg === "전국" || regionOf(r) === rg)).length;
  const makers = useMemo(() => {
    const map = new Map<string, number>();
    rows.forEach((r) => map.set(r.maker, (map.get(r.maker) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [rows]);
  const modelsOf = (mk: string) => {
    const map = new Map<string, number>();
    rows.filter((r) => r.maker === mk).forEach((r) => map.set(r.model, (map.get(r.model) ?? 0) + 1));
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };
  const count = countWhere(maker, model, region);
  const draftCount = countWhere(draftMaker, draftModel, region);

  const openPicker = () => {
    setDraftMaker(maker);
    setDraftModel(model);
    setStep(maker ? "model" : "maker");
    setKeyword("");
    setOpen(true);
  };
  const closePicker = () => { setOpen(false); opener.current?.focus(); };
  const applyPicker = () => { setMaker(draftMaker); setModel(draftModel); closePicker(); };

  useEffect(() => {
    if (!open) return undefined;
    closeBtn.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closePicker(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const go = () => {
    const params: Record<string, string> = { category: categoryOf[tab] };
    if (hasData && maker) params.maker = maker;
    if (hasData && model) params.model = model;
    if (region !== "전국") params.region = region;
    window.location.href = listingUrl(params);
  };

  const pickerLabel = !hasData ? "제조사 · 모델" : maker ? (model ? `${maker} ${model}` : maker) : "제조사 · 모델";
  const row = typeRow[tab];
  const q = keyword.trim();
  const makerList = makers.filter(([m]) => !q || m.includes(q));
  const modelList = draftMaker ? modelsOf(draftMaker).filter(([m]) => !q || m.includes(q)) : [];

  return (
    <section className="as24" aria-label="차량 검색">
      <div className="as24-tabs" role="tablist" aria-label="차종">
        {tabs.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "is-on" : ""}
            onClick={() => { setTab(t); setMaker(""); setModel(""); }}>{t}</button>
        ))}
      </div>
      <div className="as24-capsule">
        <button ref={opener} type="button" className="as24-seg" onClick={openPicker} disabled={!hasData} aria-haspopup="dialog">
          <small>제조사 · 모델</small>
          <span className={hasData && maker ? "is-filled" : ""}>{hasData && maker ? pickerLabel : hasData ? "전체" : "준비 중"}</span>
        </button>
        <label className="as24-seg as24-region">
          <small>지역</small>
          <span className={region !== "전국" ? "is-filled" : ""}>{region}</span>
          <select value={region} onChange={(e) => setRegion(e.currentTarget.value)} aria-label="지역">
            {regions.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <button type="button" className="as24-cta" onClick={go}>{hasData ? `${count.toLocaleString("ko-KR")}대 보기` : "매물 보기"}</button>
      </div>
      {row ? (
        <>
          <div className="as24-types" aria-label={row.title}>
            {row.items.map((it) => (
              <a key={it.label} href={listingUrl({ category: categoryOf[tab], body: it.value })}>
                <span><img src={it.src} alt="" loading="lazy" /></span>
                {it.label}
              </a>
            ))}
          </div>
        </>
      ) : null}
      <a className="as24-more" href={listingUrl({ category: categoryOf[tab] })}>상세 조건으로 검색</a>

      {open ? (
        <div className="as24-layer">
          <button type="button" className="as24-dim" aria-label="닫기" onClick={closePicker} />
          <div className="as24-modal" role="dialog" aria-modal="true" aria-labelledby="as24-modal-title">
            <header>
              {step === "model" ? (
                <button type="button" className="as24-icon" aria-label="제조사로 돌아가기" onClick={() => { setStep("maker"); setKeyword(""); }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              ) : <span className="as24-icon" />}
              <h2 id="as24-modal-title">{step === "maker" ? "제조사" : `${draftMaker} 모델`}</h2>
              <button ref={closeBtn} type="button" className="as24-icon" aria-label="닫기" onClick={closePicker}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
              </button>
            </header>
            <div className="as24-modal-search">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="#595959" strokeWidth="1.8" /><path d="m20 20-4-4" stroke="#595959" strokeWidth="1.8" strokeLinecap="round" /></svg>
              <input value={keyword} onChange={(e) => setKeyword(e.currentTarget.value)} placeholder={step === "maker" ? "제조사 검색" : "모델 검색"} aria-label={step === "maker" ? "제조사 검색" : "모델 검색"} />
            </div>
            <div className="as24-modal-body">
              <h3>{step === "maker" ? "인기 제조사" : "모델"}</h3>
              <ul>
                {step === "model" ? (
                  <li><button type="button" className={!draftModel ? "is-on" : ""} onClick={() => setDraftModel("")}><span>{draftMaker} 전체</span><em>{countWhere(draftMaker, "", region)}</em></button></li>
                ) : null}
                {(step === "maker" ? makerList : modelList).map(([name, n]) => {
                  const on = step === "maker" ? draftMaker === name : draftModel === name;
                  return (
                    <li key={name}>
                      <button type="button" className={on ? "is-on" : ""} onClick={() => {
                        if (step === "maker") { setDraftMaker(name); setDraftModel(""); setStep("model"); setKeyword(""); }
                        else setDraftModel(name);
                      }}>
                        <span>{name}</span><em>{n}</em>
                        {step === "maker" ? <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg> : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <footer>
              <button type="button" className="as24-reset" disabled={!draftMaker} onClick={() => { setDraftMaker(""); setDraftModel(""); setStep("maker"); }}>초기화</button>
              <button type="button" className="as24-cta" onClick={applyPicker}>{draftCount.toLocaleString("ko-KR")}대 보기</button>
            </footer>
          </div>
        </div>
      ) : null}
    </section>
  );
}
