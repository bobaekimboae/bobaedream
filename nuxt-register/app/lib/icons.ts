// 아이콘은 노션 아이콘 DB 원본(초톳 · 레딧 · 오토스카우트24)을 사이트 공용 폴더에서 그대로 쓴다. 파일은 고치지 않고 색만 mask로 입힌다.
import { icon } from "@kit/site";

const ct = (n: string) => icon("chotot", n);
const rd = (n: string) => icon("reddit-shoot", `${n}.svg`);

export const IC = {
  /** 초톳 머리 뒤로 화살표(굵은 화살표 · 잉크 11.7) 대신 레딧 원본 back-fill */
  back: rd("back-fill"),
  close: ct("chotot-listing-register-close-window.svg"),
  info: ct("chotot-listing-register-info.svg"),
  /** 초톳 사진·영상 추가 원본(노랑 PNG) — 투명 부분이 그대로라 mask로 파랑만 입힌다 */
  media: ct("chotot-listing-register-upload-media.png"),
  remove: ct("chotot-listing-register-image-upload-delete.svg"),
  clear: ct("chotot-listing-register-clear-text-delete-field-icon.svg"),
  caret: ct("chotot-listing-register-caret-down.svg"),
  /** 셰브론 아래 원본을 -90°로 돌려 오른쪽 화살표로 쓴다(파일은 그대로) */
  chevron: ct("chotot-listing-register-dropdown.svg"),
  detail: ct("chotot-listing-register-detail-info.svg"),
  search: ct("chotot-listing-register-search-gray.svg"),
  searchDark: ct("chotot-listing-register-search.svg"),
  check: ct("chotot-listing-register-check-mark.svg"),
  ai: ct("chotot-listing-register-ai.svg"),
  /** 초톳 숫자 칸 「연필 + 밑줄」 원본 */
  edit: ct("chotot-common-seller-review-write.svg"),
  camera: rd("camera-outline-24"),
  video: rd("video-camera-outline"),
  album: rd("image-post-outline"),
  play: rd("play-fill"),
  coupon: ct("chotot-my-benefit-promotion-chotot-offer-01.svg"),
  premium: ct("chotot-my-paid-service-pro-plan-02.svg"),
  location: ct("chotot-common-location-pin.svg"),
  /** 초톳 「Địa chỉ mới…」 안내 상자의 채운 핀 */
  pin: ct("chotot-list-detail-address-location.svg"),
  clock: ct("chotot-common-clock.svg"),
  user: ct("chotot-common-user.svg"),
  /** PC 머리(초톳 PC 「Đăng tin」 머리와 같은 원본 — 경로 대조 2026-11-01) */
  menu: ct("chotot-common-menu.svg"),
  heart: ct("chotot-common-favorite.svg"),
  /** 머리 지역 알약의 핀(초톳 PC 머리와 같은 경로) */
  pinHead: ct("chotot-list-detail-svgexport-25_2.svg"),
  bell: ct("chotot-common-notification.svg"),
  chat: ct("chotot-list-detail-chat.svg"),
  /** 셰브론 아래 원본(돌리지 않음) */
  dropdown: ct("chotot-listing-register-dropdown.svg"),
};
