<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { buildHistory, date, FILTERS, formatPlate, mileageRecords, mileageSummary, money, number, numeric, providerLabel, timeline } from '../lib/history.ts'
import type { Filter, HistoryReport } from '../lib/history.ts'
const props = defineProps<{ report: HistoryReport }>()
defineEmits<{ reset: []; print: [] }>()
const selected = ref<Filter>('all')
watch(() => props.report, () => { selected.value = 'all' })
const vehicle = computed(() => props.report.vehicle || {})
const vehicleName = computed(() => vehicle.value.name || [vehicle.value.manufacturer, vehicle.value.model, vehicle.value.trim || vehicle.value.trimName].filter(Boolean).join(' ') || '차량정보')
const meta = computed(() => [vehicle.value.modelYear ? `${vehicle.value.modelYear}년식` : vehicle.value.year, vehicle.value.fuel, vehicle.value.trim || vehicle.value.trimName, vehicle.value.vinMasked].filter(Boolean))
const providers = computed(() => [{ name: '카히스토리', state: props.report.sourceStatus?.carHistory }, { name: '국토부', state: props.report.sourceStatus?.molit }])
const incomplete = computed(() => providers.value.some(p => p.state !== 'success'))
const demo = computed(() => providers.value.some(p => p.state === 'demo'))
const grade = computed(() => incomplete.value ? '—' : props.report.risk?.grade || props.report.grade || props.report.riskGrade || '—')
const riskTitle = computed(() => incomplete.value ? '종합 판정에 필요한 정보가 부족합니다' : ({ A: '양호한 차량입니다', B: '구매 전 확인이 필요합니다', C: '주의 깊게 확인하세요', D: '구매 위험이 높습니다' } as Record<string,string>)[grade.value] || '조회 결과를 확인하세요')
const reasons = computed(() => Array.isArray(props.report.risk?.reasons) ? props.report.risk.reasons.join(' · ') : '')
const allItems = computed(() => buildHistory(props.report))
const items = computed(() => selected.value === 'all' ? allItems.value : selected.value === 'warn' ? allItems.value.filter(x => x.state === 'warn') : allItems.value.filter(x => x.category === selected.value))
const mileage = computed(() => mileageRecords(props.report))
const mileageStatus = computed(() => mileageSummary(props.report))
const chart = computed(() => {
  const values = mileage.value.slice(-8), max = Math.max(...values.map(x => numeric(x.mileage) || 0), 1)
  return values.map(x => ({ ...x, height: Math.max(4, Math.round((numeric(x.mileage) || 0) / max * 145)) }))
})
const accidents = computed(() => props.report.insurance?.accidents || [])
const events = computed(() => timeline(props.report))
const accidentType = (type?: string) => ({ own_damage: '내 차 피해', other_damage: '상대 차 피해', insurance: '보험사고' } as Record<string,string>)[type || ''] || type || '보험사고'
</script>

<template>
  <section id="report" class="report" aria-label="차량이력 조회 결과" aria-live="polite">
    <p v-if="demo" class="notice" role="status">시연값이 포함된 결과입니다. 실제 차량이력으로 판단하지 마세요.</p>
    <p v-if="incomplete" class="notice" role="status">일부 기관 정보가 조회되지 않았거나 상태가 미확인입니다. 표시되지 않은 기록을 ‘없음’으로 해석하지 마세요.</p>
    <div class="report-head">
      <article class="vehicle-card"><div><span class="eyebrow" style="color:var(--blue)">VEHICLE PROFILE</span><h2>{{ vehicleName }}</h2><div class="vehicle-meta"><span v-for="(value,index) in meta" :key="index" class="pill">{{ value }}</span></div><div class="provider"><span v-for="provider in providers" :key="provider.name" :class="{ok:provider.state==='success',fail:provider.state==='failed'||provider.state==='error'}">● {{ provider.name }} {{ providerLabel(provider.state) }}</span></div></div><div class="plate">{{ vehicle.plateMasked || formatPlate(report.plate) }}</div></article>
      <article class="risk-card"><div class="grade">{{ grade }}</div><div><h3>{{ riskTitle }}</h3><p>{{ reasons || '제공된 개별 이력과 원본 자료를 함께 확인하세요.' }}</p></div></article>
    </div>
    <div class="metrics">
      <article class="metric"><span>보험사고</span><strong>{{ number(report.insurance?.accidentCount,'건') }}</strong><em>보험 기록 범위 기준</em></article>
      <article class="metric"><span>총 보험수리비</span><strong>{{ money(report.insurance?.ownDamageTotal) }}</strong><em>내 차 피해 기준</em></article>
      <article class="metric"><span>소유자 변경</span><strong>{{ number(report.registration?.ownerChangeCount,'회') }}</strong></article>
      <article class="metric"><span>최근 주행거리</span><strong>{{ number(mileage.at(-1)?.mileage,'km') }}</strong></article>
    </div>
    <section id="history-guide" class="section"><div class="section-title"><div><h3>19개 차량이력 전체 점검</h3><p>조회되지 않은 항목도 ‘정보 없음’으로 표시합니다.</p></div></div>
      <div class="tabs" role="group" aria-label="이력 분류"><button v-for="filter in FILTERS" :key="filter.key" type="button" class="tab" :class="{active:selected===filter.key}" :aria-pressed="selected===filter.key" @click="selected=filter.key">{{ filter.label }}</button></div>
      <div class="history-grid"><article v-for="item in items" :key="item.id" class="history-item" :class="item.state" :data-state="item.state"><span class="status" :aria-label="item.state==='unknown'?'미확인':item.state==='warn'?'확인 필요':'제공 결과 확인'">{{ item.state==='ok'?'✓':item.state==='warn'?'!':'?' }}</span><div><strong>{{ item.name }}</strong><small>{{ item.note }}</small></div><b>{{ item.value }}</b></article></div><p v-if="!items.length" class="footer-note">해당 분류에 표시할 이력이 없습니다.</p>
    </section>
    <section class="section"><div class="section-title"><div><h3>주행거리 흐름</h3><p>제공 기록의 감소 여부를 비교합니다.</p></div><strong :class="mileageStatus.state">{{ mileageStatus.text }}</strong></div><div class="chart" aria-label="주행거리 기록"><div v-for="(record,index) in chart" :key="index" class="chart-col"><i :style="{height:record.height+'px'}"/><strong>{{ number(record.mileage,'km') }}</strong>{{ date(record.date) }}</div><p v-if="!chart.length" class="footer-note">제공된 주행거리 기록이 없습니다.</p></div></section>
    <section class="section"><div class="section-title"><div><h3>보험사고 상세</h3><p>사고별 부품비·공임·도장비를 구분합니다.</p></div></div><article v-for="(accident,index) in accidents" :key="index" class="accident"><div class="accident-head"><div><h4>{{ date(accident.date) }} · {{ accidentType(accident.type) }}</h4><small>보험개발원 카히스토리 제공 범위 기준</small></div><div class="amount">{{ money(accident.paidAmount) }}</div></div><div class="costs"><span>부품비<b>{{ money(accident.partsAmount) }}</b></span><span>공임<b>{{ money(accident.laborAmount) }}</b></span><span>도장비<b>{{ money(accident.paintingAmount) }}</b></span><span>예상수리비<b>{{ money(accident.estimateAmount) }}</b></span></div></article><p v-if="!accidents.length" class="footer-note">제공된 보험사고 상세 기록이 없습니다. 미조회·미보험 기록과 구분해 확인하세요.</p></section>
    <section class="section"><div class="section-title"><div><h3>시간순 통합이력</h3><p>보험·소유·검사·정비 이력을 함께 확인합니다.</p></div></div><div class="timeline"><article v-for="(event,index) in events" :key="index" class="event"><time>{{ date(event.date) }}</time><strong>{{ event.title || event.type || '차량 이력' }}</strong><p>{{ event.result || event.source || (numeric(event.mileage)!==null ? number(event.mileage,'km') : '') }}</p></article><p v-if="!events.length" class="footer-note">제공된 시간순 이력이 없습니다.</p></div></section>
    <div class="actions"><button type="button" class="action" @click="$emit('reset')">새 차량 조회</button><button type="button" class="action primary" @click="$emit('print')">PDF 저장</button></div>
    <p class="footer-note">제공 기관의 응답을 정리한 참고자료입니다. 실제 거래 전 성능·상태점검기록부와 차량 실물을 함께 확인하세요.</p>
  </section>
</template>
