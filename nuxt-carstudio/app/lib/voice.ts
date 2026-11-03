// AI 음성: 장면마다 한 줄을 기기의 음성 합성으로 읽는다(영상 재생 시각에 맞춰).
// 원본은 음성을 mp4 안에 넣는다. 브라우저는 합성 음성을 파일로 꺼낼 수 없어, 서버 음성(Laravel 큐) 연결 전까지는 이 앱 안에서 볼 때만 들린다.
import { LANGS } from "./options";
import type { Lang } from "./types";

export const canSpeak = () => typeof window !== "undefined" && "speechSynthesis" in window;
export function speak(text: string, lang: Lang) {
  if (!canSpeak() || !text) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = LANGS.find((l) => l.v === lang)?.speech ?? "ko-KR";
  u.rate = lang === "ko" ? 1.05 : 1;
  const v = speechSynthesis.getVoices().find((x) => x.lang.replace("_", "-").startsWith(u.lang.slice(0, 2)));
  if (v) u.voice = v;
  speechSynthesis.speak(u);
}
export const hush = () => { if (canSpeak()) speechSynthesis.cancel(); };
