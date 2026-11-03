// 만든 영상 · 사진 보관: 이 기기 IndexedDB `bbm-carstudio`(서버 저장은 Laravel 연결 단계에서). 크레딧 · 프로필은 localStorage.
import { reactive, toRaw } from "vue";
import type { VideoItem } from "./types";

const DB = "bbm-carstudio";
let dbp: Promise<IDBDatabase> | null = null;
function db() {
  dbp ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore("videos", { keyPath: "id" });
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return dbp;
}
async function req<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  return new Promise((resolve, reject) => {
    const r = fn(d.transaction("videos", mode).objectStore("videos"));
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}
const plain = (v: VideoItem): VideoItem => {
  const r = toRaw(v);
  return { ...r, details: { ...toRaw(r.details) }, options: { ...toRaw(r.options) }, photos: [...toRaw(r.photos)], lines: r.lines ? r.lines.map((x) => ({ ...x })) : undefined };
};

export const state = reactive({ videos: [] as VideoItem[], loaded: false, credits: 2, profile: { name: "", dealer: "", phone: "", address: "" } });

export async function loadAll() {
  try {
    const all = await req<VideoItem[]>("readonly", (s) => s.getAll() as IDBRequest<VideoItem[]>);
    // 앱을 닫는 사이 멈춘 작업은 실패로 둔다
    state.videos = all.map((v) => (v.status === "making" ? { ...v, status: "failed" as const, error: "앱을 닫아 영상 만들기가 멈췄어요. 다시 만들어 주세요." } : v)).sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    state.videos = [];
  }
  try {
    const c = localStorage.getItem("bbm-cs-credits");
    if (c !== null) state.credits = Number(c) || 0;
    const p = localStorage.getItem("bbm-cs-profile");
    if (p) Object.assign(state.profile, JSON.parse(p));
  } catch { /* 저장 안 됨 */ }
  state.loaded = true;
}
export async function saveVideo(v: VideoItem) {
  const i = state.videos.findIndex((x) => x.id === v.id);
  if (i >= 0) state.videos[i] = v;
  else state.videos.unshift(v);
  try { await req("readwrite", (s) => s.put(plain(v))); } catch { /* 저장 공간 부족: 화면에는 남김 */ }
}
export async function removeVideo(id: string) {
  state.videos = state.videos.filter((v) => v.id !== id);
  try { await req("readwrite", (s) => s.delete(id)); } catch { /* 무시 */ }
}
export function saveProfile() {
  try { localStorage.setItem("bbm-cs-profile", JSON.stringify(state.profile)); } catch { /* 무시 */ }
}
export function setCredits(n: number) {
  state.credits = n;
  try { localStorage.setItem("bbm-cs-credits", String(n)); } catch { /* 무시 */ }
}
export const uid = () => Math.random().toString(36).slice(2, 10).toUpperCase();
