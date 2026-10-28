<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmCategoryIconRow(파일 안 전용 부품). onActivate → emit("activate", value)
// 첫 화면 유형 줄은 이미 전체차량 상태라 「전체차량」을 빼고(includeAll 아님), 카테고리 시트에서만 맨 앞에 보인다
import { asset } from "@proto/data";
import { bbmCategoryGroups } from "@proto/listing/bbm-list";

withDefaults(defineProps<{ activeValue: string; includeAll?: boolean; counts?: Readonly<Record<string, number>> }>(), { includeAll: false });
const emit = defineEmits<{ activate: [value: string] }>();
</script>
<template>
  <ul class="bbm-category-menu__list" role="list">
    <li v-for="group in bbmCategoryGroups.filter((item) => includeAll || item.value !== '전체')" :key="group.value" class="bbm-category-menu__item">
      <button type="button" class="bbm-category-menu__button" :data-category-value="group.value" :data-active-group="group.value === activeValue ? 'true' : undefined" @click="emit('activate', group.value)">
        <span class="bbm-category-menu__icon-box is-category-icon"><img :src="asset(group.icon)" alt="" aria-hidden="true" :draggable="false" /></span>
        <span class="bbm-category-menu__copy">
          <span class="bbm-category-menu__label">{{ group.label }}</span>
          <span v-if="counts?.[group.value] !== undefined" class="bbm-category-menu__count" aria-hidden="true">{{ (counts?.[group.value] ?? 0).toLocaleString("ko-KR") }}대</span>
        </span>
      </button>
    </li>
  </ul>
</template>
