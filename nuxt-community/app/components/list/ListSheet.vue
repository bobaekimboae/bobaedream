<script setup lang="ts">
// 아래에서 올라오는 시트: 보기방식 편집 · 유형 선택 · 게시글 옵션 · 인기 기간 · 게시판 선택(목록 스크립트 openSheet 등 이식).
// 정적 판은 누를 때마다 시트를 innerHTML 로 새로 그려 스크롤이 맨 위로 돌아간다. 같게 하려고 다시 그릴 때 key 를 바꾼다.
import { boardAvatarSrc, boardSections } from '~/composables/list/listBoards'
import { popularPeriodLabels } from '~/composables/list/listFormat'
import { isBestView, saveBestView, useListPageCtx, type ListDisplay } from '~/composables/list/useListPage'

const page = useListPageCtx()
const a = (p: string) => communityAsset(p)
const sheetKey = ref(0)
const optionsClass = ref(false) // 정적 판 .postOptionsSheet 는 게시판 선택 시트를 열어도 남는다
const open = computed(() => !!page.sheet.value)
const lastKind = ref<string>('')
watch(() => page.sheet.value, (v) => {
  if (!v) return
  lastKind.value = v
  if (v === 'view' || v === 'type') optionsClass.value = false
  if (v === 'postOptions' || v === 'popularPeriod') optionsClass.value = true
})
function reopen(kind: typeof page.sheet.value) { page.sheet.value = kind; sheetKey.value++ }
function close() { page.sheet.value = '' }

const iconSrc = (t: string) => a(({ list: 'assets/reddit-ui/view-list.svg', text: 'assets/reddit-ui/view-compact.svg', feed: 'assets/reddit-ui/view-card.svg', album: 'assets/reddit-ui/view-card.svg', video: 'assets/reddit-ui/icon-video-feed-outline.svg', thumbRight: 'assets/view-icons/thumb-right.svg', thumbLeft: 'assets/view-icons/thumb-left.svg' } as Record<string, string>)[t] || 'assets/reddit-ui/view-list.svg')

// ── 보기방식 편집 ──
const viewModes = computed(() => (page.activeBoardTable.value === 'best'
  ? [['lounge-best-rank', '라운지 인기글형', '기본 · 우측 썸네일', 'thumbRight'], ['lounge-best-clean', '라운지 간결형', '순위 없음 · 우측 썸네일', 'thumbRight'], ['lounge-best-left', '라운지 썸네일 좌측형', '순위 없음 · 좌측 썸네일', 'thumbLeft'], ['naver-ranking-news', '네이버 랭킹뉴스형', '순위 없음 · 좌측 74px', 'thumbLeft']]
  : [['text-only', '텍스트만', '썸네일 없음', 'text'], ['compact', '간결형', '', 'text'], ['list', '목록형', '기본', 'list'], ['detail-list', '상세 목록형', '', 'list'], ['naver-discussion', '피드형 · 네이버 토론', '', 'feed'], ['naver-discussion-thumb', '네이버 토론 · 좌측 썸네일', '', 'list'], ['naver-discussion-thumb-right', '네이버 토론 · 우측 썸네일', '', 'list'], ['naver-cafe-popular', '네이버 카페 인기글형', '인기·댓글·좋아요 탭 · 우측 썸네일', 'list'], ['naver-cafe-popular-left', '네이버 카페 인기글 · 좌측 썸네일', '인기·댓글·좋아요 탭', 'thumbLeft'], ['reddit-feed', '피드형 · 레딧', '', 'feed'], ['feed-chotot', '초톳 피드형 · 게시판형', '', 'feed'], ['feed-chotot-dealer', '초톳 피드형 · 딜러형', '', 'feed'], ['feed-cafe', '피드 네이버 카페', '', 'feed'], ['feed-cafe-left', '네이버 카페 · 좌측 썸네일', '좌측 이미지 · 제목·메타', 'thumbLeft'], ['album', '앨범형', '', 'album']]) as string[][])
type Choice = { label: string; key: string; items: string[][]; selected: string; set: (v: string) => void }
const viewChoices = computed<Choice[]>(() => [
  { label: '보기 방식', key: 'data-mode', items: viewModes.value, selected: page.mode.value, set: (value) => { page.mode.value = value; page.applyModeDisplay(value); if (page.activeBoardTable.value === 'best') saveBestView(value) } },
])
const thumbChoice: Choice = { label: '썸네일 위치', key: 'data-thumb-position', items: [['right', '오른쪽', '기본', 'thumbRight'], ['left', '왼쪽', '', 'thumbLeft']], selected: '', set: (v) => { page.thumbPosition.value = v } }
const rankChoice: Choice = { label: '계급 배지 위치', key: 'data-rank-position', items: [['before', '닉네임 앞', '기본', 'list'], ['after', '닉네임 뒤', '', 'list']], selected: '', set: (v) => { page.rankPosition.value = v } }
const lineChoice: Choice = { label: '제목 줄 수', key: 'data-title-lines', items: [['2', '두 줄', '기본', 'list'], ['1', '한 줄', '', 'text']], selected: '', set: (v) => { page.titleLines.value = Number(v) } }
const displayToggles: Array<[keyof ListDisplay, string]> = [['thumbnail', '썸네일'], ['commentBadge', '댓글 배지'], ['rankBadge', '계급 배지'], ['recommendCount', '추천수'], ['categoryLabel', '말머리'], ['tag', '태그']]
const metaToggles: Array<[keyof ListDisplay, string]> = [['profileAvatar', '닉네임 프사'], ['timeIcon', '등록시간 아이콘'], ['viewIcon', '조회수 아이콘'], ['recommendIcon', '추천수 아이콘'], ['commentIcon', '댓글 아이콘']]
function choose(c: Choice, value: string) { c.set(value); page.renderList(); reopen('view') }
function toggleDisplay(key: keyof ListDisplay) { page.display[key] = !page.display[key]; page.renderList(); reopen('view') }
function resetView() {
  const best = page.activeBoardTable.value === 'best'
  page.mode.value = best ? 'lounge-best-rank' : 'list'
  if (best) saveBestView(page.mode.value)
  page.thumbPosition.value = 'right'
  page.titleLines.value = 2
  page.rankPosition.value = 'before'
  Object.assign(page.display, { thumbnail: true, commentBadge: true, recommendCount: false, categoryLabel: true, tag: false, highlight: false, rankBadge: false, profileAvatar: false, timeIcon: false, viewIcon: false, recommendIcon: false, commentIcon: false })
  page.renderList()
  reopen('view')
}

// ── 유형 선택 ──
const types: Array<[string, string, string, boolean, boolean, string]> = [
  ['text-only', '텍스트만', '썸네일 없음', false, false, 'text-only'], ['compact', '간결형', '', true, true, 'compact'], ['naver-discussion', '피드형 · 네이버 토론', '', true, false, 'naver-discussion'],
  ['naver-discussion-thumb', '네이버 토론 · 좌측 썸네일', '', true, false, 'naver-discussion-thumb'], ['naver-discussion-thumb-right', '네이버 토론 · 우측 썸네일', '', true, false, 'naver-discussion-thumb-right'],
  ['naver-cafe-popular', '네이버 카페 인기글형', '우측 썸네일', true, true, 'naver-cafe-popular'], ['naver-cafe-popular-left', '네이버 카페 인기글 · 좌측 썸네일', '', true, true, 'naver-cafe-popular-left'],
  ['reddit-feed', '피드형 · 레딧', '', true, false, 'reddit-feed'], ['feed-chotot', '초톳 피드형 · 게시판형', '', true, false, 'feed-chotot'], ['feed-chotot-dealer', '초톳 피드형 · 딜러형', '', true, false, 'feed-chotot-dealer'],
  ['feed-cafe', '피드 네이버 카페', '', true, false, 'feed-cafe'], ['feed-cafe-left', '네이버 카페 · 좌측 썸네일', '', true, false, 'feed-cafe-left'],
  ['default', '목록형', '기본', true, true, 'list'], ['no-badge', '목록형 · 댓글 배지 없음', '', true, false, 'list'], ['no-thumb', '목록형 · 썸네일 없음', '', false, true, 'list'],
]
function pickType(t: typeof types[number]) { page.mode.value = t[5]; page.display.thumbnail = t[3]; page.display.commentBadge = t[4]; page.renderList(); reopen('type') }
function resetType() { page.mode.value = 'list'; page.display.thumbnail = true; page.display.commentBadge = true; page.renderList(); reopen('type') }

// ── 게시글 옵션 ──
const optionIcon = (n: string) => a(({ latest: 'assets/reddit-ui/icon-refresh-outline.svg', comments: 'assets/reactions/comment-outline.svg', popular: 'assets/reddit-rail/popular.svg', text: 'assets/reddit-ui/icon-text-size-outline.svg', compact: 'assets/reddit-ui/view-compact.svg', list: 'assets/reddit-ui/view-list.svg', feed: 'assets/reddit-ui/view-card.svg' } as Record<string, string>)[n] || 'assets/reddit-ui/view-list.svg')
const sortRows = [['latest', '최신순', '', 'latest'], ['latest-comment', '최신 댓글순', '최근 댓글이 달린 글을 먼저 보여줍니다.', 'comments']]
const viewRows = [['text-only', '텍스트만', '', 'text'], ['compact', '간결형', '', 'compact'], ['list', '목록형', '', 'list'], ['naver-discussion', '피드형', '', 'feed']]
// 정적 판은 고른 줄의 표시만 바꾼 뒤 시트를 닫는다(다시 그리지 않음)
const pressedSort = ref('')
const pressedView = ref('')
const pressedChip = ref(-1)
watch(() => page.sheet.value, (v) => { if (v === 'postOptions') { pressedSort.value = ''; pressedView.value = ''; pressedChip.value = -1 } })
function pickSort(v: string) { page.sortOrder.value = v; pressedSort.value = v; page.commitPostOptions(); close() }
function pickView(v: string) { page.mode.value = v; pressedView.value = v; page.commitPostOptions(); close() }
function pickChip(i: number) { page.active.value = i; pressedChip.value = i; page.commitPostOptions(); close() }
const periods = [['hour', '지난 1시간'], ['day', '지난 24시간'], ['week', '지난 1주'], ['month', '지난 1개월'], ['year', '지난 1년'], ['all', '전체 기간']]
function pickPeriod(v: string) { page.popularPeriod.value = v; page.sortOrder.value = 'popular'; page.commitPostOptions(); close() }
const sortSelected = computed(() => pressedSort.value || page.sortOrder.value)
const viewSelected = computed(() => pressedView.value || page.mode.value)
const chipSelected = computed(() => (pressedChip.value >= 0 ? pressedChip.value : page.active.value))

// ── 게시판 선택 ──
const sections = boardSections()
const homeBoard = { displayName: '전체 게시글', shortName: '전체', avatarLabel: 'ALL', avatarColor: '#202124', avatarAccent: '#666a70' }
function pickBoard(label: string, topic: string) { page.selectBoard(label, topic); close() }
defineExpose({ reopen })
void isBestView
</script>

<template>
  <div id="overlay" :class="['overlay', { open }]" @click="close" />
  <section id="sheet" :class="['sheet', { postOptionsSheet: optionsClass, open }]" aria-label="보기 방식" role="dialog">
    <template v-if="lastKind === 'view'" :key="'v' + sheetKey">
        <div class="handle" />
        <div class="sheetHead"><div class="sheetTitle">보기방식 편집</div><button id="sheetClose" class="sheetClose" aria-label="닫기" @click="close"><img :src="a('assets/reddit-ui/icon-close-outline.svg')" alt=""></button></div>
        <div id="sheetScroll" class="sheetScroll">
          <template v-for="c in [viewChoices[0]!]" :key="c.key">
            <div class="sheetLabel">{{ c.label }}</div>
            <div class="sheetGroup" role="radiogroup" :aria-label="c.label">
              <button v-for="item in c.items" :key="item[0]" :class="['modeRow', { on: c.selected === item[0] }]" role="radio" :aria-checked="(c.selected === item[0])" :data-mode="item[0]" @click="choose(c, item[0]!)"><img class="sheetIcon" :src="iconSrc(item[3] || 'list')" alt="" loading="lazy"><span class="modeText"><b>{{ item[1] }}</b><em v-if="item[2]" class="stateChip">{{ item[2] }}</em></span><span class="radio" aria-hidden="true" /></button>
            </div>
          </template>
          <div class="sheetLabel">리스트 표시</div>
          <div class="sheetGroup">
            <button v-for="[key, label] in displayToggles" :key="key" class="toggleRow" role="switch" :aria-checked="(!!page.display[key])" :data-display-key="key" @click="toggleDisplay(key)"><span>{{ label }}</span><span :class="['switch', { on: !!page.display[key] }]" aria-hidden="true" /></button>
          </div>
          <template v-for="c in [{ ...thumbChoice, selected: page.thumbPosition.value }, { ...rankChoice, selected: page.rankPosition.value }]" :key="c.key">
            <div class="sheetLabel">{{ c.label }}</div>
            <div class="sheetGroup" role="radiogroup" :aria-label="c.label">
              <button v-for="item in c.items" :key="item[0]" :class="['modeRow', { on: c.selected === item[0] }]" role="radio" :aria-checked="(c.selected === item[0])" v-bind="{ [c.key]: item[0] }" @click="choose(c, item[0]!)"><img class="sheetIcon" :src="iconSrc(item[3] || 'list')" alt="" loading="lazy"><span class="modeText"><b>{{ item[1] }}</b><em v-if="item[2]" class="stateChip">{{ item[2] }}</em></span><span class="radio" aria-hidden="true" /></button>
            </div>
          </template>
          <div class="sheetLabel">메타정보 아이콘</div>
          <div class="sheetGroup" data-admin-only="true">
            <button v-for="[key, label] in metaToggles" :key="key" class="toggleRow" role="switch" :aria-checked="(!!page.display[key])" :data-meta-key="key" @click="toggleDisplay(key)"><span>{{ label }}</span><span :class="['switch', { on: !!page.display[key] }]" aria-hidden="true" /></button>
          </div>
          <template v-for="c in [{ ...lineChoice, selected: String(page.titleLines.value) }]" :key="c.key">
            <div class="sheetLabel">{{ c.label }}</div>
            <div class="sheetGroup" role="radiogroup" :aria-label="c.label">
              <button v-for="item in c.items" :key="item[0]" :class="['modeRow', { on: c.selected === item[0] }]" role="radio" :aria-checked="(c.selected === item[0])" :data-title-lines="item[0]" @click="choose(c, item[0]!)"><img class="sheetIcon" :src="iconSrc(item[3] || 'list')" alt="" loading="lazy"><span class="modeText"><b>{{ item[1] }}</b><em v-if="item[2]" class="stateChip">{{ item[2] }}</em></span><span class="radio" aria-hidden="true" /></button>
            </div>
          </template>
        </div>
        <div class="sheetFooter"><button id="sheetReset" class="clearBtn" @click="resetView">초기화</button><button id="sheetApply" class="applyBtn" @click="close">게시판에 적용</button></div>
    </template>
    <template v-else-if="lastKind === 'type'" :key="'t' + sheetKey">
        <div class="handle" />
        <div class="sheetHead"><div class="sheetTitle">유형 선택</div><button id="sheetClose" class="sheetClose" aria-label="닫기" @click="close"><img :src="a('assets/reddit-ui/icon-close-outline.svg')" alt=""></button></div>
        <div class="sheetScroll">
          <div class="sheetLabel">게시물 유형</div>
          <div class="sheetGroup" role="radiogroup" aria-label="게시물 유형">
            <button
              v-for="t in types"
              :key="t[0]"
              :class="['modeRow', { on: page.mode.value === t[5] && page.display.thumbnail === t[3] && page.display.commentBadge === t[4] }]"
              role="radio"
              :aria-checked="(page.mode.value === t[5] && page.display.thumbnail === t[3] && page.display.commentBadge === t[4])"
              :data-thumb="t[3] ? '1' : '0'"
              :data-badge="t[4] ? '1' : '0'"
              :data-type-mode="t[5]"
              @click="pickType(t)"
            ><img class="sheetIcon" :src="iconSrc(t[0] === 'compact' ? 'text' : t[3] ? 'list' : 'text')" alt="" loading="lazy"><span class="modeText"><b>{{ t[1] }}</b><em v-if="t[2]" class="stateChip">{{ t[2] }}</em></span><span class="radio" aria-hidden="true" /></button>
          </div>
        </div>
        <div class="sheetFooter"><button id="typeReset" class="clearBtn" @click="resetType">초기화</button><button id="typeApply" class="applyBtn" @click="close">적용</button></div>
    </template>
    <template v-else-if="lastKind === 'postOptions'" :key="'o' + sheetKey">
        <div class="handle" />
        <div class="sheetHead"><div class="sheetTitle">게시글 옵션</div><button id="sheetClose" class="sheetClose" aria-label="닫기" @click="close"><img :src="a('assets/reddit-ui/icon-close-outline.svg')" alt=""></button></div>
        <div id="postOptionScroll" class="sheetScroll">
          <section class="postOptionSection">
            <h3 class="postOptionHeading">정렬</h3>
            <div class="postOptionRows" role="radiogroup" aria-label="정렬">
              <button v-for="r in sortRows" :key="r[0]" :class="['postOptionRow', { on: sortSelected === r[0] }]" type="button" role="radio" :aria-checked="(sortSelected === r[0])" :data-option-value="r[0]" @click="pickSort(r[0]!)"><img class="postOptionIcon" :src="optionIcon(r[3]!)" alt="" aria-hidden="true"><span class="postOptionCopy"><b class="postOptionName">{{ r[1] }}</b><small v-if="r[2]" class="postOptionDescription">{{ r[2] }}</small></span><img class="postOptionCheck" :src="a('assets/reddit-ui/sort-check.svg')" alt="" aria-hidden="true"></button>
              <button id="popularPeriodEntry" :class="['postOptionRow', { on: page.sortOrder.value === 'popular' && !pressedSort }]" type="button" aria-haspopup="dialog" @click="reopen('popularPeriod')"><img class="postOptionIcon" :src="a('assets/reddit-rail/popular.svg')" alt="" aria-hidden="true"><span class="postOptionCopy"><b class="postOptionName">인기</b><small class="postOptionDescription">{{ popularPeriodLabels[page.popularPeriod.value] || '전체 기간' }}</small></span><img class="postOptionChevron" :src="a('assets/reddit-ui/chevron-right.svg')" alt="" aria-hidden="true"></button>
            </div>
          </section>
          <section class="postOptionSection">
            <h3 class="postOptionHeading">보기</h3>
            <div class="postOptionRows" role="radiogroup" aria-label="보기">
              <button v-for="r in viewRows" :key="r[0]" :class="['postOptionRow', { on: viewSelected === r[0] }]" type="button" role="radio" :aria-checked="(viewSelected === r[0])" :data-option-value="r[0]" @click="pickView(r[0]!)"><img class="postOptionIcon" :src="optionIcon(r[3]!)" alt="" aria-hidden="true"><span class="postOptionCopy"><b class="postOptionName">{{ r[1] }}</b></span><img class="postOptionCheck" :src="a('assets/reddit-ui/sort-check.svg')" alt="" aria-hidden="true"></button>
            </div>
          </section>
          <section class="postOptionSection">
            <h3 class="postOptionHeading">말머리</h3>
            <div class="sheetChoiceChips" role="radiogroup" aria-label="말머리">
              <button v-for="(topic, i) in page.topics.value" :key="i" :class="['sheetChoiceChip', { on: chipSelected === i }]" type="button" role="radio" :aria-checked="(chipSelected === i)" :data-headword="i" @click="pickChip(i)"><img :src="a('assets/reddit-ui/sort-check.svg')" alt="" aria-hidden="true"><span>{{ topic }}</span></button>
            </div>
          </section>
        </div>
    </template>
    <template v-else-if="lastKind === 'popularPeriod'" :key="'p' + sheetKey">
        <div class="handle" />
        <div class="sheetHead hasBack"><button id="popularPeriodBack" class="sheetBack" aria-label="게시글 옵션으로 돌아가기" @click="page.openPostOptions(); sheetKey++"><img :src="a('assets/reddit-ui/back.svg')" alt="" aria-hidden="true"></button><div class="sheetTitle">인기</div><button id="sheetClose" class="sheetClose" aria-label="닫기" @click="close"><img :src="a('assets/reddit-ui/icon-close-outline.svg')" alt=""></button></div>
        <div class="sheetScroll">
          <div class="postOptionRows popularPeriodRows" role="radiogroup" aria-label="인기 기간">
            <button v-for="[id, label] in periods" :key="id" :class="['postOptionRow', 'popularPeriodRow', { on: page.popularPeriod.value === id }]" type="button" role="radio" :aria-checked="(page.popularPeriod.value === id)" :data-popular-period="id" @click="pickPeriod(id!)"><span class="postOptionRadio" aria-hidden="true" /><span class="postOptionCopy"><b class="postOptionName">{{ label }}</b></span><img class="postOptionCheck" :src="a('assets/reddit-ui/sort-check.svg')" alt="" aria-hidden="true"></button>
          </div>
        </div>
    </template>
    <template v-else-if="lastKind === 'board'" :key="'b' + sheetKey">
        <div class="handle" />
        <div class="sheetHead"><div class="sheetTitle">게시판 선택</div><button id="sheetClose" class="sheetClose" aria-label="닫기" @click="close"><img :src="a('assets/reddit-ui/icon-close-outline.svg')" alt=""></button></div>
        <div class="boardSheetScroll">
          <button :class="['boardRow', { selected: page.boardLabel.value === '전체 게시글' }]" :aria-current="page.boardLabel.value === '전체 게시글' ? 'true' : undefined" data-board-label="전체 게시글" data-topic="전체" @click="pickBoard('전체 게시글', '전체')"><img class="boardRowAvatar" :src="boardAvatarSrc(homeBoard)" alt="" aria-hidden="true"><span>전체 게시글</span><span class="boardNewDot" aria-hidden="true" /></button>
          <div class="boardDivider" />
          <template v-for="section in sections" :key="section.title">
            <div class="boardSectionTitle">{{ section.title }}</div>
            <button v-for="board in section.boards" :key="board.id" :class="['boardRow', { selected: page.boardLabel.value === board.displayName }]" :aria-current="page.boardLabel.value === board.displayName ? 'true' : undefined" :data-board-label="board.displayName" :data-topic="board.topicKey" @click="pickBoard(board.displayName, board.topicKey)"><img class="boardRowAvatar" :src="boardAvatarSrc(board)" alt="" aria-hidden="true"><span>{{ board.displayName }}</span></button>
          </template>
        </div>
    </template>
  </section>
</template>
