<script setup lang="ts">
// 네이버 토론형 피드(기본 보기) · 좌/우 썸네일형(naver-discussion-feed.js card · thumbCard 이식).
import { legacy, type ListEmbed, type ListPost, type MediaSource } from '~/composables/list/listData'
import { categoryFor, cleanTitle, metric } from '~/composables/list/listFormat'
import { useListPageCtx } from '~/composables/list/useListPage'
import ListPollPreview from './ListPollPreview.vue'
import ListDiscussionMedia from './ListDiscussionMedia.vue'
import ListEmbedHtml from './ListEmbedHtml.vue'
import ListNewsCard from './ListNewsCard.vue'

const props = defineProps<{ thumb: boolean }>()
const page = useListPageCtx()
const router = useRouter()
const a = (p: string) => communityAsset(p)
const votes = reactive<Record<string, string>>({})
const openPlay = reactive<Record<string, boolean>>({})

const bodyFallbacks = [
  '직접 확인한 내용과 사용하면서 느낀 점을 공유합니다. 같은 경험이 있는 분들의 의견도 궁금합니다.',
  '구매를 고민하면서 비교한 내용을 정리했습니다. 실제 사용자 분들은 어떤 기준으로 선택하셨나요?',
  '정비 후 달라진 부분을 기록합니다. 작업 시간과 비용은 본문에서 함께 확인할 수 있습니다.',
  '주행하면서 발견한 특징입니다. 비슷한 증상이 있었던 분들은 해결 방법을 알려주세요.',
  '사진으로 보던 것과 실제 느낌이 달라 간단히 후기를 남깁니다.',
]
const BRAND_RULES: Array<[string, RegExp]> = [
  ['시트로엥', /시트로엥|2CV/], ['푸조', /푸조/], ['르노', /르노(?!코리아)/], ['스코다', /스코다/], ['미쓰비시', /미쓰비시/], ['혼다', /혼다/], ['닛산', /닛산/],
  ['마쓰다', /마쓰다/], ['스바루', /스바루/], ['스즈키', /스즈키/], ['폭스바겐', /폭스바겐/], ['아우디', /아우디/], ['포르쉐', /포르쉐/], ['포드', /포드/],
  ['현대', /현대차|현대 |현대자동차|투싼|베이온|아이오닉/], ['기아', /기아|쏘렌토|셀토스|K4|EV9/], ['제네시스', /제네시스|GV80|GV90|G90/], ['BMW', /BMW|M350|M5 |iX4|7시리즈/],
  ['벤츠', /벤츠|메르세데스|AMG|C-클래스|E-클래스/], ['렉서스', /렉서스|LFA/], ['토요타', /토요타|도요타|카롤라/], ['테슬라', /테슬라/], ['BYD', /BYD|아토8/], ['덴자', /덴자/],
  ['쉐보레', /쉐보레|실버라도/], ['GMC', /GMC|시에라/], ['볼보', /볼보/], ['KG모빌리티', /KG모빌리티/], ['르노코리아', /르노코리아/],
]
const BRAND_COUNTRY: Record<string, string> = {
  현대: '한국', 기아: '한국', 제네시스: '한국', KG모빌리티: '한국', 르노코리아: '한국', BMW: '독일', 벤츠: '독일', 폭스바겐: '독일', 아우디: '독일', 포르쉐: '독일',
  렉서스: '일본', 토요타: '일본', 혼다: '일본', 닛산: '일본', 마쓰다: '일본', 스바루: '일본', 스즈키: '일본', 미쓰비시: '일본', 테슬라: '미국', 쉐보레: '미국', GMC: '미국', 포드: '미국', BYD: '중국', 덴자: '중국', 볼보: '스웨덴',
}
void BRAND_COUNTRY
const SOURCE_COUNTRY: Array<[RegExp, string]> = [
  [/\.de\b|autoscout24|오토스카우트|bmw-m\b|BMW M|BMW ·/i, '독일'], [/\.jp\b|webcg\.net/i, '일본'], [/motortrend|caranddriver|carbuzz|motor1\.com/i, '미국'], [/vk\.(ru|com)/i, '러시아'],
  [/\.fr\b|caradisiac|automobile-propre|journalauto/i, '프랑스'], [/\.it\b|motorionline/i, '이탈리아'], [/\.es\b|diariomotor/i, '스페인'],
  [/naver\.com|daum\.net|inews24\.com|fnnews\.com|yuccapostkorea|\.co\.kr|\.kr\b|보배드림/i, '한국'],
]
function brandsFor(post: ListPost) {
  if (post.poll || !/news|뉴스/.test(String(post.board || ''))) return []
  const text = String(post.title || '') + ' ' + String(post.summary || '')
  return BRAND_RULES.map(r => ({ name: r[0], at: text.search(r[1]) })).filter(b => b.at > -1).sort((x, y) => x.at - y.at).slice(0, 2).map(b => b.name)
}
function sourceCountryFor(post: ListPost) {
  if (!/news|뉴스/.test(String(post.board || ''))) return ''
  const embed = Array.isArray(post.embeds) && post.embeds[0] ? post.embeds[0].url : ''
  const text = [post.sourceUrl, embed, post.source, post.user].filter(Boolean).join(' ')
  for (const [re, c] of SOURCE_COUNTRY) if (re.test(text)) return c
  return ''
}
function bodyFor(post: ListPost, index: number) {
  if (post.hideBody) return '작성자가 본문을 숨긴 글입니다.'
  if (Array.isArray(post.body) && post.body.length) return post.board === 'foreign-car-news' ? post.body.slice(0, 3).join('\n') : post.body[0]!
  return bodyFallbacks[index % bodyFallbacks.length]!
}
function avatarFor(post: ListPost, index: number) {
  return a(post.authorAvatar || 'assets/profile-avatars/avatar-' + String((index % 48) + 1).padStart(2, '0') + '.svg')
}
function detailHref(post: ListPost, photoIndex = 0) {
  const query: Record<string, string> = { id: String(post.id) }
  delete query.id
  if (post.local) query.local = '1'
  query.from = 'discussion'
  if (photoIndex > 0) query.photo = String(photoIndex + 1)
  query.v = '20261016naverdiscussion3'
  return router.resolve({ path: '/posts/' + encodeURIComponent(String(post.id)), query }).href
}
function mediaSources(post: ListPost): MediaSource[] {
  if (post.local) {
    if (!Array.isArray(post.media)) return []
    return post.media.filter(item => item && item.kind && (item.id || (item.kind === 'image' && item.url) || (item.kind === 'video' && /\.(?:mp4|webm|mov)(?:\?|$)/i.test(item.url || ''))))
      .slice(0, 6).map(item => ({ src: item.url || '', id: item.id || '', kind: item.kind!, ratio: item.kind === 'video' ? 16 / 9 : 0 }))
  }
  return (legacy.media()?.photosFor(post) || []).map(photo => ({ src: photo.src, id: '', kind: 'image', ratio: photo.ratio }))
}
function firstEmbed(post: ListPost): ListEmbed | null { return Array.isArray(post.embeds) && post.embeds.length ? post.embeds[0]! : null }

const cards = computed(() => {
  void page.renderSeq.value
  return page.discussionPosts().map((post, index) => {
    const table = Boolean(post.boardTable)
    const likesNormal = Math.max(0, Math.round(Number(post.view || 0) / 23) + Number(post.reply || 0))
    const dislikesNormal = Math.max(0, Math.round(Number(post.reply || 0) / 7))
    const sources = mediaSources(post)
    const embed = firstEmbed(post)
    const base = {
      post, index, key: String(post.id), title: cleanTitle(post.title), category: categoryFor(post), country: sourceCountryFor(post), brands: brandsFor(post),
      avatar: avatarFor(post, index), summary3: Array.isArray(post.summary3) ? post.summary3.filter(Boolean).slice(0, 3) : [], body: bodyFor(post, index), sources, embed,
      replyText: Number(post.reply || 0).toLocaleString('ko-KR'), viewText: Number(post.view || 0).toLocaleString('ko-KR'),
    }
    if (!props.thumb) return { ...base, likes: likesNormal, dislikes: dislikesNormal, thumbInfo: null }
    const photos = sources.filter(s => s.kind === 'image' && s.src)
    const embedItem = (Array.isArray(post.embeds) ? post.embeds : []).filter(e => e && e.image)[0] || null
    const thumbSrc = photos.length ? photos[0]!.src : post.thumb || (embedItem && embedItem.image) || ''
    const playEmbed = !photos.length && embed && embed.render === 'iframe' ? embed : null
    const linkUrl = !photos.length && !playEmbed && embedItem ? String(embedItem.url || post.sourceUrl || '') : ''
    let linkHost = ''
    try { linkHost = linkUrl ? new URL(linkUrl).hostname.replace(/^www\./, '') : '' } catch { linkHost = '' }
    return {
      ...base, likes: table ? Number(post.likes) || 0 : likesNormal, dislikes: table ? 0 : dislikesNormal,
      thumbInfo: { thumbSrc: thumbSrc && !/^(https?:|data:|blob:|\/)/.test(thumbSrc) ? a(thumbSrc) : thumbSrc, count: photos.length, playEmbed, linkHost },
    }
  })
})
const failedThumb = reactive(new Set<string>())
const failedPlayImg = reactive(new Set<string>())
function vote(key: string, dir: string) { votes[key] = votes[key] === dir ? '' : dir }
function openComments(post: ListPost) { router.push({ path: '/posts/' + encodeURIComponent(String(post.id)), hash: '#comments' }) }
function togglePlay(event: Event, key: string) { event.preventDefault(); event.stopPropagation(); openPlay[key] = !openPlay[key] }
</script>

<template>
  <div v-if="!cards.length" style="padding:44px 16px;color:#858990;font-size:14px;text-align:center">등록된 글이 없습니다.</div>
  <article v-for="c in cards" :key="c.key" :class="['naverDiscussionCard', { 'is-thumb': thumb }]" :data-discussion-post="c.post.id">
    <div class="naverDiscussionChips"><span class="naverDiscussionCategory">{{ c.category }}</span><span v-if="c.country" class="naverDiscussionCategory is-country">{{ c.country }}</span><span v-for="b in c.brands" :key="b" class="naverDiscussionCategory is-brand">{{ b }}</span></div>
    <div class="naverDiscussionIdentity"><img class="naverDiscussionAvatar" :src="c.avatar" :alt="c.post.user + ' 프로필'"><strong class="naverDiscussionAuthor">{{ c.post.user }}</strong><time class="naverDiscussionTime">{{ c.post.time }}</time></div>
    <template v-if="!thumb">
      <a class="naverDiscussionTitle" :href="detailHref(c.post)">{{ c.title }}</a>
      <p v-if="c.summary3.length" class="naverDiscussionBody is-summary3" aria-label="요약">{{ c.summary3.join(' ') }}</p>
      <p v-else class="naverDiscussionBody">{{ c.body }}</p>
      <ListPollPreview v-if="c.post.poll" :poll="c.post.poll" :id="'board-' + c.post.id" />
      <ListDiscussionMedia v-if="c.sources.length" :post="c.post" :index="c.index" :sources="c.sources" :detail-href="(i?: number) => detailHref(c.post, i || 0)" />
      <ListEmbedHtml v-else-if="c.embed && c.embed.render === 'iframe' && legacy.embed()" :item="c.embed" />
      <ListNewsCard v-else-if="c.embed" :item="c.embed" :fallback-title="c.title" />
    </template>
    <template v-else>
      <a class="naverDiscussionThumbMain" :href="detailHref(c.post)"><span class="naverDiscussionThumbText"><strong class="naverDiscussionTitle">{{ c.title }}</strong><span class="naverDiscussionBody">{{ c.body }}</span><span v-if="c.thumbInfo!.linkHost" class="naverDiscussionLinkDomain">{{ c.thumbInfo!.linkHost }}</span></span><span
        v-if="c.thumbInfo!.playEmbed"
        :class="['naverDiscussionThumb', 'is-play', { 'has-image': c.thumbInfo!.playEmbed.image && !failedPlayImg.has(c.key), 'is-open': openPlay[c.key] }]"
        role="button"
        tabindex="0"
        :data-discussion-play="c.post.id"
        :aria-label="c.thumbInfo!.playEmbed.provider + ' 목록에서 재생'"
        :aria-expanded="openPlay[c.key] != null ? !!openPlay[c.key] : undefined"
        @click="togglePlay($event, c.key)"
        @keydown.enter="togglePlay($event, c.key)"
        @keydown.space="togglePlay($event, c.key)"
      ><img v-if="c.thumbInfo!.playEmbed.image && !failedPlayImg.has(c.key)" :src="c.thumbInfo!.playEmbed.image" alt="" loading="lazy" referrerpolicy="no-referrer" @error="failedPlayImg.add(c.key)"><span class="naverDiscussionThumbPlay" /><small>{{ c.thumbInfo!.playEmbed.provider }}</small></span><span
        v-else-if="c.thumbInfo!.thumbSrc && !failedThumb.has(c.key)"
        :class="['naverDiscussionThumb', { 'is-link': c.thumbInfo!.linkHost }]"
      ><img :src="c.thumbInfo!.thumbSrc" alt="" :loading="c.index < 4 ? 'eager' : 'lazy'" referrerpolicy="no-referrer" @error="failedThumb.add(c.key)"><b v-if="c.thumbInfo!.count > 1" class="naverDiscussionThumbCount">{{ c.thumbInfo!.count }}</b><span v-if="c.thumbInfo!.linkHost" class="naverDiscussionThumbLink" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M6 3.5H3.5v9h9V10M9 3.5h3.5V7M12.5 3.5 7.5 8.5" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" /></svg></span></span></a>
      <ListEmbedHtml v-if="openPlay[c.key] && c.thumbInfo!.playEmbed" :item="c.thumbInfo!.playEmbed" autoplay />
    </template>
    <div class="naverDiscussionMetrics" aria-label="게시물 반응">
      <button :class="['naverDiscussionMetric', { 'is-active': votes[c.key] === 'up' }]" type="button" data-discussion-vote="up" :aria-label="'추천 ' + metric(c.likes)" :aria-pressed="votes[c.key] === 'up' ? 'true' : 'false'" @click="vote(c.key, 'up')"><img :src="a('assets/reactions/recommend.svg')" alt=""><span>{{ metric(c.likes) }}</span></button>
      <button :class="['naverDiscussionMetric', { 'is-active': votes[c.key] === 'down' }]" type="button" data-discussion-vote="down" :aria-label="'비추천 ' + metric(c.dislikes)" :aria-pressed="votes[c.key] === 'down' ? 'true' : 'false'" @click="vote(c.key, 'down')"><img :src="a('assets/reactions/dislike.svg')" alt=""><span>{{ metric(c.dislikes) }}</span></button>
      <button class="naverDiscussionMetric" type="button" :data-discussion-comment="c.post.id" :aria-label="'댓글 ' + c.replyText + '개'" @click="openComments(c.post)"><img :src="a('assets/reactions/comment-outline.svg')" alt="">{{ metric(c.post.reply) }}</button>
      <span class="naverDiscussionViews">조회 {{ c.viewText }}</span>
    </div>
  </article>
</template>
