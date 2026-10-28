// 촬영 쇼츠 키트 공통 값 · 형식 · 도움 함수(리액트 ShootRegister.tsx 47~147줄 · 277~280줄 · 2642~2684줄을 그대로 옮김).
import { defaultSticker, type Sticker } from "./image-ops";
import { setCustomGuide, stageGuide, type VideoStage } from "./stages";
import { loadPrefs, type StagePrefs } from "./stage-prefs";
import type { Highlight } from "./shorts";
import { query } from "./site";
import { ENFORCE_REQUIRED, ITEMS, OTHER_ID, PHOTO_MAX, SHOOT, VIDEO_GROUPS, isRequiredItem, levelLabel, stageSec, stepsOf } from "./items";

export const OTHER = OTHER_ID;
export const MAX_PHOTOS = PHOTO_MAX;

export type StageDef = { key: VideoStage; label: string; min: number; max: number; extra?: boolean; custom?: boolean; hint?: string };
/** 기본 단계 = videoStage 그룹(이름 = 그룹 이름, 길이 = videoSec), 추가 단계 = video.extraStages. 바꾸지 않는 기본값 */
export const DEFAULT_DEFS = Object.fromEntries([
  ...VIDEO_GROUPS.map((g) => [g.videoKey!, { key: g.videoKey!, label: g.label, ...stageSec(g) }]),
  ...SHOOT.video.extraStages.map((x) => [x.key, { key: x.key, label: x.label, min: x.min, max: x.max, hint: x.hint, extra: true }]),
]) as Record<string, StageDef>;
/** 지금 쓰는 값 = 기본값 + 이 브라우저에 기억한 시간 설정 + 직접 만든 부위(2026-10-25) */
export const STAGE_DEFS: Record<string, StageDef> = {};
/** 이 브라우저에 기억한 촬영 설정(코스 창에서 바꾸면 setPrefs로 바꾼다) */
export let PREFS: StagePrefs = typeof window === "undefined" ? { custom: [], times: {}, autoStop: true, myCourse: null, target: 0, mode: "easy" } : loadPrefs();
export function applyPrefs(p: StagePrefs) {
  Object.keys(STAGE_DEFS).forEach((k) => delete STAGE_DEFS[k]);
  Object.entries(DEFAULT_DEFS).forEach(([k, d]) => (STAGE_DEFS[k] = { ...d, ...(p.times[k] ?? {}) }));
  p.custom.forEach((c) => {
    STAGE_DEFS[c.key] = { key: c.key, label: c.label, hint: c.hint, extra: true, custom: true, min: p.times[c.key]?.min ?? c.min, max: p.times[c.key]?.max ?? c.max };
    setCustomGuide(c.key, c.hint);
  });
}
applyPrefs(PREFS);
/** 지워진 직접 부위 등 없는 단계도 화면이 깨지지 않게 기본 모양을 돌려준다. */
export const def = (k: VideoStage): StageDef => STAGE_DEFS[k] ?? { key: k, label: "부위", min: 3, max: 15, extra: true };
/** 실내 단계 세부 순서(미리보기 부위별 보기) */
export const INTERIOR_STEPS: { label: string; hand: string }[] = stepsOf("interior");
export const STEP_SEC = 4;
/** 자동 멈춤을 끈 촬영팀 모드의 녹화 상한(초) */
export const HARD_MAX = 120;
export const BASE_STAGES: VideoStage[] = VIDEO_GROUPS.map((g) => g.videoKey!);
export const EXTRA_STAGES: VideoStage[] = SHOOT.video.extraStages.map((x) => x.key);
export const STAGES = BASE_STAGES.map((k) => def(k));
/** 추가 촬영 부위는 기본으로 켠다(2026-10-24 「촬영 부위는 추가해라」). 58과 같은 4단계만 보려면 ?vstage=58 */
export const PLUS = query().get("vstage") !== "58";
/** 사진 칸 레일 순서(그룹 순서대로 펼친 항목 id). 키트는 규칙 화면처럼 우선 4장을 맨 앞에 둔다(2026-10-26 컨설팅: 규칙·레일 순서 통일) */
export const PHOTO_SLOTS: string[] = PLUS
  ? [...ITEMS.filter((i) => isRequiredItem(i.id)), ...ITEMS.filter((i) => !isRequiredItem(i.id))].map((i) => i.id)
  : ITEMS.map((i) => i.id);
/** 필수 4장 강제 여부. 58 재현(&vstage=58)은 예전처럼 늘 강제하고, 키트는 JSON photo.enforceRequired를 따른다(2026-10-25 강제 뺌) */
export const ENFORCE = !PLUS || ENFORCE_REQUIRED;
export const ENF_TEXT = SHOOT.enforcedText;
/** 카메라가 안 켜졌을 때 시험용 대체 그림으로 찍기를 허락할지(2026-10-27 실기 대비: 키트는 ?debug · ?fakecam 일 때만) */
export const ALLOW_FAKE = !PLUS || (typeof window !== "undefined" && /[?&](debug|fakecam)=/.test(window.location.search));
/** 필수 등급 이름: 강제하면 「필수」, 아니면 JSON levelLabels.required(「우선」) */
export const reqLabel = () => (ENFORCE ? ENF_TEXT.levelLabel : levelLabel("required"));
export const MAX_EXTRA = 6;
/** 녹화 전 한 줄 동작 안내(2026-10-26 컨설팅: 「촬영 항목이 맞는지 확인」 대신 할 일을 말한다). 없으면 예시 안내의 첫 문장 */
export const STAGE_DO: Partial<Record<string, string>> = {
  exterior: "차 앞에서 시작해 차 주위를 천천히 한 바퀴 돌아 주세요",
  interior: "계기판부터 뒷좌석까지 천천히 비춰 주세요",
  engine: "보닛을 열고 엔진룸을 천천히 훑어 주세요",
  trunk: "트렁크를 열고 바닥까지 보여 주세요",
};
export const stageDo = (k: VideoStage) => STAGE_DO[k] ?? stageGuide(k).how.split(/(?<=[.요])\s/)[0].replace(/\.$/, "");
/** 촬영 코스(2026-10-24 「촬영 부위 순서를 정하자 · 8개 3개」 · 「흠집표시는 선택」): 차 주위를 걷는 순서대로 정한다. */
export type CourseKey = "basic" | "full" | "quick" | "custom" | "mine";
export const COURSES: { key: Exclude<CourseKey, "custom">; label: string; sub: string; stages: VideoStage[] }[] = [
  // 2026-10-25 컨설팅: 빠른 · 표준 · 상세 3개, 상세에 시트를 넣는다. 쇼츠 길이는 촬영 길이와 따로 15/30/60초로 줄인다.
  // 2026-10-27 컨설팅 7건: 영상으로 보여 줄 가치가 큰 트렁크를 넣고, 엔진룸은 사진으로(또는 직접 더하기)
  { key: "quick", label: "빠른 3단계", sub: "외관 → 실내 → 트렁크 · 엔진룸은 사진으로", stages: ["exterior", "interior", "trunk"] },
  { key: "basic", label: `표준 ${BASE_STAGES.length}단계`, sub: VIDEO_GROUPS.map((g) => g.label).join(" → "), stages: BASE_STAGES },
  { key: "full", label: "상세 9단계", sub: "외관 → 타이어 → 실내 → 시트 → 계기판 → 시동 소리 → 옵션 작동 → 엔진룸 → 트렁크", stages: ["exterior", "tyre", "interior", "seat", "cluster", "start", "feature", "engine", "trunk"] },
];
/** 흠집 표시는 어느 코스든 선택으로 더한다. 바깥을 도는 단계(타이어, 없으면 외관) 바로 뒤에 넣는다. */
export function withDamage(list: VideoStage[], on: boolean): VideoStage[] {
  const base = list.filter((k) => k !== "damage");
  if (!on) return base;
  const at = base.includes("tyre") ? base.indexOf("tyre") + 1 : base.indexOf("exterior") + 1;
  return [...base.slice(0, at), "damage", ...base.slice(at)];
}
export function courseOf(list: VideoStage[]): CourseKey {
  const base = list.filter((k) => k !== "damage").join(",");
  if (PREFS.myCourse && PREFS.myCourse.filter((k) => k !== "damage").join(",") === base) return "mine";
  return COURSES.find((c) => c.stages.join(",") === base)?.key ?? "custom";
}
export const courseLabel = (list: VideoStage[]) => {
  const key = courseOf(list);
  if (key === "mine") return `내 코스 ${list.length}단계`;
  const c = COURSES.find((x) => x.key === key);
  return c ? `${c.label}${list.includes("damage") ? " + 흠집" : ""}` : `직접 고름 ${list.length}단계`;
};
/** 흠집 표시: 흠집 단계 영상의 몇 초에, 화면 어디를 눌렀는지(0~1) */
export type Mark = { t: number; x: number; y: number };

/** raw = 번호판 가림을 굽기 전 원본(키트: 가림을 다시 옮길 수 있게), fromAlbum = 앨범에서 고른 사진(부위 나누기 대상) */
export type Photo = { id: string; src: string; slot: string; sticker?: Sticker; plateOn?: boolean; uploading?: boolean; raw?: string; fromAlbum?: boolean };
/** 번호판이 보이는 각도(정면 · 후면 · 45°)만 촬영 때 가림을 자동으로 붙인다 */
export const PLATE_KINDS = new Set(["front", "rear", "q34"]);
export const platePlace = (): Sticker => ({ ...defaultSticker(), cy: 0.64 });
/** 등록 화면 칸 순서: 촬영 레일 각도 순(기타는 맨 뒤), 같은 각도는 올린 순 */
export const slotOrder = (slot: string) => {
  const i = (PHOTO_SLOTS as readonly string[]).indexOf(slot);
  return i < 0 || slot === OTHER ? PHOTO_SLOTS.length : i;
};
export const sortBySlot = (list: Photo[]) => list.map((p, i) => ({ p, i })).sort((a, b) => slotOrder(a.p.slot) - slotOrder(b.p.slot) || a.i - b.i).map((x) => x.p);
/** 영상: 단계별 파일(segs[i] = 그 단계 영상, 불러온 영상은 한 개) · 단계별 길이(초) · 표지 */
export type Video = { segs: (string | null)[]; durations: number[]; cover: string; uploading: boolean; imported?: boolean; stages?: VideoStage[]; marks?: Mark[]; steps?: number[]; hl?: Highlight[] };
export type Take = { segs: (string | null)[]; durations: number[]; thumbs: string[]; imported?: boolean; stages?: VideoStage[]; marks?: Mark[]; steps?: number[]; hl?: Highlight[] };

let seq = 0;
export const uid = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`;
/** 0:15 처럼 분은 한 자리(영상 화면 아래 시간) */
export const msec = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
export const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

export const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
export const permHelp = () =>
  isStandalone() ? "휴대폰 설정 → 보배드림 촬영 → 카메라를 켜 주세요." : "주소창 옆 자물쇠(설정) 아이콘 → 카메라 → 허용을 눌러 주세요.";

export function readDuration(url: string) {
  return new Promise<number>((resolve) => {
    const v = document.createElement("video");
    let done = false;
    const end = (d: number) => {
      if (done) return;
      done = true;
      v.removeAttribute("src");
      resolve(Number.isFinite(d) && d > 0 ? Math.round(d * 10) / 10 : 0);
    };
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => end(v.duration);
    v.onerror = () => end(0);
    window.setTimeout(() => end(0), 4000);
    v.src = url;
  });
}

/** 장면을 못 뽑았을 때 쓰는 기본 표지(어두운 바탕 + 재생 표시) */
export function plainCover() {
  const c = document.createElement("canvas");
  c.width = 640;
  c.height = 360;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2A2A2A";
  g.fillRect(0, 0, 640, 360);
  g.fillStyle = "rgba(255,255,255,.85)";
  g.beginPath();
  g.moveTo(296, 140);
  g.lineTo(356, 180);
  g.lineTo(296, 220);
  g.closePath();
  g.fill();
  return c.toDataURL("image/jpeg", 0.8);
}

/** 지운 영상의 임시 주소를 풀어 메모리를 돌려준다(2026-10-27 실기 대비). 화면이 바뀐 뒤에 풀도록 조금 늦춘다 */
export function releaseVideo(v: { segs: (string | null)[] } | null) {
  if (!v) return;
  window.setTimeout(() => v.segs.forEach((u) => u && u.startsWith("blob:") && URL.revokeObjectURL(u)), 1500);
}


/** 코스 창에서 설정을 저장하면 여기서 바꾼다(리액트의 `PREFS = prefs` 자리) */
export function setPrefs(p: StagePrefs) {
  PREFS = p;
}
