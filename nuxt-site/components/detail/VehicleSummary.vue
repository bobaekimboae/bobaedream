<script setup lang="ts">
// 리액트 VehicleSummary(detail/index.tsx). 실매물은 목록 카드(BbmResultCard mobile, detailSummary)를 그대로 쓰고, 없으면 벤틀리 시안.
import { ref } from "vue";
import { asset, detailVehiclePlate, formatMileage, getActiveDetailCar } from "@proto/data";
import { bbmSampleHorsepower } from "@proto/data/bbm-card-samples";
import { useDetailUi } from "../../composables/detail/useDetailUi";
import { useLocationLinks, useLocationWrap } from "../../composables/detail/useLocationWrap";
import BbmResultCard from "../listing/BbmResultCard.vue";
import HeartFilledIcon from "../icons/HeartFilledIcon.vue";
import HeartIcon from "../icons/HeartIcon.vue";
import DetailSellerInfo from "./DetailSellerInfo.vue";
import { carFacts, detailLocationDong, isBmwM3CompetitionXDrive, NO_INFO } from "./detail-local";

const ui = useDetailUi();
const car = getActiveDetailCar();
const summarySpecs = ["2019", formatMileage("42,920 km"), "가솔린", detailVehiclePlate, "1인소유"];
const summaryRef = ref<HTMLElement | null>(null);
useLocationWrap(summaryRef);
useLocationLinks(summaryRef, car);
// 상단 메타의 마력은 유지한다. 아래 차량 정보 8칸에서만 마력을 제외한다.
const detailPower = car && !car.deutschSource ? (isBmwM3CompetitionXDrive(car, (car.modelGroup ?? car.title).trim()) ? "510마력" : bbmSampleHorsepower(car.id)) : undefined;
const detailBodyType = car ? carFacts(car).find(([label]) => label === "바디타입")?.[1] : undefined;
const noop = () => undefined;
</script>
<template>
  <section v-if="car" ref="summaryRef" class="vehicle-summary is-list-summary marketplace is-bbm-m is-qf-guazi"><div class="bbm-m-list">
    <BbmResultCard :car="car" :location-dong="detailLocationDong(car)" :detail-location="{}" variant="mobile" detail-summary :detail-power="detailPower" :detail-body-type="detailBodyType === NO_INFO ? undefined : detailBodyType" :liked="ui.liked" @toggle-like="ui.setLiked(!ui.liked)" @open="noop" @chat="noop" />
  </div>
    <p class="detail-posted-line"><img :src="asset('bbm/autoscout24-clock-54b8e0b2-balanced.svg')" alt="" aria-hidden="true" :draggable="false" /><span>{{ car.posted }}</span></p>
    <DetailSellerInfo :car="car" /></section>
  <section v-else class="vehicle-summary">
    <div class="vehicle-title-row"><h1>2019 벤틀리 컨티넨탈 GT 3세대 6.0 퍼스트 에디션</h1><button type="button" aria-label="매물 저장" :aria-pressed="ui.liked" @click="ui.setLiked(!ui.liked)"><HeartFilledIcon v-if="ui.liked" /><HeartIcon v-else /><span>{{ ui.liked ? "저장됨" : "저장" }}</span></button></div>
    <div class="vehicle-spec-row" aria-label="차량 핵심 정보">
      <span v-for="spec in summarySpecs" :key="spec">{{ spec }}</span>
    </div>
    <div class="detail-price-row">
      <strong>1억 4,500만원</strong>
      <button type="button" @click="ui.setSheet('priceHistory')">가격 변동</button>
    </div>
    <p class="vehicle-finance">할부 예상 월 153만원부터</p>
    <p class="vehicle-phone-note">판매자가 안심번호로 연락을 받아요</p>
    <div class="detail-contact-row" aria-label="판매자 연락">
      <a href="tel:05062469261">안심번호</a>
      <button type="button" @click="ui.notify('카카오 상담을 준비했어요')">카카오</button>
      <button type="button" @click="ui.setSheet('contact')">채팅</button>
    </div>
    <div class="vehicle-location-row">
      <p>서울 서초구 양재동</p>
      <span>등록 2개월 전</span>
    </div>
  </section>
</template>
