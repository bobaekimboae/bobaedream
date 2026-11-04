<script setup lang="ts">
// 전용 화면 게시판(차량리뷰 · 투후 리뷰 · 연비·전비 · 차량 결함·불만 · 처즈왕 결함·불만) 자리.
// 정적 판에서는 vehicle-review-board.js · tuhu-review-board.js · fuel-economy-board.js · autohome-complaint-board.js ·
// chezhiwang-complaint-board.js(+ -enhancements · -stats) 가 #list 안을 직접 그린다. 이 화면들은 다른 담당이 채운다(지금은 아무것도 그리지 않음).
//
// 정적 판 렌더 함수가 받던 것과 같은 값을 props 로 넘긴다:
//   - board: 게시판 id('vehicle-review' | 'tuhu-review' | 'fuel-economy' | 'autohome-complaint' | 'chezhiwang-complaint')
//   - posts: window.BBM_BOARD_TABLE.postsFor(board) 와 같은 글 목록(방금 쓴 글이 그 게시판이면 맨 앞, listData.postsForTable 로 만든 모양)
//   - phoneClasses: .phone 의 class 집합(정적 판 renderer 가 document.querySelector('.phone').classList 로 더하고 빼던 것.
//       예: vehicleReviewBoardMode · autohomeComplaintMode · chezhiwangComplaintMode · …Writer · …Detail). add/delete 로 바꾸면 바로 반영된다.
//   - listClass: #list 의 class 문자열 ref(정적 판 list.className = 'list ahc' 처럼 바꾸던 것)
//   - typeLabel: 「유형 선택」 버튼 글자 ref(정적 판 #typeLabel textContent)
//   - topics / active: 말머리 목록과 선택 번호(ref). 정적 판은 BOBAE_TOPICS 와 목록 스크립트 topics 를 같이 썼다.
//   - query: 주소 쿼리(tuhu=write · complaint=write · czw=write 같은 하위 화면 구분)
//   - toast: 목록 화면 알림(정적 판 #toast)
// 다른 정적 의존: window.BBM_BOARD_TABLES(데이터 파일), window.BBM_IMPORTER_DEALER_DIRECTORY(data/importer-dealer-directory.js),
//   window.BBM_EMBED(community-embed.js) — 모두 listData.loadListData() 가 불러 둔다.
import type { Ref } from 'vue'
import type { ListPost } from '~/composables/list/listData'

defineProps<{
  board: string
  posts: ListPost[]
  phoneClasses: Set<string>
  listClass: Ref<string>
  typeLabel: Ref<string>
  topics: Ref<string[]>
  active: Ref<number>
  query: Record<string, string | undefined>
  toast: (text: string) => void
}>()
</script>

<template>
  <!-- 다른 담당이 채울 자리 -->
  <template v-if="false" />
</template>
