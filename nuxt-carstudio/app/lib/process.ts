// AI 처리: 사진마다 차를 찾아 오려 낸다(폰 · PC 안에서, 사진은 밖으로 나가지 않음).
// 차 찾기 모델은 촬영 키트 쇼룸 배경과 같은 것(U-2-Netp, 약 4.6MB, 한 번 받으면 이 브라우저에 보관).
import { cutCar } from "@kit/showroom";
import { DEFAULT_BG } from "./backgrounds";
import { DEFAULT_ADJUST, DEFAULT_POS, newId, type Photo } from "./store";

export function guessPlate(box: NonNullable<Photo["box"]>, W: number, H: number) {
  const cw = box.x1 - box.x0;
  const ch = box.y1 - box.y0;
  const w = Math.min(cw * 0.2, W * 0.22);
  const h = w * 0.26;
  const cx = (box.x0 + box.x1) / 2;
  const cy = box.y0 + ch * 0.64;
  return { x: (cx - w / 2) / W, y: (cy - h / 2) / H, w: w / W, h: h / H };
}

/** 사진 한 장 처리. 실패해도 사진은 남기고 이유를 적는다 */
export async function processPhoto(file: Blob, onModel?: (p: number) => void): Promise<Photo> {
  const u = URL.createObjectURL(file);
  try {
    const { cut, box, W, H } = await cutCar(u, onModel);
    const blob = await new Promise<Blob | null>((ok) => cut.toBlob(ok, "image/png"));
    return { id: newId("ph"), original: file, cut: blob, box, w: W, h: H, plate: guessPlate(box, W, H), bg: DEFAULT_BG, pos: { ...DEFAULT_POS }, adjust: { ...DEFAULT_ADJUST }, reflect: true, error: "" };
  } catch (e) {
    const img = await new Promise<HTMLImageElement | null>((ok) => {
      const i = new Image();
      i.onload = () => ok(i);
      i.onerror = () => ok(null);
      i.src = u;
    });
    return { id: newId("ph"), original: file, cut: null, box: null, w: img?.naturalWidth || 1600, h: img?.naturalHeight || 1200, plate: null, bg: DEFAULT_BG, pos: { ...DEFAULT_POS }, adjust: { ...DEFAULT_ADJUST }, reflect: true, error: e instanceof Error ? e.message : "차를 찾지 못했어요." };
  } finally {
    URL.revokeObjectURL(u);
  }
}
