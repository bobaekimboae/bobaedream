// 매물 소개 영상(Car Studio Video BETA와 같은 흐름: 사진 8~15장 + 차량 정보 → 틀 · 색 · 비율 · 음악 → 영상).
// 「클래식」 틀은 Car Studio 결과 영상의 구성(여는 사진 + 제조사 · 모델 → 사진 + 세리프 제목 → 상세 정보 2×3 → 사양 줄 → 마무리)을
// 보배드림이 새로 그린 것이다. 나머지 틀(릴스형 · 매물 카드형 · 사진 띠형)은 촬영 키트 그리기 엔진(@kit/render)을 그대로 쓴다.
// 반사기 원칙: 사진은 고치지 않는다(자르기 · 천천히 이동 · 흐린 채움만). 글자는 사용자가 적은 사실만 넣는다.
import { ASPECT_SIZE, exportMp4, loadImage, type Cut, type ShortformAspect, type ShortformPlan } from "@kit/render";
import { loadGlyphs } from "@kit/fonts";
import { makeMusic } from "@sf/music";
import type { MusicId } from "@sf/store";
import { blobImage, compose, optOf } from "./compose";
import type { Project } from "./store";

export type Template = "classic" | "reels" | "card" | "band";
export const TEMPLATES: { id: Template; label: string; desc: string }[] = [
  { id: "classic", label: "클래식", desc: "어두운 화면 · 세리프 제목 · 사양 표" },
  { id: "reels", label: "릴스형", desc: "사진 꽉 채움 · 큰 자막" },
  { id: "card", label: "매물 카드형", desc: "사진 + 아래 매물 정보" },
  { id: "band", label: "사진 띠형", desc: "가로 사진 띠 · 위아래 정보" },
];
export type Palette = { id: string; label: string; bg: string; ink: string; sub: string; accent: string };
export const PALETTES: Palette[] = [
  { id: "ivory", label: "다크 아이보리", bg: "#08090A", ink: "#E8E3D9", sub: "#8C8780", accent: "#C9B98F" },
  { id: "gold", label: "블랙 골드", bg: "#0B0A08", ink: "#F2E6C8", sub: "#8F8366", accent: "#D4AF37" },
  { id: "navy", label: "화이트 네이비", bg: "#F5F3EE", ink: "#0E1B2B", sub: "#5B6676", accent: "#306BD9" },
  { id: "blue", label: "보배 블루", bg: "#0E1B2B", ink: "#F2F5FA", sub: "#8FA3BF", accent: "#5A8FF0" },
];
export const LANGS = [
  { id: "ko", label: "한국어" },
  { id: "en", label: "English" },
] as const;
export type Lang = (typeof LANGS)[number]["id"];

export type CarInfo = { maker: string; model: string; year: string; mileage: string; fuel: string; gear: string; color: string; price: string; options: string[]; note: string };
export type VideoSpec = { template: Template; palette: string; aspect: ShortformAspect; music: MusicId; lang: Lang; car: CarInfo; dealer: { name: string; company: string; phone: string }; photoIds: string[] };

const L = {
  ko: { details: "상세 정보", highlights: "주요 사양", year: "연식", km: "주행거리", fuel: "연료", gear: "변속기", color: "색상", price: "가격", consult: "가격 상담", end: "보배드림에서 매물 보기", dealer: "딜러" },
  en: { details: "DETAILS", highlights: "HIGHLIGHTS", year: "Year", km: "Mileage", fuel: "Fuel", gear: "Gearbox", color: "Color", price: "Price", consult: "Ask", end: "See this car on Bobaedream", dealer: "Dealer" },
};
const SERIF = '"Noto Serif KR", "Nanum Myeongjo", "AppleMyungjo", "Batang", Georgia, serif';
const SANS = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif';
const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

export const kmText = (raw: string) => {
  const n = Number(raw.replace(/[^\d]/g, ""));
  if (!n) return "";
  return `${n.toLocaleString("ko-KR")}km`;
};
export const priceText = (raw: string, lang: Lang = "ko") => {
  const n = Number(raw.replace(/[^\d]/g, ""));
  if (!n) return "";
  return lang === "ko" ? `${n.toLocaleString("ko-KR")}만원` : `₩${(n * 10000).toLocaleString("en-US")}`;
};
const title = (c: CarInfo) => [c.maker, c.model].map((x) => x.trim()).filter(Boolean).join(" ");

/** 영상에 쓸 사진(프로젝트에서 처리한 결과 그대로) */
async function photoImages(p: Project, ids: string[], side = 1600): Promise<HTMLCanvasElement[]> {
  const out: HTMLCanvasElement[] = [];
  const logo = p.settings.logo ? await blobImage(p.settings.logo).catch(() => null) : null;
  for (const id of ids) {
    const ph = p.photos.find((x) => x.id === id);
    if (!ph) continue;
    const k = side / Math.max(ph.w, ph.h);
    const c = document.createElement("canvas");
    c.width = Math.round(ph.w * k);
    c.height = Math.round(ph.h * k);
    await compose(c.getContext("2d")!, ph, c.width, c.height, optOf(p, logo));
    out.push(c);
  }
  return out;
}

// ---------- 클래식 틀 ----------
type Scene = { dur: number; draw: (g: CanvasRenderingContext2D, W: number, H: number, t: number) => void };
const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
function cover(g: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number, zoom = 1, pan = 0) {
  const k = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * k;
  const dh = img.height * k;
  g.save();
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.drawImage(img, x + (w - dw) / 2 + pan * (dw - w) * 0.5, y + (h - dh) / 2, dw, dh);
  g.restore();
}
/** 사진 전체를 보여 주기: 뒤에는 같은 사진을 흐리고 어둡게 깔고, 앞에는 잘리지 않게 넣는다 */
function containBlur(g: CanvasRenderingContext2D, img: CanvasImageSource & { width: number; height: number }, x: number, y: number, w: number, h: number, zoom = 1, dim = 0.45) {
  g.save();
  g.filter = `blur(${Math.round(Math.min(w, h) / 30)}px)`;
  cover(g, img, x, y, w, h, 1.2);
  g.filter = "none";
  g.fillStyle = `rgba(0,0,0,${dim})`;
  g.fillRect(x, y, w, h);
  const k = Math.min(w / img.width, h / img.height) * zoom;
  const dw = img.width * k;
  const dh = img.height * k;
  g.beginPath();
  g.rect(x, y, w, h);
  g.clip();
  g.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  g.restore();
}
function spaced(g: CanvasRenderingContext2D, text: string, x: number, y: number, gap: number) {
  // 글자 사이를 띄워 쓰는 머리글(가운데 정렬)
  const ws = [...text].map((ch) => g.measureText(ch).width);
  const total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
  let cx = x - total / 2;
  [...text].forEach((ch, i) => {
    g.fillText(ch, cx, y);
    cx += ws[i] + gap;
  });
}
function fit(g: CanvasRenderingContext2D, text: string, font: (s: number) => string, size: number, maxW: number) {
  let s = size;
  g.font = font(s);
  while (g.measureText(text).width > maxW && s > 12) {
    s -= 2;
    g.font = font(s);
  }
  return s;
}

export function classicScenes(spec: VideoSpec, imgs: HTMLCanvasElement[]): Scene[] {
  const pal = PALETTES.find((x) => x.id === spec.palette) ?? PALETTES[0];
  const t = L[spec.lang];
  const c = spec.car;
  const name = title(c) || "보배드림 매물";
  const scenes: Scene[] = [];
  const u = (W: number, H: number) => Math.min(W, H) / 720; // 720 기준 단위
  // 1) 여는 장면: 첫 사진 꽉 채움 + 아래 어두운 띠 + 제조사(띄어 쓴 머리글) · 모델(세리프)
  if (imgs[0])
    scenes.push({
      dur: 3.2,
      draw: (g, W, H, s) => {
        const k = u(W, H);
        if (W / H < 1) containBlur(g, imgs[0], 0, 0, W, H * 0.78, 1.08 - 0.06 * ease(s / 3.2), 0.35);
        else cover(g, imgs[0], 0, 0, W, H, 1.12 - 0.08 * ease(s / 3.2));
        const gr = g.createLinearGradient(0, H * 0.45, 0, H);
        gr.addColorStop(0, "rgba(0,0,0,0)");
        gr.addColorStop(1, "rgba(0,0,0,0.85)");
        g.fillStyle = gr;
        g.fillRect(0, H * 0.45, W, H * 0.55);
        const a = ease((s - 0.3) / 0.8);
        g.globalAlpha = a;
        g.fillStyle = "#fff";
        g.textAlign = "left";
        g.textBaseline = "alphabetic";
        g.font = `600 ${22 * k}px ${SANS}`;
        g.textAlign = "center";
        spaced(g, (c.maker || "BOBAEDREAM").toUpperCase(), W / 2, H * 0.8, 8 * k);
        const fs = fit(g, c.model || name, (z) => `500 ${z}px ${SERIF}`, 64 * k, W * 0.86);
        g.font = `500 ${fs}px ${SERIF}`;
        g.fillText(c.model || name, W / 2, H * 0.8 + 70 * k);
        g.globalAlpha = 1;
      },
    });
  // 2) 사진 + 세리프 제목(로마 숫자): 사진 2~4
  const lines = [c.year && `${c.year}${spec.lang === "ko" ? "년식" : ""}`, kmText(c.mileage), c.color, ...c.options.slice(0, 2)].filter(Boolean) as string[];
  imgs.slice(1, 4).forEach((img, i) => {
    scenes.push({
      dur: 2.6,
      draw: (g, W, H, s) => {
        const k = u(W, H);
        g.fillStyle = pal.bg;
        g.fillRect(0, 0, W, H);
        const ph = H * (W / H < 0.8 ? 0.6 : 0.68);
        cover(g, img, 0, 0, W, ph, 1.04 + 0.04 * (s / 2.6), i % 2 ? 0.3 : -0.3);
        const a = ease((s - 0.2) / 0.7);
        g.globalAlpha = a;
        g.textAlign = "center";
        g.fillStyle = pal.accent;
        g.font = `500 ${22 * k}px ${SERIF}`;
        g.fillText(`${ROMAN[i]}.`, W / 2, ph + (H - ph) * 0.34);
        g.fillStyle = pal.ink;
        const text = lines[i] ?? name;
        const fs = fit(g, text, (z) => `400 ${z}px ${SERIF}`, 46 * k, W * 0.84);
        g.font = `400 ${fs}px ${SERIF}`;
        g.fillText(text, W / 2, ph + (H - ph) * 0.34 + 62 * k);
        g.globalAlpha = 1;
      },
    });
  });
  // 3) 상세 정보 2×3
  const cells: [string, string][] = [
    [t.year, c.year],
    [t.km, kmText(c.mileage)],
    [t.fuel, c.fuel],
    [t.gear, c.gear],
    [t.color, c.color],
    [t.price, priceText(c.price, spec.lang) || t.consult],
  ];
  scenes.push({
    dur: 3.6,
    draw: (g, W, H, s) => {
      const k = u(W, H);
      g.fillStyle = pal.bg;
      g.fillRect(0, 0, W, H);
      g.textAlign = "center";
      g.fillStyle = pal.accent;
      g.font = `600 ${20 * k}px ${SANS}`;
      spaced(g, t.details, W / 2, H * 0.2, spec.lang === "ko" ? 6 * k : 10 * k);
      g.strokeStyle = pal.sub;
      g.lineWidth = Math.max(1, k);
      g.beginPath();
      g.moveTo(W * 0.42, H * 0.2 + 26 * k);
      g.lineTo(W * 0.58, H * 0.2 + 26 * k);
      g.stroke();
      const top = H * 0.3;
      const cw = (W * 0.84) / 2;
      const ch = (H * 0.56) / 3;
      cells.forEach(([lab, val], i) => {
        const a = ease((s - 0.2 - i * 0.12) / 0.6);
        g.globalAlpha = a;
        const x = W * 0.08 + (i % 2) * cw + cw / 2;
        const y = top + Math.floor(i / 2) * ch + ch * 0.35;
        g.fillStyle = pal.sub;
        g.font = `500 ${18 * k}px ${SANS}`;
        g.fillText(lab, x, y);
        g.fillStyle = pal.ink;
        const v = val || "–";
        const fs = fit(g, v, (z) => `500 ${z}px ${SERIF}`, 34 * k, cw * 0.88);
        g.font = `500 ${fs}px ${SERIF}`;
        g.fillText(v, x, y + 48 * k);
      });
      g.globalAlpha = 1;
    },
  });
  // 4) 주요 사양 줄(옵션)
  if (c.options.length)
    scenes.push({
      dur: 3.2,
      draw: (g, W, H, s) => {
        const k = u(W, H);
        g.fillStyle = pal.bg;
        g.fillRect(0, 0, W, H);
        g.textAlign = "center";
        g.fillStyle = pal.accent;
        g.font = `600 ${20 * k}px ${SANS}`;
        spaced(g, t.highlights, W / 2, H * 0.22, spec.lang === "ko" ? 6 * k : 10 * k);
        const list = c.options.slice(0, 6);
        const gap = Math.min(80 * k, (H * 0.6) / list.length);
        list.forEach((o, i) => {
          g.globalAlpha = ease((s - 0.2 - i * 0.18) / 0.5);
          const y = H * 0.34 + i * gap;
          g.textAlign = "left";
          g.fillStyle = pal.accent;
          g.font = `500 ${22 * k}px ${SERIF}`;
          g.fillText(`${ROMAN[i]}.`, W * 0.14, y);
          g.fillStyle = pal.ink;
          const fs = fit(g, o, (z) => `400 ${z}px ${SERIF}`, 32 * k, W * 0.62);
          g.font = `400 ${fs}px ${SERIF}`;
          g.fillText(o, W * 0.26, y);
          g.strokeStyle = pal.sub;
          g.globalAlpha *= 0.4;
          g.beginPath();
          g.moveTo(W * 0.14, y + gap * 0.38);
          g.lineTo(W * 0.86, y + gap * 0.38);
          g.stroke();
        });
        g.globalAlpha = 1;
      },
    });
  // 5) 나머지 사진(최대 8장): 위아래 여백에 꽉 찬 사진, 천천히 옆으로
  imgs.slice(4, 12).forEach((img, i) => {
    scenes.push({
      dur: 2.1,
      draw: (g, W, H, s) => {
        g.fillStyle = pal.bg;
        g.fillRect(0, 0, W, H);
        containBlur(g, img, 0, 0, W, H, 1.02 + 0.05 * (s / 2.1), 0.5);
      },
    });
  });
  // 6) 마무리: 딜러 · 상사 · 연락처
  scenes.push({
    dur: 3.2,
    draw: (g, W, H, s) => {
      const k = u(W, H);
      g.fillStyle = pal.bg;
      g.fillRect(0, 0, W, H);
      if (imgs[0]) {
        g.globalAlpha = 0.18;
        cover(g, imgs[0], 0, 0, W, H, 1.1);
        g.globalAlpha = 1;
      }
      g.globalAlpha = ease(s / 0.8);
      g.textAlign = "center";
      g.fillStyle = pal.ink;
      const fs = fit(g, name, (z) => `500 ${z}px ${SERIF}`, 48 * k, W * 0.86);
      g.font = `500 ${fs}px ${SERIF}`;
      g.fillText(name, W / 2, H * 0.4);
      const pr = priceText(c.price, spec.lang);
      if (pr) {
        g.fillStyle = pal.accent;
        g.font = `600 ${34 * k}px ${SANS}`;
        g.fillText(pr, W / 2, H * 0.4 + 64 * k);
      }
      const d = spec.dealer;
      g.fillStyle = pal.sub;
      g.font = `500 ${22 * k}px ${SANS}`;
      const who = [d.name.trim() && `${d.name.trim()} ${t.dealer}`, d.company.trim()].filter(Boolean).join(" · ");
      if (who) g.fillText(who, W / 2, H * 0.66);
      if (d.phone.trim()) g.fillText(d.phone.trim(), W / 2, H * 0.66 + 38 * k);
      g.fillStyle = pal.ink;
      g.font = `600 ${20 * k}px ${SANS}`;
      g.fillText(t.end, W / 2, H * 0.86);
      g.globalAlpha = 1;
    },
  });
  return scenes;
}
export const scenesDuration = (s: Scene[]) => s.reduce((a, b) => a + b.dur, 0);
/** 장면 사이 0.35초 겹쳐 사라지기 */
export function drawScenes(g: CanvasRenderingContext2D, W: number, H: number, scenes: Scene[], t: number) {
  let start = 0;
  for (let i = 0; i < scenes.length; i++) {
    const sc = scenes[i];
    if (t < start + sc.dur || i === scenes.length - 1) {
      const local = t - start;
      sc.draw(g, W, H, local);
      const fade = 0.35;
      if (local > sc.dur - fade && scenes[i + 1]) {
        g.save();
        g.globalAlpha = (local - (sc.dur - fade)) / fade;
        scenes[i + 1].draw(g, W, H, 0);
        g.restore();
      }
      return;
    }
    start += sc.dur;
  }
}

async function encode(W: number, H: number, fps: number, dur: number, draw: (g: CanvasRenderingContext2D, t: number) => void, audio: AudioBuffer | null, onProgress: (r: number) => void) {
  const mb = await import("mediabunny");
  const { Output, Mp4OutputFormat, BufferTarget, CanvasSource, AudioBufferSource, QUALITY_HIGH, getFirstEncodableVideoCodec, getFirstEncodableAudioCodec } = mb;
  const codec = await getFirstEncodableVideoCodec(["avc", "vp9", "av1"], { width: W, height: H });
  if (!codec) throw new Error("이 브라우저에서는 mp4를 만들 수 없어요. 크롬 · 엣지 · 최신 사파리에서 열어 주세요.");
  const audioCodec = audio ? await getFirstEncodableAudioCodec(["aac", "opus"], { numberOfChannels: 2, sampleRate: 48000 }).catch(() => null) : null;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d")!;
  const output = new Output({ format: new Mp4OutputFormat({ fastStart: "in-memory" }), target: new BufferTarget() });
  const source = new CanvasSource(canvas, { codec, bitrate: QUALITY_HIGH });
  output.addVideoTrack(source, { frameRate: fps });
  const as = audio && audioCodec ? new AudioBufferSource({ codec: audioCodec, bitrate: 128000 }) : null;
  if (as) output.addAudioTrack(as);
  await output.start();
  const total = Math.round(dur * fps);
  for (let f = 0; f < total; f++) {
    const t = f / fps;
    draw(g, t);
    await source.add(t, 1 / fps);
    if (f % 6 === 0) onProgress((f / total) * 0.95);
  }
  source.close();
  if (as && audio) {
    await as.add(audio);
    as.close();
  }
  await output.finalize();
  onProgress(1);
  const buf = (output.target as InstanceType<typeof BufferTarget>).buffer;
  if (!buf) throw new Error("영상을 만들지 못했어요.");
  return { video: new Blob([buf], { type: "video/mp4" }), codec };
}

/** 촬영 키트 엔진은 <img>(naturalWidth)를 쓴다: 그린 캔버스를 그림으로 바꾼다 */
async function asImages(cs: HTMLCanvasElement[]) {
  const out: HTMLImageElement[] = [];
  for (const c of cs) {
    const img = await loadImage(c.toDataURL("image/jpeg", 0.9));
    if (img) out.push(img);
  }
  return out;
}
function kitPlan(spec: VideoSpec, imgs: HTMLImageElement[]): ShortformPlan {
  const [width, height] = ASPECT_SIZE[spec.aspect];
  const c = spec.car;
  const facts = [c.year && `${c.year}년식`, kmText(c.mileage) && `${kmText(c.mileage)} 주행`, c.color, ...c.options].filter(Boolean) as string[];
  const n = Math.min(imgs.length, 10);
  const pr = priceText(c.price);
  const cuts: Cut[] = imgs.slice(0, n).map((img, i) => ({ source: { kind: "image", image: img }, duration: spec.template === "card" ? 2.6 : 2.2, line: i === n - 1 && pr ? pr : facts[i] ?? "" }));
  return {
    template: spec.template === "classic" ? "card" : spec.template,
    width,
    height,
    fps: 30,
    cuts,
    hook: title(c),
    title: title(c),
    trim: [c.year && `${c.year}년식`, c.color].filter(Boolean).join(" · "),
    price: pr,
    specs: [c.year && `${c.year}년식`, kmText(c.mileage), c.fuel, c.color].filter(Boolean) as string[],
    place: "",
    showPrice: Boolean(pr),
    dealer: { name: spec.dealer.name.trim() || "보배드림", company: spec.dealer.company.trim(), phone: spec.dealer.phone.trim(), label: spec.dealer.name.trim() ? undefined : "보배드림 매물" },
    qr: null,
    logo: null,
  };
}

/** 영상 만들기. 진행률 0~1과 지금 하는 일을 알려 준다 */
export async function makeVideo(p: Project, spec: VideoSpec, onStep: (text: string, r: number) => void) {
  onStep("사진을 영상 크기로 맞추는 중", 0.02);
  const imgs = await photoImages(p, spec.photoIds);
  if (imgs.length < 1) throw new Error("영상에 쓸 사진을 읽지 못했어요.");
  await loadGlyphs([title(spec.car), spec.car.options.join(""), spec.car.color, spec.car.fuel, spec.car.gear, spec.dealer.name, spec.dealer.company, "상세 정보주요 사양연식주행거리연료변속기색상가격상담보배드림에서 매물 보기딜러년식만원"].join(""));
  if (spec.template === "classic") {
    const [W, H] = ASPECT_SIZE[spec.aspect];
    const scenes = classicScenes(spec, imgs);
    const dur = scenesDuration(scenes);
    onStep("배경 음악을 만드는 중", 0.06);
    const audio = await makeMusic(spec.music, dur);
    const r = await encode(W, H, 30, dur, (g, t) => drawScenes(g, W, H, scenes, t), audio, (x) => onStep("영상을 그리는 중", 0.08 + x * 0.9));
    return { ...r, seconds: Math.round(dur) };
  }
  const plan = kitPlan(spec, await asImages(imgs));
  onStep("배경 음악을 만드는 중", 0.06);
  const { planDuration } = await import("@kit/render");
  plan.voice = await makeMusic(spec.music, planDuration(plan));
  const video = await exportMp4(plan, (x) => onStep("영상을 그리는 중", 0.08 + x * 0.9));
  return { video, codec: "", seconds: Math.round(planDuration(plan)) };
}

/** 틀 미리보기 한 장(틀 고르기 칸) */
export async function previewFrame(canvas: HTMLCanvasElement, p: Project, spec: VideoSpec, img: HTMLCanvasElement | null) {
  const [W, H] = [180, 320];
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d")!;
  if (!img) {
    g.fillStyle = "#0E1B2B";
    g.fillRect(0, 0, W, H);
    return;
  }
  if (spec.template === "classic") {
    const sc = classicScenes({ ...spec, aspect: "9:16" }, [img, img]);
    sc[1]?.draw(g, W, H, 2) ?? sc[0].draw(g, W, H, 2);
    return;
  }
  const { drawFrame } = await import("@kit/render");
  const plan = kitPlan({ ...spec, aspect: "9:16" }, await asImages([img]));
  const big = document.createElement("canvas");
  big.width = plan.width;
  big.height = plan.height;
  drawFrame(big.getContext("2d")!, plan, 1.2);
  g.drawImage(big, 0, 0, W, H);
}
export { photoImages, loadImage };
