import listThumbs from "../data/list-thumbs-v01.json";

/** 실사 매물 사진의 목록 썸네일 정규화 사본(2026-10-08, 럭셔리카와 같은 규칙: 차 폭 90% · 바닥선 위에서 85%, 600×600).
 *  원본 경로(`a/b/../c.jpg`도 정리) → `…/thumb/이름.webp`. 표에 없는 사진(근접 촬영·광고 이미지 등)은 원본 그대로 쓴다. */
const thumbs = listThumbs as Record<string, string>;

function normalizePath(path: string) {
  const out: string[] = [];
  for (const part of path.split("/")) {
    if (part === "..") out.pop();
    else if (part && part !== ".") out.push(part);
  }
  return out.join("/");
}

export function normalizedListThumb(image: string | undefined) {
  return image ? thumbs[normalizePath(image)] : undefined;
}
