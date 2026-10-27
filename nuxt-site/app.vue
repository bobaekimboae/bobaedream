<script setup lang="ts">
import { bbmSampleCars } from "@proto/data";
import { stablePageTitle } from "@proto/listing/stable-top";
import { krRailLabel } from "@proto/listing/bbm-brand-logos";
const count = bbmSampleCars.length;
</script>
<template>
  <main style="padding:16px;font:14px/20px sans-serif">
    <p id="smoke">공용 데이터 {{ count }}대 · {{ String(stablePageTitle) }} · {{ typeof krRailLabel }}</p>
  </main>
</template>
