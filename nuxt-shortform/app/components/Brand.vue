<script setup lang="ts">
import { sitePath } from "../lib/site";
const logo = sitePath("assets", "bbm", "main-home-logo.svg");
</script>
<template>
  <a class="sf-brand" href="?" @click.prevent="$emit('home')">
    <span :style="{ width: '26px', height: '26px', background: `url('${logo}') left center / auto 100% no-repeat` }" aria-hidden="true" />
    <span>보배드림 <b>숏폼</b></span>
  </a>
</template>
