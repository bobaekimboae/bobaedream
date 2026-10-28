<script setup lang="ts">
// 리액트 DetailTabs(detail/index.tsx). 좐좐식 상세 탭: 아래 카드 제목을 읽어 탭을 만들고, 누르면 그 카드로 이동, 스크롤하면 보고 있는 카드 탭 강조.
// 탭이 2개 미만이면 리액트처럼 숨은 빈 div(hidden)만 그린다(ref 자리 유지).
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { detailTabLabels } from "./detail-local";

const barRef = ref<HTMLDivElement | null>(null);
let lock = 0;
const tabs = ref<{ key: string; label: string }[]>([]);
const active = ref("");

const sectionsFor = () => {
  const main = barRef.value?.closest("main");
  if (!main) return [] as { key: string; label: string; el: HTMLElement }[];
  const list: { key: string; label: string; el: HTMLElement }[] = [];
  main.querySelectorAll<HTMLElement>(".detail-gray-stack > section, .related-section").forEach((el, i) => {
    const title = el.querySelector("h2")?.textContent?.trim() ?? "";
    const label = detailTabLabels[title] ?? (title.endsWith("다른 매물") ? "판매자" : "");
    if (label) list.push({ key: `${i}-${label}`, label, el });
  });
  return list;
};

let observer: MutationObserver | null = null;
onMounted(() => {
  const main = barRef.value?.closest("main");
  if (!main) return;
  const scan = () => {
    const prev = tabs.value;
    const next = sectionsFor().map(({ key, label }) => ({ key, label }));
    if (!(prev.length === next.length && prev.every((t, i) => t.key === next[i].key))) tabs.value = next;
  };
  scan();
  observer = new MutationObserver(scan);
  observer.observe(main, { childList: true, subtree: true });
});

let removeScroll: (() => void) | null = null;
const bindScroll = () => {
  removeScroll?.();
  removeScroll = null;
  const bar = barRef.value;
  const scroller = bar?.closest<HTMLElement>(".mobile-scroll");
  if (!bar || !scroller) return;
  const update = () => {
    if (Date.now() < lock) return;
    const line = scroller.getBoundingClientRect().top + bar.offsetHeight + 12;
    let current = "";
    for (const { key, el } of sectionsFor()) if (el.getBoundingClientRect().top <= line) current = key;
    if (scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight - 2) current = sectionsFor().at(-1)?.key ?? current;
    active.value = current;
  };
  scroller.addEventListener("scroll", update, { passive: true });
  update();
  removeScroll = () => scroller.removeEventListener("scroll", update);
};
onMounted(bindScroll);
watch(tabs, () => { void nextTick(bindScroll); }, { flush: "post" });

watch(active, () => {
  const bar = barRef.value;
  const tab = bar?.querySelector<HTMLElement>(".is-active");
  if (!bar || !tab) return;
  bar.scrollTo({ left: tab.offsetLeft - (bar.clientWidth - tab.offsetWidth) / 2, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
}, { flush: "post" });

onBeforeUnmount(() => {
  observer?.disconnect();
  removeScroll?.();
});

const go = (key: string) => {
  const bar = barRef.value;
  const scroller = bar?.closest<HTMLElement>(".mobile-scroll");
  const target = sectionsFor().find((section) => section.key === key)?.el;
  if (!bar || !scroller || !target) return;
  active.value = key;
  lock = Date.now() + 900;
  const top = scroller.scrollTop + target.getBoundingClientRect().top - scroller.getBoundingClientRect().top - bar.offsetHeight;
  scroller.scrollTo({ top: Math.max(0, top), behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
};
</script>
<template>
  <div v-if="tabs.length < 2" ref="barRef" hidden />
  <div v-else ref="barRef" class="detail-tabs" role="tablist" aria-label="상세 메뉴" data-scroll-drag="ignore">
    <button v-for="tab in tabs" :key="tab.key" type="button" role="tab" :aria-selected="tab.key === active" :class="tab.key === active ? 'is-active' : ''" @click="go(tab.key)">{{ tab.label }}</button>
  </div>
</template>
