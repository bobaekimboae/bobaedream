<!-- 사진 · 설명에 링크 걸기(치지직 앱 2026-11-05 폰 3차 확인)
     흰 상자 296 · 주소 칸 하나 · 아래 붙은 「취소 · 확인」(연보라 바탕, 취소 보라 글자, 확인은 주소를 넣어야 켜짐) -->
<script setup lang="ts">
import { nextTick, onMounted, ref } from 'vue'

const props = defineProps<{ value?: string, placeholder?: string }>()
const emit = defineEmits<{ ok: [href: string], cancel: [] }>()
const href = ref(props.value || '')
const input = ref<HTMLInputElement | null>(null)
onMounted(() => nextTick(() => input.value?.focus()))
function ok() {
  const raw = href.value.trim()
  if (!raw) return
  emit('ok', /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`)
}
</script>

<template>
  <div class="awu-dim" @click.self="emit('cancel')">
    <div class="awu" role="dialog" aria-modal="true" aria-label="링크 입력">
      <input ref="input" v-model="href" class="awu-input" type="url" inputmode="url" :placeholder="placeholder || 'URL을 입력해 주세요.'" aria-label="링크 주소" @keydown.enter.prevent="ok" @keydown.esc="emit('cancel')">
      <div class="awu-actions">
        <button type="button" class="is-cancel" @click="emit('cancel')">취소</button>
        <button type="button" class="is-ok" :disabled="!href.trim()" @click="ok">확인</button>
      </div>
    </div>
  </div>
</template>
