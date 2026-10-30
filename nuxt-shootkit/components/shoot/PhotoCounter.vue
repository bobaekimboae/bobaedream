<script setup lang="ts">
// 사진 카운터: 필수와 전체를 함께 보여 줘 숫자의 뜻이 바뀌지 않게 한다
import { ENFORCE, MAX_PHOTOS, reqLabel } from "../../lib/core";
import { PHOTO_MIN, PUBLISH_MIN } from "../../lib/items";
defineProps<{ required: number; total: number }>();
</script>
<template>
  <!-- 강제를 뺐을 때(2026-10-25): 전체 장수를 크게, 우선 4장은 작은 보조 숫자로 -->
  <span v-if="!ENFORCE" :class="`shoot-photo-count ${total >= PUBLISH_MIN ? 'is-ok' : ''}`" :aria-label="`사진 ${total}/${MAX_PHOTOS}장, ${reqLabel()} ${Math.min(required, PHOTO_MIN)}/${PHOTO_MIN}장`">
    <b>사진 {{ total }}/{{ MAX_PHOTOS }}</b>
    <small>{{ reqLabel() }} {{ Math.min(required, PHOTO_MIN) }}/{{ PHOTO_MIN }}</small>
  </span>
  <span v-else :class="`shoot-photo-count ${required >= PHOTO_MIN ? 'is-ok' : ''}`" :aria-label="`필수 ${Math.min(required, PHOTO_MIN)}/${PHOTO_MIN}장, 전체 ${total}/${MAX_PHOTOS}장`">
    <b>필수 {{ Math.min(required, PHOTO_MIN) }}/{{ PHOTO_MIN }}</b>
    <small>전체 {{ total }}/{{ MAX_PHOTOS }}</small>
  </span>
</template>
