<script setup lang="ts">
// 게시판 배너 + F1 게시판 머리(board-header-variants.js 이식).
// 정적 판은 게시판 이름이 바뀔 때마다(MutationObserver) 그때의 주소 board 값으로 배너를 맞춘다. 같은 규칙을 nameTick 으로 따른다.
import { bannerRightAligned, banners } from '~/composables/list/listBoardCopy'
import { useListPageCtx } from '~/composables/list/useListPage'

const page = useListPageCtx()
const a = (p: string) => communityAsset(p)
const heroId = ref('home')
const heroTitle = ref('전체 게시글')
const fallback = ref(false)
const imageEl = ref<HTMLImageElement | null>(null)
function sync() {
  let id = page.queryBoard.value || 'home'
  if (!banners[id]) id = 'home'
  heroId.value = id
  heroTitle.value = page.boardName.value.trim() || '전체 게시글'
  page.toggle('isF1Board', id === 'f1')
  fallback.value = false
}
watch(() => page.nameTick.value, sync, { immediate: true })
const info = computed(() => banners[heroId.value]!)
const src = computed(() => (fallback.value ? a('assets/board-header-genesis-yeosu.webp') : a('assets/board-banners/' + heroId.value + '.webp')))
function onError() { if (!fallback.value) fallback.value = true }

// ── F1 게시판 머리 ──
const f1Races = [
  { round: '멕시코시티 GP', title: '멕시코시티 그랑프리 결승', state: 'replay' as const },
  { round: '상파울루 GP', title: '상파울루 그랑프리 연습 주행 1', state: 'upcoming' as const, start: '2026-11-07T00:30:00+09:00', label: '11.07(토) 00:30' },
]
const f1Shortcuts: Array<[string, string]> = [['calendar', '경기 일정'], ['list-numbered', '순위'], ['star', '내 팀'], ['play', '다시보기'], ['statistics', '기록']]
const f1AlertKey = 'bbm.community.f1.alerts.v1'
function readAlerts(): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(f1AlertKey) || '{}') || {} } catch { return {} }
}
const alerts = ref<Record<string, boolean>>(readAlerts())
function dday(iso: string) {
  const start = new Date(iso), now = new Date()
  const n = Math.round((Date.UTC(start.getFullYear(), start.getMonth(), start.getDate()) - Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())) / 86400000)
  return n > 0 ? 'D-' + n : n === 0 ? '오늘' : ''
}
const next = f1Races.find(r => r.state === 'upcoming')
const nextDday = next && next.start ? dday(next.start) : ''
function toggleAlert(key: string) {
  const state = readAlerts()
  const on = !state[key]
  if (on) state[key] = true
  else delete state[key]
  try { localStorage.setItem(f1AlertKey, JSON.stringify(state)) } catch { /* 무시 */ }
  alerts.value = { ...state }
  // 정적 판은 window.toast 가 없어(목록 스크립트 안의 지역 함수) 알림 문구가 뜨지 않는다. 같게 둔다.
}
const iconStyle = (name: string) => ({ '--f1-icon': 'url(' + a('assets/f1/' + name + '-outline.svg') + ')' })
</script>

<template>
  <figure id="boardHero" class="boardHero" data-variant="youtube" :data-board="heroId" :data-copy-align="bannerRightAligned[heroId] ? 'right' : 'left'">
    <img id="boardHeroImage" ref="imageEl" class="boardHeroImage" :src="src" :alt="heroTitle + ' 배너: ' + info[1]" loading="eager" decoding="async" :data-fallback="fallback ? '1' : ''" @error="onError">
    <figcaption class="boardHeroCopy"><span class="boardHeroKicker">{{ info[2] || 'BOBAEDREAM' }}</span><strong class="boardHeroTitle">{{ heroTitle }}</strong><span class="boardHeroTagline">{{ info[0] }}</span></figcaption>
  </figure>
  <section id="f1Hub" class="f1Hub" :hidden="heroId !== 'f1'" aria-label="F1 경기와 바로가기">
    <div class="f1HubHead">
      <h2 class="f1HubTitle">주요 경기</h2>
      <span v-if="next" class="f1Next">다음 경기 <b>{{ nextDday }}</b></span>
    </div>
    <div class="f1Races">
      <article v-for="(race, index) in f1Races" :key="race.round" class="f1Race">
        <header class="f1RaceHead"><span class="f1RaceRound">{{ race.round }}</span><span v-if="race.state === 'replay'" class="f1RacePill"><i class="f1Icon" :style="iconStyle('play')" />다시보기</span><span v-else class="f1RacePill">{{ race.label }}</span></header>
        <p class="f1RaceTitle">{{ race.title }}</p>
        <button v-if="race.state === 'upcoming'" type="button" :class="['f1RaceAlert', { on: alerts[race.start!] }]" :data-f1-alert="race.start" :aria-pressed="alerts[race.start!] ? 'true' : 'false'" @click="toggleAlert(race.start!)">{{ alerts[race.start!] ? '알림 설정됨' : '알림 받기' }}</button>
        <button v-else type="button" class="f1RaceAlert" :data-f1-replay="index">다시보기</button>
      </article>
    </div>
    <nav class="f1Shortcuts" aria-label="F1 바로가기">
      <button v-for="[icon, label] in f1Shortcuts" :key="label" type="button" class="f1Shortcut" :data-f1-shortcut="label"><i class="f1Icon" :style="iconStyle(icon)" /><span>{{ label }}</span></button>
    </nav>
  </section>
</template>
