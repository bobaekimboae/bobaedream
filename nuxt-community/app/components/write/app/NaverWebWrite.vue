<!-- 커뮤니티 글쓰기 · 네이버 카페 웹형(?style=naver-web, 비교용. 정본 모양: public/community/naver-write-parity.html · .css).
     2026-11-06부터 ?style=naver 는 네이버 카페 앱형(components/write/naver/NaverWrite.vue)이다.
     기능은 치지직형과 같다(같은 useCommunityWrite · 편집기 · 도구 화면). 「말머리」 자리에 글 종류를 둔다. -->
<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CommunityWrite } from '~/composables/write/useCommunityWrite'
import PostTypeFields from './PostTypeFields.vue'
import WriteFormatBar from './WriteFormatBar.vue'
import WriteQuoteBar from './WriteQuoteBar.vue'

const props = defineProps<{ w: CommunityWrite }>()
const emit = defineEmits<{ body: [el: HTMLElement | null] }>()
const w = props.w
const parity = (name: string) => communityAsset(`assets/write-parity/${name}.svg`)
const textTools = ref(false)
const moreSettings = ref(false)
const photoInput = ref<HTMLInputElement | null>(null)
const videoInput = ref<HTMLInputElement | null>(null)
const inQuote = computed(() => w.editor.state.value.quote > 0)
const draftCount = ref(0)
try { draftCount.value = localStorage.getItem('bbm.community.writeDraft.v2') ? 1 : 0 } catch { draftCount.value = 0 }
const keep = (event: Event) => event.preventDefault()
function setBody(el: unknown) { emit('body', el as HTMLElement | null) }
function save() { if (w.saveDraft()) draftCount.value = 1 }
</script>

<template>
  <main class="write-page aw-naver" data-write-style="naver" data-testid="community-write">
    <header class="write-header">
      <button class="icon-button close-button" type="button" aria-label="닫기" @click="w.exit()"><img :src="parity('close')" alt=""></button>
      <div class="header-actions">
        <button class="header-link" type="button" @click="w.toast(draftCount ? '임시저장한 글은 다음에 글쓰기를 열 때 이어서 쓸 수 있어요.' : '임시저장한 글이 없어요.')">임시 <span>{{ draftCount }}</span></button>
        <button class="header-link" type="button" @click="save">임시등록</button>
        <button class="submit-button" type="button" :disabled="!w.canPress.value" @click="w.submit()">등록</button>
      </div>
    </header>

    <div class="taxonomy-row" aria-label="게시판과 글 종류 선택">
      <button class="board-select taxonomy-select" type="button" aria-haspopup="dialog" @click="w.tool.value = 'board'"><span>{{ w.board.value || '게시판 선택' }}</span><img :src="parity('chevron-down')" alt=""></button>
      <button class="head-select taxonomy-select" type="button" aria-haspopup="dialog" @click="w.tool.value = 'type'"><span>{{ w.postType.value.id === 'normal' ? '글 종류' : w.postType.value.label }}</span><img :src="parity('chevron-down')" alt=""></button>
    </div>

    <section class="title-area">
      <label class="sr-only" for="awNaverTitle">제목</label>
      <input id="awNaverTitle" v-model="w.title.value" maxlength="80" placeholder="제목" autocomplete="off">
    </section>

    <section class="editor-shell" aria-label="본문 편집기">
      <div v-if="inQuote" class="aw-naver-quote"><WriteQuoteBar :editor="w.editor" /></div>
      <div v-else class="primary-toolbar" role="toolbar" aria-label="콘텐츠 도구" @mousedown="keep">
        <button class="tool-button" type="button" @click="photoInput?.click()"><img :src="parity('photo')" alt=""><span>사진</span></button>
        <button class="tool-button" type="button" @click="videoInput?.click()"><img :src="parity('video')" alt=""><span>동영상</span></button>
        <button class="tool-button" type="button" :aria-expanded="textTools" @click="textTools = !textTools"><img :src="parity('text')" alt=""><span>텍스트 도구막대</span></button>
        <button class="tool-button" type="button" @click="w.tool.value = 'sticker'"><img :src="parity('sticker')" alt=""><span>스티커</span></button>
        <button class="tool-button" type="button" @click="w.tool.value = 'type'"><img :src="parity('tag')" alt=""><span>글 종류</span></button>
        <button class="tool-button" type="button" @click="w.editor.insertQuote(1)"><img :src="parity('quote')" alt=""><span>인용구</span></button>
        <button class="tool-button" type="button" @click="w.editor.insertDivider()"><img :src="parity('strike')" alt=""><span>구분선</span></button>
        <button class="tool-button" type="button" @click="w.tool.value = 'link'"><img :src="parity('link')" alt=""><span>링크</span></button>
        <button class="tool-button" type="button" @click="w.tool.value = 'poll'"><img :src="parity('table')" alt=""><span>투표</span></button>
      </div>
      <WriteFormatBar v-if="textTools || inQuote" :editor="w.editor" @link="w.tool.value = 'link'" />
      <PostTypeFields v-if="w.postType.value.id !== 'normal'" :type="w.postType.value" :values="w.typeValues.value" :problem="w.triedSubmit.value ? w.typeProblem.value : ''" @change="(key, value) => (w.typeValues.value = { ...w.typeValues.value, [key]: value })" @open="w.tool.value = 'type'" />
      <article :ref="setBody" class="aw-editor-body is-naver" />
    </section>

    <section class="tag-area">
      <label class="sr-only" for="awNaverTags">태그</label>
      <input id="awNaverTags" v-model="w.tagDraft.value" placeholder="#태그 입력(#으로 구분, 최대10개)" autocomplete="off" @blur="w.commitTags()" @keydown.enter.prevent="w.commitTags()">
    </section>

    <section class="public-settings" aria-labelledby="awSettingsTitle">
      <div class="settings-title-row"><h2 id="awSettingsTitle">게시물 허용 설정</h2><button class="visibility-button" type="button" @click="w.toast('멤버 공개로 올라가요.')">멤버 공개</button></div>
      <label class="setting-row"><span><strong>게시물 검색 허용</strong><small>허용하면 서비스 검색 결과에서 이 게시물을 찾을 수 있습니다.</small></span><input v-model="w.allowSearch.value" type="checkbox"><i aria-hidden="true" /></label>
      <button class="settings-expand" type="button" :aria-expanded="moreSettings" @click="moreSettings = !moreSettings">{{ moreSettings ? '상세설정 접기' : '상세설정 펼치기' }}</button>
      <div v-if="moreSettings">
        <label class="setting-row compact"><span><strong>본문 숨기기</strong></span><input v-model="w.hideBody.value" type="checkbox"><i aria-hidden="true" /></label>
      </div>
    </section>

    <footer class="write-footer">
      <div class="footer-actions"><button type="button" @click="w.exit()">취소</button><button type="button" class="footer-submit" :disabled="!w.canPress.value" @click="w.submit()">등록</button></div>
    </footer>

    <input ref="photoInput" class="sr-only" type="file" accept="image/*" multiple @change="w.addMedia(($event.target as HTMLInputElement).files, 'photo'); ($event.target as HTMLInputElement).value = ''">
    <input ref="videoInput" class="sr-only" type="file" accept="video/mp4,video/webm,video/quicktime" multiple @change="w.addMedia(($event.target as HTMLInputElement).files, 'video'); ($event.target as HTMLInputElement).value = ''">
  </main>
</template>
