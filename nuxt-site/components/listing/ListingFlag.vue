<script setup lang="ts">
// 리액트 listing-i18n.tsx 의 ListingFlag
import type { ListingLocale } from "@proto/listing/listing-i18n";
defineProps<{ locale: ListingLocale }>();
</script>
<template>
  <span class="listing-language-flag" aria-hidden="true"><svg viewBox="0 0 24 16" role="img">
    <template v-if="locale === 'ko'"><rect width="24" height="16" fill="#fff" /><g transform="rotate(33 12 8)"><path d="M8.1 8a3.9 3.9 0 0 1 7.8 0 1.95 1.95 0 0 0-3.9 0 1.95 1.95 0 0 1-3.9 0" fill="#cd2e3a" /><path d="M15.9 8a3.9 3.9 0 0 1-7.8 0A1.95 1.95 0 0 0 12 8a1.95 1.95 0 0 1 3.9 0" fill="#0047a0" /></g><g fill="#111"><path d="M2.1 3.1l4-2.1.48.9-4 2.1zm.65 1.2l4-2.1.48.9-4 2.1zm.65 1.2l4-2.1.48.9-4 2.1zM17.4 12l4-2.1.48.9-4 2.1zm.65 1.2l4-2.1.48.9-4 2.1zm.65 1.2l4-2.1.48.9-4 2.1zM17.5 4l4 2.1-.48.9-4-2.1zm-.65 1.2l1.55.82-.48.9-1.55-.82zm2.35 1.24l1.55.82-.48.9-1.55-.82zM2.5 10l1.55.82-.48.9-1.55-.82zm2.35 1.24l1.55.82-.48.9-1.55-.82zm-3 1.16l4 2.1-.48.9-4-2.1z" /></g></template>
    <template v-if="locale === 'en'"><rect width="24" height="16" fill="#fff" /><g fill="#b22234"><rect v-for="y in [0, 2, 4, 6, 8, 10, 12]" :key="y" :y="y * 16 / 13" width="24" :height="16 / 13" /></g><rect width="10.5" height="8.6" fill="#3c3b6e" /><g fill="#fff"><template v-for="x in [2, 5, 8]" :key="x"><circle v-for="y in [2, 4.3, 6.6]" :key="`${x}-${y}`" :cx="x" :cy="y" r=".45" /></template></g></template>
    <template v-if="locale === 'ru'"><rect width="24" height="5.34" fill="#fff" /><rect y="5.33" width="24" height="5.34" fill="#0039a6" /><rect y="10.66" width="24" height="5.34" fill="#d52b1e" /></template>
    <template v-if="locale === 'ar'"><rect width="24" height="16" fill="#006c35" /><path d="M5 7.2h14M7 10.5h10" stroke="#fff" stroke-width="1" stroke-linecap="round" /><circle cx="12" cy="5" r=".8" fill="#fff" /></template>
  </svg></span>
</template>
