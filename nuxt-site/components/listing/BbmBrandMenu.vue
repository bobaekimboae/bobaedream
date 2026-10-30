<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmBrandMenu.
// renderLogo(name) → 이름 있는 scoped slot #logo="{ name }". onChoose(key) → emit("choose", key)
// 오토홈 제조사 로고 비교 시안: 카테고리 바텀시트와 같은 1열 가로 슬롯 규격을 쓴다.
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";

defineProps<{ items: Array<{ label: string; key: string; logoName?: string }>; selected: string | null }>();
const emit = defineEmits<{ choose: [key: string] }>();
defineSlots<{ logo(props: { name: string }): unknown }>();
</script>
<template>
  <section class="bbm-category-menu bbm-brand-menu" aria-label="제조사">
    <ul class="bbm-category-menu__list">
      <li v-for="item in items" :key="item.key" class="bbm-category-menu__item">
        <button type="button" :class="`bbm-category-menu__button${selected === item.key ? ' is-selected' : ''}`" :aria-pressed="selected === item.key" @click="emit('choose', item.key)">
          <span class="bbm-category-menu__icon-box is-logo"><slot name="logo" :name="item.logoName ?? item.label" /></span>
          <span class="bbm-category-menu__label">{{ item.label }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>
