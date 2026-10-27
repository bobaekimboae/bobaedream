// 리액트 src/prototype/listing/index.tsx 의 useDesktopLayout · useMediaMatch(파일 안 훅).
// 질의(query)는 값 · ref · getter 모두 받는다. 돌려주는 값은 Ref<boolean>.
import { onBeforeUnmount, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";
import { isDesktopPreview } from "@proto/data";

// PC 목록 레이아웃은 ?pc=1 이고 폭 820 이상일 때만 켠다(isDesktopPreview).
export function useDesktopLayout(querySource: MaybeRefOrGetter<string>) {
  const desktop = shallowRef(isDesktopPreview() && window.matchMedia(toValue(querySource)).matches);
  let stop: (() => void) | null = null;
  watch(() => toValue(querySource), (query) => {
    stop?.();
    stop = null;
    if (!isDesktopPreview()) return;
    const media = window.matchMedia(query);
    const update = () => { desktop.value = media.matches; };
    update();
    media.addEventListener("change", update);
    stop = () => media.removeEventListener("change", update);
  }, { immediate: true });
  onBeforeUnmount(() => stop?.());
  return desktop;
}

// 화면 폭 조건 하나를 따라가는 값(QF-093 1024~1279 구간 판정용)
export function useMediaMatch(querySource: MaybeRefOrGetter<string>) {
  const matches = shallowRef(window.matchMedia(toValue(querySource)).matches);
  let stop: (() => void) | null = null;
  watch(() => toValue(querySource), (query) => {
    stop?.();
    const media = window.matchMedia(query);
    const update = () => { matches.value = media.matches; };
    update();
    media.addEventListener("change", update);
    stop = () => media.removeEventListener("change", update);
  }, { immediate: true });
  onBeforeUnmount(() => stop?.());
  return matches;
}
