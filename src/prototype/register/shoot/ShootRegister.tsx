// 58同城 二手车发布(중고차 등록) 사진·영상 촬영 흐름 재현(2026-10-24 폰 실측, run4 캡처 s01~z06).
// ?register=shoot 으로 연다. 실제 등록·업로드 요청은 보내지 않는다(「등록하기」는 안내만).
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent, type RefObject } from "react";
import shootCss from "./shoot.css?inline";
import { useInlineCss } from "./use-inline-css";
import { extractFrames, fakeStream, grabFrame, pickRecorderType, useCamera } from "./camera";
import {
  applyMosaic,
  bakeSticker,
  crop,
  defaultSticker,
  drawStickerFace,
  loadImage,
  normalize,
  pixelate,
  placeholderShot,
  renderMosaic,
  rotate,
  STICKER_ASPECT,
  type Sticker,
  type Stroke,
} from "./image-ops";
import { playShutter, primeSound } from "./sound";
import { GUIDE_ON, ShotGuide } from "./guides";
import { makeMp4, mp4Name, saveToDevice } from "./save-mp4";
import { RuleIllustration, STAGE_GUIDE, StageTemplate, stageThumb, type VideoStage } from "./templates";
import { GROUPS, ITEMS, OTHER_ID, PHOTO_MAX, PHOTO_MIN, RECOMMENDED_IDS, REQUIRED_IDS, SHOOT, VIDEO_GROUPS, isRequiredItem, itemLabel, itemLevel, itemOf, levelLabel, stageSec } from "./items";
import ShortformStudio from "./ShortformStudio";

const base = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.baseURI).pathname;
const icon = (dir: string, name: string) => `${base}icons/${dir}/${name}`;
const rd = (n: string) => icon("reddit-shoot", `${n}.svg`);

/** 바텀시트/전체화면 대화상자의 초점을 내부에 가두고, 닫힌 뒤 원래 위치로 돌려준다. */
function useDialogFocus(onClose: () => void, initialSelector = "button:not(:disabled), input:not(:disabled)") {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const timer = window.requestAnimationFrame(() => {
      ref.current?.querySelector<HTMLElement>(initialSelector)?.focus();
    });
    return () => {
      window.cancelAnimationFrame(timer);
      previous?.focus();
    };
  }, [initialSelector]);
  const onKeyDown = (e: RKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = [...(ref.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled), [href], [tabindex]:not([tabindex='-1'])") ?? [])]
      .filter((el) => !el.closest("[aria-hidden='true']"));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };
  return { ref, onKeyDown };
}

// ── 데이터 ─────────────────────────────────────────────
// 촬영 항목(규칙 · 사진 칸 · 영상 단계)은 모두 src/prototype/data/shoot-items.json 에서 읽는다(items.ts).
const OTHER = OTHER_ID;
/** 사진 칸 레일 순서(그룹 순서대로 펼친 항목 id) */
const PHOTO_SLOTS: string[] = ITEMS.map((i) => i.id);
const MAX_PHOTOS = PHOTO_MAX;

type StageDef = { key: VideoStage; label: string; min: number; max: number; extra?: boolean };
/** 기본·추가 단계는 shoot-items.json을 기준으로 하고, 코스 편집에서 분리한 실내 부위만 확장한다. */
const STAGE_DEFS = Object.fromEntries([
  ...VIDEO_GROUPS.map((g) => [g.videoKey!, { key: g.videoKey!, label: g.label, ...stageSec(g) }]),
  ...SHOOT.video.extraStages.map((x) => [x.key, { ...x, extra: true }]),
  ["driverSeat", { key: "driverSeat", label: "운전석 시트", min: 4, max: 15 }],
  ["passengerSeat", { key: "passengerSeat", label: "조수석 시트", min: 4, max: 15 }],
  ["dashboard", { key: "dashboard", label: "대시보드", min: 4, max: 15 }],
  ["rearSeat", { key: "rearSeat", label: "뒷좌석", min: 4, max: 15 }],
  ["custom", { key: "custom", label: "직접 추가 부위", min: 3, max: 30, extra: true }],
]) as Record<VideoStage, StageDef>;
/** 실내 단계 세부 순서와 손 안내(인스타 @nasserhessien 실내 촬영 순서). 한 부위 약 3.5초, 「다음 부위」로 넘길 수 있다. */
const INTERIOR_STEPS: { label: string; hand: string }[] = VIDEO_GROUPS.find((g) => g.videoKey === "interior")?.videoSteps ?? [];
const STEP_SEC = 4;
const BASE_STAGES: VideoStage[] = VIDEO_GROUPS.map((g) => g.videoKey!);
const EXTRA_STAGES: VideoStage[] = SHOOT.video.extraStages.map((x) => x.key);
const STAGES = BASE_STAGES.map((k) => STAGE_DEFS[k]);
/** 추가 촬영 부위는 기본으로 켠다(2026-10-24 「촬영 부위는 추가해라」). 58과 같은 4단계만 보려면 ?vstage=58 */
const PLUS = typeof window === "undefined" || new URLSearchParams(window.location.search).get("vstage") !== "58";
const MAX_EXTRA = 4;
/** 촬영 코스(2026-10-24 「촬영 부위 순서를 정하자 · 8개 3개」 · 「흠집표시는 선택」): 차 주위를 걷는 순서대로 정한다. */
type CourseKey = "basic" | "full" | "quick" | "custom";
const COURSES: { key: Exclude<CourseKey, "custom">; label: string; sub: string; stages: VideoStage[] }[] = [
  { key: "full", label: "정밀 8단계", sub: "바깥 한 바퀴 → 문 열고 실내 → 시동 → 보닛 → 트렁크", stages: ["exterior", "tyre", "interior", "cluster", "start", "feature", "engine", "trunk"] },
  { key: "basic", label: `기본 ${BASE_STAGES.length}단계`, sub: VIDEO_GROUPS.map((g) => g.label).join(" → "), stages: BASE_STAGES },
  { key: "quick", label: "빠른 3단계", sub: "숏폼 한 편 길이 · 트렁크는 사진으로", stages: ["exterior", "interior", "engine"] },
];
/** 흠집 표시는 어느 코스든 선택으로 더한다. 바깥을 도는 단계(타이어, 없으면 외관) 바로 뒤에 넣는다. */
function withDamage(list: VideoStage[], on: boolean): VideoStage[] {
  const base = list.filter((k) => k !== "damage");
  if (!on) return base;
  const at = base.includes("tyre") ? base.indexOf("tyre") + 1 : base.indexOf("exterior") + 1;
  return [...base.slice(0, at), "damage", ...base.slice(at)];
}
function courseOf(list: VideoStage[]): CourseKey {
  const base = list.filter((k) => k !== "damage").join(",");
  return COURSES.find((c) => c.stages.join(",") === base)?.key ?? "custom";
}
const courseLabel = (list: VideoStage[]) => {
  const c = COURSES.find((x) => x.key === courseOf(list));
  return c ? `${c.label}${list.includes("damage") ? " + 흠집" : ""}` : `직접 고름 ${list.length}단계`;
};
/** 흠집 표시: 흠집 단계 영상의 몇 초에, 화면 어디를 눌렀는지(0~1) */
type Mark = { t: number; x: number; y: number };
type VideoPlanItem = { id: string; key: VideoStage; label: string; target: number; custom?: boolean };

const planId = (key: VideoStage, i: number) => `${key}-${i}-${Date.now().toString(36)}`;
const makePlan = (stages: VideoStage[]): VideoPlanItem[] =>
  stages.map((key, i) => ({ id: planId(key, i), key, label: STAGE_DEFS[key].label, target: STAGE_DEFS[key].max }));
const planDef = (item: VideoPlanItem): StageDef => ({
  ...STAGE_DEFS[item.key],
  label: item.label,
  min: Math.min(STAGE_DEFS[item.key].min, Math.max(2, item.target - 2)),
  max: item.target,
});
const DEFAULT_PLAN: VideoPlanItem[] = [
  { id: "exterior", key: "exterior", label: "차량 외관", target: 15 },
  { id: "driver-seat", key: "driverSeat", label: "운전석 시트", target: 8 },
  { id: "passenger-seat", key: "passengerSeat", label: "조수석 시트", target: 8 },
  { id: "dashboard", key: "dashboard", label: "대시보드", target: 6 },
  { id: "rear-seat", key: "rearSeat", label: "뒷좌석", target: 8 },
  { id: "trunk", key: "trunk", label: "트렁크", target: 6 },
];

type Photo = { id: string; src: string; slot: string; sticker?: Sticker; plateOn?: boolean; uploading?: boolean };
/** 등록 화면 칸 순서: 촬영 레일 각도 순(기타는 맨 뒤), 같은 각도는 올린 순 */
const slotOrder = (slot: string) => {
  const i = (PHOTO_SLOTS as readonly string[]).indexOf(slot);
  return i < 0 || slot === OTHER ? PHOTO_SLOTS.length : i;
};
const sortBySlot = (list: Photo[]) => list.map((p, i) => ({ p, i })).sort((a, b) => slotOrder(a.p.slot) - slotOrder(b.p.slot) || a.i - b.i).map((x) => x.p);
/** 영상: 단계별 파일(segs[i] = 그 단계 영상, 불러온 영상은 한 개) · 단계별 길이(초) · 표지 */
type Video = { segs: (string | null)[]; durations: number[]; cover: string; uploading: boolean; imported?: boolean; stages?: VideoStage[]; plan?: VideoPlanItem[]; marks?: Mark[]; steps?: number[] };
type Take = { segs: (string | null)[]; durations: number[]; thumbs: string[]; imported?: boolean; stages?: VideoStage[]; plan?: VideoPlanItem[]; marks?: Mark[]; steps?: number[] };

let seq = 0;
const uid = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`;
/** 0:15 처럼 분은 한 자리(영상 화면 아래 시간) */
const msec = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

// ── 공통 조각 ───────────────────────────────────────────
function Mask({ src, className }: { src: string; className?: string }) {
  return <span className={`shoot-mask ${className ?? ""}`} style={{ WebkitMaskImage: `url("${src}")`, maskImage: `url("${src}")` }} aria-hidden="true" />;
}

function Toast({ text }: { text: string }) {
  if (!text) return null;
  return (
    <div className="shoot-toast" role="status">
      {text}
    </div>
  );
}

function Confirm({ text, onCancel, onOk, cancelText = "취소", okText = "확인", onDim }: { text: string; onCancel: () => void; onOk: () => void; cancelText?: string; okText?: string; onDim?: () => void }) {
  return (
    <div className="shoot-dim" role="presentation" onClick={onDim ?? onCancel}>
      <div className="shoot-confirm" role="alertdialog" aria-modal="true" aria-labelledby="shoot-confirm-t" onClick={(e) => e.stopPropagation()}>
        <strong id="shoot-confirm-t">안내</strong>
        <p>{text}</p>
        <div className="shoot-confirm__row">
          <button type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" className="is-ok" onClick={onOk} autoFocus>
            {okText}
          </button>
        </div>
      </div>
    </div>
  );
}

function Corners() {
  return (
    <>
      <i className="shoot-corner is-tl" />
      <i className="shoot-corner is-tr" />
      <i className="shoot-corner is-bl" />
      <i className="shoot-corner is-br" />
    </>
  );
}

/** 촬영 화면 아래 「촬영 · 앨범」 탭(흰 밑줄) */
function ModeTabs({ mode, onChange, hideAlbum, labels }: { mode: "cam" | "album"; onChange: (m: "cam" | "album") => void; hideAlbum?: boolean; labels: [string, string] }) {
  return (
    <div className="shoot-modes" role="tablist">
      <button type="button" role="tab" aria-selected={mode === "cam"} className={mode === "cam" ? "is-on" : ""} onClick={() => onChange("cam")}>
        {labels[0]}
      </button>
      {hideAlbum ? null : (
        <button type="button" role="tab" aria-selected={mode === "album"} className={mode === "album" ? "is-on" : ""} onClick={() => onChange("album")}>
          {labels[1]}
        </button>
      )}
      
    </div>
  );
}

/** 좌우로 밀어 탭 바꾸기(58은 촬영↔앨범이 옆으로 넘기는 화면) */
function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);
  return {
    onPointerDown: (e: RPointerEvent) => {
      start.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e: RPointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dx = e.clientX - s.x;
      if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(e.clientY - s.y) * 1.5) (dx < 0 ? onLeft : onRight)();
    },
  };
}

function LiveVideo({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.srcObject = stream;
    if (stream) void v.play().catch(() => undefined);
  }, [stream]);
  return <video ref={ref} className="shoot-live" muted playsInline autoPlay />;
}

type FrameQuality = { kind: "ready" | "warn" | "waiting"; text: string };

/** 휴대폰 카메라 프레임을 서버 전송 없이 현장에서 가볍게 검사한다. */
function useFrameQuality(stream: MediaStream | null, host: RefObject<HTMLDivElement | null>): FrameQuality {
  const [quality, setQuality] = useState<FrameQuality>({ kind: "waiting", text: "차량을 윤곽선 안에 맞춰 주세요" });
  useEffect(() => {
    if (!stream) {
      setQuality({ kind: "waiting", text: "차량을 윤곽선 안에 맞춰 주세요" });
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 36;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    const check = () => {
      const video = host.current?.querySelector("video");
      if (!video || video.readyState < 2) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let light = 0;
      let edge = 0;
      let prev = 0;
      for (let i = 0; i < px.length; i += 4) {
        const y = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
        light += y;
        if (i > 0) edge += Math.abs(y - prev);
        prev = y;
      }
      const n = px.length / 4;
      const avg = light / n;
      const detail = edge / Math.max(1, n - 1);
      if (avg < 45) setQuality({ kind: "warn", text: "주변이 어두워요. 밝은 곳으로 이동해 주세요" });
      else if (avg > 220) setQuality({ kind: "warn", text: "빛이 너무 강해요. 역광을 피해 주세요" });
      else if (detail < 7) setQuality({ kind: "warn", text: "화면이 흐려요. 휴대폰을 잠시 고정해 주세요" });
      else setQuality({ kind: "ready", text: "밝기와 선명도가 좋아요" });
    };
    check();
    const timer = window.setInterval(check, 700);
    return () => window.clearInterval(timer);
  }, [host, stream]);
  return quality;
}

// ── 사진 촬영 + 앨범 ───────────────────────────────────
/** 플래시 켜기/끄기(영상 촬영 화면과 같은 버튼) */
function FlashToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button type="button" className={`shoot-icon-btn shoot-flash ${on ? "is-on" : ""}`} aria-pressed={on} aria-label={on ? "플래시 끄기" : "플래시 켜기"} onClick={onToggle}>
      <Mask src={rd(on ? "powerup-fill" : "powerup-outline")} />
    </button>
  );
}
/** 사진 카운터: 필수와 전체를 함께(「필수 2/4 · 전체 5/30」) 보여 줘 숫자의 뜻이 바뀌지 않게 한다 */
function PhotoCounter({ required, total }: { required: number; total: number }) {
  const ok = required >= PHOTO_MIN;
  return (
    <span className={`shoot-photo-count ${ok ? "is-ok" : ""}`} aria-label={`필수 ${Math.min(required, PHOTO_MIN)}/${PHOTO_MIN}장, 전체 ${total}/${MAX_PHOTOS}장`}>
      <b>필수 {Math.min(required, PHOTO_MIN)}/{PHOTO_MIN}</b>
      <small>전체 {total}/{MAX_PHOTOS}</small>
    </span>
  );
}
/** 카메라가 안 켜졌을 때 안내(실서비스용 권한 안내. 카메라가 없는 기기에서는 시안용 대체 화면으로 계속 찍을 수 있다) */
function NoCam({ denied }: { denied: boolean }) {
  return denied ? (
    <div className="shoot-nocam">
      카메라 권한을 허용해 주세요
      <small>주소창 옆 자물쇠(설정) 아이콘 → 카메라 → 허용을 눌러 주세요. 앱에서는 휴대폰 설정 → 보배드림 → 카메라를 켜 주세요.</small>
    </div>
  ) : (
    <div className="shoot-nocam">
      카메라를 켜는 중이에요
      <small>카메라 사용을 물으면 「허용」을 눌러 주세요</small>
    </div>
  );
}
type CamSession = { shots: Photo[]; picked: string[]; imported: Photo[] };

function PhotoCapture({
  existing,
  startMode,
  onClose,
  onDone,
  notify,
}: {
  existing: Photo[];
  startMode: "cam" | "album";
  onClose: () => void;
  onDone: (added: Photo[]) => void;
  notify: (t: string) => void;
}) {
  const [mode, setMode] = useState<"cam" | "album">(startMode);
  const cam = useCamera(mode === "cam", false);
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (cam.torchSupported) cam.setTorch(flash);
  }, [flash, cam]);
  const videoRef = useRef<HTMLDivElement>(null);
  const [plate, setPlate] = useState(false);
  const [guide, setGuide] = useState(GUIDE_ON);
  const [session, setSession] = useState<CamSession>({ shots: [], picked: [], imported: [] });
  const filledByMain = useMemo(() => new Set(existing.map((p) => p.slot)), [existing]);
  // 이미 채운 각도는 레일에서 빠진다(다시 열면 「정면」부터 시작 확인).
  const initialRail = useMemo(() => {
    const names: string[] = [];
    let otherSkip = existing.filter((p) => p.slot === OTHER).length;
    for (const s of PHOTO_SLOTS) {
      if (s === OTHER) {
        if (otherSkip > 0) {
          otherSkip -= 1;
          continue;
        }
        names.push(s);
      } else if (!filledByMain.has(s)) names.push(s);
    }
    return names;
  }, [existing, filledByMain]);
  const [rail, setRail] = useState<string[]>(initialRail);
  const [slotShots, setSlotShots] = useState<(Photo | null)[]>(() => initialRail.map(() => null));
  const [sel, setSel] = useState(0);
  const railEl = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const total = existing.length + session.picked.length;
  // 필수 칸 채움 수: 메인에 이미 있는 사진 + 이번에 찍어 고른 사진의 필수 항목(중복 제외)
  const requiredNow = useMemo(() => {
    const picked = new Set(session.picked);
    const got = new Set([...existing, ...session.shots.filter((p) => picked.has(p.id))].map((p) => p.slot).filter(isRequiredItem));
    return got.size;
  }, [existing, session]);
  const quality = useFrameQuality(cam.stream, videoRef);
  const swipe = useSwipe(
    () => setMode("album"),
    () => setMode("cam"),
  );

  useEffect(() => {
    const el = railEl.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`);
    el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [sel]);
  // 칸 줄 오른쪽 밖에 남은 필수 빈 칸 수(「+N」 표시). 누르면 그 칸으로 이동한다.
  const [hiddenReq, setHiddenReq] = useState<number[]>([]);
  useEffect(() => {
    const el = railEl.current;
    if (!el) return undefined;
    const measure = () => {
      const right = el.getBoundingClientRect().right;
      const out: number[] = [];
      el.querySelectorAll<HTMLElement>(".shoot-slot.is-required:not(.is-shot)").forEach((n) => {
        if (n.getBoundingClientRect().right > right + 1) out.push(Number(n.dataset.i));
      });
      setHiddenReq((prev) => (prev.join() === out.join() ? prev : out));
    };
    measure();
    el.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", measure);
    return () => {
      el.removeEventListener("scroll", measure);
      window.removeEventListener("resize", measure);
    };
  }, [rail, slotShots, mode]);

  const shoot = () => {
    if (total >= MAX_PHOTOS) {
      notify(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`);
      return;
    }
    const video = videoRef.current?.querySelector("video");
    const label = rail[sel] ?? OTHER;
    const src = (video && cam.stream && grabFrame(video)) || placeholderShot(itemLabel(label), session.shots.length + existing.length);
    playShutter();
    const shot: Photo = { id: uid(), src, slot: label, plateOn: plate };
    setSession((s) => ({ ...s, shots: [shot, ...s.shots], picked: [...s.picked, shot.id] }));
    setSlotShots((prev) => {
      const next = [...prev];
      if (sel >= next.length) next.push(shot);
      else next[sel] = shot;
      // 다음 빈 칸으로. 빈 칸이 없으면 「기타」 칸을 하나 더 만든다.
      let n = next.findIndex((p, i) => !p && i > sel);
      if (n < 0) n = next.findIndex((p) => !p);
      if (n < 0) {
        n = next.length;
        setRail((r) => [...r, OTHER]);
        next.push(null);
      }
      setSel(n);
      return next;
    });
  };

  const removeSlotShot = (i: number) => {
    const shot = slotShots[i];
    if (!shot) return;
    setSlotShots((prev) => prev.map((p, k) => (k === i ? null : p)));
    setSession((s) => ({ ...s, shots: s.shots.filter((p) => p.id !== shot.id), picked: s.picked.filter((id) => id !== shot.id) }));
    setSel(i);
  };

  const albumItems = [...session.shots, ...session.imported];
  const togglePick = (id: string) => {
    setSession((s) => {
      if (s.picked.includes(id)) return { ...s, picked: s.picked.filter((x) => x !== id) };
      if (existing.length + s.picked.length >= MAX_PHOTOS) {
        notify(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`);
        return s;
      }
      return { ...s, picked: [...s.picked, id] };
    });
  };

  const importFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = await Promise.all(
      Array.from(files).map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(String(r.result));
            r.readAsDataURL(f);
          }),
      ),
    );
    const photos: Photo[] = [];
    for (const src of list) photos.push({ id: uid(), src: await normalize(src), slot: OTHER });
    setSession((s) => {
      const room = MAX_PHOTOS - existing.length - s.picked.length;
      if (photos.length > room) notify(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`);
      return { ...s, imported: [...photos, ...s.imported], picked: [...s.picked, ...photos.slice(0, Math.max(0, room)).map((p) => p.id)] };
    });
  };

  const done = () => {
    const byId = new Map(albumItems.map((p) => [p.id, p]));
    onDone(session.picked.map((id) => byId.get(id)).filter((p): p is Photo => Boolean(p)));
  };

  return (
    <div className="shoot-layer shoot-capture" {...swipe}>
      <div className="shoot-rotate-hint" role="status">
        <Mask src={rd("rotate-image-outline")} />
        휴대폰을 세로로 들어 주세요
      </div>
      <header className="shoot-top">
        <button type="button" className="shoot-icon-btn" aria-label="닫기" onClick={onClose}>
          <Mask src={rd("close-outline")} />
        </button>
        {mode === "cam" ? (
          <h2>사진 촬영</h2>
        ) : (
          <h2 className="shoot-album-title">
            내 앨범 <Mask src={rd("caret-down-fill")} className="is-caret" />
          </h2>
        )}
        {/* 2026-10-25: 빈 자리에 영상 화면과 같은 플래시 버튼. 윤곽선 시안(?guide=on)에서는 그 왼쪽에 켜고 끄는 버튼을 함께 둔다. */}
        {mode === "cam" ? (
          <span className="shoot-top__right">
            {GUIDE_ON ? (
              <button type="button" className={`shoot-guide-toggle ${guide ? "is-on" : ""}`} aria-pressed={guide} onClick={() => setGuide((v) => !v)}>
                윤곽선
              </button>
            ) : null}
            <FlashToggle on={flash} onToggle={() => setFlash((v) => !v)} />
          </span>
        ) : (
          <span className="shoot-icon-btn" />
        )}
      </header>

      {mode === "cam" ? (
        <>
          <div className="shoot-view" ref={videoRef}>
            {cam.stream ? <LiveVideo stream={cam.stream} /> : <NoCam denied={cam.error === "denied"} />}
            {guide ? <ShotGuide slot={rail[sel] ?? OTHER} /> : null}
            <span className="shoot-pill">{`${itemLabel(rail[sel] ?? OTHER)}${(rail[sel] ?? OTHER) === OTHER ? " 사진" : ""} 촬영`}</span>
            <div className={`shoot-quality is-${quality.kind}`} role="status">
              <i />
              {quality.text}
            </div>
            <div className="shoot-rail" ref={railEl}>
              {[...rail.keys()].map((i) => {
                const shot = slotShots[i];
                const it = itemOf(rail[i]);
                const req = isRequiredItem(it.id);
                // 첫 칸(대표 사진): 왼쪽 위 「대표」 딱지(JSON note).
                const note = it.note && i === 0 ? it.note : "";
                return (
                  <div key={i} data-i={i} className={`shoot-slot ${i === sel ? "is-sel" : ""} ${req ? "is-required" : ""} ${shot ? "is-shot" : ""}`}>
                    <button type="button" className="shoot-slot__hit" onClick={() => setSel(i)} aria-label={`${it.label}${req ? " (필수)" : ""} 칸 선택`}>
                      {shot ? <img src={shot.src} alt="" /> : null}
                      <span className="shoot-slot__label">{it.label}</span>
                    </button>
                    {note ? <em className="shoot-slot__tag">{note}</em> : null}
                    {req && !shot ? <i className="shoot-slot__req" aria-hidden="true" /> : null}
                    {shot ? (
                      <button type="button" className="shoot-slot__x" aria-label={`${it.label} 사진 지우기`} onClick={() => removeSlotShot(i)}>
                        <Mask src={rd("close-outline")} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {hiddenReq.length ? (
              <button type="button" className="shoot-rail-more" aria-label={`오른쪽에 필수 칸 ${hiddenReq.length}개 더 있어요`} onClick={() => setSel(hiddenReq[0])}>
                +{hiddenReq.length}
              </button>
            ) : null}
          </div>
          <div className="shoot-bottom">
            <div className="shoot-controls">
              <button type="button" className={`shoot-plate ${plate ? "is-on" : ""}`} aria-pressed={plate} onClick={() => setPlate((v) => !v)}>
                <span className="shoot-plate__ico" aria-hidden="true">
                  <i />
                  <i />
                </span>
                번호판 가리기
              </button>
              <button type="button" className="shoot-shutter" aria-label="사진 찍기" onClick={shoot}>
                <span />
              </button>
              <div className="shoot-count">
                <PhotoCounter required={requiredNow} total={total} />
                <button type="button" className="shoot-done" onClick={done}>
                  사진 사용
                </button>
              </div>
            </div>
            <ModeTabs mode={mode} onChange={setMode} labels={["촬영", "앨범"]} />
          </div>
        </>
      ) : (
        <>
          <div className="shoot-album-banner">우선 업로드 각도: {REQUIRED_IDS.map(itemLabel).join(" | ")}</div>
          <div className="shoot-album-grid">
            <button type="button" className="shoot-album-import" onClick={() => fileRef.current?.click()}>
              <Mask src={rd("image-post-outline")} />
              휴대폰 사진
              <br />
              불러오기
            </button>
            {albumItems.map((p) => {
              const on = session.picked.includes(p.id);
              return (
                <button type="button" key={p.id} className={`shoot-album-cell ${on ? "is-on" : ""}`} aria-pressed={on} onClick={() => togglePick(p.id)}>
                  <img src={p.src} alt="" />
                  <span className="shoot-album-check">{on ? <Mask src={rd("checkmark-fill")} /> : null}</span>
                </button>
              );
            })}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => void importFiles(e.target.files)} />
          <div className="shoot-bottom is-album">
            <ModeTabs mode={mode} onChange={setMode} labels={["촬영", "앨범"]} />
            <span className="shoot-album-count">
              <PhotoCounter required={requiredNow} total={total} />
            </span>
            {session.picked.length ? (
              <button type="button" className="shoot-done shoot-album-done" onClick={done}>
                선택 완료
              </button>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}

// ── 사진 미리보기·편집 ─────────────────────────────────
type EditTool = null | "mosaic" | "rotate" | "crop";

function StickerBox({ sticker, onChange, frame }: { sticker: Sticker; onChange: (s: Sticker) => void; frame: { w: number; h: number } }) {
  const [active, setActive] = useState(true);
  const drag = useRef<null | { kind: "move" | "scale" | "rotate"; sx: number; sy: number; s0: Sticker; cx: number; cy: number }>(null);
  const w = sticker.w * frame.w;
  const h = w / STICKER_ASPECT;
  const left = sticker.cx * frame.w;
  const top = sticker.cy * frame.h;

  const start = (kind: "move" | "scale" | "rotate") => (e: RPointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const box = (e.currentTarget as HTMLElement).closest(".shoot-stage-img")!.getBoundingClientRect();
    drag.current = { kind, sx: e.clientX, sy: e.clientY, s0: sticker, cx: box.left + left, cy: box.top + top };
    if (kind === "move") setActive(true);
  };
  const move = (e: RPointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.kind === "move") {
      const nx = d.s0.cx + (e.clientX - d.sx) / frame.w;
      const ny = d.s0.cy + (e.clientY - d.sy) / frame.h;
      onChange({ ...d.s0, cx: Math.min(1, Math.max(0, nx)), cy: Math.min(1, Math.max(0, ny)) });
    } else if (d.kind === "scale") {
      // 가운데 기준으로 양쪽이 같이 커진다(58 실측: 오른쪽 아래 손잡이를 끌면 상자가 사방으로 커짐).
      const r0 = Math.hypot(d.sx - d.cx, d.sy - d.cy) || 1;
      const r1 = Math.hypot(e.clientX - d.cx, e.clientY - d.cy);
      onChange({ ...d.s0, w: Math.min(1.2, Math.max(0.12, d.s0.w * (r1 / r0))) });
    } else {
      // 회전 손잡이: 손가락 방향을 따라 돈다.
      const a0 = Math.atan2(d.sy - d.cy, d.sx - d.cx);
      const a1 = Math.atan2(e.clientY - d.cy, e.clientX - d.cx);
      onChange({ ...d.s0, rot: d.s0.rot + ((a1 - a0) * 180) / Math.PI });
    }
  };
  const end = (e: RPointerEvent) => {
    const d = drag.current;
    drag.current = null;
    // 움직이지 않고 손을 떼면 선택 테두리를 켜고 끈다(58: 스티커를 짧게 누르면 테두리가 사라짐).
    if (d?.kind === "move" && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 4) setActive((v) => !v);
  };

  return (
    <div className={`shoot-sticker ${active ? "is-active" : ""}`} style={{ left, top, width: w + 28, height: h + 28, transform: `translate(-50%, -50%) rotate(${sticker.rot}deg)` }}>
      <div className="shoot-sticker__face" onPointerDown={start("move")} onPointerMove={move} onPointerUp={end} onPointerCancel={end}>
        <StickerFace />
      </div>
      {active ? (
        <>
          <button type="button" className="shoot-sticker__h is-tl" aria-label="번호판 가림 지우기" onPointerDown={(e) => e.stopPropagation()} onClick={() => onChange({ ...sticker, visible: false })}>
            <Mask src={rd("close-outline")} />
          </button>
          <span className="shoot-sticker__h is-tr" role="button" aria-label="회전" onPointerDown={start("rotate")} onPointerMove={move} onPointerUp={end}>
            <Mask src={rd("rotate-image-outline")} />
          </span>
          <span className="shoot-sticker__h is-bl" role="button" aria-label="크기 조절" onPointerDown={start("scale")} onPointerMove={move} onPointerUp={end}>
            <Mask src={rd("aspect-ratio-outline")} />
          </span>
          <span className="shoot-sticker__h is-br" role="button" aria-label="크기 조절" onPointerDown={start("scale")} onPointerMove={move} onPointerUp={end}>
            <Mask src={rd("aspect-ratio-outline")} />
          </span>
        </>
      ) : null}
    </div>
  );
}

function StickerFace() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    const w = 170;
    const h = w / STICKER_ASPECT;
    c.width = w * dpr;
    c.height = h * dpr;
    const g = c.getContext("2d")!;
    g.scale(dpr, dpr);
    g.translate(w / 2, h / 2);
    drawStickerFace(g, w, h);
  }, []);
  return <canvas ref={ref} className="shoot-sticker__canvas" />;
}

/** 화면에 맞춘 사진 크기 */
function useFit(src: string, box: { w: number; h: number }) {
  const [nat, setNat] = useState({ w: 4, h: 3 });
  useEffect(() => {
    let live = true;
    void loadImage(src).then((img) => live && setNat({ w: img.naturalWidth, h: img.naturalHeight }));
    return () => {
      live = false;
    };
  }, [src]);
  const s = Math.min(box.w / nat.w, box.h / nat.h);
  return { w: nat.w * s, h: nat.h * s, nat };
}

function useBox<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [box, setBox] = useState({ w: 384, h: 500 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // 안쪽 여백을 뺀 크기(contentRect). 숨겨진 동안(0)에는 바꾸지 않는다.
    const ro = new ResizeObserver(([e]) => e.contentRect.width > 0 && setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, box] as const;
}

function PhotoPreview({
  photos,
  startId,
  onClose,
  onDone,
  onAddMore,
}: {
  photos: Photo[];
  startId: string;
  onClose: () => void;
  onDone: (next: Photo[]) => void;
  onAddMore: () => void;
}) {
  const [draft, setDraft] = useState<(Photo & { removed?: boolean })[]>(() => photos.map((p) => ({ ...p })));
  const [cur, setCur] = useState(() => Math.max(0, photos.findIndex((p) => p.id === startId)));
  const [tool, setTool] = useState<EditTool>(null);
  const [stageRef, box] = useBox<HTMLDivElement>();
  const photo = draft[cur];
  const fit = useFit(photo?.src ?? "", box);
  const [busy, setBusy] = useState(false);
  const replaceRef = useRef<HTMLInputElement>(null);

  if (!photo) return null;
  const patch = (p: Partial<Photo & { removed: boolean }>) => setDraft((d) => d.map((x, i) => (i === cur ? { ...x, ...p } : x)));

  const commit = async () => {
    setBusy(true);
    const out: Photo[] = [];
    for (const p of draft) {
      if (p.removed) continue;
      const src = await bakeSticker(p.src, p.sticker);
      out.push({ id: p.id, src, slot: p.slot, uploading: p.uploading });
    }
    setBusy(false);
    onDone(out);
  };

  const showPlate = () => {
    // 한 장에 스티커 하나. 지운 뒤 다시 누르면 마지막 위치·크기·각도 그대로 돌아온다(58 확인).
    patch({ sticker: photo.sticker ? { ...photo.sticker, visible: true } : defaultSticker() });
  };

  const replace = async (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    const src = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(f);
    });
    patch({ src: await normalize(src), removed: false, sticker: undefined });
  };

  const editor = tool ? (
      <EditorScreen
        tool={tool}
        src={photo.src}
        onCancel={() => setTool(null)}
        onSave={(src) => {
          // 모양이 바뀌는 편집(회전·자르기) 뒤에는 스티커를 가운데로 되돌린다.
          patch({ src, sticker: tool === "mosaic" ? photo.sticker : photo.sticker ? { ...defaultSticker(), visible: photo.sticker.visible } : undefined });
          setTool(null);
        }}
      />
    ) : null;

  return (
    <>
    {editor}
    <div className="shoot-layer shoot-preview" hidden={Boolean(tool)}>
      <header className="shoot-top">
        <button type="button" className="shoot-icon-btn" aria-label="닫기" onClick={onClose}>
          <Mask src={rd("close-outline")} />
        </button>
        <h2>사진 미리보기({cur + 1})</h2>
        <span className="shoot-icon-btn" />
      </header>
      <div className="shoot-stage" ref={stageRef}>
        <div className="shoot-stage-img" style={{ width: fit.w, height: fit.h }}>
          <img src={photo.src} alt="" draggable={false} />
          {photo.sticker?.visible ? <StickerBox sticker={photo.sticker} frame={fit} onChange={(s) => patch({ sticker: s })} /> : null}
        </div>
      </div>
      <div className="shoot-strip">
        <button type="button" className="shoot-strip__add" aria-label="사진 더 추가" onClick={onAddMore}>
          <Mask src={rd("add-outline-24")} />
        </button>
        {draft.map((p, i) =>
          p.removed ? (
            <button type="button" key={p.id} className={`shoot-strip__redo ${i === cur ? "is-sel" : ""}`} onClick={() => { setCur(i); replaceRef.current?.click(); }}>
              <Mask src={rd("camera-outline-24")} />
              다시 올리기
              <br />
              {p.slot === OTHER ? "차량" : itemLabel(p.slot)}
            </button>
          ) : (
            <div key={p.id} className={`shoot-strip__item ${i === cur ? "is-sel" : ""}`}>
              <button type="button" className="shoot-strip__hit" onClick={() => setCur(i)} aria-label={`${itemLabel(p.slot)} 사진 보기`}>
                <img src={p.src} alt="" />
                <span>{itemLabel(p.slot)}</span>
              </button>
              <button type="button" className="shoot-strip__x" aria-label="이 사진 빼기" onClick={() => setDraft((d) => d.map((x, k) => (k === i ? { ...x, removed: true } : x)))}>
                <Mask src={rd("close-outline")} />
              </button>
            </div>
          ),
        )}
      </div>
      <input ref={replaceRef} type="file" accept="image/*" hidden onChange={(e) => void replace(e.target.files)} />
      <footer className="shoot-tools">
        <button type="button" className="is-accent" onClick={showPlate}>
          <span className="shoot-plate__ico is-accent" aria-hidden="true">
            <i />
            <i />
          </span>
          번호판 가리기
        </button>
        <button type="button" onClick={() => setTool("mosaic")}>
          <Mask src={rd("view-grid-outline")} className="is-ring" />
          모자이크
        </button>
        <button type="button" onClick={() => setTool("rotate")}>
          <Mask src={rd("rotate-image-outline")} />
          회전
        </button>
        <button type="button" onClick={() => setTool("crop")}>
          <Mask src={rd("crop-outline")} />
          자르기
        </button>
        <button type="button" className="shoot-done" disabled={busy} onClick={() => void commit()}>
          완료
        </button>
      </footer>
    </div>
    </>
  );
}

/** 붓 굵기(화면 px). 58 실측: 작게 ≈10 · 보통 ≈16 · 크게 ≈24(384 기준) */
const BRUSHES = [10, 16, 24];

function EditorScreen({ tool, src, onCancel, onSave }: { tool: Exclude<EditTool, null>; src: string; onCancel: () => void; onSave: (src: string) => void }) {
  const title = tool === "mosaic" ? "모자이크" : tool === "rotate" ? "회전" : "자르기";
  const [stageRef, box] = useBox<HTMLDivElement>();
  const [turns, setTurns] = useState(0);
  const [aspect, setAspect] = useState<"4:3" | "3:4">("4:3");
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redo, setRedo] = useState<Stroke[]>([]);
  const [brush, setBrush] = useState(1);
  const [picked, setPicked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rotSrc, setRotSrc] = useState(src);
  useEffect(() => {
    let live = true;
    void rotate(src, turns).then((s) => live && setRotSrc(s));
    return () => {
      live = false;
    };
  }, [src, turns]);
  const shown = tool === "rotate" ? rotSrc : src;
  const fit = useFit(shown, box);

  // 모자이크 캔버스
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const pixRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef<Stroke | null>(null);
  useEffect(() => {
    if (tool !== "mosaic") return;
    let live = true;
    void loadImage(src).then((img) => {
      if (!live) return;
      imgRef.current = img;
      const c = canvasRef.current;
      if (!c) return;
      c.width = img.naturalWidth;
      c.height = img.naturalHeight;
      pixRef.current = pixelate(img, c.width, c.height);
      renderMosaic(c, img, pixRef.current, strokes);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src, tool]);
  const redraw = (list: Stroke[]) => {
    const c = canvasRef.current;
    if (c && imgRef.current && pixRef.current) renderMosaic(c, imgRef.current, pixRef.current, list);
  };
  useEffect(() => redraw(strokes), [strokes]);

  const endStroke = () => {
    const st = drawing.current;
    drawing.current = null;
    if (st) {
      setStrokes((l) => [...l, st]);
      setRedo([]);
    }
  };

  const toLocal = (e: RPointerEvent) => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  // 자르기 틀: 비율을 지킨 채 끌어 옮기고(가운데), 네 모서리로 크기를 바꾼다(반대 모서리 고정).
  const ar = aspect === "4:3" ? 4 / 3 : 3 / 4;
  const maxW = Math.min(fit.w, fit.h * ar);
  const minW = Math.min(maxW, 64);
  const [frame, setFrame] = useState({ x: 0, y: 0, w: 0 });
  const fw = Math.min(maxW, frame.w || maxW);
  const fh = fw / ar;
  useEffect(() => setFrame({ x: (fit.w - maxW) / 2, y: (fit.h - maxW / ar) / 2, w: maxW }), [fit.w, fit.h, maxW, ar]);
  const frameDrag = useRef<{ kind: "move" | "tl" | "tr" | "bl" | "br"; sx: number; sy: number; f0: { x: number; y: number; w: number } } | null>(null);
  const startFrame = (kind: "move" | "tl" | "tr" | "bl" | "br") => (e: RPointerEvent) => {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    frameDrag.current = { kind, sx: e.clientX, sy: e.clientY, f0: { x: frame.x, y: frame.y, w: fw } };
  };
  const moveFrame = (e: RPointerEvent) => {
    const d = frameDrag.current;
    if (!d) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    const { x, y, w } = d.f0;
    const h = w / ar;
    if (d.kind === "move") {
      setFrame({ w, x: Math.min(fit.w - w, Math.max(0, x + dx)), y: Math.min(fit.h - h, Math.max(0, y + dy)) });
      return;
    }
    // 고정할 반대 모서리
    const left = d.kind === "tr" || d.kind === "br";
    const top = d.kind === "bl" || d.kind === "br";
    const ax = left ? x : x + w;
    const ay = top ? y : y + h;
    // 손가락 쪽으로 늘어난 폭(가로·세로 중 더 많이 움직인 쪽을 따른다)
    const gx = left ? dx : -dx;
    const gy = top ? dy : -dy;
    const grow = Math.abs(gx) >= Math.abs(gy * ar) ? gx : gy * ar;
    const room = Math.min(left ? fit.w - ax : ax, (top ? fit.h - ay : ay) * ar);
    const nw = Math.max(minW, Math.min(room, w + grow));
    setFrame({ w: nw, x: left ? ax : ax - nw, y: top ? ay : ay - nw / ar });
  };
  const endFrame = () => (frameDrag.current = null);

  const save = async () => {
    setSaving(true);
    let out = src;
    if (tool === "mosaic") out = await applyMosaic(src, strokes);
    else if (tool === "rotate") out = await rotate(src, turns);
    else out = await crop(src, { x: frame.x / fit.w, y: frame.y / fit.h, w: fw / fit.w, h: fh / fit.h });
    setSaving(false);
    onSave(out);
  };

  return (
    <div className="shoot-layer shoot-editor">
      <header className="shoot-editor__top">
        <h2>{title}</h2>
      </header>
      <div className="shoot-editor__stage" ref={stageRef}>
        <div className="shoot-stage-img" style={{ width: fit.w, height: fit.h }}>
          {tool === "mosaic" ? (
            <canvas
              ref={canvasRef}
              className="shoot-mosaic-canvas"
              onPointerDown={(e) => {
                (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
                const cw = (e.currentTarget as HTMLElement).getBoundingClientRect().width || 1;
                drawing.current = { size: BRUSHES[brush] / cw, points: [toLocal(e)] };
                redraw([...strokes, drawing.current]);
              }}
              onPointerMove={(e) => {
                if (!drawing.current) return;
                drawing.current.points.push(toLocal(e));
                redraw([...strokes, drawing.current]);
              }}
              onPointerUp={endStroke}
              onPointerCancel={endStroke}
              onLostPointerCapture={endStroke}
            />
          ) : (
            <img src={shown} alt="" draggable={false} />
          )}
          {tool === "crop" ? (
            <div className="shoot-crop">
              <div
                className="shoot-crop__frame"
                style={{ left: frame.x, top: frame.y, width: fw, height: fh, boxShadow: "0 0 0 9999px rgba(255,255,255,.62)" }}
                onPointerDown={startFrame("move")}
                onPointerMove={moveFrame}
                onPointerUp={endFrame}
                onPointerCancel={endFrame}
              >
                <i className="shoot-crop__grid is-v1" />
                <i className="shoot-crop__grid is-v2" />
                <i className="shoot-crop__grid is-h1" />
                <i className="shoot-crop__grid is-h2" />
                <Corners />
                {(["tl", "tr", "bl", "br"] as const).map((k) => (
                  <span key={k} className={`shoot-crop__h is-${k}`} role="button" aria-label="자르기 크기 조절" onPointerDown={startFrame(k)} onPointerMove={moveFrame} onPointerUp={endFrame} onPointerCancel={endFrame} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
      <div className="shoot-editor__controls">
        {tool === "mosaic" ? (
          <div className="shoot-brush-row">
            <div className="shoot-brushes">
              <div className="shoot-brushes__dots">
                {BRUSHES.map((b, i) => (
                  <button key={b} type="button" className={`shoot-brush is-${i} ${i === brush ? "is-on" : ""} ${picked ? "is-picked" : ""}`} aria-pressed={i === brush} aria-label={`붓 ${["작게", "보통", "크게"][i]}`} onClick={() => { setBrush(i); setPicked(true); }} />
                ))}
              </div>
              <span>붓 설정</span>
            </div>
            <div className="shoot-history">
              <button
                type="button"
                disabled={!strokes.length}
                onClick={() => {
                  setRedo((r) => [strokes[strokes.length - 1], ...r]);
                  setStrokes((l) => l.slice(0, -1));
                }}
              >
                <Mask src={rd("undo-outline")} />
                실행 취소
              </button>
              <button
                type="button"
                disabled={!redo.length}
                onClick={() => {
                  setStrokes((l) => [...l, redo[0]]);
                  setRedo((r) => r.slice(1));
                }}
              >
                <Mask src={rd("undo-outline")} className="is-flip" />
                다시 실행
              </button>
            </div>
          </div>
        ) : tool === "rotate" ? (
          <button type="button" className="shoot-rotate-btn" onClick={() => setTurns((t) => (t + 1) % 4)}>
            <span>
              <Mask src={rd("refresh-outline")} />
              <b>90</b>
            </span>
            회전
          </button>
        ) : (
          <div className="shoot-aspects">
            {(["4:3", "3:4"] as const).map((a) => (
              <button key={a} type="button" className={`shoot-aspect is-${a === "4:3" ? "wide" : "tall"} ${aspect === a ? "is-on" : ""}`} aria-pressed={aspect === a} onClick={() => setAspect(a)}>
                <span>{a}</span>
                {a === "4:3" ? "가로" : "세로"}
              </button>
            ))}
          </div>
        )}
      </div>
      <footer className="shoot-editor__foot">
        <button type="button" onClick={onCancel}>
          취소
        </button>
        <button type="button" className="is-save" disabled={saving} onClick={() => void save()}>
          저장
        </button>
      </footer>
    </div>
  );
}

// ── 영상 촬영 ──────────────────────────────────────────
type RecPhase = "idle" | "countdown" | "recording" | "paused" | "merging";

function VideoCapture({ initial, onClose, onFinished, notify }: { initial?: Take; onClose: () => void; onFinished: (take: Take) => void; notify: (t: string) => void }) {
  const [mode, setMode] = useState<"cam" | "album">("cam");
  const cam = useCamera(mode === "cam", true);
  const [flash, setFlash] = useState(false);
  // 다시 찍기: 찍어 둔 단계는 그대로 두고, 고른 단계만 새로 찍어 바꾼다.
  const [plan, setPlan] = useState<VideoPlanItem[]>(() => initial?.plan?.map((p) => ({ ...p })) ?? (initial?.stages ? makePlan(initial.stages) : DEFAULT_PLAN.map((p) => ({ ...p }))));
  const stages = plan.map((p) => p.key);
  const defs = plan.map(planDef);
  const planRef = useRef(plan);
  planRef.current = plan;
  const stagesRef = useRef(stages);
  stagesRef.current = stages;
  const [marks, setMarks] = useState<Mark[]>(() => initial?.marks?.slice() ?? []);
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const [pickOpen, setPickOpen] = useState(false);
  // 실내 세부 순서: 지금 부위와 부위별 시작 시각(초)
  const [istep, setIstep] = useState(0);
  const istepRef = useRef(0);
  istepRef.current = istep;
  const stepTimes = useRef<number[]>([0]);
  const [steps, setSteps] = useState<number[]>(() => initial?.steps?.slice() ?? []);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;
  const elapsedRef = useRef(0);
  const firstEmpty = initial ? initial.durations.findIndex((d) => d === 0) : 0;
  const [stage, setStage] = useState(Math.max(0, firstEmpty));
  const [phase, setPhase] = useState<RecPhase>(initial?.durations.some(Boolean) ? "paused" : "idle");
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const [changed, setChanged] = useState(false);
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [durations, setDurations] = useState<number[]>(() => initial?.durations.slice() ?? plan.map(() => 0));
  const [askLeave, setAskLeave] = useState(false);
  const [askFinish, setAskFinish] = useState(false);
  const [guide, setGuide] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const segs = useRef<(string | null)[]>(initial?.segs.slice() ?? plan.map(() => null));
  const saving = useRef<Promise<void>>(Promise.resolve());
  const fake = useRef<ReturnType<typeof fakeStream> | null>(null);
  const tick = useRef<number>(0);
  const segStart = useRef(0);
  const segBase = useRef(0);
  const stageRef = useRef(stage);
  stageRef.current = stage;
  const durRef = useRef(durations);
  durRef.current = durations;
  const fileRef = useRef<HTMLInputElement>(null);
  const viewRef = useRef<HTMLDivElement>(null);
  const liveThumbs = useRef<string[]>(initial?.thumbs.slice() ?? []);
  const done = durations.map((d) => d > 0);
  const anyDone = done.some(Boolean);

  useEffect(() => {
    if (cam.torchSupported) cam.setTorch(flash);
  }, [flash, cam]);
  useEffect(() => {
    // 추가 단계가 화면 밖이면 고른 칸이 보이게 칸 줄을 옮긴다.
    viewRef.current?.querySelector(".shoot-stages.is-plus .is-active")?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [stage, stages.length]);
  useEffect(
    () => () => {
      window.clearInterval(tick.current);
      fake.current?.stop();
      if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    },
    [],
  );

  // 촬영하는 동안 화면이 꺼지지 않게(지원하는 브라우저만)
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> } };
    const get = () => void nav.wakeLock?.request("screen").then((l) => (lock = l)).catch(() => undefined);
    get();
    const onVis = () => document.visibilityState === "visible" && get();
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      void lock?.release().catch(() => undefined);
    };
  }, []);
  // 전화가 오거나 다른 앱으로 가면(화면이 가려지면) 지금 단계를 멈춘다.
  // 최소 길이를 넘었으면 그대로 저장하고, 못 넘었으면 그 단계만 버린다.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState !== "hidden" || phaseRef.current !== "recording") return;
      const st = planDef(planRef.current[stageRef.current]);
      if (elapsedRef.current >= st.min) finishStage(elapsedRef.current);
      else {
        window.clearInterval(tick.current);
        const r = recRef.current;
        recRef.current = null;
        if (r && r.state !== "inactive") {
          r.onstop = null;
          r.stop();
        }
        setPhase(durRef.current.some(Boolean) ? "paused" : "idle");
        setElapsed(0);
        notify(`화면을 나가서 ${st.label} 녹화를 멈췄어요. 다시 찍어 주세요`);
      }
    };
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sourceStream = () => {
    if (cam.stream) return cam.stream;
    if (!fake.current) fake.current = fakeStream(() => planRef.current[stageRef.current].label);
    return fake.current.stream;
  };

  const finishStage = (secs: number) => {
    window.clearInterval(tick.current);
    const s = stageRef.current;
    const next = [...durRef.current];
    next[s] = Math.min(planRef.current[s].target, Math.round(secs));
    setDurations(next);
    if (PLUS && stagesRef.current[s] === "interior") {
      const st = stepTimes.current.filter((t) => t < next[s]);
      setSteps(st);
      stepsRef.current = st;
    }
    setChanged(true);
    // 단계마다 파일 하나: 녹화를 끝내 그 단계 영상으로 저장한다.
    const r = recRef.current;
    recRef.current = null;
    if (r && r.state !== "inactive") {
      saving.current = new Promise<void>((resolve) => {
        r.onstop = () => {
          segs.current[s] = URL.createObjectURL(new Blob(chunks.current, { type: r.mimeType || "video/webm" }));
          resolve();
        };
        r.stop();
      });
    }
    let remaining = next.findIndex((d, i) => i > s && d === 0);
    if (remaining < 0) remaining = next.findIndex((d) => d === 0);
    if (remaining < 0) stopAll(next);
    else {
      setStage(remaining);
      setPhase("paused");
      setElapsed(0);
    }
  };

  const startTimer = () => {
    segStart.current = performance.now();
    segBase.current = 0;
    setElapsed(0);
    window.clearInterval(tick.current);
    tick.current = window.setInterval(() => {
      const secs = segBase.current + (performance.now() - segStart.current) / 1000;
      // 표지 후보: 녹화 중 2초마다 한 장(영상 파일에서 장면을 못 뽑을 때 쓴다)
      if (Math.floor(secs / 2) !== Math.floor((secs - 0.2) / 2)) {
        const v = viewRef.current?.querySelector("video");
        const src = v && cam.stream ? grabFrame(v) : (fake.current?.canvas.toDataURL("image/jpeg", 0.7) ?? null);
        if (src) liveThumbs.current.push(src);
      }
      const max = planRef.current[stageRef.current].target;
      elapsedRef.current = secs;
      if (PLUS && stagesRef.current[stageRef.current] === "interior") {
        const last = stepTimes.current[stepTimes.current.length - 1] ?? 0;
        if (istepRef.current < INTERIOR_STEPS.length - 1 && secs - last >= STEP_SEC) nextStep();
      }
      if (secs >= max) {
        setElapsed(max);
        finishStage(max);
        return;
      }
      setElapsed(secs);
    }, 200);
  };

  const begin = () => {
    // 3 · 2 · 1 카운트다운 뒤 녹화(58 확인: 화면 가운데 큰 숫자)
    setPhase("countdown");
    setCount(3);
    let n = 3;
    const t = window.setInterval(() => {
      n -= 1;
      if (n > 0) {
        setCount(n);
        return;
      }
      window.clearInterval(t);
      const type = pickRecorderType();
      let r: MediaRecorder;
      try {
        // 숏폼에 다시 쓸 수 있게 화질을 정한다(영상 4Mbps · 소리 128kbps ≈ 1분 30MB).
        const opts: MediaRecorderOptions = { videoBitsPerSecond: 4_000_000, audioBitsPerSecond: 128_000 };
        r = new MediaRecorder(sourceStream(), type ? { ...opts, mimeType: type } : opts);
      } catch {
        notify("이 브라우저는 영상 녹화를 지원하지 않아요");
        setPhase(durRef.current.some(Boolean) ? "paused" : "idle");
        return;
      }
      const list: Blob[] = [];
      chunks.current = list;
      r.ondataavailable = (e) => e.data.size && list.push(e.data);
      recRef.current = r;
      r.start(500);
      // 흠집 단계를 다시 찍으면 전에 표시한 흠집은 지운다.
      if (stagesRef.current[stageRef.current] === "interior") {
        setIstep(0);
        istepRef.current = 0;
        stepTimes.current = [0];
      }
      if (stagesRef.current[stageRef.current] === "start" && !sourceStream().getAudioTracks().length) {
        notify("마이크가 꺼져 있어 시동 소리가 녹음되지 않아요");
      }
      if (stagesRef.current[stageRef.current] === "damage") {
        setMarks([]);
        notify("흠집이 보이면 화면을 눌러 표시해 주세요");
      }
      setPhase("recording");
      startTimer();
    }, 1000);
  };

  const pressMain = () => {
    if (phase === "idle" || phase === "paused") begin();
    else if (phase === "recording") {
      if (elapsed < defs[stage].min) {
        notify("녹화 시간이 부족해요");
        return;
      }
      finishStage(elapsed);
    }
  };

  const stopAll = (finalDur: number[]) => {
    setPhase("merging");
    void saving.current.then(() => {
      fake.current?.stop();
      const out = segs.current.map((u, i) => (finalDur[i] ? u : null));
      const ss = stagesRef.current;
      window.setTimeout(
        () =>
          onFinished({
            segs: out,
            durations: finalDur,
            thumbs: liveThumbs.current,
            stages: ss,
            plan: planRef.current.map((p) => ({ ...p })),
            marks: finalDur[ss.indexOf("damage")] ? marksRef.current : [],
            steps: finalDur[ss.indexOf("interior")] ? stepsRef.current : [],
          }),
        600,
      );
    });
  };

  const requestFinish = () => {
    const missingLabels = planRef.current.filter((_, i) => !durRef.current[i]).map((p) => p.label);
    if (missingLabels.length) setAskFinish(true);
    else stopAll(durRef.current);
  };

  const recording = phase === "recording" || phase === "countdown";
  const cur = defs[stage];
  const isDamage = cur.key === "damage";
  // 실내 순서 카드는 58에 없어 ?vstage=58 비교 화면에서는 뺀다.
  const isInterior = PLUS && cur.key === "interior";
  function nextStep() {
    const n = Math.min(INTERIOR_STEPS.length - 1, istepRef.current + 1);
    if (n === istepRef.current) return;
    istepRef.current = n;
    stepTimes.current = [...stepTimes.current, Math.round(elapsedRef.current * 10) / 10];
    setIstep(n);
  }
  const pillText =
    isInterior && phase === "recording"
      ? `실내 ${istep + 1}/${INTERIOR_STEPS.length} · ${INTERIOR_STEPS[istep].label}`
      : isDamage && phase === "recording" ? `흠집 ${marks.length}곳 표시함 · 화면을 눌러 표시` : done[stage] && !recording ? `${cur.label} 다시 찍기${PLUS ? ` · ${cur.min}~${cur.max}초` : ""}` : `${cur.label} 촬영${PLUS ? ` · ${cur.min}~${cur.max}초` : ""}`;

  /** 흠집 단계 녹화 중 화면을 누르면 그 자리·그 시각을 흠집으로 표시 */
  const markDamage = (e: RPointerEvent<HTMLDivElement>) => {
    if (!isDamage || phase !== "recording") return;
    if ((e.target as HTMLElement).closest(".shoot-stages, button")) return;
    const r = e.currentTarget.getBoundingClientRect();
    setMarks((m) => [...m, { t: Math.round(elapsedRef.current * 10) / 10, x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }]);
  };

  /** 촬영 코스·추가 부위 적용: 찍어 둔 단계의 영상·길이는 이름으로 옮긴다. */
  const applyPlan = (next: VideoPlanItem[]) => {
    const byId = new Map(plan.map((p, i) => [p.id, { d: durRef.current[i], u: segs.current[i] }]));
    const curId = plan[stage]?.id;
    setPlan(next);
    setDurations(next.map((p) => byId.get(p.id)?.d ?? 0));
    segs.current = next.map((p) => byId.get(p.id)?.u ?? null);
    const firstEmptyNext = next.findIndex((p) => !(byId.get(p.id)?.d ?? 0));
    const curNext = next.findIndex((p) => p.id === curId);
    const curDone = curId ? (byId.get(curId)?.d ?? 0) : 0;
    setStage(curNext >= 0 && !curDone ? curNext : Math.max(0, firstEmptyNext >= 0 ? firstEmptyNext : Math.max(0, curNext)));
    setPickOpen(false);
    if (JSON.stringify(next) !== JSON.stringify(plan)) setChanged(true);
  };

  const importVideo = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    onFinished({ segs: [URL.createObjectURL(f)], durations: [0], thumbs: [], imported: true, plan: [{ id: "imported", key: "custom", label: "불러온 영상", target: 0 }] });
  };

  return (
    <div className="shoot-layer shoot-capture is-video">
      <header className="shoot-top">
        <button type="button" className="shoot-icon-btn" aria-label="닫기" onClick={() => ((initial ? changed : anyDone) || recording ? setAskLeave(true) : onClose())}>
          <Mask src={rd("close-outline")} />
        </button>
        <h2>차량 영상</h2>
        {mode === "cam" ? (
          <FlashToggle on={flash} onToggle={() => setFlash((v) => !v)} />
        ) : (
          <span className="shoot-icon-btn" />
        )}
      </header>
      {mode === "cam" ? (
        <>
          <div className="shoot-view" ref={viewRef} onPointerDown={markDamage}>
            {cam.stream ? <LiveVideo stream={cam.stream} /> : <NoCam denied={cam.error === "denied"} />}
            <span className="shoot-pill">{pillText}</span>
            <div className="shoot-vframe">
              <Corners />
              {phase === "countdown" ? <b className="shoot-countdown">{count}</b> : null}
              {phase === "recording" ? <span className="shoot-timer">{mmss(elapsed)}{PLUS ? <small> / {mmss(cur.max)}</small> : null}</span> : null}
              {PLUS && phase === "recording" ? (
                // 시간대: 최소(여기부터 멈출 수 있음)·최대(자동 멈춤)와 지금 위치를 한 줄로 보여 준다.
                <div className={`shoot-timeline ${elapsed >= cur.min ? "is-ok" : ""}`} role="img" aria-label={`권장 ${cur.min}~${cur.max}초 중 ${Math.floor(elapsed)}초`}>
                  <span className="shoot-timeline__track">
                    <i className="shoot-timeline__fill" style={{ width: `${(Math.min(elapsed, cur.max) / cur.max) * 100}%` }} />
                    <i className="shoot-timeline__min" style={{ left: `${(cur.min / cur.max) * 100}%` }} />
                    {isInterior
                      ? INTERIOR_STEPS.slice(1).map((_, i) => <i key={i} className="shoot-timeline__step" style={{ left: `${(Math.min(cur.max, (i + 1) * STEP_SEC) / cur.max) * 100}%` }} />)
                      : null}
                  </span>
                  <span className="shoot-timeline__text">
                    {elapsed < cur.min ? `${Math.ceil(cur.min - elapsed)}초 더 찍으면 멈출 수 있어요` : `${Math.max(0, Math.ceil(cur.max - elapsed))}초 뒤 자동으로 멈춰요`}
                  </span>
                </div>
              ) : null}
              {isInterior && phase === "recording" ? (
                <div className="shoot-istep" role="status">
                  <span className="shoot-istep__dots" aria-hidden="true">
                    {INTERIOR_STEPS.map((_, i) => (
                      <i key={i} className={i < istep ? "is-done" : i === istep ? "is-on" : ""} />
                    ))}
                  </span>
                  <b>
                    {INTERIOR_STEPS[istep].label}
                    <small className="shoot-istep__slot">
                      {" "}
                      {mmss(istep * STEP_SEC)}~{mmss(Math.min(cur.max, (istep + 1) * STEP_SEC))}
                    </small>
                  </b>
                  <span className="shoot-istep__hand">
                    <Mask src={rd("tap-outline")} />
                    {INTERIOR_STEPS[istep].hand}
                  </span>
                  {istep < INTERIOR_STEPS.length - 1 ? (
                    <button type="button" className="shoot-istep__next" onClick={nextStep}>
                      다음 부위 ›
                    </button>
                  ) : null}
                </div>
              ) : null}
              <p className="shoot-vhint">{isDamage ? "흠집·찍힘이 보이면 화면을 눌러 주세요" : STAGE_GUIDE[cur.key].how}</p>
            </div>
            {isDamage && phase === "recording"
              ? marks.map((m, i) => <i key={i} className="shoot-mark" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }} aria-hidden="true" />)
              : null}
            {PLUS && !recording ? (
              // 4칸은 58과 같은 자리에 두고, 추가 버튼은 칸 줄 위 오른쪽에 늘 보이게 띄운다.
              <button type="button" className="shoot-stage-add" disabled={phase === "merging"} onClick={() => setPickOpen(true)} aria-label="촬영 코스 고르기">
                <Mask src={rd("add-outline-24")} />
                촬영 코스 {plan.length}개 · {mmss(plan.reduce((sum, p) => sum + p.target, 0))}
              </button>
            ) : null}
            <div className={`shoot-stages ${recording ? "is-recording" : ""} ${PLUS ? "is-plus" : ""}`}>
              {defs.map((s, i) => {
                const active = i === stage;
                const expanded = active && !recording;
                return (
                  <button
                    key={plan[i].id}
                    type="button"
                    className={`shoot-stage-chip ${active ? "is-active" : ""} ${expanded ? "is-expanded" : ""} ${done[i] ? "is-done" : ""} ${s.extra ? "is-extra" : ""}`}
                    disabled={recording || phase === "merging"}
                    aria-label={expanded ? `${s.label} 촬영 예시 크게 보기` : done[i] ? `${s.label} 다시 찍기` : `${s.label} 단계 고르기`}
                    onClick={() => (expanded ? setGuide(true) : setStage(i))}
                  >
                    {expanded ? (
                      <>
                        <StageTemplate stage={s.key} />
                        <span className="shoot-stage-chip__tag">예시</span>
                        <i className="shoot-stage-chip__zoom">
                          <Mask src={rd("aspect-ratio-outline")} />
                        </i>
                      </>
                    ) : null}
                    {active && recording ? <i className="shoot-stage-chip__bar" style={{ width: `${(Math.min(elapsed, s.max) / s.max) * 100}%` }} /> : null}
                    {active && recording && s.key === "interior" ? <i className="shoot-stage-chip__ticks" aria-hidden="true" /> : null}
                    {done[i] && !expanded ? (
                      <span className="shoot-stage-chip__time">
                        <Mask src={rd("checkmark-fill")} className="shoot-stage-chip__check" />
                        {mmss(durations[i])}
                      </span>
                    ) : null}
                    <span className="shoot-stage-chip__label">
                      {s.label}
                      {active && phase === "recording" ? <i className="shoot-rec-dot" /> : null}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="shoot-bottom">
            <div className="shoot-controls">
              <span />
              <button type="button" className={`shoot-rec ${phase === "recording" ? "is-recording" : ""}`} aria-label={phase === "recording" ? "현재 구간 촬영 완료" : phase === "paused" ? "다음 구간 촬영" : "녹화 시작"} onClick={pressMain} disabled={phase === "countdown" || phase === "merging"}>
                <span>{phase === "recording" ? "구간 완료" : phase === "paused" ? "다음 구간 촬영" : ""}</span>
              </button>
              <div className="shoot-count">
                {phase === "paused" ? (
                  <button type="button" className="shoot-done shoot-finish-video" onClick={requestFinish}>
                    촬영 종료·미리보기
                  </button>
                ) : (
                  // 2026-10-25: 비어 있던 자리에 지금 단계 시간 / 최대 시간
                  <span className="shoot-vcount">
                    {msec(phase === "recording" ? elapsed : 0)} / {msec(cur.max)}
                  </span>
                )}
              </div>
            </div>
            <ModeTabs mode={mode} onChange={setMode} hideAlbum={recording} labels={["촬영", "앨범"]} />
          </div>
          {phase === "merging" ? (
            <div className="shoot-merging" role="status" aria-label="영상을 합치는 중">
              <i />
            </div>
          ) : null}
        </>
      ) : (
        <>
          <div className="shoot-album-banner">휴대폰에 있는 차량 영상을 불러와요</div>
          <div className="shoot-album-grid">
            <button type="button" className="shoot-album-import" onClick={() => fileRef.current?.click()}>
              <Mask src={rd("video-camera-outline")} />
              휴대폰 영상
              <br />
              불러오기
            </button>
          </div>
          <input ref={fileRef} type="file" accept="video/*" hidden onChange={(e) => importVideo(e.target.files)} />
          <div className="shoot-bottom is-album">
            <ModeTabs mode={mode} onChange={setMode} labels={["촬영", "앨범"]} />
          </div>
        </>
      )}
      {guide ? (
        <div className="shoot-tpl-sheet" role="dialog" aria-modal="true" aria-label={`${cur.label} 촬영 예시`} onClick={() => setGuide(false)}>
          <div className="shoot-tpl-sheet__box" onClick={(e) => e.stopPropagation()}>
            <div className="shoot-tpl-sheet__media">
              <StageTemplate stage={cur.key} large />
              <span className="shoot-stage-chip__tag">예시</span>
            </div>
            <div className="shoot-tpl-sheet__text">
              <strong>{cur.label} 이렇게 찍어 주세요</strong>
              <p>{STAGE_GUIDE[cur.key].how}</p>
            </div>
            <button type="button" className="shoot-tpl-sheet__ok" onClick={() => setGuide(false)} autoFocus>
              확인
            </button>
          </div>
        </div>
      ) : null}
      <div className="shoot-rotate-hint" role="status">
        <Mask src={rd("rotate-image-outline")} />
        휴대폰을 세로로 들어 주세요
        <small>숏폼(9:16)으로 바로 쓸 수 있게 세로로 찍어요</small>
      </div>
      {pickOpen ? <CoursePicker current={plan} recorded={plan.filter((_, i) => done[i]).map((p) => p.id)} onClose={() => setPickOpen(false)} onApply={applyPlan} /> : null}
      {askFinish ? (
        <Confirm
          text={`${planRef.current.filter((_, i) => !durRef.current[i]).map((p) => p.label).join(" · ")} 촬영이 남아 있어요. 촬영을 종료하고 미리보기로 이동할까요?`}
          cancelText="계속 촬영"
          okText="종료하고 보기"
          onCancel={() => setAskFinish(false)}
          onOk={() => {
            setAskFinish(false);
            stopAll(durRef.current);
          }}
        />
      ) : null}
      {askLeave ? <Confirm text={initial ? "새로 찍은 내용을 버리고 나갈까요?" : "촬영한 영상을 지우고 나갈까요?"} onCancel={() => setAskLeave(false)} onOk={onClose} /> : null}
    </div>
  );
}

/** 촬영 코스 만들기: 부위·순서·권장 시간을 한 목록에서 직접 편집한다. */
function CoursePicker({ current, recorded, onClose, onApply }: { current: VideoPlanItem[]; recorded: string[]; onClose: () => void; onApply: (next: VideoPlanItem[]) => void }) {
  const [items, setItems] = useState<VideoPlanItem[]>(() => current.map((p) => ({ ...p })));
  const [editing, setEditing] = useState<VideoPlanItem | null>(null);
  const [adding, setAdding] = useState(false);
  const dialog = useDialogFocus(onClose);
  const total = items.reduce((n, p) => n + p.target, 0);
  const move = (at: number, by: number) => {
    const to = at + by;
    if (to < 0 || to >= items.length || recorded.includes(items[at].id)) return;
    const next = [...items];
    const [picked] = next.splice(at, 1);
    next.splice(to, 0, picked);
    setItems(next);
  };
  const addRecommended = () => {
    const rec: VideoStage[] = ["wheel", "engine", "feature"];
    const add = rec
      .filter((key) => !items.some((p) => p.key === key))
      .map((key, i) => ({ id: planId(key, items.length + i), key, label: STAGE_DEFS[key].label, target: Math.min(10, STAGE_DEFS[key].max) }));
    setItems((old) => [...old, ...add]);
  };
  const saveEdit = (item: VideoPlanItem) => {
    setItems((old) => (adding ? [...old, item] : old.map((p) => (p.id === item.id ? item : p))));
    setEditing(null);
    setAdding(false);
  };
  return (
    <div ref={dialog.ref} className="shoot-xpick shoot-plan" role="dialog" aria-modal="true" aria-labelledby="shoot-xpick-t" onClick={onClose} onKeyDown={dialog.onKeyDown}>
      <div className="shoot-xpick__box" onClick={(e) => e.stopPropagation()}>
        <header>
          <div className="shoot-plan__top">
            <button type="button" aria-label="촬영 코스 닫기" onClick={onClose}><Mask src={rd("close-outline")} /></button>
            <strong id="shoot-xpick-t">촬영 코스 만들기</strong>
            <button type="button" disabled={recorded.length > 0} onClick={() => setItems(DEFAULT_PLAN.map((p) => ({ ...p })))}>초기화</button>
          </div>
          <p>촬영할 부위와 시간을 정해 두면 현장에서 순서대로 안내해 드려요.</p>
          <span>촬영 순서</span>
        </header>
        <ol className="shoot-plan__list">
          {items.map((item, i) => {
            const locked = recorded.includes(item.id);
            return (
              <li key={item.id} className={locked ? "is-recorded" : ""}>
                <span className="shoot-plan__order">{i + 1}</span>
                <img className="shoot-plan__thumb" src={stageThumb(item.key)} alt="" />
                <span className="shoot-plan__meta">
                  <b>{item.label}</b>
                  <em><img src={`${base}assets/bbm/autoscout-detail-clock-20-v01.svg`} alt="" />{locked ? "촬영 완료" : `${item.target}초`}</em>
                </span>
                <span className="shoot-plan__move">
                  <button type="button" disabled={locked || i === 0} onClick={() => move(i, -1)} aria-label={`${item.label} 위로 이동`}>
                    <Mask src={rd("caret-down-fill")} className="is-plan-up" />
                  </button>
                  <button type="button" disabled={locked || i === items.length - 1} onClick={() => move(i, 1)} aria-label={`${item.label} 아래로 이동`}>
                    <Mask src={rd("caret-down-fill")} />
                  </button>
                </span>
                <button type="button" className="shoot-plan__icon" disabled={locked} onClick={() => setEditing({ ...item })} aria-label={`${item.label} 수정`}>
                  <Mask src={rd("edit-outline")} />
                </button>
                <button type="button" className="shoot-plan__icon" disabled={locked || items.length <= 1} onClick={() => setItems((old) => old.filter((p) => p.id !== item.id))} aria-label={`${item.label} 삭제`}>
                  <Mask src={rd("delete-outline")} />
                </button>
              </li>
            );
          })}
        </ol>
        <div className="shoot-plan__add">
          <button
            type="button"
            onClick={() => {
              setAdding(true);
              setEditing({ id: planId("custom", items.length), key: "custom", label: "", target: 6, custom: true });
            }}
          >
            <Mask src={rd("add-outline-24")} />
            직접 촬영 부위 만들기
          </button>
          <button type="button" className="is-ai" onClick={addRecommended}>
            <span><b>AI 추천 부위 3개 추가</b><small>차량에 맞는 촬영 부위를 자동으로 제안해요.</small></span>
            <i>{["wheel", "engine", "feature"].map((key) => <img key={key} src={stageThumb(key as VideoStage)} alt="" />)}</i>
          </button>
        </div>
        <footer>
          <button type="button" className="is-ok" disabled={!items.length} onClick={() => onApply(items)}>
            총 {items.length}개 · {total < 60 ? `${total}초` : mmss(total)} 코스로 촬영
            <Mask src={rd("forward-outline")} />
          </button>
        </footer>
      </div>
      {editing ? <StageEditor item={editing} onCancel={() => { setEditing(null); setAdding(false); }} onSave={saveEdit} /> : null}
    </div>
  );
}

function StageEditor({ item, onCancel, onSave }: { item: VideoPlanItem; onCancel: () => void; onSave: (item: VideoPlanItem) => void }) {
  const [label, setLabel] = useState(item.label);
  const [target, setTarget] = useState(item.target || 6);
  const dialog = useDialogFocus(onCancel, "input:not(:disabled)");
  return (
    <div ref={dialog.ref} className="shoot-plan-edit" role="dialog" aria-modal="true" aria-labelledby="shoot-plan-edit-t" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => { e.stopPropagation(); dialog.onKeyDown(e); }}>
      <div>
        <strong id="shoot-plan-edit-t">촬영 부위 설정</strong>
        <label>
          부위 이름
          <input value={label} maxLength={20} placeholder="예: 운전석 전동 시트" onChange={(e) => setLabel(e.target.value)} autoFocus />
        </label>
        <label>
          촬영 시간 <b>{target}초</b>
          <input type="range" min="3" max="30" step="1" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
        </label>
        <p>기능 작동 장면은 8~12초가 가장 보기 좋아요.</p>
        <footer>
          <button type="button" onClick={onCancel}>취소</button>
          <button type="button" className="is-ok" disabled={!label.trim()} onClick={() => onSave({ ...item, label: label.trim(), target })}>저장</button>
        </footer>
      </div>
    </div>
  );
}

function VideoPreview({
  take,
  edit,
  onClose,
  onNext,
  onReshoot,
  onCover,
  onDelete,
}: {
  take: Take;
  edit?: boolean;
  onClose: () => void;
  onNext?: () => void;
  onReshoot?: () => void;
  onCover?: () => void;
  onDelete?: () => void;
}) {
  // 단계별 파일을 차례로 이어 튼다(외관 → 실내 → 엔진룸 → 트렁크).
  const parts = take.segs.map((u, i) => ({ u, i })).filter((x): x is { u: string; i: number } => Boolean(x.u));
  const ref = useRef<HTMLVideoElement>(null);
  const [k, setK] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [t, setT] = useState(0);
  const total = take.durations.reduce((a, b) => a + b, 0);
  const [dur, setDur] = useState(total);
  const before = parts.slice(0, k).reduce((a, x) => a + (take.durations[x.i] || 0), 0);
  const seekTo = useRef<number | null>(null);
  const go = (n: number, play: boolean, at = 0) => {
    if (n === k && ref.current) {
      ref.current.currentTime = at;
      setT(at);
    } else {
      seekTo.current = at || null;
      setK(n);
      setT(at);
    }
    setPlaying(play);
  };
  const stagePlan = take.plan ?? makePlan(take.stages ?? BASE_STAGES);
  const stageKeys = stagePlan.map((p) => p.key);
  const damageIdx = stageKeys.indexOf("damage");
  const marks = damageIdx >= 0 && take.durations[damageIdx] ? (take.marks ?? []) : [];
  const interiorIdx = stageKeys.indexOf("interior");
  const isteps = interiorIdx >= 0 && take.durations[interiorIdx] ? (take.steps ?? []) : [];
  useEffect(() => {
    const v = ref.current;
    if (v && playing) void v.play().catch(() => setPlaying(false));
  }, [k, playing]);
  const cur = parts[k];
  const [saveOpen, setSaveOpen] = useState(false);
  const [saving, setSaving] = useState<{ label: string; p: number } | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const say = (m: string) => {
    setSaveMsg(m);
    window.setTimeout(() => setSaveMsg(""), 2600);
  };
  const save = async (urls: string[], what: string, label: string) => {
    setSaveOpen(false);
    ref.current?.pause();
    setPlaying(false);
    setSaving({ label, p: 0 });
    try {
      const blob = await makeMp4(urls, (p) => setSaving({ label, p }));
      setSaving(null);
      const r = await saveToDevice(blob, mp4Name(what));
      if (r === "downloaded") say(`${label} mp4를 저장했어요`);
      else if (r === "shared") say("공유창에서 「동영상 저장」을 누르면 사진첩에 들어가요");
    } catch (e) {
      console.error("mp4 저장 실패", e);
      setSaving(null);
      say("이 브라우저에서는 mp4로 만들 수 없어요");
    }
  };
  return (
    <div className={`shoot-layer shoot-vpreview ${edit ? "is-edit" : ""}`}>
      <header className="shoot-top">
        <button type="button" className="shoot-icon-btn" aria-label="닫기" onClick={onClose}>
          <Mask src={rd("close-outline")} />
        </button>
        <h2>{edit ? "차량 영상" : "영상 미리보기"}</h2>
        {parts.length ? (
          <button type="button" className="shoot-guide-toggle shoot-save-btn" onClick={() => setSaveOpen(true)}>
            기기에 저장
          </button>
        ) : (
          <span className="shoot-icon-btn" />
        )}
      </header>
      <div className="shoot-view">
        {cur ? (
          <video
            key={cur.u}
            ref={ref}
            src={cur.u}
            poster={take.thumbs[0]}
            className="shoot-live"
            playsInline
            onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              if (seekTo.current != null) {
                e.currentTarget.currentTime = seekTo.current;
                seekTo.current = null;
              }
              if (Number.isFinite(e.currentTarget.duration) && !total) setDur(e.currentTarget.duration);
            }}
            onEnded={() => (k < parts.length - 1 ? go(k + 1, true) : go(0, false))}
            onClick={() => {
              ref.current?.pause();
              setPlaying(false);
            }}
          />
        ) : null}
        {!playing ? (
          <button type="button" className="shoot-play" aria-label="재생" onClick={() => setPlaying(true)}>
            <Mask src={rd("play-fill")} />
          </button>
        ) : null}
        {total && !take.imported ? (
          <div className={`shoot-stages is-done-row ${stageKeys.length > 4 ? "is-plus" : ""}`}>
            {stagePlan.map((item, i) => {
              const s = planDef(item);
              const at = parts.findIndex((x) => x.i === i);
              return (
                <button
                  type="button"
                  key={item.id}
                  className={`shoot-stage-chip is-done ${take.durations[i] ? "" : "is-empty"} ${cur?.i === i ? "is-now" : ""}`}
                  disabled={at < 0}
                  aria-label={`${s.label} 영상부터 보기`}
                  onClick={() => go(at, true)}
                >
                  <span className="shoot-stage-chip__time">{mmss(take.durations[i] || 0)}</span>
                  <span className="shoot-stage-chip__label">{s.label}</span>
                </button>
              );
            })}
          </div>
        ) : null}
        {cur?.i === damageIdx
          ? marks.filter((m) => Math.abs(m.t - t) < 1.2).map((m, i) => <i key={i} className="shoot-mark is-play" style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }} aria-hidden="true" />)
          : null}
        {isteps.length ? (
          <div className={`shoot-marks is-steps ${marks.length ? "is-up" : ""}`} role="group" aria-label="실내 부위별로 보기">
            <span>실내</span>
            {isteps.map((t0, i) => (
              <button type="button" key={i} onClick={() => go(parts.findIndex((x) => x.i === interiorIdx), true, t0)}>
                {INTERIOR_STEPS[i]?.label ?? `부위 ${i + 1}`} · {mmss(t0)}
              </button>
            ))}
          </div>
        ) : null}
        {marks.length ? (
          <div className="shoot-marks" role="group" aria-label={`흠집 ${marks.length}곳`}>
            <span>흠집 {marks.length}곳</span>
            {marks.map((m, i) => (
              <button type="button" key={i} onClick={() => go(parts.findIndex((x) => x.i === damageIdx), true, Math.max(0, m.t - 0.5))}>
                {i + 1} · {mmss(m.t)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="shoot-bottom is-vpreview">
        <span className="shoot-vtime">
          {mmss(before + t)}/{mmss(dur || total)}
        </span>
        {edit ? (
          <div className="shoot-vedit-actions">
            {onReshoot ? (
              <button type="button" onClick={onReshoot}>
                <Mask src={rd("video-camera-outline")} />
                다시 찍기
              </button>
            ) : null}
            <button type="button" onClick={onCover}>
              <Mask src={rd("image-post-outline")} />
              표지 바꾸기
            </button>
            <button type="button" onClick={onDelete}>
              <Mask src={rd("delete-outline")} />
              삭제
            </button>
          </div>
        ) : (
          <button type="button" className="shoot-done" onClick={onNext}>
            표지 선택
          </button>
        )}
      </div>
      {saveOpen ? (
        <div className="shoot-dim is-sheet" role="presentation" onClick={() => setSaveOpen(false)}>
          <div className="shoot-save-sheet" role="dialog" aria-modal="true" aria-labelledby="shoot-save-t" onClick={(e) => e.stopPropagation()}>
            <strong id="shoot-save-t">내 폰에 저장</strong>
            <p>mp4 파일로 저장해요. 윤곽선 같은 안내는 영상에 들어가지 않아요.</p>
            {parts.length > 1 ? (
              <button type="button" className="is-all" onClick={() => void save(parts.map((x) => x.u), "all", "전체 영상")}>
                <span>전체 영상 한 파일로</span>
                <em>{mmss(total)}</em>
              </button>
            ) : null}
            {parts.map((x) => {
              const key = stageKeys[x.i] ?? "video";
              const label = take.imported ? "불러온 영상" : (stagePlan[x.i]?.label ?? "영상");
              return (
                <button type="button" key={x.u} onClick={() => void save([x.u], take.imported ? "video" : key, label)}>
                  <span>{label}</span>
                  <em>{mmss(take.durations[x.i] || 0)}</em>
                </button>
              );
            })}
            <button type="button" className="is-cancel" onClick={() => setSaveOpen(false)}>
              닫기
            </button>
          </div>
        </div>
      ) : null}
      {saving ? (
        <div className="shoot-dim" role="status" aria-label="mp4로 만드는 중">
          <div className="shoot-save-progress">
            <strong>{saving.label} mp4로 만드는 중</strong>
            <span>{Math.round(saving.p * 100)}%</span>
            <i style={{ width: `${Math.round(saving.p * 100)}%` }} />
          </div>
        </div>
      ) : null}
      <Toast text={saveMsg} />
    </div>
  );
}

function CoverPicker({ segs, fallback, onClose, onDone }: { segs: (string | null)[]; fallback: string[]; onClose: () => void; onDone: (cover: string) => void }) {
  const [frames, setFrames] = useState<string[]>([]);
  const [pick, setPick] = useState(0);
  useEffect(() => {
    let live = true;
    const pickFallback = () => {
      const n = fallback.length;
      return n <= 8 ? fallback : Array.from({ length: 8 }, (_, i) => fallback[Math.floor((i * n) / 8)]);
    };
    // 녹화 중 모은 장면을 먼저 보여 주고, 영상 파일에서 장면을 뽑으면 바꾼다.
    if (fallback.length) setFrames(pickFallback());
    // 단계 영상마다 고르게 나눠 모두 8장
    const urls = segs.filter((u): u is string => Boolean(u));
    const per = urls.map((_, i) => Math.floor(8 / urls.length) + (i < 8 % urls.length ? 1 : 0));
    void Promise.all(urls.map((u, i) => (per[i] ? extractFrames(u, per[i]).catch(() => [] as string[]) : Promise.resolve([] as string[]))))
      .then((lists) => {
        const f = lists.flat();
        if (live) setFrames(f.length ? f : pickFallback());
      })
      .catch(() => live && setFrames(pickFallback()));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [segs]);
  return (
    <div className="shoot-layer shoot-cover">
      <header className="shoot-top">
        <button type="button" className="shoot-icon-btn" aria-label="닫기" onClick={onClose}>
          <Mask src={rd("close-outline")} />
        </button>
        <h2>차량 영상</h2>
        <span className="shoot-icon-btn" />
      </header>
      <div className="shoot-view">
        {frames[pick] ? <img className="shoot-live" src={frames[pick]} alt="" /> : <div className="shoot-nocam">장면을 고르는 중이에요</div>}
        <span className="shoot-pill">영상 표지 선택</span>
        <div className="shoot-cover-strip">
          {frames.map((f, i) => (
            <button key={f.slice(-24) + i} type="button" className={`shoot-cover-cell ${i === pick ? "is-on" : ""}`} aria-pressed={i === pick} onClick={() => setPick(i)}>
              <img src={f} alt="" />
              {i === pick ? (
                <span className="shoot-cover-check">
                  <Mask src={rd("checkmark-fill")} />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
      <div className="shoot-bottom is-cover">
        <span>영상에서 한 장면을 골라 표지로 정해 주세요</span>
        <button type="button" className="shoot-done" disabled={!frames.length} onClick={() => onDone(frames[pick])}>
          이 영상 사용
        </button>
      </div>
    </div>
  );
}

function ShortsBuilder({ take, cover, onBack, onUse }: { take: Take; cover: string; onBack: () => void; onUse: () => void }) {
  const plan = take.plan ?? makePlan(take.stages ?? BASE_STAGES);
  const callouts = plan.slice(0, 3).map((item) => item.label);
  const [style, setStyle] = useState<"clean" | "mood" | "fast">("clean");
  const [caption, setCaption] = useState(true);
  const [spec, setSpec] = useState(true);
  const [bgm, setBgm] = useState(true);
  const [progress, setProgress] = useState(0);
  const [generated, setGenerated] = useState(false);
  const [msg, setMsg] = useState("");
  const generating = progress > 0 && progress < 100;
  const make = () => {
    if (generating) return;
    setGenerated(false);
    setProgress(8);
    const timer = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(100, p + 16);
        if (next === 100) {
          window.clearInterval(timer);
          window.setTimeout(() => setGenerated(true), 250);
        }
        return next;
      });
    }, 220);
  };
  const save = async () => {
    const urls = take.segs.filter((u): u is string => Boolean(u));
    if (!urls.length) return;
    try {
      setMsg("쇼츠 mp4를 만드는 중이에요");
      const blob = await makeMp4(urls);
      const result = await saveToDevice(blob, mp4Name("shorts"));
      setMsg(result === "shared" ? "공유창에서 동영상 저장을 눌러 주세요" : "쇼츠 mp4를 저장했어요");
    } catch {
      setMsg("이 브라우저에서는 mp4로 저장할 수 없어요");
    }
    window.setTimeout(() => setMsg(""), 2600);
  };
  return (
    <div className="shoot-layer shoot-shorts">
      <header className="shoot-top">
        <button type="button" className="shoot-icon-btn" aria-label="뒤로" onClick={onBack}><Mask src={rd("back-outline-24")} /></button>
        <h2>자동 쇼츠 미리보기</h2>
        <button type="button" className="shoot-guide-toggle" onClick={() => setMsg("현재 설정을 임시저장했어요")}>저장</button>
      </header>
      <main className="shoot-shorts__body">
        <section className={`shoot-shorts__preview is-${style}`} aria-label="쇼츠 미리보기">
          <img src={cover} alt="선택한 차량 영상 표지" />
          <span className="shoot-shorts__brand">BOBAEDREAM</span>
          {caption ? <strong>사진보다 생생한 차량 상태</strong> : null}
          {spec ? (
            <div className="shoot-shorts__callouts">
              {callouts.map((label) => <span key={label}>{label}</span>)}
            </div>
          ) : null}
          <div className="shoot-shorts__price"><b>3,890만원</b><span>2023년식 · 24,580km</span></div>
          {bgm ? <span className="shoot-shorts__music">BGM · Driving mood</span> : null}
        </section>
        <section className="shoot-shorts__timeline">
          <div><strong>자동 편집 타임라인</strong><button type="button" onClick={() => setMsg("각 구간 길이를 직접 바꿀 수 있어요")}>직접 편집</button></div>
          <ol>
            {plan.map((item, i) => (
              <li key={item.id}>
                <img src={stageThumb(item.key)} alt="" />
                <span>{i + 1}</span>
                <b>{item.label}</b>
                <em>{take.durations[i] ? `${take.durations[i]}초` : `${item.target}초`}</em>
              </li>
            ))}
          </ol>
        </section>
        <section className="shoot-shorts__settings">
          <h3>쇼츠 스타일</h3>
          <div className="shoot-shorts__styles">
            {([['clean', '깔끔한 매물형'], ['mood', '인스타 감성형'], ['fast', '빠른 쇼츠형']] as const).map(([key, label]) => (
              <button type="button" key={key} className={style === key ? "is-on" : ""} aria-pressed={style === key} onClick={() => setStyle(key)}>{label}</button>
            ))}
          </div>
          <label><span>AI 자동 자막<small>촬영 부위에 맞춰 설명을 넣어요</small></span><input type="checkbox" checked={caption} onChange={(e) => setCaption(e.target.checked)} /></label>
          <label><span>가격·연식 표시<small>매물 정보를 영상에 자동 반영해요</small></span><input type="checkbox" checked={spec} onChange={(e) => setSpec(e.target.checked)} /></label>
          <label><span>배경 음악<small>상업적으로 사용할 수 있는 음악만 골라요</small></span><input type="checkbox" checked={bgm} onChange={(e) => setBgm(e.target.checked)} /></label>
        </section>
      </main>
      <footer className="shoot-shorts__foot">
        {generating ? <span><i style={{ width: `${progress}%` }} />장면을 분석하고 자막을 만드는 중 · {progress}%</span> : null}
        {generated ? (
          <div className="shoot-shorts__done">
            <strong>9:16 쇼츠가 완성됐어요</strong>
            <button type="button" onClick={() => void save()}>기기에 저장</button>
            <button type="button" className="is-main" onClick={onUse}>영상 사용</button>
          </div>
        ) : <button type="button" className="shoot-done" disabled={generating} onClick={make}>자동 쇼츠 만들기</button>}
      </footer>
      <Toast text={msg} />
    </div>
  );
}

// ── 촬영 규칙 ──────────────────────────────────────────
function RulesPage({ onBack, onAdd }: { onBack: () => void; onAdd: () => void }) {
  // 그룹·항목·필수 여부는 모두 shoot-items.json. 사진 칸 레일과 같은 순서·같은 이름이다.
  return (
    <div className="shoot-layer shoot-rules">
      <header className="shoot-page-top">
        <button type="button" className="shoot-icon-btn" aria-label="뒤로" onClick={onBack}>
          <Mask src={rd("back-outline-24")} className="is-back" />
        </button>
        <h2>차량 사진 촬영 규칙</h2>
        <span className="shoot-icon-btn" />
      </header>
      <div className="shoot-rules__body">
        <section className="shoot-rules__notice">
          <strong>{SHOOT.rulesTitle}</strong>
          <p>{SHOOT.rulesNotice}</p>
          <small className="shoot-rules__vehicle">{SHOOT.vehicleNote}</small>
        </section>
        {GROUPS.map((g) => (
          <section key={g.id} className={`shoot-rules__group is-${g.level}`}>
            <h3>
              {g.label}({g.items.length}장)
              <span className={`shoot-rules__badge is-${g.level}`}>
                {levelLabel(g.level)}
                {g.items.some((a) => a.level && a.level !== g.level) ? ` ${g.items.filter((a) => (a.level ?? g.level) === g.level).length}장` : ""}
              </span>
            </h3>
            <p>{g.items.map((a) => a.label).join(" | ")}</p>
            <div className="shoot-rules__grid">
              {g.items.map((a) => (
                <figure key={a.id}>
                  <RuleIllustration angle={a.rule} flip={a.ruleFlip} />
                  <figcaption>
                    {a.label}
                    {a.level && a.level !== g.level ? <span className={`shoot-rules__itembadge is-${a.level}`}>{levelLabel(a.level)}</span> : null}
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        ))}
      </div>
      <div className="shoot-rules__cta">
        <button type="button" onClick={onAdd}>
          <Mask src={rd("camera-outline-24")} />
          사진 촬영 시작
        </button>
      </div>
    </div>
  );
}

// ── 등록 화면 ──────────────────────────────────────────
type Screen =
  | { name: "main" }
  | { name: "capture"; mode: "cam" | "album" }
  | { name: "preview"; id: string }
  | { name: "video"; reshoot?: boolean }
  | { name: "vpreview"; take: Take }
  | { name: "vedit" }
  | { name: "cover"; take: Take; coverOnly?: boolean }
  | { name: "shorts"; take: Take; cover: string }
  | { name: "rules" };


export default function ShootRegister() {
  useInlineCss("bbm-shoot-css", shootCss);
  const [studioOpen, setStudioOpen] = useState(() => new URLSearchParams(window.location.search).get('studio') === '1');
  const studioUrls = useRef<string[]>([]);
  useEffect(() => () => studioUrls.current.forEach(url => URL.revokeObjectURL(url)), []);
  const [screen, setScreen] = useState<Screen>({ name: "main" });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [video, setVideo] = useState<Video | null>(null);
  const [toast, setToast] = useState("");
  const [tipOpen, setTipOpen] = useState(false);
  const [confirm, setConfirm] = useState<null | { kind: "photo"; id: string } | { kind: "video" }>(null);
  const [verify, setVerify] = useState<"reg" | "orig" | "plate">("reg");
  const [drafts, setDrafts] = useState(0);
  const [progress, setProgress] = useState(0);
  const [askLeave, setAskLeave] = useState(false);
  const toastTimer = useRef(0);

  const notify = (t: string) => {
    window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(""), 2000);
  };
  const commitVideo = (take: Take, cover: string) => {
    setVideo({ segs: take.segs, durations: take.durations, cover, uploading: true, imported: take.imported, stages: take.stages, plan: take.plan, marks: take.marks, steps: take.steps });
    setScreen({ name: "main" });
    window.setTimeout(() => setVideo((v) => (v ? { ...v, uploading: false } : v)), 4000);
  };

  useEffect(() => {
    // 들어오면 0% → 소재지가 채워지며 20%(58 확인)
    const t = window.setTimeout(() => setProgress(20), 600);
    return () => window.clearTimeout(t);
  }, []);
  // 완성도 = 소재지 20 + 필수 사진 60 + 권장 사진 10 + 영상 10(2026-10-25 컨설팅: 영상은 선택이라 비중을 작게).
  const requiredDone = useMemo(() => new Set(photos.map((p) => p.slot).filter(isRequiredItem)).size, [photos]);
  const videoTotal = video?.plan?.length || VIDEO_GROUPS.length;
  const videoDone = !video ? 0 : video.imported ? videoTotal : video.plan
    ? video.plan.filter((_, i) => (video.durations[i] ?? 0) > 0).length
    : VIDEO_GROUPS.filter((g) => {
      const i = (video.stages ?? BASE_STAGES).indexOf(g.videoKey!);
      return i >= 0 && (video.durations[i] ?? 0) > 0;
    }).length;
  const requiredOk = requiredDone >= REQUIRED_IDS.length;
  const recommendedDone = useMemo(() => new Set(photos.map((p) => p.slot).filter((id) => itemLevel(id) === "recommended")).size, [photos]);
  /** 등록하기를 눌렀는데 모자랄 때만 숫자를 빨갛게 */
  const [tried, setTried] = useState(false);
  const needPhotos = Math.max(0, REQUIRED_IDS.length - requiredDone);
  useEffect(
    () => setProgress((p) => (p === 0 ? 0 : Math.round(20 + (60 * Math.min(requiredDone, PHOTO_MIN)) / PHOTO_MIN + (10 * recommendedDone) / RECOMMENDED_IDS.length + (10 * videoDone) / videoTotal))),
    [requiredDone, recommendedDone, videoDone, videoTotal],
  );
  const mediaRef = useRef<HTMLElement>(null);
  useEffect(() => {
    if (document.documentElement.dataset.site !== "shoot") document.title = studioOpen ? "보배드림 · 차량 숏폼 스튜디오" : "보배드림 · 중고차 등록 촬영";
  }, [studioOpen]);

  const missing = useMemo(() => {
    const got = new Set(photos.map((p) => p.slot));
    return ITEMS.filter((a) => a.id !== OTHER && !got.has(a.id));
  }, [photos]);

  const addPhotos = (added: Photo[]) => {
    setScreen({ name: "main" });
    if (!added.length) return;
    // 새로 올린 사진만 「업로드 중」. 칸은 촬영 각도 순으로 끼워 넣는다.
    const ids = new Set(added.map((p) => p.id));
    setPhotos((p) => sortBySlot([...p, ...added.map((x) => ({ ...x, uploading: true }))]));
    // 58: 「사진 인식 중」(처리 안내 토스트) → 「인식 완료」
    notify("사진을 처리하고 있어요. 앱을 나가지 마세요");
    window.setTimeout(() => setPhotos((p) => p.map((x) => (ids.has(x.id) ? { ...x, uploading: false } : x))), 3200);
  };

  const removePhoto = (id: string) => setPhotos((p) => p.filter((x) => x.id !== id));

  const anyUploading = photos.some((p) => p.uploading);
  const status = !photos.length ? "empty" : anyUploading ? "uploading" : "done";
  const sectionTitle = status === "uploading" ? "차량 사진 인식 중…" : status === "done" && photos.length ? "차량 사진 인식 완료" : "차량 사진";
  const hasMedia = photos.length > 0 || Boolean(video);

  return (
    <div className="shoot-root" onPointerDownCapture={primeSound}>
      <div className="shoot-phone" inert={studioOpen}>
        <section className="shoot-main" aria-label="중고차 등록">
          <header className="shoot-main__top">
            <button type="button" className="shoot-icon-btn is-dark" aria-label="뒤로" onClick={() => setAskLeave(true)}>
              <Mask src={rd("back-outline-24")} className="is-back" />
            </button>
            <div className="shoot-main__title">
              <h1>중고차 등록</h1>
              <span>완성도 {progress}%</span>
            </div>
            <button type="button" className="shoot-drafts" onClick={() => notify("임시저장함은 시안에서 열지 않아요")}>
              임시저장함
              {drafts ? <i>{drafts}</i> : null}
            </button>
            <i className="shoot-main__progress" style={{ width: `${progress}%` }} />
          </header>

          <div className="shoot-main__body">
            <section className="shoot-field">
              <h3>
                차량 소재지 <em>(필수)</em>
              </h3>
              <p className="shoot-field__value">서울</p>
            </section>

            <section className="shoot-field" ref={mediaRef}>
              <div className="shoot-field__head">
                <h3>
                  {sectionTitle} <em>(필수)</em>
                </h3>
                <span className="shoot-media-count" aria-label={`필수 사진 ${Math.min(requiredDone, PHOTO_MIN)}/${PHOTO_MIN}장, 영상 ${videoDone}/${videoTotal}단계(선택)`}>
                  사진 <b className={requiredOk ? "is-ok" : tried ? "is-warn" : ""}>{Math.min(requiredDone, PHOTO_MIN)}/{PHOTO_MIN}</b> · 영상 <span className="is-opt">{videoDone}/{videoTotal} · 선택</span>
                </span>
              </div>
              <div className="shoot-hint-row">
                <p className="shoot-hint">{requiredOk ? SHOOT.photo.hintDone : SHOOT.photo.hint}</p>
                <button type="button" className="shoot-rules-link" onClick={() => setScreen({ name: "rules" })}>
                  <Mask src={rd("help-outline")} />
                  촬영 규칙 보기
                </button>
              </div>
              {status === "uploading" ? (
                <div className="shoot-tipcard is-short">
                  <p>
                    {requiredOk ? "사진을 처리하고 있어요" : <>필수 사진까지 <em>{REQUIRED_IDS.length - requiredDone}</em>장 부족해요. 더 올려 주세요</>}
                  </p>
                  <button type="button" className="shoot-tipcard__btn" onClick={() => setScreen({ name: "capture", mode: "cam" })}>
                    <Mask src={rd("camera-outline-24")} />
                    사진 추가
                  </button>
                </div>
              ) : status === "done" && photos.length && missing.length ? (
                <div className="shoot-tipcard">
                  <button type="button" className="shoot-tipcard__head" aria-expanded={tipOpen} onClick={() => setTipOpen((v) => !v)}>
                    <Mask src={icon("dealer-profile", "speech-bubble-as24.svg")} className="is-tipico" />
                    <strong>등록 팁</strong>
                    <Mask src={rd("caret-down-fill")} className={`is-chev ${tipOpen ? "is-up" : ""}`} />
                  </button>
                  <p>
                    <em>{missing.length}</em>개 권장 각도를 더 채우면 검색에서 차량 상태가 더 잘 보여요. 펼쳐서 확인하고 더 올려 주세요.
                  </p>
                  {tipOpen ? <p className="shoot-tipcard__list">더 올려 주세요: {missing.map((m) => m.label).join(" | ")}</p> : null}
                </div>
              ) : null}

              {!hasMedia ? (
                <div className="shoot-addcards">
                  <button type="button" onClick={() => setScreen({ name: "capture", mode: "cam" })}>
                    <Mask src={rd("camera-outline-24")} className="is-big" />
                    <strong>사진 촬영</strong>
                    <small>필수</small>
                  </button>
                  <i />
                  <button type="button" onClick={() => setStudioOpen(true)}>
                    <Mask src={rd("video-camera-outline")} className="is-big" />
                    <strong>영상 촬영</strong>
                    <small>선택</small>
                  </button>
                </div>
              ) : (
                <div className="shoot-tiles">
                  {photos.map((p) => (
                    <figure key={p.id} className="shoot-tile">
                      {p.uploading ? (
                        <div className="shoot-tile__wait">
                          <b>bb</b>
                        </div>
                      ) : (
                        <button type="button" className="shoot-tile__img" onClick={() => setScreen({ name: "preview", id: p.id })} aria-label={`${itemLabel(p.slot)} 사진 편집`}>
                          <img src={p.src} alt="" />
                          <span className="shoot-tile__wm">보배드림</span>
                        </button>
                      )}
                      {!p.uploading ? (
                        <button type="button" className="shoot-tile__del" aria-label="사진 삭제" onClick={() => setConfirm({ kind: "photo", id: p.id })}>
                          <Mask src={rd("delete-outline")} />
                        </button>
                      ) : null}
                      <figcaption>{p.uploading ? "업로드 중" : itemLabel(p.slot)}</figcaption>
                    </figure>
                  ))}
                  {video ? (
                    <figure className="shoot-tile shoot-tile--video">
                      <button type="button" className="shoot-tile__img" disabled={video.uploading} onClick={() => setScreen({ name: "vedit" })} aria-label="영상 보기·편집">
                        <img src={video.cover} alt="" />
                        {video.uploading ? (
                          <span className="shoot-tile__dots" role="status" aria-label="영상 올리는 중">
                            <i />
                            <i />
                            <i />
                          </span>
                        ) : (
                          <span className="shoot-tile__play">
                            <i>
                              <Mask src={rd("play-fill")} />
                            </i>
                          </span>
                        )}
                        <span className="shoot-tile__wm">보배드림</span>
                      </button>
                      {!video.uploading ? (
                        <button type="button" className="shoot-tile__del" aria-label="영상 삭제" onClick={() => setConfirm({ kind: "video" })}>
                          <Mask src={rd("delete-outline")} />
                        </button>
                      ) : null}
                      <figcaption>{video.marks?.length ? `흠집 ${video.marks.length}곳` : "\u00a0"}</figcaption>
                    </figure>
                  ) : null}
                  {photos.length < MAX_PHOTOS ? (
                    <button type="button" className="shoot-tile shoot-tile--add" onClick={() => setScreen({ name: "capture", mode: "cam" })}>
                      <Mask src={rd("camera-outline-24")} className="is-big" />
                      <PhotoCounter required={requiredDone} total={photos.length} />
                    </button>
                  ) : null}
                  {!video ? (
                    <button type="button" className="shoot-tile shoot-tile--add" onClick={() => setStudioOpen(true)}>
                      <Mask src={rd("video-camera-outline")} className="is-big" />
                      <span>영상 추가</span>
                    </button>
                  ) : null}
                </div>
              )}
            </section>

            <button type="button" className="shoot-studio-entry" onClick={() => setStudioOpen(true)}>
              <span><strong>보배드림 숏폼 스튜디오</strong><small>부위별 촬영 · 시간 설정 · 세로 MP4 만들기</small></span><span>열기 →</span>
            </button>

            <section className="shoot-field">
              <h3>
                차량 인증 <em>(하나만 인증하면 돼요)</em>
              </h3>
              <div className="shoot-radios" role="radiogroup" aria-label="차량 인증 서류">
                {(
                  [
                    ["reg", "자동차등록증"],
                    ["orig", "등록원부"],
                    ["plate", "차대번호 명판"],
                  ] as const
                ).map(([k, label]) => (
                  <label key={k} className={verify === k ? "is-on" : ""}>
                    <input type="radio" name="shoot-verify" checked={verify === k} onChange={() => setVerify(k)} />
                    <i />
                    {label}
                  </label>
                ))}
              </div>
              <button type="button" className="shoot-docbox" onClick={() => notify("서류 촬영은 이번 시안 범위가 아니에요")}>
                <Mask src={rd("camera-outline-24")} className="is-big" />
                {verify === "reg" ? "자동차등록증" : verify === "orig" ? "등록원부" : "차대번호 명판"} 사진
              </button>
            </section>
          </div>

          <footer className="shoot-main__foot">
            <button
              type="button"
              className="shoot-savedraft"
              onClick={() => {
                setDrafts((d) => d + 1);
                notify("임시저장했어요");
              }}
            >
              <Mask src={rd("image-post-outline")} />
              임시저장
            </button>
            <button
              type="button"
              className={`shoot-publish ${requiredOk ? "" : "is-disabled"}`}
              aria-disabled={!requiredOk}
              onClick={() => {
                if (!requiredOk) {
                  // 필수 사진이 덜 찼으면 사진·영상 칸으로 올려 보내고 숫자를 빨갛게 한다.
                  setTried(true);
                  mediaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  notify(`외관 사진 ${needPhotos}장을 더 찍어 주세요`);
                  return;
                }
                notify("시안 화면이라 실제로 등록하지 않아요");
              }}
            >
              {requiredOk ? "등록하기" : <span className="shoot-publish__need">외관 사진 {needPhotos}장 더 찍어 주세요</span>}
            </button>
          </footer>
        </section>

        {screen.name === "capture" ? <PhotoCapture existing={photos} startMode={screen.mode} notify={notify} onClose={() => setScreen({ name: "main" })} onDone={addPhotos} /> : null}
        {screen.name === "preview" ? (
          <PhotoPreview
            photos={photos}
            startId={screen.id}
            onClose={() => setScreen({ name: "main" })}
            onAddMore={() => setScreen({ name: "capture", mode: "album" })}
            onDone={(next) => {
              setPhotos(sortBySlot(next));
              setScreen({ name: "main" });
            }}
          />
        ) : null}
        {screen.name === "video" ? (
          <VideoCapture
            notify={notify}
            initial={screen.reshoot && video ? { segs: video.segs, durations: video.durations, thumbs: [], stages: video.stages, plan: video.plan, marks: video.marks, steps: video.steps } : undefined}
            onClose={() => setScreen(screen.reshoot ? { name: "vedit" } : { name: "main" })}
            onFinished={(take) => setScreen(take.imported ? { name: "cover", take } : { name: "vpreview", take })}
          />
        ) : null}
        {screen.name === "vpreview" ? (
          <VideoPreview take={screen.take} onClose={() => setScreen({ name: "main" })} onNext={() => setScreen({ name: "cover", take: screen.take })} />
        ) : null}
        {screen.name === "vedit" && video ? (
          <VideoPreview
            take={{ segs: video.segs, durations: video.durations, thumbs: [video.cover], imported: video.imported, stages: video.stages, plan: video.plan, marks: video.marks, steps: video.steps }}
            edit
            onClose={() => setScreen({ name: "main" })}
            onReshoot={video.imported ? undefined : () => setScreen({ name: "video", reshoot: true })}
            onCover={() => setScreen({ name: "cover", take: { segs: video.segs, durations: video.durations, thumbs: [video.cover], imported: video.imported, stages: video.stages, plan: video.plan }, coverOnly: true })}
            onDelete={() => setConfirm({ kind: "video" })}
          />
        ) : null}
        {screen.name === "cover" ? (
          <CoverPicker
            segs={screen.take.segs}
            fallback={screen.take.thumbs}
            onClose={() => setScreen(screen.coverOnly ? { name: "vedit" } : { name: "main" })}
            onDone={(cover) => {
              const t = screen.take;
              if (screen.coverOnly) {
                setScreen({ name: "main" });
                setVideo((v) => (v ? { ...v, cover } : v));
                return;
              }
              setScreen({ name: "shorts", take: t, cover });
            }}
          />
        ) : null}
        {screen.name === "shorts" ? <ShortsBuilder take={screen.take} cover={screen.cover} onBack={() => setScreen({ name: "cover", take: screen.take })} onUse={() => commitVideo(screen.take, screen.cover)} /> : null}
        {screen.name === "rules" ? <RulesPage onBack={() => setScreen({ name: "main" })} onAdd={() => setScreen({ name: "capture", mode: "cam" })} /> : null}

        {confirm ? (
          <Confirm
            text={confirm.kind === "photo" ? "사진을 삭제할까요?" : "영상을 삭제할까요?"}
            onCancel={() => setConfirm(null)}
            onOk={() => {
              if (confirm.kind === "photo") removePhoto(confirm.id);
              else {
                setVideo(null);
                if (screen.name === "vedit") setScreen({ name: "main" });
              }
              setConfirm(null);
            }}
          />
        ) : null}
        {askLeave ? (
          // 58: 「信息尚未发布完成,确认要离开吗？」 不保存 / 保存并退出(바깥을 누르면 그대로 머문다)
          <Confirm
            text="아직 등록을 마치지 않았어요. 나갈까요?"
            cancelText="저장 안 함"
            okText="저장하고 나가기"
            onDim={() => setAskLeave(false)}
            onCancel={() => {
              setAskLeave(false);
              window.history.back();
            }}
            onOk={() => {
              setAskLeave(false);
              setDrafts((d) => d + 1);
              notify("임시저장했어요");
              window.setTimeout(() => window.history.back(), 600);
            }}
          />
        ) : null}
        <Toast text={toast} />
      </div>
      <ShortformStudio open={studioOpen} onClose={() => setStudioOpen(false)} onUse={output => {
        const url = URL.createObjectURL(output.blob);
        const cover = URL.createObjectURL(output.cover);
        studioUrls.current.push(url, cover);
        setVideo({ segs: [url], durations: [output.duration], cover, uploading: false, imported: true });
        setScreen({ name: 'main' });
        setStudioOpen(false);
        notify('완성한 숏폼을 추가했어요. 실제 등록은 하지 않았어요.');
      }} />
    </div>
  );
}

