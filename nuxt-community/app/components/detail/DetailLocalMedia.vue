<script setup lang="ts">
// 글쓰기에서 첨부한 사진·영상 (정적 renderLocalMedia(): IndexedDB bbm-notion-write-media 에서 꺼내 본문 위에 보여 준다)
const props = defineProps<{ media: Array<{ id: string; kind?: string; name?: string }> }>()
const items = ref<Array<{ key: string; url: string; video: boolean; alt: string }>>([])
const urls: string[] = []

onMounted(() => {
  if (typeof indexedDB === 'undefined') return
  const request = indexedDB.open('bbm-notion-write-media', 1)
  request.onupgradeneeded = () => request.result.createObjectStore('media')
  request.onsuccess = () => {
    const db = request.result
    props.media.forEach((item, index) => {
      const read = db.transaction('media', 'readonly').objectStore('media').get(item.id)
      read.onsuccess = () => {
        if (!read.result) return
        const url = URL.createObjectURL(read.result as Blob)
        urls.push(url)
        items.value = [...items.value, { key: `${index}-${item.id}`, url, video: item.kind === 'video', alt: item.name || '첨부 사진' }]
      }
    })
  }
})
onBeforeUnmount(() => urls.forEach(url => URL.revokeObjectURL(url)))
</script>

<template>
  <div class="detailLocalMedia"><template v-for="item in items" :key="item.key"><video v-if="item.video" class="detailPhoto detailDiscussionPhoto" :src="item.url" controls playsinline /><img v-else class="detailPhoto detailDiscussionPhoto" :src="item.url" :alt="item.alt"></template></div>
</template>
