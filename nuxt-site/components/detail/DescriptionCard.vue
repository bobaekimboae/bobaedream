<script setup lang="ts">
// 리액트 DescriptionCard(detail/index.tsx). 실매물이면 그리지 않는다(시안 폴백 전용).
import { ref } from "vue";
import { getActiveDetailCar } from "@proto/data";
import SectionCard from "./SectionCard.vue";
import ChevronDownIcon from "../icons/ChevronDownIcon.vue";

withDefaults(defineProps<{ desktop?: boolean }>(), { desktop: false });
const expanded = ref(false);
const hasCar = !!getActiveDetailCar();
</script>
<template>
  <SectionCard v-if="!hasCar" :title="desktop ? '차량 설명' : '상세 설명'">
    <div :class="`description-copy${expanded ? ' is-expanded' : ''}`">
      <p>2022년 5월식 벤틀리 컨티넨탈 GT 4.0 모델을 판매합니다.<br />벤틀리가 V8엔진으로 구동되는 3세대 컨티넨탈 GT를 선보였다. 쿠페와 컨버터블 형태로 출시될 이 모델은 올해 말부터 미국에서 판매될 예정이며, 이어 2020년 상반기에는 유럽 및 다른 국가에서도 판매될 예정이다.</p>
      <p>파워트레인은 기존의 6.0리터 W12엔진 대신 4.0리터 V8 가솔린 트윈터보 엔진이 장착됐다. 최대출력 550마력, 최고토크 78.5kg·m의 파워를 발휘합니다.</p>
    </div>
    <div class="contact-chip">연락처: 050-6246-9261 <a href="tel:05062469261">연락하기</a></div>
    <button class="more-copy-button" type="button" :aria-expanded="expanded" @click="expanded = !expanded">{{ expanded ? "접기" : "더보기" }} <ChevronDownIcon /></button>
  </SectionCard>
</template>
