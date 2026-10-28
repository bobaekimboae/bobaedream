<script setup lang="ts">
// 리액트 src/prototype/listing/sag-google-map.tsx 의 SagGoogleMap.
import { computed } from "vue";
import "@proto/listing/sag-google-map.css";

// 기본값은 리액트 파일의 SAG_ADDRESS · SAG_QUERY(export 안 됨)를 그대로 옮겼다.
const props = withDefaults(defineProps<{ title?: string; address?: string; detail?: string; query?: string; place?: string }>(), {
  title: "오시는 길",
  address: "서울 서초구 양재대로11길 36",
  detail: undefined,
  query: "서울오토갤러리 서울 서초구 양재대로11길 36",
  place: "서울오토갤러리 · 양재동",
});
const q = computed(() => encodeURIComponent(props.query));
</script>
<template>
  <section class="sag-map" :aria-label="title">
    <h3>{{ title }}</h3>
    <div class="sag-map__frame">
      <iframe
        :title="`${place.split(' · ')[0]} 위치 지도`"
        :src="`https://maps.google.com/maps?q=${q}&z=16&hl=ko&output=embed`"
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
        allowfullscreen
      />
    </div>
    <p class="sag-map__address"><b>{{ detail ? `${address}, ${detail}` : address }}</b><span>{{ place }}</span></p>
  </section>
</template>
