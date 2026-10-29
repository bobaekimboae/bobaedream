// 리액트 src/prototype/register/shoot/camera.ts 의 useCamera 훅만 옮김(./react-compat 훅으로). 나머지 함수는 공유 파일을 그대로 쓴다.
import { useEffect, useRef, useState } from "./react-compat";
import type { CameraState } from "@proto/register/shoot/camera";

/** 후면 카메라 스트림. active가 false가 되면 바로 끈다. */
export function useCamera(active: boolean, withAudio: boolean): CameraState {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<CameraState["error"]>("");
  const [torchSupported, setTorchSupported] = useState(false);
  const ref = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) return undefined;
    let cancelled = false;
    const md = navigator.mediaDevices;
    if (!md?.getUserMedia) {
      setError("unavailable");
      return undefined;
    }
    const video: MediaTrackConstraints = { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } };
    md.getUserMedia({ video, audio: withAudio })
      .catch(() => (withAudio ? md.getUserMedia({ video, audio: false }) : Promise.reject(new Error("no camera"))))
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        ref.current = s;
        setStream(s);
        setError("");
        const track = s.getVideoTracks()[0];
        const caps = (track?.getCapabilities?.() ?? {}) as { torch?: boolean };
        setTorchSupported(Boolean(caps.torch));
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        const name = (e as { name?: string })?.name;
        setError(name === "NotAllowedError" ? "denied" : "unavailable");
      });
    return () => {
      cancelled = true;
      ref.current?.getTracks().forEach((t) => t.stop());
      ref.current = null;
      setStream(null);
    };
  }, [active, withAudio]);

  const setTorch = (on: boolean) => {
    const track = ref.current?.getVideoTracks()[0];
    if (!track) return;
    void track.applyConstraints({ advanced: [{ torch: on } as MediaTrackConstraintSet] }).catch(() => undefined);
  };

  return { stream, error, torchSupported, setTorch };
}
