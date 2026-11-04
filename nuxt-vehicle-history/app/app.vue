<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useVehicleHistory } from './composables/useVehicleHistory'
import { formatPlate, MODES, normalizePlate } from './lib/history.ts'
import type { Mode } from './lib/history.ts'
import ReportPanel from './components/HistoryReport.vue'

const { report, loading, error, recent, storageNotice, lookup, reset, clearRecent } = useVehicleHistory()
const plate = ref(''), owner = ref(''), consent = ref(false), mode = ref<Mode>('dealer')
const selectedMode = computed(() => MODES[mode.value])
const drawer = ref<HTMLDialogElement | null>(null)
const plateInput = ref<HTMLInputElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const showGuide = ref(false)
watch(mode, () => { consent.value = false; owner.value = ''; error.value = '' })
onMounted(() => {
  const params = new URLSearchParams(location.search)
  const type = params.get('mode') || params.get('lookupType')
  mode.value = type === 'owner' ? 'owner' : 'dealer'
  for (const key of ['plate', 'vehicleNumber', 'carNo', 'car_no', 'number']) {
    const value = params.get(key)
    if (value) { plate.value = normalizePlate(value); break }
  }
})
function openDrawer() { drawer.value?.showModal(); document.body.style.overflow = 'hidden' }
function closeDrawer() { drawer.value?.close(); document.body.style.overflow = ''; menuButton.value?.focus() }
function outsideDrawer(event: MouseEvent) { const el = drawer.value; if (el && event.target === el && event.clientX < el.getBoundingClientRect().left) closeDrawer() }
onBeforeUnmount(() => { document.body.style.overflow = '' })
async function submit() {
  if (await lookup({ plate: plate.value, owner: owner.value, mode: mode.value, consent: consent.value })) {
    owner.value = ''
    await nextTick(); document.getElementById('report')?.scrollIntoView({ behavior: 'smooth' })
  }
}
async function newLookup() {
  reset(); plate.value = ''; owner.value = ''; consent.value = false; mode.value = 'dealer'; closeDrawer()
  await nextTick(); document.getElementById('lookup')?.scrollIntoView({ behavior: 'smooth' }); plateInput.value?.focus()
}
function printReport() {
  if (!report.value) return
  closeDrawer(); window.print()
}
function guide() { closeDrawer(); showGuide.value = true; nextTick(() => document.getElementById('guide')?.scrollIntoView({ behavior: 'smooth' })) }
</script>

<template>
  <header class="topbar"><div class="topbar-inner"><div class="brand"><span class="brand-mark">BOBAE</span><div>차량이력조회<small>BOBAEDREAM VEHICLE HISTORY</small></div></div><button ref="menuButton" type="button" class="menu-btn" aria-label="더보기 메뉴" aria-haspopup="dialog" @click="openDrawer">☰</button></div></header>
  <main class="shell">
    <section id="lookup" class="lookup"><div class="eyebrow">USED CAR HISTORY REPORT</div><h1>국토부 기준으로<br>차량 이력을 확인하세요</h1><p>매매용 차량은 번호판으로 조회하고, 소유자 정보가 필요한 조회는<br>해당 정보를 함께 입력해 제공 범위를 확인합니다.</p><div class="lookup-mode">{{ selectedMode.badge }}</div>
      <form id="lookupForm" novalidate @submit.prevent="submit">
        <fieldset class="lookup-types" :disabled="loading"><legend class="sr-only">차량이력 조회 유형</legend><label v-for="(option,key) in MODES" :key="key" class="lookup-type" :class="{active:mode===key}"><input v-model="mode" type="radio" name="lookupMode" :value="key"><strong>{{ option.title }}</strong><span>{{ option.detail }}</span></label></fieldset>
        <div class="lookup-grid" :class="{'owner-mode':mode==='owner'}"><div class="field"><label for="plate">차량번호</label><input id="plate" ref="plateInput" v-model="plate" name="plate" :disabled="loading" autocomplete="off" maxlength="15" placeholder="차량번호를 입력해주세요" :aria-invalid="!!error" aria-describedby="scope-note"></div><div v-if="mode==='owner'" class="field owner-field"><label for="owner">소유자명</label><input id="owner" v-model="owner" name="owner" :disabled="loading" autocomplete="off" maxlength="100" placeholder="개인·법인 소유자명"></div><button id="lookupBtn" class="lookup-btn" type="submit" :disabled="loading">{{ loading ? '조회 중…' : '이력 조회' }}</button></div>
        <p id="scope-note" class="scope-note">{{ selectedMode.note }}</p><label class="consent"><input id="consent" v-model="consent" type="checkbox" :disabled="loading"><span>{{ selectedMode.consent }}</span></label><div v-if="error" id="message" class="message" role="alert">{{ error }}</div>
      </form>
    </section>
    <section v-if="loading" class="progress" role="status" aria-live="polite"><div class="progress-row"><span>차량 이력을 조회하고 있습니다</span><span>제공 기관 응답 대기</span></div><div class="bar"><i/></div></section>
    <ReportPanel v-if="report" :report="report" @reset="newLookup" @print="printReport"/>
    <section v-if="showGuide" id="guide" class="section"><div class="section-title"><h3>조회 항목 안내</h3><button class="action" type="button" @click="showGuide=false">닫기</button></div><p>소유·용도, 보험사고, 검사·정비, 압류·저당 등 19개 표시 항목을 제공 기관의 응답에 따라 정리합니다. 항목이 표시된다고 모든 차량에서 해당 정보를 조회할 수 있는 것은 아닙니다.</p><p>‘정보 없음’과 ‘조회 실패’는 이력이 없다는 뜻이 아닙니다. 주행거리 감소 기록은 추가 확인이 필요한 표시이며 조작 확정 판정이 아닙니다.</p></section>
  </main>
  <dialog ref="drawer" class="drawer" aria-labelledby="drawer-title" @click="outsideDrawer" @cancel.prevent="closeDrawer" @close="closeDrawer"><div class="drawer-head"><h2 id="drawer-title">더보기</h2><button type="button" aria-label="닫기" @click="closeDrawer">×</button></div><nav aria-label="차량이력 메뉴"><button type="button" @click="newLookup">＋ 새 차량 조회</button><button type="button" :disabled="!report" @click="printReport">⇩ 리포트 PDF 저장</button><button type="button" @click="guide">ⓘ 조회 항목 안내</button></nav><section class="recent"><h3>최근 검색이력</h3><p class="footer-note">이 브라우저에 최대 10건 저장합니다. 소유자명은 저장하지 않습니다.</p><p v-if="storageNotice" role="status">{{ storageNotice }}</p><div v-for="(entry,index) in recent" :key="index" class="recent-row"><strong>{{ entry.name }} · {{ formatPlate(entry.plate) }}</strong><small>{{ entry.date }} · {{ entry.mode==='owner'?'소유자 확인':'번호판 단독' }}</small></div><p v-if="!recent.length" class="footer-note">아직 조회한 차량이 없습니다.</p><button type="button" class="delete-all" :disabled="!recent.length" @click="clearRecent">검색이력 전체 삭제</button></section></dialog>
</template>
