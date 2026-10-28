<script setup lang="ts">
// 리액트 bbm-list.tsx 의 BbmCategoryMenu.
// onChoose(label, detail) → emit("choose"). onOpenGroup 은 "줬는지"에 따라 동작이 달라져서 boolean prop showOpenGroup(기본 false) + emit("openGroup", value).
import { computed, ref } from "vue";
import { asset } from "@proto/data";
import { bbmCategoryGroups, bbmCategoryItems, bbmGroupHasRail } from "@proto/listing/bbm-list";
import "@proto/listing/bbm-tokens.css";
import "@proto/listing/thumbnail-states.css";
import { getImageGuideFamily, imageGuideItems, type BbmCategoryGroup } from "./bbm-list-local";
import BbmCategoryIconRow from "./BbmCategoryIconRow.vue";
import BbmCategoryChildPills from "./BbmCategoryChildPills.vue";

const props = withDefaults(defineProps<{ counts?: Readonly<Record<string, number>>; showOpenGroup?: boolean }>(), { showOpenGroup: false });
const emit = defineEmits<{ choose: [label: string, detail?: string]; openGroup: [value: string] }>();

const imageGuideFamily = getImageGuideFamily();
const items = imageGuideFamily ? imageGuideItems[imageGuideFamily] : bbmCategoryItems;
const activeValue = ref("중고차");
const activeGroup = computed(() => bbmCategoryGroups.find((group) => group.value === activeValue.value) ?? bbmCategoryGroups[1]);
const entersNextDepthDirectly = (group: BbmCategoryGroup) => group.value === "트럭 · 특장" || group.children.length === 1 || (props.showOpenGroup && bbmGroupHasRail(group.value));
const activateGroup = (value: string) => {
  activeValue.value = value;
  const nextGroup = bbmCategoryGroups.find((group) => group.value === value);
  if (!nextGroup || !entersNextDepthDirectly(nextGroup)) return;
  if (props.showOpenGroup && bbmGroupHasRail(nextGroup.value)) { emit("openGroup", nextGroup.value); return; }
  const onlyChild = nextGroup.children.length === 1 ? nextGroup.children[0] : undefined;
  // 중고차는 브랜드, 트럭/특장은 형식 이미지, 단일 "전체" 카테고리는 각 전용 퀵필터로 바로 진입한다.
  emit("choose", onlyChild?.value ?? value, onlyChild?.detail);
};
const itemLabel = (item: [string, string, string?]) => item[2] ?? item[0];
</script>
<template>
  <section v-if="!imageGuideFamily" :class="`bbm-category-menu is-hierarchical${counts ? ' has-listing-counts' : ''}`" aria-label="차량 카테고리">
    <div class="bbm-category-labeled-row is-type-row is-titleless">
      <div class="bbm-category-labeled-content"><BbmCategoryIconRow :active-value="activeGroup.value" :counts="counts" @activate="activateGroup" /></div>
    </div>
    <div v-if="!entersNextDepthDirectly(activeGroup)" class="bbm-category-labeled-row is-detail-row is-titleless">
      <div class="bbm-category-labeled-content"><BbmCategoryChildPills :group="activeGroup" @choose="(value, detail) => emit('choose', value, detail)" /></div>
    </div>
  </section>
  <section v-else :class="`bbm-category-menu${imageGuideFamily ? ' is-image-guide' : ''}`" :aria-label="imageGuideFamily ? 'AI 제작 이미지 슬롯 검수' : '차량 유형'" :data-image-guide="imageGuideFamily ?? undefined">
    <ul class="bbm-category-menu__list">
      <li v-for="item in items" :key="`${item[0]}-${itemLabel(item)}`" class="bbm-category-menu__item">
        <button type="button" class="bbm-category-menu__button" @click="emit('choose', item[0])">
          <span class="bbm-category-menu__icon-box is-photo"><img :src="asset(item[1])" alt="" aria-hidden="true" :draggable="false" /></span>
          <span class="bbm-category-menu__label">{{ itemLabel(item) }}</span>
        </button>
      </li>
    </ul>
  </section>
</template>
