let installPrompt;
const button = document.getElementById("install");
const hint = document.getElementById("hint");
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register(new URL("../sw.js", location.href), {
    scope: new URL("../", location.href).pathname, updateViaCache: "none",
  }).catch(() => {});
}
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault(); installPrompt = event; button.hidden = false;
});
button.addEventListener("click", async () => {
  if (!installPrompt) return;
  try {
    await installPrompt.prompt();
    const result = await installPrompt.userChoice;
    hint.textContent = result.outcome === "accepted" ? "설치 후 홈 화면에서 보배드림을 열어 주세요." : "원하실 때 다시 설치할 수 있습니다.";
  } catch {
    hint.textContent = "브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택해 주세요.";
  } finally {
    installPrompt = undefined; button.hidden = true;
  }
});
window.addEventListener("appinstalled", () => { button.hidden = true; hint.textContent = "보배드림이 설치되었습니다."; });
if (matchMedia("(display-mode: standalone)").matches || navigator.standalone) {
  hint.textContent = "홈 화면에서 보배드림 앱을 열었습니다.";
} else if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  hint.textContent = "Safari 공유 메뉴 → 홈 화면에 추가";
} else {
  hint.textContent = "홈 화면에 현재 시안 로고와 ‘보배드림’ 이름으로 설치됩니다.";
}
