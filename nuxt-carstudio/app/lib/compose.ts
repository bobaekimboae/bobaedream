// 사진 합치기: 배경(보배드림이 그린 것) + 오려 낸 차 + 번호판 처리 + 보정 + 로고.
// 반사기 원칙: 차 모양 · 흠집은 고치지 않는다(밝기 · 대비 같은 사진 보정과 위치 · 크기만 바꾼다).
import { drawBg, ensureMine, loadImg } from "./backgrounds";
import type { Aspect, Photo, PlateMode, Project, Resolution } from "./store";

export const ASPECTS: { id: Aspect; label: string }[] = [
  { id: "original", label: "원본" },
  { id: "4:3", label: "4:3" },
  { id: "3:2", label: "3:2" },
  { id: "16:9", label: "16:9" },
  { id: "1:1", label: "1:1" },
];
export const RESOLUTIONS: { id: Resolution; label: string; side: number }[] = [
  { id: "hd", label: "HD 1280", side: 1280 },
  { id: "fhd", label: "FHD 1920", side: 1920 },
  { id: "qhd", label: "QHD 2560", side: 2560 },
];
const RATIO: Record<Exclude<Aspect, "original">, number> = { "4:3": 4 / 3, "3:2": 3 / 2, "16:9": 16 / 9, "1:1": 1 };

export function outSize(p: Photo, aspect: Aspect, side: number) {
  const r = aspect === "original" ? p.w / p.h : RATIO[aspect];
  return r >= 1 ? { W: side, H: Math.round(side / r) } : { W: Math.round(side * r), H: side };
}

// 사진 · 오린 차 그림 캐시(같은 Blob이면 다시 풀지 않는다)
const imgCache = new WeakMap<Blob, Promise<HTMLImageElement>>();
export function blobImage(b: Blob) {
  let p = imgCache.get(b);
  if (!p) {
    const u = URL.createObjectURL(b);
    p = loadImg(u);
    imgCache.set(b, p);
  }
  return p;
}

type PlateOpt = { mode: PlateMode; text: string; color: string };
const plateCache = new Map<string, HTMLCanvasElement>();
/** 번호판 처리를 한 차 그림(차 모양 안에만 칠한다) */
async function carLayer(p: Photo, plate: PlateOpt): Promise<CanvasImageSource | null> {
  if (!p.cut) return null;
  const cut = await blobImage(p.cut);
  if (plate.mode === "keep" || !p.plate) return cut;
  const key = `${p.id}|${plate.mode}|${plate.text}|${plate.color}|${p.plate.x},${p.plate.y},${p.plate.w},${p.plate.h}`;
  const hit = plateCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = cut.naturalWidth;
  c.height = cut.naturalHeight;
  const g = c.getContext("2d")!;
  g.drawImage(cut, 0, 0);
  paintPlate(g, c.width, c.height, p.plate, plate, await blobImage(p.original));
  plateCache.set(key, c);
  return c;
}
/** 번호판 칸 칠하기(흐림 · 흰 판 · 내 번호판). 차 모양 밖으로는 번지지 않는다 */
export function paintPlate(g: CanvasRenderingContext2D, W: number, H: number, r: { x: number; y: number; w: number; h: number }, plate: PlateOpt, original: HTMLImageElement) {
  const x = r.x * W;
  const y = r.y * H;
  const w = r.w * W;
  const h = r.h * H;
  g.save();
  g.globalCompositeOperation = "source-atop";
  if (plate.mode === "blur") {
    // 작게 줄였다 키워 글자를 알아볼 수 없게(모자이크) + 흐림
    const t = document.createElement("canvas");
    t.width = Math.max(4, Math.round(w / 10));
    t.height = Math.max(2, Math.round(h / 10));
    const tg = t.getContext("2d")!;
    tg.drawImage(original, (x / W) * original.naturalWidth, (y / H) * original.naturalHeight, (w / W) * original.naturalWidth, (h / H) * original.naturalHeight, 0, 0, t.width, t.height);
    g.imageSmoothingEnabled = true;
    g.filter = `blur(${Math.max(2, h * 0.18)}px)`;
    g.drawImage(t, x, y, w, h);
    g.filter = "none";
  } else {
    const rad = Math.min(w, h) * 0.18;
    g.fillStyle = plate.mode === "custom" ? plate.color : "#FFFFFF";
    g.beginPath();
    g.roundRect(x, y, w, h, rad);
    g.fill();
    g.lineWidth = Math.max(1, h * 0.06);
    g.strokeStyle = "rgba(0,0,0,0.55)";
    g.stroke();
    if (plate.mode === "custom" && plate.text.trim()) {
      g.fillStyle = luminance(plate.color) > 0.55 ? "#111" : "#fff";
      let fs = h * 0.62;
      g.font = `800 ${fs}px "Pretendard Variable", Pretendard, system-ui, sans-serif`;
      const tw = g.measureText(plate.text).width;
      if (tw > w * 0.86) {
        fs *= (w * 0.86) / tw;
        g.font = `800 ${fs}px "Pretendard Variable", Pretendard, system-ui, sans-serif`;
      }
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(plate.text, x + w / 2, y + h / 2 + fs * 0.04);
    }
  }
  g.restore();
}
function luminance(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
}

export function filterOf(a: Photo["adjust"]) {
  return `brightness(${100 + a.brightness}%) contrast(${100 + a.contrast}%) saturate(${100 + a.saturation}%) hue-rotate(${a.tint * 0.6}deg)`;
}

/** 편집기 모드에서 차가 놓이는 자리(화면 좌표). 끌기 · 크기 손잡이도 이 값을 쓴다 */
export function carRect(p: Photo, W: number, H: number) {
  if (!p.box) return null;
  const cw = p.box.x1 - p.box.x0;
  const ch = p.box.y1 - p.box.y0;
  const k = Math.min((0.8 * W) / cw, (0.6 * H) / ch) * p.pos.scale;
  const w = cw * k;
  const h = ch * k;
  return { x: p.pos.x * W - w / 2, y: p.pos.y * H - h, w, h, k };
}

type Opt = { plate: PlateOpt; mode: Project["mode"]; logo?: HTMLImageElement | null; logoAt?: Project["settings"]["logoAt"]; others?: Photo[] };

async function drawOne(g: CanvasRenderingContext2D, p: Photo, W: number, H: number, o: Opt) {
  await ensureMine(p.bg);
  const car = await carLayer(p, o.plate);
  if (o.mode === "blur" || !car || !p.box) {
    // 배경 흐림: 원본을 흐리게 깔고 차를 원래 자리에 또렷하게(차를 못 찾았으면 원본 그대로)
    const orig = await blobImage(p.original);
    const k = Math.max(W / p.w, H / p.h);
    const ox = (W - p.w * k) / 2;
    const oy = (H - p.h * k) / 2;
    g.save();
    if (car && p.box) g.filter = `blur(${Math.round(W / 90)}px)`;
    g.drawImage(orig, ox - (car ? W * 0.02 : 0), oy - (car ? H * 0.02 : 0), p.w * k + (car ? W * 0.04 : 0), p.h * k + (car ? H * 0.04 : 0));
    g.restore();
    if (car && p.box) {
      g.save();
      g.filter = filterOf(p.adjust);
      g.drawImage(car, ox, oy, p.w * k, p.h * k);
      g.restore();
    }
    return;
  }
  const r = carRect(p, W, H)!;
  const horizon = Math.max(H * 0.3, Math.min(H * 0.88, r.y + r.h * 0.58));
  const fx = drawBg(g, W, H, horizon, p.bg);
  const sx = p.box.x0;
  const sy = p.box.y0;
  const sw = p.box.x1 - p.box.x0;
  const sh = p.box.y1 - p.box.y0;
  const bottom = r.y + r.h;
  if (p.reflect && fx.reflect > 0) {
    g.save();
    g.globalAlpha = fx.reflect;
    g.translate(0, bottom * 2);
    g.scale(1, -1);
    g.filter = filterOf(p.adjust);
    g.drawImage(car, sx, sy, sw, sh, r.x, r.y, r.w, r.h);
    g.restore();
    // 반사가 아래로 갈수록 옅게
    g.save();
    const fade = g.createLinearGradient(0, bottom, 0, bottom + r.h * 0.5);
    fade.addColorStop(0, "rgba(0,0,0,0)");
    fade.addColorStop(1, "rgba(0,0,0,1)");
    g.globalCompositeOperation = "destination-out";
    g.fillStyle = fade;
    g.fillRect(0, bottom, W, r.h * 0.5);
    g.globalCompositeOperation = "destination-over";
    drawBg(g, W, H, horizon, p.bg);
    g.restore();
  }
  if (fx.shadow > 0) {
    g.save();
    g.translate(r.x + r.w / 2, bottom - r.h * 0.02);
    g.scale(1, Math.max(0.05, (r.h * 0.09) / (r.w * 0.55)));
    const sg = g.createRadialGradient(0, 0, 0, 0, 0, r.w * 0.55);
    sg.addColorStop(0, `rgba(0,0,0,${fx.shadow})`);
    sg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = sg;
    g.beginPath();
    g.arc(0, 0, r.w * 0.55, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  g.save();
  g.translate(r.x + r.w / 2, r.y + r.h / 2);
  g.rotate((p.adjust.rotate * Math.PI) / 180);
  g.filter = filterOf(p.adjust);
  g.drawImage(car, sx, sy, sw, sh, -r.w / 2, -r.h / 2, r.w, r.h);
  g.restore();
}

/** 한 장 그리기(편집기 · 배경 흐림 · 멀티뷰). 크기 W×H */
export async function compose(g: CanvasRenderingContext2D, p: Photo, W: number, H: number, o: Opt) {
  g.clearRect(0, 0, W, H);
  if (o.mode === "multi" && o.others && o.others.length > 1) {
    const list = [p, ...o.others.filter((x) => x.id !== p.id)].slice(0, 4);
    const cols = 2;
    const rows = list.length > 2 ? 2 : 1;
    const cw = W / cols;
    const chh = H / rows;
    for (let i = 0; i < list.length; i++) {
      const c = document.createElement("canvas");
      c.width = Math.round(cw);
      c.height = Math.round(chh);
      await drawOne(c.getContext("2d")!, list[i], c.width, c.height, { ...o, mode: "editor" });
      g.drawImage(c, (i % cols) * cw, Math.floor(i / cols) * chh);
    }
    g.fillStyle = "#FFFFFF";
    g.fillRect(W / 2 - 2, 0, 4, H);
    if (rows > 1) g.fillRect(0, H / 2 - 2, W, 4);
  } else await drawOne(g, p, W, H, o);
  if (o.logo) {
    const lw = W * 0.14;
    const lh = (o.logo.naturalHeight / o.logo.naturalWidth) * lw;
    const m = W * 0.03;
    const at = o.logoAt ?? "tr";
    g.drawImage(o.logo, at.endsWith("l") ? m : W - m - lw, at.startsWith("t") ? m : H - m - lh, lw, lh);
  }
}

export function optOf(pr: Project, logo: HTMLImageElement | null = null): Opt {
  const [text, color] = pr.customPlate.split("|");
  return { plate: { mode: pr.plateMode, text: text ?? "", color: color || "#FFFFFF" }, mode: pr.mode, logo, logoAt: pr.settings.logoAt, others: pr.photos.filter((x) => x.cut) };
}

/** 내려받기용 파일(JPEG, 투명 배경이면 PNG) */
export async function renderFile(pr: Project, p: Photo, logo: HTMLImageElement | null): Promise<Blob> {
  const side = RESOLUTIONS.find((r) => r.id === pr.settings.resolution)?.side ?? 1920;
  const { W, H } = outSize(p, pr.settings.aspect, side);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  await compose(c.getContext("2d")!, p, W, H, optOf(pr, logo));
  const png = p.bg === "pl-none" && pr.mode === "editor";
  return new Promise((ok, no) => c.toBlob((b) => (b ? ok(b) : no(new Error("사진을 만들지 못했어요."))), png ? "image/png" : "image/jpeg", 0.92));
}

/** 목록 표지(작게) */
export async function posterOf(pr: Project): Promise<string> {
  const p = pr.photos.find((x) => x.cut) ?? pr.photos[0];
  if (!p) return "";
  const { W, H } = outSize(p, "4:3", 480);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  await compose(c.getContext("2d")!, p, W, H, optOf(pr));
  return c.toDataURL("image/jpeg", 0.8);
}
