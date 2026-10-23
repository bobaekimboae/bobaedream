const DAY_MS = 86_400_000;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

// 썸네일만 축약한다. 원본 날짜와 등록/확인 의미는 데이터·상세에서 유지한다.
export function thumbnailPostedText(posted: string, now = Date.now()): string {
  const match = /^(\d{4})[.\-/](\d{1,2})[.\-/](\d{1,2})(?:\s*(확인|등록))?$/.exec(posted.trim());
  if (!match) return posted.replace(/\s/g, "");
  const [, yyyy, mm, dd, kind] = match;
  const year = Number(yyyy), month = Number(mm), day = Number(dd);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return posted;
  const days = Math.max(0, Math.floor((now + KST_OFFSET_MS) / DAY_MS) - Math.floor(date.getTime() / DAY_MS));
  const relative = days === 0 ? "오늘" : `${days}일전`;
  return kind === "확인" ? `${relative} 확인` : relative;
}
