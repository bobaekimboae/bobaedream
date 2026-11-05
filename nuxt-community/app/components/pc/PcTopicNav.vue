<script setup lang="ts">
// 정적 updateTopicNavigation(): ?section=car|humor|politics 일 때만 하위 주제 탭 줄을 보인다.
import { sectionConfig, withLayout, type Params } from '~/composables/pc/pcBoardLogic'
import { appHref } from '~/composables/pc/usePcBoard'

const props = defineProps<{ params: Params; layout: string }>()
const inner = ref<HTMLElement | null>(null)
const section = computed(() => props.params.section || '')
const config = computed(() => sectionConfig[section.value])
const active = computed(() => props.params.topic || config.value?.allLabel || '')
const tabs = computed(() => {
  const c = config.value
  if (!c) return []
  return Object.keys(c.topics).map(topic => ({
    topic,
    selected: topic === active.value,
    href: appHref(withLayout('/pc?section=' + encodeURIComponent(section.value) + '&topic=' + encodeURIComponent(topic), props.layout)),
  }))
})

function centerActive() {
  const el = inner.value?.querySelector('.topicTab.active') as HTMLElement | null
  if (el) requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest', inline: 'center' }))
}
watch(tabs, () => nextTick(centerActive))
onMounted(centerActive)
</script>

<template>
  <nav class="topicNav" :class="{ 'is-hidden': !config }" :aria-label="config ? config.label + ' 하위 주제 게시판' : '하위 주제 게시판'">
    <div ref="inner" class="topicNavInner"><a v-for="tab in tabs" :key="tab.topic" class="topicTab" :class="{ active: tab.selected }" :href="tab.href" :aria-current="tab.selected ? 'page' : undefined">{{ tab.topic }}</a></div>
  </nav>
</template>
