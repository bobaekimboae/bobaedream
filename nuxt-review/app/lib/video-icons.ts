// 영상 올리기(동처띠 视频发布 재현)에서 쓰는 아이콘. 원본 파일(레딧 · 초톳)은 고치지 않고 mask로 색만 입힌다.
import { icon } from "./site";

const rd = (n: string) => icon("reddit-shoot", `${n}.svg`);
const ct = (n: string) => icon("chotot", n);

export const VI = {
  back: rd("back-outline-24"),
  close: rd("close-outline"),
  camera: rd("camera-outline-24"),
  video: rd("video-camera-outline"),
  mic: rd("microphone-outline"),
  flip: rd("refresh-outline"),
  play: rd("play-fill"),
  check: rd("checkmark-fill"),
  speed: rd("powerup-outline"),
  filter: rd("sticker-outline"),
  effect: rd("spoiler-outline"),
  plate: rd("mask-outline"),
  volume: rd("tap-outline"),
  caption: rd("edit-outline"),
  cover: rd("image-post-outline"),
  prop: rd("view-grid-outline"),
  upload: rd("image-post-outline"),
  undo: rd("undo-outline"),
  del: rd("delete-outline"),
  add: rd("add-outline-24"),
  timer: ct("chotot-common-clock.svg"),
};
