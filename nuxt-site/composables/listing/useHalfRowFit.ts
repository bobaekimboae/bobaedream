// 원본: src/prototype/listing/pc-bbmuseum.tsx useHalfRowFit (useLayoutEffect → onMounted + watch flush:"post")
// 스크롤 목록의 아래 끝이 행 경계에 걸리면 빈 칸처럼 보인다(2026-10-19 「수입차도 적용해봐라」).
// 기준 높이(CSS max-height) 근처에서 가로지르는 행을 찾아 그 행이 정확히 절반 보이게 높이를 맞춘다.
import { onBeforeUnmount, onMounted, watch, type Ref } from "vue";

const HALF_ROW_SELECTOR = ".bbm-catalog-row, .bbm-encar-selected-row, .bbm-truck-spec-list > button";

/** before: 맞추기 전에 먼저 할 일(원본에서 같은 렌더 뒤 먼저 실행되던 layout effect, 예: scrollTop = 0) */
export function useHalfRowFit(boxRef: Ref<HTMLDivElement | null>, enabled: () => boolean, deps: () => unknown[], before?: () => void) {
  let cleanup: (() => void) | null = null;
  const run = () => {
    cleanup?.();
    cleanup = null;
    before?.();
    const box = boxRef.value;
    if (!enabled() || !box) return;
    const fit = () => {
      box.style.maxHeight = "";
      const base = parseFloat(getComputedStyle(box).maxHeight);
      if (!Number.isFinite(base) || box.scrollHeight <= base) return;
      const top = box.getBoundingClientRect().top - box.scrollTop;
      const mids = [...box.querySelectorAll<HTMLElement>(HALF_ROW_SELECTOR)]
        .map((row) => row.getBoundingClientRect())
        .map((r) => r.top - top + r.height / 2)
        .filter((mid) => mid >= base - 24)
        .sort((a, b) => a - b);
      if (mids.length) box.style.maxHeight = `${Math.round(mids[0])}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    cleanup = () => window.removeEventListener("resize", fit);
  };
  onMounted(run);
  watch(() => [enabled(), ...deps()], run, { flush: "post" });
  onBeforeUnmount(() => cleanup?.());
}
