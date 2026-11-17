<script setup lang="ts">
import { MOCK_CHANNELS, MOCK_METRICS, MOCK_ONLY_NOTICE, MOCK_PHOTOS, MOCK_VEHICLES, NAV_ITEMS } from '~/data/mock'
import type { RenderStatus, Vehicle } from '~/types/shortform'

const {
  activeScreen,
  selectedTemplate,
  duration,
  renderStatus,
  renderProgress,
  approvalStatus,
  factChecks,
  scheduledAt,
  toast,
  selectedVehicle,
  allFactsChecked,
  publishAllowed,
  go,
  selectVehicle,
  advanceRender,
  restartRender,
  approve,
  runMockPublish
} = useShortformKit()

const search = ref('')
const inventoryFilter = ref<'all' | 'no_video' | 'attention'>('all')

const screenMeta = computed(() => NAV_ITEMS.find((item) => item.id === activeScreen.value) ?? NAV_ITEMS[0]!)
const filteredVehicles = computed(() => MOCK_VEHICLES.filter((vehicle) => {
  const matchesQuery = `${vehicle.name} ${vehicle.trim} ${vehicle.listingId}`.toLowerCase().includes(search.value.toLowerCase())
  const matchesFilter = inventoryFilter.value === 'all'
    || (inventoryFilter.value === 'no_video' && vehicle.videoStatus === 'none')
    || (inventoryFilter.value === 'attention' && ['failed', 'review'].includes(vehicle.videoStatus))
  return matchesQuery && matchesFilter
}))

const renderStages: Array<{ id: RenderStatus; label: string; description: string }> = [
  { id: 'queued', label: '대기', description: '중복 작업과 원본 버전을 확인합니다' },
  { id: 'analyzing', label: '사진 분석', description: '구도·흐림·번호판을 점검합니다' },
  { id: 'rendering', label: '영상 렌더', description: '1080×1920 MP4를 만듭니다' },
  { id: 'completed', label: '완료', description: '사람 검수 대기열로 이동합니다' }
]

const renderStageIndex = computed(() => renderStages.findIndex((stage) => stage.id === renderStatus.value))
const factRows = [
  { key: 'source', label: '매물 DB 원본 버전 일치', detail: `source v${selectedVehicle.value.sourceVersion}` },
  { key: 'price', label: '가격 일치', detail: formatWon(selectedVehicle.value.priceWon) },
  { key: 'mileage', label: '연식·주행거리 일치', detail: `${selectedVehicle.value.year}년 · ${formatKm(selectedVehicle.value.mileageKm)}` },
  { key: 'options', label: '옵션은 DB 값만 사용', detail: 'AI 추정값 없음' },
  { key: 'privacy', label: '번호판·개인정보 마스킹', detail: '1개 사진 확인 필요' },
  { key: 'defects', label: '하자 장면 숨김 없음', detail: '원본 장면 유지' }
]

const templates = [
  { id: 'clean' as const, name: '클린 소개', copy: '차량과 사실 정보에 집중', accent: '#2958e6' },
  { id: 'dynamic' as const, name: '다이내믹 컷', copy: '짧은 전환과 리듬 강조', accent: '#ee3d6e' },
  { id: 'spec' as const, name: '스펙 포커스', copy: '가격·연식·주행거리 강조', accent: '#168966' }
]

const publishRows = [
  { date: '11월 3일 19:30', vehicle: '제네시스 G80', channel: 'YouTube Shorts', status: '예약 차단', tone: 'warning' as const, reason: 'OAuth 미연결' },
  { date: '11월 3일 19:30', vehicle: '제네시스 G80', channel: 'Instagram Reels', status: '예약 차단', tone: 'warning' as const, reason: 'OAuth 미연결' },
  { date: '11월 3일 19:30', vehicle: '제네시스 G80', channel: 'TikTok', status: '승인 초안', tone: 'info' as const, reason: '직접 게시 안 함' },
  { date: '10월 31일 14:10', vehicle: '현대 그랜저', channel: 'YouTube Shorts', status: '성공', tone: 'good' as const, reason: 'MOCK 이력' },
  { date: '10월 30일 18:20', vehicle: '벤츠 GLE 450', channel: 'Instagram Reels', status: '실패', tone: 'danger' as const, reason: '권한 만료' }
]

function formatWon(value: number) {
  return `${Math.round(value / 10000).toLocaleString('ko-KR')}만원`
}

function formatKm(value: number) {
  return `${value.toLocaleString('ko-KR')}km`
}

function vehicleTone(vehicle: Vehicle) {
  if (vehicle.name.includes('포르쉐')) return 'red' as const
  if (vehicle.color.includes('화이트')) return 'light' as const
  if (vehicle.color.includes('블랙')) return 'dark' as const
  return 'silver' as const
}

function vehicleVideoLabel(status: Vehicle['videoStatus']) {
  return { none: '영상 없음', ready: '영상 보유', generating: '생성 중', review: '승인 대기', failed: '생성 실패' }[status]
}

function vehicleVideoTone(status: Vehicle['videoStatus']) {
  return ({ none: 'neutral', ready: 'good', generating: 'info', review: 'warning', failed: 'danger' } as const)[status]
}

function selectAndContinue(id: string) {
  selectVehicle(id)
}

watch(toast, (value) => {
  if (!value || !import.meta.client) return
  window.setTimeout(() => { toast.value = '' }, 3600)
})
</script>

<template>
  <div class="kit-layout">
    <aside class="side-nav">
      <div class="brand-lockup">
        <span class="brand-mark">B</span>
        <div><b>보배드림</b><small>SHORTFORM STUDIO</small></div>
      </div>

      <div class="review-chip"><span />검수용 키트 <b>v0.1</b></div>

      <nav aria-label="주요 화면">
        <button
          v-for="item in NAV_ITEMS"
          :key="item.id"
          type="button"
          :class="{ active: activeScreen === item.id }"
          @click="go(item.id)"
        >
          <BbIcon :name="item.icon" :size="19" />
          <span>{{ item.label }}</span>
        </button>
      </nav>

      <div class="side-safety">
        <BbIcon name="shield" :size="20" />
        <div><b>게시 안전 잠금</b><p>OAuth·API 키가 없어 실제 게시하지 않습니다.</p></div>
      </div>
    </aside>

    <div class="main-column">
      <header class="top-bar">
        <div class="mobile-brand"><span class="brand-mark">B</span><b>숏폼 스튜디오</b></div>
        <div class="top-title"><p>딜러 스튜디오</p><h1>{{ screenMeta.label }}</h1></div>
        <div class="top-actions">
          <span class="mock-pill">{{ MOCK_ONLY_NOTICE }}</span>
          <button type="button" class="icon-button" aria-label="도움말">?</button>
          <button type="button" class="account-button"><span>서울</span><b>김보배</b></button>
        </div>
      </header>

      <div class="mobile-nav" aria-label="모바일 화면 이동">
        <button v-for="item in NAV_ITEMS" :key="item.id" type="button" :class="{ active: activeScreen === item.id }" @click="go(item.id)">
          <BbIcon :name="item.icon" :size="17"/><span>{{ item.short }}</span>
        </button>
      </div>

      <main class="content-wrap">
        <section v-if="activeScreen === 'dashboard'" class="screen-stack">
          <div class="page-heading heading-with-action">
            <div><span class="eyebrow">오늘의 운영 현황</span><h2>실패와 승인 대기부터 처리하세요</h2><p>Autohaus의 단순 주문 흐름에 즉시 렌더·검수·채널별 게시 상태를 추가했습니다.</p></div>
            <button type="button" class="primary-button" @click="go('vehicles')"><BbIcon name="spark" :size="18"/>새 영상 만들기</button>
          </div>

          <div class="metrics-grid">
            <article v-for="metric in MOCK_METRICS" :key="metric.label" class="metric-card" :class="`metric-${metric.tone}`">
              <div><span>{{ metric.label }}</span><b>{{ metric.value }}</b></div><small>{{ metric.delta }}</small>
            </article>
          </div>

          <div class="attention-banner">
            <div class="attention-icon">!</div>
            <div><b>지금 처리할 작업 4건</b><p>번호판 마스킹 1건 · Fact Lock 검수 2건 · 채널 권한 오류 1건</p></div>
            <button type="button" @click="go('review')">검수 대기 열기</button>
          </div>

          <div class="two-column dashboard-columns">
            <section class="panel jobs-panel">
              <div class="panel-head"><div><h3>최근 영상 작업</h3><p>채널 상태를 묶지 않고 각각 추적합니다.</p></div><button type="button" class="text-button" @click="go('publish')">전체 보기</button></div>
              <div class="job-list">
                <article v-for="vehicle in MOCK_VEHICLES.slice(0, 4)" :key="vehicle.id" class="job-row">
                  <VehicleArtwork :type="vehicle.art" :tone="vehicleTone(vehicle)" />
                  <div class="job-main"><b>{{ vehicle.name }} {{ vehicle.trim }}</b><span>{{ vehicle.listingId }} · {{ vehicle.year }}년 · {{ formatKm(vehicle.mileageKm) }}</span></div>
                  <StatusBadge :label="vehicleVideoLabel(vehicle.videoStatus)" :tone="vehicleVideoTone(vehicle.videoStatus)" />
                  <button type="button" class="row-arrow" aria-label="작업 열기" @click="selectVehicle(vehicle.id)">›</button>
                </article>
              </div>
            </section>

            <section class="panel funnel-panel">
              <div class="panel-head"><div><h3>문의 전환 미리보기</h3><p>영상 → 매물 상세 → 문의</p></div><StatusBadge label="수집 중" tone="info"/></div>
              <div class="funnel-bars">
                <div><span>영상 재생</span><i style="--w:100%"/><b>8,420</b></div>
                <div><span>매물 상세</span><i style="--w:52%"/><b>4,378</b></div>
                <div><span>채팅·전화</span><i style="--w:13%"/><b>1,081</b></div>
                <div><span>방문 예약</span><i style="--w:4%"/><b>318</b></div>
              </div>
              <div class="truth-note"><BbIcon name="shield" :size="18"/><p><b>지표 원칙</b> MOCK 데이터입니다. 실제 전환값처럼 오해하지 않도록 상수를 분리했습니다.</p></div>
            </section>
          </div>
        </section>

        <section v-else-if="activeScreen === 'vehicles'" class="screen-stack">
          <div class="page-heading"><span class="eyebrow">1. 매물 DB 원본 선택</span><h2>어떤 차량의 영상을 만들까요?</h2><p>차량번호를 다시 입력하지 않고 보배드림 매물의 검증된 정보를 그대로 사용합니다.</p></div>
          <div class="inventory-toolbar">
            <label class="search-field"><BbIcon name="search" :size="19"/><input v-model="search" type="search" placeholder="차명·매물번호로 검색"/></label>
            <div class="filter-tabs">
              <button v-for="item in [{id:'all',label:'전체 128'},{id:'no_video',label:'영상 없음 41'},{id:'attention',label:'확인 필요 15'}]" :key="item.id" type="button" :class="{ active: inventoryFilter === item.id }" @click="inventoryFilter = item.id as typeof inventoryFilter">{{ item.label }}</button>
            </div>
          </div>
          <div class="vehicle-grid">
            <article v-for="vehicle in filteredVehicles" :key="vehicle.id" class="vehicle-card" :class="{ sold: vehicle.status === 'sold' }">
              <VehicleArtwork :type="vehicle.art" :tone="vehicleTone(vehicle)" />
              <div class="vehicle-card-body">
                <div class="vehicle-card-top"><StatusBadge :label="vehicleVideoLabel(vehicle.videoStatus)" :tone="vehicleVideoTone(vehicle.videoStatus)"/><span>{{ vehicle.photoCount }}장</span></div>
                <h3>{{ vehicle.name }}</h3><p>{{ vehicle.trim }}</p>
                <dl><div><dt>연식</dt><dd>{{ vehicle.year }}년</dd></div><div><dt>주행거리</dt><dd>{{ formatKm(vehicle.mileageKm) }}</dd></div><div><dt>가격</dt><dd>{{ formatWon(vehicle.priceWon) }}</dd></div></dl>
                <div v-if="vehicle.status === 'price_changed'" class="inline-warning">가격 변경 · 기존 영상 재검수 필요</div>
                <div v-if="vehicle.status === 'sold'" class="inline-danger">판매완료 · 예약 게시 차단</div>
                <button type="button" class="card-cta" :disabled="vehicle.status === 'sold'" @click="selectAndContinue(vehicle.id)">{{ vehicle.status === 'sold' ? '판매완료' : '이 매물로 제작' }}</button>
              </div>
            </article>
          </div>
        </section>

        <section v-else-if="activeScreen === 'photos'" class="screen-stack">
          <div class="page-heading heading-with-action"><div><span class="eyebrow">2. 사진 품질 게이트</span><h2>좋은 장면을 고르고 위험 요소를 막습니다</h2><p>{{ selectedVehicle.name }} · {{ selectedVehicle.listingId }} · 사진 {{ selectedVehicle.photoCount }}장</p></div><button type="button" class="secondary-button" @click="go('vehicles')">차량 다시 선택</button></div>
          <div class="qa-summary">
            <div><b>6</b><span>사용 가능</span></div><div class="warn"><b>1</b><span>품질 경고</span></div><div class="danger"><b>1</b><span>게시 차단</span></div><p><BbIcon name="shield" :size="20"/>번호판 사진을 해결해야 다음 단계로 안전하게 진행할 수 있습니다.</p>
          </div>
          <div class="photo-grid">
            <article v-for="(photo, index) in MOCK_PHOTOS" :key="photo.id" class="photo-card" :class="`photo-${photo.status}`">
              <VehicleArtwork :type="photo.art" :tone="index % 3 === 1 ? 'silver' : 'dark'"/>
              <span class="shot-number">{{ index + 1 }}</span>
              <div class="photo-info"><div><b>{{ photo.label }}</b><span>{{ photo.angle }}</span></div><strong>{{ photo.score }}</strong></div>
              <p v-if="photo.issue"><span>!</span>{{ photo.issue }}</p>
            </article>
          </div>
          <div class="sticky-actions"><div><b>사진 8장 중 7장 사용 예정</b><span>번호판 마스킹 1건 확인 필요</span></div><button type="button" class="primary-button" @click="go('template')">형식 선택으로</button></div>
        </section>

        <section v-else-if="activeScreen === 'template'" class="screen-stack">
          <div class="page-heading"><span class="eyebrow">3. 영상 형식</span><h2>차량을 바꾸지 않는 고정 템플릿 3종</h2><p>화려한 생성 효과보다 실제 차량과 사실 정보가 잘 보이도록 설계했습니다.</p></div>
          <div class="template-layout">
            <div class="template-options">
              <div class="template-grid">
                <button v-for="template in templates" :key="template.id" type="button" class="template-card" :class="{ selected: selectedTemplate === template.id }" @click="selectedTemplate = template.id">
                  <span class="template-preview" :style="{ '--accent': template.accent }"><i/><i/><i/><b>FACT</b></span>
                  <strong>{{ template.name }}</strong><small>{{ template.copy }}</small><em>{{ selectedTemplate === template.id ? '선택됨' : '선택' }}</em>
                </button>
              </div>
              <section class="choice-panel"><h3>영상 길이</h3><div class="segmented"><button v-for="seconds in [15,20,30]" :key="seconds" type="button" :class="{ active: duration === seconds }" @click="duration = seconds as 15|20|30">{{ seconds }}초</button></div><p>기본 20초 · 사진 8장 기준</p></section>
              <section class="choice-panel"><h3>출력 비율</h3><button type="button" class="ratio-choice active"><span>9:16</span><b>1080 × 1920</b><small>Shorts · Reels · TikTok</small></button></section>
              <div class="truth-note wide"><BbIcon name="shield" :size="21"/><p><b>차량 사실성 보호</b> 원본 사진의 차체·휠·램프·손상·옵션을 생성하거나 변형하지 않습니다.</p></div>
            </div>
            <div class="template-phone"><VideoPreview compact/><p>{{ duration }}초 · {{ templates.find((item) => item.id === selectedTemplate)?.name }}</p></div>
          </div>
          <div class="sticky-actions"><div><b>템플릿 {{ selectedTemplate }} · {{ duration }}초</b><span>9:16 · MP4 · 원본 7장 사용</span></div><button type="button" class="primary-button" @click="restartRender">영상 생성 시작</button></div>
        </section>

        <section v-else-if="activeScreen === 'render'" class="screen-stack narrow-screen">
          <div class="page-heading"><span class="eyebrow">4. 렌더 작업</span><h2>영상이 생성되고 있습니다</h2><p>다른 매물을 작업해도 서버 작업 상태가 유지되는 구조입니다.</p></div>
          <section class="panel render-panel">
            <div class="render-vehicle"><VehicleArtwork :type="selectedVehicle.art" :tone="vehicleTone(selectedVehicle)"/><div><span>{{ selectedVehicle.listingId }}</span><h3>{{ selectedVehicle.name }} {{ selectedVehicle.trim }}</h3><p>{{ duration }}초 · 1080×1920 · MP4</p></div><StatusBadge :label="renderStatus === 'completed' ? '완료' : renderStatus === 'failed' ? '실패' : '처리 중'" :tone="renderStatus === 'completed' ? 'good' : renderStatus === 'failed' ? 'danger' : 'info'"/></div>
            <div class="progress-head"><b>{{ renderProgress }}%</b><span>예상 시간이 아니라 실제 완료 단계 기준입니다.</span></div>
            <div class="progress-track"><i :style="{ width: `${renderProgress}%` }"/></div>
            <div class="stage-list">
              <article v-for="(stage,index) in renderStages" :key="stage.id" :class="{ done: index < renderStageIndex || renderStatus === 'completed', current: index === renderStageIndex && renderStatus !== 'completed' }">
                <span>{{ index < renderStageIndex || renderStatus === 'completed' ? '✓' : index + 1 }}</span><div><b>{{ stage.label }}</b><p>{{ stage.description }}</p></div><small>{{ index < renderStageIndex || renderStatus === 'completed' ? '완료' : index === renderStageIndex ? '진행 중' : '대기' }}</small>
              </article>
            </div>
            <div v-if="renderStatus === 'failed'" class="error-box"><b>렌더 작업 실패</b><p>FFmpeg worker 응답 시간이 초과되었습니다. 같은 Idempotency-Key로 안전하게 재시도할 수 있습니다.</p></div>
            <div class="render-actions"><button v-if="renderStatus !== 'completed'" type="button" class="secondary-button" @click="advanceRender">다음 상태 시뮬레이션</button><button v-else type="button" class="primary-button" @click="go('review')">완성본 검수하기</button></div>
          </section>
        </section>

        <section v-else-if="activeScreen === 'review'" class="screen-stack">
          <div class="page-heading"><span class="eyebrow">5. 사실검증 · 사람 승인</span><h2>원본 매물과 영상 내용을 한 화면에서 대조합니다</h2><p>생성 완료와 외부 공개 승인은 별개입니다. 최종 게시에는 사람 승인이 필요합니다.</p></div>
          <div class="review-layout">
            <section class="panel preview-panel"><div class="panel-head"><div><h3>9:16 완성본</h3><p>검수용 15초 MP4 샘플</p></div><StatusBadge label="게시 전" tone="warning"/></div><VideoPreview/><div class="preview-actions"><a class="secondary-button" href="/sample/shortform-preview.mp4" download>MP4 다운로드</a><button type="button" class="text-button" @click="restartRender">다시 생성</button></div></section>
            <section class="panel fact-panel"><div class="panel-head"><div><h3>Fact Lock 체크</h3><p>모두 확인해야 승인할 수 있습니다.</p></div><StatusBadge :label="approvalStatus === 'approved' ? '승인 완료' : '승인 대기'" :tone="approvalStatus === 'approved' ? 'good' : 'warning'"/></div>
              <label v-for="row in factRows" :key="row.key" class="fact-row"><input v-model="factChecks[row.key]" type="checkbox"/><span><b>{{ row.label }}</b><small>{{ row.detail }}</small></span><em>{{ factChecks[row.key] ? '확인' : '필수' }}</em></label>
              <div class="source-table"><div><span>차명</span><b>{{ selectedVehicle.name }} {{ selectedVehicle.trim }}</b></div><div><span>가격</span><b>{{ formatWon(selectedVehicle.priceWon) }}</b></div><div><span>연식·주행</span><b>{{ selectedVehicle.year }}년 · {{ formatKm(selectedVehicle.mileageKm) }}</b></div><div><span>원본 버전</span><b>v{{ selectedVehicle.sourceVersion }}</b></div></div>
              <button type="button" class="primary-button full-button" :disabled="!allFactsChecked" @click="approve">사람 승인 완료</button>
              <p class="button-help">승인 뒤 가격·연식·주행거리·옵션이 바뀌면 승인은 자동 무효화됩니다.</p>
            </section>
          </div>
        </section>

        <section v-else-if="activeScreen === 'schedule'" class="screen-stack">
          <div class="page-heading"><span class="eyebrow">6. 채널·예약 설정</span><h2>채널마다 공개 상태와 실패를 분리합니다</h2><p>현재는 mock adapter만 연결되어 어떤 버튼도 실제 SNS에 게시하지 않습니다.</p></div>
          <div class="channel-grid">
            <article v-for="channel in MOCK_CHANNELS" :key="channel.id" class="channel-card">
              <div class="channel-logo">{{ channel.id === 'youtube' ? 'YT' : channel.id === 'instagram' ? 'IG' : 'TT' }}</div><div><h3>{{ channel.label }}</h3><p>{{ channel.detail }}</p></div><StatusBadge label="연결 안 됨" tone="warning"/><label class="switch"><input type="checkbox" disabled/><span/></label>
            </article>
          </div>
          <section class="panel schedule-panel"><div><h3>예약 시간</h3><p>Asia/Seoul 기준 · 승인 이후에만 저장</p></div><input v-model="scheduledAt" type="datetime-local"/><div class="approval-gate" :class="{ open: publishAllowed }"><BbIcon :name="publishAllowed ? 'check' : 'shield'" :size="22"/><p><b>{{ publishAllowed ? '게시 게이트 통과' : '게시 게이트 잠금' }}</b><span>{{ publishAllowed ? '사람 승인과 Fact Lock 확인이 완료되었습니다.' : '사람 승인·Fact Lock·판매상태를 확인하세요.' }}</span></p></div><button type="button" class="primary-button" :disabled="!publishAllowed" @click="runMockPublish">MOCK 예약 요청</button></section>
          <div class="sticky-actions"><div><b>{{ publishAllowed ? '예약 가능' : '승인 전 게시 차단' }}</b><span>{{ MOCK_ONLY_NOTICE }}</span></div><button type="button" class="secondary-button" @click="go('review')">검수 화면으로</button></div>
        </section>

        <section v-else-if="activeScreen === 'publish'" class="screen-stack">
          <div class="page-heading"><span class="eyebrow">7. 게시 상태 · 캘린더</span><h2>실패한 채널만 골라 다시 시도합니다</h2><p>한 채널의 실패가 다른 채널의 성공 상태를 덮어쓰지 않습니다.</p></div>
          <div class="calendar-strip"><button type="button">‹</button><div v-for="day in ['10/30 목','10/31 금','11/1 토','11/2 일','11/3 월','11/4 화','11/5 수']" :key="day" :class="{ active: day.includes('11/3') }"><span>{{ day.split(' ')[0] }}</span><b>{{ day.split(' ')[1] }}</b><i v-if="day.includes('10/31') || day.includes('11/3')"/></div><button type="button">›</button></div>
          <section class="panel publish-table"><div class="table-head"><span>예약·게시 시각</span><span>차량</span><span>채널</span><span>상태</span><span>원인</span><span/></div><article v-for="row in publishRows" :key="`${row.date}-${row.channel}`"><span>{{ row.date }}</span><b>{{ row.vehicle }}</b><span>{{ row.channel }}</span><StatusBadge :label="row.status" :tone="row.tone"/><span>{{ row.reason }}</span><button type="button" :disabled="row.status !== '실패'">{{ row.status === '실패' ? '재시도' : '보기' }}</button></article></section>
          <div class="sold-rule"><BbIcon name="shield" :size="22"/><div><b>판매완료 자동 차단 규칙</b><p>매물 상태가 판매완료로 바뀌면 예약 게시를 중단하고 진행 중 작업에 취소 요청을 보냅니다.</p></div><StatusBadge label="활성" tone="good"/></div>
        </section>

        <section v-else-if="activeScreen === 'brand'" class="screen-stack">
          <div class="page-heading"><span class="eyebrow">8. 브랜드 키트</span><h2>딜러의 인상을 통일하되 차량보다 앞서지 않게</h2><p>AutoScout24·Reddit·초톳의 원본 자산은 사용하지 않고 자체 선형 체계만 적용했습니다.</p></div>
          <div class="brand-layout">
            <section class="panel brand-form"><h3>서울오토갤러리 브랜드</h3><label><span>표시 이름</span><input value="서울오토갤러리 프리미엄"/></label><label><span>엔드카드 문구</span><input value="검증된 차량을 투명하게 소개합니다"/></label><div class="logo-drop"><span class="brand-mark large">B</span><div><b>로고 파일</b><p>SVG 또는 투명 PNG · 권리 확인 자산만</p></div><button type="button">교체</button></div><div class="color-fields"><label><span>주 색상</span><i style="background:#1f55e5"/><input value="#1F55E5"/></label><label><span>보조 색상</span><i style="background:#0f172a"/><input value="#0F172A"/></label></div><label><span>기본 글꼴</span><select><option>Pretendard</option></select></label><button type="button" class="primary-button">브랜드 키트 저장</button></section>
            <section class="panel endcard-preview"><span>20초 영상 엔드카드</span><div class="endcard"><span class="brand-mark large">B</span><h3>서울오토갤러리<br/>프리미엄</h3><p>검증된 차량을 투명하게 소개합니다</p><b>보배드림에서 매물 보기 →</b><small>차량 외형을 생성형 AI로 바꾸지 않았습니다.</small></div></section>
          </div>
        </section>

        <section v-else class="screen-stack">
          <div class="page-heading"><span class="eyebrow">9. SNS 연결 · 권한</span><h2>연결 상태와 게시 권한을 숨김없이 표시합니다</h2><p>검수 전에는 OAuth 연결을 실행하지 않습니다. 버튼은 정책 안내용으로 비활성화되어 있습니다.</p></div>
          <div class="connection-list">
            <article v-for="channel in MOCK_CHANNELS" :key="channel.id"><div class="channel-logo">{{ channel.id === 'youtube' ? 'YT' : channel.id === 'instagram' ? 'IG' : 'TT' }}</div><div><h3>{{ channel.label }}</h3><p>계정 미연결 · 토큰 없음 · 게시 권한 없음</p><span>필요 권한: 콘텐츠 업로드 · 게시 상태 조회</span></div><StatusBadge label="게시하지 않음" tone="warning"/><button type="button" disabled>검수 후 연결</button></article>
          </div>
          <section class="panel permission-panel"><div><BbIcon name="shield" :size="26"/><h3>명시적 승인 원칙</h3><p>자동 생성과 자동 게시를 분리합니다. 사람 승인 없이 OAuth 토큰을 사용하거나 외부 채널에 데이터를 보내지 않습니다.</p></div><ul><li>키가 없으면 mock adapter만 실행</li><li>채널마다 최소 권한만 요청</li><li>권한 만료·철회 시 게시 작업 차단</li><li>게시 본문·공개범위·예약시각 감사 로그 저장</li></ul></section>
        </section>
      </main>
    </div>

    <Transition name="toast"><div v-if="toast" class="toast-message"><BbIcon name="check" :size="18"/>{{ toast }}</div></Transition>
  </div>
</template>

