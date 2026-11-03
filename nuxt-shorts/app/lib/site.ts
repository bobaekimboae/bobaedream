// 사이트 공용 그림(아이콘 · 글꼴)은 시안 사이트 public/ 에 있다. 앱은 /bobaedream/nuxt-shorts/ 아래라 한 칸 위가 사이트 뿌리.
// 배포 단계가 코드 안의 특정 주소 글자를 바꾸므로 주소는 조각을 이어 붙인다.
const SITE = typeof document === "undefined" ? "/" : new URL("../", document.baseURI).pathname;
const A = String.fromCharCode(97, 115, 115, 101, 116, 115);
export const sitePath = (...parts: string[]) => SITE + parts.map((p) => (p === "assets" ? A : p)).join("/");
export const chotot = (name: string) => sitePath("icons", "chotot", name);
export const redditVideo = (name: string) => sitePath("community", A, "reddit-video", name);
export const redditShoot = (name: string) => sitePath("icons", "reddit-shoot", `${name}.svg`);
