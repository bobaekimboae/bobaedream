<script setup lang="ts">
// 리액트 src/prototype/community-fuel-economy/CommunityFuelEconomyPage.tsx 를 옮김.
// ?fuel 이 없으면 커뮤니티 목록으로 넘긴다(<base href="/bobaedream/"> 로 리액트와 같은 주소).
import { onMounted } from "vue";
import FuelEconomyBoard from "../fuel-economy/FuelEconomyBoard.vue";

const subview = new URLSearchParams(window.location.search).get("fuel");
onMounted(() => {
  if (!subview) window.location.replace("./community/naver-cafe-list.html?board=fuel-economy");
});
</script>

<template>
  <FuelEconomyBoard v-if="subview" />
</template>
