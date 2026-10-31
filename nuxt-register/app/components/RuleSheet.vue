<script setup lang="ts">
// 초톳 「Quy định hình ảnh」(사진 규칙) — 해도 되는 것 1 · 안 되는 것 3, 아래 「확인했어요」
import Sheet from "./Sheet.vue";
const emit = defineEmits<{ close: [] }>();
</script>
<template>
  <Sheet title="사진 규칙" full @close="emit('close')">
    <div class="rule">
      <h3><span class="rule__ok" aria-hidden="true">●</span>이렇게 올려 주세요</h3>
      <p>실제 차량을 직접 찍은 사진이 구매자에게 믿음을 줘요.</p>
      <h3><span class="rule__no" aria-hidden="true">●</span>올릴 수 없어요</h3>
      <p>예전 매물이나 다른 차량 사진을 그대로 다시 쓰는 것</p>
      <h3><span class="rule__no" aria-hidden="true">●</span>올릴 수 없어요</h3>
      <p>링크, 전화번호, 광고 문구, 상호, 직접 넣은 테두리 · 틀이 들어간 사진</p>
      <h3><span class="rule__no" aria-hidden="true">●</span>올릴 수 없어요</h3>
      <p>한 장에 10MB를 넘는 사진</p>
    </div>
    <template #foot><button type="button" class="btn btn--pri" @click="emit('close')">확인했어요</button></template>
  </Sheet>
</template>
