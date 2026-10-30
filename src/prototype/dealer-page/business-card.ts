export type CardField = "mobile" | "instagram" | "youtube" | "tiktok";
export type CardStyle = { theme: "blue" | "navy" | "white"; intro: string; title: string; logo: string; gallery?: string; company?: string; fields: Partial<Record<CardField, string>> };
// 명함 화면에만 쓰는 판매자페이지 값(공유 링크·서버에는 저장하지 않는다). 숫자는 판매자페이지와 같은 값.
export type CardExtras = {
  rating?: number; reviewCount?: number; sold?: number;
  listings?: { id: number; title: string; image: string; price: string; href: string }[];
  categories?: { label: import("./dealer-stock").StockCategory; count: number }[];
  sns?: { instagram?: string; youtube?: string };
  reels?: { href: string; poster?: string; label?: string }[];
};
export type CardContact = { name: string; role: string; company: string; gallery?: string; phone: string; address: string; photo: string; listingCount?: number; safe?: boolean };

// 050 안심번호(2026-10-22 「050 번호」 → 「안심번호로 표시」): 딜러 연락처는 실제 번호 대신 0507 안심번호로 보인다.
// 시안 단계라 번호는 딜러별로 정한 예시 값이고 실제로 걸리지 않게 tel: 링크를 만들지 않는다(실서비스는 서버가 발급).
export function safePhoneFor(seedText: string): string {
  const seed = [...seedText].reduce((sum, ch) => (sum * 131 + ch.charCodeAt(0)) % 9999991, 17);
  const mid = String(seed % 1000).padStart(3, "0");
  const tail = String(Math.floor(seed / 1000) % 10000).padStart(4, "0");
  return `0507-1${mid}-${tail}`;
}
export const safePhoneNote = (phone: string) => `안심번호 ${phone}로 딜러에게 연결돼요. 시안 화면이라 실제로 전화가 걸리지는 않아요.`;

export const defaultCardStyle: CardStyle = { theme: "blue", intro: "좋은 차와 좋은 인연을 연결합니다.", title: "", logo: "", fields: {} };
export const cardThemes = { blue: { label: "블루", background: "#306bd9", ink: "#ffffff" }, navy: { label: "클래식 네이비", background: "#14243d", ink: "#ffffff" }, white: { label: "심플 화이트", background: "#ffffff", ink: "#14243d" } } as const;
export const cardFields: { id: CardField; label: string; placeholder: string }[] = [
  { id: "mobile", label: "휴대폰 번호", placeholder: "010-1234-5678" },
  { id: "instagram", label: "인스타그램", placeholder: "@아이디 또는 인스타그램 주소" },
  { id: "youtube", label: "유튜브", placeholder: "@채널 아이디 또는 유튜브 주소" },
  { id: "tiktok", label: "틱톡", placeholder: "@아이디 또는 틱톡 주소" },
];
const clean = (value: string, max: number) => value.replace(/[\r\n\u0000-\u001f]/g, " ").slice(0, max);
const safeLogo = (value: string) => value.length <= 5000 && /^data:image\/(?:png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : "";

export function cardFieldHref(field: CardField, value = ""): string | null {
  const input = value.trim();
  if (!input) return null;
  if (field === "mobile") {
    if (!/^\+?[\d() -]+$/.test(input)) return null;
    const phone = input.replace(/[^+\d]/g, "");
    return /^\+?\d{8,15}$/.test(phone) ? `tel:${phone}` : null;
  }
  const domains = { instagram: ["instagram.com", "www.instagram.com"], youtube: ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"], tiktok: ["tiktok.com", "www.tiktok.com", "vm.tiktok.com", "vt.tiktok.com"] };
  const origin = { instagram: "https://www.instagram.com/", youtube: "https://www.youtube.com/@", tiktok: "https://www.tiktok.com/@" };
  if (/^@?[\p{L}\p{N}_.-]{1,60}$/u.test(input) && !input.includes(".com") && !input.includes("youtu.be")) return origin[field] + encodeURIComponent(input.replace(/^@/, ""));
  try {
    const url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`);
    return url.protocol === "https:" && !url.username && !url.password && !url.port && domains[field].includes(url.hostname) ? url.href : null;
  } catch { return null; }
}

export function serializeCardStyle(style: CardStyle): string {
  const params = new URLSearchParams({ theme: style.theme, intro: style.intro });
  if (style.title) params.set("title", clean(style.title, 30));
  for (const id of ["gallery", "company"] as const) if (style[id] !== undefined) params.set(id, clean(style[id]!, 80));
  if (safeLogo(style.logo)) params.set("logo", style.logo);
  for (const { id } of cardFields) if (style.fields[id] !== undefined) params.set(id, clean(style.fields[id]!, id === "mobile" ? 30 : 180));
  return params.toString();
}

export function readCardStyle(hash: string): CardStyle {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const theme = params.get("theme");
  const fields: CardStyle["fields"] = {};
  for (const { id } of cardFields) if (params.has(id)) fields[id] = clean(params.get(id) ?? "", id === "mobile" ? 30 : 180);
  const affiliation: Pick<CardStyle, "gallery" | "company"> = {};
  for (const id of ["gallery", "company"] as const) if (params.has(id)) affiliation[id] = clean(params.get(id) ?? "", 80);
  return { theme: theme === "navy" || theme === "white" ? theme : "blue", intro: clean(params.get("intro") ?? defaultCardStyle.intro, 60), title: clean(params.get("title") ?? "", 30), logo: safeLogo(params.get("logo") ?? ""), ...affiliation, fields };
}

// Missing affiliation stays absent; never assign a different dealer's complex.
export function cardContact(contact: CardContact, style: CardStyle): CardContact {
  return { ...contact, gallery: clean(style.gallery ?? contact.gallery ?? "", 80).trim(), company: clean(style.company ?? contact.company, 80).trim() };
}

export const cardCompanyName = (company: string) => company.replace(/\(주\)|\(유\)|주식회사/g, "").trim();

// Shared cards carry their presentation in the fragment, so another device does not need the creator's local storage.
// Build a clean URL: never carry member state, listing filters, or an unrelated URL fragment into a shared card.
export function cardUrl(base: string, shop: string, emp: string, style: CardStyle): string {
  const url = new URL(base);
  url.search = new URLSearchParams({ profile: "dealer", shop, emp, card: "1" }).toString();
  url.hash = serializeCardStyle(style);
  return url.href;
}

export function profileUrl(base: string, shop: string, emp: string): string {
  const url = new URL(cardUrl(base, shop, emp, defaultCardStyle));
  url.searchParams.delete("card");
  url.hash = "";
  return url.href;
}

const vEscape = (text: string) => text.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");

export function cardVcf(contact: CardContact, url: string, style: CardStyle = defaultCardStyle): string {
  contact = cardContact(contact, style);
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${vEscape(contact.name)}`, `N:;${vEscape(contact.name)};;;`, `ORG:${vEscape(contact.company)}`, `TITLE:${vEscape(contact.role)}`];
  if (contact.gallery) lines.push(`X-DEALER-COMPLEX:${vEscape(contact.gallery)}`);
  if (contact.phone) lines.push(`TEL;TYPE=WORK,VOICE:${contact.phone.replace(/[^+\d-]/g, "")}`);
  const mobile = cardFieldHref("mobile", style.fields.mobile);
  if (mobile) lines.push(`TEL;TYPE=CELL,VOICE:${mobile.slice(4)}`);
  for (const { id } of cardFields) {
    const href = cardFieldHref(id, style.fields[id]);
    if (id !== "mobile" && href) lines.push(`X-SOCIALPROFILE;TYPE=${id}:${vEscape(href)}`);
  }
  lines.push(`ADR;TYPE=WORK:;;${vEscape(contact.address)};;;;`, `URL:${url}`, "END:VCARD");
  // vCard 3.0 folds physical lines at 75 UTF-8 bytes without cutting a Korean character.
  return lines.map((line) => {
    const parts: string[] = []; let part = ""; let length = 0;
    for (const char of line) {
      const bytes = new TextEncoder().encode(char).length;
      if (length + bytes > 75) { parts.push(part); part = " "; length = 1; }
      part += char; length += bytes;
    }
    parts.push(part); return parts.join("\r\n");
  }).join("\r\n") + "\r\n";
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url; anchor.download = filename;
  document.body.append(anchor); anchor.click(); anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function loadCardLogo(file: File): Promise<string> {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) throw new Error("PNG·JPG·WebP 파일을 2MB 이하로 선택해 주세요.");
  const source = URL.createObjectURL(file);
  try {
    const img = new Image(); img.src = source; await img.decode();
    const canvas = document.createElement("canvas"); canvas.width = 80; canvas.height = 80;
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("로고를 불러올 수 없어요.");
    const ratio = Math.min(80 / img.width, 80 / img.height);
    ctx.drawImage(img, (80 - img.width * ratio) / 2, (80 - img.height * ratio) / 2, img.width * ratio, img.height * ratio);
    const data = canvas.toDataURL("image/webp", .65);
    if (!safeLogo(data)) throw new Error("단순한 로고 이미지를 선택해 주세요.");
    return data;
  } finally { URL.revokeObjectURL(source); }
}

export async function cardPng(contact: CardContact, style: CardStyle): Promise<Blob> {
  contact = cardContact(contact, style);
  await document.fonts.ready;
  const socials = cardFields.filter(({ id }) => id !== "mobile" && cardFieldHref(id, style.fields[id]));
  const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 720 + socials.length * 72;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  const palette = cardThemes[style.theme];
  ctx.fillStyle = palette.background; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = palette.ink;
  const text = (value: string, x: number, y: number, size: number, width: number, weight = 500, edge: "baseline" | "top" | "bottom" = "baseline") => {
    ctx.font = `${weight} ${size}px "Pretendard Variable", Pretendard, sans-serif`;
    let output = value;
    while (ctx.measureText(output).width > width && output.length) output = output.slice(0, -1);
    const visible = output === value ? output : output.slice(0, -1) + "…";
    const metrics = ctx.measureText(visible);
    ctx.fillText(visible, x, edge === "top" ? y + metrics.actualBoundingBoxAscent : edge === "bottom" ? y - metrics.actualBoundingBoxDescent : y);
  };
  const company = cardCompanyName(contact.company);
  const title = style.title.trim() || company;
  // Affiliation first, then the company title; the portrait spans the full identity block.
  ctx.globalAlpha = .8;
  text(contact.gallery ?? "", 72, 84, 24, 720, 500, "top");
  ctx.globalAlpha = 1;
  text(title, style.logo ? 156 : 72, 132, 32, style.logo ? 650 : 720, 750, "top");
  if (style.logo) {
    const logo = new Image(); logo.src = style.logo;
    try { await logo.decode(); ctx.drawImage(logo, 72, 132, 64, 64); } catch { /* Optional logo cannot block export. */ }
  }
  if (title.replace(/\s/g, "") !== company.replace(/\s/g, "")) text(company, 72, 196, 26, 720, 600, "top");
  text(contact.name, 72, 286, 66, 720, 750);
  text(contact.role, 72, 340, 27, 720, 500, "bottom");
  // Portrait failures must not prevent exporting the contact card.
  try {
    const img = new Image(); img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => reject(new Error("portrait timeout")), 8000);
      img.onload = () => { window.clearTimeout(timeout); resolve(); };
      img.onerror = () => { window.clearTimeout(timeout); reject(new Error("portrait unavailable")); };
      img.src = contact.photo;
    });
    ctx.save(); ctx.beginPath(); ctx.roundRect(916, 84, 212, 256, 18); ctx.clip();
    ctx.fillStyle = "#edf1f7"; ctx.fillRect(916, 84, 212, 256);
    const ratio = Math.max(212 / img.width, 256 / img.height);
    ctx.drawImage(img, 916 + (212 - img.width * ratio) / 2, 84, img.width * ratio, img.height * ratio);
    ctx.restore();
  } catch { /* Export without the optional portrait. */ }
  ctx.fillStyle = palette.ink;
  ctx.globalAlpha = .85;
  // Two lines keep Korean and long introductions inside the exported card.
  ctx.font = '500 26px "Pretendard Variable", Pretendard, sans-serif';
  let line = ""; let row = 0;
  for (const char of style.intro) {
    if (ctx.measureText(line + char).width > 1056) { ctx.fillText(line, 72, 408 + row * 36); line = ""; row++; }
    line += char;
  }
  if (line) ctx.fillText(line, 72, 408 + row * 36);
  ctx.globalAlpha = .25; ctx.fillRect(72, 488, 1056, 1); ctx.globalAlpha = 1;
  text(cardFieldHref("mobile", style.fields.mobile) ? style.fields.mobile! : contact.phone, 72, 555, 34, 1056, 650);
  text(contact.address, 72, 610, 24, 1056);
  ctx.globalAlpha = 1;
  socials.forEach(({ id, label }, index) => text(`${label}   ${cardFieldHref(id, style.fields[id])}`, 72, 748 + index * 72, 24, 1056));
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png"));
}
