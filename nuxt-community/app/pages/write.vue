<!-- 커뮤니티 글쓰기(2026-11-05). 같은 기능을 두 모양으로 시험한다.
       /write              치지직형(기본, 치지직 앱 글쓰기를 폰에서 직접 확인하고 맞춤)
       /write?style=naver  네이버 카페형(정본 모양: public/community/naver-write-parity.html)
       /write?style=legacy 예전 간결형(정적 chzzk-write.html 이식본, 비교용)
     글 종류(일반 · 차량 리뷰 · 연비 · 전비 · 질문 · 내 차 팔기 · 구매가)는 composables/write/postTypes.ts 한 곳에서 정한다. -->
<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import appCss from '~/assets/css/write/app-write.css?raw'
import fontsCss from '../../../public/community/community-editor-fonts.css?raw'
import pollCss from '../../../public/community/community-poll.css?raw'
import newsCardCss from '../../../public/community/news-card.css?raw'
import naverCss from '../../../public/community/naver-write-parity.css?raw'
import LegacyChzzkWrite from '~/components/write/LegacyChzzkWrite.vue'
import ChzzkWrite from '~/components/write/app/ChzzkWrite.vue'
import NaverWrite from '~/components/write/app/NaverWrite.vue'
import WriteAlert from '~/components/write/app/WriteAlert.vue'
import WriteBoardPicker from '~/components/write/app/WriteBoardPicker.vue'
import WriteLinkPage from '~/components/write/app/WriteLinkPage.vue'
import WritePollPage from '~/components/write/app/WritePollPage.vue'
import WriteStickerPage from '~/components/write/app/WriteStickerPage.vue'
import WriteTypePicker from '~/components/write/app/WriteTypePicker.vue'
import { useCommunityWrite, type WriteStyle } from '~/composables/write/useCommunityWrite'

const route = useRoute()
const styleQuery = String(route.query.style || '')
const legacy = styleQuery === 'legacy'
const style: WriteStyle = styleQuery === 'naver' ? 'naver' : 'chzzk'

/* 정적 판 CSS 안의 상대 주소(assets/…)는 커뮤니티 폴더 기준이다 */
const withCommunityUrls = (css: string) => css.replace(/url\((["']?)assets\//g, (_m, quote: string) => `url(${quote}${communityAsset('assets/')}`)
if (!legacy) {
  useHead({
    title: '글쓰기 | 보배드림',
    meta: [{ name: 'robots', content: 'noindex,nofollow' }],
    link: [{ key: 'write-pretendard', rel: 'stylesheet', href: siteAsset('assets/fonts/pretendard/pretendard-guazi.css') }],
    style: [
      { key: 'write-fonts', textContent: fontsCss },
      ...(style === 'naver' ? [{ key: 'write-naver', textContent: withCommunityUrls(naverCss) }] : []),
      { key: 'write-poll', textContent: pollCss },
      { key: 'write-news-card', textContent: withCommunityUrls(newsCardCss) },
      { key: 'write-app', textContent: appCss },
    ],
    htmlAttrs: { 'data-write-style': style },
  })
}

const bodyEl = ref<HTMLElement | null>(null)
const w = legacy ? null : useCommunityWrite(bodyEl, style)
const pollCurrent = computed(() => (w && w.tool.value === 'poll' ? w.editor.currentPoll() : null))
function setBody(el: HTMLElement | null) { if (el) bodyEl.value = el }

function pickBoard(name: string) { if (!w) return; w.board.value = name; w.tool.value = '' }
function pickEmoji(emoji: string) { if (!w) return; w.tool.value = ''; if (w.style === 'chzzk') w.editor.insertSticker(emoji); else w.editor.insertText(emoji) }
function attach(href: string) {
  if (!w) return
  w.tool.value = ''
  if (!w.attachUrl(href)) w.toast('링크를 다시 확인해주세요.')
}

onMounted(() => { w?.start() })
</script>

<template>
  <LegacyChzzkWrite v-if="legacy" />
  <div v-else-if="w" class="aw-root" :class="`is-${style}`">
    <ChzzkWrite v-if="style === 'chzzk'" :w="w" @body="setBody" />
    <NaverWrite v-else :w="w" @body="setBody" />

    <WriteBoardPicker v-if="w.tool.value === 'board'" :groups="w.groups.value" :selected="w.board.value" @pick="pickBoard" @close="w.tool.value = ''" />
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
