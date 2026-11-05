<script setup lang="ts">
// 처즈왕 등록(?czw=write): board.js renderWriter + enhancements.js enhanceWriter 를 마친 뒤의 모양
// (필수 안내 · 나이 입력 · 성별 2개 · 자동차등록증 업로드 · 사진/영상 2칸 · 문구 · 구역 아이콘 · 나이 오류 문구)
import { boardSrc, readJson, type Row } from '~/composables/boards/boardUtil'
import { czwIcons, czwRoute, czwStorageKey } from '~/composables/boards/chezhiwang'

const props = defineProps<{ q: Record<string, string> }>()
const emit = defineEmits<{ go: [p: Record<string, string>] }>()
const ic = (n: string) => boardSrc(czwIcons[n])
const ca = (p: string) => communityAsset(p)
const go = (p: Record<string, string>) => emit('go', p)
const groups: Record<string, string[]> = {
  quality: ['엔진·모터', '변속기', '클러치', '조향 장치', '제동 장치', '타이어', '차축·서스펜션', '차체 부속·전장'],
  service: ['서비스 태도', '정비 기술', '서비스 요금', '약속 불이행', '판매 문제', '부품 분쟁', '서비스 절차 미흡'],
  other: ['리콜 문제', '제품 문제', '지원 체계 문제', '기타 문제'],
}
const groupTitles: Array<[string, string]> = [['quality', '품질 세부 항목'], ['service', '서비스 세부 항목'], ['other', '기타 세부 항목']]
const motorcycles: Record<string, string[]> = { 'BMW 모토라드': ['R 1300 GS', 'S 1000 RR', 'CE 04'], '혼다 모터사이클': ['골드윙', '포르자 350', 'CBR1000RR-R'], 야마하: ['TMAX', 'MT-09', 'YZF-R1'], 두카티: ['멀티스트라다 V4', '파니갈레 V4', '몬스터'] }
const choices: Record<string, Array<[string, string]>> = {
  gender: [['남성', '남성'], ['여성', '여성']], // enhancements: 「선택 안 함」 제거
  vehicle: [['car', '자동차'], ['motorcycle', '바이크']],
  accident: [['없음', '없음'], ['있음', '있음']],
  injury: [['없음', '없음'], ['있음', '있음']],
  type: [['quality', '품질'], ['service', '서비스'], ['other', '기타'], ['comprehensive', '종합']],
}
const state = reactive<Record<string, string>>({ gender: '', vehicle: '', accident: '', injury: '', type: '' })
const f = reactive<Record<string, string>>({ name: '', age: '', phone: '', email: '', make: '', model: '', generation: '', vin: '', engine: '', plate: '', purchaseDate: '', problemDate: '', odometer: '', region: '', dealer: '', saleType: '국내 신차', title: '', short: '', body: '' })
const checked = reactive<Record<string, boolean>>({})
const errors = reactive<Record<string, string>>({})
const subtypeError = ref('')
const summary = ref('')
const success = ref(false)
const formEl = ref<HTMLFormElement | null>(null)
interface Catalog { manufacturers: Row[]; modelGroups: Row[]; generations: Row[] }
const carCatalog = ref<Catalog | null>(null)
fetch(siteAsset('data/vehicle-catalog/cars-index-v1.json')).then(r => r.json()).then((data: Catalog) => { carCatalog.value = data }).catch(() => { /* 정적 판도 실패하면 그대로 둔다 */ })

const makes = computed<Array<{ id: string; name: string }>>(() => (state.vehicle === 'motorcycle' ? Object.keys(motorcycles).map(v => ({ id: v, name: v }))
  : state.vehicle === 'car' && carCatalog.value ? carCatalog.value.manufacturers.map(v => ({ id: String(v.id), name: v.name })) : []))
const models = computed<Array<{ id: string; name: string }>>(() => (!f.make ? [] : state.vehicle === 'motorcycle' ? (motorcycles[f.make] || []).map(v => ({ id: v, name: v }))
  : carCatalog.value ? carCatalog.value.modelGroups.filter(v => v.makeId === f.make).map(v => ({ id: String(v.id), name: v.name })) : []))
const generations = computed<Array<{ id: string; name: string }>>(() => (!f.model ? [] : state.vehicle === 'motorcycle' ? [{ id: f.model + '-current', name: '현행 모델' }]
  : carCatalog.value ? carCatalog.value.generations.filter(v => v.groupId === f.model).map(v => ({ id: String(v.id), name: v.name })) : []))
function pick(group: string, value: string) {
  state[group] = value
  if (group === 'vehicle') { f.make = ''; f.model = ''; f.generation = '' }
}
const groupHidden = (key: string) => state.type !== 'comprehensive' && state.type !== key
function onMake() { f.model = ''; f.generation = '' }
function onModel() { f.generation = '' }

// enhancements: 자동차등록증 · 사진/영상
const isMotorcycle = computed(() => state.vehicle === 'motorcycle')
const exampleOpen = ref(false)
const regReady = ref(false)
const regLabel = ref('자동차등록증 촬영·업로드')
watch(isMotorcycle, (m) => { regLabel.value = m ? '사용신고필증 촬영·업로드' : '자동차등록증 촬영·업로드' })
function regUpload() { regReady.value = true; regLabel.value = '자동차등록증 선택 화면 확인 완료' }
const imageReady = ref(false)
const videoReady = ref(false)

const required: Array<[string, string]> = [['name', '이름을 입력해 주세요'], ['age', '연령대를 선택해 주세요'], ['phone', '휴대전화를 입력해 주세요'], ['make', '제조사를 선택해 주세요'], ['model', '모델을 선택해 주세요'], ['generation', '세부 모델을 선택해 주세요'], ['vin', '차대번호를 입력해 주세요'], ['engine', '엔진·모터 번호를 입력해 주세요'], ['plate', '차량번호를 입력해 주세요'], ['purchaseDate', '구매일을 선택해 주세요'], ['problemDate', '문제 발생일을 선택해 주세요'], ['odometer', '주행거리를 입력해 주세요'], ['region', '지역을 입력해 주세요'], ['dealer', '업체명을 입력해 주세요'], ['title', '제목을 입력해 주세요'], ['short', '짧은 설명을 입력해 주세요'], ['body', '상세 내용을 입력해 주세요']]
const selectedSubtypes = () => groupTitles.filter(g => !groupHidden(g[0])).flatMap(g => groups[g[0]]!.filter(v => checked[g[0] + '|' + v]))
function validate() {
  Object.keys(errors).forEach(k => delete errors[k])
  subtypeError.value = ''
  const missing: string[] = []
  // 정적 판 errorFor 는 값이 있어도 칸마다 오류 문구를 띄운다(그대로 둔다)
  required.forEach(([name, message]) => { errors[name] = message; if (!String(f[name] || '').trim()) missing.push(name) })
  ;['gender', 'vehicle', 'accident', 'injury', 'type'].forEach((k) => { if (!state[k]) missing.push(k) })
  const need = state.type === 'comprehensive' ? 2 : 1
  if (selectedSubtypes().length < need) { subtypeError.value = state.type === 'comprehensive' ? '종합 불만은 서로 다른 세부 항목을 2개 이상 선택해 주세요.' : '세부 항목을 선택해 주세요.'; missing.push('subtypes') }
  summary.value = missing.length ? '필수 항목을 확인해 주세요. 첫 번째 누락 항목으로 이동했습니다.' : ''
  if (missing.length) nextTick(() => { formEl.value?.querySelector('.czw-inline-error.show')?.scrollIntoView({ behavior: 'smooth', block: 'center' }) })
  return !missing.length
}
function submit() {
  const ok = validate()
  if (errors.age) errors.age = '나이를 입력해 주세요' // enhancements strengthenValidationCopy
  if (!ok) return
  const nameOf = (list: Array<{ id: string; name: string }>, id: string) => list.find(v => v.id === id)?.name || ''
  const typeLabel = ({ quality: '품질', service: '서비스', other: '기타', comprehensive: '종합' } as Record<string, string>)[state.type!]!
  const stamp = Date.now()
  const local = {
    id: 'local-' + stamp, complaintId: 'local-' + stamp, category: typeLabel, issueType: typeLabel, subtypes: selectedSubtypes().join(' · '),
    title: f.title!.trim(), summary: f.short!.trim(), body: f.body!.trim(), author: f.name!.trim(), publishedAt: new Date().toISOString(), views: 0, comments: 0, likes: 0,
    brand: nameOf(makes.value, f.make!), manufacturer: nameOf(makes.value, f.make!), model: nameOf(models.value, f.model!), trim: nameOf(generations.value, f.generation!),
    vehicleType: f.saleType, brandLogo: '../%61ssets/vehicle-catalog/logos/logo_hyundai.png', thumbnail: '../%61ssets/cars/seoul-autogallery-v01/sag-01-1.webp',
    city: f.region!.trim(), odometer: f.odometer, purchaseDate: f.purchaseDate, problemDate: f.problemDate, accident: state.accident, injury: state.injury,
    dealerGroup: f.dealer!.trim(), dealerBranch: f.region!.trim(), publicLabel: '공개', verified: true,
  }
  const saved = readJson<Row[]>(czwStorageKey, []) || []
  saved.unshift(local)
  localStorage.setItem(czwStorageKey, JSON.stringify(saved))
  success.value = true
}
const sectionIcons = ['assets/reddit-ui/icon-user-outline.svg', 'assets/reddit-ui/icon-location-outline.svg', 'assets/reddit-ui/icon-marketplace-outline.svg', 'assets/reddit-ui/icon-camera-outline.svg', 'assets/reddit-ui/write.svg']
</script>

<template>
  <section v-if="success" class="czw-success"><img :src="ic('check')" alt=""><h1>공개 등록됐습니다</h1><p>같은 사례의 제보와 해결 경험을 댓글로 모을 수 있습니다.<br>민감 정보는 공개 글에 표시하지 않았습니다.</p><button type="button" @click="go(czwRoute(q, ''))">목록으로</button></section>
  <main v-else class="czw-writer">
    <header class="czw-bar"><button type="button" data-back @click="go(czwRoute(q, ''))"><img :src="ic('back')" alt="뒤로"></button><strong>불만 등록</strong><button class="czw-submit-top" type="button" data-submit-top @click="formEl?.requestSubmit()">등록</button></header>
    <form ref="formEl" class="czw-form" novalidate data-tenx-enhanced="true" @submit.prevent="submit">
      <p class="czw-required-note"><b>*</b> 필수 항목입니다. 사실 확인을 위해 정확히 입력해 주세요. 공개 후에는 차량·사건 정보 수정이 제한될 수 있습니다.</p>
      <section class="czw-section"><h2><img class="czw-section-icon" :src="ca(sectionIcons[0]!)" alt="">작성자 정보</h2><p class="czw-guide">입력한 연락 정보는 공개되지 않으며 사실 확인에만 사용됩니다.</p><div class="czw-grid"><label class="czw-field"><span>이름 *</span><input v-model="f.name" name="name"><p :class="['czw-inline-error', { show: errors.name }]">{{ errors.name }}</p></label><label class="czw-field"><span>나이 *</span><input v-model="f.age" name="age" type="text" inputmode="numeric" maxlength="3" autocomplete="off" placeholder="나이 입력"><p :class="['czw-inline-error', { show: errors.age }]">{{ errors.age }}</p></label></div><div class="czw-choice" data-choice="gender"><button v-for="v in choices.gender" :key="v[0]" type="button" :data-value="v[0]" :class="{ on: state.gender === v[0] }" @click="pick('gender', v[0])">{{ v[1] }}</button></div><label class="czw-field"><span>휴대전화 *</span><input v-model="f.phone" name="phone" inputmode="tel" placeholder="공개되지 않습니다"><p :class="['czw-inline-error', { show: errors.phone }]">{{ errors.phone }}</p></label><label class="czw-field"><span>이메일</span><input v-model="f.email" name="email" type="email"></label></section>
      <section class="czw-section"><h2><img class="czw-section-icon" :src="ca(sectionIcons[1]!)" alt="">차량 정보</h2><p class="czw-guide">불만을 등록할 차량 정보를 사실대로 입력해 주세요.</p><div class="czw-choice" data-choice="vehicle"><button v-for="v in choices.vehicle" :key="v[0]" type="button" :data-value="v[0]" :class="{ on: state.vehicle === v[0] }" @click="pick('vehicle', v[0])">{{ v[1] }}</button></div><div class="czw-grid"><label class="czw-field"><span>제조사 *</span><select v-model="f.make" name="make" @change="onMake"><option value="">제조사 선택</option><option v-for="m in makes" :key="m.id" :value="m.id">{{ m.name }}</option></select><p :class="['czw-inline-error', { show: errors.make }]">{{ errors.make }}</p></label><label class="czw-field"><span>모델 *</span><select v-model="f.model" name="model" :disabled="!models.length" @change="onModel"><option value="">모델 선택</option><option v-for="m in models" :key="m.id" :value="m.id">{{ m.name }}</option></select><p :class="['czw-inline-error', { show: errors.model }]">{{ errors.model }}</p></label></div><label class="czw-field"><span>세부 모델 *</span><select v-model="f.generation" name="generation" :disabled="!generations.length"><option value="">세부 모델 선택</option><option v-for="g in generations" :key="g.id" :value="g.id">{{ g.name }}</option></select><p :class="['czw-inline-error', { show: errors.generation }]">{{ errors.generation }}</p></label><section class="czw-registration-upload"><div class="czw-registration-head"><strong>{{ isMotorcycle ? '이륜자동차 사용신고필증으로 정보 입력' : '자동차등록증으로 차량 정보 입력' }}</strong><button type="button" data-registration-example @click="exampleOpen = !exampleOpen">{{ exampleOpen ? '예시 닫기' : '예시 보기' }}</button></div><button type="button" :class="['czw-registration-button', { 'is-ready': regReady }]" data-registration-upload @click="regUpload"><img :src="ca('assets/reddit-ui/write.svg')" alt=""><span>{{ regLabel }}<small>사진은 공개되지 않으며 차량 정보 확인에만 사용됩니다.</small></span></button><p class="czw-registration-example" :hidden="!exampleOpen">소유자 이름과 주민등록번호 뒷자리를 가린 뒤, 문서 전체가 보이게 촬영해 주세요.</p></section><div class="czw-grid"><label class="czw-field"><span>차대번호 *</span><input v-model="f.vin" name="vin" placeholder="공개되지 않습니다"><p :class="['czw-inline-error', { show: errors.vin }]">{{ errors.vin }}</p></label><label class="czw-field"><span>엔진·모터 번호 *</span><input v-model="f.engine" name="engine" placeholder="공개되지 않습니다"><p :class="['czw-inline-error', { show: errors.engine }]">{{ errors.engine }}</p></label></div><label class="czw-field"><span>차량번호 *</span><input v-model="f.plate" name="plate" placeholder="공개되지 않습니다"><p :class="['czw-inline-error', { show: errors.plate }]">{{ errors.plate }}</p></label><div class="czw-grid"><label class="czw-field"><span>구매일 *</span><input v-model="f.purchaseDate" name="purchaseDate" type="date"><p :class="['czw-inline-error', { show: errors.purchaseDate }]">{{ errors.purchaseDate }}</p></label><label class="czw-field"><span>문제 발생일 *</span><input v-model="f.problemDate" name="problemDate" type="date"><p :class="['czw-inline-error', { show: errors.problemDate }]">{{ errors.problemDate }}</p></label></div><p class="czw-guide" style="margin-top:14px">사고 여부 *</p><div class="czw-choice" data-choice="accident"><button v-for="v in choices.accident" :key="v[0]" type="button" :data-value="v[0]" :class="{ on: state.accident === v[0] }" @click="pick('accident', v[0])">{{ v[1] }}</button></div><p class="czw-guide" style="margin-top:14px">인명 피해 *</p><div class="czw-choice" data-choice="injury"><button v-for="v in choices.injury" :key="v[0]" type="button" :data-value="v[0]" :class="{ on: state.injury === v[0] }" @click="pick('injury', v[0])">{{ v[1] }}</button></div><label class="czw-field"><span>발생 주행거리 *</span><input v-model="f.odometer" name="odometer" inputmode="numeric" placeholder="km"><p :class="['czw-inline-error', { show: errors.odometer }]">{{ errors.odometer }}</p></label></section>
      <section class="czw-section"><h2><img class="czw-section-icon" :src="ca(sectionIcons[2]!)" alt="">판매·정비 업체</h2><div class="czw-grid"><label class="czw-field"><span>지역 *</span><input v-model="f.region" name="region" placeholder="시·도 / 시·군·구"><p :class="['czw-inline-error', { show: errors.region }]">{{ errors.region }}</p></label><label class="czw-field"><span>업체명 *</span><input v-model="f.dealer" name="dealer" placeholder="계약서의 사업자명"><p :class="['czw-inline-error', { show: errors.dealer }]">{{ errors.dealer }}</p></label></div><label class="czw-field"><span>수입사·판매 구조</span><select v-model="f.saleType" name="saleType"><option>국내 신차</option><option>공식 수입차</option><option>병행수입차</option><option>중고차</option></select></label></section>
      <section class="czw-section"><h2><img class="czw-section-icon" :src="ca(sectionIcons[3]!)" alt="">사진·영상</h2><p class="czw-guide">사진 최대 6장(장당 5MB), MP4 영상 최대 50MB</p><div class="czw-media-grid"><button type="button" data-image-upload :class="{ 'is-ready': imageReady }" @click="imageReady = !imageReady"><img :src="ca('assets/reddit-ui/icon-camera-outline.svg')" alt=""><span>{{ imageReady ? '사진 선택 화면 확인 완료' : '사진 추가' }}<small>최대 6장 · 장당 5MB</small></span></button><button type="button" data-video-upload :class="{ 'is-ready': videoReady }" @click="videoReady = !videoReady"><img :src="ca('assets/reddit-ui/video.svg')" alt=""><span>{{ videoReady ? '영상 선택 화면 확인 완료' : '영상 추가' }}<small>MP4 · 최대 50MB</small></span></button></div></section>
      <section class="czw-section"><h2><img class="czw-section-icon" :src="ca(sectionIcons[4]!)" alt="">불만 내용</h2><p class="czw-guide">증상, 재현 조건, 판매·정비 업체와의 소통 내용, 평소 정비 이력을 사실대로 자세히 적어 주세요.</p><div class="czw-choice" data-choice="type"><button v-for="v in choices.type" :key="v[0]" type="button" :data-value="v[0]" :class="{ on: state.type === v[0] }" @click="pick('type', v[0])">{{ v[1] }}</button></div><div v-for="g in groupTitles" :key="g[0]" class="czw-dynamic" :data-group="g[0]" :hidden="groupHidden(g[0])"><h3>{{ g[1] }}</h3><div class="czw-checks"><label v-for="v in groups[g[0]]" :key="v"><input v-model="checked[g[0] + '|' + v]" type="checkbox" :value="v">{{ v }}</label></div></div><p :class="['czw-inline-error', { show: subtypeError }]" data-subtype-error>{{ subtypeError }}</p><label class="czw-field"><span>제목 * <b>60자</b></span><input v-model="f.title" name="title" maxlength="60" placeholder="문제를 한 문장으로 적어주세요"><p :class="['czw-inline-error', { show: errors.title }]">{{ errors.title }}</p></label><label class="czw-field"><span>짧은 설명 * <b>24자</b></span><input v-model="f.short" name="short" maxlength="24" placeholder="핵심 증상 요약"><p :class="['czw-inline-error', { show: errors.short }]">{{ errors.short }}</p></label><label class="czw-field"><span>상세 내용 *</span><textarea v-model="f.body" name="body" maxlength="3000" placeholder="발생 상황, 재현 조건, 업체 안내와 현재 상태를 사실 중심으로 적어주세요" /><p :class="['czw-inline-error', { show: errors.body }]">{{ errors.body }}</p></label><p class="czw-privacy">공식 접수·통지가 아닌 공개 공론화 게시판입니다. 개인정보, 전체 차량번호, 차대번호는 공개 글에 표시하지 않습니다.</p><p :class="['czw-error', { show: summary }]" role="alert">{{ summary }}</p></section>
      <footer class="czw-submit"><button type="submit">공개 등록</button></footer>
    </form>
  </main>
</template>
