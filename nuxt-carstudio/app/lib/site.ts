// 시안 사이트 맨 위 주소(/bobaedream/). 이 앱은 그 아래 nuxt-carstudio/에 놓인다.
// 아이콘은 사이트 공용 원본(오토스카우트24 · 레딧 · 초톳)을 그대로 쓴다. 배포 단계가 에셋 경로 글자를 바꾸므로 조각으로 잇는다.
export const SITE_BASE = typeof document === "undefined" ? "/bobaedream/" : new URL("../", document.baseURI).pathname;
export const sitePath = (...parts: string[]) => SITE_BASE + parts.join("/");
/** 레딧 원본(public/icons/reddit-shoot) */
export const rd = (n: string) => sitePath("icons", "reddit-shoot", `${n}.svg`);
/** 초톳 원본(public/icons/chotot) */
export const ct = (n: string) => sitePath("icons", "chotot", `${n}.svg`);
/** 오토스카우트24 원본(public/icons/dealer-profile) */
export const as = (n: string) => sitePath("icons", "dealer-profile", `${n}.svg`);
export const query = () => (typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search));

export const I = {
  back: rd("back-outline-24"),
  close: rd("close-outline"),
  add: rd("add-outline-24"),
  image: rd("image-post-outline"),
  camera: rd("camera-outline-24"),
  edit: rd("edit-outline"),
  del: rd("delete-outline"),
  undo: rd("undo-outline"),
  refresh: rd("refresh-outline"),
  aspect: rd("aspect-ratio-outline"),
  rotate: rd("rotate-image-outline"),
  mask: rd("mask-outline"),
  play: rd("play-fill"),
  video: rd("video-camera-outline"),
  grid: rd("view-grid-outline"),
  help: rd("help-outline"),
  check: rd("checkmark-fill"),
  caret: rd("caret-down-fill"),
  sticker: rd("sticker-outline"),
  spark: rd("powerup-fill"),
  forward: rd("forward-outline"),
  download: rd("download-outline"),
  upload: rd("upload-outline"),
  settings2: rd("settings-outline"),
  history: rd("history-outline"),
  save2: rd("save-outline"),
  language: rd("language-outline"),
  bag: ct("chotot-common-bag"),
  user: ct("chotot-common-user"),
  bell: ct("chotot-common-notification"),
  settings: ct("chotot-common-settings"),
  share: ct("chotot-common-share"),
  copy: ct("chotot-common-copy"),
  info: ct("chotot-common-info"),
  more: ct("chotot-common-more"),
  clock: ct("chotot-common-clock"),
  search: ct("chotot-common-search"),
  menu: ct("chotot-common-menu"),
  logout: ct("chotot-common-logout"),
  save: ct("chotot-pc-detail-save"),
  prev: ct("chotot-pc-detail-chevron-left-white-bg"),
  next: ct("chotot-pc-detail-chevron-right-white-bg"),
  chevDown: ct("chotot-pc-detail-chevron-down-white-bg"),
  ai: ct("chotot-listing-register-ai"),
  report: ct("chotot-common-report"),
  support: ct("chotot-common-customer-support"),
  calendar: as("calendar-as24"),
  car: as("car-sale-as24"),
  doc: as("document-as24"),
  phone: as("phone-as24"),
  outlink: as("outlink-as24"),
  person: as("person-as24"),
  instagram: as("instagram"),
  tiktok: as("tiktok"),
  youtube: as("youtube"),
  facebook: as("facebook"),
};
