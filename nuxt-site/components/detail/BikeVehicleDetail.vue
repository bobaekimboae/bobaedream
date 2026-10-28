<script setup lang="ts">
// 리액트 BikeVehicleDetail(detail/index.tsx). onBack → emit("back"). 인라인 style 숫자는 리액트처럼 px 를 붙였다.
import { ref } from "vue";
import { asset, type Car } from "@proto/data";
import SectionCard from "./SectionCard.vue";
import InfoGrid from "./InfoGrid.vue";
import { detailPhotosOf } from "./detail-local";

const props = defineProps<{ car: Car }>();
const emit = defineEmits<{ back: [] }>();
const car = props.car;
const bike = car.bike!;
const photos = detailPhotosOf(car);
const photoIndex = ref(0);
const showThumbs = photos.length > 1 && new URLSearchParams(window.location.search).get("thumbs") === "on";
const rows = [
  ["제조사", car.maker],
  ["모델", car.modelGroup ?? car.title],
  ["연식", car.filter ? `${car.filter.year}년` : "미확인"],
  ["주행거리", car.filter ? `${car.filter.mileage.toLocaleString("ko-KR")}km` : "미확인"],
  ["배기량", `${bike.displacement.toLocaleString("ko-KR")}cc`],
  ["장르", bike.genre],
  ["면허", bike.licenseClass],
  ["상태", bike.condition],
];
const sellerRows = [
  ["판매자 유형", bike.sellerType],
  ["판매자명", car.dealer],
  ["주소", bike.sellerAddress],
  ["연락 방식", bike.sellerContact],
  ["영업시간", bike.businessHours],
];
const dealRows = [["인증", bike.certified], ["인수 방식", bike.delivery], ["시나리오 버전", bike.scenarioVersion], ["이미지 등급", bike.imageGrade]];
</script>
<template>
  <main class="vehicle-detail bike-vehicle-detail" aria-label="바이크 상세">
    <section class="detail-card" :style="{ padding: '0', overflow: 'hidden' }">
      <div :style="{ position: 'relative' }">
        <img :src="photos[photoIndex] ?? asset(car.image)" :alt="car.title" :style="{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover' }" />
        <button type="button" aria-label="목록으로 돌아가기" :style="{ position: 'absolute', top: '12px', left: '12px', width: '40px', height: '40px', border: '0', borderRadius: '20px', background: 'rgba(0,0,0,.55)', color: '#fff', fontSize: '22px' }" @click="emit('back')">←</button>
      </div>
      <div v-if="showThumbs" class="detail-thumbs" role="group" aria-label="차량 사진 썸네일">
        <button v-for="(photo, index) in photos" :key="`${photo}-${index}`" type="button" :aria-label="`사진 ${index + 1} 보기`" :aria-pressed="index === photoIndex" :class="index === photoIndex ? 'is-active' : ''" @click="photoIndex = index"><img :src="photo" alt="" :draggable="false" loading="lazy" /></button>
      </div>
      <div :style="{ padding: '20px' }">
        <p :style="{ margin: '0 0 6px', color: '#777', fontSize: '13px' }">테스트용 가상 매물 · {{ bike.scenarioId }}</p>
        <h1 :style="{ margin: '0', fontSize: '23px' }">{{ car.title }}</h1>
        <p :style="{ margin: '8px 0 0', color: '#555' }">{{ car.trim }}</p>
        <strong :style="{ display: 'block', marginTop: '14px', fontSize: '22px' }">{{ car.price }}</strong>
      </div>
    </section>
    <div class="detail-gray-stack">
      <SectionCard title="바이크 정보"><InfoGrid :items="rows" /></SectionCard>
      <SectionCard title="판매자 정보"><InfoGrid :items="sellerRows" /><p :style="{ margin: '16px 0 0', color: '#666', lineHeight: 1.6 }">{{ bike.sellerIntro }}</p></SectionCard>
      <SectionCard title="거래 정보"><InfoGrid :items="dealRows" /><p :style="{ margin: '16px 0 0', color: '#777', fontSize: '13px' }">모든 판매자 정보는 테스트용 가상 정보이며 실제 연락처와 상세 주소가 아닙니다.</p></SectionCard>
    </div>
  </main>
</template>
