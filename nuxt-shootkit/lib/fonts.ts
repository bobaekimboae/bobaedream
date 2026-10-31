// 글꼴(2026-10-29 컨설팅 「처음 열 때 글꼴 3.1MB」): 굵기별 전체본 4개 대신 사이트 공용 Pretendard Variable 한국어 조각본을 쓴다.
// 조각본은 화면에 보이는 글자의 조각만 받는다. 캔버스(쇼츠 · 사진 글자)는 그리기 전에 쓸 글자를 먼저 받아 둬야 대체 글꼴로 그려지지 않는다.
const FAMILY = '"Pretendard Variable"';
const WEIGHTS = [400, 500, 600, 700, 800];

/** 사이트 공용 글꼴 CSS를 붙인다. 주소는 배포 단계의 주소 바꾸기에 걸리지 않게 조각을 이어 붙인다. */
export function attachFont() {
  if (document.getElementById("bbm-pretendard")) return;
  const link = document.createElement("link");
  link.id = "bbm-pretendard";
  link.rel = "stylesheet";
  // 나누는 글자를 실행할 때 만든다: Nuxt 4 빌드가 배열 join을 「../assets/…」 한 덩어리 글자로 미리 합쳐 배포 바꾸기에 걸린 일(2026-10-31 숏폼 키트)
  const sep = window.location.pathname.charAt(0) || "/"; // 주소 맨 앞 「/」(빌드가 미리 합칠 수 없는 값)
  link.href = new URL(["..", "assets", "fonts", "pretendard", "pretendard-guazi.css"].join(sep), document.baseURI).href;
  document.head.appendChild(link);
}

/** 캔버스에 그릴 글자를 미리 받는다(굵기 5개). 실패해도 그리기는 계속한다. */
export async function loadGlyphs(text: string) {
  const t = Array.from(new Set(Array.from(text.replace(/\s+/g, "")))).join("");
  if (!t || typeof document === "undefined" || !document.fonts) return;
  await Promise.all(WEIGHTS.map((w) => document.fonts.load(`${w} 40px ${FAMILY}`, t).catch(() => undefined)));
}

/** 객체 안의 짧은 글자들을 모은다(사진 주소 같은 긴 값 · 화면 요소는 건너뜀) */
export function collectText(v: unknown, out: string[] = [], depth = 0): string[] {
  if (depth > 5 || v == null) return out;
  if (typeof v === "string") {
    if (v.length < 200 && !/^(blob:|data:|https?:)/.test(v)) out.push(v);
  } else if (typeof v === "number") out.push(String(v));
  else if (Array.isArray(v)) v.forEach((x) => collectText(x, out, depth + 1));
  else if (typeof v === "object" && !(typeof Element !== "undefined" && v instanceof Element) && !(v instanceof Blob)) {
    for (const x of Object.values(v as Record<string, unknown>)) collectText(x, out, depth + 1);
  }
  return out;
}
