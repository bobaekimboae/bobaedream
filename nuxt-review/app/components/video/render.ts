import { platesAt, quadFrame, type PlateTrack } from "./plate-detect";

// 영상 올리기 엔진: 여러 클립을 한 줄로 잇는 Seq, 시간 계획(속도·시간 효과), 캔버스 그리기(필터·효과·번호판·자막), 내보내기.
// 미리보기와 내보내기가 같은 Player · drawFrame을 써서 화면에서 본 그대로 영상이 만들어진다.

export interface Clip {
  id: string;
  url: string;
  name: string;
  /** 실제 길이(초) */
  dur: number;
  /** 촬영 속도(0.5 · 1 · 2): 재생 때 이 배율로 빨라진다 */
  rate: number;
  w: number;
  h: number;
  thumb: string;
  filter?: string;
}

export type FxKind = "smudge" | "window" | "shake" | "hallu" | "oldtv" | "soul";
export interface FxRange { kind: FxKind; start: number; end: number }
export type TimeFx = { kind: "none" | "reverse" | "repeat" | "slow"; at: number };
/** 번호판 가리기: track이 있으면 자동으로 찾은 위치(차를 따라 움직임), 없으면 직접 옮기는 상자 하나(x · y · w · h) */
export interface Plate { x: number; y: number; w: number; h: number; style: "blur" | "sticker"; track?: PlateTrack }
export interface Caption { id: string; text: string; start: number; end: number; x: number; y: number }
export interface EditState {
  filter: string;
  effects: FxRange[];
  timeFx: TimeFx;
  plate: Plate | null;
  captions: Caption[];
  volume: number;
  cover: { t: number; title: string };
}
export interface Look { filter: string; effects: FxRange[]; plate: Plate | null; captions: Caption[] }

export const FILTERS: { id: string; name: string; tab: "film" | "scene" | "tone"; css: string }[] = [
  { id: "normal", name: "기본", tab: "film", css: "none" },
  { id: "instant", name: "인스턴트", tab: "film", css: "contrast(1.08) saturate(1.25) sepia(.18) brightness(1.04)" },
  { id: "years", name: "연대", tab: "film", css: "sepia(.45) saturate(.85) contrast(1.05) hue-rotate(-8deg)" },
  { id: "lightfilm", name: "라이트필름", tab: "film", css: "brightness(1.1) contrast(.92) saturate(.9)" },
  { id: "hidden", name: "은은함", tab: "film", css: "saturate(.6) contrast(.95) brightness(1.03)" },
  { id: "clear", name: "맑음", tab: "scene", css: "saturate(1.35) contrast(1.08) brightness(1.05)" },
  { id: "sunset", name: "노을", tab: "scene", css: "sepia(.25) saturate(1.4) hue-rotate(-15deg) brightness(1.04)" },
  { id: "mono", name: "흑백", tab: "tone", css: "grayscale(1) contrast(1.1)" },
];
export const FILTER_TABS = [
  { id: "film", name: "필름" },
  { id: "scene", name: "풍경" },
  { id: "tone", name: "색감" },
] as const;
export const filterCss = (id: string) => FILTERS.find((f) => f.id === id)?.css || "none";

export const EFFECTS: { kind: FxKind; name: string; color: string }[] = [
  { kind: "smudge", name: "얼룩", color: "#C9884A" },
  { kind: "window", name: "창문", color: "#4FB3E8" },
  { kind: "shake", name: "흔들림", color: "#E8564F" },
  { kind: "hallu", name: "환각", color: "#A35CE8" },
  { kind: "oldtv", name: "옛날 TV", color: "#8C8C8C" },
  { kind: "soul", name: "유체이탈", color: "#3FC29A" },
];
export const fxColor = (k: FxKind) => EFFECTS.find((e) => e.kind === k)?.color || "#fff";

export const TIME_FX = [
  { kind: "none", name: "없음" },
  { kind: "reverse", name: "되감기" },
  { kind: "repeat", name: "반복" },
  { kind: "slow", name: "슬로모션" },
] as const;

export const mmss = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
export const uid = () => Math.random().toString(36).slice(2, 10);

/* ───────── 영상 정보 · 썸네일 ───────── */

function loadVideo(url: string): Promise<HTMLVideoElement> {
  return new Promise((ok, ng) => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.src = url;
    v.onloadedmetadata = () => ok(v);
    v.onerror = () => ng(new Error("영상을 읽지 못했어요"));
  });
}
function seekEl(v: HTMLVideoElement, t: number): Promise<void> {
  return new Promise((ok) => {
    const done = () => { v.removeEventListener("seeked", done); ok(); };
    v.addEventListener("seeked", done);
    try { v.currentTime = Math.max(0, Math.min(t, (v.duration || 0) - 0.05)); } catch { done(); }
    setTimeout(done, 1500);
  });
}
function snap(v: HTMLVideoElement, w: number, h: number, q = 0.7): string {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d")!;
  const r = Math.max(w / (v.videoWidth || 1), h / (v.videoHeight || 1));
  const dw = v.videoWidth * r, dh = v.videoHeight * r;
  x.fillStyle = "#111";
  x.fillRect(0, 0, w, h);
  x.drawImage(v, (w - dw) / 2, (h - dh) / 2, dw, dh);
  return c.toDataURL("image/jpeg", q);
}

/** 파일 → 클립(길이 · 크기 · 썸네일) */
export async function makeClip(file: Blob, name: string, rate = 1, filter?: string): Promise<Clip> {
  const url = URL.createObjectURL(file);
  const v = await loadVideo(url);
  // 녹화본(webm)은 길이가 Infinity로 나오는 경우가 있어 끝으로 한 번 보내 길이를 얻는다
  let dur = v.duration;
  if (!isFinite(dur)) {
    await seekEl(v, 1e9);
    dur = v.duration;
    if (!isFinite(dur)) dur = v.currentTime || 1;
  }
  await seekEl(v, Math.min(0.1, dur / 2));
  const thumb = snap(v, 160, 160);
  const clip: Clip = { id: uid(), url, name, dur, rate, w: v.videoWidth || 720, h: v.videoHeight || 1280, thumb, filter };
  v.removeAttribute("src");
  v.load();
  return clip;
}

/** 이어진 클립들에서 n장의 필름 스트립 썸네일 */
export async function stripFrames(clips: Clip[], n: number, w = 64, h = 96): Promise<string[]> {
  const total = clips.reduce((a, c) => a + c.dur / c.rate, 0);
  const out: string[] = [];
  const els = new Map<string, HTMLVideoElement>();
  for (let i = 0; i < n; i++) {
    let s = ((i + 0.5) / n) * total;
    let c = clips[0];
    for (const k of clips) { const d = k.dur / k.rate; if (s <= d) { c = k; break; } s -= d; c = k; }
    if (!c) break;
    let v = els.get(c.id);
    if (!v) { v = await loadVideo(c.url); els.set(c.id, v); }
    await seekEl(v, s * c.rate);
    out.push(snap(v, w, h, 0.6));
  }
  els.forEach((v) => { v.removeAttribute("src"); v.load(); });
  return out;
}

/* ───────── 클립 이어 붙이기 ───────── */

export class Seq {
  els: HTMLVideoElement[] = [];
  offs: number[] = [];
  total = 0;
  constructor(public clips: Clip[]) {}
  async load() {
    this.els = await Promise.all(this.clips.map((c) => loadVideo(c.url)));
    this.els.forEach((e, i) => { e.loop = false; e.dataset.ci = String(i); });
    let t = 0;
    this.offs = this.clips.map((c) => { const o = t; t += c.dur / c.rate; return o; });
    this.total = t;
    return this;
  }
  /** 가상 시각 s → 클립 번호 · 실제 재생 위치 */
  locate(s: number) {
    const st = Math.max(0, Math.min(s, this.total - 0.001));
    let i = this.offs.length - 1;
    while (i > 0 && this.offs[i] > st) i--;
    const c = this.clips[i];
    return { i, real: (st - this.offs[i]) * c.rate };
  }
  get w() { return this.clips[0]?.w || 720; }
  get h() { return this.clips[0]?.h || 1280; }
  dispose() {
    this.els.forEach((e) => { e.pause(); e.removeAttribute("src"); e.load(); });
    this.els = [];
  }
}

/* ───────── 시간 계획 ───────── */

/** 출력 시각 u ∈ [o, o+d) → 원본 시각 s = src + (u-o) * rate */
export interface Seg { o: number; d: number; src: number; rate: number }

export function makePlan(a: number, b: number, speed: number, tfx: TimeFx): Seg[] {
  const segs: Seg[] = [];
  let o = 0;
  const push = (src: number, len: number, rate: number) => {
    if (len <= 0.001) return;
    const d = len / Math.abs(rate);
    segs.push({ o, d, src, rate });
    o += d;
  };
  const p = Math.max(a, Math.min(tfx.at, b - 1));
  const w = Math.min(1, b - a);
  if (tfx.kind === "reverse") push(b, b - a, -speed);
  else if (tfx.kind === "repeat") { push(a, p + w - a, speed); push(p, w, speed); push(p, w, speed); push(p + w, b - p - w, speed); }
  else if (tfx.kind === "slow") { push(a, p - a, speed); push(p, w, speed * 0.4); push(p + w, b - p - w, speed); }
  else push(a, b - a, speed);
  return segs;
}
export const planDur = (p: Seg[]) => p.reduce((s, x) => Math.max(s, x.o + x.d), 0);
export function srcAt(plan: Seg[], u: number) {
  let g = plan[plan.length - 1];
  for (const s of plan) if (u < s.o + s.d) { g = s; break; }
  if (!g) return { s: 0, rate: 1 };
  return { s: g.src + (Math.min(u, g.o + g.d) - g.o) * g.rate, rate: g.rate };
}

/** 출력 크기: 첫 클립 비율, 긴 변 maxLong, 짝수 */
export function outSize(w: number, h: number, maxLong: number) {
  const r = maxLong / Math.max(w, h);
  const k = Math.min(1, r);
  const ev = (n: number) => Math.max(2, Math.round((n * k) / 2) * 2);
  return { w: ev(w), h: ev(h) };
}

/* ───────── 그리기 ───────── */

const canFilter = typeof document !== "undefined" && "filter" in (document.createElement("canvas").getContext("2d") || {});

type Src = CanvasImageSource & { videoWidth?: number; videoHeight?: number; width?: number; height?: number };
function contain(ctx: CanvasRenderingContext2D, v: Src, x: number, y: number, w: number, h: number) {
  const vw = v.videoWidth || (v.width as number) || w, vh = v.videoHeight || (v.height as number) || h;
  const r = Math.min(w / vw, h / vh);
  const dw = vw * r, dh = vh * r;
  ctx.drawImage(v, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}
// 같은 시각이면 같은 값(효과 무늬가 깜빡이지 않게)
const rnd = (n: number) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };

/** 번호판 가림 한 장(돌려 그린 둥근 상자: 흐림 또는 보배드림 스티커) */
function coverPlate(g: CanvasRenderingContext2D, src: Src, f: { x: number; y: number; ang: number; w: number; h: number }, style: Plate["style"], blurPx: number) {
  const w = f.w * 1.18, h = f.h * 1.45;
  g.save();
  g.translate(f.x, f.y);
  g.rotate(f.ang);
  g.beginPath();
  g.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) * 0.18);
  if (style === "sticker") {
    g.fillStyle = "#fff";
    g.fill();
    g.strokeStyle = "#306BD9";
    g.lineWidth = Math.max(2, h * 0.08);
    g.stroke();
    g.fillStyle = "#306BD9";
    g.font = `800 ${h * 0.5}px Pretendard, sans-serif`;
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("보배드림", 0, h * 0.02, w * 0.86);
    g.restore();
    return;
  }
  g.rotate(-f.ang);
  g.translate(-f.x, -f.y);
  g.clip();
  if (canFilter) {
    g.filter = `blur(${blurPx}px)`;
    g.drawImage(src, 0, 0, g.canvas.width, g.canvas.height);
    g.filter = "none";
  }
  // 흐림을 못 쓰는 브라우저 · 흐림 위에 한 번 더: 큰 칸 모자이크
  const t = document.createElement("canvas");
  t.width = Math.max(3, Math.round(w / Math.max(8, h / 3)));
  t.height = Math.max(2, Math.round(t.width * (h / w)));
  t.getContext("2d")!.drawImage(g.canvas, f.x - w / 2, f.y - h / 2, w, h, 0, 0, t.width, t.height);
  g.imageSmoothingEnabled = !canFilter;
  g.drawImage(t, f.x - w / 2, f.y - h / 2, w, h);
  g.imageSmoothingEnabled = true;
  g.restore();
}
let coverCv: HTMLCanvasElement | null = null;
/** 자동으로 찾은 번호판을 원본 장면에 먼저 가린 그림(효과 · 흔들림 · 4분할에도 가림이 함께 따라간다) */
function coveredSource(v: HTMLVideoElement, p: Plate): Src {
  const track = p.track;
  if (!track) return v;
  const quads = platesAt(track, Number(v.dataset.ci ?? 0), v.currentTime);
  if (!quads.length) return v;
  const k = Math.min(1, 1280 / Math.max(v.videoWidth, v.videoHeight));
  const W = Math.round(v.videoWidth * k), H = Math.round(v.videoHeight * k);
  coverCv ??= document.createElement("canvas");
  if (coverCv.width !== W || coverCv.height !== H) { coverCv.width = W; coverCv.height = H; }
  const g = coverCv.getContext("2d")!;
  g.drawImage(v, 0, 0, W, H);
  for (const q of quads) coverPlate(g, v, quadFrame(q, W, H), p.style, Math.max(6, W * 0.02));
  return coverCv;
}

export function drawFrame(ctx: CanvasRenderingContext2D, v0: HTMLVideoElement | null, u: number, look: Look, W: number, H: number) {
  ctx.save();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  if (!v0 || v0.readyState < 2) { ctx.restore(); return; }
  const v = look.plate?.track ? coveredSource(v0, look.plate) : v0;
  const on = new Set(look.effects.filter((e) => u >= e.start && u < e.end).map((e) => e.kind));
  let f = filterCss(look.filter);
  if (on.has("oldtv")) f = `${f === "none" ? "" : f} grayscale(.7) sepia(.35) contrast(1.25)`.trim();
  if (on.has("smudge")) f = `${f === "none" ? "" : f} blur(${W * 0.002}px) saturate(.8)`.trim();
  if (canFilter) ctx.filter = f || "none";

  // 바탕 영상
  ctx.save();
  if (on.has("shake")) {
    const dx = Math.sin(u * 47) * W * 0.022, dy = Math.cos(u * 39) * H * 0.016;
    ctx.translate(W / 2 + dx, H / 2 + dy);
    ctx.scale(1.07, 1.07);
    ctx.translate(-W / 2, -H / 2);
  }
  if (on.has("window")) {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) contain(ctx, v, (c * W) / 2, (r * H) / 2, W / 2, H / 2);
  } else contain(ctx, v, 0, 0, W, H);
  ctx.restore();

  // 겹치는 효과
  if (on.has("soul")) {
    const k = 1 + ((u * 1.6) % 1) * 0.28;
    ctx.save();
    ctx.globalAlpha = 0.38 * (1 - ((u * 1.6) % 1));
    ctx.translate(W / 2, H / 2);
    ctx.scale(k, k);
    ctx.translate(-W / 2, -H / 2);
    contain(ctx, v, 0, 0, W, H);
    ctx.restore();
  }
  if (on.has("hallu")) {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.55;
    if (canFilter) ctx.filter = `${f === "none" ? "" : f} hue-rotate(110deg)`.trim();
    contain(ctx, v, W * 0.025 * Math.sin(u * 6), 0, W, H);
    if (canFilter) ctx.filter = `${f === "none" ? "" : f} hue-rotate(240deg)`.trim();
    contain(ctx, v, -W * 0.025 * Math.sin(u * 6), H * 0.01, W, H);
    ctx.restore();
  }
  if (canFilter) ctx.filter = "none";
  if (on.has("smudge")) {
    const seed = Math.floor(u * 2);
    for (let i = 0; i < 7; i++) {
      const x = rnd(seed * 31 + i) * W, y = rnd(seed * 17 + i * 3) * H, r = (0.08 + rnd(i + seed) * 0.12) * W;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(110,80,50,.35)");
      g.addColorStop(1, "rgba(110,80,50,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  if (on.has("oldtv")) {
    ctx.fillStyle = "rgba(0,0,0,.22)";
    const step = Math.max(3, Math.round(H / 260));
    for (let y = 0; y < H; y += step * 2) ctx.fillRect(0, y, W, step);
    const band = ((u * 0.6) % 1) * H;
    ctx.fillStyle = "rgba(255,255,255,.08)";
    ctx.fillRect(0, band, W, H * 0.06);
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.7);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.55)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  // 번호판 가리기(직접 옮긴 상자 · 영상 전체 같은 자리)
  const p = look.plate;
  if (p && !p.track) {
    const x = p.x * W, y = p.y * H, w = p.w * W, h = p.h * H;
    if (p.style === "sticker") {
      const r = Math.min(w, h) * 0.18;
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#306BD9";
      ctx.lineWidth = Math.max(2, h * 0.08);
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#306BD9";
      ctx.font = `800 ${h * 0.5}px Pretendard, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("보배드림", x + w / 2, y + h / 2, w * 0.86);
    } else if (canFilter) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, w, h);
      ctx.clip();
      ctx.filter = `blur(${Math.max(6, W * 0.025)}px)`;
      contain(ctx, v, 0, 0, W, H);
      ctx.restore();
    } else {
      // 필터를 못 쓰는 브라우저: 모자이크
      const t = document.createElement("canvas");
      t.width = Math.max(4, Math.round(w / 14));
      t.height = Math.max(2, Math.round(h / 14));
      t.getContext("2d")!.drawImage(ctx.canvas, x, y, w, h, 0, 0, t.width, t.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(t, x, y, w, h);
      ctx.imageSmoothingEnabled = true;
    }
  }

  // 자막
  for (const c of look.captions) {
    if (!c.text || u < c.start || u >= c.end) continue;
    const fs = Math.round(Math.min(W, H) * 0.062);
    ctx.font = `700 ${fs}px Pretendard, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = fs * 0.18;
    ctx.strokeStyle = "rgba(0,0,0,.85)";
    ctx.fillStyle = "#fff";
    const lines = wrap(ctx, c.text, W * 0.86);
    lines.forEach((l, i) => {
      const yy = c.y * H + (i - (lines.length - 1) / 2) * fs * 1.25;
      ctx.strokeText(l, c.x * W, yy);
      ctx.fillText(l, c.x * W, yy);
    });
  }
  ctx.restore();
}
function wrap(ctx: CanvasRenderingContext2D, text: string, max: number) {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const ch of para) {
      if (ctx.measureText(line + ch).width > max && line) { out.push(line); line = ch; }
      else line += ch;
    }
    out.push(line);
  }
  return out.slice(0, 4);
}

/* ───────── 재생기(미리보기 · 내보내기 공용) ───────── */

export class Player {
  plan: Seg[] = [];
  dur = 0;
  t = 0;
  playing = false;
  loop = true;
  audible = true;
  volume = 1;
  active = -1;
  onTime?: (u: number) => void;
  onEnd?: () => void;
  private raf = 0;
  private t0 = 0;
  private base = 0;
  private seekTok = 0;
  ctx: CanvasRenderingContext2D;
  constructor(public seq: Seq, public canvas: HTMLCanvasElement, public look: () => Look) {
    this.ctx = canvas.getContext("2d")!;
  }
  setPlan(p: Seg[]) {
    this.plan = p;
    this.dur = planDur(p);
    if (this.t > this.dur) this.t = 0;
  }
  private el() { return this.active >= 0 ? this.seq.els[this.active] : null; }
  private sync(u: number, hard: boolean) {
    const { s, rate } = srcAt(this.plan, u);
    const { i, real } = this.seq.locate(s);
    if (i !== this.active) { this.el()?.pause(); this.active = i; }
    const el = this.seq.els[i];
    if (!el) return Promise.resolve();
    const cr = this.seq.clips[i].rate;
    el.muted = !(this.audible && this.playing && rate > 0) || this.volume <= 0;
    el.volume = Math.max(0, Math.min(1, this.volume));
    if (!this.playing || rate < 0 || hard) {
      el.pause();
      if (hard) return seekEl(el, real);
      if (Math.abs(el.currentTime - real) > 0.04 && !el.seeking) el.currentTime = real;
    } else {
      const pr = Math.max(0.0625, Math.min(16, Math.abs(rate) * cr));
      if (Math.abs(el.playbackRate - pr) > 0.001) el.playbackRate = pr;
      if (el.paused) el.play().catch(() => {});
      if (Math.abs(el.currentTime - real) > 0.35 && !el.seeking) el.currentTime = real;
    }
    return Promise.resolve();
  }
  render() {
    const { width: W, height: H } = this.canvas;
    drawFrame(this.ctx, this.el(), this.t, this.look(), W, H);
  }
  async seek(u: number) {
    const tok = ++this.seekTok;
    this.t = Math.max(0, Math.min(u, this.dur));
    await this.sync(this.t, true);
    if (tok === this.seekTok) this.render();
    this.onTime?.(this.t);
  }
  play() {
    if (this.playing) return;
    if (this.t >= this.dur - 0.03) this.t = 0;
    this.playing = true;
    this.base = this.t;
    this.t0 = performance.now();
    this.sync(this.t, false);
    const tick = () => {
      if (!this.playing) return;
      let u = this.base + (performance.now() - this.t0) / 1000;
      if (u >= this.dur) {
        if (this.loop) { u = 0; this.base = 0; this.t0 = performance.now(); }
        else { this.t = this.dur; this.render(); this.pause(); this.onEnd?.(); return; }
      }
      this.t = u;
      this.sync(u, false);
      this.render();
      this.onTime?.(u);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }
  pause() {
    this.playing = false;
    cancelAnimationFrame(this.raf);
    this.seq.els.forEach((e) => e.pause());
    this.onTime?.(this.t);
  }
  toggle() { this.playing ? this.pause() : this.play(); }
  destroy() {
    this.pause();
    this.onTime = undefined;
    this.onEnd = undefined;
  }
}

/* ───────── 내보내기 ───────── */

export function pickMime() {
  const list = ["video/mp4;codecs=avc1,mp4a", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
  if (typeof MediaRecorder === "undefined") return "";
  return list.find((m) => MediaRecorder.isTypeSupported(m)) || "";
}

/** 원본 소리를 출력 시간표대로 다시 깐 오디오(속도 · 되감기 · 반복 반영) */
async function buildAudio(ac: AudioContext, seq: Seq, plan: Seg[], dur: number): Promise<AudioBuffer | null> {
  const bufs = await Promise.all(
    seq.clips.map(async (c) => {
      try { return await ac.decodeAudioData(await (await fetch(c.url)).arrayBuffer()); } catch { return null; }
    }),
  );
  if (!bufs.some(Boolean)) return null;
  const sr = ac.sampleRate;
  const len = Math.max(1, Math.ceil(dur * sr));
  const out = ac.createBuffer(2, len, sr);
  const L = out.getChannelData(0), R = out.getChannelData(1);
  for (const g of plan) {
    const n0 = Math.floor(g.o * sr), n1 = Math.min(len, Math.floor((g.o + g.d) * sr));
    for (let n = n0; n < n1; n++) {
      const s = g.src + (n / sr - g.o) * g.rate;
      const { i, real } = seq.locate(s);
      const b = bufs[i];
      if (!b) continue;
      const k = Math.floor(real * b.sampleRate);
      if (k < 0 || k >= b.length) continue;
      L[n] = b.getChannelData(0)[k];
      R[n] = b.getChannelData(b.numberOfChannels > 1 ? 1 : 0)[k];
    }
  }
  return out;
}

export interface ExportResult { blob: Blob; url: string; cover: string; duration: number; width: number; height: number }

export async function exportVideo(opt: {
  seq: Seq;
  plan: Seg[];
  look: Look;
  volume: number;
  cover: { t: number; title: string };
  onProgress: (p: number) => void;
  signal: AbortSignal;
}): Promise<ExportResult> {
  const { seq, plan, look } = opt;
  const dur = planDur(plan);
  const { w, h } = outSize(seq.w, seq.h, 1280);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const mime = pickMime();
  if (!mime || !canvas.captureStream) throw new Error("이 브라우저는 영상 만들기를 지원하지 않아요");

  const stream = canvas.captureStream(30);
  const ac = new AudioContext();
  let src: AudioBufferSourceNode | null = null;
  if (opt.volume > 0) {
    const buf = await buildAudio(ac, seq, plan, dur);
    if (buf) {
      const dest = ac.createMediaStreamDestination();
      const gain = ac.createGain();
      gain.gain.value = opt.volume;
      src = ac.createBufferSource();
      src.buffer = buf;
      src.connect(gain).connect(dest);
      dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
    }
  }
  if (opt.signal.aborted) throw new DOMException("취소", "AbortError");

  const player = new Player(seq, canvas, () => look);
  player.audible = false;
  player.loop = false;
  player.setPlan(plan);
  await player.seek(0);

  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 5_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
  const stopped = new Promise<void>((ok) => { rec.onstop = () => ok(); });

  let aborted = false;
  const abort = () => { aborted = true; player.pause(); if (rec.state !== "inactive") rec.stop(); };
  opt.signal.addEventListener("abort", abort);

  player.onTime = (u) => opt.onProgress(Math.min(0.99, u / dur));
  const ended = new Promise<void>((ok) => { player.onEnd = () => ok(); });
  rec.start(250);
  if (ac.state === "suspended") await ac.resume();
  src?.start();
  player.play();
  await Promise.race([ended, stopped]);
  if (rec.state !== "inactive") rec.stop();
  await stopped;
  src?.stop();
  stream.getTracks().forEach((t) => t.stop());
  ac.close();
  opt.signal.removeEventListener("abort", abort);
  if (aborted) { player.destroy(); throw new DOMException("취소", "AbortError"); }

  // 표지
  await player.seek(Math.min(opt.cover.t, dur - 0.05));
  const cover = coverImage(canvas, opt.cover.title);
  player.destroy();
  opt.onProgress(1);
  const blob = new Blob(chunks, { type: mime.split(";")[0] });
  return { blob, url: URL.createObjectURL(blob), cover, duration: dur, width: w, height: h };
}

/** 지금 캔버스에 표지 제목을 얹어 jpeg로 */
export function coverImage(canvas: HTMLCanvasElement, title: string) {
  const c = document.createElement("canvas");
  c.width = canvas.width;
  c.height = canvas.height;
  const x = c.getContext("2d")!;
  x.drawImage(canvas, 0, 0);
  if (title.trim()) {
    const W = c.width, H = c.height;
    const g = x.createLinearGradient(0, H * 0.55, 0, H);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,.6)");
    x.fillStyle = g;
    x.fillRect(0, 0, W, H);
    const fs = Math.round(Math.min(W, H) * 0.08);
    x.font = `800 ${fs}px Pretendard, sans-serif`;
    x.fillStyle = "#fff";
    x.textAlign = "left";
    x.textBaseline = "bottom";
    const lines = wrap(x, title.trim(), W * 0.86);
    lines.forEach((l, i) => x.fillText(l, W * 0.07, H * 0.92 - (lines.length - 1 - i) * fs * 1.2));
  }
  return c.toDataURL("image/jpeg", 0.85);
}

/** 미리보기용 축소 크기 */
export const previewSize = (seq: Seq) => outSize(seq.w, seq.h, 960);

export const reduceMotion = () => typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/** 출력 시간표(plan)대로 n장 장면(자막 · 표지 줄에 까는 필름) */
export async function planFrames(seq: Seq, plan: Seg[], n: number, w = 72, h = 128): Promise<string[]> {
  const dur = planDur(plan);
  const out: string[] = [];
  const els = new Map<number, HTMLVideoElement>();
  for (let k = 0; k < n; k++) {
    const { s } = srcAt(plan, ((k + 0.5) / n) * dur);
    const { i, real } = seq.locate(s);
    let v = els.get(i);
    if (!v) { v = await loadVideo(seq.clips[i]!.url); els.set(i, v); }
    await seekEl(v, real);
    out.push(snap(v, w, h, 0.6));
  }
  els.forEach((v) => { v.removeAttribute("src"); v.load(); });
  return out;
}
