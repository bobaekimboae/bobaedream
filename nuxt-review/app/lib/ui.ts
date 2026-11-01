// 앱 공용 알림(가운데 검은 토스트, 동처띠 「请对必填项进行评分」 실측 위치) · 확인창
import { reactive } from "vue";

export const toastState = reactive({ text: "", n: 0 });
let t: ReturnType<typeof setTimeout> | undefined;
export const toast = (text: string) => {
  toastState.text = text;
  toastState.n += 1;
  clearTimeout(t);
  t = setTimeout(() => (toastState.text = ""), 1800);
};

export type Ask = { title: string; cancel: string; ok: string; resolve: (ok: boolean) => void } | null;
export const askState = reactive<{ v: Ask }>({ v: null });
/** 두 버튼 확인창: ok = 오른쪽(강조) 버튼 */
export const ask = (title: string, cancel: string, ok: string) => new Promise<boolean>((resolve) => { askState.v = { title, cancel, ok, resolve }; });
/** 별 반·온 고르기 상자는 한 번에 하나만(원본과 같음) */
export const starPop = reactive<{ key: string }>({ key: "" });
