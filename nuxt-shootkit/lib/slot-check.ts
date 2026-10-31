// 칸 검사(2026-10-31 「진행해라」, Motorway Image Assist식): 찍은 사진이 그 칸 부위가 맞는지 폰 안에서 확인한다.
// 앨범 부위 나누기와 같은 인식기(lib/autosort.ts, CLIP)를 쓴다. 인식기를 한 번이라도 받은(동의한) 폰에서만 돈다 —
// 처음 받는 약 90MB를 사진 찍을 때 몰래 내려받지 않는다. 사진은 밖으로 보내지 않고 고치지 않는다(알림만).
// 좌우 방향(좌측면 · 우측면)은 인식기가 구분하지 못하므로 「외관 · 실내 · 엔진룸 · 트렁크」 큰 묶음이 다를 때만 알린다.
import { ITEMS, OTHER_ID, groupOf } from "./items";
import type { SortResult } from "./autosort";
import { classifyShot } from "./capture-ai";

/** 인식 부류 → 그 부류를 받는 첫 칸 id */
const CLASS_ITEM = new Map<string, string>();
for (const it of ITEMS) for (const c of it.auto ?? []) if (!CLASS_ITEM.has(c)) CLASS_ITEM.set(c, it.id);

/** 이만큼 더 비슷해야 「다른 부위」로 본다(앨범 나누기의 확인 기준 0.03보다 엄하게) */
export const SLOT_MARGIN = 0.04;

/** 순수 판단(시험용): 칸과 다른 묶음의 부위로 보이면 그럴 것 같은 칸 id, 아니면 null */
export function slotMismatch(r: SortResult, slot: string, margin = SLOT_MARGIN): string | null {
  if (slot === OTHER_ID) return null;
  const mine = ITEMS.find((i) => i.id === slot)?.auto ?? [];
  if (!mine.length) return null;
  const guess = CLASS_ITEM.get(r.cls);
  if (!guess || groupOf(guess).id === groupOf(slot).id) return null;
  const mineBest = Math.max(...mine.map((c) => r.scores[c] ?? -1));
  return r.score - mineBest >= margin ? guess : null;
}

/** 인식기가 준비된 폰에서만 잰다. 못 재면 null(알리지 않음) */
export async function checkSlot(src: string, slot: string, allowed: () => boolean): Promise<string | null> {
  if (typeof window === "undefined" || slot === OTHER_ID || !allowed()) return null;
  try {
    const result = await classifyShot(src);
    return allowed() ? slotMismatch(result, slot) : null;
  } catch {
    return null;
  }
}
