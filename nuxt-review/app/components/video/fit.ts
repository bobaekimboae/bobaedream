// 무대(stage) 안에 비율을 지켜 가장 크게 들어가는 화면 칸 크기를 잰다(오버레이 끌기 좌표 기준).
import { onBeforeUnmount, onMounted, ref, watch, type Ref } from "vue";

export function useFit(stage: Ref<HTMLElement | null>, ratio: () => number) {
  const box = ref({ w: 0, h: 0 });
  let ro: ResizeObserver | null = null;
  const measure = () => {
    const el = stage.value;
    if (!el) return;
    const W = el.clientWidth, H = el.clientHeight, r = ratio() || 9 / 16;
    box.value = W / H > r ? { w: Math.floor(H * r), h: H } : { w: W, h: Math.floor(W / r) };
  };
  onMounted(() => {
    measure();
    ro = new ResizeObserver(measure);
    if (stage.value) ro.observe(stage.value);
  });
  watch(ratio, measure);
  onBeforeUnmount(() => ro?.disconnect());
  return { box, measure };
}

/** 창 전체에서 포인터를 끝까지 따라가는 끌기 */
export function drag(e: PointerEvent, move: (dx: number, dy: number, ev: PointerEvent) => void, end?: () => void) {
  e.preventDefault();
  const x0 = e.clientX, y0 = e.clientY;
  const mv = (ev: PointerEvent) => move(ev.clientX - x0, ev.clientY - y0, ev);
  const up = () => {
    window.removeEventListener("pointermove", mv);
    window.removeEventListener("pointerup", up);
    window.removeEventListener("pointercancel", up);
    end?.();
  };
  window.addEventListener("pointermove", mv);
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
}
