<script setup lang="ts">
import { vehicleFeatures, type FeatureId } from '~~/shared/features'

const selectedId = ref<FeatureId>('headlamp')
const baseURL = useRuntimeConfig().app.baseURL
const mode = ref<'digital' | 'video'>('digital')
const autoPlay = ref(true)
const progress = ref(0)
const stage = ref<'analyzing' | 'matched' | 'rendering' | 'ready'>('ready')
let timer: ReturnType<typeof setInterval> | undefined
let progressTimer: ReturnType<typeof setInterval> | undefined

const selected = computed(() => vehicleFeatures.find(item => item.id === selectedId.value) ?? vehicleFeatures[0]!)
const selectedIndex = computed(() => vehicleFeatures.findIndex(item => item.id === selectedId.value))
const totalDuration = computed(() => vehicleFeatures.reduce((sum, item) => sum + item.duration, 0))

function selectFeature(id: FeatureId) {
  selectedId.value = id
  progress.value = 0
}

function startAuto() {
  clearInterval(timer)
  clearInterval(progressTimer)
  progressTimer = setInterval(() => {
    if (!autoPlay.value) return
    progress.value = Math.min(100, progress.value + 100 / (selected.value.duration * 10))
  }, 100)
  timer = setInterval(() => {
    if (!autoPlay.value) return
    const next = (selectedIndex.value + 1) % vehicleFeatures.length
    selectedId.value = vehicleFeatures[next]!.id
    progress.value = 0
  }, 4300)
}

function simulateAutomation() {
  stage.value = 'analyzing'
  window.setTimeout(() => { stage.value = 'matched' }, 800)
  window.setTimeout(() => { stage.value = 'rendering' }, 1600)
  window.setTimeout(() => { stage.value = 'ready' }, 2700)
}

onMounted(startAuto)
onBeforeUnmount(() => { clearInterval(timer); clearInterval(progressTimer) })
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#" aria-label="보배드림 홈">
        <span class="brand-wheel" aria-hidden="true"><i /><i /><i /></span>
        <strong>보배드림</strong>
        <em>3D 옵션 오토모션</em>
      </a>
      <span class="prototype-badge"><i /> Nuxt 4 MVP</span>
    </header>

    <main>
      <section class="hero-copy">
        <div>
          <p class="eyebrow">VEHICLE FEATURE AUTOMATION</p>
          <h1>차량 기능을 찾고,<br><span>3D 설명 영상으로 자동 편집</span></h1>
          <p class="lead">매물 정본에 확인된 옵션만 실제 촬영 부위와 연결합니다.</p>
        </div>
        <div class="automation-summary" aria-label="자동화 처리 상태">
          <span :class="{ active: stage === 'analyzing' }">장면 분석</span>
          <b>→</b><span :class="{ active: stage === 'matched' }">옵션 매칭</span>
          <b>→</b><span :class="{ active: stage === 'rendering' }">3D 합성</span>
          <b>→</b><span :class="{ active: stage === 'ready' }">QC 완료</span>
        </div>
      </section>

      <section class="studio-grid">
        <article class="preview-card">
          <div class="preview-header">
            <div class="mode-switch" role="tablist" aria-label="미리보기 유형">
              <button :aria-selected="mode === 'digital'" @click="mode = 'digital'">3D 디지털 트윈</button>
              <button :aria-selected="mode === 'video'" @click="mode = 'video'">실제 촬영 영상</button>
            </div>
            <button class="autoplay-button" :aria-pressed="autoPlay" @click="autoPlay = !autoPlay">
              <span>{{ autoPlay ? 'Ⅱ' : '▶' }}</span> 자동 재생
            </button>
          </div>

          <div class="stage-frame">
            <ClientOnly v-if="mode === 'digital'">
              <ThreeVehicle :feature="selectedId" />
              <template #fallback><div class="stage-loading">3D 차량을 준비하고 있습니다</div></template>
            </ClientOnly>
            <video v-else class="sample-video" :src="`${baseURL}media/demo.mp4`" muted playsinline autoplay loop />

            <div class="safe-top" aria-hidden="true" />
            <div class="feature-callout" :class="`feature-${selected.id}`">
              <span class="anchor-dot"><i /></span>
              <span class="anchor-line" />
              <div class="feature-panel">
                <small>FEATURE {{ String(selectedIndex + 1).padStart(2, '0') }}</small>
                <strong>{{ selected.label }}</strong>
                <p>{{ selected.description }}</p>
              </div>
            </div>
            <div class="vehicle-title">
              <small>2024 BMW X5 xDrive30d</small>
              <strong>{{ selected.shortLabel }}</strong>
            </div>
            <div class="clip-progress"><i :style="{ width: `${progress}%` }" /></div>
          </div>

          <div class="feature-timeline">
            <button v-for="(feature, index) in vehicleFeatures" :key="feature.id" :class="{ active: feature.id === selectedId }" @click="selectFeature(feature.id)">
              <span>{{ index + 1 }}</span><strong>{{ feature.shortLabel }}</strong><small>{{ feature.duration.toFixed(1) }}초</small>
            </button>
          </div>
        </article>

        <aside class="control-card">
          <div class="control-heading">
            <div><p>확인된 옵션</p><h2>{{ vehicleFeatures.length }}개 기능 자동 구성</h2></div>
            <span>{{ totalDuration.toFixed(1) }}초</span>
          </div>

          <div class="option-list">
            <button v-for="feature in vehicleFeatures" :key="feature.id" :class="{ selected: feature.id === selectedId }" @click="selectFeature(feature.id)">
              <span class="check">✓</span>
              <span><strong>{{ feature.label }}</strong><small>{{ feature.shot }}</small></span>
              <i>›</i>
            </button>
          </div>

          <div class="data-card">
            <div class="data-card-title"><span>정본 데이터 연결</span><b>검증됨</b></div>
            <dl>
              <div><dt>근거</dt><dd>{{ selected.evidence }}</dd></div>
              <div><dt>추천 촬영</dt><dd>{{ selected.shot }}</dd></div>
              <div><dt>자동 음성</dt><dd>“{{ selected.narration }}”</dd></div>
            </dl>
          </div>

          <button class="primary-action" :disabled="stage !== 'ready'" @click="simulateAutomation">
            <span v-if="stage === 'ready'">자동 영상 다시 만들기</span>
            <span v-else>자동 처리 중 · {{ stage === 'analyzing' ? '장면 분석' : stage === 'matched' ? '옵션 매칭' : '3D 합성' }}</span>
          </button>
          <p class="safety-note">영상만 보고 옵션을 추정하지 않습니다. 매물 정본과 일치하는 기능만 표시됩니다.</p>
        </aside>
      </section>

      <section class="pipeline-section">
        <div class="section-title"><p>AUTOMATION PIPELINE</p><h2>편집자 없이 반복 가능한 제작 흐름</h2></div>
        <ol>
          <li><span>01</span><strong>촬영 업로드</strong><small>권장 각도와 촬영 부위 안내</small></li>
          <li><span>02</span><strong>장면·부위 분석</strong><small>차량 부위 후보와 컷 경계 탐색</small></li>
          <li><span>03</span><strong>옵션 정본 매칭</strong><small>매물 ID와 옵션 코드 교차검증</small></li>
          <li><span>04</span><strong>3D 기능 합성</strong><small>추적 포인트·설명·음성·자막</small></li>
          <li><span>05</span><strong>QC·게시 대기</strong><small>수치·음량·화면 안전영역 검사</small></li>
        </ol>
      </section>
    </main>
  </div>
</template>
