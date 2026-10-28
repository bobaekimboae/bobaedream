// 리액트 useState · useRef 와 같은 모양의 작은 도우미(setup 에서 부른다). 렌더 함수에서는 `const x = x$.value` 로 읽는다.
import { shallowRef, type ShallowRef } from "vue";
import { setter } from "../render-hooks";

/** const [x$, setX] = useState(초깃값 | () => 초깃값) — 리액트처럼 함수면 한 번 불러 초깃값으로 쓴다. 값은 shallowRef(깊은 반응형 아님). */
export function useState<T>(init: T | (() => T)): [ShallowRef<T>, (next: T | ((prev: T) => T)) => void] {
  const state = shallowRef(typeof init === "function" ? (init as () => T)() : init) as ShallowRef<T>;
  return [state, setter(state)];
}

/** 리액트 useRef(값) — 다시 그려도 그대로인 { current } 상자 */
export function useRef<T>(current: T): { current: T } {
  return { current };
}
