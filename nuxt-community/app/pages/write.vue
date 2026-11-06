<!-- 커뮤니티 글쓰기(2026-11-05). 같은 기능을 두 모양으로 시험한다.
       /write              치지직형(기본, 치지직 앱 글쓰기를 폰에서 직접 확인하고 맞춤)
       /write?style=naver  네이버 카페 앱형(2026-11-06 네이버 카페 앱을 폰에서 직접 확인하고 맞춤, 아이콘은 레딧 원본)
       /write?style=naver-pc  네이버 카페 PC 웹형(2026-11-06). ?style=naver 도 화면 폭 1024 이상이면 PC 웹형으로 연다(&m=1 이면 앱형 고정, &pc=1 이면 PC 고정)
       /write?style=naver-web 예전 네이버 카페 웹형(정본 모양: public/community/naver-write-parity.html, 비교용)
       /write?style=legacy 예전 간결형(정적 chzzk-write.html 이식본, 비교용)
     글 종류(일반 · 차량 리뷰 · 연비 · 전비 · 질문 · 내 차 팔기 · 구매가)는 composables/write/postTypes.ts 한 곳에서 정한다. -->
<script setup lang="ts">
import { computed, onMounted, provide, ref } from 'vue'
import appCss from '~/assets/css/write/app-write.css?raw'
import fontsCss from '../../../public/community/community-editor-fonts.css?raw'
import pollCss from '../../../public/community/community-poll.css?raw'
import newsCardCss from '../../../public/community/news-card.css?raw'
import naverCss from '../../../public/community/naver-write-parity.css?raw'
import naverAppCss from '~/assets/css/write/naver-app.css?raw'
import naverPcCss from '~/assets/css/write/naver-pc.css?raw'
import NaverPcWrite from '~/components/write/naver/NaverPcWrite.vue'
import LegacyChzzkWrite from '~/components/write/LegacyChzzkWrite.vue'
import ChzzkWrite from '~/components/write/app/ChzzkWrite.vue'
import NaverWebWrite from '~/components/write/app/NaverWebWrite.vue'
import NaverWrite from '~/components/write/naver/NaverWrite.vue'
import NaverBoardSheet from '~/components/write/naver/NaverBoardSheet.vue'
import NaverMaterialPage, { type MaterialCard } from '~/components/write/naver/NaverMaterialPage.vue'
import NaverPlacePage, { type PlaceCard } from '~/components/write/naver/NaverPlacePage.vue'
import NaverSchedulePage, { type ScheduleCard } from '~/components/write/naver/NaverSchedulePage.vue'
import NaverSettingsPage from '~/components/write/naver/NaverSettingsPage.vue'
import NaverTagPage from '~/components/write/naver/NaverTagPage.vue'
import WriteAlert from '~/components/write/app/WriteAlert.vue'
import WriteBoardPicker from '~/components/write/app/WriteBoardPicker.vue'
import WriteLinkPage from '~/components/write/app/WriteLinkPage.vue'
import WritePollPage from '~/components/write/app/WritePollPage.vue'
import WriteStickerPage from '~/components/write/app/WriteStickerPage.vue'
import WriteTypePicker from '~/components/write/app/WriteTypePicker.vue'
import { useCommunityWrite, type WriteSettings, type WriteStyle } from '~/composables/write/useCommunityWrite'

const route = useRoute()
const styleQuery = String(route.query.style || '')
const legacy = styleQuery === 'legacy'
const naverWeb = styleQuery === 'naver-web'
const style: WriteStyle = styleQuery === 'naver' || styleQuery === 'naver-pc' || naverWeb ? 'naver' : 'chzzk'
/** 네이버 카페 PC 웹형: ?style=naver-pc, 또는 ?style=naver 를 넓은 화면(1024 이상)에서 열 때 */
const wide = typeof window !== 'undefined' && window.innerWidth >= 1024
const naverPc = styleQuery === 'naver-pc' || (styleQuery === 'naver' && route.query.m !== '1' && (route.query.pc === '1' || wide))
/** 네이버 카페 앱형 · PC 웹형(예전 웹형은 모양 그대로). 앱형 CSS(창 · 카드 · 설정 모양)는 PC 웹형도 함께 쓴다 */
const naverApp = style === 'naver' && !naverWeb
provide('writeStyle', naverApp ? 'naver' : style === 'naver' ? 'naver-web' : 'chzzk')

/* 정적 판 CSS 안의 상대 주소(assets/…)는 커뮤니티 폴더 기준이다 */
const withCommunityUrls = (css: string) => css.replace(/url\((["']?)assets\//g, (_m, quote: string) => `url(${quote}${communityAsset('assets/')}`)
if (!legacy) {
  useHead({
    title: '글쓰기 | 보배드림',
    meta: [{ name: 'robots', content: 'noindex,nofollow' }],
    link: [{ key: 'write-pretendard', rel: 'stylesheet', href: siteAsset('assets/fonts/pretendard/pretendard-guazi.css') }],
    style: [
      { key: 'write-fonts', textContent: fontsCss },
      ...(naverWeb ? [{ key: 'write-naver', textContent: withCommunityUrls(naverCss) }] : []),
      { key: 'write-poll', textContent: pollCss },
      { key: 'write-news-card', textContent: withCommunityUrls(newsCardCss) },
      { key: 'write-app', textContent: appCss },
      ...(naverApp ? [{ key: 'write-naver-app', textContent: withCommunityUrls(naverAppCss) }] : []),
      ...(naverPc ? [{ key: 'write-naver-pc', textContent: naverPcCss }] : []),
    ],
    htmlAttrs: { 'data-write-style': naverPc ? 'naver-pc' : naverApp ? 'naver' : naverWeb ? 'naver-web' : style },
  })
}

const bodyEl = ref<HTMLElement | null>(null)
const w = legacy ? null : useCommunityWrite(bodyEl, style)
const pollCurrent = computed(() => (w && w.tool.value === 'poll' ? w.editor.currentPoll() : null))
function setBody(el: HTMLElement | null) { if (el) bodyEl.value = el }

function pickBoard(name: string) { if (!w) return; w.board.value = name; w.tool.value = '' }
function pickEmoji(emoji: string) { if (!w) return; w.tool.value = ''; if (w.style === 'chzzk') w.editor.insertSticker(emoji); else w.editor.insertText(emoji) }
function setTags(tags: string[]) { if (!w) return; w.tags.value = tags; w.tagDraft.value = tags.map(tag => `#${tag}`).join(' '); w.tool.value = '' }
function addCard(kind: 'schedule' | 'place' | 'material', card: ScheduleCard | PlaceCard | MaterialCard) { if (!w) return; w.tool.value = ''; w.editor.insertCard({ kind, ...card }) }
function saveSettings(value: { settings: WriteSettings, allowSearch: boolean, hideBody: boolean }) {
  if (!w) return
  w.settings.value = { ...value.settings }
  w.allowSearch.value = value.allowSearch
  w.hideBody.value = value.hideBody
  w.tool.value = ''
}
function attach(href: string) {
  if (!w) return
  w.tool.value = ''
  if (!w.attachUrl(href)) w.toast('링크를 다시 확인해주세요.')
}

onMounted(() => { w?.start() })
</script>

<template>
  <LegacyChzzkWrite v-if="legacy" />
  <div v-else-if="w" class="aw-root" :class="[`is-${style}`, { 'is-naver-app': naverApp, 'is-naver-pc': naverPc }]">
    <ChzzkWrite v-if="style === 'chzzk'" :w="w" @body="setBody" />
    <NaverPcWrite v-else-if="naverPc" :w="w" @body="setBody" />
    <NaverWrite v-else-if="naverApp" :w="w" @body="setBody" />
    <NaverWebWrite v-else :w="w" @body="setBody" />

    <NaverBoardSheet v-if="naverApp && !naverPc && w.tool.value === 'board'" :groups="w.groups.value" :selected="w.board.value" @pick="pickBoard" @close="w.tool.value = ''" />
    <NaverTagPage v-else-if="w.tool.value === 'tags'" :tags="w.tags.value" @done="setTags" @close="w.tool.value = ''" @toast="w.toast" />
    <NaverMaterialPage v-else-if="w.tool.value === 'material'" @attach="(card) => addCard('material', card)" @close="w.tool.value = ''" />
    <NaverPlacePage v-else-if="w.tool.value === 'place'" @attach="(card) => addCard('place', card)" @close="w.tool.value = ''" />
    <NaverSchedulePage v-else-if="w.tool.value === 'schedule'" @attach="(card) => addCard('schedule', card)" @close="w.tool.value = ''" />
    <NaverSettingsPage v-else-if="w.tool.value === 'settings'" :settings="w.settings.value" :allow-search="w.allowSearch.value" :hide-body="w.hideBody.value" @save="saveSettings" @close="w.tool.value = ''" @toast="w.toast" />
    <WriteBoardPicker v-else-if="w.tool.value === 'board'" :groups="w.groups.value" :selected="w.board.value" @pick="pickBoard" @close="w.tool.value = ''" />
    <WriteTypePicker v-else-if="w.tool.value === 'type'" :selected="w.postTypeId.value" @pick="w.setType" @close="w.tool.value = ''" />
    <WriteStickerPage v-else-if="w.tool.value === 'sticker'" @pick="pickEmoji" @close="w.tool.value = ''" />
    <WriteLinkPage v-else-if="w.tool.value === 'link'" @attach="attach" @close="w.tool.value = ''" />
    <WritePollPage v-else-if="w.tool.value === 'poll'" :current="pollCurrent" @apply="w.applyPoll" @close="w.tool.value = ''" @toast="w.toast" />

    <WriteAlert v-if="w.alertText.value" :message="w.alertText.value" @ok="w.alertText.value = ''" />
    <WriteAlert
      v-if="w.confirmBox.value"
      :title="w.confirmBox.value.title"
      :message="w.confirmBox.value.message"
      :ok="w.confirmBox.value.ok"
      :cancel="w.confirmBox.value.ok === '확인' ? '' : '새로 쓰기'"
      tone="purple"
      @ok="() => { const box = w!.confirmBox.value; w!.confirmBox.value = null; box?.onOk() }"
      @cancel="w.confirmBox.value = null"
    />
    <div class="aw-toast" role="status" aria-live="polite" :hidden="!w.toastShown.value">{{ w.toastText.value }}</div>
  </div>
</template>
