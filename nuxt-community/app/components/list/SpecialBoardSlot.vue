<script setup lang="ts">
// 전용 화면 게시판(차량리뷰 · 투후 리뷰 · 연비·전비 · 차량 결함·불만 · 처즈왕 결함·불만) 자리.
// 정적 판에서는 vehicle-review-board.js · tuhu-review-board.js · fuel-economy-board.js · autohome-complaint-board.js ·
// chezhiwang-complaint-board.js(+ -enhancements · -stats) 가 #list 안을 직접 그린다. 넉스트 판은 components/boards/ 의 화면이 그린다.
//
// 정적 판 렌더 함수가 받던 것과 같은 값을 props 로 넘긴다:
//   - board: 게시판 id('vehicle-review' | 'tuhu-review' | 'fuel-economy' | 'autohome-complaint' | 'chezhiwang-complaint')
//   - posts: window.BBM_BOARD_TABLE.postsFor(board) 와 같은 글 목록(방금 쓴 글이 그 게시판이면 맨 앞, listData.postsForTable 로 만든 모양)
//   - phoneClasses: .phone 의 class 집합(정적 판 renderer 가 document.querySelector('.phone').classList 로 더하고 빼던 것)
//   - listClass: #list 의 class 문자열 ref
//   - typeLabel: 「유형 선택」 버튼 글자 ref
//   - topics / active: 말머리 목록과 선택 번호(ref)
//   - query: 첫 주소 쿼리(하위 화면 이동은 각 화면이 useRoute 로 다시 읽는다)
//   - toast: 목록 화면 알림
// 정적 판 맨 끝 인라인 스크립트(목록 HTML 417줄)는 연비·전비 화면을 postsFor('fuel-economy') 로 다시 그린다.
// 그래서 연비·전비만 방금 쓴 글을 끼우지 않은 테이블 글을 쓴다.
import type { Ref } from 'vue'
import boardsResetCss from '~/assets/css/legacy/boards-reset.css?raw'
import type { ListPost } from '~/composables/list/listData'
import { postsForTable } from '~/composables/list/listData'
import VehicleReviewBoard from '~/components/boards/VehicleReviewBoard.vue'
import FuelEconomyBoard from '~/components/boards/FuelEconomyBoard.vue'
import AutohomeComplaintBoard from '~/components/boards/AutohomeComplaintBoard.vue'
import ChezhiwangComplaintBoard from '~/components/boards/ChezhiwangComplaintBoard.vue'
import TuhuReviewBoard from '~/components/boards/TuhuReviewBoard.vue'

const props = defineProps<{
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
// 게시판 CSS(vehicle-review-board.css 등)는 목록 화면(pages/index.vue)이 정적 판과 같은 순서로 이미 붙인다.
// 여기서는 공용 main.css 가 새어 드는 것만 이 화면이 떠 있는 동안 되돌린다(내리면 useHead 가 지운다).
useHead({ style: [{ key: 'bbm-boards-reset', textContent: boardsResetCss, tagPriority: 210 }] })
const fuelPosts =computed(() => (props.board === 'fuel-economy' ? postsForTable('fuel-economy') || [] : []))
</script>

<template>
  <VehicleReviewBoard v-if="board === 'vehicle-review'" :posts="posts" :phone-classes="phoneClasses" :list-class="listClass" :type-label="typeLabel" />
  <FuelEconomyBoard v-else-if="board === 'fuel-economy'" :posts="fuelPosts" :phone-classes="phoneClasses" :list-class="listClass" :type-label="typeLabel" />
  <AutohomeComplaintBoard v-else-if="board === 'autohome-complaint'" :phone-classes="phoneClasses" :list-class="listClass" />
  <ChezhiwangComplaintBoard v-else-if="board === 'chezhiwang-complaint'" :phone-classes="phoneClasses" :list-class="listClass" />
  <TuhuReviewBoard v-else-if="board === 'tuhu-review'" :phone-classes="phoneClasses" :list-class="listClass" />
</template>
