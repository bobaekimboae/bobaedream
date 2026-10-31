// 찍기 전 위치 안내(2026-10-31 「진행해라」, CarTake식): 카메라 화면에서 차 위치를 찾아
// 「한 걸음 뒤로 · 조금 앞으로 · 휴대폰을 왼쪽/오른쪽으로」를 알려 준다. 외관 칸(정면 · 후면 · 측면 · 45°)에서만.
// 차 위치는 작은 사물 인식 모델(Xenova/yolos-tiny, Apache-2.0, 8비트 약 9.7MB)로 폰 안에서 찾는다. 화면은 밖으로 보내지 않는다.
// 부위 인식(autosort)과 같이 「사진 AI 도움」에 동의한 폰에서만 받는다(처음 한 번).
import type { GuideKind } from "./items";

export type CueKind = "back" | "closer" | "left" | "right" | "ok";
export type Box = { xmin: number; ymin: number; xmax: number; ymax: number };
export type Det = { label: string; score: number; box: Box };

export const CUE_TEXT: Record<CueKind, string> = {
  back: "차가 잘려요 · 한 걸음 뒤로",
  closer: "차가 작아요 · 조금 앞으로",
  left: "차가 왼쪽에 있어요 · 휴대폰을 왼쪽으로",
  right: "차가 오른쪽에 있어요 · 휴대폰을 오른쪽으로",
  ok: "위치 좋아요",
};
/** 위치 안내를 쓸 칸 모양(외관만). 실내 · 엔진룸 · 트렁크는 차 전체가 보이지 않는다 */
export const CUE_KINDS = new Set<GuideKind>(["side", "front", "rear", "q34"]);
const VEHICLE = new Set(["car", "truck", "bus"]);

/** 판정 기준(2026-10-31 실매물 사진 100장 변형으로 맞춤: 원본 12/17 위치 좋아요, 가까이 15/17 뒤로, 옆으로 옮김 20/20, 멀리 10/17. 실제 폰 화면으로 다시 볼 것) */
export const CUE_LIMIT = {
  score: 0.5, // 이보다 자신 없는 차는 안 본다
  edge: 0.02, // 차 상자가 화면 양옆에서 이만큼(폭 비율) 안쪽에 닿으면 잘린 것
  small: { side: 0.55, q34: 0.55, front: 0.4, rear: 0.4 } as Record<string, number>, // 차 폭이 화면 폭의 이보다 작으면 멀다
  off: 0.11, // 차 가운데가 화면 가운데에서 이만큼 벗어나면 치우침
};

/** 순수 판단(시험용): 가장 큰 차 상자로 안내 하나를 고른다. 차가 없으면 null(아무 말 안 함) */
export function cueOf(dets: Det[], w: number, h: number, kind: GuideKind): CueKind | null {
  const cars = dets.filter((d) => VEHICLE.has(d.label) && d.score >= CUE_LIMIT.score);
  if (!cars.length || !w || !h) return null;
  const area = (b: Box) => (b.xmax - b.xmin) * (b.ymax - b.ymin);
  const b = cars.map((d) => d.box).sort((a, c) => area(c) - area(a))[0];
  const l = b.xmin / w;
  const r = b.xmax / w;
  if (l < CUE_LIMIT.edge || r > 1 - CUE_LIMIT.edge) return "back";
  // 치우침을 먼저 알린다(가운데로 옮긴 뒤 다가가야 다시 잘리지 않는다)
  const cx = (l + r) / 2;
  if (cx < 0.5 - CUE_LIMIT.off) return "left";
  if (cx > 0.5 + CUE_LIMIT.off) return "right";
  if (r - l < (CUE_LIMIT.small[kind] ?? 0.5)) return "closer";
  return "ok";
}

const MODEL = "Xenova/yolos-tiny";
const MODEL_REV = "e2f9c7673f0fa61849efe2b56a0d7774779ebb9d";
type Detector = (src: string) => Promise<Det[]>;
let loading: Promise<Detector> | null = null;

/** 사물 인식기 불러오기(처음 한 번 받고 브라우저에 저장) */
export function loadDetector(): Promise<Detector> {
  if (loading) return loading;
  loading = (async () => {
    const tf = await import("@huggingface/transformers");
    tf.env.allowLocalModels = false;
    tf.env.useBrowserCache = true;
    const onnxEnv = tf.env.backends.onnx as { wasm?: { numThreads?: number; wasmPaths?: string } };
    if (onnxEnv.wasm && !window.crossOriginIsolated) onnxEnv.wasm.numThreads = 1;
    const testHost = (window as Window & { __BBM_MODEL_HOST?: string }).__BBM_MODEL_HOST;
    if (testHost) {
      tf.env.remoteHost = testHost;
      if (onnxEnv.wasm) onnxEnv.wasm.wasmPaths = `${testHost}ort/`;
    }
    const det = await tf.pipeline("object-detection", MODEL, { revision: MODEL_REV, dtype: "q8" });
    return async (src: string) => (await det(src, { threshold: CUE_LIMIT.score })) as unknown as Det[];
  })();
  loading.catch(() => (loading = null));
  return loading;
}
