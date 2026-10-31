// 후면 카메라 스트림(리액트 useCamera와 같은 동작). active가 false가 되면 바로 끈다.
import { onBeforeUnmount, ref, shallowRef, watch, type Ref } from "vue";
import { FAKE_ONLY } from "../lib/core";

export type CameraError = "" | "denied" | "unavailable";
export type CameraState = {
  stream: Ref<MediaStream | null>;
  /** "denied" 권한 거절, "unavailable" 카메라 없음(PC 등) */
  error: Ref<CameraError>;
  torchSupported: Ref<boolean>;
  /** 권한을 다시 물어본다 */
  retry: () => void;
  /** 다시 묻는 중(눌렀는데 아무 일 없는 것처럼 보이지 않게) */
  checking: Ref<boolean>;
  /** 「카메라 권한 허용」을 눌렀는데도 막힌 횟수 — 1 이상이면 브라우저 설정에서 직접 풀어야 한다 */
  blockedTries: Ref<number>;
  setTorch: (on: boolean) => void;
};

export function useCamera(active: () => boolean, withAudio: () => boolean, size?: { width: { ideal: number }; height: { ideal: number } }): CameraState {
  const stream = shallowRef<MediaStream | null>(null);
  const error = ref<CameraError>("");
  const torchSupported = ref(false);
  const nonce = ref(0);
  const checking = ref(false);
  const blockedTries = ref(0);
  let manual = false;
  let perm: PermissionStatus | null = null;
  let current: MediaStream | null = null;
  let stop: (() => void) | null = null;

  const start = () => {
    stop?.();
    stop = null;
    if (!active() || FAKE_ONLY) return;
    let cancelled = false;
    const md = navigator.mediaDevices;
    if (!md?.getUserMedia) {
      error.value = "unavailable";
      return;
    }
    const audio = withAudio();
    const video: MediaTrackConstraints = { facingMode: { ideal: "environment" }, ...(size ?? { width: { ideal: 1920 }, height: { ideal: 1080 } }) };
    md.getUserMedia({ video, audio })
      .catch((e: unknown) => (audio ? md.getUserMedia({ video, audio: false }) : Promise.reject(e)))
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        current = s;
        stream.value = s;
        error.value = "";
        checking.value = false;
        blockedTries.value = 0;
        const track = s.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as { torch?: boolean };
        torchSupported.value = Boolean(caps.torch);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const name = (e as { name?: string })?.name;
        // 브라우저마다 이름이 다르다(옛 크롬 PermissionDeniedError, 일부 SecurityError). 권한 상태가 「거부」면 이름과 상관없이 막힘으로 본다
        error.value = name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError" || perm?.state === "denied" ? "denied" : "unavailable";
        // 한 번 「차단」하면 브라우저는 다시 묻지 않고 바로 거절한다 → 사람이 누른 다시 묻기였으면 횟수를 센다
        if (manual && error.value === "denied") blockedTries.value += 1;
        manual = false;
        // 바로 거절돼도 「확인 중」이 잠깐은 보이게(눌렀는데 아무 일 없는 것처럼 보이지 않게)
        window.setTimeout(() => (checking.value = false), 500);
      });
    stop = () => {
      cancelled = true;
      current?.getTracks().forEach((t) => t.stop());
      current = null;
      stream.value = null;
    };
  };

  watch([active, withAudio, nonce], start, { immediate: true });

  // 설정에서 권한을 바꾸고 돌아오면 저절로 다시 연다(권한 상태 바뀜 · 화면으로 돌아옴)
  const again = () => {
    if (active() && error.value && !stream.value) nonce.value += 1;
  };
  const onVisible = () => document.visibilityState === "visible" && again();
  if (typeof navigator !== "undefined" && navigator.permissions?.query) {
    void navigator.permissions
      .query({ name: "camera" as PermissionName })
      .then((st) => {
        perm = st;
        st.onchange = () => st.state !== "denied" && again();
      })
      .catch(() => undefined);
  }
  if (typeof document !== "undefined") document.addEventListener("visibilitychange", onVisible);
  onBeforeUnmount(() => {
    stop?.();
    stop = null;
    if (perm) perm.onchange = null;
    document.removeEventListener("visibilitychange", onVisible);
  });

  const setTorch = (on: boolean) => {
    const track = current?.getVideoTracks()[0];
    if (!track) return;
    void track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }).catch(() => undefined);
  };

  const retry = () => {
    manual = true;
    checking.value = true;
    nonce.value += 1;
  };
  return { stream, error, torchSupported, setTorch, retry, checking, blockedTries };
}
