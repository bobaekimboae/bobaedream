// 보배드림 촬영 앱(/shoot/) 설치 안내(2026-10-25 「촬영앱 → 홈 화면 설치형 앱」).
// 홈 화면에서 연 경우(standalone)와 「다음에」를 누른 경우에는 보이지 않는다.
import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const KEY = "bbm-shoot-install-dismissed";
const isStandalone = () =>
  typeof window !== "undefined" && (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
const isIos = () => typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
const readDismissed = () => {
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
};

export default function ShootInstallBanner() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [hidden, setHidden] = useState(() => isStandalone() || readDismissed());
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as InstallEvent);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(KEY, "1");
    } catch {
      /* 저장이 막혀도 이번 화면에서는 닫는다 */
    }
    setHidden(true);
  };

  const install = async () => {
    if (prompt) {
      try {
        await prompt.prompt();
        const r = await prompt.userChoice;
        if (r.outcome === "accepted") setHidden(true);
      } catch {
        setIosHelp(true);
      }
      setPrompt(null);
      return;
    }
    setIosHelp(true);
  };

  return (
    <div className="shoot-install" role="region" aria-label="촬영 앱 설치">
      <img src="./shoot/icon-192.png?v=1" alt="" width={40} height={40} />
      <div className="shoot-install__text">
        <strong>홈 화면에 촬영 앱 추가</strong>
        <span>
          {iosHelp
            ? isIos()
              ? "Safari 아래 공유 버튼 → 「홈 화면에 추가」를 눌러 주세요"
              : "브라우저 메뉴 → 「앱 설치」 또는 「홈 화면에 추가」를 눌러 주세요"
            : "앱처럼 전체 화면으로 바로 촬영해요"}
        </span>
      </div>
      {!iosHelp ? (
        <button type="button" className="shoot-install__go" onClick={install}>
          {prompt ? "설치" : "방법 보기"}
        </button>
      ) : null}
      <button type="button" className="shoot-install__x" aria-label="다음에 하기" onClick={dismiss}>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
