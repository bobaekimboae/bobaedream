<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmCategoryRows(파일 안 전용 부품). onChoose → emit("choose", label, detail)
// 초톳 카테고리 시트(2026-10-11 「전체차량 · 중고차 ㅡ 하위 알약 · 트럭특장 우측 터치하면 하위 알약」): 한 줄에 카테고리 하나.
// 하위가 있는 줄은 이름이든 오른쪽 화살표든 누르면 그 아래에 하위 알약이 펼쳐지고(2026-10-11 「중고차 터치하면 하위 카테고리가 열려」), 하위가 없는 줄은 누르면 바로 고른다. 여러 줄 동시에 펼침 가능.
import { computed, ref } from "vue";
import { asset } from "@proto/data";
import { bbmCategoryGroups } from "@proto/listing/bbm-list";
import { categoryGroupForSelection } from "./bbm-list-local";
import BbmCategoryChildPills from "./BbmCategoryChildPills.vue";

const props = defineProps<{ selected: string; selectedChild?: string | null }>();
const emit = defineEmits<{ choose: [label: string, detail?: string] }>();
const selectedGroup = computed(() => categoryGroupForSelection(props.selected));
const initial = categoryGroupForSelection(props.selected);
const open = ref<string[]>(initial.value !== "전체" && initial.children.length > 1 ? [initial.value] : []);
const toggle = (value: string) => { open.value = open.value.includes(value) ? open.value.filter((item) => item !== value) : [...open.value, value]; };
const expandableOf = (group: (typeof bbmCategoryGroups)[number]) => group.value !== "전체" && group.children.length > 1;
const isOpenOf = (group: (typeof bbmCategoryGroups)[number]) => expandableOf(group) && open.value.includes(group.value);
</script>
<template>
  <section class="bbm-category-picker is-rows" aria-label="차량 카테고리 선택">
    <ul class="bbm-category-rows">
      <li v-for="group in bbmCategoryGroups" :key="group.value" :class="`bbm-category-row${isOpenOf(group) ? ' is-open' : ''}${group.value === selectedGroup.value ? ' is-selected' : ''}${expandableOf(group) ? ' is-expandable' : ''}`">
        <div class="bbm-category-row__head">
          <button type="button" class="bbm-category-row__name" :aria-pressed="expandableOf(group) ? undefined : group.value === selectedGroup.value" :aria-expanded="expandableOf(group) ? isOpenOf(group) : undefined" @click="expandableOf(group) ? toggle(group.value) : emit('choose', group.value)">
            <span class="bbm-category-row__icon"><img :src="asset(group.icon)" alt="" aria-hidden="true" :draggable="false" /></span>
            <span>{{ group.label }}</span>
          </button>
          <button v-if="expandableOf(group)" type="button" class="bbm-category-row__toggle" :aria-expanded="isOpenOf(group)" :aria-label="`${group.label} 하위 카테고리 ${isOpenOf(group) ? '접기' : '펼치기'}`" @click="toggle(group.value)"><i aria-hidden="true" /></button>
          <span v-else class="bbm-category-row__toggle is-leaf" aria-hidden="true"><i /></span>
        </div>
        <BbmCategoryChildPills v-if="isOpenOf(group)" :group="group" :selected="selected" :selected-child="selectedChild" @choose="(value, detail) => emit('choose', value, detail)" />
      </li>
    </ul>
  </section>
</template>
