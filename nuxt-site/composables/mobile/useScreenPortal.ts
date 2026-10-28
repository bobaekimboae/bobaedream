// 리액트 src/mobile/PhoneFrame.tsx 의 ScreenPortalContext → provide/inject.
// 리액트 screenRef.current → Vue screenRef.value (화면 div, 아직 안 붙었으면 null).
import { inject, type InjectionKey, type Ref } from "vue";

export type ScreenPortalContextValue = { screenRef: Ref<HTMLDivElement | null> };

export const ScreenPortalKey: InjectionKey<ScreenPortalContextValue> = Symbol("ScreenPortal");

export function useScreenPortal() {
  const context = inject(ScreenPortalKey, null);
  if (!context) throw new Error("useScreenPortal must be used inside PhoneFrame");
  return context;
}
