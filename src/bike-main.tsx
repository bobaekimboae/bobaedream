import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/roboto/latin-500.css";
import App from "./App";
import "./styles.css";
import "./prototype.css";

const url = new URL(window.location.href);
url.searchParams.set("qf", "guazi");
url.searchParams.set("pc", "1");

const bikeParts = url.searchParams.get("category") === "부품 · 용품" && url.searchParams.get("bikeMenu") === "parts";
if (!bikeParts) {
  url.searchParams.set("category", "바이크");
  url.searchParams.delete("bikeMenu");
}

window.history.replaceState({}, "", url);
document.documentElement.dataset.site = "bike";
// 로고 밸런스 미리보기(2026-10-18): &bikelogo=mark → 원에 걸친 오토바이 마크 + 「보배드림」 검정
if (url.searchParams.get("bikelogo") === "mark") document.documentElement.dataset.bikelogo = "mark";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
