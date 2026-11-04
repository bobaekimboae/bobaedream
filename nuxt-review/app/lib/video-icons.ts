// 영상 올리기(동처띠 视频发布 재현)에서 쓰는 아이콘. 원본 파일(레딧 · 초톳)은 고치지 않고 mask로 색만 입힌다.
import { icon } from "./site";

const rd = (n: string) => icon("reddit-shoot", `${n}.svg`);
const ct = (n: string) => icon("chotot", n);
const ab = (n: string) => icon("airbnb", `${n}.svg`);

export const VI = {
  back: rd("back-outline-24"),
  close: rd("close-outline"),
  camera: rd("camera-outline-24"),
  video: rd("video-camera-outline"),
  mic: rd("microphone-outline"),
  flip: rd("refresh-outline"),
  play: rd("play-fill"),
  pause: rd("pause-fill"),
  edit: rd("edit-outline"),
  check: rd("checkmark-fill"),
  speed: rd("powerup-outline"),
  filter: ab("art-easel"),
  effect: ab("sparkle"),
  plate: rd("mask-outline"),
  volume: ab("sound-system"),
  caption: rd("closed-captioning-outline"),
  cover: rd("image-post-outline"),
  prop: rd("view-grid-outline"),
  upload: rd("image-post-outline"),
  undo: rd("undo-outline"),
  del: rd("delete-outline"),
  add: rd("add-outline-24"),
  timer: rd("history-outline"),
};
