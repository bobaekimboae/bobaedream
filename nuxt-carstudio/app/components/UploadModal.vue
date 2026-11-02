<script setup lang="ts">
// 처리 방식 고르기(Car Studio 업로드 창): 편집기 · 배경 흐림 · 멀티뷰 → 번호판을 어떻게 할지 → 확인.
import { computed, ref } from "vue";
import Modal from "./Modal.vue";
import PlateIllu from "./PlateIllu.vue";
import type { Mode, PlateMode } from "../lib/store";
import { newId, readPlates, writePlates, type CustomPlate } from "../lib/store";

const props = defineProps<{ count: number; credits: number }>();
const emit = defineEmits<{ close: []; confirm: [v: { mode: Mode; plateMode: PlateMode; customPlate: string }] }>();
const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "editor", label: "편집기", desc: "차만 오려 내 보배드림 배경에 올려요" },
  { id: "blur", label: "배경 흐림", desc: "찍은 장소는 두고 배경만 흐리게" },
  { id: "multi", label: "멀티뷰", desc: "여러 각도를 한 장에 모아요" },
];
const mode = ref<Mode>("editor");
const hide = ref(false);
const plateMode = ref<Exclude<PlateMode, "keep">>("blur");
const plates = ref<CustomPlate[]>(readPlates());
const pick = ref(plates.value[0]?.id ?? "");
const adding = ref(plates.value.length === 0);
const text = ref("보배드림");
const color = ref("#FFFFFF");
const COLORS = ["#FFFFFF", "#FFD60A", "#306BD9", "#111111"];
function addPlate() {
  const t = text.value.trim();
  if (!t) return;
  const p = { id: newId("pl"), text: t.slice(0, 12), color: color.value };
  plates.value = [p, ...plates.value].slice(0, 8);
  writePlates(plates.value);
  pick.value = p.id;
  adding.value = false;
}
const custom = computed(() => plates.value.find((p) => p.id === pick.value));
const ready = computed(() => !hide.value || plateMode.value !== "custom" || !!custom.value);
function ok() {
  const pm: PlateMode = hide.value ? plateMode.value : "keep";
  emit("confirm", { mode: mode.value, plateMode: pm, customPlate: pm === "custom" && custom.value ? `${custom.value.text}|${custom.value.color}` : "" });
}
</script>
<template>
  <Modal title="사진 처리 방식" wide @close="emit('close')">
    <div class="mode-tabs" role="radiogroup" aria-label="처리 방식">
      <button v-for="m in MODES" :key="m.id" class="mode-tab" :class="{ 'is-on': mode === m.id }" type="button" role="radio" :aria-checked="mode === m.id" @click="mode = m.id">
        <strong>{{ m.label }}</strong><small>{{ m.desc }}</small>
      </button>
    </div>
    <div class="illu"><PlateIllu :mode="hide ? plateMode : 'keep'" /></div>
    <strong style="font-size: 15px">번호판을 어떻게 할까요?</strong>
    <div style="display: grid; gap: 8px">
      <button class="opt" :class="{ 'is-on': !hide }" type="button" @click="hide = false"><span class="dot" /><span><strong>번호판 그대로 두기</strong><small>딜러 매물은 번호판을 보여 주는 경우가 많아요</small></span></button>
      <button class="opt" :class="{ 'is-on': hide }" type="button" @click="hide = true"><span class="dot" /><span><strong>번호판 가리기</strong><small>AI가 짐작한 자리에 칸을 놓아요. 편집기에서 칸을 옮길 수 있어요</small></span></button>
    </div>
    <div v-if="hide" style="display: grid; gap: 10px">
      <div class="chips" role="radiogroup" aria-label="가리는 방법">
        <button class="chip" :class="{ 'is-on': plateMode === 'blur' }" type="button" role="radio" :aria-checked="plateMode === 'blur'" @click="plateMode = 'blur'">흐리게</button>
        <button class="chip" :class="{ 'is-on': plateMode === 'white' }" type="button" role="radio" :aria-checked="plateMode === 'white'" @click="plateMode = 'white'">흰 판으로 가리기</button>
        <button class="chip" :class="{ 'is-on': plateMode === 'custom' }" type="button" role="radio" :aria-checked="plateMode === 'custom'" @click="plateMode = 'custom'">내 번호판</button>
      </div>
      <div v-if="plateMode === 'custom'" style="display: grid; gap: 10px">
        <span class="row-l">내 번호판</span>
        <div class="plates">
          <button v-for="p in plates" :key="p.id" class="plate-chip" :class="{ 'is-on': pick === p.id }" type="button" :style="{ background: p.color, color: p.color === '#FFFFFF' || p.color === '#FFD60A' ? '#111' : '#fff' }" @click="pick = p.id">{{ p.text }}</button>
          <button v-if="!adding" class="plate-chip" type="button" style="box-shadow: inset 0 0 0 1.5px #b7bfcb; color: var(--sub); font-weight: 700" @click="adding = true">+ 새로 추가</button>
        </div>
        <div v-if="adding" class="cols" style="align-items: end">
          <label class="field"><span>판에 쓸 글자(12자)</span><input v-model="text" class="input" maxlength="12" placeholder="예: 보배드림" /></label>
          <div class="field"><span>판 색</span>
            <div class="chips">
              <button v-for="c in COLORS" :key="c" type="button" class="chip" :aria-label="`색 ${c}`" :class="{ 'is-on': color === c }" :style="{ background: c, width: '36px', padding: 0, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.2)' }" @click="color = c" />
            </div>
          </div>
          <button class="btn btn-line btn-sm" type="button" :disabled="!text.trim()" @click="addPlate">이 판 저장</button>
        </div>
      </div>
    </div>
    <p style="margin: 0; font-size: 13px; color: var(--sub)">사진 {{ props.count }}장 · 크레딧 {{ props.count }}개를 써요(지금 {{ props.credits }}개). 차를 찾지 못한 사진은 크레딧을 돌려드려요.</p>
    <template #foot>
      <button class="btn btn-line" type="button" @click="emit('close')">취소</button>
      <button class="btn btn-pri" type="button" :disabled="!ready" @click="ok">확인</button>
    </template>
  </Modal>
</template>
