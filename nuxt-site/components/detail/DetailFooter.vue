<script setup lang="ts">
// 리액트 DetailFooter(detail/index.tsx). FlowScreen.footer 부품(props 없음, footerHeight 56).
import { asset, detailVehiclePlate, getActiveDetailCar, vehicleHistoryUrl } from "@proto/data";
import { useDetailUi } from "../../composables/detail/useDetailUi";

const ui = useDetailUi();
const activeCar = getActiveDetailCar();
</script>
<template>
  <div v-if="activeCar?.deutschSource" class="detail-bottom-bar"><a class="detail-call" :href="activeCar.deutschSource.url" target="_blank" rel="noreferrer">원본 매물 · 판매자 문의</a></div>
  <div v-else-if="activeCar?.bike" class="detail-bottom-bar">
    <button class="detail-history" type="button" @click="ui.notify('가상 매물 정보입니다')">가상 매물</button>
    <button class="detail-call" type="button" @click="ui.notify(activeCar.bike?.sellerContact ?? '앱 채팅 전용 (가상)')"><img :src="asset('detail/call.svg')" alt="" /> 연락 방식</button>
    <button class="detail-consult" type="button" @click="ui.notify('테스트용 앱 채팅입니다')">채팅</button>
  </div>
  <div v-else class="detail-bottom-bar">
    <a class="detail-history" :href="vehicleHistoryUrl(detailVehiclePlate)">이력조회</a>
    <a class="detail-call" href="tel:05062469261"><img :src="asset('detail/call.svg')" alt="" /> 전화</a>
    <button class="detail-zalo" type="button" @click="ui.notify('카카오 상담을 준비했어요')">카카오</button>
    <button class="detail-consult" type="button" @click="ui.setSheet('contact')">채팅</button>
  </div>
</template>
