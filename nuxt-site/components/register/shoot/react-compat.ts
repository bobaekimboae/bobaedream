// 리액트 훅 모양(useState · useEffect · useRef · useMemo …)을 Vue 부품 안에서 그대로 쓰게 해 주는 작은 도구.
// ?register=shoot 촬영 화면(리액트 src/prototype/register/shoot/ShootRegister.tsx · ShortformStudio.tsx)은
// 작은 부품 30여 개가 훅을 많이 써서, 렌더 함수(TSX)로 옮기되 부품 몸통은 리액트와 줄 단위로 같게 두려고 만들었다.
//
// 사용법:
//   const Foo = reactish("Foo", function Foo({ a, onX }: { a: number; onX: () => void }) {
//     const [n, setN] = useState(0);            // 리액트와 같은 순서 규칙(조건문 안에서 부르지 않기)
//     useEffect(() => { ...; return cleanup }, [a]);
//     const el = useRef<HTMLDivElement>(null);  // <div ref={el}> 그대로 쓸 수 있다(Vue 템플릿 ref 와 호환)
//     return <div ref={el} onClick={onX}>{n}</div>;
//   });
//   <Foo a={1} onX={...} />   // props 는 Vue attrs 로 들어온다(선언 없음). 자식은 props.children(기본 slot).
//
// 다른 점: useEffect 는 Vue 가 화면을 고친 직후의 마이크로태스크에서, useLayoutEffect 는 고친 직후 바로 실행한다.
// 상태를 바꾸면(setX) 그 부품만 다시 그린다(부모가 다시 그리면 자식도 attrs 가 바뀌어 다시 그린다 — Vue 기본 동작).
import { defineComponent, onBeforeUnmount, onMounted, onUpdated, shallowRef, type Ref, type ShallowRef, type VNodeChild } from "vue";

type Cleanup = void | (() => void);
type EffectSlot = { deps?: readonly unknown[]; cleanup?: Cleanup; pending?: () => Cleanup };
type Instance = {
  hooks: unknown[];
  idx: number;
  effects: EffectSlot[];
  layouts: EffectSlot[];
  ei: number;
  li: number;
  tick: ShallowRef<number>;
  alive: boolean;
};

let current: Instance | null = null;
const now = (): Instance => {
  if (!current) throw new Error("[shoot] 훅은 reactish 부품을 그리는 동안만 부를 수 있어요");
  return current;
};
const changed = (a: readonly unknown[] | undefined, b: readonly unknown[] | undefined) =>
  !a || !b || a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));

export type SetStateAction<T> = T | ((prev: T) => T);
export type Dispatch<A> = (value: A) => void;
/** useRef 결과. 리액트처럼 .current 로 쓰고, Vue 템플릿 ref(ref={x})에도 그대로 넘길 수 있다(.value = .current). */
export type RefObject<T> = { current: T } & Ref<T>;
export type MutableRefObject<T> = RefObject<T>;

export function useState<T>(init: T | (() => T)): [T, Dispatch<SetStateAction<T>>];
export function useState<T = undefined>(): [T | undefined, Dispatch<SetStateAction<T | undefined>>];
export function useState<T>(init?: T | (() => T)) {
  const inst = now();
  const i = inst.idx++;
  type Slot = { v: T; set: Dispatch<SetStateAction<T>> };
  let slot = inst.hooks[i] as Slot | undefined;
  if (!slot) {
    const s = { v: typeof init === "function" ? (init as () => T)() : (init as T) } as Slot;
    s.set = (next) => {
      const value = typeof next === "function" ? (next as (prev: T) => T)(s.v) : next;
      if (Object.is(value, s.v)) return;
      s.v = value;
      if (inst.alive) inst.tick.value++;
    };
    inst.hooks[i] = slot = s;
  }
  return [slot.v, slot.set];
}

function makeRef<T>(value: T): RefObject<T> {
  const box = {
    current: value,
    __v_isRef: true,
    get value() {
      return box.current;
    },
    set value(next: T) {
      box.current = next;
    },
  };
  return box as unknown as RefObject<T>;
}

export function useRef<T>(init: T): RefObject<T>;
export function useRef<T>(init: T | null): RefObject<T | null>;
export function useRef<T = undefined>(): RefObject<T | undefined>;
export function useRef<T>(init?: T) {
  const inst = now();
  const i = inst.idx++;
  if (!inst.hooks[i]) inst.hooks[i] = makeRef(init);
  return inst.hooks[i] as RefObject<T>;
}

export function useMemo<T>(fn: () => T, deps: readonly unknown[]): T {
  const inst = now();
  const i = inst.idx++;
  const slot = inst.hooks[i] as { deps: readonly unknown[]; value: T } | undefined;
  if (slot && !changed(slot.deps, deps)) return slot.value;
  const value = fn();
  inst.hooks[i] = { deps, value };
  return value;
}

export function useCallback<T>(fn: T, deps: readonly unknown[]): T {
  return useMemo(() => fn, deps);
}

const queue = (list: EffectSlot[], index: number, fn: () => Cleanup, deps?: readonly unknown[]) => {
  const slot = (list[index] ??= {});
  if (slot.deps === undefined || deps === undefined || changed(slot.deps, deps)) {
    slot.pending = fn;
    slot.deps = deps ?? undefined;
  }
};
const flush = (list: EffectSlot[]) => {
  for (const slot of list) {
    if (!slot.pending) continue;
    const run = slot.pending;
    slot.pending = undefined;
    if (typeof slot.cleanup === "function") slot.cleanup();
    slot.cleanup = run();
  }
};

export function useEffect(fn: () => Cleanup, deps?: readonly unknown[]) {
  const inst = now();
  queue(inst.effects, inst.ei++, fn, deps);
}
export function useLayoutEffect(fn: () => Cleanup, deps?: readonly unknown[]) {
  const inst = now();
  queue(inst.layouts, inst.li++, fn, deps);
}
/** 리액트 useInsertionEffect(스타일 넣기용): 넉스트 판에서는 그린 직후(레이아웃 효과와 같은 때) 실행한다. */
export const useInsertionEffect = useLayoutEffect;

// 그린 뒤 효과는 마이크로태스크에서 한 번에(부품이 여럿 다시 그려져도 자식 → 부모 순서).
let pendingEffects: Instance[] = [];
let scheduled = false;
const scheduleEffects = (inst: Instance) => {
  if (!inst.effects.some((slot) => slot.pending)) return;
  pendingEffects.push(inst);
  if (scheduled) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    const list = pendingEffects;
    pendingEffects = [];
    for (const item of list) if (item.alive) flush(item.effects);
  });
};

/** 리액트 함수 부품을 Vue 부품으로 감싼다. props = Vue attrs(+ children = 기본 slot). */
export function reactish<P extends object>(name: string, fn: (props: P) => VNodeChild): (props: P & { key?: PropertyKey }) => any {
  return defineComponent({
    name,
    inheritAttrs: false,
    setup(_, { attrs, slots }) {
      const inst: Instance = { hooks: [], idx: 0, effects: [], layouts: [], ei: 0, li: 0, tick: shallowRef(0), alive: true };
      const after = () => {
        flush(inst.layouts);
        scheduleEffects(inst);
      };
      onMounted(after);
      onUpdated(after);
      onBeforeUnmount(() => {
        inst.alive = false;
        for (const slot of [...inst.layouts, ...inst.effects]) if (typeof slot.cleanup === "function") slot.cleanup();
      });
      return () => {
        void inst.tick.value; // 상태가 바뀌면 다시 그린다
        const prev = current;
        current = inst;
        inst.idx = 0;
        inst.ei = 0;
        inst.li = 0;
        try {
          const props = { ...attrs } as Record<string, unknown>;
          if (slots.default) props.children = slots.default();
          return fn(props as P);
        } finally {
          current = prev;
        }
      };
    },
  }) as unknown as (props: P & { key?: PropertyKey }) => any;
}

/** 리액트 autoFocus(처음 그릴 때 한 번 focus()). Vue 는 autoFocus 를 따로 처리하지 않으므로 ref 콜백으로 대신한다. */
const focused = new WeakSet<Element>();
export const autoFocus = (el: unknown) => {
  if (el instanceof HTMLElement && !focused.has(el)) {
    focused.add(el);
    el.focus();
  }
};
