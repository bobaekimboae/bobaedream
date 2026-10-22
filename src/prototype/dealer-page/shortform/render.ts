// 딜러용 숏폼 자동 제작기 1단계(2026-10-22 「숏폼 자동 제작 딜러용 프로그램 … 너가 만들어봐」).
// 매물 사진과 매물 정보로 9:16 영상을 캔버스에 그리고, 브라우저 안에서 mp4로 만든다(WebCodecs + Mediabunny, 서버 없음).
// 반사기 원칙: 사진 자체는 고치지 않는다(자르기·이동·흐린 채움만). 차를 새로 그리는 AI 생성은 쓰지 않는다.

export type ShortformTemplate = "reels" | "card";

export type ShortformPlan = {
  template: ShortformTemplate;
  width: number;
  height: number;
  fps: number;
  photos: HTMLImageElement[];
  /** 컷마다 한 줄 자막(사진 수와 같은 길이로 맞춘다) */
  lines: string[];
  /** 릴스형 상단 노란 훅 문구 */
  hook: string;
  title: string;
  trim: string;
  price: string;
  specs: string[];
  place: string;
  showPrice: boolean;
  dealer: { name: string; company: string; phone: string; photo?: HTMLImageElement };
};

const FONT = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const YELLOW = "#FFE34F";
const BLUE = "#306BD9";
const INK = "#222222";

export const CUT = { reels: 2.2, card: 2.6 } as const;
export const END_CARD = 3;

export function planDuration(plan: ShortformPlan) {
  return plan.photos.length * CUT[plan.template] + END_CARD;
}

/* ───────── 사진 불러오기 ───────── */

export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    // 다른 사이트 사진은 CORS 허용이 있어야 캔버스를 mp4로 내보낼 수 있다. 허용이 없으면 실패로 보고 뺀다.
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image.naturalWidth ? image : null);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

// 흐린 배경: 작게 줄였다 키우면 어느 브라우저에서나 같은 흐림이 나온다(canvas filter 미지원 대비).
const blurCache = new WeakMap<HTMLImageElement, HTMLCanvasElement>();
function blurredOf(image: HTMLImageElement) {
  const cached = blurCache.get(image);
  if (cached) return cached;
  const small = document.createElement("canvas");
  small.width = 24;
  small.height = Math.max(1, Math.round(24 * image.naturalHeight / image.naturalWidth));
  const sctx = small.getContext("2d")!;
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(image, 0, 0, small.width, small.height);
  blurCache.set(image, small);
  return small;
}

/* ───────── 그리기 도구 ───────── */

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const easeOut = (v: number) => 1 - Math.pow(1 - clamp(v), 3);

function drawCover(ctx: CanvasRenderingContext2D, image: CanvasImageSource, iw: number, ih: number, x: number, y: number, w: number, h: number, panX = 0.5, zoom = 1) {
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) * panX;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(image, dx, dy, dw, dh);
}

function drawBlurBackground(ctx: CanvasRenderingContext2D, image: HTMLImageElement, w: number, h: number, dim = 0.35) {
  const small = blurredOf(image);
  ctx.save();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  drawCover(ctx, small, small.width, small.height, 0, 0, w, h, 0.5, 1.15);
  ctx.fillStyle = `rgba(0,0,0,${dim})`;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapWords(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) { lines.push(line); line = word; } else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

// 자막 한 줄을 1~2 낱말 묶음으로 나눈다(참고 릴스처럼 한 박자에 한 마디).
export function captionChunks(line: string) {
  const words = line.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let chunk = "";
  words.forEach((word) => {
    const next = chunk ? `${chunk} ${word}` : word;
    if (chunk && (next.length > 7 || chunk.length >= 4)) { chunks.push(chunk); chunk = word; } else chunk = next;
  });
  if (chunk) chunks.push(chunk);
  return chunks.length ? chunks : [""];
}

const isHighlight = (text: string) => /\d|만원|최저|무사고|신차|단독|급매|풀옵션/.test(text);

function strokeText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fill: string, stroke: number) {
  ctx.lineJoin = "round";
  ctx.miterLimit = 2;
  ctx.lineWidth = stroke;
  ctx.strokeStyle = "rgba(0,0,0,.92)";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

/* ───────── 끝 장면: 딜러 명함 ───────── */

function drawEndCard(ctx: CanvasRenderingContext2D, plan: ShortformPlan, local: number) {
  const { width: W, height: H } = plan;
  const last = plan.photos[plan.photos.length - 1];
  if (last) drawBlurBackground(ctx, last, W, H, 0.55);
  else { ctx.fillStyle = INK; ctx.fillRect(0, 0, W, H); }
  const rise = (1 - easeOut(local / 0.45)) * 40;
  const alpha = easeOut(local / 0.35);
  ctx.save();
  ctx.globalAlpha = alpha;
  const cw = W - 112;
  const ch = 424;
  const cx = 56;
  const cy = (H - ch) / 2 - 40 + rise;
  ctx.shadowColor = "rgba(0,0,0,.28)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#fff";
  roundRect(ctx, cx, cy, cw, ch, 28);
  ctx.fill();
  ctx.shadowColor = "transparent";
  // 프사
  const pr = 64;
  const px = W / 2;
  const py = cy + 40 + pr;
  ctx.save();
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = "#F1F2F4";
  ctx.fill();
  ctx.clip();
  if (plan.dealer.photo) drawCover(ctx, plan.dealer.photo, plan.dealer.photo.naturalWidth, plan.dealer.photo.naturalHeight, px - pr, py - pr, pr * 2, pr * 2, 0.5, 1);
  ctx.restore();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = INK;
  ctx.font = `800 44px ${FONT}`;
  ctx.fillText(`${plan.dealer.name} 딜러`, W / 2, py + pr + 62);
  ctx.fillStyle = "#595959";
  ctx.font = `500 28px ${FONT}`;
  ctx.fillText(plan.dealer.company, W / 2, py + pr + 104);
  // 안심번호 줄
  ctx.fillStyle = BLUE;
  ctx.font = `800 40px ${FONT}`;
  ctx.fillText(plan.dealer.phone, W / 2, py + pr + 176);
  ctx.fillStyle = "#8C8C8C";
  ctx.font = `500 24px ${FONT}`;
  ctx.fillText("안심번호로 바로 연결돼요", W / 2, py + pr + 214);
  ctx.restore();
  // 카드 아래 안내
  ctx.save();
  ctx.globalAlpha = easeOut((local - 0.3) / 0.4);
  ctx.textAlign = "center";
  ctx.font = `800 34px ${FONT}`;
  strokeText(ctx, "보배드림에서 매물 보기", W / 2, cy + ch + 86, "#fff", 8);
  ctx.restore();
}

/* ───────── 릴스형: 전체 화면 사진 + 한 마디씩 큰 자막 ───────── */

function drawReels(ctx: CanvasRenderingContext2D, plan: ShortformPlan, t: number) {
  const { width: W, height: H } = plan;
  const cut = CUT.reels;
  const index = Math.min(plan.photos.length - 1, Math.floor(t / cut));
  const local = t - index * cut;
  const p = local / cut;
  const image = plan.photos[index];
  // 가로 사진은 세로 화면을 채우고 천천히 옆으로 움직여 차 전체를 보여 준다(컷마다 방향을 바꾼다).
  const dir = index % 2 === 0;
  const panX = dir ? 0.2 + 0.6 * p : 0.8 - 0.6 * p;
  const punch = 1 + 0.06 * (1 - easeOut(local / 0.35)) + 0.04 * p;
  drawCover(ctx, image, image.naturalWidth, image.naturalHeight, 0, 0, W, H, panX, punch);
  // 위아래 옅은 그늘(자막이 밝은 사진에서도 읽히게)
  const top = ctx.createLinearGradient(0, 0, 0, H * 0.24);
  top.addColorStop(0, "rgba(0,0,0,.45)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = top;
  ctx.fillRect(0, 0, W, H * 0.24);
  const bottom = ctx.createLinearGradient(0, H * 0.5, 0, H);
  bottom.addColorStop(0, "rgba(0,0,0,0)");
  bottom.addColorStop(1, "rgba(0,0,0,.4)");
  ctx.fillStyle = bottom;
  ctx.fillRect(0, H * 0.5, W, H * 0.5);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // 상단 훅(첫 컷에서 크게, 이후 작게 고정)
  if (plan.hook) {
    const first = index === 0;
    // 한 줄에 들어가도록 글자를 줄이고(최소 44·28), 그래도 넘치면 두 줄로 나눈다.
    let size = first ? 64 : 40;
    const min = first ? 44 : 28;
    ctx.font = `900 ${size}px ${FONT}`;
    while (size > min && ctx.measureText(plan.hook).width > W - 120) { size -= 2; ctx.font = `900 ${size}px ${FONT}`; }
    const y = first ? H * 0.15 : H * 0.1;
    const pop = first ? 0.85 + 0.15 * easeOut(local / 0.3) : 1;
    ctx.save();
    ctx.translate(W / 2, y);
    ctx.scale(pop, pop);
    wrapWords(ctx, plan.hook, W - 120).slice(0, 2).forEach((line, i) => strokeText(ctx, line, 0, i * size * 1.18, YELLOW, first ? 12 : 9));
    ctx.restore();
  }
  // 한 마디 자막
  const chunks = captionChunks(plan.lines[index] ?? "");
  const slot = (cut - 0.1) / chunks.length;
  const chunkIndex = Math.min(chunks.length - 1, Math.floor(Math.max(0, local - 0.05) / slot));
  const chunk = chunks[chunkIndex];
  if (chunk) {
    const since = local - 0.05 - chunkIndex * slot;
    const scale = 0.82 + 0.18 * easeOut(since / 0.16);
    ctx.save();
    ctx.translate(W / 2, H * 0.6);
    ctx.scale(scale, scale);
    ctx.font = `900 76px ${FONT}`;
    const lines = wrapWords(ctx, chunk, W - 100);
    lines.forEach((line, i) => strokeText(ctx, line, 0, (i - (lines.length - 1) / 2) * 88, isHighlight(chunk) ? YELLOW : "#fff", 14));
    ctx.restore();
  }
  // 가격 꼬리표(오른쪽 위가 아닌 아래쪽 가운데: 릴스 버튼 줄에 가리지 않게)
  if (plan.showPrice && plan.price) {
    ctx.font = `800 34px ${FONT}`;
    const label = plan.price;
    const tw = ctx.measureText(label).width + 48;
    const x = (W - tw) / 2;
    const y = H * 0.72;
    ctx.fillStyle = "rgba(255,255,255,.96)";
    roundRect(ctx, x, y, tw, 60, 30);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillText(label, W / 2, y + 31);
  }
  // 진행 막대(컷 위치)
  const n = plan.photos.length;
  const gap = 6;
  const bw = (W - 64 - gap * (n - 1)) / n;
  for (let i = 0; i < n; i += 1) {
    const x = 32 + i * (bw + gap);
    ctx.fillStyle = "rgba(255,255,255,.35)";
    roundRect(ctx, x, 28, bw, 5, 2.5);
    ctx.fill();
    const fill = i < index ? 1 : i === index ? p : 0;
    if (fill > 0) {
      ctx.fillStyle = "#fff";
      roundRect(ctx, x, 28, Math.max(5, bw * fill), 5, 2.5);
      ctx.fill();
    }
  }
}

/* ───────── 매물 카드형: 사진은 자르지 않고 가운데, 아래에 정보 ───────── */

function drawCard(ctx: CanvasRenderingContext2D, plan: ShortformPlan, t: number) {
  const { width: W, height: H } = plan;
  const cut = CUT.card;
  const index = Math.min(plan.photos.length - 1, Math.floor(t / cut));
  const local = t - index * cut;
  const p = local / cut;
  const image = plan.photos[index];
  drawBlurBackground(ctx, image, W, H, 0.5);
  // 사진: 가로 폭에 맞춰 원본 비율 그대로(자르지 않음), 천천히 확대
  const ratio = image.naturalHeight / image.naturalWidth;
  const ph = Math.min(H * 0.5, W * ratio);
  const pw = ph / ratio;
  const zoom = 1 + 0.05 * p;
  const fade = index > 0 ? easeOut(local / 0.3) : 1;
  const top = H * 0.2;
  ctx.save();
  ctx.globalAlpha = fade;
  roundRect(ctx, (W - pw) / 2, top, pw, ph, 0);
  ctx.clip();
  drawCover(ctx, image, image.naturalWidth, image.naturalHeight, (W - pw) / 2, top, pw, ph, 0.5, zoom);
  ctx.restore();
  // 위: 딜러 줄
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.font = `700 28px ${FONT}`;
  ctx.fillStyle = "#fff";
  ctx.fillText(`${plan.dealer.name} 딜러 · ${plan.dealer.company}`, 48, H * 0.12);
  // 아래 정보 블록
  const y0 = top + ph + 56;
  ctx.font = `500 30px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,.8)";
  ctx.fillText(plan.trim, 48, y0 + 64, W - 96);
  ctx.font = `800 52px ${FONT}`;
  ctx.fillStyle = "#fff";
  wrapWords(ctx, plan.title, W - 96).slice(0, 1).forEach((line) => ctx.fillText(line, 48, y0));
  if (plan.showPrice && plan.price) {
    ctx.font = `900 60px ${FONT}`;
    ctx.fillStyle = YELLOW;
    ctx.fillText(plan.price, 48, y0 + 150);
  }
  // 컷 자막(칩)
  const line = plan.lines[index] ?? "";
  if (line) {
    const appear = easeOut(local / 0.35);
    ctx.save();
    ctx.globalAlpha = appear;
    ctx.font = `800 34px ${FONT}`;
    const text = wrapWords(ctx, line, W - 140)[0] ?? line;
    const tw = ctx.measureText(text).width + 44;
    const cy = top - 86 + (1 - appear) * 16;
    ctx.fillStyle = "#fff";
    roundRect(ctx, 48, cy, tw, 62, 31);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.fillText(text, 70, cy + 32);
    ctx.restore();
  }
  // 스펙 줄
  ctx.font = `600 28px ${FONT}`;
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.fillText([...plan.specs, plan.place].filter(Boolean).join("  ·  "), 48, y0 + 222, W - 96);
}

/* ───────── 한 장면 그리기 ───────── */

export function drawFrame(ctx: CanvasRenderingContext2D, plan: ShortformPlan, t: number) {
  const { width: W, height: H } = plan;
  t = Number.isFinite(t) ? Math.max(0, t) : 0;
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, W, H);
  const body = plan.photos.length * CUT[plan.template];
  if (!plan.photos.length) {
    ctx.restore();
    return;
  }
  if (t >= body) drawEndCard(ctx, plan, t - body);
  else if (plan.template === "reels") drawReels(ctx, plan, t);
  else drawCard(ctx, plan, t);
  ctx.restore();
}

/* ───────── mp4 만들기 ───────── */

export async function canMakeMp4() {
  if (typeof window === "undefined" || !("VideoEncoder" in window)) return false;
  try {
    const { getFirstEncodableVideoCodec } = await import("mediabunny");
    return Boolean(await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], { width: 720, height: 1280 }));
  } catch {
    return false;
  }
}

export async function exportMp4(plan: ShortformPlan, onProgress: (ratio: number) => void, isCancelled: () => boolean = () => false) {
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, QUALITY_HIGH, getFirstEncodableVideoCodec } = await import("mediabunny");
  const codec = await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], { width: plan.width, height: plan.height });
  if (!codec) throw new Error("이 브라우저에서는 mp4를 만들 수 없어요. 크롬·엣지·최신 사파리에서 열어 주세요.");
  const canvas = document.createElement("canvas");
  canvas.width = plan.width;
  canvas.height = plan.height;
  const ctx = canvas.getContext("2d")!;
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const source = new CanvasSource(canvas, { codec, bitrate: QUALITY_HIGH });
  output.addVideoTrack(source, { frameRate: plan.fps });
  await output.start();
  const total = Math.round(planDuration(plan) * plan.fps);
  for (let frame = 0; frame < total; frame += 1) {
    if (isCancelled()) { await output.cancel(); throw new Error("cancelled"); }
    drawFrame(ctx, plan, frame / plan.fps);
    await source.add(frame / plan.fps, 1 / plan.fps);
    if (frame % 6 === 0) onProgress(frame / total);
  }
  source.close();
  await output.finalize();
  onProgress(1);
  const buffer = (output.target as InstanceType<typeof BufferTarget>).buffer;
  if (!buffer) throw new Error("영상을 만들지 못했어요.");
  return new Blob([buffer], { type: "video/mp4" });
}
