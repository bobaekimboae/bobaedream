<script setup lang="ts">
// 리액트 src/prototype/listing/bbm-filter-drawer.tsx 의 BbmFilterDrawer(createPortal → Teleport to body)
// onClose → emit("close"), onReset → emit("reset"), children → 기본 slot
// QF-093: PC 1024~1279 에서 좌측 필터를 숨기고 상단 "필터" 칩으로 여는 왼쪽 펼침판(참고: 트레이드미 Refine).
// 폭 320, 뒤는 딤 rgba(0,0,0,.5). 내용은 좌측 필터와 같은 부품·같은 필터 상태(children).
// 머리 "필터" + 닫기, 아래 [초기화](원본 확인 창) [N대 보기](닫기). 바깥 누르기·닫기·Esc 로 닫힘, 열린 동안 뒤 목록 스크롤 막기.
// 좌측 필터 스타일이 .marketplace.is-bbm 아래에 걸려 있어 body 로 옮긴 펼침판도 같은 클래스를 단다(bbm-drawer-root 에서 배경·여백만 지움).
import { onBeforeUnmount, onMounted } from "vue";
import { bbmIcon } from "@proto/listing/bbm-list";
import BbmActionBar from "../filters/BbmActionBar.vue";
import "@proto/listing/pc-hybrid.css";
import "@proto/listing/qf-sidebar-stable.css";
import "@proto/listing/pc-filter-charancha.css";

defineProps<{ count: number }>();
const emit = defineEmits<{ close: []; reset: [] }>();
const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") emit("close"); };
let scroller: HTMLElement | null = null;
let previous = "";
onMounted(() => {
  document.addEventListener("keydown", onKey);
  scroller = document.querySelector<HTMLElement>(".marketplace.is-bbm .mobile-scroll, .mobile-scroll");
  previous = scroller?.style.overflowY ?? "";
  if (scroller) scroller.style.overflowY = "hidden";
});
onBeforeUnmount(() => {
  document.removeEventListener("keydown", onKey);
  if (scroller) scroller.style.overflowY = previous;
});
</script>
<template>
  <Teleport to="body">
    <div class="marketplace is-bbm is-hybrid bbm-drawer-root">
      <div class="bbm-drawer-dim" aria-hidden="true" @click="emit('close')" />
      <section class="bbm-drawer" role="dialog" aria-modal="true" aria-label="필터">
        <header class="bbm-drawer-header">
          <h2>필터</h2>
          <button type="button" class="bbm-drawer-close" aria-label="닫기" @click="emit('close')"><img :src="bbmIcon('m-full-close')" alt="" aria-hidden="true"></button>
        </header>
        <div class="bbm-drawer-body"><slot /></div>
        <BbmActionBar variant="sheet" confirm-style="보기" :count="count" @reset="emit('reset')" @confirm="emit('close')" />
      </section>
    </div>
  </Teleport>
</template>
