<script setup lang="ts">
// 크레딧 더 사기(Car Studio 「Buy More Credits」 창과 같은 자리). 시안이라 결제하지 않고 시험용 크레딧만 넣는다.
import { ref } from "vue";
import Modal from "./Modal.vue";
import { addCredits, go, say, ui } from "../lib/app";

const PACKS = [
  { n: 10, note: "사진 10장" },
  { n: 30, note: "사진 30장 · 인기" },
  { n: 100, note: "사진 100장 · 매매상사용" },
];
const pick = ref(30);
function buy() {
  addCredits(pick.value);
  ui.buyOpen = false;
  say(`시험용 크레딧 ${pick.value}개를 넣었어요. 지금 ${ui.credits}개예요.`);
}
</script>
<template>
  <Modal title="크레딧 더 사기" @close="ui.buyOpen = false">
    <p style="margin: 0; color: var(--sub)">사진 1장을 AI로 처리할 때 크레딧 1개를 써요. 영상 만들기는 베타 기간 동안 무료예요.</p>
    <div class="packs" role="radiogroup" aria-label="크레딧 묶음">
      <button v-for="p in PACKS" :key="p.n" class="pack" :class="{ 'is-on': pick === p.n }" type="button" role="radio" :aria-checked="pick === p.n" @click="pick = p.n">
        <strong>{{ p.n }}</strong>
        <span>크레딧</span>
        <small>{{ p.note }} · 가격 미정</small>
      </button>
    </div>
    <p style="margin: 0; font-size: 12px; color: var(--faint)">시안 화면이라 실제 결제는 하지 않아요. 고른 만큼 이 브라우저에 시험용 크레딧이 들어가요.</p>
    <template #foot>
      <button class="btn btn-line" type="button" @click="ui.buyOpen = false; go('pricing')">요금제 보기</button>
      <button class="btn btn-pri" type="button" @click="buy">크레딧 {{ pick }}개 넣기</button>
    </template>
  </Modal>
</template>
