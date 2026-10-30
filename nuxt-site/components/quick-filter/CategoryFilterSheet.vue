<script setup lang="ts">
// 리액트 src/prototype/quick-filter/index.tsx 의 CategoryFilterSheet. onChoose → emit("choose", category), onClose → emit("close")
import { computed, ref } from "vue";
import { asset, categorySheetItems, usedCarCategoryOptions } from "@proto/data";
import Icon from "../shared/Icon.vue";

const props = defineProps<{ selected: string }>();
const emit = defineEmits<{ choose: [category: string]; close: [] }>();
const usedCarOpen = ref(true);
const selectedChild = computed(() => (props.selected === "전체" || props.selected === "중고차" ? "전체" : props.selected));
</script>
<template>
  <div class="category-filter-sheet">
    <header class="category-filter-header">
      <h2>카테고리</h2>
      <button type="button" aria-label="카테고리 닫기" @click="emit('close')"><Icon name="category-sheet-close.svg" /></button>
    </header>
    <div class="category-filter-list">
      <template v-for="item in categorySheetItems" :key="item.name">
        <section v-if="item.name === '중고차'" class="category-filter-group">
          <div class="category-filter-row">
            <span class="category-filter-mark"><img :src="asset(item.icon ?? 'categories/used-car.svg')" alt="" aria-hidden="true" :draggable="false" /></span>
            <strong>{{ item.name }}</strong>
            <button class="category-filter-toggle" type="button" :aria-label="`중고차 하위 카테고리 ${usedCarOpen ? '숨기기' : '보기'}`" :aria-expanded="usedCarOpen" @click="usedCarOpen = !usedCarOpen"><Icon :name="usedCarOpen ? 'category-chevron-down.svg' : 'category-chevron-right.svg'" /></button>
          </div>
          <div v-if="usedCarOpen" class="category-filter-children" aria-label="중고차 하위 카테고리">
            <button v-for="option in usedCarCategoryOptions" :key="option" type="button" :class="selectedChild === option ? 'is-selected' : ''" :aria-pressed="selectedChild === option" @click="emit('choose', option)">{{ option }}</button>
          </div>
        </section>
        <button v-else class="category-filter-row category-filter-link" type="button" @click="emit('choose', item.name)">
          <span class="category-filter-mark"><img v-if="item.icon" :src="asset(item.icon)" alt="" aria-hidden="true" :draggable="false" /></span>
          <strong>{{ item.name }}</strong>
          <Icon name="category-chevron-right.svg" />
        </button>
      </template>
    </div>
  </div>
</template>
