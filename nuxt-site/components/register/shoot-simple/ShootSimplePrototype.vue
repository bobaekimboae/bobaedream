<script setup lang="ts">
// 리액트 src/prototype/register/shoot-simple/ShootSimplePrototype.tsx 의 Vue 판(?register=shootsimple).
// STAGES · COURSES · Progress · Header 는 리액트 파일에서 export 하지 않아 이 파일에 옮겼다(keep in sync).
import { computed, onBeforeUnmount, onMounted, ref, watch, type Directive } from "vue";
import "@proto/register/shoot-simple/shoot-simple.css";
import CameraIcon from "../../icons/CameraIcon.vue";
import CheckIcon from "../../icons/CheckIcon.vue";
import DownloadIcon from "../../icons/DownloadIcon.vue";
import GearIcon from "../../icons/GearIcon.vue";
import PlayIcon from "../../icons/PlayIcon.vue";
import Share2Icon from "../../icons/Share2Icon.vue";
import ShootSimpleHeader from "./ShootSimpleHeader.vue";
import ShootSimpleProgress from "./ShootSimpleProgress.vue";

type Screen = "course" | "capture" | "review" | "shorts" | "result";
type CourseKey = "quick" | "standard" | "detail";
type Stage = { key: string; label: string; seconds: number; image: string; tip: string };

const base = typeof document === "undefined" ? "/" : new URL(".", document.baseURI).pathname;
const shot = (name: string) => `${base}${["assets", "shoot-templates", name].join("/")}.webp`;

const STAGES: Stage[] = [
  { key: "exterior", label: "차량 외관", seconds: 15, image: shot("ext-1"), tip: "정면에서 시작해 차량을 한 바퀴 천천히 돌아 주세요." },
  { key: "driver", label: "운전석", seconds: 8, image: shot("in-seat"), tip: "문을 열고 시트와 전동 버튼이 함께 보이게 찍어 주세요." },
  { key: "dashboard", label: "대시보드", seconds: 7, image: shot("in-dash"), tip: "핸들부터 화면까지 수평으로 천천히 훑어 주세요." },
  { key: "rear", label: "뒷좌석", seconds: 8, image: shot("in-rear"), tip: "좌우 시트와 레그룸이 한 화면에 보이게 찍어 주세요." },
  { key: "trunk", label: "트렁크", seconds: 6, image: shot("trk-1"), tip: "트렁크를 열고 바닥까지 보이도록 위에서 아래로 찍어 주세요." },
];

const COURSES: { key: CourseKey; label: string; description: string; duration: string; count: number }[] = [
  { key: "quick", label: "빠른 촬영", description: "외관 · 실내 · 트렁크", duration: "약 40초", count: 3 },
  { key: "standard", label: "표준 촬영", description: "매물에 꼭 필요한 5개 부위", duration: "약 1분 10초", count: 5 },
  { key: "detail", label: "상세 촬영", description: "휠 · 엔진룸 · 옵션까지", duration: "약 2분", count: 8 },
];

const screen = ref<Screen>("course");
const course = ref<CourseKey>("standard");
const current = ref(0);
const recording = ref(false);
const captured = ref<string[]>([]);
const toast = ref("");

const selectedCourse = computed(() => COURSES.find((item) => item.key === course.value)!);
const visibleStages = computed<Stage[]>(() => {
  if (course.value === "quick") return [STAGES[0], STAGES[1], STAGES[4]];
  if (course.value === "detail") return [...STAGES, { key: "engine", label: "엔진룸", seconds: 10, image: shot("eng-1"), tip: "보닛을 열고 좌우로 천천히 훑어 주세요." }, { key: "wheel", label: "휠 · 타이어", seconds: 8, image: shot("opt-tyre"), tip: "휠과 타이어 홈이 선명하게 보이도록 가까이 찍어 주세요." }, { key: "feature", label: "옵션 작동", seconds: 12, image: shot("opt-feature-1"), tip: "선루프나 화면이 실제로 작동하는 모습을 담아 주세요." }];
  return STAGES;
});
const stage = computed(() => visibleStages.value[current.value]);
const originalSeconds = computed(() => Math.max(9, captured.value.length * 8));

let previousTitle = "";
onMounted(() => {
  previousTitle = document.title;
  document.title = "보배드림 · 간편 촬영 시안";
  document.documentElement.classList.add("shoot-simple-page");
});
onBeforeUnmount(() => {
  document.title = previousTitle;
  document.documentElement.classList.remove("shoot-simple-page");
});

watch(toast, (value, _old, onCleanup) => {
  if (!value) return;
  const timer = window.setTimeout(() => { toast.value = ""; }, 1800);
  onCleanup(() => window.clearTimeout(timer));
});

const startCourse = () => {
  current.value = 0;
  captured.value = [];
  recording.value = false;
  screen.value = "capture";
};

const finishStage = () => {
  const key = visibleStages.value[current.value].key;
  const nextCaptured = captured.value.includes(key) ? captured.value : [...captured.value, key];
  captured.value = nextCaptured;
  recording.value = false;
  if (current.value < visibleStages.value.length - 1) {
    const label = visibleStages.value[current.value].label;
    current.value = current.value + 1;
    toast.value = `${label} 촬영을 저장했어요`;
  } else {
    screen.value = "review";
  }
};

const goBack = () => {
  if (screen.value === "capture") screen.value = "course";
  else if (screen.value === "review") screen.value = "capture";
  else if (screen.value === "shorts") screen.value = "review";
  else if (screen.value === "result") screen.value = "shorts";
};

const goHistoryBack = () => history.back();

// 리액트 defaultValue(비제어 입력칸). 글자 그대로 value="…"로 쓰면 Vue 가 정적 요소로 복제해 고친 글자가 다음 진입에도 남고,
// :value 로 묶으면 다시 그릴 때마다 처음 값으로 되돌린다 → 처음 그릴 때 한 번만 넣는다(React 와 같이 value 속성도 둠).
const vDefaultValue: Directive<HTMLInputElement, string> = { mounted(el, binding) { el.setAttribute("value", binding.value); el.value = binding.value; } };
const defaults = { name: "BMW M3 컴페티션", price: "11,020만원", hook: "실매물 영상 그대로" };

const continueShooting = () => {
  const firstMissing = visibleStages.value.findIndex((item) => !captured.value.includes(item.key));
  current.value = firstMissing < 0 ? 0 : firstMissing;
  screen.value = "capture";
};
</script>

<template>
  <div class="sc-root">
    <main class="sc-phone">
      <section v-if="screen === 'course'" class="sc-screen sc-course-screen">
        <ShootSimpleHeader title="간편 촬영" close @back="goHistoryBack" />
        <ShootSimpleProgress :step="1" />
        <div class="sc-scroll">
          <div class="sc-intro">
            <span class="sc-eyebrow">보배드림 촬영 도우미</span>
            <h1>누구나 같은 품질로<br>1분 안에 촬영해요</h1>
            <p>코스를 고르면 촬영 순서와 시간을 한 단계씩 안내합니다.</p>
          </div>

          <div class="sc-section-title">
            <div>
              <span>1단계</span>
              <h2>촬영 코스를 골라 주세요</h2>
            </div>
            <button type="button" @click="toast = '직접 구성은 다음 시안에서 연결됩니다'">직접 구성</button>
          </div>

          <div class="sc-course-list" role="radiogroup" aria-label="촬영 코스">
            <button
              v-for="item in COURSES"
              :key="item.key"
              type="button"
              role="radio"
              :aria-checked="course === item.key"
              :class="`sc-course-card ${course === item.key ? 'is-selected' : ''}`"
              @click="course = item.key"
            >
              <span class="sc-radio-dot"><CheckIcon v-if="course === item.key" /></span>
              <span class="sc-course-copy">
                <strong>{{ item.label }}</strong>
                <small>{{ item.description }}</small>
              </span>
              <span class="sc-course-meta"><b>{{ item.count }}단계</b><small>{{ item.duration }}</small></span>
            </button>
          </div>

          <div class="sc-plan-card">
            <div class="sc-plan-head">
              <strong>{{ selectedCourse.label }} 순서</strong>
              <span>{{ selectedCourse.duration }}</span>
            </div>
            <div class="sc-plan-strip">
              <div v-for="(item, index) in visibleStages.slice(0, 5)" :key="item.key" class="sc-plan-item">
                <img :src="item.image" alt="">
                <span>{{ index + 1 }}</span>
                <small>{{ item.label }}</small>
              </div>
            </div>
          </div>
        </div>
        <div class="sc-sticky">
          <button type="button" class="sc-primary" @click="startCourse">{{ selectedCourse.label }} 시작</button>
          <small>촬영한 영상은 기기 안에서만 편집됩니다.</small>
        </div>
      </section>

      <section v-if="screen === 'capture'" class="sc-screen sc-capture-screen">
        <ShootSimpleHeader :title="`${current + 1}/${visibleStages.length} · ${stage.label}`" @back="goBack" />
        <ShootSimpleProgress :step="2" />
        <div class="sc-camera" :style="{ backgroundImage: `url(${stage.image})` }">
          <div class="sc-camera-shade" />
          <div class="sc-camera-topline">
            <span>촬영 안내</span>
            <button type="button" aria-label="촬영 설정" @click="toast = '촬영 설정'"><GearIcon /></button>
          </div>
          <div class="sc-frame-guide" aria-hidden="true" />
          <div class="sc-guide-card">
            <strong>{{ stage.label }}</strong>
            <p>{{ stage.tip }}</p>
            <span>권장 {{ stage.seconds }}초</span>
          </div>
        </div>
        <div class="sc-capture-controls">
          <div class="sc-stage-state">
            <strong>{{ recording ? "촬영 중" : captured.includes(stage.key) ? "촬영 완료" : "준비됐어요" }}</strong>
            <span>{{ recording ? "차량을 천천히 보여 주세요" : "버튼을 누르면 바로 시작합니다" }}</span>
          </div>
          <button
            type="button"
            :class="`sc-record ${recording ? 'is-recording' : ''}`"
            @click="recording ? finishStage() : (recording = true)"
          >
            <span><CameraIcon /></span>{{ recording ? "촬영 완료" : captured.includes(stage.key) ? "다시 촬영" : "촬영 시작" }}
          </button>
          <button type="button" class="sc-text-button" @click="screen = 'review'">현재까지 촬영 확인</button>
        </div>
      </section>

      <section v-if="screen === 'review'" class="sc-screen sc-review-screen">
        <ShootSimpleHeader title="촬영 확인" @back="goBack" />
        <ShootSimpleProgress :step="3" />
        <div class="sc-scroll sc-review-body">
          <div class="sc-review-summary">
            <span class="sc-summary-icon"><CheckIcon /></span>
            <div>
              <strong>{{ captured.length }}개 단계 촬영 완료</strong>
              <p>{{ visibleStages.length - captured.length > 0 ? `${visibleStages.length - captured.length}개 단계가 아직 남아 있어요.` : "필요한 장면을 모두 촬영했어요." }}</p>
            </div>
          </div>
          <div class="sc-review-list">
            <button v-for="(item, index) in visibleStages" :key="item.key" type="button" @click="current = index; screen = 'capture'">
              <img :src="item.image" alt="">
              <span class="sc-review-copy"><strong>{{ item.label }}</strong><small>{{ captured.includes(item.key) ? `${item.seconds}초 · 촬영 완료` : "촬영 필요" }}</small></span>
              <span :class="`sc-status ${captured.includes(item.key) ? 'is-done' : ''}`"><CheckIcon v-if="captured.includes(item.key)" /><template v-else>{{ `${index + 1}` }}</template></span>
            </button>
          </div>
        </div>
        <div class="sc-sticky sc-review-actions">
          <button v-if="captured.length < visibleStages.length" type="button" class="sc-secondary" @click="continueShooting">계속 촬영</button>
          <button type="button" class="sc-primary" @click="screen = 'shorts'">현재 영상으로 쇼츠 만들기</button>
        </div>
      </section>

      <section v-if="screen === 'shorts'" class="sc-screen sc-shorts-screen">
        <ShootSimpleHeader title="쇼츠 자동 구성" @back="goBack" />
        <ShootSimpleProgress :step="4" />
        <div class="sc-scroll sc-shorts-body">
          <div class="sc-preview-card" :style="{ backgroundImage: `url(${STAGES[0].image})` }">
            <button type="button" aria-label="미리보기 재생"><PlayIcon /></button>
            <div><span>보배드림 실매물</span><strong>BMW M3 실사용 후기</strong><small>외관 · 실내 · 주요 옵션</small></div>
          </div>
          <div class="sc-form-section">
            <h2>영상 길이</h2>
            <div class="sc-choice-row" role="radiogroup" aria-label="영상 길이">
              <button type="button" role="radio" aria-checked="true" class="is-on">원본 {{ originalSeconds }}초</button>
              <button type="button" role="radio" aria-checked="false">15초</button>
              <button type="button" role="radio" aria-checked="false" :disabled="captured.length < 4">30초</button>
            </div>
          </div>
          <div class="sc-form-section">
            <div class="sc-form-title"><h2>매물 정보</h2><span>자동 입력</span></div>
            <label>차량명<input v-default-value="defaults.name"></label>
            <label>가격<input v-default-value="defaults.price"></label>
            <label>첫 화면 문구 <small>선택</small><input v-default-value="defaults.hook"></label>
          </div>
          <p class="sc-safety-copy">자막에는 직접 확인한 정보만 사용됩니다. 사고·정비 이력은 자동으로 만들지 않습니다.</p>
        </div>
        <div class="sc-sticky">
          <button type="button" class="sc-primary" @click="screen = 'result'">쇼츠 미리보기 만들기</button>
        </div>
      </section>

      <section v-if="screen === 'result'" class="sc-screen sc-result-screen">
        <ShootSimpleHeader title="쇼츠 완성" @back="goBack" />
        <div class="sc-scroll sc-result-body">
          <div class="sc-result-mark"><CheckIcon /></div>
          <h1>쇼츠가 완성됐어요</h1>
          <p>저장한 뒤 인스타그램·유튜브·틱톡에 바로 올릴 수 있습니다.</p>
          <div class="sc-result-video" :style="{ backgroundImage: `url(${STAGES[0].image})` }">
            <button type="button" aria-label="완성 영상 재생"><PlayIcon /></button>
            <div><small>보배드림 실매물</small><strong>BMW M3 컴페티션</strong><span>0:{{ originalSeconds.toString().padStart(2, "0") }}</span></div>
          </div>
          <button type="button" class="sc-primary sc-save" @click="toast = '시안에서는 실제 파일을 저장하지 않습니다'"><DownloadIcon /> 내 폰에 저장</button>
          <button type="button" class="sc-secondary sc-share" @click="toast = '공유 앱 선택 화면을 여는 자리입니다'"><Share2Icon /> 다른 앱으로 공유</button>
          <button type="button" class="sc-text-button" @click="screen = 'shorts'">다시 고치기</button>
        </div>
      </section>

      <div v-if="toast" class="sc-toast" role="status">{{ toast }}</div>
    </main>
  </div>
</template>
