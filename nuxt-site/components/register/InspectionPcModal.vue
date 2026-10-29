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
// 리액트 판은 v-html 로 넣은 입력칸에 onChange 를 달아 두었지만, 리액트가 직접 그리지 않은 입력칸이라 change 가 오지 않아
// 실제로는 선택 표시(is-selected)가 바뀌지 않는다. 두 판의 동작을 같게 하려고 여기서도 change 를 연결하지 않는다.
// 리액트 쪽이 고쳐지면 아래처럼 연결한다:
//   @change="(e) => { const input = e.target; ... item.closest('.ui-choice')?.classList.toggle('is-selected', item.checked) }"
</script>
<template>
  <RegisterLayer>
    <div class="bbm-register-layer-host" @click="onClick" v-html="html" />
  </RegisterLayer>
</template>
