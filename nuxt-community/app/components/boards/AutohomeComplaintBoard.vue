<script setup lang="ts">
// 차량 결함·불만 게시판(board=autohome-complaint). 정본: public/community/autohome-complaint-board.js
//  - 목록(?issue=유형) · 상세(?complaint=<id>) · 등록(?complaint=write) · 등록 완료
import type { Ref } from 'vue'
import { boardSrc, boardTable, readJson, writeJson, setPhoneClass, useBoardQuery, type Row } from '~/composables/boards/boardUtil'
import { useListPageCtx } from '~/composables/list/useListPage'

const props = defineProps<{ phoneClasses: Set<string>; listClass: Ref<string> }>()
const page = useListPageCtx()
const { q, edit, go } = useBoardQuery()
const storageKey = 'bobae-autohome-complaints-v1'
const commentKey = 'bobae-autohome-complaint-comments-v1'
const icons: Record<string, string> = {
  back: 'assets/reddit-ui/back.svg', share: '../%61ssets/detail/autoscout24-share.svg', chat: 'assets/reactions/comment-outline.svg', like: 'assets/reactions/recommend.svg',
  bookmark: '../icons/chotot/chotot-common-bookmark.svg', write: 'assets/reddit-ui/write.svg', photo: 'assets/chzzk-detail/icons/camera.svg', check: '../%61ssets/register/chotot-v01/check-mark.svg',
}
const ic = (name: string) => boardSrc(icons[name])
const localRows = () => readJson<Row[]>(storageKey, []) || []
const allRows = () => localRows().concat(boardTable('autohome-complaint').rows || [])
const logo = (row: Row) => boardSrc(row.brandLogo || '../%61ssets/vehicle-catalog/logos/logo_hyundai.png')
const picture = (row: Row) => boardSrc(String(row.thumbnail || '').replace(/\|.*$/, '') || '../%61ssets/cars/seoul-autogallery-v01/sag-01-1.webp')
function listUrl() { return edit((p) => { p.board = 'autohome-complaint'; delete p.complaint }) }
function detailUrl(id: string) { return edit((p) => { p.board = 'autohome-complaint'; p.complaint = id }) }
function writerUrl() { return edit((p) => { p.board = 'autohome-complaint'; p.complaint = 'write' }) }

const view = computed(() => q.value.complaint || '')
const tick = ref(0) // 등록 뒤 목록 다시 읽기
const listRows = computed(() => {
  void tick.value
  let rows = allRows()
  const topic = q.value.issue
  if (topic && topic !== '전체') rows = rows.filter(r => r.issueType === topic)
  return rows
})

// ── 상세 ──
const row = computed<Row | null>(() => {
  void tick.value
  if (!view.value || view.value === 'write') return null
  const rows = allRows()
  return rows.find(r => String(r.complaintId || r.id) === String(view.value)) || rows[0] || null
})
const comments = ref<Row[]>([])
const commentInput = ref('')
const loadedLocal = ref(0) // 정적 판은 댓글을 더해도 제목의 댓글 수를 다시 쓰지 않는다
const savedOn = ref(false)
const likeOn = ref(false)
const fixedComments = [{ author: '정비노트', body: '같은 증상이 재현되는 조건과 경고등 사진을 함께 남겨두시면 진단에 도움이 됩니다.' }, { author: '안전제보', body: '주행 안전과 관련된 증상이면 운행을 멈추고 제조사 긴급출동을 먼저 이용하세요.' }]
const vehicleLabels: Record<string, string> = { 'domestic-new': '국내 신차', 'official-import': '공식 수입차', 'parallel-import': '병행수입차', used: '중고차' }
function partyRows(r: Row): Array<[string, string]> {
  const values: Array<[string, string]> = [['차량 구분', vehicleLabels[r.vehicleType] || '차량'], ['제조사', r.manufacturer || r.brand], ['모델', r.brand + ' ' + r.model]]
  if (r.vehicleType === 'official-import') values.push(['공식 수입사', r.importer || '미입력'], ['수입차 딜러사', r.dealerGroup || '미입력'], ['판매·정비 지점', r.dealerBranch || '미입력'])
  else if (r.vehicleType === 'parallel-import') values.push(['병행수입 업체', r.importer || '미입력'], ['판매 업체', r.dealerGroup || '미입력'])
  else if (r.vehicleType === 'used') values.push(['판매 상사', r.dealerGroup || '미입력'], ['판매자·담당자', r.dealerBranch || '미입력'])
  else values.push(['신차 딜러사', r.dealerGroup || '미입력'], ['판매·정비 지점', r.dealerBranch || '미입력'])
  return values
}
function addComment() {
  if (!commentInput.value.trim()) return
  comments.value.unshift({ author: '보배드림 회원', body: commentInput.value.trim() })
  writeJson(commentKey + '.' + view.value, comments.value)
  commentInput.value = ''
}
function share() { if (navigator.clipboard) navigator.clipboard.writeText(location.href) }

// ── 등록 ──
interface Catalog { manufacturers: Row[]; modelGroups: Row[]; generations: Row[] }
const catalog = ref<Catalog | null>(null)
const catalogFailed = ref(false)
const kinds: Array<[string, string]> = [['domestic-new', '국내 신차'], ['official-import', '공식 수입차'], ['parallel-import', '병행수입차'], ['used', '중고차']]
const issueTypes = ['조향', '제동', '전장', '엔진·모터', '변속', '배터리·충전', '누수', '도장·마감', '판매 과정', '정비 서비스', '기타']
const f = reactive({ make: '', model: '', generation: '', domesticDealer: '', domesticBranch: '', officialImporter: '', importDealer: '', importBranch: '', parallelImporter: '', parallelDealer: '', usedDealer: '', usedSeller: '', odometer: '', title: '', body: '', statement: '개인 의견이며 참고용입니다' })
const selectedType = ref('')
const selectedKind = ref('')
const uploadClicked = ref(false)
const errorText = ref('')
const errorShow = ref(false)
const success = ref(false)
const makes = computed(() => catalog.value?.manufacturers || [])
const models = computed(() => (catalog.value && f.make ? catalog.value.modelGroups.filter(v => v.makeId === f.make) : []))
const generations = computed(() => (catalog.value && f.model ? catalog.value.generations.filter(v => v.groupId === f.model) : []))
const makeName = computed(() => makes.value.find(v => String(v.id) === f.make)?.name || (f.make === 'manual' ? '직접 입력' : ''))
const directory = computed<Row | null>(() => {
  const dir = (globalThis as Record<string, any>).BBM_IMPORTER_DEALER_DIRECTORY || {}
  return (dir.byMakeName || {})[makeName.value] || null
})
const directoryNote = ref('')
function refreshDirectory() {
  const entry = directory.value
  f.officialImporter = entry && entry.importers && entry.importers.length === 1 ? entry.importers[0] : ''
  f.importDealer = entry && entry.dealers && entry.dealers.length === 1 ? entry.dealers[0] : ''
  f.importBranch = entry && entry.branches && entry.branches.length === 1 ? entry.branches[0] : ''
  directoryNote.value = entry ? '2026-10-17 공식 브랜드 자료 기준 후보입니다. 실제 계약서·정비명세서의 사업자명을 확인해 주세요.' : '확인된 공식 명부가 없어 계약서·정비명세서의 사업자명을 직접 입력해 주세요.'
}
function onMake() { f.model = ''; f.generation = ''; refreshDirectory() }
function onModel() { f.generation = '' }
function chooseKind(k: string) { selectedKind.value = k; if (k === 'official-import') refreshDirectory() }
function submit() {
  const requiredParties: string[] = selectedKind.value === 'domestic-new' ? [f.domesticDealer, f.domesticBranch]
    : selectedKind.value === 'official-import' ? [f.officialImporter, f.importDealer, f.importBranch]
      : selectedKind.value === 'parallel-import' ? [f.parallelImporter, f.parallelDealer]
        : selectedKind.value === 'used' ? [f.usedDealer] : []
  const missingParty = requiredParties.some(v => !v.trim())
  if (!selectedKind.value || !f.make || !f.model || missingParty || !selectedType.value || !f.title.trim() || !f.body.trim()) {
    errorText.value = '차량 구분·제조사·모델·관련 업체·문제 유형·제목·상세 내용을 모두 입력해 주세요.'
    errorShow.value = true
    return
  }
  errorShow.value = false
  const makeText = makeName.value
  const modelText = models.value.find(v => String(v.id) === f.model)?.name || ''
  let importer = ''; let dealerGroup = ''; let dealerBranch = ''
  if (selectedKind.value === 'domestic-new') { dealerGroup = f.domesticDealer.trim(); dealerBranch = f.domesticBranch.trim() }
  if (selectedKind.value === 'official-import') { importer = f.officialImporter.trim(); dealerGroup = f.importDealer.trim(); dealerBranch = f.importBranch.trim() }
  if (selectedKind.value === 'parallel-import') { importer = f.parallelImporter.trim(); dealerGroup = f.parallelDealer.trim() }
  if (selectedKind.value === 'used') { dealerGroup = f.usedDealer.trim(); dealerBranch = f.usedSeller.trim() }
  const local = {
    id: 'local-' + Date.now(), complaintId: 'local-' + Date.now(), brand: makeText, manufacturer: makeText, model: modelText,
    trim: f.generation ? generations.value.find(v => String(v.id) === f.generation)?.name || modelText : modelText, vehicleType: selectedKind.value,
    importer, dealerGroup, dealerBranch, author: '보배드림 회원', verified: true, city: '서울', publicLabel: '공개', issueType: selectedType.value,
    odometer: f.odometer || '0', title: f.title.trim(), summary: f.body.trim(), body: f.body.trim(), comments: 0, likes: 0, publishedAt: new Date().toISOString(),
    brandLogo: '../%61ssets/vehicle-catalog/logos/logo_hyundai.png', thumbnail: '../%61ssets/cars/seoul-autogallery-v01/sag-01-1.webp',
  }
  const saved = localRows(); saved.unshift(local)
  try { localStorage.setItem(storageKey, JSON.stringify(saved)) } catch { /* 정적 판과 같이 저장 실패는 무시 */ }
  success.value = true
}

function applyMode(load = false) {
  const communityHeader = q.value.header === 'community' ? ' communityTitleHeader' : ''
  setPhoneClass(props.phoneClasses, 'phone autohomeComplaintMode' + communityHeader, load)
  if (view.value === 'write') props.phoneClasses.add('autohomeComplaintWriter')
  else if (view.value) props.phoneClasses.add('autohomeComplaintDetail')
  props.listClass.value = 'list ahc'
}
watch(() => JSON.stringify(q.value), () => applyMode(true), { immediate: true })
watch(() => page.renderSeq.value, () => applyMode(false))
watch(view, (v) => {
  success.value = false
  if (v && v !== 'write') { comments.value = readJson<Row[]>(commentKey + '.' + v, []) || []; loadedLocal.value = comments.value.length; commentInput.value = ''; savedOn.value = likeOn.value = false }
  if (v === 'write' && !catalog.value) {
    fetch(siteAsset('data/vehicle-catalog/cars-index-v1.json')).then(r => r.json()).then((data: Catalog) => { catalog.value = data }).catch(() => { catalogFailed.value = true })
  }
  window.scrollTo(0, 0)
}, { immediate: true })
</script>

<template>
  <!-- 등록 완료 -->
  <section v-if="view === 'write' && success" class="ahc-success"><img :src="ic('check')" alt=""><h1>공개 등록됐습니다</h1><p>같은 사례의 제보와 해결 경험을 댓글로 모을 수 있습니다.<br>개인정보와 차량번호는 공개하지 마세요.</p><button type="button" @click="tick++; go(listUrl())">목록으로</button></section>
  <!-- 등록 -->
  <main v-else-if="view === 'write'" class="ahc-writer">
    <header class="ahc-bar"><button type="button" data-back @click="go(listUrl())"><img :src="ic('back')" alt="뒤로"></button><strong>불만 등록</strong><span /></header>
    <form class="ahc-write-form" novalidate @submit.prevent="submit">
      <section class="ahc-section"><h2>차량 구분</h2><p class="ahc-guide">판매·수입 구조에 따라 공개할 이해관계자 항목이 달라집니다.</p><div class="ahc-typechips ahc-kindchips"><button v-for="k in kinds" :key="k[0]" type="button" :data-kind="k[0]" :class="{ on: selectedKind === k[0] }" @click="chooseKind(k[0])">{{ k[1] }}</button></div></section>
      <section class="ahc-section"><h2>제조사·모델</h2><div class="ahc-grid"><label class="ahc-field"><span>제조사 *</span><select v-model="f.make" name="make" @change="onMake"><option value="">제조사 선택</option><option v-for="m in makes" :key="m.id" :value="m.id">{{ m.name }}</option><option v-if="catalogFailed" value="manual">직접 입력</option></select></label><label class="ahc-field"><span>모델 *</span><select v-model="f.model" name="model" :disabled="!models.length" @change="onModel"><option value="">모델 선택</option><option v-for="m in models" :key="m.id" :value="m.id">{{ m.name }}</option></select></label></div><label class="ahc-field"><span>세부 모델</span><select v-model="f.generation" name="generation" :disabled="!generations.length"><option value="">세부 모델 선택</option><option v-for="g in generations" :key="g.id" :value="g.id">{{ g.name }}</option></select></label></section>
      <section class="ahc-section ahc-party-fields"><h2>관련 업체</h2><div data-party="domestic-new" :hidden="selectedKind !== 'domestic-new'"><label class="ahc-field"><span>신차 딜러사 *</span><input v-model="f.domesticDealer" name="domesticDealer" placeholder="예: ○○자동차"></label><label class="ahc-field"><span>판매·정비 지점 *</span><input v-model="f.domesticBranch" name="domesticBranch" placeholder="예: 강남 전시장·서비스센터"></label></div><div data-party="official-import" :hidden="selectedKind !== 'official-import'"><label class="ahc-field"><span>공식 수입사 *</span><input v-model="f.officialImporter" name="officialImporter" list="ahc-importer-options" placeholder="공식 수입사 선택 또는 직접 입력"><datalist id="ahc-importer-options"><option v-for="v in (directory && directory.importers) || []" :key="v" :value="v" /></datalist></label><label class="ahc-field"><span>수입차 딜러사 *</span><input v-model="f.importDealer" name="importDealer" list="ahc-dealer-options" placeholder="딜러사 선택 또는 직접 입력"><datalist id="ahc-dealer-options"><option v-for="v in (directory && directory.dealers) || []" :key="v" :value="v" /></datalist></label><label class="ahc-field"><span>판매·정비 지점 *</span><input v-model="f.importBranch" name="importBranch" list="ahc-branch-options" placeholder="지점명 직접 입력"><datalist id="ahc-branch-options"><option v-for="v in (directory && directory.branches) || []" :key="v" :value="v" /></datalist></label><p class="ahc-directory-note" data-directory-note>{{ directoryNote }}</p></div><div data-party="parallel-import" :hidden="selectedKind !== 'parallel-import'"><label class="ahc-field"><span>병행수입 업체 *</span><input v-model="f.parallelImporter" name="parallelImporter" placeholder="사업자명"></label><label class="ahc-field"><span>판매 업체·지점 *</span><input v-model="f.parallelDealer" name="parallelDealer" placeholder="판매 업체 또는 지점"></label></div><div data-party="used" :hidden="selectedKind !== 'used'"><label class="ahc-field"><span>판매 상사 *</span><input v-model="f.usedDealer" name="usedDealer" placeholder="자동차매매 상사명"></label><label class="ahc-field"><span>판매자·담당자</span><input v-model="f.usedSeller" name="usedSeller" placeholder="이름 또는 직책"></label></div><p class="ahc-notice">공식 접수나 업체 통지가 아닌 공개 제보를 위한 식별 정보입니다.</p></section>
      <section class="ahc-section"><h2>문제 유형</h2><div class="ahc-typechips"><button v-for="t in issueTypes" :key="t" type="button" :data-type="t" :class="{ on: selectedType === t }" @click="selectedType = t">{{ t }}</button></div><label class="ahc-field"><span>증상 발생 주행거리</span><input v-model="f.odometer" name="odometer" inputmode="numeric" placeholder="예: 35000"></label></section>
      <section class="ahc-section"><h2>내용 작성</h2><label class="ahc-field"><span>제목 *</span><input v-model="f.title" name="title" maxlength="60" placeholder="무슨 문제가 있었는지 한 문장으로 적어주세요"></label><label class="ahc-field"><span>상세 내용 *</span><textarea v-model="f.body" name="body" maxlength="3000" placeholder="발생 상황, 재현 조건, 업체 안내, 현재 상태를 사실 중심으로 적어주세요" /></label><button class="ahc-upload" type="button" @click="uploadClicked = true"><template v-if="uploadClicked">사진 선택 기능은 프로토타입에서 미리보기로 제공됩니다</template><template v-else><img :src="ic('photo')" alt="">사진·영상 추가 (최대 6개)</template></button><label class="ahc-field"><span>콘텐츠 고지</span><select v-model="f.statement" name="statement"><option>개인 의견이며 참고용입니다</option><option>AI 생성 콘텐츠 포함</option><option>광고·마케팅 정보 포함</option><option>재게시 콘텐츠</option><option>위험 행동 포함</option></select></label><p :class="['ahc-error', { show: errorShow }]" role="alert">{{ errorText }}</p></section>
      <footer class="ahc-submit"><button type="submit">공개 등록</button></footer>
    </form>
  </main>
  <!-- 상세 -->
  <article v-else-if="row" class="ahc-detail">
    <header class="ahc-bar"><button type="button" data-back @click="go(listUrl())"><img :src="ic('back')" alt="뒤로"></button><strong>불만 상세</strong><button type="button" data-share @click="share"><img :src="ic('share')" alt="공유"></button></header>
    <div class="ahc-user"><img class="ahc-avatar" :src="logo(row)" :alt="row.brand + ' 로고'"><span><b>{{ row.author || '보배드림 회원' }}<template v-if="row.verified">{{ ' ' }}<i><img :src="ic('check')" alt="">실차주</i></template></b><small>{{ row.brand + ' ' + row.model + ' · ' + (row.city || '지역 미입력') }}</small></span><em>{{ row.publicLabel || '공개' }}</em></div>
    <section class="ahc-detail-title"><h1>{{ row.title }}</h1><div class="ahc-chips"><span class="ahc-chip">{{ row.issueType }}</span><span class="ahc-chip">{{ row.trim }}</span><span class="ahc-chip">{{ Number(row.odometer || 0).toLocaleString() }}km</span></div></section>
    <section class="ahc-parties"><h2>관련 차량·이해관계자</h2><dl><div v-for="v in partyRows(row)" :key="v[0]" class="ahc-party-row"><dt>{{ v[0] }}</dt><dd>{{ v[1] }}</dd></div></dl><p>이 정보는 이용자가 입력한 공개 제보이며 공식 접수·통지 상태를 의미하지 않습니다.</p></section>
    <section class="ahc-body"><p>{{ row.body || row.summary }}</p><div class="ahc-media"><img :src="picture(row)" :alt="row.brand + ' ' + row.model"></div></section>
    <section class="ahc-comments"><h3>댓글 {{ Number(row.comments || 0) + loadedLocal }}</h3><div data-comments><article v-for="(c, i) in comments.concat(fixedComments)" :key="i" class="ahc-comment"><img :src="logo(row)" alt=""><div><b>{{ c.author }}</b><p>{{ c.body }}</p></div></article></div></section>
    <footer class="ahc-actions"><input v-model="commentInput" aria-label="댓글 입력" maxlength="300" placeholder="댓글을 입력하세요"><button type="button" data-comment @click="addComment"><img :src="ic('chat')" alt="등록"></button><button type="button" data-save :class="{ on: savedOn }" @click="savedOn = !savedOn"><img :src="ic('bookmark')" alt="저장"></button><button type="button" data-like :class="{ on: likeOn }" @click="likeOn = !likeOn"><img :src="ic('like')" alt="도움돼요"></button></footer>
  </article>
  <!-- 목록 -->
  <section v-else-if="!view" class="ahc-list">
    <header class="ahc-bar"><button type="button" data-back @click="go(listUrl())"><img :src="ic('back')" alt="뒤로"></button><strong>차량 결함·불만</strong><span /></header>
    <div class="ahc-intro"><h1>차량 결함·불만</h1><p>차량 결함과 판매·정비 경험을 공개하고 같은 사례의 제보와 해결 경험을 모읍니다.</p></div>
    <nav class="ahc-tabs" aria-label="게시물 정렬"><button class="on">최신</button><button>공감순</button><button>댓글순</button><button>해결 후기</button></nav>
    <article v-for="r in listRows" :key="String(r.complaintId || r.id)" class="ahc-card" :data-id="r.complaintId || r.id">
      <div class="ahc-user"><img class="ahc-avatar" :src="logo(r)" :alt="r.brand + ' 로고'"><span><b>{{ r.author || '보배드림 회원' }}<template v-if="r.verified">{{ ' ' }}<i><img :src="ic('check')" alt="">실차주</i></template></b><small>{{ r.brand + ' ' + r.model + ' · ' + (r.city || '지역 미입력') }}</small></span><em>{{ r.publicLabel || '공개' }}</em></div>
      <button class="ahc-card-main" type="button" @click="go(detailUrl(String(r.complaintId || r.id)))"><h2>{{ r.title }}</h2><p>{{ r.summary || r.body }}</p><div class="ahc-media"><img :src="picture(r)" :alt="r.brand + ' ' + r.model"></div><footer class="ahc-foot"><span><img :src="ic('chat')" alt="">{{ Number(r.comments || 0) }}</span><span><img :src="ic('like')" alt="">{{ Number(r.likes || 0) }}</span><time>{{ String(r.publishedAt || '').slice(0, 10) }}</time></footer></button>
    </article>
    <button class="ahc-fab" type="button" @click="go(writerUrl())"><img :src="ic('write')" alt="">불만 등록</button>
  </section>
</template>
