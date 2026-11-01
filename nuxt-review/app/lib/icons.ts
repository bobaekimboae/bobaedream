// 아이콘은 노션 아이콘 DB 원본(초톳 · 레딧)을 사이트 공용 폴더에서 그대로 쓴다. 파일은 고치지 않고 색만 mask로 입힌다.
import { asset, icon } from "./site";

const ct = (n: string) => icon("chotot", n);
const rd = (n: string) => icon("reddit-shoot", `${n}.svg`);

export const IC = {
  back: rd("back-fill"),
  close: ct("chotot-listing-register-close-window.svg"),
  search: ct("chotot-common-search.svg"),
  share: ct("chotot-common-share.svg"),
  comment: ct("chotot-list-detail-listing-comment.svg"),
  like: ct("chotot-common-like.svg"),
  dislike: ct("chotot-common-dislike.svg"),
  star: ct("chotot-common-review-star-selected.svg"),
  bookmark: ct("chotot-common-bookmark.svg"),
  bookmarkOn: ct("chotot-common-bookmark-filled.svg"),
  info: ct("chotot-listing-register-info.svg"),
  infoLine: ct("chotot-common-info.svg"),
  chevron: ct("chotot-listing-register-dropdown.svg"),
  caret: ct("chotot-listing-register-caret-down.svg"),
  check: ct("chotot-listing-register-check-mark.svg"),
  image: ct("chotot-common-image-attach-gray.svg"),
  sticker: rd("sticker-outline"),
  edit: rd("edit-outline"),
  add: rd("add-outline-24"),
  help: rd("help-outline"),
  switch: ct("chotot-common-sort.svg"),
  location: ct("chotot-common-location-pin.svg"),
  remove: ct("chotot-listing-register-image-upload-delete.svg"),
  clear: ct("chotot-listing-register-clear-text-delete-field-icon.svg"),
  more: ct("chotot-common-more.svg"),
  verified: ct("chotot-list-detail-verified-check-circle.svg"),
  odometer: ct("chotot-common-clock.svg"),
  /** 차량 연결: 보배드림 내비 아이콘(중고차) */
  car: asset("bbm/nav-icons/used-car.svg"),
};
