<script setup lang="ts">
// 원본: src/prototype/listing/pc-bbmuseum.tsx BbIcon
// OP-010: 노션 "베트남 초톳" 아이콘(public/assets/icons/bb/, currentColor). 매핑표는 docs/icon-map.md
// 원본 className prop → Vue에서는 class 속성(뿌리 span에 그대로 붙는다)
import { computed } from "vue";
import { asset } from "@proto/data";
import type { BbIconName } from "../../lib/listing/pc-bbmuseum-internal";

const props = withDefaults(defineProps<{ name: BbIconName; size?: 16 | 20 | 24 | 18 | 12 }>(), { size: 20 });
const style = computed(() => ({ "--bb-icon": `url("${asset(`icons/bb/${props.name}.svg`)}")`, "--bb-size": `${props.size}px` }));
</script>
<template>
  <span class="bb-icon" :style="style" aria-hidden="true" />
</template>
