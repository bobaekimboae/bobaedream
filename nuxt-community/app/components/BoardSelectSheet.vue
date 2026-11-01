<script setup lang="ts">
import type { CommunitySection } from '~/types/community'

const props = defineProps<{ open: boolean; sections: CommunitySection[]; selectedId: string }>()
const emit = defineEmits<{ close: []; select: [id: string] }>()
const iconRoot = `${useRuntimeConfig().app.baseURL}icons/write`
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet-fade">
      <div v-if="props.open" class="sheet-backdrop sheet-backdrop--solid" role="presentation">
        <section class="board-select-sheet" role="dialog" aria-modal="true" aria-labelledby="board-sheet-title">
          <header>
            <h2 id="board-sheet-title">게시판 선택</h2>
            <button type="button" aria-label="닫기" @click="emit('close')">×</button>
          </header>
          <div class="board-select-body">
            <section v-for="section in props.sections" :key="section.id" class="board-section">
              <h3>{{ section.name }}</h3>
              <button v-for="board in section.boards" :key="board.id" type="button" :class="{ 'is-selected': board.id === props.selectedId }" @click="emit('select', board.id)">
                <img :src="`${iconRoot}/community.svg`" alt="" />
                <span>{{ board.name }}</span>
                <b v-if="board.id === props.selectedId" aria-label="선택됨">✓</b>
              </button>
            </section>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
