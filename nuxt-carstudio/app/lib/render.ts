// 영상 만들기. 원본 Classic 결과 영상(1080×1920 · 25fps · 35.4초)을 칸 단위로 재서 옮겼다(2026-11-03, 랜드로버 레인지로버 10장).
//   배경 #080808 · 테두리 x33~1046 · y119~1570(1px #191B1B) · 아래 진행선 y1548(시간만큼 밝아짐)
//   장면: I 첫 사진+차명 → II 사진+제조사·모델·연식 → III 사진 → IV 디테일(사진 6칸)+바디·색 → V 사진+변속기·연료·구동 표 → VI 이력(주행·상태) → VII 제조사·모델
//   장면마다 검정에서 0.6초 밝아지며 사진이 천천히 줄어들고(1.06→1.00), 끝 0.3초 어두워진다. 오른쪽 아래 로마 숫자(I~VII).
//   장면 길이 = 그 장면 대사 길이 + 여유(대사 없는 장면 3.6초).
// Modern · Showcase 결과 영상은 원본을 아직 못 봤다(설명 글만 봄): 설명대로 만든 추정판이다.
// 반사기 원칙: 사진은 고치지 않는다(자르기 · 천천히 이동만).
import { buyerFacts, COLOR, BODY, DRIVETRAIN, FUEL, lab, mileageLabel, priceLabel, TRANSMISSION, voiceLine, word, CONDITION } from "./options";
import { makeMusic } from "./music";
import type { Aspect, Details, Options, TemplateId } from "./types";

export type SceneKind = "hero" | "title" | "photo" | "details" | "specs" | "history" | "closing" | "spec";
export type Scene = { kind: SceneKind; photos: HTMLImageElement[]; dur: number; line: string; spec?: [string, string] };
export type Plan = { W: number; H: number; fps: number; template: TemplateId; scenes: Scene[]; d: Details; o: Options; logo: HTMLImageElement | null };

export const SIZE: Record<Aspect, [number, number]> = { "9:16": [1080, 1920], "1:1": [1080, 1080], "16:9": [1920, 1080] };
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV"];
const SANS = `"Pretendard Variable", Pretendard, "Montserrat", system-ui, sans-serif`;
const SERIF = `"Noto Serif KR", "Nanum Myeongjo", "Cormorant Garamond", "Times New Roman", serif`;

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = src;
  });
}

/** 대사 길이(초) 어림: 한국어 1초 6.5글자 · 영어 1초 2.6낱말 */
export function speechSeconds(line: string, ko: boolean) {
  if (!line) return 0;
  return ko ? line.replace(/\s/g, "").length / 6.5 : line.split(/\s+/).length / 2.6;
}
const durOf = (line: string, ko: boolean, min = 3.6) => Math.max(min, speechSeconds(line, ko) + 0.8);

export function buildScenes(template: TemplateId, photos: HTMLImageElement[], d: Details, o: Options): Scene[] {
  const ko = o.lang === "ko";
  const vl = (k: string) => (o.voiceover ? voiceLine(k, d, o.lang) : "");
  const p = (i: number) => photos[Math.min(i, photos.length - 1)]!;
  const scene = (kind: SceneKind, ph: HTMLImageElement[], line: string, min?: number): Scene => ({ kind, photos: ph, line, dur: durOf(line, ko, min) });
  if (template === "showcase") {
    // 사양을 하나씩: 가격 · 주행 · 엔진 · 연료 · 변속기 · 구동 · 바디 · 색 · 구매자 정보
    const specs: [string, string, string][] = [
      [word("price", o.lang), priceLabel(d, o.lang), "price"],
      [word("mileage", o.lang), mileageLabel(d), "history"],
      [word("power", o.lang), d.power ? `${d.power.replace(/[^\d]/g, "")} hp` : "", ""],
      [word("engine", o.lang), d.engine ? `${Number(d.engine.replace(/[^\d]/g, "")).toLocaleString("en-US")} cc` : "", ""],
      [word("fuel", o.lang), lab(FUEL, d.fuel, o.lang), ""],
      [word("transmission", o.lang), lab(TRANSMISSION, d.transmission, o.lang), ""],
      [word("drivetrain", o.lang), lab(DRIVETRAIN, d.drivetrain, o.lang), ""],
      ...buyerFacts(d, o.lang).map(([a, b]) => [a, b, ""] as [string, string, string]),
    ].filter((x) => x[1]) as [string, string, string][];
    const out: Scene[] = [scene("hero", [p(0)], vl("hero"))];
    specs.forEach((s, i) => out.push({ ...scene("spec", [p(i + 1)], s[2] ? vl(s[2]) : "", 2.6), spec: [s[0], s[1]] }));
    out.push(scene("closing", [], vl("closing")));
    return out;
  }
  const n = photos.length;
  const base: Scene[] = [
    scene("hero", [p(0)], vl("hero")),
    scene("title", [p(1)], vl("title")),
    scene("photo", [p(2)], ""),
    scene("details", photos.slice(3, 9).length ? photos.slice(3, 9) : [p(0)], vl("details")),
    scene("specs", [p(n - 1)], vl("specs")),
    scene("history", [], vl("history")),
    scene("closing", [], [vl("price"), vl("closing")].filter(Boolean).join(" ")),
  ];
  if (template === "modern") {
    // 빠른 컷: 장면을 짧게, 남은 사진은 한 장씩 빠르게 넣는다
    const extra = photos.slice(9, 15).map((im) => ({ kind: "photo" as SceneKind, photos: [im], line: "", dur: 1.4 }));
    return [base[0]!, base[1]!, base[2]!, ...extra, base[3]!, base[4]!, base[5]!, base[6]!].map((s) => ({ ...s, dur: s.line ? s.dur : Math.min(s.dur, 1.8) }));
  }
  return base;
}

export async function buildPlan(photoUrls: string[], d: Details, o: Options): Promise<Plan> {
  const imgs = (await Promise.all(photoUrls.map(loadImage))).filter(Boolean) as HTMLImageElement[];
  if (imgs.length < 3) throw new Error("사진을 읽지 못했어요. JPG · PNG 사진으로 다시 골라 주세요.");
  const [W, H] = SIZE[o.aspect];
  const logo = o.logo ? await loadImage(o.logo) : null;
  return { W, H, fps: 25, template: o.template, scenes: buildScenes(o.template, imgs, d, o), d, o, logo };
}
export const planSeconds = (p: Plan) => p.scenes.reduce((s, x) => s + x.dur, 0);
/** 대사가 나오는 시각(장면 시작 + 0.3초) */
export function lineTimes(p: Plan) {
  const out: { at: number; text: string }[] = [];
  let t = 0;
  for (const s of p.scenes) {
    if (s.line) out.push({ at: t + 0.3, text: s.line });
    t += s.dur;
  }
  return out;
}

// ---- 그리기 ----
type Box = { x: number; y: number; w: number; h: number };
type Layout = { frame: Box; hero: Box; photo: Box; collage: Box; specPhoto: Box; text: { cx: number; x0: number; x1: number; y: (portraitY: number) => number }; side: boolean };

function layout(W: number, H: number): Layout {
  const s = W / 1080;
  if (H > W) {
    const k = (v: number) => v * s;
    const b = (x: number, y: number, w: number, h: number): Box => ({ x: k(x), y: k(y), w: k(w), h: k(h) });
    return {
      frame: b(33.5, 119.5, 1012.5, 1450.5), hero: b(30, 274, 1020, 1211), photo: b(52, 291, 976, 652), collage: b(50, 334, 980, 989), specPhoto: b(54, 355, 972, 648),
      text: { cx: W / 2, x0: k(52), x1: k(1027), y: (py) => k(py) }, side: false,
    };
  }
  if (H === W) {
    const k = (v: number) => v * s;
    // 정사각: 세로 구성을 높이 1080에 맞춰 줄인다(사진 위 · 글 아래). 원본 미확인 · 추정
    const r = 1080 / 1920;
    const b = (x: number, y: number, w: number, h: number): Box => ({ x: k(x), y: k(y * r), w: k(w), h: k(h * r) });
    return {
      frame: { x: k(33.5), y: k(40), w: k(1012.5), h: k(1000) }, hero: b(30, 274, 1020, 1211), photo: { x: k(190), y: k(110), w: k(700), h: k(467) }, collage: { x: k(190), y: k(120), w: k(700), h: k(700) },
      specPhoto: { x: k(250), y: k(110), w: k(580), h: k(387) }, text: { cx: W / 2, x0: k(150), x1: k(930), y: (py) => k(py * r + 30) }, side: false,
    };
  }
  // 가로: 사진 왼쪽 · 글 오른쪽(원본 미확인 · 추정)
  const k = H / 1080;
  return {
    frame: { x: 33.5 * k, y: 40 * k, w: W - 67 * k, h: H - 80 * k }, hero: { x: 30 * k, y: 40 * k, w: W - 60 * k, h: H - 80 * k },
    photo: { x: 90 * k, y: 140 * k, w: 1050 * k, h: 700 * k }, collage: { x: 90 * k, y: 120 * k, w: 1050 * k, h: 760 * k }, specPhoto: { x: 90 * k, y: 140 * k, w: 1050 * k, h: 700 * k },
    text: { cx: 1520 * k, x0: 1200 * k, x1: 1840 * k, y: (py) => (py - 600) * 0.55 * k + 460 * k }, side: true,
  };
}

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

function cover(ctx: CanvasRenderingContext2D, im: HTMLImageElement, b: Box, zoom = 1) {
  const ir = im.naturalWidth / im.naturalHeight;
  const br = b.w / b.h;
  let sw = im.naturalWidth;
  let sh = im.naturalHeight;
  if (ir > br) sw = sh * br;
  else sh = sw / br;
  sw /= zoom;
  sh /= zoom;
  const sx = (im.naturalWidth - sw) / 2;
  const sy = (im.naturalHeight - sh) / 2;
  ctx.drawImage(im, sx, sy, sw, sh, b.x, b.y, b.w, b.h);
}

function text(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, size: number, opt: { font?: string; weight?: number; color?: string; align?: CanvasTextAlign; track?: number; alpha?: number } = {}) {
  if (!s) return;
  ctx.save();
  ctx.globalAlpha *= opt.alpha ?? 1;
  ctx.font = `${opt.weight ?? 400} ${size}px ${opt.font ?? SANS}`;
  ctx.fillStyle = opt.color ?? "#FFFFFF";
  ctx.textAlign = opt.align ?? "center";
  ctx.textBaseline = "alphabetic";
  if (opt.track) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${opt.track}px`;
  ctx.fillText(s, x, y);
  ctx.restore();
}

/** 「Land Rover Range Rover」 → 「L. Rover R. Rover」(원본 첫 장면 글자). 한국어는 그대로 */
export function shortName(d: Details) {
  const w = [d.make, d.model].join(" ").trim().split(/\s+/);
  if (/[가-힣]/.test(w.join(""))) return w.join(" ");
  if (w.length < 4) return w.join(" ");
  return w.map((x, i) => (i % 2 === 0 ? `${x[0]}.` : x)).join(" ");
}

function drawScene(ctx: CanvasRenderingContext2D, p: Plan, sc: Scene, idx: number, local: number, t: number, total: number) {
  const { W, H } = p;
  const L = layout(W, H);
  const s = Math.min(W, H > W ? W : H * 1080 / 1080) / 1080;
  const ko = p.o.lang === "ko";
  const fadeIn = ease(local / 0.6);
  const fadeOut = Math.min(1, (sc.dur - local) / 0.3);
  const vis = Math.max(0, Math.min(fadeIn, fadeOut));
  const z = 1.06 - 0.06 * ease(local / Math.max(1, sc.dur - 0.6));
  const modern = p.template === "modern";
  const textIn = ease((local - 0.25) / 0.5);
  const rise = (1 - textIn) * 18 * s;
  ctx.save();
  ctx.globalAlpha = vis;
  const ty = L.text.y;
  const tx = L.side ? L.text.cx : L.text.cx;
  const gray = "#8E9091";
  if (sc.kind === "hero") {
    const im = sc.photos[0]!;
    ctx.save();
    ctx.beginPath();
    ctx.rect(L.frame.x, L.frame.y, L.frame.w, L.frame.h);
    ctx.clip();
    cover(ctx, im, L.hero, modern ? 1.12 - 0.12 * ease(local / sc.dur) : z);
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(L.hero.x, L.hero.y, L.hero.w, L.hero.h);
    ctx.restore();
    const name = shortName(p.d);
    if (modern) {
      const k = ease((local - 0.15) / 0.45);
      text(ctx, name.toUpperCase(), W / 2, H / 2 + (1 - k) * 60 * s, 76 * s, { weight: 800, alpha: k, track: 2 * s });
      text(ctx, p.d.year, W / 2, H / 2 + 80 * s, 40 * s, { weight: 600, color: "#EC6D1C", alpha: k });
    } else {
      text(ctx, name, W / 2, (L.side ? H / 2 : ty(826)) - rise, 40 * s, { weight: 500, track: 3 * s, alpha: textIn });
    }
  } else if (sc.kind === "title" || sc.kind === "photo" || sc.kind === "spec") {
    const im = sc.photos[0]!;
    const box = sc.kind === "spec" ? L.specPhoto : L.photo;
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    cover(ctx, im, box, modern ? 1.1 - 0.1 * ease(local / sc.dur) : z);
    ctx.restore();
    if (sc.kind === "title") {
      text(ctx, p.d.make, tx, ty(1076) - rise, 30 * s, { color: "#BEC0C0", track: 1 * s, alpha: textIn });
      text(ctx, p.d.model, tx, ty(1230) - rise, 92 * s, { font: SERIF, weight: 300, alpha: textIn });
      text(ctx, p.d.year, tx, ty(1296) - rise, 24 * s, { color: gray, track: 1 * s, alpha: textIn });
    }
    if (sc.kind === "spec" && sc.spec) {
      text(ctx, sc.spec[0], tx, ty(1150) - rise, 28 * s, { color: gray, track: 4 * s, alpha: textIn });
      text(ctx, sc.spec[1], tx, ty(1270) - rise, 84 * s, { font: SERIF, weight: 300, alpha: textIn });
    }
  } else if (sc.kind === "details") {
    const box = L.collage;
    const cols = 2;
    const rows = Math.ceil(sc.photos.length / cols);
    const gap = 4 * s;
    const cw = (box.w - gap) / cols;
    const ch = (box.h - gap * (rows - 1)) / Math.max(rows, 3);
    sc.photos.forEach((im, i) => {
      const a = ease((local - i * 0.15) / 0.45);
      const c = { x: box.x + (i % cols) * (cw + gap), y: box.y + Math.floor(i / cols) * (ch + gap), w: cw, h: ch };
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.beginPath();
      ctx.rect(c.x, c.y, c.w, c.h);
      ctx.clip();
      cover(ctx, im, c, 1.04 - 0.04 * a);
      ctx.restore();
    });
    text(ctx, word("details", p.o.lang), tx, (L.side ? box.y - 30 * s : ty(300)), 26 * s, { color: "#BEC0C0", track: 3 * s, alpha: textIn });
    const cap = [lab(BODY, p.d.body, p.o.lang), lab(COLOR, p.d.color, p.o.lang)].filter(Boolean).join(" · ");
    text(ctx, cap, tx, L.side ? box.y + box.h + 60 * s : ty(1420), 26 * s, { color: "#BEC0C0", track: 1 * s, alpha: ease((local - 0.9) / 0.5) });
  } else if (sc.kind === "specs") {
    const box = L.specPhoto;
    ctx.save();
    ctx.beginPath();
    ctx.rect(box.x, box.y, box.w, box.h);
    ctx.clip();
    cover(ctx, sc.photos[0]!, box, z);
    ctx.restore();
    const rows: [string, string][] = [
      [word("transmission", p.o.lang), lab(TRANSMISSION, p.d.transmission, p.o.lang)],
      [word("fuel", p.o.lang), lab(FUEL, p.d.fuel, p.o.lang)],
      [word("drivetrain", p.o.lang), lab(DRIVETRAIN, p.d.drivetrain, p.o.lang)],
    ].filter((r) => r[1]) as [string, string][];
    table(ctx, rows, L.text.x0, L.text.x1, ty(1218), 106 * s * (L.side ? 0.8 : 1), s, local, ko);
  } else if (sc.kind === "history") {
    const rows: [string, string][] = [
      [word("mileage", p.o.lang), mileageLabel(p.d)],
      [word("condition", p.o.lang), lab(CONDITION, p.d.condition, p.o.lang)],
      ...buyerFacts(p.d, p.o.lang),
    ].filter((r) => r[1]) as [string, string][];
    text(ctx, word("history", p.o.lang), tx, ty(408), 26 * s, { color: "#BEC0C0", track: 3 * s, alpha: textIn });
    line(ctx, L.text.x0 + 8 * s, L.text.x1 - 8 * s, ty(470), 0.12);
    table(ctx, rows, L.text.x0, L.text.x1, ty(616), 112 * s * (L.side ? 0.8 : 1), s, local, ko);
  } else if (sc.kind === "closing") {
    const k = textIn;
    text(ctx, p.d.make, tx, ty(508) - rise, 30 * s, { color: "#BEC0C0", track: 1 * s, alpha: k });
    text(ctx, p.d.model, tx, ty(660) - rise, 92 * s, { font: SERIF, weight: 300, alpha: k });
    const price = priceLabel(p.d, p.o.lang);
    let y = ty(800);
    if (price) { text(ctx, price, tx, y - rise, 52 * s, { font: SERIF, weight: 400, color: "#EC6D1C", alpha: k }); y += 110 * s; }
    for (const v of [p.d.dealer, p.d.phone, p.d.address].filter(Boolean)) {
      text(ctx, v, tx, y, 32 * s, { color: "#DADCDC", alpha: ease((local - 0.6) / 0.5) });
      y += 58 * s;
    }
    if (p.logo) {
      const lw = 260 * s;
      const lh = lw * p.logo.naturalHeight / p.logo.naturalWidth;
      ctx.save();
      ctx.globalAlpha *= ease((local - 0.8) / 0.5);
      ctx.drawImage(p.logo, tx - lw / 2, Math.min(y + 40 * s, L.frame.y + L.frame.h - lh - 90 * s), lw, Math.min(lh, 160 * s));
      ctx.restore();
    }
  }
  // 오른쪽 아래 로마 숫자
  if (!modern) text(ctx, ROMAN[idx] ?? "", L.frame.x + L.frame.w - 34 * s, L.frame.y + L.frame.h - 46 * s, 26 * s, { align: "right", color: "#6D6F6F", font: SERIF });
  ctx.restore();
  // 진행선(테두리 안 아래): 전체 시간만큼 채운다
  const py = L.frame.y + L.frame.h - 22 * s;
  ctx.fillStyle = "#151717";
  ctx.fillRect(L.frame.x, py, L.frame.w, Math.max(1, 1.4 * s));
  const g = ctx.createLinearGradient(L.frame.x, 0, L.frame.x + L.frame.w, 0);
  g.addColorStop(0, "#2A2C2C");
  g.addColorStop(1, "#6A6C6C");
  ctx.fillStyle = modern ? "#EC6D1C" : g;
  ctx.fillRect(L.frame.x, py, L.frame.w * Math.min(1, t / total), Math.max(1, (modern ? 4 : 1.4) * s));
}

function line(ctx: CanvasRenderingContext2D, x0: number, x1: number, y: number, a: number) {
  ctx.fillStyle = `rgba(255,255,255,${a})`;
  ctx.fillRect(x0, y, x1 - x0, 1.5);
}

function table(ctx: CanvasRenderingContext2D, rows: [string, string][], x0: number, x1: number, y0: number, step: number, s: number, local: number, ko: boolean) {
  rows.forEach(([k, v], i) => {
    const a = ease((local - 0.3 - i * 0.18) / 0.5);
    const y = y0 + i * step;
    text(ctx, k, x0 + 8 * s, y, (ko ? 26 : 22) * s, { align: "left", color: "#8E9091", track: ko ? 1 * s : 2 * s, alpha: a });
    text(ctx, v, x1 - 8 * s, y + 4 * s, 44 * s, { align: "right", font: SERIF, weight: 400, alpha: a });
    if (i < rows.length) line(ctx, x0 + 8 * s, x1 - 8 * s, y + step * 0.43, 0.1 * a);
  });
}

export function drawFrame(ctx: CanvasRenderingContext2D, p: Plan, t: number) {
  const { W, H } = p;
  ctx.fillStyle = "#080808";
  ctx.fillRect(0, 0, W, H);
  const L = layout(W, H);
  ctx.strokeStyle = "#191B1B";
  ctx.lineWidth = 2;
  ctx.strokeRect(L.frame.x, L.frame.y, L.frame.w, L.frame.h);
  const total = planSeconds(p);
  let acc = 0;
  for (let i = 0; i < p.scenes.length; i += 1) {
    const sc = p.scenes[i]!;
    if (t < acc + sc.dur || i === p.scenes.length - 1) {
      drawScene(ctx, p, sc, i, Math.min(sc.dur, t - acc), t, total);
      return i;
    }
    acc += sc.dur;
  }
  return 0;
}

/** 원본처럼 mp4(H.264 우선)로 만든다. 음악은 넣고, AI 음성은 이 앱 안 재생에서만 들린다(브라우저가 음성을 파일로 못 꺼냄). */
export async function exportMp4(p: Plan, onProgress: (r: number) => void): Promise<Blob> {
  const mb = await import("mediabunny");
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, QUALITY_HIGH, getFirstEncodableVideoCodec, getFirstEncodableAudioCodec } = mb;
  // 큰 화면은 휴대폰에서 느려 1080 → 720으로 줄여 만든다(비율 그대로)
  const scale = 720 / Math.min(p.W, p.H);
  const outW = Math.round(p.W * scale / 2) * 2;
  const outH = Math.round(p.H * scale / 2) * 2;
  const codec = await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], { width: outW, height: outH });
  if (!codec) throw new Error("이 브라우저에서는 영상을 만들 수 없어요. 크롬 · 엣지 · 최신 사파리에서 열어 주세요.");
  const audioCodec = p.o.music !== "none" ? await getFirstEncodableAudioCodec(["aac", "opus"], { numberOfChannels: 2, sampleRate: 48000 }).catch(() => null) : null;
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(outW / p.W, outH / p.H);
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const source = new CanvasSource(canvas, { codec, bitrate: QUALITY_HIGH });
  output.addVideoTrack(source, { frameRate: p.fps });
  const audio = audioCodec ? new AudioBufferSource({ codec: audioCodec, bitrate: 128000 }) : null;
  if (audio) output.addAudioTrack(audio);
  await output.start();
  const total = planSeconds(p);
  const frames = Math.round(total * p.fps);
  for (let f = 0; f < frames; f += 1) {
    const t = f / p.fps;
    drawFrame(ctx, p, t);
    await source.add(t, 1 / p.fps);
    if (f % 5 === 0) onProgress((f / frames) * 0.95);
  }
  source.close();
  if (audio) {
    const buf = await makeMusic(p.o.music, total, p.o.voiceover ? 0.32 : 0.5);
    if (buf) await audio.add(buf);
    audio.close();
  }
  await output.finalize();
  onProgress(1);
  const buffer = (output.target as InstanceType<typeof BufferTarget>).buffer;
  if (!buffer) throw new Error("영상을 만들지 못했어요.");
  return new Blob([buffer], { type: "video/mp4" });
}

/** 목록용 작은 표지: 첫 장면(사진+차명) 한 장 */
export async function posterOf(p: Plan) {
  const c = document.createElement("canvas");
  const s = 360 / p.W;
  c.width = Math.round(p.W * s);
  c.height = Math.round(p.H * s);
  const ctx = c.getContext("2d")!;
  ctx.scale(s, s);
  drawFrame(ctx, p, 2);
  return c.toDataURL("image/jpeg", 0.82);
}
