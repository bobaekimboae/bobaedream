<script setup lang="ts">
// 리액트 src/prototype/data/index.tsx 의 FavoritesProvider. 기본 slot 을 그대로 그린다(감싸는 요소 없음).
import { provide, readonly, ref } from "vue";
import { favoritesKey } from "../../composables/data/useFavorites";

const likedIds = ref<number[]>([]);
const toggleLiked = (id: number) => {
  const current = likedIds.value;
  likedIds.value = current.includes(id) ? current.filter((likedId) => likedId !== id) : [...current, id];
};
provide(favoritesKey, { likedIds: readonly(likedIds), toggleLiked });
</script>
<template>
  <slot />
</template>
