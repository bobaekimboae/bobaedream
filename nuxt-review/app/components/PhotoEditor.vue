<script setup lang="ts">
// 동처띠 사진 편집기 동일 구현: 펜 · 자르기 · 텍스트 · 템플릿 · 스티커 · 모자이크 · 필터 + AI 화질 보정
import { ref, reactive, computed, onMounted, onBeforeUnmount, nextTick, markRaw } from "vue";
import Ico from "./Ico.vue";
import { EIC } from "../lib/editor-icons";
import "../assets/css/photo-editor.css";

const props = withDefaults(defineProps<{ images: string[]; start?: number; max?: number }>(), { start: 0, max: 9 });
const emit = defineEmits<{ done: [images: string[]]; close: [] }>();

type Tool = "pen" | "crop" | "text" | "tpl" | "sticker" | "mosaic" | "filter";
interface Ov { id: number; kind: "text" | "sticker"; x: number; y: number; s: number; r: number; text: string; color: string; font: "basic" | "bobae"; sticker: string }
interface Page { base: HTMLCanvasElement; pre: HTMLCanvasElement | null; ovs: Ov[]; tpl: string; filter: string; thumb: string; aiThumbs: [string, string] | null }

const MAX = 2048;
// 글 종류마다 사진 수가 다르다(일상 9 · 내 차 팔기 20). 편집하면서 사진이 빠지지 않게 글의 최대 장수를 받는다
const MAX_PAGES = props.max;
const TXT_K = 0.07; // 글자 크기 = 사진 폭 × 7% × 배율
const STK_K = 0.28; // 스티커 폭 = 사진 폭 × 28% × 배율
const FONT = '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const reduceMotion = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

/* ───────── 캔버스 도구 ───────── */
function mk(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return markRaw(c);
}
const c2d = (c: HTMLCanvasElement) => c.getContext("2d")!;
function clone(c: HTMLCanvasElement) {
  const n = mk(c.width, c.height);
  c2d(n).drawImage(c, 0, 0);
  return n;
}
function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/* ───────── 필터(13) ───────── */
interface Flt { id: string; name: string; b?: number; c?: number; s?: number; h?: number; sep?: number; tint?: [string, number, GlobalCompositeOperation] }
const FILTERS: Flt[] = [
  { id: "none", name: "원본" },
  { id: "daily", name: "일상", b: 1.05, c: 1.05, s: 1.1 },
  { id: "seasalt", name: "바다소금", b: 1.08, c: 0.95, s: 0.85, tint: ["#9fd3ff", 0.14, "soft-light"] },
  { id: "forest", name: "숲", c: 1.05, s: 1.15, h: -10, tint: ["#2f7a3a", 0.14, "soft-light"] },
  { id: "kawa", name: "카와시마", b: 1.1, c: 0.9, s: 0.8, tint: ["#ffc8d8", 0.18, "soft-light"] },
  { id: "whitetea", name: "화이트티", b: 1.15, c: 0.9, s: 0.7 },
  { id: "vivid", name: "생기", b: 1.05, c: 1.1, s: 1.35 },
  { id: "hertz", name: "헤르츠", b: 0.95, c: 1.15, s: 1.1, h: 15, tint: ["#4a2bff", 0.14, "soft-light"] },
  { id: "neon", name: "네온", c: 1.2, s: 1.4, h: -25, tint: ["#ff2bd6", 0.16, "overlay"] },
  { id: "nature", name: "자연", b: 1.03, c: 1.02, s: 1.05, sep: 0.1 },
  { id: "beach", name: "바닷가", b: 1.05, c: 1.05, s: 1.1, h: -8, tint: ["#00a3ff", 0.12, "soft-light"] },
  { id: "memory", name: "추억", b: 1.02, c: 0.9, s: 0.8, sep: 0.45 },
  { id: "street", name: "거리", b: 0.95, c: 1.25, s: 0.6 },
];
const fltOf = (id: string) => FILTERS.find((f) => f.id === id) ?? FILTERS[0]!;
function cssFilter(f: Flt) {
  const p: string[] = [];
  if (f.b != null) p.push(`brightness(${f.b})`);
  if (f.c != null) p.push(`contrast(${f.c})`);
  if (f.s != null) p.push(`saturate(${f.s})`);
  if (f.h != null) p.push(`hue-rotate(${f.h}deg)`);
  if (f.sep != null) p.push(`sepia(${f.sep})`);
  return p.join(" ") || "none";
}
// ctx.filter를 지원하지 않는 브라우저(구형 사파리)용 색 행렬
type M = number[]; // 3×4 (r,g,b 행 × r,g,b,offset)
const mul = (a: M, b: M): M => {
  const o: M = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      let v = 0;
      for (let k = 0; k < 3; k++) v += a[i * 4 + k]! * b[k * 4 + j]!;
      if (j === 3) v += a[i * 4 + 3]!;
      o.push(v);
    }
  }
  return o;
};
function matrixOf(f: Flt): M {
  let m: M = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
  if (f.b != null) m = mul([f.b, 0, 0, 0, 0, f.b, 0, 0, 0, 0, f.b, 0], m);
  if (f.c != null) { const o = (0.5 - 0.5 * f.c) * 255; m = mul([f.c, 0, 0, o, 0, f.c, 0, o, 0, 0, f.c, o], m); }
  if (f.s != null) {
    const s = f.s;
    m = mul([0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s, 0, 0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s, 0, 0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s, 0], m);
  }
  if (f.h != null) {
    const a = (f.h * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
    m = mul([0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928, 0, 0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283, 0, 0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072, 0], m);
  }
  if (f.sep != null) {
    const t = f.sep, u = 1 - t;
    m = mul([u + t * 0.393, t * 0.769, t * 0.189, 0, t * 0.349, u + t * 0.686, t * 0.168, 0, t * 0.272, t * 0.534, u + t * 0.131, 0], m);
  }
  return m;
}
function applyMatrix(d: Uint8ClampedArray, m: M) {
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i]!, g = d[i + 1]!, b = d[i + 2]!;
    d[i] = m[0]! * r + m[1]! * g + m[2]! * b + m[3]!;
    d[i + 1] = m[4]! * r + m[5]! * g + m[6]! * b + m[7]!;
    d[i + 2] = m[8]! * r + m[9]! * g + m[10]! * b + m[11]!;
  }
}
let FILTER_OK = true;
function drawFiltered(ctx: CanvasRenderingContext2D, src: HTMLCanvasElement, W: number, H: number, f: Flt) {
  if (f.id !== "none" && FILTER_OK) {
    ctx.filter = cssFilter(f);
    ctx.drawImage(src, 0, 0, W, H);
    ctx.filter = "none";
  } else {
    ctx.drawImage(src, 0, 0, W, H);
    if (f.id !== "none") {
      const d = ctx.getImageData(0, 0, W, H);
      applyMatrix(d.data, matrixOf(f));
      ctx.putImageData(d, 0, 0);
    }
  }
  if (f.tint) {
    ctx.save();
    ctx.globalCompositeOperation = f.tint[2];
    ctx.globalAlpha = f.tint[1];
    ctx.fillStyle = f.tint[0];
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

/* ───────── 템플릿(캔버스로 직접 그림) ───────── */
interface Tpl { id: string; name: string; draw?: (ctx: CanvasRenderingContext2D, W: number, H: number) => void }
function txt(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, o: { w?: string; c?: string; a?: CanvasTextAlign; i?: boolean; sh?: boolean; ls?: number } = {}) {
  ctx.save();
  ctx.font = `${o.i ? "italic " : ""}${o.w ?? "800"} ${size}px ${FONT}`;
  ctx.fillStyle = o.c ?? "#fff";
  ctx.textAlign = o.a ?? "left";
  ctx.textBaseline = "top";
  if (o.sh) { ctx.shadowColor = "rgba(0,0,0,.45)"; ctx.shadowBlur = size * 0.25; ctx.shadowOffsetY = size * 0.05; }
  if (o.ls) {
    let cx = x;
    for (const ch of s) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + o.ls; }
  } else ctx.fillText(s, x, y);
  ctx.restore();
}
function grad(ctx: CanvasRenderingContext2D, y0: number, y1: number, W: number, a0: number, a1: number) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, `rgba(0,0,0,${a0})`);
  g.addColorStop(1, `rgba(0,0,0,${a1})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0));
}
const TPLS: Tpl[] = [
  { id: "none", name: "없음" },
  {
    id: "premium", name: "고급 추천",
    draw(ctx, W, H) {
      const u = Math.min(W, H) / 100;
      grad(ctx, 0, H * 0.3, W, 0.72, 0);
      txt(ctx, "고급 추천", W * 0.06, H * 0.05, u * 12, { sh: true });
      txt(ctx, "STUNNING", W * 0.065, H * 0.05 + u * 15, u * 3.2, { w: "600", ls: u * 1.6, c: "rgba(255,255,255,.85)" });
      grad(ctx, H, H * 0.78, W, 0.6, 0);
      ctx.save();
      ctx.fillStyle = "#306BD9";
      ctx.translate(W * 0.94, H * 0.93);
      ctx.transform(1, 0, -0.2, 1, 0, 0);
      rrect(ctx, -u * 30, -u * 6.5, u * 30, u * 8, u * 1.2);
      ctx.fill();
      ctx.restore();
      txt(ctx, "BOBAEDREAM", W * 0.94 - u * 15.5, H * 0.93 - u * 5.4, u * 4.2, { a: "center", i: true });
    },
  },
  {
    id: "daily", name: "보배 일상",
    draw(ctx, W, H) {
      const u = Math.min(W, H) / 100, bw = u * 3, top = u * 14, bot = u * 10;
      ctx.save();
      ctx.fillStyle = "#FFD43B";
      ctx.beginPath();
      ctx.rect(0, 0, W, H);
      ctx.rect(bw, top, W - bw * 2, H - top - bot);
      ctx.fill("evenodd");
      ctx.restore();
      txt(ctx, "보배 일상", bw + u * 2, u * 3, u * 8, { c: "#111" });
      txt(ctx, "BOBAE DAILY", W - bw - u * 2, u * 5, u * 3, { c: "#111", a: "right", w: "700" });
      txt(ctx, "BOBAEDREAM", bw + u * 2, H - bot + u * 3, u * 4.2, { c: "#111", i: true });
      ctx.save();
      ctx.fillStyle = "#111";
      let x = W - bw - u * 2;
      for (let i = 0; i < 22; i++) { const w = (i % 3 === 0 ? 0.9 : 0.45) * u; x -= w + u * 0.5; ctx.fillRect(x, H - bot + u * 2.5, w, u * 5); }
      ctx.restore();
    },
  },
  {
    id: "review", name: "차량 후기",
    draw(ctx, W, H) {
      const u = Math.min(W, H) / 100;
      grad(ctx, 0, H * 0.38, W, 0.55, 0);
      txt(ctx, "차량", W * 0.06, H * 0.05, u * 13, { sh: true });
      txt(ctx, "후기", W * 0.06, H * 0.05 + u * 14, u * 13, { sh: true });
      const d = new Date();
      const ds = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}`;
      ctx.save();
      ctx.fillStyle = "#fff";
      rrect(ctx, W * 0.06, H * 0.05 + u * 30, u * 17, u * 5, u * 1);
      ctx.fill();
      ctx.restore();
      txt(ctx, ds, W * 0.06 + u * 8.5, H * 0.05 + u * 30.8, u * 3.4, { c: "#111", a: "center", w: "700" });
      ctx.save();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = u * 0.5;
      ctx.strokeRect(W - u * 14, u * 5, u * 9, u * 9);
      ctx.restore();
      txt(ctx, "01", W - u * 9.5, u * 6.8, u * 4.5, { a: "center" });
      grad(ctx, H, H * 0.8, W, 0.55, 0);
      txt(ctx, "BOBAEDREAM REVIEW", W * 0.06, H - u * 8, u * 3.4, { w: "700", ls: u * 0.6 });
    },
  },
  {
    id: "delivery", name: "출고 축하",
    draw(ctx, W, H) {
      const u = Math.min(W, H) / 100;
      grad(ctx, 0, H * 0.32, W, 0.5, 0);
      txt(ctx, "| Delivery of vehicle |", W * 0.06, H * 0.04, u * 3, { w: "600" });
      ctx.save();
      ctx.font = `italic 900 ${u * 12}px ${FONT}`;
      ctx.textBaseline = "top";
      ctx.lineWidth = u * 1.6;
      ctx.strokeStyle = "#306BD9";
      ctx.lineJoin = "round";
      ctx.strokeText("출고 축하!", W * 0.06, H * 0.04 + u * 5);
      ctx.fillStyle = "#fff";
      ctx.fillText("출고 축하!", W * 0.06, H * 0.04 + u * 5);
      ctx.restore();
      const cols = ["#FFD43B", "#FF6B6B", "#4DABF7", "#69DB7C", "#fff"];
      let seed = 7;
      const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      ctx.save();
      for (let i = 0; i < 26; i++) {
        ctx.fillStyle = cols[i % cols.length]!;
        const x = rnd() * W, y = rnd() * H * 0.3, r = u * (0.6 + rnd() * 1.1);
        ctx.beginPath();
        if (i % 2) ctx.arc(x, y, r, 0, Math.PI * 2);
        else ctx.rect(x, y, r * 2, r);
        ctx.fill();
      }
      ctx.restore();
      ctx.save();
      ctx.fillStyle = "rgba(48,107,217,.92)";
      ctx.fillRect(0, H - u * 9, W, u * 9);
      ctx.restore();
      txt(ctx, "축하합니다 · 새 차와 함께 안전 운전하세요", W / 2, H - u * 6.4, u * 3.6, { a: "center", w: "700" });
    },
  },
  {
    id: "dream", name: "드림카",
    draw(ctx, W, H) {
      const u = Math.min(W, H) / 100;
      grad(ctx, 0, H * 0.25, W, 0.45, 0);
      ctx.save();
      ctx.font = `italic 800 ${u * 10}px Georgia, "Times New Roman", serif`;
      ctx.textBaseline = "top";
      ctx.fillStyle = "#fff";
      ctx.shadowColor = "rgba(0,0,0,.4)";
      ctx.shadowBlur = u * 2;
      ctx.fillText("Dream Car", W * 0.05, H * 0.04);
      ctx.restore();
      grad(ctx, H, H * 0.75, W, 0.6, 0);
      txt(ctx, "#Swag    #Cool    #Dream", W / 2, H - u * 13, u * 3.6, { a: "center", w: "700" });
      txt(ctx, "B O B A E D R E A M   M O T O R S", W / 2, H - u * 6.5, u * 2.6, { a: "center", w: "500", c: "rgba(255,255,255,.8)" });
    },
  },
];
const tplOf = (id: string) => TPLS.find((t) => t.id === id) ?? TPLS[0]!;

/* ───────── 스티커(번호판 가리개 + 표정) ───────── */
interface Stk { id: string; ratio: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void }
function plate(bg: string, border: string, fg: string, label: string, opt: { italic?: boolean; badge?: string } = {}) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    rrect(ctx, 0, 0, w, h, h * 0.16);
    ctx.fillStyle = bg;
    ctx.fill();
    ctx.lineWidth = h * 0.07;
    ctx.strokeStyle = border;
    rrect(ctx, h * 0.05, h * 0.05, w - h * 0.1, h - h * 0.1, h * 0.13);
    ctx.stroke();
    let x0 = h * 0.2;
    if (opt.badge) {
      ctx.fillStyle = border;
      rrect(ctx, h * 0.14, h * 0.18, h * 0.62, h * 0.64, h * 0.08);
      ctx.fill();
      ctx.fillStyle = bg;
      ctx.font = `800 ${h * 0.26}px ${FONT}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(opt.badge, h * 0.45, h * 0.52);
      x0 = h * 0.8;
    }
    ctx.fillStyle = fg;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    let size = h * 0.52;
    ctx.font = `${opt.italic ? "italic " : ""}900 ${size}px ${FONT}`;
    const avail = w - x0 - h * 0.2;
    const mw = ctx.measureText(label).width;
    if (mw > avail) { size *= avail / mw; ctx.font = `${opt.italic ? "italic " : ""}900 ${size}px ${FONT}`; }
    ctx.fillText(label, x0 + avail / 2, h * 0.54);
    ctx.restore();
  };
}
function emoji(ch: string) {
  return (ctx: CanvasRenderingContext2D, w: number, h: number) => {
    ctx.save();
    ctx.font = `${h * 0.86}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(ch, w / 2, h * 0.55);
    ctx.restore();
  };
}
const STICKERS: Stk[] = [
  { id: "p1", ratio: 4.4, draw: plate("#ffffff", "#1a1a1a", "#1a1a1a", "보배드림") },
  { id: "p2", ratio: 4.4, draw: plate("#306BD9", "#ffffff", "#ffffff", "BOBAEDREAM", { italic: true }) },
  { id: "p3", ratio: 4.4, draw: plate("#FFD43B", "#1a1a1a", "#1a1a1a", "중고차", { badge: "KR" }) },
  { id: "p4", ratio: 4.4, draw: plate("#1a1a1a", "#E8C15A", "#E8C15A", "보배드림", { badge: "★" }) },
  { id: "p5", ratio: 4.4, draw: plate("#E7F5FF", "#306BD9", "#306BD9", "BOBAE 8888", { badge: "EV" }) },
  { id: "e1", ratio: 1, draw: emoji("😎") },
  { id: "e2", ratio: 1, draw: emoji("🚗") },
  { id: "e3", ratio: 1, draw: emoji("👍") },
  { id: "e4", ratio: 1, draw: emoji("🔥") },
  { id: "e5", ratio: 1, draw: emoji("😍") },
  { id: "e6", ratio: 1, draw: emoji("🎉") },
  { id: "e7", ratio: 1, draw: emoji("💯") },
  { id: "e8", ratio: 1, draw: emoji("⭐") },
  { id: "e9", ratio: 1, draw: emoji("😂") },
  { id: "e10", ratio: 1, draw: emoji("❤️") },
];
const stkOf = (id: string) => STICKERS.find((s) => s.id === id) ?? STICKERS[0]!;
const stkUrl = reactive<Record<string, string>>({});

/* ───────── 겹친 요소 그리기 ───────── */
const textFont = (o: Ov, fs: number) => `${o.font === "bobae" ? "italic 900" : "700"} ${fs}px ${FONT}`;
function drawOv(ctx: CanvasRenderingContext2D, o: Ov, W: number) {
  const Hn = ctx.canvas.height;
  ctx.save();
  ctx.translate(o.x * W, o.y * Hn);
  ctx.rotate(o.r);
  if (o.kind === "text") {
    if (o.text.trim()) {
      const fs = W * TXT_K * o.s;
      ctx.font = textFont(o, fs);
      ctx.fillStyle = o.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0,0,0,.35)";
      ctx.shadowBlur = fs * 0.12;
      const lines = o.text.split("\n");
      const lh = fs * 1.25;
      lines.forEach((l, i) => ctx.fillText(l, 0, (i - (lines.length - 1) / 2) * lh));
    }
  } else {
    const d = stkOf(o.sticker);
    const w = W * STK_K * o.s, h = w / d.ratio;
    ctx.translate(-w / 2, -h / 2);
    d.draw(ctx, w, h);
  }
  ctx.restore();
}
function paint(ctx: CanvasRenderingContext2D, W: number, H: number, p: Page, opt: { compare?: boolean; ovs?: boolean; tpl?: boolean } = {}) {
  ctx.clearRect(0, 0, W, H);
  const src = opt.compare && p.pre ? p.pre : p.base;
  drawFiltered(ctx, src, W, H, fltOf(p.filter));
  if (opt.tpl !== false) tplOf(p.tpl).draw?.(ctx, W, H);
  if (opt.ovs) for (const o of p.ovs) drawOv(ctx, o, W);
}
function snapshotUrl(p: Page, long = 120, opt: { ovs?: boolean; tpl?: boolean; filter?: string; tplId?: string } = {}) {
  const k = long / Math.max(p.base.width, p.base.height);
  const c = mk(p.base.width * k, p.base.height * k);
  const tmp: Page = { ...p, filter: opt.filter ?? p.filter, tpl: opt.tplId ?? p.tpl };
  paint(c2d(c), c.width, c.height, tmp, { ovs: opt.ovs ?? true, tpl: opt.tpl });
  return c.toDataURL("image/jpeg", 0.8);
}

/* ───────── 상태 ───────── */
const pages = ref<Page[]>([]);
const cur = ref(0);
const page = computed(() => pages.value[cur.value]);
const ready = ref(false);
const tool = ref<Tool | null>(null);
const dirty = ref(false);
const confirmExit = ref(false);
const compare = ref(false);
const stageEl = ref<HTMLDivElement | null>(null);
const cvEl = ref<HTMLCanvasElement | null>(null);
const fileEl = ref<HTMLInputElement | null>(null);
const view = reactive({ x: 0, y: 0, w: 0, h: 0, sw: 0, sh: 0 });
let ovSeq = 1;

const TOOLS: { id: Tool; label: string; title: string }[] = [
  { id: "pen", label: "펜", title: "펜" },
  { id: "crop", label: "자르기", title: "자르기" },
  { id: "text", label: "텍스트", title: "텍스트" },
  { id: "tpl", label: "템플릿", title: "템플릿" },
  { id: "sticker", label: "스티커", title: "스티커" },
  { id: "mosaic", label: "모자이크", title: "모자이크" },
  { id: "filter", label: "필터", title: "필터" },
];
const toolTitle = computed(() => TOOLS.find((t) => t.id === tool.value)?.title ?? "");

/* ───────── 불러오기 ───────── */
function loadImage(src: string): Promise<HTMLCanvasElement> {
  return new Promise((res) => {
    const img = new Image();
    if (!src.startsWith("data:") && !src.startsWith("blob:")) img.crossOrigin = "anonymous";
    img.onload = () => {
      const k = Math.min(1, MAX / Math.max(img.naturalWidth, img.naturalHeight));
      const c = mk(img.naturalWidth * k, img.naturalHeight * k);
      c2d(c).drawImage(img, 0, 0, c.width, c.height);
      res(c);
    };
    img.onerror = () => {
      const c = mk(1200, 900);
      const x = c2d(c);
      x.fillStyle = "#333";
      x.fillRect(0, 0, 1200, 900);
      x.fillStyle = "#888";
      x.font = `600 48px ${FONT}`;
      x.textAlign = "center";
      x.fillText("사진을 불러오지 못했어요", 600, 460);
      res(c);
    };
    img.src = src;
  });
}
function newPage(base: HTMLCanvasElement): Page {
  const p: Page = { base, pre: null, ovs: [], tpl: "none", filter: "none", thumb: "", aiThumbs: null };
  p.thumb = snapshotUrl(p);
  return p;
}
function refreshThumb(p: Page | undefined = page.value) {
  if (p) p.thumb = snapshotUrl(p);
}
async function addFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  const files = Array.from(input.files ?? []).slice(0, MAX_PAGES - pages.value.length);
  input.value = "";
  for (const f of files) {
    const url = await new Promise<string>((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(f); });
    pages.value.push(newPage(await loadImage(url)));
  }
  if (files.length) { dirty.value = true; cur.value = pages.value.length - 1; layout(); }
}

/* ───────── 배치 · 그리기 ───────── */
function layout() {
  const st = stageEl.value, p = page.value;
  if (!st || !p) return;
  const sw = st.clientWidth, sh = st.clientHeight;
  const pad = tool.value === "crop" ? 24 : 0;
  const aw = Math.max(10, sw - pad * 2), ah = Math.max(10, sh - pad * 2);
  const k = Math.min(aw / p.base.width, ah / p.base.height);
  view.w = p.base.width * k;
  view.h = p.base.height * k;
  view.x = (sw - view.w) / 2;
  view.y = (sh - view.h) / 2;
  view.sw = sw;
  view.sh = sh;
  draw();
}
let raf = 0;
function draw() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    const cv = cvEl.value, p = page.value;
    if (!cv || !p || !view.w) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const W = Math.round(view.w * dpr), H = Math.round(view.h * dpr);
    if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    paint(c2d(cv), W, H, p, { compare: compare.value, tpl: tool.value !== "crop" });
  });
}
const viewStyle = computed(() => ({ left: `${view.x}px`, top: `${view.y}px`, width: `${view.w}px`, height: `${view.h}px` }));

/* ───────── 도구 열기 · 취소 · 적용 ───────── */
interface Snap { base: HTMLCanvasElement | null; pre: HTMLCanvasElement | null; ovs: Ov[]; tpl: string; filter: string }
let snap: Snap | null = null;
const undoStack: ImageData[] = [];
const canUndo = ref(false);
function openTool(t: Tool) {
  const p = page.value;
  if (!p || ai.running) return;
  const raster = t === "pen" || t === "mosaic" || t === "crop";
  snap = { base: raster ? clone(p.base) : null, pre: t === "crop" && p.pre ? clone(p.pre) : null, ovs: p.ovs.map((o) => ({ ...o })), tpl: p.tpl, filter: p.filter };
  undoStack.length = 0;
  canUndo.value = false;
  tool.value = t;
  selOv.value = null;
  editing.value = null;
  if (t === "crop") { ratio.value = "free"; crop.x = 0; crop.y = 0; crop.w = 1; crop.h = 1; }
  if (t === "mosaic") mosaicSrc = c2d(p.base).getImageData(0, 0, p.base.width, p.base.height);
  if (t === "text") {
    if (!p.ovs.some((o) => o.kind === "text")) addText();
    else selOv.value = [...p.ovs].reverse().find((o) => o.kind === "text")?.id ?? null;
  }
  if (t === "filter") buildFilterThumbs();
  if (t === "tpl") buildTplThumbs();
  nextTick(layout);
}
function cancelTool() {
  const p = page.value;
  if (p && snap) {
    if (snap.base) p.base = snap.base;
    if (tool.value === "crop") p.pre = snap.pre;
    p.ovs = snap.ovs;
    p.tpl = snap.tpl;
    p.filter = snap.filter;
  }
  closeTool();
}
function applyTool() {
  const p = page.value;
  if (p) {
    if (tool.value === "crop") applyCrop(p);
    if (tool.value === "text") p.ovs = p.ovs.filter((o) => o.kind !== "text" || o.text.trim());
    dirty.value = true;
    refreshThumb(p);
  }
  closeTool();
}
function closeTool() {
  tool.value = null;
  snap = null;
  mosaicSrc = null;
  selOv.value = null;
  editing.value = null;
  undoStack.length = 0;
  canUndo.value = false;
  nextTick(layout);
}
function undo() {
  const p = page.value, d = undoStack.pop();
  if (p && d) { c2d(p.base).putImageData(d, 0, 0); draw(); }
  canUndo.value = undoStack.length > 0;
}

/* ───────── 펜 · 모자이크 ───────── */
const PEN_COLORS = ["#000000", "#4D4D4D", "#FFFFFF", "#F23D3D", "#FF7A1A", "#FFD200", "#00A651", "#1A86F0", "#7B3FF2", "#FF4FA3", "#8B5A2B"];
const penColor = ref("#F23D3D");
const penSize = ref(50); // 0~100
const mosaicSize = ref(50);
let mosaicSrc: ImageData | null = null;
let stroke: { last: [number, number]; cells: Set<number> } | null = null;
const imgPt = (cx: number, cy: number, p: Page): [number, number] => {
  const r = stageEl.value!.getBoundingClientRect();
  return [((cx - r.left - view.x) / view.w) * p.base.width, ((cy - r.top - view.y) / view.h) * p.base.height];
};
const pxPerCss = (p: Page) => p.base.width / view.w;
function pushUndo(p: Page) {
  undoStack.push(c2d(p.base).getImageData(0, 0, p.base.width, p.base.height));
  if (undoStack.length > 20) undoStack.shift();
  canUndo.value = true;
}
function penSeg(p: Page, a: [number, number], b: [number, number]) {
  const ctx = c2d(p.base);
  ctx.save();
  ctx.strokeStyle = penColor.value;
  // 동처띠 실측(화면 기준 굵기): 가장 작게 1.4px · 가운데 5.3px · 가장 크게 27px
  ctx.lineWidth = (1.42 + 25.6 * (penSize.value / 100) ** 2.71) * pxPerCss(p);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(a[0], a[1]);
  ctx.lineTo(b[0] + 0.01, b[1]);
  ctx.stroke();
  ctx.restore();
}
function mosaicAt(p: Page, pt: [number, number]) {
  const src = mosaicSrc;
  if (!src || !stroke) return;
  const W = p.base.width, H = p.base.height;
  // 동처띠 실측: 칸은 크기와 상관없이 화면 12.8px, 붓 지름은 가장 작게 12 · 가운데 26 · 가장 크게 51px
  const cell = Math.max(4, 12.8 * pxPerCss(p));
  const rad = (mosaicDia() * pxPerCss(p)) / 2;
  const ctx = c2d(p.base);
  const c0 = Math.floor((pt[0] - rad) / cell), c1 = Math.floor((pt[0] + rad) / cell);
  const r0 = Math.floor((pt[1] - rad) / cell), r1 = Math.floor((pt[1] + rad) / cell);
  for (let cy = r0; cy <= r1; cy++) {
    for (let cx = c0; cx <= c1; cx++) {
      if (cx < 0 || cy < 0 || cx * cell >= W || cy * cell >= H) continue;
      const key = cy * 100000 + cx;
      if (stroke.cells.has(key)) continue;
      const mx = (cx + 0.5) * cell - pt[0], my = (cy + 0.5) * cell - pt[1];
      if (mx * mx + my * my > (rad + cell * 0.5) ** 2) continue;
      stroke.cells.add(key);
      // 원본 화소 평균으로 칸을 채움
      const x0 = Math.round(cx * cell), y0 = Math.round(cy * cell), x1 = Math.min(W, Math.round((cx + 1) * cell)), y1 = Math.min(H, Math.round((cy + 1) * cell));
      let r = 0, g = 0, b = 0, n = 0;
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * W + x) * 4;
          r += src.data[i]!; g += src.data[i + 1]!; b += src.data[i + 2]!; n++;
        }
      }
      ctx.fillStyle = `rgb(${r / n | 0},${g / n | 0},${b / n | 0})`;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    }
  }
}
const mosaicDia = () => 12 + 39 * (mosaicSize.value / 100) ** 1.4;
function mosaicSeg(p: Page, a: [number, number], b: [number, number]) {
  const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const step = Math.max(2, (mosaicDia() * pxPerCss(p)) / 4);
  const n = Math.max(1, Math.ceil(d / step));
  for (let i = 1; i <= n; i++) mosaicAt(p, [a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n]);
}

/* ───────── 무대(사진 영역) 포인터 ───────── */
let gest: { id: number; x: number; y: number; t: number; moved: boolean; timer: number } | null = null;
function onStageDown(e: PointerEvent) {
  const p = page.value;
  if (!p || ai.running) return;
  if (tool.value === "pen" || tool.value === "mosaic") {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const pt = imgPt(e.clientX, e.clientY, p);
    stroke = { last: pt, cells: new Set() };
    if (tool.value === "pen") penSeg(p, pt, pt);
    else mosaicAt(p, pt);
    draw();
    return;
  }
  if (tool.value === "text" || tool.value === "sticker") {
    selOv.value = null;
    editing.value = null;
    return;
  }
  if (tool.value) return;
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  gest = {
    id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now(), moved: false,
    timer: window.setTimeout(() => { if (gest && !gest.moved && p.pre) { compare.value = true; draw(); } }, 350),
  };
}
function onStageMove(e: PointerEvent) {
  const p = page.value;
  if (!p) return;
  if (stroke && (tool.value === "pen" || tool.value === "mosaic")) {
    const pt = imgPt(e.clientX, e.clientY, p);
    if (tool.value === "pen") penSeg(p, stroke.last, pt);
    else mosaicSeg(p, stroke.last, pt);
    stroke.last = pt;
    draw();
    return;
  }
  if (gest && e.pointerId === gest.id && Math.hypot(e.clientX - gest.x, e.clientY - gest.y) > 10) {
    gest.moved = true;
    clearTimeout(gest.timer);
  }
}
function onStageUp(e: PointerEvent) {
  if (stroke) { stroke = null; return; }
  if (!gest || e.pointerId !== gest.id) return;
  clearTimeout(gest.timer);
  const dx = e.clientX - gest.x, dy = e.clientY - gest.y;
  if (compare.value) { compare.value = false; draw(); }
  else if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) goPage(cur.value + (dx < 0 ? 1 : -1));
  gest = null;
}
function goPage(i: number) {
  if (i < 0 || i >= pages.value.length || i === cur.value) return;
  cur.value = i;
  nextTick(layout);
}

/* ───────── 자르기 ───────── */
type Ratio = "free" | "3:4" | "4:3" | "3:2" | "2:3";
const RATIOS: { id: Ratio; label: string; w: number; h: number; badge?: string }[] = [
  { id: "free", label: "자유", w: 0, h: 0 },
  { id: "3:4", label: "3:4", w: 3, h: 4, badge: "추천" },
  { id: "4:3", label: "4:3", w: 4, h: 3 },
  { id: "3:2", label: "3:2", w: 3, h: 2 },
  { id: "2:3", label: "2:3", w: 2, h: 3 },
];
const ratio = ref<Ratio>("free");
const crop = reactive({ x: 0, y: 0, w: 1, h: 1 });
const rn = computed(() => {
  const r = RATIOS.find((x) => x.id === ratio.value)!;
  const p = page.value;
  if (!r.w || !p) return 0;
  return (r.w / r.h) * (p.base.height / p.base.width); // 정규화 좌표 폭 ÷ 높이
});
function setRatio(id: Ratio) {
  ratio.value = id;
  const k = rn.value;
  if (!k) { crop.x = 0; crop.y = 0; crop.w = 1; crop.h = 1; return; }
  let w = 1, h = 1 / k;
  if (h > 1) { h = 1; w = k; }
  crop.w = w; crop.h = h; crop.x = (1 - w) / 2; crop.y = (1 - h) / 2;
}
const cropStyle = computed(() => ({
  left: `${view.x + crop.x * view.w}px`, top: `${view.y + crop.y * view.h}px`, width: `${crop.w * view.w}px`, height: `${crop.h * view.h}px`,
}));
let cdrag: { hd: string; sx: number; sy: number; x: number; y: number; w: number; h: number } | null = null;
const HDIR: Record<string, [number, number]> = { tl: [-1, -1], tr: [1, -1], bl: [-1, 1], br: [1, 1], t: [0, -1], b: [0, 1], l: [-1, 0], r: [1, 0], m: [0, 0] };
const cropping = ref(false); // 원본: 틀을 움직이는 동안만 3등분 선
function cropDown(e: PointerEvent, hd: string) {
  cropping.value = true;
  e.stopPropagation();
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  cdrag = { hd, sx: e.clientX, sy: e.clientY, x: crop.x, y: crop.y, w: crop.w, h: crop.h };
}
function cropMove(e: PointerEvent) {
  if (!cdrag) return;
  const dx = (e.clientX - cdrag.sx) / view.w, dy = (e.clientY - cdrag.sy) / view.h;
  const MIN = 0.08;
  const c = cdrag;
  if (c.hd === "m") {
    crop.x = Math.min(1 - c.w, Math.max(0, c.x + dx));
    crop.y = Math.min(1 - c.h, Math.max(0, c.y + dy));
    return;
  }
  const [sx, sy] = HDIR[c.hd]!;
  const ax = sx > 0 ? c.x : c.x + c.w, ay = sy > 0 ? c.y : c.y + c.h;
  const maxW = sx > 0 ? 1 - ax : ax, maxH = sy > 0 ? 1 - ay : ay;
  let w = c.w, h = c.h;
  if (rn.value && sx && sy) {
    w = Math.max(MIN, Math.min(maxW, c.w + sx * dx));
    h = w / rn.value;
    if (h > maxH) { h = maxH; w = h * rn.value; }
  } else {
    if (sx) w = Math.max(MIN, Math.min(maxW, c.w + sx * dx));
    if (sy) h = Math.max(MIN, Math.min(maxH, c.h + sy * dy));
  }
  crop.w = w; crop.h = h;
  crop.x = sx > 0 ? ax : sx < 0 ? ax - w : c.x;
  crop.y = sy > 0 ? ay : sy < 0 ? ay - h : c.y;
}
function cropUp() { cdrag = null; cropping.value = false; }
function cropCanvas(c: HTMLCanvasElement) {
  const x = Math.round(crop.x * c.width), y = Math.round(crop.y * c.height);
  const w = Math.round(crop.w * c.width), h = Math.round(crop.h * c.height);
  const n = mk(w, h);
  c2d(n).drawImage(c, x, y, w, h, 0, 0, w, h);
  return n;
}
function applyCrop(p: Page) {
  if (crop.x < 0.001 && crop.y < 0.001 && crop.w > 0.999 && crop.h > 0.999) return;
  p.base = cropCanvas(p.base);
  if (p.pre) p.pre = cropCanvas(p.pre);
  p.ovs = p.ovs.map((o) => ({ ...o, x: (o.x - crop.x) / crop.w, y: (o.y - crop.y) / crop.h, s: o.s / crop.w }));
}
function rotateCanvas(c: HTMLCanvasElement) {
  const n = mk(c.height, c.width);
  const x = c2d(n);
  x.translate(n.width, 0);
  x.rotate(Math.PI / 2);
  x.drawImage(c, 0, 0);
  return n;
}
function flipCanvas(c: HTMLCanvasElement) {
  const n = mk(c.width, c.height);
  const x = c2d(n);
  x.translate(n.width, 0);
  x.scale(-1, 1);
  x.drawImage(c, 0, 0);
  return n;
}
function rotate90() {
  const p = page.value;
  if (!p) return;
  const k = p.base.width / p.base.height;
  p.base = rotateCanvas(p.base);
  if (p.pre) p.pre = rotateCanvas(p.pre);
  p.ovs = p.ovs.map((o) => ({ ...o, x: 1 - o.y, y: o.x, r: o.r + Math.PI / 2, s: o.s * k }));
  setRatio(ratio.value);
  layout();
}
function flipH() {
  const p = page.value;
  if (!p) return;
  p.base = flipCanvas(p.base);
  if (p.pre) p.pre = flipCanvas(p.pre);
  p.ovs = p.ovs.map((o) => ({ ...o, x: 1 - o.x, r: -o.r }));
  draw();
}

/* ───────── 텍스트 · 스티커(겹친 요소) ───────── */
const TEXT_COLORS = ["#FFFFFF", "#000000", "#F04438", "#F79009", "#FDB022", "#12B76A", "#2E90FA", "#9E77ED"];
const textColor = ref("#FFFFFF");
const textFontSel = ref<"basic" | "bobae">("basic");
const selOv = ref<number | null>(null);
const editing = ref<number | null>(null);
const stkOpen = ref(true);
const selected = computed(() => page.value?.ovs.find((o) => o.id === selOv.value));
function addText() {
  const p = page.value;
  if (!p) return;
  const o: Ov = { id: ovSeq++, kind: "text", x: 0.5, y: 0.45, s: 1, r: 0, text: "", color: textColor.value, font: textFontSel.value, sticker: "" };
  p.ovs.push(o);
  selOv.value = o.id;
  startEdit(o);
}
function addSticker(id: string) {
  const p = page.value;
  if (!p) return;
  const d = stkOf(id);
  const o: Ov = { id: ovSeq++, kind: "sticker", x: 0.5, y: d.ratio > 2 ? 0.7 : 0.5, s: d.ratio > 2 ? 1.4 : 0.7, r: 0, text: "", color: "", font: "basic", sticker: id };
  p.ovs.push(o);
  selOv.value = o.id;
}
function removeOv(id: number) {
  const p = page.value;
  if (!p) return;
  p.ovs = p.ovs.filter((o) => o.id !== id);
  if (selOv.value === id) selOv.value = null;
  if (editing.value === id) editing.value = null;
}
function pickTextColor(c: string) {
  textColor.value = c;
  const o = selected.value;
  if (o?.kind === "text") o.color = c;
}
function pickFont(f: "basic" | "bobae") {
  textFontSel.value = f;
  const o = selected.value;
  if (o?.kind === "text") o.font = f;
}
const editEls = new Map<number, HTMLElement>();
function setEditEl(id: number, el: unknown) {
  if (el instanceof HTMLElement) editEls.set(id, el);
  else editEls.delete(id);
}
function startEdit(o: Ov) {
  editing.value = o.id;
  nextTick(() => {
    const el = editEls.get(o.id);
    if (!el) return;
    el.textContent = o.text;
    el.focus();
    const sel = window.getSelection();
    if (sel) { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); sel.removeAllRanges(); sel.addRange(r); }
  });
}
function onEditInput(o: Ov, e: Event) {
  o.text = (e.target as HTMLElement).innerText.replace(/\n$/, "");
}
function ovInteractive(o: Ov) {
  return (o.kind === "text" && tool.value === "text") || (o.kind === "sticker" && tool.value === "sticker");
}
function ovStyle(o: Ov) {
  const st: Record<string, string> = {
    left: `${o.x * view.w}px`, top: `${o.y * view.h}px`, transform: `translate(-50%, -50%) rotate(${o.r}rad)`,
  };
  if (o.kind === "text") {
    st.fontSize = `${view.w * TXT_K * o.s}px`;
    st.color = o.color;
    st.fontWeight = o.font === "bobae" ? "900" : "700";
    st.fontStyle = o.font === "bobae" ? "italic" : "normal";
  } else st.width = `${view.w * STK_K * o.s}px`;
  return st;
}
// 끌기 · 두 손가락 확대/회전 · 오른쪽 아래 손잡이
let od: { o: Ov; mode: "move" | "handle"; pts: Map<number, [number, number]>; x0: number; y0: number; s0: number; r0: number; d0: number; a0: number; sx: number; sy: number; moved: boolean; wasSel: boolean } | null = null;
function ovCenter(o: Ov): [number, number] {
  const r = stageEl.value!.getBoundingClientRect();
  return [r.left + view.x + o.x * view.w, r.top + view.y + o.y * view.h];
}
function ovDown(e: PointerEvent, o: Ov, mode: "move" | "handle") {
  if (!ovInteractive(o)) return;
  e.stopPropagation();
  if (editing.value === o.id && mode === "move") return; // 입력 중에는 글자 선택
  e.preventDefault();
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  const wasSel = selOv.value === o.id;
  selOv.value = o.id;
  if (editing.value && editing.value !== o.id) editing.value = null;
  if (od && od.o === o && mode === "move") {
    od.pts.set(e.pointerId, [e.clientX, e.clientY]);
    pinchStart();
    return;
  }
  const c = ovCenter(o);
  od = { o, mode, pts: new Map([[e.pointerId, [e.clientX, e.clientY]]]), x0: o.x, y0: o.y, s0: o.s, r0: o.r, d0: Math.hypot(e.clientX - c[0], e.clientY - c[1]) || 1, a0: Math.atan2(e.clientY - c[1], e.clientX - c[0]), sx: e.clientX, sy: e.clientY, moved: false, wasSel };
}
function pinchStart() {
  if (!od) return;
  const [a, b] = [...od.pts.values()];
  if (!a || !b) return;
  od.s0 = od.o.s; od.r0 = od.o.r; od.x0 = od.o.x; od.y0 = od.o.y;
  od.d0 = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  od.a0 = Math.atan2(b[1] - a[1], b[0] - a[0]);
  od.sx = (a[0] + b[0]) / 2; od.sy = (a[1] + b[1]) / 2;
  od.moved = true;
}
function ovMove(e: PointerEvent) {
  if (!od || !od.pts.has(e.pointerId)) return;
  od.pts.set(e.pointerId, [e.clientX, e.clientY]);
  const o = od.o;
  if (od.mode === "handle") {
    const c = ovCenter(o);
    const d = Math.hypot(e.clientX - c[0], e.clientY - c[1]);
    o.s = Math.min(8, Math.max(0.2, (od.s0 * d) / od.d0));
    o.r = od.r0 + Math.atan2(e.clientY - c[1], e.clientX - c[0]) - od.a0;
    return;
  }
  if (od.pts.size >= 2) {
    const [a, b] = [...od.pts.values()];
    if (!a || !b) return;
    o.s = Math.min(8, Math.max(0.2, (od.s0 * Math.hypot(b[0] - a[0], b[1] - a[1])) / od.d0));
    o.r = od.r0 + Math.atan2(b[1] - a[1], b[0] - a[0]) - od.a0;
    o.x = Math.min(1, Math.max(0, od.x0 + ((a[0] + b[0]) / 2 - od.sx) / view.w));
    o.y = Math.min(1, Math.max(0, od.y0 + ((a[1] + b[1]) / 2 - od.sy) / view.h));
    return;
  }
  const dx = e.clientX - od.sx, dy = e.clientY - od.sy;
  if (!od.moved && Math.hypot(dx, dy) < 4) return;
  od.moved = true;
  o.x = Math.min(1, Math.max(0, od.x0 + dx / view.w));
  o.y = Math.min(1, Math.max(0, od.y0 + dy / view.h));
}
function ovUp(e: PointerEvent) {
  if (!od) return;
  od.pts.delete(e.pointerId);
  if (od.pts.size === 1 && od.mode === "move") {
    const [rest] = [...od.pts.values()];
    if (rest) { od.sx = rest[0]; od.sy = rest[1]; od.x0 = od.o.x; od.y0 = od.o.y; }
    return;
  }
  if (od.pts.size) return;
  if (!od.moved && od.mode === "move" && od.o.kind === "text" && od.wasSel) startEdit(od.o);
  od = null;
}
function ovKey(e: KeyboardEvent, o: Ov) {
  if (editing.value === o.id) return;
  const step = e.shiftKey ? 0.05 : 0.01;
  const k: Record<string, () => void> = {
    ArrowLeft: () => (o.x = Math.max(0, o.x - step)), ArrowRight: () => (o.x = Math.min(1, o.x + step)),
    ArrowUp: () => (o.y = Math.max(0, o.y - step)), ArrowDown: () => (o.y = Math.min(1, o.y + step)),
    "+": () => (o.s = Math.min(8, o.s * 1.1)), "-": () => (o.s = Math.max(0.2, o.s / 1.1)),
    Delete: () => removeOv(o.id), Backspace: () => removeOv(o.id),
    Enter: () => { if (o.kind === "text") startEdit(o); },
  };
  const f = k[e.key];
  if (f) { e.preventDefault(); selOv.value = o.id; f(); }
}

/* ───────── 템플릿 · 필터 미리보기 ───────── */
const filterThumbs = reactive<Record<string, string>>({});
const tplThumbs = reactive<Record<string, string>>({});
function buildFilterThumbs() {
  const p = page.value;
  if (!p) return;
  for (const f of FILTERS) filterThumbs[f.id] = snapshotUrl(p, 112, { ovs: false, tpl: false, filter: f.id });
}
function buildTplThumbs() {
  const p = page.value;
  if (!p) return;
  for (const t of TPLS) tplThumbs[t.id] = t.id === "none" ? "" : snapshotUrl(p, 160, { ovs: false, tplId: t.id });
}
function pickTpl(id: string) { const p = page.value; if (p) { p.tpl = id; draw(); } }
function pickFilter(id: string) { const p = page.value; if (p) { p.filter = id; draw(); } }

/* ───────── AI 화질 보정(언샤프 마스크 + 약한 대비) ───────── */
const ai = reactive({ running: false, pct: 0 });
let aiRaf = 0;
let aiToken = 0;
function enhance(src: HTMLCanvasElement) {
  const W = src.width, H = src.height;
  const n = clone(src);
  const ctx = c2d(n);
  const img = ctx.getImageData(0, 0, W, H);
  const d = img.data;
  const tmp = new Float32Array(W * H * 3);
  const blur = new Float32Array(W * H * 3);
  // 가로 → 세로 상자 흐림(반경 1)
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const xl = x > 0 ? x - 1 : x, xr = x < W - 1 ? x + 1 : x;
      for (let c = 0; c < 3; c++) tmp[(y * W + x) * 3 + c] = (d[(y * W + xl) * 4 + c]! + d[(y * W + x) * 4 + c]! + d[(y * W + xr) * 4 + c]!) / 3;
    }
  }
  for (let y = 0; y < H; y++) {
    const yu = y > 0 ? y - 1 : y, yd = y < H - 1 ? y + 1 : y;
    for (let x = 0; x < W; x++) {
      for (let c = 0; c < 3; c++) blur[(y * W + x) * 3 + c] = (tmp[(yu * W + x) * 3 + c]! + tmp[(y * W + x) * 3 + c]! + tmp[(yd * W + x) * 3 + c]!) / 3;
    }
  }
  const amt = 0.9, con = 1.06;
  for (let i = 0, j = 0; i < d.length; i += 4, j += 3) {
    for (let c = 0; c < 3; c++) {
      const v = d[i + c]!;
      const s = v + amt * (v - blur[j + c]!);
      d[i + c] = (s - 128) * con + 128;
    }
  }
  ctx.putImageData(img, 0, 0);
  return n;
}
function runAI() {
  const p = page.value;
  if (!p || ai.running) return;
  const token = ++aiToken;
  ai.running = true;
  ai.pct = 0;
  let result: HTMLCanvasElement | null = null;
  setTimeout(() => { if (token === aiToken) result = enhance(p.base); }, 60);
  const t0 = performance.now(), dur = 2500;
  const step = (t: number) => {
    if (token !== aiToken) return;
    const k = Math.min(1, (t - t0) / dur);
    ai.pct = Math.round(95 * (reduceMotion ? k : 1 - (1 - k) * (1 - k)));
    if (k < 1 || !result) { aiRaf = requestAnimationFrame(step); return; }
    ai.pct = 100;
    const before = snapshotUrl(p, 64, { ovs: false });
    if (!p.pre) p.pre = clone(p.base);
    p.base = result;
    p.aiThumbs = [p.aiThumbs?.[0] ?? before, snapshotUrl(p, 64, { ovs: false })];
    dirty.value = true;
    refreshThumb(p);
    ai.running = false;
    draw();
  };
  aiRaf = requestAnimationFrame(step);
}
function cancelAI() {
  aiToken++;
  cancelAnimationFrame(aiRaf);
  ai.running = false;
  ai.pct = 0;
}

/* ───────── 완료 · 나가기 ───────── */
const busy = ref(false);
async function finish() {
  if (busy.value || ai.running) return;
  busy.value = true;
  await nextTick();
  const out: string[] = [];
  for (const p of pages.value) {
    const k = Math.min(1, MAX / Math.max(p.base.width, p.base.height));
    const c = mk(p.base.width * k, p.base.height * k);
    const ctx = c2d(c);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, c.width, c.height);
    paint(ctx, c.width, c.height, p, { ovs: true });
    out.push(c.toDataURL("image/jpeg", 0.9));
  }
  busy.value = false;
  emit("done", out);
}
function back() {
  if (dirty.value) confirmExit.value = true;
  else emit("close");
}
function onKey(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  if (confirmExit.value) { confirmExit.value = false; return; }
  if (editing.value) { editing.value = null; return; }
  if (tool.value) { cancelTool(); return; }
  back();
}

let ro: ResizeObserver | null = null;
onMounted(async () => {
  const t = c2d(mk(1, 1));
  FILTER_OK = typeof t.filter === "string";
  for (const s of STICKERS) {
    const w = 120, h = Math.round(w / s.ratio);
    const c = mk(w, Math.max(h, 1));
    s.draw(c2d(c), c.width, c.height);
    stkUrl[s.id] = c.toDataURL("image/png");
  }
  const list = props.images.slice(0, MAX_PAGES);
  const bases = await Promise.all(list.map(loadImage));
  pages.value = bases.map(newPage);
  cur.value = Math.min(Math.max(0, props.start ?? 0), Math.max(0, pages.value.length - 1));
  ready.value = true;
  window.addEventListener("keydown", onKey);
  await nextTick();
  if (stageEl.value) { ro = new ResizeObserver(layout); ro.observe(stageEl.value); }
  layout();
});
onBeforeUnmount(() => {
  window.removeEventListener("keydown", onKey);
  ro?.disconnect();
  cancelAnimationFrame(raf);
  cancelAI();
});
</script>

<template>
  <div class="pe" :class="{ 'is-tool': tool, 'is-ai': ai.running }" role="dialog" aria-modal="true" aria-label="사진 편집">
    <header v-if="!tool" class="pe-top">
      <button type="button" class="pe-top__back" aria-label="뒤로" @click="back"><Ico :src="EIC.back" /></button>
      <span class="pe-top__count" :style="{ visibility: pages.length > 1 ? 'visible' : 'hidden' }" aria-live="polite">{{ pages.length ? cur + 1 : 0 }}/{{ pages.length }}</span>
      <button type="button" class="pe-top__done" :disabled="busy || ai.running || !ready" @click="finish">{{ busy ? "저장 중" : "완료" }}</button>
    </header>

    <div ref="stageEl" class="pe-stage" :class="`is-${tool ?? 'view'}`" @pointerdown="onStageDown" @pointermove="onStageMove" @pointerup="onStageUp" @pointercancel="onStageUp">
      <canvas ref="cvEl" class="pe-cv" :style="viewStyle" aria-hidden="true" />
      <div v-if="page && tool !== 'crop'" class="pe-layer" :style="viewStyle">
        <div
          v-for="o in page.ovs" :key="o.id" class="pe-ov" :class="[`is-${o.kind}`, { 'is-sel': selOv === o.id && ovInteractive(o), 'is-live': ovInteractive(o), 'is-edit': editing === o.id }]"
          :style="ovStyle(o)" :tabindex="ovInteractive(o) ? 0 : -1" :aria-label="o.kind === 'text' ? `텍스트 ${o.text || '빈 상자'}` : '스티커'"
          @pointerdown="ovDown($event, o, 'move')" @pointermove="ovMove" @pointerup="ovUp" @pointercancel="ovUp" @keydown="ovKey($event, o)"
        >
          <template v-if="o.kind === 'text'">
            <span v-if="editing === o.id" :ref="(el) => setEditEl(o.id, el)" class="pe-ov__text" contenteditable="true" spellcheck="false" data-ph="탭해서 텍스트 입력" @input="onEditInput(o, $event)" @pointerdown.stop @keydown.stop />
            <span v-else class="pe-ov__text" :class="{ 'is-empty': !o.text }">{{ o.text || "탭해서 텍스트 입력" }}</span>
          </template>
          <img v-else class="pe-ov__img" :src="stkUrl[o.sticker]" alt="" draggable="false" />
          <template v-if="selOv === o.id && ovInteractive(o)">
            <button type="button" class="pe-ov__del" aria-label="삭제" @pointerdown.stop @click.stop="removeOv(o.id)"><Ico :src="EIC.close" /></button>
            <span class="pe-ov__rot" role="button" aria-label="크기 · 회전 손잡이" @pointerdown="ovDown($event, o, 'handle')" @pointermove="ovMove" @pointerup="ovUp" @pointercancel="ovUp">
              <Ico :src="EIC.rotate" />
            </span>
          </template>
        </div>
      </div>
      <div v-if="tool === 'crop'" class="pe-crop" :style="cropStyle" @pointerdown="cropDown($event, 'm')" @pointermove="cropMove" @pointerup="cropUp" @pointercancel="cropUp">
        <i v-show="cropping" class="pe-crop__grid" />
        <span v-for="hd in ['tl', 'tr', 'bl', 'br']" :key="hd" class="pe-crop__c" :class="`is-${hd}`" @pointerdown="cropDown($event, hd)" @pointermove="cropMove" @pointerup="cropUp" />
        <template v-if="ratio === 'free'">
          <span v-for="hd in ['t', 'b', 'l', 'r']" :key="hd" class="pe-crop__e" :class="`is-${hd}`" @pointerdown="cropDown($event, hd)" @pointermove="cropMove" @pointerup="cropUp" />
        </template>
      </div>
      <p v-if="!ready" class="pe-loading">사진을 불러오는 중…</p>
    </div>

    <!-- 기본 화면: AI 칩 · 사진 줄 · 도구 줄 -->
    <div v-if="!tool" class="pe-bottom">
      <div class="pe-ai" :class="{ 'is-run': ai.running }">
        <template v-if="ai.running">
          <span class="pe-ai__ico is-box"><Ico :src="EIC.ai" /></span>
          <span class="pe-ai__label" aria-live="polite">AI 보정 중…{{ ai.pct }}%</span>
          <button type="button" class="pe-ai__btn" @click="cancelAI">취소</button>
        </template>
        <template v-else>
          <span v-if="page?.aiThumbs" class="pe-ai__pair" aria-label="보정 전 · 후">
            <img :src="page.aiThumbs[0]" alt="보정 전" /><img :src="page.aiThumbs[1]" alt="보정 후" class="is-after" />
          </span>
          <span v-else class="pe-ai__ico"><Ico :src="EIC.ai" /></span>
          <span class="pe-ai__label">화질 선명하게</span>
          <button type="button" class="pe-ai__btn" :disabled="!ready" @click="runAI">생성</button>
        </template>
      </div>
      <p v-if="page?.pre && !ai.running" class="pe-hint">사진을 길게 누르면 원본과 비교해요</p>
      <div class="pe-thumbs" role="tablist" aria-label="사진 목록">
        <button v-for="(p, i) in pages" :key="i" type="button" role="tab" class="pe-thumb" :class="{ on: i === cur }" :aria-selected="i === cur" :aria-label="`${i + 1}번째 사진`" @click="goPage(i)">
          <img :src="p.thumb" alt="" />
        </button>
        <button v-if="pages.length < MAX_PAGES" type="button" class="pe-thumb is-add" aria-label="사진 추가" @click="fileEl?.click()"><Ico :src="EIC.add" /></button>
        <input ref="fileEl" type="file" accept="image/*" multiple hidden @change="addFiles" />
      </div>
      <nav class="pe-tools" aria-label="편집 도구">
        <button v-for="t in TOOLS" :key="t.id" type="button" class="pe-tool" :disabled="ai.running || !ready" :aria-label="t.label" @click="openTool(t.id)">
          <Ico v-if="t.id === 'pen'" :src="EIC.pen" />
          <Ico v-else-if="t.id === 'crop'" :src="EIC.crop" />
          <Ico v-else-if="t.id === 'text'" :src="EIC.text" />
          <Ico v-else-if="t.id === 'tpl'" :src="EIC.tpl" />
          <Ico v-else-if="t.id === 'sticker'" :src="EIC.sticker" />
          <Ico v-else-if="t.id === 'mosaic'" :src="EIC.mosaic" />
          <Ico v-else :src="EIC.filter" />
          <span>{{ t.label }}</span>
        </button>
      </nav>
    </div>

    <!-- 도구 판 -->
    <section v-else class="pe-panel" :aria-label="toolTitle">
      <div v-if="tool === 'pen' || tool === 'mosaic'" class="pe-p-brush" :class="{ 'is-mosaic': tool === 'mosaic' }">
        <label class="pe-size">
          <span>크기</span>
          <input v-if="tool === 'pen'" v-model.number="penSize" type="range" min="0" max="100" aria-label="펜 크기" />
          <input v-else v-model.number="mosaicSize" type="range" min="0" max="100" aria-label="모자이크 크기" />
        </label>
        <div v-if="tool === 'pen'" class="pe-colors" role="radiogroup" aria-label="펜 색">
          <button v-for="c in PEN_COLORS" :key="c" type="button" role="radio" class="pe-dot" :class="{ on: penColor === c }" :style="{ '--c': c }" :aria-checked="penColor === c" :aria-label="`색 ${c}`" @click="penColor = c" />
        </div>
      </div>

      <div v-else-if="tool === 'crop'" class="pe-p-crop">
        <button type="button" class="pe-cbtn" aria-label="90도 회전" @click="rotate90"><Ico :src="EIC.rotate" /><span>회전</span></button>
        <button type="button" class="pe-cbtn" aria-label="좌우 반전" @click="flipH">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M9 7l-5 5 5 5M15 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" /></svg><span>좌우 반전</span>
        </button>
        <i class="pe-csep" aria-hidden="true" />
        <div class="pe-ratios" role="radiogroup" aria-label="비율">
          <button v-for="r in RATIOS" :key="r.id" type="button" role="radio" class="pe-cbtn pe-ratio" :class="{ on: ratio === r.id }" :aria-checked="ratio === r.id" @click="setRatio(r.id)">
            <i class="pe-ratio__box" :class="{ 'is-free': !r.w }" :style="r.w ? { width: `${(r.w / Math.max(r.w, r.h)) * 22}px`, height: `${(r.h / Math.max(r.w, r.h)) * 22}px` } : undefined" />
            <em v-if="r.badge" class="pe-ratio__badge">{{ r.badge }}</em>
            <span>{{ r.label }}</span>
          </button>
        </div>
      </div>

      <div v-else-if="tool === 'text'" class="pe-p-text">
        <div class="pe-tabs"><b class="on">글꼴</b><button type="button" class="pe-tabs__act" aria-label="텍스트 추가" @click="addText"><span class="pe-plus-c"><Ico :src="EIC.add" /></span></button></div>
        <div class="pe-fonts" role="radiogroup" aria-label="글꼴">
          <button type="button" role="radio" class="pe-font" :class="{ on: textFontSel === 'basic' }" :aria-checked="textFontSel === 'basic'" @click="pickFont('basic')">기본</button>
          <button type="button" role="radio" class="pe-font is-bobae" :class="{ on: textFontSel === 'bobae' }" :aria-checked="textFontSel === 'bobae'" @click="pickFont('bobae')">보배체</button>
        </div>
        <div class="pe-colors" role="radiogroup" aria-label="글자 색">
          <button v-for="c in TEXT_COLORS" :key="c" type="button" role="radio" class="pe-dot" :class="{ on: textColor === c }" :style="{ '--c': c }" :aria-checked="textColor === c" :aria-label="`색 ${c}`" @click="pickTextColor(c)" />
        </div>
      </div>

      <div v-else-if="tool === 'tpl'" class="pe-p-tpl">
        <div class="pe-tabs"><b class="on">인기</b></div>
        <div class="pe-hlist" role="radiogroup" aria-label="템플릿">
          <button v-for="t in TPLS" :key="t.id" type="button" role="radio" class="pe-card is-tpl" :class="{ on: page?.tpl === t.id }" :aria-checked="page?.tpl === t.id" @click="pickTpl(t.id)">
            <span class="pe-card__img">
              <svg v-if="t.id === 'none'" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.5" /><path d="M6.5 17.5l11-11" stroke="currentColor" stroke-width="1.5" /></svg>
              <img v-else :src="tplThumbs[t.id]" alt="" />
            </span>
            <span class="pe-card__name">{{ t.name }}</span>
          </button>
        </div>
      </div>

      <div v-else-if="tool === 'sticker'" class="pe-p-stk">
        <div class="pe-tabs"><b class="on">인기</b><button type="button" class="pe-tabs__act" :aria-label="stkOpen ? '접기' : '펼치기'" :aria-expanded="stkOpen" @click="stkOpen = !stkOpen"><Ico :src="EIC.chevron" :class="{ 'is-up': !stkOpen }" /></button></div>
        <div v-show="stkOpen" class="pe-stks">
          <button v-for="s in STICKERS" :key="s.id" type="button" class="pe-stk" :aria-label="s.id.startsWith('p') ? '번호판 가리개 스티커' : '표정 스티커'" @click="addSticker(s.id)">
            <img :src="stkUrl[s.id]" alt="" draggable="false" />
          </button>
        </div>
      </div>

      <div v-else-if="tool === 'filter'" class="pe-p-flt">
        <div class="pe-hlist" role="radiogroup" aria-label="필터">
          <button v-for="f in FILTERS" :key="f.id" type="button" role="radio" class="pe-card is-flt" :class="{ on: page?.filter === f.id }" :aria-checked="page?.filter === f.id" @click="pickFilter(f.id)">
            <span class="pe-card__img"><img :src="filterThumbs[f.id]" alt="" /></span>
            <span class="pe-card__name">{{ f.name }}</span>
          </button>
        </div>
      </div>

      <div class="pe-bar">
        <button type="button" aria-label="취소" @click="cancelTool"><Ico :src="EIC.close" /></button>
        <b>{{ toolTitle }}</b>
        <button type="button" aria-label="적용" @click="applyTool"><Ico :src="EIC.check" /></button>
      </div>
    </section>

    <div v-if="confirmExit" class="pe-confirm" role="alertdialog" aria-modal="true" aria-labelledby="pe-confirm-t" @click.self="confirmExit = false">
      <div class="pe-confirm__box">
        <p id="pe-confirm-t">편집을 그만둘까요?</p>
        <small>지금까지 편집한 내용은 저장되지 않아요.</small>
        <div>
          <button type="button" @click="confirmExit = false">취소</button>
          <button type="button" class="is-main" @click="emit('close')">그만두기</button>
        </div>
      </div>
    </div>
  </div>
</template>
