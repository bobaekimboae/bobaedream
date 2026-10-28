<script setup lang="ts">
// 리액트 src/prototype/filters/bbm-parts-gallery.tsx 의 BbmPartsGallery — QF-076 부품 비교 화면(?bbmparts=1)
// onChange → emit("change", next). countWith 는 값을 돌려받으므로 함수 prop 그대로. cars 는 원본도 쓰지 않음(받기만).
// 원본의 checkList(...) 그리기 함수는 같은 DOM 을 템플릿에 그대로 펼쳤다.
import { computed, ref, shallowRef } from "vue";
import { bbmCheckOptions, bbmOptionGroups, bbmRangePresets, bbmSidebarItems } from "@proto/filters/bbm-filter-options";
import { bbmOriginalCounts } from "@proto/filters/bbm-original-counts";
import { countBbmSelections, emptyBbmFilters, setBbmRange, toggleBbmCheck, type BbmCarLike, type BbmCheckKey, type BbmFilterValues } from "@proto/filters/bbm-filter-state";
import BbmActionBar from "./BbmActionBar.vue";
import BbmCheckGrid from "./BbmCheckGrid.vue";
import BbmCheckRow from "./BbmCheckRow.vue";
import BbmFullFilter from "./BbmFullFilter.vue";
import BbmFullItem from "./BbmFullItem.vue";
import BbmModal from "./BbmModal.vue";
import BbmPresetChips from "./BbmPresetChips.vue";
import BbmRangeInputs from "./BbmRangeInputs.vue";
import BbmSheet from "./BbmSheet.vue";
import BbmTabs from "./BbmTabs.vue";

type Overlay = null | "modal-check" | "modal-region" | "modal-range" | "modal-option" | "sheet" | "full";

const props = defineProps<{ value: BbmFilterValues; cars?: BbmCarLike[]; countWith: (bbm: BbmFilterValues) => number }>();
const emit = defineEmits<{ change: [next: BbmFilterValues] }>();
const overlay = ref<Overlay>(null);
const draft = shallowRef<BbmFilterValues>(props.value);
const optionTab = ref(bbmOptionGroups[0][0]);
const priceTab = ref<"일반" | "리스 / 렌트">("일반");
const open = (next: Overlay) => { draft.value = props.value; overlay.value = next; };
const close = () => { overlay.value = null; };
const confirm = () => { emit("change", draft.value); close(); };
const power = computed(() => draft.value.ranges.power ?? { min: "", max: "" });
const draftCount = computed(() => props.countWith(draft.value));
const countOf = (key: BbmCheckKey, option: string) => bbmOriginalCounts[key]?.[option] ?? null;
const setDraft = (next: BbmFilterValues) => { draft.value = next; };
const setValue = (next: BbmFilterValues) => emit("change", next);
const priceTabs = ["일반", "리스 / 렌트"] as const;
const optionTabs = bbmOptionGroups.map(([name]) => name);
const optionList = computed(() => bbmOptionGroups.find(([name]) => name === optionTab.value)?.[1] ?? []);
const fullLabels = ["카테고리", "제조사 · 모델", ...bbmSidebarItems.map((item) => item.label)];
const noop = () => undefined;
</script>
<template>
  <div class="bbmf-gallery">
    <h1>QF-076 필터 공통 부품</h1>
    <p>개발 시안 원본 실측값으로 만든 부품 모음. 고른 값 {{ countBbmSelections(value) }}개(모양만, 목록은 거르지 않음) · 지금 목록 {{ countWith(value).toLocaleString("ko-KR") }}대</p>
    <div class="bbmf-gallery-grid">
      <section class="bbmf-gallery-card"><h2>체크 행 · 사이드바(상자 17, 수 오른쪽 끝) — 바디타입</h2><BbmCheckGrid :columns="1" label="bodyType"><BbmCheckRow v-for="option in bbmCheckOptions.bodyType" :key="option" size="sidebar" :label="option" :count="countOf('bodyType', option)" :checked="Boolean(value.checks.bodyType?.includes(option))" @toggle="setValue(toggleBbmCheck(value, 'bodyType', option))" /></BbmCheckGrid></section>
      <section class="bbmf-gallery-card"><h2>체크 행 · 모달(상자 20, 수 이름 +8) — 연료</h2><BbmCheckGrid :columns="1" label="fuel"><BbmCheckRow v-for="option in bbmCheckOptions.fuel" :key="option" size="modal" :label="option" :count="countOf('fuel', option)" :checked="Boolean(value.checks.fuel?.includes(option))" @toggle="setValue(toggleBbmCheck(value, 'fuel', option))" /></BbmCheckGrid></section>
      <section class="bbmf-gallery-card"><h2>2열 체크 — 지역</h2><BbmCheckGrid :columns="2" label="region"><BbmCheckRow v-for="option in bbmCheckOptions.region" :key="option" size="modal" :label="option" :count="countOf('region', option)" :checked="Boolean(value.checks.region?.includes(option))" @toggle="setValue(toggleBbmCheck(value, 'region', option))" /></BbmCheckGrid></section>
      <section class="bbmf-gallery-card"><h2>범위 입력 "~" + 구간 칩 2열 — 최고출력</h2><BbmRangeInputs unit="마력" :min="value.ranges.power?.min ?? ''" :max="value.ranges.power?.max ?? ''" @change="setValue(setBbmRange(value, 'power', $event))" /><div :style="{ height: '24px' }" /><BbmPresetChips :options="bbmRangePresets.power?.presets ?? []" @pick="noop" /></section>
      <section class="bbmf-gallery-card"><h2>범위 입력 두 줄 "부터/까지" + 구간 칩 2열 — 주행거리(사이드바)</h2><BbmRangeInputs unit="km" layout="stack" :min="value.ranges.mileage?.min ?? ''" :max="value.ranges.mileage?.max ?? ''" @change="setValue(setBbmRange(value, 'mileage', $event))" /><div :style="{ height: '16px' }" /><BbmPresetChips :options="bbmRangePresets.mileage?.presets ?? []" @pick="noop" /></section>
      <section class="bbmf-gallery-card"><h2>탭 — 가격</h2><BbmTabs label="가격 종류" :tabs="priceTabs" :value="priceTab" @change="priceTab = $event" /></section>
      <section class="bbmf-gallery-card"><h2>버튼 줄 — 모달 · 시트 · 전체 화면</h2>
        <BbmActionBar :count="14847" @reset="noop" @confirm="noop" />
        <BbmActionBar :count="14847" variant="sheet" confirm-style="보기" @reset="noop" @confirm="noop" />
        <BbmActionBar :count="14847" variant="full" confirm-style="보기" @reset="noop" @confirm="noop" />
      </section>
      <section class="bbmf-gallery-card"><h2>모달 412 · 바텀시트 · 전체 필터 화면 열기</h2>
        <div class="bbmf-gallery-buttons">
          <button type="button" @click="open('modal-check')">모달 · 연료</button>
          <button type="button" @click="open('modal-region')">모달 · 지역(2열)</button>
          <button type="button" @click="open('modal-range')">모달 · 최고출력</button>
          <button type="button" @click="open('modal-option')">모달 · 차량 옵션</button>
          <button type="button" @click="open('sheet')">바텀시트 · 연료</button>
          <button type="button" @click="open('full')">전체 필터 화면</button>
        </div>
      </section>
    </div>
    <BbmModal v-if="overlay === 'modal-check'" title="연료" @close="close">
      <BbmCheckGrid :columns="1" label="fuel"><BbmCheckRow v-for="option in bbmCheckOptions.fuel" :key="option" size="modal" :label="option" :count="countOf('fuel', option)" :checked="Boolean(draft.checks.fuel?.includes(option))" @toggle="setDraft(toggleBbmCheck(draft, 'fuel', option))" /></BbmCheckGrid>
      <template #footer><BbmActionBar variant="modal" confirm-style="확인" :count="draftCount" @reset="setDraft(emptyBbmFilters)" @confirm="confirm" /></template>
    </BbmModal>
    <BbmModal v-if="overlay === 'modal-region'" title="지역" @close="close">
      <BbmCheckGrid :columns="2" label="region"><BbmCheckRow v-for="option in bbmCheckOptions.region" :key="option" size="modal" :label="option" :count="countOf('region', option)" :checked="Boolean(draft.checks.region?.includes(option))" @toggle="setDraft(toggleBbmCheck(draft, 'region', option))" /></BbmCheckGrid>
      <template #footer><BbmActionBar variant="modal" confirm-style="확인" :count="draftCount" @reset="setDraft(emptyBbmFilters)" @confirm="confirm" /></template>
    </BbmModal>
    <BbmModal v-if="overlay === 'modal-range'" title="최고출력" @close="close">
      <BbmRangeInputs unit="마력" :min="power.min" :max="power.max" @change="setDraft(setBbmRange(draft, 'power', $event))" /><div :style="{ height: '24px' }" /><BbmPresetChips :options="bbmRangePresets.power?.presets ?? []" @pick="noop" />
      <template #footer><BbmActionBar variant="modal" confirm-style="확인" :count="draftCount" @reset="setDraft(emptyBbmFilters)" @confirm="confirm" /></template>
    </BbmModal>
    <BbmModal v-if="overlay === 'modal-option'" title="차량 옵션" wide @close="close">
      <div :style="{ display: 'flex', gap: '16px' }">
        <BbmTabs variant="side" label="옵션 분류" :tabs="optionTabs" :value="optionTab" @change="optionTab = $event" />
        <div :style="{ flex: 1 }"><BbmCheckGrid><BbmCheckRow v-for="option in optionList" :key="option" :label="option" :count="bbmOriginalCounts.options?.[option] ?? null" :checked="Boolean(draft.checks.options?.includes(option))" @toggle="setDraft(toggleBbmCheck(draft, 'options', option))" /></BbmCheckGrid></div>
      </div>
      <template #footer><BbmActionBar :count="0" reset-label="취소" confirm-label="선택완료" @reset="close" @confirm="confirm" /></template>
    </BbmModal>
    <BbmSheet v-if="overlay === 'sheet'" title="연료" @close="close">
      <BbmCheckGrid :columns="1" label="fuel"><BbmCheckRow v-for="option in bbmCheckOptions.fuel" :key="option" size="modal" :label="option" :count="countOf('fuel', option)" :checked="Boolean(draft.checks.fuel?.includes(option))" @toggle="setDraft(toggleBbmCheck(draft, 'fuel', option))" /></BbmCheckGrid>
      <template #footer><BbmActionBar variant="sheet" confirm-style="보기" :count="draftCount" @reset="setDraft(emptyBbmFilters)" @confirm="confirm" /></template>
    </BbmSheet>
    <BbmFullFilter v-if="overlay === 'full'" @close="close">
      <BbmFullItem v-for="label in fullLabels" :key="label" :label="label" @open="noop" />
      <template #footer><BbmActionBar variant="full" confirm-style="보기" :count="draftCount" @reset="setDraft(emptyBbmFilters)" @confirm="confirm" /></template>
    </BbmFullFilter>
  </div>
</template>
