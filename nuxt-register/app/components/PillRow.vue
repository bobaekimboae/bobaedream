<script setup lang="ts">
// 초톳 「Bạn là」·「Tình trạng」 알약: 선택 = #222 바탕 흰 글자, 나머지 #F4F4F4
// 필수가 아닌 줄은 고른 알약을 다시 누르면 선택이 풀린다(2026-11-01 「선택된 항목 삭제하는 액션 없어」)
defineProps<{ label: string; options: string[]; modelValue: string; required?: boolean; error?: string }>();
const emit = defineEmits<{ "update:modelValue": [string] }>();
</script>
<template>
  <div>
    <div class="pills" role="radiogroup" :aria-label="label">
      <span class="pills__label">{{ label }}<span v-if="required" class="req"> *</span></span>
      <div class="pills__row">
        <button v-for="o in options" :key="o" type="button" class="pill" :class="{ 'is-on': modelValue === o }" role="radio" :aria-checked="modelValue === o" @click="emit('update:modelValue', !required && modelValue === o ? '' : o)">{{ o }}</button>
      </div>
    </div>
    <p v-if="error" class="row-err" role="alert">{{ error }}</p>
  </div>
</template>
