<script setup lang="ts">
// 리액트 DesktopSummary(detail/index.tsx). jump(id) 콜백 → emit("jump", id).
import { useDetailUi } from "../../composables/detail/useDetailUi";
import HeartFilledIcon from "../icons/HeartFilledIcon.vue";
import { formatMileage } from "@proto/data";
import { pcAsset } from "./detail-local";

const emit = defineEmits<{ jump: [id: string] }>();
const ui = useDetailUi();
</script>
<template>
  <aside class="pc-sidebar">
    <section class="detail-card pc-summary">
      <div class="pc-title-row"><h1>벤틀리 컨티넨탈 GT 3세대 6.0 퍼스트 에디션</h1><button aria-label="매물 저장" :aria-pressed="ui.liked" @click="ui.setLiked(!ui.liked)"><HeartFilledIcon v-if="ui.liked" /><img v-else :src="pcAsset('9877-imgIcon.svg')" alt="" /><span>{{ ui.liked ? 1 : 0 }}</span></button></div>
      <p class="pc-specs">172무2323 · 19년 02월 · {{ formatMileage("17,000 km") }} · 가솔린</p>
      <div class="pc-badges"><span>인증중고차</span><span>1년 보증</span></div>
      <div class="pc-price-row"><strong>1억 4,500만원</strong><button @click="ui.setSheet('priceHistory')">가격 변동</button><button class="pc-insurance" @click="ui.notify('보험료는 보험사 상담을 통해 확인해 주세요.')">보험료 계산</button></div>
      <p class="pc-summary-note">6인승 독립시트로 뒷좌석의 편안함을 최우선으로 느껴보세요.</p>
      <div class="pc-summary-links"><button @click="emit('jump', 'pc-history')"><b>보험이력</b><span>0건 <img :src="pcAsset('9877-imgIcon1.svg')" alt="" /></span></button><button @click="emit('jump', 'pc-inspection')"><b>성능점검</b><span>보기 <img :src="pcAsset('9877-imgIcon1.svg')" alt="" /></span></button></div>
      <div class="pc-calculators"><button @click="ui.setSheet('cost')">비용계산기</button><button @click="emit('jump', 'pc-related')">동급매물</button><button @click="ui.notify('판매 완료된 매물 정보가 없습니다.')">팔린매물</button></div>
    </section>
    <section class="detail-card pc-seller">
      <div class="seller-profile"><img :src="pcAsset('9877-imgFrame1000006239.png')" alt="한강모터스 박성수" /><div><h2>한강모터스 박성수 <span>딜러</span></h2><p><b>5대</b> 판매중 · <b>10대</b> 판매완료</p><p>● 서울 서초구 오토갤러리</p></div></div>
      <dl><div><dt>종사원번호</dt><dd>SE25-00585 <button @click="ui.notify('한강모터스 · 서울 서초구 오토갤러리 · SE25-00585')">상사/조합정보</button></dd></div><div><dt>매매유형</dt><dd>매매알선(소속 상사 매물)</dd></div></dl>
      <div class="pc-seller-contact"><button @click="ui.setSheet('contact')">채팅</button><a href="tel:05062469261"><img :src="pcAsset('9877-imgSvgexport251.svg')" alt="" />050-6246-9261</a></div>
      <button class="pc-report" @click="ui.setSheet('more')">신고하기</button>
    </section>
  </aside>
</template>
