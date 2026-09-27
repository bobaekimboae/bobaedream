import { useEffect } from "react";

// QF-093 보완: 과쯔 PC 좌측 필터 "아래 붙는 사이드바". 칸 안 스크롤 없이 필터 전체 길이를 그리고,
// sticky top 을 min(16, 화면 높이 − 필터 높이 − 16) 으로 맞춘다.
// · 필터가 화면보다 길면: 내리면 함께 올라가다 필터 맨 아래가 화면 아래 16 에 닿으면 붙고, 다시 올리면 함께 내려와 맨 위가 원래 자리(상단 영역 아래 24)로 돌아온다
// · 짧으면: 위 16 에 붙는다(QF-059 그대로)
// · 항목을 펼치거나 접어 길이가 바뀌면(ResizeObserver) 바로 다시 맞춘다. 스크롤 상자는 보호 런타임의 .mobile-scroll(화면 높이)
export function useBottomStickySidebar(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return undefined;
    let observer: ResizeObserver | null = null;
    let target: HTMLElement | null = null;
    const update = () => {
      if (!target) return;
      const scroller = target.closest<HTMLElement>(".mobile-scroll");
      const viewport = scroller?.clientHeight ?? window.innerHeight;
      const top = Math.min(16, viewport - target.offsetHeight - 16);
      target.style.setProperty("--bbm-filter-sticky-top", `${top}px`);
    };
    // 좌측 필터는 화면 폭·레이아웃에 따라 다시 그려질 수 있어 DOM 이 바뀔 때 다시 찾는다
    const attach = () => {
      const next = document.querySelector<HTMLElement>(".marketplace.is-bbm.is-hybrid .bbm-page > .bbm-filter");
      if (next !== target) {
        observer?.disconnect();
        target = next;
        if (target) { observer = new ResizeObserver(update); observer.observe(target); update(); }
      }
    };
    attach();
    const mutations = new MutationObserver(attach);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("resize", update);
    return () => { mutations.disconnect(); observer?.disconnect(); window.removeEventListener("resize", update); target?.style.removeProperty("--bbm-filter-sticky-top"); };
  }, [enabled]);
}
