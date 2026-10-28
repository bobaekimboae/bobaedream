<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmCategoryPicker. onChoose(label, detail) → emit("choose", label, detail)
// QF-121: 초톳 모바일 카테고리 바텀시트처럼 그룹 제목 + 32px 알약 칩으로 선택한다.
// 실사 퀴필터 레일과 바텀시트의 역할을 분리해, 시트에서는 중복 이미지를 나열하지 않는다.
import { computed, ref } from "vue";
import { bbmCategoryGroups } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";
import { categoryGroupForSelection } from "./bbm-list-local";
import BbmCategoryRows from "./BbmCategoryRows.vue";
import BbmCategoryIconRow from "./BbmCategoryIconRow.vue";
import BbmCategoryChildPills from "./BbmCategoryChildPills.vue";

const props = defineProps<{ selected: string; selectedChild?: string | null }>();
const emit = defineEmits<{ choose: [label: string, detail?: string] }>();
const initialGroup = computed(() => categoryGroupForSelection(props.selected));
const activeValue = ref(categoryGroupForSelection(props.selected).value);
const activeGroup = computed(() => bbmCategoryGroups.find((group) => group.value === activeValue.value) ?? initialGroup.value);
// 시안(2026-10-10 「시안 만들어봐」, 미리보기 전용): ?catsheet=a 초톳식 평면 · b 아이콘 줄 + 펼친 그룹만. 없으면 기존 화면.
const proposal = new URLSearchParams(window.location.search).get("catsheet");
// 초톳식 flat: 고른 그룹의 하위 알약(전체차량이 맨 앞, 2026-10-11 초톳 앱 캡처 Tất cả xe cộ 첫 알약)
const subGroup = computed(() => (initialGroup.value.value !== "전체" && initialGroup.value.children.length > 1 ? initialGroup.value : null));
const choose = (value: string, detail?: string) => emit("choose", value, detail);
const chooseFlat = (value: string) => { activeValue.value = value; emit("choose", value); };
const activateB = (value: string) => {
  activeValue.value = value;
  const g = bbmCategoryGroups.find((group) => group.value === value);
  if (g && g.children.length === 1) emit("choose", g.children[0].value, g.children[0].detail);
};
const activateOld = (value: string) => { activeValue.value = value; };
</script>
<template>
  <BbmCategoryRows v-if="proposal !== 'b' && proposal !== 'old' && proposal !== 'flat'" :selected="selected" :selected-child="selectedChild" @choose="choose" />
  <section v-else-if="proposal === 'flat'" class="bbm-category-picker is-proposal-a" aria-label="차량 카테고리 선택">
    <div class="bbm-category-picker__group is-first"><strong class="bbm-category-picker__title">차량</strong>
      <div class="bbm-category-child-pills" role="group" aria-label="차량 카테고리">
        <button v-for="group in bbmCategoryGroups" :key="group.value" type="button" :class="group.value === initialGroup.value ? 'is-selected' : ''" :aria-pressed="group.value === initialGroup.value" @click="chooseFlat(group.value)">{{ group.label }}</button>
      </div>
    </div>
    <div v-if="subGroup" class="bbm-category-picker__group"><strong class="bbm-category-picker__title">{{ subGroup.label }}</strong><BbmCategoryChildPills :group="subGroup" :selected="selected" :selected-child="selectedChild" @choose="choose" /></div>
  </section>
  <section v-else-if="proposal === 'b'" class="bbm-category-picker is-proposal-b" aria-label="차량 카테고리 선택">
    <div class="bbm-category-picker__icons"><BbmCategoryIconRow include-all :active-value="activeGroup.value" @activate="activateB" /></div>
    <div class="bbm-category-picker__group"><strong class="bbm-category-picker__title">{{ activeGroup.label }}</strong><BbmCategoryChildPills :group="activeGroup" :selected="selected" :selected-child="selectedChild" @choose="choose" /></div>
  </section>
  <section v-else class="bbm-category-picker" aria-label="차량 카테고리 선택">
    <div class="bbm-category-picker__icons"><BbmCategoryIconRow include-all :active-value="activeGroup.value" @activate="activateOld" /></div>
    <!-- 전체 카테고리를 위로(2026-10-10 「전체가 위로 가야지」): 모든 카테고리 알약 → 펼친 그룹의 하위 알약 순서. 전체차량 그룹은 위 알약이 같은 목록이라 하나만 -->
    <div v-if="activeGroup.value !== '전체'" class="bbm-category-picker__group is-all-categories"><strong class="bbm-category-picker__title">전체 카테고리</strong><BbmCategoryChildPills :group="bbmCategoryGroups[0]" :selected="initialGroup.value" :selected-child="null" @choose="choose" /></div>
    <div class="bbm-category-picker__group"><strong class="bbm-category-picker__title">{{ activeGroup.label }}</strong><BbmCategoryChildPills :group="activeGroup" :selected="selected" :selected-child="selectedChild" @choose="choose" /></div>
  </section>
</template>
