<script setup lang="ts">
// 리액트 src/Prototype.tsx 의 detailScreen.render(`<AppFlowBack screenId="vehicle-detail" /><VehicleDetail />`)와 같은 묶음.
import AppFlowBack from "../app/AppFlowBack.vue";
import VehicleDetail from "./VehicleDetail.vue";
</script>
<template>
  <AppFlowBack screen-id="vehicle-detail" />
  <VehicleDetail />
</template>
