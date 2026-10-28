<script setup lang="ts">
// 리액트 src/prototype/listing/bbm-brand-logos.tsx 의 railBrandLogo(name) (JSX 를 돌려주는 함수 → 부품)
/** 과쯔 승용 제조사 레일 로고(오토홈 원본 trim, rail-v01). 파일이 없는 브랜드는 아무것도 그리지 않는다.
 *  리액트의 `railBrandLogo(name) ?? <다른 로고/>` 는 부르는 쪽에서 `hasRailBrandLogo(name)`(아래 export)로 나눠 쓴다. */
import { computed } from "vue";
import { asset } from "@proto/data";
import { krBrandName, opticalRailBrandLogoSize } from "@proto/listing/bbm-brand-logos";
import { railBrandLogosV01 } from "@proto/listing/brand-logos-rail-v01";
import "@proto/listing/bbm-brand-logos.css";

const props = defineProps<{ name: string }>();
const logo = computed(() => railBrandLogosV01[props.name] ?? railBrandLogosV01[krBrandName(props.name) ?? ""]);
</script>
<script lang="ts">
import { krBrandName as resolveName } from "@proto/listing/bbm-brand-logos";
import { railBrandLogosV01 as railLogos } from "@proto/listing/brand-logos-rail-v01";
/** railBrandLogo(name) 이 null 이 아닌지(= 이 부품이 무언가 그리는지) */
export function hasRailBrandLogo(name: string) {
  return Boolean(railLogos[name] ?? railLogos[resolveName(name) ?? ""]);
}
</script>
<template>
  <span v-if="logo" class="kr-brand-logo is-plain is-rail-v01" :data-brand="name" :data-ratio="logo.ratio" data-logo-set="rail-v01">
    <img :src="asset(`brand/rail-v01/${logo.file}`)" alt="" :draggable="false" :style="opticalRailBrandLogoSize(name, logo.ratio)" />
  </span>
</template>
