<script setup lang="ts">
// 리액트 src/prototype/listing/bbm-brand-logos.tsx 의 KrBrandLogo
/** 로고 칸(퀵필터 48×28 · 목록 24×24 · plain 40×40). 로고가 없으면 빈 칸(이름 시작선을 맞춘다). 이미지는 alt=""(이름이 바로 옆) */
import { computed } from "vue";
import { asset } from "@proto/data";
import { krBrandLogo, krBrandName, krListLogoSize, krPlainLogoSize, krRailLabel, krRailLogoSize } from "@proto/listing/bbm-brand-logos";
import { driveTop10BrandLogos } from "@proto/listing/brand-logos-drive10.generated";
import { autohomeTop10BrandLogos } from "@proto/listing/brand-logos-autohome10.generated";
import { railBrandLogosV01 } from "@proto/listing/brand-logos-rail-v01";
import "@proto/listing/bbm-brand-logos.css";

const props = withDefaults(defineProps<{ name: string; kind: "rail" | "list" | "plain"; initialFallback?: boolean }>(), { initialFallback: false });
const px = (value: number) => `${Math.round(value * 100) / 100}px`;

const resolvedName = computed(() => krBrandName(props.name) ?? props.name);
const logoSet = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("brandlogo") : null;
const driveLogo = computed(() => (logoSet === "drive10" ? driveTop10BrandLogos[resolvedName.value] : null));
const autohomeLogo = computed(() => (logoSet === "autohome" ? autohomeTop10BrandLogos[resolvedName.value] : null));
// Drive에서 확인한 현행 KGM 워드마크를 기본 제조사 목록에도 공용한다.
// 구형 쌍용 엠블럼이나 검정 위키 로고 대신 퀵필터 레일과 같은 남색 원본을 쓴다.
const latestKgmLogo = computed(() => (resolvedName.value === "KG모빌리티(쌍용)" ? railBrandLogosV01[resolvedName.value] : null));
const defaultLogo = computed(() => krBrandLogo(props.name));
const logo = computed(() => (autohomeLogo.value ?? driveLogo.value) ?? latestKgmLogo.value ?? defaultLogo.value);
const logoSource = computed(() => (autohomeLogo.value
  ? asset(`brand/autohome10/${autohomeLogo.value.file}`)
  : driveLogo.value
    ? asset(`brand/drive10/${driveLogo.value.file}`)
    : latestKgmLogo.value
      ? asset(`brand/rail-v01/${latestKgmLogo.value.file}`)
      : defaultLogo.value
        ? asset(`brand/kr/${defaultLogo.value.slug}.png`)
        : null));
const size = computed(() => {
  const current = logo.value;
  if (!current) return null;
  if (props.kind === "plain") return krPlainLogoSize(current.ratio);
  const value = props.kind === "rail" ? krRailLogoSize(current.ratio) : krListLogoSize(current.ratio);
  return { width: px(value.width), height: px(value.height) };
});
const dataLogoSet = computed(() => (autohomeLogo.value ? "autohome10" : driveLogo.value ? "drive10" : latestKgmLogo.value ? "rail-v01" : "default"));
</script>
<template>
  <!-- QF-114: 로고를 못 구한 브랜드(바이크·트럭)는 이름 첫 글자 원형(#F4F4F4, 600)으로 임시 표시 -->
  <span v-if="!logo && initialFallback" :class="`kr-brand-logo is-${kind} is-initial`" :data-brand="name"><span class="kr-brand-initial" aria-hidden="true">{{ krRailLabel(name).slice(0, 1) }}</span></span>
  <span v-else :class="`kr-brand-logo is-${kind}${logo ? '' : ' is-empty'}`" :data-brand="resolvedName" :data-ratio="logo?.ratio" :data-logo-set="dataLogoSet">
    <img v-if="logoSource && size" :src="logoSource" alt="" :draggable="false" :style="size" />
  </span>
</template>
