// 리액트 판과 같이 쓰는 파일(src/prototype)에 섞인 리액트 부품용 빈 대체품.
// 넉스트 판은 그 파일의 데이터·계산 함수만 쓰고, 리액트 부품(Provider 등)은 그리지 않는다.
// 모듈을 읽을 때 오류가 나지 않게만 한다. 실제로 호출되면 바로 알 수 있게 경고를 남긴다.
const warn = (name: string) => () => { console.warn(`[nuxt-site] react.${name} 호출됨 — Vue 부품으로 옮겨야 함`); return undefined as never; };
export const createContext = <T,>(value: T) => ({ Provider: null, Consumer: null, _value: value });
export const useContext = warn("useContext");
export const useState = warn("useState");
export const useEffect = warn("useEffect");
export const useLayoutEffect = warn("useLayoutEffect");
export const useMemo = warn("useMemo");
export const useCallback = warn("useCallback");
export const useRef = warn("useRef");
export const useReducer = warn("useReducer");
export const useId = warn("useId");
export const useSyncExternalStore = warn("useSyncExternalStore");
export const forwardRef = <T,>(c: T) => c;
export const memo = <T,>(c: T) => c;
export const Fragment = "fragment";
export const Children = { map: () => [], toArray: () => [] };
export const cloneElement = warn("cloneElement");
export const createElement = () => null;
export const Component = class {};
export const PureComponent = class {};
export const startTransition = (f: () => void) => f();
export const useTransition = warn("useTransition");
export const useDeferredValue = <T,>(v: T) => v;
export const useImperativeHandle = warn("useImperativeHandle");
export const createRef = () => ({ current: null });
export const isValidElement = () => false;
export const lazy = <T,>(c: T) => c;
export const Suspense = "suspense";
export default { createContext, useContext, useState, useEffect, useMemo, useRef, Fragment };
