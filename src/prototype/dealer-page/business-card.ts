export type CardStyle = { theme: "blue" | "navy" | "white"; intro: string };
export type CardContact = { name: string; role: string; company: string; phone: string; address: string; photo: string };

export const defaultCardStyle: CardStyle = { theme: "blue", intro: "좋은 차와 좋은 인연을 연결합니다." };
export const cardThemes = { blue: { label: "보배 블루", background: "#306bd9", ink: "#ffffff" }, navy: { label: "클래식 네이비", background: "#14243d", ink: "#ffffff" }, white: { label: "심플 화이트", background: "#ffffff", ink: "#14243d" } } as const;

export function readCardStyle(hash: string): CardStyle {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const theme = params.get("theme");
  return { theme: theme === "navy" || theme === "white" ? theme : "blue", intro: (params.get("intro") ?? defaultCardStyle.intro).replace(/[\r\n\u0000-\u001f]/g, " ").slice(0, 60) };
}

// Shared cards carry their presentation in the fragment, so another device does not need the creator's local storage.
// Build a clean URL: never carry member state, listing filters, or an unrelated URL fragment into a shared card.
export function cardUrl(base: string, shop: string, emp: string, style: CardStyle): string {
  const url = new URL(base);
  url.search = new URLSearchParams({ profile: "dealer", shop, emp, card: "1" }).toString();
  url.hash = new URLSearchParams({ theme: style.theme, intro: style.intro }).toString();
  return url.href;
}

export function profileUrl(base: string, shop: string, emp: string): string {
  const url = new URL(cardUrl(base, shop, emp, defaultCardStyle));
  url.searchParams.delete("card");
  url.hash = "";
  return url.href;
}

const vEscape = (text: string) => text.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");

export function cardVcf(contact: CardContact, url: string): string {
  const lines = ["BEGIN:VCARD", "VERSION:3.0", `FN:${vEscape(contact.name)}`, `N:;${vEscape(contact.name)};;;`, `ORG:${vEscape(contact.company)}`, `TITLE:${vEscape(contact.role)}`];
  if (contact.phone) lines.push(`TEL;TYPE=WORK,VOICE:${contact.phone.replace(/[^+\d-]/g, "")}`);
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

export async function cardPng(contact: CardContact, style: CardStyle): Promise<Blob> {
  await document.fonts.ready;
  const canvas = document.createElement("canvas"); canvas.width = 1200; canvas.height = 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas unavailable");
  const palette = cardThemes[style.theme];
  ctx.fillStyle = palette.background; ctx.fillRect(0, 0, 1200, 720);
  ctx.fillStyle = palette.ink;
  const text = (value: string, x: number, y: number, size: number, width: number, weight = 500) => {
    ctx.font = `${weight} ${size}px "Pretendard Variable", Pretendard, sans-serif`;
    let output = value;
    while (ctx.measureText(output).width > width && output.length) output = output.slice(0, -1);
    ctx.fillText(output === value ? output : output.slice(0, -1) + "…", x, y);
  };
  text("보배드림", 72, 103, 32, 600, 750);
  text("DEALER BUSINESS CARD", 72, 144, 16, 600);
  text(contact.name, 72, 276, 66, 720, 750);
  text(`${contact.company} · ${contact.role}`, 72, 330, 27, 720);
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
  text(contact.phone || "판매자 페이지에서 상담하기", 72, 555, 34, 1056, 650);
  text(contact.address, 72, 610, 24, 1056);
  ctx.globalAlpha = .7; text("서울오토갤러리", 72, 668, 20, 1056);
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("PNG export failed")), "image/png"));
}
