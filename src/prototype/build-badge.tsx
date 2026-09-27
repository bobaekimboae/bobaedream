import { useEffect, useState } from "react";
import "./build-badge.css";

// OP-011: 주소에 &debug=1 이 있을 때만 화면 오른쪽 아래에 "브랜치 @ 커밋 7자리 · 빌드 시각"을 작게 보여 준다.
// 값은 빌드할 때 scripts/build-info.mjs 가 넣는다(개발 서버에서는 "dev").
const env = import.meta.env as Record<string, string | undefined>;
export const buildInfo = { branch: env.VITE_BUILD_BRANCH ?? "dev", commit: env.VITE_BUILD_COMMIT ?? "dev", time: env.VITE_BUILD_TIME ?? "" };
const debug = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("debug") === "1";

// QF-096 보완 3: 배지 옆 "로고 칸 안내선" 체크박스(&debug=1 일 때만). QF-100: &qfcard=plain 의 로고 상자 40×40(모바일 36×36)도 같은 점선
// 켜면 <html data-qf-guides="1"> — 퀵필터 로고 칸 48×28 · 모델/세부모델 이미지 칸 56×28 · 목록 로고 칸 24×24 에 빨간 점선(outline)과 세로 중심선(배경),
// 칸 밖으로 나간 로고·이미지는 칸에 data-qf-outside → 빨간 점 8px. outline·배경·상대 위치만 써서 레이아웃은 그대로. 켠 상태는 브라우저 저장소에 기억
const GUIDE_KEY = "qf-logo-guides";
const readGuide = () => { try { return window.localStorage.getItem(GUIDE_KEY) === "1"; } catch { return false; } };
const writeGuide = (on: boolean) => { try { window.localStorage.setItem(GUIDE_KEY, on ? "1" : "0"); } catch { /* 저장소를 못 쓰면 기억하지 않는다 */ } };
const GUIDE_BOXES = ".kr-brand-logo.is-rail, .kr-brand-logo.is-list, .kr-brand-logo.is-plain, .depth-card-media:not(.is-brand)";

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

function LogoGuideToggle() {
  const [on, setOn] = useState(readGuide);
  useEffect(() => {
    const root = document.documentElement;
    if (!on) { delete root.dataset.qfGuides; document.querySelectorAll<HTMLElement>("[data-qf-outside]").forEach((box) => { delete box.dataset.qfOutside; }); return undefined; }
    root.dataset.qfGuides = "1";
    markOutside();
    const timer = window.setInterval(markOutside, 500);
    return () => window.clearInterval(timer);
  }, [on]);
  return (
    <label className="qf-guide-toggle">
      <input type="checkbox" checked={on} onChange={(event) => { setOn(event.target.checked); writeGuide(event.target.checked); }} />
      로고 칸 안내선
    </label>
  );
}

export function BuildBadge() {
  if (!debug) return null;
  return (
    <div className="debug-dock">
      <LogoGuideToggle />
      <div className="build-badge" role="status" aria-label="빌드 버전" data-commit={buildInfo.commit}>
        {buildInfo.branch} @ {buildInfo.commit}{buildInfo.time ? ` · ${buildInfo.time}` : ""}
      </div>
    </div>
  );
}
