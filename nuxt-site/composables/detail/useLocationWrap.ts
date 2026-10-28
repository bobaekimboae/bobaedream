// 리액트 detail/index.tsx 의 useLocationWrap · useLocationLinks(의존값 없는 useEffect = 그릴 때마다 실행).
// Vue 판: 그 부품이 그려질 때마다(onMounted · onUpdated) 앞 정리 함수를 부르고 다시 실행한다.
import { onBeforeUnmount, onMounted, onUpdated, type Ref } from "vue";
import type { Car } from "@proto/data";
import { locationLinks } from "../../components/detail/detail-local";

function everyRender(run: () => void | (() => void)) {
  let cleanup: void | (() => void);
  const apply = () => {
    if (typeof cleanup === "function") cleanup();
    cleanup = run();
  };
  onMounted(apply);
  onUpdated(apply);
  onBeforeUnmount(() => { if (typeof cleanup === "function") cleanup(); });
}

// 지역 줄에서 줄 맨 앞으로 내려간 항목은 앞의 가운데 점을 뺀다(2026-10-13)
export function useLocationWrap(ref: Ref<HTMLElement | null>) {
  everyRender(() => {
    const root = ref.value;
    const text = root?.querySelector<HTMLElement>(".bbm-card-location-text");
    if (!text) return;
    const apply = () => {
      const parts = Array.from(text.querySelectorAll<HTMLElement>(".bbm-card-location-part"));
      parts.forEach((part) => part.classList.remove("is-line-start"));
      const first = text.firstElementChild as HTMLElement | null;
      let prevTop = first?.offsetTop ?? 0;
      parts.forEach((part) => {
        if (part.offsetTop > prevTop + 2) part.classList.add("is-line-start");
        prevTop = part.offsetTop;
      });
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(text);
    return () => observer.disconnect();
  });
}

// 지역 줄의 단지 · 상사명 링크(2026-10-13): 이동할 곳이 있는 항목에만 밑줄을 긋는다.
export function useLocationLinks(ref: Ref<HTMLElement | null>, car: Car | null | undefined) {
  everyRender(() => {
    const root = ref.value;
    if (!root || !car) return;
    const links = locationLinks(car);
    root.querySelectorAll<HTMLElement>(".bbm-card-location-part").forEach((part) => {
      const href = links[(part.textContent ?? "").trim()];
      if (href) { part.classList.add("is-link"); part.dataset.href = href; part.setAttribute("role", "link"); part.tabIndex = 0; }
      else { part.classList.remove("is-link"); delete part.dataset.href; part.removeAttribute("role"); part.removeAttribute("tabindex"); }
    });
    const go = (event: Event) => {
      const target = (event.target as HTMLElement).closest<HTMLElement>("[data-href]");
      if (!target) return;
      if (event instanceof KeyboardEvent && event.key !== "Enter") return;
      event.preventDefault();
      window.location.assign(target.dataset.href as string);
    };
    root.addEventListener("click", go);
    root.addEventListener("keydown", go);
    return () => { root.removeEventListener("click", go); root.removeEventListener("keydown", go); };
  });
}
