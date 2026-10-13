import { useEffect, useRef, type PropsWithChildren, type PointerEvent as ReactPointerEvent } from "react";

// 사진 넘기기는 업계 표준 갤러리(Swiper, Embla, Android ViewPager2, iOS 페이지 스크롤)의 규칙을 따른다(2026-10-14 「UX 가이드 맞춰서 사진 이동 만들어, 깃허브나 구글 검색」).
// 근거 — Swiper 소스 `src/core/events/onTouchEnd.mjs`(v11)와 API 기본값(github.com/nolimits4web/swiper):
//  · 손가락을 따라 사진 줄이 움직인다(followFinger).
//  · 놓을 때: 누른 지 300ms 이하(longSwipesMs 300)이면 짧게 휙 밀어도(shortSwipes) 끌던 방향의 다음·이전 장으로 넘어간다.
//    300ms보다 오래 끌었으면 폭의 절반(longSwipesRatio 0.5) 이상 끌어야 넘어가고, 아니면 제자리로 돌아온다.
//  · 넘어가는 시간 300ms(speed 300 · Material 3 medium2 300ms), 가속 곡선은 Material 3 standard `cubic-bezier(.2, 0, 0, 1)`.
//  · 가로로 45° 안쪽으로 움직여야 사진 끌기로 본다(touchAngle 45). 한 번에 한 장(관성 굴림 없음).
//  · 양 끝에서는 끌어도 저항이 있고(resistance), 키보드 ← →로도 넘길 수 있다(WAI-ARIA 캐러셀 관례).
const SPEED_MS = 300;
const SHORT_SWIPE_MS = 300;
const LONG_SWIPE_RATIO = 0.5;
const MIN_SWIPE_PX = 10;
const bezier = (x1: number, y1: number, x2: number, y2: number) => (t: number) => {
  if (t <= 0 || t >= 1) return t;
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  let s = t;
  for (let i = 0; i < 8; i++) {
    const x = ((ax * s + bx) * s + cx) * s - t;
    const d = (3 * ax * s + 2 * bx) * s + cx;
    if (Math.abs(x) < 1e-5 || Math.abs(d) < 1e-6) break;
    s -= x / d;
  }
  return ((ay * s + by) * s + cy) * s;
};
const ease = bezier(0.2, 0, 0, 1);

// 상세 사진과 피드(목록) 사진이 같은 넘기기를 쓰도록 훅으로 둔다(2026-10-14 「피드도 같은 속도로 맞춰」)
export function usePagedDrag(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const suppressClick = useRef(false);
  const detach = useRef<() => void>(() => {});

  useEffect(() => () => { cancelAnimationFrame(frame.current); detach.current(); }, []);

  const animateTo = (node: HTMLDivElement, target: number) => {
    cancelAnimationFrame(frame.current);
    const from = node.scrollLeft;
    if (Math.abs(target - from) < 1) { node.scrollLeft = target; return; }
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { node.scrollLeft = target; return; }
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / SPEED_MS);
      node.scrollLeft = from + (target - from) * ease(p);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
  };

  // 2026-10-14 「넘겨지지도 않아」: 포인터 캡처가 끌던 도중 풀리면(천천히 끌거나 비스듬히 끌 때) 이후 움직임이 이 칸으로 오지 않아 끌기가 멈추고 넘어가지 않았다.
  // 캡처에 기대지 않고 누른 순간부터 window에서 움직임 · 손 뗌을 직접 받는다.
  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const node = ref.current;
    if (!node || (event.pointerType === "mouse" && event.button !== 0)) return;
    detach.current();
    cancelAnimationFrame(frame.current);
    const state = { id: event.pointerId, x: event.clientX, y: event.clientY, left: node.scrollLeft, active: false, locked: false, time: performance.now() };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== state.id || state.locked) return;
      const dx = e.clientX - state.x;
      const dy = e.clientY - state.y;
      if (!state.active) {
        // 가로로 45° 안쪽(|dx| ≥ |dy|)일 때만 사진 끌기, 세로가 더 크면 페이지 스크롤에 양보
        if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        if (Math.abs(dy) > Math.abs(dx)) { state.locked = true; return; }
        state.active = true;
      }
      const max = Math.max(0, node.scrollWidth - node.clientWidth);
      let next = state.left - dx;
      if (next < 0) next *= 0.35;
      if (next > max) next = max + (next - max) * 0.35;
      node.scrollLeft = Math.max(0, Math.min(max, next));
    };
    const finish = (e: PointerEvent) => {
      if (e.pointerId !== state.id) return;
      detach.current();
      if (!state.active) return;
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
      // 한 장 폭은 첫 사진 폭(좁은 화면에서는 칸 폭보다 클 수 있다)을 쓴다
      const width = node.querySelector<HTMLElement>("img")?.getBoundingClientRect().width || node.clientWidth || 1;
      const dx = e.clientX - state.x;
      const from = Math.round(state.left / width);
      const fast = performance.now() - state.time <= SHORT_SWIPE_MS;
      const advance = e.type !== "pointercancel" && (fast ? Math.abs(dx) >= MIN_SWIPE_PX : Math.abs(dx) / width >= LONG_SWIPE_RATIO);
      const to = Math.max(0, Math.min(count - 1, advance ? from + (dx < 0 ? 1 : -1) : from));
      animateTo(node, to * width);
    };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerup", finish);
    window.addEventListener("pointercancel", finish);
    detach.current = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", finish);
      window.removeEventListener("pointercancel", finish);
      detach.current = () => {};
    };
  };
  const onKeyDown = (event: { key: string; preventDefault: () => void }) => {
    const node = ref.current;
    if (!node || (event.key !== "ArrowLeft" && event.key !== "ArrowRight")) return;
    const width = node.querySelector<HTMLElement>("img")?.getBoundingClientRect().width || node.clientWidth || 1;
    const from = Math.round(node.scrollLeft / width);
    event.preventDefault();
    animateTo(node, Math.max(0, Math.min(count - 1, from + (event.key === "ArrowRight" ? 1 : -1))) * width);
  };
  const onClickCapture = (event: { stopPropagation: () => void; preventDefault: () => void }) => {
    if (suppressClick.current) { event.stopPropagation(); event.preventDefault(); }
  };
  return { ref, onPointerDown, onClickCapture, onKeyDown };
}

export function PagedPhotoCarousel({ ariaLabel, count, children }: PropsWithChildren<{ ariaLabel: string; count: number }>) {
  const paged = usePagedDrag(count);
  return (
    <div ref={paged.ref} className="detail-media-carousel" role="region" aria-roledescription="carousel" aria-label={ariaLabel} tabIndex={0} onKeyDown={paged.onKeyDown} onPointerDown={paged.onPointerDown} onClickCapture={paged.onClickCapture}>
      <div className="detail-media-track">{children}</div>
    </div>
  );
}
