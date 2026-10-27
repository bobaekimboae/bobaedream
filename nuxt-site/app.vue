<script setup lang="ts">
// 리액트 src/main.tsx · src/App.tsx · src/Prototype.tsx 의 목록 경로(MobileRuntime > ListingLocaleProvider > FavoritesProvider > DetailUiProvider > FlowStack + BuildBadge).
// 판매자페이지(?profile=dealer)는 리액트와 같이 따로 그린다(?card=1 은 명함만). 메인 홈 · 매물 등록 · 커뮤니티 경로는 아직 옮기지 않아 목록을 그린다.
// 판매자페이지의 ?listing=<id> 상세는 DealerPage 안의 FlowStack 이 그린다. 상세 부품과 아래 막대(DetailFooter)가 useDetailUi 를 쓰므로 DetailUiProvider 로 감싼다.
import { onBeforeUnmount, onMounted } from "vue";
import { isForcedMobileView, forcedMobileDesignWidth } from "@proto/data";
import { registerPrototypeApp } from "@proto/app/register";
import MobileRuntime from "./components/mobile/MobileRuntime.vue";
import FlowStack from "./components/mobile/FlowStack.vue";
import ListingLocaleProvider from "./components/listing/ListingLocaleProvider.vue";
import FavoritesProvider from "./components/data/FavoritesProvider.vue";
import { DetailUiProvider, vehicleDetailScreen } from "./components/detail";
import BuildBadge from "./components/BuildBadge.vue";
import { listScreen, savedListingsScreen } from "./components/listing/listing-flow-screens";
import { configureListingScreens } from "./lib/listing/listing-screens";
import { DealerPage } from "./components/dealer-page";
// 리액트와 같은 순서: 화면 부품(목록 · 상세)의 CSS 다음에 main.tsx 의 roboto · styles.css · prototype.css
import "@fontsource/roboto/latin-500.css";
import "@src/styles.css";
import "@src/prototype.css";

configureListingScreens({ detailScreen: vehicleDetailScreen, savedListingsScreen });

const params = new URLSearchParams(window.location.search);
const showDealerPage = params.get("profile") === "dealer";
const showDealerCard = showDealerPage && params.get("card") === "1";
const dealerDetailScreen = vehicleDetailScreen;

const root = document.documentElement;
const updateForcedMobileViewport = () => {
  const forced = isForcedMobileView();
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const wide = forced && viewportWidth > forcedMobileDesignWidth;
  const scale = wide ? viewportWidth / forcedMobileDesignWidth : 1;
  root.toggleAttribute("data-force-mobile", forced);
  root.toggleAttribute("data-force-mobile-wide", wide);
  root.style.setProperty("--force-mobile-scale", String(scale));
  root.style.setProperty("--force-mobile-height", `${viewportHeight / scale}px`);
};
onMounted(() => {
  registerPrototypeApp();
  // 리액트: 판매자페이지는 강제 모바일 표시를 쓰지 않는다
  if (showDealerPage) return;
  updateForcedMobileViewport();
  window.addEventListener("resize", updateForcedMobileViewport);
  window.visualViewport?.addEventListener("resize", updateForcedMobileViewport);
});
onBeforeUnmount(() => {
  root.removeAttribute("data-force-mobile");
  root.removeAttribute("data-force-mobile-wide");
  root.style.removeProperty("--force-mobile-scale");
  root.style.removeProperty("--force-mobile-height");
  window.removeEventListener("resize", updateForcedMobileViewport);
  window.visualViewport?.removeEventListener("resize", updateForcedMobileViewport);
});
</script>
<template>
  <MobileRuntime>
    <template v-if="showDealerCard"><DetailUiProvider><DealerPage /></DetailUiProvider><BuildBadge /></template>
    <ListingLocaleProvider v-else-if="showDealerPage"><DetailUiProvider><DealerPage :detail-screen="dealerDetailScreen" /></DetailUiProvider><BuildBadge /></ListingLocaleProvider>
    <ListingLocaleProvider v-else><FavoritesProvider><DetailUiProvider><FlowStack :initial="listScreen" /><BuildBadge /></DetailUiProvider></FavoritesProvider></ListingLocaleProvider>
  </MobileRuntime>
</template>
