<script setup lang="ts">
import { sunwoohyukLuxuryV1 as preset } from "../lib/pipelines/sunwoohyuk-luxury-v1";
import { sitePath } from "../lib/site";

defineEmits<{ go: [view: string] }>();

const calloutPoster = sitePath("3d-options", "media", "poster.jpg");
</script>

<template>
  <section class="sf-wrap sf-pipeline">
    <header class="sf-pipeline-head">
      <div>
        <span class="sf-eyebrow">3 REELS ANALYZED · PIPELINE v{{ preset.version }}</span>
        <h1>{{ preset.title }}</h1>
        <p>오토갤러리 선우혁 딜러의 럭셔리 차량 릴스 3개에서 공통 편집 문법을 추출한 자동 제작 프리셋입니다.</p>
      </div>
      <button class="btn is-main" type="button" @click="$emit('go', 'new')">이 프리셋으로 만들기</button>
    </header>

    <div class="sf-pipeline-meta">
      <div class="card"><span>출력</span><b>{{ preset.master }}</b></div>
      <div class="card"><span>자막</span><b>{{ preset.caption }}</b></div>
      <div class="card"><span>음악</span><b>{{ preset.audio }}</b></div>
    </div>

    <section class="card sf-pipeline-section">
      <div class="sf-pipeline-title"><div><span>01</span><h2>30초 자동 편집 타임라인</h2></div><small>차량 사실이 없는 구간은 만들지 않고 다음 비트로 당깁니다.</small></div>
      <ol class="sf-timeline">
        <li v-for="beat in preset.beats" :key="beat.id">
          <time>{{ beat.range }}</time>
          <i aria-hidden="true" />
          <div><b>{{ beat.title }}</b><span>{{ beat.shots }}</span><small>{{ beat.output }}</small></div>
        </li>
      </ol>
    </section>

    <section class="card sf-pipeline-section">
      <div class="sf-pipeline-title"><div><span>02</span><h2>제작·검수 기술 스펙</h2></div><small>수치는 권장값이 아니라 자동 QC가 통과·차단을 판단하는 계약입니다.</small></div>
      <div class="sf-spec-table" role="table" aria-label="자동 편집 기술 스펙">
        <div v-for="metric in preset.technical" :key="metric.id" class="sf-spec-row" role="row">
          <b role="cell">{{ metric.label }}</b>
          <span role="cell">{{ metric.value }}</span>
          <small role="cell">합격: {{ metric.acceptance }}</small>
        </div>
      </div>
    </section>

    <section class="card sf-pipeline-section">
      <div class="sf-pipeline-title"><div><span>03</span><h2>이집트 숏폼식 3D 옵션 말풍선</h2></div><small>그림 위에 고정하는 장식이 아니라 실제 차량 부위를 프레임마다 추적합니다.</small></div>
      <div class="sf-callout-layout">
        <figure class="sf-callout-stage">
          <img :src="calloutPoster" alt="차량 부위 추적 3D 옵션 말풍선 예시" />
          <i class="sf-callout-anchor" aria-hidden="true" />
          <i class="sf-callout-leader" aria-hidden="true" />
          <figcaption class="sf-callout-panel">
            <span>CONFIRMED OPTION</span>
            <b>확인된 옵션명</b>
            <small>옵션 ID · 차량 부위 연결</small>
          </figcaption>
          <em>PREVIEW · 1080×1920 좌표를 축소 표시</em>
        </figure>
        <dl class="sf-callout-specs">
          <div v-for="item in preset.callout" :key="item.id">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </div>
      <p class="sf-callout-note">차량 부위가 가려지거나 추적 신뢰도가 0.72 아래로 4프레임 이어지면 말풍선을 지우고 중립 하단 정보바로 전환합니다. 사진만 보고 추정한 옵션은 표시하지 않습니다.</p>
    </section>

    <section class="card sf-pipeline-section">
      <div class="sf-pipeline-title"><div><span>04</span><h2>Zero-Touch 처리 파이프라인</h2></div><small>검수 승인 전에는 외부 채널에 게시하지 않습니다.</small></div>
      <ol class="sf-stage-grid">
        <li v-for="(stage, index) in preset.stages" :key="stage.id">
          <span>{{ String(index + 1).padStart(2, '0') }}</span>
          <div><b>{{ stage.label }}</b><em>{{ stage.owner }}</em><p>{{ stage.rule }}</p></div>
        </li>
      </ol>
    </section>

    <section class="sf-pipeline-rules">
      <div class="card"><b>사실 우선</b><p>사진으로 보이더라도 매물 DB와 옵션 ID에서 확인되지 않은 옵션은 설명하지 않습니다.</p></div>
      <div class="card"><b>차량 원본 보존</b><p>색상·휠·손상·트림을 생성형 영상으로 바꾸거나 결함을 숨기지 않습니다.</p></div>
      <div class="card"><b>게시 안전장치</b><p>음성 동의와 음악 라이선스를 기록하고, 사람의 최종 승인 뒤 게시합니다.</p></div>
    </section>

    <div class="card sf-sample-cta">
      <div><b>사진 8~12장으로 첫 검수 영상을 만드세요</b><span>필수 부위가 빠지면 가짜 장면 대신 재촬영 항목을 알려드립니다.</span></div>
      <button class="btn is-main" type="button" @click="$emit('go', 'new')">새 영상 시작</button>
    </div>
  </section>
</template>
