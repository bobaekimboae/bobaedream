<script setup lang="ts">
// 커뮤니티 게시판 분류 — 바이두 티에바 「全部贴吧分类」(tieba.baidu.com/f/index/forumclass, 2026-11-01 1523 폭 직접 측정) 구성.
// PC: 왼쪽 분류 목록 210(머리 34 · 줄 40 · 점선 구분) + 오른쪽 2열 묶음(제목 16/22 · 게시판 글자 링크를 세로선으로 구분).
// 모바일: 티에바 앱처럼 왼쪽 세로 탭 + 오른쪽 게시판 목록, 왼쪽을 누르면 그 묶음으로 이동.
import { boardDirectory, hiddenCount, searchBoards, visibleBoards } from '~/data/board-directory'
import type { DirectoryBoard, DirectoryGroup, DirectoryGroupId } from '~/data/board-directory'
import type { ComponentPublicInstance } from 'vue'

const { boardId, headword, sort } = useCommunity()
const base = useRuntimeConfig().app.baseURL
const iconUrl = (name: string) => `${base}icons/category/${name}.svg`

const showHidden = ref(false)
const keyword = ref('')
const activeGroup = ref<DirectoryGroupId>('fixed')
const toast = ref('')
let toastTimer: ReturnType<typeof setTimeout> | undefined
const hiddenTotal = hiddenCount()

const results = computed(() => searchBoards(keyword.value, showHidden.value))
const groupBlocks = ref<Record<string, HTMLElement | null>>({})
const scroller = ref<HTMLElement | null>(null)
let lockSpy = false

function showToast(text: string) {
  toast.value = text
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = '' }, 1800)
}

function openBoard(group: DirectoryGroup, board: DirectoryBoard) {
  if (group.id === 'fixed') {
    if (board.id === 'best') sort.value = 'popular'
    navigateTo('/')
    return
  }
  if (!board.boardId) {
    showToast(`「${board.name}」 게시판은 준비 중이에요.`)
    return
  }
  boardId.value = board.boardId
  headword.value = ''
  navigateTo('/')
}

function setBlock(id: string, el: Element | ComponentPublicInstance | null) {
  groupBlocks.value[id] = el as HTMLElement | null
}

function goGroup(id: DirectoryGroupId) {
  activeGroup.value = id
  keyword.value = ''
  const el = groupBlocks.value[id]
  if (!el) return
  lockSpy = true
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const box = scroller.value
  const mobile = window.matchMedia('(max-width: 1023px)').matches
  if (mobile && box) box.scrollTo({ top: el.offsetTop - box.offsetTop, behavior: reduce ? 'auto' : 'smooth' })
  else window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: reduce ? 'auto' : 'smooth' })
  setTimeout(() => { lockSpy = false }, 700)
}

function onScroll() {
  if (lockSpy || keyword.value) return
  const box = scroller.value
  const mobile = window.matchMedia('(max-width: 1023px)').matches
  const top = mobile && box ? box.getBoundingClientRect().top : 80
  let current: DirectoryGroupId = boardDirectory[0]!.id
  for (const group of boardDirectory) {
    const el = groupBlocks.value[group.id]
    if (el && el.getBoundingClientRect().top - top < 24) current = group.id
  }
  if (mobile && box && box.scrollTop + box.clientHeight >= box.scrollHeight - 2) current = boardDirectory[boardDirectory.length - 1]!.id
  activeGroup.value = current
}

function handleBack() {
  if (import.meta.client && window.history.length > 1) window.history.back()
  else navigateTo('/')
}

onMounted(() => window.addEventListener('scroll', onScroll, { passive: true }))
onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); clearTimeout(toastTimer) })

useHead({ title: '게시판 분류 · 보배드림 커뮤니티' })
</script>

<template>
  <main class="cat-page">
    <header class="cat-top">
      <button class="cat-back" type="button" aria-label="뒤로" @click="handleBack"><img :src="`${base}icons/chzzk/back.svg`" alt="" /></button>
      <NuxtLink class="cat-brand" to="/">보배드림 <span>커뮤니티</span></NuxtLink>
      <h1 class="cat-title">게시판 분류</h1>
      <label class="cat-search">
        <img :src="iconUrl('search')" alt="" />
        <input v-model="keyword" type="search" placeholder="게시판 이름으로 찾기" aria-label="게시판 이름으로 찾기" />
      </label>
    </header>

    <div class="cat-body">
      <aside class="cat-side" aria-label="게시판 분류">
        <div class="cat-side__head">전체 게시판 분류</div>
        <ul class="cat-side__list">
          <li v-for="group in boardDirectory" :key="group.id">
            <button type="button" :class="{ 'is-active': activeGroup === group.id && !keyword }" :aria-current="activeGroup === group.id && !keyword ? 'true' : undefined" @click="goGroup(group.id)">
              <span class="cat-ico" :style="{ '--src': `url('${iconUrl(group.icon)}')` }" aria-hidden="true" />
              <span class="cat-side__name">{{ group.name }}</span>
            </button>
          </li>
        </ul>
        <label class="cat-hidden-toggle">
          <input v-model="showHidden" type="checkbox" />
          <span class="cat-switch" aria-hidden="true" />
          <span>숨긴 게시판 보기 <b>{{ hiddenTotal }}</b></span>
        </label>
      </aside>

      <section ref="scroller" class="cat-main" aria-live="polite" @scroll="onScroll">
        <label class="cat-hidden-toggle cat-hidden-toggle--mo">
          <input v-model="showHidden" type="checkbox" />
          <span class="cat-switch" aria-hidden="true" />
          <span>숨긴 게시판 보기 <b>{{ hiddenTotal }}</b></span>
        </label>

        <template v-if="keyword">
          <div class="cat-results">
            <p class="cat-results__count">게시판 {{ results.length }}개</p>
            <button v-for="item in results" :key="item.board.id" type="button" class="cat-result" @click="openBoard(item.group, item.board)">
              <span class="cat-result__name">{{ item.board.name }}<em v-if="item.board.hidden">미노출</em></span>
              <span class="cat-result__group">{{ item.group.name }}</span>
            </button>
            <div v-if="!results.length" class="cat-empty">
              <strong>「{{ keyword }}」 게시판이 없어요.</strong>
              <span>다른 이름으로 찾거나 숨긴 게시판 보기를 켜 보세요.</span>
              <button type="button" @click="keyword = ''">검색 지우기</button>
            </div>
          </div>
        </template>

        <div v-else class="cat-grid">
          <section v-for="group in boardDirectory" :key="group.id" :ref="el => setBlock(group.id, el)" class="cat-block" :aria-labelledby="`cat-${group.id}`">
            <h2 :id="`cat-${group.id}`" class="cat-block__title">
              <span class="cat-ico" :style="{ '--src': `url('${iconUrl(group.icon)}')` }" aria-hidden="true" />
              {{ group.name }}<small>{{ visibleBoards(group, showHidden).length }}</small>
            </h2>
            <ul class="cat-links">
              <li v-for="board in visibleBoards(group, showHidden)" :key="board.id">
                <button type="button" :class="{ 'is-hidden': board.hidden }" @click="openBoard(group, board)">{{ board.name }}<em v-if="board.hidden">미노출</em></button>
              </li>
            </ul>
          </section>
        </div>
      </section>
    </div>

    <p v-if="toast" class="cat-toast" role="status">{{ toast }}</p>
  </main>
</template>

<style>
.cat-page { min-height: 100dvh; background: #fff; color: #222; }
/* 이 앱은 768 이상에서 body에 22 여백(휴대폰 틀)을 두는데, 분류 화면은 전체 폭 페이지라 뺀다 */
body:has(.cat-page) { padding: 0; background: #fff; }
.cat-top { display: flex; align-items: center; gap: 12px; }
.cat-back { width: 40px; height: 40px; display: grid; place-items: center; }
.cat-back img { width: 24px; height: 24px; }
.cat-brand { display: none; font-size: 22px; line-height: 30px; font-weight: 800; letter-spacing: -.5px; color: #306bd9; }
.cat-brand span { color: #222; }
.cat-title { margin: 0; font-size: 18px; line-height: 24px; font-weight: 700; }
.cat-search { position: relative; display: flex; align-items: center; height: 40px; border-radius: 999px; background: #f4f4f4; }
.cat-search img { position: absolute; left: 12px; width: 20px; height: 20px; opacity: .55; }
.cat-search input { width: 100%; height: 100%; padding: 0 16px 0 40px; border: 0; border-radius: 999px; background: transparent; font-size: 15px; outline: none; }
.cat-search input::placeholder { color: #8c8c8c; }
.cat-search:focus-within { background: #fff; box-shadow: inset 0 0 0 2px #222; }
.cat-ico { display: inline-block; flex: none; width: 16px; height: 16px; background: currentColor; -webkit-mask: var(--src) center / contain no-repeat; mask: var(--src) center / contain no-repeat; }
.cat-side ul { margin: 0; padding: 0; list-style: none; }
.cat-links { margin: 0; padding: 0; list-style: none; }
.cat-links button { font: inherit; }
.cat-links em, .cat-result em { margin-left: 4px; padding: 0 4px; border-radius: 3px; background: #f1f2f4; color: #8c8c8c; font-size: 11px; line-height: 16px; font-style: normal; font-weight: 500; vertical-align: 1px; }
.cat-hidden-toggle { display: flex; align-items: center; gap: 8px; font-size: 13px; line-height: 18px; color: #595959; cursor: pointer; }
.cat-hidden-toggle input { position: absolute; opacity: 0; pointer-events: none; }
.cat-hidden-toggle b { font-weight: 600; color: #222; }
.cat-switch { position: relative; flex: none; width: 34px; height: 20px; border-radius: 999px; background: #d9d9d9; transition: background .15s; }
.cat-switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px #0003; transition: transform .15s; }
.cat-hidden-toggle input:checked + .cat-switch { background: #222; }
.cat-hidden-toggle input:checked + .cat-switch::after { transform: translateX(14px); }
.cat-hidden-toggle input:focus-visible + .cat-switch { outline: 2px solid #306bd9; outline-offset: 2px; }
.cat-results__count { margin: 0 0 8px; font-size: 13px; color: #8c8c8c; }
.cat-result { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 12px; min-height: 48px; border-bottom: 1px solid #eef0f2; text-align: left; }
.cat-result__name { font-size: 15px; line-height: 22px; }
.cat-result__group { flex: none; font-size: 13px; color: #8c8c8c; }
.cat-empty { display: grid; justify-items: center; gap: 6px; padding: 48px 16px; text-align: center; font-size: 14px; color: #595959; }
.cat-empty strong { color: #222; font-size: 15px; }
.cat-empty button { margin-top: 8px; height: 36px; padding: 0 14px; border: 1px solid #e4e7ec; border-radius: 999px; font-size: 14px; font-weight: 500; }
.cat-toast { position: fixed; z-index: 60; left: 50%; bottom: 32px; max-width: calc(100% - 32px); margin: 0; padding: 10px 16px; border-radius: 10px; background: #222d; color: #fff; font-size: 14px; line-height: 20px; transform: translateX(-50%); word-break: keep-all; }
@media (prefers-reduced-motion: reduce) { .cat-switch, .cat-switch::after { transition: none; } }

/* 모바일: 티에바 앱식 왼쪽 세로 탭 + 오른쪽 목록 */
@media (max-width: 1023px) {
  .cat-page { display: flex; flex-direction: column; height: 100dvh; }
  .cat-top { flex-wrap: wrap; gap: 8px 4px; padding: env(safe-area-inset-top) 12px 10px 8px; border-bottom: 1px solid #eef0f2; }
  .cat-top .cat-title { flex: 1; }
  .cat-search { flex-basis: 100%; margin-left: 4px; }
  .cat-body { flex: 1; min-height: 0; display: flex; }
  .cat-side { flex: none; width: 96px; overflow-y: auto; background: #f5f6f8; }
  .cat-side__head, .cat-side .cat-hidden-toggle { display: none; }
  .cat-side button { position: relative; width: 100%; height: 56px; display: grid; justify-items: center; align-content: center; gap: 4px; color: #595959; font-size: 13px; line-height: 18px; }
  .cat-side button .cat-ico { width: 20px; height: 20px; }
  .cat-side button.is-active { background: #fff; color: #222; font-weight: 700; }
  .cat-side button.is-active::before { content: ""; position: absolute; left: 0; top: 16px; bottom: 16px; width: 3px; border-radius: 0 2px 2px 0; background: #222; }
  .cat-main { flex: 1; min-width: 0; overflow-y: auto; padding: 12px 16px 96px; overscroll-behavior: contain; }
  .cat-hidden-toggle--mo { justify-content: flex-end; margin-bottom: 4px; }
  .cat-block { padding-top: 12px; }
  .cat-block__title { display: flex; align-items: center; gap: 6px; margin: 0 0 10px; font-size: 15px; line-height: 22px; font-weight: 700; }
  .cat-block__title .cat-ico { display: none; }
  .cat-block__title small { margin-left: 2px; font-size: 13px; font-weight: 400; color: #8c8c8c; }
  .cat-links { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; padding-bottom: 12px; border-bottom: 1px solid #eef0f2; }
  .cat-block:last-child .cat-links { border-bottom: 0; }
  .cat-links button { width: 100%; min-height: 44px; padding: 6px 10px; border-radius: 8px; background: #f7f8fa; font-size: 14px; line-height: 20px; text-align: left; word-break: keep-all; overflow-wrap: anywhere; }
  .cat-links button em { display: inline-block; margin: 2px 0 0; }
  .cat-links button:active { background: #eceef1; }
  .cat-links button.is-hidden { color: #8c8c8c; }
}

/* PC: 바이두 「全部贴吧分类」 — 왼쪽 210 · 사이 10 · 오른쪽 2열(394) */
@media (min-width: 1024px) {
  .cat-page { padding-bottom: 80px; }
  .cat-top { width: 1000px; height: 88px; margin: 0 auto; gap: 24px; }
  .cat-back, .cat-title { display: none; }
  .cat-brand { display: block; }
  .cat-search { width: 440px; }
  .cat-body { width: 1000px; margin: 0 auto; display: flex; align-items: flex-start; gap: 10px; }
  .cat-side { position: sticky; top: 16px; flex: none; width: 210px; margin-top: 10px; }
  .cat-side__head { height: 34px; padding-left: 20px; border-radius: 4px 4px 0 0; background: #222; color: #fff; font-size: 14px; line-height: 34px; }
  .cat-side__list { border: 1px solid #e3e3e3; border-top: 0; }
  .cat-side__list li { padding-left: 13px; }
  .cat-side__list button { width: 182px; height: 40px; display: flex; align-items: center; gap: 9px; padding-left: 12px; border-bottom: 1px dotted #b1b4b6; color: #333; font-size: 14px; line-height: 22px; text-align: left; }
  .cat-side__list li:last-child button { border-bottom: 0; }
  .cat-side__list button:hover { color: #222; }
  .cat-side__list button.is-active { color: #222; font-weight: 700; }
  .cat-side__list button.is-active .cat-ico { color: #222; }
  .cat-side__list .cat-ico { color: #595959; }
  .cat-side .cat-hidden-toggle { margin: 14px 0 0 4px; }
  .cat-hidden-toggle--mo { display: none; }
  .cat-main { flex: 1; min-width: 0; padding-top: 6px; }
  .cat-grid { display: grid; grid-template-columns: repeat(2, 394px); column-gap: 2px; }
  .cat-block { padding: 27px 0 0 10px; }
  .cat-block__title { display: flex; align-items: center; gap: 6px; margin: 0 0 14px; font-size: 16px; line-height: 22px; font-weight: 700; }
  .cat-block__title .cat-ico { width: 18px; height: 18px; color: #595959; }
  .cat-block__title small { font-size: 13px; font-weight: 400; color: #8c8c8c; }
  .cat-links { display: flex; flex-wrap: wrap; padding-right: 20px; }
  .cat-links li { margin: 0 8px 12px 0; padding-right: 8px; border-right: 1px solid #e3e3e3; }
  .cat-links button { color: #444; font-size: 14px; line-height: 14px; }
  .cat-links button:hover { color: #222; text-decoration: underline; text-underline-offset: 3px; }
  .cat-links button.is-hidden { color: #8c8c8c; }
  .cat-results { padding: 27px 0 0 10px; }
  .cat-result:hover .cat-result__name { text-decoration: underline; text-underline-offset: 3px; }
}
</style>
