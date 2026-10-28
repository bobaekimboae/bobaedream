<script setup lang="ts">
// 리액트 listing-i18n.tsx 의 ListingLanguageSelect
import { onBeforeUnmount, ref, watch } from "vue";
import { listingLocaleOptions, type ListingLocale } from "@proto/listing/listing-i18n";
import "@proto/listing/listing-i18n.css";
import { useListingLocale } from "../../composables/listing/useListingLocale";
import ListingFlag from "./ListingFlag.vue";

withDefaults(defineProps<{ compact?: boolean }>(), { compact: false });

// languageNames 는 리액트 파일에서 export 되지 않아 그대로 옮겼다
const languageNames: Record<ListingLocale, Record<ListingLocale, string>> = {
  ko: { ko: "한국어", en: "영어", ru: "러시아어", ar: "아랍어" },
  en: { ko: "Korean", en: "English", ru: "Russian", ar: "Arabic" },
  ru: { ko: "Корейский", en: "Английский", ru: "Русский", ar: "Арабский" },
  ar: { ko: "الكورية", en: "الإنجليزية", ru: "الروسية", ar: "العربية" },
};

const { locale, option, setLocale } = useListingLocale();
const open = ref(false);
const root = ref<HTMLDivElement | null>(null);
let cleanup: (() => void) | undefined;
watch(open, (isOpen) => {
  cleanup?.();
  cleanup = undefined;
  if (!isOpen) return;
  const close = (event: PointerEvent) => { if (!root.value?.contains(event.target as Node)) open.value = false; };
  const escape = (event: KeyboardEvent) => { if (event.key === "Escape") open.value = false; };
  document.addEventListener("pointerdown", close);
  document.addEventListener("keydown", escape);
  cleanup = () => { document.removeEventListener("pointerdown", close); document.removeEventListener("keydown", escape); };
});
onBeforeUnmount(() => cleanup?.());
const choose = (id: ListingLocale) => { setLocale(id); open.value = false; };
</script>
<template>
  <div ref="root" :class="`listing-language${compact ? ' is-compact' : ''}`" data-i18n-skip="true">
    <button type="button" class="listing-language-trigger" aria-label="Select language" aria-haspopup="menu" :aria-expanded="open" @click="open = !open">
      <ListingFlag :locale="locale" /><span>{{ option.code }}</span><i aria-hidden="true">⌄</i>
    </button>
    <div v-if="open" class="listing-language-menu" role="menu" aria-label="Select language">
      <button v-for="item in listingLocaleOptions" :key="item.id" type="button" role="menuitemradio" :aria-checked="item.id === locale" :class="item.id === locale ? 'is-active' : ''" @click="choose(item.id)">
        <ListingFlag :locale="item.id" /><strong>{{ languageNames[locale][item.id] }}</strong><small>{{ item.code }}</small><i aria-hidden="true">{{ item.id === locale ? "✓" : "" }}</i>
      </button>
    </div>
  </div>
</template>
