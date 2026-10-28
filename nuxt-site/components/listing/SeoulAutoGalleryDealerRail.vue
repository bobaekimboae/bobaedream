<script setup lang="ts">
// 리액트 seoul-auto-gallery-dealer-rail.tsx 의 SeoulAutoGalleryDealerRail. onOpenDealer → emit("openDealer", dealer).
import { dealers, type SeoulAutoGalleryDealer } from "@proto/listing/seoul-auto-gallery-dealer-rail";
import SeoulAutoGalleryDealerCard from "./SeoulAutoGalleryDealerCard.vue";
import SeoulAutoGalleryDealerDirectory from "./SeoulAutoGalleryDealerDirectory.vue";
import "@proto/listing/seoul-auto-gallery-dealer-rail.css";

withDefaults(defineProps<{ all?: boolean }>(), { all: false });
const emit = defineEmits<{ openDealer: [dealer: SeoulAutoGalleryDealer] }>();
</script>
<template>
  <SeoulAutoGalleryDealerDirectory v-if="all" @open-dealer="(d) => emit('openDealer', d)" />
  <section v-else class="sag-dealer-rail" aria-labelledby="sag-dealer-rail-title">
    <h2 id="sag-dealer-rail-title">딜러</h2>
    <div class="sag-dealer-track">
      <SeoulAutoGalleryDealerCard v-for="dealer in dealers" :key="`${dealer.shopNo}-${dealer.empNo}`" :dealer="dealer" @open-dealer="(d) => emit('openDealer', d)" />
    </div>
  </section>
</template>
