// PC웹 / 모바일 두 판. 기본은 화면 폭(1024 이상 = PC). 주소 끝 ?pc=1 은 PC, ?m=1 은 모바일로 고정(시안 확인용).
import { ref } from "vue";

export const isPc = ref(false);
export function watchLayout() {
  const q = new URLSearchParams(window.location.search);
  const force = q.get("pc") === "1" ? true : q.get("m") === "1" ? false : null;
  const set = () => { isPc.value = force ?? window.innerWidth >= 1024; };
  set();
  window.addEventListener("resize", set);
}
/** 화면을 옮겨도 ?pc=1 · ?m=1 은 유지한다 */
export function keepLayoutParams(u: URL) {
  const q = new URLSearchParams(window.location.search);
  for (const k of ["pc", "m"]) if (q.get(k)) u.searchParams.set(k, q.get(k)!);
}
