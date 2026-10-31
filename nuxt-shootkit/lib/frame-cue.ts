// 촬영 틀 안 차량 상자에 대한 보수적인 안내. 실제 거리나 잘림을 확정하지 않는다.
import type { GuideKind } from "./items";
export type CueKind = "back" | "closer" | "left" | "right" | "ok";
export type Box = { xmin: number; ymin: number; xmax: number; ymax: number };
export type Det = { label: string; score: number; box: Box };
export const CUE_TEXT: Record<CueKind, string> = {
  back: "차가 틀에 가까워요 · 한 걸음 뒤로",
  closer: "차가 작아요 · 조금 앞으로",
  left: "차가 왼쪽에 있어요 · 휴대폰을 왼쪽으로",
  right: "차가 오른쪽에 있어요 · 휴대폰을 오른쪽으로",
  ok: "위치 좋아요",
};
export const CUE_KINDS = new Set<GuideKind>(["side", "front", "rear", "q34"]);
const VEHICLE = new Set(["car", "truck", "bus"]);
export const CUE_LIMIT = {
  score: 0.4, edge: 0.025, off: 0.11,
  small: { side: 0.55, q34: 0.55, front: 0.4, rear: 0.4 } as Record<string, number>,
};
export function cueOf(dets: Det[], w: number, h: number, kind: GuideKind): CueKind | null {
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0 || !CUE_KINDS.has(kind)) return null;
  const cars = dets.filter(({ label, score, box: b }) => VEHICLE.has(label) && Number.isFinite(score) && score >= CUE_LIMIT.score
    && Object.values(b).every(Number.isFinite) && b.xmax > b.xmin && b.ymax > b.ymin);
  if (!cars.length) return null;
  const area = (b: Box) => (b.xmax - b.xmin) * (b.ymax - b.ymin);
  cars.sort((a, b) => area(b.box) - area(a.box));
  // 같은 차에 겹친 상자는 중복 탐지다. 별개 차가 비슷하게 클 때만 안내를 보류한다.
  const target = cars[0].box;
  const iou = (a: Box, b: Box) => {
    const inter = Math.max(0, Math.min(a.xmax, b.xmax) - Math.max(a.xmin, b.xmin)) * Math.max(0, Math.min(a.ymax, b.ymax) - Math.max(a.ymin, b.ymin));
    return inter / (area(a) + area(b) - inter);
  };
  if (cars.slice(1).some(d => iou(target, d.box) < 0.35 && area(d.box) > area(target) * 0.65)) return null;
  const b = cars[0].box;
  const l = b.xmin / w, r = b.xmax / w, t = b.ymin / h, bottom = b.ymax / h;
  const bw = r - l, bh = bottom - t;
  if (l < CUE_LIMIT.edge || r > 1 - CUE_LIMIT.edge || t < CUE_LIMIT.edge || bottom > 1 - CUE_LIMIT.edge || bw > 0.9 || bh > 0.9) return "back";
  const cx = (l + r) / 2;
  if (cx < 0.5 - CUE_LIMIT.off) return "left";
  if (cx > 0.5 + CUE_LIMIT.off) return "right";
  // 정면 차는 폭보다 높이가 커질 수 있다. 어느 방향이든 충분히 차면 앞으로 안내하지 않는다.
  if (bw < (CUE_LIMIT.small[kind] ?? 0.5) && bh < 0.55) return "closer";
  return "ok";
}
/** 경계 흔들림 방지: 같은 결과 2회, 결과 없음은 즉시 오래된 안내 제거. */
export function cueStabilizer() {
  let prev: CueKind | null = null, count = 0;
  return (next: CueKind | null): CueKind | null => {
    count = next === prev ? count + 1 : 1;
    prev = next;
    return next && count >= 2 ? next : null;
  };
}
