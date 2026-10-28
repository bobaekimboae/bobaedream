<script setup lang="ts">
// 리액트 VehicleDetail(detail/index.tsx). FlowStack 화면 본문 부품(props 없음). 안에서 useFlow() · useDetailUi() 를 읽는다.
// 바이크 매물 → BikeVehicleDetail, PC 미리보기(820px 이상) → DesktopVehicleDetail, 그 밖 → 모바일 상세 + 시트(BottomSheet).
import { onBeforeUnmount, onMounted, ref } from "vue";
import { classCars, getActiveDetailCar, isDesktopPreview, isForcedMobileView, relatedCars, sellerScenario } from "@proto/data";
import { useFlow } from "../../composables/mobile/useFlow";
import { useDetailUi } from "../../composables/detail/useDetailUi";
import MobileScroll from "../mobile/MobileScroll.vue";
import BottomSheet from "../mobile/BottomSheet.vue";
import MobileIcon from "../icons/MobileIcon.vue";
import BikeVehicleDetail from "./BikeVehicleDetail.vue";
import DesktopVehicleDetail from "./DesktopVehicleDetail.vue";
import DetailHero from "./DetailHero.vue";
import VehicleSummary from "./VehicleSummary.vue";
import DetailTabs from "./DetailTabs.vue";
import SellerCard from "./SellerCard.vue";
import DetailHighlights from "./DetailHighlights.vue";
import VehicleInfoCard from "./VehicleInfoCard.vue";
import VehicleHistoryCard from "./VehicleHistoryCard.vue";
import AccidentInspectionCard from "./AccidentInspectionCard.vue";
import OptionsCard from "./OptionsCard.vue";
import WarrantyCard from "./WarrantyCard.vue";
import SaleCard from "./SaleCard.vue";
import DescriptionCard from "./DescriptionCard.vue";
import CarRail from "./CarRail.vue";
import CostCalculatorSheet from "./CostCalculatorSheet.vue";
import PriceHistorySheet from "./PriceHistorySheet.vue";

const flow = useFlow();
const goBack = () => flow.canGoBack ? flow.pop() : window.history.back();
const activeCar = getActiveDetailCar();
const desktop = ref(isDesktopPreview() && window.matchMedia("(min-width: 820px)").matches);
let release: (() => void) | null = null;
onMounted(() => {
  if (isForcedMobileView()) {
    desktop.value = false;
    return;
  }
  const query = window.matchMedia("(min-width: 820px)");
  const update = () => { desktop.value = query.matches; };
  query.addEventListener("change", update);
  release = () => query.removeEventListener("change", update);
});
onBeforeUnmount(() => release?.());
const ui = useDetailUi();
const closeSheet = () => ui.setSheet(null);
const onOpenChange = (open: boolean) => { if (!open) ui.setSheet(null); };
const pick = (message: string) => { ui.notify(message); ui.setSheet(null); };
</script>
<template>
  <div v-if="activeCar?.bike" class="detail-scene">
    <MobileScroll class-name="detail-screen"><BikeVehicleDetail :car="activeCar" @back="goBack" /></MobileScroll>
    <div v-if="ui.toast" class="detail-toast" role="status">{{ ui.toast }}</div>
  </div>
  <div v-else class="detail-scene">
    <MobileScroll class-name="detail-screen">
      <DesktopVehicleDetail v-if="desktop" @back="goBack" />
      <main v-else class="vehicle-detail" aria-label="중고차 상세">
        <DetailHero @back="goBack" />
        <VehicleSummary />
        <DetailTabs v-if="!activeCar?.deutschSource" />
        <div class="detail-gray-stack">
          <VehicleInfoCard v-if="activeCar?.deutschSource" />
          <template v-else>
            <SellerCard />
            <DetailHighlights />
            <VehicleInfoCard />
            <VehicleHistoryCard />
            <AccidentInspectionCard />
            <OptionsCard />
            <WarrantyCard />
            <SaleCard />
            <DescriptionCard />
          </template>
        </div>
        <template v-if="!activeCar?.deutschSource">
          <CarRail :title="`${sellerScenario.name}의 다른 매물`" :cars="relatedCars" />
          <CarRail title="동급매물" :cars="classCars" />
          <p class="safety-copy">안전한 거래와 허위매물 근절을 위해 안심번호(050) 이용 시 통화 내용이 보배드림에 안전하게 보관됩니다.<br />보배드림은 등록 시스템만 제공하며, 판매자가 직접 등록한 차량에 대한 모든 책임은 판매자에게 있습니다. <button type="button" @click="ui.notify('신고하기를 선택했어요')">신고하기</button></p>
        </template>
      </main>
    </MobileScroll>
    <div v-if="ui.toast" class="detail-toast" role="status">{{ ui.toast }}</div>
    <BottomSheet
      :open="ui.sheet !== null"
      :title="ui.sheet === 'cost' ? '구매비용 계산기' : ui.sheet === 'priceHistory' ? '가격 변동 내역' : ui.sheet === 'more' ? '매물 더보기' : '판매자 상담'"
      :description="ui.sheet === 'cost' || ui.sheet === 'priceHistory' ? undefined : ui.sheet === 'more' ? '원하는 작업을 선택하세요.' : `${sellerScenario.name}에게 문의할 수 있어요.`"
      :snap="ui.sheet === 'cost' ? 0.94 : ui.sheet === 'priceHistory' ? 0.75 : 0.42"
      @open-change="onOpenChange"
    >
      <CostCalculatorSheet v-if="ui.sheet === 'cost'" @close="closeSheet" />
      <PriceHistorySheet v-else-if="ui.sheet === 'priceHistory'" @close="closeSheet" />
      <div v-else class="detail-sheet-actions">
        <template v-if="ui.sheet === 'more'"><button type="button" @click="pick('매물 신고를 선택했어요')">허위매물 신고</button><button type="button" @click="pick('판매자를 차단했어요')">판매자 차단</button><button type="button" @click="closeSheet">취소</button></template>
        <template v-else><a :href="sellerScenario.phoneHref"><MobileIcon /> {{ sellerScenario.phoneLabel }} 전화하기</a><button type="button" @click="pick('상담 요청을 보냈어요')">문자로 상담 요청</button><button type="button" @click="closeSheet">닫기</button></template>
      </div>
    </BottomSheet>
  </div>
</template>
