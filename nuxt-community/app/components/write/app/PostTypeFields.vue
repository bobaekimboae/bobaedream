<!-- 글 종류별 입력 칸(postTypes.ts 의 목록대로 그린다). 치지직형 · 네이버 카페형이 함께 쓴다 -->
<script setup lang="ts">
import { computed } from 'vue'
import { fieldVisible, type PostField, type PostType } from '~/composables/write/postTypes'

const props = defineProps<{ type: PostType, values: Record<string, unknown>, problem: string }>()
const emit = defineEmits<{ change: [key: string, value: unknown], open: [] }>()
const fields = computed(() => props.type.fields.filter(field => fieldVisible(field, props.values)))
const value = (field: PostField) => props.values[field.key]
function set(field: PostField, next: unknown) { emit('change', field.key, next) }
function onNumber(field: PostField, event: Event) {
  const raw = (event.target as HTMLInputElement).value.replace(/[^\d.]/g, '')
  const [whole, ...rest] = raw.split('.')
  const decimals = field.decimals || 0
  set(field, decimals && rest.length ? `${whole}.${rest.join('').slice(0, decimals)}` : (whole || ''))
}
function score(field: PostField, item: string): number { return Number(((value(field) || {}) as Record<string, number>)[item] || 0) }
function setScore(field: PostField, item: string, next: number) { set(field, { ...((value(field) || {}) as Record<string, number>), [item]: next }) }
const monthNow = new Date().toISOString().slice(0, 7)
</script>

<template>
  <section class="aw-type-card" :data-post-type="type.id" :aria-label="`${type.label} 정보`">
    <header>
      <button type="button" class="aw-type-chip" @click="emit('open')">{{ type.label }}<img :src="communityAsset('assets/reddit-write/icon-caret-down-fill.svg')" alt=""></button>
      <span>{{ type.description }}</span>
    </header>
    <div v-for="field in fields" :key="field.key" class="aw-type-field" :class="`is-${field.type}`">
      <span class="aw-type-label">{{ field.label }}<i v-if="field.required" aria-label="필수">*</i></span>
      <input v-if="field.type === 'text'" :value="String(value(field) ?? '')" :placeholder="field.placeholder" maxlength="40" :aria-label="field.label" @input="set(field, ($event.target as HTMLInputElement).value)">
      <label v-else-if="field.type === 'number'" class="aw-type-number">
        <input :value="String(value(field) ?? '')" inputmode="decimal" :placeholder="field.placeholder || '0'" :aria-label="field.label" @input="onNumber(field, $event)"><em>{{ field.unit }}</em>
      </label>
      <input v-else-if="field.type === 'month'" type="month" :max="monthNow" :value="String(value(field) ?? '')" :aria-label="field.label" @input="set(field, ($event.target as HTMLInputElement).value)">
      <select v-else-if="field.type === 'select'" :value="String(value(field) ?? '')" :aria-label="field.label" @change="set(field, ($event.target as HTMLSelectElement).value)">
        <option value="">선택</option><option v-for="option in field.options" :key="option" :value="option">{{ option }}</option>
      </select>
      <div v-else-if="field.type === 'chips'" class="aw-type-chips" role="radiogroup" :aria-label="field.label">
        <button v-for="option in field.options" :key="option" type="button" role="radio" :aria-checked="value(field) === option" :class="{ 'is-on': value(field) === option }" @click="set(field, value(field) === option ? '' : option)">{{ option }}</button>
      </div>
      <div v-else-if="field.type === 'rating'" class="aw-type-rating">
        <div v-for="item in field.items" :key="item" class="aw-type-rating-row">
          <span>{{ item }}</span>
          <div role="radiogroup" :aria-label="`${item} 별점`">
            <button v-for="star in 5" :key="star" type="button" role="radio" :aria-checked="score(field, item) === star" :aria-label="`${star}점`" :class="{ 'is-on': score(field, item) >= star }" @click="setScore(field, item, star)">★</button>
          </div>
          <b>{{ score(field, item) ? `${score(field, item)}.0` : '' }}</b>
        </div>
      </div>
    </div>
    <p v-if="problem" class="aw-type-problem" role="status">{{ problem }}</p>
  </section>
</template>
