import { useEffect, useState } from "react";
import "./build-badge.css";

// OP-011: 주소에 &debug=1 이 있을 때만 화면 오른쪽 아래에 "브랜치 @ 커밋 7자리 · 빌드 시각"을 작게 보여 준다.
// 값은 빌드할 때 scripts/build-info.mjs 가 넣는다(개발 서버에서는 "dev").
const env = import.meta.env as Record<string, string | undefined>;
export const buildInfo = { branch: env.VITE_BUILD_BRANCH ?? "dev", commit: env.VITE_BUILD_COMMIT ?? "dev", time: env.VITE_BUILD_TIME ?? "" };
const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

// QF-106 슬롯 체크 박스 3종(docs/stable-top-manual.md §6). 켠 상태는 브라우저 저장소에 기억(못 쓰면 꺼진 상태로 시작). 레이아웃은 바꾸지 않는다
//  · 로고·이미지 칸: 로고 상자(40·36 · 48×28) · 이미지 칸 56×28 · 목록 24×24 에 빨강 점선 + 세로 중심선(outline · 배경만) — 이전 "로고 칸 안내선"
//  · 층 상자: ①~⑤ 층 상자 테두리 + 층 번호(파랑 점선 #2F6FEB) — 화면 위 고정 겹층(pointer-events 없음)에 그린다
//  · 간격 숫자: 층 사이 간격 · PC 카드 높이(매뉴얼과 같으면 초록, 다르면 빨강)
//  위반(넘침 · 간격 불일치 · 허용 높이 아님 · 줄바꿈)은 그 칸·층에 빨간 점 8px + 짧은 이유
type ToggleKey = "logo" | "layers" | "gaps";
const STORE: Record<ToggleKey, string> = { logo: "qf-logo-guides", layers: "qf-layer-boxes", gaps: "qf-layer-gaps" };
const LABELS: Record<ToggleKey, string> = { logo: "로고·이미지 칸", layers: "층 상자", gaps: "간격 숫자" };
const read = (key: ToggleKey) => { try { return window.localStorage.getItem(STORE[key]) === "1"; } catch { return false; } };
const write = (key: ToggleKey, on: boolean) => { try { window.localStorage.setItem(STORE[key], on ? "1" : "0"); } catch { /* 저장소를 못 쓰면 기억하지 않는다 */ } };
const GUIDE_BOXES = ".kr-brand-logo.is-rail, .kr-brand-logo.is-list, .kr-brand-logo.is-plain, .depth-card-media:not(.is-brand), .bbm-quick-slot .bbm-category-menu__icon-box, .bbm-m-quick-slot .bbm-category-menu__icon-box";

// 매뉴얼 v1.3 층 표(scripts/stability-check.mjs 와 같은 값). PC 0층 경로는 카드 밖: 상단 메뉴 아래 16 · 경로 → 카드 12
const PC_LAYERS = [
  { id: "①", sel: ".bbm-ct-title-row", h: 32, gap: 16 },
  { id: "②", sel: ".bbm-ct-chip-row", h: 32, gap: 18 },
  { id: "③", sel: ".bbm-ct-region-row", h: 32, gap: 18 },
  { id: "④", sel: ".bbm-quick-slot", h: 0, gap: 16 },
];
const M_LAYERS = [
  { id: "①", sel: ".top-bar.is-bbm .search-field", h: 40, gap: 10 },
  { id: "②", sel: ".region-bar.is-bbm", h: 32, gap: 8 },
  { id: "③", sel: ".marketplace.is-bbm-m > .filter-shell.is-bbm", h: 32, gap: 10 },
  { id: "④", sel: ".bbm-m-quick-slot", h: 0, gap: 14 },
  { id: "⑤", sel: ".bbm-m-head", h: 0, gap: 0 },
];
const pcCardHeight = (row: number) => 16 + 32 + 18 + 32 + 18 + 32 + 16 + row + (row === 32 ? 24 : 16);

type Box = { x: number; y: number; w: number; h: number };
type Mark = { kind: "layer" | "gap" | "dot"; box: Box; text: string; ok?: boolean };

function markOutside() {
  for (const box of document.querySelectorAll<HTMLElement>(GUIDE_BOXES)) {
    const media = box.querySelector("img");
    const b = box.getBoundingClientRect();
    const i = media?.getBoundingClientRect();
    const outside = Boolean(i && i.width && (b.left - i.left > 0.5 || i.right - b.right > 0.5 || b.top - i.top > 0.5 || i.bottom - b.bottom > 0.5));
    if (outside) box.dataset.qfOutside = "1";
    else delete box.dataset.qfOutside;
  }
}

function collectMarks(showLayers: boolean, showGaps: boolean): Mark[] {
  const marks: Mark[] = [];
  const rect = (el: Element): Box => { const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; };
  const pcCard = document.querySelector(".marketplace.is-bbm .bbm-hybrid-top .bbm-content-head");
  const mobile = document.querySelector(".marketplace.is-bbm-m");
  const plain = Boolean(document.querySelector(".marketplace.is-qf-plain"));
  const layers = pcCard ? PC_LAYERS : mobile ? M_LAYERS : [];
  if (!layers.length) return marks;
  const origin = pcCard ? pcCard.getBoundingClientRect().top : (mobile as Element).getBoundingClientRect().top;
  const slot = document.querySelector(layers.find((layer) => layer.id === "④")!.sel);
  const rail = slot?.firstElementChild;
  const pill = Boolean(rail && (rail.classList.contains("is-trim-row") || rail.classList.contains("is-year-row")));
  const rowH = pcCard ? (pill ? 32 : plain ? 102 : 72) : (pill ? 40 : plain ? 82 : 80);
  let prevBottom = origin;
  // PC 0층 경로(카드 밖)
  const crumbs = pcCard ? document.querySelector(".bbm-hybrid-top > .bbm-ct-crumbs") : null;
  const header = document.querySelector(".bbm-header");
  if (pcCard && crumbs && header) {
    const box = rect(crumbs); const headerBottom = header.getBoundingClientRect().bottom;
    const fromHeader = Math.round((box.y - headerBottom) * 10) / 10; const toCard = Math.round((origin - box.y - box.h) * 10) / 10;
    if (showLayers) marks.push({ kind: "layer", box, text: "0경로" });
    if (showGaps) {
      marks.push({ kind: "gap", box: { x: box.x + box.w - 60, y: headerBottom, w: 0, h: box.y - headerBottom }, text: `${fromHeader}`, ok: Math.abs(fromHeader - 16) <= 0.5 });
      marks.push({ kind: "gap", box: { x: box.x + box.w - 60, y: box.y + box.h, w: 0, h: origin - box.y - box.h }, text: `${toCard}`, ok: Math.abs(toCard - 12) <= 0.5 });
    }
    if ((showLayers || showGaps) && Math.abs(fromHeader - 16) > 0.5) marks.push({ kind: "dot", box, text: `간격 ${fromHeader} ≠ 16` });
    if ((showLayers || showGaps) && Math.abs(toCard - 12) > 0.5) marks.push({ kind: "dot", box, text: `경로 → 카드 ${toCard} ≠ 12` });
  }
  for (const layer of layers) {
    const el = document.querySelector(layer.sel);
    if (!el) continue;
    const box = rect(el);
    const gap = Math.round((box.y - prevBottom) * 10) / 10;
    const wantH = layer.h || (layer.id === "④" ? rowH : 0);
    const gapOk = Math.abs(gap - layer.gap) <= 0.5;
    const hOk = !wantH || Math.abs(box.h - wantH) <= 0.5;
    if (showLayers) marks.push({ kind: "layer", box, text: layer.id });
    if (showGaps) marks.push({ kind: "gap", box: { x: box.x + box.w - 60, y: prevBottom, w: 0, h: box.y - prevBottom }, text: `${gap}`, ok: gapOk });
    if ((showLayers || showGaps) && !gapOk) marks.push({ kind: "dot", box, text: `간격 ${gap} ≠ ${layer.gap}` });
    const landing = layer.id === "④" && rail?.classList.contains("bbm-category-menu");
    if ((showLayers || showGaps) && !hOk) marks.push({ kind: "dot", box, text: `높이 ${Math.round(box.h * 10) / 10} ≠ ${wantH}${landing ? " (유형 줄)" : ""}` });
    prevBottom = box.y + box.h;
  }
  if (pcCard) {
    const card = rect(pcCard);
    const allowed = [pcCardHeight(plain ? 102 : 72), pcCardHeight(32)];
    const ok = allowed.some((value) => Math.abs(value - card.h) <= 0.5);
    const endGap = Math.round((card.y + card.h - prevBottom) * 10) / 10;
    const wantEnd = pill ? 24 : 16;
    if (showGaps) {
      marks.push({ kind: "gap", box: { x: card.x + card.w - 60, y: prevBottom, w: 0, h: card.y + card.h - prevBottom }, text: `${endGap}`, ok: Math.abs(endGap - wantEnd) <= 0.5 });
      marks.push({ kind: "gap", box: { x: card.x + card.w - 120, y: card.y, w: 0, h: 0 }, text: `카드 ${Math.round(card.h * 10) / 10}`, ok });
    }
    if ((showLayers || showGaps) && !ok) marks.push({ kind: "dot", box: card, text: "허용 높이 아님" });
  }
  // 칸 넘침 · 줄바꿈
  if (rail && (showLayers || showGaps)) {
    const railBox = rail.getBoundingClientRect();
    for (const cell of rail.querySelectorAll(".depth-card, .trim-chip, .stable-pill")) {
      const c = cell.getBoundingClientRect();
      if (!c.width) continue;
      const over = Math.max(railBox.top - c.top, c.bottom - railBox.bottom);
      if (over > 0.5) marks.push({ kind: "dot", box: rect(cell), text: `넘침 ${Math.round(over)}` });
    }
  }
  for (const pillEl of document.querySelectorAll(".bbm-ct-chip-row .filter-chip, .filter-shell.is-bbm .filter-chip, .stable-pill, .depth-rail .trim-chip")) {
    const c = pillEl.getBoundingClientRect();
    if (c.width && Math.abs(c.height - 32) > 0.5 && (showLayers || showGaps)) marks.push({ kind: "dot", box: rect(pillEl), text: "줄바꿈" });
  }
  return marks;
}

function DebugTools() {
  const [on, setOn] = useState<Record<ToggleKey, boolean>>(() => ({ logo: read("logo"), layers: read("layers"), gaps: read("gaps") }));
  const [marks, setMarks] = useState<Mark[]>([]);
  useEffect(() => {
    const root = document.documentElement;
    if (on.logo) root.dataset.qfGuides = "1"; else delete root.dataset.qfGuides;
    if (!on.logo && !on.layers && !on.gaps) { document.querySelectorAll<HTMLElement>("[data-qf-outside]").forEach((box) => { delete box.dataset.qfOutside; }); setMarks([]); return undefined; }
    const tick = () => { if (on.logo) markOutside(); setMarks(on.layers || on.gaps ? collectMarks(on.layers, on.gaps) : []); };
    tick();
    const timer = window.setInterval(tick, 400);
    const scroller = document.querySelector(".mobile-scroll");
    scroller?.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("scroll", tick, { passive: true });
    return () => { window.clearInterval(timer); scroller?.removeEventListener("scroll", tick); window.removeEventListener("scroll", tick); };
  }, [on]);
  const toggle = (key: ToggleKey) => setOn((current) => { const next = { ...current, [key]: !current[key] }; write(key, next[key]); return next; });
  return (
    <>
      {(Object.keys(LABELS) as ToggleKey[]).map((key) => (
        <label key={key} className={`qf-guide-toggle is-${key}`}>
          <input type="checkbox" checked={on[key]} onChange={() => toggle(key)} />
          {LABELS[key]}
        </label>
      ))}
      {marks.length ? (
        <div className="qf-debug-overlay" aria-hidden="true">
          {marks.map((mark, index) => mark.kind === "layer"
            ? <div key={index} className="qf-debug-layer" style={{ left: mark.box.x, top: mark.box.y, width: mark.box.w, height: mark.box.h }}><span>{mark.text}</span></div>
            : mark.kind === "gap"
              ? <div key={index} className={`qf-debug-gap${mark.ok ? " is-ok" : " is-bad"}`} style={{ left: mark.box.x, top: mark.box.y, height: Math.max(0, mark.box.h) }}><span>{mark.text}</span></div>
              : <div key={index} className="qf-debug-dot" style={{ left: mark.box.x + mark.box.w - 4, top: mark.box.y - 4 }}><span>{mark.text}</span></div>)}
        </div>
      ) : null}
    </>
  );
}

export function BuildBadge() {
  if (!debug) return null;
  return (
    <div className="debug-dock">
      <DebugTools />
      <div className="build-badge" role="status" aria-label="빌드 버전" data-commit={buildInfo.commit}>
        {buildInfo.branch} @ {buildInfo.commit}{buildInfo.time ? ` · ${buildInfo.time}` : ""}
      </div>
    </div>
  );
}
