<script setup lang="ts">
// 등록하기 통과(시안): 서버가 없어 실제로 올리지 않고, 걸린 시간 · 단계별 시각을 보여 준다(딜러 · 촬영팀 등록 시간 시험용).
import Sheet from "./Sheet.vue";
import { fmtSec, type Run } from "../lib/form";

defineProps<{ run: Run; premium: boolean }>();
const emit = defineEmits<{ close: []; again: [] }>();
</script>
<template>
  <Sheet title="등록 확인" full @close="emit('close')">
    <div class="done">
      <h3>매물 등록 준비가 끝났어요</h3>
      <p>시안 화면이라 실제로 올리지는 않아요. 서버가 연결되면 이 단계에서 사진 · 영상을 올리고 매물 번호를 받아요.</p>
      <div class="done__time"><span>등록 화면에 들어온 뒤 걸린 시간</span><b>{{ fmtSec(run.total) }}</b><span>사진 {{ run.photos }}장 · 영상 {{ run.video ? "있음" : "없음" }}{{ premium ? " · 프리미엄 등록 선택" : "" }}</span></div>
      <ul class="done__steps" aria-label="단계별 시각">
        <li v-for="m in run.marks" :key="m.k"><span>{{ m.k }}</span><span>{{ fmtSec(m.t) }}</span></li>
      </ul>
      <p>다음 단계(준비 중): 프리미엄 등록 결제 · 인스타그램 · 유튜브 · 틱톡 동시 올리기</p>
    </div>
    <template #foot>
      <button type="button" class="btn btn--pri" @click="emit('again')">새 매물 등록</button>
      <button type="button" class="btn btn--line" @click="emit('close')">계속 고치기</button>
    </template>
  </Sheet>
</template>
