<!-- 글쓰기 설정(네이버 카페 앱 2026-11-06 폰 확인): ← 글쓰기 설정 · 저장.
     공지로 등록 / 공개 설정(멤버 공개) · 검색 공개 허용(설명 + 도움말) · 댓글 허용 · 스크랩 허용 · 복사, 저장 허용 / 첨부 사진 크기.
     치지직형에서 가져온 것: 본문 숨기기(목록 · 검색 결과에서 본문 첫 줄을 감춘다) -->
<script setup lang="ts">
import { ref } from 'vue'
import type { WriteSettings } from '~/composables/write/useCommunityWrite'
import WriteToolPage from '../app/WriteToolPage.vue'

const props = defineProps<{ settings: WriteSettings, allowSearch: boolean, hideBody: boolean }>()
const emit = defineEmits<{ save: [value: { settings: WriteSettings, allowSearch: boolean, hideBody: boolean }], close: [], toast: [message: string] }>()
const draft = ref<WriteSettings>({ ...props.settings })
const search = ref(props.allowSearch)
const hide = ref(props.hideBody)
const visibilityLabel = { member: '멤버 공개', all: '전체 공개' } as const
const sizeLabel = { large: '크게(가로크기 1280)', medium: '보통(가로크기 960)', original: '원본' } as const
</script>

<template>
  <WriteToolPage title="글쓰기 설정" left-label="뒤로가기" action-label="저장" action-tone="soft" @left="emit('close')" @action="emit('save', { settings: draft, allowSearch: search, hideBody: hide })">
    <div class="nwo">
      <div class="nwo-group">
        <label class="aw-switch-row"><span>공지로 등록</span><input v-model="draft.notice" type="checkbox" role="switch"><i aria-hidden="true" /></label>
      </div>
      <div class="nwo-group">
        <label class="nwo-select"><span>공개 설정</span><b>{{ visibilityLabel[draft.visibility] }}</b>
          <select v-model="draft.visibility" aria-label="공개 설정"><option value="member">멤버 공개</option><option value="all">전체 공개</option></select>
        </label>
        <label class="aw-switch-row is-desc">
          <span>검색 · 보배드림 서비스 공개 허용<small>허용하면 회원이 아닌 사람도 검색 결과에서 이 글을 볼 수 있습니다. <button type="button" class="nwo-help" @click.prevent="emit('toast', '검색에 공개하면 글 제목과 본문 일부가 검색 결과에 보여요.')">도움말</button></small></span>
          <input v-model="search" type="checkbox" role="switch"><i aria-hidden="true" />
        </label>
        <label class="aw-switch-row"><span>댓글 허용</span><input v-model="draft.comments" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="aw-switch-row"><span>카페, 블로그 스크랩 허용</span><input v-model="draft.scrap" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="aw-switch-row"><span>복사, 저장 허용</span><input v-model="draft.copy" type="checkbox" role="switch"><i aria-hidden="true" /></label>
        <label class="aw-switch-row"><span>본문 숨기기</span><input v-model="hide" type="checkbox" role="switch"><i aria-hidden="true" /></label>
      </div>
      <div class="nwo-group">
        <label class="nwo-select"><span>첨부 사진 크기</span><b>{{ sizeLabel[draft.photoSize] }}</b>
          <select v-model="draft.photoSize" aria-label="첨부 사진 크기"><option value="large">크게(가로크기 1280)</option><option value="medium">보통(가로크기 960)</option><option value="original">원본</option></select>
        </label>
      </div>
    </div>
  </WriteToolPage>
</template>
