// 리액트 src/mobile/FlowStack.tsx 의 FlowContext · useFlow · FlowScreen · FlowControls.
//
// FlowScreen 모양(Vue 판) — 리액트의 render 함수 대신 Vue 부품을 넣는다:
//   {
//     id: string;
//     title?: string;
//     component: Component;        // 리액트 render(flow) 자리. 화면 본문 부품
//     props?: Record<string, unknown>; // component 에 넘길 props(선택)
//     header?: Component;          // 리액트 header(flow) 자리(고정 머리줄 안에 그림)
//     headerHeight?: number;
//     footer?: Component;          // 리액트 footer(flow) 자리(고정 바닥줄 안에 그림)
//     footerHeight?: number;
//   }
// 부품은 flow 를 props 로 받지 않는다. 필요하면 부품 안에서 useFlow() 를 부른다.
// 함수형 부품(() => h(...))도 component/header/footer 에 넣을 수 있다.
//
// useFlow() 는 리액트와 같은 이름의 reactive 객체 { current, previous, stack, canGoBack, push, pop, replace }.
import { inject, type Component, type InjectionKey } from "vue";

export type FlowScreen = {
  id: string;
  title?: string;
  component: Component;
  props?: Record<string, unknown>;
  header?: Component;
  headerHeight?: number;
  footer?: Component;
  footerHeight?: number;
};

export type FlowEntry = FlowScreen & { key: string };

export type FlowControls = {
  readonly current: FlowEntry;
  readonly previous: FlowEntry | null;
  readonly stack: FlowEntry[];
  readonly canGoBack: boolean;
  push: (screen: FlowScreen) => void;
  pop: () => void;
  replace: (screen: FlowScreen) => void;
};

export const FlowKey: InjectionKey<FlowControls> = Symbol("Flow");

export function useFlow() {
  const context = inject(FlowKey, null);
  if (!context) throw new Error("useFlow must be used inside FlowStack");
  return context;
}
