<script setup lang="ts">
// 요금제(Car Studio Pricing): 월간 · 연간 바꾸기, 요금제 3개, 맞춤 묶음. 금액은 정해지지 않아 「가격 미정」으로 두고 크레딧 수만 보인다.
import { ref } from "vue";
import Icon from "./Icon.vue";
import { addCredits, say, ui } from "../lib/app";
import { I } from "../lib/site";

const yearly = ref(false);
const PLANS = [
  { id: "starter", name: "스타터", credits: 30, desc: "개인 딜러 · 한 달 매물 몇 대", feats: ["사진 30장 처리 / 월", "배경 22종 + 내 배경", "번호판 흐리게 · 흰 판", "영상 만들기(베타 무료)"] },
  { id: "pro", name: "프로", credits: 150, desc: "매일 매물을 올리는 딜러", feats: ["사진 150장 처리 / 월", "내 번호판 · 상사 로고", "버전 기록 · 한 번에 내려받기", "영상 틀 4종 · 색 조합"], pop: true },
  { id: "biz", name: "비즈니스", credits: 600, desc: "상사 · 매매단지 팀", feats: ["사진 600장 처리 / 월", "팀 딜러 함께 쓰기(준비 중)", "촬영 키트 연동", "우선 처리"] },
];
function pick(credits: number, name: string) {
  addCredits(yearly.value ? credits * 12 : credits);
  say(`${name} 시험용 크레딧 ${yearly.value ? credits * 12 : credits}개를 넣었어요(시안이라 결제하지 않아요). 지금 ${ui.credits}개.`);
}
</script>
<template>
  <section>
    <div class="pr-head">
      <h1>필요한 만큼 고르세요</h1>
      <p>사진 1장 = 크레딧 1개. 영상은 베타 기간 무료예요. 금액은 아직 정해지지 않았어요.</p>
      <div class="seg" role="tablist" aria-label="결제 주기">
        <button type="button" role="tab" :aria-selected="!yearly" :class="{ 'is-on': !yearly }" @click="yearly = false">월간</button>
        <button type="button" role="tab" :aria-selected="yearly" :class="{ 'is-on': yearly }" @click="yearly = true">연간 <span class="badge badge-free">2개월 무료</span></button>
      </div>
    </div>
    <div class="plans">
      <article v-for="p in PLANS" :key="p.id" class="plan" :class="{ 'is-pop': p.pop }">
        <span v-if="p.pop" class="badge badge-new pop">가장 많이 써요</span>
        <h3>{{ p.name }}</h3>
        <span style="color: var(--sub); font-size: 13px">{{ p.desc }}</span>
        <div class="price">{{ yearly ? p.credits * 12 : p.credits }} <small>크레딧 / {{ yearly ? "년" : "월" }}</small></div>
        <span style="font-size: 13px; color: var(--faint)">가격 미정</span>
        <ul><li v-for="f in p.feats" :key="f"><Icon :src="I.check" /> {{ f }}</li></ul>
        <button class="btn" :class="p.pop ? 'btn-pri' : 'btn-line'" type="button" @click="pick(p.credits, p.name)">{{ p.name }} 고르기</button>
      </article>
    </div>
    <div class="custom">
      <div><h3>맞춤 묶음</h3><p>매매단지 · 상사 단위로 사진이 많다면 따로 맞춰 드려요.</p></div>
      <button class="btn" type="button" @click="say('문의 창구는 준비 중이에요.')"><Icon :src="I.support" /> 문의하기</button>
    </div>
  </section>
</template>
