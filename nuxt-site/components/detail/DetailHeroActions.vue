<script setup lang="ts">
// 리액트 DetailHero 안의 heroActions(JSX 변수)를 부품으로 뺀 것(DOM 같음, 두 자리에서 씀). onBack → emit("back").
import { asset } from "@proto/data";
import { useDetailUi } from "../../composables/detail/useDetailUi";
const emit = defineEmits<{ back: [] }>();
const ui = useDetailUi();
</script>
<template>
  <div class="detail-hero-actions">
    <button type="button" aria-label="목록으로 돌아가기" @click="emit('back')"><img :src="asset('detail/reddit-back.svg')" alt="" /></button>
    <div>
      <button type="button" aria-label="공유하기" @click="ui.notify('공유 링크를 복사했어요')"><img :src="asset('detail/autoscout24-share.svg')" alt="" /></button>
      <button type="button" aria-label="더보기" @click="ui.setSheet('more')"><img :src="asset('detail/autoscout24-more-vertical.svg')" alt="" /></button>
    </div>
  </div>
</template>
