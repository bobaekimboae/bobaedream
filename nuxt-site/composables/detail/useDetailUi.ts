// 리액트 src/prototype/detail/index.tsx 의 DetailUiContext · useDetailUi(provide/inject 판).
// 같은 모양 { liked, setLiked, sheet, setSheet, toast, notify } — reactive 객체라 liked/sheet/toast 는 읽을 때 최신 값이다.
// Provider 는 components/detail/DetailUiProvider.vue(createDetailUi 를 provide).
import { inject, provide, reactive, ref, type InjectionKey } from "vue";
import type { DetailSheet } from "@proto/data";

export type DetailUi = {
  liked: boolean;
  setLiked: (liked: boolean) => void;
  sheet: DetailSheet;
  setSheet: (sheet: DetailSheet) => void;
  toast: string;
  notify: (message: string) => void;
};

export const DetailUiKey: InjectionKey<DetailUi> = Symbol("DetailUi");

export function provideDetailUi() {
  const liked = ref(false);
  const sheet = ref<DetailSheet>(null);
  const toast = ref("");
  const notify = (message: string) => {
    toast.value = message;
    window.setTimeout(() => { toast.value = ""; }, 1800);
  };
  const value = reactive({
    liked,
    setLiked: (next: boolean) => { liked.value = next; },
    sheet,
    setSheet: (next: DetailSheet) => { sheet.value = next; },
    toast,
    notify,
  }) as DetailUi;
  provide(DetailUiKey, value);
  return value;
}

export function useDetailUi() {
  const value = inject(DetailUiKey, null);
  if (!value) throw new Error("useDetailUi must be used inside DetailUiProvider");
  return value;
}
