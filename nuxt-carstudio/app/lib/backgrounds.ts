// 배경 그림: 모두 보배드림이 캔버스로 직접 그린다(다른 회사 배경 사진 · 그림을 쓰지 않음).
// 탭 5개(Car Studio와 같은 구성): 스튜디오 · 쇼룸 · 야외 · 단색 · 내 배경(직접 올린 사진).
export type BgTab = "studio" | "showroom" | "outdoor" | "plain" | "mine";
export const BG_TABS: { id: BgTab; label: string }[] = [
  { id: "studio", label: "스튜디오" },
  { id: "showroom", label: "쇼룸" },
  { id: "outdoor", label: "야외" },
  { id: "plain", label: "단색" },
  { id: "mine", label: "내 배경" },
];
type Bg = { id: string; tab: BgTab; label: string; reflect: number; shadow: number; draw: (g: CanvasRenderingContext2D, W: number, H: number, horizon: number) => void };

const lin = (g: CanvasRenderingContext2D, y0: number, y1: number, stops: [number, string][]) => {
  const l = g.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) l.addColorStop(o, c);
  return l;
};
function wallFloor(g: CanvasRenderingContext2D, W: number, H: number, hz: number, wall: [string, string], floor: [string, string], seam = 0.12) {
  g.fillStyle = lin(g, 0, hz, [[0, wall[0]], [1, wall[1]]]);
  g.fillRect(0, 0, W, hz);
  g.fillStyle = lin(g, hz, H, [[0, floor[0]], [1, floor[1]]]);
  g.fillRect(0, hz, W, H - hz);
  g.fillStyle = lin(g, hz, hz + H * 0.05, [[0, `rgba(0,0,0,${seam})`], [1, "rgba(0,0,0,0)"]]);
  g.fillRect(0, hz, W, H * 0.05);
}
function glow(g: CanvasRenderingContext2D, x: number, y: number, r: number, c: string) {
  const rg = g.createRadialGradient(x, y, 0, x, y, r);
  rg.addColorStop(0, c);
  rg.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = rg;
  g.fillRect(x - r, y - r, r * 2, r * 2);
}
/** 아주 옅은 결(같은 씨앗이면 같은 무늬) */
function grain(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, a: number, seed = 7) {
  let s = seed;
  const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  g.fillStyle = `rgba(0,0,0,${a})`;
  for (let k = 0; k < (w * h) / 700; k++) g.fillRect(x + rnd() * w, y + rnd() * h, 1.4, 1.4);
}

export const BGS: Bg[] = [
  // 스튜디오
  { id: "st-white", tab: "studio", label: "화이트 스튜디오", reflect: 0.16, shadow: 0.42, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#F7F8F9", "#E2E5E8"], ["#DADDE0", "#C6CACE"], 0.08); glow(g, W / 2, hz * 0.55, W * 0.6, "rgba(255,255,255,0.75)"); } },
  { id: "st-cyc", tab: "studio", label: "라운드 호리존", reflect: 0.12, shadow: 0.38, draw: (g, W, H, hz) => { g.fillStyle = lin(g, 0, H, [[0, "#FFFFFF"], [0.55, "#EEF0F2"], [1, "#D3D7DB"]]); g.fillRect(0, 0, W, H); glow(g, W / 2, hz, W * 0.7, "rgba(255,255,255,0.8)"); } },
  { id: "st-grey", tab: "studio", label: "그레이 스튜디오", reflect: 0.12, shadow: 0.45, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#C9CDD1", "#A9AEB3"], ["#9DA2A7", "#80858A"], 0.14); glow(g, W / 2, hz * 0.4, W * 0.5, "rgba(255,255,255,0.35)"); } },
  { id: "st-warm", tab: "studio", label: "웜 스튜디오", reflect: 0.1, shadow: 0.4, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#F4EFE8", "#E3DACD"], ["#D8CDBE", "#C2B5A3"], 0.1); glow(g, W * 0.35, hz * 0.4, W * 0.5, "rgba(255,248,236,0.6)"); } },
  { id: "st-blue", tab: "studio", label: "블루 스튜디오", reflect: 0.14, shadow: 0.45, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#E9F0FB", "#C9D8F2"], ["#BFCBE0", "#A2B0C9"], 0.1); glow(g, W / 2, hz * 0.5, W * 0.55, "rgba(255,255,255,0.6)"); } },
  { id: "st-spot", tab: "studio", label: "스포트라이트", reflect: 0.2, shadow: 0.6, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#2A2D31", "#16181B"], ["#1E2023", "#0C0D0F"], 0.3); glow(g, W / 2, hz * 0.95, W * 0.45, "rgba(255,255,255,0.28)"); } },
  // 쇼룸
  { id: "sr-dark", tab: "showroom", label: "다크 쇼룸", reflect: 0.26, shadow: 0.7, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#33373C", "#1E2124"], ["#191B1E", "#0E0F11"], 0.35); for (let k = 0; k < 5; k++) { const cx = (W * (k + 0.5)) / 5; const l = g.createLinearGradient(cx - W * 0.03, 0, cx + W * 0.03, 0); l.addColorStop(0, "rgba(255,255,255,0)"); l.addColorStop(0.5, "rgba(255,255,255,0.16)"); l.addColorStop(1, "rgba(255,255,255,0)"); g.fillStyle = l; g.fillRect(cx - W * 0.03, 0, W * 0.06, hz); } } },
  { id: "sr-concrete", tab: "showroom", label: "콘크리트", reflect: 0.06, shadow: 0.42, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#A3A7AB", "#83878B"], ["#76797D", "#5E6165"], 0.12); grain(g, 0, 0, W, H, 0.05); } },
  { id: "sr-glass", tab: "showroom", label: "유리 전시장", reflect: 0.22, shadow: 0.45, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#DCE6EE", "#B9C7D3"], ["#C9CED3", "#A7ADB3"], 0.1); g.strokeStyle = "rgba(60,70,80,0.35)"; g.lineWidth = Math.max(2, W / 400); for (let k = 1; k < 6; k++) { g.beginPath(); g.moveTo((W * k) / 6, 0); g.lineTo((W * k) / 6, hz); g.stroke(); } g.beginPath(); g.moveTo(0, hz * 0.28); g.lineTo(W, hz * 0.28); g.stroke(); } },
  { id: "sr-wood", tab: "showroom", label: "우드 라운지", reflect: 0.12, shadow: 0.5, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#EDE7DF", "#D7CDBF"], ["#8C6A4C", "#6B4F37"], 0.2); g.strokeStyle = "rgba(40,25,10,0.25)"; g.lineWidth = Math.max(1, W / 700); for (let k = 0; k < 14; k++) { const y = hz + ((H - hz) * (k + 1)) / 15; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); } } },
  { id: "sr-led", tab: "showroom", label: "LED 천장", reflect: 0.24, shadow: 0.6, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#24272B", "#3A3E43"], ["#2A2D31", "#121315"], 0.3); g.fillStyle = "rgba(255,255,255,0.85)"; for (let k = 0; k < 7; k++) { g.fillRect(W * 0.08 + ((W * 0.84) * k) / 7, hz * 0.12, (W * 0.84) / 7 - W * 0.02, Math.max(2, H / 260)); } glow(g, W / 2, hz * 0.2, W * 0.6, "rgba(255,255,255,0.12)"); } },
  { id: "sr-white", tab: "showroom", label: "화이트 갤러리", reflect: 0.2, shadow: 0.4, draw: (g, W, H, hz) => { wallFloor(g, W, H, hz, ["#FFFFFF", "#EDEFF1"], ["#E6E8EA", "#D2D5D8"], 0.06); g.fillStyle = "rgba(0,0,0,0.05)"; g.fillRect(0, hz * 0.62, W, Math.max(2, H / 300)); } },
  // 야외
  { id: "od-dusk", tab: "outdoor", label: "노을 도로", reflect: 0.05, shadow: 0.55, draw: (g, W, H, hz) => { g.fillStyle = lin(g, 0, hz, [[0, "#2B3A67"], [0.55, "#C9748A"], [1, "#F3B27A"]]); g.fillRect(0, 0, W, hz); g.fillStyle = "#2F3236"; g.beginPath(); g.moveTo(0, hz); for (let k = 0; k <= 12; k++) g.lineTo((W * k) / 12, hz - H * (0.03 + 0.04 * Math.abs(Math.sin(k * 1.7)))); g.lineTo(W, hz); g.fill(); g.fillStyle = lin(g, hz, H, [[0, "#4A4D52"], [1, "#2A2C2F"]]); g.fillRect(0, hz, W, H - hz); grain(g, 0, hz, W, H - hz, 0.08, 3); } },
  { id: "od-day", tab: "outdoor", label: "맑은 날 광장", reflect: 0.04, shadow: 0.5, draw: (g, W, H, hz) => { g.fillStyle = lin(g, 0, hz, [[0, "#6FA3E0"], [1, "#D8E8F7"]]); g.fillRect(0, 0, W, hz); g.fillStyle = lin(g, hz, H, [[0, "#BDBFC1"], [1, "#9A9C9F"]]); g.fillRect(0, hz, W, H - hz); grain(g, 0, hz, W, H - hz, 0.06, 11); } },
  { id: "od-city", tab: "outdoor", label: "도시 야경", reflect: 0.18, shadow: 0.65, draw: (g, W, H, hz) => { g.fillStyle = lin(g, 0, hz, [[0, "#0D1424"], [1, "#24304A"]]); g.fillRect(0, 0, W, hz); let s = 5; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let k = 0; k < 16; k++) { const bw = W / 16; const bh = hz * (0.25 + rnd() * 0.5); g.fillStyle = "#151C2C"; g.fillRect(k * bw, hz - bh, bw - 2, bh); g.fillStyle = "rgba(255,214,140,0.55)"; for (let j = 0; j < 12; j++) if (rnd() > 0.55) g.fillRect(k * bw + bw * 0.2 + (j % 3) * bw * 0.22, hz - bh + bh * 0.1 + Math.floor(j / 3) * bh * 0.18, bw * 0.1, bh * 0.06); } g.fillStyle = lin(g, hz, H, [[0, "#1F2228"], [1, "#0B0C0E"]]); g.fillRect(0, hz, W, H - hz); } },
  { id: "od-coast", tab: "outdoor", label: "해안 도로", reflect: 0.04, shadow: 0.5, draw: (g, W, H, hz) => { g.fillStyle = lin(g, 0, hz * 0.7, [[0, "#9CC8EA"], [1, "#E6F1F8"]]); g.fillRect(0, 0, W, hz * 0.7); g.fillStyle = lin(g, hz * 0.7, hz, [[0, "#3C7FA8"], [1, "#5C9DC0"]]); g.fillRect(0, hz * 0.7, W, hz * 0.3); g.fillStyle = lin(g, hz, H, [[0, "#C8C2B6"], [1, "#A49D90"]]); g.fillRect(0, hz, W, H - hz); } },
  { id: "od-forest", tab: "outdoor", label: "숲길", reflect: 0.03, shadow: 0.5, draw: (g, W, H, hz) => { g.fillStyle = lin(g, 0, hz, [[0, "#CFE3D2"], [1, "#7FA585"]]); g.fillRect(0, 0, W, hz); g.fillStyle = "#4E7556"; for (let k = 0; k < 18; k++) { const x = (W * k) / 17; const th = hz * (0.35 + 0.25 * Math.abs(Math.sin(k * 2.3))); g.beginPath(); g.moveTo(x - W * 0.04, hz); g.lineTo(x, hz - th); g.lineTo(x + W * 0.04, hz); g.fill(); } g.fillStyle = lin(g, hz, H, [[0, "#6C6F6B"], [1, "#4B4D4A"]]); g.fillRect(0, hz, W, H - hz); } },
  // 단색
  { id: "pl-white", tab: "plain", label: "흰색", reflect: 0, shadow: 0.35, draw: (g, W, H) => { g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, W, H); } },
  { id: "pl-light", tab: "plain", label: "연회색", reflect: 0, shadow: 0.38, draw: (g, W, H) => { g.fillStyle = "#EEEFF2"; g.fillRect(0, 0, W, H); } },
  { id: "pl-grey", tab: "plain", label: "회색", reflect: 0, shadow: 0.45, draw: (g, W, H) => { g.fillStyle = "#8E9399"; g.fillRect(0, 0, W, H); } },
  { id: "pl-black", tab: "plain", label: "검정", reflect: 0, shadow: 0.6, draw: (g, W, H) => { g.fillStyle = "#111214"; g.fillRect(0, 0, W, H); } },
  { id: "pl-blue", tab: "plain", label: "보배드림 블루", reflect: 0, shadow: 0.5, draw: (g, W, H) => { g.fillStyle = "#306BD9"; g.fillRect(0, 0, W, H); } },
  { id: "pl-none", tab: "plain", label: "투명(PNG)", reflect: 0, shadow: 0, draw: () => {} },
];
export const DEFAULT_BG = "st-white";

// 내 배경: 올린 사진(긴 변 1600 JPEG)을 이 브라우저에 최대 6장 보관
const MINE_KEY = "bbm-cs-mybg";
export type MineBg = { id: string; url: string; label: string };
const mineImgs = new Map<string, HTMLImageElement>();
export function readMine(): MineBg[] {
  try {
    return JSON.parse(localStorage.getItem(MINE_KEY) || "[]") as MineBg[];
  } catch {
    return [];
  }
}
export async function addMine(file: Blob): Promise<MineBg> {
  const u = URL.createObjectURL(file);
  try {
    const img = await loadImg(u);
    const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const c = document.createElement("canvas");
    c.width = Math.round(img.naturalWidth * k);
    c.height = Math.round(img.naturalHeight * k);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    const list = readMine();
    const item = { id: `mine-${Date.now().toString(36)}`, url: c.toDataURL("image/jpeg", 0.82), label: `내 배경 ${list.length + 1}` };
    const next = [item, ...list].slice(0, 6);
    try {
      localStorage.setItem(MINE_KEY, JSON.stringify(next));
    } catch {
      localStorage.setItem(MINE_KEY, JSON.stringify(next.slice(0, 2)));
    }
    return item;
  } finally {
    URL.revokeObjectURL(u);
  }
}
export function removeMine(id: string) {
  try {
    localStorage.setItem(MINE_KEY, JSON.stringify(readMine().filter((m) => m.id !== id)));
  } catch {
    // 무시
  }
}
export const loadImg = (src: string) =>
  new Promise<HTMLImageElement>((ok, no) => {
    const i = new Image();
    i.decoding = "async";
    i.onload = () => ok(i);
    i.onerror = () => no(new Error("그림을 열지 못했어요."));
    i.src = src;
  });
export async function ensureMine(id: string) {
  if (!id.startsWith("mine-") || mineImgs.has(id)) return;
  const m = readMine().find((x) => x.id === id);
  if (m) mineImgs.set(id, await loadImg(m.url));
}

export const bgMeta = (id: string) => BGS.find((b) => b.id === id);
/** 배경 그리기. 반사 · 그림자 세기를 돌려준다 */
export function drawBg(g: CanvasRenderingContext2D, W: number, H: number, horizon: number, id: string): { reflect: number; shadow: number } {
  const b = bgMeta(id);
  if (b) {
    b.draw(g, W, H, horizon);
    return { reflect: b.reflect, shadow: b.shadow };
  }
  const img = mineImgs.get(id);
  if (img) {
    const k = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    const w = img.naturalWidth * k;
    const h = img.naturalHeight * k;
    g.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  } else {
    g.fillStyle = "#EEEFF2";
    g.fillRect(0, 0, W, H);
  }
  return { reflect: 0, shadow: 0.4 };
}

/** 배경 고르기 칸에 쓰는 작은 미리보기(한 번 그려 두고 다시 씀) */
const thumbs = new Map<string, string>();
export function bgThumb(id: string) {
  if (id.startsWith("mine-")) return readMine().find((m) => m.id === id)?.url ?? "";
  const hit = thumbs.get(id);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = 240;
  c.height = 160;
  const g = c.getContext("2d")!;
  if (id === "pl-none") {
    for (let y = 0; y < 160; y += 16) for (let x = 0; x < 240; x += 16) { g.fillStyle = (x + y) % 32 ? "#E4E6E9" : "#FFFFFF"; g.fillRect(x, y, 16, 16); }
  } else drawBg(g, 240, 160, 160 * 0.6, id);
  const u = c.toDataURL("image/jpeg", 0.8);
  thumbs.set(id, u);
  return u;
}
