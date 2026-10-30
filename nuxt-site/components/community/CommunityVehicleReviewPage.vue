<script setup lang="ts">
// 리액트 src/prototype/community-review/CommunityVehicleReviewPage.tsx 를 옮김.
// ?review 가 없으면 커뮤니티 목록으로 넘긴다. 상대 주소는 <base href="/bobaedream/"> 로 리액트와 같은 곳(사이트 맨 위)을 가리킨다.
import { onMounted } from "vue";
import { seoulAutoGalleryCars } from "@proto/data";
import VehicleReviewBoard from "../dealer-page/VehicleReviewBoard";
import "@proto/community-review/community-vehicle-review.css";

const reviewParam = () => new URLSearchParams(window.location.search).get("review");
const subview = Boolean(reviewParam());

onMounted(() => {
  if (!subview) window.location.replace("./community/naver-cafe-list.html?board=vehicle-review");
});
</script>

<template>
  <div v-if="subview" :class="`community-review-page${subview ? ' is-subview' : ''}`">
    <main><VehicleReviewBoard :cars="seoulAutoGalleryCars" /></main>
  </div>
</template>
