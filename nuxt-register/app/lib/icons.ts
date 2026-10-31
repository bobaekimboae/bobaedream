// 아이콘은 노션 아이콘 DB 원본(초톳 · 레딧 · 오토스카우트24)을 사이트 공용 폴더에서 그대로 쓴다. 파일은 고치지 않고 색만 mask로 입힌다.
import { icon } from "@kit/site";

const ct = (n: string) => icon("chotot", n);
const rd = (n: string) => icon("reddit-shoot", `${n}.svg`);

export const IC = {
  back: rd("back-outline-24"),
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
  check: ct("chotot-listing-register-check-mark.svg"),
  ai: ct("chotot-listing-register-ai.svg"),
  edit: rd("edit-outline"),
  camera: rd("camera-outline-24"),
  video: rd("video-camera-outline"),
  album: rd("image-post-outline"),
  play: rd("play-fill"),
  coupon: ct("chotot-my-benefit-promotion-chotot-offer-01.svg"),
  premium: ct("chotot-my-paid-service-pro-plan-02.svg"),
  location: ct("chotot-common-location-pin.svg"),
  clock: ct("chotot-common-clock.svg"),
  user: ct("chotot-common-user.svg"),
};
