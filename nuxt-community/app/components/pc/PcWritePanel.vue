<script setup lang="ts">
// 정적 bobaedream-pc-interactions.js renderWriteView(): 왼쪽 「글쓰기」를 누르면 가운데 칸이 글쓰기 판으로 바뀐다.
import { boardConfig, boardNames, STORE_BOARD, STORE_POSTS, withLayout, type PcPost } from '~/composables/pc/pcBoardLogic'
import { readStore, savedPosts, usePcUi, writeStore } from '~/composables/pc/usePcBoard'

const props = defineProps<{ layout: string; boardParam: string | null }>()
const emit = defineEmits<{ navigate: [path: string] }>()
const { loggedIn, refreshLogin, showLoginModal, toast } = usePcUi()

let initial = props.boardParam || readStore(STORE_BOARD) || '국산차 오너톡'
if (initial === '전체 게시글') initial = '국산차 오너톡'
const current = initial
const board = ref(current)
const title = ref('')
const body = ref('')
const tag = ref('')
const locked = ref(true)
const titleInput = ref<HTMLInputElement | null>(null)
const bodyInput = ref<HTMLTextAreaElement | null>(null)
const names = boardNames.filter(name => name !== '전체 게시글')

function unlock() {
  locked.value = false
  refreshLogin()
  nextTick(() => titleInput.value?.focus())
}
defineExpose({ unlock })

function cancel() {
  emit('navigate', withLayout('/pc?board=' + encodeURIComponent(current), props.layout))
}
function submit() {
  refreshLogin()
  if (!loggedIn.value) {
    showLoginModal(unlock)
    return
  }
  const t = title.value.trim()
  const b = body.value.trim()
  if (!t) { toast('제목을 입력해주세요.'); titleInput.value?.focus(); return }
  if (!b) { toast('본문을 입력해주세요.'); bodyInput.value?.focus(); return }
  const c = boardConfig[board.value] || boardConfig['국산차 오너톡']!
  const id = 'post-' + Date.now()
  const post: PcPost = [c.label, t, '시안계정', '방금', 0, 0, 0, b, id, board.value]
  const saved = savedPosts()
  saved.unshift(post)
  writeStore(STORE_POSTS, JSON.stringify(saved.slice(0, 40)))
  writeStore(STORE_BOARD, board.value)
  emit('navigate', '/pc/posts/' + encodeURIComponent(id) + withLayout('?board=' + encodeURIComponent(board.value) + '&postId=' + encodeURIComponent(id), props.layout))
}

onMounted(() => {
  refreshLogin()
  if (loggedIn.value) unlock()
})
</script>

<template>
  <section class="writePanel" :class="{ isLocked: locked }" aria-label="글쓰기">
    <div class="writeHead"><strong>글쓰기</strong><select v-model="board" class="writeBoardSelect" aria-label="게시판 선택"><option v-for="name in names" :key="name" :value="name">{{ name }}</option></select></div>
    <input ref="titleInput" v-model="title" class="writeField writeTitleInput" maxlength="80" placeholder="제목을 입력해주세요">
    <textarea ref="bodyInput" v-model="body" class="writeField writeBodyTextarea" maxlength="5000" placeholder="자동차 이야기, 정비 후기, 사고 상황 등을 자유롭게 작성해주세요." />
    <div class="writeTagArea"><span class="writeTagMark">#</span><input v-model="tag" class="writeField writeTagInput" placeholder="태그 입력 (#으로 구분, 최대 10개)"></div>
    <div class="writeBottom"><button class="writeCancel" @click="cancel">취소</button><button class="writeSubmit" @click="submit">등록</button></div>
  </section>
</template>
