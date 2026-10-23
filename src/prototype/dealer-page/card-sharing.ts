import { defaultCardStyle, readCardStyle, serializeCardStyle, type CardContact, type CardStyle } from "./business-card";

export const cardServiceOrigin = "https://bobaedream-dealer-card.bobaekim.chatgpt.site";
export type PublishedCard = { style: CardStyle; contact: CardContact; version: string; url: string };
export const cardIdentity = (shop: string, emp: string) => /^\d{1,12}$/.test(shop) && /^\d{1,12}$/.test(emp);

export function fixedCardUrl(shop: string, emp: string): string {
  if (!cardIdentity(shop, emp)) throw new Error("명함 판매자 정보가 올바르지 않아요.");
  return `${cardServiceOrigin}/c/${shop}/${emp}`;
}

// 카카오톡 미리보기(2026-10-23): 공유 주소는 og 태그가 있는 짧은 정적 페이지 c/<shop>-<emp>(scripts/dealer-card-og.mjs).
// 기본 꾸밈이면 # 뒤를 붙이지 않아 링크가 짧고, 꾸민 명함만 꾸밈 값을 # 뒤에 붙인다. 정적 페이지가 실제 명함 화면으로 넘긴다.
export function shortCardUrl(base: string, shop: string, emp: string, style: CardStyle): string {
  const url = new URL(`c/${encodeURIComponent(shop)}-${encodeURIComponent(emp)}`, new URL(".", base));
  const styled = serializeCardStyle(style);
  if (styled !== serializeCardStyle(defaultCardStyle)) url.hash = styled;
  return url.href;
}

export function sharingUrl(base: string, shop: string, emp: string, style: CardStyle, published: PublishedCard | null) {
  return published && serializeCardStyle(style) === serializeCardStyle(published.style)
    ? fixedCardUrl(shop, emp) : shortCardUrl(base, shop, emp, style);
}

export async function fetchPublishedCard(shop: string, emp: string, signal?: AbortSignal): Promise<PublishedCard | null> {
  if (!cardIdentity(shop, emp)) return null;
  const response = await fetch(`${cardServiceOrigin}/api/cards/${shop}/${emp}`, { signal, cache: "no-store", credentials: "omit" });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("명함 서버에 연결하지 못했어요.");
  const data = await response.json();
  if (!data || typeof data.version !== "string" || typeof data.style !== "string" || !data.contact || typeof data.contact.name !== "string") throw new Error("명함 정보를 불러오지 못했어요.");
  return { ...data, style: readCardStyle(data.style), url: fixedCardUrl(shop, emp) };
}

export function publishingUrl(shop: string, emp: string, contact: CardContact, style: CardStyle) {
  fixedCardUrl(shop, emp);
  const url = new URL("/publish", cardServiceOrigin);
  url.search = new URLSearchParams({ shop, emp }).toString();
  // Drafts stay in the fragment until the signed-in administrator explicitly saves them.
  url.hash = new URLSearchParams({ draft: JSON.stringify({ contact: { ...contact, photo: new URL(contact.photo, window.location.href).href }, style: serializeCardStyle(style) }) }).toString();
  return url.href;
}

export async function cardQr(url: string): Promise<string> {
  if (url.length > 900) throw new Error("로고가 포함된 긴 명함은 고정 주소에 저장한 뒤 QR을 만들어 주세요.");
  const { default: QRCode } = await import("qrcode");
  return QRCode.toDataURL(url, { errorCorrectionLevel: "M", margin: 4, width: 768, color: { dark: "#14243d", light: "#ffffff" } });
}
