// 촬영 키트 연동: 촬영 키트(nuxt-shootkit)가 이 기기 브라우저에 보관한 「저장한 글 · 자동 보관」(IndexedDB bbm-shootkit)을
// 같은 사이트 주소라 그대로 읽어 사진을 편집기로 가져온다. 서버를 거치지 않는다.
import { AUTO_ID, draftWhen, getDraft, listDrafts, type DraftMeta } from "@kit/drafts";

export type KitDraft = DraftMeta & { label: string };
export async function kitDrafts(): Promise<KitDraft[]> {
  try {
    const list = await listDrafts();
    return list.filter((d) => d.photoCount > 0).map((d) => ({ ...d, label: d.id === AUTO_ID ? "찍던 사진(자동 보관)" : `저장한 글 · ${draftWhen(d.savedAt)}` }));
  } catch {
    return [];
  }
}
/** 그 글의 사진을 파일로(원본 사진 우선, 쇼룸 사진은 빼고) */
export async function kitPhotos(id: string): Promise<File[]> {
  const r = await getDraft(id);
  if (!r) return [];
  const out: File[] = [];
  let i = 0;
  for (const p of r.photos) {
    const src = p.raw || p.src;
    if (!src) continue;
    try {
      const b = await (await fetch(src)).blob();
      i += 1;
      out.push(new File([b], `shootkit_${String(i).padStart(2, "0")}.jpg`, { type: b.type || "image/jpeg" }));
    } catch {
      // 못 읽은 사진은 건너뛴다
    }
  }
  return out;
}
