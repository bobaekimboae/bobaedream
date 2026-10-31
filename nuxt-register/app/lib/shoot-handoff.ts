// 촬영 키트 → 매물 등록 넘겨받기(2026-11-01).
// 같은 사이트(bobaekimboae.github.io) 안이라 두 앱이 같은 IndexedDB를 본다.
// 촬영 키트(?from=register)에서 「등록 화면으로 보내기」를 누르면 bbm-shootkit/drafts 에 id "handoff" 한 건을 쓰고 돌아온다.
// 여기서는 그 한 건을 읽어 사진 · 영상 칸에 넣고 지운다(같은 사진이 두 번 들어오지 않게).
import { sitePath } from "@kit/site";
import type { Media } from "./form";

export const HANDOFF_ID = "handoff";
type ShootPhoto = { id: string; src: string; slot: string };
type ShootVideo = { segs: (Blob | null)[]; durations: number[]; cover: string; stages?: string[] };
type ShootRec = { id: string; savedAt: number; photos: ShootPhoto[]; video: ShootVideo | null; region: { sido: string; gu: string } | null };

const open = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open("bbm-shootkit", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("drafts", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

export async function takeHandoff(): Promise<{ media: Media[]; region: ShootRec["region"] } | null> {
  let d: IDBDatabase;
  try {
    d = await open();
  } catch {
    return null;
  }
  const rec = await new Promise<ShootRec | null>((resolve) => {
    const req = d.transaction("drafts").objectStore("drafts").get(HANDOFF_ID);
    req.onsuccess = () => resolve((req.result as ShootRec) ?? null);
    req.onerror = () => resolve(null);
  });
  if (!rec) return null;
  d.transaction("drafts", "readwrite").objectStore("drafts").delete(HANDOFF_ID);
  const media: Media[] = rec.photos.map((p) => ({ id: `s-${p.id}`, kind: "photo", src: p.src, from: "shoot", slot: p.slot }));
  if (rec.video) {
    rec.video.segs.forEach((b, i) => {
      if (!b) return;
      media.push({ id: `sv-${rec.savedAt}-${i}`, kind: "video", src: URL.createObjectURL(b), poster: rec.video!.cover, from: "shoot", seconds: Math.round(rec.video!.durations[i] ?? 0), slot: rec.video!.stages?.[i] });
    });
  }
  return { media, region: rec.region };
}

/** 촬영 키트로 보낸다. 돌아올 주소는 지금 등록 화면(+ ?shoot=1). */
export function shootKitUrl(category: string, role: "dealer" | "crew") {
  const back = new URL(location.href);
  back.searchParams.set("shoot", "1");
  const u = new URL(sitePath("nuxt-shootkit", ""), location.origin);
  u.searchParams.set("from", "register");
  u.searchParams.set("cat", category);
  u.searchParams.set("role", role);
  u.searchParams.set("back", back.pathname + back.search);
  return u.href;
}
