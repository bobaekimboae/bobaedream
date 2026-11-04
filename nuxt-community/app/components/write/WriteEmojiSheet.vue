<!-- 스티커(이모지) 시트 본문. 원본: public/community/chzzk-write.js loadEmojis · renderEmojiSheet
     목록은 public/community/data/emoji-v17.json 을 그대로 읽는다(한 번만). -->
<script setup lang="ts">
import { computed, ref } from 'vue'

interface EmojiItem { e: string, c: string, d?: string }
const emit = defineEmits<{ pick: [emoji: string] }>()

const categories: [string, string][] = [['face-emotion', '표정'], ['person-people', '사람'], ['animals-nature', '동물'], ['food-drink', '음식'], ['travel-places', '여행'], ['activities-events', '활동'], ['objects', '사물'], ['symbols', '기호'], ['flags', '국기']]
const category = useState('write-emoji-category', () => 'face-emotion')
const emojis = useState<EmojiItem[]>('write-emojis', () => [])
const loaded = ref(emojis.value.length > 0)

if (!emojis.value.length) {
  // 공용 legacyJson() 은 넉스트 $fetch 의 baseURL(/bobaedream/nuxt-community/)이 앞에 붙어 다른 주소를 읽는다 → 브라우저 fetch 로 직접 읽는다
  fetch(communityAsset('data/emoji-v17.json'))
    .then(response => response.json() as Promise<{ emojis?: EmojiItem[] }>)
    .then((data) => { emojis.value = data.emojis || [] })
    .catch(() => { emojis.value = ['😀', '😂', '😍', '👍', '🔥', '🎉', '🚗', '🏍️'].map(e => ({ e, c: 'face-emotion' })) })
    .finally(() => { loaded.value = true })
}

const values = computed(() => emojis.value.filter(item => item.c === category.value).slice(0, 140))
</script>

<template>
  <template v-if="loaded">
    <nav class="emoji-tabs"><button v-for="[key, label] in categories" :key="key" type="button" :data-emoji-category="key" :class="key === category ? 'is-active' : ''" @click="category = key">{{ label }}</button></nav>
    <div class="emoji-grid"><button v-for="(item, index) in values" :key="`${index}-${item.e}`" type="button" :data-emoji="item.e" :aria-label="item.d || item.e" @click="emit('pick', item.e)">{{ item.e }}</button></div>
  </template>
</template>
