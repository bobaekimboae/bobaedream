<script setup lang="ts">
// 원본: src/prototype/vehicle-catalog/index.tsx CatalogLogo
// publicBase 는 사이트 맨 위 주소(lib/vehicle-catalog/internal.ts 주석 참고)
import { computed } from "vue";
import { carMakerLogoAsset } from "@proto/vehicle-catalog/car-maker-logos-v4";
import { daangnMakerLogos } from "@proto/vehicle-catalog/daangn-drive-visuals.generated";
import { selectedBikeBrandLogo } from "@proto/listing/brand-logos-bike-motofan-v01";
import { publicBase, publicCatalogAsset, type CatalogScope } from "../../lib/vehicle-catalog/internal";
import "@proto/vehicle-catalog/vehicle-catalog.css";

const props = withDefaults(defineProps<{ path?: string | null; name: string; kind?: "rail" | "list" | "chip" | "sheet"; scope?: CatalogScope }>(), { path: undefined, kind: "list", scope: "car" });

const view = computed(() => {
  const { name, kind, scope, path } = props;
  const selectedBikeLogo = scope === "bike" ? selectedBikeBrandLogo(name) : null;
  const bikeLogo = selectedBikeLogo?.logo ?? null;
  const approved = scope === "car" ? carMakerLogoAsset(name) : null;
  const daangnLogo = scope === "car" ? daangnMakerLogos[name] : null;
  const latestKgmLogo = scope === "car" && name === "KG모빌리티(쌍용)"
    ? `${publicBase}assets/brand/rail-v01/kgm.png`
    : null;
  const approvedSource = approved ? `${publicBase}assets/maker-model/logos/encar-1005-trim/${approved.file}` : null;
  const source = bikeLogo
    ? `${publicBase}assets/bike/logos/${selectedBikeLogo?.directory}/${bikeLogo.file}`
    : latestKgmLogo
      ? latestKgmLogo
      : kind === "sheet" && approvedSource
        ? approvedSource
        : daangnLogo
          ? daangnLogo
          : approvedSource
            ? approvedSource
            : publicCatalogAsset(path);
  const scale = kind === "rail" || kind === "sheet" ? 1 : 24 / 38;
  const bikeSize = bikeLogo ? (() => {
    let width = 26 * Math.sqrt(bikeLogo.ratio);
    let height = 26 / Math.sqrt(bikeLogo.ratio);
    if (width > 38) { width = 38; height = width / bikeLogo.ratio; }
    if (height > 26) { height = 26; width = height * bikeLogo.ratio; }
    return { width: `${width * scale}px`, height: `${height * scale}px` };
  })() : null;
  const sheetSize = kind === "sheet" && approved ? (() => {
    const ratio = approved.width / approved.height;
    if (name === "현대") return { width: 35, height: 35 / ratio };
    if (name === "기아") return { width: 38, height: 38 / ratio };
    if (name === "르노코리아(삼성)") return { width: 30.5 * ratio, height: 30.5 };
    if (name === "기타 제조사" || name === "기타 수입차") return { width: 30, height: 30 };
    if (ratio <= 1.25) return { width: Math.min(40, 30 * ratio), height: 30 };
    return { width: 40, height: Math.min(30, 40 / ratio) };
  })() : null;
  const style = sheetSize
    ? { width: `${sheetSize.width}px`, height: `${sheetSize.height}px` }
    : latestKgmLogo
      ? { width: `${38 * scale}px`, height: `${6 * scale}px` }
      : daangnLogo
        ? undefined
        : bikeSize ?? (approved ? { width: `${approved.width * scale}px`, height: `${approved.height * scale}px` } : undefined);
  const standard = selectedBikeLogo?.set ?? (latestKgmLogo ? "kgm-drive-latest" : daangnLogo ? "daangn-drive" : approved ? "v4" : "legacy");
  return { source, style, standard };
});
</script>
<template>
  <span :class="`catalog-logo is-${kind}${view.source ? '' : ' is-placeholder'}`" :data-testid="`catalog-logo-${name}`" :data-logo-standard="view.standard"><img v-if="view.source" :src="view.source" alt="" :draggable="false" :style="view.style"><span v-else aria-hidden="true">{{ name.slice(0, 1) }}</span></span>
</template>
