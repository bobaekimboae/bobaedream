<!-- 가운데 안내 창. 확인만 있는 알림(치지직: 초록 확인) · 두 버튼 확인(취소 / 그만두기) -->
<script setup lang="ts">
import { onMounted, ref } from 'vue'

withDefaults(defineProps<{ title?: string, message: string, ok?: string, cancel?: string, tone?: 'green' | 'purple' }>(), { title: '', ok: '확인', cancel: '', tone: 'green' })
const emit = defineEmits<{ ok: [], cancel: [] }>()
const okButton = ref<HTMLButtonElement | null>(null)
onMounted(() => okButton.value?.focus({ preventScroll: true }))
</script>

<template>
  <div class="aw-dim" @click.self="cancel ? emit('cancel') : undefined">
    <section class="aw-alert" role="alertdialog" aria-modal="true" :aria-label="title || message">
      <h2 v-if="title">{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="aw-alert-actions" :class="{ 'is-two': cancel }">
        <button v-if="cancel" class="aw-alert-cancel" type="button" @click="emit('cancel')">{{ cancel }}</button>
        <button ref="okButton" class="aw-alert-ok" :class="`is-${tone}`" type="button" @click="emit('ok')">{{ ok }}</button>
      </div>
    </section>
  </div>
</template>
