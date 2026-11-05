<!-- 서식 줄(치지직 앱: 텍스트 도구 T 를 누르면 본문 위에 나오는 회색 줄).
     본문▾ · 기본서체 · 15 · 정렬 · B · I · U · 글자색 · 목록 · 링크 · 취소선. 글꼴 · 크기 · 색은 같은 줄이 그 목록으로 바뀌고 ‹ 로 돌아온다.
     인용구 안에서는 인용구▾ · 19 · B · I · U · 글자색만 -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import { TEXT_COLORS } from '~/composables/write/appExtensions'
import { FONT_FAMILIES, FONT_SIZES, type AppEditor } from '~/composables/write/useAppEditor'

const props = defineProps<{ editor: AppEditor }>()
const emit = defineEmits<{ link: [] }>()
const icon = (name: string) => communityAsset(`assets/reddit-write/${name}.svg`)
const mode = ref<'main' | 'font' | 'size' | 'color'>('main')
const blockMenu = ref(false)
const s = computed(() => props.editor.state.value)
const inQuote = computed(() => s.value.quote > 0)
const blockLabel = computed(() => ({ p: '본문', h3: '소제목', quote: '인용구' }[s.value.block] || '본문'))
const fontLabel = computed(() => FONT_FAMILIES.find(font => font.value === s.value.fontFamily)?.label || '기본서체')
const alignIcon = computed(() => `icon-align-${s.value.align}-outline`)
const alignLabel = computed(() => ({ left: '왼쪽 정렬', center: '가운데 정렬', right: '오른쪽 정렬' }[s.value.align]))

/* 버튼을 눌러도 본문 커서가 움직이지 않게(mousedown 기본 동작을 막는다) */
const keep = (event: Event) => event.preventDefault()
function pickBlock(kind: 'p' | 'h3' | 'quote') { blockMenu.value = false; props.editor.setBlock(kind) }
</script>

<template>
  <div class="aw-format" role="toolbar" aria-label="텍스트 서식" @mousedown="keep">
    <template v-if="mode === 'main'">
      <button class="aw-format-text is-block" type="button" aria-haspopup="dialog" @click="blockMenu = true">{{ blockLabel }}<img :src="icon('icon-caret-down-fill')" alt=""></button>
      <i class="aw-format-bar" aria-hidden="true" />
      <button v-if="!inQuote" class="aw-format-text" type="button" @click="mode = 'font'">{{ fontLabel }}</button>
      <button class="aw-format-text is-size" type="button" :aria-label="`글자 크기 ${s.fontSize}`" @click="mode = 'size'">{{ s.fontSize }}</button>
      <button v-if="!inQuote" type="button" :aria-label="alignLabel" @click="editor.cycleAlign()"><img :src="icon(alignIcon)" alt=""></button>
      <button type="button" aria-label="굵게" :aria-pressed="s.bold" :class="{ 'is-on': s.bold }" @click="editor.toggle('bold')"><img :src="icon('icon-bold-outline')" alt=""></button>
      <button type="button" aria-label="기울이기" :aria-pressed="s.italic" :class="{ 'is-on': s.italic }" @click="editor.toggle('italic')"><img :src="icon('icon-italic-outline')" alt=""></button>
      <button class="aw-format-u" type="button" aria-label="밑줄" :aria-pressed="s.underline" :class="{ 'is-on': s.underline }" @click="editor.toggle('underline')">U</button>
      <button class="aw-format-color" type="button" aria-label="글자색" @click="mode = 'color'"><img :src="icon('icon-text-outline')" alt=""><i :style="{ background: s.color || '#000' }" /></button>
      <template v-if="!inQuote">
        <button type="button" aria-label="목록" :aria-pressed="s.bullet" :class="{ 'is-on': s.bullet }" @click="editor.toggle('bullet')"><img :src="icon('icon-list-bulleted-outline')" alt=""></button>
        <button type="button" aria-label="링크" :class="{ 'is-on': s.link }" @click="s.link ? editor.unsetLink() : emit('link')"><img :src="icon('icon-link-outline')" alt=""></button>
        <button type="button" aria-label="취소선" :aria-pressed="s.strike" :class="{ 'is-on': s.strike }" @click="editor.toggle('strike')"><img :src="icon('icon-strikethrough-outline')" alt=""></button>
      </template>
    </template>
    <template v-else>
      <button class="aw-format-back" type="button" aria-label="서식으로 돌아가기" @click="mode = 'main'"><img :src="icon('icon-left-outline')" alt=""></button>
      <template v-if="mode === 'font'">
        <button v-for="font in FONT_FAMILIES" :key="font.label" class="aw-format-text" type="button" :class="{ 'is-pick': s.fontFamily === font.value }" :style="{ fontFamily: font.value || undefined }" @click="editor.setFontFamily(font.value)">{{ font.label }}</button>
      </template>
      <template v-else-if="mode === 'size'">
        <button v-for="size in FONT_SIZES" :key="size" class="aw-format-text is-size" type="button" :class="{ 'is-pick': s.fontSize === size }" @click="editor.setFontSize(size)">{{ size }}</button>
      </template>
      <template v-else>
        <button v-for="color in TEXT_COLORS" :key="color || 'none'" class="aw-swatch" type="button" :class="{ 'is-none': !color, 'is-white': color === '#ffffff', 'is-pick': s.color === color }" :style="color ? { background: color } : undefined" :aria-label="color ? `글자색 ${color}` : '글자색 없음'" @click="editor.setColor(color)" />
      </template>
    </template>

    <div v-if="blockMenu" class="aw-dim" @click.self="blockMenu = false">
      <ul class="aw-block-menu" role="radiogroup" aria-label="문단 모양">
        <li v-for="[kind, label] in ([['p', '본문'], ['h3', '소제목'], ['quote', '인용구']] as const)" :key="kind">
          <button type="button" role="radio" :aria-checked="s.block === kind" @click="pickBlock(kind)"><span>{{ label }}</span><i :class="{ 'is-on': s.block === kind }" /></button>
        </li>
      </ul>
    </div>
  </div>
</template>
