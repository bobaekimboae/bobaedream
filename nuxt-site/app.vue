<script setup lang="ts">
// 리액트 src/main.tsx · src/App.tsx · src/Prototype.tsx 의 목록 경로(MobileRuntime > ListingLocaleProvider > FavoritesProvider > DetailUiProvider > FlowStack + BuildBadge).
// 메인 홈 · 딜러 화면 · 매물 등록 · 커뮤니티 경로는 아직 옮기지 않아 주소와 상관없이 목록을 그린다.
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
// 리액트와 같은 순서: 화면 부품(목록 · 상세)의 CSS 다음에 main.tsx 의 roboto · styles.css · prototype.css
import "@fontsource/roboto/latin-500.css";
import "@src/styles.css";
import "@src/prototype.css";

configureListingScreens({ detailScreen: vehicleDetailScreen, savedListingsScreen });

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
    <ListingLocaleProvider><FavoritesProvider><DetailUiProvider><FlowStack :initial="listScreen" /><BuildBadge /></DetailUiProvider></FavoritesProvider></ListingLocaleProvider>
  </MobileRuntime>
</template>
