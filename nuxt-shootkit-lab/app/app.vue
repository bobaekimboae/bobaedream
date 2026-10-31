<script setup lang="ts">
import {
  ArrowLeft,
  BadgeCheck,
  Camera,
  CarFront,
  Check,
  ChevronRight,
  CircleGauge,
  Clapperboard,
  Gauge,
  Grid2X2,
  Home,
  Image as ImageIcon,
  Layers3,
  LocateFixed,
  Menu,
  MoreHorizontal,
  Move3D,
  Play,
  Rotate3D,
  ScanLine,
  Settings,
  SlidersHorizontal,
  Sparkles,
  SquareStack,
  Upload,
  Video,
  WandSparkles,
  X,
} from "@lucide/vue";
import type { Component } from "vue";

type Screen = "home" | "photo" | "video" | "tour" | "ai" | "projects" | "results" | "settings";
type ActionId = "photo" | "video" | "tour" | "ai";

interface ActionItem {
  id: ActionId;
  title: string;
  sub: string;
  icon: Component;
  tone: string;
}

interface ShotStep {
  label: string;
  coach: string;
  quality: string;
}

const carBase = "https://bobaekimboae.github.io/bobaedream/assets/cars/deutsch-autoworld-v01";
const carImages = Array.from({ length: 5 }, (_, index) => `${carBase}/dau-01-${index + 1}.webp`);
const screen = ref<Screen>("home");
const fakeCam = ref(false);
const captured = ref<string[]>([]);
const photoIndex = ref(0);
const tourCount = ref(0);
const compare = ref(56);
const projectProgress = ref(38);
const plateBlur = ref(true);
const guideOn = ref(true);
const cameraStream = shallowRef<MediaStream | null>(null);
const cameraError = ref("");
const videoRef = ref<HTMLVideoElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const fileRef = ref<HTMLInputElement | null>(null);
const isRecording = ref(false);
const recordSeconds = ref(0);
const aiProgress = ref(0);
const aiRunning = ref(false);
const aiReady = ref(false);
let recordTimer: ReturnType<typeof setInterval> | undefined;
let aiTimer: ReturnType<typeof setInterval> | undefined;

const actions: ActionItem[] = [
  { id: "photo", title: "사진 촬영", sub: "필수 14컷 코치", icon: Camera, tone: "blue" },
  { id: "video", title: "영상 촬영", sub: "3단계 숏폼 코스", icon: Video, tone: "violet" },
  { id: "tour", title: "360° 촬영", sub: "8방향 회전 시안", icon: Rotate3D, tone: "cyan" },
  { id: "ai", title: "AI 숏폼", sub: "자동 구성 · 설명", icon: WandSparkles, tone: "orange" },
];

const shotSteps: ShotStep[] = [
  { label: "좌측 전면 45°", coach: "사이드미러 높이에서 한 걸음 뒤로 이동하세요", quality: "차량 전체가 프레임 안에 보여야 해요" },
  { label: "우측 후면 45°", coach: "휴대폰을 약 5° 낮추고 수평을 맞춰 주세요", quality: "후면과 측면 비율을 4:6으로 맞추세요" },
  { label: "계기판", coach: "운전석 정중앙에서 반사를 피해 촬영하세요", quality: "주행거리 숫자가 선명하게 보여야 해요" },
  { label: "대시보드", coach: "2열 중앙에서 가로선을 수평으로 맞춰 주세요", quality: "센터 디스플레이와 핸들을 함께 담으세요" },
  { label: "운전석 시트", coach: "시트 전체와 옆면 마모 부위를 함께 담아 주세요", quality: "창문 빛이 강하면 한 걸음 왼쪽으로 이동하세요" },
  { label: "트렁크", coach: "바닥 끝선까지 보이도록 허리 높이에서 촬영하세요", quality: "공간 깊이와 좌우 벽면이 모두 보여야 해요" },
];

const navItems: { id: Screen; label: string; icon: Component }[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "photo", label: "촬영", icon: Camera },
  { id: "projects", label: "프로젝트", icon: SquareStack },
  { id: "results", label: "결과", icon: Play },
  { id: "settings", label: "설정", icon: Settings },
];

const currentShot = computed(() => shotSteps[Math.min(photoIndex.value, shotSteps.length - 1)]!);
const cameraActive = computed(() => Boolean(cameraStream.value));
const canFinishPhoto = computed(() => captured.value.length >= 4);
const screenTitle = computed(() => ({
  home: "촬영 프로젝트",
  photo: "AI 사진 코치",
  video: "숏폼 영상 촬영",
  tour: "360° 차량 촬영",
  ai: "AI 숏폼 제작",
  projects: "프로젝트",
  results: "촬영 결과",
  settings: "촬영 설정",
}[screen.value]));

onMounted(() => {
  fakeCam.value = new URLSearchParams(window.location.search).get("fakecam") === "1";
});

onBeforeUnmount(() => {
  stopCamera();
  if (recordTimer) clearInterval(recordTimer);
  if (aiTimer) clearInterval(aiTimer);
});

function go(next: Screen) {
  if (screen.value === "photo" || screen.value === "video") stopCamera();
  screen.value = next;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openAction(id: ActionId) {
  go(id);
}

async function startCamera() {
  cameraError.value = "";
  if (!navigator.mediaDevices?.getUserMedia) {
    cameraError.value = "이 브라우저에서는 카메라를 열 수 없어 사진 불러오기를 사용해 주세요.";
    return;
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: screen.value === "video",
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    });
    cameraStream.value = stream;
    await nextTick();
    if (videoRef.value) {
      videoRef.value.srcObject = stream;
      await videoRef.value.play();
    }
  } catch {
    cameraError.value = "카메라 권한이 꺼져 있어요. 권한을 허용하거나 앨범에서 불러오세요.";
  }
}

function stopCamera() {
  cameraStream.value?.getTracks().forEach((track) => track.stop());
  cameraStream.value = null;
  if (videoRef.value) videoRef.value.srcObject = null;
}

function capturePhoto() {
  if (cameraActive.value && videoRef.value && canvasRef.value) {
    const video = videoRef.value;
    const canvas = canvasRef.value;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 960;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    captured.value.push(canvas.toDataURL("image/jpeg", 0.9));
    advanceShot();
    return;
  }
  if (fakeCam.value) {
    captured.value.push(carImages[captured.value.length % carImages.length]!);
    advanceShot();
    return;
  }
  fileRef.value?.click();
}

function importPhoto(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  captured.value.push(URL.createObjectURL(file));
  advanceShot();
  input.value = "";
}

function advanceShot() {
  photoIndex.value = Math.min(photoIndex.value + 1, shotSteps.length - 1);
  projectProgress.value = Math.min(100, 38 + captured.value.length * 9);
}

function finishPhotos() {
  stopCamera();
  go("results");
}

function toggleRecording() {
  isRecording.value = !isRecording.value;
  if (isRecording.value) {
    recordSeconds.value = 0;
    recordTimer = setInterval(() => {
      recordSeconds.value += 1;
      if (recordSeconds.value >= 15) toggleRecording();
    }, 1000);
  } else if (recordTimer) {
    clearInterval(recordTimer);
    recordTimer = undefined;
    projectProgress.value = Math.max(projectProgress.value, 72);
  }
}

function captureTour() {
  tourCount.value = Math.min(8, tourCount.value + 1);
  projectProgress.value = Math.max(projectProgress.value, 38 + tourCount.value * 5);
}

function runAi() {
  aiRunning.value = true;
  aiReady.value = false;
  aiProgress.value = 8;
  aiTimer = setInterval(() => {
    aiProgress.value = Math.min(100, aiProgress.value + 8);
    if (aiProgress.value >= 100) {
      if (aiTimer) clearInterval(aiTimer);
      aiRunning.value = false;
      aiReady.value = true;
      projectProgress.value = 100;
    }
  }, 240);
}

function formatTime(seconds: number) {
  return `00:${String(seconds).padStart(2, "0")}`;
}
</script>

<template>
  <div class="lab-app">
    <aside class="desktop-rail" aria-label="수정판 안내">
      <div class="rail-brand"><CircleGauge :size="34" /><b>보배드림</b><span>SHOOT LAB</span></div>
      <h1>촬영을 시작하기 전에<br />완성 결과부터 설계합니다.</h1>
      <p>기존 촬영키트와 코드·주소·저장 상태를 공유하지 않는 독립 실험판입니다.</p>
      <ul>
        <li><Check :size="17" />행동형 실시간 촬영 코치</li>
        <li><Check :size="17" />사진 · 영상 · 360° 단일 프로젝트</li>
        <li><Check :size="17" />원본 보존형 전후 비교</li>
        <li><Check :size="17" />AI 숏폼 자동 구성 상태 확인</li>
      </ul>
      <div class="rail-note"><Sparkles :size="18" /><span>원본 촬영키트는 변경하지 않았습니다.</span></div>
    </aside>

    <main class="phone-shell">
      <header v-if="!['photo', 'video'].includes(screen)" class="topbar">
        <button class="icon-button" type="button" aria-label="메뉴"><Menu /></button>
        <div class="topbar-title">
          <span class="brand-mark"><CircleGauge /></span>
          <div><b>{{ screenTitle }}</b><small>보배드림 촬영키트 Lab</small></div>
        </div>
        <button class="icon-button" type="button" aria-label="더보기"><MoreHorizontal /></button>
      </header>

      <section v-if="screen === 'home'" class="screen home-screen">
        <div class="lab-badge"><Sparkles :size="14" /> 독립 수정판 · 기존 키트와 분리</div>

        <article class="project-card">
          <img :src="carImages[0]" alt="촬영 중인 차량" />
          <div class="project-shade" />
          <div class="project-top"><span>진행 중</span><b>{{ projectProgress }}%</b></div>
          <div class="project-copy">
            <small>매물 24-1031-08</small>
            <h2>2021 제네시스 GV80 3.5T</h2>
            <p>사진 {{ captured.length }}/14 · 영상 {{ recordSeconds ? '1' : '0' }}/3 · 360° {{ tourCount }}/8</p>
          </div>
          <div class="project-progress"><i :style="{ width: `${projectProgress}%` }" /></div>
        </article>

        <div class="section-heading"><div><small>바로 시작</small><h2>무엇을 촬영할까요?</h2></div><button type="button">촬영 규칙 <ChevronRight /></button></div>
        <div class="action-grid">
          <button v-for="action in actions" :key="action.id" type="button" :class="['action-card', `is-${action.tone}`]" @click="openAction(action.id)">
            <span><component :is="action.icon" /></span>
            <b>{{ action.title }}</b>
            <small>{{ action.sub }}</small>
            <ChevronRight class="action-arrow" />
          </button>
        </div>

        <article class="quality-card">
          <div class="section-heading compact"><div><small>오늘 촬영 품질</small><h2>등록 적합도 86점</h2></div><span class="score-up">+12</span></div>
          <div class="quality-bars">
            <div><span>구도</span><i><b style="width: 92%" /></i><em>92</em></div>
            <div><span>선명도</span><i><b style="width: 84%" /></i><em>84</em></div>
            <div><span>완성도</span><i><b style="width: 78%" /></i><em>78</em></div>
          </div>
        </article>

        <div class="section-heading"><div><small>다음 추천</small><h2>남은 필수 컷</h2></div><button type="button" @click="go('photo')">전체 보기 <ChevronRight /></button></div>
        <div class="remaining-strip">
          <button v-for="(shot, index) in shotSteps.slice(captured.length, captured.length + 3)" :key="shot.label" type="button" @click="photoIndex = Math.min(captured.length + index, shotSteps.length - 1); go('photo')">
            <span>{{ String(captured.length + index + 1).padStart(2, '0') }}</span><b>{{ shot.label }}</b><small>촬영 코치 보기</small>
          </button>
        </div>
      </section>

      <section v-else-if="screen === 'photo'" class="capture-screen">
        <div class="capture-top">
          <button type="button" aria-label="뒤로" @click="go('home')"><X /></button>
          <div><small>사진 {{ captured.length }}/14</small><b>{{ currentShot.label }}</b></div>
          <button type="button" :class="{ active: guideOn }" aria-label="가이드" @click="guideOn = !guideOn"><ScanLine /></button>
        </div>
        <div class="camera-stage">
          <video v-show="cameraActive" ref="videoRef" muted playsinline />
          <img v-if="!cameraActive" :src="captured.at(-1) || carImages[photoIndex % carImages.length]" alt="촬영 프리뷰" />
          <div class="camera-dim" />
          <div v-if="guideOn" class="guide-frame"><i /><i /><i /><i /><CarFront /></div>
          <div class="coach-toast"><LocateFixed /><div><b>{{ currentShot.coach }}</b><small>{{ currentShot.quality }}</small></div></div>
          <div class="quality-pills"><span><Check />수평 양호</span><span><Check />빛 충분</span></div>
          <div v-if="cameraError" class="camera-error">{{ cameraError }}</div>
        </div>
        <div class="camera-tools">
          <button type="button" :class="{ active: plateBlur }" @click="plateBlur = !plateBlur"><Grid2X2 />번호판 자동 가림</button>
          <div class="zoom-row"><button>0.5</button><button class="active">1×</button><button>2</button></div>
        </div>
        <div class="shot-strip">
          <button v-for="(shot, index) in shotSteps" :key="shot.label" :class="{ done: index < captured.length, active: index === photoIndex }" @click="photoIndex = index">
            <img v-if="captured[index]" :src="captured[index]" alt="" /><span v-else>{{ index + 1 }}</span><small>{{ shot.label }}</small>
          </button>
        </div>
        <div class="capture-controls">
          <button type="button" class="album-button" @click="fileRef?.click()"><ImageIcon /><small>앨범</small></button>
          <button type="button" class="shutter" :aria-label="cameraActive ? '사진 촬영' : '사진 추가'" @click="capturePhoto"><i /></button>
          <button v-if="!cameraActive" type="button" class="camera-on" @click="startCamera"><Camera /><small>카메라</small></button>
          <button v-else type="button" class="camera-on" @click="stopCamera"><X /><small>끄기</small></button>
        </div>
        <button v-if="canFinishPhoto" type="button" class="floating-done" @click="finishPhotos">사진 확인 <ChevronRight /></button>
        <input ref="fileRef" class="visually-hidden" type="file" accept="image/*" capture="environment" @change="importPhoto" />
        <canvas ref="canvasRef" class="visually-hidden" />
      </section>

      <section v-else-if="screen === 'video'" class="capture-screen video-capture">
        <div class="capture-top"><button type="button" aria-label="뒤로" @click="go('home')"><X /></button><div><small>숏폼 코스 1/3</small><b>외관 워크어라운드</b></div><button type="button"><SlidersHorizontal /></button></div>
        <div class="camera-stage">
          <video v-show="cameraActive" ref="videoRef" muted playsinline />
          <img v-if="!cameraActive" :src="carImages[1]" alt="영상 촬영 프리뷰" />
          <div class="camera-dim" />
          <div class="walk-path"><span>START</span><i /><b>차량을 따라 천천히 이동</b><em>END</em></div>
          <div class="coach-toast"><Video /><div><b>차와 2m 거리를 유지하고 15초 동안 이동하세요</b><small>걷는 속도를 일정하게 유지하면 자동 편집 품질이 좋아져요</small></div></div>
          <div v-if="isRecording" class="recording-badge"><i />REC {{ formatTime(recordSeconds) }}</div>
          <div v-if="cameraError" class="camera-error">{{ cameraError }}</div>
        </div>
        <div class="video-steps"><span class="active"><b>1</b>외관</span><i /><span><b>2</b>실내</span><i /><span><b>3</b>옵션</span></div>
        <div class="capture-controls">
          <button type="button" class="album-button"><Upload /><small>불러오기</small></button>
          <button type="button" :class="['shutter', 'is-video', { recording: isRecording }]" @click="toggleRecording"><i /></button>
          <button v-if="!cameraActive" type="button" class="camera-on" @click="startCamera"><Camera /><small>카메라</small></button>
          <button v-else type="button" class="camera-on" @click="stopCamera"><X /><small>끄기</small></button>
        </div>
      </section>

      <section v-else-if="screen === 'tour'" class="screen tour-screen">
        <button class="back-line" type="button" @click="go('home')"><ArrowLeft />프로젝트로</button>
        <div class="tour-copy"><span><Move3D />360° BETA</span><h2>차량을 중심으로<br />8방향을 촬영하세요.</h2><p>촬영 위치를 자동 안내하고 완료 후 회전형 뷰를 만듭니다.</p></div>
        <div class="tour-stage">
          <img :src="carImages[tourCount % carImages.length]" alt="360도 촬영 차량" />
          <div class="tour-ring">
            <i v-for="index in 8" :key="index" :class="{ done: index <= tourCount, next: index === tourCount + 1 }" :style="{ transform: `rotate(${(index - 1) * 45}deg) translateY(-132px)` }"><span>{{ index }}</span></i>
          </div>
          <div class="tour-center"><b>{{ tourCount }}/8</b><small>{{ tourCount < 8 ? '다음 위치로 이동' : '모든 방향 완료' }}</small></div>
        </div>
        <div class="tour-tip"><LocateFixed /><div><b>{{ tourCount < 8 ? `${tourCount + 1}번 위치에서 차량 중앙을 맞춰 주세요` : '촬영이 완료되었습니다' }}</b><small>사이드미러 높이 · 차량과 2.5m 거리</small></div></div>
        <button v-if="tourCount < 8" class="primary-button" type="button" @click="captureTour"><Camera />현재 위치 촬영</button>
        <button v-else class="primary-button" type="button" @click="go('results')"><BadgeCheck />360° 결과 확인</button>
      </section>

      <section v-else-if="screen === 'ai'" class="screen ai-screen">
        <button class="back-line" type="button" @click="go('home')"><ArrowLeft />프로젝트로</button>
        <div class="ai-hero"><span><Sparkles />AUTO STORY</span><h2>촬영본으로 숏폼을<br />자동 구성합니다.</h2><p>실제 차량 정보만 사용하고 확인되지 않은 옵션은 설명에서 제외합니다.</p></div>
        <article class="ai-plan">
          <div class="ai-plan-head"><div><small>추천 구성</small><h3>신뢰형 · 30초</h3></div><button>변경</button></div>
          <ol>
            <li class="done"><span><Check /></span><div><b>차량 촬영본 분석</b><small>외관 5 · 실내 3 · 옵션 2</small></div></li>
            <li :class="{ active: aiRunning || aiReady }"><span><Clapperboard /></span><div><b>스토리보드·자막</b><small>핵심 정보와 장면 순서를 자동 구성</small></div></li>
            <li :class="{ active: aiProgress > 55 }"><span><Sparkles /></span><div><b>내레이션·편집</b><small>가격·주행거리·판매 포인트 음성화</small></div></li>
            <li :class="{ active: aiReady }"><span><BadgeCheck /></span><div><b>왜곡·오탈자 검수</b><small>원본·매물 DB와 자동 대조</small></div></li>
          </ol>
          <div v-if="aiRunning || aiReady" class="ai-progress"><i :style="{ width: `${aiProgress}%` }" /><b>{{ aiReady ? '제작 완료' : `${aiProgress}%` }}</b></div>
        </article>
        <button v-if="!aiReady" class="primary-button" type="button" :disabled="aiRunning" @click="runAi"><WandSparkles />{{ aiRunning ? '자동 제작 중' : 'AI 숏폼 제작 시작' }}</button>
        <button v-else class="primary-button" type="button" @click="go('results')"><Play />완성본 확인</button>
        <p class="safe-note">이 시안은 SNS 게시나 과금을 실행하지 않습니다.</p>
      </section>

      <section v-else-if="screen === 'projects'" class="screen projects-screen">
        <div class="summary-grid"><article><small>진행 중</small><b>3</b></article><article><small>완료</small><b>12</b></article><article><small>이번 주</small><b>8</b></article></div>
        <div class="section-heading"><div><small>내 차량</small><h2>촬영 프로젝트</h2></div><button>필터 <SlidersHorizontal /></button></div>
        <article v-for="(image, index) in carImages.slice(0, 3)" :key="image" class="project-row" @click="go(index === 0 ? 'home' : 'results')">
          <img :src="image" alt="차량 프로젝트" /><div><span>{{ index === 0 ? '진행 중' : '완료' }}</span><h3>{{ ['2021 제네시스 GV80', '2020 BMW 520d', '2022 벤츠 GLE 450'][index] }}</h3><p>{{ index === 0 ? '사진 6/14 · 영상 0/3' : '숏폼 · 사진 · 360° 완료' }}</p></div><ChevronRight />
        </article>
      </section>

      <section v-else-if="screen === 'results'" class="screen result-screen">
        <div class="result-head"><span><BadgeCheck />자동 보정 완료</span><h2>원본을 바꾸지 않고<br />등록용 결과를 만들었어요.</h2><p>슬라이더를 움직여 차이를 확인하세요.</p></div>
        <div class="compare-box">
          <img :src="captured[0] || carImages[0]" alt="촬영 원본" />
          <div class="after-layer" :style="{ clipPath: `inset(0 ${100 - compare}% 0 0)` }"><img :src="captured[0] || carImages[0]" alt="자동 보정 결과" /></div>
          <span class="before-label">원본</span><span class="after-label">자동 보정</span><i class="compare-line" :style="{ left: `${compare}%` }"><b><ArrowLeft /><ChevronRight /></b></i>
          <input v-model.number="compare" type="range" min="8" max="92" aria-label="원본과 자동 보정 비교" />
        </div>
        <div class="result-metrics"><article><Gauge /><div><small>선명도</small><b>+18%</b></div></article><article><Layers3 /><div><small>왜곡 검사</small><b>통과</b></div></article><article><Grid2X2 /><div><small>번호판</small><b>자동 가림</b></div></article></div>
        <article class="short-result"><div class="short-thumb"><img :src="carImages[2]" alt="숏폼 미리보기" /><button type="button"><Play /></button><span>00:30</span></div><div><small>AI 숏폼</small><h3>GV80 3.5T 핵심 리뷰</h3><p>차량 정보 검수 완료 · 9:16</p><button type="button" @click="go('ai')">구성 보기 <ChevronRight /></button></div></article>
      </section>

      <section v-else class="screen settings-screen">
        <div class="settings-hero"><span><Settings />촬영 기본값</span><h2>현장에서는 설정하지 않고<br />바로 촬영하게 합니다.</h2></div>
        <article class="setting-group"><h3>자동 처리</h3><label><span><b>번호판 자동 가림</b><small>촬영과 동시에 후보 영역 표시</small></span><input v-model="plateBlur" type="checkbox" /></label><label><span><b>행동형 촬영 코치</b><small>거리·높이·수평을 문장으로 안내</small></span><input v-model="guideOn" type="checkbox" /></label><label><span><b>원본 보존</b><small>보정 결과와 원본을 각각 저장</small></span><input checked type="checkbox" /></label></article>
        <article class="setting-group"><h3>이 실험판 정보</h3><div class="info-row"><span>주소</span><b>/nuxt-shootkit-lab/</b></div><div class="info-row"><span>기술 스택</span><b>Nuxt 4 · Vue 3 · TypeScript</b></div><div class="info-row"><span>원본 앱 공유</span><b>없음</b></div></article>
      </section>

      <nav v-if="!['photo', 'video'].includes(screen)" class="bottom-nav" aria-label="주요 메뉴">
        <button v-for="item in navItems" :key="item.id" type="button" :class="{ active: screen === item.id || (item.id === 'photo' && screen === 'tour') || (item.id === 'results' && screen === 'ai') }" @click="go(item.id)"><component :is="item.icon" /><span>{{ item.label }}</span></button>
      </nav>
    </main>
  </div>
</template>
