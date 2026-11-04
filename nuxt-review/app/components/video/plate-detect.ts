// 번호판 자동 찾기(동처띠 挡车牌 「识别成功」 재현): 영상 구간을 0.33초 남짓마다 훑어 번호판 네 모서리를 찾고,
// 재생할 때는 가까운 두 시각 사이를 이어 붙여(보간) 차가 움직여도 가림이 따라가게 한다.
// 모델 = OpenCV Zoo LPD-YuNet(int8, 1MB, Apache-2.0) · 실행 = onnxruntime-web(wasm, 기기 안에서만, 서버로 보내지 않음).
import type { Seq } from "./render";

/** 영상 원본 화면 기준 0~1 좌표 네 점(왼쪽 위 → 오른쪽 위 → 오른쪽 아래 → 왼쪽 아래 순서가 아닐 수 있어 그릴 때 다시 정렬) */
export type Quad = number[];
export interface PlateKey { t: number; q: Quad[] }
/** 클립 번호별, 실제 재생 시각(초) 순서 */
export type PlateTrack = PlateKey[][];

const IW = 320, IH = 240; // 모델 입력 크기(고정)
const MS = [[10, 16, 24], [32, 48], [64, 96], [128, 192, 256]];
const ST = [8, 16, 32, 64];
const TH = 0.5; // 점수 기준
let priors: Float32Array | null = null;
let session: Promise<{ run: (x: Float32Array) => Promise<{ loc: Float32Array; conf: Float32Array; iou: Float32Array }> }> | null = null;

function makePriors() {
  const f2 = [Math.floor(Math.floor((IH + 1) / 2) / 2), Math.floor(Math.floor((IW + 1) / 2) / 2)];
  const fm: number[][] = [[Math.floor(f2[0]! / 2), Math.floor(f2[1]! / 2)]];
  for (let k = 0; k < 3; k++) fm.push([Math.floor(fm[k]![0]! / 2), Math.floor(fm[k]![1]! / 2)]);
  const p: number[] = [];
  fm.forEach(([fh, fw], k) => {
    for (let i = 0; i < fh!; i++) for (let j = 0; j < fw!; j++) for (const s of MS[k]!) p.push(((j + 0.5) * ST[k]!) / IW, ((i + 0.5) * ST[k]!) / IH, s / IW, s / IH);
  });
  return new Float32Array(p);
}

let modelUrl = "models/lpd-yunet-2023mar-int8.onnx";
/** 앱 기본 주소(baseURL)를 붙인 모델 주소. 화면 쪽에서 한 번 알려 준다 */
export const setPlateBase = (baseURL: string) => { modelUrl = `${baseURL.replace(/\/?$/, "/")}models/lpd-yunet-2023mar-int8.onnx`; };

/** 처음 부를 때만 런타임 · 모델을 받는다 */
function load() {
  if (session) return session;
  session = (async () => {
    const [ort, wasm] = await Promise.all([import("onnxruntime-web/wasm"), import("onnxruntime-web/ort-wasm-simd-threaded.wasm?url")]);
    ort.env.wasm.wasmPaths = { wasm: wasm.default };
    if (!window.crossOriginIsolated) ort.env.wasm.numThreads = 1;
    const s = await ort.InferenceSession.create(new URL(modelUrl, location.href).href, { executionProviders: ["wasm"] });
    priors = makePriors();
    return {
      async run(x: Float32Array) {
        const out = await s.run({ [s.inputNames[0]!]: new ort.Tensor("float32", x, [1, 3, IH, IW]) });
        return { loc: out.loc!.data as Float32Array, conf: out.conf!.data as Float32Array, iou: out.iou!.data as Float32Array };
      },
    };
  })();
  session.catch(() => { session = null; });
  return session;
}

let cx: CanvasRenderingContext2D | null = null;
const pad = () => {
  if (!cx) {
    const c = document.createElement("canvas");
    c.width = IW;
    c.height = IH;
    cx = c.getContext("2d", { willReadFrequently: true })!;
  }
  return cx;
};

/** 한 장면의 한 부분(sx, sy, sw, sh: 원본 화소)을 320×240으로 넣고 찾은 네 점(원본 0~1 좌표) */
async function runOnce(src: CanvasImageSource, W: number, H: number, sx: number, sy: number, sw: number, sh: number) {
  const m = await load();
  const g = pad();
  g.drawImage(src, sx, sy, sw, sh, 0, 0, IW, IH);
  const d = g.getImageData(0, 0, IW, IH).data;
  const x = new Float32Array(3 * IW * IH);
  // 모델은 BGR · 0~255 그대로
  for (let i = 0, n = IW * IH; i < n; i++) { x[i] = d[i * 4 + 2]!; x[n + i] = d[i * 4 + 1]!; x[2 * n + i] = d[i * 4]!; }
  const { loc, conf, iou } = await m.run(x);
  const P = priors!;
  const out: { q: Quad; s: number }[] = [];
  for (let k = 0, n = P.length / 4; k < n; k++) {
    const sc = Math.sqrt(conf[k * 2 + 1]! * Math.min(1, Math.max(0, iou[k]!)));
    if (sc < TH) continue;
    const q: Quad = [];
    for (const a of [4, 6, 10, 12]) {
      const px = (P[k * 4]! + loc[k * 14 + a]! * 0.1 * P[k * 4 + 2]!) * sw + sx;
      const py = (P[k * 4 + 1]! + loc[k * 14 + a + 1]! * 0.1 * P[k * 4 + 3]!) * sh + sy;
      q.push(px / W, py / H);
    }
    out.push({ q, s: sc });
  }
  return out;
}

const bbox = (q: Quad) => {
  const xs = [q[0]!, q[2]!, q[4]!, q[6]!], ys = [q[1]!, q[3]!, q[5]!, q[7]!];
  return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
};
const iouOf = (a: Quad, b: Quad) => {
  const A = bbox(a), B = bbox(b);
  const iw = Math.max(0, Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0)), ih = Math.max(0, Math.min(A.y1, B.y1) - Math.max(A.y0, B.y0));
  const u = (A.x1 - A.x0) * (A.y1 - A.y0) + (B.x1 - B.x0) * (B.y1 - B.y0) - iw * ih;
  return u > 0 ? (iw * ih) / u : 0;
};
/** 번호판 같지 않은 것(너무 크거나 · 세로로 길거나 · 찌그러진 것)은 버린다 */
function plausible(q: Quad, W: number, H: number) {
  const b = bbox(q);
  const w = (b.x1 - b.x0) * W, h = (b.y1 - b.y0) * H;
  if (w <= 0 || h <= 0) return false;
  const r = w / h;
  return r > 1.3 && r < 7 && (w * h) / (W * H) < 0.06 && b.x0 > -0.02 && b.y0 > -0.02 && b.x1 < 1.02 && b.y1 < 1.02;
}

/** 한 장면에서 번호판 찾기: 전체를 먼저 보고, 없으면 네 귀퉁이를 크게 보고 한 번 더 */
export async function detectPlates(src: CanvasImageSource, W: number, H: number): Promise<Quad[]> {
  let found = (await runOnce(src, W, H, 0, 0, W, H)).filter((r) => plausible(r.q, W, H));
  if (!found.length) {
    const tw = W * 0.6, th = H * 0.6;
    for (const [x0, y0] of [[0, 0], [W - tw, 0], [0, H - th], [W - tw, H - th]] as const) {
      found.push(...(await runOnce(src, W, H, x0, y0, tw, th)).filter((r) => plausible(r.q, W, H)));
    }
  }
  found.sort((a, b) => b.s - a.s);
  const keep: { q: Quad; s: number }[] = [];
  for (const f of found) if (!keep.some((k) => iouOf(k.q, f.q) > 0.3)) keep.push(f);
  return keep.slice(0, 3).map((k) => k.q);
}

function seekTo(v: HTMLVideoElement, t: number) {
  return new Promise<void>((ok) => {
    const done = () => { v.removeEventListener("seeked", done); ok(); };
    v.addEventListener("seeked", done);
    v.currentTime = Math.max(0, Math.min(t, (v.duration || 0) - 0.05));
    setTimeout(done, 1500);
  });
}

/** 고른 구간(가상 시각 a~b)을 훑어 클립별 번호판 위치표를 만든다 */
export async function scanPlates(seq: Seq, a: number, b: number, onProgress: (p: number) => void, signal?: AbortSignal): Promise<PlateTrack> {
  await load();
  const len = Math.max(0.1, b - a);
  const step = Math.max(0.33, len / 120);
  const n = Math.max(1, Math.ceil(len / step));
  const track: PlateTrack = seq.clips.map(() => []);
  const els = new Map<number, HTMLVideoElement>();
  try {
    for (let k = 0; k <= n; k++) {
      if (signal?.aborted) throw new DOMException("취소", "AbortError");
      const { i, real } = seq.locate(Math.min(b, a + k * step));
      let v = els.get(i);
      if (!v) {
        v = document.createElement("video");
        v.muted = true;
        v.playsInline = true;
        v.preload = "auto";
        v.src = seq.clips[i]!.url;
        await new Promise<void>((ok) => { v!.onloadeddata = () => ok(); v!.onerror = () => ok(); setTimeout(ok, 4000); });
        els.set(i, v);
      }
      await seekTo(v, real);
      const W = v.videoWidth, H = v.videoHeight;
      if (W && H) track[i]!.push({ t: v.currentTime, q: await detectPlates(v, W, H) });
      onProgress((k + 1) / (n + 1));
    }
  } finally {
    els.forEach((v) => { v.removeAttribute("src"); v.load(); });
  }
  // 한 번만 놓친 칸은 앞뒤로 메운다(깜빡임 방지)
  for (const keys of track) {
    for (let k = 1; k < keys.length - 1; k++) {
      if (!keys[k]!.q.length && keys[k - 1]!.q.length && keys[k + 1]!.q.length) keys[k]!.q = keys[k - 1]!.q.map((q, j) => lerpQ(q, nearest(keys[k + 1]!.q, q) ?? q, 0.5));
    }
  }
  return track;
}
export const trackCount = (t: PlateTrack) => t.reduce((s, keys) => s + keys.filter((k) => k.q.length).length, 0);

const center = (q: Quad) => [(q[0]! + q[2]! + q[4]! + q[6]!) / 4, (q[1]! + q[3]! + q[5]! + q[7]!) / 4] as const;
function nearest(list: Quad[], q: Quad) {
  const [x, y] = center(q);
  let best: Quad | null = null, bd = 0.15;
  for (const c of list) { const [cx2, cy2] = center(c); const d = Math.hypot(cx2 - x, cy2 - y); if (d < bd) { bd = d; best = c; } }
  return best;
}
const lerpQ = (a: Quad, b: Quad, k: number) => a.map((v, i) => v + (b[i]! - v) * k);

/** 클립 i의 실제 시각 t에 보여야 할 번호판들 */
export function platesAt(track: PlateTrack, i: number, t: number): Quad[] {
  const keys = track[i];
  if (!keys?.length) return [];
  let hi = keys.findIndex((k) => k.t >= t);
  if (hi < 0) hi = keys.length - 1;
  const k1 = keys[hi]!, k0 = keys[Math.max(0, hi - 1)]!;
  if (k0 === k1 || k1.t - k0.t > 1.2) {
    const k = Math.abs(k0.t - t) < Math.abs(k1.t - t) ? k0 : k1;
    return Math.abs(k.t - t) < 0.5 ? k.q : [];
  }
  const f = Math.max(0, Math.min(1, (t - k0.t) / (k1.t - k0.t || 1)));
  const out: Quad[] = [];
  for (const q of k0.q) { const m = nearest(k1.q, q); out.push(m ? lerpQ(q, m, f) : q); }
  for (const q of k1.q) if (!nearest(k0.q, q)) out.push(q);
  return out;
}

/** 네 점 → 중심 · 기울기 · 폭 · 높이(가림을 번호판 모양대로 돌려 그리려고) */
export function quadFrame(q: Quad, W: number, H: number) {
  const pts = [0, 2, 4, 6].map((i) => [q[i]! * W, q[i + 1]! * H] as [number, number]);
  const [mx, my] = [pts.reduce((s, p) => s + p[0], 0) / 4, pts.reduce((s, p) => s + p[1], 0) / 4];
  // 위쪽 두 점 · 아래쪽 두 점으로 정렬
  const sorted = [...pts].sort((a, b) => a[1] - b[1]);
  const top = sorted.slice(0, 2).sort((a, b) => a[0] - b[0]), bot = sorted.slice(2).sort((a, b) => a[0] - b[0]);
  const ang = Math.atan2(top[1]![1] - top[0]![1], top[1]![0] - top[0]![0]);
  const w = (Math.hypot(top[1]![0] - top[0]![0], top[1]![1] - top[0]![1]) + Math.hypot(bot[1]![0] - bot[0]![0], bot[1]![1] - bot[0]![1])) / 2;
  const h = (Math.hypot(bot[0]![0] - top[0]![0], bot[0]![1] - top[0]![1]) + Math.hypot(bot[1]![0] - top[1]![0], bot[1]![1] - top[1]![1])) / 2;
  return { x: mx, y: my, ang, w, h };
}
