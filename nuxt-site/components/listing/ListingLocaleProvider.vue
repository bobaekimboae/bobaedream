<script setup lang="ts">
// 리액트 src/prototype/listing/listing-i18n.tsx 의 ListingLocaleProvider.
// 기본 slot 을 그대로 그린다(감싸는 요소 없음). 문서 전체(document.body)의 글자·aria-label 등을 번역하는 MutationObserver 동작은 같다.
import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { listingLocaleOptions, translateListingText, type ListingLocale } from "@proto/listing/listing-i18n";
import "@proto/listing/listing-i18n.css";
import { listingLocaleKey } from "../../composables/listing/useListingLocale";

// readLocale · titleByLocale 은 리액트 파일에서 export 되지 않아 그대로 옮겼다
const readLocale = (): ListingLocale => {
  if (typeof window === "undefined") return "ko";
  const query = new URLSearchParams(window.location.search).get("lang");
  if (query === "ko" || query === "en" || query === "ru" || query === "ar") return query;
  const saved = window.localStorage.getItem("bbm-listing-language");
  return saved === "en" || saved === "ru" || saved === "ar" ? saved : "ko";
};

const titleByLocale: Record<ListingLocale, string> = {
  ko: "보배드림 중고차 — 중고차 매물 검색",
  en: "BOBAEDREAM Used Cars — Search car listings",
  ru: "BOBAEDREAM — автомобили с пробегом",
  ar: "بوباي دريم — سيارات مستعملة للبيع",
};

const locale = ref<ListingLocale>(readLocale());
const option = computed(() => listingLocaleOptions.find((item) => item.id === locale.value) ?? listingLocaleOptions[0]);
const originalText = new WeakMap<Node, string>();
const originalAttrs = new WeakMap<Element, Map<string, string>>();
const setLocale = (next: ListingLocale) => { locale.value = next; };

let disconnect: (() => void) | undefined;
const run = () => {
  disconnect?.();
  const current = locale.value;
  const root = document.documentElement;
  root.lang = current;
  root.dir = option.value.dir;
  root.dataset.listingLocale = current;
  document.title = titleByLocale[current];
  window.localStorage.setItem("bbm-listing-language", current);
  const url = new URL(window.location.href);
  if (url.searchParams.get("lang") !== current) {
    url.searchParams.set("lang", current);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }

  const translateNode = (node: Node) => {
    if (node.parentElement?.closest("[data-i18n-skip]")) return;
    const value = node.nodeValue ?? "";
    const stored = originalText.get(node);
    const knownTranslation = stored !== undefined && listingLocaleOptions.some((item) => value === translateListingText(stored, item.id));
    const original = stored === undefined || (value !== stored && !knownTranslation) ? value : stored;
    originalText.set(node, original);
    const translated = translateListingText(original, current);
    if (value !== translated) node.nodeValue = translated;
  };
  const translateElement = (element: Element) => {
    if (element.closest("[data-i18n-skip]")) return;
    const attributes = ["aria-label", "placeholder", "title", "alt"];
    let stored = originalAttrs.get(element);
    if (!stored) { stored = new Map(); originalAttrs.set(element, stored); }
    attributes.forEach((name) => {
      const value = element.getAttribute(name);
      if (value === null) return;
      const previous = stored!.get(name);
      const knownTranslation = previous !== undefined && listingLocaleOptions.some((item) => value === translateListingText(previous, item.id));
      const original = previous === undefined || (value !== previous && !knownTranslation) ? value : previous;
      stored!.set(name, original);
      const translated = translateListingText(original, current);
      if (translated !== value) element.setAttribute(name, translated);
    });
  };
  const translateTree = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) { translateNode(node); return; }
    if (!(node instanceof Element) && node !== document.body) return;
    if (node instanceof Element) translateElement(node);
    const walker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let next = walker.nextNode();
    while (next) {
      if (next.nodeType === Node.TEXT_NODE) translateNode(next);
      else if (next instanceof Element) translateElement(next);
      next = walker.nextNode();
    }
  };
  translateTree(document.body);
  const observer = new MutationObserver((records) => {
    records.forEach((record) => {
      if (record.type === "characterData") translateNode(record.target);
      record.addedNodes.forEach(translateTree);
      if (record.type === "attributes" && record.target instanceof Element) translateElement(record.target);
    });
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label", "placeholder", "title", "alt"] });
  disconnect = () => observer.disconnect();
};
// 리액트 useEffect([locale, option.dir]): 자식까지 그린 뒤 처음 실행, 값이 바뀌면 다시
onMounted(run);
watch([locale, () => option.value.dir], run, { flush: "post" });
onBeforeUnmount(() => disconnect?.());

provide(listingLocaleKey, { locale, option, setLocale, t: (text: string) => translateListingText(text, locale.value) });
</script>
<template>
  <slot />
</template>
