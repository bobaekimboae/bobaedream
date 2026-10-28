<script setup lang="ts">
// 리액트 DesktopVehicleDetail(detail/index.tsx). onBack → emit("back").
import { ref } from "vue";
import { classCars, getActiveDetailCar, relatedCars } from "@proto/data";
import DesktopHeader from "./DesktopHeader.vue";
import DesktopGallery from "./DesktopGallery.vue";
import DesktopVehicleInfo from "./DesktopVehicleInfo.vue";
import DesktopSummary from "./DesktopSummary.vue";
import VehicleInfoCard from "./VehicleInfoCard.vue";
import VehicleSummary from "./VehicleSummary.vue";
import DescriptionCard from "./DescriptionCard.vue";
import OptionsCard from "./OptionsCard.vue";
import HistoryCard from "./HistoryCard.vue";
import InspectionCard from "./InspectionCard.vue";
import WarrantyCard from "./WarrantyCard.vue";
import CarRail from "./CarRail.vue";
import { pcAsset } from "./detail-local";

const emit = defineEmits<{ back: [] }>();
const content = ref<HTMLDivElement | null>(null);
const sourceCar = getActiveDetailCar();
const back = () => emit("back");
const jump = (id: string) => {
  const target = content.value?.querySelector<HTMLElement>(`#${id}`);
  const scroll = content.value?.closest(".detail-screen");
  if (target && scroll) scroll.scrollTo({ top: target.getBoundingClientRect().top - scroll.getBoundingClientRect().top + scroll.scrollTop - 16, behavior: "smooth" });
};
const socialIcons = ["imgGroup", "imgPrimeFacebook", "imgMdiYoutube", "imgFrame1000005307"];
</script>
<template>
  <div v-if="sourceCar?.deutschSource" ref="content" class="pc-detail">
    <DesktopHeader @back="back" />
    <main class="pc-detail-container" aria-label="중고차 PC 상세">
      <div class="pc-detail-columns"><div class="pc-detail-left"><DesktopGallery @back="back" /><VehicleInfoCard /></div><aside class="pc-sidebar"><VehicleSummary /></aside></div>
      <button class="pc-return" @click="back">목록으로 돌아가기</button>
    </main>
  </div>
  <div v-else ref="content" class="pc-detail">
    <DesktopHeader @back="back" />
    <main class="pc-detail-container" aria-label="중고차 PC 상세">
      <div class="pc-detail-columns"><div class="pc-detail-left"><DesktopGallery @back="back" /><DescriptionCard desktop /><DesktopVehicleInfo /><OptionsCard desktop /><div id="pc-history"><HistoryCard /></div><div id="pc-inspection"><InspectionCard /></div><WarrantyCard /></div><DesktopSummary @jump="jump" /></div>
      <CarRail title="한강모터스 박성수의 다른 매물" :cars="relatedCars" />
      <div id="pc-related"><CarRail title="동급매물" :cars="classCars" /></div>
      <p class="safety-copy">안전한 거래와 허위매물 근절을 위해 안심번호(050) 이용 시 통화 내용이 보배드림에 안전하게 보관됩니다.<br />보배드림은 등록 시스템만 제공하며, 판매자가 직접 등록한 차량에 대한 모든 책임은 판매자에게 있습니다.</p>
      <button class="pc-return" @click="back">목록으로 돌아가기</button>
    </main>
    <footer class="pc-footer"><div><section><h3>(주) 보배네트워크 사업자 정보</h3><p>대표이사: 김보배　|　사업자등록번호: 117-81-64543</p><p>주소: (07995) 서울 양천구 목동동로 233-1 드림타워 11, 12층</p><p>통신판매업신고번호: 제2013-서울양천-0465호　|　개인정보관리책임자: 이은호</p><p>팩스: 02-6499-2329　|　메일: bobaedream@bobaedream.co.kr</p><p>Copyright ⓒ (주)보배네트워크</p></section><section><h3>고객센터</h3><strong>02-784-2329</strong><p>평일　09:00 ~ 18:00</p><p>점심시간　11:30 ~ 12:30</p></section></div><p>회사소개　　제휴/광고문의　　이용약관　　제휴/신고센터　　고객센터　　청소년보호정책　　개인정보취급방침　　원격지원</p><div class="pc-footer-social"><img v-for="icon in socialIcons" :key="icon" :src="pcAsset(`10204-${icon}.svg`)" alt="" /></div></footer>
  </div>
</template>
