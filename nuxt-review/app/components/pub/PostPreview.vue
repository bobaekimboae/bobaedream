<script setup lang="ts">
// 미리보기(动态 「预览」): 등록하면 보일 모습을 전체 화면으로 보여 준다.
import { onBeforeUnmount, onMounted } from "vue";
import Ico from "../Ico.vue";
import PostView from "./PostView.vue";
import { IC } from "../../lib/icons";
import type { Post } from "../../lib/publish";

defineProps<{ post: Partial<Post> & Pick<Post, "kind"> }>();
const emit = defineEmits<{ close: [] }>();
const onKey = (e: KeyboardEvent) => e.key === "Escape" && emit("close");
onMounted(() => document.addEventListener("keydown", onKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
</script>
<template>
  <div class="pprev" role="dialog" aria-modal="true" aria-label="미리보기">
    <header class="pprev__head"><button type="button" aria-label="미리보기 닫기" @click="emit('close')"><Ico :src="IC.back" /></button><b>미리보기</b></header>
    <PostView :post="post" />
  </div>
</template>
