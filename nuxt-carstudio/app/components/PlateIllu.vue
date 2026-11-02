<script setup lang="ts">
// 번호판 질문 그림: 보배드림이 직접 그린 단순한 차 뒷모습(Car Studio 그림은 쓰지 않음).
defineProps<{ mode: "keep" | "blur" | "white" | "custom" }>();
</script>
<template>
  <svg viewBox="0 0 240 130" role="img" :aria-label="mode === 'keep' ? '번호판이 보이는 차' : '번호판을 가린 차'">
    <rect x="18" y="104" width="204" height="10" rx="5" fill="#0E1B2B" opacity=".12" />
    <path d="M44 60 L66 28 Q72 20 82 20 H158 Q168 20 174 28 L196 60 Z" fill="#DCE3EC" stroke="#0E1B2B" stroke-width="3" stroke-linejoin="round" />
    <path d="M74 54 L86 32 H154 L166 54 Z" fill="#9FB4CF" opacity=".7" />
    <rect x="28" y="58" width="184" height="40" rx="12" fill="#F4F6F9" stroke="#0E1B2B" stroke-width="3" />
    <rect x="36" y="66" width="34" height="12" rx="4" fill="#E0465E" />
    <rect x="170" y="66" width="34" height="12" rx="4" fill="#E0465E" />
    <rect x="34" y="96" width="26" height="16" rx="5" fill="#0E1B2B" />
    <rect x="180" y="96" width="26" height="16" rx="5" fill="#0E1B2B" />
    <g v-if="mode === 'keep'">
      <rect x="92" y="74" width="56" height="16" rx="3" fill="#fff" stroke="#0E1B2B" stroke-width="2" />
      <text x="120" y="86" text-anchor="middle" font-size="10" font-weight="800" fill="#0E1B2B">12가 3456</text>
    </g>
    <rect v-else-if="mode === 'blur'" x="92" y="74" width="56" height="16" rx="3" fill="#B9C2CE" />
    <rect v-else-if="mode === 'white'" x="92" y="74" width="56" height="16" rx="3" fill="#fff" stroke="#0E1B2B" stroke-width="2" />
    <g v-else>
      <rect x="92" y="74" width="56" height="16" rx="3" fill="#FFD60A" stroke="#0E1B2B" stroke-width="2" />
      <text x="120" y="86" text-anchor="middle" font-size="9" font-weight="800" fill="#0E1B2B">보배드림</text>
    </g>
    <circle v-if="mode !== 'keep'" cx="196" cy="34" r="14" fill="#306BD9" />
    <path v-if="mode !== 'keep'" d="M189 34 l5 5 l9 -10" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>
