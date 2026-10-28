// 리액트 index.tsx 의 JSX 를 줄 단위로 그대로 두기 위한 얇은 감싸기(DOM 은 더하지 않는다).
// 리액트는 ReactNode 를 prop 으로(image={<img/>}), 그리는 함수를 prop 으로(renderLogo={...}) 넘겼다.
// Vue 판 부품은 그것을 slot 으로 받으므로, 여기서 같은 이름의 prop 을 slot 으로 바꿔 넘긴다.
//   node:   prop 값(VNode)을 같은 이름(또는 지정한 이름)의 slot 으로
//   render: 함수 prop 을 범위 slot 으로(slot props → 원래 함수 인자)
//   show:   콜백을 "줬는지"로 화면이 달라지는 경우 Vue 판의 show-xxx boolean prop 을 켠다(콜백은 emit 리스너로 그대로 넘긴다)
import { h, type Component, type FunctionalComponent, type Slots, type VNodeChild } from "vue";

type Spec = {
  node?: Record<string, string>;
  render?: Record<string, [slot: string, call: (fn: (...args: any[]) => VNodeChild, slotProps: any) => VNodeChild]>;
  show?: Record<string, string>;
};

export function adaptReactProps(Inner: Component, spec: Spec, name: string): FunctionalComponent<any> {
  const Adapted: FunctionalComponent<any> = (props, { slots }) => {
    const rest: Record<string, unknown> = { ...props };
    const nextSlots: Record<string, unknown> = { ...(slots as Slots) };
    for (const [prop, slot] of Object.entries(spec.node ?? {})) {
      const value = rest[prop];
      delete rest[prop];
      if (value !== undefined && value !== null && value !== false) nextSlots[slot] = () => value;
    }
    for (const [prop, [slot, call]] of Object.entries(spec.render ?? {})) {
      const fn = rest[prop] as ((...args: any[]) => VNodeChild) | undefined;
      delete rest[prop];
      if (fn) nextSlots[slot] = (slotProps: unknown) => call(fn, slotProps);
    }
    for (const [prop, showProp] of Object.entries(spec.show ?? {})) {
      if (rest[prop]) rest[showProp] = true;
    }
    return h(Inner, rest, nextSlots as Slots);
  };
  Adapted.inheritAttrs = false;
  Adapted.displayName = name;
  return Adapted;
}
