// 큰 화면(목록 MarketplaceScreen처럼 리액트 한 함수가 2천 줄 넘는 것)을 Vue 렌더 함수(TSX)로 옮길 때 쓰는 작은 도구.
// 리액트처럼 "그릴 때마다 값을 다시 계산하고, 바뀐 값에 따라 효과를 실행"하는 구조를 그대로 둬서
// 리액트 판과 줄 단위로 대조할 수 있게 한다.
//
// 사용법(defineComponent의 setup 안):
//   const hooks = renderHooks();            // setup 에서 한 번
//   return () => {                          // 렌더 함수
//     hooks.begin();                        // 맨 처음에
//     const list = hooks.memo(() => heavy(a.value), [a.value]);
//     hooks.effect(() => { ...; return cleanup }, [x]);      // 그린 뒤 실행(리액트 useEffect)
//     hooks.layoutEffect(() => {...}, [x]);                  // 그린 직후, 화면에 보이기 전(useLayoutEffect)
//     return <div>...</div>;
//   };
// 상태는 setup 의 ref 로 둔다(useState 대신). deps 를 생략하면 매번 그린 뒤 실행(리액트와 같음).
import { getCurrentInstance, onBeforeUnmount, onMounted, onUpdated } from "vue";

type Cleanup = void | (() => void);
type Slot = { deps?: unknown[]; cleanup?: Cleanup; pending?: () => Cleanup };

const changed = (a: unknown[] | undefined, b: unknown[] | undefined) =>
  !a || !b || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));

export function renderHooks() {
  if (!getCurrentInstance()) throw new Error("renderHooks() 는 setup 안에서 불러야 합니다");
  const effects: Slot[] = [];
  const layouts: Slot[] = [];
  const memos: { deps: unknown[]; value: unknown }[] = [];
  let ei = 0;
  let li = 0;
  let mi = 0;

  const queue = (list: Slot[], index: number, fn: () => Cleanup, deps?: unknown[]) => {
    const slot = (list[index] ??= {});
    if (slot.deps === undefined || deps === undefined || changed(slot.deps, deps)) {
      slot.pending = fn;
      slot.deps = deps;
    }
  };
  const flush = (list: Slot[]) => {
    for (const slot of list) {
      if (!slot.pending) continue;
      const run = slot.pending;
      slot.pending = undefined;
      if (typeof slot.cleanup === "function") slot.cleanup();
      slot.cleanup = run();
    }
  };
  const flushAll = () => {
    flush(layouts);
    // 리액트 useEffect 는 그린 뒤 브라우저가 화면을 칠한 다음 실행된다
    const hasPending = effects.some((slot) => slot.pending);
    if (hasPending) requestAnimationFrame(() => flush(effects));
  };
  onMounted(flushAll);
  onUpdated(flushAll);
  onBeforeUnmount(() => {
    for (const slot of [...layouts, ...effects]) if (typeof slot.cleanup === "function") slot.cleanup();
  });

  return {
    begin() { ei = 0; li = 0; mi = 0; },
    effect(fn: () => Cleanup, deps?: unknown[]) { queue(effects, ei++, fn, deps); },
    layoutEffect(fn: () => Cleanup, deps?: unknown[]) { queue(layouts, li++, fn, deps); },
    memo<T>(fn: () => T, deps: unknown[]): T {
      const index = mi++;
      const slot = memos[index];
      if (slot && !changed(slot.deps, deps)) return slot.value as T;
      const value = fn();
      memos[index] = { deps, value };
      return value;
    },
  };
}

/** 리액트 setState 와 같은 모양의 함수(값 또는 이전 값 → 새 값). setup 의 ref 와 함께 쓴다. */
export function setter<T>(target: { value: T }) {
  return (next: T | ((prev: T) => T)) => {
    target.value = typeof next === "function" ? (next as (prev: T) => T)(target.value) : next;
  };
}
