// 리액트 bbm-mileage.tsx · bbm-price.tsx 의 useScrollLock(두 파일에 따로 있고 내보내지 않음).
// QF-118 PC 모달이 열려 있는 동안 페이지 스크롤 잠금. 스크롤바가 사라진 만큼 오른쪽 여백을 더해 화면이 밀리지 않게 한다.
// restoreTopNow: 주행거리 판은 잠근 직후 scrollTop 을 다시 맞춘다(가격 판은 하지 않음 — 원본 그대로).
import { onBeforeUnmount, onMounted } from "vue";

export function useScrollLock(enabled: () => boolean, restoreTopNow: boolean) {
  let cleanup: (() => void) | null = null;
  onMounted(() => {
    if (!enabled()) return;
    const scroller = document.querySelector<HTMLElement>(".marketplace")?.closest<HTMLElement>(".mobile-scroll");
    if (!scroller) return;
    const before = scroller.clientWidth;
    const prev = { overflowY: scroller.style.overflowY, paddingRight: scroller.style.paddingRight };
    const top = scroller.scrollTop;
    scroller.style.overflowY = "hidden";
    const gained = scroller.clientWidth - before;
    if (gained > 0) scroller.style.paddingRight = `${(parseFloat(getComputedStyle(scroller).paddingRight) || 0) + gained}px`;
    if (restoreTopNow) scroller.scrollTop = top;
    cleanup = () => { scroller.style.overflowY = prev.overflowY; scroller.style.paddingRight = prev.paddingRight; scroller.scrollTop = top; };
  });
  onBeforeUnmount(() => { cleanup?.(); cleanup = null; });
}
