import { useEffect, useRef, type PropsWithChildren, type PointerEvent as ReactPointerEvent } from "react";

// 사진 넘기기는 업계 표준 갤러리(Swiper, Embla, Android ViewPager2, iOS 페이지 스크롤)의 규칙을 따른다(2026-10-14 「UX 가이드 맞춰서 사진 이동 만들어, 깃허브나 구글 검색」).
// 근거 — Swiper 소스 `src/core/events/onTouchEnd.mjs`(v11)와 API 기본값(github.com/nolimits4web/swiper):
//  · 손가락을 따라 사진 줄이 움직인다(followFinger).
//  · 놓을 때: 누른 지 300ms 이하(longSwipesMs 300)이면 짧게 휙 밀어도(shortSwipes) 끌던 방향의 다음·이전 장으로 넘어간다.
//    300ms보다 오래 끌었으면 폭의 절반(longSwipesRatio 0.5) 이상 끌어야 넘어가고, 아니면 제자리로 돌아온다.
//  · 넘어가는 시간 약 320ms(speed 300 · Material 3 medium2 300ms). 곡선은 놓는 순간의 위치 · 손가락 속도에서 시작해 속도 0으로 도착하는 3차 에르미트 곡선(2026-10-14 「퉁퉁 튕긴다」 수정).
//  · 가로로 45° 안쪽으로 움직여야 사진 끌기로 본다(touchAngle 45). 한 번에 한 장(관성 굴림 없음).
//  · 양 끝에서는 끌어도 저항이 있고(resistance), 키보드 ← →로도 넘길 수 있다(WAI-ARIA 캐러셀 관례).
const DURATION_MS = 320;
const MAX_V = 2500;
const SHORT_SWIPE_MS = 300;
const LONG_SWIPE_RATIO = 0.5;
const MIN_SWIPE_PX = 10;
// 상세 사진과 피드(목록) 사진이 같은 넘기기를 쓰도록 훅으로 둔다(2026-10-14 「피드도 같은 속도로 맞춰」)
export function usePagedDrag(count: number) {
  const ref = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const suppressClick = useRef(false);
  const targetRef = useRef<number | null>(null); // 이동 중인 목표 위치(이동 중 다시 넘기면 여기서부터 한 장 더 간다, Swiper와 같음)
  const detach = useRef<() => void>(() => {});

  useEffect(() => () => { cancelAnimationFrame(frame.current); detach.current(); }, []);

  // 2026-10-14 「사진 넘기면 퉁퉁 튕긴다」: 놓는 순간 손가락 속도(0.3px/ms)에서 한 프레임 만에 3~5배 빠른 속도로 튀어 나가는 곡선이 원인이었다(고정 `ease` → 스프링으로 바꿔도 첫 프레임 가속이 컸다).
  // 놓는 순간의 위치 · 속도에서 시작해 목표 사진에 속도 0으로 도착하는 3차 에르미트 곡선(smoothstep 계열)으로 움직인다: 처음은 부드럽게 가속하고 끝은 부드럽게 멈추며 되튕기지 않는다.
  const animateTo = (node: HTMLDivElement, target: number, velocity = 0) => {
    cancelAnimationFrame(frame.current);
    targetRef.current = target;
    const from = node.scrollLeft;
    if (Math.abs(target - from) < 1) { node.scrollLeft = target; targetRef.current = null; return; }
    if (typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) { node.scrollLeft = target; return; }
    const dir = Math.sign(target - from);
    const v0 = Math.min(MAX_V, Math.max(0, velocity * dir)) * dir; // px/s, 목표 반대 방향 속도는 버린다
    const duration = DURATION_MS / 1000;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 1000 / duration);
      const t2 = t * t, t3 = t2 * t;
      const h00 = 2 * t3 - 3 * t2 + 1, h10 = t3 - 2 * t2 + t, h01 = -2 * t3 + 3 * t2;
      node.scrollLeft = h00 * from + h10 * duration * v0 + h01 * target;
      if (t < 1) frame.current = requestAnimationFrame(tick);
      else { node.scrollLeft = target; targetRef.current = null; }
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
    const movingTo = targetRef.current; // 이동 중에 다시 누르면 가던 목표를 기준으로 삼는다
    const state = { base: movingTo, id: event.pointerId, x: event.clientX, y: event.clientY, left: node.scrollLeft, active: false, locked: false, time: performance.now(), samples: [] as Array<[number, number]> };
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
      const nowMs = performance.now();
      state.samples.push([nowMs, node.scrollLeft]);
      while (state.samples.length > 2 && nowMs - state.samples[0][0] > 100) state.samples.shift();
    };
    const finish = (e: PointerEvent) => {
      if (e.pointerId !== state.id) return;
      detach.current();
      if (!state.active) { if (state.base !== null) animateTo(node, state.base); return; } // 이동 중 가볍게 눌렀다 뗀 경우 가던 곳으로 마저 간다
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
      // 한 장 폭은 첫 사진 폭(좁은 화면에서는 칸 폭보다 클 수 있다)을 쓴다
      const width = node.querySelector<HTMLElement>("img")?.getBoundingClientRect().width || node.clientWidth || 1;
      const dx = e.clientX - state.x;
      const from = Math.round((state.base ?? state.left) / width);
      const fast = performance.now() - state.time <= SHORT_SWIPE_MS;
      const advance = e.type !== "pointercancel" && (fast ? Math.abs(dx) >= MIN_SWIPE_PX : Math.abs(dx) / width >= LONG_SWIPE_RATIO);
      const to = Math.max(0, Math.min(count - 1, advance ? from + (dx < 0 ? 1 : -1) : from));
      // 놓기 직전 약 100ms의 움직임으로 손가락 속도(px/s)를 구해 이어받는다
      const first = state.samples[0];
      const lastSample = state.samples[state.samples.length - 1];
      const velocity = first && lastSample && lastSample[0] > first[0] ? ((lastSample[1] - first[1]) / (lastSample[0] - first[0])) * 1000 : 0;
      animateTo(node, to * width, velocity);
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
    const from = Math.round((targetRef.current ?? node.scrollLeft) / width);
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
