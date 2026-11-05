<!-- 링크 · 임베드 시트 본문. 원본: public/community/chzzk-write.js renderLinkSheet -->
<script setup lang="ts">
import { ref } from 'vue'
import { embedLib } from '~/composables/write/legacyLibs'

const emit = defineEmits<{ toast: [message: string], embed: [href: string], link: [href: string, label: string] }>()
const url = ref('')
const embed = ref(true)
const label = ref('')

function primary() {
  const lib = embedLib()
  const raw = (lib && lib.fromCode ? lib.fromCode(url.value) : url.value).trim()
  let parsed: URL
  try { parsed = new URL(raw) }
  catch { emit('toast', '올바른 URL을 입력해주세요.'); return }
  if (!['http:', 'https:'].includes(parsed.protocol)) { emit('toast', '웹 주소만 첨부할 수 있습니다.'); return }
  if (embed.value && lib) { emit('embed', parsed.href); return }
  emit('link', parsed.href, label.value.trim() || parsed.hostname)
}
defineExpose({ primary, disabled: false })
</script>

<template>
  <div class="sheet-form">
    <input id="linkUrl" v-model="url" type="text" inputmode="url" placeholder="URL 또는 임베드 코드를 붙여 넣으세요."><label class="embed-toggle"><span><strong>임베드로 보여주기</strong><small>유튜브·인스타그램·레딧은 본문에 바로, 기사는 뉴스 카드로 보여줍니다</small></span><input id="linkEmbed" v-model="embed" type="checkbox"></label><input id="linkLabel" v-model="label" placeholder="표시할 문구 (선택)" :hidden="embed"><p class="sheet-note">http:// 또는 https:// 주소만 첨부할 수 있습니다.</p>
  </div>
</template>
