// 사진 편집기 아이콘: 레딧 · 초톳 원본 파일을 그대로 쓴다(색은 mask)
import { icon } from "./site";

const rd = (n: string) => icon("reddit-shoot", `${n}.svg`);
const ct = (n: string) => icon("chotot", n);
const ab = (n: string) => icon("airbnb", `${n}.svg`);

export const EIC = {
  back: rd("back-outline-24"),
  close: rd("close-outline"),
  check: rd("checkmark-fill"),
  pen: rd("edit-outline"),
  crop: rd("crop-outline"),
  rotate: rd("rotate-image-outline"),
  sticker: rd("sticker-outline"),
  text: rd("rich-text-outline"),
  tpl: rd("view-grid-outline"),
  mosaic: rd("mask-outline"),
  filter: ab("art-easel"),
  undo: rd("undo-outline"),
  add: rd("add-outline-24"),
  ai: ct("chotot-listing-register-ai.svg"),
  chevron: ct("chotot-listing-register-dropdown.svg"),
};
