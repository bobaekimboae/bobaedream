import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/roboto/latin-500.css";
import App from "./App";
import BikeMainHome from "./main-home/bike/BikeMainHome";
import BikeMainAutotrader from "./main-home/bike/BikeMainAutotrader";
import "./styles.css";
import "./prototype.css";

const url = new URL(window.location.href);
// 바이크 메인 시안(2026-10-19): /bike/?home=as24 → AutoScout24식 메인. 목록 주소 값은 붙이지 않는다.
const bikeHome = url.searchParams.get("home");
// 2026-10-19 「영국 오토트레이더 바이크 메인으로」: /bike/?home=at → Autotrader Bikes식 메인(v02), as24는 비교용
const showBikeHome = bikeHome === "as24" || bikeHome === "at";
if (!showBikeHome) url.searchParams.set("qf", "guazi");
if (!showBikeHome) url.searchParams.set("pc", "1");

const bikeParts = url.searchParams.get("category") === "부품 · 용품" && url.searchParams.get("bikeMenu") === "parts";
if (!bikeParts && !showBikeHome) {
  url.searchParams.set("category", "바이크");
  url.searchParams.delete("bikeMenu");
}

window.history.replaceState({}, "", url);
document.documentElement.dataset.site = "bike";
// 로고 밸런스 미리보기(2026-10-18): &bikelogo=mark → 원에 걸친 오토바이 마크 + 「보배드림」 검정
if (url.searchParams.get("bikelogo") === "mark") document.documentElement.dataset.bikelogo = "mark";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {bikeHome === "at" ? <BikeMainAutotrader /> : showBikeHome ? <BikeMainHome /> : <App />}
  </React.StrictMode>,
);
