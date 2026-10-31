// 하나의 worker · 하나의 추론. 위치 프레임은 밀리면 버리고 사진 검사는 최신 1건만 대기한다.
import type { Det } from "./frame-cue";
import type { SortResult } from "./autosort";
import { SITE_BASE } from "./site";
export const CAPTURE_AI_CONSENT = "bbm-shoot-capture-ai-v1";
export const captureAiConsented = () => { try { return localStorage.getItem(CAPTURE_AI_CONSENT) === "1"; } catch { return false; } };
export const setCaptureAiConsent = (on: boolean) => { try { on ? localStorage.setItem(CAPTURE_AI_CONSENT, "1") : localStorage.removeItem(CAPTURE_AI_CONSENT); } catch { /* 이번 화면에서는 계속 사용 */ } };
type Job = { id: number; message: Record<string, unknown>; transfer: Transferable[]; resolve: (r: any) => void; reject: (e: Error) => void };
let worker: Worker | null = null, active: Job | null = null, queued: Job | null = null;
let workerOp: unknown = null;
let seq = 0, watchdog: ReturnType<typeof setTimeout> | undefined, idle: ReturnType<typeof setTimeout> | undefined;
export const aiMetrics = { calls: 0, lastMs: 0, workerStarts: 0, timeouts: 0 };
export const aiBusy = () => Boolean(active || queued);
export function stopCaptureAi() {
  clearTimeout(watchdog); clearTimeout(idle);
  worker?.terminate(); worker = null; workerOp = null;
  active?.reject(new Error("AI stopped")); queued?.reject(new Error("AI stopped"));
  active = queued = null;
}
function run(job: Job) {
  clearTimeout(idle);
  // 모델 종류가 바뀌면 이전 worker를 폐기해 YOLOS와 CLIP을 함께 상주시킬 수 없게 한다.
  if (worker && workerOp !== job.message.op) { worker.terminate(); worker = null; }
  workerOp = job.message.op;
  if (!worker) {
    worker = new Worker(new URL("./capture-ai.worker.ts", import.meta.url), { type: "module" });
    aiMetrics.workerStarts++;
    worker.onmessage = ({ data: m }) => {
      if (!active || m.id !== active.id) return;
      clearTimeout(watchdog);
      const done = active; active = null;
      aiMetrics.calls++; aiMetrics.lastMs = m.ms ?? 0;
      m.error ? done.reject(new Error(m.error)) : done.resolve(m.result);
      const next = queued; queued = null;
      if (next) run(next);
      else idle = setTimeout(stopCaptureAi, 30000);
    };
    worker.onerror = () => stopCaptureAi();
  }
  active = job;
  // 네트워크가 멎거나 모델이 너무 느리면 worker까지 정리한다. 촬영은 계속 된다.
  watchdog = setTimeout(() => { aiMetrics.timeouts++; stopCaptureAi(); }, 45000);
  worker.postMessage({ ...job.message, id: job.id }, job.transfer);
}
function request(message: Record<string, unknown>, transfer: Transferable[] = [], priority = false): Promise<any> {
  return new Promise((resolve, reject) => {
    const job = { id: ++seq, message, transfer, resolve, reject };
    if (!active) run(job);
    else if (priority) { queued?.reject(new Error("superseded")); queued = job; }
    else resolve(null); // 오래된 카메라 프레임을 대기열에 쌓지 않는다
  });
}
export const detectFrame = (pixels: Uint8ClampedArray, w: number, h: number): Promise<Det[] | null> => request({ op: "detect", pixels: pixels.buffer, w, h }, [pixels.buffer as ArrayBuffer]);
export const classifyShot = (src: string): Promise<SortResult> => request({ op: "classify", src, base: new URL(SITE_BASE, document.baseURI).href }, [], true);
