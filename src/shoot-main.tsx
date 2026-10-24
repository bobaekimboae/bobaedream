// 보배드림 촬영 앱(2026-10-25 「촬영앱 → 홈 화면 설치형 앱」): /shoot/ 독립 진입점.
// 58 촬영 흐름 화면(ShootRegister)을 바로 띄우고, 홈 화면 설치(PWA)를 안내한다.
import React from "react";
import ReactDOM from "react-dom/client";
import ShootRegister from "./prototype/register/shoot/ShootRegister";
import ShootInstallBanner from "./prototype/register/shoot/install-banner";
import { setPretendard } from "./prototype/fonts/pretendard";

document.documentElement.dataset.site = "shoot";
setPretendard(true);

// 사이트 공용 서비스 워커(네트워크 우선, 화면을 저장해 두지 않음)를 등록해 설치 조건을 맞춘다.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(new URL("sw.js", document.baseURI), { scope: new URL(".", document.baseURI).pathname, updateViaCache: "none" }).catch(() => {});
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ShootRegister />
    <ShootInstallBanner />
  </React.StrictMode>,
);
