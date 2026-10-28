<script setup lang="ts">
// 리액트 src/prototype/listing/bbm-top-chotot.tsx 의 BbmTopCrumbs. items[].onClick 은 데이터 안의 함수라 그대로 부른다
// 1줄 경로: 12/18 #8C8C8C, 마지막 항목 700 #222(누르지 않음), 사이 "/"(초톳 실측)
import type { BbmCrumb } from "@proto/listing/bbm-top-chotot";
import "@proto/listing/bbm-top-chotot.css";
defineProps<{ items: BbmCrumb[] }>();
</script>
<template>
  <nav class="bbm-ct-crumbs" aria-label="현재 위치">
    <ol>
      <li v-for="(item, index) in items" :key="`${item.label}-${index}`">
        <strong v-if="index === items.length - 1" aria-current="page">{{ item.label }}</strong>
        <button v-else type="button" @click="item.onClick?.()">{{ item.label }}</button>
        <span v-if="index !== items.length - 1" class="bbm-ct-crumb-sep" aria-hidden="true">/</span>
      </li>
    </ol>
  </nav>
</template>
