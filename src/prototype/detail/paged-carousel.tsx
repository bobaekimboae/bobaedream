import { useEffect, useRef, type PropsWithChildren, type PointerEvent as ReactPointerEvent } from "react";

// 상세 사진 넘기기(2026-10-14 「직접 초톳 가서 사진 제스처 속도 확인」): 초톳(react-slick)을 폰 폭 384에서 실제 속도로 재서 맞춘다.
// 손가락을 따라 사진 줄이 움직이고, 놓으면 폭의 1/5(slick touchThreshold 5)을 넘게 끌었을 때만 다음·이전 사진으로 넘어가며,
// 넘어가는 시간은 500ms · CSS `ease`(cubic-bezier .25 .1 .25 1), 못 넘으면 같은 방식으로 제자리로 돌아온다. 관성 굴림 없이 한 번에 한 장.
const SPEED_MS = 500;
const THRESHOLD = 5;
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
const ease = bezier(0.25, 0.1, 0.25, 1);

export function PagedPhotoCarousel({ ariaLabel, count, children }: PropsWithChildren<{ ariaLabel: string; count: number }>) {
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
    const state = { id: event.pointerId, x: event.clientX, y: event.clientY, left: node.scrollLeft, active: false, locked: false };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== state.id || state.locked) return;
      const dx = e.clientX - state.x;
      const dy = e.clientY - state.y;
      if (!state.active) {
        if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) * 1.5) { state.locked = true; return; }
        if (Math.abs(dx) < 4) return;
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
      const width = node.querySelector<HTMLElement>(".detail-media-track > img")?.getBoundingClientRect().width || node.clientWidth || 1;
      const dx = e.clientX - state.x;
      const from = Math.round(state.left / width);
      const to = Math.max(0, Math.min(count - 1, e.type === "pointercancel" ? from : Math.abs(dx) > width / THRESHOLD ? from + (dx < 0 ? 1 : -1) : from));
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

  return (
    <div
      ref={ref}
      className="detail-media-carousel"
      role="region"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onClickCapture={(event) => { if (suppressClick.current) { event.stopPropagation(); event.preventDefault(); } }}
    >
      <div className="detail-media-track">{children}</div>
    </div>
  );
}
