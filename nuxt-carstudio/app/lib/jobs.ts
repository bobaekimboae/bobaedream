// 영상 만들기 작업. 화면을 떠나도(「내 영상으로 돌아가기」) 이 기기에서 계속 만든다.
import { reactive } from "vue";
import { buildPlan, exportMp4, lineTimes, planSeconds, posterOf } from "./render";
import { saveVideo, state, uid } from "./store";
import type { Details, Options, VideoItem } from "./types";

export const stage = reactive({ id: "", step: 0, ratio: 0 });
export const STEPS = ["사진을 확인하는 중…", "대본을 쓰는 중…", "장면을 편집하는 중…", "영상을 만드는 중…"];

export function titleOf(d: Details) {
  return [d.make, d.model].map((x) => x.trim()).filter(Boolean).join(" ");
}

export async function startVideo(d: Details, o: Options, photos: Blob[], projectId?: string): Promise<string> {
  const id = uid();
  const item: VideoItem = { id, createdAt: Date.now(), title: titleOf(d), details: { ...d }, options: { ...o }, photos, poster: "", status: "making", progress: 0, rating: "", projectId };
  await saveVideo(item);
  stage.id = id;
  stage.step = 0;
  stage.ratio = 0;
  void run(item);
  return id;
}

async function run(item: VideoItem) {
  const urls = item.photos.map((b) => URL.createObjectURL(b));
  try {
    const plan = await buildPlan(urls, item.details, item.options);
    stage.step = 1;
    await new Promise((r) => setTimeout(r, 700));
    stage.step = 2;
    item.poster = await posterOf(plan);
    item.lines = lineTimes(plan);
    await new Promise((r) => setTimeout(r, 500));
    stage.step = 3;
    item.video = await exportMp4(plan, (r) => { stage.ratio = r; item.progress = r; });
    item.seconds = Math.round(planSeconds(plan) * 10) / 10;
    item.status = "done";
    item.progress = 1;
  } catch (e) {
    item.status = "failed";
    item.error = e instanceof Error ? e.message : "영상을 만들지 못했어요.";
  } finally {
    urls.forEach((u) => URL.revokeObjectURL(u));
    await saveVideo({ ...item });
  }
}

export const videoById = (id: string) => state.videos.find((v) => v.id === id);
/** 파일 이름은 영문(원본처럼 「Land-Rover-Range-Rover.mp4」, 한글이면 bobae-carstudio-<번호>) */
export function fileName(v: VideoItem) {
  if (/[^\x00-\x7F]/.test(v.title)) return `bobae-carstudio-${v.id}.mp4`;
  const ascii = v.title.replace(/[^A-Za-z0-9 ]/g, "").trim().replace(/\s+/g, "-");
  return `${ascii.length >= 2 ? ascii : `bobae-carstudio-${v.id}`}.mp4`;
}
