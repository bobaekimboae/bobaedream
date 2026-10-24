// 58同城 二手车发布(중고차 등록) 사진·영상 촬영 흐름 재현(2026-10-24 폰 실측, run4 캡처 s01~z06).
// ?register=shoot 으로 연다. 실제 등록·업로드 요청은 보내지 않는다(「등록하기」는 안내만).
import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import "./shoot.css";
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
import { RuleIllustration, STAGE_GUIDE, StageTemplate, type RuleAngle, type VideoStage } from "./templates";

const base = typeof document === "undefined" ? import.meta.env.BASE_URL : new URL(".", document.baseURI).pathname;
const icon = (dir: string, name: string) => `${base}icons/${dir}/${name}`;
const rd = (n: string) => icon("reddit-shoot", `${n}.svg`);

// ── 데이터 ─────────────────────────────────────────────
/** 사진 촬영 레일 각도(58: 左前45° 车头 右前45° 右侧面 车尾 左侧面 仪表盘 内饰 发动机舱 后备箱 其他 其他) */
const PHOTO_SLOTS = ["좌측 전면 45°", "정면", "우측 전면 45°", "우측면", "후면", "좌측면", "계기판", "실내", "엔진룸", "트렁크", "기타", "기타"] as const;
const OTHER = "기타";
/** 촬영 규칙 9개 각도(58 车辆图片拍摄规则: 外观4 · 中控内饰4 · 其他1) */
const RULE_ANGLES: { key: RuleAngle; label: string; group: "외관" | "실내" | "기타" }[] = [
  { key: "frontLeft", label: "좌측 전면 45°", group: "외관" },
  { key: "side", label: "측면", group: "외관" },
  { key: "rear", label: "후면", group: "외관" },
  { key: "front", label: "정면", group: "외관" },
  { key: "frontSeat", label: "앞좌석", group: "실내" },
  { key: "rearSeat", label: "뒷좌석", group: "실내" },
  { key: "dash", label: "센터페시아 전체", group: "실내" },
  { key: "cluster", label: "계기판", group: "실내" },
  { key: "engine", label: "엔진룸", group: "기타" },
];
/** 촬영 레일 각도 → 규칙 각도(인식 결과 대신 촬영한 칸 이름으로 정한다) */
const SLOT_TO_RULE: Record<string, RuleAngle | undefined> = {
  "좌측 전면 45°": "frontLeft",
  정면: "front",
  우측면: "side",
  좌측면: "side",
  후면: "rear",
  계기판: "cluster",
  실내: "dash",
  엔진룸: "engine",
};
const MAX_PHOTOS = 30;

const STAGES: { key: VideoStage; label: string }[] = [
  { key: "exterior", label: "차량 외관" },
  { key: "interior", label: "실내" },
  { key: "engine", label: "엔진룸" },
  { key: "trunk", label: "트렁크" },
];
/** 단계당 최대 22초(4단계 모두 00:22에서 자동 멈춤 확인) */
const STAGE_MAX = 22;
/** 이보다 짧으면 「녹화 시간이 부족해요」(4초 거절 · 11초 허용 확인 → 10초로 정함) */
const STAGE_MIN = 10;

type Photo = { id: string; src: string; slot: string; sticker?: Sticker; plateOn?: boolean; uploading?: boolean };
/** 등록 화면 칸 순서: 촬영 레일 각도 순(기타는 맨 뒤), 같은 각도는 올린 순 */
const slotOrder = (slot: string) => {
  const i = (PHOTO_SLOTS as readonly string[]).indexOf(slot);
  return i < 0 || slot === OTHER ? PHOTO_SLOTS.length : i;
};
const sortBySlot = (list: Photo[]) => list.map((p, i) => ({ p, i })).sort((a, b) => slotOrder(a.p.slot) - slotOrder(b.p.slot) || a.i - b.i).map((x) => x.p);
/** 영상: 단계별 파일(segs[i] = 그 단계 영상, 불러온 영상은 한 개) · 단계별 길이(초) · 표지 */
type Video = { segs: (string | null)[]; durations: number[]; cover: string; uploading: boolean; imported?: boolean };
type Take = { segs: (string | null)[]; durations: number[]; thumbs: string[]; imported?: boolean };

let seq = 0;
const uid = () => `p${Date.now().toString(36)}${(seq++).toString(36)}`;
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

// ── 사진 촬영 + 앨범 ───────────────────────────────────
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
  const videoRef = useRef<HTMLDivElement>(null);
  const [plate, setPlate] = useState(false);
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
  const swipe = useSwipe(
    () => setMode("album"),
    () => setMode("cam"),
  );

  useEffect(() => {
    const el = railEl.current?.querySelector<HTMLElement>(`[data-i="${sel}"]`);
    el?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [sel]);

  const shoot = () => {
    if (total >= MAX_PHOTOS) {
      notify(`사진은 최대 ${MAX_PHOTOS}장까지 올릴 수 있어요`);
      return;
    }
    const video = videoRef.current?.querySelector("video");
    const label = rail[sel] ?? OTHER;
    const src = (video && cam.stream && grabFrame(video)) || placeholderShot(label, session.shots.length + existing.length);
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
        {/* 58 사진 촬영 화면에는 플래시가 없다(영상 촬영 화면에만 있음) */}
        <span className="shoot-icon-btn" />
      </header>

      {mode === "cam" ? (
        <>
          <div className="shoot-view" ref={videoRef}>
            {cam.stream ? <LiveVideo stream={cam.stream} /> : <div className="shoot-nocam">{cam.error === "denied" ? "카메라 권한을 허용해 주세요" : "카메라를 켜는 중이에요"}<small>카메라가 없으면 촬영 버튼으로 시험 사진이 만들어져요</small></div>}
            <span className="shoot-pill">{(rail[sel] ?? OTHER) === OTHER ? "기타 사진 촬영" : `${rail[sel]} 촬영`}</span>
            <div className="shoot-rail" ref={railEl}>
              {[...rail.keys()].map((i) => {
                const shot = slotShots[i];
                return (
                  <div key={i} data-i={i} className={`shoot-slot ${i === sel ? "is-sel" : ""}`}>
                    <button type="button" className="shoot-slot__hit" onClick={() => setSel(i)} aria-label={`${rail[i]} 칸 선택`}>
                      {shot ? <img src={shot.src} alt="" /> : null}
                      <span className="shoot-slot__label">{rail[i]}</span>
                    </button>
                    {shot ? (
                      <button type="button" className="shoot-slot__x" aria-label={`${rail[i]} 사진 지우기`} onClick={() => removeSlotShot(i)}>
                        <Mask src={rd("close-outline")} />
                      </button>
                    ) : null}
                  </div>
                );
              })}
            </div>
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
                <span>
                  {total}/{MAX_PHOTOS}
                </span>
                <button type="button" className="shoot-done" onClick={done}>
                  완료
                </button>
              </div>
            </div>
            <ModeTabs mode={mode} onChange={setMode} labels={["촬영", "앨범"]} />
          </div>
        </>
      ) : (
        <>
          <div className="shoot-album-banner">우선 업로드 각도: 좌측 전면 45° | 정면 | 우측 전면 45° | 우측면 | 후면 | 좌측면</div>
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
              {total}/{MAX_PHOTOS}
            </span>
            {session.picked.length ? (
              <button type="button" className="shoot-done shoot-album-done" onClick={done}>
                완료
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
              {p.slot === OTHER ? "차량" : p.slot}
            </button>
          ) : (
            <div key={p.id} className={`shoot-strip__item ${i === cur ? "is-sel" : ""}`}>
              <button type="button" className="shoot-strip__hit" onClick={() => setCur(i)} aria-label={`${p.slot} 사진 보기`}>
                <img src={p.src} alt="" />
                <span>{p.slot}</span>
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
  const firstEmpty = initial ? initial.durations.findIndex((d) => d === 0) : 0;
  const [stage, setStage] = useState(Math.max(0, firstEmpty));
  const [phase, setPhase] = useState<RecPhase>(initial?.durations.some(Boolean) ? "paused" : "idle");
  const [changed, setChanged] = useState(false);
  const [count, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [durations, setDurations] = useState<number[]>(() => initial?.durations.slice() ?? [0, 0, 0, 0]);
  const [askLeave, setAskLeave] = useState(false);
  const [guide, setGuide] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const segs = useRef<(string | null)[]>(initial?.segs.slice() ?? [null, null, null, null]);
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
  useEffect(
    () => () => {
      window.clearInterval(tick.current);
      fake.current?.stop();
      if (recRef.current && recRef.current.state !== "inactive") recRef.current.stop();
    },
    [],
  );

  const sourceStream = () => {
    if (cam.stream) return cam.stream;
    if (!fake.current) fake.current = fakeStream(() => STAGES[stageRef.current].label);
    return fake.current.stream;
  };

  const finishStage = (secs: number) => {
    window.clearInterval(tick.current);
    const s = stageRef.current;
    const next = [...durRef.current];
    next[s] = Math.min(STAGE_MAX, Math.round(secs));
    setDurations(next);
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
    let remaining = STAGES.findIndex((_, i) => i > s && next[i] === 0);
    if (remaining < 0) remaining = STAGES.findIndex((_, i) => next[i] === 0);
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
      if (secs >= STAGE_MAX) {
        setElapsed(STAGE_MAX);
        finishStage(STAGE_MAX);
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
        r = type ? new MediaRecorder(sourceStream(), { mimeType: type }) : new MediaRecorder(sourceStream());
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
      setPhase("recording");
      startTimer();
    }, 1000);
  };

  const pressMain = () => {
    if (phase === "idle" || phase === "paused") begin();
    else if (phase === "recording") {
      if (elapsed < STAGE_MIN) {
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
      window.setTimeout(() => onFinished({ segs: out, durations: finalDur, thumbs: liveThumbs.current }), 600);
    });
  };

  const recording = phase === "recording" || phase === "countdown";
  const pillText = done[stage] && !recording ? `${STAGES[stage].label} 다시 찍기` : `${STAGES[stage].label} 촬영`;

  const importVideo = (files: FileList | null) => {
    const f = files?.[0];
    if (!f) return;
    onFinished({ segs: [URL.createObjectURL(f)], durations: [0, 0, 0, 0], thumbs: [], imported: true });
  };

  return (
    <div className="shoot-layer shoot-capture is-video">
      <header className="shoot-top">
        <button type="button" className="shoot-icon-btn" aria-label="닫기" onClick={() => ((initial ? changed : anyDone) || recording ? setAskLeave(true) : onClose())}>
          <Mask src={rd("close-outline")} />
        </button>
        <h2>차량 영상</h2>
        {mode === "cam" ? (
          <button type="button" className={`shoot-icon-btn shoot-flash ${flash ? "is-on" : ""}`} aria-pressed={flash} aria-label={flash ? "플래시 끄기" : "플래시 켜기"} onClick={() => setFlash((v) => !v)}>
            <Mask src={rd(flash ? "powerup-fill" : "powerup-outline")} />
          </button>
        ) : (
          <span className="shoot-icon-btn" />
        )}
      </header>
      {mode === "cam" ? (
        <>
          <div className="shoot-view" ref={viewRef}>
            {cam.stream ? <LiveVideo stream={cam.stream} /> : <div className="shoot-nocam">{cam.error === "denied" ? "카메라 권한을 허용해 주세요" : "카메라를 켜는 중이에요"}<small>카메라가 없으면 시험 화면으로 녹화돼요</small></div>}
            <span className="shoot-pill">{pillText}</span>
            <div className="shoot-vframe">
              <Corners />
              {phase === "countdown" ? <b className="shoot-countdown">{count}</b> : null}
              {phase === "recording" ? <span className="shoot-timer">{mmss(elapsed)}</span> : null}
              <p className="shoot-vhint">촬영 항목이 맞는지 확인해 주세요</p>
            </div>
            <div className={`shoot-stages ${recording ? "is-recording" : ""}`}>
              {STAGES.map((s, i) => {
                const active = i === stage;
                const expanded = active && !recording;
                return (
                  <button
                    key={s.key}
                    type="button"
                    className={`shoot-stage-chip ${active ? "is-active" : ""} ${expanded ? "is-expanded" : ""} ${done[i] ? "is-done" : ""}`}
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
                    {active && recording ? <i className="shoot-stage-chip__bar" style={{ width: `${(Math.min(elapsed, STAGE_MAX) / STAGE_MAX) * 100}%` }} /> : null}
                    {done[i] && !expanded ? <span className="shoot-stage-chip__time">{mmss(durations[i])}</span> : null}
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
              <button type="button" className={`shoot-rec ${phase === "recording" ? "is-recording" : ""}`} aria-label={phase === "recording" ? "일시정지" : phase === "paused" ? "계속" : "녹화 시작"} onClick={pressMain} disabled={phase === "countdown" || phase === "merging"}>
                <span>{phase === "recording" ? "일시정지" : phase === "paused" ? "계속" : ""}</span>
              </button>
              <div className="shoot-count">
                {phase === "paused" ? (
                  <button type="button" className="shoot-done" onClick={() => stopAll(durations)}>
                    다음
                  </button>
                ) : null}
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
        <div className="shoot-tpl-sheet" role="dialog" aria-modal="true" aria-label={`${STAGES[stage].label} 촬영 예시`} onClick={() => setGuide(false)}>
          <div className="shoot-tpl-sheet__box" onClick={(e) => e.stopPropagation()}>
            <div className="shoot-tpl-sheet__media">
              <StageTemplate stage={STAGES[stage].key} large />
              <span className="shoot-stage-chip__tag">예시</span>
            </div>
            <div className="shoot-tpl-sheet__text">
              <strong>{STAGES[stage].label} 이렇게 찍어 주세요</strong>
              <p>{STAGE_GUIDE[STAGES[stage].key].how}</p>
            </div>
            <button type="button" className="shoot-tpl-sheet__ok" onClick={() => setGuide(false)} autoFocus>
              확인
            </button>
          </div>
        </div>
      ) : null}
      {askLeave ? <Confirm text={initial ? "새로 찍은 내용을 버리고 나갈까요?" : "촬영한 영상을 지우고 나갈까요?"} onCancel={() => setAskLeave(false)} onOk={onClose} /> : null}
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
  const go = (n: number, play: boolean) => {
    setK(n);
    setT(0);
    setPlaying(play);
  };
  useEffect(() => {
    const v = ref.current;
    if (v && playing) void v.play().catch(() => setPlaying(false));
  }, [k, playing]);
  const cur = parts[k];
  return (
    <div className={`shoot-layer shoot-vpreview ${edit ? "is-edit" : ""}`}>
      <header className="shoot-top">
        <button type="button" className="shoot-icon-btn" aria-label="닫기" onClick={onClose}>
          <Mask src={rd("close-outline")} />
        </button>
        <h2>{edit ? "차량 영상" : "영상 미리보기"}</h2>
        <span className="shoot-icon-btn" />
      </header>
      <div className="shoot-view">
        {cur ? (
          <video
            key={cur.u}
            ref={ref}
            src={cur.u}
            className="shoot-live"
            playsInline
            onTimeUpdate={(e) => setT(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && !total && setDur(e.currentTarget.duration)}
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
        {total ? (
          <div className="shoot-stages is-done-row">
            {STAGES.map((s, i) => {
              const at = parts.findIndex((x) => x.i === i);
              return (
                <button
                  type="button"
                  key={s.key}
                  className={`shoot-stage-chip is-done ${take.durations[i] ? "" : "is-empty"} ${cur?.i === i ? "is-now" : ""}`}
                  disabled={at < 0}
                  aria-label={`${s.label} 영상부터 보기`}
                  onClick={() => go(at, true)}
                >
                  <span className="shoot-stage-chip__time">{mmss(take.durations[i])}</span>
                  <span className="shoot-stage-chip__label">{s.label}</span>
                </button>
              );
            })}
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
            다음
          </button>
        )}
      </div>
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
          완료
        </button>
      </div>
    </div>
  );
}

// ── 촬영 규칙 ──────────────────────────────────────────
function RulesPage({ onBack, onAdd }: { onBack: () => void; onAdd: () => void }) {
  const groups: { title: string; key: "외관" | "실내" | "기타" }[] = [
    { title: "차량 외관", key: "외관" },
    { title: "실내", key: "실내" },
    { title: "기타", key: "기타" },
  ];
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
          <strong>사진은 1장 이상 올려 주세요</strong>
          <p>
            차량 사진은 <em>1장</em> 이상 올려야 해요. 적으면 매물이 잘 보이지 않고 등록할 수 없어요. 아래 각도를 참고해 찍어 주세요.
          </p>
        </section>
        {groups.map((g) => {
          const items = RULE_ANGLES.filter((a) => a.group === g.key);
          return (
            <section key={g.key} className="shoot-rules__group">
              <h3>
                {g.title}({items.length}장)
              </h3>
              <p>{items.map((a) => a.label).join(" | ")}</p>
              <div className="shoot-rules__grid">
                {items.map((a) => (
                  <figure key={a.key}>
                    <RuleIllustration angle={a.key} />
                    <figcaption>{a.label}</figcaption>
                  </figure>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <div className="shoot-rules__cta">
        <button type="button" onClick={onAdd}>
          <Mask src={rd("camera-outline-24")} />
          차량 사진 추가
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
  | { name: "rules" };


export default function ShootRegister() {
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

  useEffect(() => {
    // 들어오면 0% → 소재지가 채워지며 20%(58 확인)
    const t = window.setTimeout(() => setProgress(20), 600);
    return () => window.clearTimeout(t);
  }, []);
  useEffect(() => setProgress((p) => (p === 0 ? 0 : photos.length ? 28 : 20)), [photos.length]);
  useEffect(() => {
    document.title = "보배드림 · 중고차 등록 촬영";
  }, []);

  const missing = useMemo(() => {
    const got = new Set(photos.map((p) => SLOT_TO_RULE[p.slot]).filter(Boolean));
    return RULE_ANGLES.filter((a) => !got.has(a.key));
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
  const sectionTitle = status === "uploading" ? "차량 사진 인식 중…" : status === "done" && photos.length ? "차량 사진 인식 완료" : "사진·영상 올리기";
  const hasMedia = photos.length > 0 || Boolean(video);

  return (
    <div className="shoot-root" onPointerDownCapture={primeSound}>
      <div className="shoot-phone">
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

            <section className="shoot-field">
              <div className="shoot-field__head">
                <h3>
                  {sectionTitle} <em>(필수)</em>
                </h3>
                <button type="button" className="shoot-rules-link" onClick={() => setScreen({ name: "rules" })}>
                  <Mask src={rd("help-outline")} />
                  촬영 규칙 보기
                </button>
              </div>
              <p className="shoot-hint">
                <span>첫 사진은 좌측 전면 45° 차량 사진을 써 주세요.</span> 더 잘 보여요!
              </p>

              {status === "uploading" ? (
                <div className="shoot-tipcard is-short">
                  <p>
                    사진 규정까지 <em>1</em>장 부족해요. 더 올려 주세요
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
                    매물이 더 잘 보이도록 모든 각도의 차량 사진을 올려 주세요. 아직 <em>{missing.length}</em>개 각도가 부족해요. 펼쳐서 확인하고 더 올려 주세요.
                  </p>
                  {tipOpen ? <p className="shoot-tipcard__list">더 올려 주세요: {missing.map((m) => m.label).join(" | ")}</p> : null}
                </div>
              ) : null}

              {!hasMedia ? (
                <div className="shoot-addcards">
                  <button type="button" onClick={() => setScreen({ name: "capture", mode: "cam" })}>
                    <Mask src={rd("camera-outline-24")} className="is-big" />
                    사진 추가
                  </button>
                  <i />
                  <button type="button" onClick={() => setScreen({ name: "video" })}>
                    <Mask src={rd("video-camera-outline")} className="is-big" />
                    영상 추가
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
                        <button type="button" className="shoot-tile__img" onClick={() => setScreen({ name: "preview", id: p.id })} aria-label={`${p.slot} 사진 편집`}>
                          <img src={p.src} alt="" />
                          <span className="shoot-tile__wm">보배드림</span>
                        </button>
                      )}
                      {!p.uploading ? (
                        <button type="button" className="shoot-tile__del" aria-label="사진 삭제" onClick={() => setConfirm({ kind: "photo", id: p.id })}>
                          <Mask src={rd("delete-outline")} />
                        </button>
                      ) : null}
                      <figcaption>{p.uploading ? "업로드 중" : p.slot}</figcaption>
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
                      <figcaption>&nbsp;</figcaption>
                    </figure>
                  ) : null}
                  {photos.length < MAX_PHOTOS ? (
                    <button type="button" className="shoot-tile shoot-tile--add" onClick={() => setScreen({ name: "capture", mode: "cam" })}>
                      <Mask src={rd("camera-outline-24")} className="is-big" />
                      <span>
                        {photos.length}/{MAX_PHOTOS}
                      </span>
                    </button>
                  ) : null}
                  {!video ? (
                    <button type="button" className="shoot-tile shoot-tile--add" onClick={() => setScreen({ name: "video" })}>
                      <Mask src={rd("video-camera-outline")} className="is-big" />
                      <span>영상 추가</span>
                    </button>
                  ) : null}
                </div>
              )}
            </section>

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
            <button type="button" className="shoot-publish" onClick={() => notify("시안 화면이라 실제로 등록하지 않아요")}>
              등록하기
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
            initial={screen.reshoot && video ? { segs: video.segs, durations: video.durations, thumbs: [] } : undefined}
            onClose={() => setScreen(screen.reshoot ? { name: "vedit" } : { name: "main" })}
            onFinished={(take) => setScreen(take.imported ? { name: "cover", take } : { name: "vpreview", take })}
          />
        ) : null}
        {screen.name === "vpreview" ? (
          <VideoPreview take={screen.take} onClose={() => setScreen({ name: "main" })} onNext={() => setScreen({ name: "cover", take: screen.take })} />
        ) : null}
        {screen.name === "vedit" && video ? (
          <VideoPreview
            take={{ segs: video.segs, durations: video.durations, thumbs: [], imported: video.imported }}
            edit
            onClose={() => setScreen({ name: "main" })}
            onReshoot={video.imported ? undefined : () => setScreen({ name: "video", reshoot: true })}
            onCover={() => setScreen({ name: "cover", take: { segs: video.segs, durations: video.durations, thumbs: [video.cover], imported: video.imported }, coverOnly: true })}
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
              setScreen({ name: "main" });
              if (screen.coverOnly) {
                setVideo((v) => (v ? { ...v, cover } : v));
                return;
              }
              setVideo({ segs: t.segs, durations: t.durations, cover, uploading: true, imported: t.imported });
              window.setTimeout(() => setVideo((v) => (v ? { ...v, uploading: false } : v)), 4000);
            }}
          />
        ) : null}
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
    </div>
  );
}

