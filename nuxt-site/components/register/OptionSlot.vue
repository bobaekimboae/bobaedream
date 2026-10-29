<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 OptionSlot. 옵션 팝업은 본문 구조가 달라(pop-slot-body > pop-container > side-tabs + pop-body) Pop rawBody 로 그린다.
// setDraft → emit("setDraft", next), setTab → emit("setTab", tab)
import { optionGroups } from "@proto/register/data";
import { cx } from "./register-local";

const props = defineProps<{ draft: Set<string>; tab: string }>();
const emit = defineEmits<{ setDraft: [next: Set<string>]; setTab: [tab: string] }>();
const toggle = (key: string) => {
  const next = new Set(props.draft);
  if (next.has(key)) next.delete(key); else next.add(key);
  emit("setDraft", next);
};
const pickTab = (title: string) => { emit("setTab", title); document.getElementById(`bbm-register-opt-${title}`)?.scrollIntoView({ block: "start" }); };
</script>
<template>
  <div class="pop-slot-body">
    <div class="pop-container">
      <aside class="side-tabs">
        <button v-for="group in optionGroups" :key="group.title" type="button" :class="cx('option-side-tab', tab === group.title && 'active')" @click="pickTab(group.title)">{{ group.title }}</button>
      </aside>
      <div class="pop-body">
        <section v-for="group in optionGroups" :key="group.title" :id="`bbm-register-opt-${group.title}`" :class="cx('section-container', tab === group.title && 'active')">
          <h2 class="section-title">{{ group.title }}</h2>
          <div class="section-list">
            <label v-for="item in group.items" :key="`${group.title}:${item.name}`" :class="cx('ci opt-item', draft.has(`${group.title}:${item.name}`) && 'sel')" @click.prevent="toggle(`${group.title}:${item.name}`)">
              <input type="checkbox" readonly :checked="draft.has(`${group.title}:${item.name}`)" />
              <span class="check-circle" />
              <span class="option-name">{{ item.name }}</span>
            </label>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
