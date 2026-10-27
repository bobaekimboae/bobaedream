import { inject, type ComputedRef, type InjectionKey, type Ref } from "vue";
import type { ListingLocale, listingLocaleOptions } from "@proto/listing/listing-i18n";

// 리액트 src/prototype/listing/listing-i18n.tsx 의 ListingLocaleContext + useListingLocale.
// Vue 판은 값이 반응형이다: locale 은 Ref, option 은 ComputedRef(템플릿에서는 자동으로 풀린다, 스크립트에서는 .value).
// setLocale · t 는 리액트와 같은 함수(t 는 부를 때의 locale 로 번역).
export type ListingLocaleOption = (typeof listingLocaleOptions)[number];
export type ListingLocaleContextValue = {
  locale: Readonly<Ref<ListingLocale>>;
  option: ComputedRef<ListingLocaleOption>;
  setLocale: (locale: ListingLocale) => void;
  t: (text: string) => string;
};

export const listingLocaleKey: InjectionKey<ListingLocaleContextValue> = Symbol("ListingLocale");

export function useListingLocale() {
  const context = inject(listingLocaleKey, null);
  if (!context) throw new Error("useListingLocale must be used inside ListingLocaleProvider");
  return context;
}
