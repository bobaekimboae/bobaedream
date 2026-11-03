// 비디오 투어 부위(촬영 키트 nuxt-shootkit/data/shoot-items-kit.json video.tour 를 그대로 읽는다 — 단일 기준)
import kit from "@kitdata/shoot-items-kit.json";
import { sitePath } from "./site";
import type { TourKey } from "./types";

type Stage = { key: string; label: string; short: string; icon: string[] };
const stages = (kit as unknown as { video: { tour: { stages: Stage[] } } }).video.tour.stages;
const byKey = new Map(stages.map((s) => [s.key, s]));

export const chapterLabel = (k: TourKey) => byKey.get(k)?.label ?? k;
export const chapterShort = (k: TourKey) => byKey.get(k)?.short ?? k;
export const chapterIcon = (k: TourKey) => {
  const s = byKey.get(k);
  return s ? sitePath(...s.icon) : "";
};
