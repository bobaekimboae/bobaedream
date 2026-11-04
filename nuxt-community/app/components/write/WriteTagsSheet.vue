<!-- 태그 시트 본문. 원본: public/community/chzzk-write.js renderTagsSheet -->
<script setup lang="ts">
import { ref } from 'vue'
import { parseTags } from '~/composables/write/writeUtils'

const props = defineProps<{ tags: string[] }>()
const emit = defineEmits<{ apply: [tags: string[]] }>()
const value = ref(props.tags.map(tag => `#${tag}`).join(' '))

function primary() { emit('apply', parseTags(value.value)) }
defineExpose({ primary, disabled: false })
</script>

<template>
  <div class="sheet-form">
    <input id="tagInput" v-model="value" maxlength="120" placeholder="#으로 구분, 최대 10개"><p class="sheet-note">예: #자동차 #드라이브 #정비</p>
  </div>
</template>
