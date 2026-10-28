<script setup lang="ts">
// 리액트 src/prototype/register/index.tsx 의 InspectionPcModal. PC(769px~)는 dev처럼 기록부 전 항목 직접입력 모달.
// 원본 마크업을 그대로 넣고 닫기·등록·선택 표시만 연결한다. onClose → emit("close"), notify 는 함수 prop.
import { onBeforeUnmount, onMounted } from "vue";
import { asset } from "@proto/data";
import { inspectionPcHtml } from "@proto/register/inspection-pc-html";
import RegisterLayer from "./ui/RegisterLayer.vue";

const props = defineProps<{ notify: (message: string) => void }>();
const emit = defineEmits<{ close: [] }>();
const html = inspectionPcHtml.split("%ASSET%").join(asset(""));
const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") emit("close"); };
onMounted(() => document.addEventListener("keydown", onKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
const onClick = (event: MouseEvent) => {
  const target = event.target as HTMLElement;
  if (target.closest(".ui-app-modal__backdrop, .ui-app-modal__close")) { emit("close"); return; }
  const button = target.closest(".register-inspection-pc-modal__footer button");
  if (button) {
    if (button.classList.contains("ui-btn--primary")) props.notify("시안 목업이라 기록부를 저장하지 않았습니다.");
    emit("close");
  }
};
// 리액트 onChange(합성 이벤트)는 change 가 거품처럼 올라오는 것을 받는다
const onChange = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.type !== "radio" && input.type !== "checkbox") return;
  const scope = input.closest(".ui-choice-group") ?? input.closest(".register-inspection-pc-modal__body");
  scope?.querySelectorAll<HTMLInputElement>(`input[name="${CSS.escape(input.name)}"]`).forEach((item) => item.closest(".ui-choice")?.classList.toggle("is-selected", item.checked));
};
</script>
<template>
  <RegisterLayer>
    <div class="bbm-register-layer-host" @click="onClick" @change="onChange" v-html="html" />
  </RegisterLayer>
</template>
