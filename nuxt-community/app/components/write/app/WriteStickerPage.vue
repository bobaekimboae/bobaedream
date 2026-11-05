<!-- 스티커(치지직 앱: 화면 전체, 뒤로 · 가운데 「스티커」, 묶음 탭 줄, 4칸 격자).
     치지직 스티커 그림은 쓰지 않고 공용 이모지 목록(public/community/data/emoji-v17.json)을 묶음별로 보여 준다. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import WriteToolPage from './WriteToolPage.vue'

interface EmojiItem { e: string, c: string, d?: string }
const emit = defineEmits<{ pick: [emoji: string], close: [] }>()
const packs: [string, string][] = [['face-emotion', '😀'], ['person-people', '👋'], ['animals-nature', '🐶'], ['food-drink', '🍔'], ['travel-places', '🚗'], ['activities-events', '⚽'], ['objects', '💡'], ['symbols', '❤️'], ['flags', '🏁']]
const pack = useState('write-emoji-category', () => 'face-emotion')
const emojis = useState<EmojiItem[]>('write-emojis', () => [])
const loaded = ref(emojis.value.length > 0)
if (!emojis.value.length) {
  fetch(communityAsset('data/emoji-v17.json'))
    .then(response => response.json() as Promise<{ emojis?: EmojiItem[] }>)
    .then((data) => { emojis.value = data.emojis || [] })
    .catch(() => { emojis.value = ['😀', '😂', '😍', '👍', '🔥', '🎉', '🚗', '🏍️'].map(e => ({ e, c: 'face-emotion' })) })
    .finally(() => { loaded.value = true })
}
const list = computed(() => emojis.value.filter(item => item.c === pack.value).slice(0, 160))
</script>

<template>
  <WriteToolPage title="스티커" left-icon="icon-back-outline" left-label="뒤로가기" @left="emit('close')">
    <nav class="aw-sticker-tabs" aria-label="스티커 묶음">
      <button v-for="[key, face] in packs" :key="key" type="button" :class="{ 'is-active': pack === key }" :aria-pressed="pack === key" @click="pack = key">{{ face }}</button>
    </nav>
    <div v-if="loaded" class="aw-sticker-grid">
      <button v-for="(item, index) in list" :key="`${index}-${item.e}`" type="button" :aria-label="item.d || item.e" @click="emit('pick', item.e)">{{ item.e }}</button>
    </div>
  </WriteToolPage>
</template>
