<script setup lang="ts">
// 초톳 「Địa chỉ」 바텀시트(2026-11-01 폰 실측): 48 머리(왼쪽 X · 가운데 제목) → 테두리 칸 4개(시·도 / 시·군·구 / 읍·면·동 / 상세 주소)
// → 「매물에 보일 주소」 안내 상자 → 아래 고정 「완료」. 칸을 누르면 그 단계부터 이어지는 고르기 시트가 열리고
// 시·도를 고르면 시·군·구, 시·군·구를 고르면 읍·면·동으로 바로 넘어간다(뒤로 화살표로 앞 단계). X는 바꾼 내용을 버린다.
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from "vue";
import Ico from "./Ico.vue";
import PickerSheet from "./PickerSheet.vue";
import { IC } from "../lib/icons";
import { districtsOf, dongsOf, SIDO } from "../lib/catalog";
import type { Region } from "../lib/form";

const props = defineProps<{ value: Region }>();
const emit = defineEmits<{ close: []; apply: [NonNullable<Region>] }>();
const d = ref({ sido: props.value?.sido ?? "", gu: props.value?.gu ?? "", dong: props.value?.dong ?? "", detail: props.value?.detail ?? "" });
const tried = ref(false);
const step = ref<"sido" | "gu" | "dong" | null>(null);
const dongs = ref<string[]>([]);
const loading = ref(false);
const x = ref<HTMLButtonElement | null>(null);
const detailOpen = ref(false);
const detailIn = ref<HTMLInputElement | null>(null);
const openDetail = async () => {
  detailOpen.value = true;
  await nextTick();
  detailIn.value?.focus();
};

const need = (k: "sido" | "gu" | "dong") => tried.value && !d.value[k];
const line = computed(() => [d.value.sido, d.value.gu, d.value.dong, d.value.detail.trim()].filter(Boolean).join(" "));

const loadDongs = async () => {
  loading.value = true;
  try {
    dongs.value = await dongsOf(d.value.sido, d.value.gu);
  } catch {
    dongs.value = [];
  }
  loading.value = false;
};
const open = async (k: "sido" | "gu" | "dong") => {
  if (k !== "sido" && !d.value.sido) k = "sido";
  else if (k === "dong" && !d.value.gu) k = "gu";
  step.value = k;
  if (k === "dong") await loadDongs();
};
const pick = async (v: string) => {
  if (step.value === "sido") {
    if (v !== d.value.sido) d.value = { ...d.value, sido: v, gu: "", dong: "" };
    const gus = districtsOf(v);
    if (gus.length === 1 && v === "세종") d.value.gu = gus[0];
    step.value = d.value.gu ? "dong" : "gu";
    if (step.value === "dong") await loadDongs();
    return;
  }
  if (step.value === "gu") {
    if (v !== d.value.gu) d.value = { ...d.value, gu: v, dong: "" };
    step.value = "dong";
    await loadDongs();
    return;
  }
  d.value.dong = v;
  step.value = null;
};
const back = () => (step.value = step.value === "dong" && d.value.sido !== "세종" ? "gu" : "sido");
const pickerProps = computed(() => {
  if (step.value === "sido") return { title: "시 · 도 고르기", items: SIDO, value: d.value.sido, ph: "시 · 도 검색", back: false };
  if (step.value === "gu") return { title: "시 · 군 · 구 고르기", items: districtsOf(d.value.sido), value: d.value.gu, ph: "시 · 군 · 구 검색", back: true };
  return { title: "읍 · 면 · 동 고르기", items: dongs.value, value: d.value.dong, ph: "읍 · 면 · 동 검색", back: true };
});
const done = () => {
  tried.value = true;
  if (!d.value.sido || !d.value.gu || !d.value.dong) return;
  emit("apply", { sido: d.value.sido, gu: d.value.gu, dong: d.value.dong, detail: d.value.detail.trim() });
};

let prevOverflow = "";
const onKey = (e: KeyboardEvent) => {
  if (e.key !== "Escape") return;
  if (detailOpen.value) detailOpen.value = false;
  else if (!step.value) emit("close");
};
onMounted(async () => {
  document.addEventListener("keydown", onKey);
  prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  await nextTick();
  x.value?.focus({ preventScroll: true });
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
  document.body.style.overflow = prevOverflow;
});
</script>
<template>
  <div class="layer">
  <div class="dim" @click="emit('close')" />
  <section class="sheet addr" role="dialog" aria-modal="true" aria-label="거래 지역">
    <header class="sheet__head sheet__head--line">
      <button ref="x" type="button" class="sheet__x" aria-label="닫기" @click="emit('close')"><Ico :src="IC.close" /></button>
      <h2>거래 지역</h2>
    </header>
    <div class="addr__body">
      <div v-for="f in ([['sido', '시 · 도'], ['gu', '시 · 군 · 구'], ['dong', '읍 · 면 · 동']] as const)" :key="f[0]" class="of addr__of" :class="{ 'is-err': need(f[0]) }">
        <button type="button" class="of__box" aria-haspopup="dialog" @click="open(f[0])">
          <template v-if="d[f[0]]">
            <span class="of__label">{{ f[1] }}<span class="req"> *</span></span>
            <span class="of__select">{{ d[f[0]] }}</span>
          </template>
          <span v-else class="of__ph">{{ f[1] }}<span class="req"> *</span></span>
          <Ico class="of__caret" :src="IC.caret" />
        </button>
        <p v-if="need(f[0])" class="of__err" role="alert">선택해 주세요</p>
      </div>
      <div class="of addr__of">
        <div class="of__box addr__detail">
          <button type="button" class="addr__detail-open" aria-haspopup="dialog" @click="openDetail">
            <template v-if="d.detail">
              <span class="of__label">상세 주소</span>
              <span class="of__select">{{ d.detail }}</span>
            </template>
            <span v-else class="of__ph">상세 주소</span>
          </button>
          <button v-if="d.detail" type="button" class="of__clear" aria-label="상세 주소 지우기" @click="d.detail = ''"><Ico :src="IC.clear" /></button>
        </div>
      </div>
      <div v-if="line" class="addr__card">
        <Ico class="addr__pin" :src="IC.pin" />
        <div>
          <b>매물에 보일 주소:</b>
          <p>{{ line }}</p>
        </div>
      </div>
    </div>
    <footer class="addr__foot">
      <button type="button" class="btn btn--pri btn--block" @click="done">완료</button>
    </footer>
  </section>
  <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
  <PickerSheet
    v-if="step"
    :key="step"
    :title="pickerProps.title"
    :sections="[{ items: pickerProps.items }]"
    :value="pickerProps.value"
    :loading="step === 'dong' && loading"
    :back="pickerProps.back"
    search-box
    :search-ph="pickerProps.ph"
    @pick="pick"
    @close="step = null"
    @back="back"
  />
  </Transition>
  <!-- 초톳 「Địa chỉ cụ thể」: 칸을 누르면 화면 위까지 차는 시트가 열리고 입력칸에 바로 커서가 간다(뒤로 · 키보드 완료로 돌아감) -->
  <Transition name="sheet" :duration="{ enter: 250, leave: 150 }">
    <div v-if="detailOpen" class="layer">
      <div class="dim dim--picker" @click="detailOpen = false" />
      <section class="sheet sheet--full sheet--picker" role="dialog" aria-modal="true" aria-label="상세 주소">
        <header class="sheet__head">
          <button type="button" class="sheet__back" aria-label="이전" @click="detailOpen = false"><Ico :src="IC.back" /></button>
          <h2>상세 주소</h2>
        </header>
        <div class="of addr__detail-of">
          <label class="of__box" for="addr-detail">
            <span class="of__label">상세 주소 입력</span>
            <input id="addr-detail" ref="detailIn" v-model="d.detail" class="of__input" maxlength="60" autocomplete="off" enterkeyhint="done" @keydown.enter.prevent="detailOpen = false" />
          </label>
        </div>
      </section>
    </div>
  </Transition>
  </div>
</template>
