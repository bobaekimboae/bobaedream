// 시안 사이트 맨 위 주소(/bobaedream/). 이 앱은 그 아래 nuxt-shortform/에 놓인다.
// 아이콘은 사이트 공용 원본(오토스카우트24 · 레딧 · 초톳)을 그대로 쓴다. 배포 단계가 에셋 경로 글자를 바꾸므로 조각으로 잇는다.
export const SITE_BASE = typeof document === "undefined" ? "/bobaedream/" : new URL("../", document.baseURI).pathname;
export const sitePath = (...parts: string[]) => SITE_BASE + parts.join("/");
/** 레딧 원본(public/icons/reddit-shoot) */
export const rd = (n: string) => sitePath("icons", "reddit-shoot", `${n}.svg`);
/** 초톳 원본(public/icons/chotot) */
export const ct = (n: string) => sitePath("icons", "chotot", `${n}.svg`);
/** 오토스카우트24 · SNS 원본(public/icons/dealer-profile) */
export const as = (n: string) => sitePath("icons", "dealer-profile", `${n}.svg`);
export const query = () => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search));
