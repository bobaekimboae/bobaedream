// 카메라 AI 전용 worker. 모델 준비/추론을 UI 스레드에서 분리한다.
import ortMjs from "../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.mjs?url";
import ortWasm from "../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.jsep.wasm?url";
import { loadSorter } from "./autosort";
import { CUE_LIMIT, type Det } from "./frame-cue";
const scope = globalThis as unknown as { onmessage: ((e: MessageEvent) => void) | null; postMessage: (v: unknown) => void };
async function runtime() {
  const tf = await import("@huggingface/transformers");
  tf.env.allowLocalModels = false;
  tf.env.useBrowserCache = true;
  if (tf.env.backends.onnx.wasm) {
    tf.env.backends.onnx.wasm.numThreads = 1;
    tf.env.backends.onnx.wasm.wasmPaths = { mjs: ortMjs, wasm: ortWasm };
  }
  return tf;
}
let detector: any = null;
async function getDetector() {
  if (detector) return detector;
  const tf = await runtime();
  detector = await tf.pipeline("object-detection", "Xenova/yolos-tiny", {
    revision: "e2f9c7673f0fa61849efe2b56a0d7774779ebb9d", dtype: "q8", device: "wasm",
  });
  // 입력 사진만 줄이면 processor가 다시 키운다. processor도 제한해 추론 픽셀 수를 줄인다.
  (detector.processor.image_processor ?? detector.processor.feature_extractor).size = { shortest_edge: 320, longest_edge: 448 };
  return detector;
}
scope.onmessage = async ({ data: m }) => {
  const start = performance.now();
  try {
    let result: unknown;
    if (m.op === "detect") {
      const det = await getDetector();
      const { RawImage } = await import("@huggingface/transformers");
      result = await det(new RawImage(new Uint8ClampedArray(m.pixels), m.w, m.h, 4), { threshold: CUE_LIMIT.score }) as Det[];
    } else if (m.op === "classify") {
      // 칸 검사는 촬영 후에만 준비한다. 위치 안내를 켤 때 CLIP을 함께 받지 않는다.
      await runtime();
      const sorter = await loadSorter(undefined, m.base);
      result = await sorter.classify(m.src);
    } else throw new Error("unsupported operation");
    scope.postMessage({ id: m.id, result, ms: performance.now() - start });
  } catch (e) {
    scope.postMessage({ id: m.id, error: e instanceof Error ? e.message : "AI unavailable" });
  }
};
